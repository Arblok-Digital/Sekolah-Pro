// js/core/router.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

globalThis.currentPage = 'dashboard';

function switchPage(name) {
  // ── RBAC GATE ────────────────────────────────────────────────────────
  // Jika _fbRole kosong ('') → Firebase masih loading ATAU offline mode
  // belum selesai init. Jangan block — biarkan masuk, tapi batasi ke
  // halaman aman (dashboard) jika nama tidak ada di allowed list mana pun.
  if (_fbRole !== '') {
    const allowed = _FB_ROLE_PAGES[_fbRole];
    if (!allowed) {
      console.warn('[RBAC] switchPage BLOCKED — role tidak dikenali:', JSON.stringify(_fbRole));
      if (_fbAuth) _fbAuth.signOut();
      _showLoginPage();
      return;
    }
    if (!allowed.includes(name)) {
      console.warn('[RBAC] Akses ditolak:', _fbRole, '→', name);
      const home = _FB_HOME_PAGE[_fbRole] || 'dashboard';
      if (name !== home) switchPage(home);
      return;
    }
  } else {
    // _fbRole belum di-set → hanya izinkan dashboard saat loading
    const safePage = 'dashboard';
    if (name !== safePage) {
      console.warn('[RBAC] Role belum siap, paksa ke dashboard');
      name = safePage;
    }
  }

  // FIX 2: Reset biaya filter saat keluar dari halaman SPP
  if (typeof biayaFilterAktif !== 'undefined' && name !== 'spp') {
    biayaFilterAktif = 'semua';
  }
  currentPage = name;

  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));

  // Clear all nav active states
  document.querySelectorAll('.bnav').forEach(b => b.classList.remove('on'));
  document.querySelectorAll('.htab').forEach(b => b.classList.remove('on'));
  document.querySelectorAll('.snav').forEach(b => b.classList.remove('on'));

  // Show target page
  const pg = document.getElementById(name + '-page');
  if (pg) pg.classList.add('on');

  // Activate bottom nav item + scroll it into view on mobile
  const bn = document.getElementById('bn-' + name);
  if (bn) {
    bn.classList.add('on');
    // Scroll the active bnav item into view (mobile scrollable nav)
    setTimeout(() => {
      const scroll = document.getElementById('bnav-scroll');
      if (scroll && window.innerWidth < 900) {
        const btnLeft = bn.offsetLeft;
        const btnWidth = bn.offsetWidth;
        const scrollWidth = scroll.offsetWidth;
        scroll.scrollTo({ left: btnLeft - scrollWidth/2 + btnWidth/2, behavior: 'smooth' });
      }
    }, 50);
  }

  // Activate header tab
  const tabMap = {dashboard:'📊 Dash',crm:'👤 Siswa',komunikasi:'💬 Ortu',kalender:'🗓️ Kalender',laporan:'📄 Laporan'};
  if (tabMap[name]) {
    document.querySelectorAll('.htab').forEach(t => {
      if (t.textContent.trim() === tabMap[name].trim()) t.classList.add('on');
    });
  }

  // Activate sidebar item
  document.querySelectorAll('.snav').forEach(b => {
    const oc = b.getAttribute('data-args') || b.getAttribute('data-page') || b.getAttribute('onclick') || '';
    if (oc.includes(`"${name}"`) || oc.includes(`'${name}'`)) b.classList.add('on');
  });

  renderPage(name);

  // Desktop: scroll content area to top smoothly
  if (window.innerWidth >= 900) {
    const dc = document.getElementById('desktop-content');
    if (dc) dc.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    // Mobile: scroll page to top
    if (pg) pg.scrollTo({ top: 0, behavior: 'instant' });
  }
}


function renderPage(name) {
  switch(name) {
    case 'dashboard':   renderDashboard(); break;
    case 'crm':         renderCRM(); break;
    case 'kelas':       renderKelas(); break;
    case 'spp':         renderSPP(); break;
    case 'guru':        renderGuru(); break;
    case 'bos':         renderBOS(); break;
    case 'akademik':    renderAkademik(); break;
    case 'jadwal':      renderJadwal(); break;
    case 'kalender':    renderKalender(); break;
    case 'komunikasi':
      renderKomunikasi();
      if (_fbRole === 'ortu') setTimeout(_renderOrtuView, 100);
      break;
    case 'inventaris':  renderInventaris(); break;
    case 'alumni':      renderAlumni(); break;
    case 'laporan':     renderLaporan(); break;
    case 'radar':       hitungRadar(); break;
    case 'setting':
      renderSetting();
      // Hooks setting (dulu dipasang via patch window.renderPage)
      if (typeof updatePWAStatus === 'function') setTimeout(updatePWAStatus, 150);
      if (typeof populateRaporSiswaSel === 'function') populateRaporSiswaSel();
      if (typeof updateThemeButtons === 'function') updateThemeButtons();
      try {
        const d = getD();
        const tog = document.getElementById('set-pin-toggle');
        if (tog) {
          const en = !!d.profil_sekolah.pin_enabled;
          tog.checked = en;
          const area = document.getElementById('pin-setup-area');
          if (area) area.style.display = en ? 'block' : 'none';
          const slider = document.getElementById('pin-toggle-slider');
          const dot = document.getElementById('pin-toggle-dot');
          if (slider) slider.style.background = en ? 'var(--grn)' : 'var(--s3)';
          if (dot) dot.style.transform = en ? 'translateX(20px)' : 'translateX(0)';
        }
      } catch (e) { /* silent */ }
      break;
    case 'broadcast':   renderBroadcast(); break;
  }
}

// ── ROUTE REGISTRY — 16 modul, dynamic import (spec refactor) ──
const ROUTE_REGISTRY = {
  dashboard:  () => import('../modules/dashboard/route.js'),
  crm:        () => import('../modules/crm/route.js'),
  kelas:      () => import('../modules/kelas/route.js'),
  spp:        () => import('../modules/spp/route.js'),
  guru:       () => import('../modules/guru/route.js'),
  bos:        () => import('../modules/bos/route.js'),
  akademik:   () => import('../modules/akademik/route.js'),
  jadwal:     () => import('../modules/jadwal/route.js'),
  kalender:   () => import('../modules/kalender/route.js'),
  komunikasi: () => import('../modules/komunikasi/route.js'),
  inventaris: () => import('../modules/inventaris/route.js'),
  alumni:     () => import('../modules/alumni/route.js'),
  laporan:    () => import('../modules/laporan/route.js'),
  radar:      () => import('../modules/radar/route.js'),
  setting:    () => import('../modules/setting/route.js'),
  broadcast:  () => import('../modules/broadcast/route.js'),
};

const _mounted = new Set();
async function mountPage(name) {
  if (_mounted.has(name) || !ROUTE_REGISTRY[name]) return;
  const mod = await ROUTE_REGISTRY[name]();
  if (mod && typeof mod.mount === 'function') {
    await mod.mount(document.getElementById('desktop-content'), document.getElementById('modals-root'));
  }
  _mounted.add(name);
}
export { ROUTE_REGISTRY, mountPage };

// ── DASHBOARD ──

// ── shim fungsi ke global (handler inline lama + pemanggilan antar-file) ──
Object.assign(globalThis, { switchPage, renderPage });
export { switchPage, renderPage };
