import { z } from 'zod';

export const ThemeSourceSchema = z.object({
  title: z.string(),
  url: z.string().optional(),
  type: z.enum(['track', 'artist', 'playlist', 'genre', 'email', 'sender', 'conversation']),
});

export const ThemeSchema = z.object({
  label: z.string().describe('A concise, creative label that captures the essence of this theme'),
  rationale: z.string().describe('A detailed explanation of why this theme was identified based on the patterns found in the data'),
  sources: z.array(ThemeSourceSchema).describe('3-5 specific examples that support this theme'),
});

export const ThemesOutputSchema = z.object({
  themes: z.array(ThemeSchema).describe('Distinct themes representing meaningful patterns found in the data'),
});

// API Response schemas for frontend consumption
export const SpotifyThemesResponseSchema = z.object({
  source: z.literal('spotify'),
  analyzedAt: z.string(),
  themes: z.array(ThemeSchema),
});

export const GmailThemesResponseSchema = z.object({
  source: z.literal('gmail'),
  provider: z.literal('composio'),
  analyzedAt: z.string(),
  emailsAnalyzed: z.number(),
  windowDays: z.number(),
  themes: z.array(ThemeSchema),
});

export type ThemeSource = z.infer<typeof ThemeSourceSchema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type ThemesOutput = z.infer<typeof ThemesOutputSchema>;
export type SpotifyThemesResponse = z.infer<typeof SpotifyThemesResponseSchema>;
export type GmailThemesResponse = z.infer<typeof GmailThemesResponseSchema>;

