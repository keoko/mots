// leaderboard-api.js - Global leaderboard API client

// API configuration
const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://mots-leaderboard.fly.dev';

/**
 * Fetch global top 10 scores for a topic
 * @param {string} topicId - The topic ID
 * @returns {Promise<Array>} Top 10 scores
 */
export async function fetchGlobalLeaderboard(topicId) {
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
    return data.scores || [];
  } catch (error) {
    console.error('Failed to fetch global leaderboard:', error);
    return null; // Return null to indicate failure
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
