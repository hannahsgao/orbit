import OpenAI from 'openai';
import { type ThemesOutput } from '../schemas/themes';
import type { ProcessedEmail } from '../utils/email-cleaner';
export declare function initOpenAI(): OpenAI;
interface GmailData {
    emails: ProcessedEmail[];
    totalCount: number;
    windowDays: number;
}
export declare function extractGmailThemes(data: GmailData): Promise<ThemesOutput>;
export {};
//# sourceMappingURL=gmail_themes.d.ts.map