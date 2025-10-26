# Backend Setup Guide

This guide explains how to set up and run the backend server for Orbit.

## Overview

The backend provides:
1. **Spotify OAuth** - Authenticate users and fetch their listening data
2. **Gmail Integration** - Connect via Composio to access email data
3. **AI Theme Extraction** - Use OpenAI to analyze data and generate personality themes
4. **JSON API** - Endpoints that return data in the format needed by the frontend

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```env
# Server Configuration
SERVER_PORT=5173
ORIGIN=http://127.0.0.1:3000

# Spotify Configuration
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/spotify/callback

# Gmail/Composio Configuration
COMPOSIO_API_KEY=your_composio_api_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
```

### 3. Run the Backend Server

```bash
npm run server
```

The server will start on `http://127.0.0.1:5173`

### 4. Run the Frontend (in a separate terminal)

```bash
npm run dev
```

The frontend will start on `http://127.0.0.1:3000`

## Getting API Keys

### Spotify API

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add redirect URI: `http://127.0.0.1:5173/spotify/callback`
4. Copy Client ID and Client Secret to `.env`

### Composio (for Gmail)

1. Sign up at [Composio](https://app.composio.dev)
2. Get your API key from the dashboard
3. Add to `.env`

### OpenAI API

1. Sign up at [OpenAI Platform](https://platform.openai.com)
2. Create an API key
3. Add to `.env`

## API Endpoints

### Spotify

| Endpoint | Description |
|----------|-------------|
| `GET /spotify/connect` | Initiate Spotify OAuth flow |
| `GET /spotify/callback` | OAuth callback (handled automatically) |
| `GET /spotify/profile` | Get user's Spotify profile |
| `GET /spotify/top-artists` | Get top 25 artists |
| `GET /spotify/top-tracks` | Get top 25 tracks |
| `GET /spotify/playlists` | Get all playlists |
| `GET /spotify/recent` | Get last 50 recently played tracks |
| `GET /spotify/themes` | **AI-generated music themes** |

### Gmail

| Endpoint | Description |
|----------|-------------|
| `GET /gmail/connect` | Initiate Gmail connection via Composio |
| `GET /gmail/status` | Check connection status |
| `GET /gmail/messages` | Fetch recent emails |
| `GET /gmail/themes` | **AI-generated email themes** |

### Authentication

| Endpoint | Description |
|----------|-------------|
| `GET /status` | Check server status |

## Usage Flow

### 1. Connect Data Sources

Users click the connection buttons on the frontend:
- **Spotify** → Opens OAuth flow → Redirects back with access token
- **Gmail** → Opens Composio auth → Redirects back when connected

### 2. Fetch Themes

Once connected, the frontend can call:

```javascript
// Get Spotify themes
const spotifyThemes = await fetch('http://127.0.0.1:5173/spotify/themes', {
  credentials: 'include' // Important: sends cookies
});

// Get Gmail themes
const gmailThemes = await fetch('http://127.0.0.1:5173/gmail/themes', {
  credentials: 'include'
});
```

### 3. Theme Response Format

Both endpoints return a similar format:

```json
{
  "source": "spotify" | "gmail",
  "analyzedAt": "2025-10-26T10:30:00.000Z",
  "themes": [
    {
      "label": "Late Night Programming",
      "rationale": "You live for late-night Slack pings and group threads...",
      "sources": [
        {
          "title": "Focus playlist",
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

## Integrating with Personality System

To convert the themes to the PersonalityTree format:

```typescript
import { convertThemesToPersonalityTree } from './utils/themesToPersonality';

// Fetch themes from both sources
const spotifyThemes = await fetch('/spotify/themes').then(r => r.json());
const gmailThemes = await fetch('/gmail/themes').then(r => r.json());

// Convert to PersonalityTree
const personalityTree = convertThemesToPersonalityTree({
  spotifyThemes: spotifyThemes.themes,
  gmailThemes: gmailThemes.themes,
  userId: 'user-123'
});

// Pass to OrbitSystem
<OrbitSystem
  centerX={width / 2}
  centerY={height / 2}
  personalityTree={personalityTree}
/>
```

## Development

### Mock Mode

For testing without real API connections:

```env
MOCK_MODE=true
```

This returns sample data without requiring actual API keys.

### Logging

The server uses `pino` for structured logging. Logs appear in the console with JSON formatting.

### CORS

The server is configured to accept requests from:
- `http://127.0.0.1:3000` (frontend)
- `http://localhost:3000` (fallback)

Credentials (cookies) are enabled for authentication.

## Troubleshooting

### "No access token provided"

Make sure you:
1. Connected Spotify/Gmail first
2. Use `credentials: 'include'` in fetch requests
3. Access via `127.0.0.1`, not `localhost`

### "State mismatch" during OAuth

This happens when cookies aren't preserved. Make sure:
1. You're using `127.0.0.1` (not `localhost`)
2. Cookies are enabled in your browser
3. The redirect URI matches exactly

### "Composio connection failed"

Check:
1. Your Composio API key is valid
2. The integration is enabled in Composio dashboard
3. You haven't exceeded API limits

## Architecture

```
src/
├── server.ts              # Express app entry point
├── routes/
│   ├── auth.ts           # General auth endpoints
│   ├── spotify.ts        # Spotify OAuth & data fetching
│   └── gmail.ts          # Gmail via Composio
├── services/
│   ├── spotify.ts        # Spotify API client
│   ├── spotify_themes.ts # OpenAI theme extraction (Spotify)
│   ├── gmail_themes.ts   # OpenAI theme extraction (Gmail)
│   ├── composio.ts       # Composio API client
│   └── tokens.ts         # Token storage (in-memory)
├── schemas/
│   ├── spotify.ts        # Zod schemas for Spotify data
│   ├── gmail.ts          # Zod schemas for Gmail data
│   ├── themes.ts         # Zod schemas for AI themes
│   └── consolidated.ts   # Combined data schemas
└── utils/
    ├── email-cleaner.ts  # HTML email cleaning
    ├── cors.ts           # CORS configuration
    ├── env.ts            # Environment validation
    ├── errors.ts         # Error handling middleware
    └── logger.ts         # Pino logger setup
```

## Next Steps

1. Implement a utility to convert themes to PersonalityTree format
2. Add persistent storage (database) for tokens and themes
3. Add user management and sessions
4. Implement search history fetching (Google Search API)
5. Create a combined endpoint that merges all data sources
