"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecentlyPlayedItemSchema = exports.PlaylistSchema = exports.TrackSchema = exports.TrackAlbumSchema = exports.TrackArtistSchema = exports.ArtistSchema = exports.UserProfileSchema = void 0;
var zod_1 = require("zod");
exports.UserProfileSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    email: zod_1.z.string().email().optional(),
    image: zod_1.z.string().url().optional(),
});
exports.ArtistSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    genres: zod_1.z.array(zod_1.z.string()),
    image: zod_1.z.string().url().optional(),
    popularity: zod_1.z.number().optional(),
});
exports.TrackArtistSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
});
exports.TrackAlbumSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    image: zod_1.z.string().url().optional(),
});
exports.TrackSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    artists: zod_1.z.array(exports.TrackArtistSchema),
    album: exports.TrackAlbumSchema,
    popularity: zod_1.z.number().optional(),
});
exports.PlaylistSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    image: zod_1.z.string().url().optional(),
    tracksTotal: zod_1.z.number(),
    public: zod_1.z.boolean(),
    ownerId: zod_1.z.string(),
});
exports.RecentlyPlayedItemSchema = zod_1.z.object({
    trackId: zod_1.z.string(),
    trackName: zod_1.z.string(),
    artistIds: zod_1.z.array(zod_1.z.string()),
    playedAt: zod_1.z.string(),
});
