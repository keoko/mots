// game.js - Game state management

import { topics } from './data.js';

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
  guessedLetters: [],
  attemptsLeft: 6,
  maxAttempts: 6,
  totalWon: 0,
  totalLost: 0,
  gameState: GAME_STATES.TOPIC_SELECTION
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

// Select a topic
export function selectTopic(topicId) {
  const topic = state.topics.find(t => t.id === topicId);
  if (topic) {
    state.selectedTopic = topic;
    state.currentWordIndex = 0;
    state.guessedLetters = [];
    state.attemptsLeft = state.maxAttempts;
    state.totalWon = 0;
    state.totalLost = 0;
    state.gameState = GAME_STATES.MODE_SELECTION;
  }
}

// Select game mode
export function selectMode(mode) {
  state.gameMode = mode;
  state.currentWordIndex = 0;
  state.guessedLetters = [];
  state.attemptsLeft = state.maxAttempts;

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

// Display word with guessed letters
export function getDisplayWord() {
  const word = getCurrentWord();
  if (!word) return '';

  return word.english
    .split('')
    .map(letter => {
      const lower = letter.toLowerCase();
      return state.guessedLetters.includes(lower) ? letter : '_';
    })
    .join(' ');
}

// Check if letter is in word
function isLetterInWord(letter, word) {
  return word.toLowerCase().includes(letter.toLowerCase());
}

// Check if word is complete
function isWordComplete() {
  const word = getCurrentWord();
  if (!word) return false;

  return word.english
    .split('')
    .every(letter => state.guessedLetters.includes(letter.toLowerCase()));
}

// Guess a letter
export function guessLetter(letter) {
  const lowerLetter = letter.toLowerCase();

  // Already guessed
  if (state.guessedLetters.includes(lowerLetter)) {
    return;
  }

  // Not in playing state
  if (state.gameState !== GAME_STATES.PLAYING) {
    return;
  }

  const currentWord = getCurrentWord();
  if (!currentWord) return;

  // Add to guessed letters
  state.guessedLetters.push(lowerLetter);

  // Check if correct
  const isCorrect = isLetterInWord(lowerLetter, currentWord.english);

  if (!isCorrect) {
    state.attemptsLeft--;
  }

  // Update game state
  updateGameState();
}

// Update game state based on current conditions
function updateGameState() {
  if (isWordComplete()) {
    state.gameState = GAME_STATES.WON;
  } else if (state.attemptsLeft <= 0) {
    state.gameState = GAME_STATES.LOST;
  }
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
    } else {
      // In study mode, stay on last word
      state.currentWordIndex = state.selectedTopic.words.length - 1;
    }
  } else {
    // Reset for next word
    state.guessedLetters = [];
    state.attemptsLeft = state.maxAttempts;

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
  }
}

// Back to topic selection
export function backToTopics() {
  state.selectedTopic = null;
  state.gameMode = null;
  state.currentWordIndex = 0;
  state.guessedLetters = [];
  state.attemptsLeft = state.maxAttempts;
  state.totalWon = 0;
  state.totalLost = 0;
  state.gameState = GAME_STATES.TOPIC_SELECTION;
}

// Back to mode selection
export function backToModeSelection() {
  state.gameMode = null;
  state.currentWordIndex = 0;
  state.guessedLetters = [];
  state.attemptsLeft = state.maxAttempts;
  state.totalWon = 0;
  state.totalLost = 0;
  state.gameState = GAME_STATES.MODE_SELECTION;
}

// Start playing from study mode
export function startPlaying() {
  state.gameMode = GAME_MODES.PLAY;
  state.currentWordIndex = 0;
  state.guessedLetters = [];
  state.attemptsLeft = state.maxAttempts;
  state.totalWon = 0;
  state.totalLost = 0;
  state.gameState = GAME_STATES.PLAYING;
}

// Restart game
export function restartGame() {
  backToTopics();
}
