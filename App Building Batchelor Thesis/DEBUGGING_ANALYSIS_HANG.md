# Analysis Hang - Comprehensive Debugging Guide

## Quick Summary
Analysis was hanging because Web Workers couldn't load `analyzer.js`. I've added:
1. **Comprehensive logging** throughout the flow
2. **Direct fallback analysis** that runs without workers
3. **Better error handling** in content.js, popup.js, and analyzer-worker.js
4. **10-second timeout** on worker before switching to direct analysis

## Step 1: Reload the Extension

**Option A: Reload via Extensions Page**
1. Open `chrome://extensions/` in Chrome
2. Find "Privacy Policy Analyzer"
3. Click the refresh icon (⟲) at bottom right

**Option B: Unload/Reload**
1. Open `chrome://extensions/` 
2. Toggle OFF the "Privacy Policy Analyzer" extension
3. Wait 2 seconds
4. Toggle ON the extension again

**Option C: Full Reset**
1. Go to `chrome://extensions/`
2. Toggle OFF the extension
3. Click "Remove" 
4. Install again by going to that folder and clicking "Load unpacked"

## Step 2: Open a Privacy Policy Page

Navigate to a website with a privacy policy, such as:
- https://www.google.com/policies/privacy/
- https://www.facebook.com/privacy/explanation
- https://www.amazon.com/gp/help/customer/display.html?nodeId=GX7NJQ4ZB9MHRNWX

## Step 3: Open DevTools Console

1. Open DevTools: Press **F12**
2. Click the **Console** tab
3. Clear previous logs: Right-click → Clear console (or Ctrl+Shift+K)
4. Keep this visible during analysis

## Step 4: Click "Analyze Policy"

1. In the extension popup, click **"Analyze Policy"**
2. Watch the DevTools console for messages

## Step 5: Read the Console Output

### Expected Success Output (With Worker):
```
[Popup] Analyze button clicked
[Content] Message received: {action: "extract_text"}
[Content] Text extracted, length: 12543
[Popup] Content script responded: {text: "..."}
[Popup] Text extracted, length: 12543
[Popup] Running local analysis...
[Popup] Creating Web Worker...
[Popup] Web Worker created successfully
[Popup] Sending analysis request to worker, ID: 1
[Worker] analyzer.js loaded successfully
[Worker] Received message - ID: 1, Action: analyze, Text length: 12543
[Worker] Analysis complete...
[Popup] Received worker message: {id: 1, success: true, result: {...}}
[Popup] Analysis successful, rendering results...
```

### Expected Fallback Output (No Worker, Direct Analysis):
```
[Popup] Analyze button clicked
[Content] Message received: {action: "extract_text"}
[Content] Text extracted, length: 12543
[Popup] Content script responded: {text: "..."}
[Popup] Text extracted, length: 12543
[Popup] Running local analysis...
[Popup] Creating Web Worker...
[Popup] Web Worker created successfully
[Popup] Sending analysis request to worker, ID: 1
[Worker] Failed to load analyzer.js: (error message)
*** 10 SECONDS PASS ***
[Popup] Worker timeout, falling back to direct analysis
[Popup] Attempting direct analysis as fallback...
[Popup] Direct analysis successful
[Popup] Received worker message: {id: 1, success: true, result: {...}, mode: "direct-fallback"}
[Popup] Analysis successful, rendering results...
```

### Error Messages and What They Mean:

| Error Message | Cause | Solution |
|---|---|---|
| `[Content] No text found on page` | Page has no extractable text | Try a different privacy policy page |
| `[Content] Error extracting text: ...` | JavaScript error in content.js | Try reloading extension (Step 1) |
| `[Popup] No active tab found` | Tab query failed | Make sure you have a tab open |
| `[Popup] Message error: ...` | Content script not responding | Check content.js is injected (see Step 6) |
| `[Worker] Failed to load analyzer.js` | Worker can't access script | This is OK - fallback will handle it |
| `[Popup] Analyzer functions not loaded` | analyzer.js not available in popup | Reload extension (Step 1) |
| `[Popup] Fallback analysis failed: ...` | Direct analysis error | Check analyzer.js has no syntax errors |

## Step 6: Verify Content Script Injection

If you see no `[Content]` messages in console:

1. In DevTools, click the **Sources** tab
2. Left sidebar: Expand **Content scripts**
3. Look for a folder with your extension ID (starts with chrome-extension://)
4. Click to expand it
5. You should see `content.js` listed
6. If you don't see it, the content script isn't injected - try reloading the extension

## Step 7: Check Popup Script Loading

1. In DevTools Console, type:
```javascript
typeof analyzePrivacyPolicy
```

2. You should see: `"function"`
3. If you see `"undefined"`, analyzer.js didn't load - reload extension

## Step 8: If Still Stuck

Try these in order:

### Quick Fixes
1. **Clear cache**: Ctrl+Shift+Delete, clear "All time"
2. **Reload extension**: chrome://extensions/ → refresh button
3. **Reload page**: F5 on the privacy policy page
4. **Try different page**: Use one of the example URLs from Step 2

### Advanced Debugging

**Test analyzer.js directly in console:**
```javascript
// If this works, analyzer.js loaded fine
const result = analyzePrivacyPolicy("This website collects your personal data");
console.log(result);
```

**Test Web Worker creation manually:**
```javascript
const testWorker = new Worker('analyzer-worker.js');
testWorker.onmessage = (e) => console.log('Worker message:', e.data);
testWorker.onerror = (e) => console.error('Worker error:', e);
testWorker.postMessage({action: 'analyze', text: 'test'});
// Wait a few seconds and check console
```

**Check if files exist:**
```javascript
// Test if files are accessible
fetch('analyzer.js').then(r => r.text()).then(t => console.log('analyzer.js loaded, length:', t.length));
fetch('analyzer-worker.js').then(r => r.text()).then(t => console.log('analyzer-worker.js loaded, length:', t.length));
```

## Step 9: Collect Full Logs

If you need to share the issue:

1. Open DevTools
2. Right-click in console → Save as...
3. Save the console log as `debug-logs.txt`
4. Share this file along with:
   - What error message you saw (if any)
   - Whether the analysis completed or stayed stuck
   - How long you waited
   - Which privacy policy page you tried

## Expected Outcomes

### ✅ Success - Analysis Shows Results
- Score and metrics appear
- Flags are displayed with colors
- Status shows "Scanned X characters"
- Export buttons appear

### ⚠️ Partial Success - Results After 10 Seconds
- Takes ~10 seconds (worker timeout)
- Then shows results (direct fallback works)
- This is OK, worker loading will be investigated

### ❌ Failure - Analysis Still Stuck or Error
- See debugging section above
- Share the console output from Step 5

## Architecture (For Reference)

```
popup.html loads:
  └─ analyzer.js (main analysis logic)
  └─ analyzer-worker.js (worker script)
  └─ storage.js (history/export)
  └─ ui-renderer.js (UI display)
  └─ popup.js (main coordinator)

When "Analyze Policy" clicked:
  1. popup.js sends message to content.js
  2. content.js extracts text from page
  3. popup.js creates Web Worker
  4. popup.js sends text to worker via postMessage()
  5. worker tries to importScripts('analyzer.js')
  6. worker calls analyzePrivacyPolicy()
  7. worker sends result back via postMessage()
  8. popup.js receives message and renders results
  
Fallback (if worker fails):
  - After 10 seconds timeout
  - popup.js calls analyzePrivacyPolicy() directly
  - Same result rendering as worker path
```

## Known Issues & Workarounds

| Issue | Workaround |
|---|---|
| Worker fails to load analyzer.js | Direct fallback analysis kicks in after 10 seconds |
| No text extracted from page | Try a different website with better text extraction |
| Console is empty | Make sure you cleared it before testing |
| Extension doesn't appear in popup | Reload extension via chrome://extensions/ |

---

**Last Updated**: Current version with comprehensive debugging and fallback support
**Next Steps**: Test with these instructions and share console output if issues persist
