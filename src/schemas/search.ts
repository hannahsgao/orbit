import { z } from 'zod';
import { ThemeSchema } from './themes';

export const SearchItemSchema = z.object({
  search: z.string(),
  timestamp: z.string(),
  searchType: z.enum(['text', 'image', 'video']),
});

export const SearchHistoryResponseSchema = z.object({
  source: z.literal('search'),
  analyzedAt: z.string(),
  searchesAnalyzed: z.number(),
  searches: z.array(SearchItemSchema),
});

export const SearchThemesResponseSchema = z.object({
  source: z.literal('search'),
  analyzedAt: z.string(),
  searchesAnalyzed: z.number(),
  themes: z.array(ThemeSchema),
});

export type SearchItem = z.infer<typeof SearchItemSchema>;
export type SearchHistoryResponse = z.infer<typeof SearchHistoryResponseSchema>;
export type SearchThemesResponse = z.infer<typeof SearchThemesResponseSchema>;

