export declare function redactEmail(email: string): string;
export declare function parseFromHeader(from: string): {
    name: string;
    email: string;
};
export declare function shouldRedactSubject(subject: string): boolean;
export declare function truncateSubject(subject: string, maxLength?: number): string;
export declare function tokenizeSubject(subject: string): string[];
export declare function extractNGrams(tokens: string[], n?: number): string[];
export declare function computeTopTokens(subjects: string[], topK?: number): Array<{
    token: string;
    score: number;
}>;
//# sourceMappingURL=redact.d.ts.map