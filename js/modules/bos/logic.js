// js/modules/bos/logic.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

function keluarBOS() {
  const desc = document.getElementById('bos-desc-inp').value.trim();
  const jumlah = parseFloat(document.getElementById('bos-jumlah-inp').value) || 0;
  const kategori = document.getElementById('bos-kat-inp').value;
  if (!desc) { showNotif('Deskripsi wajib diisi!', 'err'); return; }
  if (jumlah <= 0) { showNotif('Jumlah harus > 0!', 'err'); return; }
  const d = getD();
  if (jumlah > d.dana_bos.sisa_anggaran) {
    showNotif(`⚠️ Melebihi sisa BOS! Sisa: ${fmt(d.dana_bos.sisa_anggaran)}`, 'err'); return;
  }
  d.dana_bos.terpakai += jumlah;
  d.dana_bos.sisa_anggaran = d.dana_bos.pagu_tahunan - d.dana_bos.terpakai;
  d.dana_bos.log_pengeluaran.push({ id: 'BOS' + Date.now(), deskripsi: desc, jumlah, kategori, tanggal: new Date().toISOString() });
  addAktivitas('bos', `BOS: ${desc} (${kategori})`, -jumlah);
  saveDB(); buildTicker(); closeModal('modal-bos-keluar');
  document.getElementById('bos-desc-inp').value = '';
  document.getElementById('bos-jumlah-inp').value = '';
  showNotif(`✅ Pengeluaran BOS ${fmt(jumlah)} tercatat!`, 'ok');
  if (currentPage === 'bos') renderBOS();
  if (currentPage === 'dashboard') renderDashboard();
}

// ── RADAR KESEHATAN ──

Object.assign(globalThis, { keluarBOS });
export { keluarBOS };
