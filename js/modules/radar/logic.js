// js/modules/radar/logic.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

function hitungRadar() {
  if (isOfflineMode()) { requireOnline('Radar Kesehatan'); return; }
  const d = getD();
  const sppTotal = (d.riwayat_spp || []).reduce((a,s) => a + s.jumlah, 0);
  const infakTotal = d.infak_harian.reduce((a,i) => a + i.jumlah, 0);
  const totalPemasukan = sppTotal + infakTotal;
  const totalGaji = d.keuangan_guru.reduce((a,g) => a + (g.total_terima||0), 0);
  const bosKeluar = d.dana_bos.terpakai;
  const totalPiutang = d.data_siswa.reduce((a,s) => a + (s.total_piutang||0), 0);
  const totalSiswa = d.data_siswa.length;
  const lunasCount = d.data_siswa.filter(s => s.status_spp === 'Lunas').length;

  // Update display
  document.getElementById('hm-pemasukan').textContent = fmtShort(totalPemasukan);
  document.getElementById('hm-gaji').textContent = fmtShort(totalGaji);
  document.getElementById('hm-bos').textContent = fmtShort(bosKeluar);
  document.getElementById('hm-piutang').textContent = fmtShort(totalPiutang);
  document.getElementById('hm-infak').textContent = fmtShort(infakTotal);

  // Bars (relative to max)
  const maxVal = Math.max(totalPemasukan, totalGaji, bosKeluar, totalPiutang, infakTotal, 1);
  document.getElementById('hm-bar-1').style.width = Math.round((totalPemasukan/maxVal)*100) + '%';
  document.getElementById('hm-bar-2').style.width = Math.round((totalGaji/maxVal)*100) + '%';
  document.getElementById('hm-bar-3').style.width = Math.round((bosKeluar/maxVal)*100) + '%';
  document.getElementById('hm-bar-4').style.width = Math.round((totalPiutang/maxVal)*100) + '%';
  document.getElementById('hm-bar-5').style.width = Math.round((infakTotal/maxVal)*100) + '%';

  // Rasio
  const r1 = totalPemasukan > 0 ? (totalGaji / totalPemasukan) * 100 : 0;
  const r2 = totalSiswa > 0 ? (lunasCount / totalSiswa) * 100 : 100;
  const r3 = d.dana_bos.pagu_tahunan > 0 ? (bosKeluar / d.dana_bos.pagu_tahunan) * 100 : 0;
  const r4 = totalGaji > 0 ? Math.min(100, (totalPemasukan / totalGaji) * 100) : 100;

  document.getElementById('r-ratio-1').textContent = r1.toFixed(0) + '%';
  document.getElementById('r-ratio-2').textContent = r2.toFixed(0) + '%';
  document.getElementById('r-ratio-3').textContent = r3.toFixed(0) + '%';
  document.getElementById('r-ratio-4').textContent = r4.toFixed(0) + '%';
  document.getElementById('rb-1').style.width = Math.min(r1,100) + '%';
  document.getElementById('rb-2').style.width = r2 + '%';
  document.getElementById('rb-3').style.width = Math.min(r3,100) + '%';
  document.getElementById('rb-4').style.width = Math.min(r4,100) + '%';

  // Health Score 0-100
  let score = 100;
  // Gaji/Pemasukan > 80% → buruk
  if (r1 > 80) score -= 25;
  else if (r1 > 60) score -= 10;
  // Kolektibilitas SPP
  if (r2 < 50) score -= 25;
  else if (r2 < 75) score -= 10;
  // BOS utilization > 90% → warning
  if (r3 > 90) score -= 15;
  // Coverage gaji
  if (r4 < 80) score -= 20;
  else if (r4 < 100) score -= 5;
  // Ada piutang besar
  if (totalPiutang > totalPemasukan * 0.3) score -= 10;
  score = Math.max(0, Math.min(100, score));

  const scoreEl = document.getElementById('health-score-num');
  const gradeEl = document.getElementById('health-grade');
  const descEl = document.getElementById('health-desc');
  scoreEl.textContent = score;

  let color, grade, desc;
  if (score >= 80) {
    color = 'var(--grn)'; grade = '🟢 SEHAT'; desc = 'Keuangan sekolah dalam kondisi baik';
  } else if (score >= 60) {
    color = 'var(--yel)'; grade = '🟡 WASPADA'; desc = 'Ada beberapa indikator yang perlu diperhatikan';
  } else if (score >= 40) {
    color = 'var(--amb)'; grade = '🟠 SIAGA'; desc = 'Keuangan memerlukan perhatian segera';
  } else {
    color = 'var(--red)'; grade = '🔴 KRITIS'; desc = 'Keuangan dalam kondisi kritis!';
  }
  scoreEl.style.color = color;
  gradeEl.style.color = color;
  gradeEl.textContent = grade;
  descEl.textContent = desc;

  // Rekomendasi
  const reks = [];
  if (r1 > 80) reks.push({ icon: '⚠️', color: 'var(--red)', text: 'Beban gaji terlalu besar (>80% pemasukan). Pertimbangkan efisiensi.' });
  if (r2 < 75) reks.push({ icon: '💳', color: 'var(--yel)', text: `Tingkatkan kolektibilitas SPP (saat ini ${r2.toFixed(0)}%). Aktifkan penagihan.` });
  if (r3 > 80) reks.push({ icon: '🏦', color: 'var(--amb)', text: `Dana BOS hampir habis (${r3.toFixed(0)}% terpakai). Rencanakan anggaran.` });
  if (r4 < 100) reks.push({ icon: '💸', color: 'var(--red)', text: 'Pemasukan tidak cukup untuk menutup semua gaji. Cari sumber tambahan.' });
  if (totalPiutang > 0) reks.push({ icon: '📋', color: 'var(--yel)', text: `Ada piutang SPP ${fmt(totalPiutang)}. Segera tindak lanjuti.` });
  if (reks.length === 0) reks.push({ icon: '🌟', color: 'var(--grn)', text: 'Semua indikator dalam kondisi baik! Pertahankan performa ini.' });

  document.getElementById('rekomendasi-list').innerHTML = reks.map(r =>
    `<div style="display:flex;gap:8px;padding:8px;background:${r.color}15;border-radius:8px;border-left:3px solid ${r.color}">
      <span>${r.icon}</span>
      <span style="font-size:12px;color:var(--t1);line-height:1.5">${r.text}</span>
    </div>`
  ).join('');
}

// ── SETTINGS ──

Object.assign(globalThis, { hitungRadar });
export { hitungRadar };
