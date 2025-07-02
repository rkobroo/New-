const CACHE_NAME = 'vkrdownloader-cache-v1'; // Versioned cache name
const urlsToCache = [
  '/',
  '/VKrDownloader/',
  '/VKrDownloader/index.html',
  '/VKrDownloader/dark.html',
  '/VKrDownloader/manifest.webmanifest',
  '/VKrDownloader/logo.png',
  '/VKrDownloader/style.css',
  '/VKrDownloader/dark.css',
  '/VKrDownloader/javascript.js'
];

// Install event: Cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache:', CACHE_NAME);
      return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })))
        .then(() => self.skipWaiting()) // Activate immediately
        .catch((error) => {
          console.error('Cache addAll failed:', error);
        });
    })
  );
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
    }).then(() => self.clients.claim()) // Take control of all clients
  );
});

// Fetch event: Cache-first with fallback to network
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return; // Ignore non-GET requests (e.g., POST for downloads)
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('Serving from cache:', event.request.url);
        return cachedResponse;
      }

      // Clone the request to avoid consuming it
      const fetchRequest = event.request.clone();
      return fetch(fetchRequest).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Clone the response to cache it
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
          console.log('Cached new response:', event.request.url);
        });

        return networkResponse;
      }).catch((error) => {
        console.error('Fetch failed:', error);
        // Optionally return a fallback (e.g., offline page) here
        return caches.match('/VKrDownloader/index.html'); // Fallback to index.html
      });
    })
  );
});
