const CACHE_NAME = 'pick6-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/homepage.html',
  '/dashboard.html',
  '/golfSelection.html',
  '/SurvivorSelection.html',
  '/rules.html',
  '/info.html',
  '/loginStyles.css',
  '/styles.css',
  '/homepage-styles.css',
  '/dashboard-styles-halloween.css',
  '/golfSelection.css',
  '/SurvivorStyles.css',
  '/rules-halloween.css',
  '/login.js',
  '/homepage.js',
  '/dashboard.js',
  '/golfSelection.js',
  '/SurvivorSelection.js',
  '/info.js',
  '/aiP6.png',
  '/favicon.png',
  '/P6.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Failed to cache resources:', error);
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        // For API calls to your backend, always go to network
        if (event.request.url.includes('/api/') || 
            event.request.url.includes('/users/') ||
            event.request.url.includes('/picks/')) {
          return fetch(event.request);
        }
        
        return fetch(event.request);
      })
      .catch(() => {
        // If both cache and network fail, show offline page
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      })
  );
});

// Activate event - clean up old caches
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
});