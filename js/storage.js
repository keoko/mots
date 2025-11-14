// storage.js - Local storage utilities for local-first persistence

const STORAGE_KEY = 'mots_progress';
const FAILED_WORDS_KEY = 'mots_failed_words';
const SESSIONS_KEY = 'mots_sessions';

// Get all progress data
export function getProgress() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error loading progress:', error);
    return {};
  }
}

// Save progress for a specific topic (enhanced with detailed stats)
export function saveTopicProgress(topicId, stats) {
  try {
    const progress = getProgress();
    const existing = progress[topicId] || {
      totalWon: 0,
      totalLost: 0,
      totalAttempts: 0,
      totalScore: 0,
      totalTime: 0,
      sessions: 0,
      wordStats: {},
      firstPlayed: new Date().toISOString()
    };

    progress[topicId] = {
      ...existing,
      totalWon: (existing.totalWon || 0) + (stats.totalWon || 0),
      totalLost: (existing.totalLost || 0) + (stats.totalLost || 0),
      totalAttempts: (existing.totalAttempts || 0) + (stats.totalWon || 0) + (stats.totalLost || 0),
      totalScore: (existing.totalScore || 0) + (stats.totalScore || 0),
      totalTime: (existing.totalTime || 0) + (stats.totalTime || 0),
      sessions: (existing.sessions || 0) + 1,
      lastPlayed: new Date().toISOString(),
      // Merge word stats
      wordStats: mergeWordStats(existing.wordStats || {}, stats.wordStats || {})
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving progress:', error);
  }
}

// Merge word-level statistics
function mergeWordStats(existing, newStats) {
  const merged = { ...existing };

  for (const [word, stats] of Object.entries(newStats)) {
    if (!merged[word]) {
      merged[word] = { ...stats, firstAttempt: new Date().toISOString() };
    } else {
      merged[word] = {
        ...merged[word],
        attempts: (merged[word].attempts || 0) + (stats.attempts || 0),
        won: (merged[word].won || 0) + (stats.won ? 1 : 0),
        lost: (merged[word].lost || 0) + (stats.won ? 0 : 1),
        totalTime: (merged[word].totalTime || 0) + (stats.timeMs || 0),
        bestTime: Math.min(merged[word].bestTime || Infinity, stats.timeMs || Infinity),
        lastAttempt: new Date().toISOString()
      };
    }
  }

  return merged;
}

// Get progress for a specific topic
export function getTopicProgress(topicId) {
  const progress = getProgress();
  return progress[topicId] || {
    totalWon: 0,
    totalLost: 0,
    totalAttempts: 0,
    totalScore: 0,
    totalTime: 0,
    sessions: 0,
    wordStats: {},
    lastPlayed: null,
    firstPlayed: null
  };
}

// Save failed words list
export function saveFailedWords(topicId, words) {
  try {
    const failedWords = getFailedWords();
    if (!failedWords[topicId]) {
      failedWords[topicId] = [];
    }

    // Add new failed words, avoiding duplicates
    words.forEach(wordObj => {
      const exists = failedWords[topicId].find(w => w.en === wordObj.en);
      if (!exists) {
        failedWords[topicId].push({
          ...wordObj,
          failedCount: 1,
          firstFailed: new Date().toISOString(),
          lastFailed: new Date().toISOString()
        });
      } else {
        exists.failedCount = (exists.failedCount || 1) + 1;
        exists.lastFailed = new Date().toISOString();
      }
    });

    localStorage.setItem(FAILED_WORDS_KEY, JSON.stringify(failedWords));
  } catch (error) {
    console.error('Error saving failed words:', error);
  }
}

// Get all failed words
export function getFailedWords() {
  try {
    const data = localStorage.getItem(FAILED_WORDS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error loading failed words:', error);
    return {};
  }
}

// Get failed words for a specific topic
export function getTopicFailedWords(topicId) {
  const failedWords = getFailedWords();
  return failedWords[topicId] || [];
}

// Remove a word from failed list (e.g., after successful review)
export function removeFailedWord(topicId, word) {
  try {
    const failedWords = getFailedWords();
    if (failedWords[topicId]) {
      failedWords[topicId] = failedWords[topicId].filter(w => w.en !== word);
      localStorage.setItem(FAILED_WORDS_KEY, JSON.stringify(failedWords));
    }
  } catch (error) {
    console.error('Error removing failed word:', error);
  }
}

// Save session history
export function saveSession(sessionData) {
  try {
    const sessions = getSessions();
    const newSession = {
      ...sessionData,
      id: Date.now().toString(),
      date: new Date().toISOString()
    };
    sessions.unshift(newSession);

    // Keep only last 100 sessions
    const trimmed = sessions.slice(0, 100);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(trimmed));

    // Return the newly created session
    return newSession;
  } catch (error) {
    console.error('Error saving session:', error);
    return null;
  }
}

// Get all sessions
export function getSessions() {
  try {
    const data = localStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading sessions:', error);
    return [];
  }
}

// Get top 10 scores for a specific topic
export function getTopScores(topicId) {
  try {
    const sessions = getSessions();

    // Filter by topic
    const topicSessions = sessions.filter(s => s.topicId === topicId);

    // Sort by score (descending), then by time (ascending for tie-breaker)
    const sorted = topicSessions.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.time - b.time; // Faster time wins on tie
    });

    // Return top 10
    return sorted.slice(0, 10);
  } catch (error) {
    console.error('Error getting top scores:', error);
    return [];
  }
}

// Get overall statistics across all topics
export function getOverallStats() {
  const progress = getProgress();
  const stats = {
    totalTopics: 0,
    totalWords: 0,
    totalWon: 0,
    totalLost: 0,
    totalScore: 0,
    totalTime: 0,
    totalSessions: 0,
    averageSuccessRate: 0
  };

  Object.values(progress).forEach(topicProgress => {
    stats.totalTopics++;
    stats.totalWords += (topicProgress.totalWon || 0) + (topicProgress.totalLost || 0);
    stats.totalWon += topicProgress.totalWon || 0;
    stats.totalLost += topicProgress.totalLost || 0;
    stats.totalScore += topicProgress.totalScore || 0;
    stats.totalTime += topicProgress.totalTime || 0;
    stats.totalSessions += topicProgress.sessions || 0;
  });

  if (stats.totalWords > 0) {
    stats.averageSuccessRate = Math.round((stats.totalWon / stats.totalWords) * 100);
  }

  return stats;
}

// Clear all progress (for testing or reset)
export function clearProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(FAILED_WORDS_KEY);
    localStorage.removeItem(SESSIONS_KEY);
  } catch (error) {
    console.error('Error clearing progress:', error);
  }
}

// Export all data (for backup or sync)
export function exportData() {
  return {
    progress: getProgress(),
    failedWords: getFailedWords(),
    sessions: getSessions()
  };
}

// Import data (from backup or sync)
export function importData(data) {
  try {
    if (data.progress) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.progress));
    }
    if (data.failedWords) {
      localStorage.setItem(FAILED_WORDS_KEY, JSON.stringify(data.failedWords));
    }
    if (data.sessions) {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(data.sessions));
    }
  } catch (error) {
    console.error('Error importing data:', error);
  }
}

// Update session with player name
export function updateSessionName(sessionId, playerName) {
  try {
    const sessions = getSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex !== -1) {
      sessions[sessionIndex].playerName = playerName.toUpperCase().trim();
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating session name:', error);
    return false;
  }
}

// Update global sync status for a session
// status: 'none' | 'pending' | 'synced' | 'failed'
export function updateSessionSyncStatus(sessionId, status, options = {}) {
  try {
    const sessions = getSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex !== -1) {
      sessions[sessionIndex].globalSyncStatus = status;

      if (status === 'synced') {
        sessions[sessionIndex].globalRank = options.rank;
        sessions[sessionIndex].globalSyncedAt = new Date().toISOString();
        sessions[sessionIndex].globalSyncError = null;
      } else if (status === 'failed') {
        sessions[sessionIndex].globalSyncError = options.error || 'Unknown error';
        sessions[sessionIndex].globalSyncFailedAt = new Date().toISOString();
      } else if (status === 'pending') {
        sessions[sessionIndex].globalSyncError = null;
      }

      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating session sync status:', error);
    return false;
  }
}

// Queue management for global leaderboard submissions
const SYNC_QUEUE_KEY = 'mots_sync_queue';
const PLAYER_NAME_KEY = 'mots_player_name';
const PLAYER_ID_KEY = 'mots_player_id';

// Generate a UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Get or create player ID (unique per browser/device)
export function getPlayerId() {
  try {
    let playerId = localStorage.getItem(PLAYER_ID_KEY);
    if (!playerId) {
      playerId = generateUUID();
      localStorage.setItem(PLAYER_ID_KEY, playerId);
      console.log('Generated new player ID:', playerId);
    }
    return playerId;
  } catch (error) {
    console.error('Error getting player ID:', error);
    // Fallback to session-based ID if localStorage fails
    return 'temp-' + Date.now();
  }
}

// Queue a score for global submission (when offline or user wants to submit later)
export function queueGlobalSubmission(sessionData) {
  try {
    const queue = getPendingSubmissions();
    queue.push({
      ...sessionData,
      queuedAt: new Date().toISOString(),
      attempts: 0
    });
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    return true;
  } catch (error) {
    console.error('Error queuing submission:', error);
    return false;
  }
}

// Get all pending submissions
export function getPendingSubmissions() {
  try {
    const data = localStorage.getItem(SYNC_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading pending submissions:', error);
    return [];
  }
}

// Remove a submission from the queue (after successful sync)
export function clearQueuedSubmission(sessionId) {
  try {
    const queue = getPendingSubmissions();
    const filtered = queue.filter(s => s.id !== sessionId);
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error clearing queued submission:', error);
    return false;
  }
}

// Increment attempt counter for a queued submission
export function incrementQueueAttempts(sessionId) {
  try {
    const queue = getPendingSubmissions();
    const submission = queue.find(s => s.id === sessionId);
    if (submission) {
      submission.attempts = (submission.attempts || 0) + 1;
      submission.lastAttempt = new Date().toISOString();
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    }
    return true;
  } catch (error) {
    console.error('Error incrementing attempts:', error);
    return false;
  }
}

// Get/set remembered player name
export function getPlayerName() {
  try {
    return localStorage.getItem(PLAYER_NAME_KEY) || '';
  } catch (error) {
    console.error('Error loading player name:', error);
    return '';
  }
}

export function setPlayerName(name) {
  try {
    const trimmed = name.toUpperCase().trim().slice(0, 8);
    localStorage.setItem(PLAYER_NAME_KEY, trimmed);
    return trimmed;
  } catch (error) {
    console.error('Error saving player name:', error);
    return name;
  }
}
