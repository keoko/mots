// keyboard-layout.test.js - Tests for keyboard layout functions

import {
  splitWordIntoRows,
  buildGuessWithSpaces,
  extractTypeableLetters
} from '../js/keyboard-layout.js';

import {
  suite,
  test,
  assertEquals,
  assertDeepEquals,
  printSummary
} from './test-runner.js';

// Test Suite 1: Non-compound words < 10 chars (single centered row)
suite('Non-compound words (< 10 chars, single centered row)', () => {
  test('single letter word', () => {
    const result = splitWordIntoRows('a');
    assertDeepEquals(result, [
      { chars: ['a'], centered: true }
    ]);
  });

  test('short word - "cat"', () => {
    const result = splitWordIntoRows('cat');
    assertDeepEquals(result, [
      { chars: ['c', 'a', 't'], centered: true }
    ]);
  });

  test('medium word - "elephant"', () => {
    const result = splitWordIntoRows('elephant');
    assertDeepEquals(result, [
      { chars: ['e', 'l', 'e', 'p', 'h', 'a', 'n', 't'], centered: true }
    ]);
  });

  test('exactly 10 chars - "strawberry"', () => {
    const result = splitWordIntoRows('strawberry');
    assertDeepEquals(result, [
      { chars: ['s', 't', 'r', 'a', 'w', 'b', 'e', 'r', 'r', 'y'], centered: true }
    ]);
  });

  test('word with hyphen < 10 chars - "co-op"', () => {
    const result = splitWordIntoRows('co-op');
    assertDeepEquals(result, [
      { chars: ['c', 'o', '-', 'o', 'p'], centered: true }
    ]);
  });

  test('edge case - empty string', () => {
    const result = splitWordIntoRows('');
    assertDeepEquals(result, []);
  });
});

// Test Suite 2: Non-compound words > 10 chars (multi-row, NOT centered)
suite('Non-compound words (> 10 chars, multi-row, NOT centered)', () => {
  test('11 chars - "programming" (2 rows)', () => {
    const result = splitWordIntoRows('programming');
    assertDeepEquals(result, [
      { chars: ['p', 'r', 'o', 'g', 'r', 'a', 'm', 'm', 'i', 'n'], centered: false },
      { chars: ['g'], centered: false }
    ]);
  });

  test('15 chars - "congratulations" (2 rows)', () => {
    const result = splitWordIntoRows('congratulations');
    assertDeepEquals(result, [
      { chars: ['c', 'o', 'n', 'g', 'r', 'a', 't', 'u', 'l', 'a'], centered: false },
      { chars: ['t', 'i', 'o', 'n', 's'], centered: false }
    ]);
  });

  test('20 chars - "antidisestablishment" (2 rows)', () => {
    const result = splitWordIntoRows('antidisestablishment');
    assertDeepEquals(result, [
      { chars: ['a', 'n', 't', 'i', 'd', 'i', 's', 'e', 's', 't'], centered: false },
      { chars: ['a', 'b', 'l', 'i', 's', 'h', 'm', 'e', 'n', 't'], centered: false }
    ]);
  });

  test('21 chars - "counterrevolutionary" (3 rows)', () => {
    const result = splitWordIntoRows('counterrevolutionary');
    assertDeepEquals(result, [
      { chars: ['c', 'o', 'u', 'n', 't', 'e', 'r', 'r', 'e', 'v'], centered: false },
      { chars: ['o', 'l', 'u', 't', 'i', 'o', 'n', 'a', 'r', 'y'], centered: false }
    ]);
  });

  test('word with hyphen > 10 chars - "anti-cellulite"', () => {
    const result = splitWordIntoRows('anti-cellulite');
    assertDeepEquals(result, [
      { chars: ['a', 'n', 't', 'i', '-', 'c', 'e', 'l', 'l', 'u'], centered: false },
      { chars: ['l', 'i', 't', 'e'], centered: false }
    ]);
  });
});

// Test Suite 3: Compound words with spaces (each part centered)
suite('Compound words with spaces (each part centered)', () => {
  test('two short words - "ice cream"', () => {
    const result = splitWordIntoRows('ice cream');
    assertDeepEquals(result, [
      { chars: ['i', 'c', 'e'], centered: true },
      { chars: ['c', 'r', 'e', 'a', 'm'], centered: true }
    ]);
  });

  test('three short words - "red hot pepper"', () => {
    const result = splitWordIntoRows('red hot pepper');
    assertDeepEquals(result, [
      { chars: ['r', 'e', 'd'], centered: true },
      { chars: ['h', 'o', 't'], centered: true },
      { chars: ['p', 'e', 'p', 'p', 'e', 'r'], centered: true }
    ]);
  });

  test('compound with one word > 10 chars - "ice extraordinarily"', () => {
    const result = splitWordIntoRows('ice extraordinarily');
    assertDeepEquals(result, [
      { chars: ['i', 'c', 'e'], centered: true },
      { chars: ['e', 'x', 't', 'r', 'a', 'o', 'r', 'd', 'i', 'n'], centered: true },
      { chars: ['a', 'r', 'i', 'l', 'y'], centered: false }
    ]);
  });

  test('two words with first > 10 chars - "programming language"', () => {
    const result = splitWordIntoRows('programming language');
    assertDeepEquals(result, [
      { chars: ['p', 'r', 'o', 'g', 'r', 'a', 'm', 'm', 'i', 'n'], centered: true },
      { chars: ['g'], centered: false },
      { chars: ['l', 'a', 'n', 'g', 'u', 'a', 'g', 'e'], centered: true }
    ]);
  });

  test('buildGuessWithSpaces - compound word', () => {
    const result = buildGuessWithSpaces('icecream', 'ice cream');
    assertEquals(result, 'ice cream');
  });

  test('buildGuessWithSpaces - partial compound word', () => {
    const result = buildGuessWithSpaces('icec', 'ice cream');
    assertEquals(result, 'ice c');
  });

  test('extractTypeableLetters - compound word', () => {
    const result = extractTypeableLetters('ice cream');
    assertEquals(result, 'icecream');
  });
});

// Test Suite 4: Helper functions
suite('Helper functions', () => {
  test('extractTypeableLetters - simple word', () => {
    const result = extractTypeableLetters('cat');
    assertEquals(result, 'cat');
  });

  test('extractTypeableLetters - word with hyphen', () => {
    const result = extractTypeableLetters('co-op');
    assertEquals(result, 'coop');
  });

  test('extractTypeableLetters - uppercase letters', () => {
    const result = extractTypeableLetters('CAT');
    assertEquals(result, 'cat');
  });

  test('buildGuessWithSpaces - no spaces in target', () => {
    const result = buildGuessWithSpaces('cat', 'cat');
    assertEquals(result, 'cat');
  });

  test('buildGuessWithSpaces - partial guess', () => {
    const result = buildGuessWithSpaces('ca', 'cat');
    assertEquals(result, 'ca');
  });

  test('buildGuessWithSpaces - with hyphen in target', () => {
    const result = buildGuessWithSpaces('coop', 'co-op');
    assertEquals(result, 'co-op');
  });
});

// Run all tests
printSummary();
