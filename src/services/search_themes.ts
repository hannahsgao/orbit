import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { ThemesOutputSchema, type ThemesOutput } from '../schemas/themes';
import type { SearchItem } from '../schemas/search';

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

interface SearchData {
  searches: SearchItem[];
}

function formatSearchDataForPrompt(data: SearchData): string {
  const sections: string[] = [];

  sections.push(`# Search History Analysis`);
  sections.push(`Total searches: ${data.searches.length}`);
  sections.push('');

  // Group searches by day
  const searchesByDay = new Map<string, SearchItem[]>();
  data.searches.forEach(item => {
    const date = new Date(item.timestamp).toISOString().split('T')[0];
    if (!searchesByDay.has(date)) {
      searchesByDay.set(date, []);
    }
    searchesByDay.get(date)!.push(item);
  });

  sections.push('# Search Patterns:');
  sections.push('');

  Array.from(searchesByDay.entries()).forEach(([date, items]) => {
    sections.push(`## ${date}`);
    items.forEach(item => {
      const time = new Date(item.timestamp).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      sections.push(`${time} - "${item.search}"`);
    });
    sections.push('');
  });

  return sections.join('\n');
}

export async function extractSearchThemes(data: SearchData): Promise<ThemesOutput> {
  const client = initOpenAI();
  
  const formattedData = formatSearchDataForPrompt(data);
  
  const systemPrompt = `You are an insightful narrator mapping a user's "intellectual orbit" — the questions, curiosities, and explorations that define their mental landscape.

Your task is to write directly to the user, uncovering 3–5 *planets* that reveal what they're searching for, learning, building, and becoming.  
Each planet should feel like a living inquiry — a thread of curiosity they're following through the world.

Don't just describe topics. Listen for patterns that reveal *who they are*:
- **Temporal rhythms** — when do they search? Early mornings, late nights, weekends? What does the timing reveal about their life structure and learning habits?
- **Contextual anchors** — are they researching for work, school, projects, personal growth, creative pursuits, or life decisions?
- **Emotional undercurrents** — curiosity, urgency, confusion, excitement, anxiety, determination, playfulness?
- **Thematic clusters** — do searches cluster around specific topics over days or weeks? What sustained interests emerge?
- **Question types** — practical how-to's, deep theoretical dives, comparison shopping, personal exploration, academic research?
- **Obsession arcs** — do certain topics dominate for days, revealing a current fixation or project?
- **Life season indicators** — job hunting, learning new skills, planning trips, health changes, relationship questions, creative projects?

Each planet should:
1. Have a **personal, evocative, sensory label** that captures the spirit of the inquiry  
   (e.g., "The Research Rabbit Hole", "Morning Learning Ritual", "Building in Public", "The Midnight Question", "Weekend Deep Dive", "Academic Sprint").
2. Speak **directly to the user** — use "you" language, present tense, intimate.  
   (e.g., "You're chasing understanding through cascading searches, each answer opening three new questions.")
3. Offer a **short, lyrical, reflective rationale** (2–5 sentences) showing what this search pattern reveals about their curiosity, habits, projects, or life season. Include time-of-day, frequency, or clustering clues.
4. Reference **specific search queries** woven naturally into the prose — not as a list, but as lived detail showing the path of inquiry.
5. Include a **toneHint** field: 2–4 descriptive words capturing the emotional quality, tempo, and context of this search pattern.  
   Examples: "academic, morning-focused, sustained", "curious, scattered, exploratory", "urgent, practical, evening", "obsessive, deep-dive, nocturnal", "playful, creative, weekend".
6. Include a **sources** array with 3-5 specific search queries that exemplify this theme. Each source should have:
   - title: the exact search query text
   - type: "search"

**CRITICAL:** Each theme *must* include a toneHint and sources array. The sources should contain actual search queries from the data that support this theme.

Tone & Style:
- Write as if you're observing the user's mind at work through their questions.
- Be poetic but grounded — vivid imagery, emotional precision, intellectual intimacy.
- Use time-aware phrasing: "mornings begin with...", "late nights spiral into...", "weekends unfold with...".
- Balance insight with warmth: each theme should feel like a truth about their curiosity.

Rich examples that show depth, specificity, and toneHint:

**"The Morning Research Ritual"**  
Rationale: Your days begin with learning. Between 9 and 11 AM, the searches arrive in clusters — technical tutorials, framework comparisons, best practices. "React hooks useState tutorial", "typescript interface vs type", "best practice REST API design" — you're building something, piece by piece, question by question. The mornings are for growth, for laying foundations.  
toneHint: "structured, learning-focused, morning"  
sources: [
  { title: "react hooks useState tutorial", type: "search" },
  { title: "typescript interface vs type", type: "search" },
  { title: "best practice REST API design", type: "search" }
]

**"The Feminist Film Theory Deep Dive"**  
Rationale: For two weeks straight, you disappeared into a single obsession. The Wizard of Oz became your lens: Dorothy's agency, the male gaze, power symbols, sisterhood dynamics. Searches cascaded from broad cultural analysis to specific academic sources — Laura Mulvey, JSTOR articles, citation formatting. This is what sustained intellectual curiosity looks like: urgent, recursive, building toward something.  
toneHint: "academic, obsessive, sustained"  
sources: [
  { title: "feminist themes in classic films", type: "search" },
  { title: "Dorothy agency vs passivity Wizard of Oz", type: "search" },
  { title: "feminist film theory Laura Mulvey", type: "search" },
  { title: "JSTOR Wizard of Oz feminist critique", type: "search" }
]

**"Weekend Practicality"**  
Rationale: When the week slows, your searches shift from abstract to concrete. Sunday afternoons bring meal prep ideas, yoga stretches, coffee recommendations — the maintenance work of a life. These aren't grand questions, just the quiet logistics of taking care of yourself amid everything else.  
toneHint: "practical, self-care, weekend"  
sources: [
  { title: "vegetarian meal prep ideas", type: "search" },
  { title: "best yoga stretches for desk workers", type: "search" },
  { title: "best coffee beans whole bean light roast", type: "search" }
]

**"Evening Stack Building"**  
Rationale: After 7 PM, your searches reveal a different mode: docker tutorials, kubernetes configs, postgres comparisons. You're learning infrastructure, building systems, preparing for something bigger. The evening is when you move from theory to implementation, when the tools come out.  
toneHint: "technical, evening-focused, building"  
sources: [
  { title: "docker compose tutorial beginners", type: "search" },
  { title: "kubernetes deployment yaml example", type: "search" },
  { title: "postgres vs mysql performance comparison", type: "search" }
]

Extract 3–5 planets that best describe the user's search orbit.  
Make them vivid, specific, emotionally textured, and time-aware.  
Each theme MUST include toneHint.
`;

  const userPrompt = `Analyze this user's search history and extract their core curiosity themes:\n\n${formattedData}`;

  try {
    logger.info('Calling OpenAI to extract search themes');
    
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
      logger.info({ themeCount: response.parsed.themes.length }, 'Successfully extracted search themes');
      return response.parsed;
    }

    if (response.refusal) {
      logger.error({ refusal: response.refusal }, 'OpenAI refused to generate themes');
      throw new AppError(500, 'AI refused to analyze search data');
    }

    throw new AppError(500, 'Failed to parse OpenAI response');
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to extract search themes');
    throw new AppError(500, `Failed to analyze search history: ${error.message}`);
  }
}

