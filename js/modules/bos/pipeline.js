// js/modules/bos/pipeline.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

function setPaguBOS() {
  const pagu = parseFloat(document.getElementById('bos-pagu-inp').value) || 0;
  if (pagu <= 0) { showNotif('Pagu harus > 0!', 'err'); return; }
  const d = getD();
  d.dana_bos.pagu_tahunan = pagu;
  d.dana_bos.sisa_anggaran = pagu - d.dana_bos.terpakai;
  addAktivitas('bos', `Pagu BOS ditetapkan ${fmt(pagu)}`, 0);
  saveDB(); buildTicker(); closeModal('modal-bos-pagu');
  document.getElementById('bos-pagu-inp').value = '';
  showNotif(`✅ Pagu BOS ${fmt(pagu)} berhasil disimpan!`, 'ok');
  if (currentPage === 'bos') renderBOS();
  if (currentPage === 'dashboard') renderDashboard();
}


Object.assign(globalThis, { setPaguBOS });
export { setPaguBOS };
