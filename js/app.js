// app.js - Main application entry point

import { render } from './ui.js';
import { addLetter, removeLetter, submitGuess, getState, getCurrentWord, backToTopics } from './game.js';
import { vibrateLetterInput, vibrateTap, vibrateInvalid } from './haptics.js';
import { VERSION, getDiagnosticInfo, formatDiagnosticInfo } from './version.js';

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎮 Mots - Starting game...');
  console.log(`📦 Version: ${VERSION.app} (${VERSION.gitCommit})`);

  // Log diagnostic info
  const diagnosticInfo = await getDiagnosticInfo();
  console.log('🔍 Diagnostic Info:', diagnosticInfo);

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

  // Monitor online/offline status
  window.addEventListener('online', () => {
    console.log('[App] 🟢 Online');
  });

  window.addEventListener('offline', () => {
    console.log('[App] 🔴 Offline - running from cache');
  });

  // Log initial status
  console.log(`[App] Network status: ${navigator.onLine ? '🟢 Online' : '🔴 Offline'}`);

  // Setup help modal
  setupHelpModal();

  // Setup copy debug info button
  setupDebugInfoButton();

  // Update version display
  updateVersionDisplay();

  // Show welcome modal on first visit
  showWelcomeIfFirstVisit();
});

// Handle keyboard input
function handleKeyboardInput(e) {
  const state = getState();
  const word = getCurrentWord();

  // Only handle letter keys (a-z)
  if (e.key.length === 1 && /[a-z]/i.test(e.key)) {
    const letter = e.key.toLowerCase();

    // Only vibrate if letter will be added
    if (word && state.currentGuess.length < word.english.length) {
      vibrateLetterInput();
    }

    addLetter(letter);
    render();
  }
  // Handle backspace
  else if (e.key === 'Backspace') {
    e.preventDefault();

    // Only vibrate if there's something to delete
    if (state.currentGuess.length > 0) {
      vibrateTap();
    }

    removeLetter();
    render();
  }
  // Handle enter
  else if (e.key === 'Enter') {
    // Vibrate invalid if word is incomplete
    if (word && state.currentGuess.length !== word.english.length) {
      vibrateInvalid();
    }

    submitGuess();
    render();
  }
}

// Handle title click to go home
function handleTitleClick() {
  backToTopics();
  render();
}

// Show welcome modal on first visit
function showWelcomeIfFirstVisit() {
  const WELCOME_SHOWN_KEY = 'mots_welcome_shown';
  const welcomeModal = document.getElementById('welcome-modal');
  const closeWelcome = document.getElementById('close-welcome');

  if (!welcomeModal) return;

  // Check if welcome has been shown before
  const hasSeenWelcome = localStorage.getItem(WELCOME_SHOWN_KEY);

  if (!hasSeenWelcome) {
    // Show welcome modal
    setTimeout(() => {
      welcomeModal.classList.add('active');
      welcomeModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }, 500); // Small delay for better UX

    // Close and mark as seen
    closeWelcome?.addEventListener('click', () => {
      welcomeModal.classList.remove('active');
      welcomeModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      localStorage.setItem(WELCOME_SHOWN_KEY, 'true');
    });
  }
}

// Update version display in help modal
function updateVersionDisplay() {
  const versionElement = document.getElementById('app-version');
  if (versionElement) {
    versionElement.textContent = `Version ${VERSION.app}`;
  }
}

// Setup copy debug info button
function setupDebugInfoButton() {
  const copyButton = document.getElementById('copy-debug-info');
  if (!copyButton) return;

  copyButton.addEventListener('click', async () => {
    try {
      const diagnosticInfo = await getDiagnosticInfo();
      const formattedInfo = formatDiagnosticInfo(diagnosticInfo);

      // Copy to clipboard
      await navigator.clipboard.writeText(formattedInfo);

      // Visual feedback
      const originalText = copyButton.textContent;
      copyButton.textContent = '✅ Copied!';
      setTimeout(() => {
        copyButton.textContent = originalText;
      }, 2000);

      console.log('📋 Diagnostic info copied to clipboard');
    } catch (error) {
      console.error('Failed to copy diagnostic info:', error);
      alert('Failed to copy. Check console for diagnostic info.');
    }
  });
}

// Setup help modal
function setupHelpModal() {
  const helpButton = document.getElementById('help-button');
  const helpModal = document.getElementById('help-modal');
  const closeHelp = document.getElementById('close-help');
  const helpOverlay = document.getElementById('help-modal-overlay');

  if (!helpButton || !helpModal) return;

  // Open modal
  helpButton.addEventListener('click', () => {
    helpModal.classList.add('active');
    helpModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Prevent background scroll
  });

  // Close modal
  const closeModal = () => {
    helpModal.classList.remove('active');
    helpModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; // Restore scroll
  };

  closeHelp?.addEventListener('click', closeModal);
  helpOverlay?.addEventListener('click', closeModal);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && helpModal.classList.contains('active')) {
      closeModal();
    }
  });
}

// Register service worker for offline-first functionality
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('[App] Service workers not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('[App] Service worker registered:', registration.scope);

    // Check for updates on page load
    registration.update();

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('[App] Service worker update found');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('[App] New service worker installed, ready to activate');
          // Could show a "New version available" notification here
        }
      });
    });
  } catch (error) {
    console.error('[App] Service worker registration failed:', error);
  }
}

console.log('✅ Mots loaded successfully!');
