import { Router } from 'express';
import {
  initiateConnection,
  getConnectedAccount,
  listConnectedAccounts,
  fetchGmailEmails,
  listGmailLabels,
} from '../services/composio';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { redactEmail, parseFromHeader, shouldRedactSubject, computeTopTokens } from '../utils/redact';
import type { GmailMessageMeta, GmailAggregates } from '../schemas/gmail';

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

    // Parse and format messages
    const rawMessages = result.data?.messages || [];
    const messages: GmailMessageMeta[] = [];

    for (const msg of rawMessages) {
      const subject = msg.subject || '(no subject)';

      // Skip if should redact
      if (shouldRedactSubject(subject)) {
        continue;
      }

      const from = msg.from || '';
      const { name: fromName, email: fromEmail } = parseFromHeader(from);

      messages.push({
        id: msg.id,
        threadId: msg.threadId || msg.id,
        subject,
        fromName,
        fromEmail: redactEmail(fromEmail),
        date: msg.date || new Date().toISOString(),
        labels: msg.labelIds || [],
      });
    }

    return res.json({
      source: 'gmail',
      provider: 'composio',
      fetchedAt: new Date().toISOString(),
      windowDays: 90,
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

// Get Gmail summary/aggregates
router.get('/gmail/summary', async (req, res) => {
  const userId = (req.query.userId as string) || getUserId(req);

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

    // Parse messages
    const rawMessages = result.data?.messages || [];
    const messages: Array<{ subject: string; from: string }> = [];

    for (const msg of rawMessages) {
      const subject = msg.subject || '(no subject)';
      if (shouldRedactSubject(subject)) {
        continue;
      }
      messages.push({
        subject,
        from: msg.from || '',
      });
    }

    // Compute aggregates
    const senderCounts = new Map<string, number>();
    for (const msg of messages) {
      const { name, email } = parseFromHeader(msg.from);
      const senderKey = `${name} <${redactEmail(email)}>`;
      senderCounts.set(senderKey, (senderCounts.get(senderKey) || 0) + 1);
    }

    const topSenders = Array.from(senderCounts.entries())
      .map(([sender, count]) => ({ sender, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const subjects = messages.map(m => m.subject);
    const topicTokens = computeTopTokens(subjects, 20);

    const windowDays = 90;
    const cadencePerWeek = (messages.length / windowDays) * 7;

    const aggregates: GmailAggregates = {
      topSenders,
      topicTokens,
      cadencePerWeek: Math.round(cadencePerWeek * 10) / 10,
    };

    return res.json({
      source: 'gmail',
      provider: 'composio',
      fetchedAt: new Date().toISOString(),
      windowDays,
      aggregates,
    });
  } catch (error) {
    logger.error({ error, userId }, 'Failed to get Gmail summary');
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, 'Failed to get Gmail summary');
  }
});

// Get Gmail labels
router.get('/gmail/labels', async (req, res) => {
  const userId = (req.query.userId as string) || getUserId(req);

  try {
    const account = await getConnectedAccount(userId, 'gmail');
    if (!account) {
      throw new AppError(401, 'Gmail not connected. Use POST /gmail/connect first.');
    }

    const result = await listGmailLabels(userId, account.id);

    if (!result.successful) {
      throw new AppError(500, result.error || 'Failed to fetch labels');
    }

    return res.json({
      source: 'gmail',
      provider: 'composio',
      labels: result.data?.labels || [],
    });
  } catch (error) {
    logger.error({ error, userId }, 'Failed to fetch Gmail labels');
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, 'Failed to fetch Gmail labels');
  }
});

export default router;

