// js/app.js — BOOT saja. Import core → sync → modul, lalu mount partial & start.
// Semua logika ada di js/core/*, js/sync/*, js/modules/*. File ini < 150 baris.

// ── core (urutan penting: config dulu) ──
import './core/config.js';
import './core/utils.js';
import './core/db.js';
import './core/events.js';
import './core/partials.js';
import './core/pwa.js';

// ── sync ──
import './sync/status.js';
import './sync/queue.js';
import './sync/firestore.js';
import './sync/sheets.js';

// ── auth + router ──
import './core/auth.js';
import { ROUTE_REGISTRY, mountPage, switchPage } from './core/router.js';

// ── modul (16) — dimuat supaya fungsi bersama terpasang ke globalThis ──
import './modules/dashboard/route.js';
import './modules/crm/route.js';
import './modules/kelas/route.js';
import './modules/spp/route.js';
import './modules/guru/route.js';
import './modules/bos/route.js';
import './modules/akademik/route.js';
import './modules/jadwal/route.js';
import './modules/kalender/route.js';
import './modules/komunikasi/route.js';
import './modules/inventaris/route.js';
import './modules/alumni/route.js';
import './modules/laporan/route.js';
import './modules/radar/route.js';
import './modules/setting/route.js';
import './modules/broadcast/route.js';

globalThis.__appReady = false;

// ── Init IIFE yang dulu ada di inline script (dipindah ke sini) ──
function initBannerSync() {
  const d = loadDB();
  const nama = d.sekolah_pro.profil_sekolah.nama || 'SD Islam Sahara';
  ['banner-school-name', 'banner-nama-besar', 'sidebar-school-name'].forEach((id) => {
    const el = document.getElementById(id); if (el) el.textContent = nama;
  });
  const taEl = document.getElementById('banner-ta');
  if (taEl) taEl.textContent = 'T.A. ' + (d.sekolah_pro.profil_sekolah.tahun_ajaran || new Date().getFullYear() + '/' + (new Date().getFullYear() + 1));
  const tglEl = document.getElementById('banner-tanggal');
  if (tglEl) tglEl.textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function repairPiutangStatus() {
  try {
    const d = getD();
    let changed = false;
    (d.data_siswa || []).forEach((s) => {
      if (!s.piutang_detail || !s.piutang_detail.length) {
        const correct = (s.total_piutang || 0) <= 0 ? 'Lunas' : 'Tunggakan';
        if (s.status_spp !== correct) { s.status_spp = correct; changed = true; }
        return;
      }
      const prevStatus = s.status_spp;
      const prevTotal = s.total_piutang;
      _recalcPiutang(s);
      if (s.status_spp !== prevStatus || s.total_piutang !== prevTotal) changed = true;
    });
    if (changed) { saveDB(); console.log('[SekolahPro] Auto-repair: piutang status disinkronkan'); }
  } catch (e) { /* silent */ }
}

function initKelasConfig() {
  try {
    const saved = localStorage.getItem('sekolah_pro_db');
    if (!saved) return;
    const db = JSON.parse(saved);
    const sp = db.sekolah_pro;
    let changed = false;
    if (!sp.kelas_config) { sp.kelas_config = { jenjang: 'SD', rombel_aktif: ['A', 'B', 'C'] }; changed = true; }
    if (!sp.wali_kelas) { sp.wali_kelas = {}; changed = true; }
    if (changed) localStorage.setItem('sekolah_pro_db', JSON.stringify(db));
  } catch (e) { /* silent */ }
}

async function boot() {
  // 1. inject login + semua partial (DOM identik dengan versi lama)
  await globalThis.mountLogin(document.getElementById('login-root'));
  // banner peringatan protocol (dulu inline <script> di login)
  (function () {
    const p = location.protocol;
    if (p === 'file:' || p === 'content:') {
      const w = document.getElementById('login-protocol-warn');
      if (w) w.style.display = 'block';
    }
  })();
  const names = Object.keys(ROUTE_REGISTRY);
  await Promise.all(names.map((n) => mountPage(n)));

  // 2. init satu kali
  initBannerSync();
  repairPiutangStatus();
  initKelasConfig();
  loadTheme();
  setTimeout(initPinLock, 300);

  // 3. render awal
  buildTicker();
  renderDashboard();
  _syncKelasDropdowns();

  globalThis.__appReady = true;

  // 4. tampilkan halaman aman (RBAC menahan sampai role siap)
  switchPage('dashboard');
}

boot().catch((e) => console.error('[boot] gagal:', e));
