"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initOpenAI = initOpenAI;
exports.extractMusicThemes = extractMusicThemes;
const openai_1 = __importDefault(require("openai"));
const zod_1 = require("openai/helpers/zod");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const themes_1 = require("../schemas/themes");
let openaiClient = null;
function initOpenAI() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new errors_1.AppError(500, 'OPENAI_API_KEY not configured');
    }
    if (!openaiClient) {
        openaiClient = new openai_1.default({ apiKey });
    }
    return openaiClient;
}
function formatSpotifyDataForPrompt(data) {
    const sections = [];
    // Top Artists
    if (data.topArtists.length > 0) {
        sections.push('## Top Artists (Most Listened To)');
        data.topArtists.slice(0, 20).forEach((artist, i) => {
            sections.push(`${i + 1}. ${artist.name}${artist.genres.length > 0 ? ` (${artist.genres.join(', ')})` : ''}`);
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
        const trackCounts = new Map();
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
async function extractMusicThemes(data) {
    const client = initOpenAI();
    const formattedData = formatSpotifyDataForPrompt(data);
    const systemPrompt = `You are a music psychologist and cultural analyst. Your task is to analyze a user's Spotify listening data and extract deep, meaningful themes about their musical identity and life interests.

Go beyond surface-level genre categorization. Look for:
- Emotional patterns (e.g., comfort-seeking, high-energy, melancholic)
- Life contexts (e.g., study music, workout energy, social moments)
- Cultural interests (e.g., indie culture, nostalgic 90s, global sounds)
- Personality traits reflected in music choices
- Temporal patterns (e.g., what they listen to recently vs. all-time favorites)

Each theme should:
1. Have a creative, specific label (avoid generic terms like "Pop Music")
2. Provide psychological/cultural insight in the rationale
3. Reference specific songs, artists, or playlists as evidence

Aim for 5-7 distinct themes that paint a rich picture of who this person is through their music.`;
    const userPrompt = `Analyze this user's Spotify data and extract their core musical themes:\n\n${formattedData}`;
    try {
        logger_1.logger.info('Calling OpenAI to extract music themes');
        const completion = await client.beta.chat.completions.parse({
            model: 'gpt-4o-2024-08-06',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            response_format: (0, zod_1.zodResponseFormat)(themes_1.ThemesOutputSchema, 'themes'),
            temperature: 0.7,
        });
        const response = completion.choices[0].message;
        if (response.parsed) {
            logger_1.logger.info({ themeCount: response.parsed.themes.length }, 'Successfully extracted music themes');
            return response.parsed;
        }
        if (response.refusal) {
            logger_1.logger.error({ refusal: response.refusal }, 'OpenAI refused to generate themes');
            throw new errors_1.AppError(500, 'AI refused to analyze music data');
        }
        throw new errors_1.AppError(500, 'Failed to parse OpenAI response');
    }
    catch (error) {
        logger_1.logger.error({ error: error.message }, 'Failed to extract music themes');
        throw new errors_1.AppError(500, `Failed to analyze music: ${error.message}`);
    }
}
//# sourceMappingURL=openai.js.map