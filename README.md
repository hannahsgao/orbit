# Orbit - Personality Solar System

An interactive visualization of your digital personality, generated from your Spotify, Gmail, and search data using AI.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
- `SPOTIFY_CLIENT_ID` & `SPOTIFY_CLIENT_SECRET` - [Get from Spotify Dashboard](https://developer.spotify.com/dashboard)
- `COMPOSIO_API_KEY` - [Get from Composio](https://app.composio.dev)
- `OPENAI_API_KEY` - [Get from OpenAI](https://platform.openai.com)

### 3. Run Both Servers

**Terminal 1 - Backend (API Server):**
```bash
npm run server
```
Server runs on `http://127.0.0.1:5173`

**Terminal 2 - Frontend (React App):**
```bash
npm run dev
```
App runs on `http://127.0.0.1:3000`

### 4. Use the App

1. Open `http://127.0.0.1:3000`
2. Click "Enter" to enter the solar system
3. Connect your data sources (Spotify, Gmail)
4. Click "Load Themes" to generate your personality planets
5. Explore your personalized solar system!

## Features

- 🎵 **Spotify Integration** - Analyze your music taste and listening habits
- 📧 **Gmail Integration** - Analyze your communication patterns
- 🤖 **AI-Powered Themes** - GPT-4 generates personality insights
- 🪐 **Interactive Planets** - Each theme becomes a planet you can explore
- 🎨 **Visual Coding** - Colors represent data sources (green=Spotify, red=Gmail, blue=Search)

## Documentation

- **[USAGE_GUIDE.md](./USAGE_GUIDE.md)** - Complete usage guide
- **[BACKEND_SETUP.md](./BACKEND_SETUP.md)** - Backend setup details
- **[PERSONALITY_SYSTEM.md](./PERSONALITY_SYSTEM.md)** - Frontend architecture

## Tech Stack

**Frontend:** React, TypeScript, Vite
**Backend:** Express, Node.js
**AI:** OpenAI GPT-4
**Integrations:** Spotify API, Composio (Gmail)

## Troubleshooting

- Always use `127.0.0.1` (not `localhost`) for OAuth to work properly
- Make sure both servers are running before loading themes
- Check `.env` file has all required API keys
- See [USAGE_GUIDE.md](./USAGE_GUIDE.md) for detailed troubleshooting
