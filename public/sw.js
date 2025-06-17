// Import OneSignal service worker functionality
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

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
  console.log('Service Worker installing...');
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
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Let OneSignal handle its own requests
  if (event.request.url.includes('onesignal') || 
      event.request.url.includes('api.onesignal.com')) {
    return; // Let OneSignal handle these
  }

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
  console.log('Service Worker activating...');
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
  // Claim all clients immediately
  return self.clients.claim();
});

// Optional: Handle notification clicks (customize as needed)
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  // Navigate to your app when notification is clicked
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

// Optional: Background sync for offline functionality
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Add your background sync logic here
      // For example, sync offline picks when connection is restored
      console.log('Performing background sync...')
    );
  }
});