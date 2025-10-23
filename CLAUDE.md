# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mots is a vanilla JavaScript word-learning game for learning English from Catalan. It's a single-page application (SPA) with no framework dependencies, using ES6 modules and a unidirectional data flow pattern.

## Development Commands

### Running the Application

The app uses ES6 modules, so it must be served via HTTP (cannot open `index.html` directly):

```bash
npx http-server
# or
python3 -m http.server 8000
# or use VS Code Live Server extension
```

Then navigate to `http://localhost:8000`

## Architecture

### Module Structure and Data Flow

The codebase follows a strict separation of concerns with unidirectional data flow:

```
app.js (entry point)
  └─> ui.js (rendering & events)
       └─> game.js (state management)
            └─> data.js (topics data)
```

**Key principle**: State is centralized in `game.js` and flows one way:
1. User interaction triggers an action function in `game.js`
2. Action updates internal state
3. `render()` is called to update the DOM
4. New event listeners are attached for the updated DOM

### State Management Pattern

- **Single source of truth**: All state lives in the `state` object in `js/game.js`
- **Immutable reads**: `getState()` returns a copy of state (line 42-44)
- **Action-based updates**: UI code NEVER directly mutates state - it calls action functions like `selectTopic()`, `guessLetter()`, `nextWord()`
- **Re-render on update**: Every state change is followed by a `render()` call in `ui.js`

### Game State Machine

The app uses a finite state machine with 7 states defined in `GAME_STATES` (js/game.js:5-13):
- `TOPIC_SELECTION`: Initial screen to choose topic
- `MODE_SELECTION`: Choose between study/play mode
- `STUDYING`: Study mode - view word translations
- `PLAYING`: Play mode - guess the word
- `WON`: Word guessed correctly
- `LOST`: Ran out of attempts
- `COMPLETE`: All words in topic finished

Each state has a corresponding render function and event listeners in `ui.js`.

### Module Responsibilities

**js/app.js**:
- Application bootstrap
- Global keyboard listener for letter input (delegates to button clicks)

**js/game.js**:
- Centralized state management
- Pure state transitions via action functions
- Game logic (letter guessing, word completion, scoring)

**js/ui.js**:
- Renders HTML based on current game state
- Attaches event listeners that call game actions
- Complete re-render on each state change (simple but effective)

**js/data.js**:
- Static topic and word collections
- Topics array with structure: `{id, name, emoji, words[]}`

### Important Implementation Details

1. **Event listeners are re-attached on every render**: The render pattern destroys and recreates DOM, so listeners must be re-attached after each render (see `attach*Listeners()` functions in ui.js)

2. **Keyboard input delegation**: Physical keyboard input is handled by finding the corresponding button element and triggering its click event (js/app.js:17-27)

3. **Guessed letters display**: The array is reversed when displaying to show most recent first (js/ui.js:320)

4. **State transitions**: Game state updates happen in `updateGameState()` after each letter guess (js/game.js:145-152)

## Code Style Conventions

- ES6 modules with named exports
- Arrow functions for callbacks
- Template literals for HTML generation
- `data-*` attributes for event delegation
- ARIA attributes for accessibility

## Adding New Features

### Adding a New Topic

Edit `js/data.js` and add to the `topics` array:
```javascript
{
  id: 'unique-id',
  name: 'Display Name',
  emoji: '🎨',
  words: [
    { catalan: 'word', english: 'word' }
  ]
}
```

### Modifying Game Parameters

In `js/game.js`:
- `maxAttempts`: Line 28 (currently 6)
- `ALPHABET`: Line 35-39 (keyboard layout)

### Adding New Game States

1. Add state to `GAME_STATES` in `js/game.js`
2. Create `render*()` function in `js/ui.js`
3. Create `attach*Listeners()` function in `js/ui.js`
4. Add case to switch statement in `render()` (js/ui.js:27-56)

## Known Limitations & Future Enhancements

From TASKS.org, pending improvements:
- Viewport content fitting (ensure all content visible)
- Hide/show word toggle in study mode
- Store progress in localStorage
- Potential additions: vibration API, gestures API, timing mechanics, multiplayer
