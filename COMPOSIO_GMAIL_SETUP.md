# Gmail Integration with Composio

## Overview

This backend now uses **Composio** for Gmail integration instead of direct Google OAuth. Composio handles all authentication, API calls, and tool execution for you.

## Benefits of Composio

- No need to manage Google OAuth apps
- No verification process required
- Managed authentication and token refresh
- Access to 100+ pre-built tools
- Trigger support for real-time events
- Built-in rate limiting and error handling

---

## Setup Steps

### 1. Get Composio API Key

1. Visit https://app.composio.dev
2. Sign up or log in
3. Go to API Keys section
4. Create a new API key
5. Copy the key (starts with `composio_`)

### 2. Add to Environment

Add to your `.env` file:

```env
COMPOSIO_API_KEY=your_composio_api_key_here
```

**Remove old Google OAuth variables** (no longer needed):
```env
# Delete these lines:
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
# GOOGLE_REDIRECT_URI=...
# GMAIL_WINDOW_DAYS=...
```

### 3. Restart Server

```bash
npm run dev
```

---

## How to Use

### Step 1: Connect Gmail Account

**Request:**
```bash
curl -X POST http://127.0.0.1:5173/gmail/connect \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123"}'
```

**Response:**
```json
{
  "message": "Visit the redirect URL to authenticate Gmail",
  "redirectUrl": "https://app.composio.dev/authorize/...",
  "connectedAccountId": "ac_123456",
  "status": "PENDING"
}
```

**Action:** Open the `redirectUrl` in your browser and complete the Gmail OAuth flow.

---

### Step 2: Check Connection Status

```bash
curl http://127.0.0.1:5173/gmail/status \
  --cookie "session_id=YOUR_SESSION_ID"
```

**Response when connected:**
```json
{
  "connected": true,
  "connectedAccountId": "ac_123456",
  "status": "ACTIVE",
  "createdAt": "2025-10-26T12:00:00Z"
}
```

**Response when not connected:**
```json
{
  "connected": false,
  "message": "No Gmail account connected. Use POST /gmail/connect to authenticate."
}
```

---

### Step 3: Fetch Gmail Messages

Once connected, fetch your email metadata:

```bash
curl http://127.0.0.1:5173/gmail/messages \
  --cookie "session_id=YOUR_SESSION_ID"
```

**Response:**
```json
{
  "source": "gmail",
  "provider": "composio",
  "fetchedAt": "2025-10-26T12:30:00Z",
  "windowDays": 90,
  "messages": [
    {
      "id": "18c1234567890abcd",
      "threadId": "18c1234567890abcd",
      "subject": "Meeting tomorrow at 3pm",
      "fromName": "Jane Doe",
      "fromEmail": "ja***@c***.com",
      "date": "2025-10-25T14:32:00Z",
      "labels": ["INBOX", "IMPORTANT"]
    }
  ]
}
```

---

### Step 4: Get Gmail Summary

Get aggregated insights from your emails:

```bash
curl http://127.0.0.1:5173/gmail/summary \
  --cookie "session_id=YOUR_SESSION_ID"
```

**Response:**
```json
{
  "source": "gmail",
  "provider": "composio",
  "fetchedAt": "2025-10-26T12:30:00Z",
  "windowDays": 90,
  "aggregates": {
    "topSenders": [
      { "sender": "Jane Doe <ja***@c***.com>", "count": 45 },
      { "sender": "Work Team <te***@w***.com>", "count": 32 }
    ],
    "topicTokens": [
      { "token": "meeting", "score": 0.82 },
      { "token": "project update", "score": 0.65 }
    ],
    "cadencePerWeek": 42.3
  }
}
```

---

### Step 5: List Gmail Labels

```bash
curl http://127.0.0.1:5173/gmail/labels \
  --cookie "session_id=YOUR_SESSION_ID"
```

**Response:**
```json
{
  "source": "gmail",
  "provider": "composio",
  "labels": [
    {
      "id": "INBOX",
      "name": "INBOX",
      "type": "system"
    },
    {
      "id": "Label_123",
      "name": "Work",
      "type": "user"
    }
  ]
}
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/gmail/connect` | POST | Initiate Gmail connection via Composio |
| `/gmail/status` | GET | Check Gmail connection status |
| `/gmail/messages` | GET | Fetch email metadata (last 90 days) |
| `/gmail/summary` | GET | Get aggregated email insights |
| `/gmail/labels` | GET | List Gmail labels |

---

## User Management

### Multiple Users

Composio supports multiple users via `userId`. Each user gets their own connected account:

```bash
# User 1
curl -X POST http://127.0.0.1:5173/gmail/connect \
  -d '{"userId": "alice@example.com"}'

# User 2
curl -X POST http://127.0.0.1:5173/gmail/connect \
  -d '{"userId": "bob@example.com"}'
```

### User ID Strategy

The backend determines `userId` from:
1. `userId` in request body (if provided)
2. `session_id` cookie (from Spotify auth)
3. `gmail_session_id` cookie
4. Default: `'default_user'`

**Recommendation:** Always pass `userId` explicitly for multi-user scenarios.

---

## Integration with Letta AI

You can ingest Gmail data into Letta for personality analysis:

### Future Implementation

```typescript
// Example: Ingest Gmail into Letta
POST /letta/ingest/gmail
{
  "agentId": "agent_abc123",
  "userId": "user123"
}
```

This would:
1. Fetch Gmail summary for the user
2. Extract communication patterns
3. Send to Letta agent
4. Update `communication_patterns` memory block

---

## Available Composio Gmail Tools

Composio provides 30+ Gmail tools. Currently implemented:

- ✅ `GMAIL_FETCH_EMAILS` - Fetch email messages
- ✅ `GMAIL_LIST_LABELS` - List Gmail labels

**Available but not yet exposed:**
- `GMAIL_SEND_EMAIL` - Send emails
- `GMAIL_CREATE_DRAFT` - Create draft emails
- `GMAIL_ADD_LABEL_TO_EMAIL` - Add labels
- `GMAIL_CREATE_LABEL` - Create new labels
- `GMAIL_SEARCH_EMAILS` - Advanced search
- `GMAIL_GET_EMAIL` - Get specific email by ID
- `GMAIL_TRASH_EMAIL` - Move to trash
- `GMAIL_DELETE_EMAIL` - Permanently delete

See full list: https://docs.composio.dev/toolkits/gmail

---

## Privacy & Security

### What Data is Accessed

Same privacy-first approach as before:
- ✅ Subject lines
- ✅ Sender names (redacted)
- ✅ Email addresses (redacted: `jo***@g***.com`)
- ✅ Dates and labels
- ❌ Email bodies (NOT accessed)
- ❌ Attachments

### Redaction

All redaction logic is preserved:
- PII detection (phone numbers, SSNs)
- Email address masking
- Subject line filtering

### Token Storage

Composio manages all tokens:
- Automatic refresh
- Secure storage
- No local token management needed

---

## Comparison: Google OAuth vs Composio

| Feature | Google OAuth (Old) | Composio (New) |
|---------|-------------------|----------------|
| **Setup Time** | 30 minutes | 5 minutes |
| **OAuth App Required** | Yes | No |
| **Verification Process** | Required for production | Not needed |
| **Token Management** | Manual | Automatic |
| **Rate Limiting** | Manual | Built-in |
| **Multi-Service Support** | One app per service | Single API for 100+ services |
| **Webhook Triggers** | Manual setup | Built-in |

---

## Troubleshooting

### Error: "COMPOSIO_API_KEY not set"

Add your Composio API key to `.env`:
```env
COMPOSIO_API_KEY=your_key_here
```

Restart the server.

### Error: "Gmail not connected"

1. Call `POST /gmail/connect` to get redirect URL
2. Open the URL in browser
3. Complete Gmail OAuth flow
4. Check status with `GET /gmail/status`

### Connection Shows "PENDING"

The user hasn't completed the OAuth flow yet. They need to visit the `redirectUrl` and authorize Gmail access.

### No Emails Returned

Check:
1. Connection status is `ACTIVE`
2. Gmail account has emails in last 90 days
3. Emails aren't filtered out (promotions/social are excluded)
4. Check server logs for Composio API errors

---

## Next Steps

1. ✅ Gmail messages and summary endpoints working
2. 🔄 Integrate Gmail data into Letta agent
3. 🔄 Add Gmail webhook triggers for real-time updates
4. 🔄 Implement email sending capabilities
5. 🔄 Add advanced search and filtering

---

## Example: Complete Flow

```bash
# 1. Connect Gmail
curl -X POST http://127.0.0.1:5173/gmail/connect \
  -H "Content-Type: application/json" \
  -d '{"userId": "alexandra"}'
# Response: { "redirectUrl": "https://...", ... }

# 2. Open redirectUrl in browser, complete OAuth

# 3. Check status
curl http://127.0.0.1:5173/gmail/status
# Response: { "connected": true, "status": "ACTIVE" }

# 4. Fetch messages
curl http://127.0.0.1:5173/gmail/messages
# Response: { "messages": [...], ... }

# 5. Get summary
curl http://127.0.0.1:5173/gmail/summary
# Response: { "aggregates": { "topSenders": [...], ... } }

# 6. Create Letta agent and ingest
curl -X POST http://127.0.0.1:5173/letta/agent/init \
  -H "Content-Type: application/json" \
  -d '{"userName": "alexandra"}'

# 7. Ingest Spotify data
curl -X POST http://127.0.0.1:5173/letta/ingest/spotify \
  -H "Content-Type: application/json" \
  -d '{"agentId": "agent_abc123"}'

# 8. Extract AI themes (cross-source synthesis)
curl http://127.0.0.1:5173/letta/themes/agent_abc123
```

---

## Resources

- Composio Dashboard: https://app.composio.dev
- Composio Docs: https://docs.composio.dev
- Gmail Toolkit: https://docs.composio.dev/toolkits/gmail
- Composio API Reference: https://docs.composio.dev/api-reference

