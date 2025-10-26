import { Router } from 'express';
import { refreshAccessToken } from '../services/spotify';
import { tokenStore } from '../services/tokens';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

const router = Router();

// Token refresh endpoint (used by both Spotify and Gmail clients)
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

