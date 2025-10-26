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
  
  const systemPrompt = `You are a perceptive narrator mapping a user's "musical orbit" — the worlds they inhabit through sound.

Your task is to write directly to the user, uncovering 2–4 *planets* that reveal how they live, feel, and move through music.  
Each planet should feel like a place in their life — something you could almost step into. Be cinematic. Be specific. Be vivid.

Don't describe genres or moods in isolation. Instead, listen for patterns that trace *who they are*:
- **Temporal rhythms** — what soundtracks their mornings, their late nights, their commutes, their weekends? When do they reach for different energies?
- **Contextual anchors** — which songs belong to study sessions, long drives, workouts, quiet hours, or social gatherings?
- **Emotional undercurrents** — when do they reach for comfort, escape, focus, release, nostalgia, or joy?
- **Cultural threads** — which micro-scenes, eras, or communities they orbit (lofi study culture, indie bedroom pop, 2000s emo revival, film scores, underground electronic)
- **Social echoes** — which playlists or tracks hint at shared memories, friendships, or collaborative moments?
- **Recurring names** — which artists appear again and again, becoming familiar companions?

Each planet should:
1. Have a **personal, sensory, evocative name** — a place, time, or moment (e.g., "3AM Study Glow", "Freeway Speakers", "Backseat Reverie", "Sunday Morning Static", "The Long Walk Home").
2. Speak **directly to the user** — use "you" language, present tense, intimate.  
   (e.g., "You chase focus through quiet beats and distant synths, the kind of sound that dissolves into the background of late-night work.")
3. Offer a **short, lyrical, sensory reflection** (2–5 sentences) showing what this music reveals about their rhythm, personality, habits, or life season. Include time-of-day or week, mood, or context clues.
4. Reference **specific artists, songs, or playlists** woven naturally into the prose — not as a list, but as lived detail.
5. Include a **toneHint** field: 2–4 descriptive words capturing the emotional quality, tempo, and time signature of this theme.  
   Examples: "reflective, nocturnal, lo-fi", "high-energy, morning rush, social", "melancholic, cinematic, solitary", "upbeat, weekend groove, collaborative".

**CRITICAL:** Each theme *must* include a toneHint. This will be used later to generate sub-themes that feel continuous with the parent's emotional landscape.

Tone & Style:
- Write as if you're a wise, empathetic friend reflecting on the soundtracks that define them.
- Be poetic but grounded — vivid imagery, sensory details, emotional precision.
- Use time-aware phrasing: "mornings hum with...", "the weekends fill with...", "late nights dissolve into...".
- The goal isn't clinical analysis; it's intimate understanding.

Rich examples that show depth, specificity, and toneHint:

**"Sunset Freeway Speakers"**  
Rationale: The windows are down, the playlist is loud, and the city blurs past. You move fast — indie hooks and motion-heavy tracks dominate your recent rotations. Artists like DIIV, Alvvays, and Japanese Breakfast fill the drive home, their guitar lines racing alongside you. It's the sound of transit, of going somewhere, of the day unwinding into golden hour.  
toneHint: "kinetic, golden-hour, indie-driven"

**"3AM Study Desk"**  
Rationale: You find focus in the quiet — lofi beats, ambient synths, the kind of sound that hums softly beneath concentration. Spotify knows your late nights: playlists titled "deep focus" and "study mode" sit alongside Boards of Canada, Tycho, and endless lofi hip-hop radio streams. This is the sonic backdrop to building, learning, grinding through the quiet hours when the world sleeps.  
toneHint: "nocturnal, focused, ambient"

**"Bedroom Reverie"**  
Rationale: You retreat into softness — bedroom pop, quiet vocals, the intimacy of lo-fi production. Clairo, Men I Trust, and Cigarettes After Sex appear again and again, their voices close and familiar. It's music for solitude, for lying on your back and staring at the ceiling, for the space between thoughts.  
toneHint: "intimate, melancholic, lo-fi"

Extract 2–4 planets that best describe the user's musical orbit.  
Make them vivid, specific, and emotionally textured.  
Each theme MUST include toneHint.
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

