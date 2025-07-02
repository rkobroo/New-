// Define the cache name (versioned for updates)
const CACHE_NAME = 'vkrdownloader-cache-v2';

// List of assets to cache
// Update this with all files needed for your app
const urlsToCache = [
  '/', // Root of your app
  '/index.html', // Main HTML file
  '/manifest.webmanifest', // Web manifest
  '/logo.png', // Logo
  '/styles.css', // Add your CSS file (adjust path if needed)
  '/script.js', // Add your main JavaScript file (adjust path if needed)
  '/images/icon.png', // Add images used for animations or UI
  // Add other static assets (e.g., additional CSS, JS, fonts, images)
];

// Install event: Cache the specified assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching app assets');
      return cache.addAll(urlsToCache).catch((error) => {
        console.error('Cache failed:', error);
      });
    })
  );
  // Force the Service Worker to activate immediately
  self.skipWaiting();
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of clients immediately
  self.clients.claim();
});

// Fetch event: Cache-first strategy for all requests
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      // Fetch from network if not in cache
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.ok) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for offline navigation (return index.html)
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Offline: Resource not available', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      });
    })
  );
});
