// app.js - Main application entry point

import { render } from './ui.js';
import { addLetter, removeLetter, submitGuess } from './game.js';

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 Mots - Starting game...');

  // Initial render
  render();

  // Add keyboard support for play mode
  document.addEventListener('keydown', handleKeyboardInput);
});

// Handle keyboard input
function handleKeyboardInput(e) {
  // Only handle letter keys (a-z)
  if (e.key.length === 1 && /[a-z]/i.test(e.key)) {
    const letter = e.key.toLowerCase();
    addLetter(letter);
    render();
  }
  // Handle backspace
  else if (e.key === 'Backspace') {
    e.preventDefault();
    removeLetter();
    render();
  }
  // Handle enter
  else if (e.key === 'Enter') {
    submitGuess();
    render();
  }
}

console.log('✅ Mots loaded successfully!');
