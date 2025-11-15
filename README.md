# Mots - Word Learning Game

A vanilla JavaScript word-learning game for learning English from Catalan, featuring local-first design with optional global leaderboard sharing.

## ✨ Features

- 🎮 **Two Game Modes**: Study (flashcards) and Play (interactive guessing)
- 🏆 **Dual Leaderboards**: Personal scores ("Just Me") and global competition ("All Players")
- 💾 **Local-First**: All data stored locally, share when ready
- 🌍 **Optional Sharing**: Share your best scores with all players
- 📱 **Mobile-Optimized**: Touch-friendly, responsive design
- ⚡ **Offline-Ready**: Service worker for offline gameplay
- ⌨️ **Keyboard Shortcuts**: Space bar navigation, Enter to submit
- 🎯 **Score Tracking**: Detailed statistics and session history
- 👤 **Player Profiles**: Name pre-filling, UUID-based identification
- 🎨 **Clean UI**: Modern design with user-friendly language

## 📁 Project Structure

```
mots/
├── index.html              # Main HTML file
├── package.json            # Project metadata
├── sw.js                   # Service Worker for offline support
├── css/
│   └── styles.css         # All styles
├── js/
│   ├── app.js             # Application entry point
│   ├── game.js            # Game state management
│   ├── ui.js              # UI rendering
│   ├── data.js            # Topics and words data
│   ├── storage.js         # localStorage utilities
│   ├── sync.js            # Global leaderboard sync
│   └── leaderboard-api.js # API client
└── leaderboard-api/       # Backend API (optional)
    ├── package.json
    ├── src/
    │   ├── index.js       # Express server
    │   ├── db.js          # SQLite database
    │   └── routes/
    │       └── leaderboard.js
    └── leaderboard.db     # SQLite database file
```

## 🚀 Quick Start

### Frontend Only (Local Scores)

```bash
# Serve the app
npx http-server
# or
python3 -m http.server 8000

# Open http://localhost:8000
```

### With Global Leaderboard (Optional)

```bash
# 1. Start the backend API
cd leaderboard-api
npm install
npm run dev  # Runs on http://localhost:3000

# 2. Serve the frontend (in another terminal)
cd ..
npx http-server  # http://localhost:8080
```

## 🎮 How to Play

### Study Mode
1. Choose a topic
2. Select "📖 Study"
3. View flashcards with Catalan word
4. Press **Space** or tap to reveal English translation
5. Press **Space** or tap again to continue

### Play Mode
1. Choose a topic
2. Select "🎮 Play"
3. Type your answer for the Catalan word
4. Press **Enter** to submit
5. View inline feedback (✓ or ✗)
6. Press **Space** or tap to continue
7. Complete all words to see your score!

## 🏆 Leaderboards

### Just Me (Local)
- All your personal scores for this device
- Stored in localStorage
- Always available offline
- Top 10 displayed

### All Players (Global)
- Best scores from all players worldwide
- Requires backend API running
- One score per player (your best)
- Share when ready with "🌍 Share with All" button

### Score Sharing
- Scores remain local until you choose to share
- Click "🌍 Share with All" to submit your best score
- 🌍 badge shows which score is currently shared
- Update anytime with a better score

## 💾 Data Storage

### LocalStorage Keys
- `mots_progress` - Topic statistics
- `mots_failed_words` - Words to practice
- `mots_sessions` - Game session history
- `mots_player_name` - Your saved name
- `mots_player_id` - Unique browser ID (UUID)

### Backend Database (Optional)
- SQLite database (`leaderboard.db`)
- Stores global scores with player_id
- Shows best score per unique player
- Automatic migrations

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Space** | Reveal word (study) / Next word (after feedback) |
| **Enter** | Submit answer (play mode) |
| **Letters** | Type answer (play mode) |

## 🎨 Architecture

### State Management
- Centralized in `game.js`
- Immutable reads via `getState()`
- Actions update state (e.g., `selectTopic()`, `nextWord()`)
- Unidirectional data flow

### Rendering Pattern
1. User interaction → Event handler in `ui.js`
2. Action function updates state in `game.js`
3. `render()` re-renders entire view
4. New event listeners attached

### Game States
- `TOPIC_SELECTION` - Choose topic
- `MODE_SELECTION` - Choose study/play
- `STUDYING` - Flashcard mode
- `PLAYING` - Answer input
- `RESULT` - Inline feedback
- `COMPLETE` - Leaderboard & stats

## 🔧 Configuration

### Add New Topics

Edit `js/data.js`:

```javascript
export const topics = [
  {
    id: 'animals',
    name: 'Animals',
    emoji: '🐾',
    words: [
      { ca: 'gos', en: 'dog' },
      { ca: 'gat', en: 'cat' }
    ]
  }
];
```

### Backend API Configuration

Edit `leaderboard-api/src/index.js`:

```javascript
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
```

### Change API Endpoint

Edit `js/leaderboard-api.js`:

```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

## 🌐 Backend API Endpoints

### GET `/api/leaderboard/:topicId`
Returns top 10 best scores per unique player

**Response:**
```json
{
  "topicId": "animals",
  "scores": [
    {
      "id": 1,
      "playerId": "uuid-here",
      "playerName": "PLAYER1",
      "score": 850,
      "wordsWon": 10,
      "wordsLost": 0,
      "successRate": 100,
      "time": 45000,
      "date": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

### POST `/api/leaderboard/:topicId`
Submit a score

**Request:**
```json
{
  "playerId": "uuid-here",
  "playerName": "PLAYER1",
  "score": 850,
  "wordsWon": 10,
  "wordsLost": 0,
  "successRate": 100,
  "time": 45000
}
```

**Response:**
```json
{
  "id": 123,
  "rank": 3,
  "madeTopTen": true,
  "topScores": [...]
}
```

## 🎯 Scoring System

- **Base score**: 100 points per correct word
- **Time bonus**: Faster = more points
- **Streak bonus**: Consecutive correct answers
- **Success rate**: % of words guessed correctly
- **Total score**: Cumulative points for the session

## 📱 PWA Features

- Service Worker for offline support
- Versioned caching strategy
- Update notifications
- Works without internet after first load

## ♿ Accessibility

- ✅ Semantic HTML5
- ✅ ARIA labels and roles
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Focus indicators
- ✅ Color contrast (WCAG AA)
- ✅ Touch targets ≥44px

## 🐛 Troubleshooting

### "Failed to load module" error
**Solution**: Use a local server (ES6 modules don't work with `file://`)

### Global leaderboard not loading
**Solution**: Check backend is running on `http://localhost:3000`

### Scores not saving
**Solution**: Check localStorage is enabled in browser settings

### Name not pre-filling
**Solution**: Enter your name at least once - it will be remembered

### Service Worker not updating
**Solution**: Hard refresh (`Ctrl+Shift+R` or `Cmd+Shift+R`)

## 🔐 Privacy & Data

- **Player ID**: Random UUID stored in localStorage (per device)
- **No tracking**: No analytics or third-party scripts
- **Local-first**: Data stays on your device unless you share
- **Opt-in sharing**: Explicitly choose to share scores
- **No accounts**: Anonymous gameplay

## 🚢 Deployment

### Frontend (Static Hosting)

```bash
# Deploy to any static host
# Netlify, Vercel, GitHub Pages, etc.
```

### Backend (Node.js Hosting)

```bash
# Deploy to Railway, Render, Fly.io, etc.
cd leaderboard-api
npm install
npm start

# Environment variables:
# PORT=3000
# NODE_ENV=production
# CORS_ORIGIN=https://your-frontend.com
```

### Database
- SQLite file created automatically
- Mount `/data` volume in production
- Or use external database (modify `db.js`)

## 📊 File Sizes (Approximate)

- Frontend JS: ~40 KB (unminified)
- CSS: ~20 KB
- HTML: ~2 KB
- **Total Frontend**: ~62 KB
- Backend: ~5 KB + dependencies

## 🎉 Credits

Built with vanilla JavaScript - no frameworks, no build tools.

**Technologies:**
- Frontend: HTML5, CSS3, ES6 Modules
- Backend: Node.js, Express, better-sqlite3
- Storage: LocalStorage, SQLite
- Offline: Service Worker

## 📝 License

Free to use for education and personal projects.

---

**Happy Learning! 🎮📚**
