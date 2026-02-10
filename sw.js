const CACHE_NAME = 'zentiles-v3';
const STATIC_ASSETS = [
  './',
  './index.html',
  './favicon.png',
  './zentiles-app.js',
  './themes/theme-config.js',
  './themes/audio-controller.js',
  './themes/theme-manager.js',
  './assets/audio/meditation-yoga-relaxing-music.mp3',
  './assets/audio/river_and_birds.mp3',
  './assets/audio/sea_waves.mp3',
  './assets/audio/lunar_new_year.mp3',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install: cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) return caches.delete(name);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: serve from cache, falling back to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  // Skip external resources (e.g., Google Fonts)
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) return response;
        // Not in cache: fetch and cache
        return fetch(event.request).then(response => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') return response;
          // IMPORTANT: Clone the response. A response is a stream
          // and because we want the browser to consume the response
          // as well as the cache consuming the response, we need
          // to clone it so we have two streams.
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
          return response;
        });
      })
  );
});
