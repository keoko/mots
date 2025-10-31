// game.js - Game state management

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
  WON: 'won',
  LOST: 'lost',
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
  guesses: [], // Array of guess objects: [{word: 'house', feedback: ['correct', 'absent', ...]}]
  currentGuess: '', // Current word being typed
  attemptsLeft: 3,
  maxAttempts: 3,
  totalWon: 0,
  totalLost: 0,
  currentStreak: 0,
  gameState: GAME_STATES.TOPIC_SELECTION,
  isWordRevealed: false,
  letterStates: {}, // Track letter states: {a: 'correct', b: 'present', c: 'absent'}
  // Gamification: timing and scoring
  sessionStartTime: null,
  sessionEndTime: null,
  wordStats: [], // Track stats per word: [{word, attempts, won, timeMs}]
  totalScore: 0,
  // Practice failed words mode
  practiceWords: null, // Array of failed words to practice
  isPracticingFailed: false
};

// Alphabet for keyboard
export const ALPHABET = [
  'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p',
  'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l',
  'z', 'x', 'c', 'v', 'b', 'n', 'm'
];

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
    state.guesses = [];
    state.currentGuess = '';
    state.attemptsLeft = state.maxAttempts;
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
  state.guesses = [];
  state.currentGuess = '';
  state.attemptsLeft = state.maxAttempts;
  state.currentStreak = 0;
  state.isWordRevealed = false;
  state.letterStates = {};

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

// Add letter to current guess
export function addLetter(letter) {
  const word = getCurrentWord();
  if (!word) return;

  if (state.currentGuess.length < word.en.length) {
    state.currentGuess += letter.toLowerCase();

    // Auto-insert spaces and hyphens if the next character in the target word is a space or hyphen
    while (state.currentGuess.length < word.en.length &&
           (word.en[state.currentGuess.length] === ' ' || word.en[state.currentGuess.length] === '-')) {
      state.currentGuess += word.en[state.currentGuess.length];
    }
  }
}

// Remove last letter from current guess
export function removeLetter() {
  state.currentGuess = state.currentGuess.slice(0, -1);

  // Remove any trailing spaces or hyphens that were auto-inserted
  while (state.currentGuess.length > 0 &&
         (state.currentGuess[state.currentGuess.length - 1] === ' ' ||
          state.currentGuess[state.currentGuess.length - 1] === '-')) {
    state.currentGuess = state.currentGuess.slice(0, -1);
  }
}

// Set current guess directly (for mobile keyboard input)
export function setCurrentGuess(value) {
  state.currentGuess = value;
}

// Update letter states for keyboard coloring
function updateLetterStates(guess, feedback) {
  const guessLower = guess.toLowerCase();

  for (let i = 0; i < guessLower.length; i++) {
    const letter = guessLower[i];

    // Skip spaces
    if (letter === ' ') continue;

    const currentState = state.letterStates[letter];
    const newState = feedback[i];

    // Priority: correct > present > absent
    // Don't downgrade a letter's state
    if (newState === 'correct') {
      state.letterStates[letter] = 'correct';
    } else if (newState === 'present' && currentState !== 'correct') {
      state.letterStates[letter] = 'present';
    } else if (newState === 'absent' && !currentState) {
      state.letterStates[letter] = 'absent';
    }
  }
}

// Get feedback for a guess (Wordle-style)
function getFeedback(guess, target) {
  const targetLower = target.toLowerCase();
  const guessLower = guess.toLowerCase();
  const feedback = [];
  const targetLetters = targetLower.split('');
  const used = new Array(targetLetters.length).fill(false);

  // First pass: mark correct positions
  for (let i = 0; i < guessLower.length; i++) {
    if (guessLower[i] === targetLower[i]) {
      feedback[i] = 'correct';
      used[i] = true;
    }
  }

  // Second pass: mark present letters
  for (let i = 0; i < guessLower.length; i++) {
    if (feedback[i] === 'correct') continue;

    const foundIndex = targetLetters.findIndex((letter, j) =>
      letter === guessLower[i] && !used[j]
    );

    if (foundIndex !== -1) {
      feedback[i] = 'present';
      used[foundIndex] = true;
    } else {
      feedback[i] = 'absent';
    }
  }

  return feedback;
}

// Submit current guess
export function submitGuess() {
  if (state.gameState !== GAME_STATES.PLAYING) return;

  const word = getCurrentWord();
  if (!word) return;

  // Check if guess is complete
  if (state.currentGuess.length !== word.en.length) return;

  // Get feedback
  const feedback = getFeedback(state.currentGuess, word.en);

  // Update letter states based on feedback
  updateLetterStates(state.currentGuess, feedback);

  // Add to guesses
  state.guesses.push({
    word: state.currentGuess,
    feedback: feedback
  });

  // Check if won
  const isCorrect = state.currentGuess.toLowerCase() === word.en.toLowerCase();

  if (isCorrect) {
    state.gameState = GAME_STATES.WON;
    state.currentStreak++;
  } else {
    state.attemptsLeft--;
    if (state.attemptsLeft <= 0) {
      state.gameState = GAME_STATES.LOST;
      state.currentStreak = 0;
    }
  }

  // Reset current guess
  state.currentGuess = '';
}

// Calculate score for a word
// Score formula: baseScore * (attemptsBonus) * (timeBonus) * (streakBonus)
function calculateWordScore(won, attemptsUsed, timeTaken) {
  if (!won) return 0;

  const BASE_SCORE = 100;

  // Attempts bonus: 100% for 1 attempt, decreasing by 15% per attempt
  const attemptsBonus = Math.max(0.25, 1 - ((attemptsUsed - 1) * 0.15));

  // Time bonus: 100% for <10s, decreasing to 50% at 60s
  const timeSeconds = timeTaken / 1000;
  const timeBonus = timeSeconds < 10 ? 1.0 : Math.max(0.5, 1 - ((timeSeconds - 10) / 100));

  // Streak bonus: +10% per word in streak (capped at 50%)
  const streakBonus = 1 + Math.min(0.5, state.currentStreak * 0.1);

  return Math.round(BASE_SCORE * attemptsBonus * timeBonus * streakBonus);
}

// Move to next word
export function nextWord() {
  const word = getCurrentWord();
  const wordStartTime = state.sessionStartTime + (state.wordStats.length > 0
    ? state.wordStats.reduce((sum, s) => sum + s.timeMs, 0)
    : 0);
  const wordEndTime = Date.now();
  const timeTaken = wordEndTime - wordStartTime;

  // Update score and stats if in play mode or practice failed mode
  if (state.gameMode === GAME_MODES.PLAY || state.gameMode === GAME_MODES.PRACTICE_FAILED) {
    const won = state.gameState === GAME_STATES.WON;
    const attemptsUsed = state.guesses.length;

    if (won) {
      state.totalWon++;

      // If practicing failed words and won, remove from failed list
      if (state.isPracticingFailed && word) {
        // Find the original topic for this word
        const failedWords = getFailedWords();
        for (const [topicId, words] of Object.entries(failedWords)) {
          const foundWord = words.find(w => w.en === word.en && w.ca === word.ca);
          if (foundWord) {
            removeFailedWord(topicId, word.en);
            break;
          }
        }
      }
    } else if (state.gameState === GAME_STATES.LOST) {
      state.totalLost++;
    }

    // Calculate score for this word
    const wordScore = calculateWordScore(won, attemptsUsed, timeTaken);
    state.totalScore += wordScore;

    // Track word stats
    state.wordStats.push({
      word: word.en,
      attempts: attemptsUsed,
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
    state.guesses = [];
    state.currentGuess = '';
    state.attemptsLeft = state.maxAttempts;
    state.isWordRevealed = false;
    state.letterStates = {}; // Reset letter states

    if (state.gameMode === GAME_MODES.STUDY) {
      state.gameState = GAME_STATES.STUDYING;
    } else {
      state.gameState = GAME_STATES.PLAYING;
    }
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
  state.guesses = [];
  state.currentGuess = '';
  state.attemptsLeft = state.maxAttempts;
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
  state.guesses = [];
  state.currentGuess = '';
  state.attemptsLeft = state.maxAttempts;
  state.totalWon = 0;
  state.totalLost = 0;
  state.currentStreak = 0;
  state.gameState = GAME_STATES.MODE_SELECTION;
}

// Start playing from study mode
export function startPlaying() {
  state.gameMode = GAME_MODES.PLAY;
  state.currentWordIndex = 0;
  state.guesses = [];
  state.currentGuess = '';
  state.attemptsLeft = state.maxAttempts;
  state.totalWon = 0;
  state.totalLost = 0;
  state.currentStreak = 0;
  state.gameState = GAME_STATES.PLAYING;
}

// Restart game
export function restartGame() {
  backToTopics();
}

// Toggle word reveal in study mode
export function toggleWordReveal() {
  if (state.gameMode === GAME_MODES.STUDY) {
    state.isWordRevealed = !state.isWordRevealed;
  }
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
  state.guesses = [];
  state.currentGuess = '';
  state.attemptsLeft = state.maxAttempts;
  state.currentStreak = 0;
  state.isWordRevealed = false;
  state.letterStates = {};
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

  // Save failed words
  const failedWords = state.selectedTopic.words.filter((word, index) => {
    const stat = state.wordStats[index];
    return stat && !stat.won;
  });

  if (failedWords.length > 0) {
    saveFailedWords(state.selectedTopic.id, failedWords);
  }

  // Save session history
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
