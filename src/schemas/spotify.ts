import { z } from 'zod';

export const UserProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().optional(),
  image: z.string().url().optional(),
});

export const ArtistSchema = z.object({
  id: z.string(),
  name: z.string(),
  genres: z.array(z.string()),
  image: z.string().url().optional(),
  popularity: z.number().optional(),
});

export const TrackArtistSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const TrackAlbumSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string().url().optional(),
});

export const TrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  artists: z.array(TrackArtistSchema),
  album: TrackAlbumSchema,
  popularity: z.number().optional(),
});

export const PlaylistSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  image: z.string().url().optional(),
  tracksTotal: z.number(),
  public: z.boolean(),
  ownerId: z.string(),
});

export const RecentlyPlayedItemSchema = z.object({
  trackId: z.string(),
  trackName: z.string(),
  artistIds: z.array(z.string()),
  playedAt: z.string(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type Artist = z.infer<typeof ArtistSchema>;
export type Track = z.infer<typeof TrackSchema>;
export type Playlist = z.infer<typeof PlaylistSchema>;
export type RecentlyPlayedItem = z.infer<typeof RecentlyPlayedItemSchema>;

