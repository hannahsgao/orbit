import OpenAI from 'openai';
import { type ThemesOutput } from '../schemas/themes';
import type { Artist, Track, Playlist, RecentlyPlayedItem } from '../schemas/spotify';
export declare function initOpenAI(): OpenAI;
interface SpotifyData {
    topArtists: Artist[];
    topTracks: Track[];
    playlists: Playlist[];
    recentlyPlayed: RecentlyPlayedItem[];
}
export declare function extractMusicThemes(data: SpotifyData): Promise<ThemesOutput>;
export {};
//# sourceMappingURL=openai.d.ts.map