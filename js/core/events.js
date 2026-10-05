// js/core/events.js — DELEGASI data-action (pengganti handler inline)
// Satu dispatcher untuk semua interaksi hasil konversi onclick/onchange/dll.
// Selama transisi, fungsi lama juga tersedia di globalThis (shim) sehingga
// handler yang masih tertulis di dalam template-string HTML tetap jalan.

const ACTIONS = Object.create(null);

export function registerActions(map) {
  Object.assign(ACTIONS, map);
}

function resolveArg(a, el, ev) {
  if (typeof a !== 'string') return a;
  if (a === '@@this') return el;
  if (a === '@@checked') return el.checked;
  if (a === '@@event') return ev;
  if (a.startsWith('@@sel:')) return document.querySelector(a.slice(6));
  if (a.startsWith('@@id:')) return document.getElementById(a.slice(5));
  return a;
}

function run(el, ev) {
  const action = el.getAttribute('data-action');
  if (!action) return;
  let fn = ACTIONS[action] || globalThis[action];
  if (typeof fn !== 'function') {
    console.warn('[events] aksi tidak dikenal:', action);
    return;
  }
  let args = [];
  const raw = el.getAttribute('data-args');
  if (raw) { try { args = JSON.parse(raw); } catch (e) { console.warn('[events] data-args invalid:', action, e); } }
  args = args.map((a) => resolveArg(a, el, ev));
  try {
    fn.apply(el, args);
  } catch (e) {
    console.error('[events] error pada aksi', action, e);
  }
}

// ── aksi bawaan untuk pola inline non-pemanggilan-fungsi ──
registerActions({
  __windowPrint: () => window.print(),
  __windowOpen: (url, target) => window.open(url, target || '_blank'),
  __hideElement: (id) => { const e = document.getElementById(id); if (e) e.style.display = 'none'; },
  __removeById: (id) => { const e = document.getElementById(id); if (e) e.remove(); },
  __seq: (calls) => {
    for (const [name, a] of calls) {
      const f = ACTIONS[name] || globalThis[name];
      if (typeof f === 'function') f(...(a || []));
      else console.warn('[events] __seq aksi tidak dikenal:', name);
    }
  },
});

function handler(evType) {
  return function (e) {
    const el = e.target && e.target.closest ? e.target.closest('[data-action]') : null;
    if (!el) return;
    const ev = el.getAttribute('data-event') || 'click';
    if (ev !== evType) return;
    if (evType === 'keydown' || evType === 'keyup') {
      const k = el.getAttribute('data-key');
      if (k && e.key !== k) return;
    }
    run(el, e);
  };
}

document.addEventListener('click', handler('click'));
document.addEventListener('change', handler('change'));
document.addEventListener('input', handler('input'));
document.addEventListener('submit', handler('submit'));
document.addEventListener('keydown', handler('keydown'));
document.addEventListener('keyup', handler('keyup'));

// Klik backdrop modal → tutup (dulu dipasang per .modal-bg saat load)
document.addEventListener('click', (e) => {
  if (e.target && e.target.classList && e.target.classList.contains('modal-bg')) {
    e.target.classList.remove('open');
  }
});

// Fallback touch untuk bottom-nav (Android WebView) — dulu _bnavTouchFix
document.addEventListener('touchend', (e) => {
  const el = e.target && e.target.closest ? e.target.closest('[data-action]') : null;
  if (!el) return;
  if (el.classList && el.classList.contains('bnav')) {
    const ev = el.getAttribute('data-event') || 'click';
    if (ev !== 'click') return;
    e.preventDefault();
    run(el, e);
  }
}, { passive: false });

Object.assign(globalThis, { registerActions, __eventsRun: run });
export { run as dispatchAction };
