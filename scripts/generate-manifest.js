#!/usr/bin/env node
// generate-manifest.js - Generate manifest.json from package.json version
// Run this before deploying: node generate-manifest.js

import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');

// Read version from package.json
const pkg = JSON.parse(readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));
const VERSION = pkg.version;

const manifest = {
  "name": "Mots - FAR Vocabulary Trainer",
  "short_name": "Mots",
  "version": VERSION,
  "description": "Learn English vocabulary for FAR students with an interactive word game",
  "lang": "en",
  "start_url": "./",
  "display": "standalone",
  "background_color": "#f8fafc",
  "theme_color": "#6366f1",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "assets/icons/favicon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any"
    },
    {
      "src": "assets/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "assets/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["education", "games"],
  "screenshots": []
};

writeFileSync(path.join(PROJECT_ROOT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`✅ Generated manifest.json with version ${VERSION}`);
