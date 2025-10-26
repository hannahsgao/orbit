# Quick Start: Multi-Source Integration

## What Changed

Your orbital system now **automatically integrates multiple data sources**. When you connect Gmail after Spotify, the themes will merge within 8 seconds.

## How to Use

### 1. Connect Your First Source

Click **Spotify** button → Log in → Return to app

```
Data Sources
┌─────────────┐
│ ✓ Spotify   │  ← Green planets appear (music themes)
├─────────────┤
│ Gmail       │
├─────────────┤
│ Google Search│
└─────────────┘

Status: ✓ 3 themes active
        Sources: spotify
```

### 2. Connect Your Second Source

Click **Gmail** button → Log in → Return to app

**Within 8 seconds:**

```
Data Sources
┌─────────────┐
│ ✓ Spotify   │  
├─────────────┤
│ ✓ Gmail     │  ← Red planets appear (email themes)
├─────────────┤
│ Google Search│
└─────────────┘

Status: ✓ 7 themes active
        Sources: spotify, gmail

Console: ✨ Added 4 new themes!
```

### 3. Manual Refresh (Optional)

If you don't want to wait 8 seconds, click the **Refresh** button:

```
┌─────────────────┐
│  ↻ REFRESH      │  ← Click here
└─────────────────┘
```

## Theme Colors by Source

- **Green planets** = Spotify music themes
- **Red planets** = Gmail email themes  
- **Blue planets** = Google Search themes (when implemented)
- **White planets** = Balanced/mixed themes

## What Happens Behind the Scenes

1. **Continuous Polling:** System checks for new data every 8 seconds
2. **Parallel Fetching:** Requests Spotify, Gmail, and Search simultaneously
3. **Auto-Merging:** Combines all themes into one unified tree
4. **Smart Detection:** Tracks which sources are connected
5. **Notification:** Console logs when new themes are discovered

## Key Features

✅ **No manual refresh needed** - Auto-detects new connections
✅ **All sources merge** - Spotify + Gmail + Search together
✅ **Real-time status** - See which sources are active
✅ **Manual control** - Refresh button for immediate updates
✅ **Visual feedback** - Checkmarks show connected sources

## Example Workflow

```
Time    Action                Result
────────────────────────────────────────────────────────
0:00    Enter solar system    Empty, waiting for data
0:02    Auto-check            No themes yet
0:05    Connect Spotify       Redirected to Spotify
0:10    Return from Spotify   System checks within 8s
0:12    Themes load           3 green planets appear
0:15    Connect Gmail         Redirected to Gmail  
0:20    Return from Gmail     System checks within 8s
0:22    Gmail themes load     4 red planets appear
                              Total: 7 planets (3 green, 4 red)
```

## Troubleshooting

### Gmail themes don't appear?

1. **Wait up to 8 seconds** after returning from Gmail
2. **Check console** for "Checking for data updates..." logs
3. **Click Refresh** button manually
4. **Check backend** is running (`npm run server`)

### Seeing duplicate planets?

1. **Clear browser cache** and refresh
2. **Restart frontend** (`npm run dev`)
3. **Check console** for errors

### Connection status not updating?

1. **Backend might have failed** - check server logs
2. **OAuth might have failed** - try reconnecting
3. **No data available** - ensure Spotify has listening history / Gmail has emails

## Technical Details

- **Polling Interval:** 8 seconds
- **Initial Load Delay:** 2 seconds after entering
- **Fetch Timeout:** 30 seconds per source
- **Sources Checked:** Spotify, Gmail, Search (when available)

## Next Steps

After connecting multiple sources:
1. **Click planets** to generate sub-themes with LLM
2. **Hover planets** to see theme descriptions
3. **Zoom and pan** to explore your personality orbit
4. **Add more sources** to enrich your visualization

## Files Modified

- `src/App.tsx` - Main integration logic
- Status: ✅ Complete and tested

See `MULTI_SOURCE_INTEGRATION.md` for full technical documentation.

