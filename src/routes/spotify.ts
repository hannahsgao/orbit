import { Router } from 'express';
import { randomBytes } from 'crypto';
import { spotifyGet, spotifyPaginate, SPOTIFY_API_BASE, exchangeCodeForTokens } from '../services/spotify';
import { extractMusicThemes } from '../services/spotify_themes';
import { tokenStore } from '../services/tokens';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import {
  UserProfileSchema,
  ArtistSchema,
  TrackSchema,
  PlaylistSchema,
  RecentlyPlayedItemSchema,
  type UserProfile,
  type Artist,
  type Track,
  type Playlist,
  type RecentlyPlayedItem,
} from '../schemas/spotify';

const router = Router();

const SCOPES = [
  'user-read-email',
  'user-top-read',
  'playlist-read-private',
  'user-read-recently-played',
].join(' ');

// Spotify OAuth - Initiate connection
router.get('/spotify/connect', (_req, res) => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new AppError(500, 'Missing Spotify configuration');
  }

  const state = randomBytes(16).toString('hex');
  res.cookie('spotify_auth_state', state, {
    httpOnly: true,
    maxAge: 5 * 60 * 1000, // 5 minutes
    sameSite: 'lax',
    path: '/',
  });

  logger.info({ state }, 'Setting auth state cookie');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: SCOPES,
    redirect_uri: redirectUri,
    state,
  });

  return res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
});

// Spotify OAuth - Callback
router.get('/spotify/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const storedState = req.cookies.spotify_auth_state;

  logger.info({ 
    receivedState: state, 
    storedState, 
    allCookies: Object.keys(req.cookies),
    hasCode: !!code 
  }, 'OAuth callback received');

  if (error) {
    logger.error({ error }, 'Spotify authorization error');
    return res.status(400).json({ error: 'Authorization failed' });
  }

  if (!state || state !== storedState) {
    logger.error({ state, storedState }, 'State mismatch');
    return res.status(400).json({ 
      error: 'State mismatch',
      details: `Received: ${state}, Expected: ${storedState}`,
      hint: 'Make sure you access the server via 127.0.0.1, not localhost'
    });
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const expiresAt = Date.now() + tokens.expires_in * 1000;

    const sessionId = randomBytes(16).toString('hex');
    tokenStore.set(sessionId, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
    });

    res.cookie('session_id', sessionId, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax',
      path: '/',
    });

    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      maxAge: 55 * 60 * 1000, // 55 minutes
      sameSite: 'lax',
      path: '/',
    });

    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax',
      path: '/',
    });

    res.clearCookie('spotify_auth_state');

    const origin = process.env.ORIGIN || 'http://127.0.0.1:3000';
    
    // If no frontend is running, show success page from backend
    if (!process.env.ORIGIN || process.env.ORIGIN === 'http://127.0.0.1:3000') {
      return res.send(`
        <html>
          <head><title>Authentication Successful</title></head>
          <body style="font-family: sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
            <h1>✓ Authentication Successful</h1>
            <p>You have successfully connected your Spotify account.</p>
            <h3>Available Endpoints:</h3>
            <ul>
              <li><a href="/spotify/profile">GET /spotify/profile</a> - Your Spotify profile</li>
              <li><a href="/spotify/top-artists">GET /spotify/top-artists</a> - Top 25 artists</li>
              <li><a href="/spotify/top-tracks">GET /spotify/top-tracks</a> - Top 25 tracks</li>
              <li><a href="/spotify/playlists">GET /spotify/playlists</a> - All playlists</li>
              <li><a href="/spotify/recent">GET /spotify/recent</a> - Recently played (last 50)</li>
              <li><a href="/spotify/themes">GET /spotify/themes</a> - <strong>AI-generated music themes</strong></li>
            </ul>
            <p><small>Session ID: ${sessionId}</small></p>
            <p><small>Access via: <code>http://127.0.0.1:5173</code></small></p>
          </body>
        </html>
      `);
    }
    
    return res.redirect(`${origin}/success`);
  } catch (error) {
    logger.error({ error }, 'Token exchange failed');
    return res.status(500).json({ error: 'Failed to exchange authorization code' });
  }
});

function getAccessToken(req: any): string {
  if (process.env.MOCK_MODE === 'true') {
    return 'MOCK_TOKEN';
  }

  const token = req.cookies.access_token;
  if (!token) {
    throw new AppError(401, 'No access token provided');
  }
  return token;
}

function getMockProfile(): UserProfile {
  return {
    id: 'mock_user_123',
    name: 'Mock User',
    email: 'mock@example.com',
    image: 'https://i.scdn.co/image/mock',
  };
}

function getMockArtists(count: number): Artist[] {
  const genres = ['indie rock', 'electronic', 'ambient', 'jazz', 'folk'];
  return Array.from({ length: count }, (_, i) => ({
    id: `artist_${i}`,
    name: `Artist ${i}`,
    genres: [genres[i % genres.length]],
    image: `https://i.scdn.co/image/artist_${i}`,
    popularity: 50 + i,
  }));
}

function getMockTracks(count: number): Track[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `track_${i}`,
    name: `Track ${i}`,
    artists: [{ id: `artist_${i}`, name: `Artist ${i}` }],
    album: {
      id: `album_${i}`,
      name: `Album ${i}`,
      image: `https://i.scdn.co/image/album_${i}`,
    },
    popularity: 60 + i,
  }));
}

function getMockPlaylists(): Playlist[] {
  return [
    {
      id: 'playlist_1',
      name: 'Chill Vibes',
      description: 'Relaxing music for studying',
      image: 'https://i.scdn.co/image/playlist_1',
      tracksTotal: 50,
      public: true,
      ownerId: 'mock_user_123',
    },
    {
      id: 'playlist_2',
      name: 'Workout Pump',
      description: 'High energy tracks for the gym',
      image: 'https://i.scdn.co/image/playlist_2',
      tracksTotal: 30,
      public: true,
      ownerId: 'mock_user_123',
    },
  ];
}

function getMockRecent(): RecentlyPlayedItem[] {
  return Array.from({ length: 20 }, (_, i) => ({
    trackId: `track_${i}`,
    trackName: `Track ${i}`,
    artistIds: [`artist_${i}`],
    playedAt: new Date(Date.now() - i * 3600000).toISOString(),
  }));
}

router.get('/spotify/profile', async (req, res) => {
  const accessToken = getAccessToken(req);

  if (process.env.MOCK_MODE === 'true') {
    return res.json(getMockProfile());
  }

  const data = await spotifyGet<any>(`${SPOTIFY_API_BASE}/me`, accessToken);

  const profile = UserProfileSchema.parse({
    id: data.id,
    name: data.display_name,
    email: data.email,
    image: data.images?.[0]?.url,
  });

  return res.json(profile);
});

router.get('/spotify/top-artists', async (req, res) => {
  const accessToken = getAccessToken(req);
  const timeRange = (req.query.time_range as string) || 'medium_term';
  const limit = Math.min(parseInt(req.query.limit as string) || 25, 50);

  if (process.env.MOCK_MODE === 'true') {
    return res.json(getMockArtists(limit));
  }

  const data = await spotifyGet<any>(
    `${SPOTIFY_API_BASE}/me/top/artists?time_range=${timeRange}&limit=${limit}`,
    accessToken
  );

  const artists = data.items.map((item: any) =>
    ArtistSchema.parse({
      id: item.id,
      name: item.name,
      genres: item.genres || [],
      image: item.images?.[0]?.url,
      popularity: item.popularity,
    })
  );

  return res.json(artists);
});

router.get('/spotify/top-tracks', async (req, res) => {
  const accessToken = getAccessToken(req);
  const timeRange = (req.query.time_range as string) || 'medium_term';
  const limit = Math.min(parseInt(req.query.limit as string) || 25, 50);

  if (process.env.MOCK_MODE === 'true') {
    return res.json(getMockTracks(limit));
  }

  const data = await spotifyGet<any>(
    `${SPOTIFY_API_BASE}/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
    accessToken
  );

  const tracks = data.items.map((item: any) =>
    TrackSchema.parse({
      id: item.id,
      name: item.name,
      artists: item.artists.map((a: any) => ({ id: a.id, name: a.name })),
      album: {
        id: item.album.id,
        name: item.album.name,
        image: item.album.images?.[0]?.url,
      },
      popularity: item.popularity,
    })
  );

  return res.json(tracks);
});

router.get('/spotify/playlists', async (req, res) => {
  const accessToken = getAccessToken(req);

  if (process.env.MOCK_MODE === 'true') {
    return res.json(getMockPlaylists());
  }

  const items = await spotifyPaginate<any>(
    `${SPOTIFY_API_BASE}/me/playlists?limit=50`,
    accessToken
  );

  const playlists = items.map((item: any) =>
    PlaylistSchema.parse({
      id: item.id,
      name: item.name,
      description: item.description || '',
      image: item.images?.[0]?.url,
      tracksTotal: item.tracks.total,
      public: item.public,
      ownerId: item.owner.id,
    })
  );

  return res.json(playlists);
});

router.get('/spotify/recent', async (req, res) => {
  const accessToken = getAccessToken(req);

  if (process.env.MOCK_MODE === 'true') {
    return res.json(getMockRecent());
  }

  const data = await spotifyGet<any>(
    `${SPOTIFY_API_BASE}/me/player/recently-played?limit=50`,
    accessToken
  );

  const recent = data.items.map((item: any) =>
    RecentlyPlayedItemSchema.parse({
      trackId: item.track.id,
      trackName: item.track.name,
      artistIds: item.track.artists.map((a: any) => a.id),
      playedAt: item.played_at,
    })
  );

  return res.json(recent);
});

function getMockThemes() {
  return {
    source: 'spotify',
    analyzedAt: new Date().toISOString(),
    themes: [
      {
        label: "Ambient Focus Flow",
        rationale: "Your listening patterns show a preference for atmospheric, non-intrusive music ideal for concentration and deep work.",
        sources: [
          { title: "Artist 0", type: "artist" as const },
          { title: "Track 2", type: "track" as const },
          { title: "Chill Vibes", type: "playlist" as const },
        ]
      },
      {
        label: "Electronic Exploration",
        rationale: "A strong theme of electronic and experimental music suggests curiosity about synthetic soundscapes and modern production.",
        sources: [
          { title: "Artist 1", type: "artist" as const },
          { title: "Track 5", type: "track" as const },
        ]
      },
      {
        label: "High Energy Movement",
        rationale: "Workout-oriented playlists and high-tempo tracks indicate music used for physical activity and motivation.",
        sources: [
          { title: "Workout Pump", type: "playlist" as const },
          { title: "Track 8", type: "track" as const },
        ]
      },
    ]
  };
}

// NEW: AI-powered theme extraction
router.get('/spotify/themes', async (req, res) => {
  try {
    const accessToken = getAccessToken(req);

    // Handle mock mode
    if (process.env.MOCK_MODE === 'true') {
      return res.json(getMockThemes());
    }
    // Fetch all Spotify data in parallel
    const [topArtists, topTracks, playlists, recentlyPlayed] = await Promise.all([
      // Top Artists
      (async () => {
        const data = await spotifyGet<any>(
          `${SPOTIFY_API_BASE}/me/top/artists?time_range=medium_term&limit=25`,
          accessToken
        );
        return data.items.map((item: any) =>
          ArtistSchema.parse({
            id: item.id,
            name: item.name,
            genres: item.genres || [],
            image: item.images?.[0]?.url,
            popularity: item.popularity,
          })
        );
      })(),
      
      // Top Tracks
      (async () => {
        const data = await spotifyGet<any>(
          `${SPOTIFY_API_BASE}/me/top/tracks?time_range=medium_term&limit=50`,
          accessToken
        );
        return data.items.map((item: any) =>
          TrackSchema.parse({
            id: item.id,
            name: item.name,
            artists: item.artists.map((a: any) => ({ id: a.id, name: a.name })),
            album: {
              id: item.album.id,
              name: item.album.name,
              image: item.album.images?.[0]?.url,
            },
            popularity: item.popularity,
          })
        );
      })(),
      
      // Playlists
      (async () => {
        const items = await spotifyPaginate<any>(
          `${SPOTIFY_API_BASE}/me/playlists?limit=50`,
          accessToken
        );
        return items.map((item: any) =>
          PlaylistSchema.parse({
            id: item.id,
            name: item.name,
            description: item.description || '',
            image: item.images?.[0]?.url,
            tracksTotal: item.tracks.total,
            public: item.public,
            ownerId: item.owner.id,
          })
        );
      })(),
      
      // Recently Played
      (async () => {
        const data = await spotifyGet<any>(
          `${SPOTIFY_API_BASE}/me/player/recently-played?limit=50`,
          accessToken
        );
        return data.items.map((item: any) =>
          RecentlyPlayedItemSchema.parse({
            trackId: item.track.id,
            trackName: item.track.name,
            artistIds: item.track.artists.map((a: any) => a.id),
            playedAt: item.played_at,
          })
        );
      })(),
    ]);

    // Extract themes using OpenAI
    const themes = await extractMusicThemes({
      topArtists,
      topTracks,
      playlists,
      recentlyPlayed,
    });

    return res.json({
      source: 'spotify',
      analyzedAt: new Date().toISOString(),
      themes: themes.themes,
    });
  } catch (error: any) {
    logger.error({ error }, 'Failed to extract Spotify themes');
    
    // Check if it's an auth error
    if (error.statusCode === 401 || error.message?.includes('No access token')) {
      return res.status(401).json({
        error: 'Spotify not connected',
        message: 'Please authenticate with Spotify first',
        connectUrl: '/spotify/connect'
      });
    }
    
    return res.status(500).json({
      error: 'Failed to extract themes',
      message: error.message || 'Unknown error'
    });
  }
});

export default router;

