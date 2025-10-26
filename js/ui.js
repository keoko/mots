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
  toggleWordReveal
} from './game.js';

import { vibrateLetterInput, vibrateTap, vibrateInvalid } from './haptics.js';

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

        <!-- Hidden input for mobile keyboard -->
        <input
          type="text"
          id="mobile-keyboard-input"
          class="mobile-keyboard-input"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="none"
          spellcheck="false"
          inputmode="text"
          aria-hidden="true"
          tabindex="-1"
          enterkeyhint="go"
        />

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

  if (!word) return;

  // Find the current row (the one being typed)
  const currentRowIndex = state.guesses.length;
  const gridRows = document.querySelectorAll('.grid-row');

  if (!gridRows[currentRowIndex]) return;

  const currentRow = gridRows[currentRowIndex];
  const cells = currentRow.querySelectorAll('.grid-cell');

  // Update each cell in the current row
  let guessIndex = 0;
  for (let i = 0; i < word.en.length; i++) {
    // Skip spaces in the target word
    if (word.en[i] === ' ') continue;

    const cell = cells[guessIndex];
    if (!cell) continue;

    // Get the corresponding letter from currentGuess (accounting for spaces)
    const letter = state.currentGuess[i] || '';

    // Update cell content and styling
    if (letter && letter !== ' ') {
      cell.textContent = letter.toUpperCase();
      cell.classList.add('grid-cell-filled');
    } else {
      cell.textContent = '';
      cell.classList.remove('grid-cell-filled');
    }

    guessIndex++;
  }
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
      const state = getState();
      const word = getCurrentWord();

      // Only vibrate if letter was actually added
      if (state.currentGuess.length < word.en.length) {
        vibrateLetterInput();
      }

      addLetter(letter);
      render();
    });
  });

  // Backspace button
  document.querySelector('[data-action="backspace"]')?.addEventListener('click', () => {
    const state = getState();

    // Only vibrate if there's something to delete
    if (state.currentGuess.length > 0) {
      vibrateTap();
    }

    removeLetter();
    render();
  });

  // Enter button
  document.querySelector('[data-action="enter"]')?.addEventListener('click', () => {
    const state = getState();
    const word = getCurrentWord();

    // Vibrate invalid if word is incomplete
    if (state.currentGuess.length !== word.en.length) {
      vibrateInvalid();
    }

    submitGuess();
    render();
  });

  // Mobile keyboard support
  const mobileInput = document.getElementById('mobile-keyboard-input');

  if (mobileInput) {
    // Auto-focus input to open keyboard on mobile when entering play mode
    setTimeout(() => {
      mobileInput.focus();
    }, 300); // Small delay to ensure render is complete

    // Click on grid cells to open mobile keyboard
    document.querySelectorAll('[data-grid-cell]').forEach(cell => {
      cell.addEventListener('click', () => {
        mobileInput.focus();
      });
    });

    // Handle input from mobile keyboard
    let isUpdating = false;
    mobileInput.addEventListener('input', (e) => {
      if (isUpdating) return;
      isUpdating = true;

      const currentValue = e.target.value.toLowerCase();
      const state = getState();
      const word = getCurrentWord();

      // Filter out non-letter characters including spaces
      const filteredValue = currentValue.replace(/[^a-z]/g, '');

      // Build the new guess with auto-inserted spaces
      let newGuess = '';
      let letterIndex = 0;

      for (let i = 0; i < word.en.length && letterIndex < filteredValue.length; i++) {
        if (word.en[i] === ' ') {
          newGuess += ' ';
        } else {
          newGuess += filteredValue[letterIndex];
          letterIndex++;
        }
      }

      // Directly update the state (bypass addLetter/removeLetter to avoid overhead)
      const oldGuess = state.currentGuess;
      state.currentGuess = newGuess;

      // Vibrate feedback
      if (newGuess.length > oldGuess.length) {
        vibrateLetterInput();
      } else if (newGuess.length < oldGuess.length) {
        vibrateTap();
      }

      // Update the grid display without full re-render
      updateGridDisplay();

      // Keep input value synced (letters only, no spaces)
      const cleanValue = newGuess.replace(/ /g, '');
      if (e.target.value !== cleanValue) {
        e.target.value = cleanValue;
      }

      isUpdating = false;
    });

    // Handle Enter key from mobile keyboard
    mobileInput.addEventListener('keydown', (e) => {
      // Prevent backspace from propagating if input is empty (iOS fix)
      if (e.key === 'Backspace' && e.target.value === '') {
        e.preventDefault();
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        const state = getState();
        const word = getCurrentWord();

        if (state.currentGuess.length !== word.en.length) {
          vibrateInvalid();
          return;
        }

        submitGuess();
        render();

        // Clear and refocus input after render for next word
        setTimeout(() => {
          const input = document.getElementById('mobile-keyboard-input');
          if (input) {
            input.value = '';
            input.focus();
          }
        }, 100);
      }
    });

    // Keep input synced when focusing
    mobileInput.addEventListener('focus', () => {
      const state = getState();
      mobileInput.value = state.currentGuess.replace(/ /g, '');
    });
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
