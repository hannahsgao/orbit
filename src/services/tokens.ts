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

class InMemoryTokenStore implements TokenStore {
  private store = new Map<string, TokenData>();

  get(userId: string): TokenData | undefined {
    return this.store.get(userId);
  }

  set(userId: string, tokens: TokenData): void {
    this.store.set(userId, tokens);
  }

  clear(userId: string): void {
    this.store.delete(userId);
  }
}

export const tokenStore: TokenStore = new InMemoryTokenStore();

