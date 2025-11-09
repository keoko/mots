// Service Worker for Mots - Offline-first PWA
//
// IMPORTANT: When bumping the version in package.json, also update VERSION below
// This ensures the service worker cache is properly invalidated
// The app.js registration uses ?v=X.X.X query parameter to force browser to check for updates

const VERSION = '0.0.79';
const CACHE_NAME = `mots-v${VERSION}`;

// Error handler for unhandled errors
self.addEventListener('error', (event) => {
  console.error('[SW] Unhandled error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
});
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './help.html',
  './css/styles.css',
  './js/app.js',
  './js/ui.js',
  './js/game.js',
  './js/data.js',
  './js/storage.js',
  './favicon.svg',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

const addResourcesToCache = async (resources) => {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(resources);
};

// Install event - cache all static assets
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing service worker v${VERSION}...`);

  event.waitUntil(
    (async () => {
      try {
        await addResourcesToCache(ASSETS_TO_CACHE);
        console.log(`[SW] All assets cached successfully for v${VERSION}`);
        // Skip waiting to activate immediately (will be controlled by message handler)
        // Don't auto-skip - let the app control when to update
      } catch (error) {
        console.error('[SW] Failed to cache assets:', error);
        throw error;
      }
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating service worker v${VERSION}...`);

  event.waitUntil(
    (async () => {
      try {
        // Delete all caches that don't match current version
        const cacheNames = await caches.keys();
        const deletionPromises = cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => {
            console.log(`[SW] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          });

        await Promise.all(deletionPromises);

        if (deletionPromises.length > 0) {
          console.log(`[SW] Cleaned up ${deletionPromises.length} old cache(s)`);
        }

        // Take control of all clients immediately
        await self.clients.claim();
        console.log(`[SW] Service worker v${VERSION} activated and claimed clients`);
      } catch (error) {
        console.error('[SW] Activation error:', error);
        throw error;
      }
    })()
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // Try cache first
        const cachedResponse = await caches.match(event.request, { ignoreSearch: true });
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', event.request.url);
          return cachedResponse;
        }

        // Cache miss - try network
        console.log('[SW] Fetching from network:', event.request.url);
        try {
          const networkResponse = await fetch(event.request);

          // Cache successful responses
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
          }

          return networkResponse;
        } catch (fetchError) {
          console.error('[SW] Fetch failed:', fetchError);
          // Return offline response
          return new Response('Offline - resource not cached', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      } catch (error) {
        console.error('[SW] Cache operation failed:', error);
        // Try to fetch anyway
        return fetch(event.request).catch(() => {
          return new Response('Error loading resource', {
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      }
    })()
  );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log(`[SW] Received SKIP_WAITING message, activating v${VERSION}...`);
    self.skipWaiting();
  }
});
