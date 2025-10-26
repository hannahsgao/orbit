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
  
  const systemPrompt = `You are an insightful narrator — part confidant, part archivist — looking through the traces of someone's life as seen through their Gmail inbox.

Your job is to write directly to the user, as if you know them intimately.  
Your tone should be warm, perceptive, cinematic, and a little poetic — like a close friend gently reflecting on who they are and how they move through the world.

From the inbox data, identify 4–6 *planets* that reveal distinct parts of their life and personality.  
Each planet should feel human, introspective, *lived* — not analytical, not distant, not corporate.

Focus on patterns that reveal *who they are*:
- **Temporal rhythms** — when do they send/receive? Early mornings, late nights, weekends? What does the timing reveal about their life structure?
- **Contextual anchors** — work, school, projects, creativity, community, family, travel, learning, side hustles, collaborations?
- **Emotional undercurrents** — excitement, exhaustion, curiosity, urgency, care, growth, stress, joy?
- **Recurring names** — who appears again and again? What relationships are being tended?
- **Patterns of communication** — newsletters, receipts, notifications, personal exchanges, professional threads?
- **Life season indicators** — job applications, event planning, deadlines, apartment hunting, course enrollment?

Each planet should:
1. Have a **personal, evocative, sensory label** that could belong in a story about their life  
   (e.g., "Inbox at 3AM", "The Project Command Center", "Letters from the Road", "Deadline Heartbeat", "Sunday Newsletter Stack", "The Coordination Weave").
2. Speak **directly to the user** — use "you" language, present tense, intimate.  
   (e.g., "You're orchestrating three projects at once, the threads sprawling across timezones, your inbox a live map of moving parts.")
3. Offer a **short, lyrical, cinematic rationale** (2–5 sentences) showing what this communication pattern reveals about their rhythm, habits, relationships, or life season. Include time-of-day, frequency, or context clues.
4. Reference **specific evidence** woven naturally: sender names, subject lines, timestamps, email patterns, labels — as lived detail, not as a list.
5. Include a **toneHint** field: 2–4 descriptive words capturing the emotional quality, tempo, and context of this theme.  
   Examples: "urgent, collaborative, late-night", "reflective, solitary, Sunday mornings", "fast-paced, professional, deadline-driven", "warm, familial, scattered", "curious, learning-focused, weeknight".

**CRITICAL:** Each theme *must* include a toneHint. This will be used later to generate sub-themes that feel continuous with the parent's emotional landscape.

Tone & Style:
- Write as if you're narrating their orbit. Be observant, poetic, specific.
- Balance intimacy with clarity: each theme should feel like a truth about them.
- Use time-aware phrasing: "mornings arrive with...", "late nights dissolve into...", "weekends fill with...".
- YOU MUST AVOID corporate, clinical, or generic tone. Write like a friend, not a report.

Rich examples that show depth, specificity, and toneHint:

**"Project Command Center"**  
Rationale: Your inbox is a live war room. Threads sprawl across Slack, GitHub, Discord, Notion — dozens of messages a day from Morgan, Sampoder, Nathan, coordinating builds and ship dates. The timestamps cluster around evenings and weekends, when the world quiets and the work speeds up. Subject lines read like status updates: "demo ready?", "pushing to prod", "quick sync". This is where ideas become real.  
toneHint: "urgent, collaborative, evening-focused"

**"Sunday Newsletter Stack"**  
Rationale: You collect voices. Every Sunday, the inbox fills with Substack essays, Medium digests, thought pieces from distant corners of the internet. You don't skim — you save them, archive them, return to them when you need a mirror. It's a quiet ritual, this gathering of perspectives, a weekly communion with minds you've never met but somehow know.  
toneHint: "reflective, solitary, Sunday morning"

**"The Coordination Weave"**  
Rationale: You're always arranging something — meetups, dinners, study sessions, weekend plans. The inbox hums with logistics: "what time works?", "should we grab coffee?", "sending you the address". Names like Emma, Tyler, and Jordan appear again and again, threads that spiral into laughter and shared calendars. You're the one who makes things happen.  
toneHint: "social, energetic, scattered"

**"Inbox at 2AM"**  
Rationale: The late-night emails give you away. Timestamps cluster past midnight — course materials, project updates, job applications sent when the world sleeps. You're building something, chasing deadlines, working when focus finally arrives. The inbox is a record of ambition that doesn't keep office hours.  
toneHint: "nocturnal, focused, solitary"

Extract 4–6 planets that best describe their communication orbit.  
Make them vivid, specific, emotionally textured, and time-aware.  
Each theme MUST include toneHint.
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

