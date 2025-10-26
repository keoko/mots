# Android Keyboard Debugging Guide

## Changes Made

### 1. CSS Fixes (CRITICAL)
**File:** `css/styles.css`

**Problem:** The `.mobile-keyboard-input` had `pointer-events: none` which **prevents focus on many Android browsers**.

**Fix:**
- ✅ Removed `pointer-events: none`
- ✅ Changed position from `left: -9999px` to `top: -100px, left: 0` (keeps in viewport but hidden)
- ✅ Increased size from `1px x 1px` to `100px x 40px` (browsers need minimum size)
- ✅ Added `font-size: 16px` to prevent iOS zoom
- ✅ Set `z-index: -1` to keep behind content

### 2. Comprehensive Diagnostic Logging
**File:** `js/ui.js`

Added 6 phases of diagnostic logging:

1. **PHASE 1:** Element Detection - Verifies input element exists
2. **PHASE 2:** Computed Styles - Checks all CSS properties
3. **PHASE 3:** Device & Browser Info - Platform/UA detection
4. **PHASE 4:** Focus Attempt - Tracks focus() success
5. **PHASE 5:** Click Handlers - Monitors tap interactions
6. **PHASE 6:** Event Listeners - Tracks all keyboard events

## Testing Protocol

### Step 1: Deploy to Device
1. Start local server: `npx http-server`
2. Find local IP: `ip addr` (look for 192.168.x.x)
3. On Android device, open Chrome and navigate to `http://[IP]:8080`

### Step 2: Open Developer Tools on Android
Using **Eruda** (already integrated in index.html):
1. Open the app on Android
2. Tap the floating Eruda icon (bottom right)
3. Go to "Console" tab

### Step 3: Enter Play Mode
1. Select any topic
2. Select "Play Mode"
3. **Watch the console logs carefully**

### Step 4: What to Look For

#### ✅ Expected Success Pattern
```
========================================
[Mobile KB Diagnostics] PHASE 1: Element Detection
[Mobile KB Diagnostics] Input element found: true
...
[Mobile KB Diagnostics] PHASE 2: Computed Styles
[Mobile KB Diagnostics] Pointer-events: auto  ← SHOULD BE "auto" NOT "none"
...
[Mobile KB Diagnostics] ==> Attempting to focus input now
[Mobile KB Diagnostics] Focus successful? true  ← SHOULD BE TRUE
...
[Mobile KB Diagnostics] ===> INPUT FOCUSED <===
...
[Mobile KB Diagnostics] ✅ Setup Complete!
```

#### ❌ Failure Patterns to Watch For

**Pattern A: Focus Fails**
```
[Mobile KB Diagnostics] Focus successful? false
```
→ Input cannot receive focus (check pointer-events, position, size)

**Pattern B: Focus Works but No Keyboard**
```
[Mobile KB Diagnostics] ===> INPUT FOCUSED <===
(but keyboard doesn't appear)
```
→ Browser-specific issue (might need user interaction)

**Pattern C: No Events When Typing**
```
(Keyboard appears, user types, but no events fire)
```
→ Event listener issue or input is readonly/disabled

### Step 5: Test Interaction
1. Tap on the grid cells
2. Tap on the Catalan word
3. Try typing on physical keyboard (if available)
4. Try typing on virtual keyboard

Watch for these console messages:
- `[Mobile KB Diagnostics] Click event on element X`
- `[Mobile KB Diagnostics] Touchend event on element X`
- `[Mobile KB Diagnostics] ===> INPUT FOCUSED <===`
- `[Mobile KB Diagnostics] KEYDOWN event fired`
- `[Mobile KB Diagnostics] BEFOREINPUT event fired`
- `[Mobile KB Diagnostics] ===== INPUT EVENT FIRED =====`

### Step 6: Capture Results

Take screenshots of:
1. Initial diagnostic output (PHASE 1-3)
2. Focus attempt results (PHASE 4)
3. Any error messages
4. Successful input events (if working)

## Hypothesis Testing

### Hypothesis 1: pointer-events: none was blocking focus
**Test:** Check PHASE 2 logs - "Pointer-events" should now be "auto"
**Expected:** Focus should now succeed where it failed before

### Hypothesis 2: Off-screen positioning (-9999px) was problematic
**Test:** Check PHASE 4 logs - position should be "in viewport"
**Expected:** Input rect should show y: -100, x: 0

### Hypothesis 3: Input size (1px) was too small
**Test:** Check PHASE 2 logs - Width/Height should be 100px/40px
**Expected:** Browsers should now recognize the input as tappable

### Hypothesis 4: Browser-specific keyboard policy
**Test:** Try tapping vs auto-focus
**If auto-focus fails but tap works:** Browser requires user gesture
**Solution:** Remove auto-focus, rely only on tap to focus

## Next Steps Based on Results

### If Focus Fails:
1. Check computed styles (PHASE 2)
2. Try different positioning (e.g., `top: 0, left: 0`)
3. Try making input visible temporarily (`opacity: 1`) for testing

### If Focus Succeeds but No Keyboard:
1. Check if input is readonly/disabled (PHASE 4)
2. Try different `inputmode` values (text, search, none)
3. May need to remove auto-focus and rely only on tap

### If Events Don't Fire:
1. Check if input value changes when typing
2. Try simpler event listeners (just 'input', remove others)
3. Check for event.preventDefault() blocking

### If It Works:
1. Remove excessive diagnostic logging
2. Test on multiple Android browsers (Chrome, Firefox, Samsung)
3. Test on different Android versions
4. Test on iPhone for comparison

## Known Android Browser Quirks

1. **Chrome Android:** Often requires user gesture for keyboard
2. **Firefox Android:** More permissive with focus
3. **Samsung Internet:** Has unique keyboard behavior
4. **Android WebView:** Most restrictive, requires tap

## Quick Test Commands

```javascript
// In Eruda console, test focus directly:
document.getElementById('mobile-keyboard-input').focus();
console.log('Active:', document.activeElement.id);

// Test input manually:
const input = document.getElementById('mobile-keyboard-input');
input.value = 'test';
input.dispatchEvent(new Event('input'));
```
