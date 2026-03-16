// ════════════════════════════════════════════════════
//  SEKOLAH PRO — Service Worker v4.0
//  Copyright © 2026 Arblok Digital. All Rights Reserved.
//
//  Strategy:
//    App Shell  → Cache First  (always serve from cache)
//    CDN Assets → Cache First  (fonts, xlsx lib, etc.)
//    Navigation → Network First → fallback to shell
//    External   → Network Only (WA, Google, etc.)
//
//  Update Flow:
//    New SW detected → postMessage SKIP_WAITING
//    → controllerchange → clients.claim() → reload
// ════════════════════════════════════════════════════

const APP_NAME   = 'sekolah-pro';
const VER        = 'v4';
const CACHE_SHELL  = `${APP_NAME}-shell-${VER}`;
const CACHE_ASSETS = `${APP_NAME}-assets-${VER}`;

// ── App shell — pre-cache on install ─────────────────
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// ── CDN hosts → cache-first ──────────────────────────
const CDN_HOSTS = [
  'cdnjs.cloudflare.com',
  'unpkg.com',
  'cdn.jsdelivr.net',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

// ── External → network-only (never cache) ───────────
const PASSTHROUGH_HOSTS = [
  'wa.me',
  'api.whatsapp.com',
  'web.whatsapp.com',
  'docs.google.com',
  'sheets.googleapis.com',
];


// ═══════════════════════════════════
//  INSTALL — pre-cache app shell
// ═══════════════════════════════════
self.addEventListener('install', event => {
  console.log(`[SW ${VER}] install — pre-caching shell...`);

  event.waitUntil(
    caches.open(CACHE_SHELL)
      .then(cache =>
        // Use allSettled so one 404 doesn't abort everything
        Promise.allSettled(
          PRECACHE.map(url =>
            cache.add(url).catch(err =>
              console.warn(`[SW] pre-cache skipped: ${url}`, err.message)
            )
          )
        )
      )
      .then(() => {
        console.log(`[SW ${VER}] shell cached — calling skipWaiting`);
        // Take over immediately without waiting for old tabs to close
        return self.skipWaiting();
      })
  );
});


// ═══════════════════════════════════
//  ACTIVATE — purge old caches
// ═══════════════════════════════════
self.addEventListener('activate', event => {
  console.log(`[SW ${VER}] activate`);

  event.waitUntil(
    caches.keys()
      .then(keys => {
        const KEEP = [CACHE_SHELL, CACHE_ASSETS];
        return Promise.all(
          keys
            .filter(k => k.startsWith(APP_NAME) && !KEEP.includes(k))
            .map(k => {
              console.log(`[SW] deleting stale cache: ${k}`);
              return caches.delete(k);
            })
        );
      })
      .then(() => {
        console.log(`[SW ${VER}] activated — claiming clients`);
        // Take control of all open tabs immediately
        return self.clients.claim();
      })
  );
});


// ═══════════════════════════════════
//  FETCH
// ═══════════════════════════════════
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Only intercept GET
  if (req.method !== 'GET') return;

  // Only intercept http/https
  if (!url.protocol.startsWith('http')) return;

  // ── Passthrough: external APIs — straight to network ──
  if (PASSTHROUGH_HOSTS.some(h => url.hostname.includes(h))) {
    event.respondWith(
      fetch(req).catch(() =>
        new Response(JSON.stringify({ offline: true }), {
          status: 503,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        })
      )
    );
    return;
  }

  // ── CDN assets — cache-first (immutable, long TTL) ──
  if (CDN_HOSTS.some(h => url.hostname.includes(h))) {
    event.respondWith(cacheFirst(req, CACHE_ASSETS));
    return;
  }

  // ── App shell / same-origin — network-first ──
  event.respondWith(networkFirst(req));
});


// ═══════════════════════════════════
//  STRATEGIES
// ═══════════════════════════════════

/** Network First: try network → update cache → serve.
 *  On failure: serve from cache or show offline page. */
async function networkFirst(req) {
  let cache;
  try {
    cache = await caches.open(CACHE_SHELL);
    const networkRes = await fetch(req);

    if (networkRes && networkRes.ok) {
      // Update cache in background — don't await
      cache.put(req, networkRes.clone()).catch(() => {});
    }
    return networkRes;
  } catch (_networkError) {
    // Network failed — try cache
    const cached = cache
      ? await cache.match(req)
      : await caches.match(req);

    if (cached) {
      return cached;
    }

    // Last resort for navigation: serve app shell
    if (req.destination === 'document' || req.mode === 'navigate') {
      const shell = await caches.match('./index.html')
                 || await caches.match('./');
      if (shell) return shell;
    }

    // Hard offline fallback page
    return offlinePage();
  }
}

/** Cache First: serve from cache → update in background → if not cached fetch. */
async function cacheFirst(req, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(req);

  if (cached) {
    // Revalidate in background (stale-while-revalidate)
    fetch(req)
      .then(res => { if (res && res.ok) cache.put(req, res); })
      .catch(() => {});
    return cached;
  }

  try {
    const networkRes = await fetch(req);
    if (networkRes && networkRes.ok) {
      cache.put(req, networkRes.clone()).catch(() => {});
    }
    return networkRes;
  } catch {
    return new Response('CDN resource unavailable offline.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

/** Branded offline fallback page. */
function offlinePage() {
  return new Response(
    `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="theme-color" content="#0a0f1a"/>
  <title>Offline — Sekolah Pro</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      background:#0a0f1a;color:#e8f0fe;
      min-height:100vh;display:flex;flex-direction:column;
      align-items:center;justify-content:center;
      gap:14px;text-align:center;padding:28px;
    }
    .icon{font-size:64px;line-height:1}
    h1{font-size:22px;font-weight:900;color:#00e676}
    p{font-size:13px;color:#8ba3c7;line-height:1.7;max-width:320px}
    button{
      background:#00e676;color:#000;border:none;
      padding:13px 28px;border-radius:10px;
      font-weight:900;font-size:14px;cursor:pointer;
      margin-top:6px;transition:opacity .15s;
    }
    button:active{opacity:.8}
    small{font-size:10px;color:#4a6080;margin-top:8px}
  </style>
</head>
<body>
  <div class="icon">📡</div>
  <h1>Sedang Offline</h1>
  <p>Koneksi internet tidak tersedia.<br/>
     Semua data lokal kamu tetap aman di perangkat ini.</p>
  <button onclick="location.reload()">🔄 Coba Lagi</button>
  <small>Sekolah Pro · © 2026 Arblok Digital</small>
</body>
</html>`,
    {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  );
}


// ═══════════════════════════════════
//  MESSAGE HANDLER
// ═══════════════════════════════════
self.addEventListener('message', event => {
  if (!event.data || typeof event.data !== 'object') return;

  switch (event.data.type) {

    case 'SKIP_WAITING':
      console.log('[SW] SKIP_WAITING received — activating');
      self.skipWaiting();
      break;

    case 'GET_VERSION':
      event.ports?.[0]?.postMessage({
        version: VER,
        cache: CACHE_SHELL,
        app: APP_NAME,
      });
      break;

    case 'CLEAR_CACHE':
      caches.keys()
        .then(keys =>
          Promise.all(keys.filter(k => k.startsWith(APP_NAME)).map(k => caches.delete(k)))
        )
        .then(() => event.ports?.[0]?.postMessage({ cleared: true }));
      break;

    case 'CACHE_EXTRA':
      // Dynamically cache additional URLs (e.g. CDN libs loaded on demand)
      if (Array.isArray(event.data.urls)) {
        caches.open(CACHE_ASSETS)
          .then(c => Promise.allSettled(event.data.urls.map(u => c.add(u).catch(() => {}))));
      }
      break;
  }
});


// ═══════════════════════════════════
//  PUSH NOTIFICATIONS (future)
// ═══════════════════════════════════
self.addEventListener('push', event => {
  if (!event.data) return;
  let payload = {};
  try { payload = event.data.json(); } catch { payload.body = event.data.text(); }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Sekolah Pro', {
      body:    payload.body || '',
      icon:    './icons/icon-192.png',
      badge:   './icons/icon-96.png',
      tag:     'sekolah-notif',
      renotify: true,
      data:    { url: payload.url || './' },
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => {
        const existing = list.find(c => c.url.includes(self.registration.scope));
        if (existing) return existing.focus();
        return clients.openWindow(event.notification.data?.url || './');
      })
  );
});


// ═══════════════════════════════════
//  BACKGROUND SYNC (reserved)
// ═══════════════════════════════════
self.addEventListener('sync', event => {
  if (event.tag === 'bg-sync-sekolah') {
    console.log('[SW] background sync triggered');
    // Reserved for future cloud backup
  }
});

console.log(`[SW] Sekolah Pro ${VER} · Arblok Digital · loaded`);
