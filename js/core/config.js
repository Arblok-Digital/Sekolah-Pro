// js/core/config.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

globalThis.JENJANG_CFG = {
  SD:  { label:'SD / MI',   tingkat:[1,2,3,4,5,6],  prefix:'', icon:'🏫' },
  SMP: { label:'SMP / MTs', tingkat:[7,8,9],          prefix:'', icon:'📚' },
  SMA: { label:'SMA / SMK', tingkat:[10,11,12],       prefix:'', icon:'🎓' },
};

// RBAC — halaman yang boleh diakses per role

globalThis._FB_ROLE_PAGES = {
  dev:     ['dashboard','crm','kelas','spp','guru','bos','akademik','jadwal',
            'kalender','komunikasi','inventaris','alumni','laporan','radar','setting','broadcast'],
  admin:   ['dashboard','crm','kelas','spp','guru','bos','akademik','jadwal',
            'kalender','komunikasi','inventaris','alumni','laporan','radar','setting'],
  guru:    ['dashboard','crm','kelas','jadwal','kalender','komunikasi','laporan'],
  siswa:   ['dashboard','spp','setting'],
  ortu:    ['dashboard','komunikasi'],
  offline: ['dashboard','crm','kelas','spp','guru','akademik','jadwal','kalender','laporan','setting'],
};

// Halaman home per role

globalThis._FB_HOME_PAGE = {
  dev:     'dashboard',
  admin:   'dashboard',
  guru:    'crm',
  siswa:   'spp',
  ortu:    'komunikasi',
  offline: 'dashboard',
};

// ════════════════════════════════════════════════════════════════════

globalThis._FB_CFG = {
  apiKey:            "AIzaSyATc7UWSIwLyYlex34lQaiLZUPuMz3ZreA",
  authDomain:        "sekolahpro-a0ff0.firebaseapp.com",
  projectId:         "sekolahpro-a0ff0",
  storageBucket:     "sekolahpro-a0ff0.firebasestorage.app",
  messagingSenderId: "287917969897",
  appId:             "1:287917969897:web:8c04d83c61bd503642bb78"
};

// ── State ─────────────────────────────────────────

// ── shim fungsi ke global (handler inline lama + pemanggilan antar-file) ──
Object.assign(globalThis, {  });
