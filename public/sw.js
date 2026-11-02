// Pitchly Progressive Web App Service Worker
// Production App Shell Caching & Offline Resilience

const CACHE_VERSION = 'v2';
const CACHE_NAME = `pitchly-app-shell-${CACHE_VERSION}`;

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/icon-192.png',
  '/icon-512.png',
  '/pwa-maskable-192x192.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/logo.svg',
];

// Install: precache static app shell assets and activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log(`[SW] Precaching app shell assets (${CACHE_NAME})`);
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Non-fatal precache item fetch issue:', err);
      });
    })
  );
});

// Activate: clean up all outdated cache buckets and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing outdated cache bucket:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event handler
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 1. Never intercept non-GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 2. Never cache Firebase or Firestore API requests or auth tokens
  if (
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit') ||
    url.hostname.includes('securetoken') ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  // 3. Never intercept or cache Vite dev server requests, node_modules, or ais-dev hostnames
  if (
    url.hostname.includes('ais-dev') ||
    url.pathname.includes('/node_modules/') ||
    url.pathname.includes('/@vite') ||
    url.pathname.includes('/@fs') ||
    url.pathname.includes('/@id') ||
    url.search.includes('v=') ||
    url.search.includes('t=')
  ) {
    return;
  }

  const isHashedAsset = url.pathname.startsWith('/assets/');
  const isStaticAppIcon =
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname === '/manifest.json';

  // 4. Cache-first ONLY for immutable hashed assets under /assets/ and static app icons/manifest
  if (isHashedAsset || isStaticAppIcon) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  const isNavigation = request.mode === 'navigate';
  const isScript = request.destination === 'script' || url.pathname.endsWith('.js');

  // 5. Network-first for navigation requests (HTML) and script requests (fall back to cache only when offline)
  if (isNavigation || isScript) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            if (isNavigation) {
              return caches.match('/index.html') || caches.match('/');
            }
            return Promise.reject(new Error('Network unavailable and asset not cached'));
          });
        })
    );
    return;
  }
});
