import { Router } from 'express';
import { randomBytes } from 'crypto';
import { exchangeCodeForTokens, refreshAccessToken } from '../services/spotify';
import { tokenStore } from '../services/tokens';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

const router = Router();

const SCOPES = [
  'user-read-email',
  'user-top-read',
  'playlist-read-private',
  'user-read-recently-played',
].join(' ');

router.get('/auth/login', (_req, res) => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new AppError(500, 'Missing Spotify configuration');
  }

  const state = randomBytes(16).toString('hex');
  res.cookie('spotify_auth_state', state, {
    httpOnly: true,
    maxAge: 5 * 60 * 1000, // 5 minutes
    sameSite: 'lax',
    path: '/',
  });

  logger.info({ state }, 'Setting auth state cookie');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: SCOPES,
    redirect_uri: redirectUri,
    state,
  });

  return res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
});

router.get('/auth/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const storedState = req.cookies.spotify_auth_state;

  logger.info({ 
    receivedState: state, 
    storedState, 
    allCookies: Object.keys(req.cookies),
    hasCode: !!code 
  }, 'OAuth callback received');

  if (error) {
    logger.error({ error }, 'Spotify authorization error');
    return res.status(400).json({ error: 'Authorization failed' });
  }

  if (!state || state !== storedState) {
    logger.error({ state, storedState }, 'State mismatch');
    return res.status(400).json({ 
      error: 'State mismatch',
      details: `Received: ${state}, Expected: ${storedState}`,
      hint: 'Make sure you access the server via 127.0.0.1, not localhost'
    });
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const expiresAt = Date.now() + tokens.expires_in * 1000;

    const sessionId = randomBytes(16).toString('hex');
    tokenStore.set(sessionId, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
    });

    res.cookie('session_id', sessionId, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax',
      path: '/',
    });

    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      maxAge: 55 * 60 * 1000, // 55 minutes
      sameSite: 'lax',
      path: '/',
    });

    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax',
      path: '/',
    });

    res.clearCookie('spotify_auth_state');

    const origin = process.env.ORIGIN || 'http://localhost:3000';
    
    // If no frontend is running, show success page from backend
    if (!process.env.ORIGIN || process.env.ORIGIN === 'http://localhost:3000') {
      return res.send(`
        <html>
          <head><title>Authentication Successful</title></head>
          <body style="font-family: sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
            <h1>✓ Authentication Successful</h1>
            <p>You have successfully connected your Spotify account.</p>
            <h3>Try these endpoints:</h3>
            <ul>
              <li><a href="/spotify/profile">GET /spotify/profile</a></li>
              <li><a href="/spotify/top-artists">GET /spotify/top-artists</a></li>
              <li><a href="/spotify/top-tracks">GET /spotify/top-tracks</a></li>
              <li><a href="/spotify/playlists">GET /spotify/playlists</a></li>
              <li><a href="/spotify/recent">GET /spotify/recent</a></li>
              <li><a href="/mcp/spotify/data">GET /mcp/spotify/data</a> (consolidated)</li>
              <li><a href="/mcp/spotify/themes">GET /mcp/spotify/themes</a> (themes for Orbit)</li>
            </ul>
            <p><small>Session ID: ${sessionId}</small></p>
          </body>
        </html>
      `);
    }
    
    return res.redirect(`${origin}/success`);
  } catch (error) {
    logger.error({ error }, 'Token exchange failed');
    return res.status(500).json({ error: 'Failed to exchange authorization code' });
  }
});

router.post('/auth/refresh', async (req, res) => {
  const refreshToken = req.cookies.refresh_token;
  const sessionId = req.cookies.session_id;

  if (!refreshToken) {
    throw new AppError(401, 'No refresh token provided');
  }

  try {
    const tokens = await refreshAccessToken(refreshToken);
    const expiresAt = Date.now() + tokens.expires_in * 1000;

    if (sessionId) {
      const existingTokens = tokenStore.get(sessionId);
      if (existingTokens) {
        tokenStore.set(sessionId, {
          accessToken: tokens.access_token,
          refreshToken: existingTokens.refreshToken,
          expiresAt,
        });
      }
    }

    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      maxAge: 55 * 60 * 1000,
      sameSite: 'lax',
      path: '/',
    });

    return res.json({ message: 'Token refreshed successfully' });
  } catch (error) {
    logger.error({ error }, 'Token refresh failed');
    throw new AppError(401, 'Failed to refresh token');
  }
});

router.post('/auth/logout', (req, res) => {
  const sessionId = req.cookies.session_id;

  if (sessionId) {
    tokenStore.clear(sessionId);
  }

  res.clearCookie('session_id');
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');

  return res.json({ message: 'Logged out successfully' });
});

export default router;

