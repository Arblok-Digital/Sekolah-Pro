// js/core/db.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

globalThis.DEFAULT_DATA = {
  sekolah_pro: {
    profil_sekolah: {
      nama: "SD Islam Sahara",
      saldo_utama: 0,
      spp_nominal: 150000,
      pengumuman: "Selamat datang di Sekolah Pro! 🏫",
      tahun_ajaran: "2025/2026",
      pin_enabled: false,
      pin_hash: null
    },
    // ── Konfigurasi Kelas (baru) ──────────────────────────────────
    kelas_config: {
      jenjang: 'SD',              // 'SD' | 'SMP' | 'SMA'
      rombel_aktif: ['A','B','C'], // sub-kelas yang aktif
      // Map tingkat → array kelas lengkap, di-generate dari jenjang+rombel
      // Format: "1-A", "7-B", "10-C" dll
    },
    wali_kelas: {},               // { "1-A": { guru_id, nama_guru }, ... }
    data_siswa: [],
    keuangan_guru: [],
    dana_bos: { pagu_tahunan: 0, terpakai: 0, sisa_anggaran: 0, log_pengeluaran: [] },
    infak_harian: [],
    riwayat_spp: [],
    riwayat_aktivitas: [],
    alumni: [],
    payroll_config: {
      bpjs_kes: 50000,
      bpjs_tk: 25000,
      uang_makan_per_hari: 15000,
      transport_per_hari: 10000,
      hari_kerja_default: 22
    },
    arsip_gaji: [],
    akademik_config: {
      tahun_ajaran_aktif: "2025/2026",
      semester: "Ganjil",
      kelas_max: 6,
      logic_kenaikan: {
        status_pilihan: ["Aktif", "Lulus", "Pindah", "Keluar"],
        tingkat_kelas: [1, 2, 3, 4, 5, 6]
      },
      history_ta: [],
      log_akademik: [],
      mutasi_log: [],
      spp_arsip: {},
      history_alumni: []
    }
  }
};


globalThis.DB = loadDB();

function loadDB() {
  try {
    const saved = localStorage.getItem('sekolah_pro_db');
    return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(DEFAULT_DATA));
  } catch { return JSON.parse(JSON.stringify(DEFAULT_DATA)); }
}

function saveDB() {
  try {
    localStorage.setItem('sekolah_pro_db', JSON.stringify(DB));
  } catch (e) {
    // Quota localStorage penuh / private mode — JANGAN lanjut queue sync
    // (data belum tersimpan, sync akan kirim data basi)
    console.error('[SP] Gagal simpan ke localStorage:', e && e.name, e && e.message);
    return;
  }
  // Queue background sync to Firestore if available
  if (typeof _fbSyncQueue === 'function') _fbSyncQueue();
  // Update counter dashboard real-time tanpa full render (dulu dipasang via patch window.saveDB)
  try {
    const d = getD();
    const el = document.getElementById('stat-siswa');
    if (el) el.textContent = d.data_siswa.length;
    const el2 = document.getElementById('stat-siswa-2');
    if (el2) el2.textContent = d.data_siswa.length;
    if (typeof buildTicker === 'function') buildTicker();
  } catch (e) { /* silent */ }
}

function getD() { return DB.sekolah_pro; }

// ── shim fungsi ke global (handler inline lama + pemanggilan antar-file) ──
Object.assign(globalThis, { loadDB, saveDB, getD });
export { loadDB, saveDB, getD };
