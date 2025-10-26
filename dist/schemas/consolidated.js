"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemesOutputSchema = exports.ThemeSchema = exports.ThemeEvidenceSchema = exports.ConsolidatedSchema = exports.TimeRangesSchema = exports.DerivedMetricsSchema = exports.RecencyBoostSchema = exports.PlaylistKeywordSchema = exports.GenreHistogramSchema = void 0;
const zod_1 = require("zod");
const spotify_1 = require("./spotify");
exports.GenreHistogramSchema = zod_1.z.object({
    genre: zod_1.z.string(),
    count: zod_1.z.number(),
});
exports.PlaylistKeywordSchema = zod_1.z.object({
    token: zod_1.z.string(),
    score: zod_1.z.number(),
});
exports.RecencyBoostSchema = zod_1.z.object({
    genre: zod_1.z.string(),
    boost: zod_1.z.number(),
});
exports.DerivedMetricsSchema = zod_1.z.object({
    genreHistogram: zod_1.z.array(exports.GenreHistogramSchema),
    stabilityScore: zod_1.z.number(),
    playlistKeywords: zod_1.z.array(exports.PlaylistKeywordSchema),
    recencyBoost: zod_1.z.array(exports.RecencyBoostSchema),
    themesTarget: zod_1.z.number(),
});
exports.TimeRangesSchema = zod_1.z.object({
    short: zod_1.z.object({
        topArtistIds: zod_1.z.array(zod_1.z.string()),
    }),
    medium: zod_1.z.object({
        topArtistIds: zod_1.z.array(zod_1.z.string()),
        topTrackIds: zod_1.z.array(zod_1.z.string()),
    }),
    long: zod_1.z.object({
        topArtistIds: zod_1.z.array(zod_1.z.string()),
    }),
});
exports.ConsolidatedSchema = zod_1.z.object({
    source: zod_1.z.literal('spotify'),
    fetchedAt: zod_1.z.string(),
    profile: spotify_1.UserProfileSchema,
    timeRanges: exports.TimeRangesSchema,
    artists: zod_1.z.array(spotify_1.ArtistSchema),
    tracks: zod_1.z.array(spotify_1.TrackSchema),
    playlists: zod_1.z.array(spotify_1.PlaylistSchema),
    recentlyPlayed: zod_1.z.array(spotify_1.RecentlyPlayedItemSchema),
    derived: exports.DerivedMetricsSchema,
});
exports.ThemeEvidenceSchema = zod_1.z.object({
    genres: zod_1.z.array(zod_1.z.string()),
    playlists: zod_1.z.array(zod_1.z.string()),
    recencyHint: zod_1.z.string().optional(),
});
exports.ThemeSchema = zod_1.z.object({
    name: zod_1.z.string(),
    mood: zod_1.z.string(),
    color: zod_1.z.string(),
    evidence: exports.ThemeEvidenceSchema,
});
exports.ThemesOutputSchema = zod_1.z.object({
    themes: zod_1.z.array(exports.ThemeSchema),
    weights: zod_1.z.object({
        genreHistogram: zod_1.z.number(),
        stability: zod_1.z.number(),
        playlists: zod_1.z.number(),
        recency: zod_1.z.number(),
        tracks: zod_1.z.number(),
    }),
});
//# sourceMappingURL=consolidated.js.map