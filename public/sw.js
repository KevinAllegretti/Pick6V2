// Import OneSignal service worker functionality FIRST
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

// Install event
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
  self.skipWaiting();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // Always let OneSignal handle its requests
  if (event.request.url.includes('onesignal') || 
      event.request.url.includes('api.onesignal.com') ||
      event.request.url.includes('safari-web.onesignal.com')) {
    return; // Let OneSignal handle these
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        // Always fetch fresh data for API calls
        if (event.request.url.includes('/api/') || 
            event.request.url.includes('/users/') ||
            event.request.url.includes('/picks/')) {
          return fetch(event.request);
        }
        
        return fetch(event.request);
      })
      .catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      })
  );
});

// Activate event
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
  return self.clients.claim();
});

// Enhanced notification click handling for iOS
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification);
  
  event.notification.close();
  
  // Handle different notification actions
  const action = event.action;
  const notificationData = event.notification.data || {};
  
  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          // Focus existing window and navigate if needed
          if ('focus' in client) {
            client.focus();
            
            // Send message to client about the notification
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              data: notificationData,
              action: action
            });
            
            return;
          }
        }
      }
      
      // No existing window, open new one
      if (clients.openWindow) {
        let url = '/';
        
        // Navigate to specific page based on notification data
        if (notificationData.url) {
          url = notificationData.url;
        } else if (notificationData.type === 'game_start') {
          url = '/dashboard.html';
        } else if (notificationData.type === 'pick_result') {
          url = '/dashboard.html';
        }
        
        return clients.openWindow(url);
      }
    })
  );
});

// Enhanced push event handling
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  // OneSignal handles most push events, but we can add custom logic here
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('Push data:', data);
      
      // Custom notification handling if needed
      if (data.custom_type === 'game_reminder') {
        // Handle game reminder notifications
        console.log('Game reminder notification received');
      }
    } catch (error) {
      console.log('Error parsing push data:', error);
    }
  }
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      syncOfflineData()
    );
  }
});

async function syncOfflineData() {
  try {
    // Sync any offline picks or data when connection is restored
    console.log('Syncing offline data...');
    
    // Example: Check for offline picks in IndexedDB and sync them
    // This is where you'd implement your offline data sync logic
    
  } catch (error) {
    console.error('Error syncing offline data:', error);
  }
}