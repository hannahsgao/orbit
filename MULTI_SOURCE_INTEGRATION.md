# Multi-Source Theme Integration

## Problem Statement

Previously, when users connected Spotify first and then Gmail, the orbital system would only show Spotify themes. The system loaded themes once and never updated, even after connecting additional data sources.

## Solution

Implemented a comprehensive multi-source integration system that:
1. Continuously polls for new data from all sources
2. Automatically merges themes from multiple sources (Spotify, Gmail, Search)
3. Detects when new sources are connected
4. Provides manual refresh capability
5. Shows connection status for each data source

## How It Works

### Continuous Polling

The system now polls the backend **every 8 seconds** to check for new themes, even after initial themes are loaded. This allows it to detect when users connect additional data sources.

```typescript
// Polls continuously while in solar system view
useEffect(() => {
  if (!hasEnteredSolarSystem) return;

  const interval = setInterval(() => {
    if (!isLoadingThemes) {
      loadThemes(true); // true = show notification for new themes
    }
  }, 8000);

  return () => clearInterval(interval);
}, [hasEnteredSolarSystem, isLoadingThemes, lastThemeCount]);
```

### Source Detection

The system tracks which data sources are currently connected by analyzing the loaded themes:

```typescript
// Track which sources are connected
const sources = new Set<string>();
tree.nodes.forEach(node => {
  if (node.dataSources.spotify) sources.add('spotify');
  if (node.dataSources.gmail) sources.add('gmail');
  if (node.dataSources.search) sources.add('search');
});
setConnectedSources(sources);
```

### Theme Merging

The `fetchAndConvertThemes` function (in `src/utils/themesToPersonality.ts`) automatically fetches from **all** sources simultaneously and merges them:

```typescript
// Fetches from Spotify, Gmail, and Search in parallel
const promises = [
  fetch('/spotify/themes'),
  fetch('/gmail/themes'),
  fetch('/search/themes'), // if available
];

const results = await Promise.all(promises);

// Merges all successful responses into a single PersonalityTree
return convertThemesToPersonalityTree({
  spotifyThemes: results[0],
  gmailThemes: results[1],
  searchThemes: results[2],
  userId
});
```

### New Theme Detection

The system tracks how many themes are loaded and notifies when new themes are added:

```typescript
const newThemeCount = tree.nodes.length;
const hadNewThemes = newThemeCount > lastThemeCount;

if (showNotification && hadNewThemes && lastThemeCount > 0) {
  const addedCount = newThemeCount - lastThemeCount;
  console.log(`✨ Added ${addedCount} new theme${addedCount > 1 ? 's' : ''}!`);
}
```

## User Experience Flow

### Scenario: Connect Spotify, Then Gmail

1. **User connects Spotify**
   - OAuth flow redirects to Spotify
   - Returns to app
   - System polls backend (2 seconds after entering)
   - Spotify themes load and display as green planets
   - Status shows: "✓ 3 themes active | Sources: spotify"

2. **User clicks Gmail button**
   - OAuth flow redirects to Gmail
   - Returns to app
   - System continues polling (within 8 seconds)
   - Detects new Gmail themes
   - Gmail themes appear as red planets
   - Status updates: "✓ 7 themes active | Sources: spotify, gmail"
   - Console logs: "✨ Added 4 new themes!"

3. **User can manually refresh**
   - Click "↻ Refresh" button
   - System fetches latest data from all sources
   - Updates theme count and planets

## UI Components

### Connection Status Indicators

Each data source button now shows a checkmark when connected:

```
Data Sources
┌─────────────┐
│ ✓ Spotify   │  ← Connected
├─────────────┤
│ ✓ Gmail     │  ← Connected
├─────────────┤
│ Google Search│  ← Not connected
└─────────────┘
```

### Refresh Button

A manual refresh button appears after themes are loaded:

```
┌─────────────────┐
│  ↻ REFRESH      │  ← Click to force reload
└─────────────────┘
```

Automatically disabled while loading (shows "Refreshing...")

### Status Panel

Shows current state with color-coded messages:

**Loading:**
```
┌────────────────────────────────┐
│ > Fetching data & analyzing... │
└────────────────────────────────┘
```

**No Themes:**
```
┌───────────────────────────────┐
│ > Waiting for data sources... │
└───────────────────────────────┘
```

**Themes Loaded:**
```
┌────────────────────────────────┐
│ ✓ 7 themes active              │
│ Sources: spotify, gmail        │
└────────────────────────────────┘
```

## Code Changes

### Modified Files

1. **`src/App.tsx`**
   - Added `connectedSources` state to track active sources
   - Added `lastThemeCount` state to detect new themes
   - Modified `loadThemes()` to track sources and show notifications
   - Updated polling logic to continue after initial load
   - Added manual refresh button
   - Updated UI to show connection status

### Key State Variables

```typescript
const [connectedSources, setConnectedSources] = useState<Set<string>>(new Set());
const [lastThemeCount, setLastThemeCount] = useState(0);
```

### Enhanced loadThemes Function

```typescript
const loadThemes = async (showNotification = false) => {
  // Fetches from all sources
  // Detects which sources are connected
  // Tracks theme count changes
  // Shows notification if new themes added
};
```

## Configuration

### Polling Interval

Default: **8 seconds**

To change, modify the interval in `App.tsx`:

```typescript
setInterval(() => {
  loadThemes(true);
}, 8000); // Change this value (in milliseconds)
```

Recommended range: 5000-10000ms (5-10 seconds)

### Initial Load Delay

Default: **2 seconds** after entering solar system

To change:

```typescript
const timer = setTimeout(() => {
  loadThemes();
}, 2000); // Change this value
```

## Performance Considerations

### Network Usage

- Polls every 8 seconds
- Makes 2-3 simultaneous requests (Spotify, Gmail, Search)
- Each request is lightweight (~5KB response)
- Total: ~15-20 KB every 8 seconds while app is open

### Optimization Strategies

1. **Conditional Polling:**
   Poll more frequently (5s) right after connecting a source, then slow down (15s) after stable

2. **Smart Detection:**
   Check connection status endpoints before fetching full themes

3. **WebSocket Alternative:**
   Backend could push notifications when new data is available

4. **Caching:**
   Cache themes on backend with TTL to reduce processing

## Testing

### Manual Test Cases

1. **Test: Connect Single Source**
   - Connect only Spotify
   - Verify themes appear
   - Verify "✓ Spotify" shows in button
   - Verify status shows "Sources: spotify"

2. **Test: Connect Multiple Sources**
   - Connect Spotify first
   - Wait for themes to load
   - Connect Gmail
   - Within 8 seconds, verify Gmail themes appear
   - Verify both checkmarks show
   - Verify status shows "Sources: spotify, gmail"

3. **Test: Manual Refresh**
   - Connect sources
   - Click refresh button
   - Verify button shows "Refreshing..."
   - Verify themes reload

4. **Test: Reconnect After Expiry**
   - Wait for auth tokens to expire
   - Click refresh
   - Should prompt to reconnect

### Expected Behavior

✅ Themes from all connected sources appear simultaneously
✅ New sources detected within 8 seconds
✅ Status accurately reflects connected sources
✅ Manual refresh works immediately
✅ No duplicate planets
✅ Console shows meaningful logs

## Troubleshooting

### Issue: Gmail themes don't appear after connecting

**Possible Causes:**
1. OAuth redirect didn't complete
2. No emails in Gmail account
3. Backend error processing emails

**Solution:**
1. Check browser console for errors
2. Click manual refresh button
3. Check backend logs
4. Try reconnecting Gmail

### Issue: Themes appear but status doesn't update

**Possible Cause:** Theme nodes missing dataSources metadata

**Solution:**
1. Check backend responses include proper `source` field
2. Verify `convertThemesToPersonalityTree` sets dataSources correctly

### Issue: Too many API calls

**Possible Cause:** Polling too aggressively

**Solution:**
Increase polling interval from 8s to 15s:
```typescript
}, 15000); // 15 seconds instead of 8
```

### Issue: Duplicate planets after refresh

**Possible Cause:** PersonalityTree not replacing existing nodes

**Solution:**
The `setPersonalityTree(tree)` should completely replace the tree. If seeing duplicates, check OrbitSystem's `useEffect` initialization logic.

## Future Enhancements

1. **Smart Polling:**
   - Faster polling (5s) right after connection
   - Slower polling (20s) when stable
   - Pause polling when tab is inactive

2. **Backend Push Notifications:**
   - WebSocket connection for real-time updates
   - Eliminates need for constant polling
   - More efficient

3. **Connection Status API:**
   - Dedicated `/status` endpoint
   - Returns which sources are connected
   - Lightweight check before fetching themes

4. **Theme Diffing:**
   - Animate new themes appearing
   - Highlight newly added planets
   - Show "New!" badge

5. **Source Management:**
   - Disconnect button for each source
   - Last updated timestamp per source
   - Refresh individual sources

6. **Optimistic UI:**
   - Show placeholder planets immediately after connecting
   - Replace with real themes when loaded
   - Smoother perceived performance

## Summary

The multi-source integration system now fully supports:
- ✅ Automatic detection of new data sources
- ✅ Continuous polling for updates
- ✅ Simultaneous theme merging from multiple sources
- ✅ Manual refresh capability
- ✅ Visual connection status indicators
- ✅ Notification when new themes are added

Users can now connect Spotify, Gmail, and Search in any order, and all themes will automatically appear and merge into a unified orbital visualization.

