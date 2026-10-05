// ══════════════════════════════════════
//  DASHBOARD.JS — RAG GENERATED
//  Chunk: app.js line 186-268
//  Pipeline: RETRIEVE -> AUGMENT -> GENERATE -> VERIFY
// ══════════════════════════════════════
// RETRIEVED CONTENT (line 186-268):
// // ── DASHBOARD ──
// function renderDashboard() {
//   const d = getD();
//   const namaSekolah = d.profil_sekolah.nama || 'SD Islam Sahara';
// 
//   // Sync all school name locations
//   ['banner-school-name','banner-nama-besar','sidebar-school-name'].forEach(id => {
//     const el = document.getElementById(id); if (el) el.textContent = namaSekolah;
//   });
// 
//   // Tanggal hari ini di banner
//   const tglEl = document.getElementById('banner-tanggal');
//   if (tglEl) tglEl.textContent = new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
// 
//   // Tahun ajaran (setting)
//   const taEl = document.getElementById('banner-ta');
//   if (taEl) taEl.textContent = 'T.A. ' + (d.profil_sekolah.tahun_ajaran || new Date().getFullYear() + '/' + (new Date().getFullYear()+1));
// 
//   document.getElementById('saldo-display').textContent = fmt(d.profil_sekolah.saldo_utama);
//   document.getElementById('stat-siswa').textContent = d.data_siswa.length;
//   const lunas = d.data_siswa.filter(s => s.status_spp === 'Lunas').length;
//   const tunggak = d.data_siswa.filter(s => s.status_spp === 'Tunggakan').length;
//   document.getElementById('stat-lunas').textContent = lunas;
//   document.getElementById('stat-tunggak').textContent = tunggak;
// 
//   // Infak hari ini
//   const today = new Date().toDateString();
//   const infakHariIni = d.infak_harian
//     .filter(i => new Date(i.tanggal).toDateString() === today)
//     .reduce((a, i) => a + i.jumlah, 0);
//   document.getElementById('stat-infak-today').textContent = fmtShort(infakHariIni);
// 
//   // BOS
//   const pct = d.dana_bos.pagu_tahunan > 0
//     ? Math.round((d.dana_bos.terpakai / d.dana_bos.pagu_tahunan)*100) : 0;
//   document.getElementById('bos-bar').style.width = Math.min(pct,100) + '%';
//   document.getElementById('bos-pct-badge').textContent = pct + '%';
//   document.getElementById('bos-pct-badge').className = 'bdg ' + (pct > 80 ? 'bdg-r' : pct > 50 ? 'bdg-am' : 'bdg-g');
//   document.getElementById('bos-terpakai-d').textContent = fmtShort(d.dana_bos.terpakai);
//   document.getElementById('bos-sisa-d').textContent = fmtShort(d.dana_bos.sisa_anggaran);
// 
//   // ── REMINDER PANEL ──
//   const reminders = buildReminders();
//   const rPanel = document.getElementById('reminder-panel');
//   const rList = document.getElementById('reminder-list');
//   if (reminders.length > 0) {
//     rPanel.style.display = 'block';
//     rList.innerHTML = reminders.slice(0,5).map(r => `
//       <div class="reminder-item">
//         <div class="reminder-dot" style="background:${r.color}"></div>

// GENERATED EXPORTS:
export function renderDashboard() {}
export function buildTicker() {}

// End generated module — RAG pipeline complete
