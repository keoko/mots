// data.js - Word collections organized by topic

// Note: Import data files at the top - conditional imports don't work with ES6 modules
import { topics as testTopics } from './data.test.js';
import { topics as devTopics } from './data.dev.js';

// Check URL parameters for different data modes
const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
const isTestMode = urlParams?.get('test') === 'true';
const isDevMode = urlParams?.get('dev') === 'true';

// Select appropriate data based on mode
let loadedTopics;
if (isTestMode) {
  // Test mode: minimal predictable data for E2E tests
  loadedTopics = testTopics;
} else if (isDevMode) {
  // Dev mode: small dataset with various word lengths for development
  loadedTopics = devTopics;
} else {
  // Production mode: full vocabulary dataset
  loadedTopics = [
  {
    id: 'cosmetics',
    name: 'Cosmetics',
    emoji: '💄',
    words: [
      { ca: 'bàlsam labial', en: 'lip balm' },
      { ca: 'gloss labial', en: 'lip gloss' },
      { ca: 'crema de dia', en: 'day cream' },
      { ca: 'crema anticel·lulítica', en: 'anti-cellulite cream' },
      { ca: 'desodorant', en: 'deodorant' },
      { ca: 'raspall de cabell', en: 'hairbrush' },
      { ca: 'cera per cabell', en: 'hair wax' },
      { ca: 'tint de cabell', en: 'hair colouring' },
      { ca: 'cotó fluix', en: 'cotton wool' },
      { ca: 'esmalt d\'ungles', en: 'nail varnish' },
      { ca: 'tisores d\'ungles', en: 'nail scissors' },
      { ca: 'maquillatge', en: 'make-up' },
      { ca: 'pintallavis', en: 'lipstick' },
      { ca: 'ombra d\'ulls', en: 'eyeshadow' },
      { ca: 'llapis d\'ulls', en: 'eyeliner' },
      { ca: 'rímel', en: 'mascara' },
      { ca: 'coloret', en: 'blusher' },
      { ca: 'pólvores facials', en: 'face powder' },
      { ca: 'llet netejadora', en: 'cleansing milk' },
      { ca: 'crema bronzejadora', en: 'suntan lotion' },
      { ca: 'protecció solar', en: 'sun protection' },
      { ca: 'clivellat', en: 'cracked heel cream' }
    ]
  },
  {
    id: 'infancy',
    name: 'Infancy',
    emoji: '🍼',
    words: [
      { ca: 'bolquer', en: 'nappy' },
      { ca: 'crema pel bolquer', en: 'nappy cream' },
      { ca: 'eritema del bolquer', en: 'nappy rash' },
      { ca: 'gatejar', en: 'to crawl' },
      { ca: 'polls', en: 'lice' },
      { ca: 'llémena', en: 'nit' },
      { ca: 'oli de rosa mosqueta', en: 'wild rose oil' },
      { ca: 'conjuntivitis', en: 'conjunctivitis' },
      { ca: 'tovalloletes humides', en: 'baby wipes' },
      { ca: 'pólvores de talc', en: 'talcum powder' },
      { ca: 'xumet', en: 'pacifier' },
      { ca: 'xumet', en: 'dummy' },
      { ca: '"potito"', en: 'baby food' },
      { ca: 'biberó', en: 'baby\'s bottle' },
      { ca: 'biberó', en: 'feeding bottle' },
      { ca: 'loció antipolls', en: 'anti-lice lotion' },
      { ca: 'xampú antipolls', en: 'anti-lice shampoo' },
      { ca: 'pinta per llémenes', en: 'nit comb' },
      { ca: 'tetina', en: 'teat' },
      { ca: 'poll', en: 'louse' }
    ]
  },
  {
    id: 'pregnancy',
    name: 'Pregnancy/Menstruation',
    emoji: '🤰',
    words: [
      { ca: 'tampons', en: 'tampons' },
      { ca: 'compresses', en: 'sanitary towels' },
      { ca: 'salvaslips', en: 'panty liners' },
      { ca: 'preservatiu', en: 'condom' },
      { ca: 'DIU', en: 'IUD' },
      { ca: 'diafragma', en: 'diaphragm' },
      { ca: 'píndola anticonceptiva', en: 'oral contraceptive pill' },
      { ca: 'suplement vitamínic', en: 'vitamin supplement' },
      { ca: 'test d\'embaràs', en: 'pregnancy test' },
      { ca: 'crema antiestries', en: 'stretch mark cream' },
      { ca: 'crema per mugrons', en: 'nipple cream' },
      { ca: 'protector de mugrons', en: 'nipple shield' },
      { ca: 'extractor de llet', en: 'breast pump' }
    ]
  },
  {
    id: 'toiletries',
    name: 'Toiletries',
    emoji: '🧴',
    words: [
      { ca: 'gel de dutxa', en: 'shower gel' },
      { ca: 'sabó', en: 'soap' },
      { ca: 'xampú anticaspa', en: 'anti-dandruff shampoo' },
      { ca: 'condicionador', en: 'conditioner' },
      { ca: 'pedra "pomez"', en: 'pumice stone' },
      { ca: 'escuma d\'afaitar', en: 'shaving foam' },
      { ca: 'loció per després d\'afaitar', en: 'aftershave' },
      { ca: 'raspall de dents', en: 'toothbrush' },
      { ca: 'pasta de dents', en: 'toothpaste' },
      { ca: 'fil dental', en: 'dental floss' },
      { ca: 'col·lutori', en: 'mouthwash' },
      { ca: 'dentadura postissa', en: 'denture' }
    ]
  }
];
}

export const topics = loadedTopics;
