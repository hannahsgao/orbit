import { Router } from 'express';
import { spotifyGet, spotifyPaginate, SPOTIFY_API_BASE } from '../services/spotify';
import { extractMusicThemes } from '../services/openai';
import { AppError } from '../utils/errors';
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

// NEW: AI-powered theme extraction
router.get('/spotify/themes', async (req, res) => {
  const accessToken = getAccessToken(req);

  try {
    // Fetch all Spotify data in parallel
    const [topArtists, topTracks, playlists, recentlyPlayed] = await Promise.all([
      // Top Artists
      (async () => {
        if (process.env.MOCK_MODE === 'true') return getMockArtists(25);
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
        if (process.env.MOCK_MODE === 'true') return getMockTracks(25);
        const data = await spotifyGet<any>(
          `${SPOTIFY_API_BASE}/me/top/tracks?time_range=medium_term&limit=25`,
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
        if (process.env.MOCK_MODE === 'true') return getMockPlaylists();
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
        if (process.env.MOCK_MODE === 'true') return getMockRecent();
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

    return res.json(themes);
  } catch (error: any) {
    throw new AppError(500, `Failed to extract themes: ${error.message}`);
  }
});

export default router;

