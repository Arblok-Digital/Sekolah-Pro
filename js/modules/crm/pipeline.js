// js/modules/crm/pipeline.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

function crmTambahSiswa() {
  const nama = (document.getElementById('crm-add-nama').value||'').trim();
  if (!nama) { showNotif('Nama siswa wajib diisi!','err'); return; }
  const d = getD();
  const siswa = {
    id:'S'+Date.now(), nama,
    nisn: document.getElementById('crm-add-nisn').value.trim(),
    kelas: document.getElementById('crm-add-kelas').value,
    jk: document.getElementById('crm-add-jk').value,
    tgl_lahir: document.getElementById('crm-add-tgl-lahir').value,
    tahun_masuk: document.getElementById('crm-add-tahun-masuk').value||new Date().getFullYear(),
    ayah: document.getElementById('crm-add-ayah').value.trim(),
    ibu: document.getElementById('crm-add-ibu').value.trim(),
    hp_ortu: document.getElementById('crm-add-hp').value.trim(),
    pekerjaan_ortu: document.getElementById('crm-add-pekerjaan').value.trim(),
    alamat: document.getElementById('crm-add-alamat').value.trim(),
    status_spp:'Lunas', total_piutang:0, piutang_detail:[], absensi:{}, nilai:{}
  };
  const piutangAwal = parseFloat(document.getElementById('crm-add-piutang').value)||0;
  if (piutangAwal>0) {
    siswa.total_piutang = piutangAwal;
    siswa.status_spp = 'Tunggakan';
    siswa.piutang_detail.push({id:'P'+Date.now(),jenis:'SPP Awal',keterangan:'Saldo piutang awal',jumlah:piutangAwal,tanggal:new Date().toISOString(),status:'unpaid',jatuh_tempo:''});
  }
  d.data_siswa.push(siswa);
  addAktivitas('siswa',`Siswa baru: ${nama} (${siswa.kelas})`,0);
  saveDB(); buildTicker(); closeModal('modal-crm-add');
  ['crm-add-nama','crm-add-nisn','crm-add-ayah','crm-add-ibu','crm-add-hp','crm-add-pekerjaan','crm-add-alamat','crm-add-tgl-lahir','crm-add-tahun-masuk','crm-add-piutang'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  showNotif(`✅ Siswa "${nama}" berhasil ditambah!`,'ok');
  renderCRM(); populateSiswaSelect();
}


function lunasPiutang(siswaId, piutangId) {
  const d = getD();
  const s = d.data_siswa.find(x => x.id === siswaId);
  if (!s) return;
  const p = (s.piutang_detail || []).find(x => x.id === piutangId);
  if (!p) return;
  // Tandai lunas dengan kedua field sekaligus
  p.status       = 'paid';
  p.lunas        = true;
  p.sisa         = 0;
  p.tgl_lunas    = new Date().toISOString();
  p.tanggal_lunas= new Date().toISOString();
  d.profil_sekolah.saldo_utama += (p.jumlah || 0);
  // Recalculate total & status secara konsisten
  _recalcPiutang(s);
  if (!d.riwayat_spp) d.riwayat_spp = [];
  const byrId = 'SPP' + Date.now();
  d.riwayat_spp.push({ id: byrId, siswa_id: siswaId, nama: s.nama, jumlah: p.jumlah, bulan: p.keterangan, catatan: p.jenis, waktu: new Date().toISOString() });
  addAktivitas('spp', `Lunas: ${p.jenis} ${s.nama} (${p.keterangan})`, p.jumlah, byrId);
  saveDB(); buildTicker();
  showNotif(`✅ ${p.jenis} ${s.nama} ${fmt(p.jumlah)} — LUNAS!`, 'ok');
  renderDetailPiutang(s); renderDetailProfil(s); renderCRM();
  if (currentPage === 'dashboard') renderDashboard();
}


function simpanTagihan() {
  if (!activeSiswaId) return;
  const jenis = document.getElementById('tagihan-jenis-inp').value;
  const ket = document.getElementById('tagihan-ket-inp').value.trim();
  const jumlah = parseFloat(document.getElementById('tagihan-jumlah-inp').value)||0;
  const tempo = document.getElementById('tagihan-tempo-inp').value;
  if (jumlah<=0) { showNotif('Jumlah tagihan harus > 0!','err'); return; }
  const d = getD();
  const s = d.data_siswa.find(x=>x.id===activeSiswaId);
  if (!s) return;
  if (!s.piutang_detail) s.piutang_detail=[];
  s.piutang_detail.push({id:'P'+Date.now(),jenis,keterangan:ket,jumlah,tanggal:new Date().toISOString(),status:'unpaid',lunas:false,jatuh_tempo:tempo});
  _recalcPiutang(s);
  addAktivitas('spp',`Tagihan baru: ${jenis} ${s.nama} (${ket})`,0);
  saveDB(); closeModal('modal-tagihan');
  ['tagihan-ket-inp','tagihan-jumlah-inp'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  showNotif(`💳 Tagihan ${jenis} ${fmt(jumlah)} ditambahkan untuk ${s.nama}`,'ok');
  renderDetailPiutang(s); renderCRM();
}


function toggleAbsensi(dateStr) {
  const d=getD(); const s=d.data_siswa.find(x=>x.id===activeSiswaId);
  if(!s) return;
  if(!s.absensi) s.absensi={};
  if(s.absensi[dateStr]===absMode) delete s.absensi[dateStr];
  else s.absensi[dateStr]=absMode;
  saveDB(); renderAbsCalendar(s);
}


function simpanAbsensiMassal() {
  const d=getD();
  const tanggal=(document.getElementById('massal-tanggal')||{value:''}).value||new Date().toISOString().slice(0,10);
  let count=0;
  Object.entries(massalState).forEach(([sid,st])=>{const s=d.data_siswa.find(x=>x.id===sid);if(s){if(!s.absensi)s.absensi={};s.absensi[tanggal]=st;count++;}});
  massalState={};
  saveDB(); closeModal('modal-absensi-massal');
  showNotif(`✅ Absensi ${tanggal} untuk ${count} siswa disimpan!`,'ok');
  renderCRM();
}


function simpanNilai() {
  if (!activeSiswaId) return;
  const mapel=document.getElementById('nilai-mapel-inp').value;
  const jenis=document.getElementById('nilai-jenis-inp').value;
  const nilai=parseFloat(document.getElementById('nilai-skor-inp').value);
  if(isNaN(nilai)||nilai<0||nilai>100){showNotif('Nilai harus antara 0-100!','err');return;}
  const sem=(document.getElementById('nilai-semester-sel')||{value:'1'}).value;
  const d=getD(); const s=d.data_siswa.find(x=>x.id===activeSiswaId);
  if(!s) return;
  if(!s.nilai)s.nilai={};
  if(!s.nilai[sem])s.nilai[sem]=[];
  s.nilai[sem].push({id:'N'+Date.now(),mapel,jenis,nilai,tanggal:new Date().toISOString()});
  saveDB(); closeModal('modal-input-nilai');
  const el=document.getElementById('nilai-skor-inp');if(el)el.value='';
  showNotif(`📊 Nilai ${mapel} ${jenis}: ${nilai} untuk ${s.nama}!`,'ok');
  renderNilai();
}


function editSiswa() {
  const d = getD();
  const s = d.data_siswa.find(x=>x.id===activeSiswaId);
  if (!s) return;
  // Isi form modal edit
  const f = (id, val) => { const el=document.getElementById(id); if(el) el.value=val||''; };
  f('edit-siswa-nama',      s.nama);
  f('edit-siswa-nisn',      s.nisn);
  f('edit-siswa-kelas',     s.kelas);
  f('edit-siswa-jk',        s.jk||'L');
  f('edit-siswa-tgl',       s.tgl_lahir);
  f('edit-siswa-tahun',     s.tahun_masuk);
  f('edit-siswa-ayah',      s.ayah);
  f('edit-siswa-ibu',       s.ibu);
  f('edit-siswa-hp',        s.hp_ortu);
  f('edit-siswa-email',     s.email_ortu);
  f('edit-siswa-alamat',    s.alamat);
  f('edit-siswa-pekerjaan', s.pekerjaan_ortu);
  openModal('modal-edit-siswa');
}


function simpanEditSiswa() {
  const d = getD();
  const s = d.data_siswa.find(x=>x.id===activeSiswaId);
  if (!s) return;
  const g = id => (document.getElementById(id)||{value:''}).value.trim();
  const nama = g('edit-siswa-nama');
  if (!nama) { showNotif('Nama tidak boleh kosong!','err'); return; }
  s.nama          = nama;
  s.nisn          = g('edit-siswa-nisn');
  s.kelas         = g('edit-siswa-kelas');
  s.jk            = g('edit-siswa-jk') || 'L';
  s.tgl_lahir     = g('edit-siswa-tgl');
  s.tahun_masuk   = g('edit-siswa-tahun');
  s.ayah          = g('edit-siswa-ayah');
  s.ibu           = g('edit-siswa-ibu');
  s.hp_ortu       = g('edit-siswa-hp');
  s.email_ortu    = g('edit-siswa-email');
  s.alamat        = g('edit-siswa-alamat');
  s.pekerjaan_ortu= g('edit-siswa-pekerjaan');
  saveDB(); buildTicker();
  closeModal('modal-edit-siswa');
  closeModal('modal-crm-detail');
  showNotif(`✅ Data ${nama} berhasil diperbarui`, 'ok');
  renderCRM(); renderDashboard();
  if (_fbDb && _fbUser) { _fbSyncPending=true; _fbFlushQueue(); }
}

function hapusSiswa() {
  if(!activeSiswaId) return;
  const d=getD(); const s=d.data_siswa.find(x=>x.id===activeSiswaId);
  if(!s||!confirm(`Hapus data ${s.nama}? Semua data termasuk absensi & nilai akan terhapus.`)) return;
  d.data_siswa=d.data_siswa.filter(x=>x.id!==activeSiswaId);
  saveDB(); closeModal('modal-crm-detail');
  showNotif(`🗑️ Data ${s.nama} dihapus`,'ok');
  renderCRM(); populateSiswaSelect();
}


Object.assign(globalThis, { crmTambahSiswa, lunasPiutang, simpanTagihan, toggleAbsensi, simpanAbsensiMassal, simpanNilai, editSiswa, simpanEditSiswa, hapusSiswa });
export { crmTambahSiswa, lunasPiutang, simpanTagihan, toggleAbsensi, simpanAbsensiMassal, simpanNilai, editSiswa, simpanEditSiswa, hapusSiswa };
