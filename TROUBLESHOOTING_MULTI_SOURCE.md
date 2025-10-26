# Troubleshooting: Multi-Source Integration

## The Issue You're Experiencing

After connecting Spotify, Gmail themes don't appear even after clicking refresh.

## Root Cause

The backend server crashed with `EADDRINUSE` error. This is now fixed - server is running again.

## Exact Workflow to Follow

### Step 1: Ensure Backend is Running

**In Terminal 1:**
```bash
cd /Users/alexandra/orbit
npm run server
```

You should see:
```
Server started on http://127.0.0.1:5173
orbit-mcp-spotify running on http://127.0.0.1:5173
Mock mode: DISABLED
```

**Keep this terminal open!**

### Step 2: Start Frontend

**In Terminal 2:**
```bash
cd /Users/alexandra/orbit
npm run dev
```

**Keep this terminal open too!**

### Step 3: Connect First Source (Spotify)

1. Open browser to `http://localhost:5173`
2. Click "Enter" on landing page
3. Click **"Spotify"** button in top-left
4. Log in to Spotify (redirects away)
5. Returns to your app
6. Wait 2-3 seconds
7. **Green planets should appear** (3-5 Spotify themes)
8. Status shows: `✓ 3 themes active | Sources: spotify`

### Step 4: Connect Second Source (Gmail)

1. Click **"Gmail"** button in top-left
2. Log in to Gmail/Google (redirects away)
3. Authorize Composio to access Gmail
4. Returns to your app
5. **Click the "↻ Refresh" button** ← IMPORTANT!
6. Wait 5-10 seconds (Gmail analysis takes longer)
7. **Red planets should appear** alongside green ones
8. Status shows: `✓ 7 themes active | Sources: spotify, gmail`

## Checklist

### Before Testing
- [ ] Backend server running (`npm run server` in Terminal 1)
- [ ] Frontend running (`npm run dev` in Terminal 2)
- [ ] No errors in backend terminal
- [ ] Browser at `http://localhost:5173`

### After Connecting Spotify
- [ ] Redirected to Spotify and back
- [ ] Green planets visible
- [ ] Status shows "spotify" as source
- [ ] Green checkmark (✓) next to Spotify button

### After Connecting Gmail
- [ ] Redirected to Gmail/Google and back
- [ ] Clicked "↻ Refresh" button
- [ ] Waited 5-10 seconds
- [ ] Red planets visible
- [ ] Status shows "spotify, gmail" as sources
- [ ] Green checkmark (✓) next to Gmail button

## Common Issues

### Issue 1: No planets appear after connecting

**Symptoms:**
- Connect Spotify but no green planets
- Status still says "Waiting for data sources"

**Causes:**
1. Backend not running
2. OAuth redirect didn't complete
3. No Spotify listening history

**Solutions:**
1. Check Terminal 1 - is server running?
2. Check Terminal 1 for errors
3. Click "↻ Refresh" manually
4. Check browser console (F12) for errors

### Issue 2: Gmail themes don't appear

**Symptoms:**
- Spotify themes work (green planets)
- Connect Gmail but no red planets
- Even after clicking refresh

**Causes:**
1. Forgot to click refresh button
2. Gmail has no emails
3. Backend error processing Gmail
4. Composio auth failed

**Solutions:**

1. **Check you clicked Refresh:**
   - After returning from Gmail
   - Click the "↻ REFRESH" button
   - Wait 5-10 seconds (Gmail is slower)

2. **Check backend logs:**
   ```bash
   # In Terminal 1, look for:
   [ERROR] Failed to extract Gmail themes
   ```

3. **Check browser console:**
   ```javascript
   // Press F12, look for:
   GET /gmail/themes → 401 or 500 error
   ```

4. **Try reconnecting Gmail:**
   - Click Gmail button again
   - Re-authorize
   - Click Refresh

5. **Verify Gmail has emails:**
   - Log into Gmail directly
   - Ensure you have emails in inbox
   - Need at least a few emails for analysis

### Issue 3: "Address already in use" error

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::5173
```

**Solution:**
```bash
# Kill the process on port 5173
lsof -ti:5173 | xargs kill -9

# Restart server
npm run server
```

### Issue 4: Backend crashes after connecting

**Symptoms:**
- Server was running fine
- Connect a source
- Terminal 1 shows crash/error
- Planets disappear

**Solution:**
1. Check error in Terminal 1
2. Restart server: `npm run server`
3. Refresh browser
4. Click "↻ Refresh" button

## Debugging Commands

### Check if backend is running
```bash
curl http://127.0.0.1:5173/spotify/themes
```

Expected (if not connected):
```json
{"error":"Spotify not connected","message":"Please authenticate with Spotify first"}
```

### Check Spotify connection
```bash
curl -b cookies.txt http://127.0.0.1:5173/spotify/themes
```

If connected, should return themes JSON.

### Check Gmail connection
```bash
curl http://127.0.0.1:5173/gmail/themes
```

If connected, should return themes JSON (takes longer).

## Expected Timeline

```
Time    Action                              Result
─────────────────────────────────────────────────────────────────
0:00    Enter solar system                  Empty, waiting
0:02    Auto-load check                     No themes yet
0:05    Click Spotify button                Redirect to Spotify
0:10    Log in to Spotify                   Redirect back
0:12    Return to app                       Auto-load triggers
0:15    Spotify themes load                 3 green planets
        Status: ✓ 3 themes | spotify

0:20    Click Gmail button                  Redirect to Gmail
0:25    Log in to Gmail                     Redirect back
0:27    Return to app                       ← Must click refresh!
0:28    Click "↻ Refresh"                   Loading starts
0:38    Gmail themes load                   4 red planets
        Status: ✓ 7 themes | spotify, gmail
```

## What Should Happen

### Correct Behavior
```
1. Connect Spotify
   ↓
   Green planets appear (automatic)
   ↓
2. Connect Gmail  
   ↓
   Click Refresh (manual)
   ↓
   Red planets appear alongside green
   ↓
3. Both sources visible
   ✓ 7 themes | Sources: spotify, gmail
```

### What You're Experiencing
```
1. Connect Spotify
   ↓
   Green planets appear ✓
   ↓
2. Connect Gmail
   ↓
   Click Refresh
   ↓
   ??? No red planets appear ✗
```

## Investigation Steps

If Gmail still doesn't work after following all steps:

### 1. Check Backend Response
```bash
# In Terminal, while backend is running:
curl -v http://127.0.0.1:5173/gmail/themes
```

Look for:
- Status code: 200 (success), 401 (not connected), or 500 (error)
- Response body with themes

### 2. Check Browser Network Tab
1. Open browser DevTools (F12)
2. Go to Network tab
3. Click Refresh button in app
4. Look for request to `/gmail/themes`
5. Check status code and response

### 3. Check Backend Logs
Look in Terminal 1 for:
```
[INFO] Extracting Gmail themes
[ERROR] Failed to extract Gmail themes
```

### 4. Verify Composio Connection
```bash
# Check if Composio API key is set
echo $COMPOSIO_API_KEY
```

Should show your API key (not empty).

## Quick Fix Checklist

If it's still not working:

1. [ ] Kill all node processes: `killall node`
2. [ ] Restart backend: `npm run server`
3. [ ] Restart frontend: `npm run dev`
4. [ ] Clear browser cache & cookies
5. [ ] Reconnect Spotify
6. [ ] Reconnect Gmail
7. [ ] Click Refresh
8. [ ] Check both terminals for errors
9. [ ] Check browser console for errors
10. [ ] Share errors with developer

## Expected File State

Your `.env` should have:
```bash
OPENAI_API_KEY=sk-...
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/spotify/callback
COMPOSIO_API_KEY=...
SERVER_PORT=5173
ORIGIN=http://127.0.0.1:3000
```

## Contact Points

If still not working, provide:
1. Backend terminal output (full)
2. Browser console errors
3. Network tab screenshot showing `/gmail/themes` request
4. Steps you followed exactly

This will help diagnose the specific issue.

