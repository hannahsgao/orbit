import { Router } from 'express';
import {
  initiateConnection,
  getConnectedAccount,
  listConnectedAccounts,
  fetchGmailEmails
} from '../services/composio';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { EmailCleaner } from '../utils/email-cleaner';
import { extractGmailThemes } from '../services/gmail_themes';

const router = Router();

// Helper to get user ID from request
function getUserId(req: any): string {
  // Use session_id cookie or default to 'default_user'
  return req.cookies.session_id || req.cookies.gmail_session_id || 'default_user';
}

// Initiate Gmail connection via Composio (GET - browser friendly)
router.get('/gmail/connect', async (req, res) => {
  const userId = req.query.userId as string || getUserId(req);

  logger.info({ userId }, 'Initiating Gmail connection via Composio');

  try {
    // Directly initiate connection (skip checking existing - let Composio handle duplicates)
    const connectionRequest = await initiateConnection(userId, 'gmail');

    logger.info({ userId, redirectUrl: connectionRequest.redirectUrl }, 'Got redirect URL from Composio');

    // Redirect directly to Composio auth URL
    return res.redirect(connectionRequest.redirectUrl);
  } catch (error) {
    logger.error({ error, userId }, 'Failed to initiate Gmail connection');
    return res.send(`
      <html>
        <head><title>Gmail Connection Failed</title></head>
        <body style="font-family: sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
          <h1>✗ Connection Failed</h1>
          <p>Failed to initiate Gmail connection with Composio.</p>
          <p><strong>User ID:</strong> ${userId}</p>
          <p><strong>Error:</strong> ${error instanceof Error ? error.message : 'Unknown error'}</p>
          <h3>Troubleshooting:</h3>
          <ul>
            <li>Make sure your <code>COMPOSIO_API_KEY</code> is set correctly in <code>.env</code></li>
            <li>Check that the API key is valid at <a href="https://app.composio.dev" target="_blank">app.composio.dev</a></li>
            <li>Try using a simple user ID: <a href="/gmail/connect?userId=test-user">/gmail/connect?userId=test-user</a></li>
          </ul>
          <p><a href="/gmail/connect?userId=test-user">Try again with test-user</a></p>
        </body>
      </html>
    `);
  }
});

// POST version for API usage
router.post('/gmail/connect', async (req, res) => {
  const userId = req.body.userId || getUserId(req);

  logger.info({ userId }, 'Initiating Gmail connection via Composio (POST)');

  try {
    // Check if already connected
    const existingAccount = await getConnectedAccount(userId, 'gmail');
    if (existingAccount) {
      return res.json({
        message: 'Already connected',
        connectedAccountId: existingAccount.id,
        status: 'active',
      });
    }

    // Initiate new connection
    const connectionRequest = await initiateConnection(userId, 'gmail');

    return res.json({
      message: 'Visit the redirect URL to authenticate Gmail',
      redirectUrl: connectionRequest.redirectUrl,
      connectedAccountId: connectionRequest.connectedAccountId,
      status: connectionRequest.connectionStatus,
    });
  } catch (error) {
    logger.error({ error, userId }, 'Failed to initiate Gmail connection');
    throw new AppError(500, 'Failed to initiate Gmail connection');
  }
});

// Debug: List ALL connected accounts for a user
router.get('/gmail/debug/accounts', async (req, res) => {
  const userId = (req.query.userId as string) || getUserId(req);
  
  try {
    const accounts = await listConnectedAccounts(userId);
    logger.info({ userId, count: accounts.length, fullAccounts: accounts }, 'Listed all connected accounts with full details');
    
    return res.json({
      userId,
      totalAccounts: accounts.length,
      accounts: accounts.map((acc: any) => ({
        id: acc.id,
        integrationId: acc.integrationId || acc.integration_id || acc.appName,
        status: acc.status || acc.connectionStatus,
        createdAt: acc.createdAt || acc.created_at,
        // Show all fields to debug
        raw: acc,
      })),
    });
  } catch (error: any) {
    logger.error({ error, userId }, 'Failed to list accounts');
    throw new AppError(500, 'Failed to list accounts');
  }
});

// Check Gmail connection status
router.get('/gmail/status', async (req, res) => {
  const userId = (req.query.userId as string) || getUserId(req);

  try {
    const account = await getConnectedAccount(userId, 'gmail');

    if (!account) {
      return res.json({
        connected: false,
        message: 'No Gmail account connected. Use POST /gmail/connect to authenticate.',
      });
    }

    return res.json({
      connected: true,
      connectedAccountId: account.id,
      status: account.status,
      createdAt: account.createdAt,
    });
  } catch (error) {
    logger.error({ error, userId }, 'Failed to check Gmail status');
    throw new AppError(500, 'Failed to check connection status');
  }
});

// Fetch Gmail messages
router.get('/gmail/messages', async (req, res) => {
  const userId = (req.query.userId as string) || getUserId(req);
  const includeHtml = req.query.includeHtml === 'true';

  try {
    // Get connected account
    const account = await getConnectedAccount(userId, 'gmail');
    if (!account) {
      throw new AppError(401, 'Gmail not connected. Use POST /gmail/connect first.');
    }

    // Fetch emails via Composio
    const result = await fetchGmailEmails(userId, account.id);

    if (!result.successful) {
      throw new AppError(500, result.error || 'Failed to fetch emails');
    }

    // Process and clean emails
    const rawMessages = result.data?.messages || [];
    const emailCleaner = new EmailCleaner();
    const processedEmails = emailCleaner.processEmails(rawMessages);

    // Optionally exclude HTML content to reduce payload size
    const messages = includeHtml
      ? processedEmails
      : processedEmails.map(({ htmlContent, ...rest }) => rest);

    logger.info({ userId, count: messages.length }, 'Processed Gmail messages');

    return res.json({
      source: 'gmail',
      provider: 'composio',
      fetchedAt: new Date().toISOString(),
      windowDays: 90,
      count: messages.length,
      messages,
    });
  } catch (error) {
    logger.error({ error, userId }, 'Failed to fetch Gmail messages');
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, 'Failed to fetch Gmail messages');
  }
});

// Extract Gmail themes using AI
router.get('/gmail/themes', async (req, res) => {
  const userId = (req.query.userId as string) || getUserId(req);

  try {
    // Get connected account
    const account = await getConnectedAccount(userId, 'gmail');
    if (!account) {
      return res.status(401).json({
        error: 'Gmail not connected',
        message: 'Please authenticate with Gmail first',
        connectUrl: '/gmail/connect'
      });
    }

    // Fetch emails via Composio
    const result = await fetchGmailEmails(userId, account.id);

    if (!result.successful) {
      throw new AppError(500, result.error || 'Failed to fetch emails');
    }

    // Process emails
    const rawMessages = result.data?.messages || [];
    const emailCleaner = new EmailCleaner();
    const processedEmails = emailCleaner.processEmails(rawMessages);

    if (processedEmails.length === 0) {
      throw new AppError(400, 'No emails found to analyze. Connect Gmail and ensure you have emails in your inbox.');
    }

    logger.info({ userId, emailCount: processedEmails.length }, 'Extracting Gmail themes');

    // Extract themes using AI
    const themes = await extractGmailThemes({
      emails: processedEmails,
      totalCount: processedEmails.length,
      windowDays: 90,
    });

    return res.json({
      source: 'gmail',
      provider: 'composio',
      analyzedAt: new Date().toISOString(),
      emailsAnalyzed: processedEmails.length,
      windowDays: 90,
      themes: themes.themes,
    });
  } catch (error) {
    logger.error({ error, userId }, 'Failed to extract Gmail themes');
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message
      });
    }
    return res.status(500).json({
      error: 'Failed to extract Gmail themes'
    });
  }
});

export default router;

