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
        <button class="mode-card" data-mode="study" aria-label="Study mode - Review all words">
          <div class="mode-icon">📖</div>
          <div class="mode-name">Study Mode</div>
          <div class="mode-description">Review words before playing</div>
        </button>
        <button class="mode-card" data-mode="play" aria-label="Play mode - Guess the words">
          <div class="mode-icon">🎮</div>
          <div class="mode-name">Play Mode</div>
          <div class="mode-description">Test your knowledge</div>
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
            <span class="label">Catalan</span>
            <div class="word" lang="ca">${word.catalan}</div>
          </div>
        </div>

        <div class="study-grid-wrapper" data-action="toggle-reveal">
          <div class="grid-container">
            <div class="grid-row">
              ${Array.from({ length: word.english.length }).map((_, i) => {
                const letter = isRevealed ? word.english[i].toUpperCase() : '';
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
            <span class="label">Catalan</span>
            <div class="word" lang="ca">${word.catalan}</div>
          </div>
        </div>

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
  const wordLength = word.english.length;

  return `
    <div class="grid-container">
      ${Array.from({ length: state.maxAttempts }).map((_, rowIndex) => {
        const guess = state.guesses[rowIndex];
        const isCurrentRow = rowIndex === state.guesses.length && state.guesses.length < state.maxAttempts;

        return `
          <div class="grid-row">
            ${Array.from({ length: wordLength }).map((_, colIndex) => {
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

              return `<div class="${cellClass}">${letter}</div>`;
            }).join('')}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// Render keyboard
function renderKeyboard() {
  const state = getState();

  return `
    <div class="keyboard" role="group" aria-label="Letter keyboard">
      ${ALPHABET.map(letter => {
        return `
          <button
            class="key"
            data-letter="${letter}"
            aria-label="Letter ${letter.toUpperCase()}">
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
        <p class="result-word">The word is: <strong>${word.english}</strong></p>
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
        <p class="result-word">The word was: <strong>${word.english}</strong></p>
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
