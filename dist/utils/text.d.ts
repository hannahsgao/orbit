export declare function tokenize(text: string): string[];
export declare function computeTermFrequency(tokens: string[]): Map<string, number>;
export declare function scoreTokens(freq: Map<string, number>, totalDocs: number): Array<{
    token: string;
    score: number;
}>;
export declare const THEME_KEYWORDS: {
    calm: string[];
    motion: string[];
    melancholy: string[];
    joy: string[];
    curiosity: string[];
    nostalgia: string[];
};
export declare function mapTokensToThemes(tokens: string[]): Map<string, number>;
//# sourceMappingURL=text.d.ts.map