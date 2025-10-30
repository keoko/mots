// Service Worker for Mots - Offline-first PWA
// Version is automatically read from package.json

const VERSION = '0.0.64';
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
  './js/version.js',
  './favicon.svg',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install event - cache all static assets
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing service worker v${VERSION}...`);

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Opened cache, adding assets...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('[SW] ✅ All assets cached successfully');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[SW] ❌ Failed to cache assets:', error);
        throw error;
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim(); // Take control immediately
      })
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
    self.skipWaiting();
  }
});
