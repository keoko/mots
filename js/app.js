// app.js - Main application entry point
import { render, initializeSync } from './ui.js';
import { backToTopics, getState, nextWord, toggleWordReveal, GAME_STATES } from './game.js';

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎮 Mots - Starting game...');

  // Fetch version from package.json
  let version = '0.0.0';
  try {
    const response = await fetch('./package.json');
    const pkg = await response.json();
    version = pkg.version;

    console.log(`📦 Version: ${version}`);

    // Display version in footer
    const versionElement = document.getElementById('app-version');
    if (versionElement) {
      versionElement.textContent = `v${version}`;
    }
  } catch (error) {
    console.error('Failed to load version:', error);
  }

  // Initialize sync for global leaderboard
  initializeSync();

  // Initial render
  render();

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

  // Register service worker for offline support with version query parameter
  registerServiceWorker();

  // Global keyboard listener for advancing to next word
  document.addEventListener('keydown', (e) => {
    const state = getState();

    // Handle Space key in RESULT state (play mode feedback)
    if (state.gameState === GAME_STATES.RESULT) {
      if (e.key === ' ') {
        // Don't interfere if user is typing in an input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          return;
        }

        e.preventDefault();
        nextWord();
        render();
      }
    }

    // Handle Space key in STUDYING state (study mode flashcards)
    if (state.gameState === GAME_STATES.STUDYING) {
      if (e.key === ' ') {
        // Don't interfere if user is typing in an input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          return;
        }

        e.preventDefault();

        if (!state.isWordRevealed) {
          // First press: reveal the word
          toggleWordReveal();
        } else {
          // Second press: go to next word
          nextWord();
        }
        render();
      }
    }
  });
});

// Handle title click to go home
function handleTitleClick() {
  backToTopics();
  render();
}

let newWorker;

// Register service worker for offline-first functionality
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('[App] Service workers not supported');
    return;
  }

  try {
    console.log('[App] Registering service worker...');
    const registration = await navigator.serviceWorker.register(`./sw.js`, {
      updateViaCache: 'none' // Don't cache the SW file itself
    });

    // Listen for new service worker installing
    registration.addEventListener('updatefound', () => {
      newWorker = registration.installing;

      if (!newWorker) {
        console.error('[App] ❌ No installing worker found!');
        return;
      }

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker installed, old one still controlling
          showUpdateNotification();
        }
      });
    });

    // Listen for controller change (when new SW takes over)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) {
        return;
      }
      refreshing = true;
      window.location.reload();
    });

  } catch (error) {
    console.error('[App] Service worker registration failed:', error);
  }
}

// Track if we've shown the update notification to prevent duplicates
let updateNotificationDisplayed = false;

// Show update notification to user
function showUpdateNotification() {
  // Guard against duplicate calls
  if (updateNotificationDisplayed) {
    return;
  }

  // Double-check DOM in case of race condition
  const existingNotification = document.getElementById('update-notification');

  if (existingNotification) {
    updateNotificationDisplayed = true;
    return;
  }

  updateNotificationDisplayed = true;

  const notification = document.createElement('div');
  notification.id = 'update-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #4CAF50;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    display: flex;
    gap: 16px;
    align-items: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;

  notification.innerHTML = `
    <span>New version available!</span>
    <button id="update-btn" style="
      background: white;
      color: #4CAF50;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    ">Update</button>
    <button id="dismiss-btn" style="
      background: transparent;
      color: white;
      border: 1px solid white;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
    ">Later</button>
  `;

  document.body.appendChild(notification);

  document.getElementById('update-btn').addEventListener('click', async () => {
    newWorker.postMessage({ type: 'SKIP_WAITING' });
  });

  document.getElementById('dismiss-btn').addEventListener('click', () => {
    notification.remove();
  });
}
