import { Router } from 'express';
import {
  createPersonalAgent,
  getAgentInfo,
  ingestSpotifyData,
  extractThemes,
  getAgentMemory,
} from '../services/letta';
import { spotifyGet, SPOTIFY_API_BASE, spotifyPaginate } from '../services/spotify';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

const router = Router();

function getAccessToken(req: any): string {
  const token = req.cookies.access_token;
  if (!token) {
    throw new AppError(401, 'No access token provided. Please authenticate with Spotify first.');
  }
  return token;
}

// Create or get agent for user
router.post('/letta/agent/init', async (req, res) => {
  const { userName } = req.body;

  if (!userName || typeof userName !== 'string') {
    throw new AppError(400, 'userName is required');
  }

  // Check if agent already exists
  let agentInfo = await getAgentInfo(userName);

  if (!agentInfo) {
    agentInfo = await createPersonalAgent(userName);
  }

  return res.json({
    agentId: agentInfo.id,
    name: agentInfo.name,
    createdAt: agentInfo.createdAt,
    message: 'Agent ready. You can now ingest data from Spotify, photos, and Gmail.',
  });
});

// Ingest Spotify data into Letta agent
router.post('/letta/ingest/spotify', async (req, res) => {
  const accessToken = getAccessToken(req);
  const { agentId } = req.body;

  if (!agentId) {
    throw new AppError(400, 'agentId is required');
  }

  logger.info({ agentId }, 'Fetching Spotify data for Letta ingestion');

  // Fetch consolidated Spotify data
  const [
    profileData,
    topArtistsMediumData,
    topTracksMediumData,
    playlistsData,
    recentData,
  ] = await Promise.all([
    spotifyGet<any>(`${SPOTIFY_API_BASE}/me`, accessToken),
    spotifyGet<any>(`${SPOTIFY_API_BASE}/me/top/artists?time_range=medium_term&limit=25`, accessToken),
    spotifyGet<any>(`${SPOTIFY_API_BASE}/me/top/tracks?time_range=medium_term&limit=25`, accessToken),
    spotifyPaginate<any>(`${SPOTIFY_API_BASE}/me/playlists?limit=50`, accessToken),
    spotifyGet<any>(`${SPOTIFY_API_BASE}/me/player/recently-played?limit=50`, accessToken),
  ]);

  const profile = {
    id: profileData.id,
    name: profileData.display_name,
    email: profileData.email,
  };

  const artists = topArtistsMediumData.items.map((item: any) => ({
    id: item.id,
    name: item.name,
    genres: item.genres || [],
    popularity: item.popularity,
  }));

  const tracks = topTracksMediumData.items.map((item: any) => ({
    id: item.id,
    name: item.name,
    artists: item.artists.map((a: any) => ({ id: a.id, name: a.name })),
  }));

  const playlists = playlistsData.map((item: any) => ({
    id: item.id,
    name: item.name,
    description: item.description || '',
    tracksTotal: item.tracks.total,
  }));

  const recentlyPlayed = recentData.items.map((item: any) => ({
    trackId: item.track.id,
    trackName: item.track.name,
    playedAt: item.played_at,
  }));

  // Compute derived metrics
  const genreCount = new Map<string, number>();
  for (const artist of artists) {
    for (const genre of artist.genres) {
      genreCount.set(genre, (genreCount.get(genre) || 0) + 1);
    }
  }

  const genreHistogram = Array.from(genreCount.entries())
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count);

  const playlistKeywords: Array<{ token: string; score: number }> = [];
  const tokenCount = new Map<string, number>();
  for (const playlist of playlists) {
    const words = (playlist.name + ' ' + playlist.description)
      .toLowerCase()
      .split(/\W+/)
      .filter(w => w.length > 3);
    for (const word of words) {
      tokenCount.set(word, (tokenCount.get(word) || 0) + 1);
    }
  }

  for (const [token, count] of tokenCount.entries()) {
    playlistKeywords.push({ token, score: count / playlists.length });
  }
  playlistKeywords.sort((a, b) => b.score - a.score);

  const recencyBoost = genreHistogram.slice(0, 5).map(g => ({ genre: g.genre, boost: 0.15 }));

  const spotifyData = {
    profile,
    derived: {
      genreHistogram,
      stabilityScore: 0.75,
      playlistKeywords,
      recencyBoost,
    },
    artists,
    tracks,
    playlists,
    recentlyPlayed,
  };

  await ingestSpotifyData(agentId, spotifyData);

  return res.json({
    success: true,
    message: 'Spotify data ingested successfully',
    dataPoints: {
      artists: artists.length,
      tracks: tracks.length,
      playlists: playlists.length,
      genres: genreHistogram.length,
    },
  });
});

// Extract themes from all ingested data
router.get('/letta/themes/:agentId', async (req, res) => {
  const { agentId } = req.params;

  logger.info({ agentId }, 'Extracting themes from Letta agent');

  const themes = await extractThemes(agentId);

  return res.json(themes);
});

// Get agent's current memory state
router.get('/letta/memory/:agentId', async (req, res) => {
  const { agentId } = req.params;

  const memory = await getAgentMemory(agentId);

  return res.json({
    agentId,
    memoryBlocks: memory,
  });
});

// Quick test endpoint - ingest Spotify and extract themes in one call
router.post('/letta/quick-analyze', async (req, res) => {
  const accessToken = getAccessToken(req);
  const { userName } = req.body;

  if (!userName) {
    throw new AppError(400, 'userName is required');
  }

  // Create agent
  const agentInfo = await createPersonalAgent(userName);

  // Fetch and ingest Spotify data (simplified version)
  const profileData = await spotifyGet<any>(`${SPOTIFY_API_BASE}/me`, accessToken);
  const topArtistsData = await spotifyGet<any>(`${SPOTIFY_API_BASE}/me/top/artists?limit=25`, accessToken);

  const spotifyData = {
    profile: {
      id: profileData.id,
      name: profileData.display_name,
    },
    artists: topArtistsData.items,
    tracks: [],
    playlists: [],
    recentlyPlayed: [],
    derived: {
      genreHistogram: [],
      stabilityScore: 0.5,
      playlistKeywords: [],
      recencyBoost: [],
    },
  };

  await ingestSpotifyData(agentInfo.id, spotifyData);

  // Extract themes
  const themes = await extractThemes(agentInfo.id);

  return res.json({
    agentId: agentInfo.id,
    themes,
  });
});

export default router;

