// ui.js - UI rendering functions

import {
  getState,
  getTopics,
  getTopicsWithProgress,
  getCurrentWord,
  GAME_STATES,
  GAME_MODES,
  ALPHABET,
  selectTopic,
  selectMode,
  addLetter,
  removeLetter,
  submitGuess,
  nextWord,
  previousWord,
  backToTopics,
  backToModeSelection,
  startPlaying,
  restartGame,
  toggleWordReveal,
  setCurrentGuess
} from './game.js';

// Debug logging to visible panel (for iPhone where Eruda doesn't work)
function debugLog(message) {
  console.log(message);
  const panel = document.getElementById('debug-panel');
  if (panel) {
    const timestamp = new Date().toLocaleTimeString();
    panel.innerHTML += `<div>[${timestamp}] ${message}</div>`;
    panel.scrollTop = panel.scrollHeight;
  }
}

// Better iOS detection - multiple methods
function isIOS() {
  // Method 1: User Agent
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return true;
  }

  // Method 2: Platform (older method)
  if (/iPhone|iPad|iPod/.test(navigator.platform)) {
    return true;
  }

  // Method 3: iOS 13+ detection (iPad reports as desktop)
  if (navigator.maxTouchPoints > 1 && /MacIntel/.test(navigator.platform)) {
    return true;
  }

  // Method 4: Check for Safari-specific features
  if (navigator.vendor && navigator.vendor.indexOf('Apple') > -1 &&
      navigator.maxTouchPoints && navigator.maxTouchPoints > 1) {
    return true;
  }

  return false;
}

// Main render function
export function render() {
  const mainContent = document.getElementById('main-content');
  const state = getState();

  switch (state.gameState) {
    case GAME_STATES.TOPIC_SELECTION:
      mainContent.innerHTML = renderTopicSelection();
      attachTopicSelectionListeners();
      break;
    case GAME_STATES.MODE_SELECTION:
      mainContent.innerHTML = renderModeSelection();
      attachModeSelectionListeners();
      break;
    case GAME_STATES.STUDYING:
      mainContent.innerHTML = renderStudyMode();
      attachStudyModeListeners();
      break;
    case GAME_STATES.PLAYING:
      mainContent.innerHTML = renderPlayMode();
      attachPlayModeListeners();
      break;
    case GAME_STATES.WON:
      mainContent.innerHTML = renderWonScreen();
      attachResultListeners();
      break;
    case GAME_STATES.LOST:
      mainContent.innerHTML = renderLostScreen();
      attachResultListeners();
      break;
    case GAME_STATES.COMPLETE:
      mainContent.innerHTML = renderCompleteScreen();
      attachCompleteListeners();
      break;
  }
}

// Render topic selection
function renderTopicSelection() {
  const topics = getTopicsWithProgress();

  return `
    <div class="topic-selection">
      <h2 class="section-title">Choose a Topic</h2>
      <div class="topic-grid" role="list">
        ${topics.map(topic => {
          const hasProgress = topic.progress.totalPlayed > 0;
          const winRate = topic.progress.totalPlayed > 0
            ? Math.round((topic.progress.totalWon / (topic.progress.totalWon + topic.progress.totalLost)) * 100)
            : 0;

          return `
          <button
            class="topic-card ${hasProgress ? 'has-progress' : ''}"
            data-topic-id="${topic.id}"
            role="listitem"
            aria-label="Select topic: ${topic.name}, ${topic.words.length} words${hasProgress ? `, ${winRate}% success rate` : ''}">
            <div class="topic-emoji">${topic.emoji}</div>
            <div class="topic-name">${topic.name}</div>
            <div class="topic-count">${topic.words.length} words</div>
            ${hasProgress ? `
              <div class="topic-progress">
                <span class="progress-stat">✓ ${topic.progress.totalWon}</span>
                <span class="progress-stat">✗ ${topic.progress.totalLost}</span>
                <span class="progress-rate">${winRate}%</span>
              </div>
            ` : ''}
          </button>
        `;
        }).join('')}
      </div>
    </div>
  `;
}

function attachTopicSelectionListeners() {
  document.querySelectorAll('[data-topic-id]').forEach(button => {
    button.addEventListener('click', (e) => {
      const topicId = e.currentTarget.dataset.topicId;
      selectTopic(topicId);
      render();
    });
  });
}

// Render mode selection
function renderModeSelection() {
  const state = getState();

  return `
    <div class="mode-selection">
      <div class="mode-back-header">
        <button class="back-button" data-action="back-to-topics" aria-label="Back to topic selection">
          ← Topics
        </button>
      </div>
      <h2 class="section-title">Choose Mode</h2>
      <div class="mode-grid">
        <button class="mode-card" data-mode="study" aria-label="Study mode - Review all words first, then play">
          <div class="mode-icon">📖</div>
          <div class="mode-name">Study Mode</div>
          <div class="mode-description">Review all words first, then play</div>
        </button>
        <button class="mode-card" data-mode="play" aria-label="Play mode - Jump straight in and test yourself">
          <div class="mode-icon">🎮</div>
          <div class="mode-name">Play Mode</div>
          <div class="mode-description">Jump straight in and test yourself</div>
        </button>
      </div>
    </div>
  `;
}

function attachModeSelectionListeners() {
  document.querySelectorAll('[data-mode]').forEach(button => {
    button.addEventListener('click', (e) => {
      const mode = e.currentTarget.dataset.mode;
      selectMode(mode);
      render();
    });
  });

  document.querySelector('[data-action="back-to-topics"]')?.addEventListener('click', () => {
    backToTopics();
    render();
  });
}

// Render study mode
function renderStudyMode() {
  const state = getState();
  const word = getCurrentWord();
  const wordNumber = state.currentWordIndex + 1;
  const totalWords = state.selectedTopic.words.length;
  const hasNext = state.currentWordIndex < totalWords - 1;
  const hasPrevious = state.currentWordIndex > 0;
  const isRevealed = state.isWordRevealed;

  return `
    <div>
      <div class="topic-header">
        <button class="back-button" data-action="back-to-modes" aria-label="Back to mode selection">
          ← Modes
        </button>
        <div class="current-topic">
          <span class="topic-emoji-small">${state.selectedTopic.emoji}</span>
          <span class="topic-name-small">${state.selectedTopic.name} - Study</span>
        </div>
      </div>

      <div class="study-progress">Word ${wordNumber} of ${totalWords}</div>

      <div class="game">
        <div class="word-section">
          <div class="catalan-word">
            <div class="word" lang="ca">${word.ca}</div>
          </div>
        </div>

        <div class="study-grid-wrapper" data-action="toggle-reveal">
          <div class="grid-container" data-word-length="${word.en.length}" style="--word-length: ${word.en.length};">
            <div class="grid-row">
              ${Array.from({ length: word.en.length }).map((_, i) => {
                const letter = isRevealed ? word.en[i].toUpperCase() : '';
                const cellClass = isRevealed ? 'grid-cell grid-cell-correct' : 'grid-cell';
                return `<div class="${cellClass}">${letter}</div>`;
              }).join('')}
            </div>
          </div>
          <div class="reveal-hint">${isRevealed ? '👁️ Tap to hide' : '👁️ Tap to reveal'}</div>
        </div>

        <div class="study-navigation">
          <button
            class="btn btn-secondary"
            data-action="previous-word"
            ${!hasPrevious ? 'disabled' : ''}
            aria-label="Previous word">
            ← Previous
          </button>
          <button
            class="btn btn-secondary"
            data-action="next-word"
            ${!hasNext ? 'disabled' : ''}
            aria-label="Next word">
            Next →
          </button>
        </div>

        <button class="btn btn-primary btn-start-playing" data-action="start-playing" aria-label="Start playing">
          🎮 Start Playing
        </button>
      </div>
    </div>
  `;
}

function attachStudyModeListeners() {
  document.querySelector('[data-action="back-to-modes"]')?.addEventListener('click', () => {
    backToModeSelection();
    render();
  });

  document.querySelector('[data-action="previous-word"]')?.addEventListener('click', () => {
    previousWord();
    render();
  });

  document.querySelector('[data-action="next-word"]')?.addEventListener('click', () => {
    nextWord();
    render();
  });

  document.querySelector('[data-action="start-playing"]')?.addEventListener('click', () => {
    startPlaying();
    render();
  });

  document.querySelector('[data-action="toggle-reveal"]')?.addEventListener('click', () => {
    toggleWordReveal();
    render();
  });
}

// Render play mode
function renderPlayMode() {
  const state = getState();
  const word = getCurrentWord();
  const wordNumber = state.currentWordIndex + 1;
  const totalWords = state.selectedTopic.words.length;
  const hasStreak = state.currentStreak > 0;

  return `
    <div>
      <div class="topic-header">
        <button class="back-button" data-action="back-to-modes" aria-label="Back to mode selection">
          ← Modes
        </button>
        <div class="current-topic">
          <span class="topic-emoji-small">${state.selectedTopic.emoji}</span>
          <span class="topic-name-small">${state.selectedTopic.name}</span>
          <span class="progress-indicator">Word ${wordNumber}/${totalWords}</span>
          ${hasStreak ? `<span class="streak-indicator">🔥 ${state.currentStreak}</span>` : ''}
        </div>
      </div>

      <div class="game" aria-labelledby="game-title">
        <div class="word-section">
          <div class="catalan-word">
            <div class="word" lang="ca">${word.ca}</div>
          </div>
        </div>

        <!-- iOS: Message explaining to use on-screen buttons -->
        <div class="ios-keyboard-message ${isIOS() ? 'ios-device' : ''}">
          💡 Use the letter buttons below to play
        </div>

        <!-- Android: Text input for native keyboard -->
        <input
          type="text"
          id="mobile-keyboard-input"
          class="mobile-keyboard-input ${isIOS() ? 'ios-device' : ''}"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="none"
          spellcheck="false"
          inputmode="text"
          enterkeyhint="go"
          placeholder="Type here..."
        />

        <!-- Debug panel for iPhone testing -->
        <div id="debug-panel" style="
          position: fixed;
          bottom: 10px;
          left: 10px;
          right: 10px;
          background: rgba(0,0,0,0.8);
          color: #0f0;
          font-family: monospace;
          font-size: 11px;
          padding: 10px;
          border-radius: 8px;
          z-index: 9999;
          max-height: 150px;
          overflow-y: auto;
          line-height: 1.3;
        "></div>

        ${renderGrid()}
        ${renderKeyboard()}
      </div>
    </div>
  `;
}

// Render the Wordle-style grid
function renderGrid() {
  const state = getState();
  const word = getCurrentWord();
  const wordLength = word.en.length;
  const targetWord = word.en;

  return `
    <div class="grid-container" data-word-length="${wordLength}" style="--word-length: ${wordLength};">
      ${Array.from({ length: state.maxAttempts }).map((_, rowIndex) => {
        const guess = state.guesses[rowIndex];
        const isCurrentRow = rowIndex === state.guesses.length && state.guesses.length < state.maxAttempts;

        return `
          <div class="grid-row">
            ${Array.from({ length: wordLength }).map((_, colIndex) => {
              const targetChar = targetWord[colIndex];

              // Check if this position is a space in the target word
              if (targetChar === ' ') {
                return `<div class="grid-space"></div>`;
              }

              let letter = '';
              let cellClass = 'grid-cell';

              if (guess) {
                // Completed guess
                letter = guess.word[colIndex].toUpperCase();
                cellClass += ` grid-cell-${guess.feedback[colIndex]}`;
              } else if (isCurrentRow && state.currentGuess[colIndex]) {
                // Current guess being typed
                letter = state.currentGuess[colIndex].toUpperCase();
                cellClass += ' grid-cell-filled';
              }

              // Make current row cells clickable to open mobile keyboard
              const clickable = isCurrentRow ? 'data-grid-cell' : '';

              return `<div class="${cellClass}" ${clickable}>${letter}</div>`;
            }).join('')}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// Update grid display without full re-render (for mobile keyboard)
function updateGridDisplay() {
  const state = getState();
  const word = getCurrentWord();

  console.log('[updateGridDisplay] Called');
  console.log('[updateGridDisplay] Current guess:', state.currentGuess);
  console.log('[updateGridDisplay] Target word:', word?.en);

  if (!word) {
    console.log('[updateGridDisplay] No word found');
    return;
  }

  // Find the current row (the one being typed)
  const currentRowIndex = state.guesses.length;
  const gridRows = document.querySelectorAll('.grid-row');

  console.log('[updateGridDisplay] Current row index:', currentRowIndex);
  console.log('[updateGridDisplay] Total grid rows:', gridRows.length);

  if (!gridRows[currentRowIndex]) {
    console.log('[updateGridDisplay] Current row not found');
    return;
  }

  const currentRow = gridRows[currentRowIndex];

  // Get ALL children (including .grid-space divs)
  const allChildren = Array.from(currentRow.children);
  console.log('[updateGridDisplay] Total children in row:', allChildren.length);

  // Filter to only grid-cell elements
  const cells = allChildren.filter(child => child.classList.contains('grid-cell'));
  console.log('[updateGridDisplay] Grid cells found:', cells.length);

  // Map each position in the target word to actual letters (excluding spaces)
  const targetLetters = word.en.split('').filter(char => char !== ' ');
  const guessLetters = state.currentGuess.split('').filter(char => char !== ' ');

  console.log('[updateGridDisplay] Target letters (no spaces):', targetLetters);
  console.log('[updateGridDisplay] Guess letters (no spaces):', guessLetters);

  // Update each cell
  cells.forEach((cell, index) => {
    const letter = guessLetters[index] || '';

    console.log(`[updateGridDisplay] Cell ${index} - Letter to set: "${letter}"`);
    console.log(`[updateGridDisplay] Cell ${index} - Before: "${cell.textContent}"`);
    console.log(`[updateGridDisplay] Cell ${index} - Cell element:`, cell);

    if (letter) {
      const upperLetter = letter.toUpperCase();
      console.log(`[updateGridDisplay] Cell ${index} - Setting textContent to: "${upperLetter}"`);
      cell.textContent = upperLetter;
      console.log(`[updateGridDisplay] Cell ${index} - After setting: "${cell.textContent}"`);
      console.log(`[updateGridDisplay] Cell ${index} - innerHTML: "${cell.innerHTML}"`);
      cell.classList.add('grid-cell-filled');
    } else {
      cell.textContent = '';
      cell.classList.remove('grid-cell-filled');
    }
  });

  console.log('[updateGridDisplay] Update complete');
}

// Render keyboard
function renderKeyboard() {
  const state = getState();
  const letterStates = state.letterStates || {};

  console.log('[UI] Rendering keyboard with letter states:', letterStates);

  return `
    <div class="keyboard" role="group" aria-label="Letter keyboard">
      ${ALPHABET.map(letter => {
        const letterState = letterStates[letter];
        const stateClass = letterState ? `key-${letterState}` : '';

        return `
          <button
            class="key ${stateClass}"
            data-letter="${letter}"
            aria-label="Letter ${letter.toUpperCase()}${letterState ? ` - ${letterState}` : ''}">
            ${letter.toUpperCase()}
          </button>
        `;
      }).join('')}
      <button class="key key-wide" data-action="backspace" aria-label="Backspace">
        ⌫
      </button>
      <button class="key key-wide key-enter" data-action="enter" aria-label="Submit guess">
        ENTER
      </button>
    </div>
  `;
}

function attachPlayModeListeners() {
  document.querySelector('[data-action="back-to-modes"]')?.addEventListener('click', () => {
    backToModeSelection();
    render();
  });

  // Letter buttons
  document.querySelectorAll('[data-letter]').forEach(button => {
    button.addEventListener('click', (e) => {
      const letter = e.currentTarget.dataset.letter;
      addLetter(letter);
      render();
    });
  });

  // Backspace button
  document.querySelector('[data-action="backspace"]')?.addEventListener('click', () => {
    removeLetter();
    render();
  });

  // Enter button
  document.querySelector('[data-action="enter"]')?.addEventListener('click', () => {
    submitGuess();
    render();
  });

  // Mobile keyboard support - COMPREHENSIVE DIAGNOSTICS
  const mobileInput = document.getElementById('mobile-keyboard-input');

  // === DIAGNOSTIC PHASE 1: Element Detection ===
  console.log('========================================');
  console.log('[Mobile KB Diagnostics] PHASE 1: Element Detection');
  console.log('[Mobile KB Diagnostics] Input element found:', !!mobileInput);
  console.log('[Mobile KB Diagnostics] Input element:', mobileInput);
  console.log('[Mobile KB Diagnostics] Input ID:', mobileInput?.id);
  console.log('[Mobile KB Diagnostics] Input type:', mobileInput?.type);
  console.log('[Mobile KB Diagnostics] Input value:', mobileInput?.value);

  // === DIAGNOSTIC PHASE 2: Computed Styles ===
  if (mobileInput) {
    const styles = window.getComputedStyle(mobileInput);
    console.log('[Mobile KB Diagnostics] PHASE 2: Computed Styles');
    console.log('[Mobile KB Diagnostics] Position:', styles.position);
    console.log('[Mobile KB Diagnostics] Left:', styles.left);
    console.log('[Mobile KB Diagnostics] Top:', styles.top);
    console.log('[Mobile KB Diagnostics] Width:', styles.width);
    console.log('[Mobile KB Diagnostics] Height:', styles.height);
    console.log('[Mobile KB Diagnostics] Opacity:', styles.opacity);
    console.log('[Mobile KB Diagnostics] Pointer-events:', styles.pointerEvents);
    console.log('[Mobile KB Diagnostics] Display:', styles.display);
    console.log('[Mobile KB Diagnostics] Visibility:', styles.visibility);
    console.log('[Mobile KB Diagnostics] Z-index:', styles.zIndex);
  }

  // === DIAGNOSTIC PHASE 3: Device & Browser Info ===
  console.log('[Mobile KB Diagnostics] PHASE 3: Device & Browser Info');
  console.log('[Mobile KB Diagnostics] User Agent:', navigator.userAgent);
  console.log('[Mobile KB Diagnostics] Platform:', navigator.platform);
  console.log('[Mobile KB Diagnostics] Touch support:', 'ontouchstart' in window);
  console.log('[Mobile KB Diagnostics] Screen width:', window.screen.width);
  console.log('[Mobile KB Diagnostics] Screen height:', window.screen.height);
  console.log('[Mobile KB Diagnostics] Viewport width:', window.innerWidth);
  console.log('[Mobile KB Diagnostics] Viewport height:', window.innerHeight);
  console.log('========================================');

  // Debug to visible panel
  const isIOSDetected = isIOS();
  debugLog('=== DEVICE INFO ===');
  debugLog('FULL UA:');
  debugLog(navigator.userAgent);
  debugLog('---');
  debugLog('Platform: ' + navigator.platform);
  debugLog('Vendor: ' + navigator.vendor);
  debugLog('maxTouchPoints: ' + navigator.maxTouchPoints);
  debugLog('---');
  debugLog('iOS Detection (OLD): ' + (navigator.userAgent.match(/iPhone|iPad|iPod/i) ? 'YES' : 'NO'));
  debugLog('iOS Detection (NEW): ' + (isIOSDetected ? 'YES ✅' : 'NO ❌'));
  debugLog('Touch: ' + ('ontouchstart' in window ? 'YES' : 'NO'));
  debugLog('==================');

  if (mobileInput) {
    console.log('[Mobile KB Setup] Attaching event listeners');

    // Track last processed value to avoid duplicate updates
    let lastProcessedValue = '';

    // === DIAGNOSTIC PHASE 4: Focus Attempt ===
    console.log('[Mobile KB Diagnostics] PHASE 4: Focus Attempt');
    console.log('[Mobile KB Diagnostics] Active element before focus:', document.activeElement);
    console.log('[Mobile KB Diagnostics] Input disabled?', mobileInput.disabled);
    console.log('[Mobile KB Diagnostics] Input readonly?', mobileInput.readOnly);
    console.log('[Mobile KB Diagnostics] Input tabIndex:', mobileInput.tabIndex);

    // iOS: Don't auto-focus (native keyboard is broken, use on-screen buttons only)
    // Android: Auto-focus input to open keyboard
    if (!isIOS()) {
      // Auto-focus input to open keyboard on mobile when entering play mode
      requestAnimationFrame(() => {
        setTimeout(() => {
          console.log('[Mobile KB Diagnostics] ==> Attempting to focus input now');
          console.log('[Mobile KB Diagnostics] Before focus() - activeElement:', document.activeElement?.tagName, document.activeElement?.id);

          try {
            mobileInput.focus();
            console.log('[Mobile KB Diagnostics] After focus() - activeElement:', document.activeElement?.tagName, document.activeElement?.id);
            console.log('[Mobile KB Diagnostics] Focus successful?', document.activeElement === mobileInput);

            // Log the input's position after focus
            const rect = mobileInput.getBoundingClientRect();
            console.log('[Mobile KB Diagnostics] Input position after focus:');
            console.log('[Mobile KB Diagnostics]   - x:', rect.x);
            console.log('[Mobile KB Diagnostics]   - y:', rect.y);
            console.log('[Mobile KB Diagnostics]   - width:', rect.width);
            console.log('[Mobile KB Diagnostics]   - height:', rect.height);
            console.log('[Mobile KB Diagnostics]   - in viewport?', rect.y >= 0 && rect.y <= window.innerHeight);
          } catch (error) {
            console.error('[Mobile KB Diagnostics] ERROR focusing input:', error);
          }
        }, 300);
      });
    } else {
      console.log('[iOS] Auto-focus disabled - use on-screen buttons');
    }

    // === DIAGNOSTIC PHASE 5: Click Handlers ===
    console.log('[Mobile KB Diagnostics] PHASE 5: Setting up click handlers');
    const clickableElements = [
      ...document.querySelectorAll('[data-grid-cell]'),
      document.querySelector('.catalan-word'),
      document.querySelector('.grid-container')
    ].filter(Boolean);

    console.log('[Mobile KB Diagnostics] Clickable elements found:', clickableElements.length);
    clickableElements.forEach((element, index) => {
      console.log(`[Mobile KB Diagnostics] Clickable element ${index}:`, element.className);

      element.addEventListener('click', (e) => {
        console.log(`[Mobile KB Diagnostics] Click event on element ${index}`);
        console.log('[Mobile KB Diagnostics] Click - event type:', e.type);
        console.log('[Mobile KB Diagnostics] Click - target:', e.target);
        console.log('[Mobile KB Diagnostics] Click - currentTarget:', e.currentTarget);
        e.preventDefault();

        console.log('[Mobile KB Diagnostics] Click - attempting focus...');
        const focusBefore = document.activeElement;
        mobileInput.focus();
        const focusAfter = document.activeElement;
        console.log('[Mobile KB Diagnostics] Click - focus changed?', focusBefore !== focusAfter);
        console.log('[Mobile KB Diagnostics] Click - input focused?', focusAfter === mobileInput);
      });

      // Also add touch event for mobile
      element.addEventListener('touchend', (e) => {
        console.log(`[Mobile KB Diagnostics] Touchend event on element ${index}`);
        e.preventDefault();
        mobileInput.focus();
      });
    });

    // === DIAGNOSTIC PHASE 6: Input Event Listener ===
    console.log('[Mobile KB Diagnostics] PHASE 6: Setting up input event listener');

    // Add focus/blur listeners for diagnostics
    let lastFocusTime = 0;
    mobileInput.addEventListener('focus', () => {
      lastFocusTime = Date.now();
      console.log('[Mobile KB Diagnostics] ===> INPUT FOCUSED <===');
      console.log('[Mobile KB Diagnostics] Focus event - activeElement:', document.activeElement?.id);
      console.log('[Mobile KB Diagnostics] Focus event - timestamp:', lastFocusTime);

      // iOS: Don't call debugLog or any DOM modifications during focus
      if (!isIOS()) {
        debugLog('✅ INPUT FOCUSED @ ' + new Date().toLocaleTimeString());

        // Check if blur happens quickly
        setTimeout(() => {
          if (document.activeElement !== mobileInput) {
            debugLog('⚠️ Lost focus after 100ms!');
          }
        }, 100);

        setTimeout(() => {
          if (document.activeElement !== mobileInput) {
            debugLog('⚠️ Lost focus after 500ms!');
          } else {
            debugLog('✓ Still focused after 500ms');
          }
        }, 500);
      } else {
        console.log('[iOS] Focus event - NO DOM modifications');
      }

      // Monitor value changes even if events don't fire (Chrome iOS workaround)
      // iOS: Disabled polling to test if it's causing keyboard to close
      if (!isIOS()) {
        let lastValue = mobileInput.value;
        const valueMonitor = setInterval(() => {
          const currentValue = mobileInput.value;

          if (currentValue !== lastValue) {
            console.log('🔄 Silent change: "' + lastValue + '" -> "' + currentValue + '"');

            // Chrome iOS doesn't fire input events, so manually trigger game logic
            const state = getState();
            const word = getCurrentWord();

            if (!word) {
              lastValue = currentValue;
              return;
            }

            // Filter and process the value
            const filteredValue = currentValue.toLowerCase().replace(/[^a-z]/g, '');
            const maxLength = word.en.replace(/ /g, '').length;
            const trimmedValue = filteredValue.substring(0, maxLength);

            // Build the new guess with auto-inserted spaces
            let newGuess = '';
            let letterIndex = 0;

            for (let i = 0; i < word.en.length && letterIndex < trimmedValue.length; i++) {
              if (word.en[i] === ' ') {
                newGuess += ' ';
              } else {
                newGuess += trimmedValue[letterIndex];
                letterIndex++;
              }
            }

            console.log('📝 Manual update: "' + newGuess + '"');

            // Update state
            setCurrentGuess(newGuess);

            // Update grid
            updateGridDisplay();

            // Sync input value
            const cleanValue = newGuess.replace(/ /g, '');
            if (currentValue !== cleanValue) {
              mobileInput.value = cleanValue;
            }
            lastValue = cleanValue;
          }

          if (document.activeElement !== mobileInput) {
            clearInterval(valueMonitor);
          }
        }, 100);
      } else {
        console.log('[iOS] Polling disabled - testing keyboard stability');
      }
    });

    // iOS FIX: Track if we're actively typing to prevent keyboard dismissal
    let isTyping = false;
    let typingTimeout = null;

    mobileInput.addEventListener('blur', (e) => {
      const blurTime = Date.now();
      const timeSinceFocus = blurTime - lastFocusTime;
      console.log('[Mobile KB Diagnostics] ===> INPUT BLURRED <===');
      console.log('[Mobile KB Diagnostics] Blur event - activeElement:', document.activeElement?.id);
      console.log('[Mobile KB Diagnostics] Blur event - isTyping flag:', isTyping);
      console.log('[Mobile KB Diagnostics] Time since focus:', timeSinceFocus + 'ms');

      // iOS: Don't call debugLog or try to prevent blur - just let it happen naturally
      if (!isIOS()) {
        debugLog('❌ INPUT BLURRED (' + timeSinceFocus + 'ms after focus)');
      } else {
        console.log('[iOS] Blur event - NO intervention');
      }
    });

    // Add beforeinput event for diagnostics (fires before input)
    mobileInput.addEventListener('beforeinput', (e) => {
      console.log('[Mobile KB Diagnostics] BEFOREINPUT event fired');
      console.log('[Mobile KB Diagnostics] beforeinput - inputType:', e.inputType);
      console.log('[Mobile KB Diagnostics] beforeinput - data:', e.data);
      if (!isIOS()) {
        debugLog('⌨️ BEFOREINPUT: ' + e.data);
      }
    });

    // Add keydown listener for diagnostics
    mobileInput.addEventListener('keydown', (e) => {
      console.log('[Mobile KB Diagnostics] KEYDOWN event fired');
      console.log('[Mobile KB Diagnostics] keydown - key:', e.key);
      console.log('[Mobile KB Diagnostics] keydown - code:', e.code);
      console.log('[Mobile KB Diagnostics] keydown - keyCode:', e.keyCode);
      if (!isIOS()) {
        debugLog('⬇️ KEYDOWN: ' + e.key);
      }
    });

    // Add keyup listener for diagnostics
    mobileInput.addEventListener('keyup', (e) => {
      console.log('[Mobile KB Diagnostics] KEYUP event fired');
      console.log('[Mobile KB Diagnostics] keyup - key:', e.key);
      console.log('[Mobile KB Diagnostics] keyup - value:', e.target.value);
      if (!isIOS()) {
        debugLog('⬆️ KEYUP: ' + e.key + ' | val: ' + e.target.value);
      }
    });

    console.log('[Mobile KB Diagnostics] Event listeners attached:');
    console.log('[Mobile KB Diagnostics]   - focus: YES');
    console.log('[Mobile KB Diagnostics]   - blur: YES');
    console.log('[Mobile KB Diagnostics]   - beforeinput: YES');
    console.log('[Mobile KB Diagnostics]   - keydown: YES');
    console.log('[Mobile KB Diagnostics]   - keyup: YES');
    console.log('[Mobile KB Diagnostics]   - input: ADDING NOW...');
    console.log('========================================');
    console.log('[Mobile KB Diagnostics] ✅ Setup Complete!');
    console.log('[Mobile KB Diagnostics] Test by:');
    console.log('[Mobile KB Diagnostics]   1. Tapping grid cells or word');
    console.log('[Mobile KB Diagnostics]   2. Typing on keyboard');
    console.log('[Mobile KB Diagnostics]   3. Check for focus/input events above');
    console.log('========================================');

    // Handle input from mobile keyboard
    mobileInput.addEventListener('input', (e) => {
      console.log('[Mobile KB] ===== INPUT EVENT FIRED =====');
      debugLog('📝 INPUT EVENT: ' + e.target.value);

      const currentValue = e.target.value.toLowerCase();

      console.log('[Mobile KB] Input event:', currentValue);
      console.log('[Mobile KB] Event target:', e.target);
      console.log('[Mobile KB] Last processed value:', lastProcessedValue);
      console.log('[Mobile KB] Event timestamp:', e.timeStamp);

      // Don't skip - let it process every time for now
      // if (currentValue === lastProcessedValue) {
      //   console.log('[Mobile KB] Skipping duplicate value');
      //   return;
      // }

      const state = getState();
      const word = getCurrentWord();

      console.log('[Mobile KB] Current word:', word.en);
      console.log('[Mobile KB] Current guess before:', state.currentGuess);

      // Filter out non-letter characters including spaces
      const filteredValue = currentValue.replace(/[^a-z]/g, '');

      // Limit to word length (without spaces)
      const maxLength = word.en.replace(/ /g, '').length;
      const trimmedValue = filteredValue.substring(0, maxLength);

      // Build the new guess with auto-inserted spaces
      let newGuess = '';
      let letterIndex = 0;

      for (let i = 0; i < word.en.length && letterIndex < trimmedValue.length; i++) {
        if (word.en[i] === ' ') {
          newGuess += ' ';
        } else {
          newGuess += trimmedValue[letterIndex];
          letterIndex++;
        }
      }

      console.log('[Mobile KB] New guess:', newGuess);

      // Update the state using proper action function
      // FIX: Use setCurrentGuess instead of directly mutating state copy
      setCurrentGuess(newGuess);

      console.log('[Mobile KB] ✅ Called setCurrentGuess with:', newGuess);
      console.log('[Mobile KB] Calling updateGridDisplay()');

      // Verify state was actually updated
      const verifyState = getState();
      console.log('[Mobile KB] Verified currentGuess:', verifyState.currentGuess);

      // iOS FIX: Skip grid update during typing to prevent keyboard dismissal
      const isiOSDevice = isIOS();

      if (isiOSDevice) {
        console.log('[Mobile KB] iOS - SKIPPING ALL DOM operations to keep keyboard open');
        console.log('[Mobile KB] iOS - Grid will update when word is submitted');
        debugLog('iOS: Typed "' + newGuess + '" - NO grid update');

        // Don't call updateGridDisplay() at all - Safari dismisses keyboard on DOM changes
        // Don't query DOM, don't modify input value - do NOTHING that could close keyboard

        // Set typing flag
        isTyping = true;
        clearTimeout(typingTimeout);

        // Keep typing flag active
        typingTimeout = setTimeout(() => {
          isTyping = false;
          console.log('[Mobile KB] iOS - Typing session ended');
        }, 500);

        // iOS: Just update the last processed value, don't touch anything else
        lastProcessedValue = newGuess.replace(/ /g, '');

        // Exit early - do NOTHING else on iOS
        return;
      }

      // === ANDROID/DESKTOP ONLY - Everything below this point ===
      console.log('[Mobile KB] Non-iOS - Updating grid');
      debugLog('Non-iOS: Typed "' + newGuess + '" - updating grid');
      updateGridDisplay();

      // Check if cells were actually updated
      const gridRows = document.querySelectorAll('.grid-row');
      const currentRow = gridRows[state.guesses.length];
      if (currentRow) {
        const cells = currentRow.querySelectorAll('.grid-cell');
        console.log('[Mobile KB] Cells after update:', Array.from(cells).map(c => c.textContent));
      }

      // Keep input value synced (letters only, no spaces)
      const cleanValue = newGuess.replace(/ /g, '');
      lastProcessedValue = cleanValue;

      // Only update if different to avoid cursor jumping
      if (e.target.value !== cleanValue) {
        e.target.value = cleanValue;
      }
    });

    // Handle Enter/Return key from mobile keyboard
    mobileInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const state = getState();
        const word = getCurrentWord();

        if (state.currentGuess.length !== word.en.length) {
          return;
        }

        submitGuess();
        render();

        // Clear and refocus input after render for next word
        lastProcessedValue = '';
        requestAnimationFrame(() => {
          setTimeout(() => {
            const input = document.getElementById('mobile-keyboard-input');
            if (input) {
              input.value = '';
              input.focus();
            }
          }, 150);
        });
      }
    });

    // Keep input synced when focusing
    mobileInput.addEventListener('focus', () => {
      const state = getState();
      const cleanValue = state.currentGuess.replace(/ /g, '');
      mobileInput.value = cleanValue;
      lastProcessedValue = cleanValue;
    });

    // Prevent input from losing focus on blur (optional - only if needed)
    // Uncomment if keyboard keeps closing
    // mobileInput.addEventListener('blur', () => {
    //   setTimeout(() => {
    //     if (document.activeElement !== mobileInput) {
    //       mobileInput.focus();
    //     }
    //   }, 0);
    // });
  }
}

// Render won screen
function renderWonScreen() {
  const word = getCurrentWord();
  const state = getState();
  const hasMore = state.currentWordIndex + 1 < state.selectedTopic.words.length;
  const wordNumber = state.currentWordIndex + 1;
  const totalWords = state.selectedTopic.words.length;
  const hasStreak = state.currentStreak > 0;

  return `
    <div>
      <div class="topic-header">
        <button class="back-button" data-action="back-to-modes" aria-label="Back to mode selection">
          ← Modes
        </button>
        <div class="current-topic">
          <span class="topic-emoji-small">${state.selectedTopic.emoji}</span>
          <span class="topic-name-small">${state.selectedTopic.name}</span>
          <span class="progress-indicator">Word ${wordNumber}/${totalWords}</span>
          ${hasStreak ? `<span class="streak-indicator">🔥 ${state.currentStreak}</span>` : ''}
        </div>
      </div>

      <div class="game result result-won" role="alert" aria-live="assertive">
        <div class="result-icon">🎉</div>
        <h2 class="result-title">Correct!</h2>
        <p class="result-word">The word is: <strong>${word.en}</strong></p>
        <button class="btn btn-primary" data-action="next-word" aria-label="${hasMore ? 'Next Word' : 'See Results'}">
          ${hasMore ? 'Next Word →' : 'See Results →'}
        </button>
      </div>
    </div>
  `;
}

// Render lost screen
function renderLostScreen() {
  const word = getCurrentWord();
  const state = getState();
  const hasMore = state.currentWordIndex + 1 < state.selectedTopic.words.length;
  const wordNumber = state.currentWordIndex + 1;
  const totalWords = state.selectedTopic.words.length;

  return `
    <div>
      <div class="topic-header">
        <button class="back-button" data-action="back-to-modes" aria-label="Back to mode selection">
          ← Modes
        </button>
        <div class="current-topic">
          <span class="topic-emoji-small">${state.selectedTopic.emoji}</span>
          <span class="topic-name-small">${state.selectedTopic.name}</span>
          <span class="progress-indicator">Word ${wordNumber}/${totalWords}</span>
        </div>
      </div>

      <div class="game result result-lost" role="alert" aria-live="assertive">
        <div class="result-icon">💔</div>
        <h2 class="result-title">Out of attempts!</h2>
        <p class="result-word">The word was: <strong>${word.en}</strong></p>
        <button class="btn btn-primary" data-action="next-word" aria-label="${hasMore ? 'Next Word' : 'See Results'}">
          ${hasMore ? 'Next Word →' : 'See Results →'}
        </button>
      </div>
    </div>
  `;
}

function attachResultListeners() {
  document.querySelector('[data-action="back-to-modes"]')?.addEventListener('click', () => {
    backToModeSelection();
    render();
  });

  document.querySelector('[data-action="next-word"]')?.addEventListener('click', () => {
    nextWord();
    render();
  });
}

// Render complete screen
function renderCompleteScreen() {
  const state = getState();
  const total = state.totalWon + state.totalLost;
  const percentage = total > 0 ? Math.round((state.totalWon / total) * 100) : 0;

  return `
    <div class="game game-complete" role="alert" aria-live="assertive">
      <div class="result-icon">🏁</div>
      <h2 class="result-title">Topic Complete!</h2>
      <div class="final-score">
        <div class="stat">
          <div class="stat-value">${state.totalWon}</div>
          <div class="stat-label">Words Won</div>
        </div>
        <div class="stat">
          <div class="stat-value">${state.totalLost}</div>
          <div class="stat-label">Words Lost</div>
        </div>
        <div class="stat stat-highlight">
          <div class="stat-value">${percentage}%</div>
          <div class="stat-label">Success Rate</div>
        </div>
      </div>
      <div class="complete-buttons">
        <button class="btn btn-secondary" data-action="back-to-topics" aria-label="Choose another topic">
          ← Choose Topic
        </button>
        <button class="btn btn-primary" data-action="back-to-modes" aria-label="Play this topic again">
          🔄 Play Again
        </button>
      </div>
    </div>
  `;
}

function attachCompleteListeners() {
  document.querySelector('[data-action="back-to-topics"]')?.addEventListener('click', () => {
    backToTopics();
    render();
  });

  document.querySelector('[data-action="back-to-modes"]')?.addEventListener('click', () => {
    backToModeSelection();
    render();
  });
}
