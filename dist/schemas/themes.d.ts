import { z } from 'zod';
export declare const ThemeSourceSchema: z.ZodObject<{
    title: z.ZodString;
    url: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["track", "artist", "playlist", "genre", "email", "sender", "conversation"]>;
}, "strip", z.ZodTypeAny, {
    title: string;
    type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
    url?: string | undefined;
}, {
    title: string;
    type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
    url?: string | undefined;
}>;
export declare const ThemeSchema: z.ZodObject<{
    label: z.ZodString;
    rationale: z.ZodString;
    sources: z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        url: z.ZodOptional<z.ZodString>;
        type: z.ZodEnum<["track", "artist", "playlist", "genre", "email", "sender", "conversation"]>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
        url?: string | undefined;
    }, {
        title: string;
        type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
        url?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    label: string;
    rationale: string;
    sources: {
        title: string;
        type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
        url?: string | undefined;
    }[];
}, {
    label: string;
    rationale: string;
    sources: {
        title: string;
        type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
        url?: string | undefined;
    }[];
}>;
export declare const ThemesOutputSchema: z.ZodObject<{
    themes: z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        rationale: z.ZodString;
        sources: z.ZodArray<z.ZodObject<{
            title: z.ZodString;
            url: z.ZodOptional<z.ZodString>;
            type: z.ZodEnum<["track", "artist", "playlist", "genre", "email", "sender", "conversation"]>;
        }, "strip", z.ZodTypeAny, {
            title: string;
            type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
            url?: string | undefined;
        }, {
            title: string;
            type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
            url?: string | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        label: string;
        rationale: string;
        sources: {
            title: string;
            type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
            url?: string | undefined;
        }[];
    }, {
        label: string;
        rationale: string;
        sources: {
            title: string;
            type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
            url?: string | undefined;
        }[];
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    themes: {
        label: string;
        rationale: string;
        sources: {
            title: string;
            type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
            url?: string | undefined;
        }[];
    }[];
}, {
    themes: {
        label: string;
        rationale: string;
        sources: {
            title: string;
            type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
            url?: string | undefined;
        }[];
    }[];
}>;
export declare const DataSourceSchema: z.ZodObject<{
    weight: z.ZodNumber;
    examples: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    weight: number;
    examples?: string[] | undefined;
}, {
    weight: number;
    examples?: string[] | undefined;
}>;
export declare const VisualPropertiesSchema: z.ZodObject<{
    color: z.ZodString;
    size: z.ZodEnum<["small", "medium", "large"]>;
    imageAsset: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    color: string;
    size: "small" | "medium" | "large";
    imageAsset?: string | undefined;
}, {
    color: string;
    size: "small" | "medium" | "large";
    imageAsset?: string | undefined;
}>;
export declare const OrbitPropertiesSchema: z.ZodObject<{
    orbitRadius: z.ZodNumber;
    orbitSpeed: z.ZodNumber;
    angle: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    orbitRadius: number;
    orbitSpeed: number;
    angle: number;
}, {
    orbitRadius: number;
    orbitSpeed: number;
    angle: number;
}>;
export declare const ThemeNodeSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    rationale: z.ZodString;
    sources: z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        url: z.ZodOptional<z.ZodString>;
        type: z.ZodEnum<["track", "artist", "playlist", "genre", "email", "sender", "conversation"]>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
        url?: string | undefined;
    }, {
        title: string;
        type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
        url?: string | undefined;
    }>, "many">;
    level: z.ZodEnum<["theme", "subtheme", "topic", "detail"]>;
    parentId: z.ZodNullable<z.ZodString>;
    childIds: z.ZodArray<z.ZodString, "many">;
    visualProperties: z.ZodObject<{
        color: z.ZodString;
        size: z.ZodEnum<["small", "medium", "large"]>;
        imageAsset: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        color: string;
        size: "small" | "medium" | "large";
        imageAsset?: string | undefined;
    }, {
        color: string;
        size: "small" | "medium" | "large";
        imageAsset?: string | undefined;
    }>;
    dataSources: z.ZodObject<{
        spotify: z.ZodOptional<z.ZodObject<{
            weight: z.ZodNumber;
            examples: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            weight: number;
            examples?: string[] | undefined;
        }, {
            weight: number;
            examples?: string[] | undefined;
        }>>;
        gmail: z.ZodOptional<z.ZodObject<{
            weight: z.ZodNumber;
            examples: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            weight: number;
            examples?: string[] | undefined;
        }, {
            weight: number;
            examples?: string[] | undefined;
        }>>;
        search: z.ZodOptional<z.ZodObject<{
            weight: z.ZodNumber;
            examples: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            weight: number;
            examples?: string[] | undefined;
        }, {
            weight: number;
            examples?: string[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        spotify?: {
            weight: number;
            examples?: string[] | undefined;
        } | undefined;
        gmail?: {
            weight: number;
            examples?: string[] | undefined;
        } | undefined;
        search?: {
            weight: number;
            examples?: string[] | undefined;
        } | undefined;
    }, {
        spotify?: {
            weight: number;
            examples?: string[] | undefined;
        } | undefined;
        gmail?: {
            weight: number;
            examples?: string[] | undefined;
        } | undefined;
        search?: {
            weight: number;
            examples?: string[] | undefined;
        } | undefined;
    }>;
    orbitProperties: z.ZodOptional<z.ZodObject<{
        orbitRadius: z.ZodNumber;
        orbitSpeed: z.ZodNumber;
        angle: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        orbitRadius: number;
        orbitSpeed: number;
        angle: number;
    }, {
        orbitRadius: number;
        orbitSpeed: number;
        angle: number;
    }>>;
    hasSpawnedChildren: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    level: "theme" | "subtheme" | "topic" | "detail";
    label: string;
    rationale: string;
    sources: {
        title: string;
        type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
        url?: string | undefined;
    }[];
    id: string;
    parentId: string | null;
    childIds: string[];
    visualProperties: {
        color: string;
        size: "small" | "medium" | "large";
        imageAsset?: string | undefined;
    };
    dataSources: {
        spotify?: {
            weight: number;
            examples?: string[] | undefined;
        } | undefined;
        gmail?: {
            weight: number;
            examples?: string[] | undefined;
        } | undefined;
        search?: {
            weight: number;
            examples?: string[] | undefined;
        } | undefined;
    };
    hasSpawnedChildren: boolean;
    orbitProperties?: {
        orbitRadius: number;
        orbitSpeed: number;
        angle: number;
    } | undefined;
}, {
    level: "theme" | "subtheme" | "topic" | "detail";
    label: string;
    rationale: string;
    sources: {
        title: string;
        type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
        url?: string | undefined;
    }[];
    id: string;
    parentId: string | null;
    childIds: string[];
    visualProperties: {
        color: string;
        size: "small" | "medium" | "large";
        imageAsset?: string | undefined;
    };
    dataSources: {
        spotify?: {
            weight: number;
            examples?: string[] | undefined;
        } | undefined;
        gmail?: {
            weight: number;
            examples?: string[] | undefined;
        } | undefined;
        search?: {
            weight: number;
            examples?: string[] | undefined;
        } | undefined;
    };
    orbitProperties?: {
        orbitRadius: number;
        orbitSpeed: number;
        angle: number;
    } | undefined;
    hasSpawnedChildren?: boolean | undefined;
}>;
export declare const SpotifyThemesResponseSchema: z.ZodObject<{
    source: z.ZodLiteral<"spotify">;
    analyzedAt: z.ZodString;
    themes: z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        rationale: z.ZodString;
        sources: z.ZodArray<z.ZodObject<{
            title: z.ZodString;
            url: z.ZodOptional<z.ZodString>;
            type: z.ZodEnum<["track", "artist", "playlist", "genre", "email", "sender", "conversation"]>;
        }, "strip", z.ZodTypeAny, {
            title: string;
            type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
            url?: string | undefined;
        }, {
            title: string;
            type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
            url?: string | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        label: string;
        rationale: string;
        sources: {
            title: string;
            type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
            url?: string | undefined;
        }[];
    }, {
        label: string;
        rationale: string;
        sources: {
            title: string;
            type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
            url?: string | undefined;
        }[];
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    themes: {
        label: string;
        rationale: string;
        sources: {
            title: string;
            type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
            url?: string | undefined;
        }[];
    }[];
    source: "spotify";
    analyzedAt: string;
}, {
    themes: {
        label: string;
        rationale: string;
        sources: {
            title: string;
            type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
            url?: string | undefined;
        }[];
    }[];
    source: "spotify";
    analyzedAt: string;
}>;
export declare const GmailThemesResponseSchema: z.ZodObject<{
    source: z.ZodLiteral<"gmail">;
    provider: z.ZodLiteral<"composio">;
    analyzedAt: z.ZodString;
    emailsAnalyzed: z.ZodNumber;
    windowDays: z.ZodNumber;
    themes: z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        rationale: z.ZodString;
        sources: z.ZodArray<z.ZodObject<{
            title: z.ZodString;
            url: z.ZodOptional<z.ZodString>;
            type: z.ZodEnum<["track", "artist", "playlist", "genre", "email", "sender", "conversation"]>;
        }, "strip", z.ZodTypeAny, {
            title: string;
            type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
            url?: string | undefined;
        }, {
            title: string;
            type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
            url?: string | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        label: string;
        rationale: string;
        sources: {
            title: string;
            type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
            url?: string | undefined;
        }[];
    }, {
        label: string;
        rationale: string;
        sources: {
            title: string;
            type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
            url?: string | undefined;
        }[];
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    themes: {
        label: string;
        rationale: string;
        sources: {
            title: string;
            type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
            url?: string | undefined;
        }[];
    }[];
    source: "gmail";
    analyzedAt: string;
    provider: "composio";
    emailsAnalyzed: number;
    windowDays: number;
}, {
    themes: {
        label: string;
        rationale: string;
        sources: {
            title: string;
            type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
            url?: string | undefined;
        }[];
    }[];
    source: "gmail";
    analyzedAt: string;
    provider: "composio";
    emailsAnalyzed: number;
    windowDays: number;
}>;
export declare const PersonalityTreeSchema: z.ZodObject<{
    userId: z.ZodString;
    generatedAt: z.ZodString;
    dataTimeRange: z.ZodObject<{
        start: z.ZodString;
        end: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        end: string;
        start: string;
    }, {
        end: string;
        start: string;
    }>;
    nodes: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        rationale: z.ZodString;
        sources: z.ZodArray<z.ZodObject<{
            title: z.ZodString;
            url: z.ZodOptional<z.ZodString>;
            type: z.ZodEnum<["track", "artist", "playlist", "genre", "email", "sender", "conversation"]>;
        }, "strip", z.ZodTypeAny, {
            title: string;
            type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
            url?: string | undefined;
        }, {
            title: string;
            type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
            url?: string | undefined;
        }>, "many">;
        level: z.ZodEnum<["theme", "subtheme", "topic", "detail"]>;
        parentId: z.ZodNullable<z.ZodString>;
        childIds: z.ZodArray<z.ZodString, "many">;
        visualProperties: z.ZodObject<{
            color: z.ZodString;
            size: z.ZodEnum<["small", "medium", "large"]>;
            imageAsset: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            color: string;
            size: "small" | "medium" | "large";
            imageAsset?: string | undefined;
        }, {
            color: string;
            size: "small" | "medium" | "large";
            imageAsset?: string | undefined;
        }>;
        dataSources: z.ZodObject<{
            spotify: z.ZodOptional<z.ZodObject<{
                weight: z.ZodNumber;
                examples: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                weight: number;
                examples?: string[] | undefined;
            }, {
                weight: number;
                examples?: string[] | undefined;
            }>>;
            gmail: z.ZodOptional<z.ZodObject<{
                weight: z.ZodNumber;
                examples: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                weight: number;
                examples?: string[] | undefined;
            }, {
                weight: number;
                examples?: string[] | undefined;
            }>>;
            search: z.ZodOptional<z.ZodObject<{
                weight: z.ZodNumber;
                examples: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                weight: number;
                examples?: string[] | undefined;
            }, {
                weight: number;
                examples?: string[] | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            spotify?: {
                weight: number;
                examples?: string[] | undefined;
            } | undefined;
            gmail?: {
                weight: number;
                examples?: string[] | undefined;
            } | undefined;
            search?: {
                weight: number;
                examples?: string[] | undefined;
            } | undefined;
        }, {
            spotify?: {
                weight: number;
                examples?: string[] | undefined;
            } | undefined;
            gmail?: {
                weight: number;
                examples?: string[] | undefined;
            } | undefined;
            search?: {
                weight: number;
                examples?: string[] | undefined;
            } | undefined;
        }>;
        orbitProperties: z.ZodOptional<z.ZodObject<{
            orbitRadius: z.ZodNumber;
            orbitSpeed: z.ZodNumber;
            angle: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            orbitRadius: number;
            orbitSpeed: number;
            angle: number;
        }, {
            orbitRadius: number;
            orbitSpeed: number;
            angle: number;
        }>>;
        hasSpawnedChildren: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        level: "theme" | "subtheme" | "topic" | "detail";
        label: string;
        rationale: string;
        sources: {
            title: string;
            type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
            url?: string | undefined;
        }[];
        id: string;
        parentId: string | null;
        childIds: string[];
        visualProperties: {
            color: string;
            size: "small" | "medium" | "large";
            imageAsset?: string | undefined;
        };
        dataSources: {
            spotify?: {
                weight: number;
                examples?: string[] | undefined;
            } | undefined;
            gmail?: {
                weight: number;
                examples?: string[] | undefined;
            } | undefined;
            search?: {
                weight: number;
                examples?: string[] | undefined;
            } | undefined;
        };
        hasSpawnedChildren: boolean;
        orbitProperties?: {
            orbitRadius: number;
            orbitSpeed: number;
            angle: number;
        } | undefined;
    }, {
        level: "theme" | "subtheme" | "topic" | "detail";
        label: string;
        rationale: string;
        sources: {
            title: string;
            type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
            url?: string | undefined;
        }[];
        id: string;
        parentId: string | null;
        childIds: string[];
        visualProperties: {
            color: string;
            size: "small" | "medium" | "large";
            imageAsset?: string | undefined;
        };
        dataSources: {
            spotify?: {
                weight: number;
                examples?: string[] | undefined;
            } | undefined;
            gmail?: {
                weight: number;
                examples?: string[] | undefined;
            } | undefined;
            search?: {
                weight: number;
                examples?: string[] | undefined;
            } | undefined;
        };
        orbitProperties?: {
            orbitRadius: number;
            orbitSpeed: number;
            angle: number;
        } | undefined;
        hasSpawnedChildren?: boolean | undefined;
    }>, "many">;
    rootThemeIds: z.ZodArray<z.ZodString, "many">;
    summary: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    generatedAt: string;
    dataTimeRange: {
        end: string;
        start: string;
    };
    nodes: {
        level: "theme" | "subtheme" | "topic" | "detail";
        label: string;
        rationale: string;
        sources: {
            title: string;
            type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
            url?: string | undefined;
        }[];
        id: string;
        parentId: string | null;
        childIds: string[];
        visualProperties: {
            color: string;
            size: "small" | "medium" | "large";
            imageAsset?: string | undefined;
        };
        dataSources: {
            spotify?: {
                weight: number;
                examples?: string[] | undefined;
            } | undefined;
            gmail?: {
                weight: number;
                examples?: string[] | undefined;
            } | undefined;
            search?: {
                weight: number;
                examples?: string[] | undefined;
            } | undefined;
        };
        hasSpawnedChildren: boolean;
        orbitProperties?: {
            orbitRadius: number;
            orbitSpeed: number;
            angle: number;
        } | undefined;
    }[];
    rootThemeIds: string[];
    summary?: string | undefined;
}, {
    userId: string;
    generatedAt: string;
    dataTimeRange: {
        end: string;
        start: string;
    };
    nodes: {
        level: "theme" | "subtheme" | "topic" | "detail";
        label: string;
        rationale: string;
        sources: {
            title: string;
            type: "track" | "artist" | "playlist" | "genre" | "email" | "sender" | "conversation";
            url?: string | undefined;
        }[];
        id: string;
        parentId: string | null;
        childIds: string[];
        visualProperties: {
            color: string;
            size: "small" | "medium" | "large";
            imageAsset?: string | undefined;
        };
        dataSources: {
            spotify?: {
                weight: number;
                examples?: string[] | undefined;
            } | undefined;
            gmail?: {
                weight: number;
                examples?: string[] | undefined;
            } | undefined;
            search?: {
                weight: number;
                examples?: string[] | undefined;
            } | undefined;
        };
        orbitProperties?: {
            orbitRadius: number;
            orbitSpeed: number;
            angle: number;
        } | undefined;
        hasSpawnedChildren?: boolean | undefined;
    }[];
    rootThemeIds: string[];
    summary?: string | undefined;
}>;
export type ThemeSource = z.infer<typeof ThemeSourceSchema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type ThemesOutput = z.infer<typeof ThemesOutputSchema>;
export type DataSource = z.infer<typeof DataSourceSchema>;
export type VisualProperties = z.infer<typeof VisualPropertiesSchema>;
export type OrbitProperties = z.infer<typeof OrbitPropertiesSchema>;
export type ThemeNode = z.infer<typeof ThemeNodeSchema>;
export type PersonalityTree = z.infer<typeof PersonalityTreeSchema>;
export type SpotifyThemesResponse = z.infer<typeof SpotifyThemesResponseSchema>;
export type GmailThemesResponse = z.infer<typeof GmailThemesResponseSchema>;
//# sourceMappingURL=themes.d.ts.map