// data.test.js - Test fixture data for E2E tests
// This provides predictable, minimal data for testing

export const topics = [
  {
    id: 'test-animals',
    name: 'Test Animals',
    emoji: '🐱',
    words: [
      { ca: 'gat', en: 'cat' },
      { ca: 'gos', en: 'dog' },
      { ca: 'ocell', en: 'bird' }
    ]
  },
  {
    id: 'test-numbers',
    name: 'Test Numbers',
    emoji: '🔢',
    words: [
      { ca: 'un', en: 'one' },
      { ca: 'dos', en: 'two' },
      { ca: 'tres', en: 'three' }
    ]
  },
  {
    id: 'test-phrases',
    name: 'Test Phrases',
    emoji: '💬',
    words: [
      { ca: 'bon dia', en: 'good morning' },
      { ca: 'moltes gràcies', en: 'thank you very much' }
    ]
  }
];
