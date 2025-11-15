// ui.js - Simplified UI rendering

import {
  getState,
  getTopics,
  getTopicsWithProgress,
  getCurrentWord,
  GAME_STATES,
  GAME_MODES,
  selectTopic,
  selectMode,
  setUserInput,
  submitAnswer,
  toggleWordReveal,
  nextWord,
  backToTopics,
  backToModeSelection,
  goToStatistics,
  startPracticingFailed
} from './game.js';

import {
  getOverallStats,
  getSessions,
  getFailedWords,
  getTopicProgress,
  getTopScores,
  updateSessionName,
  updateSessionSyncStatus,
  getPendingSubmissions,
  getPlayerName,
  getPlayerId,
  clearQueuedSubmission
} from './storage.js';

import {
  fetchGlobalLeaderboard,
  submitGlobalScore
} from './leaderboard-api.js';

import {
  submitToGlobal,
  queueForLater,
  syncPendingScores,
  isOnline,
  setupAutoSync
} from './sync.js';

// Leaderboard display state
let leaderboardState = {
  viewMode: 'local', // 'local' or 'global'
  globalScores: null,
  loading: false,
  error: null
};

// Track last game state to detect transitions
let lastGameState = null;

// Removed global submission modal - now using inline sync buttons in leaderboard

// Load global leaderboard from API
async function loadGlobalLeaderboard(topicId) {
  leaderboardState.loading = true;
  leaderboardState.error = null;
  render();

  try {
    const scores = await fetchGlobalLeaderboard(topicId);
    if (scores) {
      leaderboardState.globalScores = scores;
      leaderboardState.error = null;
    } else {
      leaderboardState.error = 'Could not connect to server. Showing local scores.';
    }
  } catch (error) {
    leaderboardState.error = error.message || 'Failed to load global leaderboard';
    console.error('Error loading global leaderboard:', error);
  } finally {
    leaderboardState.loading = false;
    render();
  }
}

// Main render function
export function render() {
  const mainContent = document.getElementById('main-content');
  const state = getState();

  // Reset to local view when first entering COMPLETE state
  if (state.gameState === GAME_STATES.COMPLETE && lastGameState !== GAME_STATES.COMPLETE) {
    leaderboardState.viewMode = 'local';
  }

  // Update last game state
  lastGameState = state.gameState;

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
    case GAME_STATES.RESULT:
      mainContent.innerHTML = renderPlayMode();
      attachPlayModeListeners();
      break;
    case GAME_STATES.COMPLETE:
      mainContent.innerHTML = renderCompleteScreen();
      attachCompleteListeners();
      break;
    case GAME_STATES.STATISTICS:
      mainContent.innerHTML = renderStatistics();
      attachStatisticsListeners();
      break;
    default:
      mainContent.innerHTML = '<p>Unknown state</p>';
  }
}

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
function renderModeSelection() {
  const state = getState();
  const topScores = getTopScores(state.selectedTopic.id);

  return `
    <div class="mode-selection">
      <div class="mode-back-header">
        <button class="back-button" data-action="back-to-topics" aria-label="Back to topic selection">
          ← Topics
        </button>
        ${topScores.length > 0 ? `
          <button class="btn-leaderboard-header" data-action="view-leaderboard" aria-label="View leaderboard">
            🏆 Leaderboard
          </button>
        ` : ''}
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

  document.querySelector('[data-action="view-leaderboard"]')?.addEventListener('click', () => {
    showLeaderboardView();
  });
}

// Show standalone leaderboard view
function showLeaderboardView() {
  const mainContent = document.getElementById('main-content');
  const state = getState();

  mainContent.innerHTML = renderStandaloneLeaderboard();
  attachStandaloneLeaderboardListeners();
}

function renderStandaloneLeaderboard() {
  const state = getState();
  const topScores = getTopScores(state.selectedTopic.id);

  return `
    <div class="game game-complete">
      <div class="leaderboard-section">
        <div class="leaderboard-header">
          <h3 class="leaderboard-title">🏆 TOP 10 SCORES</h3>
          <div class="leaderboard-toggle">
            <button
              class="toggle-btn ${leaderboardState.viewMode === 'local' ? 'active' : ''}"
              data-action="toggle-leaderboard"
              data-mode="local"
            >Just Me</button>
            <button
              class="toggle-btn ${leaderboardState.viewMode === 'global' ? 'active' : ''}"
              data-action="toggle-leaderboard"
              data-mode="global"
            >All Players</button>
          </div>
        </div>

        ${leaderboardState.loading ? `
          <div class="leaderboard-loading">
            <p>Loading all players...</p>
          </div>
        ` : leaderboardState.error && leaderboardState.viewMode === 'global' ? `
          <div class="leaderboard-error">
            <p>⚠️ Unable to load all players</p>
            <p class="error-detail">${leaderboardState.error}</p>
            <button class="btn btn-secondary" data-action="retry-global">Retry</button>
          </div>
        ` : ''}

        ${renderLeaderboardScores(state.selectedTopic.id)}
      </div>

      <div class="complete-buttons">
        <button class="btn btn-secondary" data-action="back-to-modes" aria-label="Back to mode selection">
          ← Back
        </button>
      </div>
    </div>
  `;
}

function renderLeaderboardScores(topicId) {
  const topScores = getTopScores(topicId);
  const displayScores = leaderboardState.viewMode === 'global' && leaderboardState.globalScores
    ? leaderboardState.globalScores
    : topScores;

  if (leaderboardState.loading || (leaderboardState.error && leaderboardState.viewMode === 'global')) {
    return '';
  }

  if (displayScores.length === 0) {
    return `
      <div class="leaderboard-empty">
        <p>No scores yet. Be the first to play!</p>
      </div>
    `;
  }

  const formatTime = (ms) => {
    const secs = Math.floor(ms / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
  };

  return `
    <div class="leaderboard-grid">
      ${displayScores.map((score, index) => {
        return `
          <div class="leaderboard-row">
            <span class="leaderboard-rank">#${index + 1}</span>
            <span class="leaderboard-name">${score.playerName || '—'}</span>
            <span class="leaderboard-score">${score.score}</span>
            <span class="leaderboard-time">${formatTime(score.time)}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function attachStandaloneLeaderboardListeners() {
  document.querySelector('[data-action="back-to-modes"]')?.addEventListener('click', () => {
    render();
  });

  // Toggle between global and local leaderboard
  document.querySelectorAll('[data-action="toggle-leaderboard"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const mode = e.currentTarget.dataset.mode;
      leaderboardState.viewMode = mode;

      // Fetch global leaderboard if switching to global and not loaded yet
      if (mode === 'global' && !leaderboardState.globalScores && !leaderboardState.loading) {
        const state = getState();
        await loadGlobalLeaderboard(state.selectedTopic.id);
      }

      showLeaderboardView();
    });
  });

  // Retry loading global leaderboard
  document.querySelector('[data-action="retry-global"]')?.addEventListener('click', async () => {
    const state = getState();
    await loadGlobalLeaderboard(state.selectedTopic.id);
  });
}

// NEW: Simplified Study Mode - Flashcard style (pure passive review)
function renderStudyMode() {
  const state = getState();
  const word = getCurrentWord();
  const progress = `${state.currentWordIndex + 1}/${state.selectedTopic.words.length}`;

  return `
    <div class="game study-mode">
      <div class="game-header">
        <button class="back-button" data-action="back-to-topics">← Topics</button>
        <div class="progress-indicator">${progress}</div>
      </div>

      <div class="flashcard-container">
        <div class="flashcard ${state.isWordRevealed ? 'revealed' : ''}" data-action="flashcard-tap">
          <div class="flashcard-word">${word.ca}</div>
          <div class="flashcard-translation">
            ${state.isWordRevealed
              ? `<span class="flashcard-word-en">${word.en}</span>`
              : `<span class="flashcard-placeholder">${'_ '.repeat(word.en.length).trim()}</span>`
            }
          </div>
          <div class="flashcard-hint">
            ${state.isWordRevealed ? 'Press Space or tap to continue' : 'Press Space or tap to reveal'}
          </div>
        </div>
      </div>
    </div>
  `;
}

function attachStudyModeListeners() {
  const state = getState();

  document.querySelector('[data-action="back-to-topics"]')?.addEventListener('click', () => {
    backToTopics();
    render();
  });

  document.querySelector('[data-action="flashcard-tap"]')?.addEventListener('click', () => {
    if (!state.isWordRevealed) {
      // First tap: reveal the word
      toggleWordReveal();
      render();
    } else {
      // Second tap: go to next word
      nextWord();
      render();
    }
  });
}

// NEW: Simplified Play Mode - Type the translation
function renderPlayMode() {
  const state = getState();
  const word = getCurrentWord();
  const progress = `${state.currentWordIndex + 1}/${state.selectedTopic.words.length}`;
  const showingFeedback = state.gameState === GAME_STATES.RESULT;

  return `
    <div class="game play-mode ${showingFeedback ? (state.isCorrect ? 'feedback-correct' : 'feedback-wrong') : ''}">
      <div class="game-header">
        <button class="back-button" data-action="back-to-topics">← Topics</button>
        <div class="game-stats">
          <span class="stat-item">${progress}</span>
          <span class="stat-item">Score: ${state.totalScore}</span>
          <span class="stat-item">Streak: ${state.currentStreak}🔥</span>
        </div>
      </div>

      <div class="play-container">
        ${showingFeedback ? `
          <!-- Inline Feedback -->
          <div class="inline-feedback ${state.isCorrect ? 'correct' : 'incorrect'}" data-action="feedback-continue">
            <div class="feedback-icon">${state.isCorrect ? '✓' : '✗'}</div>
            <div class="feedback-word-pair">
              <div class="feedback-catalan">${word.ca}</div>
              <div class="feedback-english">${word.en}</div>
            </div>
            ${!state.isCorrect ? `
              <div class="feedback-your-answer">
                Your answer: <strong>${state.userInput}</strong>
              </div>
            ` : ''}
            <div class="feedback-hint">Press Space or tap to continue</div>
          </div>
        ` : `
          <!-- Answer Input -->
          <div class="word-prompt">
            <div class="prompt-word">${word.ca}</div>
          </div>

          <div class="answer-input-container">
            <input
              type="text"
              id="answer-input"
              class="answer-input"
              placeholder="Type your answer..."
              value="${state.userInput}"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
            />
          </div>

          <button class="btn btn-primary btn-submit" data-action="submit-answer">
            Submit
          </button>
        `}
      </div>
    </div>
  `;
}

function attachPlayModeListeners() {
  const state = getState();

  document.querySelector('[data-action="back-to-topics"]')?.addEventListener('click', () => {
    backToTopics();
    render();
  });

  // Tap to continue when showing feedback
  if (state.gameState === GAME_STATES.RESULT) {
    document.querySelector('[data-action="feedback-continue"]')?.addEventListener('click', () => {
      nextWord();
      render();
    });
    return; // Don't attach input listeners when showing feedback
  }

  // Input handling (only when not showing feedback)
  const input = document.getElementById('answer-input');
  if (input) {
    input.focus();

    input.addEventListener('input', (e) => {
      setUserInput(e.target.value);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitAnswer();
        render();
      }
    });
  }

  document.querySelector('[data-action="submit-answer"]')?.addEventListener('click', () => {
    submitAnswer();
    render();
  });
}

// Complete Screen and Statistics from original
function renderCompleteScreen() {
  const state = getState();
  const total = state.totalWon + state.totalLost;
  const percentage = total > 0 ? Math.round((state.totalWon / total) * 100) : 0;
  const isPlayMode = state.gameMode === GAME_MODES.PLAY || state.gameMode === GAME_MODES.PRACTICE_FAILED;

  // Calculate timing
  const totalTimeMs = state.sessionEndTime - state.sessionStartTime;
  const totalTimeSec = Math.round(totalTimeMs / 1000);
  const minutes = Math.floor(totalTimeSec / 60);
  const seconds = totalTimeSec % 60;
  const timeDisplay = minutes > 0
    ? `${minutes}m ${seconds}s`
    : `${seconds}s`;

  // Get top 10 scores (only for play mode)
  let topScores = [];
  let currentScoreRank = 0;
  let actualRank = 0;

  if (isPlayMode) {
    topScores = getTopScores(state.selectedTopic.id);
    currentScoreRank = topScores.findIndex(s =>
      s.score === state.totalScore &&
      Math.abs(new Date(s.date) - new Date()) < 5000
    ) + 1;

    // Find actual rank if not in top 10
    actualRank = currentScoreRank;
    if (currentScoreRank === 0) {
      // User not in top 10, calculate actual rank
      const allSessions = getSessions();
      const topicSessions = allSessions.filter(s => s.topicId === state.selectedTopic.id);
      const sorted = topicSessions.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.time - b.time;
      });
      actualRank = sorted.findIndex(s =>
        s.score === state.totalScore &&
        Math.abs(new Date(s.date) - new Date()) < 5000
      ) + 1;
    }
  }

  // Determine which scores to display
  const displayScores = leaderboardState.viewMode === 'global' && leaderboardState.globalScores
    ? leaderboardState.globalScores
    : topScores;

  return `
    <div class="game game-complete" role="alert" aria-live="assertive">
      <!-- Top 10 Leaderboard (Play mode only) -->
      ${isPlayMode ? `
        <div class="leaderboard-section">
          <div class="leaderboard-header">
            <h3 class="leaderboard-title">🏆 TOP 10 SCORES</h3>
            <div class="leaderboard-actions">
              <div class="leaderboard-toggle">
                <button
                  class="toggle-btn ${leaderboardState.viewMode === 'local' ? 'active' : ''}"
                  data-action="toggle-leaderboard"
                  data-mode="local"
                >Just Me</button>
                <button
                  class="toggle-btn ${leaderboardState.viewMode === 'global' ? 'active' : ''}"
                  data-action="toggle-leaderboard"
                  data-mode="global"
                >All Players</button>
              </div>
              ${leaderboardState.viewMode === 'local' ? `
                <button class="btn-sync-all" data-action="sync-all-scores" title="Share your best score with all players">
                  🌍 Share with All
                </button>
              ` : ''}
            </div>
          </div>

          ${leaderboardState.viewMode === 'local' ? `
            <!-- Check if best score is not shared -->
            ${(() => {
              const currentPlayerId = getPlayerId();
              const playerScores = topScores.filter(s =>
                s.playerId === currentPlayerId &&
                s.playerName
              );
              // Only show banner if best score (first one) is NOT synced
              if (playerScores.length > 0) {
                const bestScore = playerScores[0];
                const isBestScoreShared = bestScore.globalSyncStatus === 'synced';

                if (!isBestScoreShared) {
                  return `
                    <div class="sync-notice">
                      <span class="sync-notice-icon">🌍</span>
                      <span class="sync-notice-text">Share your score with all players</span>
                    </div>
                  `;
                }
              }
              return '';
            })()}
          ` : ''}

          ${leaderboardState.viewMode === 'global' && leaderboardState.globalScores ? `
            <!-- Last sync info -->
            <div class="sync-info">
              <small>📡 Loaded from server</small>
            </div>
          ` : ''}

          ${leaderboardState.loading ? `
            <div class="leaderboard-loading">
              <p>Loading all players...</p>
            </div>
          ` : leaderboardState.error && leaderboardState.viewMode === 'global' ? `
            <div class="leaderboard-error">
              <p>⚠️ Unable to load all players</p>
              <p class="error-detail">${leaderboardState.error}</p>
              <button class="btn btn-secondary" data-action="retry-global">Retry</button>
            </div>
          ` : displayScores.length > 0 ? `
          <div class="leaderboard-grid">
            ${displayScores.map((score, index) => {
              const isCurrentScore = score.score === state.totalScore &&
                                     Math.abs(new Date(score.date) - new Date()) < 5000;
              const formatTime = (ms) => {
                const secs = Math.floor(ms / 1000);
                const m = Math.floor(secs / 60);
                const s = secs % 60;
                return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
              };

              const playerName = score.playerName || '';
              const needsNameEntry = isCurrentScore && !playerName;

              // Check if this score belongs to the current player
              const currentPlayerId = getPlayerId();
              const isPlayerScore = score.playerId && score.playerId === currentPlayerId;
              const isShared = score.globalSyncStatus === 'synced';

              // If needs name entry, show only the input (no rank/score)
              if (needsNameEntry) {
                return `
                  <div class="leaderboard-row name-entry-only">
                    <input
                      type="text"
                      class="name-input-fullwidth"
                      maxlength="8"
                      placeholder="ENTER YOUR NAME"
                      data-session-id="${score.id}"
                      autocomplete="off"
                      autocapitalize="characters"
                      spellcheck="false"
                    />
                  </div>
                `;
              }

              // Normal row with rank, name, and score
              // Highlight if it's the current player's score OR the just-submitted score
              const highlightClass = (isPlayerScore || isCurrentScore) ? 'current-rank' : '';

              return `
                <div class="leaderboard-row ${highlightClass}">
                  <div class="rank-number">
                    ${index + 1}
                  </div>
                  <div class="player-name">
                    ${playerName || '---'}
                    ${isShared && leaderboardState.viewMode === 'local' ? '<span class="shared-badge" title="Shared with all players">🌍</span>' : ''}
                  </div>
                  <div class="score-info">
                    <div class="score-value">${score.score.toLocaleString()}</div>
                    <div class="score-meta">
                      <span>${score.successRate}%</span>
                      <span>${formatTime(score.time)}</span>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          ${leaderboardState.viewMode === 'local' ? (() => {
            // Check if best score is NOT shared but a lower score IS shared
            const currentPlayerId = getPlayerId();
            const playerScores = displayScores.filter(s => s.playerId === currentPlayerId);

            if (playerScores.length > 0) {
              const bestScore = playerScores[0]; // First score is the best
              const hasSharedScore = playerScores.some(s => s.globalSyncStatus === 'synced');
              const bestScoreShared = bestScore.globalSyncStatus === 'synced';

              // If we have a shared score but it's NOT the best score
              if (hasSharedScore && !bestScoreShared && bestScore.playerName) {
                return `
                  <div class="better-score-notice">
                    <span class="notice-icon">⭐</span>
                    <span class="notice-text">You have a better score! Click "Share with All" to update.</span>
                  </div>
                `;
              }
            }
            return '';
          })() : ''}

          ${currentScoreRank === 0 && actualRank > 0 && leaderboardState.viewMode === 'local' ? `
            <!-- User's rank outside top 10 -->
            <div class="rank-separator">...</div>
            <div class="leaderboard-row current-rank user-rank-outside">
              <div class="rank-number">${actualRank}</div>
              <div class="score-value">${state.totalScore.toLocaleString()}</div>
              <div class="score-meta">
                <span>${percentage}%</span>
                <span>${timeDisplay}</span>
              </div>
            </div>
          ` : ''}
          ` : `
            <div class="leaderboard-empty">
              <p>No scores yet. Be the first!</p>
            </div>
          `}
        </div>
      ` : ''}

      <!-- Session Details -->
      ${isPlayMode ? `
        <div class="game-details-section">
          <button class="details-toggle" data-action="toggle-details" aria-expanded="false">
            <span class="toggle-icon">▶</span>
            <span>View Session Details</span>
          </button>
          <div class="game-details-content hidden">
            <div class="details-stats">
              <div class="detail-row">
                <span class="detail-label">Won</span>
                <span class="detail-value">${state.totalWon}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Lost</span>
                <span class="detail-value">${state.totalLost}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Success Rate</span>
                <span class="detail-value">${percentage}%</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time</span>
                <span class="detail-value">${timeDisplay}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Final Streak</span>
                <span class="detail-value">${state.currentStreak}</span>
              </div>
            </div>
          </div>
        </div>
      ` : `
        <!-- Study Mode Complete -->
        <div class="study-complete-message">
          <p class="study-complete-text">You reviewed <strong>${state.selectedTopic.words.length} words</strong> in ${timeDisplay}</p>
          <p class="study-complete-hint">Ready to test yourself?</p>
        </div>
      `}

      <div class="complete-buttons">
        <button class="btn btn-secondary" data-action="back-to-topics" aria-label="Choose another topic">
          ← Topics
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

  // Toggle between global and local leaderboard
  document.querySelectorAll('[data-action="toggle-leaderboard"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const mode = e.currentTarget.dataset.mode;
      leaderboardState.viewMode = mode;

      // Always fetch fresh global leaderboard when switching to global
      if (mode === 'global' && !leaderboardState.loading) {
        const state = getState();
        await loadGlobalLeaderboard(state.selectedTopic.id);
      }

      render();
    });
  });

  // Retry loading global leaderboard
  document.querySelector('[data-action="retry-global"]')?.addEventListener('click', async () => {
    const state = getState();
    await loadGlobalLeaderboard(state.selectedTopic.id);
  });

  // Toggle game details section
  document.querySelector('[data-action="toggle-details"]')?.addEventListener('click', (e) => {
    const content = document.querySelector('.game-details-content');
    const icon = document.querySelector('.toggle-icon');
    const isExpanded = e.currentTarget.getAttribute('aria-expanded') === 'true';

    content.classList.toggle('hidden');
    icon.textContent = isExpanded ? '▶' : '▼';
    e.currentTarget.setAttribute('aria-expanded', !isExpanded);
  });

  // Handle sync all scores button (now only shares best score)
  document.querySelector('[data-action="sync-all-scores"]')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const state = getState();

    if (!state.selectedTopic) return;

    // Get all sessions for this topic that need syncing
    const allSessions = getSessions();
    const topicSessions = allSessions.filter(s =>
      s.topicId === state.selectedTopic.id &&
      s.playerName &&
      (!s.globalSyncStatus || s.globalSyncStatus === 'none' || s.globalSyncStatus === 'failed')
    );

    if (topicSessions.length === 0) {
      btn.textContent = '✓ Already shared';
      setTimeout(() => {
        btn.textContent = '🌍 Share with All';
      }, 2000);
      return;
    }

    // Find the best score (highest score, then lowest time as tiebreaker)
    const bestSession = topicSessions.reduce((best, current) => {
      if (!best) return current;
      if (current.score > best.score) return current;
      if (current.score === best.score && current.time < best.time) return current;
      return best;
    }, null);

    // Disable button and show progress
    btn.disabled = true;
    btn.textContent = `⏳ Sharing...`;

    try {
      const result = await submitToGlobal(bestSession, bestSession.playerName);

      // Re-enable button and show result
      btn.disabled = false;
      if (result.success) {
        btn.textContent = `✓ Shared`;
      } else {
        btn.textContent = `❌ Failed`;
      }
    } catch (error) {
      console.error('Error syncing score:', error);
      btn.disabled = false;
      btn.textContent = `❌ Failed`;
    }

    // Refresh the leaderboard
    render();

    // Reset button text after delay
    setTimeout(() => {
      const newBtn = document.querySelector('[data-action="sync-all-scores"]');
      if (newBtn) {
        newBtn.textContent = '🌍 Share with All';
      }
    }, 3000);
  });

  // Scroll to current rank position
  const currentRankRow = document.querySelector('.leaderboard-row.current-rank');
  if (currentRankRow) {
    // Small delay to ensure DOM is fully rendered
    setTimeout(() => {
      currentRankRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }

  // Handle full-width name entry for top 10
  const nameInputFullwidth = document.querySelector('.name-input-fullwidth');
  if (nameInputFullwidth) {
    const sessionId = nameInputFullwidth.dataset.sessionId;

    // Save name on blur or Enter
    const saveName = () => {
      const name = nameInputFullwidth.value.toUpperCase().trim();
      if (name.length > 0 && sessionId) {
        updateSessionName(sessionId, name);
        render();
      }
    };

    nameInputFullwidth.addEventListener('blur', saveName);
    nameInputFullwidth.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        nameInputFullwidth.blur();
      }
    });

    // Auto-uppercase as they type
    nameInputFullwidth.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase();
    });

    // Auto-focus the input
    setTimeout(() => {
      nameInputFullwidth.focus();
      nameInputFullwidth.select();
    }, 300);
  }

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

// Global Submission Modal Functions
// Modal functions removed - now using inline sync UI in leaderboard

// Initialize auto-sync on app load
export function initializeSync() {
  setupAutoSync((result) => {
    if (result.synced > 0) {
      console.log(`✓ Synced ${result.synced} pending score(s)`);
      // Optionally show a notification to the user
    }
  });

  // Try to sync on page load if online
  if (isOnline()) {
    syncPendingScores();
  }
}
