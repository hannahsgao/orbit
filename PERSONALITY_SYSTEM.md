# Personality-Based Planet System

This document explains how the personality-based planet generation system works.

## Overview

The system analyzes user data (Spotify, Gmail, Google Search) and uses an LLM to generate a tree structure representing personality themes. Each theme becomes a planet in the orbital system, with visual properties determined by the underlying data.

## Architecture

### 1. Data Flow

```
User Data (Spotify, Gmail, Search)
  → LLM Analysis
  → LLMThemeInput[]
  → PersonalityTree
  → PlanetNode[]
  → OrbitSystem Visualization
```

### 2. Type Definitions

#### `ThemeNode` (`src/types/personality.ts`)
Represents a single personality theme with:
- **name**: Display name of the theme
- **description**: LLM-generated description
- **level**: Hierarchy level (theme → subtheme → topic → detail)
- **dataSources**: Weighted contributions from Spotify, Gmail, Search
- **visualProperties**: Color and size for rendering
- **Tree structure**: parentId and childIds

#### `PersonalityTree` (`src/types/personality.ts`)
Contains:
- **nodes**: Array of all ThemeNodes
- **rootThemeIds**: Top-level themes
- **metadata**: userId, generation date, data time range
- **summary**: Overall personality summary from LLM

#### `LLMThemeInput` (`src/types/personality.ts`)
The format the LLM should output:
```typescript
{
  name: string;
  description: string;
  level: 'theme' | 'subtheme' | 'topic' | 'detail';
  dataSources: {
    spotify?: { weight: number; examples?: string[] };
    gmail?: { weight: number; examples?: string[] };
    search?: { weight: number; examples?: string[] };
  };
  children?: LLMThemeInput[];
}
```

### 3. Visual Mapping

#### Planet Colors
- **Spotify dominant** → Green (`#1DB954`)
- **Gmail dominant** → Red (`#EA4335`)
- **Search dominant** → Blue (`#4285F4`)
- **Balanced** → White (`#FFFFFF`)

#### Planet Sizes
Based on:
1. **Hierarchy level** (theme > subtheme > topic > detail)
2. **Data source weight** (small/medium/large)

#### Planet Images
- **Spotify** → Cow planet (music-related)
- **Gmail** → Crater planet (communication)
- **Search** → Spot planet (knowledge)
- **Default** → Stripe planet

### 4. Example Data

See `src/data/examplePersonality.ts` for a complete example showing:
- Creative Expression (Music Production, Visual Design)
- Technology & Development (Web Dev, AI/ML)
- Wellness & Mindfulness (Meditation)

## Usage

### Option 1: Load from Personality Tree

```typescript
import { OrbitSystem } from './components/OrbitSystem';
import { examplePersonalityTree } from './data/examplePersonality';

<OrbitSystem
  centerX={width / 2}
  centerY={height / 2}
  personalityTree={examplePersonalityTree}
/>
```

### Option 2: Default Procedural Planets

```typescript
<OrbitSystem
  centerX={width / 2}
  centerY={height / 2}
/>
```

### Creating a Personality Tree from LLM Output

```typescript
import { convertLLMToThemeNodes } from './data/examplePersonality';

// LLM generates this structure
const llmOutput: LLMThemeInput[] = [
  {
    name: 'Creative Expression',
    description: 'Strong focus on creative pursuits...',
    level: 'theme',
    dataSources: {
      spotify: { weight: 0.7, examples: ['Indie rock', 'Jazz'] },
      search: { weight: 0.5, examples: ['design tips'] }
    },
    children: [
      // subthemes...
    ]
  }
];

const personalityTree = convertLLMToThemeNodes(llmOutput, 'user-123');
```

## Utility Functions

### `convertLLMToThemeNodes()`
**Location**: `src/data/examplePersonality.ts`

Converts flat LLM output into a proper PersonalityTree with:
- Generated IDs for each node
- Color assignments based on data sources
- Size calculations based on weights
- Parent-child relationships

### `convertPersonalityTreeToPlanets()`
**Location**: `src/utils/personalityToPlanets.ts`

Converts PersonalityTree into PlanetNode[] with:
- Orbital mechanics (radius, speed, angle)
- Visual properties (color, size, image)
- Tree structure (parent/child relationships)
- Theme data attached to each planet

## Interactive Features

### Hover Tooltips
Hovering over a planet displays:
- Theme name
- Description
- Hierarchy level

### Labels
Planet labels show:
- Theme name (instead of ID)
- Flash periodically based on focus state

### Clicking Behavior
- **First click**: Zoom in and show children
- **Click centered planet**: Zoom back out
- **Cmd+click**: Multi-select

## Backend Integration

To integrate with actual user data:

1. **Data Collection**: Gather user's Spotify listening history, Gmail metadata, and Google Search history

2. **LLM Prompt**: Send data to LLM with instructions to output `LLMThemeInput[]` format

3. **Convert to Tree**: Use `convertLLMToThemeNodes()` to create PersonalityTree

4. **Pass to Frontend**: Send PersonalityTree to frontend via API

5. **Render**: Pass to `<OrbitSystem personalityTree={data} />`

## Example LLM Prompt

```
Analyze the following user data and generate a personality profile as a hierarchical tree.

Spotify Data: [top artists, genres, playlists]
Gmail Data: [frequent contacts, email topics, newsletters]
Search Data: [search queries, topics]

Output Format (JSON):
[
  {
    "name": "Theme Name",
    "description": "1-2 sentence description",
    "level": "theme",
    "dataSources": {
      "spotify": { "weight": 0.0-1.0, "examples": ["example1", "example2"] },
      "gmail": { "weight": 0.0-1.0, "examples": [] },
      "search": { "weight": 0.0-1.0, "examples": [] }
    },
    "children": [
      // subthemes with same structure
    ]
  }
]

Guidelines:
- 2-4 top-level themes
- 2-3 levels of depth max
- Weight indicates how much that data source contributed (0-1)
- Include specific examples from the data
```

## Testing

To test with example data:

```typescript
// In App.tsx
import { examplePersonalityTree } from './data/examplePersonality';

<OrbitSystem
  centerX={dimensions.width / 2}
  centerY={dimensions.height / 2}
  personalityTree={examplePersonalityTree}
/>
```

This will render the example personality tree with all themes and subthemes.
