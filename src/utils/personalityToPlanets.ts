import { PersonalityTree, ThemeNode } from '../types/personality';

interface PlanetNode {
  id: string;
  orbitRadius: number;
  orbitSpeed: number;
  planetRadius: number;
  color: string;
  angle: number;
  parentId: string | null;
  children: string[];
  hasSpawnedChildren: boolean;
  imageAsset: string;
  themeData?: ThemeNode;
}

// Planet image assets
const planetAssets = [
  '/src/assets/planets/cowplanet.png',
  '/src/assets/planets/craterplanet.png',
  '/src/assets/planets/spotplanet.png',
  '/src/assets/planets/stripeplanet.png'
];

function getRandomPlanetAsset(): string {
  return planetAssets[Math.floor(Math.random() * planetAssets.length)];
}

function getPlanetAssetByDataSource(themeNode: ThemeNode): string {
  const spotifyWeight = themeNode.dataSources.spotify?.weight || 0;
  const gmailWeight = themeNode.dataSources.gmail?.weight || 0;
  const searchWeight = themeNode.dataSources.search?.weight || 0;

  // Assign specific planet styles based on dominant data source
  if (spotifyWeight > gmailWeight && spotifyWeight > searchWeight) {
    return '/src/assets/planets/cowplanet.png'; // Music-related
  } else if (gmailWeight > spotifyWeight && gmailWeight > searchWeight) {
    return '/src/assets/planets/craterplanet.png'; // Communication-related
  } else if (searchWeight > 0) {
    return '/src/assets/planets/spotplanet.png'; // Search/knowledge-related
  }

  return '/src/assets/planets/stripeplanet.png'; // Default
}

function getPlanetRadius(size: 'small' | 'medium' | 'large', level: string): number {
  const baseSize = {
    theme: 30,
    subtheme: 20,
    topic: 12,
    detail: 8
  }[level] || 16;

  const sizeMultiplier = {
    small: 0.7,
    medium: 1.0,
    large: 1.3
  }[size] || 1.0;

  return baseSize * sizeMultiplier;
}

export function convertPersonalityTreeToPlanets(
  personalityTree: PersonalityTree
): PlanetNode[] {
  const planets: PlanetNode[] = [];
  const themeNodeMap = new Map<string, ThemeNode>();

  // Create a map for quick theme lookup
  personalityTree.nodes.forEach(node => {
    themeNodeMap.set(node.id, node);
  });

  // Orbital configuration for root themes
  const rootOrbits = [
    { radius: 150, speed: 0.2 },
    { radius: 260, speed: 0.22 },
    { radius: 380, speed: 0.15 },
  ];

  // Process each theme node
  const processNode = (
    themeNode: ThemeNode,
    isRoot: boolean,
    rootIndex?: number
  ): void => {
    const planetRadius = getPlanetRadius(
      themeNode.visualProperties.size,
      themeNode.level
    );

    let orbitRadius: number;
    let orbitSpeed: number;
    let angle: number;

    if (isRoot && rootIndex !== undefined) {
      // Root planet configuration
      const orbitConfig = rootOrbits[rootIndex % rootOrbits.length];
      orbitRadius = orbitConfig.radius + (rootIndex >= 3 ? (rootIndex - 2) * 80 : 0);
      orbitSpeed = orbitConfig.speed + Math.random() * 0.05;
      angle = (Math.PI * 2 * rootIndex) / personalityTree.rootThemeIds.length;
    } else {
      // Child planet configuration
      const siblingCount = themeNode.parentId
        ? themeNodeMap.get(themeNode.parentId)?.childIds.length || 1
        : 1;
      const siblingIndex = themeNode.parentId
        ? themeNodeMap.get(themeNode.parentId)?.childIds.indexOf(themeNode.id) || 0
        : 0;

      orbitRadius = 40 + siblingIndex * 15;
      orbitSpeed = 0.5 + Math.random() * 0.5;
      angle = (Math.PI * 2 * siblingIndex) / siblingCount;
    }

    const planet: PlanetNode = {
      id: themeNode.id,
      orbitRadius,
      orbitSpeed,
      planetRadius,
      color: themeNode.visualProperties.color,
      angle,
      parentId: themeNode.parentId,
      children: [...themeNode.childIds],
      hasSpawnedChildren: themeNode.childIds.length > 0,
      imageAsset: getPlanetAssetByDataSource(themeNode),
      themeData: themeNode,
    };

    planets.push(planet);
  };

  // Process root themes first
  personalityTree.rootThemeIds.forEach((rootId, index) => {
    const rootTheme = themeNodeMap.get(rootId);
    if (rootTheme) {
      processNode(rootTheme, true, index);
    }
  });

  // Process all child themes
  personalityTree.nodes.forEach(node => {
    if (!personalityTree.rootThemeIds.includes(node.id)) {
      processNode(node, false);
    }
  });

  return planets;
}
