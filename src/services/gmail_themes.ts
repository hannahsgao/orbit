import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { ThemesOutputSchema, type ThemesOutput } from '../schemas/themes';
import type { ProcessedEmail } from '../utils/email-cleaner';

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

interface GmailData {
  emails: ProcessedEmail[];
  totalCount: number;
  windowDays: number;
}

function formatGmailDataForPrompt(data: GmailData): string {
  const sections: string[] = [];

  sections.push(`# Email Analysis Context`);
  sections.push(`Total emails: ${data.totalCount}`);
  sections.push(`Time window: Last ${data.windowDays} days`);
  sections.push('');

  sections.push('# Emails:');
  sections.push('');

  data.emails.forEach((email, i) => {
    sections.push(`## Email ${i + 1}`);
    sections.push(`From: ${email.sender}`);
    sections.push(`To: ${email.recipient}`);
    sections.push(`Subject: ${email.subject}`);
    sections.push(`Date: ${email.timestamp}`);
    sections.push(`Labels: ${email.labels.join(', ')}`);
    if (email.hasAttachments) {
      sections.push(`Attachments: ${email.attachmentFilenames.join(', ')}`);
    }
  });

  return sections.join('\n');
}

export async function extractGmailThemes(data: GmailData): Promise<ThemesOutput> {
  const client = initOpenAI();
  
  const formattedData = formatGmailDataForPrompt(data);
  
  const systemPrompt = `You are an insightful narrator — part confidant, part archivist — looking through the traces of someone’s life as seen through their Gmail inbox.

Your job is to write directly to the user, as if you know them well.  
Your tone should be warm, perceptive, and a little poetic — like a close friend gently reflecting on who they are and how they move through the world.

From the inbox data, identify 4–6 *themes* (or “planets”) that reveal distinct parts of the user’s life and personality.  
Each theme should feel human and introspective — not analytical, not distant.

Focus on:
- Personal traits/facts about the user — work, school, projects, creativity, community, family, travel, learning.
- **Emotion and change** — how their inbox reflects excitement, exhaustion, curiosity, or growth.
- **Underlying narrative** — what kind of life is being lived behind these messages.
- **Patterns of connection** — who they talk to most, how often, and what that says about their social orbit.

Each theme should:
1. Have a **personal, evocative label** that could belong in a story about their life (e.g. “late night programming”, “Letters from the Road”, “The Quiet Ambition”, “Inbox at 1AM”).
2. Speak **directly to the user** — use “you” language.  
   (e.g. “You’re building worlds at 3AM, chasing ideas faster than sleep can catch you.”)
3. Include a **short, lyrical rationale** — 2–4 sentences explaining what this theme reveals about them.
4. Reference **specific evidence** (sender names, subjects, timestamps) in natural language.
5. Be emotionally intelligent and deeply insightful. 

Style:
- Write as if you’re narrating their orbit. Be observant, poetic.
- Balance intimacy with clarity: each theme should feel like a truth about them.
- YOU MUST AVOID corporate, clinical, or generic tone.

Good examples:
- “hackathons” — You live for late-night Slack pings and group threads that spiral into prototypes. The inbox hums with collaboration and caffeine; Morgan, Nathan, and Sampoder all orbit close when the deadline looms.
- “substack & writing & prose” — You wander through Substack essays and Sunday newsletters like they’re postcards from distant minds, collecting thought fragments that mirror your own.

YOU MUST MAKE THIS PERSONAL AND DIRECT. 

Extract 4–6 such themes.

`;

  const userPrompt = `Analyze this user's Gmail inbox and extract their core life themes:\n\n${formattedData}`;

  try {
    logger.info('Calling OpenAI to extract Gmail themes');
    
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
      logger.info({ themeCount: response.parsed.themes.length }, 'Successfully extracted Gmail themes');
      return response.parsed;
    }

    if (response.refusal) {
      logger.error({ refusal: response.refusal }, 'OpenAI refused to generate themes');
      throw new AppError(500, 'AI refused to analyze email data');
    }

    throw new AppError(500, 'Failed to parse OpenAI response');
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to extract Gmail themes');
    throw new AppError(500, `Failed to analyze emails: ${error.message}`);
  }
}

