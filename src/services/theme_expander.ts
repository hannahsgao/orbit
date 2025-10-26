import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { z } from 'zod';

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

// Schema for sub-theme generation
const SubThemeSchema = z.object({
  label: z.string().describe('Concise label for the sub-theme'),
  rationale: z.string().describe('Why this sub-theme exists within the parent theme'),
  sources: z.array(z.object({
    title: z.string(),
    type: z.enum(['track', 'artist', 'playlist', 'genre', 'email', 'sender', 'conversation', 'detail']),
  })).describe('2-3 specific examples'),
});

const SubThemesOutputSchema = z.object({
  subthemes: z.array(SubThemeSchema).describe('2-4 sub-themes that dive deeper into the parent theme'),
});

export interface ParentTheme {
  label: string;
  rationale: string;
  sources: Array<{
    title: string;
    type: string;
  }>;
  level: string;
  dataSource: 'spotify' | 'gmail' | 'mixed';
}

export interface ExpandThemeRequest {
  parentTheme: ParentTheme;
  userContext?: {
    userId: string;
    otherThemes?: string[]; // Labels of other themes for context
  };
}

/**
 * Generate sub-themes for a given parent theme using LLM
 */
export async function expandTheme(request: ExpandThemeRequest) {
  const client = initOpenAI();
  const { parentTheme } = request;

  // Build context-aware prompt
  const sourceType = parentTheme.dataSource;
  const sourceExamples = parentTheme.sources.map(s => s.title).join(', ');

  let systemPrompt = '';
  
  if (sourceType === 'spotify') {
    systemPrompt = `You are a music analyst helping to explore deeper aspects of a user's musical theme.

The user has a theme called "${parentTheme.label}" with this rationale:
"${parentTheme.rationale}"

Evidence: ${sourceExamples}

Your job is to identify 2-4 **sub-themes** that represent more specific or nuanced aspects of this theme.

Each sub-theme should:
1. Be a natural subdivision or specific aspect of "${parentTheme.label}"
2. Maintain the same tone and insight as the parent
3. Reference 2-3 specific examples from the user's music that support it
4. Feel like you're zooming into a specific corner of the parent theme

Good examples:
If parent is "Late-Night Study Desk" → ["Lofi Hip-Hop Focus", "Ambient Instrumental Flow", "Coffee Shop Acoustics"]
If parent is "Workout Energy" → ["Cardio Tempo Hits", "Weightlifting Power Tracks", "Cool-Down Rhythms"]

Generate sub-themes that feel like natural expansions of "${parentTheme.label}".`;
  } else if (sourceType === 'gmail') {
    systemPrompt = `You are a life analyst helping to explore deeper aspects of a user's communication theme.

The user has a theme called "${parentTheme.label}" with this rationale:
"${parentTheme.rationale}"

Evidence: ${sourceExamples}

Your job is to identify 2-4 **sub-themes** that represent more specific aspects of this life area.

Each sub-theme should:
1. Be a natural subdivision of "${parentTheme.label}"
2. Maintain the personal, narrative tone
3. Reference 2-3 specific examples (senders, subject patterns, or conversation types)
4. Feel like zooming into a specific part of their life

Good examples:
If parent is "Project Command Center" → ["Weekend Deadline Sprints", "Client Check-ins", "Team Collaboration"]
If parent is "Learning Journey" → ["Course Enrollments", "Tutorial Deep-Dives", "Knowledge Sharing"]

Generate sub-themes that naturally expand "${parentTheme.label}".`;
  } else {
    systemPrompt = `You are analyzing a multi-source theme about a user's interests and activities.

The user has a theme called "${parentTheme.label}" with this rationale:
"${parentTheme.rationale}"

Evidence: ${sourceExamples}

Your job is to identify 2-4 **sub-themes** that dive deeper into specific aspects.

Each sub-theme should:
1. Represent a focused aspect of "${parentTheme.label}"
2. Feel personal and specific to this user
3. Include 2-3 concrete examples
4. Maintain the insight and tone of the parent

Generate sub-themes that naturally expand "${parentTheme.label}".`;
  }

  try {
    logger.info({ parentLabel: parentTheme.label }, 'Expanding theme with LLM');

    const completion = await client.beta.chat.completions.parse({
      model: 'gpt-4o-2024-08-06',
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `Generate 2-4 sub-themes that explore different aspects of "${parentTheme.label}".`
        },
      ],
      response_format: zodResponseFormat(SubThemesOutputSchema, 'subthemes'),
      temperature: 0.7, // Slightly higher for creative sub-theme generation
    });

    const response = completion.choices[0].message;

    if (response.parsed) {
      logger.info({ 
        parentLabel: parentTheme.label, 
        subthemeCount: response.parsed.subthemes.length 
      }, 'Successfully generated sub-themes');
      return response.parsed.subthemes;
    }

    if (response.refusal) {
      logger.error({ refusal: response.refusal }, 'OpenAI refused to generate sub-themes');
      throw new AppError(500, 'AI refused to generate sub-themes');
    }

    throw new AppError(500, 'Failed to parse OpenAI response');
  } catch (error: any) {
    logger.error({ error: error.message, parentLabel: parentTheme.label }, 'Failed to expand theme');
    throw new AppError(500, `Failed to generate sub-themes: ${error.message}`);
  }
}

