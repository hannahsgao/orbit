import { z } from 'zod';
export declare const UserProfileSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    image: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    email?: string | undefined;
    image?: string | undefined;
}, {
    id: string;
    name: string;
    email?: string | undefined;
    image?: string | undefined;
}>;
export declare const ArtistSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    genres: z.ZodArray<z.ZodString, "many">;
    image: z.ZodOptional<z.ZodString>;
    popularity: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    genres: string[];
    image?: string | undefined;
    popularity?: number | undefined;
}, {
    id: string;
    name: string;
    genres: string[];
    image?: string | undefined;
    popularity?: number | undefined;
}>;
export declare const TrackArtistSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
}, {
    id: string;
    name: string;
}>;
export declare const TrackAlbumSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    image: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    image?: string | undefined;
}, {
    id: string;
    name: string;
    image?: string | undefined;
}>;
export declare const TrackSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    artists: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
    }, {
        id: string;
        name: string;
    }>, "many">;
    album: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        image: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        image?: string | undefined;
    }, {
        id: string;
        name: string;
        image?: string | undefined;
    }>;
    popularity: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    artists: {
        id: string;
        name: string;
    }[];
    album: {
        id: string;
        name: string;
        image?: string | undefined;
    };
    popularity?: number | undefined;
}, {
    id: string;
    name: string;
    artists: {
        id: string;
        name: string;
    }[];
    album: {
        id: string;
        name: string;
        image?: string | undefined;
    };
    popularity?: number | undefined;
}>;
export declare const PlaylistSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    image: z.ZodOptional<z.ZodString>;
    tracksTotal: z.ZodNumber;
    public: z.ZodBoolean;
    ownerId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    tracksTotal: number;
    public: boolean;
    ownerId: string;
    image?: string | undefined;
    description?: string | undefined;
}, {
    id: string;
    name: string;
    tracksTotal: number;
    public: boolean;
    ownerId: string;
    image?: string | undefined;
    description?: string | undefined;
}>;
export declare const RecentlyPlayedItemSchema: z.ZodObject<{
    trackId: z.ZodString;
    trackName: z.ZodString;
    artistIds: z.ZodArray<z.ZodString, "many">;
    playedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    trackId: string;
    trackName: string;
    artistIds: string[];
    playedAt: string;
}, {
    trackId: string;
    trackName: string;
    artistIds: string[];
    playedAt: string;
}>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type Artist = z.infer<typeof ArtistSchema>;
export type Track = z.infer<typeof TrackSchema>;
export type Playlist = z.infer<typeof PlaylistSchema>;
export type RecentlyPlayedItem = z.infer<typeof RecentlyPlayedItemSchema>;
//# sourceMappingURL=spotify.d.ts.map