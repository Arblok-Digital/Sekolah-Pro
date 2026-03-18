// ════════════════════════════════════════════════════
//  SEKOLAH PRO — Service Worker v6
//  Copyright © 2026 Arblok Digital. All Rights Reserved.
//
//  FIX v6:
//  - PRECACHE icons path fixed (root, bukan subfolder icons/)
//  - Aggressive offline caching — app HARUS jalan offline
//  - Cache First untuk navigasi saat offline
// ════════════════════════════════════════════════════

const APP  = 'sekolah-pro';
const VER  = 'v6';
const CACHE_SHELL  = `${APP}-shell-${VER}`;
const CACHE_ASSETS = `${APP}-assets-${VER}`;

// ── App shell — WAJIB di-cache saat install ──────────
// Semua file di ROOT (tidak ada subfolder)
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  './icon-72.png',
  './icon-96.png',
  './icon-128.png',
  './icon-144.png',
  './icon-152.png',
  './icon-192.png',
  './icon-384.png',
  './icon-512.png',
];

// CDN — cache first (immutable)
const CDN_HOSTS = [
  'cdnjs.cloudflare.com',
  'unpkg.com',
  'cdn.jsdelivr.net',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

// External — network only (jangan cache)
const PASSTHROUGH = [
  'wa.me',
  'api.whatsapp.com',
  'web.whatsapp.com',
  'docs.google.com',
  'sheets.googleapis.com',
];


// ═══════════════════════════════════
//  INSTALL — cache semua app shell
// ═══════════════════════════════════
self.addEventListener('install', event => {
  console.log(`[SW ${VER}] Installing — caching ${PRECACHE.length} files...`);
  event.waitUntil(
    caches.open(CACHE_SHELL)
      .then(cache =>
        Promise.allSettled(
          PRECACHE.map(url =>
            cache.add(url).catch(err =>
              console.warn(`[SW] Pre-cache skip: ${url} —`, err.message)
            )
          )
        )
      )
      .then(() => {
        console.log(`[SW ${VER}] Install OK — skipWaiting`);
        return self.skipWaiting();
      })
  );
});


// ═══════════════════════════════════
//  ACTIVATE — hapus cache lama
// ═══════════════════════════════════
self.addEventListener('activate', event => {
  console.log(`[SW ${VER}] Activating...`);
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k.startsWith(APP) && k !== CACHE_SHELL && k !== CACHE_ASSETS)
          .map(k => {
            console.log(`[SW] Deleting old cache: ${k}`);
            return caches.delete(k);
          })
      ))
      .then(() => {
        console.log(`[SW ${VER}] Activated — claiming clients`);
        return self.clients.claim();
      })
  );
});


// ═══════════════════════════════════
//  FETCH — strategi per request type
// ═══════════════════════════════════
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // External API → network only
  if (PASSTHROUGH.some(h => url.hostname.includes(h))) {
    event.respondWith(
      fetch(req).catch(() =>
        new Response('{"offline":true}', {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // CDN → cache first (stale-while-revalidate)
  if (CDN_HOSTS.some(h => url.hostname.includes(h))) {
    event.respondWith(cacheFirst(req, CACHE_ASSETS));
    return;
  }

  // App shell + icons → network first, aggressive offline fallback
  event.respondWith(networkFirst(req));
});


// ─── Network First: online → update cache; offline → serve cache ───
async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res && res.ok) {
      const cache = await caches.open(CACHE_SHELL);
      cache.put(req, res.clone()).catch(() => {});
    }
    return res;
  } catch {
    // OFFLINE — serve from cache
    const cached = await caches.match(req);
    if (cached) return cached;

    // Fallback: serve index.html untuk semua navigation request
    if (req.destination === 'document' || req.mode === 'navigate') {
      const shell = await caches.match('./index.html')
                 || await caches.match('./');
      if (shell) {
        console.log('[SW] Offline fallback → index.html');
        return shell;
      }
    }

    // Fallback untuk icon yang tidak ke-cache
    if (req.url.includes('icon-')) {
      const anyIcon = await caches.match('./icon-192.png');
      if (anyIcon) return anyIcon;
    }

    return offlinePage();
  }
}

// ─── Cache First: serve cache → revalidate background ───────────────
async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) {
    // Update in background (stale-while-revalidate)
    fetch(req).then(res => {
      if (res && res.ok) cache.put(req, res);
    }).catch(() => {});
    return cached;
  }
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
    return res;
  } catch {
    return new Response('Offline — resource not cached', { status: 503 });
  }
}

// ─── Offline page — branded ─────────────────────────────────────────
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
  gap:12px;text-align:center;padding:28px;
}
.logo{
  width:80px;height:80px;border-radius:18px;
  background:#111827;border:2px solid #00e676;
  display:flex;align-items:center;justify-content:center;
  font-size:40px;margin-bottom:4px;
}
h1{font-size:22px;font-weight:900;color:#00e676}
p{font-size:13px;color:#8ba3c7;line-height:1.7;max-width:300px}
button{
  background:#00e676;color:#000;border:none;
  padding:13px 28px;border-radius:10px;
  font-weight:900;font-size:14px;cursor:pointer;
  margin-top:8px;
}
small{font-size:10px;color:#4a6080;margin-top:8px}
</style>
</head>
<body>
<div class="logo">🏫</div>
<h1>Sedang Offline</h1>
<p>Koneksi internet tidak tersedia.<br/>Semua data lokal tetap aman di perangkat.</p>
<button onclick="location.reload()">🔄 Coba Lagi</button>
<small>Sekolah Pro · © 2026 Arblok Digital</small>
</body>
</html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}


// ═══════════════════════════════════
//  MESSAGE HANDLER
// ═══════════════════════════════════
self.addEventListener('message', event => {
  if (!event.data || typeof event.data !== 'object') return;
  switch (event.data.type) {
    case 'SKIP_WAITING':
      console.log('[SW] SKIP_WAITING → activating');
      self.skipWaiting();
      break;
    case 'GET_VERSION':
      event.ports?.[0]?.postMessage({ version: VER, cache: CACHE_SHELL });
      break;
    case 'CLEAR_CACHE':
      caches.keys()
        .then(keys => Promise.all(
          keys.filter(k => k.startsWith(APP)).map(k => caches.delete(k))
        ))
        .then(() => event.ports?.[0]?.postMessage({ cleared: true }));
      break;
    case 'CACHE_EXTRA':
      if (Array.isArray(event.data.urls)) {
        caches.open(CACHE_ASSETS)
          .then(c => Promise.allSettled(event.data.urls.map(u => c.add(u).catch(() => {}))));
      }
      break;
  }
});


// ═══════════════════════════════════
//  PUSH NOTIFICATIONS
// ═══════════════════════════════════
self.addEventListener('push', event => {
  if (!event.data) return;
  let p = {};
  try { p = event.data.json(); } catch { p.body = event.data.text(); }
  event.waitUntil(
    self.registration.showNotification(p.title || 'Sekolah Pro', {
      body:     p.body || '',
      icon:     './icon-192.png',
      badge:    './icon-96.png',
      tag:      'sp-notif',
      renotify: true,
      data:     { url: p.url || './' }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => {
        const w = list.find(c => c.url.includes(self.registration.scope));
        if (w) return w.focus();
        return clients.openWindow(event.notification.data?.url || './');
      })
  );
});

console.log(`[SW] Sekolah Pro ${VER} · Arblok Digital · ready`);
