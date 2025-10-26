import { z } from 'zod';
import { UserProfileSchema, ArtistSchema, TrackSchema, PlaylistSchema, RecentlyPlayedItemSchema } from './spotify';

export const GenreHistogramSchema = z.object({
  genre: z.string(),
  count: z.number(),
});

export const PlaylistKeywordSchema = z.object({
  token: z.string(),
  score: z.number(),
});

export const RecencyBoostSchema = z.object({
  genre: z.string(),
  boost: z.number(),
});

export const DerivedMetricsSchema = z.object({
  genreHistogram: z.array(GenreHistogramSchema),
  stabilityScore: z.number(),
  playlistKeywords: z.array(PlaylistKeywordSchema),
  recencyBoost: z.array(RecencyBoostSchema),
  themesTarget: z.number(),
});

export const TimeRangesSchema = z.object({
  short: z.object({
    topArtistIds: z.array(z.string()),
  }),
  medium: z.object({
    topArtistIds: z.array(z.string()),
    topTrackIds: z.array(z.string()),
  }),
  long: z.object({
    topArtistIds: z.array(z.string()),
  }),
});

export const ConsolidatedSchema = z.object({
  source: z.literal('spotify'),
  fetchedAt: z.string(),
  profile: UserProfileSchema,
  timeRanges: TimeRangesSchema,
  artists: z.array(ArtistSchema),
  tracks: z.array(TrackSchema),
  playlists: z.array(PlaylistSchema),
  recentlyPlayed: z.array(RecentlyPlayedItemSchema),
  derived: DerivedMetricsSchema,
});

export const ThemeEvidenceSchema = z.object({
  genres: z.array(z.string()),
  playlists: z.array(z.string()),
  recencyHint: z.string().optional(),
});

export const ThemeSchema = z.object({
  name: z.string(),
  mood: z.string(),
  color: z.string(),
  evidence: ThemeEvidenceSchema,
});

export const ThemesOutputSchema = z.object({
  themes: z.array(ThemeSchema),
  weights: z.object({
    genreHistogram: z.number(),
    stability: z.number(),
    playlists: z.number(),
    recency: z.number(),
    tracks: z.number(),
  }),
});

export type Consolidated = z.infer<typeof ConsolidatedSchema>;
export type ThemesOutput = z.infer<typeof ThemesOutputSchema>;
export type Theme = z.infer<typeof ThemeSchema>;

