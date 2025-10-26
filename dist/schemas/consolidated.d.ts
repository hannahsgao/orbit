import { z } from 'zod';
export declare const GenreHistogramSchema: z.ZodObject<{
    genre: z.ZodString;
    count: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    genre: string;
    count: number;
}, {
    genre: string;
    count: number;
}>;
export declare const PlaylistKeywordSchema: z.ZodObject<{
    token: z.ZodString;
    score: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    token: string;
    score: number;
}, {
    token: string;
    score: number;
}>;
export declare const RecencyBoostSchema: z.ZodObject<{
    genre: z.ZodString;
    boost: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    genre: string;
    boost: number;
}, {
    genre: string;
    boost: number;
}>;
export declare const DerivedMetricsSchema: z.ZodObject<{
    genreHistogram: z.ZodArray<z.ZodObject<{
        genre: z.ZodString;
        count: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        genre: string;
        count: number;
    }, {
        genre: string;
        count: number;
    }>, "many">;
    stabilityScore: z.ZodNumber;
    playlistKeywords: z.ZodArray<z.ZodObject<{
        token: z.ZodString;
        score: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        token: string;
        score: number;
    }, {
        token: string;
        score: number;
    }>, "many">;
    recencyBoost: z.ZodArray<z.ZodObject<{
        genre: z.ZodString;
        boost: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        genre: string;
        boost: number;
    }, {
        genre: string;
        boost: number;
    }>, "many">;
    themesTarget: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    genreHistogram: {
        genre: string;
        count: number;
    }[];
    stabilityScore: number;
    playlistKeywords: {
        token: string;
        score: number;
    }[];
    recencyBoost: {
        genre: string;
        boost: number;
    }[];
    themesTarget: number;
}, {
    genreHistogram: {
        genre: string;
        count: number;
    }[];
    stabilityScore: number;
    playlistKeywords: {
        token: string;
        score: number;
    }[];
    recencyBoost: {
        genre: string;
        boost: number;
    }[];
    themesTarget: number;
}>;
export declare const TimeRangesSchema: z.ZodObject<{
    short: z.ZodObject<{
        topArtistIds: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        topArtistIds: string[];
    }, {
        topArtistIds: string[];
    }>;
    medium: z.ZodObject<{
        topArtistIds: z.ZodArray<z.ZodString, "many">;
        topTrackIds: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        topArtistIds: string[];
        topTrackIds: string[];
    }, {
        topArtistIds: string[];
        topTrackIds: string[];
    }>;
    long: z.ZodObject<{
        topArtistIds: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        topArtistIds: string[];
    }, {
        topArtistIds: string[];
    }>;
}, "strip", z.ZodTypeAny, {
    medium: {
        topArtistIds: string[];
        topTrackIds: string[];
    };
    short: {
        topArtistIds: string[];
    };
    long: {
        topArtistIds: string[];
    };
}, {
    medium: {
        topArtistIds: string[];
        topTrackIds: string[];
    };
    short: {
        topArtistIds: string[];
    };
    long: {
        topArtistIds: string[];
    };
}>;
export declare const ConsolidatedSchema: z.ZodObject<{
    source: z.ZodLiteral<"spotify">;
    fetchedAt: z.ZodString;
    profile: z.ZodObject<{
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
    timeRanges: z.ZodObject<{
        short: z.ZodObject<{
            topArtistIds: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            topArtistIds: string[];
        }, {
            topArtistIds: string[];
        }>;
        medium: z.ZodObject<{
            topArtistIds: z.ZodArray<z.ZodString, "many">;
            topTrackIds: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            topArtistIds: string[];
            topTrackIds: string[];
        }, {
            topArtistIds: string[];
            topTrackIds: string[];
        }>;
        long: z.ZodObject<{
            topArtistIds: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            topArtistIds: string[];
        }, {
            topArtistIds: string[];
        }>;
    }, "strip", z.ZodTypeAny, {
        medium: {
            topArtistIds: string[];
            topTrackIds: string[];
        };
        short: {
            topArtistIds: string[];
        };
        long: {
            topArtistIds: string[];
        };
    }, {
        medium: {
            topArtistIds: string[];
            topTrackIds: string[];
        };
        short: {
            topArtistIds: string[];
        };
        long: {
            topArtistIds: string[];
        };
    }>;
    artists: z.ZodArray<z.ZodObject<{
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
    }>, "many">;
    tracks: z.ZodArray<z.ZodObject<{
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
    }>, "many">;
    playlists: z.ZodArray<z.ZodObject<{
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
    }>, "many">;
    recentlyPlayed: z.ZodArray<z.ZodObject<{
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
    }>, "many">;
    derived: z.ZodObject<{
        genreHistogram: z.ZodArray<z.ZodObject<{
            genre: z.ZodString;
            count: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            genre: string;
            count: number;
        }, {
            genre: string;
            count: number;
        }>, "many">;
        stabilityScore: z.ZodNumber;
        playlistKeywords: z.ZodArray<z.ZodObject<{
            token: z.ZodString;
            score: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            token: string;
            score: number;
        }, {
            token: string;
            score: number;
        }>, "many">;
        recencyBoost: z.ZodArray<z.ZodObject<{
            genre: z.ZodString;
            boost: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            genre: string;
            boost: number;
        }, {
            genre: string;
            boost: number;
        }>, "many">;
        themesTarget: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        genreHistogram: {
            genre: string;
            count: number;
        }[];
        stabilityScore: number;
        playlistKeywords: {
            token: string;
            score: number;
        }[];
        recencyBoost: {
            genre: string;
            boost: number;
        }[];
        themesTarget: number;
    }, {
        genreHistogram: {
            genre: string;
            count: number;
        }[];
        stabilityScore: number;
        playlistKeywords: {
            token: string;
            score: number;
        }[];
        recencyBoost: {
            genre: string;
            boost: number;
        }[];
        themesTarget: number;
    }>;
}, "strip", z.ZodTypeAny, {
    source: "spotify";
    artists: {
        id: string;
        name: string;
        genres: string[];
        image?: string | undefined;
        popularity?: number | undefined;
    }[];
    playlists: {
        id: string;
        name: string;
        tracksTotal: number;
        public: boolean;
        ownerId: string;
        image?: string | undefined;
        description?: string | undefined;
    }[];
    recentlyPlayed: {
        trackId: string;
        trackName: string;
        artistIds: string[];
        playedAt: string;
    }[];
    fetchedAt: string;
    profile: {
        id: string;
        name: string;
        email?: string | undefined;
        image?: string | undefined;
    };
    timeRanges: {
        medium: {
            topArtistIds: string[];
            topTrackIds: string[];
        };
        short: {
            topArtistIds: string[];
        };
        long: {
            topArtistIds: string[];
        };
    };
    tracks: {
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
    }[];
    derived: {
        genreHistogram: {
            genre: string;
            count: number;
        }[];
        stabilityScore: number;
        playlistKeywords: {
            token: string;
            score: number;
        }[];
        recencyBoost: {
            genre: string;
            boost: number;
        }[];
        themesTarget: number;
    };
}, {
    source: "spotify";
    artists: {
        id: string;
        name: string;
        genres: string[];
        image?: string | undefined;
        popularity?: number | undefined;
    }[];
    playlists: {
        id: string;
        name: string;
        tracksTotal: number;
        public: boolean;
        ownerId: string;
        image?: string | undefined;
        description?: string | undefined;
    }[];
    recentlyPlayed: {
        trackId: string;
        trackName: string;
        artistIds: string[];
        playedAt: string;
    }[];
    fetchedAt: string;
    profile: {
        id: string;
        name: string;
        email?: string | undefined;
        image?: string | undefined;
    };
    timeRanges: {
        medium: {
            topArtistIds: string[];
            topTrackIds: string[];
        };
        short: {
            topArtistIds: string[];
        };
        long: {
            topArtistIds: string[];
        };
    };
    tracks: {
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
    }[];
    derived: {
        genreHistogram: {
            genre: string;
            count: number;
        }[];
        stabilityScore: number;
        playlistKeywords: {
            token: string;
            score: number;
        }[];
        recencyBoost: {
            genre: string;
            boost: number;
        }[];
        themesTarget: number;
    };
}>;
export declare const ThemeEvidenceSchema: z.ZodObject<{
    genres: z.ZodArray<z.ZodString, "many">;
    playlists: z.ZodArray<z.ZodString, "many">;
    recencyHint: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    genres: string[];
    playlists: string[];
    recencyHint?: string | undefined;
}, {
    genres: string[];
    playlists: string[];
    recencyHint?: string | undefined;
}>;
export declare const ThemeSchema: z.ZodObject<{
    name: z.ZodString;
    mood: z.ZodString;
    color: z.ZodString;
    evidence: z.ZodObject<{
        genres: z.ZodArray<z.ZodString, "many">;
        playlists: z.ZodArray<z.ZodString, "many">;
        recencyHint: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        genres: string[];
        playlists: string[];
        recencyHint?: string | undefined;
    }, {
        genres: string[];
        playlists: string[];
        recencyHint?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    color: string;
    name: string;
    mood: string;
    evidence: {
        genres: string[];
        playlists: string[];
        recencyHint?: string | undefined;
    };
}, {
    color: string;
    name: string;
    mood: string;
    evidence: {
        genres: string[];
        playlists: string[];
        recencyHint?: string | undefined;
    };
}>;
export declare const ThemesOutputSchema: z.ZodObject<{
    themes: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        mood: z.ZodString;
        color: z.ZodString;
        evidence: z.ZodObject<{
            genres: z.ZodArray<z.ZodString, "many">;
            playlists: z.ZodArray<z.ZodString, "many">;
            recencyHint: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            genres: string[];
            playlists: string[];
            recencyHint?: string | undefined;
        }, {
            genres: string[];
            playlists: string[];
            recencyHint?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        color: string;
        name: string;
        mood: string;
        evidence: {
            genres: string[];
            playlists: string[];
            recencyHint?: string | undefined;
        };
    }, {
        color: string;
        name: string;
        mood: string;
        evidence: {
            genres: string[];
            playlists: string[];
            recencyHint?: string | undefined;
        };
    }>, "many">;
    weights: z.ZodObject<{
        genreHistogram: z.ZodNumber;
        stability: z.ZodNumber;
        playlists: z.ZodNumber;
        recency: z.ZodNumber;
        tracks: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        playlists: number;
        genreHistogram: number;
        tracks: number;
        stability: number;
        recency: number;
    }, {
        playlists: number;
        genreHistogram: number;
        tracks: number;
        stability: number;
        recency: number;
    }>;
}, "strip", z.ZodTypeAny, {
    themes: {
        color: string;
        name: string;
        mood: string;
        evidence: {
            genres: string[];
            playlists: string[];
            recencyHint?: string | undefined;
        };
    }[];
    weights: {
        playlists: number;
        genreHistogram: number;
        tracks: number;
        stability: number;
        recency: number;
    };
}, {
    themes: {
        color: string;
        name: string;
        mood: string;
        evidence: {
            genres: string[];
            playlists: string[];
            recencyHint?: string | undefined;
        };
    }[];
    weights: {
        playlists: number;
        genreHistogram: number;
        tracks: number;
        stability: number;
        recency: number;
    };
}>;
export type Consolidated = z.infer<typeof ConsolidatedSchema>;
export type ThemesOutput = z.infer<typeof ThemesOutputSchema>;
export type Theme = z.infer<typeof ThemeSchema>;
//# sourceMappingURL=consolidated.d.ts.map