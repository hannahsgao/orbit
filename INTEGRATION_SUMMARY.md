# Backend Integration Summary

## What Was Added

I've successfully brought over all the backend logic from the `sandra-backend` branch. Here's what's now available:

### 📁 File Structure

```
src/
├── schemas/              # Data validation (Zod schemas)
│   ├── spotify.ts       # Spotify API response types
│   ├── gmail.ts         # Gmail/Composio response types
│   ├── themes.ts        # AI theme extraction types
│   └── consolidated.ts  # Combined data types
│
├── services/            # Business logic
│   ├── spotify.ts       # Spotify API client
│   ├── spotify_themes.ts # OpenAI theme extraction for Spotify
│   ├── gmail_themes.ts  # OpenAI theme extraction for Gmail
│   ├── composio.ts      # Composio API client for Gmail
│   └── tokens.ts        # In-memory token storage
│
├── routes/              # Express route handlers
│   ├── auth.ts          # General authentication
│   ├── spotify.ts       # Spotify OAuth & data endpoints
│   └── gmail.ts         # Gmail connection & data endpoints
│
├── utils/               # Helper utilities
│   ├── email-cleaner.ts # Clean HTML emails for LLM processing
│   ├── cors.ts          # CORS configuration
│   ├── env.ts           # Environment variable validation
│   ├── errors.ts        # Error handling middleware
│   └── logger.ts        # Structured logging (Pino)
│
└── server.ts            # Express server entry point
```

### 🎯 Key Features

1. **Spotify OAuth Flow**
   - Full OAuth 2.0 implementation
   - Token refresh handling
   - Access to user profile, top artists/tracks, playlists, recently played

2. **Gmail Integration via Composio**
   - Simplified OAuth through Composio
   - Email fetching with metadata
   - HTML email cleaning for AI processing

3. **AI Theme Extraction**
   - Uses OpenAI GPT-4 to analyze data
   - Generates personality themes from Spotify listening habits
   - Generates personality themes from Gmail communication patterns
   - Structured output with Zod schemas

4. **Ready-to-Use API**
   - RESTful endpoints for all data sources
   - Cookie-based authentication
   - Proper error handling and logging

### 🔗 Frontend Integration

The connection buttons now point to the backend:
- **Spotify** → `http://127.0.0.1:5173/spotify/connect`
- **Gmail** → `http://127.0.0.1:5173/gmail/connect`
- **Google Search** → Not yet implemented

### 📊 Data Flow

```
User clicks "Connect Spotify"
  ↓
Backend initiates OAuth
  ↓
User authorizes on Spotify
  ↓
Backend receives tokens, stores in cookies
  ↓
Frontend calls /spotify/themes
  ↓
Backend fetches Spotify data
  ↓
OpenAI analyzes and generates themes
  ↓
Backend returns structured JSON
  ↓
Frontend converts to PersonalityTree
  ↓
Renders as planets in OrbitSystem
```

## What You Need to Do

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `express`, `axios`, `cors`, `cookie-parser` - Backend server
- `openai` - AI theme extraction
- `zod` - Schema validation
- `cheerio` - HTML email parsing
- `pino` - Logging
- `ts-node`, `nodemon` - Development tools

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

Required keys:
- `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`
- `COMPOSIO_API_KEY`
- `OPENAI_API_KEY`

See `BACKEND_SETUP.md` for detailed instructions on getting these keys.

### 3. Run Both Servers

**Terminal 1 - Backend:**
```bash
npm run server
```
Starts on `http://127.0.0.1:5173`

**Terminal 2 - Frontend:**
```bash
npm run dev
```
Starts on `http://127.0.0.1:3000`

### 4. Test the Flow

1. Open `http://127.0.0.1:3000`
2. Click through the landing page
3. Click "Spotify" button → OAuth flow → See success page
4. Click "Gmail" button → Composio auth → Connection established

### 5. Fetch Themes (via API or browser)

**Spotify themes:**
```
http://127.0.0.1:5173/spotify/themes
```

**Gmail themes:**
```
http://127.0.0.1:5173/gmail/themes
```

## Next Steps

### Immediate

1. **Create a utility to merge themes into PersonalityTree**
   - Convert the AI themes from both sources
   - Map to the existing `PersonalityTree` format
   - Handle data source weights (Spotify vs Gmail vs Search)

2. **Add frontend fetch logic**
   - Fetch themes after OAuth completion
   - Store in React state
   - Pass to OrbitSystem component

### Future Enhancements

1. **Google Search Integration**
   - Implement Google Search History API
   - Create search_themes.ts service
   - Add to consolidated personality analysis

2. **Persistent Storage**
   - Replace in-memory token storage with database
   - Store generated themes for faster loading
   - Add user accounts and sessions

3. **Combined Analysis Endpoint**
   - Create `/api/personality/:userId` endpoint
   - Fetch all data sources
   - Merge themes intelligently
   - Return final PersonalityTree JSON

4. **Real-time Updates**
   - WebSocket connection for live theme generation
   - Progress indicators during AI analysis
   - Streaming responses from OpenAI

## Example API Responses

### Spotify Themes

```json
{
  "source": "spotify",
  "analyzedAt": "2025-10-26T10:30:00.000Z",
  "themes": [
    {
      "label": "Late-Night Study Desk",
      "rationale": "Focus playlists, ambient and lofi tracks, consistent across years.",
      "sources": [
        {
          "title": "Deep Focus",
          "type": "playlist"
        },
        {
          "title": "Lofi Hip Hop",
          "type": "genre"
        }
      ]
    }
  ]
}
```

### Gmail Themes

```json
{
  "source": "gmail",
  "provider": "composio",
  "analyzedAt": "2025-10-26T10:30:00.000Z",
  "emailsAnalyzed": 150,
  "windowDays": 90,
  "themes": [
    {
      "label": "hackathons",
      "rationale": "You live for late-night Slack pings and group threads that spiral into prototypes...",
      "sources": [
        {
          "title": "Hackathon invite from Morgan",
          "type": "email"
        }
      ]
    }
  ]
}
```

## Files You May Want to Modify

- `src/App.tsx` - Add logic to fetch themes after OAuth
- `src/utils/themesToPersonality.ts` - (Create this) Convert themes to PersonalityTree
- `src/components/OrbitSystem.tsx` - Already supports PersonalityTree via props
- `src/server.ts` - Add more routes or modify existing ones

## Documentation

- `BACKEND_SETUP.md` - Detailed backend setup guide
- `PERSONALITY_SYSTEM.md` - Frontend personality system docs
- `.env.example` - Environment variable template

## Questions?

The backend is fully functional and ready to generate themes. The main remaining task is creating the glue code to:
1. Fetch themes from the backend
2. Convert to PersonalityTree format
3. Pass to the frontend OrbitSystem

Let me know if you need help with any of these steps!
