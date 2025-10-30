// app.js - Main application entry point

import { render } from './ui.js';
import { addLetter, removeLetter, submitGuess, getState, getCurrentWord, backToTopics, nextWord, GAME_STATES } from './game.js';

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎮 Mots - Starting game...');

  // Fetch version from package.json
  try {
    const response = await fetch('/package.json');
    const pkg = await response.json();
    const version = pkg.version;

    console.log(`📦 Version: ${version}`);

    // Display version in footer
    const versionElement = document.getElementById('app-version');
    if (versionElement) {
      versionElement.textContent = `v${version}`;
    }
  } catch (error) {
    console.error('Failed to load version:', error);
  }

  // Initial render
  render();

  // Add keyboard support for play mode
  document.addEventListener('keydown', handleKeyboardInput);

  // Make title clickable to go home
  const gameTitle = document.getElementById('game-title');
  if (gameTitle) {
    // Use both click and touchend for better mobile support
    gameTitle.addEventListener('click', handleTitleClick);
    gameTitle.addEventListener('touchend', (e) => {
      e.preventDefault();
      handleTitleClick();
    });
    gameTitle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleTitleClick();
      }
    });
  }

  // Register service worker for offline support
  registerServiceWorker();
});

// Handle keyboard input
function handleKeyboardInput(e) {
  // Ignore events from the mobile keyboard input - it has its own handler
  if (e.target && e.target.id === 'mobile-keyboard-input') {
    return;
  }

  const state = getState();
  const word = getCurrentWord();

  // Handle Enter key for different game states
  if (e.key === 'Enter') {
    // On won/lost screens, advance to next word
    if (state.gameState === GAME_STATES.WON || state.gameState === GAME_STATES.LOST) {
      e.preventDefault();
      nextWord();
      render();
      return;
    }

    // During play mode, submit guess
    if (state.gameState === GAME_STATES.PLAYING) {
      submitGuess();
      render();
      return;
    }
  }

  // Only handle letter keys (a-z) during play mode
  if (state.gameState === GAME_STATES.PLAYING && e.key.length === 1 && /[a-z]/i.test(e.key)) {
    const letter = e.key.toLowerCase();
    addLetter(letter);
    render();
  }
  // Handle backspace during play mode
  else if (state.gameState === GAME_STATES.PLAYING && e.key === 'Backspace') {
    e.preventDefault();
    removeLetter();
    render();
  }
}

// Handle title click to go home
function handleTitleClick() {
  backToTopics();
  render();
}

// Register service worker for offline-first functionality
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');

    // Check for updates on page load
    registration.update();

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // Could show a "New version available" notification here
        }
      });
    });
  } catch (error) {
    console.error('[App] Service worker registration failed:', error);
  }
}
