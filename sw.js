// ============================================================
//  TEMPURA POTATO — Service Worker (sw.js)
//  PWA caching for offline support
// ============================================================

const CACHE_NAME = 'tempura-potato-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/checkout.html',
  '/tracking.html',
  '/rider.html',
  '/style.css',
  '/core.js',
  '/manifest.json',
];

// INSTALL — cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => console.warn('Cache install error:', err));
    })
  );
  self.skipWaiting();
});

// ACTIVATE — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// FETCH — network first, cache fallback
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  // Skip Firebase requests
  if (event.request.url.includes('firebase') || event.request.url.includes('google')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => {
        if (cached) return cached;
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      }))
  );
});

// PUSH NOTIFICATIONS (future use)
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'Tempura Potato', {
      body: data.body || 'You have a new notification',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'tp-notification',
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
