# Composio V3 API Fix

## The Bug

The `fetchGmailEmails` tool call was failing with error:
```
"message": "Entity ID is required with connected account. Please provide an entity ID to identify the connected account.",
"code": 1803,
"status": 400
```

## Root Cause

Composio API v3 requires **both** `entity_id` (user_id) AND `connected_account_id` when executing tools. The code was only passing `connected_account_id`.

From the [Composio API documentation](https://docs.composio.dev/toolkits/gmail#gmail_fetch_emails), the tool execution endpoint requires:
```javascript
POST https://backend.composio.dev/api/v3/tools/execute/{tool_slug}
{
  "entity_id": "user_uuid",           // ← REQUIRED
  "connected_account_id": "ca_xxx",   // ← REQUIRED
  "arguments": { ... }
}
```

## Changes Made

### 1. Updated `ToolExecutionRequest` Interface
```typescript
export interface ToolExecutionRequest {
  connectedAccountId: string;
  entityId: string; // ← ADDED: User ID - required by v3 API
  appName: string;
  actionName: string;
  input: Record<string, any>;
}
```

### 2. Updated `executeTool` Function
Added `entity_id` to the API request body:
```typescript
const response = await axios.post(
  `${COMPOSIO_API_BASE}/tools/execute/${request.actionName}`,
  {
    entity_id: request.entityId,           // ← ADDED
    connected_account_id: request.connectedAccountId,
    arguments: request.input,
  },
  { headers: getHeaders() }
);
```

### 3. Updated All Gmail Helper Functions
All Gmail-specific functions now require `entityId` as the first parameter:

- `fetchGmailEmails(entityId, connectedAccountId, ...)`
- `listGmailLabels(entityId, connectedAccountId)`
- `sendGmailEmail(entityId, connectedAccountId, ...)`
- `searchGmailEmails(entityId, connectedAccountId, ...)`

### 4. Updated Gmail Routes
All route handlers now pass `userId` to the Composio functions:
```typescript
const result = await fetchGmailEmails(userId, account.id);
```

### 5. Fixed Parameter Naming
Changed from camelCase to snake_case for Gmail API parameters per v3 spec:
- `maxResults` → `max_results`
- `includePayload` → `include_payload`
- `idsOnly` → `ids_only`
- `userId` → `user_id`

## Tool Name Casing

**Important Note:** While the SDK examples use uppercase (e.g., `GMAIL_FETCH_EMAILS`), the actual API endpoint uses lowercase snake_case in the URL:
```
POST /api/v3/tools/execute/gmail_fetch_emails  ← lowercase in URL
```

This is correct and matches the v3 API specification.

## Files Modified

1. `src/services/composio.ts` - Core tool execution logic
2. `src/routes/gmail.ts` - Route handlers calling Composio functions

## Testing

After these changes, the Gmail endpoints should work correctly:
- `GET /gmail/messages` - Fetch email messages
- `GET /gmail/summary` - Get email summary/aggregates  
- `GET /gmail/labels` - List Gmail labels

All require a connected Gmail account via Composio OAuth.

