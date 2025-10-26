#!/usr/bin/env node
// bump-version.js - Automatically bump the patch version

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

// Read current version
const versionPath = './js/version.js';
const content = readFileSync(versionPath, 'utf-8');

// Extract current version
const versionMatch = content.match(/app:\s*'(\d+)\.(\d+)\.(\d+)'/);
if (!versionMatch) {
  console.error('❌ Could not find version in version.js');
  process.exit(1);
}

const [, major, minor, patch] = versionMatch;
const newPatch = parseInt(patch) + 1;
const newVersion = `${major}.${minor}.${newPatch}`;

// Get current date
const buildDate = new Date().toISOString().split('T')[0];

// Get current git commit (short hash)
let gitCommit = 'unknown';
try {
  gitCommit = execSync('git rev-parse --short HEAD').toString().trim();
} catch (e) {
  console.warn('⚠️  Could not get git commit hash');
}

// Update version.js
const newContent = content
  .replace(/app:\s*'[^']+'/g, `app: '${newVersion}'`)
  .replace(/buildDate:\s*'[^']+'/g, `buildDate: '${buildDate}'`)
  .replace(/gitCommit:\s*'[^']+'/g, `gitCommit: '${gitCommit}'`);

writeFileSync(versionPath, newContent);

console.log(`✅ Version bumped: ${major}.${minor}.${patch} → ${newVersion}`);
console.log(`📅 Build date: ${buildDate}`);
console.log(`🔗 Git commit: ${gitCommit}`);
