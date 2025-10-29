// data.dev.js - Minimal development data for faster iteration
// This provides a small dataset with various word lengths for development

export const topics = [
  {
    id: 'dev-short',
    name: 'Short Words',
    emoji: '🔤',
    words: [
      { ca: 'gat', en: 'cat' },
      { ca: 'gos', en: 'dog' },
      { ca: 'casa', en: 'house' }
    ]
  },
  {
    id: 'dev-medium',
    name: 'Medium Words',
    emoji: '📝',
    words: [
      { ca: 'ordinador', en: 'computer' },
      { ca: 'telèfon', en: 'telephone' }
    ]
  },
  {
    id: 'dev-long',
    name: 'Long Words',
    emoji: '📏',
    words: [
      { ca: 'crema anticel·lulítica', en: 'anti-cellulite cream' },
      { ca: 'rentadora de plats', en: 'dishwasher' }
    ]
  },
  {
    id: 'dev-phrases',
    name: 'Multi-word Phrases',
    emoji: '💬',
    words: [
      { ca: 'bon dia', en: 'good morning' },
      { ca: 'moltes gràcies', en: 'thank you very much' }
    ]
  }
];
