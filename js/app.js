// app.js - Main application entry point

import { render } from './ui.js';
import { backToTopics } from './game.js';

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
  registerServiceWorker(version);
});

// Handle title click to go home
function handleTitleClick() {
  backToTopics();
  render();
}

// Register service worker for offline-first functionality
async function registerServiceWorker(version) {
  if (!('serviceWorker' in navigator)) {
    console.log('[App] Service workers not supported');
    return;
  }

  try {
    // Register service worker with version query parameter
    // This forces the browser to treat it as a new file when version changes
    const registration = await navigator.serviceWorker.register(`./sw.js?v=${version}`, {
      updateViaCache: 'none' // Don't cache the SW file itself
    });
    console.log(`[App] Service worker registered with version ${version}`);

    // Check for updates on page load
    registration.update();

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('[App] New service worker found, installing...');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New service worker installed, old one still controlling
            console.log('[App] New version available');
            showUpdateNotification();
          } else {
            // First time install
            console.log('[App] Service worker installed for the first time');
          }
        } else if (newWorker.state === 'activated') {
          console.log('[App] Service worker activated');
        }
      });
    });

    // Listen for controller change (when new SW takes over)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      console.log('[App] New service worker activated, reloading...');
      window.location.reload();
    });

  } catch (error) {
    console.error('[App] Service worker registration failed:', error);
  }
}

// Show update notification to user
function showUpdateNotification() {
  // Don't show notification if it already exists
  if (document.getElementById('update-notification')) {
    console.log('[App] Update notification already shown');
    return;
  }

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
    // Tell the waiting service worker to skip waiting
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  });

  document.getElementById('dismiss-btn').addEventListener('click', () => {
    notification.remove();
  });
}
