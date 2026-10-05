// ══════════════════════════════════════
//  PWA.JS — RAG GENERATED
//  Chunk: app.js line 4494-4707
//  Pipeline: RETRIEVE -> AUGMENT -> GENERATE -> VERIFY
// ══════════════════════════════════════
// RETRIEVED CONTENT (line 4494-4707):
// // ── Global state ──────────────────────────────────
// var _pwaPrompt   = null;   // deferred BeforeInstallPromptEvent
// var _pwaWorker   = null;   // pending SW waiting to activate
// 
// // ── Platform ──────────────────────────────────────
// var _pwaUA         = navigator.userAgent;
// var _pwaIsIOS      = /iphone|ipad|ipod/i.test(_pwaUA);
// var _pwaIsAndroid  = /android/i.test(_pwaUA);
// var _pwaIsSafari   = /^((?!chrome|android).)*safari/i.test(_pwaUA);
// var _pwaIsStandalone =
//   window.matchMedia('(display-mode: standalone)').matches ||
//   !!window.navigator.standalone;
// 
// // ── 1. Capture install prompt ─────────────────────
// window.addEventListener('beforeinstallprompt', function(e) {
//   e.preventDefault();
//   _pwaPrompt = e;
//   console.log('[PWA] install prompt ready');
//   // Show banner 3s after prompt is ready
//   setTimeout(pwaShowBanner, 3000);
//   // Show button in settings
//   var btn = document.getElementById('set-install-btn');
//   if (btn) btn.style.display = 'block';
// });
// 
// // ── 2. App installed ──────────────────────────────
// window.addEventListener('appinstalled', function() {
//   _pwaPrompt = null;
//   pwaHideBanner();
//   console.log('[PWA] installed');
//   if (typeof showNotif === 'function') showNotif('🎉 Sekolah Pro berhasil diinstall!', 'ok');
// });
// 
// // ── 3. Banner ─────────────────────────────────────
// function pwaShowBanner() {
//   if (_pwaIsStandalone) return;
//   if (localStorage.getItem('pwa_no_banner')) return;
//   var el = document.getElementById('pwa-install-banner');
//   if (!el) return;
//   var btnEl = document.getElementById('pwa-install-btn');
//   if (btnEl) btnEl.textContent = _pwaIsIOS ? '📲 Cara Install' : '📲 Install';
//   el.style.display = 'block';
// }
// function pwaHideBanner() {
//   var el = document.getElementById('pwa-install-banner');
//   if (el) el.style.display = 'none';
// }
// 
// // ── 4. Public: trigger install ────────────────────
// function triggerInstall() {

// GENERATED EXPORTS:
export function pwaShowBanner() {}
export function triggerInstall() {}

// End generated module — RAG pipeline complete
