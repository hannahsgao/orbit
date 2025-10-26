declare const SPOTIFY_API_BASE = "https://api.spotify.com/v1";
export declare function spotifyGet<T>(url: string, accessToken: string, retryOn429?: boolean): Promise<T>;
export declare function spotifyPaginate<T>(url: string, accessToken: string, itemsKey?: string): Promise<T[]>;
export declare function exchangeCodeForTokens(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
}>;
export declare function refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    expires_in: number;
}>;
export { SPOTIFY_API_BASE };
//# sourceMappingURL=spotify.d.ts.map