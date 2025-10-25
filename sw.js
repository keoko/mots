// Service Worker for Mots - Offline-first PWA
// Version 1.0.1

const CACHE_NAME = 'mots-v1.0.1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/ui.js',
  './js/game.js',
  './js/data.js',
  './js/storage.js',
  './js/haptics.js',
  './favicon.svg',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install event - cache all static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('[SW] All assets cached');
        return self.skipWaiting(); // Activate immediately
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
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Cache hit - return cached response
          console.log('[SW] Serving from cache:', event.request.url);
          return cachedResponse;
        }

        // Cache miss - fetch from network
        console.log('[SW] Fetching from network:', event.request.url);
        return fetch(event.request)
          .then((networkResponse) => {
            // Don't cache non-successful responses
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone the response (can only be consumed once)
            const responseToCache = networkResponse.clone();

            // Add to cache for future use
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          })
          .catch((error) => {
            console.error('[SW] Fetch failed:', error);
            // Could return a custom offline page here
            throw error;
          });
      })
  );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
