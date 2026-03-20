// ══════════════════════════════════════════════════════════════════
//  SekolahPro Service Worker — Offline-First PWA
//  by Arblok Digital · v3.1 (fixed clone bug)
// ══════════════════════════════════════════════════════════════════

const CACHE_STATIC  = 'sekolahpro-static-v3';
const CACHE_DYNAMIC = 'sekolahpro-dynamic-v3';

const PRECACHE_URLS = ['./index.html', './manifest.json'];

const CDN_ORIGINS = [
  'www.gstatic.com',
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

const NO_CACHE_PATTERNS = [
  /firestore\.googleapis\.com/,
  /identitytoolkit\.googleapis\.com/,
  /securetoken\.googleapis\.com/,
];

// ── INSTALL ──────────────────────────────────────────────────────
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(function(cache) { return cache.addAll(PRECACHE_URLS); })
      .then(function() { return self.skipWaiting(); })
      .catch(function() { return self.skipWaiting(); })
  );
});

// ── ACTIVATE ─────────────────────────────────────────────────────
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) {
          return k !== CACHE_STATIC && k !== CACHE_DYNAMIC;
        }).map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

// ── FETCH ─────────────────────────────────────────────────────────
self.addEventListener('fetch', function(event) {
  var url = event.request.url;
  if (event.request.method !== 'GET') return;
  if (!url.startsWith('http')) return;
  for (var i = 0; i < NO_CACHE_PATTERNS.length; i++) {
    if (NO_CACHE_PATTERNS[i].test(url)) return;
  }

  var urlObj = new URL(url);
  var path   = urlObj.pathname;
  var isCDN  = CDN_ORIGINS.some(function(o) { return urlObj.hostname === o; });

  // App shell → Cache First
  if (path.endsWith('index.html') || path.endsWith('manifest.json') ||
      path === '/' || path.endsWith('/')) {
    event.respondWith(cacheFirst(event.request, CACHE_STATIC));
    return;
  }

  // CDN → Cache First
  if (isCDN) {
    event.respondWith(cacheFirst(event.request, CACHE_DYNAMIC));
    return;
  }

  // Lainnya → Network First
  event.respondWith(networkFirst(event.request, CACHE_DYNAMIC));
});

// ── Cache First (FIXED: clone sebelum return) ─────────────────────
function cacheFirst(request, cacheName) {
  return caches.open(cacheName).then(function(cache) {
    return cache.match(request).then(function(cached) {
      if (cached) {
        // Refresh di background
        fetch(request).then(function(resp) {
          if (resp && resp.ok) cache.put(request, resp);
        }).catch(function() {});
        return cached;
      }
      return fetch(request).then(function(resp) {
        if (resp && resp.ok) {
          // PENTING: clone dulu SEBELUM cache.put, baru return original
          var respToCache = resp.clone();
          cache.put(request, respToCache);
        }
        return resp;
      }).catch(function() {
        return caches.match('./index.html');
      });
    });
  });
}

// ── Network First (FIXED: clone sebelum return) ───────────────────
function networkFirst(request, cacheName) {
  return fetch(request).then(function(resp) {
    if (resp && resp.ok) {
      // PENTING: clone dulu SEBELUM cache.put, baru return original
      var respToCache = resp.clone();
      caches.open(cacheName).then(function(cache) {
        cache.put(request, respToCache);
      });
    }
    return resp;
  }).catch(function() {
    return caches.match(request).then(function(cached) {
      return cached || caches.match('./index.html');
    });
  });
}

// ── MESSAGE ───────────────────────────────────────────────────────
self.addEventListener('message', function(event) {
  if (!event.data) return;
  if (event.data.action === 'skipWaiting') self.skipWaiting();
  if (event.data.action === 'clearCache') {
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) { return caches.delete(k); }));
    });
  }
});
