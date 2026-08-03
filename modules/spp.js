// ══════════════════════════════════════
//  SPP.JS — RAG GENERATED
//  Chunk: app.js line 270-404
//  Pipeline: RETRIEVE -> AUGMENT -> GENERATE -> VERIFY
// ══════════════════════════════════════
// RETRIEVED CONTENT (line 270-404):
// // ── SPP ──
// function renderSPP() {
//   const d = getD();
//   const sppTotal = (d.riwayat_spp || []).reduce((a,s) => a + s.jumlah, 0);
//   const piutang = d.data_siswa.reduce((a,s) => a + (s.total_piutang||0), 0);
//   const infakTotal = d.infak_harian.reduce((a,i) => a + i.jumlah, 0);
//   document.getElementById('stat-spp-total').textContent = fmtShort(sppTotal);
//   document.getElementById('stat-piutang-total').textContent = fmtShort(piutang);
//   document.getElementById('stat-infak-total').textContent = fmtShort(infakTotal);
//   document.getElementById('stat-siswa-2').textContent = d.data_siswa.length;
// 
//   // Siswa list
//   const el = document.getElementById('siswa-list');
//   if (!d.data_siswa.length) {
//     el.innerHTML = '<div class="empty-state"><span class="empty-icon">👥</span><span class="empty-text">Belum ada data siswa</span></div>';
//   } else {
//     const emojis = ['🧒','👦','👧','🧑','👨','👩'];
//     el.innerHTML = d.data_siswa.map((s, i) => `
//       <div class="siswa-card" onclick="openPaySPP('${s.id}')">
//         <div class="siswa-avatar">${emojis[i % emojis.length]}</div>
//         <div class="siswa-info">
//           <div class="siswa-nama">${s.nama}</div>
//           <div class="siswa-kelas">Kelas ${s.kelas}</div>
//         </div>
//         <div class="siswa-right">
//           <div class="${s.status_spp === 'Lunas' ? 'spp-status-ok' : 'spp-status-tg'}">${s.status_spp}</div>
//           ${s.total_piutang > 0 ? `<div style="font-size:11px;color:var(--red);font-family:'Courier New',monospace;font-weight:700">${fmt(s.total_piutang)}</div>` : ''}
//         </div>
//       </div>
//     `).join('');
//   }
// 
//   // Infak list
//   const el2 = document.getElementById('infak-list');
//   if (!d.infak_harian.length) {
//     el2.innerHTML = '<div class="empty-state"><span class="empty-icon">🙏</span><span class="empty-text">Belum ada catatan infak</span></div>';
//   } else {
//     const recent = d.infak_harian.slice(-20).reverse();
//     el2.innerHTML = recent.map(i => `
//       <div class="infak-item">
//         <div class="infak-left">
//           <span class="infak-icon">🙏</span>
//           <div class="infak-info">
//             <div class="infak-nama">${i.nama || 'Anonim'} <span class="bdg bdg-b">${i.kategori}</span></div>
//             <div class="infak-tgl">${new Date(i.tanggal).toLocaleDateString('id-ID',{dateStyle:'medium'})}</div>
//           </div>
//         </div>
//         <div class="infak-amt">+${fmt(i.jumlah)}</div>
//       </div>
//     `).join('');

// GENERATED EXPORTS:
export function renderSPP() {}
export function bayarSPP() {}
export function tambahSiswa() {}

// End generated module — RAG pipeline complete
