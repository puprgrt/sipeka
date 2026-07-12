const isDev = self.location.hostname === 'localhost' || 
              self.location.hostname === '127.0.0.1' || 
              self.location.hostname.includes('ais-dev');

if (isDev) {
  self.addEventListener('install', (event) => {
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => caches.delete(cache))
        );
      }).then(() => self.clients.claim())
    );
  });

  self.addEventListener('fetch', (event) => {
    // No-op in dev to let network requests bypass the service worker completely
  });
} else {
  const CACHE_NAME = 'teknis-offline-cache-v1';
  const API_CACHE_NAME = 'teknis-api-cache-v1';

  const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/src/main.tsx',
    '/src/index.css'
  ];

  // Install Event - Pre-cache minimal assets
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[Service Worker] Pre-caching offline fallbacks');
        return cache.addAll(STATIC_ASSETS);
      }).then(() => self.skipWaiting())
    );
  });

  // Activate Event - Clean up old caches
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME && cache !== API_CACHE_NAME) {
              console.log('[Service Worker] Clearing old cache', cache);
              return caches.delete(cache);
            }
          })
        );
      }).then(() => self.clients.claim())
    );
  });

  // Fetch Event - Dynamic caching and offline support
  self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests and browser extensions
    if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) {
      return;
    }

    // Handle SPA Navigation requests (e.g. /list, /form) by serving cached index.html
    if (event.request.mode === 'navigate') {
      event.respondWith(
        fetch(event.request).catch(() => {
          return caches.match('/') || caches.match('/index.html');
        })
      );
      return;
    }

    // Handle specific config APIs needed to load the assessment form offline
    const isConfigApi = url.pathname.startsWith('/api/components') ||
                        url.pathname.startsWith('/api/building-parameters') ||
                        url.pathname.startsWith('/api/dinas') ||
                        url.pathname.startsWith('/api/pengaturan-surat') ||
                        url.pathname.startsWith('/api/katalog');

    if (isConfigApi) {
      // Network-First Strategy for form configuration APIs
      event.respondWith(
        fetch(event.request)
          .then((response) => {
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(API_CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            return caches.match(event.request).then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Return an empty array as fallback JSON if nothing is cached
              return new Response(JSON.stringify([]), {
                headers: { 'Content-Type': 'application/json' }
              });
            });
          })
      );
      return;
    }

    // Stale-While-Revalidate Strategy for other static assets (js, css, images, webfonts)
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Silent catch to handle offline fetch failures gracefully
          });

        return cachedResponse || fetchPromise;
      })
    );
  });
}
