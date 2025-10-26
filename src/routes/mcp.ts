import { Router } from 'express';
import { spotifyGet, spotifyPaginate, SPOTIFY_API_BASE } from '../services/spotify';
import { AppError } from '../utils/errors';
import { tokenize, computeTermFrequency, scoreTokens, mapTokensToThemes } from '../utils/text';
import {
  ConsolidatedSchema,
  ThemesOutputSchema,
  type Consolidated,
  type ThemesOutput,
  type Theme,
} from '../schemas/consolidated';
import type { Artist, Track, Playlist, RecentlyPlayedItem, UserProfile } from '../schemas/spotify';

const router = Router();

interface CacheEntry {
  data: Consolidated;
  timestamp: number;
}

const consolidatedCache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 1000; // 60 seconds

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

function getUserId(req: any): string {
  return req.cookies.session_id || 'default_user';
}

async function fetchConsolidatedData(accessToken: string): Promise<Consolidated> {
  const [
    profileData,
    topArtistsShortData,
    topArtistsMediumData,
    topArtistsLongData,
    topTracksMediumData,
    playlistsData,
    recentData,
  ] = await Promise.all([
    spotifyGet<any>(`${SPOTIFY_API_BASE}/me`, accessToken),
    spotifyGet<any>(`${SPOTIFY_API_BASE}/me/top/artists?time_range=short_term&limit=25`, accessToken),
    spotifyGet<any>(`${SPOTIFY_API_BASE}/me/top/artists?time_range=medium_term&limit=25`, accessToken),
    spotifyGet<any>(`${SPOTIFY_API_BASE}/me/top/artists?time_range=long_term&limit=25`, accessToken),
    spotifyGet<any>(`${SPOTIFY_API_BASE}/me/top/tracks?time_range=medium_term&limit=25`, accessToken),
    spotifyPaginate<any>(`${SPOTIFY_API_BASE}/me/playlists?limit=50`, accessToken),
    spotifyGet<any>(`${SPOTIFY_API_BASE}/me/player/recently-played?limit=50`, accessToken),
  ]);

  const profile: UserProfile = {
    id: profileData.id,
    name: profileData.display_name,
    email: profileData.email,
    image: profileData.images?.[0]?.url,
  };

  const topArtistsShort: Artist[] = topArtistsShortData.items.map((item: any) => ({
    id: item.id,
    name: item.name,
    genres: item.genres || [],
    image: item.images?.[0]?.url,
    popularity: item.popularity,
  }));

  const topArtistsMedium: Artist[] = topArtistsMediumData.items.map((item: any) => ({
    id: item.id,
    name: item.name,
    genres: item.genres || [],
    image: item.images?.[0]?.url,
    popularity: item.popularity,
  }));

  const topArtistsLong: Artist[] = topArtistsLongData.items.map((item: any) => ({
    id: item.id,
    name: item.name,
    genres: item.genres || [],
    image: item.images?.[0]?.url,
    popularity: item.popularity,
  }));

  const topTracks: Track[] = topTracksMediumData.items.map((item: any) => ({
    id: item.id,
    name: item.name,
    artists: item.artists.map((a: any) => ({ id: a.id, name: a.name })),
    album: {
      id: item.album.id,
      name: item.album.name,
      image: item.album.images?.[0]?.url,
    },
    popularity: item.popularity,
  }));

  const playlists: Playlist[] = playlistsData.map((item: any) => ({
    id: item.id,
    name: item.name,
    description: item.description || '',
    image: item.images?.[0]?.url,
    tracksTotal: item.tracks.total,
    public: item.public,
    ownerId: item.owner.id,
  }));

  const recentlyPlayed: RecentlyPlayedItem[] = recentData.items.map((item: any) => ({
    trackId: item.track.id,
    trackName: item.track.name,
    artistIds: item.track.artists.map((a: any) => a.id),
    playedAt: item.played_at,
  }));

  const allArtists = new Map<string, Artist>();
  [...topArtistsShort, ...topArtistsMedium, ...topArtistsLong].forEach(artist => {
    allArtists.set(artist.id, artist);
  });

  const genreHistogram = computeGenreHistogram(topArtistsMedium);
  const stabilityScore = computeStabilityScore(topArtistsShort, topArtistsMedium, topArtistsLong);
  const playlistKeywords = extractPlaylistKeywords(playlists);
  const recencyBoost = computeRecencyBoost(recentlyPlayed, Array.from(allArtists.values()));

  const consolidated: Consolidated = {
    source: 'spotify',
    fetchedAt: new Date().toISOString(),
    profile,
    timeRanges: {
      short: {
        topArtistIds: topArtistsShort.map(a => a.id),
      },
      medium: {
        topArtistIds: topArtistsMedium.map(a => a.id),
        topTrackIds: topTracks.map(t => t.id),
      },
      long: {
        topArtistIds: topArtistsLong.map(a => a.id),
      },
    },
    artists: Array.from(allArtists.values()),
    tracks: topTracks,
    playlists,
    recentlyPlayed,
    derived: {
      genreHistogram,
      stabilityScore,
      playlistKeywords,
      recencyBoost,
      themesTarget: 6,
    },
  };

  return ConsolidatedSchema.parse(consolidated);
}

function computeGenreHistogram(artists: Artist[]): Array<{ genre: string; count: number }> {
  const genreCount = new Map<string, number>();

  for (const artist of artists) {
    for (const genre of artist.genres) {
      genreCount.set(genre, (genreCount.get(genre) || 0) + 1);
    }
  }

  return Array.from(genreCount.entries())
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count);
}

function computeStabilityScore(short: Artist[], medium: Artist[], long: Artist[]): number {
  const shortIds = new Set(short.map(a => a.id));
  const mediumIds = new Set(medium.map(a => a.id));
  const longIds = new Set(long.map(a => a.id));

  const intersection = new Set([...shortIds].filter(id => mediumIds.has(id) && longIds.has(id)));
  const union = new Set([...shortIds, ...mediumIds, ...longIds]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

function extractPlaylistKeywords(playlists: Playlist[]): Array<{ token: string; score: number }> {
  const allTokens: string[] = [];

  for (const playlist of playlists) {
    const text = `${playlist.name} ${playlist.description || ''}`;
    allTokens.push(...tokenize(text));
  }

  const freq = computeTermFrequency(allTokens);
  return scoreTokens(freq, playlists.length).slice(0, 20);
}

function computeRecencyBoost(recent: RecentlyPlayedItem[], artists: Artist[]): Array<{ genre: string; boost: number }> {
  const artistMap = new Map(artists.map(a => [a.id, a]));
  const genreBoost = new Map<string, number>();

  for (const item of recent) {
    for (const artistId of item.artistIds) {
      const artist = artistMap.get(artistId);
      if (artist) {
        for (const genre of artist.genres) {
          genreBoost.set(genre, (genreBoost.get(genre) || 0) + 0.15);
        }
      }
    }
  }

  return Array.from(genreBoost.entries())
    .map(([genre, boost]) => ({ genre, boost }))
    .sort((a, b) => b.boost - a.boost)
    .slice(0, 10);
}

function getMockConsolidated(): Consolidated {
  const profile: UserProfile = {
    id: 'mock_user_123',
    name: 'Mock User',
    email: 'mock@example.com',
  };

  const artists: Artist[] = [
    { id: 'a1', name: 'Bon Iver', genres: ['indie folk', 'chamber pop'], popularity: 75 },
    { id: 'a2', name: 'Tycho', genres: ['ambient', 'electronic'], popularity: 70 },
    { id: 'a3', name: 'Radiohead', genres: ['alternative rock', 'art rock'], popularity: 85 },
  ];

  const tracks: Track[] = [
    { id: 't1', name: 'Holocene', artists: [{ id: 'a1', name: 'Bon Iver' }], album: { id: 'alb1', name: 'Album' } },
  ];

  const playlists: Playlist[] = [
    { id: 'p1', name: 'Chill Study', description: 'Focus music', tracksTotal: 50, public: true, ownerId: 'mock_user_123' },
    { id: 'p2', name: 'Running Pump', description: 'High energy', tracksTotal: 30, public: true, ownerId: 'mock_user_123' },
  ];

  const recent: RecentlyPlayedItem[] = [
    { trackId: 't1', trackName: 'Holocene', artistIds: ['a1'], playedAt: new Date().toISOString() },
  ];

  return {
    source: 'spotify',
    fetchedAt: new Date().toISOString(),
    profile,
    timeRanges: {
      short: { topArtistIds: ['a1', 'a2'] },
      medium: { topArtistIds: ['a1', 'a2', 'a3'], topTrackIds: ['t1'] },
      long: { topArtistIds: ['a2', 'a3'] },
    },
    artists,
    tracks,
    playlists,
    recentlyPlayed: recent,
    derived: {
      genreHistogram: [
        { genre: 'indie folk', count: 2 },
        { genre: 'ambient', count: 2 },
      ],
      stabilityScore: 0.67,
      playlistKeywords: [
        { token: 'chill', score: 1 },
        { token: 'study', score: 1 },
      ],
      recencyBoost: [{ genre: 'indie folk', boost: 0.15 }],
      themesTarget: 6,
    },
  };
}

router.get('/mcp/spotify/data', async (req, res) => {
  const accessToken = getAccessToken(req);
  const userId = getUserId(req);

  if (process.env.MOCK_MODE === 'true') {
    return res.json(getMockConsolidated());
  }

  const cached = consolidatedCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json(cached.data);
  }

  const consolidated = await fetchConsolidatedData(accessToken);

  consolidatedCache.set(userId, {
    data: consolidated,
    timestamp: Date.now(),
  });

  return res.json(consolidated);
});

const GENRE_COLOR_MAP: Record<string, string> = {
  'indie': '#a8c5e0',
  'folk': '#d4c5a9',
  'ambient': '#c5d9e8',
  'electronic': '#b8a8d1',
  'rock': '#d1a8a8',
  'pop': '#f0c0c0',
  'jazz': '#c5a8d1',
  'classical': '#e8d4c5',
  'hip hop': '#d1c5a8',
  'metal': '#8a8a8a',
  'punk': '#d1a8c5',
};

function getColorForGenre(genre: string): string {
  for (const [key, color] of Object.entries(GENRE_COLOR_MAP)) {
    if (genre.toLowerCase().includes(key)) {
      return color;
    }
  }
  return '#b5b5b5';
}

function inferThemes(consolidated: Consolidated): ThemesOutput {
  const { genreHistogram, playlistKeywords, recencyBoost } = consolidated.derived;

  const playlistTokens = playlistKeywords.map(kw => kw.token);
  const themeScores = mapTokensToThemes(playlistTokens);

  const genreThemes = new Map<string, { genres: string[]; score: number }>();

  for (const { genre, count } of genreHistogram.slice(0, 15)) {
    const genreFamily = genre.split(' ')[0];
    const existing = genreThemes.get(genreFamily) || { genres: [], score: 0 };
    existing.genres.push(genre);
    existing.score += count * 0.35;
    genreThemes.set(genreFamily, existing);
  }

  for (const { genre, boost } of recencyBoost) {
    const genreFamily = genre.split(' ')[0];
    const existing = genreThemes.get(genreFamily) || { genres: [], score: 0 };
    existing.score += boost * 0.15;
    genreThemes.set(genreFamily, existing);
  }

  const themes: Theme[] = [];

  const sortedThemeScores = Array.from(themeScores.entries()).sort((a, b) => b[1] - a[1]);
  
  for (const [themeName, _score] of sortedThemeScores.slice(0, 3)) {
    const relatedGenres = genreHistogram.slice(0, 5).map(g => g.genre);
    themes.push(createTheme(themeName, relatedGenres, playlistTokens.slice(0, 3)));
  }

  const sortedGenres = Array.from(genreThemes.entries())
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 3);

  for (const [genreFamily, data] of sortedGenres) {
    const themeName = mapGenreToThemeName(genreFamily);
    themes.push(createTheme(themeName, data.genres, []));
  }

  const uniqueThemes = themes.slice(0, 6);

  return ThemesOutputSchema.parse({
    themes: uniqueThemes,
    weights: {
      genreHistogram: 0.35,
      stability: 0.20,
      playlists: 0.25,
      recency: 0.15,
      tracks: 0.05,
    },
  });
}

function createTheme(name: string, genres: string[], playlists: string[]): Theme {
  const moodMap: Record<string, string> = {
    calm: 'pale violet drift, distant radio hum',
    motion: 'neon pulse, accelerating heartbeat',
    melancholy: 'rain-soaked pavement, fading photographs',
    joy: 'sun-drenched afternoon, laughter echoing',
    curiosity: 'flickering streetlights, unmarked paths',
    nostalgia: 'cassette tape hiss, forgotten summers',
    indie: 'coffee shop ambiance, analog warmth',
    folk: 'wooden cabin, fireplace crackling',
    ambient: 'vast empty spaces, soft breathing',
    electronic: 'digital rain, synthesized dreams',
    rock: 'distorted guitars, stadium echoes',
  };

  const mood = moodMap[name.toLowerCase()] || 'undefined atmosphere, shifting tones';
  const color = getColorForGenre(genres[0] || name);

  return {
    name: name.charAt(0).toUpperCase() + name.slice(1),
    mood,
    color,
    evidence: {
      genres: genres.slice(0, 3),
      playlists: playlists.slice(0, 3),
      recencyHint: genres.length > 0 ? `Recently engaging with ${genres[0]}` : undefined,
    },
  };
}

function mapGenreToThemeName(genre: string): string {
  const mapping: Record<string, string> = {
    indie: 'Curiosity',
    folk: 'Nostalgia',
    ambient: 'Calm',
    electronic: 'Motion',
    rock: 'Release',
    pop: 'Joy',
    jazz: 'Contemplation',
    classical: 'Serenity',
  };
  return mapping[genre.toLowerCase()] || 'Exploration';
}

function getMockThemes(): ThemesOutput {
  return {
    themes: [
      {
        name: 'Calm',
        mood: 'pale violet drift, distant radio hum',
        color: '#c5d9e8',
        evidence: {
          genres: ['ambient', 'indie folk'],
          playlists: ['chill', 'study'],
          recencyHint: 'Recently engaging with ambient',
        },
      },
      {
        name: 'Curiosity',
        mood: 'coffee shop ambiance, analog warmth',
        color: '#a8c5e0',
        evidence: {
          genres: ['indie rock', 'alternative'],
          playlists: ['discover', 'new'],
        },
      },
      {
        name: 'Nostalgia',
        mood: 'cassette tape hiss, forgotten summers',
        color: '#d4c5a9',
        evidence: {
          genres: ['folk', 'singer-songwriter'],
          playlists: ['throwback'],
        },
      },
      {
        name: 'Motion',
        mood: 'neon pulse, accelerating heartbeat',
        color: '#b8a8d1',
        evidence: {
          genres: ['electronic', 'dance'],
          playlists: ['running', 'pump'],
          recencyHint: 'Recently engaging with electronic',
        },
      },
      {
        name: 'Release',
        mood: 'distorted guitars, stadium echoes',
        color: '#d1a8a8',
        evidence: {
          genres: ['rock', 'alternative rock'],
          playlists: [],
        },
      },
    ],
    weights: {
      genreHistogram: 0.35,
      stability: 0.20,
      playlists: 0.25,
      recency: 0.15,
      tracks: 0.05,
    },
  };
}

router.get('/mcp/spotify/themes', async (req, res) => {
  const accessToken = getAccessToken(req);
  const userId = getUserId(req);

  if (process.env.MOCK_MODE === 'true') {
    return res.json(getMockThemes());
  }

  const cached = consolidatedCache.get(userId);
  let consolidated: Consolidated;

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    consolidated = cached.data;
  } else {
    consolidated = await fetchConsolidatedData(accessToken);
    consolidatedCache.set(userId, {
      data: consolidated,
      timestamp: Date.now(),
    });
  }

  const themes = inferThemes(consolidated);
  return res.json(themes);
});

export default router;

