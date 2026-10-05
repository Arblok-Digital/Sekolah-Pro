// js/modules/alumni/pipeline.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

function simpanAlumni() {
  const nama = document.getElementById('al-nama-inp').value.trim();
  if (!nama) { showNotif('Nama alumni wajib diisi!', 'err'); return; }
  const d = getAlumniDB();
  d.alumni.push({
    id: 'AL' + Date.now(), nama,
    nisn: document.getElementById('al-nisn-inp').value.trim(),
    tahun_lulus: parseInt(document.getElementById('al-tahun-inp').value) || new Date().getFullYear(),
    nilai_rata: document.getElementById('al-nilai-inp').value || null,
    sekolah_lanjutan: document.getElementById('al-sekolah-inp').value.trim(),
    status: document.getElementById('al-status-inp').value,
    prestasi: document.getElementById('al-prestasi-inp').value.trim(),
    tgl_input: new Date().toISOString()
  });
  saveDB(); closeModal('modal-alumni-add');
  ['al-nama-inp','al-nisn-inp','al-tahun-inp','al-nilai-inp','al-sekolah-inp','al-prestasi-inp'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  showNotif(`✅ Alumni "${nama}" berhasil ditambah!`, 'ok');
  renderAlumni();
}


function hapusAlumni(alId) {
  const d = getAlumniDB();
  const a = d.alumni.find(x => x.id === alId);
  if (!a || !confirm(`Hapus data alumni ${a.nama}?`)) return;
  d.alumni = d.alumni.filter(x => x.id !== alId);
  saveDB(); showNotif(`🗑️ Alumni ${a.nama} dihapus`, 'ok'); renderAlumni();
}


function luluskanSiswa() {
  const d = getD();
  const kelas6 = d.data_siswa.filter(s => (s.kelas||'').startsWith('6'));
  if (!kelas6.length) { showNotif('Tidak ada siswa kelas 6!', 'warn'); return; }
  if (!confirm(`Luluskan ${kelas6.length} siswa kelas 6 dan pindahkan ke data alumni?`)) return;
  if (!d.alumni) d.alumni = [];
  const tahun = new Date().getFullYear();
  kelas6.forEach(s => {
    // Hitung rata-rata nilai
    const allNilai = [...((s.nilai||{})['1']||[]), ...((s.nilai||{})['2']||[])];
    const byM = {};
    allNilai.forEach(n=>{if(!byM[n.mapel])byM[n.mapel]=[];byM[n.mapel].push(n.nilai);});
    const avgs = Object.values(byM).map(v=>v.reduce((a,b)=>a+b,0)/v.length);
    const avg = avgs.length ? (avgs.reduce((a,b)=>a+b,0)/avgs.length).toFixed(1) : null;
    d.alumni.push({
      id: 'AL'+Date.now()+Math.random(), nama: s.nama, nisn: s.nisn,
      tahun_lulus: tahun, nilai_rata: avg, sekolah_lanjutan: '',
      status: 'lanjut', prestasi: '', tgl_input: new Date().toISOString(),
      data_siswa_id: s.id
    });
  });
  // Hapus dari data siswa
  d.data_siswa = d.data_siswa.filter(s => !(s.kelas||'').startsWith('6'));
  addAktivitas('siswa', `${kelas6.length} siswa kelas 6 dinyatakan lulus`, 0);
  saveDB(); buildTicker();
  showNotif(`🎓 ${kelas6.length} siswa berhasil dinyatakan lulus & dipindah ke alumni!`, 'ok');
  renderAlumni();
}

// (hook openModal/closeModal dipindah ke js/core/utils.js — versi terakhir yang aktif)

// ══════════════════════════════════════
//  SIKLUS AKADEMIK MODULE
//  Kenaikan Kelas, Mutasi, Arsip TA
//  Copyright © 2026 Arblok Digital. All Rights Reserved.
// ══════════════════════════════════════

// ── Helpers ──────────────────────────

Object.assign(globalThis, { simpanAlumni, hapusAlumni, luluskanSiswa });
export { simpanAlumni, hapusAlumni, luluskanSiswa };
