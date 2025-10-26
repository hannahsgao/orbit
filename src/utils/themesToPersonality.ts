import { PersonalityTree, ThemeNode } from '../types/personality';

// Backend theme format (from AI extraction)
interface BackendTheme {
  label: string;
  rationale: string;
  sources: {
    title: string;
    url?: string;
    type: 'track' | 'artist' | 'playlist' | 'genre' | 'email' | 'sender' | 'conversation';
  }[];
}

interface SpotifyThemesResponse {
  source: 'spotify';
  analyzedAt: string;
  themes: BackendTheme[];
}

interface GmailThemesResponse {
  source: 'gmail';
  provider: 'composio';
  analyzedAt: string;
  emailsAnalyzed: number;
  windowDays: number;
  themes: BackendTheme[];
}

interface SearchThemesResponse {
  source: 'search';
  analyzedAt: string;
  themes: BackendTheme[];
}

export interface ConvertThemesOptions {
  spotifyThemes?: SpotifyThemesResponse;
  gmailThemes?: GmailThemesResponse;
  searchThemes?: SearchThemesResponse;
  userId: string;
}

/**
 * Converts backend AI-generated themes to PersonalityTree format
 */
export function convertThemesToPersonalityTree(
  options: ConvertThemesOptions
): PersonalityTree {
  const { spotifyThemes, gmailThemes, searchThemes, userId } = options;

  const nodes: ThemeNode[] = [];
  const rootThemeIds: string[] = [];
  let nodeCounter = 0;

  // Helper to determine dominant data source
  function getDominantSource(
    spotifyWeight: number,
    gmailWeight: number,
    searchWeight: number
  ): 'spotify' | 'gmail' | 'search' | 'balanced' {
    const max = Math.max(spotifyWeight, gmailWeight, searchWeight);
    if (max === 0) return 'balanced';

    if (spotifyWeight === max && spotifyWeight > gmailWeight + searchWeight) {
      return 'spotify';
    }
    if (gmailWeight === max && gmailWeight > spotifyWeight + searchWeight) {
      return 'gmail';
    }
    if (searchWeight === max && searchWeight > spotifyWeight + gmailWeight) {
      return 'search';
    }
    return 'balanced';
  }

  // Helper to get color based on dominant source
  function getColorForSource(dominant: string): string {
    switch (dominant) {
      case 'spotify':
        return '#1DB954'; // Spotify green
      case 'gmail':
        return '#EA4335'; // Gmail red
      case 'search':
        return '#4285F4'; // Google blue
      default:
        return '#FFFFFF'; // White for balanced
    }
  }

  // Helper to get size based on total weight
  function getSizeForWeight(totalWeight: number): 'small' | 'medium' | 'large' {
    if (totalWeight >= 2) return 'large';
    if (totalWeight >= 1) return 'medium';
    return 'small';
  }

  // Process Spotify themes
  if (spotifyThemes?.themes) {
    spotifyThemes.themes.forEach((theme) => {
      const nodeId = `theme-${nodeCounter++}`;
      const spotifyWeight = 1.0; // Full weight since it's from Spotify
      const totalWeight = spotifyWeight;

      const examples = theme.sources
        .slice(0, 5)
        .map((s) => s.title);

      const node: ThemeNode = {
        id: nodeId,
        name: theme.label,
        description: theme.rationale,
        level: 'theme',
        visualProperties: {
          color: getColorForSource('spotify'),
          size: getSizeForWeight(totalWeight),
        },
        dataSources: {
          spotify: {
            weight: spotifyWeight,
            examples,
          },
        },
        parentId: null,
        childIds: [],
      };

      nodes.push(node);
      rootThemeIds.push(nodeId);
    });
  }

  // Process Gmail themes
  if (gmailThemes?.themes) {
    gmailThemes.themes.forEach((theme) => {
      const nodeId = `theme-${nodeCounter++}`;
      const gmailWeight = 1.0; // Full weight since it's from Gmail
      const totalWeight = gmailWeight;

      const examples = theme.sources
        .slice(0, 5)
        .map((s) => s.title);

      const node: ThemeNode = {
        id: nodeId,
        name: theme.label,
        description: theme.rationale,
        level: 'theme',
        visualProperties: {
          color: getColorForSource('gmail'),
          size: getSizeForWeight(totalWeight),
        },
        dataSources: {
          gmail: {
            weight: gmailWeight,
            examples,
          },
        },
        parentId: null,
        childIds: [],
      };

      nodes.push(node);
      rootThemeIds.push(nodeId);
    });
  }

  // Process Search themes
  if (searchThemes?.themes) {
    searchThemes.themes.forEach((theme) => {
      const nodeId = `theme-${nodeCounter++}`;
      const searchWeight = 1.0;
      const totalWeight = searchWeight;

      const examples = theme.sources
        .slice(0, 5)
        .map((s) => s.title);

      const node: ThemeNode = {
        id: nodeId,
        name: theme.label,
        description: theme.rationale,
        level: 'theme',
        visualProperties: {
          color: getColorForSource('search'),
          size: getSizeForWeight(totalWeight),
        },
        dataSources: {
          search: {
            weight: searchWeight,
            examples,
          },
        },
        parentId: null,
        childIds: [],
      };

      nodes.push(node);
      rootThemeIds.push(nodeId);
    });
  }

  // Generate overall summary
  const themeCounts = {
    spotify: spotifyThemes?.themes.length || 0,
    gmail: gmailThemes?.themes.length || 0,
    search: searchThemes?.themes.length || 0,
  };

  const summaryParts: string[] = [];
  if (themeCounts.spotify > 0) {
    summaryParts.push(`${themeCounts.spotify} music theme${themeCounts.spotify > 1 ? 's' : ''}`);
  }
  if (themeCounts.gmail > 0) {
    summaryParts.push(`${themeCounts.gmail} communication theme${themeCounts.gmail > 1 ? 's' : ''}`);
  }
  if (themeCounts.search > 0) {
    summaryParts.push(`${themeCounts.search} search theme${themeCounts.search > 1 ? 's' : ''}`);
  }

  const summary = `A personality composed of ${summaryParts.join(', ')} based on recent activity.`;

  // Determine time range
  const analyzedDates = [
    spotifyThemes?.analyzedAt,
    gmailThemes?.analyzedAt,
    searchThemes?.analyzedAt,
  ].filter(Boolean) as string[];

  const latestDate = analyzedDates.length > 0
    ? new Date(analyzedDates[0])
    : new Date();

  const windowDays = gmailThemes?.windowDays || 90;
  const startDate = new Date(latestDate);
  startDate.setDate(startDate.getDate() - windowDays);

  return {
    userId,
    generatedAt: latestDate,
    dataTimeRange: {
      start: startDate,
      end: latestDate,
    },
    nodes,
    rootThemeIds,
    summary,
  };
}

/**
 * Fetch themes from backend and convert to PersonalityTree
 */
export async function fetchAndConvertThemes(
  userId: string,
  backendUrl: string = 'http://127.0.0.1:5173'
): Promise<PersonalityTree> {
  const fetchOptions: RequestInit = {
    credentials: 'include', // Important: include cookies for auth
  };

  // Fetch themes from all available sources
  const promises: Promise<any>[] = [];
  const sources: ('spotify' | 'gmail' | 'search')[] = [];

  // Try Spotify
  promises.push(
    fetch(`${backendUrl}/spotify/themes`, fetchOptions)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
  );
  sources.push('spotify');

  // Try Gmail
  promises.push(
    fetch(`${backendUrl}/gmail/themes`, fetchOptions)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
  );
  sources.push('gmail');

  // Try Search (if endpoint exists)
  // promises.push(
  //   fetch(`${backendUrl}/search/themes`, fetchOptions)
  //     .then((r) => (r.ok ? r.json() : null))
  //     .catch(() => null)
  // );
  // sources.push('search');

  const results = await Promise.all(promises);

  const themesData: ConvertThemesOptions = { userId };

  results.forEach((result, index) => {
    if (result && result.themes) {
      const source = sources[index];
      if (source === 'spotify') {
        themesData.spotifyThemes = result as SpotifyThemesResponse;
      } else if (source === 'gmail') {
        themesData.gmailThemes = result as GmailThemesResponse;
      } else if (source === 'search') {
        themesData.searchThemes = result as SearchThemesResponse;
      }
    }
  });

  return convertThemesToPersonalityTree(themesData);
}
