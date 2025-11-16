#!/usr/bin/env node
// generate-manifest.js - Generate manifest.json from version.js
// Run this before deploying: node generate-manifest.js

import { readFileSync, writeFileSync } from 'fs';
import { VERSION } from './js/version.js';

const manifest = {
  "name": "Mots - FAR Vocabulary Trainer",
  "short_name": "Mots",
  "version": VERSION.app,
  "description": "Learn English vocabulary for FAR students with an interactive word game",
  "start_url": "/",
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

writeFileSync('manifest.json', JSON.stringify(manifest, null, 2));
console.log(`✅ Generated manifest.json with version ${VERSION.app}`);
