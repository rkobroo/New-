// Cache name (versioned for updates)
const CACHE_NAME = 'vkrdownloader-cache-v7';

// Assets to cache (update with your actual file paths)
const urlsToCache = [
  '/', // Root
  '/index.html', // Main HTML
  '/manifest.webmanifest', // Web manifest
  '/logo.png', // Logo
  '/css/styles.css', // CSS for animations and styling
  '/js/script.js', // JS for results and URL processing
  '/images/loader.png', // Loading animation image
  '/images/test-video-thumbnail.jpg', // Thumbnail
  '/files/test-video-360p.mp4', // Downloadable files
  '/files/test-video-720p.mp4',
  '/files/test-video.mp3',
  // Add other assets as needed
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
      // Allow network fetch but fall back to cache for specific file types
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.ok) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }
        return caches.match(event.request) || new Response('Offline: Resource unavailable', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      }).catch(() => {
        console.error('Fetch failed:', event.request.url);
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html'); // Fallback for page loads
        }
        return caches.match(event.request) || new Response('Offline: Resource unavailable', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      });
    })
  );
});
