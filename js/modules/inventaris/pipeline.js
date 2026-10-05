// js/modules/inventaris/pipeline.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

function simpanAset() {
  const nama = document.getElementById('aset-nama-inp').value.trim();
  if (!nama) { showNotif('Nama aset wajib diisi!', 'err'); return; }
  const d = getInvDB();
  const aset = {
    id: 'AST' + Date.now(),
    nama,
    kategori: document.getElementById('aset-kat-inp').value,
    jumlah: parseInt(document.getElementById('aset-jumlah-inp').value) || 1,
    nilai: parseFloat(document.getElementById('aset-nilai-inp').value) || 0,
    kondisi: document.getElementById('aset-kondisi-inp').value,
    lokasi: document.getElementById('aset-lokasi-inp').value.trim(),
    tahun: document.getElementById('aset-tahun-inp').value || new Date().getFullYear(),
    no_inventaris: document.getElementById('aset-noinv-inp').value.trim(),
    keterangan: document.getElementById('aset-ket-inp').value.trim(),
    tgl_input: new Date().toISOString(),
    riwayat_kondisi: []
  };
  d.inventaris.push(aset);
  addAktivitas('inventaris' in {} ? 'inventaris' : 'bos', `Aset baru: ${nama} (${aset.kategori})`, 0);
  saveDB(); closeModal('modal-aset-add');
  ['aset-nama-inp','aset-jumlah-inp','aset-nilai-inp','aset-lokasi-inp','aset-tahun-inp','aset-noinv-inp','aset-ket-inp'].forEach(id => { const el=document.getElementById(id); if(el)el.value=''; });
  showNotif(`✅ Aset "${nama}" berhasil ditambah!`, 'ok');
  renderInventaris();
}


function editKondisiAset() {
  const d = getInvDB();
  const a = d.inventaris.find(x => x.id === activeAsetId);
  if (!a) return;
  const kondisi = prompt(`Kondisi baru untuk "${a.nama}":\nKetik: baik / rusak-ringan / rusak-berat / hilang`, a.kondisi);
  if (!kondisi || !KONDISI_LABELS[kondisi]) { showNotif('Kondisi tidak valid!', 'err'); return; }
  const catatan = prompt('Catatan (opsional):', '') || '';
  a.riwayat_kondisi.push({ kondisi: a.kondisi, kondisi_baru: kondisi, catatan, waktu: new Date().toISOString() });
  a.kondisi = kondisi;
  saveDB(); closeModal('modal-aset-detail');
  showNotif(`✅ Kondisi "${a.nama}" diupdate: ${KONDISI_LABELS[kondisi]}`, 'ok');
  renderInventaris();
}


function hapusAset() {
  const d = getInvDB();
  const a = d.inventaris.find(x => x.id === activeAsetId);
  if (!a || !confirm(`Hapus aset "${a.nama}"?`)) return;
  d.inventaris = d.inventaris.filter(x => x.id !== activeAsetId);
  saveDB(); closeModal('modal-aset-detail');
  showNotif(`🗑️ Aset "${a.nama}" dihapus`, 'ok');
  renderInventaris();
}

// ══════════════════════════════════════
//  KALENDER AKADEMIK
// ══════════════════════════════════════

Object.assign(globalThis, { simpanAset, editKondisiAset, hapusAset });
export { simpanAset, editKondisiAset, hapusAset };
