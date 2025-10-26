import axios from 'axios';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

const COMPOSIO_API_BASE = 'https://backend.composio.dev/api/v3';

interface ComposioConfig {
  apiKey: string;
}

let config: ComposioConfig | null = null;

export function initComposio(apiKey: string): void {
  config = { apiKey };
}

function getConfig(): ComposioConfig {
  if (!config) {
    const apiKey = process.env.COMPOSIO_API_KEY;
    if (!apiKey) {
      throw new AppError(500, 'COMPOSIO_API_KEY not set in environment');
    }
    config = { apiKey };
  }
  return config;
}

function getHeaders() {
  const { apiKey } = getConfig();
  return {
    'X-API-KEY': apiKey,
    'Content-Type': 'application/json',
  };
}

// Auth Configs
export interface AuthConfig {
  id: string;
  toolkit: string;
  name?: string;
}

// Connected Accounts
export interface ConnectedAccount {
  id: string;
  integrationId: string;
  clientUniqueUserId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionRequest {
  connectionStatus: string;
  connectedAccountId: string;
  redirectUrl: string;
}

// Cache auth config IDs to avoid recreating them
const authConfigCache = new Map<string, string>();

export async function getOrCreateAuthConfig(toolkit: string): Promise<string> {
  // Check cache first
  if (authConfigCache.has(toolkit)) {
    return authConfigCache.get(toolkit)!;
  }

  try {
    // Try to list existing auth configs for this toolkit
    const listResponse = await axios.get(
      `${COMPOSIO_API_BASE}/auth_configs`,
      {
        headers: getHeaders(),
        params: {
          toolkit: toolkit,
        },
      }
    );

    const configs = listResponse.data.items || [];
    if (configs.length > 0) {
      // Use the first available config
      const configId = configs[0].id;
      authConfigCache.set(toolkit, configId);
      logger.info({ toolkit, configId }, 'Found existing auth config');
      return configId;
    }

    // No config exists, create one
    const createResponse = await axios.post(
      `${COMPOSIO_API_BASE}/auth_configs`,
      {
        toolkit: {
          slug: toolkit,
        },
      },
      { headers: getHeaders() }
    );

    const configId = createResponse.data.id;
    authConfigCache.set(toolkit, configId);
    logger.info({ toolkit, configId }, 'Created new auth config');
    return configId;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      logger.error({ 
        error: error.response.data,
        toolkit 
      }, 'Failed to get or create auth config');
    }
    throw new AppError(500, `Failed to get or create auth config for ${toolkit}`);
  }
}

export async function initiateConnection(
  userId: string,
  toolkit: string = 'gmail'
): Promise<ConnectionRequest> {
  try {
    // Get or create auth config for this toolkit
    const authConfigId = await getOrCreateAuthConfig(toolkit);

    // V3 API: Use /connected_accounts/link endpoint
    const response = await axios.post(
      `${COMPOSIO_API_BASE}/connected_accounts/link`,
      {
        user_id: userId,
        auth_config_id: authConfigId,
        integration_id: toolkit,
      },
      { headers: getHeaders() }
    );

    logger.info({ userId, toolkit, authConfigId, response: response.data }, 'Created Composio auth link');
    return {
      connectionStatus: 'initiated',
      connectedAccountId: response.data.connected_account_id,
      redirectUrl: response.data.redirect_url,
    };
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      logger.error({ 
        error: error.response.data,
        status: error.response.status,
        userId, 
        toolkit,
        url: `${COMPOSIO_API_BASE}/connected_accounts/link`
      }, 'Failed to create Composio auth link');
      throw new AppError(500, `Composio API error: ${JSON.stringify(error.response.data)}`);
    }
    logger.error({ error, userId, toolkit }, 'Failed to create Composio auth link');
    throw new AppError(500, 'Failed to create auth link with Composio');
  }
}

export async function getConnectedAccount(
  userId: string,
  toolkit: string = 'gmail'
): Promise<ConnectedAccount | null> {
  try {
    // V3 API: List all connected accounts - filtering by query params doesn't always work
    // So we fetch all and filter client-side
    const response = await axios.get(
      `${COMPOSIO_API_BASE}/connected_accounts`,
      {
        headers: getHeaders(),
        params: {
          showDisabled: false,
        },
      }
    );

    const data = response.data;
    const allAccounts = data.items || data.connectedAccounts || data || [];
    
    if (!Array.isArray(allAccounts)) {
      logger.warn({ userId, toolkit, responseData: data }, 'Invalid response format from Composio');
      return null;
    }

    // Filter by user_id and toolkit.slug
    const matchingAccounts = allAccounts.filter((acc: any) => 
      acc.user_id === userId && 
      acc.toolkit?.slug === toolkit &&
      (acc.status === 'ACTIVE' || acc.connectionStatus === 'ACTIVE')
    );

    if (matchingAccounts.length > 0) {
      // Get the most recent account
      const result = matchingAccounts.sort((a: any, b: any) => 
        new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime()
      )[0];
      
      logger.info({ 
        userId, 
        toolkit, 
        accountId: result.id, 
        status: result.status,
        totalMatching: matchingAccounts.length 
      }, 'Found connected account');
      return result;
    }

    logger.warn({ userId, toolkit, totalAccounts: allAccounts.length }, 'No matching connected accounts found');
    return null;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      logger.error({ 
        userId, 
        toolkit, 
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      }, 'Failed to get connected account');
    }
    return null;
  }
}

export async function listConnectedAccounts(userId: string): Promise<ConnectedAccount[]> {
  try {
    // V3 API: List connected accounts
    const response = await axios.get(
      `${COMPOSIO_API_BASE}/connected_accounts`,
      {
        headers: getHeaders(),
        params: {
          user_id: userId,
        },
      }
    );

    const data = response.data;
    return data.items || data.connectedAccounts || data || [];
  } catch (error) {
    logger.error({ error, userId }, 'Failed to list connected accounts');
    return [];
  }
}

export async function getConnectedAccountById(accountId: string): Promise<ConnectedAccount | null> {
  try {
    // V3 API: Get specific connected account by ID
    const response = await axios.get(
      `${COMPOSIO_API_BASE}/connected_accounts/${accountId}`,
      {
        headers: getHeaders(),
      }
    );

    logger.info({ accountId, account: response.data }, 'Retrieved connected account by ID');
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      logger.error({ 
        accountId, 
        status: error.response?.status,
        data: error.response?.data 
      }, 'Failed to get connected account by ID');
    }
    return null;
  }
}

// Execute Tools
export interface ToolExecutionRequest {
  connectedAccountId: string;
  appName: string;
  actionName: string;
  input: Record<string, any>;
}

export interface ToolExecutionResponse {
  data: any;
  successful: boolean;
  error?: string;
}

export async function executeTool(
  request: ToolExecutionRequest
): Promise<ToolExecutionResponse> {
  try {
    // V3 API: Use /tools/execute/{tool_slug} endpoint with 'arguments' not 'input'
    const response = await axios.post(
      `${COMPOSIO_API_BASE}/tools/execute/${request.actionName}`,
      {
        connected_account_id: request.connectedAccountId,
        arguments: request.input, // v3 uses 'arguments' instead of 'input'
      },
      { headers: getHeaders() }
    );

    return {
      data: response.data.data || response.data.response_data || response.data,
      successful: response.data.successful !== false && response.data.success !== false,
      error: response.data.error,
    };
  } catch (error: any) {
    logger.error({ error, request }, 'Failed to execute Composio tool');
    
    if (axios.isAxiosError(error) && error.response) {
      return {
        data: null,
        successful: false,
        error: error.response.data?.error || error.response.data?.message || 'Tool execution failed',
      };
    }

    throw new AppError(500, 'Failed to execute tool');
  }
}

// Gmail-specific helpers
export async function fetchGmailEmails(
  connectedAccountId: string,
  query?: string,
  maxResults: number = 100
): Promise<any> {
  return executeTool({
    connectedAccountId,
    appName: 'gmail',
    actionName: 'gmail_fetch_emails', // v3 uses lowercase snake_case
    input: {
      query: query || `newer_than:90d -category:promotions -category:social`,
      maxResults: maxResults, // camelCase for v3
      includePayload: true, // camelCase for v3
      idsOnly: false, // camelCase for v3
      userId: 'me', // camelCase for v3
    },
  });
}

export async function listGmailLabels(connectedAccountId: string): Promise<any> {
  return executeTool({
    connectedAccountId,
    appName: 'gmail',
    actionName: 'gmail_list_labels', // v3 uses lowercase snake_case
    input: {
      userId: 'me', // camelCase for v3
    },
  });
}

export async function sendGmailEmail(
  connectedAccountId: string,
  to: string,
  subject: string,
  body: string,
  isHtml: boolean = false,
  cc?: string[],
  bcc?: string[]
): Promise<any> {
  return executeTool({
    connectedAccountId,
    appName: 'gmail',
    actionName: 'gmail_send_email',
    input: {
      recipient_email: to,
      subject,
      body,
      is_html: isHtml,
      cc,
      bcc,
      user_id: 'me',
    },
  });
}

export async function searchGmailEmails(
  connectedAccountId: string,
  query: string,
  maxResults: number = 10
): Promise<any> {
  return executeTool({
    connectedAccountId,
    appName: 'gmail',
    actionName: 'gmail_search_emails',
    input: {
      query,
      maxResults,
      userId: 'me',
    },
  });
}

