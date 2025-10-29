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
  setCurrentGuess,
  goToStatistics,
  startPracticingFailed
} from './game.js';

import {
  getOverallStats,
  getSessions,
  getFailedWords,
  getTopicProgress
} from './storage.js';

// iOS detection
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
    case GAME_STATES.STATISTICS:
      mainContent.innerHTML = renderStatistics();
      attachStatisticsListeners();
      break;
  }
}

// Render topic selection
function renderTopicSelection() {
  const topics = getTopicsWithProgress();

  return `
    <div class="topic-selection">
      <div class="topic-header">
        <h2 class="section-title">Choose a Topic</h2>
        <button class="btn-statistics" aria-label="View statistics">
          📊 Stats
        </button>
      </div>
      <div class="topic-grid" role="list">
        ${topics.map(topic => {
          const hasProgress = topic.progress.totalAttempts > 0;
          const totalWords = topic.words.length;
          const wordsAttempted = topic.progress.totalAttempts || 0;
          const completionRate = Math.round((wordsAttempted / totalWords) * 100);
          const winRate = hasProgress
            ? Math.round((topic.progress.totalWon / topic.progress.totalAttempts) * 100)
            : 0;

          // Determine mastery level
          let masteryClass = '';
          let masteryLabel = '';
          if (completionRate === 0) {
            masteryClass = 'not-started';
            masteryLabel = 'Not Started';
          } else if (winRate < 70) {
            masteryClass = 'learning';
            masteryLabel = 'Learning';
          } else if (winRate < 90) {
            masteryClass = 'proficient';
            masteryLabel = 'Proficient';
          } else {
            masteryClass = 'mastered';
            masteryLabel = 'Mastered';
          }

          return `
          <button
            class="topic-card ${hasProgress ? 'has-progress' : ''} mastery-${masteryClass}"
            data-topic-id="${topic.id}"
            role="listitem"
            aria-label="Select topic: ${topic.name}, ${topic.words.length} words${hasProgress ? `, ${masteryLabel}, ${winRate}% success rate` : ''}">
            <div class="topic-emoji">${topic.emoji}</div>
            <div class="topic-name">${topic.name}</div>
            <div class="topic-count">${topic.words.length} words</div>
            ${hasProgress ? `
              <div class="topic-mastery ${masteryClass}">
                ${masteryLabel}
              </div>
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

  const statsButton = document.querySelector('.btn-statistics');
  if (statsButton) {
    statsButton.addEventListener('click', () => {
      goToStatistics();
      render();
    });
  }
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

        ${renderGrid()}
        ${renderKeyboard()}

        <!-- Mobile keyboard input (hidden but functional) -->
        <input
          type="text"
          id="mobile-keyboard-input"
          class="mobile-keyboard-input"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="none"
          spellcheck="false"
          inputmode="text"
          enterkeyhint="go"
          aria-hidden="true"
        />
      </div>
    </div>
  `;
}

// Render the Wordle-style grid
// Helper function to split long words into multiple rows
function splitWordIntoRows(word, charsPerRow = 10) {
  const chars = word.split('');
  const rows = [];

  let currentRow = [];
  for (let i = 0; i < chars.length; i++) {
    currentRow.push(chars[i]);

    // Break at row limit or at spaces (word boundaries)
    if (currentRow.length >= charsPerRow || i === chars.length - 1) {
      rows.push(currentRow);
      currentRow = [];
    }
  }

  return rows;
}

function renderGrid() {
  const state = getState();
  const word = getCurrentWord();
  const wordLength = word.en.length;
  const targetWord = word.en;

  // Split word into rows if longer than 10 characters
  const charsPerRow = 10;
  const wordRows = splitWordIntoRows(targetWord, charsPerRow);
  const useMultiRow = wordLength > charsPerRow;

  return `
    <div class="grid-container ${useMultiRow ? 'grid-multi-row' : ''}" data-word-length="${wordLength}" style="--word-length: ${wordLength}; --chars-per-row: ${charsPerRow};">
      ${Array.from({ length: state.maxAttempts }).map((_, attemptIndex) => {
        const guess = state.guesses[attemptIndex];
        const isCurrentRow = attemptIndex === state.guesses.length && state.guesses.length < state.maxAttempts;

        return `
          <div class="grid-attempt" data-attempt="${attemptIndex}">
            ${wordRows.map((rowChars, rowIndex) => {
              const startIdx = rowIndex * charsPerRow;

              return `
                <div class="grid-row">
                  ${rowChars.map((targetChar, colIndex) => {
                    const globalIdx = startIdx + colIndex;

                    // Check if this position is a space in the target word
                    if (targetChar === ' ') {
                      return `<div class="grid-space"></div>`;
                    }

                    let letter = '';
                    let cellClass = 'grid-cell';

                    if (guess) {
                      // Completed guess
                      letter = guess.word[globalIdx].toUpperCase();
                      cellClass += ` grid-cell-${guess.feedback[globalIdx]}`;
                    } else if (isCurrentRow && state.currentGuess[globalIdx]) {
                      // Current guess being typed
                      letter = state.currentGuess[globalIdx].toUpperCase();
                      cellClass += ' grid-cell-filled';
                    }

                    return `<div class="${cellClass}">${letter}</div>`;
                  }).join('')}
                </div>
              `;
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

  if (!word) {
    return;
  }

  // Find the current row (the one being typed)
  const currentRowIndex = state.guesses.length;
  const gridRows = document.querySelectorAll('.grid-row');

  if (!gridRows[currentRowIndex]) {
    return;
  }

  const currentRow = gridRows[currentRowIndex];

  // Get ALL children (including .grid-space divs)
  const allChildren = Array.from(currentRow.children);

  // Filter to only grid-cell elements
  const cells = allChildren.filter(child => child.classList.contains('grid-cell'));

  // Map each position in the target word to actual letters (excluding spaces)
  const targetLetters = word.en.split('').filter(char => char !== ' ');
  const guessLetters = state.currentGuess.split('').filter(char => char !== ' ');

  // Update each cell
  cells.forEach((cell, index) => {
    const letter = guessLetters[index] || '';

    if (letter) {
      const upperLetter = letter.toUpperCase();
      cell.textContent = upperLetter;
      cell.classList.add('grid-cell-filled');
    } else {
      cell.textContent = '';
      cell.classList.remove('grid-cell-filled');
    }
  });
}

// Render keyboard
function renderKeyboard() {
  const state = getState();
  const letterStates = state.letterStates || {};

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

  // Mobile keyboard support
  const mobileInput = document.getElementById('mobile-keyboard-input');

  if (mobileInput) {
    let lastProcessedValue = '';

    // Make grid cells and areas clickable to toggle keyboard
    const clickableElements = [
      ...document.querySelectorAll('[data-grid-cell]'),
      document.querySelector('.catalan-word'),
      document.querySelector('.grid-container')
    ].filter(Boolean);

    clickableElements.forEach((element) => {
      const handleToggle = (e) => {
        e.preventDefault();
        // Toggle keyboard: if input is focused, blur it; otherwise focus it
        if (document.activeElement === mobileInput) {
          mobileInput.blur();
        } else {
          mobileInput.focus();
        }
      };

      element.addEventListener('click', handleToggle);
      element.addEventListener('touchend', handleToggle);
    });

    // Handle input from mobile keyboard
    mobileInput.addEventListener('input', (e) => {
      const currentValue = e.target.value.toLowerCase();
      const state = getState();
      const word = getCurrentWord();

      // Filter out non-letter characters
      const filteredValue = currentValue.replace(/[^a-z]/g, '');
      const maxLength = word.en.replace(/ /g, '').length;
      const trimmedValue = filteredValue.substring(0, maxLength);

      // Sync the input value back to prevent extra characters
      // Keep cursor at the end to prevent iOS cursor position bugs
      if (e.target.value !== trimmedValue) {
        const cursorPos = trimmedValue.length;
        e.target.value = trimmedValue;
        // Set cursor position explicitly to avoid iOS cursor jump issues
        e.target.setSelectionRange(cursorPos, cursorPos);
      }

      // Build new guess with auto-inserted spaces
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

      // Update state and grid
      setCurrentGuess(newGuess);
      updateGridDisplay();

      lastProcessedValue = trimmedValue;
    });

    // Handle Enter key from mobile keyboard
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

        // Clear input value for next attempt
        lastProcessedValue = '';
        const input = document.getElementById('mobile-keyboard-input');
        if (input) {
          input.value = '';
          input.blur(); // Close keyboard to show result
        }
      }
    });

    // Sync input when focusing - preserve letters typed with visual keyboard
    mobileInput.addEventListener('focus', () => {
      const state = getState();
      const cleanValue = state.currentGuess.replace(/ /g, '');
      mobileInput.value = cleanValue;
      lastProcessedValue = cleanValue;
      // Set cursor at the end to prevent iOS cursor position issues
      const cursorPos = cleanValue.length;
      mobileInput.setSelectionRange(cursorPos, cursorPos);
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

  // Calculate timing
  const totalTimeMs = state.sessionEndTime - state.sessionStartTime;
  const totalTimeSec = Math.round(totalTimeMs / 1000);
  const minutes = Math.floor(totalTimeSec / 60);
  const seconds = totalTimeSec % 60;
  const timeDisplay = minutes > 0
    ? `${minutes}m ${seconds}s`
    : `${seconds}s`;

  // Calculate average attempts
  const totalAttempts = state.wordStats.reduce((sum, w) => sum + w.attempts, 0);
  const avgAttempts = total > 0 ? (totalAttempts / total).toFixed(1) : 0;

  return `
    <div class="game game-complete" role="alert" aria-live="assertive">
      <div class="result-icon">🏁</div>
      <h2 class="result-title">Topic Complete!</h2>

      <div class="score-highlight">
        <div class="score-badge">
          <div class="score-badge-value">${state.totalScore}</div>
          <div class="score-badge-label">TOTAL SCORE</div>
        </div>
      </div>

      <div class="final-score">
        <div class="stat">
          <div class="stat-value">${state.totalWon}</div>
          <div class="stat-label">Won</div>
        </div>
        <div class="stat">
          <div class="stat-value">${state.totalLost}</div>
          <div class="stat-label">Lost</div>
        </div>
        <div class="stat stat-highlight">
          <div class="stat-value">${percentage}%</div>
          <div class="stat-label">Success</div>
        </div>
      </div>

      <div class="final-score">
        <div class="stat">
          <div class="stat-value">${timeDisplay}</div>
          <div class="stat-label">Time</div>
        </div>
        <div class="stat">
          <div class="stat-value">${avgAttempts}</div>
          <div class="stat-label">Avg Attempts</div>
        </div>
        <div class="stat">
          <div class="stat-value">${state.currentStreak}</div>
          <div class="stat-label">Final Streak</div>
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

// Render statistics dashboard
function renderStatistics() {
  const overallStats = getOverallStats();
  const sessions = getSessions().slice(0, 10); // Show last 10 sessions
  const failedWords = getFailedWords();
  const topics = getTopics();

  // Calculate aggregate failed words count
  const totalFailedWords = Object.values(failedWords).reduce((sum, words) => sum + words.length, 0);

  // Format time (milliseconds to minutes and seconds)
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  // Format date
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return `
    <div class="statistics-page">
      <div class="stats-header">
        <button class="btn-back" aria-label="Back to topics">
          ← Back
        </button>
        <h2 class="section-title">📊 Statistics</h2>
      </div>

      <!-- Overall Stats Section -->
      <div class="stats-section">
        <h3 class="stats-section-title">Overall Progress</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${overallStats.totalTopics}</div>
            <div class="stat-label">Topics Played</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${overallStats.totalWords}</div>
            <div class="stat-label">Total Words</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${overallStats.totalWon}</div>
            <div class="stat-label">Words Won</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${overallStats.totalLost}</div>
            <div class="stat-label">Words Lost</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${overallStats.averageSuccessRate}%</div>
            <div class="stat-label">Success Rate</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${overallStats.totalScore.toLocaleString()}</div>
            <div class="stat-label">Total Score</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${formatTime(overallStats.totalTime)}</div>
            <div class="stat-label">Time Played</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${overallStats.totalSessions}</div>
            <div class="stat-label">Sessions</div>
          </div>
        </div>
      </div>

      <!-- Failed Words Section -->
      ${totalFailedWords > 0 ? `
        <div class="stats-section">
          <h3 class="stats-section-title">Failed Words (${totalFailedWords})</h3>
          <div class="failed-words-list">
            ${Object.entries(failedWords).map(([topicId, words]) => {
              if (words.length === 0) return '';
              const topic = topics.find(t => t.id === topicId);

              // Sort words by failed count (descending)
              const sortedWords = [...words].sort((a, b) => b.failedCount - a.failedCount);

              return `
                <div class="failed-words-topic-card">
                  <div class="failed-topic-header">
                    <span class="failed-topic-emoji">${topic ? topic.emoji : ''}</span>
                    <span class="failed-topic-name">${topic ? topic.name : topicId}</span>
                    <span class="failed-topic-count">${words.length} word${words.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div class="failed-words-table">
                    ${sortedWords.map(wordObj => `
                      <div class="failed-word-row">
                        <div class="failed-word-content">
                          <div class="failed-word-en">${wordObj.en}</div>
                          <div class="failed-word-ca">${wordObj.ca}</div>
                        </div>
                        <div class="failed-word-count">${wordObj.failedCount}</div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          <button class="btn btn-primary practice-failed-btn" data-action="practice-failed">
            🎯 Practice Failed Words
          </button>
        </div>
      ` : `
        <div class="stats-section">
          <div class="empty-state">
            <div class="empty-icon">🎉</div>
            <div class="empty-message">No failed words yet!</div>
            <div class="empty-submessage">Keep up the great work!</div>
          </div>
        </div>
      `}

      <!-- Recent Sessions Section -->
      ${sessions.length > 0 ? `
        <div class="stats-section">
          <h3 class="stats-section-title">Recent Sessions</h3>
          <div class="sessions-list">
            ${sessions.map(session => `
              <div class="session-card">
                <div class="session-header">
                  <div class="session-topic">${session.topicName}</div>
                  <div class="session-time">${formatDate(session.date)}</div>
                </div>
                <div class="session-stats">
                  <span class="session-stat">Score: ${session.score}</span>
                  <span class="session-stat">Time: ${formatTime(session.time)}</span>
                  <span class="session-stat">✓ ${session.wordsWon}</span>
                  <span class="session-stat">✗ ${session.wordsLost}</span>
                  <span class="session-stat success-rate">${session.successRate}%</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Topic Breakdown Section -->
      <div class="stats-section">
        <h3 class="stats-section-title">Topic Breakdown</h3>
        <div class="topic-breakdown">
          ${topics.map(topic => {
            const progress = getTopicProgress(topic.id);
            const hasProgress = progress.totalAttempts > 0;
            if (!hasProgress) return '';

            const successRate = Math.round((progress.totalWon / progress.totalAttempts) * 100);
            const avgTime = progress.sessions > 0 ? Math.round(progress.totalTime / progress.sessions) : 0;

            return `
              <div class="topic-breakdown-card">
                <div class="topic-breakdown-header">
                  <span class="topic-breakdown-emoji">${topic.emoji}</span>
                  <span class="topic-breakdown-name">${topic.name}</span>
                </div>
                <div class="topic-breakdown-stats">
                  <div class="breakdown-stat">
                    <span class="breakdown-label">Success Rate</span>
                    <span class="breakdown-value">${successRate}%</span>
                  </div>
                  <div class="breakdown-stat">
                    <span class="breakdown-label">Won/Lost</span>
                    <span class="breakdown-value">${progress.totalWon}/${progress.totalLost}</span>
                  </div>
                  <div class="breakdown-stat">
                    <span class="breakdown-label">Sessions</span>
                    <span class="breakdown-value">${progress.sessions}</span>
                  </div>
                  <div class="breakdown-stat">
                    <span class="breakdown-label">Total Score</span>
                    <span class="breakdown-value">${progress.totalScore.toLocaleString()}</span>
                  </div>
                  <div class="breakdown-stat">
                    <span class="breakdown-label">Avg Time</span>
                    <span class="breakdown-value">${formatTime(avgTime)}</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

function attachStatisticsListeners() {
  const backButton = document.querySelector('.btn-back');
  if (backButton) {
    backButton.addEventListener('click', () => {
      backToTopics();
      render();
    });
  }

  const practiceFailedButton = document.querySelector('[data-action="practice-failed"]');
  if (practiceFailedButton) {
    practiceFailedButton.addEventListener('click', () => {
      startPracticingFailed();
      render();
    });
  }
}
