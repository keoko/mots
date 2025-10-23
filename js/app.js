// app.js - Main application entry point

import { render } from './ui.js';

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

    // Find the button and click it
    const button = document.querySelector(`[data-letter="${letter}"]`);
    if (button && !button.disabled) {
      button.click();
    }
  }
}

console.log('✅ Mots loaded successfully!');
