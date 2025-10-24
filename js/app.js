// app.js - Main application entry point

import { render } from './ui.js';
import { addLetter, removeLetter, submitGuess, getState, getCurrentWord, backToTopics } from './game.js';
import { vibrateLetterInput, vibrateTap, vibrateInvalid } from './haptics.js';

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 Mots - Starting game...');

  // Initial render
  render();

  // Add keyboard support for play mode
  document.addEventListener('keydown', handleKeyboardInput);

  // Make title clickable to go home
  const gameTitle = document.getElementById('game-title');
  if (gameTitle) {
<<<<<<< HEAD
    // Use both click and touchend for better mobile support
    gameTitle.addEventListener('click', handleTitleClick);
    gameTitle.addEventListener('touchend', (e) => {
      e.preventDefault();
      handleTitleClick();
    });
=======
    gameTitle.addEventListener('click', handleTitleClick);
>>>>>>> 19c8f61d2ed803cc4cde89bee7a19a6c15cda51c
    gameTitle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleTitleClick();
      }
    });
  }
});

// Handle keyboard input
function handleKeyboardInput(e) {
  const state = getState();
  const word = getCurrentWord();

  // Only handle letter keys (a-z)
  if (e.key.length === 1 && /[a-z]/i.test(e.key)) {
    const letter = e.key.toLowerCase();

    // Only vibrate if letter will be added
    if (word && state.currentGuess.length < word.english.length) {
      vibrateLetterInput();
    }

    addLetter(letter);
    render();
  }
  // Handle backspace
  else if (e.key === 'Backspace') {
    e.preventDefault();

    // Only vibrate if there's something to delete
    if (state.currentGuess.length > 0) {
      vibrateTap();
    }

    removeLetter();
    render();
  }
  // Handle enter
  else if (e.key === 'Enter') {
    // Vibrate invalid if word is incomplete
    if (word && state.currentGuess.length !== word.english.length) {
      vibrateInvalid();
    }

    submitGuess();
    render();
  }
}

// Handle title click to go home
function handleTitleClick() {
  backToTopics();
  render();
}

console.log('✅ Mots loaded successfully!');
