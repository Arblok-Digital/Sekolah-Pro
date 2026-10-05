// js/modules/kelas/logic.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

function getKelasList() {
  const d  = getD();
  const kc = d.kelas_config || { jenjang:'SD', rombel_aktif:['A','B','C'] };
  const jenjang = JENJANG_CFG[kc.jenjang] || JENJANG_CFG.SD;
  const rombel  = (kc.rombel_aktif && kc.rombel_aktif.length) ? kc.rombel_aktif : ['A','B','C'];
  const list = [];
  jenjang.tingkat.forEach(t => {
    rombel.forEach(r => list.push(`${t}-${r}`));
  });
  return list;
}

// ── Helper: hitung jumlah siswa per kelas ────────────────────────

function getSiswaPerKelas() {
  const d = getD();
  const map = {};
  (d.data_siswa || []).forEach(s => {
    const k = (s.kelas || '').trim();
    if (k) map[k] = (map[k] || 0) + 1;
  });
  return map;
}

// ── renderKelas() — halaman utama kelas ──────────────────────────

function filterCRMByKelas(kelas) {
  switchPage('crm');
  setTimeout(() => {
    const searchEl = document.getElementById('crm-search');
    if (searchEl) {
      // Set filter kelas di search box
      searchEl.value = kelas;
      renderCRM();
      showNotif(`🏫 Menampilkan siswa kelas ${kelas}`, 'ok');
    }
  }, 150);
}

// ── Atur jenjang ─────────────────────────────────────────────────

function _getActiveRombel() {
  const active = [];
  document.querySelectorAll('.rombel-btn.on').forEach(b => active.push(b.getAttribute('data-r')));
  return active.length ? active : ['A','B','C'];
}

// ── Toggle rombel ─────────────────────────────────────────────────

Object.assign(globalThis, { getKelasList, getSiswaPerKelas, filterCRMByKelas, _getActiveRombel });
export { getKelasList, getSiswaPerKelas, filterCRMByKelas, _getActiveRombel };
