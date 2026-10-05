// js/modules/kelas/pipeline.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

function saveKelasConfig() {
  const d = getD();
  const jenjangBtn = document.querySelector('.jenjang-btn.on');
  const jenjang    = jenjangBtn ? jenjangBtn.getAttribute('data-j') : 'SD';
  const rombel     = _getActiveRombel();

  if (!rombel.length) {
    showNotif('Pilih minimal 1 sub kelas (A/B/C...)', 'err'); return;
  }

  d.kelas_config = { jenjang, rombel_aktif: rombel };
  if (!d.wali_kelas) d.wali_kelas = {};
  saveDB();

  // Sync akademik_config.tingkat_kelas
  const jCfg = JENJANG_CFG[jenjang] || JENJANG_CFG.SD;
  if (d.akademik_config) d.akademik_config.logic_kenaikan.tingkat_kelas = jCfg.tingkat;

  saveDB();
  showNotif(`✅ Kelas ${jenjang} dengan sub ${rombel.join(',')} disimpan!`, 'ok');
  renderKelas();

  // Refresh dropdown kelas di semua form
  _syncKelasDropdowns();
}

// ── Sync semua dropdown kelas di app ─────────────────────────────

function simpanWaliKelas() {
  const kelas   = (document.getElementById('wk-kelas-sel') || {}).value;
  const guruId  = (document.getElementById('wk-guru-sel')  || {}).value;
  if (!kelas)  { showNotif('Pilih kelas dulu', 'err'); return; }
  if (!guruId) { showNotif('Pilih guru dulu',  'err'); return; }

  const d     = getD();
  const guru  = (d.keuangan_guru || []).find(g => g.id === guruId);
  if (!guru)  { showNotif('Guru tidak ditemukan', 'err'); return; }

  if (!d.wali_kelas) d.wali_kelas = {};
  d.wali_kelas[kelas] = { guru_id: guruId, nama_guru: guru.nama };
  saveDB();

  closeModal('modal-walikelas');
  showNotif(`✅ ${guru.nama} ditugaskan sebagai wali kelas ${kelas}`, 'ok');
  renderKelas();
}

// ── Hapus wali kelas ──────────────────────────────────────────────

function hapusWaliKelas(kelas) {
  const d = getD();
  if (d.wali_kelas && d.wali_kelas[kelas]) {
    delete d.wali_kelas[kelas];
    saveDB();
    showNotif(`Wali kelas ${kelas} dihapus`, 'ok');
    renderKelas();
  }
}

// ════════════════════════════════════════════════════════════════════
//  OFFLINE vs ONLINE — Helper & UI Differentiation
// ════════════════════════════════════════════════════════════════════

// Cek apakah sedang dalam mode offline (bukan logged-in Firebase)
// ════════════════════════════════════════════════════════════════════
//  LOCKED FEATURE HANDLER
//  Dipanggil saat user klik menu yang terkunci (role tidak punya akses)
//  Menampilkan modal informatif tentang fitur + cara upgrade
// ════════════════════════════════════════════════════════════════════
// ── WA Hubungi Arblok Digital dari modal locked feature ──────────

Object.assign(globalThis, { saveKelasConfig, simpanWaliKelas, hapusWaliKelas });
export { saveKelasConfig, simpanWaliKelas, hapusWaliKelas };
