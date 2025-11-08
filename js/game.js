// game.js - Simplified game state management

import { topics } from './data.js';
import {
  saveTopicProgress,
  getTopicProgress,
  saveFailedWords,
  saveSession,
  getFailedWords,
  removeFailedWord
} from './storage.js';

export const GAME_STATES = {
  TOPIC_SELECTION: 'topic_selection',
  MODE_SELECTION: 'mode_selection',
  STUDYING: 'studying',
  PLAYING: 'playing',
  RESULT: 'result', // Shows correct/incorrect after submission
  COMPLETE: 'complete',
  STATISTICS: 'statistics'
};

export const GAME_MODES = {
  STUDY: 'study',
  PLAY: 'play',
  PRACTICE_FAILED: 'practice_failed'
};

// Game state
const state = {
  topics: topics,
  selectedTopic: null,
  gameMode: null,
  currentWordIndex: 0,
  // Study mode
  isWordRevealed: false,
  // Play mode
  userInput: '', // User's typed answer
  isCorrect: false, // Whether last answer was correct
  currentStreak: 0,
  // Stats tracking
  sessionStartTime: null,
  sessionEndTime: null,
  wordStats: [], // Track stats per word: [{word, won, timeMs, difficulty}]
  totalScore: 0,
  totalWon: 0,
  totalLost: 0,
  // Practice failed words mode
  practiceWords: null,
  isPracticingFailed: false,
  gameState: GAME_STATES.TOPIC_SELECTION
};

// Get current state
export function getState() {
  return { ...state };
}

// Get all topics
export function getTopics() {
  return state.topics;
}

// Get topics with progress
export function getTopicsWithProgress() {
  return state.topics.map(topic => ({
    ...topic,
    progress: getTopicProgress(topic.id)
  }));
}

// Select a topic
export function selectTopic(topicId) {
  const topic = state.topics.find(t => t.id === topicId);
  if (topic) {
    state.selectedTopic = topic;
    state.currentWordIndex = 0;
    state.userInput = '';
    state.totalWon = 0;
    state.totalLost = 0;
    state.currentStreak = 0;
    state.gameState = GAME_STATES.MODE_SELECTION;
  }
}

// Select game mode
export function selectMode(mode) {
  state.gameMode = mode;
  state.currentWordIndex = 0;
  state.userInput = '';
  state.currentStreak = 0;
  state.isWordRevealed = false;

  // Start timing when entering play mode
  if (mode === GAME_MODES.PLAY) {
    state.sessionStartTime = Date.now();
    state.wordStats = [];
    state.totalScore = 0;
    state.totalWon = 0;
    state.totalLost = 0;
  }

  if (mode === GAME_MODES.STUDY) {
    state.gameState = GAME_STATES.STUDYING;
  } else {
    state.gameState = GAME_STATES.PLAYING;
  }
}

// Get current word
export function getCurrentWord() {
  if (state.isPracticingFailed && state.practiceWords) {
    return state.practiceWords[state.currentWordIndex];
  }
  if (!state.selectedTopic) return null;
  return state.selectedTopic.words[state.currentWordIndex];
}

// Set user input (for play mode)
export function setUserInput(value) {
  state.userInput = value;
}

// Submit answer in play mode
export function submitAnswer() {
  if (state.gameState !== GAME_STATES.PLAYING) return;

  const word = getCurrentWord();
  if (!word || !state.userInput.trim()) return;

  // Check if answer is correct (case-insensitive, trimmed)
  const userAnswer = state.userInput.trim().toLowerCase();
  const correctAnswer = word.en.toLowerCase();
  state.isCorrect = userAnswer === correctAnswer;

  if (state.isCorrect) {
    state.currentStreak++;
  } else {
    state.currentStreak = 0;
  }

  // Move to result state to show feedback
  state.gameState = GAME_STATES.RESULT;
}

// Toggle word reveal in study mode
export function toggleWordReveal() {
  if (state.gameMode === GAME_MODES.STUDY) {
    state.isWordRevealed = !state.isWordRevealed;
  }
}

// Mark word difficulty in study mode (hard = true, easy = false)
export function markDifficulty(isHard) {
  if (state.gameMode !== GAME_MODES.STUDY) return;

  const word = getCurrentWord();
  const wordEndTime = Date.now();
  const wordStartTime = state.sessionStartTime || wordEndTime;
  const timeTaken = wordEndTime - wordStartTime;

  // Track word stats for study mode
  state.wordStats.push({
    word: word.en,
    won: !isHard, // Easy = won, Hard = lost
    timeMs: timeTaken,
    difficulty: isHard ? 'hard' : 'easy'
  });

  if (isHard) {
    state.totalLost++;
  } else {
    state.totalWon++;
  }

  // Reset timer for next word
  state.sessionStartTime = Date.now();

  // Move to next word
  nextWordInStudyMode();
}

// Calculate score for a word (play mode only)
function calculateWordScore(won, timeTaken) {
  if (!won) return 0;

  const BASE_SCORE = 100;

  // Time bonus: 100% for <10s, decreasing to 50% at 60s
  const timeSeconds = timeTaken / 1000;
  const timeBonus = timeSeconds < 10 ? 1.0 : Math.max(0.5, 1 - ((timeSeconds - 10) / 100));

  // Streak bonus: +10% per word in streak (capped at 50%)
  const streakBonus = 1 + Math.min(0.5, state.currentStreak * 0.1);

  return Math.round(BASE_SCORE * timeBonus * streakBonus);
}

// Move to next word (called after result screen in play mode)
export function nextWord() {
  const word = getCurrentWord();
  const wordEndTime = Date.now();
  const wordStartTime = state.sessionStartTime + (state.wordStats.length > 0
    ? state.wordStats.reduce((sum, s) => sum + s.timeMs, 0)
    : 0);
  const timeTaken = wordEndTime - wordStartTime;

  // Update score and stats if in play mode or practice failed mode
  if (state.gameMode === GAME_MODES.PLAY || state.gameMode === GAME_MODES.PRACTICE_FAILED) {
    const won = state.isCorrect;

    if (won) {
      state.totalWon++;

      // If practicing failed words and won, remove from failed list
      if (state.isPracticingFailed && word) {
        const failedWords = getFailedWords();
        for (const [topicId, words] of Object.entries(failedWords)) {
          const foundWord = words.find(w => w.en === word.en && w.ca === word.ca);
          if (foundWord) {
            removeFailedWord(topicId, word.en);
            break;
          }
        }
      }
    } else {
      state.totalLost++;
    }

    // Calculate score for this word
    const wordScore = calculateWordScore(won, timeTaken);
    state.totalScore += wordScore;

    // Track word stats
    state.wordStats.push({
      word: word.en,
      won: won,
      timeMs: timeTaken,
      score: wordScore
    });
  }

  // Move to next word
  state.currentWordIndex++;

  // Check if we've completed all words
  if (state.currentWordIndex >= state.selectedTopic.words.length) {
    if (state.gameMode === GAME_MODES.PLAY || state.gameMode === GAME_MODES.PRACTICE_FAILED) {
      state.sessionEndTime = Date.now();
      state.gameState = GAME_STATES.COMPLETE;
      // Save progress to localStorage (but not for practice mode)
      if (state.gameMode === GAME_MODES.PLAY) {
        saveProgress();
      }
    } else {
      // In study mode, stay on last word
      state.currentWordIndex = state.selectedTopic.words.length - 1;
    }
  } else {
    // Reset for next word
    state.userInput = '';
    state.isWordRevealed = false;
    state.gameState = GAME_STATES.PLAYING;
  }
}

// Move to next word in study mode (after marking difficulty)
function nextWordInStudyMode() {
  state.currentWordIndex++;

  // Check if we've completed all words
  if (state.currentWordIndex >= state.selectedTopic.words.length) {
    state.sessionEndTime = Date.now();
    state.gameState = GAME_STATES.COMPLETE;
    // Save study mode progress
    saveProgress();
  } else {
    // Reset for next word
    state.isWordRevealed = false;
    state.gameState = GAME_STATES.STUDYING;
  }
}

// Move to previous word (study mode only)
export function previousWord() {
  if (state.currentWordIndex > 0) {
    state.currentWordIndex--;
    state.isWordRevealed = false;
  }
}

// Back to topic selection
export function backToTopics() {
  state.selectedTopic = null;
  state.gameMode = null;
  state.currentWordIndex = 0;
  state.userInput = '';
  state.totalWon = 0;
  state.totalLost = 0;
  state.currentStreak = 0;
  state.isPracticingFailed = false;
  state.practiceWords = null;
  state.gameState = GAME_STATES.TOPIC_SELECTION;
}

// Back to mode selection
export function backToModeSelection() {
  state.gameMode = null;
  state.currentWordIndex = 0;
  state.userInput = '';
  state.totalWon = 0;
  state.totalLost = 0;
  state.currentStreak = 0;
  state.gameState = GAME_STATES.MODE_SELECTION;
}

// Restart game
export function restartGame() {
  backToTopics();
}

// Go to statistics page
export function goToStatistics() {
  state.gameState = GAME_STATES.STATISTICS;
}

// Start practicing failed words
export function startPracticingFailed() {
  const failedWords = getFailedWords();

  // Collect all failed words from all topics
  const allFailedWords = [];
  Object.entries(failedWords).forEach(([topicId, words]) => {
    const topic = state.topics.find(t => t.id === topicId);
    if (topic && words.length > 0) {
      allFailedWords.push(...words);
    }
  });

  if (allFailedWords.length === 0) {
    // No failed words to practice
    return;
  }

  // Shuffle the failed words for variety
  const shuffled = allFailedWords.sort(() => Math.random() - 0.5);

  // Set up practice mode
  state.practiceWords = shuffled;
  state.isPracticingFailed = true;
  state.gameMode = GAME_MODES.PRACTICE_FAILED;
  state.currentWordIndex = 0;
  state.userInput = '';
  state.currentStreak = 0;
  state.isWordRevealed = false;
  state.sessionStartTime = Date.now();
  state.wordStats = [];
  state.totalScore = 0;
  state.totalWon = 0;
  state.totalLost = 0;
  state.gameState = GAME_STATES.PLAYING;

  // Create a virtual topic for UI display
  state.selectedTopic = {
    id: 'failed-words-practice',
    name: 'Failed Words Practice',
    emoji: '🎯',
    words: shuffled
  };
}

// Save current game progress to localStorage
function saveProgress() {
  if (!state.selectedTopic) return;

  // Calculate total time
  const totalTime = state.sessionEndTime - state.sessionStartTime;

  // Convert wordStats array to object for storage
  const wordStatsObj = {};
  state.wordStats.forEach(stat => {
    wordStatsObj[stat.word] = stat;
  });

  // Save topic progress with detailed stats
  saveTopicProgress(state.selectedTopic.id, {
    totalWon: state.totalWon,
    totalLost: state.totalLost,
    totalScore: state.totalScore,
    totalTime: totalTime,
    wordStats: wordStatsObj
  });

  // Save failed words (both from play mode failures and study mode "hard" marks)
  const failedWords = state.selectedTopic.words.filter((word, index) => {
    const stat = state.wordStats[index];
    return stat && !stat.won;
  });

  if (failedWords.length > 0) {
    saveFailedWords(state.selectedTopic.id, failedWords);
  }

  // Save session history (only for play mode, not study)
  if (state.gameMode === GAME_MODES.PLAY) {
    saveSession({
      topicId: state.selectedTopic.id,
      topicName: state.selectedTopic.name,
      score: state.totalScore,
      time: totalTime,
      wordsWon: state.totalWon,
      wordsLost: state.totalLost,
      successRate: Math.round((state.totalWon / (state.totalWon + state.totalLost)) * 100)
    });
  }
}
