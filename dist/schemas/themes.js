"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GmailThemesResponseSchema = exports.SpotifyThemesResponseSchema = exports.ThemesOutputSchema = exports.ThemeSchema = exports.ThemeSourceSchema = void 0;
var zod_1 = require("zod");
exports.ThemeSourceSchema = zod_1.z.object({
    title: zod_1.z.string(),
    url: zod_1.z.string().optional(),
    type: zod_1.z.enum(['track', 'artist', 'playlist', 'genre', 'email', 'sender', 'conversation']),
});
exports.ThemeSchema = zod_1.z.object({
    label: zod_1.z.string().describe('A concise, creative label that captures the essence of this theme'),
    rationale: zod_1.z.string().describe('A detailed explanation of why this theme was identified based on the patterns found in the data'),
    sources: zod_1.z.array(exports.ThemeSourceSchema).describe('3-5 specific examples that support this theme'),
});
exports.ThemesOutputSchema = zod_1.z.object({
    themes: zod_1.z.array(exports.ThemeSchema).describe('Distinct themes representing meaningful patterns found in the data'),
});
// API Response schemas for frontend consumption
exports.SpotifyThemesResponseSchema = zod_1.z.object({
    source: zod_1.z.literal('spotify'),
    analyzedAt: zod_1.z.string(),
    themes: zod_1.z.array(exports.ThemeSchema),
});
exports.GmailThemesResponseSchema = zod_1.z.object({
    source: zod_1.z.literal('gmail'),
    provider: zod_1.z.literal('composio'),
    analyzedAt: zod_1.z.string(),
    emailsAnalyzed: zod_1.z.number(),
    windowDays: zod_1.z.number(),
    themes: zod_1.z.array(exports.ThemeSchema),
});
