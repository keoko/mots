// leaderboard-api.js - Global leaderboard API client

import { getCachedGlobalLeaderboard, setCachedGlobalLeaderboard } from './storage.js';

// API configuration
const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://mots-leaderboard.fly.dev';

/**
 * Fetch global top 10 scores for a topic with smart caching
 * @param {string} topicId - The topic ID
 * @param {object} options - Fetch options
 * @param {boolean} options.forceRefresh - Bypass cache and fetch fresh data
 * @param {boolean} options.background - Don't throw on error, return stale cache
 * @returns {Promise<object>} Result with scores, fetchedAt, and fromCache flag
 */
export async function fetchGlobalLeaderboard(topicId, options = {}) {
  const {
    forceRefresh = false,
    background = false
  } = options;

  // Try cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = getCachedGlobalLeaderboard(topicId);
    if (cached && !cached.isStale) {
      return {
        scores: cached.scores,
        fetchedAt: cached.fetchedAt,
        fromCache: true
      };
    }
  }

  // Fetch fresh data from server
  try {
    const response = await fetch(`${API_URL}/api/leaderboard/${topicId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const scores = data.scores || [];

    // Cache the result
    setCachedGlobalLeaderboard(topicId, scores);

    return {
      scores,
      fetchedAt: new Date(),
      fromCache: false
    };

  } catch (error) {
    console.error('Failed to fetch global leaderboard:', error);

    // If background fetch fails, return stale cache silently
    if (background) {
      const cached = getCachedGlobalLeaderboard(topicId);
      return cached
        ? { scores: cached.scores, fetchedAt: cached.fetchedAt, fromCache: true }
        : { scores: [], fetchedAt: new Date(), fromCache: false };
    }

    // If user-initiated fetch fails, try cache as fallback
    const cached = getCachedGlobalLeaderboard(topicId);
    if (cached) {
      console.warn('Using stale leaderboard cache due to fetch error');
      return {
        scores: cached.scores,
        fetchedAt: cached.fetchedAt,
        fromCache: true,
        fetchError: error
      };
    }

    // No cache available, return null to indicate failure
    return null;
  }
}

/**
 * Submit a score to the global leaderboard
 * @param {string} topicId - The topic ID
 * @param {object} scoreData - Score data
 * @returns {Promise<object>} Submission result with rank and top scores
 */
export async function submitGlobalScore(topicId, scoreData) {
  try {
    const response = await fetch(`${API_URL}/api/leaderboard/${topicId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(scoreData)
    });

    if (!response.ok) {
      // Try to get error message from response body
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // Couldn't parse error response, use generic message
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to submit global score:', error);
    return { error: error.message }; // Return error details instead of null
  }
}
