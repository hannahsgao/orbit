# Complete Usage Guide

## End-to-End Flow

This guide shows you how to use the complete system from backend to frontend.

## Prerequisites

1. **API Keys Required:**
   - Spotify Client ID & Secret
   - Composio API Key (for Gmail)
   - OpenAI API Key

2. **Environment Setup:**
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

## Step-by-Step Usage

### 1. Start Both Servers

**Terminal 1 - Backend Server:**
```bash
npm install  # First time only
npm run server
```
Should see: `orbit-mcp-spotify running on http://127.0.0.1:5173`

**Terminal 2 - Frontend Dev Server:**
```bash
npm run dev
```
Should see: `http://127.0.0.1:3000`

### 2. Open the App

Navigate to: `http://127.0.0.1:3000`

You'll see the landing page with the Cow Planet logo and "Enter" button.

### 3. Enter the Solar System

Click the **Enter** button to transition to the main orbital view.

### 4. Connect Your Data Sources

In the top-left corner, you'll see the "Connections" section with buttons:

**Connect Spotify:**
1. Click **"> Spotify"** button
2. Browser redirects to Spotify OAuth
3. Click "Agree" to authorize
4. Redirected back to success page
5. Cookie is set with access token

**Connect Gmail:**
1. Click **"> Gmail"** button
2. Browser redirects to Composio auth flow
3. Select your Google account
4. Grant email read permissions
5. Redirected back (Composio handles the connection)

**Google Search:**
- Not yet implemented (button is placeholder)

### 5. Load Your Personality Themes

After connecting at least one data source:

1. Click **"> Load Themes"** button
2. The button shows "Loading..." while fetching
3. Backend processes your data through OpenAI
4. Frontend converts themes to PersonalityTree
5. Planets appear with your personalized themes!

**Status indicators:**
- ✓ Green message: "X themes loaded" (success)
- Red message: Error details (if something went wrong)

### 6. Explore Your Personality Planets

**Each planet represents a theme from your data:**
- **Color coding:**
  - Green planets = Spotify-dominant themes
  - Red planets = Gmail-dominant themes
  - Blue planets = Search-dominant themes
  - White planets = Balanced themes

**Interactions:**
- **Hover** over a planet → See tooltip with theme name and description
- **Click** a planet → Zoom in and see details
- **Labels** flash periodically showing theme names
- **Navigate** using scroll to zoom, drag to pan

### 7. Reload Themes

Click **"> Reload Themes"** to:
- Re-fetch fresh data from backend
- Regenerate themes with latest activity
- Update the orbital system with new planets

## What the Backend Does

When you click "Load Themes":

1. **Frontend** → Calls `fetchAndConvertThemes()`
2. **Fetches** from `/spotify/themes` and `/gmail/themes`
3. **Backend** for each:
   - Fetches raw data (artists, tracks, emails)
   - Sends to OpenAI with analysis prompt
   - Returns structured themes
4. **Frontend** → Converts to PersonalityTree format
5. **OrbitSystem** → Renders as planets

## API Response Examples

### Spotify Themes Response

```json
{
  "source": "spotify",
  "analyzedAt": "2025-10-26T10:30:00.000Z",
  "themes": [
    {
      "label": "Late-Night Study Desk",
      "rationale": "Focus playlists, ambient and lofi tracks, consistent across years.",
      "sources": [
        { "title": "Deep Focus", "type": "playlist" },
        { "title": "Lofi Hip Hop", "type": "genre" }
      ]
    }
  ]
}
```

### Gmail Themes Response

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
      "rationale": "You live for late-night Slack pings and group threads...",
      "sources": [
        { "title": "Hackathon invite from Morgan", "type": "email" }
      ]
    }
  ]
}
```

### Converted to PersonalityTree

The utility `convertThemesToPersonalityTree()` transforms this into:

```json
{
  "userId": "user-12345",
  "generatedAt": "2025-10-26T10:30:00.000Z",
  "nodes": [
    {
      "id": "theme-0",
      "name": "Late-Night Study Desk",
      "description": "Focus playlists, ambient and lofi tracks...",
      "level": "theme",
      "visualProperties": {
        "color": "#1DB954",
        "size": "large"
      },
      "dataSources": {
        "spotify": {
          "weight": 1.0,
          "examples": ["Deep Focus", "Lofi Hip Hop"]
        }
      },
      "parentId": null,
      "childIds": []
    }
  ],
  "rootThemeIds": ["theme-0"],
  "summary": "A personality composed of 2 music themes, 3 communication themes..."
}
```

## Troubleshooting

### "Failed to load themes. Make sure the backend server is running."

**Solution:**
- Check Terminal 1 - backend should be running
- Visit `http://127.0.0.1:5173/status` to verify
- Make sure you ran `npm install` first

### "No themes found. Make sure you have connected your accounts."

**Solution:**
- Click Spotify and/or Gmail buttons first
- Wait for OAuth to complete
- Then click "Load Themes"

### OAuth Callback Errors

**"State mismatch":**
- Always use `127.0.0.1`, not `localhost`
- Clear cookies and try again
- Check that redirect URI in Spotify dashboard matches exactly

**Connection gets stuck:**
- Check browser console for errors
- Verify API keys in `.env`
- Check backend logs in Terminal 1

### No Planets Appear

**Check:**
1. Did "Load Themes" button show success?
2. Check browser console for errors
3. Try reloading the page
4. Verify backend is returning data:
   ```bash
   # In browser, visit (after connecting):
   http://127.0.0.1:5173/spotify/themes
   ```

### Themes Are Too Generic

**Improve by:**
- Using the app more (more Spotify/Gmail activity)
- Tweaking the AI prompts in:
  - `src/services/spotify_themes.ts`
  - `src/services/gmail_themes.ts`
- Adjusting temperature in OpenAI calls

## Advanced Usage

### Use Example Data (No Backend Required)

In `src/App.tsx`:
```typescript
import { examplePersonalityTree } from './data/examplePersonality';

// Then in the component:
<OrbitSystem
  personalityTree={examplePersonalityTree}  // Use example
  ...
/>
```

### Manually Fetch Themes via API

```bash
# Get Spotify themes (after connecting)
curl http://127.0.0.1:5173/spotify/themes \
  --cookie "access_token=YOUR_TOKEN"

# Get Gmail themes (after connecting)
curl http://127.0.0.1:5173/gmail/themes \
  --cookie "session_id=YOUR_SESSION"
```

### Check Connection Status

```bash
# Spotify
curl http://127.0.0.1:5173/spotify/profile \
  --cookie "access_token=YOUR_TOKEN"

# Gmail
curl http://127.0.0.1:5173/gmail/status?userId=test-user
```

## File Reference

### Key Files You May Edit

**Frontend:**
- `src/App.tsx` - Main app, connection buttons, theme loading
- `src/utils/themesToPersonality.ts` - Convert backend themes to PersonalityTree
- `src/components/OrbitSystem.tsx` - Orbital visualization
- `src/types/personality.ts` - Type definitions

**Backend:**
- `src/server.ts` - Express server entry point
- `src/services/spotify_themes.ts` - Spotify AI analysis prompt
- `src/services/gmail_themes.ts` - Gmail AI analysis prompt
- `src/routes/spotify.ts` - Spotify endpoints
- `src/routes/gmail.ts` - Gmail endpoints

**Configuration:**
- `.env` - API keys and configuration
- `vite.config.ts` - Frontend dev server config (port, host)
- `package.json` - Dependencies and scripts

## Next Features to Implement

1. **Google Search History Integration**
   - Add Google Search API
   - Create `search_themes.ts` service
   - Add to theme merging

2. **Persistent Storage**
   - Store themes in database
   - User accounts and authentication
   - Save/load personality trees

3. **Theme Editing**
   - Allow users to edit theme names
   - Merge similar themes
   - Hide/delete themes

4. **Export/Share**
   - Generate shareable links
   - Export as image/video
   - Social media integration

5. **Real-time Updates**
   - WebSocket for live theme generation
   - Progress indicators during AI analysis
   - Streaming responses from OpenAI

## Support

For issues or questions:
- Check `BACKEND_SETUP.md` for backend setup details
- Check `INTEGRATION_SUMMARY.md` for architecture overview
- Check `PERSONALITY_SYSTEM.md` for frontend system docs
- Review browser console and backend logs for errors
