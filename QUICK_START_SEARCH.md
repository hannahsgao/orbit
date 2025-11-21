# Quick Start: Search History Integration

This guide shows how to test the search history integration end-to-end.

## Prerequisites

- Node.js installed
- OpenAI API key configured in `.env` as `OPENAI_API_KEY`

## Step 1: Start the Backend

```bash
npm run server
```

You should see:
```
orbit-mcp-spotify running on http://127.0.0.1:5173
```

## Step 2: Test the Search Endpoints

### Test Search History
```bash
curl http://127.0.0.1:5173/search/history | python3 -m json.tool
```

Expected output:
```json
{
  "source": "search",
  "analyzedAt": "2025-10-26T...",
  "searchesAnalyzed": 97,
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

### Test Theme Generation
```bash
curl http://127.0.0.1:5173/search/themes | python3 -m json.tool
```

Expected output:
```json
{
  "source": "search",
  "analyzedAt": "2025-10-26T...",
  "searchesAnalyzed": 97,
  "themes": [
    {
      "label": "The Nocturnal Feminist Film Odyssey",
      "rationale": "In the quiet hours of the night...",
      "toneHint": "academic, obsessive, nocturnal",
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

## Step 3: Start the Frontend

In a new terminal:

```bash
npm run dev
```

Open http://127.0.0.1:3000 in your browser.

## Step 4: View Search Planets

1. Click "Enter Solar System" on the landing page
2. Wait for themes to load (2-3 seconds)
3. Look for **blue planets** - these are your search themes
4. Other colors:
   - Green = Spotify themes
   - Red = Gmail themes
5. Click on planets to see theme details

## Expected Results

You should see 4 blue planets representing:

1. **"The Nocturnal Feminist Film Odyssey"**
   - Academic research into The Wizard of Oz
   
2. **"The Early Morning Tech Builder"**
   - Morning programming learning sessions
   
3. **"The Practical Weekend Explorer"**
   - Weekend self-care and practical searches
   
4. **"The Midnight Academic Sprint"**
   - Late-night academic research

## Console Output

Check the browser console for:
```
Loaded personality tree with X themes from spotify, gmail, search
```

The "search" should appear in the sources list if themes loaded successfully.

## Troubleshooting

### No Blue Planets?
- Check backend is running on port 5173
- Check browser console for errors
- Verify `/search/themes` endpoint returns data

### Endpoint Errors?
- Ensure `OPENAI_API_KEY` is set in `.env`
- Check server logs for errors
- Verify mock data file exists at `src/data/mockSearchHistory.json`

### Themes Not Loading?
- Open DevTools → Network tab
- Check if request to `http://127.0.0.1:5173/search/themes` succeeds
- Verify response has `themes` array with data

## Mock Data

The implementation uses mock data from `src/data/mockSearchHistory.json` containing 97 searches. This includes:

- 30+ searches about The Wizard of Oz feminist analysis
- 20+ technical programming searches
- 10+ practical life searches
- Academic research queries
- Tool comparison searches

The AI analyzes these patterns to generate meaningful personality themes.

## Next Steps

To integrate real search history:
1. Replace `loadMockSearchHistory()` in `src/routes/search.ts`
2. Add authentication
3. Connect to actual search APIs (Google Search Console, browser history, etc.)

The theme extraction and display logic will work unchanged with real data.

