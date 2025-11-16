#!/usr/bin/env node

/**
 * bump-version.js - Automatically bump patch version across all project files
 *
 * Usage:
 *   node bump-version.js        # Bumps patch version (1.0.63 -> 1.0.64)
 *   node bump-version.js minor  # Bumps minor version (1.0.63 -> 1.1.0)
 *   node bump-version.js major  # Bumps major version (1.0.63 -> 2.0.0)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');

// Files that need version updates
const FILES_TO_UPDATE = [
  'package.json',
  'manifest.json',
  'sw.js'
];

function readJsonFile(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  return JSON.parse(content);
}

function writeJsonFile(filepath, data) {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function bumpVersion(version, type = 'patch') {
  const [major, minor, patch] = version.split('.').map(Number);

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

function updatePackageJson(newVersion) {
  const filepath = path.join(PROJECT_ROOT, 'package.json');
  const pkg = readJsonFile(filepath);
  pkg.version = newVersion;
  writeJsonFile(filepath, pkg);
  console.log(`✓ Updated package.json to ${newVersion}`);
}

function updateManifestJson(newVersion) {
  const filepath = path.join(PROJECT_ROOT, 'manifest.json');
  const manifest = readJsonFile(filepath);
  manifest.version = newVersion;
  writeJsonFile(filepath, manifest);
  console.log(`✓ Updated manifest.json to ${newVersion}`);
}

function updateServiceWorker(newVersion) {
  const filepath = path.join(PROJECT_ROOT, 'sw.js');
  let content = fs.readFileSync(filepath, 'utf8');

  // Replace the VERSION constant
  content = content.replace(
    /const VERSION = '[^']+'/,
    `const VERSION = '${newVersion}'`
  );

  fs.writeFileSync(filepath, content, 'utf8');
  console.log(`✓ Updated sw.js to ${newVersion}`);
}

function gitCommitAndPush(newVersion) {
  try {
    console.log('\n📝 Committing changes...');

    // Git add files
    execSync(`git add ${FILES_TO_UPDATE.join(' ')}`, { stdio: 'inherit' });
    console.log(`✓ Added files to git`);

    // Git commit
    execSync(`git commit -m "release: ${newVersion}"`, { stdio: 'inherit' });
    console.log(`✓ Committed with message: "release: ${newVersion}"`);

    // Git push
    execSync('git push', { stdio: 'inherit' });
    console.log(`✓ Pushed to remote`);

  } catch (error) {
    console.error('❌ Git operation failed:', error.message);
    process.exit(1);
  }
}

function main() {
  const bumpType = process.argv[2] || 'patch';

  if (!['major', 'minor', 'patch'].includes(bumpType)) {
    console.error('❌ Invalid bump type. Use: major, minor, or patch');
    process.exit(1);
  }

  // Read current version from package.json
  const pkg = readJsonFile(path.join(PROJECT_ROOT, 'package.json'));
  const currentVersion = pkg.version;
  const newVersion = bumpVersion(currentVersion, bumpType);

  console.log(`\n🚀 Bumping version: ${currentVersion} → ${newVersion} (${bumpType})\n`);

  // Update all files
  updatePackageJson(newVersion);
  updateManifestJson(newVersion);
  updateServiceWorker(newVersion);

  // Commit and push changes
  gitCommitAndPush(newVersion);

  console.log(`\n✅ Version ${newVersion} released successfully!\n`);
}

main();
