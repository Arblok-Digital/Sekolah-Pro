// js/sync/status.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

function _updateOnlineStatus() {
  const el = document.getElementById('login-online-status');
  if (!el) return;
  if (navigator.onLine) {
    el.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:var(--grn);display:inline-block"></span> <span style="color:var(--grn)">Online</span>';
  } else {
    el.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:var(--yel);display:inline-block"></span> <span style="color:var(--yel)">Offline</span>';
  }
}

window.addEventListener('online',  () => { _fbOnline=true;  _updateOnlineStatus(); _updateSyncBadge(); _fbFlushQueue(); });
window.addEventListener('offline', () => { _fbOnline=false; _updateOnlineStatus(); _updateSyncBadge(); });


function _updateSyncBadge() {
  // ── floating badge (desktop) ─────────────────────────────────────
  const badge = document.getElementById('sync-badge');
  const dot   = document.getElementById('sync-dot');
  const lbl   = document.getElementById('sync-label');
  if (badge) {
    if (!_fbUser && !_fbOfflineMode) {
      badge.style.display = 'none';
    } else {
      badge.style.display = 'flex';
      let dotColor = 'var(--t3)', lblText = '📴 Lokal';
      if (!navigator.onLine)      { dotColor='var(--yel)'; lblText='📴 Offline'; }
      else if (_fbSyncPending)    { dotColor='var(--amb)'; lblText='🔄 Syncing...'; }
      else if (_fbUser)           { dotColor='var(--grn)'; lblText='☁️ Synced'; }
      if(dot) dot.style.background = dotColor;
      if(lbl) lbl.textContent = lblText;
    }
  }

  // ── banner-sync-inline (mobile + desktop) ────────────────────────
  const bDot = document.getElementById('banner-sync-dot');
  const bTxt = document.getElementById('banner-sync-txt');
  if (bDot && bTxt) {
    if (!navigator.onLine)    { bDot.style.background='var(--yel)'; bTxt.textContent='Offline'; }
    else if (_fbSyncPending)  { bDot.style.background='var(--amb)'; bTxt.textContent='Syncing'; }
    else if (_fbUser)         { bDot.style.background='var(--grn)'; bTxt.textContent='Synced';  }
    else                      { bDot.style.background='var(--t3)';  bTxt.textContent='Lokal';   }
  }
}

// ══════════════════════════════════════════════════
//  OFFLINE-FIRST SYNC ENGINE
//  saveDB() → localStorage (instant)
//           → Firestore (background, queued if offline)
// ══════════════════════════════════════════════════


// ── shim fungsi ke global (handler inline lama + pemanggilan antar-file) ──
Object.assign(globalThis, { _updateOnlineStatus, _updateSyncBadge });
export { _updateOnlineStatus, _updateSyncBadge };
