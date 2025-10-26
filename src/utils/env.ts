import { logger } from './logger';

interface EnvConfig {
  SERVER_PORT: string;
  ORIGIN?: string;
  SPOTIFY_CLIENT_ID?: string;
  SPOTIFY_CLIENT_SECRET?: string;
  SPOTIFY_REDIRECT_URI?: string;
  COMPOSIO_API_KEY?: string;
  OPENAI_API_KEY?: string;
  MOCK_MODE?: string;
}

export function validateEnv(): void {
  const errors: string[] = [];

  if (process.env.MOCK_MODE !== 'true') {
    // Spotify required in non-mock mode
    if (!process.env.SPOTIFY_CLIENT_ID) {
      errors.push('SPOTIFY_CLIENT_ID is not set');
    }
    if (!process.env.SPOTIFY_CLIENT_SECRET) {
      errors.push('SPOTIFY_CLIENT_SECRET is not set');
    }
    if (!process.env.SPOTIFY_REDIRECT_URI) {
      errors.push('SPOTIFY_REDIRECT_URI is not set');
    }
  }

  if (errors.length > 0) {
    logger.warn({ errors }, 'Missing optional environment variables');
    logger.warn('Some features may not work properly. Set MOCK_MODE=true to test without credentials.');
  }

  logger.info('Environment validation complete');
}

export function getEnv(): EnvConfig {
  return {
    SERVER_PORT: process.env.SERVER_PORT || '5173',
    ORIGIN: process.env.ORIGIN,
    SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
    SPOTIFY_REDIRECT_URI: process.env.SPOTIFY_REDIRECT_URI,
    COMPOSIO_API_KEY: process.env.COMPOSIO_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    MOCK_MODE: process.env.MOCK_MODE,
  };
}

