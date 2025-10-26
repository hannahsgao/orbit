interface EnvConfig {
    SERVER_PORT: string;
    ORIGIN?: string;
    SPOTIFY_CLIENT_ID?: string;
    SPOTIFY_CLIENT_SECRET?: string;
    SPOTIFY_REDIRECT_URI?: string;
    COMPOSIO_API_KEY?: string;
    OPENAI_API_KEY?: string;
    MOCK_MODE?: string;
}
export declare function validateEnv(): void;
export declare function getEnv(): EnvConfig;
export {};
//# sourceMappingURL=env.d.ts.map