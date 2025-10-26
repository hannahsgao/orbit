"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const spotify_1 = require("../services/spotify");
const errors_1 = require("../utils/errors");
const text_1 = require("../utils/text");
const consolidated_1 = require("../schemas/consolidated");
const router = (0, express_1.Router)();
const consolidatedCache = new Map();
const CACHE_TTL = 60 * 1000; // 60 seconds
function getAccessToken(req) {
    if (process.env.MOCK_MODE === 'true') {
        return 'MOCK_TOKEN';
    }
    const token = req.cookies.access_token;
    if (!token) {
        throw new errors_1.AppError(401, 'No access token provided');
    }
    return token;
}
function getUserId(req) {
    return req.cookies.session_id || 'default_user';
}
async function fetchConsolidatedData(accessToken) {
    const [profileData, topArtistsShortData, topArtistsMediumData, topArtistsLongData, topTracksMediumData, playlistsData, recentData,] = await Promise.all([
        (0, spotify_1.spotifyGet)(`${spotify_1.SPOTIFY_API_BASE}/me`, accessToken),
        (0, spotify_1.spotifyGet)(`${spotify_1.SPOTIFY_API_BASE}/me/top/artists?time_range=short_term&limit=25`, accessToken),
        (0, spotify_1.spotifyGet)(`${spotify_1.SPOTIFY_API_BASE}/me/top/artists?time_range=medium_term&limit=25`, accessToken),
        (0, spotify_1.spotifyGet)(`${spotify_1.SPOTIFY_API_BASE}/me/top/artists?time_range=long_term&limit=25`, accessToken),
        (0, spotify_1.spotifyGet)(`${spotify_1.SPOTIFY_API_BASE}/me/top/tracks?time_range=medium_term&limit=25`, accessToken),
        (0, spotify_1.spotifyPaginate)(`${spotify_1.SPOTIFY_API_BASE}/me/playlists?limit=50`, accessToken),
        (0, spotify_1.spotifyGet)(`${spotify_1.SPOTIFY_API_BASE}/me/player/recently-played?limit=50`, accessToken),
    ]);
    const profile = {
        id: profileData.id,
        name: profileData.display_name,
        email: profileData.email,
        image: profileData.images?.[0]?.url,
    };
    const topArtistsShort = topArtistsShortData.items.map((item) => ({
        id: item.id,
        name: item.name,
        genres: item.genres || [],
        image: item.images?.[0]?.url,
        popularity: item.popularity,
    }));
    const topArtistsMedium = topArtistsMediumData.items.map((item) => ({
        id: item.id,
        name: item.name,
        genres: item.genres || [],
        image: item.images?.[0]?.url,
        popularity: item.popularity,
    }));
    const topArtistsLong = topArtistsLongData.items.map((item) => ({
        id: item.id,
        name: item.name,
        genres: item.genres || [],
        image: item.images?.[0]?.url,
        popularity: item.popularity,
    }));
    const topTracks = topTracksMediumData.items.map((item) => ({
        id: item.id,
        name: item.name,
        artists: item.artists.map((a) => ({ id: a.id, name: a.name })),
        album: {
            id: item.album.id,
            name: item.album.name,
            image: item.album.images?.[0]?.url,
        },
        popularity: item.popularity,
    }));
    const playlists = playlistsData.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        image: item.images?.[0]?.url,
        tracksTotal: item.tracks.total,
        public: item.public,
        ownerId: item.owner.id,
    }));
    const recentlyPlayed = recentData.items.map((item) => ({
        trackId: item.track.id,
        trackName: item.track.name,
        artistIds: item.track.artists.map((a) => a.id),
        playedAt: item.played_at,
    }));
    const allArtists = new Map();
    [...topArtistsShort, ...topArtistsMedium, ...topArtistsLong].forEach(artist => {
        allArtists.set(artist.id, artist);
    });
    const genreHistogram = computeGenreHistogram(topArtistsMedium);
    const stabilityScore = computeStabilityScore(topArtistsShort, topArtistsMedium, topArtistsLong);
    const playlistKeywords = extractPlaylistKeywords(playlists);
    const recencyBoost = computeRecencyBoost(recentlyPlayed, Array.from(allArtists.values()));
    const consolidated = {
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
    return consolidated_1.ConsolidatedSchema.parse(consolidated);
}
function computeGenreHistogram(artists) {
    const genreCount = new Map();
    for (const artist of artists) {
        for (const genre of artist.genres) {
            genreCount.set(genre, (genreCount.get(genre) || 0) + 1);
        }
    }
    return Array.from(genreCount.entries())
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => b.count - a.count);
}
function computeStabilityScore(short, medium, long) {
    const shortIds = new Set(short.map(a => a.id));
    const mediumIds = new Set(medium.map(a => a.id));
    const longIds = new Set(long.map(a => a.id));
    const intersection = new Set([...shortIds].filter(id => mediumIds.has(id) && longIds.has(id)));
    const union = new Set([...shortIds, ...mediumIds, ...longIds]);
    return union.size > 0 ? intersection.size / union.size : 0;
}
function extractPlaylistKeywords(playlists) {
    const allTokens = [];
    for (const playlist of playlists) {
        const text = `${playlist.name} ${playlist.description || ''}`;
        allTokens.push(...(0, text_1.tokenize)(text));
    }
    const freq = (0, text_1.computeTermFrequency)(allTokens);
    return (0, text_1.scoreTokens)(freq, playlists.length).slice(0, 20);
}
function computeRecencyBoost(recent, artists) {
    const artistMap = new Map(artists.map(a => [a.id, a]));
    const genreBoost = new Map();
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
function getMockConsolidated() {
    const profile = {
        id: 'mock_user_123',
        name: 'Mock User',
        email: 'mock@example.com',
    };
    const artists = [
        { id: 'a1', name: 'Bon Iver', genres: ['indie folk', 'chamber pop'], popularity: 75 },
        { id: 'a2', name: 'Tycho', genres: ['ambient', 'electronic'], popularity: 70 },
        { id: 'a3', name: 'Radiohead', genres: ['alternative rock', 'art rock'], popularity: 85 },
    ];
    const tracks = [
        { id: 't1', name: 'Holocene', artists: [{ id: 'a1', name: 'Bon Iver' }], album: { id: 'alb1', name: 'Album' } },
    ];
    const playlists = [
        { id: 'p1', name: 'Chill Study', description: 'Focus music', tracksTotal: 50, public: true, ownerId: 'mock_user_123' },
        { id: 'p2', name: 'Running Pump', description: 'High energy', tracksTotal: 30, public: true, ownerId: 'mock_user_123' },
    ];
    const recent = [
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
const GENRE_COLOR_MAP = {
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
function getColorForGenre(genre) {
    for (const [key, color] of Object.entries(GENRE_COLOR_MAP)) {
        if (genre.toLowerCase().includes(key)) {
            return color;
        }
    }
    return '#b5b5b5';
}
// OLD THEME INFERENCE CODE REMOVED (was ~160 lines)
// - inferThemes(), createTheme(), mapGenreToThemeName(), getMockThemes()
// - /mcp/spotify/themes endpoint
//
// Use /spotify/themes for AI-powered theme extraction with OpenAI
exports.default = router;
//# sourceMappingURL=mcp.js.map