// version.js - App version and diagnostic information
// This is the single source of truth for version information

export const VERSION = {
  app: '1.0.6',
  buildDate: '2025-10-26',
  gitCommit: 'b369e03'
};

// Generate cache name for service worker
export function getCacheName() {
  return `mots-v${VERSION.app}`;
}

// Get diagnostic information for troubleshooting
export async function getDiagnosticInfo() {
  const info = {
    // Version info
    appVersion: VERSION.app,
    buildDate: VERSION.buildDate,
    gitCommit: VERSION.gitCommit,

    // Service Worker
    serviceWorkerActive: !!navigator.serviceWorker?.controller,
    serviceWorkerVersion: await getServiceWorkerVersion(),

    // Browser/Environment
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    online: navigator.onLine,
    language: navigator.language,

    // Screen
    screenSize: `${window.screen.width}x${window.screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,

    // Storage
    storageEstimate: await getStorageEstimate(),

    // App state
    localStorageKeys: getLocalStorageInfo(),

    // Timestamp
    timestamp: new Date().toISOString()
  };

  return info;
}

// Get service worker version from cache name
async function getServiceWorkerVersion() {
  try {
    if (!('caches' in window)) return 'Not supported';

    const cacheNames = await caches.keys();
    const motsCaches = cacheNames.filter(name => name.startsWith('mots-'));
    return motsCaches.length > 0 ? motsCaches[0] : 'No cache found';
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

// Get storage usage estimate
async function getStorageEstimate() {
  try {
    if (!navigator.storage?.estimate) return 'Not supported';

    const estimate = await navigator.storage.estimate();
    const usedMB = (estimate.usage / 1024 / 1024).toFixed(2);
    const quotaMB = (estimate.quota / 1024 / 1024).toFixed(2);

    return {
      used: `${usedMB} MB`,
      quota: `${quotaMB} MB`,
      percentage: `${((estimate.usage / estimate.quota) * 100).toFixed(1)}%`
    };
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

// Get localStorage info
function getLocalStorageInfo() {
  try {
    const keys = Object.keys(localStorage);
    const motsKeys = keys.filter(k => k.startsWith('mots_'));

    return {
      total: keys.length,
      motsRelated: motsKeys.length,
      keys: motsKeys
    };
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

// Format diagnostic info as readable text
export function formatDiagnosticInfo(info) {
  return `
=== Mots Diagnostic Info ===

Version: ${info.appVersion}
Build Date: ${info.buildDate}
Git Commit: ${info.gitCommit}
Service Worker: ${info.serviceWorkerActive ? 'Active' : 'Inactive'} (${info.serviceWorkerVersion})

Browser: ${info.userAgent}
Platform: ${info.platform}
Language: ${info.language}
Online: ${info.online ? 'Yes' : 'No'}

Screen: ${info.screenSize}
Viewport: ${info.viewportSize}

Storage Used: ${info.storageEstimate.used} / ${info.storageEstimate.quota} (${info.storageEstimate.percentage})

LocalStorage Keys: ${info.localStorageKeys.total} total, ${info.localStorageKeys.motsRelated} Mots-related
Keys: ${info.localStorageKeys.keys.join(', ')}

Generated: ${info.timestamp}
`.trim();
}
