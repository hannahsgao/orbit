import { LLMThemeInput, PersonalityTree, ThemeNode } from '../types/personality';

// Example of what the LLM would generate based on user data
export const exampleLLMOutput: LLMThemeInput[] = [
  {
    name: 'Creative Expression',
    description: 'A strong focus on creative and artistic pursuits, spanning music, design, and personal projects',
    level: 'theme',
    dataSources: {
      spotify: { weight: 0.7, examples: ['Indie rock playlists', 'Jazz albums', 'Electronic music'] },
      search: { weight: 0.5, examples: ['design inspiration', 'creative writing tips', 'music production'] },
      gmail: { weight: 0.3, examples: ['Art gallery newsletters', 'Music collaboration emails'] }
    },
    children: [
      {
        name: 'Music Production',
        description: 'Interest in creating and producing music, with a focus on electronic and indie genres',
        level: 'subtheme',
        dataSources: {
          spotify: { weight: 0.9, examples: ['Ableton tutorials', 'Synth music', 'DAW playlists'] },
          search: { weight: 0.8, examples: ['ableton tips', 'synthesizer reviews', 'mixing techniques'] }
        },
        children: [
          {
            name: 'Synthesizers',
            description: 'Deep dive into analog and digital synthesizers',
            level: 'topic',
            dataSources: {
              search: { weight: 0.9, examples: ['moog synthesizer', 'modular synth setup'] },
              gmail: { weight: 0.4, examples: ['Gear newsletters'] }
            }
          },
          {
            name: 'Mixing & Mastering',
            description: 'Learning audio engineering and production techniques',
            level: 'topic',
            dataSources: {
              search: { weight: 0.7, examples: ['eq techniques', 'mastering chain'] },
              spotify: { weight: 0.5, examples: ['Reference tracks'] }
            }
          }
        ]
      },
      {
        name: 'Visual Design',
        description: 'Exploring graphic design, UI/UX, and visual arts',
        level: 'subtheme',
        dataSources: {
          search: { weight: 0.8, examples: ['figma tutorials', 'design systems', 'color theory'] },
          gmail: { weight: 0.6, examples: ['Design newsletter subscriptions', 'Portfolio feedback'] }
        },
        children: [
          {
            name: 'UI/UX Design',
            description: 'Interface design and user experience principles',
            level: 'topic',
            dataSources: {
              search: { weight: 0.9, examples: ['ux best practices', 'user research methods'] }
            }
          }
        ]
      }
    ]
  },
  {
    name: 'Technology & Development',
    description: 'Strong technical interest in programming, software development, and emerging technologies',
    level: 'theme',
    dataSources: {
      search: { weight: 0.9, examples: ['react tutorials', 'typescript docs', 'machine learning'] },
      gmail: { weight: 0.7, examples: ['GitHub notifications', 'Dev newsletter', 'Tech meetup invites'] },
      spotify: { weight: 0.2, examples: ['Programming focus music', 'Tech podcasts'] }
    },
    children: [
      {
        name: 'Web Development',
        description: 'Frontend and fullstack web development with modern frameworks',
        level: 'subtheme',
        dataSources: {
          search: { weight: 0.95, examples: ['react hooks', 'next.js deployment', 'tailwind css'] },
          gmail: { weight: 0.6, examples: ['Stack Overflow notifications', 'Vercel updates'] }
        },
        children: [
          {
            name: 'React Ecosystem',
            description: 'Deep knowledge of React and related libraries',
            level: 'topic',
            dataSources: {
              search: { weight: 1.0, examples: ['react query', 'zustand state management'] }
            }
          }
        ]
      },
      {
        name: 'AI & Machine Learning',
        description: 'Exploring artificial intelligence and ML applications',
        level: 'subtheme',
        dataSources: {
          search: { weight: 0.8, examples: ['transformer models', 'langchain tutorials', 'openai api'] },
          gmail: { weight: 0.5, examples: ['AI research papers', 'ML conference updates'] }
        }
      }
    ]
  },
  {
    name: 'Wellness & Mindfulness',
    description: 'Focus on mental and physical health, meditation, and self-improvement',
    level: 'theme',
    dataSources: {
      spotify: { weight: 0.6, examples: ['Meditation playlists', 'Wellness podcasts', 'Yoga music'] },
      search: { weight: 0.5, examples: ['mindfulness techniques', 'workout routines', 'sleep hygiene'] },
      gmail: { weight: 0.4, examples: ['Fitness app notifications', 'Therapy appointment reminders'] }
    },
    children: [
      {
        name: 'Meditation Practice',
        description: 'Regular meditation and mindfulness exercises',
        level: 'subtheme',
        dataSources: {
          spotify: { weight: 0.8, examples: ['Headspace sessions', 'Ambient meditation music'] },
          search: { weight: 0.6, examples: ['guided meditation', 'breath work techniques'] }
        }
      }
    ]
  }
];

// Utility function to convert LLM output to ThemeNode tree
export function convertLLMToThemeNodes(
  llmThemes: LLMThemeInput[],
  userId: string = 'example-user'
): PersonalityTree {
  const nodes: ThemeNode[] = [];
  const rootThemeIds: string[] = [];
  let nodeCounter = 0;

  const processTheme = (
    theme: LLMThemeInput,
    parentId: string | null = null
  ): string => {
    const nodeId = `theme-${nodeCounter++}`;
    const childIds: string[] = [];

    // Process children first to get their IDs
    if (theme.children && theme.children.length > 0) {
      theme.children.forEach(child => {
        const childId = processTheme(child, nodeId);
        childIds.push(childId);
      });
    }

    // Determine size based on level and data source weights
    const totalWeight =
      (theme.dataSources.spotify?.weight || 0) +
      (theme.dataSources.gmail?.weight || 0) +
      (theme.dataSources.search?.weight || 0);

    let size: 'small' | 'medium' | 'large' = 'medium';
    if (totalWeight > 2) size = 'large';
    else if (totalWeight < 1) size = 'small';

    // Determine color based on dominant data source
    let color = '#FFFFFF';
    const spotifyWeight = theme.dataSources.spotify?.weight || 0;
    const gmailWeight = theme.dataSources.gmail?.weight || 0;
    const searchWeight = theme.dataSources.search?.weight || 0;

    if (spotifyWeight > gmailWeight && spotifyWeight > searchWeight) {
      color = '#1DB954'; // Spotify green
    } else if (gmailWeight > spotifyWeight && gmailWeight > searchWeight) {
      color = '#EA4335'; // Gmail red
    } else if (searchWeight > 0) {
      color = '#4285F4'; // Google blue
    }

    const node: ThemeNode = {
      id: nodeId,
      name: theme.name,
      description: theme.description,
      level: theme.level,
      visualProperties: {
        color,
        size,
      },
      dataSources: theme.dataSources,
      parentId,
      childIds,
    };

    nodes.push(node);

    if (parentId === null) {
      rootThemeIds.push(nodeId);
    }

    return nodeId;
  };

  // Process all root themes
  llmThemes.forEach(theme => processTheme(theme));

  return {
    userId,
    generatedAt: new Date(),
    dataTimeRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date(),
    },
    nodes,
    rootThemeIds,
    summary: 'A multi-faceted individual with strong creative and technical interests, balanced with a focus on personal wellness.',
  };
}

// Generate the example personality tree
export const examplePersonalityTree = convertLLMToThemeNodes(exampleLLMOutput);
