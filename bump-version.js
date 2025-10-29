#!/usr/bin/env node
// bump-version.js - Automatically bump the patch version
// This syncs version across js/version.js, sw.js, and manifest.json

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

// Read current version from version.js (single source of truth)
const versionPath = './js/version.js';
const content = readFileSync(versionPath, 'utf-8');

// Extract current version
const versionMatch = content.match(/app:\s*'([^']+)'/);
if (!versionMatch) {
  console.error('❌ Could not find version in version.js');
  process.exit(1);
}

const currentVersion = versionMatch[1];
const parts = currentVersion.match(/(\d+)\.(\d+)\.(\d+)/);
if (!parts) {
  console.error('❌ Invalid version format in version.js');
  process.exit(1);
}

const [, major, minor, patch] = parts;
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

// Update sw.js (can't use ES6 imports, so we inline the version)
const swPath = './sw.js';
const swContent = readFileSync(swPath, 'utf-8');
const newSwContent = swContent.replace(
  /const VERSION = '[^']+';/,
  `const VERSION = '${newVersion}';`
);
writeFileSync(swPath, newSwContent);

// Update manifest.json
try {
  execSync('node generate-manifest.js', { stdio: 'inherit' });
} catch (e) {
  console.warn('⚠️  Could not generate manifest.json');
}

console.log(`✅ Version bumped: ${currentVersion} → ${newVersion}`);
console.log(`📅 Build date: ${buildDate}`);
console.log(`🔗 Git commit: ${gitCommit}`);
console.log(`✅ Updated: js/version.js, sw.js, manifest.json`);
