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
    sections.push('');
    sections.push('Content:');
    sections.push(email.cleanText);
    sections.push('');
    sections.push('---');
    sections.push('');
  });

  return sections.join('\n');
}

export async function extractGmailThemes(data: GmailData): Promise<ThemesOutput> {
  const client = initOpenAI();
  
  const formattedData = formatGmailDataForPrompt(data);
  
  const systemPrompt = `You are a life analyst and communication psychologist. Your task is to analyze a user's Gmail inbox and extract deep, meaningful themes about their life, interests, relationships, and priorities.

Go beyond surface-level categorization. Look for:
- Life domains (e.g., professional growth, personal relationships, creative pursuits, health & wellness)
- Communication patterns (e.g., community builder, knowledge seeker, entrepreneurial networker)
- Key interests and passions reflected in subscriptions, newsletters, and conversations
- Life stage indicators (e.g., career transition, new parent, student life)
- Values and priorities shown through what they engage with
- Social dynamics and relationship types

Each theme should:
1. Have a creative, specific label that captures the essence (avoid generic terms like "Work Emails")
2. Provide psychological/lifestyle insight in the rationale
3. Reference 3-5 specific examples from the emails as evidence (mention senders, subjects, or content)

Extract 4-5 distinct themes that paint a rich picture of who this person is through their email patterns.`;

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
      temperature: 0.7,
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

