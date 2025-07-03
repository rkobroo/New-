// Cache name (versioned for updates)
const CACHE_NAME = 'vkrdownloader-cache-v4';

// Assets to cache (update with your actual file paths)
const urlsToCache = [
  '/', // Root
  '/index.html', // Main HTML
  '/manifest.webmanifest', // Web manifest
  '/logo.png', // Logo
  '/css/styles.css', // CSS for animations
  '/js/script.js', // JS for results
  '/images/loader.png', // Optional image for UI
  // Add other assets (e.g., '/files/file1.zip') if needed
];

// Install event: Cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching assets:', urlsToCache);
      return cache.addAll(urlsToCache).catch((error) => {
        console.error('Cache failed:', error);
      });
    })
  );
  self.skipWaiting(); // Activate immediately
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
  self.clients.claim(); // Take control immediately
});

// Fetch event: Serve cached assets or fetch from network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('Serving from cache:', event.request.url);
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.ok) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }
        return networkResponse;
      }).catch(() => {
        console.error('Fetch failed:', event.request.url);
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html'); // Fallback for page loads
        }
        return new Response('Offline: Resource unavailable', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      });
    })
  );
});
