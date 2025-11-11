// sync.js - Global leaderboard sync management

import {
  submitGlobalScore,
  fetchGlobalLeaderboard
} from './leaderboard-api.js';

import {
  getPendingSubmissions,
  queueGlobalSubmission,
  clearQueuedSubmission,
  incrementQueueAttempts,
  getPlayerName,
  setPlayerName,
  updateSessionName
} from './storage.js';

// Try to submit a score to the global leaderboard
export async function submitToGlobal(session, playerName) {
  try {
    // Format data for API
    const scoreData = {
      playerName: playerName.toUpperCase().trim().slice(0, 8),
      score: session.score,
      wordsWon: session.wordsWon,
      wordsLost: session.wordsLost,
      successRate: session.successRate,
      time: session.time
    };

    // Try to submit
    const result = await submitGlobalScore(session.topicId, scoreData);

    if (result) {
      // Success! Update local session with player name
      updateSessionName(session.id, scoreData.playerName);

      // Save player name for future use
      setPlayerName(scoreData.playerName);

      return {
        success: true,
        rank: result.rank,
        madeTopTen: result.madeTopTen,
        topScores: result.topScores
      };
    } else {
      // API call failed
      return { success: false, error: 'Failed to submit score' };
    }
  } catch (error) {
    console.error('Error submitting to global leaderboard:', error);
    return { success: false, error: error.message };
  }
}

// Queue a score for later submission (when offline)
export function queueForLater(session, playerName) {
  const sessionWithName = {
    ...session,
    playerName: playerName.toUpperCase().trim().slice(0, 8)
  };

  const queued = queueGlobalSubmission(sessionWithName);

  if (queued) {
    // Update local session with player name
    updateSessionName(session.id, sessionWithName.playerName);

    // Save player name for future use
    setPlayerName(sessionWithName.playerName);
  }

  return queued;
}

// Try to sync all pending submissions
export async function syncPendingScores() {
  if (!navigator.onLine) {
    return { synced: 0, failed: 0, offline: true };
  }

  const pending = getPendingSubmissions();
  if (pending.length === 0) {
    return { synced: 0, failed: 0 };
  }

  let synced = 0;
  let failed = 0;

  for (const submission of pending) {
    // Skip if too many attempts
    if (submission.attempts >= 5) {
      failed++;
      continue;
    }

    try {
      const result = await submitToGlobal(submission, submission.playerName);

      if (result.success) {
        // Mark as globally submitted in sessions
        const sessions = JSON.parse(localStorage.getItem('mots_sessions') || '[]');
        const sessionIndex = sessions.findIndex(s => s.id === submission.id);
        if (sessionIndex !== -1) {
          sessions[sessionIndex].globalSubmitted = true;
          sessions[sessionIndex].globalRank = result.rank;
          localStorage.setItem('mots_sessions', JSON.stringify(sessions));
        }

        // Remove from queue
        clearQueuedSubmission(submission.id);
        synced++;
      } else {
        // Increment attempts
        incrementQueueAttempts(submission.id);
        failed++;
      }
    } catch (error) {
      console.error('Error syncing submission:', error);
      incrementQueueAttempts(submission.id);
      failed++;
    }
  }

  return { synced, failed };
}

// Check online status
export function isOnline() {
  return navigator.onLine;
}

// Setup online/offline event listeners for auto-sync
export function setupAutoSync(callback) {
  window.addEventListener('online', async () => {
    console.log('Back online! Syncing pending scores...');
    const result = await syncPendingScores();

    if (callback && result.synced > 0) {
      callback(result);
    }
  });

  window.addEventListener('offline', () => {
    console.log('Gone offline. Scores will be queued for later.');
  });
}
