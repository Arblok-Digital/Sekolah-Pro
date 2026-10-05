// js/modules/bos/route.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

import './logic.js';
import './pipeline.js';

function renderBOS() {
  if (isOfflineMode()) { requireOnline('Dana BOS'); return; }
  const d = getD();
  const bos = d.dana_bos;
  document.getElementById('bos-pagu-display').textContent = fmt(bos.pagu_tahunan);
  document.getElementById('bos-terpakai-display').textContent = fmt(bos.terpakai);
  document.getElementById('bos-sisa-display').textContent = fmt(bos.sisa_anggaran);
  const pct = bos.pagu_tahunan > 0 ? Math.min(100, Math.round((bos.terpakai / bos.pagu_tahunan)*100)) : 0;
  const bar = document.getElementById('bos-bar-big');
  bar.style.width = pct + '%';
  bar.textContent = pct > 10 ? pct + '%' : '';

  const el = document.getElementById('bos-log-list');
  if (!bos.log_pengeluaran.length) {
    el.innerHTML = '<div class="empty-state"><span class="empty-icon">📄</span><span class="empty-text">Belum ada pengeluaran BOS</span></div>';
    return;
  }
  const katColors = {'Alat Tulis':'var(--blu)','Sarana Prasarana':'var(--grn)','Kegiatan Siswa':'var(--yel)','Honor GTT':'var(--pur)','Pemeliharaan':'var(--amb)','Lainnya':'var(--t2)'};
  const recent = bos.log_pengeluaran.slice(-30).reverse();
  el.innerHTML = recent.map(log => `
    <div class="log-item">
      <div class="log-dot" style="background:${katColors[log.kategori]||'var(--t2)'}"></div>
      <div class="log-info">
        <div class="log-desc">${log.deskripsi}</div>
        <div class="log-date">${new Date(log.tanggal).toLocaleDateString('id-ID',{dateStyle:'medium'})} · <span class="bdg bdg-am">${log.kategori}</span></div>
      </div>
      <div class="log-amt">-${fmt(log.jumlah)}</div>
    </div>
  `).join('');
}


Object.assign(globalThis, { renderBOS });

export async function mount(container, modalsRoot) {
  return globalThis.mountPartial('bos', container, modalsRoot);
}
export { renderBOS };
