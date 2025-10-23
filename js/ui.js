// ui.js - UI rendering functions

import {
  getState,
  getTopics,
  getCurrentWord,
  getDisplayWord,
  GAME_STATES,
  GAME_MODES,
  ALPHABET,
  selectTopic,
  selectMode,
  guessLetter,
  nextWord,
  previousWord,
  backToTopics,
  backToModeSelection,
  startPlaying,
  restartGame
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
  const topics = getTopics();

  return `
    <div class="topic-selection">
      <h2 class="section-title">Choose a Topic</h2>
      <div class="topic-grid" role="list">
        ${topics.map(topic => `
          <button
            class="topic-card"
            data-topic-id="${topic.id}"
            role="listitem"
            aria-label="Select topic: ${topic.name}, ${topic.words.length} words">
            <div class="topic-emoji">${topic.emoji}</div>
            <div class="topic-name">${topic.name}</div>
            <div class="topic-count">${topic.words.length} words</div>
          </button>
        `).join('')}
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

  return `
    <div class="study-mode">
      <div class="topic-header">
        <button class="back-button" data-action="back-to-modes" aria-label="Back to mode selection">
          ← Modes
        </button>
        <div class="current-topic">
          <span class="topic-emoji-small">${state.selectedTopic.emoji}</span>
          <span class="topic-name-small">${state.selectedTopic.name} - Study</span>
        </div>
      </div>
      <div class="study-content">
        <div class="study-progress">Word ${wordNumber} of ${totalWords}</div>
        <div class="study-card">
          <div class="study-word">
            <div class="study-language-label">Catalan</div>
            <div class="study-word-text" lang="ca">${word.catalan}</div>
          </div>
          <div class="study-divider">→</div>
          <div class="study-word">
            <div class="study-language-label">English</div>
            <div class="study-word-text" lang="en">${word.english}</div>
          </div>
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
        <div class="study-actions">
          <button class="btn btn-primary" data-action="start-playing" aria-label="Start playing">
            🎮 Start Playing
          </button>
        </div>
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
}

// Render play mode
function renderPlayMode() {
  const state = getState();
  const word = getCurrentWord();
  const displayWord = getDisplayWord();

  return `
    <div>
      <div class="topic-header">
        <button class="back-button" data-action="back-to-modes" aria-label="Back to mode selection">
          ← Modes
        </button>
        <div class="current-topic">
          <span class="topic-emoji-small">${state.selectedTopic.emoji}</span>
          <span class="topic-name-small">${state.selectedTopic.name}</span>
        </div>
      </div>

      <div class="score" role="status" aria-live="polite">
        <div class="score-item">
          <span class="score-label">Won</span>
          <span class="score-value" aria-label="Words won">${state.totalWon}</span>
        </div>
        <div class="score-item">
          <span class="score-label">Lost</span>
          <span class="score-value" aria-label="Words lost">${state.totalLost}</span>
        </div>
      </div>

      <div class="game" aria-labelledby="game-title">
        <div class="word-section">
          <div class="catalan-word">
            <span class="label">Catalan</span>
            <div class="word" lang="ca">${word.catalan}</div>
          </div>
          <div class="english-word">
            <span class="label">English</span>
            <div class="word display-word" lang="en" aria-label="Word to guess: ${word.english.length} letters">
              ${displayWord}
            </div>
          </div>
        </div>

        ${renderAttempts()}
        ${renderKeyboard()}
        ${renderGuessed()}
      </div>
    </div>
  `;
}

function renderAttempts() {
  const state = getState();
  const hearts = Array.from({ length: state.maxAttempts }, (_, i) =>
    i < state.attemptsLeft ? '❤️' : '🖤'
  ).join('');

  return `
    <div class="attempts" role="status" aria-live="polite" aria-label="Attempts remaining: ${state.attemptsLeft}">
      <div class="hearts">${hearts}</div>
      <div class="attempts-text">${state.attemptsLeft} attempts left</div>
    </div>
  `;
}

function renderKeyboard() {
  const state = getState();
  const word = getCurrentWord();

  return `
    <div class="keyboard" role="group" aria-label="Letter keyboard">
      ${ALPHABET.map(letter => {
        const isGuessed = state.guessedLetters.includes(letter);
        const isCorrect = isGuessed && word.english.toLowerCase().includes(letter);
        const isWrong = isGuessed && !word.english.toLowerCase().includes(letter);

        let keyClass = 'key';
        if (isCorrect) keyClass += ' key-correct';
        if (isWrong) keyClass += ' key-wrong';

        let ariaLabel = `Letter ${letter.toUpperCase()}`;
        if (isCorrect) ariaLabel += ' - correct';
        if (isWrong) ariaLabel += ' - incorrect';

        return `
          <button
            class="${keyClass}"
            data-letter="${letter}"
            ${isGuessed ? 'disabled' : ''}
            aria-label="${ariaLabel}"
            aria-pressed="${isGuessed}">
            ${letter.toUpperCase()}
          </button>
        `;
      }).join('')}
    </div>
  `;
}

function renderGuessed() {
  const state = getState();
  const guessedText = state.guessedLetters.length === 0
    ? 'No letters guessed yet'
    : state.guessedLetters.reverse().join(', ');

  return `
    <div class="guessed" role="status" aria-live="polite">
      <span class="label">Guessed: </span>
      <span>${guessedText}</span>
    </div>
  `;
}

function attachPlayModeListeners() {
  document.querySelector('[data-action="back-to-modes"]')?.addEventListener('click', () => {
    backToModeSelection();
    render();
  });

  document.querySelectorAll('[data-letter]').forEach(button => {
    button.addEventListener('click', (e) => {
      const letter = e.currentTarget.dataset.letter;
      guessLetter(letter);
      render();
    });
  });
}

// Render won screen
function renderWonScreen() {
  const word = getCurrentWord();
  const state = getState();
  const hasMore = state.currentWordIndex + 1 < state.selectedTopic.words.length;

  return `
    <div>
      <div class="topic-header">
        <button class="back-button" data-action="back-to-modes" aria-label="Back to mode selection">
          ← Modes
        </button>
        <div class="current-topic">
          <span class="topic-emoji-small">${state.selectedTopic.emoji}</span>
          <span class="topic-name-small">${state.selectedTopic.name}</span>
        </div>
      </div>

      <div class="score" role="status" aria-live="polite">
        <div class="score-item">
          <span class="score-label">Won</span>
          <span class="score-value">${state.totalWon}</span>
        </div>
        <div class="score-item">
          <span class="score-label">Lost</span>
          <span class="score-value">${state.totalLost}</span>
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

  return `
    <div>
      <div class="topic-header">
        <button class="back-button" data-action="back-to-modes" aria-label="Back to mode selection">
          ← Modes
        </button>
        <div class="current-topic">
          <span class="topic-emoji-small">${state.selectedTopic.emoji}</span>
          <span class="topic-name-small">${state.selectedTopic.name}</span>
        </div>
      </div>

      <div class="score" role="status" aria-live="polite">
        <div class="score-item">
          <span class="score-label">Won</span>
          <span class="score-value">${state.totalWon}</span>
        </div>
        <div class="score-item">
          <span class="score-label">Lost</span>
          <span class="score-value">${state.totalLost}</span>
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
