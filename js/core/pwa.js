// js/core/pwa.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

globalThis._pwaPrompt   = null;   // deferred BeforeInstallPromptEvent

globalThis._pwaWorker   = null;   // pending SW waiting to activate

// ── Platform ──────────────────────────────────────

globalThis._pwaUA         = navigator.userAgent;

globalThis._pwaIsIOS      = /iphone|ipad|ipod/i.test(_pwaUA);

globalThis._pwaIsAndroid  = /android/i.test(_pwaUA);

globalThis._pwaIsSafari   = /^((?!chrome|android).)*safari/i.test(_pwaUA);

globalThis._pwaIsStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  !!window.navigator.standalone;

// ── 1. Capture install prompt ─────────────────────
window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  _pwaPrompt = e;
  console.log('[PWA] install prompt ready');
  // Show banner 3s after prompt is ready
  setTimeout(pwaShowBanner, 3000);
  // Show button in settings
  var btn = document.getElementById('set-install-btn');
  if (btn) btn.style.display = 'block';
});

// ── 2. App installed ──────────────────────────────
window.addEventListener('appinstalled', function() {
  _pwaPrompt = null;
  pwaHideBanner();
  console.log('[PWA] installed');
  if (typeof showNotif === 'function') showNotif('🎉 Sekolah Pro berhasil diinstall!', 'ok');
});

// ── 3. Banner ─────────────────────────────────────

function pwaShowBanner() {
  if (_pwaIsStandalone) return;
  if (localStorage.getItem('pwa_no_banner')) return;
  var el = document.getElementById('pwa-install-banner');
  if (!el) return;
  var btnEl = document.getElementById('pwa-install-btn');
  if (btnEl) btnEl.textContent = _pwaIsIOS ? '📲 Cara Install' : '📲 Install';
  el.style.display = 'block';
}

function pwaHideBanner() {
  var el = document.getElementById('pwa-install-banner');
  if (el) el.style.display = 'none';
}

// ── 4. Public: trigger install ────────────────────

function triggerInstall() {
  if (_pwaIsStandalone) {
    if (typeof showNotif === 'function') showNotif('✅ App sudah terinstall!', 'ok');
    return;
  }
  if (_pwaPrompt) {
    _pwaPrompt.prompt();
    _pwaPrompt.userChoice.then(function(r) {
      console.log('[PWA] choice:', r.outcome);
      _pwaPrompt = null;
      pwaHideBanner();
    });
    return;
  }
  if (_pwaIsIOS) { pwaShowIOSGuide(); return; }
  if (typeof showNotif === 'function')
    showNotif('💡 Buka di Chrome/Edge untuk install. iOS: gunakan Safari.', 'warn');
}

// ── 5. Dismiss banner ─────────────────────────────

function dismissInstall() {
  pwaHideBanner();
  localStorage.setItem('pwa_no_banner', '1');
}

// ── 6. iOS guide ──────────────────────────────────

function pwaShowIOSGuide() {
  var id = 'ios-guide-modal';
  var el = document.getElementById(id);
  if (el) { el.classList.add('open'); return; }
  var d = document.createElement('div');
  d.id = id; d.className = 'modal-bg open';
  d.innerHTML =
    '<div class="sheet" style="max-width:380px;padding:0">' +
      '<div class="mhdr"><h2>📱 Install di iPhone/iPad</h2>' +
        '<button class="mclose" onclick="document.getElementById(\'ios-guide-modal\').classList.remove(\'open\')">✕</button>' +
      '</div>' +
      '<div style="padding:20px 20px 28px">' +
        '<div style="font-size:40px;text-align:center;margin-bottom:12px">🏫</div>' +
        '<div style="display:flex;flex-direction:column;gap:12px">' +
          '<div style="display:flex;gap:10px;align-items:start"><div style="min-width:26px;height:26px;border-radius:50%;background:var(--grn);color:#000;font-weight:900;font-size:12px;display:flex;align-items:center;justify-content:center">1</div><div style="font-size:13px;color:var(--t2);padding-top:3px">Buka di <b>Safari</b> (bukan Chrome)</div></div>' +
          '<div style="display:flex;gap:10px;align-items:start"><div style="min-width:26px;height:26px;border-radius:50%;background:var(--grn);color:#000;font-weight:900;font-size:12px;display:flex;align-items:center;justify-content:center">2</div><div style="font-size:13px;color:var(--t2);padding-top:3px">Tap ikon <b>Share ⬆️</b> di bawah</div></div>' +
          '<div style="display:flex;gap:10px;align-items:start"><div style="min-width:26px;height:26px;border-radius:50%;background:var(--grn);color:#000;font-weight:900;font-size:12px;display:flex;align-items:center;justify-content:center">3</div><div style="font-size:13px;color:var(--t2);padding-top:3px">Pilih <b>"Add to Home Screen"</b></div></div>' +
          '<div style="display:flex;gap:10px;align-items:start"><div style="min-width:26px;height:26px;border-radius:50%;background:var(--grn);color:#000;font-weight:900;font-size:12px;display:flex;align-items:center;justify-content:center">4</div><div style="font-size:13px;color:var(--t2);padding-top:3px">Tap <b>"Add"</b> — selesai! ✅</div></div>' +
        '</div>' +
        '<div style="margin-top:16px;background:var(--grn-bg);border:1px solid rgba(0,230,118,.2);border-radius:9px;padding:10px 12px;font-size:11px;color:var(--t2)">✅ App berjalan offline setelah diinstall</div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(d);
  d.addEventListener('click', function(e) { if (e.target === d) d.classList.remove('open'); });
}

// ── 7. Apply SW update ────────────────────────────

function applyUpdate() {
  if (_pwaWorker) _pwaWorker.postMessage({ type: 'SKIP_WAITING' });
  var el = document.getElementById('pwa-update-banner');
  if (el) el.style.display = 'none';
  if (typeof showNotif === 'function') showNotif('🔄 Memuat versi terbaru...', 'warn');
  setTimeout(function() { location.reload(); }, 800);
}

// ── 8. Update status in Settings ──────────────────

function updatePWAStatus() {
  var el  = document.getElementById('set-pwa-status');
  var btn = document.getElementById('set-install-btn');
  var bd  = document.getElementById('set-build-date');
  if (bd) bd.textContent = 'v4.0 · © 2026 Arblok Digital';
  if (!el) return;
  if (_pwaIsStandalone) {
    el.innerHTML = '<span style="color:var(--grn);font-weight:700">✅ Terinstall sebagai App</span>';
    if (btn) btn.style.display = 'none';
  } else if (_pwaIsIOS && _pwaIsSafari) {
    el.innerHTML = '<span style="color:var(--yel)">📱 iOS: tap Share ⬆️ → Add to Home Screen</span>';
    if (btn) { btn.textContent = '📲 Cara Install (iOS)'; btn.style.display = 'block'; }
  } else if (_pwaPrompt) {
    el.innerHTML = '<span style="color:var(--yel)">📲 Klik Install App untuk memasang</span>';
    if (btn) { btn.textContent = '📲 Install App'; btn.style.display = 'block'; }
  } else {
    el.innerHTML = '<span style="color:var(--t3)">Berjalan di browser (install via Chrome/Edge)</span>';
  }
}

// ── 9. Wire banner button ─────────────────────────
(function() {
  function wire() {
    var btn = document.getElementById('pwa-install-btn');
    if (btn && !btn._w) { btn._w = 1; btn.addEventListener('click', triggerInstall); }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else { wire(); }
})();

// ── 10. Register Service Worker ───────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(function(reg) {
        console.log('[PWA] SW registered:', reg.scope);

        // Cek update segera saat load + setiap 10 menit
        reg.update();
        setInterval(function() { reg.update(); }, 10 * 60 * 1000);

        reg.addEventListener('updatefound', function() {
          var inst = reg.installing;
          if (!inst) return;
          inst.addEventListener('statechange', function() {
            if (inst.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // Ada versi baru — tampilkan banner update
                _pwaWorker = inst;
                var b = document.getElementById('pwa-update-banner');
                if (b) b.style.display = 'block';
                if (typeof showNotif === 'function')
                  showNotif('🔄 Update tersedia! Tap banner untuk perbarui.', 'warn');
              } else {
                if (typeof showNotif === 'function') showNotif('📦 App siap offline!', 'ok');
              }
            }
          });
        });

        // SW baru aktif → reload otomatis (dapat versi terbaru)
        navigator.serviceWorker.addEventListener('controllerchange', function() {
          console.log('[PWA] New SW activated — reloading...');
          location.reload();
        });

        // Terima pesan dari SW (misal SW_UPDATED setelah activate)
        navigator.serviceWorker.addEventListener('message', function(e) {
          if (!e.data) return;
          if (e.data.action === 'SW_UPDATED') {
            console.log('[PWA] SW_UPDATED received, version:', e.data.version);
            // Sudah di-handle oleh controllerchange di atas
          }
        });

        setTimeout(updatePWAStatus, 300);
      })
      .catch(function(e) { console.warn('[PWA] SW error:', e.message); });
  });
}

// ── 11. iOS first-visit hint ──────────────────────
if (_pwaIsIOS && _pwaIsSafari && !_pwaIsStandalone && !localStorage.getItem('ios_hint')) {
  setTimeout(function() {
    localStorage.setItem('ios_hint', '1');
    pwaShowBanner();
    if (typeof showNotif === 'function')
      showNotif('💡 Install: tap Share ⬆️ → Add to Home Screen', 'warn');
  }, 5000);
}

// ── 12. Deep-link: ?page= from manifest shortcuts ─
(function() {
  var p = new URLSearchParams(location.search).get('page');
  if (p) setTimeout(function() {
    if (typeof switchPage === 'function') switchPage(p);
  }, 600);
})();

// ════════════════════════════════════════════════════════════════════
//  DIAGNOSTIC — Cek koneksi & sinkronisasi Firebase dari mobile
//  Buka Settings → scroll ke bawah → tekan "Jalankan Cek"
// ════════════════════════════════════════════════════════════════════


// ── shim fungsi ke global (handler inline lama + pemanggilan antar-file) ──
Object.assign(globalThis, { pwaShowBanner, pwaHideBanner, triggerInstall, dismissInstall, pwaShowIOSGuide, applyUpdate, updatePWAStatus });
export { pwaShowBanner, pwaHideBanner, triggerInstall, dismissInstall, pwaShowIOSGuide, applyUpdate, updatePWAStatus };
