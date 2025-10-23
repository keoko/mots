# Mots - Vanilla JavaScript Version

## 📁 Project Structure

```
mots/
├── index.html           # Main HTML file
├── css/
│   └── styles.css      # All styles (use existing CSS from artifacts)
├── js/
│   ├── app.js          # Main application entry point
│   ├── game.js         # Game state management
│   ├── ui.js           # UI rendering functions
│   └── data.js         # Topics data
└── README.md           # This file
```

## 🚀 Quick Start

### 1. Create the project structure

```bash
mkdir mots
cd mots
mkdir css js
```

### 2. Copy the files

Copy these files from the artifacts:
- `index.html` → root directory
- `styles.css` → `css/` directory (from the earlier CSS artifact)
- `app.js` → `js/` directory
- `game.js` → `js/` directory  
- `ui.js` → `js/` directory
- `data.js` → `js/` directory

### 3. Run a local server

You can't just open `index.html` directly because of ES6 modules. Use one of these:

**Option A: Python**
```bash
python3 -m http.server 8000
```

**Option B: Node.js**
```bash
npx serve
```

**Option C: VS Code Live Server**
- Install "Live Server" extension
- Right-click `index.html` → "Open with Live Server"

### 4. Open in browser

Navigate to `http://localhost:8000` (or whatever port your server uses)

## 🎮 How It Works

### Architecture

```
┌─────────────────────────────────────┐
│         index.html                  │
│  (Container + loads app.js)         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│          app.js                     │
│  • Initializes app                  │
│  • Renders initial view             │
│  • Sets up keyboard listeners       │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌──────────┐    ┌────────────┐
│ game.js  │◄───┤  ui.js     │
│          │    │            │
│ • State  │    │ • Render   │
│ • Logic  │    │ • Events   │
│ • Actions│    │ • HTML     │
└─────┬────┘    └──────┬─────┘
      │                │
      ▼                │
┌──────────┐          │
│ data.js  │◄─────────┘
│          │
│ • Topics │
│ • Words  │
└──────────┘
```

### Data Flow

1. **User clicks** → Event in `ui.js`
2. **Action called** → Function in `game.js` updates state
3. **Re-render** → `render()` in `ui.js` updates DOM
4. **New listeners** → Attached for new elements

### State Management

All state lives in `game.js`:
- **Immutable reads**: `getState()` returns a copy
- **Actions only**: Use functions like `selectTopic()`, `guessLetter()`
- **No direct state mutation** from UI code

## 🎯 Key Features

### Two Game Modes

**📖 Study Mode**
- Review all words
- Navigate forward/backward
- No pressure, no scoring
- Switch to play mode anytime

**🎮 Play Mode**
- Interactive word guessing
- Score tracking (won/lost)
- 6 attempts per word
- Visual feedback on keyboard

### User Flow

```
1. Choose Topic (6 topics available)
   ↓
2. Choose Mode (Study or Play)
   ↓
3a. Study Mode              3b. Play Mode
    • View translations         • Guess letters
    • Navigate words            • Track score
    • Start Playing button      • Complete topic
```

## 🎨 Styling

All styles are in `css/styles.css`:
- **Mobile-first** responsive design
- **CSS custom properties** for theming
- **Dark mode** support
- **Touch-friendly** 44px minimum targets
- **Accessible** focus states and ARIA

## 🔧 Customization

### Add New Topics

Edit `js/data.js`:

```javascript
export const topics = [
  // ... existing topics ...
  {
    id: 'colors',
    name: 'Colors',
    emoji: '🎨',
    words: [
      { catalan: 'vermell', english: 'red' },
      { catalan: 'blau', english: 'blue' },
      // ... more words
    ]
  }
];
```

### Change Number of Attempts

Edit `js/game.js`:

```javascript
const state = {
  // ...
  maxAttempts: 8,  // Change from 6 to 8
  // ...
};
```

### Modify Colors

Edit `css/styles.css`:

```css
:root {
  --color-primary: #6366f1;  /* Change main color */
  --color-success: #10b981;  /* Change success color */
  /* ... more variables */
}
```

## 📱 Mobile Features

- **Touch-optimized**: Large tap targets
- **Responsive layout**: Adapts to all screens
- **PWA-ready**: Add manifest.json for installable app
- **Offline-capable**: No external dependencies

## ♿ Accessibility

- ✅ Semantic HTML
- ✅ ARIA labels and roles
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Color contrast (WCAG AA)
- ✅ Focus indicators

## 🐛 Troubleshooting

### "Failed to load module" error

**Problem**: ES6 modules require a server
**Solution**: Use a local server (see Quick Start #3)

### Styles not loading

**Problem**: CSS path incorrect
**Solution**: Check `styles.css` is in `css/` folder

### Topics not showing

**Problem**: JavaScript error
**Solution**: Open browser console (F12) to see errors

### Keyboard not working

**Problem**: Not in play mode
**Solution**: Keyboard only works when guessing

## 🚀 Next Steps

### Enhancements to Add

1. **Persistence**: Save progress to localStorage
2. **Sound effects**: Add audio feedback
3. **Animations**: Smooth transitions
4. **Achievements**: Badge system
5. **Streaks**: Daily learning goals
6. **PWA**: Make it installable
7. **i18n**: Multi-language support

### Production Checklist

- [ ] Minify JavaScript
- [ ] Minify CSS
- [ ] Add service worker
- [ ] Add manifest.json
- [ ] Optimize images/emojis
- [ ] Add analytics (optional)
- [ ] Test on real devices
- [ ] Accessibility audit

## 📊 File Sizes

Approximate sizes (unminified):
- `index.html`: ~1 KB
- `styles.css`: ~15 KB
- `app.js`: ~1 KB
- `game.js`: ~5 KB
- `ui.js`: ~8 KB
- `data.js`: ~2 KB

**Total**: ~32 KB (incredibly lightweight!)

## 🎉 That's It!

You now have a fully functional, mobile-first word learning game in pure vanilla JavaScript!

No frameworks, no build tools, no dependencies. Just clean, modern JavaScript. 🚀

## Development

```sh
npx http-server   # Run the server
```

## 📝 License

Feel free to use this for education, personal projects, or commercial use!

---

**Happy Learning! 🎮📚**
