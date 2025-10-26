import { Letta } from '@letta-ai/letta-client';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

let client: Letta | null = null;

function getLettaClient(): Letta {
  if (!client) {
    const apiKey = process.env.LETTA_API_KEY;
    if (!apiKey) {
      throw new AppError(500, 'LETTA_API_KEY not set in environment');
    }
    client = new Letta({ apiKey });
  }
  return client;
}

interface AgentInfo {
  id: string;
  name: string;
  createdAt: string;
}

const agentCache = new Map<string, AgentInfo>();

export async function createPersonalAgent(userName: string): Promise<AgentInfo> {
  const client = getLettaClient();

  logger.info({ userName }, 'Creating new Letta agent');

  const agent = await client.agents.create({
    name: `orbit-agent-${userName.toLowerCase().replace(/\s+/g, '-')}`,
    memory_blocks: [
      {
        label: 'human',
        value: `The user's name is ${userName}. They are using Orbit to understand their identity through their data.`,
      },
      {
        label: 'persona',
        value: 'I am Orbit, a personal intelligence assistant that analyzes multiple data sources (Spotify, photos, emails) to understand your identity, interests, and patterns. I synthesize data into 5-6 core themes with supporting evidence.',
      },
      {
        label: 'spotify_insights',
        value: 'No Spotify data ingested yet.',
        description: 'Stores analyzed Spotify listening behavior, music preferences, top artists, genres, and playlist themes.',
      },
      {
        label: 'visual_themes',
        value: 'No photo data ingested yet.',
        description: 'Stores visual patterns from camera roll: subjects, activities, colors, locations, and lifestyle indicators.',
      },
      {
        label: 'communication_patterns',
        value: 'No email data ingested yet.',
        description: 'Stores communication themes from Gmail subject lines: topics, priorities, and social patterns.',
      },
      {
        label: 'core_themes',
        value: 'No themes synthesized yet. Waiting for data from multiple sources.',
        description: 'Master synthesis of all data sources into 5-6 core personality themes with supporting evidence.',
      },
    ],
    tools: ['web_search'],
    model: 'gpt-4',
    embedding: 'text-embedding-3-small',
  });

  const agentInfo: AgentInfo = {
    id: agent.id,
    name: agent.name || `orbit-agent-${userName}`,
    createdAt: new Date().toISOString(),
  };

  agentCache.set(userName, agentInfo);
  logger.info({ agentId: agent.id, userName }, 'Letta agent created successfully');

  return agentInfo;
}

export async function getAgentInfo(userName: string): Promise<AgentInfo | null> {
  return agentCache.get(userName) || null;
}

export async function ingestSpotifyData(agentId: string, spotifyData: any): Promise<void> {
  const client = getLettaClient();

  const { profile, derived, artists, tracks, playlists } = spotifyData;

  const topGenres = derived.genreHistogram.slice(0, 10).map((g: any) => g.genre);
  const topArtists = artists.slice(0, 10).map((a: any) => a.name);
  const playlistThemes = derived.playlistKeywords.slice(0, 10).map((k: any) => k.token);

  const message = `Update your spotify_insights memory block with this analyzed Spotify data:

**User:** ${profile.name}

**Top Genres (${topGenres.length}):** ${topGenres.join(', ')}

**Top Artists (${topArtists.length}):** ${topArtists.join(', ')}

**Listening Patterns:**
- Stability Score: ${derived.stabilityScore.toFixed(2)} (how consistent listening habits are)
- Total Artists: ${artists.length}
- Total Tracks: ${tracks.length}
- Total Playlists: ${playlists.length}

**Playlist Themes:** ${playlistThemes.join(', ')}

**Recency Boost:** ${derived.recencyBoost.map((r: any) => r.genre).join(', ')}

Analyze this data and update your spotify_insights memory block. What does this music taste reveal about the person's personality, interests, and emotional landscape?`;

  logger.info({ agentId }, 'Ingesting Spotify data into Letta agent');

  await client.agents.messages.send(agentId, {
    messages: [{ role: 'user', content: message }],
  });

  logger.info({ agentId }, 'Spotify data ingested successfully');
}

export async function ingestPhotoData(agentId: string, photoData: any): Promise<void> {
  const client = getLettaClient();

  const message = `Update your visual_themes memory block with this photo analysis:

**Analyzed:** ${photoData.count} photos

**Dominant Subjects:** ${photoData.subjects.join(', ')}

**Activities:** ${photoData.activities.join(', ')}

**Color Palette:** ${photoData.colors.join(', ')}

**Locations:** ${photoData.locations.join(', ')}

**Time Patterns:** ${photoData.timePatterns.join(', ')}

What do these photos reveal about the person's lifestyle, interests, and values?`;

  logger.info({ agentId }, 'Ingesting photo data into Letta agent');

  await client.agents.messages.send(agentId, {
    messages: [{ role: 'user', content: message }],
  });

  logger.info({ agentId }, 'Photo data ingested successfully');
}

export async function ingestGmailData(agentId: string, gmailData: any): Promise<void> {
  const client = getLettaClient();

  const message = `Update your communication_patterns memory block with this email analysis:

**Analyzed:** ${gmailData.count} email subject lines

**Top Topics:** ${gmailData.topics.join(', ')}

**Sender Types:** ${gmailData.senderTypes.join(', ')}

**Communication Focus:** ${gmailData.focus}

**Priority Indicators:** ${gmailData.priorities.join(', ')}

What does this email behavior reveal about the person's priorities, professional life, and social connections?`;

  logger.info({ agentId }, 'Ingesting Gmail data into Letta agent');

  await client.agents.messages.send(agentId, {
    messages: [{ role: 'user', content: message }],
  });

  logger.info({ agentId }, 'Gmail data ingested successfully');
}

export interface Theme {
  name: string;
  description: string;
  evidence: {
    spotify?: string[];
    photos?: string[];
    gmail?: string[];
  };
  confidence: number;
}

export interface ThemesResponse {
  themes: Theme[];
  lastUpdated: string;
  dataSources: {
    spotify: boolean;
    photos: boolean;
    gmail: boolean;
  };
}

export async function extractThemes(agentId: string): Promise<ThemesResponse> {
  const client = getLettaClient();

  const message = `Synthesize ALL your memory blocks (spotify_insights, visual_themes, communication_patterns) and extract 5-6 core themes about this person.

For each theme provide:
1. **Theme name** (1-2 words, poetic like "Curiosity", "Motion", "Connection", "Solitude", "Ambition")
2. **Description** (one compelling sentence)
3. **Evidence** (specific examples from Spotify, photos, and emails - be concrete)
4. **Confidence score** (0-1, how strongly supported by the data)

Format your response as a JSON array. Be thoughtful and insightful. Look for patterns across data sources.

Update your core_themes memory block with this synthesis, then return the themes.`;

  logger.info({ agentId }, 'Requesting theme extraction from Letta agent');

  const response = await client.agents.messages.send(agentId, {
    messages: [{ role: 'user', content: message }],
  });

  // Extract assistant message from response
  let themesText = '';
  if (response.messages && response.messages.length > 0) {
    for (const msg of response.messages) {
      if (msg.message_type === 'assistant_message') {
        themesText = typeof msg.content === 'string' ? msg.content : '';
        break;
      }
    }
  }

  logger.info({ agentId, responseLength: themesText.length }, 'Received theme extraction response');

  // Try to parse JSON from response
  let themes: Theme[] = [];
  try {
    // Look for JSON array in the response
    const jsonMatch = themesText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      themes = JSON.parse(jsonMatch[0]);
    } else {
      // Fallback: create structured response from text
      themes = parseThemesFromText(themesText);
    }
  } catch (error) {
    logger.error({ error, themesText }, 'Failed to parse themes JSON, falling back to text parsing');
    themes = parseThemesFromText(themesText);
  }

  // Check which data sources have been ingested
  const agent = await client.agents.retrieve(agentId);
  const memoryBlocks = agent.memory?.blocks || [];
  const spotifyBlock = memoryBlocks.find((b: any) => b.label === 'spotify_insights');
  const photosBlock = memoryBlocks.find((b: any) => b.label === 'visual_themes');
  const gmailBlock = memoryBlocks.find((b: any) => b.label === 'communication_patterns');

  return {
    themes,
    lastUpdated: new Date().toISOString(),
    dataSources: {
      spotify: !spotifyBlock?.value?.includes('No Spotify data'),
      photos: !photosBlock?.value?.includes('No photo data'),
      gmail: !gmailBlock?.value?.includes('No email data'),
    },
  };
}

function parseThemesFromText(text: string): Theme[] {
  // Fallback parser if JSON extraction fails
  // This is a simple implementation - you can enhance it
  return [
    {
      name: 'Analysis Pending',
      description: 'The agent is still processing the data to extract meaningful themes.',
      evidence: {},
      confidence: 0.5,
    },
  ];
}

export async function getAgentMemory(agentId: string): Promise<any> {
  const client = getLettaClient();
  const agent = await client.agents.retrieve(agentId);
  return agent.memory?.blocks || [];
}

