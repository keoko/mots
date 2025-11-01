// keyboard-layout.js - Pure functions for keyboard layout logic
// Handles splitting words into grid rows with proper centering

/**
 * Represents a row of characters in the grid
 * @typedef {Object} WordRow
 * @property {string[]} chars - Array of characters in this row
 * @property {boolean} centered - Whether this row should be centered
 */

/**
 * Split a word into rows for grid display.
 * - Non-compound words < 10 chars: single centered row
 * - Non-compound words >= 10 chars: multiple non-centered rows
 * - Compound words (with spaces): each word part gets its own centered row
 * - Hyphens stay with their words
 *
 * @param {string} word - The word to split
 * @param {number} charsPerRow - Maximum characters per row (default 10)
 * @returns {WordRow[]} Array of row objects with chars and centered flag
 */
export function splitWordIntoRows(word, charsPerRow = 10) {
  // Empty word edge case
  if (!word) {
    return [];
  }

  // If word contains spaces, split at spaces first
  if (word.includes(' ')) {
    const words = word.split(' ');
    const rows = [];

    words.forEach(w => {
      // If this word part (which might contain hyphens) is longer than charsPerRow, split it
      if (w.length > charsPerRow) {
        const chars = w.split('');
        for (let i = 0; i < chars.length; i += charsPerRow) {
          const chunk = chars.slice(i, i + charsPerRow);
          // First chunk of a space-separated word is centered, continuation rows are not
          rows.push({ chars: chunk, centered: i === 0 });
        }
      } else {
        // Whole word fits in one row, center it
        rows.push({ chars: w.split(''), centered: true });
      }
    });

    return rows;
  }

  // Non-compound word (may contain hyphens)
  const chars = word.split('');

  // If it fits in one row, center it
  if (chars.length <= charsPerRow) {
    return [{ chars, centered: true }];
  }

  // Otherwise, split into multiple non-centered rows
  const rows = [];
  for (let i = 0; i < chars.length; i += charsPerRow) {
    const chunk = chars.slice(i, i + charsPerRow);
    rows.push({ chars: chunk, centered: false });
  }

  return rows;
}

/**
 * Build a guess string with auto-inserted spaces based on target word structure.
 * Takes only the letters typed and inserts spaces where they exist in the target.
 *
 * @param {string} letters - The letters typed (no spaces)
 * @param {string} targetWord - The target word (may contain spaces)
 * @returns {string} The guess with spaces inserted in correct positions
 */
export function buildGuessWithSpaces(letters, targetWord) {
  let newGuess = '';
  let letterIndex = 0;

  for (let i = 0; i < targetWord.length && letterIndex < letters.length; i++) {
    if (targetWord[i] === ' ') {
      newGuess += ' ';
    } else if (targetWord[i] === '-') {
      newGuess += '-';
    } else {
      newGuess += letters[letterIndex];
      letterIndex++;
    }
  }

  return newGuess;
}

/**
 * Extract only the typeable letters from a word (no spaces or hyphens).
 *
 * @param {string} word - The word to extract letters from
 * @returns {string} Only the letters (lowercase)
 */
export function extractTypeableLetters(word) {
  return word.replace(/[^a-zA-Z]/g, '').toLowerCase();
}
