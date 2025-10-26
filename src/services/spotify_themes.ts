import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { ThemesOutputSchema, type ThemesOutput } from '../schemas/themes';
import type { Artist, Track, Playlist, RecentlyPlayedItem } from '../schemas/spotify';

let openaiClient: OpenAI | null = null;

export function initOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AppError(500, 'OPENAI_API_KEY not configured');
  }
  
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey });
  }
  
  return openaiClient;
}

interface SpotifyData {
  topArtists: Artist[];
  topTracks: Track[];
  playlists: Playlist[];
  recentlyPlayed: RecentlyPlayedItem[];
}

function formatSpotifyDataForPrompt(data: SpotifyData): string {
  const sections: string[] = [];

  // Top Artists
  if (data.topArtists.length > 0) {
    sections.push('## Top Artists (Most Listened To)');
    data.topArtists.slice(0, 20).forEach((artist, i) => {
      sections.push(
        `${i + 1}. ${artist.name}${artist.genres.length > 0 ? ` (${artist.genres.join(', ')})` : ''}`
      );
    });
    sections.push('');
  }

  // Top Tracks
  if (data.topTracks.length > 0) {
    sections.push('## Top Tracks (Most Played)');
    data.topTracks.slice(0, 20).forEach((track, i) => {
      const artists = track.artists.map(a => a.name).join(', ');
      sections.push(`${i + 1}. "${track.name}" by ${artists}`);
    });
    sections.push('');
  }

  // Playlists
  if (data.playlists.length > 0) {
    sections.push('## User\'s Playlists');
    data.playlists.forEach((playlist, i) => {
      const desc = playlist.description ? ` - ${playlist.description}` : '';
      sections.push(`${i + 1}. "${playlist.name}"${desc} (${playlist.tracksTotal} tracks)`);
    });
    sections.push('');
  }

  // Recently Played
  if (data.recentlyPlayed.length > 0) {
    sections.push('## Recently Played (Last 50 Songs)');
    const trackCounts = new Map<string, number>();
    data.recentlyPlayed.forEach(item => {
      trackCounts.set(item.trackName, (trackCounts.get(item.trackName) || 0) + 1);
    });
    const sortedTracks = Array.from(trackCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
    
    sortedTracks.forEach(([track, count], i) => {
      sections.push(`${i + 1}. "${track}" (played ${count} time${count > 1 ? 's' : ''})`);
    });
    sections.push('');
  }

  return sections.join('\n');
}

export async function extractMusicThemes(data: SpotifyData): Promise<ThemesOutput> {
  const client = initOpenAI();
  
  const formattedData = formatSpotifyDataForPrompt(data);
  
  const systemPrompt = `You are a cultural and behavioral analyst constructing a user’s “musical orbit” from their Spotify data.

Your job is to identify 3–5 distinct *planets* — recurring worlds, objects, or spaces that capture how this person experiences music across time and context. Each planet should reflect both the user’s identity and how music fits into their daily life.

Go beyond genre tags or mood words. Pay attention to *when*, *how*, and *why* this user listens.

Look for:
- **Temporal patterns** — shifts between day/night, study vs. weekend, long-term favorites vs. recent obsessions.
- **Contextual anchors** — how playlists, artists, and tracks cluster around real activities (studying, driving, running, unwinding).
- **Cultural or aesthetic threads** — niche micro-scenes, subcultures, or eras (e.g., midwest emo, early 2000s indie, chillhop YouTube culture).
- **Emotional subtext** — what kind of mental state or environment this music belongs to (quiet focus, nostalgia, ambition, restlessness).
- **Social or performative edges** — moments where the music suggests shared experience or identity signaling.

Each theme (planet) should:
1. Have a **grounded, evocative name** — a space or object that feels lived in (e.g., “Dorm Window at 2AM”, “Gym Mirror”, “Subway Headphones”, “Roadtrip Speakers”).
2. Include a **one-sentence description** that captures the kind of life or moment it represents.
3. Mention **specific artists, tracks, or playlists** as evidence.
4. Optionally note **temporal shifts** (e.g., “appears mostly in recent listening”, “long-term staple since 2022”).
5. Be **interpretive, not literal** — the goal is to map patterns into personal worlds, not to restate data.

Good examples:
- “Late-Night Study Desk” — focus playlists, ambient and lofi tracks, consistent across years.
- “Freeway Speakers” — upbeat alt/indie tracks played during drives; recent weekend recurrence.
- “Shared Stage” — pop and performance music tied to social energy or rehearsal mood.
- “Sunset Nostalgia Loop” — older indie favorites resurfacing in recent playlists.
- “Global Café” — diverse, language-crossing playlists; cultural curiosity and aesthetic sampling.

Extract 3–5 of these *planets* that best describe this user’s musical world. Each should feel like a distinct space you could walk into.
`;

  const userPrompt = `Analyze this user's Spotify data and extract their core musical themes:\n\n${formattedData}`;

  try {
    logger.info('Calling OpenAI to extract music themes');
    
    const completion = await client.beta.chat.completions.parse({
      model: 'gpt-4o-2024-08-06',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: zodResponseFormat(ThemesOutputSchema, 'themes'),
      temperature: 0.4,
    });

    const response = completion.choices[0].message;
    
    if (response.parsed) {
      logger.info({ themeCount: response.parsed.themes.length }, 'Successfully extracted music themes');
      return response.parsed;
    }

    if (response.refusal) {
      logger.error({ refusal: response.refusal }, 'OpenAI refused to generate themes');
      throw new AppError(500, 'AI refused to analyze music data');
    }

    throw new AppError(500, 'Failed to parse OpenAI response');
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to extract music themes');
    throw new AppError(500, `Failed to analyze music: ${error.message}`);
  }
}

