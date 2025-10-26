# Spotify to OpenAI Workflow

## Complete Flow

### 1. User Authentication (Spotify OAuth)

**Start Authentication:**
```
GET http://127.0.0.1:5173/auth/login
```

This will:
- Generate a random state for CSRF protection
- Set a `spotify_auth_state` cookie
- Redirect user to Spotify's OAuth authorization page
- Request scopes: `user-read-email`, `user-top-read`, `playlist-read-private`, `user-read-recently-played`

**OAuth Callback:**
```
GET http://127.0.0.1:5173/auth/callback?code=...&state=...
```

This will:
- Validate state matches the cookie (prevents CSRF)
- Exchange authorization code for access & refresh tokens
- Store tokens in:
  - `access_token` cookie (expires in 55 minutes)
  - `refresh_token` cookie (expires in 7 days)
  - `session_id` cookie (expires in 7 days)
  - In-memory token store
- Redirect to frontend or show success page

### 2. Extract Data from Spotify

**Individual Endpoints:**
```
GET /spotify/profile          - User profile
GET /spotify/top-artists      - Top 25 artists (medium_term)
GET /spotify/top-tracks       - Top 25 tracks (medium_term)
GET /spotify/playlists        - All user playlists
GET /spotify/recent           - Last 50 recently played tracks
```

**All-in-One Theme Extraction:**
```
GET /spotify/themes
```

This endpoint automatically:
1. Fetches top 50 artists (medium term)
2. Fetches top 50 tracks (medium term)
3. Fetches all playlists (paginated)
4. Fetches last 50 recently played tracks

All requests happen in parallel for performance.

### 3. Pass Data to OpenAI

The `/spotify/themes` endpoint then:
1. Formats all Spotify data into a structured prompt
2. Calls OpenAI's `gpt-4o-2024-08-06` model
3. Uses structured output with Zod schema validation
4. Returns 5-7 musical themes with:
   - Creative labels (e.g., "Ambient Focus Flow")
   - Psychological/cultural rationale
   - 3-5 specific sources (artists, tracks, playlists)

**Example Response:**
```json
{
  "themes": [
    {
      "label": "Indie Nostalgia Seeker",
      "rationale": "Your top artists reveal a deep connection to indie rock from the 2000s-2010s era...",
      "sources": [
        { "title": "The National", "type": "artist" },
        { "title": "Bloodbuzz Ohio", "type": "track" },
        { "title": "Chill Indie", "type": "playlist" }
      ]
    },
    // ... 4-6 more themes
  ]
}
```

## Authentication Details

All Spotify API calls require the `access_token` cookie set during OAuth.

**Token Refresh:**
```
POST /auth/refresh
```
- Automatically refreshes expired access tokens
- Uses the `refresh_token` cookie
- Updates `access_token` cookie

**Logout:**
```
POST /auth/logout
```
- Clears all cookies
- Removes tokens from memory store

## Important: 127.0.0.1 vs localhost

**Always use `127.0.0.1` instead of `localhost`** for cookie handling to work properly:

- Backend: `http://127.0.0.1:5173`
- Frontend: `http://127.0.0.1:3000`
- Spotify Redirect URI: `http://127.0.0.1:5173/auth/callback`

Browsers treat `localhost` and `127.0.0.1` as different domains for cookie purposes, which breaks authentication.

## Environment Variables

Required `.env` configuration:

```env
SERVER_PORT=5173
ORIGIN=http://127.0.0.1:3000
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/auth/callback
OPENAI_API_KEY=your_openai_key
```

## Mock Mode

For testing without credentials:
```env
MOCK_MODE=true
```

This returns fake data for all endpoints.

## Error Handling

- `401` - No access token or expired token (need to re-authenticate or refresh)
- `429` - Rate limited by Spotify (auto-retries once)
- `500` - Server error (check logs for details)

All errors are logged with structured logging via Pino.

