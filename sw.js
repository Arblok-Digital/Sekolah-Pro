// ══════════════════════════════════════
//  SEKOLAH PRO — Service Worker v2.0
//  by Arblok Digital
//  Strategy: Network First + Offline Fallback
// ══════════════════════════════════════

const APP_NAME    = 'sekolah-pro';
const CACHE_VER   = 'v2';
const CACHE_STATIC = `${APP_NAME}-static-${CACHE_VER}`;
const CACHE_DYN    = `${APP_NAME}-dynamic-${CACHE_VER}`;

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
];

// ─── INSTALL ────────────────────────────────
self.addEventListener('install', event => {
  console.log(`[SW] Installing ${APP_NAME} ${CACHE_VER}...`);
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => {
        console.log('[SW] Pre-cache complete.');
        return self.skipWaiting();
      })
      .catch(err => {
        console.warn('[SW] Pre-cache warning:', err.message);
        return self.skipWaiting();
      })
  );
});

// ─── ACTIVATE ───────────────────────────────
self.addEventListener('activate', event => {
  console.log(`[SW] Activating ${CACHE_VER}...`);
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(k => k.startsWith(APP_NAME) && k !== CACHE_STATIC && k !== CACHE_DYN)
          .map(k => {
            console.log('[SW] Deleting stale cache:', k);
            return caches.delete(k);
          })
      );
    }).then(() => {
      console.log('[SW] Activated. Claiming clients...');
      return self.clients.claim();
    })
  );
});

// ─── FETCH: Network First ────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // Skip external APIs
  const skipHosts = ['googleapis.com','google.com','gstatic.com','wa.me','api.whatsapp.com'];
  if (skipHosts.some(h => url.hostname.includes(h))) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({error:'offline'}), {
          status: 503, headers: {'Content-Type':'application/json'}
        })
      )
    );
    return;
  }

  // Network First for all local resources
  event.respondWith(
    fetch(request)
      .then(networkRes => {
        if (networkRes && networkRes.ok) {
          const clone = networkRes.clone();
          caches.open(CACHE_STATIC).then(cache => cache.put(request, clone));
        }
        return networkRes;
      })
      .catch(() => {
        return caches.match(request).then(cached => {
          if (cached) return cached;
          if (request.destination === 'document' || request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return new Response('Offline', { status: 503, headers: {'Content-Type':'text/plain'} });
        });
      })
  );
});

// ─── MESSAGES ───────────────────────────────
self.addEventListener('message', event => {
  if (!event.data) return;
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'GET_VERSION':
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ version: CACHE_VER, app: APP_NAME });
      }
      break;
    case 'CLEAR_CACHE':
      caches.keys().then(keys =>
        Promise.all(keys.filter(k => k.startsWith(APP_NAME)).map(k => caches.delete(k)))
      ).then(() => {
        if (event.ports && event.ports[0]) event.ports[0].postMessage({ cleared: true });
      });
      break;
  }
});

console.log(`[SW] Sekolah Pro v${CACHE_VER} by Arblok Digital — ready.`);
