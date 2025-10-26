# Theme Expansion Architecture

## Overview

The orbit system now features dynamic, LLM-powered sub-theme generation. When you click on a themed planet, it makes an API call to generate contextually relevant sub-themes that dive deeper into that topic.

## Architecture Diagram

```
User clicks planet
       ↓
Frontend (OrbitSystem.tsx)
       ↓
Backend API (/themes/expand)
       ↓
Theme Expander Service (theme_expander.ts)
       ↓
OpenAI LLM (GPT-4)
       ↓
Generated sub-themes
       ↓
New child planets rendered
```

## Component Details

### 1. Backend: Theme Expander Service (`src/services/theme_expander.ts`)

**Purpose:** Core LLM logic for generating sub-themes.

**Key Features:**
- Takes a parent theme with label, rationale, and sources
- Uses context-aware prompts based on data source (Spotify, Gmail, or mixed)
- Generates 2-4 sub-themes per parent
- Returns structured data with Zod schema validation

**Example Input:**
```typescript
{
  parentTheme: {
    label: "Late-Night Programming",
    rationale: "You're building at 3AM, chasing ideas faster than sleep can catch you",
    sources: ["Lofi beats", "Coffee shop ambient", "Focus playlists"],
    level: "theme",
    dataSource: "spotify"
  }
}
```

**Example Output:**
```typescript
{
  subthemes: [
    {
      label: "Flow State Soundscapes",
      rationale: "Deep focus music for debugging complex problems",
      sources: [
        { title: "Lofi Hip Hop Radio", type: "playlist" },
        { title: "Ambient Study Mix", type: "playlist" }
      ]
    },
    {
      label: "3AM Energy Boost",
      rationale: "Upbeat tracks to power through tired moments",
      sources: [
        { title: "Electronic Focus", type: "playlist" },
        { title: "Synthwave Programming", type: "playlist" }
      ]
    }
  ]
}
```

### 2. Backend: Theme Expansion Route (`src/routes/themes.ts`)

**Endpoint:** `POST /themes/expand`

**Request Body:**
```json
{
  "parentTheme": {
    "id": "theme-1",
    "label": "Creative Expression",
    "rationale": "...",
    "sources": [...],
    "level": "theme",
    "dataSource": "spotify"
  },
  "userId": "user-123"
}
```

**Response:**
```json
{
  "parentThemeId": "theme-1",
  "subthemes": [
    {
      "label": "Music Production",
      "rationale": "...",
      "sources": [...],
      "level": "subtheme",
      "dataSource": "spotify"
    }
  ],
  "generatedAt": "2025-10-26T..."
}
```

**Error Handling:**
- 400: Missing required fields
- 500: LLM generation failure
- Returns JSON error messages instead of crashing

### 3. Frontend: OrbitSystem Component (`src/components/OrbitSystem.tsx`)

**Key Changes:**

1. **State Management:**
   ```typescript
   const [expandingPlanetIds, setExpandingPlanetIds] = useState<Set<string>>(new Set());
   ```
   Tracks which planets are currently fetching sub-themes.

2. **Click Handler Logic:**
   ```typescript
   handlePlanetClick(planetId) {
     // Check if planet has themeData
     if (planet.themeData) {
       // Call backend API
       await fetch('/themes/expand', { ... })
       // Convert response to child planets
     } else {
       // Fall back to random generation
       generateRandomChildren(planetId)
     }
   }
   ```

3. **Loading Indicator:**
   While expanding, a spinning dashed circle appears around the planet.

4. **Planet Creation:**
   Sub-themes are converted to `PlanetNode` objects with:
   - Theme data (name, description, sources)
   - Visual properties (inherited from parent)
   - Orbital mechanics (radius, speed, angle)

## User Experience Flow

### Initial State
1. User connects Spotify/Gmail
2. Root themes are generated and displayed as planets

### Clicking a Root Theme
1. Planet zooms in and centers
2. Loading spinner appears
3. Backend call to `/themes/expand`
4. 2-4 child planets spawn around parent
5. Children inherit parent's visual style
6. Each child has its own theme data

### Clicking a Sub-Theme
1. Same process repeats
2. Can drill down multiple levels (up to depth 2)
3. Each level provides more specific insights

### Fallback Behavior
- If LLM fails, system generates random placeholder planets
- If planet has no theme data, uses random generation
- Graceful degradation ensures system never crashes

## Data Flow

### Backend to Frontend
```typescript
// Backend generates:
{
  label: "Synthesizers",
  rationale: "Deep dive into analog and digital synths",
  sources: [...]
}

// Frontend converts to:
{
  id: "theme-1-child-123",
  themeData: {
    name: "Synthesizers",
    description: "Deep dive into analog and digital synths",
    level: "subtheme",
    dataSources: { spotify: { weight: 0.9 } }
  },
  orbitRadius: 40,
  planetRadius: 12,
  color: "#1DB954",
  imageAsset: "/assets/planets/cowplanet.png"
}
```

## LLM Prompt Strategy

### Spotify Themes
- Focus on music analysis
- Reference genres, artists, tracks
- Maintain creative tone
- Examples: "Lofi Hip-Hop Focus", "Late Night Introspection"

### Gmail Themes
- Focus on life patterns
- Reference senders, subjects, conversation types
- Maintain personal, narrative tone
- Examples: "Weekend Deadline Sprints", "Learning Journey"

### Mixed Themes
- Combine insights from multiple sources
- Maintain balance between data types
- Focus on holistic user understanding

## Configuration

### Backend Environment Variables
```env
OPENAI_API_KEY=sk-...
```

### Frontend Configuration
```typescript
// API endpoint (in OrbitSystem.tsx)
const backendUrl = 'http://127.0.0.1:5173';
```

## Testing

### Manual Testing
1. Start backend: `npm run server`
2. Start frontend: `npm run dev`
3. Connect Spotify or Gmail
4. Click on any root planet
5. Verify sub-planets appear with appropriate labels

### Mock Mode
Set `MOCK_MODE=true` in `.env` to test without real data sources.

## Performance Considerations

1. **Caching:** Currently no caching - each click generates new themes
2. **Latency:** LLM calls take 2-5 seconds
3. **Rate Limiting:** OpenAI API limits apply
4. **Token Usage:** ~500-1000 tokens per expansion

## Future Enhancements

1. **Caching:** Store generated sub-themes in database
2. **Prefetching:** Generate sub-themes for likely next clicks
3. **Personalization:** Use user history to improve suggestions
4. **Multi-level expansion:** Generate grandchild themes automatically
5. **Theme merging:** Combine similar sub-themes across sources
6. **User feedback:** Allow users to rate theme quality

## Troubleshooting

### "Failed to expand theme" Error
- Check `OPENAI_API_KEY` is set
- Verify backend is running
- Check network connectivity
- Review backend logs for details

### No Sub-Planets Appear
- Check browser console for errors
- Verify planet has `themeData` property
- Check if planet already has `hasSpawnedChildren = true`

### Loading Spinner Doesn't Disappear
- Check if backend request failed
- Review network tab in browser dev tools
- Ensure `finally` block in `expandPlanetChildren` executes

## Code Locations

- **Backend Service:** `/src/services/theme_expander.ts`
- **Backend Route:** `/src/routes/themes.ts`
- **Frontend Logic:** `/src/components/OrbitSystem.tsx` (lines 646-795)
- **Server Registration:** `/src/server.ts`
- **CSS Animation:** `/src/index.css` (lines 630-637)

