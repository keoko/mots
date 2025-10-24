// game.js - Game state management

import { topics } from './data.js';
import { saveTopicProgress, getTopicProgress } from './storage.js';
import { vibrateSuccess, vibrateError, vibrateComplete } from './haptics.js';

export const GAME_STATES = {
  TOPIC_SELECTION: 'topic_selection',
  MODE_SELECTION: 'mode_selection',
  STUDYING: 'studying',
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost',
  COMPLETE: 'complete'
};

export const GAME_MODES = {
  STUDY: 'study',
  PLAY: 'play'
};

// Game state
const state = {
  topics: topics,
  selectedTopic: null,
  gameMode: null,
  currentWordIndex: 0,
  guesses: [], // Array of guess objects: [{word: 'house', feedback: ['correct', 'absent', ...]}]
  currentGuess: '', // Current word being typed
  attemptsLeft: 5,
  maxAttempts: 5,
  totalWon: 0,
  totalLost: 0,
  currentStreak: 0,
  gameState: GAME_STATES.TOPIC_SELECTION,
  isWordRevealed: false
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

  if (mode === GAME_MODES.STUDY) {
    state.gameState = GAME_STATES.STUDYING;
  } else {
    state.gameState = GAME_STATES.PLAYING;
  }
}

// Get current word
export function getCurrentWord() {
  if (!state.selectedTopic) return null;
  return state.selectedTopic.words[state.currentWordIndex];
}

// Add letter to current guess
export function addLetter(letter) {
  const word = getCurrentWord();
  if (!word) return;

  if (state.currentGuess.length < word.english.length) {
    state.currentGuess += letter.toLowerCase();
  }
}

// Remove last letter from current guess
export function removeLetter() {
  state.currentGuess = state.currentGuess.slice(0, -1);
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
  if (state.currentGuess.length !== word.english.length) return;

  // Get feedback
  const feedback = getFeedback(state.currentGuess, word.english);

  // Add to guesses
  state.guesses.push({
    word: state.currentGuess,
    feedback: feedback
  });

  // Check if won
  const isCorrect = state.currentGuess.toLowerCase() === word.english.toLowerCase();

  if (isCorrect) {
    state.gameState = GAME_STATES.WON;
    state.currentStreak++;
    vibrateSuccess(); // Haptic feedback for success
  } else {
    state.attemptsLeft--;
    if (state.attemptsLeft <= 0) {
      state.gameState = GAME_STATES.LOST;
      state.currentStreak = 0;
      vibrateError(); // Haptic feedback for failure
    }
  }

  // Reset current guess
  state.currentGuess = '';
}

// Move to next word
export function nextWord() {
  // Update score if in play mode
  if (state.gameMode === GAME_MODES.PLAY) {
    if (state.gameState === GAME_STATES.WON) {
      state.totalWon++;
    } else if (state.gameState === GAME_STATES.LOST) {
      state.totalLost++;
    }
  }

  // Move to next word
  state.currentWordIndex++;

  // Check if we've completed all words
  if (state.currentWordIndex >= state.selectedTopic.words.length) {
    if (state.gameMode === GAME_MODES.PLAY) {
      state.gameState = GAME_STATES.COMPLETE;
      vibrateComplete(); // Haptic feedback for completing all words
      // Save progress to localStorage
      saveProgress();
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

// Save current game progress to localStorage
function saveProgress() {
  if (!state.selectedTopic) return;

  const currentProgress = getTopicProgress(state.selectedTopic.id);

  saveTopicProgress(state.selectedTopic.id, {
    totalWon: currentProgress.totalWon + state.totalWon,
    totalLost: currentProgress.totalLost + state.totalLost,
    totalPlayed: currentProgress.totalPlayed + 1
  });
}
