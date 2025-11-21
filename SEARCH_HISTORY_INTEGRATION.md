# Search History Integration

This document describes the search history integration that uses mock data to generate personality themes.

## Overview

The search history integration follows the same pipeline as Gmail and Spotify:
1. Mock search data is loaded from a JSON file
2. AI analyzes the search patterns to extract themes
3. Themes are converted to planets and displayed in the frontend

## Architecture

### Data Flow

```
mockSearchHistory.json → /search/themes endpoint → AI analysis → themes → planets → frontend
```

### Files Created

1. **`src/data/mockSearchHistory.json`** - Mock search history data with 99 search queries
2. **`src/schemas/search.ts`** - TypeScript schemas for search data
3. **`src/services/search_themes.ts`** - AI service to extract themes from searches
4. **`src/routes/search.ts`** - Express routes for search endpoints

### Files Modified

1. **`src/server.ts`** - Registered search routes
2. **`src/schemas/themes.ts`** - Added 'search' as a valid source type
3. **`src/utils/themesToPersonality.ts`** - Enabled search themes fetching and conversion

## API Endpoints

### GET /search/history

Returns the mock search history data.

**Response:**
```json
{
  "source": "search",
  "analyzedAt": "2025-10-26T...",
  "searchesAnalyzed": 99,
  "searches": [
    {
      "search": "how to learn python programming",
      "timestamp": "2025-10-01T10:15:00Z",
      "searchType": "text"
    },
    ...
  ]
}
```

### GET /search/themes

Analyzes search history and returns AI-generated themes.

**Response:**
```json
{
  "source": "search",
  "analyzedAt": "2025-10-26T...",
  "searchesAnalyzed": 99,
  "themes": [
    {
      "label": "The Feminist Film Theory Deep Dive",
      "rationale": "For two weeks straight, you disappeared into a single obsession...",
      "toneHint": "academic, obsessive, sustained",
      "sources": [
        {
          "title": "feminist themes in classic films",
          "type": "search"
        },
        ...
      ]
    },
    ...
  ]
}
```

## Theme Analysis

The AI analyzes search patterns for:

- **Temporal rhythms** - When searches occur (morning, evening, weekend)
- **Contextual anchors** - Work, learning, personal projects
- **Emotional undercurrents** - Curiosity, urgency, exploration
- **Thematic clusters** - Topics that cluster over time
- **Question types** - Practical how-to's, academic research, comparisons
- **Obsession arcs** - Topics dominating multiple days
- **Life season indicators** - Learning, building, researching phases

## Frontend Integration

Search themes are automatically fetched and displayed alongside Spotify and Gmail themes:

- **Color**: Google Blue (#4285F4)
- **Size**: Based on theme weight
- **Display**: Planets in the orbit system

## Mock Data

The mock data contains 99 searches spanning October 1-19, 2025, featuring:

- Technical learning (React, TypeScript, Docker, Kubernetes)
- Feminist film theory research (extensive Wizard of Oz analysis)
- Practical daily searches (restaurants, weather, meal prep)
- Academic work (citations, research methods)
- Development tools and best practices

This creates a rich dataset for the AI to identify multiple distinct themes representing different aspects of intellectual curiosity.

## Testing

To test the search history integration:

```bash
# 1. Start the backend server
npm run dev

# 2. Test the search history endpoint
curl http://127.0.0.1:5173/search/history

# 3. Test the themes endpoint (requires OPENAI_API_KEY)
curl http://127.0.0.1:5173/search/themes

# 4. Open the frontend and enter the solar system
# The search themes will appear as blue planets
```

## No Real Integration Required

This implementation uses mock data only. To integrate real search history:

1. Replace `loadMockSearchHistory()` with actual search API calls
2. Update the route to handle authentication
3. Adjust the data format as needed
4. The AI analysis and frontend display will work unchanged

