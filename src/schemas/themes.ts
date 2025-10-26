import { z } from 'zod';

export const ThemeSourceSchema = z.object({
  title: z.string(),
  url: z.string().optional(),
  type: z.enum(['track', 'artist', 'playlist', 'genre']),
});

export const MusicThemeSchema = z.object({
  label: z.string().describe('A concise label for this theme (e.g., "Electronic Exploration", "Indie Nostalgia")'),
  rationale: z.string().describe('A detailed explanation of why this theme was identified based on the user\'s listening patterns'),
  sources: z.array(ThemeSourceSchema).describe('3-5 specific songs, artists, or playlists that support this theme'),
});

export const ThemesOutputSchema = z.object({
  themes: z.array(MusicThemeSchema).describe('5-7 distinct themes representing the user\'s musical identity and interests'),
});

export type ThemeSource = z.infer<typeof ThemeSourceSchema>;
export type MusicTheme = z.infer<typeof MusicThemeSchema>;
export type ThemesOutput = z.infer<typeof ThemesOutputSchema>;

