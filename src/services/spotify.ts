import axios, { AxiosError } from 'axios';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

export async function spotifyGet<T>(
  url: string,
  accessToken: string,
  retryOn429 = true
): Promise<T> {
  try {
    const response = await axios.get<T>(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response?.status === 429 && retryOn429) {
        const retryAfter = parseInt(axiosError.response.headers['retry-after'] || '1', 10);
        logger.warn({ url, retryAfter }, 'Rate limited, retrying after delay');
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return spotifyGet<T>(url, accessToken, false);
      }
      
      if (axiosError.response?.status === 401) {
        throw new AppError(401, 'Spotify access token expired or invalid');
      }
      
      throw new AppError(
        axiosError.response?.status || 500,
        `Spotify API error: ${axiosError.message}`
      );
    }
    throw error;
  }
}

export async function spotifyPaginate<T>(
  url: string,
  accessToken: string,
  itemsKey = 'items'
): Promise<T[]> {
  const allItems: T[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    const response: { items: T[]; next: string | null } = await spotifyGet<{ items: T[]; next: string | null }>(
      nextUrl,
      accessToken
    );
    allItems.push(...response.items);
    nextUrl = response.next;
  }

  return allItems;
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new AppError(500, 'Missing Spotify configuration');
  }

  const response = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
    }
  );

  return response.data;
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new AppError(500, 'Missing Spotify configuration');
  }

  const response = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
    }
  );

  return response.data;
}

export { SPOTIFY_API_BASE };

