# Manual Refresh Workflow

## Change Summary

Removed automatic polling to prevent disruption during interaction. The system now uses **manual refresh** for multi-source integration.

## How It Works Now

### Initial Load (Automatic)
When you enter the solar system:
1. System waits 2 seconds
2. Fetches themes from **all connected sources** (Spotify, Gmail, Search)
3. Displays all themes as planets
4. **Stops polling** - no automatic updates

### Adding More Sources (Manual)
When you want to connect additional sources:

1. **Connect new source** (e.g., Gmail after Spotify)
   - Click the Gmail button
   - Complete OAuth
   - Return to app

2. **Click Refresh button**
   - Click "↻ Refresh" in the top-left
   - System fetches from all sources again
   - New themes appear alongside existing ones

## User Workflow

### Scenario 1: Single Source
```
1. Enter solar system
2. Click "Spotify" button
3. Log in to Spotify
4. Return to app
5. Wait 2 seconds → Green planets appear
6. Done! (3 Spotify themes loaded)
```

### Scenario 2: Multiple Sources
```
1. Enter solar system
2. Click "Spotify" button
3. Log in to Spotify
4. Return to app
5. Wait 2 seconds → Green planets appear (3 themes)
6. Click "Gmail" button
7. Log in to Gmail
8. Return to app
9. Click "↻ Refresh" button
10. Wait 5 seconds → Red planets appear (4 Gmail themes)
11. Done! (7 total themes: 3 Spotify + 4 Gmail)
```

### Scenario 3: Add Third Source
```
1. Already have Spotify + Gmail themes (7 planets)
2. Click "Google Search" button
3. Complete auth
4. Return to app
5. Click "↻ Refresh" button
6. Blue planets appear (3 Search themes)
7. Done! (10 total themes: 3 Spotify + 4 Gmail + 3 Search)
```

## UI Elements

### Connection Status
Shows which sources are connected with checkmarks:
```
Data Sources
├─ ✓ Spotify    (connected)
├─ ✓ Gmail      (connected)
└─  Google Search (not connected)
```

### Refresh Button
Appears after themes are loaded:
```
┌─────────────────┐
│  ↻ REFRESH      │  ← Click after connecting new sources
└─────────────────┘
```

### Status Panel
```
┌────────────────────────────────┐
│ ✓ 7 themes active              │
│ Sources: spotify, gmail        │
└────────────────────────────────┘
```

### Hint Message
If you have themes but not all sources connected:
```
┌────────────────────────────────┐
│ Connect more sources, then     │
│ click Refresh                  │
└────────────────────────────────┘
```

## Benefits

### ✅ No Disruption
- Planets don't move around while you're interacting
- Can click and explore without interruption
- Zoom and pan remain stable

### ✅ User Control
- You decide when to refresh
- Explicit action for loading new data
- No surprise updates

### ✅ Multi-Source Support
- Still fetches from all sources
- Merges themes correctly
- Shows connection status

### ✅ Efficient
- No continuous network requests
- Only fetches when needed
- Lower server load

## Technical Changes

### Removed
- Continuous polling interval (was every 8 seconds)
- Automatic detection of new connections
- Background network requests

### Kept
- Multi-source fetching (Spotify + Gmail + Search)
- Theme merging logic
- Connection status tracking
- Manual refresh button
- Initial auto-load on enter

### Code Change
```typescript
// BEFORE: Continuous polling
useEffect(() => {
  const interval = setInterval(() => {
    loadThemes(true);
  }, 8000);
  return () => clearInterval(interval);
}, [...]);

// AFTER: One-time load only
useEffect(() => {
  if (hasEnteredSolarSystem && !personalityTree) {
    setTimeout(() => loadThemes(), 2000);
  }
}, [hasEnteredSolarSystem]);
```

## Best Practices

### For Users

1. **Connect all sources before entering** (if possible)
   - Connect from landing page
   - Or connect all, then enter solar system
   - Saves manual refresh steps

2. **Use refresh button liberally**
   - After connecting new sources
   - If you think data might have changed
   - No harm in refreshing

3. **Wait for "Analyzing connected sources..." to complete**
   - Don't click planets while loading
   - Wait for green checkmarks
   - Then interact freely

### For Developers

1. **If auto-refresh is needed again**
   - Implement "smart" polling (only when idle)
   - Or use WebSocket for push updates
   - Or add "Auto-refresh" toggle in settings

2. **To change refresh behavior**
   - Modify `loadThemes()` function
   - Adjust initial load delay (currently 2s)
   - Change button visibility logic

3. **To add new data sources**
   - Add button in connection panel
   - Backend endpoint must return proper format
   - Add color mapping in `themesToPersonality.ts`

## Comparison

### Old Behavior (Automatic Polling)
```
✅ Detects new connections automatically
✅ No manual action needed
❌ Disrupts interaction
❌ Planets move while clicking
❌ Constant network requests
❌ Higher server load
```

### New Behavior (Manual Refresh)
```
✅ No disruption during interaction
✅ Stable planets while exploring
✅ Efficient (only fetch when needed)
✅ User has control
❌ Requires manual refresh
❌ User must remember to click
```

## Migration Notes

### For Existing Users
- Behavior change is immediate
- No data loss
- Existing themes preserved
- Just need to learn refresh button

### For Documentation
- Update all user guides
- Remove references to "automatic detection"
- Add refresh button instructions
- Emphasize manual workflow

## Future Enhancements

### Option 1: Smart Polling
```typescript
// Poll only when:
// 1. User is idle for 30+ seconds
// 2. No planets are being clicked
// 3. No zoom/pan in progress
```

### Option 2: User Preference
```typescript
// Add toggle in settings:
<Toggle 
  label="Auto-refresh themes"
  onChange={(enabled) => setAutoRefresh(enabled)}
/>
```

### Option 3: Background Check
```typescript
// Check status endpoint (lightweight)
// Only refresh if new data available
const hasNewData = await checkStatus();
if (hasNewData) showRefreshPrompt();
```

## Summary

The system now uses **manual refresh** for multi-source integration:

1. ✅ Enter solar system → auto-load once
2. ✅ Connect additional sources → click refresh
3. ✅ No disruption during interaction
4. ✅ User controls when to update

This provides the best balance between multi-source support and interaction stability.

