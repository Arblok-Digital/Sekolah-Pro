// js/modules/komunikasi/pipeline.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

function kirimBroadcast() {
  const d = getKomDB();
  const filter = document.getElementById('bc-filter-sel').value;
  const pesan = document.getElementById('bc-pesan-inp').value.trim();
  if (!pesan) { showNotif('Isi pesan terlebih dahulu!', 'err'); return; }

  let targets = d.data_siswa.filter(s => s.hp_ortu);
  if (filter === 'tunggakan') targets = targets.filter(s => s.status_spp === 'Tunggakan');
  else if (filter.startsWith('kelas-')) targets = targets.filter(s => (s.kelas||'').startsWith(filter.replace('kelas-','')));

  if (!targets.length) { showNotif('Tidak ada penerima dengan nomor HP terdaftar!', 'warn'); return; }

  const pesanEnc = encodeURIComponent(pesan.replace(/{sekolah}/g, d.profil_sekolah.nama));
  // Open WA for first, store broadcast log
  d.komunikasi.broadcast.push({ id: 'BC'+Date.now(), pesan, filter, jumlah: targets.length, waktu: new Date().toISOString() });
  saveDB();
  showNotif(`📢 Membuka WA untuk ${targets.length} penerima...`, 'ok');
  // Open WA one by one
  targets.forEach((s, i) => {
    setTimeout(() => bukaWA(s.hp_ortu, pesanEnc), i * 800);
  });
  document.getElementById('bc-pesan-inp').value = '';
  renderKomunikasi();
}


function simpanPesanInternal() {
  const d = getKomDB();
  const pesan = document.getElementById('bc-pesan-inp').value.trim();
  if (!pesan) { showNotif('Isi pesan terlebih dahulu!', 'err'); return; }
  d.komunikasi.broadcast.push({ id: 'BC'+Date.now(), pesan, filter: 'internal', jumlah: 0, waktu: new Date().toISOString() });
  saveDB();
  showNotif('💾 Pesan disimpan sebagai draft!', 'ok');
}


function simpanPesanSiswa() {
  const d = getKomDB();
  const siswaId = document.getElementById('pesan-siswa-sel').value;
  const kat = document.getElementById('pesan-kat-sel').value;
  const isi = document.getElementById('pesan-isi-inp').value.trim();
  if (!isi) { showNotif('Isi pesan dulu!', 'err'); return; }
  d.komunikasi.pesan.push({ id: 'MSG'+Date.now(), siswa_id: siswaId, kategori: kat, isi, waktu: new Date().toISOString(), dibaca: false });
  saveDB(); closeModal('modal-pesan-siswa');
  document.getElementById('pesan-isi-inp').value = '';
  showNotif('✅ Pesan berhasil disimpan!', 'ok');
  renderKomunikasi();
}


function kirimWASiswa() {
  const d = getD();
  const siswaId = document.getElementById('pesan-siswa-sel').value;
  const isi = document.getElementById('pesan-isi-inp').value.trim();
  const s = d.data_siswa.find(x => x.id === siswaId);
  if (!s) { showNotif('Pilih siswa dulu!', 'err'); return; }
  if (!s.hp_ortu) { showNotif(`No HP orang tua ${s.nama} belum ada! Update di CRM.`, 'warn'); return; }
  if (!isi) { showNotif('Isi pesan dulu!', 'err'); return; }
  simpanPesanSiswa();
  bukaWA(s.hp_ortu, encodeURIComponent(isi));
}

// ══════════════════════════════════════
//  INVENTARIS ASET
// ══════════════════════════════════════

Object.assign(globalThis, { kirimBroadcast, simpanPesanInternal, simpanPesanSiswa, kirimWASiswa });
export { kirimBroadcast, simpanPesanInternal, simpanPesanSiswa, kirimWASiswa };
