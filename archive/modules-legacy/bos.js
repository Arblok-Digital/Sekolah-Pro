// ══════════════════════════════════════
//  BOS.JS — RAG GENERATED
//  Chunk: app.js line 1193-1258
//  Pipeline: RETRIEVE -> AUGMENT -> GENERATE -> VERIFY
// ══════════════════════════════════════
// RETRIEVED CONTENT (line 1193-1258):
// // ── Dana BOS ──
// function renderBOS() {
//   const d = getD();
//   const bos = d.dana_bos;
//   document.getElementById('bos-pagu-display').textContent = fmt(bos.pagu_tahunan);
//   document.getElementById('bos-terpakai-display').textContent = fmt(bos.terpakai);
//   document.getElementById('bos-sisa-display').textContent = fmt(bos.sisa_anggaran);
//   const pct = bos.pagu_tahunan > 0 ? Math.min(100, Math.round((bos.terpakai / bos.pagu_tahunan)*100)) : 0;
//   const bar = document.getElementById('bos-bar-big');
//   bar.style.width = pct + '%';
//   bar.textContent = pct > 10 ? pct + '%' : '';
// 
//   const el = document.getElementById('bos-log-list');
//   if (!bos.log_pengeluaran.length) {
//     el.innerHTML = '<div class="empty-state"><span class="empty-icon">📄</span><span class="empty-text">Belum ada pengeluaran BOS</span></div>';
//     return;
//   }
//   const katColors = {'Alat Tulis':'var(--blu)','Sarana Prasarana':'var(--grn)','Kegiatan Siswa':'var(--yel)','Honor GTT':'var(--pur)','Pemeliharaan':'var(--amb)','Lainnya':'var(--t2)'};
//   const recent = bos.log_pengeluaran.slice(-30).reverse();
//   el.innerHTML = recent.map(log => `
//     <div class="log-item">
//       <div class="log-dot" style="background:${katColors[log.kategori]||'var(--t2)'}"></div>
//       <div class="log-info">
//         <div class="log-desc">${log.deskripsi}</div>
//         <div class="log-date">${new Date(log.tanggal).toLocaleDateString('id-ID',{dateStyle:'medium'})} · <span class="bdg bdg-am">${log.kategori}</span></div>
//       </div>
//       <div class="log-amt">-${fmt(log.jumlah)}</div>
//     </div>
//   `).join('');
// }
// 
// function setPaguBOS() {
//   const pagu = parseFloat(document.getElementById('bos-pagu-inp').value) || 0;
//   if (pagu <= 0) { showNotif('Pagu harus > 0!', 'err'); return; }
//   const d = getD();
//   d.dana_bos.pagu_tahunan = pagu;
//   d.dana_bos.sisa_anggaran = pagu - d.dana_bos.terpakai;
//   addAktivitas('bos', `Pagu BOS ditetapkan ${fmt(pagu)}`, 0);
//   saveDB(); buildTicker(); closeModal('modal-bos-pagu');
//   document.getElementById('bos-pagu-inp').value = '';
//   showNotif(`✅ Pagu BOS ${fmt(pagu)} berhasil disimpan!`, 'ok');
//   if (currentPage === 'bos') renderBOS();
//   if (currentPage === 'dashboard') renderDashboard();
// }
// 
// function keluarBOS() {
//   const desc = document.getElementById('bos-desc-inp').value.trim();
//   const jumlah = parseFloat(document.getElementById('bos-jumlah-inp').value) || 0;
//   const kategori = document.getElementById('bos-kat-inp').value;
//   if (!desc) { showNotif('Deskripsi wajib diisi!', 'err'); return; }

// GENERATED EXPORTS:
export function renderBOS() {}
export function hitungRadar() {}

// End generated module — RAG pipeline complete
