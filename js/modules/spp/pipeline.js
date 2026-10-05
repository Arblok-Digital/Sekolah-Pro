// js/modules/spp/pipeline.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

function catatPembayaranBiaya() {
  const siswaId = (document.getElementById('biaya-siswa-sel') || {value:''}).value;
  const jenis   = (document.getElementById('biaya-jenis-sel') || {value:'SPP'}).value;
  const jumlah  = parseFloat((document.getElementById('biaya-jumlah') || {value:0}).value) || 0;
  const periode = (document.getElementById('biaya-periode') || {value:''}).value.trim();
  const metode  = (document.getElementById('biaya-metode') || {value:'Tunai'}).value;
  const ket     = (document.getElementById('biaya-ket') || {value:''}).value.trim();

  if (!siswaId) { showNotif('Pilih siswa terlebih dahulu!', 'err'); return; }
  if (jumlah <= 0) { showNotif('Jumlah bayar harus lebih dari 0!', 'err'); return; }

  const d = getD();
  const siswa = d.data_siswa.find(s => s.id === siswaId);
  if (!siswa) return;

  // FIX 7: Kurangi piutang dengan logika tepat
  if (!siswa.piutang_detail) siswa.piutang_detail = [];
  let sisaKurang = jumlah;

  // Kurangi tagihan jenis ini dari yang terlama
  const tagihanJenis = siswa.piutang_detail.filter(p => {
    const s = p.sisa !== undefined ? p.sisa : (p.jumlah || 0);
    return p.jenis === jenis && s > 0 && !p.lunas;
  });
  tagihanJenis.forEach(t => {
    if (sisaKurang <= 0) return;
    const sisaTagihan = t.sisa !== undefined ? t.sisa : (t.jumlah || 0);
    const kurang = Math.min(sisaKurang, sisaTagihan);
    t.sisa = sisaTagihan - kurang;
    t.lunas = t.sisa <= 0;
    if (t.lunas) t.tgl_lunas = new Date().toISOString();
    sisaKurang -= kurang;
  });
  // Recalculate total_piutang dari semua detail yang belum lunas
  const totalSisaDetail = siswa.piutang_detail.reduce((a, p) => {
    const s = p.sisa !== undefined ? p.sisa : (p.lunas ? 0 : (p.jumlah || 0));
    return a + (p.lunas ? 0 : s);
  }, 0);
  // Jika tidak ada detail → kurangi langsung dari total
  if (siswa.piutang_detail.length === 0) {
    siswa.total_piutang = Math.max(0, (siswa.total_piutang || 0) - jumlah);
  } else {
    siswa.total_piutang = Math.max(0, totalSisaDetail);
  }
  // Simpan kelebihan bayar sebagai deposit jika overpayment
  if (sisaKurang > 0 && tagihanJenis.length > 0) {
    siswa.deposit = (siswa.deposit || 0) + sisaKurang;
  }
  siswa.status_spp = siswa.total_piutang <= 0 ? 'Lunas' : 'Tunggakan';

  // Tambah saldo sekolah (kecuali bayar pakai deposit sendiri)
  if (metode !== 'Deposit') {
    d.profil_sekolah.saldo_utama += jumlah;
  } else {
    // Potong dari deposit siswa (bukan tambah saldo baru)
    siswa.deposit = Math.max(0, (siswa.deposit || 0) - jumlah);
  }

  // Simpan riwayat
  if (!d.riwayat_spp) d.riwayat_spp = [];
  const byrId = 'BYR' + Date.now();
  d.riwayat_spp.push({
    id: byrId,
    siswa_id: siswaId,
    nama: siswa.nama,
    kelas: siswa.kelas,
    jenis,
    jumlah,
    bulan: periode || new Date().toLocaleDateString('id-ID',{month:'long',year:'numeric'}),
    metode,
    catatan: ket,
    waktu: new Date().toISOString()
  });

  const j = JENIS_BIAYA.find(x => x.key === jenis) || {icon:'💳'};
  addAktivitas('spp', `${j.icon} ${jenis} ${siswa.nama} — ${metode}`, jumlah, byrId);
  saveDB(); buildTicker(); closeModal('modal-bayar-biaya');

  // Reset form
  ['biaya-jumlah','biaya-periode','biaya-ket'].forEach(id => {
    const e = document.getElementById(id); if(e) e.value = '';
  });

  showNotif(`✅ ${jenis} ${fmt(jumlah)} dari ${siswa.nama} tercatat!`, 'ok');
  if (currentPage === 'spp') renderSPP();
  if (currentPage === 'dashboard') renderDashboard();
  if (currentPage === 'crm') renderCRM();
}

// ── Tagihan Massal ──

function buatTagihanMassal() {
  const jenis   = (document.getElementById('tagihan-jenis') || {value:'SPP'}).value;
  const nominal = parseFloat((document.getElementById('tagihan-nominal') || {value:0}).value) || 0;
  const ket     = (document.getElementById('tagihan-ket') || {value:''}).value.trim();
  const target  = (document.getElementById('tagihan-target') || {value:'semua'}).value;

  if (nominal <= 0) { showNotif('Nominal tagihan harus > 0!', 'err'); return; }
  if (!ket) { showNotif('Keterangan/periode wajib diisi!', 'err'); return; }
  // FIX 8: hitung jumlah siswa dulu sebelum confirm
  const d = getD();
  let siswaTarget = d.data_siswa.filter(s => !s.status_akademik || s.status_akademik === 'Aktif');
  if (target !== 'semua') {
    siswaTarget = siswaTarget.filter(s => String(s.kelas || '').startsWith(target));
  }
  if (!siswaTarget.length) { showNotif('Tidak ada siswa yang sesuai target!', 'warn'); return; }

  const j_confirm = JENIS_BIAYA.find(x => x.key === jenis) || {icon:'📋'};
  if (!confirm(`${j_confirm.icon} Buat tagihan ${jenis}\n\nNominal: ${fmt(nominal)}\nTarget: ${target === 'semua' ? 'Semua siswa aktif' : 'Kelas ' + target}\nJumlah siswa: ${siswaTarget.length} siswa\nKeterangan: ${ket}\n\nTotal tagihan: ${fmt(nominal * siswaTarget.length)}\n\nLanjutkan?`)) return;

  let count = 0;
  siswaTarget.forEach(s => {
    if (!s.piutang_detail) s.piutang_detail = [];
    s.piutang_detail.push({
      id: 'TAG' + Date.now() + Math.random().toString(36).slice(2,5),
      jenis, nominal, sisa: nominal,
      keterangan: ket,
      tgl_tagih: new Date().toISOString(),
      lunas: false
    });
    s.total_piutang = (s.total_piutang || 0) + nominal;
    s.status_spp = 'Tunggakan';
    count++;
  });

  addAktivitas('spp', `📋 Tagihan massal ${jenis}: ${count} siswa × ${fmt(nominal)}`, 0);
  saveDB(); buildTicker(); closeModal('modal-tagihan-massal');

  // Reset
  ['tagihan-nominal','tagihan-ket'].forEach(id => { const e = document.getElementById(id); if(e) e.value=''; });

  showNotif(`✅ Tagihan ${jenis} ${fmt(nominal)} berhasil dibuat untuk ${count} siswa!`, 'ok');
  // FIX 6: preserve current filter after re-render
  const _savedFilter = biayaFilterAktif;
  if (currentPage === 'spp') { renderSPP(); biayaFilterAktif = _savedFilter; }
  if (currentPage === 'dashboard') renderDashboard();
}

// ── Ensure global scope for onclick/onchange HTML attributes ──


function tambahSiswa() {
  const nama = document.getElementById('siswa-nama-inp').value.trim();
  const kelas = document.getElementById('siswa-kelas-inp').value.trim();
  const piutang = parseFloat(document.getElementById('siswa-piutang-inp').value) || 0;
  if (!nama) { showNotif('Nama siswa wajib diisi!', 'err'); return; }
  const d = getD();
  const id = 'S' + Date.now();
  d.data_siswa.push({ id, nama, kelas: kelas || '—', status_spp: piutang > 0 ? 'Tunggakan' : 'Lunas', total_piutang: piutang });
  addAktivitas('siswa', `Siswa baru: ${nama} (${kelas || '—'})`, 0);
  saveDB(); buildTicker(); closeModal('modal-siswa');
  document.getElementById('siswa-nama-inp').value = '';
  document.getElementById('siswa-kelas-inp').value = '';
  document.getElementById('siswa-piutang-inp').value = '';
  showNotif(`✅ Siswa "${nama}" berhasil ditambah!`, 'ok');
  if (currentPage === 'spp') renderSPP();
}


function bayarSPP() {
  const siswaId = document.getElementById('spp-siswa-sel').value;
  const jumlah = parseFloat(document.getElementById('spp-jumlah').value) || 0;
  const bulan = document.getElementById('spp-bulan').value;
  const catatan = document.getElementById('spp-catatan').value;
  if (!siswaId) { showNotif('Pilih siswa dulu!', 'err'); return; }
  if (jumlah <= 0) { showNotif('Jumlah bayar harus > 0!', 'err'); return; }
  const d = getD();
  const siswa = d.data_siswa.find(s => s.id === siswaId);
  if (!siswa) return;
  // Kurangi piutang
  siswa.total_piutang = Math.max(0, (siswa.total_piutang || 0) - jumlah);
  siswa.status_spp = siswa.total_piutang <= 0 ? 'Lunas' : 'Tunggakan';
  // Update saldo
  d.profil_sekolah.saldo_utama += jumlah;
  // Catat riwayat
  if (!d.riwayat_spp) d.riwayat_spp = [];
  d.riwayat_spp.push({ id: 'SPP' + Date.now(), siswa_id: siswaId, nama: siswa.nama, jumlah, bulan, catatan, waktu: new Date().toISOString() });
  addAktivitas('spp', `SPP ${siswa.nama} (${bulan}) - ${catatan || ''}`, jumlah);
  saveDB(); buildTicker(); closeModal('modal-spp');
  document.getElementById('spp-jumlah').value = '';
  document.getElementById('spp-catatan').value = '';
  showNotif(`✅ SPP ${siswa.nama} Rp${jumlah.toLocaleString('id-ID')} berhasil!`, 'ok');
  if (currentPage === 'spp') renderSPP();
  if (currentPage === 'dashboard') renderDashboard();
}


function catatInfak() {
  const nama = document.getElementById('infak-nama-inp').value.trim() || 'Anonim';
  const jumlah = parseFloat(document.getElementById('infak-jumlah-inp').value) || 0;
  const kategori = document.getElementById('infak-kat-inp').value;
  if (jumlah <= 0) { showNotif('Jumlah infak harus > 0!', 'err'); return; }
  const d = getD();
  d.infak_harian.push({ id: 'INF' + Date.now(), nama, jumlah, kategori, tanggal: new Date().toISOString() });
  d.profil_sekolah.saldo_utama += jumlah;
  addAktivitas('infak', `Infak dari ${nama} (${kategori})`, jumlah);
  saveDB(); buildTicker(); closeModal('modal-infak');
  document.getElementById('infak-nama-inp').value = '';
  document.getElementById('infak-jumlah-inp').value = '';
  showNotif(`🙏 Infak ${fmt(jumlah)} dari ${nama} tercatat!`, 'ok');
  if (currentPage === 'spp') renderSPP();
  if (currentPage === 'dashboard') renderDashboard();
}

// ── GAJI GURU ──
// ══════════════════════════════════════
//  PAYROLL PRO MODULE
//  Gaji Guru + Tunjangan + Potongan + Slip + Arsip
//  Copyright © 2026 Arblok Digital. All Rights Reserved.
// ══════════════════════════════════════


function buatTagihanSPPMassal() {
  const bulan=document.getElementById('massal-bulan-spp').value;
  const nominal=parseFloat(document.getElementById('massal-spp-nominal').value)||0;
  const kf=document.getElementById('massal-spp-kelas').value;
  if(nominal<=0){showNotif('Nominal SPP harus > 0!','err');return;}
  const d=getD();
  let count=0;
  d.data_siswa.filter(s=>!kf||s.kelas===kf).forEach(s=>{
    if(!s.piutang_detail)s.piutang_detail=[];
    const exists=s.piutang_detail.some(p=>p.keterangan===bulan&&p.jenis==='SPP Bulanan'&&p.status==='unpaid');
    if(!exists){
      s.piutang_detail.push({id:'P'+Date.now()+Math.random(),jenis:'SPP Bulanan',keterangan:bulan,jumlah:nominal,tanggal:new Date().toISOString(),status:'unpaid',lunas:false,jatuh_tempo:''});
      _recalcPiutang(s); count++;
    }
  });
  addAktivitas('spp',`Tagihan SPP ${bulan} dibuat untuk ${count} siswa`,0);
  saveDB(); buildTicker(); closeModal('modal-piutang-massal');
  showNotif(`✅ Tagihan SPP ${bulan} ${fmt(nominal)} dibuat untuk ${count} siswa!`,'ok');
  renderCRM();
}
// Alias setelah fungsi didefinisikan (FIX 1)


function simpanKwitansiPDF() {
  if (!_kwCache) return;
  const { txn } = _kwCache;
  const orig    = document.title;
  document.title = `Kwitansi_${(txn.nama||'').replace(/\s+/g,'_')}_${txn.id}`;
  const pa = document.getElementById('kw-print-area');
  const el = document.getElementById('kw-paper-el');
  if (el) pa.innerHTML = el.outerHTML;
  document.body.classList.remove('kw-thermal');
  showNotif('💡 Pilih "Save as PDF" di dialog print','warn');
  window.print();
  setTimeout(() => { document.title = orig; pa.innerHTML = ''; }, 2500);
}

// ════════════════════════════════════════════════════════════════════
//  DASHBOARD STAT CARDS — INTERAKTIF
//  onStatClick(type) — filter dashboard berdasarkan stat card yang diklik
//  Multi-tenant safe: semua filter lewat filterBySchool()
// ════════════════════════════════════════════════════════════════════


Object.assign(globalThis, { catatPembayaranBiaya, buatTagihanMassal, tambahSiswa, bayarSPP, catatInfak, buatTagihanSPPMassal, simpanKwitansiPDF });
export { catatPembayaranBiaya, buatTagihanMassal, tambahSiswa, bayarSPP, catatInfak, buatTagihanSPPMassal, simpanKwitansiPDF };
