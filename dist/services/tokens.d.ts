export interface TokenData {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}
export interface TokenStore {
    get(userId: string): TokenData | undefined;
    set(userId: string, tokens: TokenData): void;
    clear(userId: string): void;
}
export declare const tokenStore: TokenStore;
//# sourceMappingURL=tokens.d.ts.map