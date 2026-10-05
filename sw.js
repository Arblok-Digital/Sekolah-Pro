// ══════════════════════════════════════════════════════════════════
//  SekolahPro Service Worker — Offline-First PWA
//  by Arblok Digital · v3.1 (fixed clone bug)
// ══════════════════════════════════════════════════════════════════

const CACHE_STATIC  = 'sekolahpro-static-v4';
const CACHE_DYNAMIC = 'sekolahpro-dynamic-v4';

const PRECACHE_URLS = [
  './css/core.css',
  './css/login.css',
  './css/modules/akademik.css',
  './css/modules/alumni.css',
  './css/modules/bos.css',
  './css/modules/broadcast.css',
  './css/modules/crm.css',
  './css/modules/dashboard.css',
  './css/modules/guru.css',
  './css/modules/inventaris.css',
  './css/modules/jadwal.css',
  './css/modules/kalender.css',
  './css/modules/kelas.css',
  './css/modules/komunikasi.css',
  './css/modules/laporan.css',
  './css/modules/radar.css',
  './css/modules/setting.css',
  './css/modules/spp.css',
  './icon-128.png',
  './icon-144.png',
  './icon-152.png',
  './icon-192.png',
  './icon-384.png',
  './icon-512.png',
  './icon-72.png',
  './icon-96.png',
  './index.html',
  './js/app.js',
  './js/core/auth.js',
  './js/core/config.js',
  './js/core/db.js',
  './js/core/events.js',
  './js/core/partials.js',
  './js/core/pwa.js',
  './js/core/router.js',
  './js/core/utils.js',
  './js/modules/akademik/logic.js',
  './js/modules/akademik/pipeline.js',
  './js/modules/akademik/route.js',
  './js/modules/alumni/logic.js',
  './js/modules/alumni/pipeline.js',
  './js/modules/alumni/route.js',
  './js/modules/bos/logic.js',
  './js/modules/bos/pipeline.js',
  './js/modules/bos/route.js',
  './js/modules/broadcast/logic.js',
  './js/modules/broadcast/pipeline.js',
  './js/modules/broadcast/route.js',
  './js/modules/crm/logic.js',
  './js/modules/crm/pipeline.js',
  './js/modules/crm/route.js',
  './js/modules/dashboard/logic.js',
  './js/modules/dashboard/pipeline.js',
  './js/modules/dashboard/route.js',
  './js/modules/guru/logic.js',
  './js/modules/guru/pipeline.js',
  './js/modules/guru/route.js',
  './js/modules/inventaris/logic.js',
  './js/modules/inventaris/pipeline.js',
  './js/modules/inventaris/route.js',
  './js/modules/jadwal/logic.js',
  './js/modules/jadwal/pipeline.js',
  './js/modules/jadwal/route.js',
  './js/modules/kalender/logic.js',
  './js/modules/kalender/pipeline.js',
  './js/modules/kalender/route.js',
  './js/modules/kelas/logic.js',
  './js/modules/kelas/pipeline.js',
  './js/modules/kelas/route.js',
  './js/modules/komunikasi/logic.js',
  './js/modules/komunikasi/pipeline.js',
  './js/modules/komunikasi/route.js',
  './js/modules/laporan/logic.js',
  './js/modules/laporan/pipeline.js',
  './js/modules/laporan/route.js',
  './js/modules/radar/logic.js',
  './js/modules/radar/pipeline.js',
  './js/modules/radar/route.js',
  './js/modules/setting/logic.js',
  './js/modules/setting/pipeline.js',
  './js/modules/setting/route.js',
  './js/modules/spp/logic.js',
  './js/modules/spp/pipeline.js',
  './js/modules/spp/route.js',
  './js/sync/firestore.js',
  './js/sync/queue.js',
  './js/sync/sheets.js',
  './js/sync/status.js',
  './manifest.json',
  './partials/akademik.html',
  './partials/alumni.html',
  './partials/bos.html',
  './partials/broadcast.html',
  './partials/crm.html',
  './partials/dashboard.html',
  './partials/guru.html',
  './partials/inventaris.html',
  './partials/jadwal.html',
  './partials/kalender.html',
  './partials/kelas.html',
  './partials/komunikasi.html',
  './partials/laporan.html',
  './partials/login.html',
  './partials/radar.html',
  './partials/setting.html',
  './partials/spp.html',
];

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
