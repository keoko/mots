// Service Worker for Mots - Offline-first PWA
// Version controlled by js/version.js

import { VERSION, getCacheName } from './js/version.js';

const CACHE_NAME = getCacheName();
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
  './js/version.js',
  './favicon.svg',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install event - cache all static assets
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing service worker v${VERSION.app}...`);

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
    caches.match(event.request, { ignoreSearch: true })
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Cache hit - return cached response
          console.log('[SW] Serving from cache:', event.request.url);
          return cachedResponse;
        }

        // Cache miss - try to fetch from network
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
            console.error('[SW] Fetch failed (offline?):', error);
            // When offline and not in cache, return a basic error response
            // This prevents the "offline mode" error page
            return new Response('Offline - resource not cached', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
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
