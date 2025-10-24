// storage.js - Local storage utilities for local-first persistence

const STORAGE_KEY = 'mots_progress';

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

// Save progress for a specific topic
export function saveTopicProgress(topicId, stats) {
  try {
    const progress = getProgress();
    progress[topicId] = {
      ...stats,
      lastPlayed: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving progress:', error);
  }
}

// Get progress for a specific topic
export function getTopicProgress(topicId) {
  const progress = getProgress();
  return progress[topicId] || {
    totalWon: 0,
    totalLost: 0,
    totalPlayed: 0,
    lastPlayed: null
  };
}

// Clear all progress (for testing or reset)
export function clearProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing progress:', error);
  }
}

// Export all data (for backup or sync)
export function exportData() {
  return getProgress();
}

// Import data (from backup or sync)
export function importData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error importing data:', error);
  }
}
