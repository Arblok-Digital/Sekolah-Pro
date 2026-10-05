
// ══════════════════════════════════════
//  SEKOLAH PRO — Core App Logic
// ══════════════════════════════════════

// ── DATA MODEL ──
const DEFAULT_DATA = {
  sekolah_pro: {
    profil_sekolah: {
      nama: "SD Islam Sahara",
      saldo_utama: 0,
      spp_nominal: 150000,
      pengumuman: "Selamat datang di Sekolah Pro! 🏫",
      tahun_ajaran: "2025/2026",
      pin_enabled: false,
      pin_hash: null
    },
    data_siswa: [],
    keuangan_guru: [],
    dana_bos: { pagu_tahunan: 0, terpakai: 0, sisa_anggaran: 0, log_pengeluaran: [] },
    infak_harian: [],
    riwayat_spp: [],
    riwayat_aktivitas: [],
    alumni: [],
    // ── Payroll Pro ──
    payroll_config: {
      bpjs_kes: 50000,
      bpjs_tk: 25000,
      uang_makan_per_hari: 15000,
      transport_per_hari: 10000,
      hari_kerja_default: 22
    },
    arsip_gaji: [],
    // ── Siklus Akademik (sesuai JSON struktur user) ──
    akademik_config: {
      tahun_ajaran_aktif: "2025/2026",
      semester: "Ganjil",
      kelas_max: 6,
      // logic_kenaikan dari JSON user
      logic_kenaikan: {
        status_pilihan: ["Aktif", "Lulus", "Pindah", "Keluar"],
        tingkat_kelas: [1, 2, 3, 4, 5, 6]
      },
      history_ta: [],          // Arsip snapshot tiap akhir T.A.
      log_akademik: [],         // Log aktivitas akademik
      mutasi_log: [],           // Riwayat mutasi individu
      spp_arsip: {},            // { "2024/2025": { total_masuk, detail[] } }
      history_alumni: []        // field dari JSON user
    }
  }
};

let DB = loadDB();
let currentPage = 'dashboard';
let activeJamGuruId = null;

function loadDB() {
  try {
    const saved = localStorage.getItem('sekolah_pro_db');
    return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(DEFAULT_DATA));
  } catch { return JSON.parse(JSON.stringify(DEFAULT_DATA)); }
}
function saveDB() {
  localStorage.setItem('sekolah_pro_db', JSON.stringify(DB));
}
function getD() { return DB.sekolah_pro; }
function fmt(n) {
  return 'Rp ' + Math.round(n || 0).toLocaleString('id-ID');
}
function fmtShort(n) {
  if (n >= 1e9) return 'Rp ' + (n/1e9).toFixed(1) + 'M';
  if (n >= 1e6) return 'Rp ' + (n/1e6).toFixed(1) + 'jt';
  return fmt(n);
}

// ── CLOCK ──
function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent =
    now.toLocaleTimeString('id-ID', {hour:'2-digit',minute:'2-digit'});
}
setInterval(updateClock, 1000);
updateClock();

// ── TICKER ──
function buildTicker() {
  const d = getD();
  const sisa = d.dana_bos.sisa_anggaran;
  const pct = d.dana_bos.pagu_tahunan > 0
    ? Math.round((d.dana_bos.terpakai / d.dana_bos.pagu_tahunan) * 100) : 0;
  const totalGaji = d.keuangan_guru.reduce((a,g) => a + (g.total_terima||0), 0);
  const infakTotal = d.infak_harian.reduce((a,i) => a + (i.jumlah||0), 0);
  const tunggakan = d.data_siswa.filter(s => s.status_spp === 'Tunggakan').length;
  const pengumuman = d.profil_sekolah.pengumuman || 'Selamat datang!';

  const items = [
    `<span class="tick-item"><span class="tick-lbl">SEKOLAH</span> <span class="tick-neu">${d.profil_sekolah.nama}</span></span>`,
    `<span class="tick-item"><span class="tick-lbl">SALDO KAS</span> <span class="tick-up">${fmtShort(d.profil_sekolah.saldo_utama)}</span></span>`,
    `<span class="tick-item"><span class="tick-lbl">DANA BOS</span> <span class="tick-bos">Terpakai ${pct}% · Sisa ${fmtShort(sisa)}</span></span>`,
    `<span class="tick-item"><span class="tick-lbl">TUNGGAKAN SPP</span> <span class="${tunggakan>0?'tick-dn':'tick-up'}">${tunggakan} siswa</span></span>`,
    `<span class="tick-item"><span class="tick-lbl">TOTAL GAJI</span> <span class="tick-dn">${fmtShort(totalGaji)}</span></span>`,
    `<span class="tick-item"><span class="tick-lbl">INFAK</span> <span class="tick-up">${fmtShort(infakTotal)}</span></span>`,
    `<span class="tick-item"><span class="tick-news">📢 ${pengumuman}</span></span>`,
  ];
  const html = items.join('');
  document.getElementById('ticker-inner').innerHTML = html + html;
}

// ── PAGE ROUTING ──
function switchPage(name) {
  currentPage = name;

  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));

  // Clear all nav active states
  document.querySelectorAll('.bnav').forEach(b => b.classList.remove('on'));
  document.querySelectorAll('.htab').forEach(b => b.classList.remove('on'));
  document.querySelectorAll('.snav').forEach(b => b.classList.remove('on'));

  // Show target page
  const pg = document.getElementById(name + '-page');
  if (pg) pg.classList.add('on');

  // Activate bottom nav item + scroll it into view on mobile
  const bn = document.getElementById('bn-' + name);
  if (bn) {
    bn.classList.add('on');
    // Scroll the active bnav item into view (mobile scrollable nav)
    setTimeout(() => {
      const scroll = document.getElementById('bnav-scroll');
      if (scroll && window.innerWidth < 900) {
        const btnLeft = bn.offsetLeft;
        const btnWidth = bn.offsetWidth;
        const scrollWidth = scroll.offsetWidth;
        scroll.scrollTo({ left: btnLeft - scrollWidth/2 + btnWidth/2, behavior: 'smooth' });
      }
    }, 50);
  }

  // Activate header tab
  const tabMap = {dashboard:'📊 Dash',crm:'👤 Siswa',komunikasi:'💬 Ortu',kalender:'🗓️ Kalender',laporan:'📄 Laporan'};
  if (tabMap[name]) {
    document.querySelectorAll('.htab').forEach(t => {
      if (t.textContent.trim() === tabMap[name].trim()) t.classList.add('on');
    });
  }

  // Activate sidebar item
  document.querySelectorAll('.snav').forEach(b => {
    const oc = b.getAttribute('onclick') || '';
    if (oc.includes(`'${name}'`)) b.classList.add('on');
  });

  renderPage(name);

  // Desktop: scroll content area to top smoothly
  if (window.innerWidth >= 900) {
    const dc = document.getElementById('desktop-content');
    if (dc) dc.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    // Mobile: scroll page to top
    if (pg) pg.scrollTo({ top: 0, behavior: 'instant' });
  }
}

function renderPage(name) {
  switch(name) {
    case 'dashboard': renderDashboard(); break;
    case 'crm': renderCRM(); break;
    case 'spp': renderSPP(); break;
    case 'guru': renderGuru(); break;
    case 'bos': renderBOS(); break;
    case 'akademik': renderAkademik(); break;
    case 'jadwal': renderJadwal(); break;
    case 'kalender': renderKalender(); break;
    case 'komunikasi': renderKomunikasi(); break;
    case 'inventaris': renderInventaris(); break;
    case 'alumni': renderAlumni(); break;
    case 'laporan': renderLaporan(); break;
    case 'radar': hitungRadar(); break;
    case 'setting': renderSetting(); break;
  }
}

// ── DASHBOARD ──
function renderDashboard() {
  const d = getD();
  const namaSekolah = d.profil_sekolah.nama || 'SD Islam Sahara';

  // Sync all school name locations
  ['banner-school-name','banner-nama-besar','sidebar-school-name'].forEach(id => {
    const el = document.getElementById(id); if (el) el.textContent = namaSekolah;
  });

  // Tanggal hari ini di banner
  const tglEl = document.getElementById('banner-tanggal');
  if (tglEl) tglEl.textContent = new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

  // Tahun ajaran (setting)
  const taEl = document.getElementById('banner-ta');
  if (taEl) taEl.textContent = 'T.A. ' + (d.profil_sekolah.tahun_ajaran || new Date().getFullYear() + '/' + (new Date().getFullYear()+1));

  document.getElementById('saldo-display').textContent = fmt(d.profil_sekolah.saldo_utama);
  document.getElementById('stat-siswa').textContent = d.data_siswa.length;
  const lunas = d.data_siswa.filter(s => s.status_spp === 'Lunas').length;
  const tunggak = d.data_siswa.filter(s => s.status_spp === 'Tunggakan').length;
  document.getElementById('stat-lunas').textContent = lunas;
  document.getElementById('stat-tunggak').textContent = tunggak;

  // Infak hari ini
  const today = new Date().toDateString();
  const infakHariIni = d.infak_harian
    .filter(i => new Date(i.tanggal).toDateString() === today)
    .reduce((a, i) => a + i.jumlah, 0);
  document.getElementById('stat-infak-today').textContent = fmtShort(infakHariIni);

  // BOS
  const pct = d.dana_bos.pagu_tahunan > 0
    ? Math.round((d.dana_bos.terpakai / d.dana_bos.pagu_tahunan)*100) : 0;
  document.getElementById('bos-bar').style.width = Math.min(pct,100) + '%';
  document.getElementById('bos-pct-badge').textContent = pct + '%';
  document.getElementById('bos-pct-badge').className = 'bdg ' + (pct > 80 ? 'bdg-r' : pct > 50 ? 'bdg-am' : 'bdg-g');
  document.getElementById('bos-terpakai-d').textContent = fmtShort(d.dana_bos.terpakai);
  document.getElementById('bos-sisa-d').textContent = fmtShort(d.dana_bos.sisa_anggaran);

  // ── REMINDER PANEL ──
  const reminders = buildReminders();
  const rPanel = document.getElementById('reminder-panel');
  const rList = document.getElementById('reminder-list');
  if (reminders.length > 0) {
    rPanel.style.display = 'block';
    rList.innerHTML = reminders.slice(0,5).map(r => `
      <div class="reminder-item">
        <div class="reminder-dot" style="background:${r.color}"></div>
        <div class="reminder-info">
          <div class="reminder-title">${r.title}</div>
          <div class="reminder-sub">${r.sub}</div>
        </div>
        ${r.action ? `<button class="abtn" style="padding:5px 10px;font-size:10px;background:${r.color}15;color:${r.color};border:1px solid ${r.color}44;flex-shrink:0" onclick="${r.action}">${r.actionLabel}</button>` : ''}
      </div>`).join('');
  } else {
    rPanel.style.display = 'none';
  }

  // Aktivitas
  const acts = d.riwayat_aktivitas || [];
  const el = document.getElementById('aktivitas-list');
  if (!acts.length) {
    el.innerHTML = '<div class="empty-state"><span class="empty-icon">📭</span><span class="empty-text">Belum ada aktivitas</span></div>';
    return;
  }
  const recent = acts.slice(-10).reverse();
  el.innerHTML = '<div class="timeline">' + recent.map(a => {
    const colorMap = {spp:'var(--grn)',infak:'var(--yel)',gaji:'var(--pur)',bos:'var(--amb)',siswa:'var(--blu)',guru:'var(--cyn)'};
    const iconMap = {spp:'💳',infak:'🙏',gaji:'💸',bos:'🏦',siswa:'👤',guru:'👨‍🏫'};
    const color = colorMap[a.tipe] || 'var(--t2)';
    const icon = iconMap[a.tipe] || '📝';
    return `<div class="tl-item">
      <div class="tl-dot" style="background:${color}22;border:1.5px solid ${color}">${icon}</div>
      <div class="tl-content">
        <div class="tl-title">${a.keterangan}</div>
        <div class="tl-sub">${new Date(a.waktu).toLocaleString('id-ID',{dateStyle:'short',timeStyle:'short'})}</div>
      </div>
      <div class="tl-amt" style="color:${a.nominal > 0 ? 'var(--grn)' : 'var(--red)'}">${a.nominal !== 0 ? (a.nominal > 0 ? '+' : '') + fmtShort(a.nominal) : ''}</div>
    </div>`;
  }).join('') + '</div>';
}

// ── SPP ──
function renderSPP() {
  const d = getD();
  const sppTotal = (d.riwayat_spp || []).reduce((a,s) => a + s.jumlah, 0);
  const piutang = d.data_siswa.reduce((a,s) => a + (s.total_piutang||0), 0);
  const infakTotal = d.infak_harian.reduce((a,i) => a + i.jumlah, 0);
  document.getElementById('stat-spp-total').textContent = fmtShort(sppTotal);
  document.getElementById('stat-piutang-total').textContent = fmtShort(piutang);
  document.getElementById('stat-infak-total').textContent = fmtShort(infakTotal);
  document.getElementById('stat-siswa-2').textContent = d.data_siswa.length;

  // Siswa list
  const el = document.getElementById('siswa-list');
  if (!d.data_siswa.length) {
    el.innerHTML = '<div class="empty-state"><span class="empty-icon">👥</span><span class="empty-text">Belum ada data siswa</span></div>';
  } else {
    const emojis = ['🧒','👦','👧','🧑','👨','👩'];
    el.innerHTML = d.data_siswa.map((s, i) => `
      <div class="siswa-card" onclick="openPaySPP('${s.id}')">
        <div class="siswa-avatar">${emojis[i % emojis.length]}</div>
        <div class="siswa-info">
          <div class="siswa-nama">${s.nama}</div>
          <div class="siswa-kelas">Kelas ${s.kelas}</div>
        </div>
        <div class="siswa-right">
          <div class="${s.status_spp === 'Lunas' ? 'spp-status-ok' : 'spp-status-tg'}">${s.status_spp}</div>
          ${s.total_piutang > 0 ? `<div style="font-size:11px;color:var(--red);font-family:'Courier New',monospace;font-weight:700">${fmt(s.total_piutang)}</div>` : ''}
        </div>
      </div>
    `).join('');
  }

  // Infak list
  const el2 = document.getElementById('infak-list');
  if (!d.infak_harian.length) {
    el2.innerHTML = '<div class="empty-state"><span class="empty-icon">🙏</span><span class="empty-text">Belum ada catatan infak</span></div>';
  } else {
    const recent = d.infak_harian.slice(-20).reverse();
    el2.innerHTML = recent.map(i => `
      <div class="infak-item">
        <div class="infak-left">
          <span class="infak-icon">🙏</span>
          <div class="infak-info">
            <div class="infak-nama">${i.nama || 'Anonim'} <span class="bdg bdg-b">${i.kategori}</span></div>
            <div class="infak-tgl">${new Date(i.tanggal).toLocaleDateString('id-ID',{dateStyle:'medium'})}</div>
          </div>
        </div>
        <div class="infak-amt">+${fmt(i.jumlah)}</div>
      </div>
    `).join('');
  }

  // Populate siswa select
  populateSiswaSelect();
}

function populateSiswaSelect() {
  const d = getD();
  const sel = document.getElementById('spp-siswa-sel');
  if (!sel) return;
  sel.innerHTML = d.data_siswa.length
    ? d.data_siswa.map(s => `<option value="${s.id}">${s.nama} (${s.kelas})</option>`).join('')
    : '<option value="">-- Belum ada siswa --</option>';
}

function openPaySPP(siswaId) {
  populateSiswaSelect();
  const sel = document.getElementById('spp-siswa-sel');
  if (sel) sel.value = siswaId;
  const d = getD();
  const spp = d.profil_sekolah.spp_nominal || 0;
  document.getElementById('spp-jumlah').value = spp || '';
  openModal('modal-spp');
}

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

let guruFilter = 'all';
let activeGuruId = null;

// ── Payroll Config ──
function getPayrollCfg() {
  const d = getD();
  if (!d.payroll_config) d.payroll_config = {
    bpjs_kes: 50000, bpjs_tk: 25000,
    uang_makan_per_hari: 15000, transport_per_hari: 10000,
    hari_kerja_default: 22
  };
  if (!d.arsip_gaji) d.arsip_gaji = [];
  return d;
}

// ── Compute payroll for one guru ──
function hitungGaji(g, hariHadir) {
  const cfg = getPayrollCfg().payroll_config;
  const jam = g.jam_mengajar || 0;
  const hadir = hariHadir !== undefined ? hariHadir : (g.hari_hadir || cfg.hari_kerja_default);

  // Penghasilan
  const gajiPokok    = g.gaji_pokok || 0;
  const honorJam     = (g.honor_per_jam || 0) * jam;
  const tunjangan    = g.tunjangan || 0;
  const uangMakan    = (g.uang_makan_per_hari || cfg.uang_makan_per_hari) * hadir;
  const transport    = (g.transport_per_hari || cfg.transport_per_hari) * hadir;
  const insentif     = g.insentif || 0;
  const bruto = gajiPokok + honorJam + tunjangan + uangMakan + transport + insentif;

  // Potongan
  const bpjsKes   = g.bpjs_kes !== undefined ? g.bpjs_kes : cfg.bpjs_kes;
  const bpjsTK    = g.bpjs_tk  !== undefined ? g.bpjs_tk  : cfg.bpjs_tk;
  const kasbonAktif = (g.kasbon_list || []).filter(k => k.status === 'aktif');
  const kasbonPotong = kasbonAktif.reduce((a, k) => a + (k.cicilan_per_bulan || 0), 0);
  const potonganLain = g.potongan_lain || 0;
  const totalPotongan = bpjsKes + bpjsTK + kasbonPotong + potonganLain;

  const netto = Math.max(0, bruto - totalPotongan);

  return {
    gajiPokok, honorJam, tunjangan, uangMakan, transport, insentif,
    bruto, bpjsKes, bpjsTK, kasbonPotong, potonganLain, totalPotongan,
    netto, jam, hadir
  };
}

// ── Get absensi hadir count for guru (sync attendance) ──
function getHariHadirGuru(guru) {
  // Match guru to siswa absensi? No — guru has separate hari_hadir field
  // Attendance sync: use guru.hari_hadir if set, else payroll config default
  const cfg = getPayrollCfg().payroll_config;
  return guru.hari_hadir !== undefined ? guru.hari_hadir : cfg.hari_kerja_default;
}

// ── Set guru filter ──
function setGuruFilter(val, btn) {
  guruFilter = val;
  document.querySelectorAll('#guru-page .fchip').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  renderGuru();
}

// ── Main render ──
function renderGuru() {
  const d = getPayrollCfg();
  const cfg = d.payroll_config;
  let list = d.keuangan_guru;

  // Apply filter
  if (guruFilter === 'belum') list = list.filter(g => !g.sudah_dibayar);
  else if (guruFilter === 'lunas') list = list.filter(g => g.sudah_dibayar);
  else if (guruFilter === 'kasbon') list = list.filter(g => (g.kasbon_list||[]).some(k=>k.status==='aktif'));

  // Compute totals across ALL guru (not filtered)
  let totalBruto = 0, totalPotongan = 0, totalNetto = 0, totalKasbon = 0;
  let lunasCount = 0, belumCount = 0;
  d.keuangan_guru.forEach(g => {
    const h = hitungGaji(g, getHariHadirGuru(g));
    totalBruto += h.bruto;
    totalPotongan += h.totalPotongan;
    totalNetto += h.netto;
    totalKasbon += (g.kasbon_list||[]).filter(k=>k.status==='aktif').reduce((a,k)=>a+k.jumlah_sisa,0);
    if (g.sudah_dibayar) lunasCount++; else belumCount++;
    g.total_terima = h.netto; // keep synced
  });

  // Hero dashboard
  const saldo = d.profil_sekolah.saldo_utama;
  const totalUnpaid = d.keuangan_guru.filter(g=>!g.sudah_dibayar).reduce((a,g)=>a+(g.total_terima||0),0);
  const ratio = totalUnpaid > 0 ? Math.min(100, (saldo/totalUnpaid)*100) : 100;

  const setEl = (id, val) => { const e=document.getElementById(id); if(e)e.textContent=val; };
  setEl('payroll-total-display', fmtShort(totalNetto));
  setEl('payroll-lunas-count', lunasCount);
  setEl('payroll-belum-count', belumCount);
  setEl('payroll-kasbon-total', fmtShort(totalKasbon));
  setEl('payroll-saldo-display', fmtShort(saldo));
  setEl('payroll-ratio-lbl', `${ratio.toFixed(0)}% saldo vs kebutuhan`);
  const bar = document.getElementById('payroll-saldo-bar');
  if (bar) {
    bar.style.width = Math.min(100,ratio)+'%';
    bar.style.background = ratio>=100?'var(--grn)':ratio>=60?'var(--yel)':'var(--red)';
  }
  setEl('stat-guru-total', d.keuangan_guru.length);
  setEl('stat-gaji-total', fmtShort(totalBruto));
  setEl('stat-potongan-total', fmtShort(totalPotongan));
  setEl('stat-netto-total', fmtShort(totalNetto));

  const el = document.getElementById('guru-list');
  if (!el) return;
  if (!list.length) {
    el.innerHTML = `<div class="empty-state" style="padding:40px"><span class="empty-icon">👨‍🏫</span><br><span class="empty-text">${d.keuangan_guru.length===0?'Belum ada data guru':'Tidak ada guru sesuai filter'}</span></div>`;
    saveDB(); return;
  }

  const COLORS = [
    {bg:'rgba(192,132,252,.15)',border:'var(--pur)',text:'var(--pur)'},
    {bg:'rgba(0,230,118,.15)',border:'var(--grn)',text:'var(--grn)'},
    {bg:'rgba(38,198,218,.15)',border:'var(--cyn)',text:'var(--cyn)'},
    {bg:'rgba(68,138,255,.15)',border:'var(--blu)',text:'var(--blu)'},
    {bg:'rgba(255,202,40,.15)',border:'var(--yel)',text:'var(--yel)'},
    {bg:'rgba(255,152,0,.15)',border:'var(--amb)',text:'var(--amb)'},
  ];

  el.innerHTML = '<div style="display:flex;flex-direction:column;gap:10px;padding:0 12px 16px">' +
    list.map((g, i) => {
      const c = COLORS[i % COLORS.length];
      const h = hitungGaji(g, getHariHadirGuru(g));
      g.total_terima = h.netto;
      const kasbonAktif = (g.kasbon_list||[]).filter(k=>k.status==='aktif');
      const kasbonTotal = kasbonAktif.reduce((a,k)=>a+k.jumlah_sisa,0);
      const statusClass = g.sudah_dibayar ? 'payroll-status-lunas' : 'payroll-status-belum';
      const statusLabel = g.sudah_dibayar ? '✅ Sudah Transfer' : '⏳ Belum Dibayar';

      return `<div class="payroll-card">
        <div class="payroll-card-header" onclick="openGuruDetail('${g.id}')">
          <div class="payroll-avatar" style="background:${c.bg};border-color:${c.border};color:${c.text}">${getInitials(g.nama)}</div>
          <div class="payroll-info">
            <div class="payroll-nama">${g.nama}</div>
            <div class="payroll-jabatan">${g.jabatan} · ${h.hadir} hari hadir · ${h.jam} jam</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:3px">
              <span class="payroll-status-badge ${statusClass}">${statusLabel}</span>
              ${kasbonTotal>0?`<span class="kasbon-badge">💼 Kasbon ${fmt(kasbonTotal)}</span>`:''}
            </div>
          </div>
          <div>
            <div class="payroll-netto" style="color:${g.sudah_dibayar?'var(--grn)':'var(--pur)'}">${fmt(h.netto)}</div>
            <div style="font-size:9px;color:var(--t3);text-align:right;margin-top:2px">Take-Home</div>
          </div>
        </div>
        <!-- Komponen breakdown -->
        <div class="payroll-body">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">
            <div>
              ${h.gajiPokok?`<div class="payroll-line plus"><span class="payroll-line-lbl">Gaji Pokok</span><span class="payroll-line-val">+${fmt(h.gajiPokok)}</span></div>`:''}
              ${h.honorJam?`<div class="payroll-line plus"><span class="payroll-line-lbl">Honor (${h.jam}j)</span><span class="payroll-line-val">+${fmt(h.honorJam)}</span></div>`:''}
              ${h.tunjangan?`<div class="payroll-line plus"><span class="payroll-line-lbl">Tunjangan</span><span class="payroll-line-val">+${fmt(h.tunjangan)}</span></div>`:''}
              ${h.uangMakan?`<div class="payroll-line plus"><span class="payroll-line-lbl">Makan (${h.hadir}h)</span><span class="payroll-line-val">+${fmt(h.uangMakan)}</span></div>`:''}
              ${h.transport?`<div class="payroll-line plus"><span class="payroll-line-lbl">Transport</span><span class="payroll-line-val">+${fmt(h.transport)}</span></div>`:''}
              ${h.insentif?`<div class="payroll-line plus"><span class="payroll-line-lbl">Insentif</span><span class="payroll-line-val">+${fmt(h.insentif)}</span></div>`:''}
            </div>
            <div style="border-left:1px solid var(--bdr);padding-left:10px">
              ${h.bpjsKes?`<div class="payroll-line minus"><span class="payroll-line-lbl">BPJS Kes.</span><span class="payroll-line-val">-${fmt(h.bpjsKes)}</span></div>`:''}
              ${h.bpjsTK?`<div class="payroll-line minus"><span class="payroll-line-lbl">BPJS TK</span><span class="payroll-line-val">-${fmt(h.bpjsTK)}</span></div>`:''}
              ${h.kasbonPotong?`<div class="payroll-line minus"><span class="payroll-line-lbl">Kasbon</span><span class="payroll-line-val">-${fmt(h.kasbonPotong)}</span></div>`:''}
              ${h.potonganLain?`<div class="payroll-line minus"><span class="payroll-line-lbl">Lain-lain</span><span class="payroll-line-val">-${fmt(h.potonganLain)}</span></div>`:''}
              <div class="payroll-line total-line" style="border-top:1px solid var(--bdr)">
                <span class="payroll-line-lbl" style="font-weight:900;color:var(--t1)">NET</span>
                <span class="payroll-line-val" style="color:var(--pur);font-size:14px">${fmt(h.netto)}</span>
              </div>
            </div>
          </div>
        </div>
        <!-- Actions -->
        <div class="payroll-actions">
          <button class="abtn ${g.sudah_dibayar?'abtn-b':'abtn-g'}" style="flex:1;padding:8px;font-size:11px" onclick="${g.sudah_dibayar?`batalBayarGuru('${g.id}')`:`bayarGuru('${g.id}')`}">
            ${g.sudah_dibayar?'↩️ Batalkan Transfer':'💸 Transfer Gaji'}
          </button>
          <button class="abtn abtn-b" style="padding:8px 10px;font-size:11px" onclick="openSlipGaji('${g.id}')">🧾 Slip</button>
          <button class="abtn abtn-a" style="padding:8px 10px;font-size:11px" onclick="openKasbonModal('${g.id}')">💼 Kasbon</button>
          <button class="abtn" style="padding:8px 10px;font-size:11px;background:var(--s2);color:var(--t2);border:1px solid var(--bdr2)" onclick="openJamModal('${g.id}')">⏰</button>
          <button class="abtn abtn-r" style="padding:8px 10px;font-size:11px" onclick="hapusGuru('${g.id}')">🗑️</button>
        </div>
      </div>`;
    }).join('') + '</div>';
  saveDB();
}

// ── Tambah Guru (upgraded) ──
function resetGuruForm() {
  const ids = ['guru-nama-inp','guru-jabatan-inp','guru-rekening-inp','guru-bpjs-no-inp','guru-gaji-inp','guru-honor-inp','guru-tunjangan-inp','guru-makan-inp','guru-transport-inp','guru-insentif-inp','guru-bpjs-kes-inp','guru-bpjs-tk-inp','guru-potongan-lain-inp'];
  ids.forEach(id => { const e=document.getElementById(id); if(e)e.value=''; });
  const eid = document.getElementById('guru-edit-id'); if(eid) eid.value='';
}

function tambahGuru() {
  const nama = (document.getElementById('guru-nama-inp')||{value:''}).value.trim();
  if (!nama) { showNotif('Nama guru wajib diisi!', 'err'); return; }
  const d = getPayrollCfg();
  const cfg = d.payroll_config;
  const editId = (document.getElementById('guru-edit-id')||{value:''}).value;

  const payload = {
    nama,
    jabatan:  (document.getElementById('guru-jabatan-inp')||{value:'Guru'}).value.trim()||'Guru',
    no_rekening: (document.getElementById('guru-rekening-inp')||{value:''}).value.trim(),
    no_bpjs: (document.getElementById('guru-bpjs-no-inp')||{value:''}).value.trim(),
    gaji_pokok:   parseFloat((document.getElementById('guru-gaji-inp')||{value:0}).value)||0,
    honor_per_jam:parseFloat((document.getElementById('guru-honor-inp')||{value:0}).value)||0,
    tunjangan:    parseFloat((document.getElementById('guru-tunjangan-inp')||{value:0}).value)||0,
    uang_makan_per_hari: parseFloat((document.getElementById('guru-makan-inp')||{value:0}).value)||cfg.uang_makan_per_hari,
    transport_per_hari:  parseFloat((document.getElementById('guru-transport-inp')||{value:0}).value)||cfg.transport_per_hari,
    insentif:     parseFloat((document.getElementById('guru-insentif-inp')||{value:0}).value)||0,
    bpjs_kes:     parseFloat((document.getElementById('guru-bpjs-kes-inp')||{value:0}).value)||cfg.bpjs_kes,
    bpjs_tk:      parseFloat((document.getElementById('guru-bpjs-tk-inp')||{value:0}).value)||cfg.bpjs_tk,
    potongan_lain:parseFloat((document.getElementById('guru-potongan-lain-inp')||{value:0}).value)||0,
    jam_mengajar: 0,
    hari_hadir:   cfg.hari_kerja_default,
    sudah_dibayar: false,
    kasbon_list: [],
    arsip_gaji: []
  };

  if (editId) {
    const g = d.keuangan_guru.find(x=>x.id===editId);
    if (g) Object.assign(g, payload);
    showNotif(`✅ Data ${nama} diperbarui!`, 'ok');
  } else {
    payload.id = 'G'+Date.now();
    payload.total_terima = hitungGaji(payload).netto;
    d.keuangan_guru.push(payload);
    addAktivitas('guru', `Guru baru: ${nama} (${payload.jabatan})`, 0);
    showNotif(`✅ Guru "${nama}" berhasil ditambah!`, 'ok');
  }
  saveDB(); closeModal('modal-guru'); resetGuruForm();
  if (currentPage==='guru') renderGuru();
}

// ── Jam Mengajar (upgraded) ──
function openJamModal(guruId) {
  const d = getD();
  const guru = d.keuangan_guru.find(g => g.id === guruId);
  if (!guru) return;
  activeJamGuruId = guruId;
  document.getElementById('jam-guru-nama').textContent = `👨‍🏫 ${guru.nama} — ${guru.jabatan}`;
  document.getElementById('jam-inp').value = guru.jam_mengajar || 0;
  document.getElementById('jam-guru-id').value = guruId;
  updateJamPreview(guru);
  openModal('modal-jam');
}

function updateJamPreview(guru) {
  const jam = parseInt(document.getElementById('jam-inp').value) || 0;
  const h = hitungGaji({...guru, jam_mengajar: jam});
  document.getElementById('jam-preview-total').textContent = fmt(h.netto);
  document.getElementById('jam-preview-detail').textContent =
    `Bruto ${fmt(h.bruto)} − Potongan ${fmt(h.totalPotongan)}`;
}

function adjustJam(delta) {
  const inp = document.getElementById('jam-inp');
  const d = getD();
  const guru = d.keuangan_guru.find(g => g.id === activeJamGuruId);
  inp.value = Math.max(0, (parseInt(inp.value)||0) + delta);
  if (guru) updateJamPreview(guru);
}

function simpanJam() {
  const guruId = document.getElementById('jam-guru-id').value;
  const jam = parseInt(document.getElementById('jam-inp').value) || 0;
  const d = getD();
  const guru = d.keuangan_guru.find(g => g.id === guruId);
  if (!guru) return;
  guru.jam_mengajar = jam;
  guru.total_terima = hitungGaji(guru).netto;
  guru.sudah_dibayar = false;
  addAktivitas('guru', `Jam mengajar ${guru.nama}: ${jam} jam`, 0);
  saveDB(); closeModal('modal-jam');
  showNotif(`✅ Jam ${guru.nama}: ${jam} jam`, 'ok');
  if (currentPage==='guru') renderGuru();
}

// ── Bayar Guru (upgraded with arsip) ──
function bayarGuru(guruId) {
  const d = getPayrollCfg();
  const guru = d.keuangan_guru.find(g => g.id === guruId);
  if (!guru) return;
  if (guru.sudah_dibayar) { showNotif('Gaji sudah dibayar!', 'warn'); return; }
  const h = hitungGaji(guru, getHariHadirGuru(guru));
  if (d.profil_sekolah.saldo_utama < h.netto) {
    showNotif(`⚠️ Saldo kurang! Butuh ${fmt(h.netto)}, ada ${fmt(d.profil_sekolah.saldo_utama)}`, 'err'); return;
  }
  // Deduct saldo
  d.profil_sekolah.saldo_utama -= h.netto;
  guru.sudah_dibayar = true;
  guru.tgl_bayar = new Date().toISOString();
  guru.total_terima = h.netto;

  // Process kasbon cicilan — kurangi sisa
  (guru.kasbon_list||[]).filter(k=>k.status==='aktif').forEach(k => {
    k.jumlah_sisa = Math.max(0, k.jumlah_sisa - k.cicilan_per_bulan);
    k.cicilan_dibayar = (k.cicilan_dibayar||0) + 1;
    if (k.jumlah_sisa <= 0) { k.status='lunas'; k.tgl_lunas=new Date().toISOString(); }
  });

  // Simpan ke arsip gaji
  const bulanTahun = new Date().toLocaleDateString('id-ID',{month:'long',year:'numeric'});
  if (!guru.arsip_gaji) guru.arsip_gaji = [];
  guru.arsip_gaji.push({
    id: 'ARS'+Date.now(),
    bulan: bulanTahun,
    tgl_bayar: new Date().toISOString(),
    ...h,
    ta: d.akademik_config?.tahun_ajaran_aktif || ''
  });

  // Simpan ke arsip global
  if (!d.arsip_gaji) d.arsip_gaji = [];
  d.arsip_gaji.push({
    id: 'AG'+Date.now(), guru_id: guruId, nama: guru.nama, jabatan: guru.jabatan,
    bulan: bulanTahun, tgl_bayar: new Date().toISOString(), ...h,
    ta: d.akademik_config?.tahun_ajaran_aktif || ''
  });

  addAktivitas('gaji', `💸 Gaji ${guru.nama} (${bulanTahun}) ditransfer`, -h.netto);
  saveDB(); buildTicker();
  showNotif(`✅ Gaji ${guru.nama} ${fmt(h.netto)} berhasil ditransfer!`, 'ok');
  if (currentPage==='guru') renderGuru();
  if (currentPage==='dashboard') renderDashboard();
}

function batalBayarGuru(guruId) {
  const d = getD();
  const guru = d.keuangan_guru.find(g => g.id === guruId);
  if (!guru || !guru.sudah_dibayar) return;
  if (!confirm(`Batalkan transfer gaji ${guru.nama}? Saldo akan dikembalikan.`)) return;
  d.profil_sekolah.saldo_utama += (guru.total_terima || 0);
  guru.sudah_dibayar = false;
  guru.tgl_bayar = null;
  // Remove last arsip entry
  if (guru.arsip_gaji?.length) guru.arsip_gaji.pop();
  if (d.arsip_gaji) {
    const idx = d.arsip_gaji.map(a=>a.guru_id).lastIndexOf(guruId);
    if (idx>=0) d.arsip_gaji.splice(idx,1);
  }
  saveDB(); buildTicker();
  showNotif(`↩️ Transfer gaji ${guru.nama} dibatalkan`, 'warn');
  if (currentPage==='guru') renderGuru();
}

function bayarSemuaGuru() {
  const d = getPayrollCfg();
  const unpaid = d.keuangan_guru.filter(g => !g.sudah_dibayar);
  if (!unpaid.length) { showNotif('Semua guru sudah dibayar!', 'warn'); return; }
  const totalAll = unpaid.reduce((a,g) => a + (g.total_terima || hitungGaji(g).netto), 0);
  if (d.profil_sekolah.saldo_utama < totalAll) {
    showNotif(`⚠️ Saldo kurang! Butuh ${fmt(totalAll)}, ada ${fmt(d.profil_sekolah.saldo_utama)}`, 'err'); return;
  }
  if (!confirm(`Transfer gaji ${unpaid.length} guru total ${fmt(totalAll)}?`)) return;
  unpaid.forEach(g => bayarGuru(g.id));
  showNotif(`🎉 ${unpaid.length} guru berhasil dibayar!`, 'ok');
}

function hapusGuru(guruId) {
  if (!confirm('Hapus data guru ini? Semua data payroll ikut terhapus.')) return;
  const d = getD();
  d.keuangan_guru = d.keuangan_guru.filter(g => g.id !== guruId);
  saveDB(); showNotif('🗑️ Data guru dihapus', 'ok');
  if (currentPage==='guru') renderGuru();
}

// ── KASBON MODULE ──
function openKasbonModal(guruId) {
  const d = getD();
  const g = d.keuangan_guru.find(x=>x.id===guruId);
  if (!g) return;
  activeGuruId = guruId;
  document.getElementById('kasbon-guru-id').value = guruId;
  const c = GURU_COLORS[d.keuangan_guru.indexOf(g) % GURU_COLORS.length];
  const infoEl = document.getElementById('kasbon-guru-info');
  if (infoEl) infoEl.innerHTML = `
    <div style="width:40px;height:40px;border-radius:50%;background:${c.bg};border:2px solid ${c.border};color:${c.text};display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;flex-shrink:0">${getInitials(g.nama)}</div>
    <div>
      <div style="font-size:13px;font-weight:900">${g.nama}</div>
      <div style="font-size:10px;color:var(--t3)">${g.jabatan}</div>
      ${(g.kasbon_list||[]).filter(k=>k.status==='aktif').length>0?`<span class="kasbon-badge">💼 Sisa kasbon: ${fmt((g.kasbon_list||[]).filter(k=>k.status==='aktif').reduce((a,k)=>a+k.jumlah_sisa,0))}</span>`:''}
    </div>`;
  const tglEl = document.getElementById('kasbon-tgl-inp'); if(tglEl) tglEl.value=new Date().toISOString().slice(0,10);
  const prevEl = document.getElementById('kasbon-preview-box'); if(prevEl) prevEl.style.display='none';
  openModal('modal-kasbon');
}

const GURU_COLORS = [
  {bg:'rgba(192,132,252,.15)',border:'var(--pur)',text:'var(--pur)'},
  {bg:'rgba(0,230,118,.15)',border:'var(--grn)',text:'var(--grn)'},
  {bg:'rgba(38,198,218,.15)',border:'var(--cyn)',text:'var(--cyn)'},
  {bg:'rgba(68,138,255,.15)',border:'var(--blu)',text:'var(--blu)'},
];

function updateKasbonPreview() {
  const jumlah = parseFloat(document.getElementById('kasbon-jumlah-inp').value)||0;
  const cicil = parseInt((document.getElementById('kasbon-cicil-inp')||{value:1}).value)||1;
  const prevEl = document.getElementById('kasbon-preview-box');
  const cicilEl = document.getElementById('kasbon-cicil-preview');
  if (jumlah>0 && prevEl && cicilEl) {
    prevEl.style.display='block';
    cicilEl.textContent = fmt(Math.ceil(jumlah/cicil));
  } else if(prevEl) prevEl.style.display='none';
}

function simpanKasbon() {
  const guruId = document.getElementById('kasbon-guru-id').value;
  const jumlah = parseFloat(document.getElementById('kasbon-jumlah-inp').value)||0;
  const tgl = document.getElementById('kasbon-tgl-inp').value;
  const ket = (document.getElementById('kasbon-ket-inp')||{value:''}).value.trim();
  const cicil = parseInt((document.getElementById('kasbon-cicil-inp')||{value:1}).value)||1;
  if (jumlah<=0) { showNotif('Jumlah kasbon harus > 0!','err'); return; }
  const d = getD();
  const g = d.keuangan_guru.find(x=>x.id===guruId);
  if (!g) return;
  if (!g.kasbon_list) g.kasbon_list=[];
  const cicilan = Math.ceil(jumlah/cicil);
  g.kasbon_list.push({
    id:'KB'+Date.now(), jumlah, jumlah_sisa:jumlah,
    cicilan_per_bulan:cicilan, cicilan_total:cicil, cicilan_dibayar:0,
    tgl, keterangan:ket, status:'aktif', tgl_input:new Date().toISOString()
  });
  g.sudah_dibayar=false;
  addAktivitas('guru',`💼 Kasbon ${g.nama}: ${fmt(jumlah)} (${cicil}×cicil)`,0);
  saveDB(); closeModal('modal-kasbon');
  document.getElementById('kasbon-jumlah-inp').value='';
  if(document.getElementById('kasbon-ket-inp'))document.getElementById('kasbon-ket-inp').value='';
  showNotif(`✅ Kasbon ${fmt(jumlah)} untuk ${g.nama} tercatat! Potongan ${fmt(cicilan)}/bulan.`,'ok');
  if(currentPage==='guru')renderGuru();
}

// ── SLIP GAJI ──
function openSlipGaji(guruId) {
  const d = getPayrollCfg();
  const g = d.keuangan_guru.find(x=>x.id===guruId);
  if (!g) return;
  activeGuruId = guruId;
  const slipEl = document.getElementById('slip-gaji-content');
  if (slipEl) slipEl.innerHTML = generateSlipHTML(g, d);
  openModal('modal-slip-gaji');
}

function generateSlipHTML(g, d) {
  const h = hitungGaji(g, getHariHadirGuru(g));
  const sekolah = d.profil_sekolah.nama || 'SekolahPro';
  const bulan = new Date().toLocaleDateString('id-ID',{month:'long',year:'numeric'});
  const noSlip = `SLIP-${g.id.slice(-4)}-${new Date().getMonth()+1}${new Date().getFullYear()}`;

  const penghasilan = [
    ['Gaji Pokok', h.gajiPokok],
    ['Honor Mengajar', h.honorJam, `${h.jam} jam × ${fmt(g.honor_per_jam||0)}`],
    ['Tunjangan Jabatan', h.tunjangan],
    ['Uang Makan', h.uangMakan, `${h.hadir} hari × ${fmt(g.uang_makan_per_hari||0)}`],
    ['Transport', h.transport, `${h.hadir} hari × ${fmt(g.transport_per_hari||0)}`],
    ['Insentif', h.insentif],
  ].filter(([,val])=>val>0);

  const potongan = [
    ['BPJS Kesehatan', h.bpjsKes],
    ['BPJS Ketenagakerjaan', h.bpjsTK],
    ['Potongan Kasbon', h.kasbonPotong],
    ['Potongan Lain-lain', h.potonganLain],
  ].filter(([,val])=>val>0);

  return `<div class="slip-wrap">
    <div class="slip-header">
      <div class="slip-header-logo">🏫</div>
      <div style="flex:1">
        <div class="slip-header-school-name">${sekolah}</div>
        <div class="slip-header-sub">SLIP GAJI KARYAWAN</div>
      </div>
      <div class="slip-month-badge">${bulan}</div>
    </div>
    <div class="slip-guru-row">
      <div class="slip-guru-cell"><div class="slip-guru-label">Nama Karyawan</div><div class="slip-guru-value">${g.nama}</div></div>
      <div class="slip-guru-cell"><div class="slip-guru-label">Jabatan</div><div class="slip-guru-value">${g.jabatan}</div></div>
      <div class="slip-guru-cell"><div class="slip-guru-label">No. Slip</div><div class="slip-guru-value" style="font-family:'Courier New',monospace">${noSlip}</div></div>
      <div class="slip-guru-cell"><div class="slip-guru-label">No. Rekening</div><div class="slip-guru-value">${g.no_rekening||'—'}</div></div>
    </div>
    <div style="display:flex;gap:0">
      <div class="slip-section" style="flex:1;border-right:1px solid #e0e0e0">
        <div class="slip-section-title">💰 Penghasilan</div>
        ${penghasilan.map(([lbl,val,ket])=>`<div class="slip-row plus"><span class="slip-row-lbl">${lbl}${ket?`<br/><span style="font-size:8px;color:#aaa">${ket}</span>`:''}</span><span class="slip-row-val">+${fmt(val)}</span></div>`).join('')}
        <div class="slip-row" style="border-top:1px solid #e0e0e0;padding-top:5px;margin-top:3px"><span class="slip-row-lbl" style="font-weight:900">Total Bruto</span><span class="slip-row-val" style="font-weight:900">${fmt(h.bruto)}</span></div>
      </div>
      <div class="slip-section" style="flex:1">
        <div class="slip-section-title">✂️ Potongan</div>
        ${potongan.length?potongan.map(([lbl,val])=>`<div class="slip-row minus"><span class="slip-row-lbl">${lbl}</span><span class="slip-row-val">-${fmt(val)}</span></div>`).join(''):'<div style="font-size:10px;color:#aaa">Tidak ada potongan</div>'}
        ${potongan.length?`<div class="slip-row" style="border-top:1px solid #e0e0e0;padding-top:5px;margin-top:3px"><span class="slip-row-lbl" style="font-weight:900">Total Potongan</span><span class="slip-row-val minus" style="font-weight:900">-${fmt(h.totalPotongan)}</span></div>`:''}
      </div>
    </div>
    <div class="slip-total-box">
      <div><div class="slip-total-label">GAJI BERSIH (TAKE-HOME PAY)</div><div style="font-size:9px;color:#4a6080;margin-top:1px">Bruto ${fmt(h.bruto)} − Potongan ${fmt(h.totalPotongan)}</div></div>
      <div class="slip-total-value">${fmt(h.netto)}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:14px 16px;background:#f9f9f9">
      <div style="text-align:center;font-size:9px;color:#666">
        <div>Dikeluarkan oleh,</div>
        <div style="border-bottom:1px solid #000;margin:28px 8px 3px"></div>
        <div style="font-weight:700">Bendahara Sekolah</div>
      </div>
      <div style="text-align:center;font-size:9px;color:#666">
        <div>Diterima oleh,</div>
        <div style="border-bottom:1px solid #000;margin:28px 8px 3px"></div>
        <div style="font-weight:700">${g.nama}</div>
      </div>
    </div>
    <div class="slip-footer">
      <span>Dicetak: ${new Date().toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'})}</span>
      <span>Sekolah Pro · © 2026 Arblok Digital · 0895-0805-3795</span>
    </div>
  </div>`;
}

function cetakSlipGaji() {
  var d = getPayrollCfg();
  var g = d.keuangan_guru.find(function(x){return x.id===activeGuruId;});
  if (!g) return;
  var html = generateSlipHTML(g, d);
  var blob = new Blob([html], {type:'text/html'});
  var url  = URL.createObjectURL(blob);
  var w    = window.open(url, '_blank', 'width=600,height=800');
  setTimeout(function(){ if(w) w.print(); }, 800);
}

function shareSlipWA() {
  const d = getPayrollCfg();
  const g = d.keuangan_guru.find(x=>x.id===activeGuruId);
  if (!g) return;
  if (!g.hp_guru && !g.no_rekening) { showNotif('No HP guru belum ada di profil!','warn'); return; }
  const h = hitungGaji(g, getHariHadirGuru(g));
  const bulan = new Date().toLocaleDateString('id-ID',{month:'long',year:'numeric'});
  const msg = `*SLIP GAJI — ${(d.profil_sekolah.nama||'SekolahPro').toUpperCase()}*\n`+
    `📅 ${bulan}\n\n👤 *${g.nama}* — ${g.jabatan}\n\n`+
    `💰 *PENGHASILAN*\n`+
    `├ Gaji Pokok: ${fmt(h.gajiPokok)}\n`+
    (h.honorJam?`├ Honor (${h.jam}j): ${fmt(h.honorJam)}\n`:'')+
    (h.tunjangan?`├ Tunjangan: ${fmt(h.tunjangan)}\n`:'')+
    (h.uangMakan?`├ Uang Makan: ${fmt(h.uangMakan)}\n`:'')+
    (h.transport?`├ Transport: ${fmt(h.transport)}\n`:'')+
    `└ Total Bruto: *${fmt(h.bruto)}*\n\n`+
    `✂️ *POTONGAN*\n`+
    (h.bpjsKes?`├ BPJS Kes: -${fmt(h.bpjsKes)}\n`:'')+
    (h.bpjsTK?`├ BPJS TK: -${fmt(h.bpjsTK)}\n`:'')+
    (h.kasbonPotong?`├ Kasbon: -${fmt(h.kasbonPotong)}\n`:'')+
    `└ Total Potong: *-${fmt(h.totalPotongan)}*\n\n`+
    `━━━━━━━━━━━━━━━━\n💵 *GAJI BERSIH: ${fmt(h.netto)}*\n`+
    `Rekening: ${g.no_rekening||'—'}\n\n`+
    `_Sekolah Pro by Arblok Digital_\n_0895-0805-3795_`;
  const hp = (g.hp_guru||'6289508053795').replace(/[^0-9]/g,'').replace(/^0/,'62');
  bukaWA(hp, encodeURIComponent(msg));
}

// ── PAYROLL CONFIG ──
function openPayrollConfigModal() {
  const d = getPayrollCfg();
  const cfg = d.payroll_config;
  const set = (id,val) => { const e=document.getElementById(id); if(e)e.value=val||''; };
  set('cfg-bpjs-kes', cfg.bpjs_kes);
  set('cfg-bpjs-tk', cfg.bpjs_tk);
  set('cfg-makan', cfg.uang_makan_per_hari);
  set('cfg-transport', cfg.transport_per_hari);
  set('cfg-hari-kerja', cfg.hari_kerja_default);
}

function simpanPayrollConfig() {
  const d = getPayrollCfg();
  const get = id => parseFloat((document.getElementById(id)||{value:0}).value)||0;
  d.payroll_config.bpjs_kes = get('cfg-bpjs-kes');
  d.payroll_config.bpjs_tk = get('cfg-bpjs-tk');
  d.payroll_config.uang_makan_per_hari = get('cfg-makan');
  d.payroll_config.transport_per_hari = get('cfg-transport');
  d.payroll_config.hari_kerja_default = parseInt((document.getElementById('cfg-hari-kerja')||{value:22}).value)||22;
  saveDB(); closeModal('modal-payroll-config');
  showNotif('✅ Konfigurasi payroll disimpan!','ok');
  if(currentPage==='guru')renderGuru();
}

// ── ARSIP GAJI ──
function openPayrollArsip() {
  const d = getPayrollCfg();
  // Populate guru filter
  const guruSel = document.getElementById('arsip-filter-guru');
  if (guruSel) guruSel.innerHTML='<option value="">Semua Guru</option>'+d.keuangan_guru.map(g=>`<option value="${g.id}">${g.nama}</option>`).join('');
  // Populate tahun filter
  const tahunSel = document.getElementById('arsip-filter-tahun');
  if (tahunSel) {
    const tahunSet = new Set((d.arsip_gaji||[]).map(a=>new Date(a.tgl_bayar).getFullYear()));
    tahunSel.innerHTML='<option value="">Semua Tahun</option>'+[...tahunSet].sort((a,b)=>b-a).map(y=>`<option value="${y}">${y}</option>`).join('');
  }
  renderArsipGaji();
  openModal('modal-arsip-gaji');
}

function renderArsipGaji() {
  const d = getPayrollCfg();
  const guruFilter = (document.getElementById('arsip-filter-guru')||{value:''}).value;
  const tahunFilter = (document.getElementById('arsip-filter-tahun')||{value:''}).value;
  let list = d.arsip_gaji||[];
  if (guruFilter) list = list.filter(a=>a.guru_id===guruFilter);
  if (tahunFilter) list = list.filter(a=>String(new Date(a.tgl_bayar).getFullYear())===tahunFilter);
  list = list.slice().sort((a,b)=>new Date(b.tgl_bayar)-new Date(a.tgl_bayar));
  const grandTotal = list.reduce((s,a)=>s+(a.netto||0),0);
  const cntEl = document.getElementById('arsip-count'); if(cntEl) cntEl.textContent=list.length;
  const gtEl = document.getElementById('arsip-grand-total'); if(gtEl) gtEl.textContent=fmt(grandTotal);
  const el = document.getElementById('arsip-gaji-list');
  if (!el) return;
  if (!list.length) { el.innerHTML='<div class="empty-state" style="padding:24px"><span>📭</span><span style="font-size:12px;color:var(--t3)">Belum ada arsip gaji</span></div>'; return; }
  el.innerHTML=`<table class="arsip-tbl">
    <thead><tr><th>Nama Guru</th><th>Bulan</th><th>Bruto</th><th>Potongan</th><th>Net</th><th>Status</th></tr></thead>
    <tbody>${list.map(a=>`<tr>
      <td style="font-weight:700">${a.nama}</td>
      <td style="color:var(--t3)">${a.bulan}</td>
      <td style="font-family:'Courier New',monospace">${fmt(a.bruto||0)}</td>
      <td style="font-family:'Courier New',monospace;color:var(--red)">-${fmt(a.totalPotongan||0)}</td>
      <td style="font-family:'Courier New',monospace;color:var(--grn);font-weight:900">${fmt(a.netto||0)}</td>
      <td><span class="bdg bdg-g">Lunas</span></td>
    </tr>`).join('')}</tbody>
  </table>`;
}

function eksporArsipGaji() {
  const d = getPayrollCfg();
  const list = d.arsip_gaji||[];
  if (!list.length) { showNotif('Belum ada arsip!','warn'); return; }
  const headers = 'Nama,Jabatan,Bulan,Bruto,BPJS Kes,BPJS TK,Kasbon,Potongan Total,Net,Tgl Bayar,T.A.';
  const rows = list.map(a=>`${a.nama},${a.jabatan||''},${a.bulan},${a.bruto||0},${a.bpjsKes||0},${a.bpjsTK||0},${a.kasbonPotong||0},${a.totalPotongan||0},${a.netto||0},${new Date(a.tgl_bayar).toLocaleDateString('id-ID')},${a.ta||''}`);
  const blob = new Blob([[headers,...rows].join('\n')],{type:'text/csv'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=`arsip_gaji_${new Date().getFullYear()}.csv`; a.click();
  showNotif('📊 Arsip gaji berhasil diekspor!','ok');
}

// ── GURU DETAIL MODAL ──
function openGuruDetail(guruId) {
  const d = getPayrollCfg();
  const g = d.keuangan_guru.find(x=>x.id===guruId);
  if (!g) return;
  activeGuruId = guruId;
  document.getElementById('guru-detail-id').value = guruId;
  document.getElementById('guru-detail-title').textContent = g.nama;
  renderGuruDetailHeader(g, d);
  renderGuruTabProfil(g);
  renderGuruTabKomponen(g, d);
  renderGuruTabKasbon(g);
  renderGuruTabHistory(g);
  // Reset to profil tab
  document.querySelectorAll('#modal-guru-detail .mtab-btn').forEach(b=>b.classList.remove('on'));
  document.querySelectorAll('#modal-guru-detail .modal-tab-pane').forEach(p=>p.classList.remove('on'));
  document.querySelectorAll('#modal-guru-detail .mtab-btn')[0].classList.add('on');
  document.getElementById('guru-tab-profil').classList.add('on');
  openModal('modal-guru-detail');
}

function renderGuruDetailHeader(g, d) {
  const h = hitungGaji(g, getHariHadirGuru(g));
  const i = d.keuangan_guru.indexOf(g);
  const c = GURU_COLORS[i%GURU_COLORS.length];
  document.getElementById('guru-detail-profil-header').innerHTML=`
    <div style="display:flex;align-items:center;gap:14px">
      <div style="width:56px;height:56px;border-radius:50%;background:${c.bg};border:3px solid ${c.border};color:${c.text};display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;flex-shrink:0">${getInitials(g.nama)}</div>
      <div style="flex:1">
        <div style="font-size:16px;font-weight:900;color:var(--t1)">${g.nama}</div>
        <div style="font-size:11px;color:var(--t2);margin-top:2px">${g.jabatan}</div>
        <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">
          <span class="payroll-status-badge ${g.sudah_dibayar?'payroll-status-lunas':'payroll-status-belum'}">${g.sudah_dibayar?'✅ Sudah Transfer':'⏳ Belum Dibayar'}</span>
          ${(g.kasbon_list||[]).some(k=>k.status==='aktif')?`<span class="kasbon-badge">💼 Ada Kasbon</span>`:''}
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:10px;color:var(--t3)">Take-Home</div>
        <div style="font-size:20px;font-weight:900;color:var(--pur);font-family:'Courier New',monospace">${fmt(h.netto)}</div>
      </div>
    </div>`;
}

function renderGuruTabProfil(g) {
  const rows=[['No. Rekening',g.no_rekening||'—'],['No. BPJS',g.no_bpjs||'—'],['Jam Mengajar',`${g.jam_mengajar||0} jam/bulan`],['Hari Hadir',`${g.hari_hadir||'(default)'} hari`],['No. HP',g.hp_guru||'—']];
  document.getElementById('guru-tab-profil').innerHTML=`
    <div style="display:flex;flex-direction:column;gap:0;margin-bottom:12px">
      ${rows.map(([l,v])=>`<div style="display:flex;padding:9px 0;border-bottom:1px solid var(--bdr);gap:10px"><span style="font-size:11px;color:var(--t3);min-width:110px;flex-shrink:0">${l}</span><span style="font-size:12px;font-weight:600">${v}</span></div>`).join('')}
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      <button class="abtn abtn-b" style="flex:1;padding:10px" onclick="editGuruFromDetail('${g.id}')">✏️ Edit Data</button>
      <button class="abtn abtn-g" style="flex:1;padding:10px" onclick="closeModal('modal-guru-detail');openSlipGaji('${g.id}')">🧾 Slip Gaji</button>
      <button class="abtn abtn-r" style="padding:10px 14px" onclick="closeModal('modal-guru-detail');hapusGuru('${g.id}')">🗑️</button>
    </div>`;
}

function renderGuruTabKomponen(g, d) {
  const h = hitungGaji(g, getHariHadirGuru(g));
  const penghasilan=[['Gaji Pokok',h.gajiPokok,true],['Honor Jam',h.honorJam,true],['Tunjangan',h.tunjangan,true],['Uang Makan',h.uangMakan,true],['Transport',h.transport,true],['Insentif',h.insentif,true],['BPJS Kesehatan',h.bpjsKes,false],['BPJS Ketenagakerjaan',h.bpjsTK,false],['Kasbon Potong',h.kasbonPotong,false],['Potongan Lain',h.potonganLain,false]].filter(([,v])=>v>0);
  document.getElementById('guru-tab-komponen').innerHTML=`
    ${penghasilan.map(([l,v,plus])=>`<div class="payroll-line ${plus?'plus':'minus'}"><span class="payroll-line-lbl">${l}</span><span class="payroll-line-val">${plus?'+':'-'}${fmt(v)}</span></div>`).join('')}
    <div class="payroll-line total-line" style="border-top:2px solid var(--bdr);margin-top:6px;padding-top:8px">
      <span class="payroll-line-lbl">TAKE-HOME PAY</span><span class="payroll-line-val" style="font-size:18px;color:var(--pur)">${fmt(h.netto)}</span>
    </div>
    <div style="margin-top:12px;display:flex;gap:6px">
      <button class="abtn abtn-b" style="flex:1;padding:10px;font-size:11px" onclick="closeModal('modal-guru-detail');openModal('modal-guru');editGuruFromDetail('${g.id}')">✏️ Edit Komponen</button>
      <button class="abtn abtn-a" style="flex:1;padding:10px;font-size:11px" onclick="closeModal('modal-guru-detail');openKasbonModal('${g.id}')">💼 Input Kasbon</button>
    </div>`;
}

function renderGuruTabKasbon(g) {
  const kasbons = g.kasbon_list||[];
  const el = document.getElementById('guru-tab-kasbon');
  if (!kasbons.length) { el.innerHTML='<div class="empty-state" style="padding:20px"><span>✅</span><span style="font-size:11px;color:var(--t3)">Tidak ada kasbon aktif</span></div>'; return; }
  el.innerHTML=kasbons.map(k=>`
    <div style="display:flex;align-items:start;gap:10px;padding:10px 0;border-bottom:1px solid var(--bdr)">
      <div style="width:10px;height:10px;border-radius:50%;background:${k.status==='aktif'?'var(--yel)':'var(--grn)'};margin-top:2px;flex-shrink:0"></div>
      <div style="flex:1">
        <div style="font-size:12px;font-weight:700">${k.keterangan||'Kasbon'} <span class="bdg ${k.status==='aktif'?'bdg-am':'bdg-g'}">${k.status}</span></div>
        <div style="font-size:10px;color:var(--t3);margin-top:2px">${new Date(k.tgl_input).toLocaleDateString('id-ID',{dateStyle:'medium'})}</div>
        <div style="font-size:11px;margin-top:4px">
          Total: <b style="font-family:'Courier New',monospace">${fmt(k.jumlah)}</b> · 
          Sisa: <b style="color:${k.status==='aktif'?'var(--yel)':'var(--grn)'};font-family:'Courier New',monospace">${fmt(k.jumlah_sisa)}</b> · 
          Cicil: <b>${fmt(k.cicilan_per_bulan)}/bln</b>
        </div>
      </div>
      ${k.status==='aktif'?`<button class="abtn abtn-g" style="padding:5px 10px;font-size:10px" onclick="lunaskanKasbon('${g.id}','${k.id}')">Lunas</button>`:''}
    </div>`).join('');
}

function renderGuruTabHistory(g) {
  const arsip = (g.arsip_gaji||[]).slice().reverse();
  const el = document.getElementById('guru-tab-history');
  if (!arsip.length) { el.innerHTML='<div class="empty-state" style="padding:20px"><span>📋</span><span style="font-size:11px;color:var(--t3)">Belum ada riwayat pembayaran</span></div>'; return; }
  el.innerHTML=arsip.map(a=>`
    <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--bdr)">
      <div style="font-size:11px;color:var(--t3);min-width:80px">${a.bulan}</div>
      <div style="flex:1">
        <div style="font-size:11px;color:var(--t3)">Bruto ${fmt(a.bruto||0)} − Potong ${fmt(a.totalPotongan||0)}</div>
      </div>
      <div style="font-size:13px;font-weight:900;color:var(--grn);font-family:'Courier New',monospace">${fmt(a.netto||0)}</div>
      <span class="bdg bdg-g">Lunas</span>
    </div>`).join('');
}

function editGuruFromDetail(guruId) {
  const d = getD();
  const g = d.keuangan_guru.find(x=>x.id===guruId);
  if (!g) return;
  closeModal('modal-guru-detail');
  const set = (id,val) => { const e=document.getElementById(id); if(e)e.value=val||''; };
  const eid = document.getElementById('guru-edit-id'); if(eid) eid.value=guruId;
  set('guru-nama-inp',g.nama); set('guru-jabatan-inp',g.jabatan);
  set('guru-rekening-inp',g.no_rekening); set('guru-bpjs-no-inp',g.no_bpjs);
  set('guru-gaji-inp',g.gaji_pokok); set('guru-honor-inp',g.honor_per_jam);
  set('guru-tunjangan-inp',g.tunjangan); set('guru-makan-inp',g.uang_makan_per_hari);
  set('guru-transport-inp',g.transport_per_hari); set('guru-insentif-inp',g.insentif);
  set('guru-bpjs-kes-inp',g.bpjs_kes); set('guru-bpjs-tk-inp',g.bpjs_tk);
  set('guru-potongan-lain-inp',g.potongan_lain);
  openModal('modal-guru');
}

function lunaskanKasbon(guruId, kasbonId) {
  const d = getD();
  const g = d.keuangan_guru.find(x=>x.id===guruId);
  if (!g) return;
  const k = (g.kasbon_list||[]).find(x=>x.id===kasbonId);
  if (!k) return;
  k.status='lunas'; k.jumlah_sisa=0; k.tgl_lunas=new Date().toISOString();
  saveDB(); showNotif(`✅ Kasbon ${g.nama} dilunasi!`,'ok');
  renderGuruTabKasbon(g);
  if(currentPage==='guru')renderGuru();
}

function switchGuruTab(tab, btn) {
  document.querySelectorAll('#modal-guru-detail .mtab-btn').forEach(b=>b.classList.remove('on'));
  document.querySelectorAll('#modal-guru-detail .modal-tab-pane').forEach(p=>p.classList.remove('on'));
  btn.classList.add('on');
  document.getElementById('guru-tab-'+tab).classList.add('on');
}

// ── Dana BOS ──
function renderBOS() {
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

function setPaguBOS() {
  const pagu = parseFloat(document.getElementById('bos-pagu-inp').value) || 0;
  if (pagu <= 0) { showNotif('Pagu harus > 0!', 'err'); return; }
  const d = getD();
  d.dana_bos.pagu_tahunan = pagu;
  d.dana_bos.sisa_anggaran = pagu - d.dana_bos.terpakai;
  addAktivitas('bos', `Pagu BOS ditetapkan ${fmt(pagu)}`, 0);
  saveDB(); buildTicker(); closeModal('modal-bos-pagu');
  document.getElementById('bos-pagu-inp').value = '';
  showNotif(`✅ Pagu BOS ${fmt(pagu)} berhasil disimpan!`, 'ok');
  if (currentPage === 'bos') renderBOS();
  if (currentPage === 'dashboard') renderDashboard();
}

function keluarBOS() {
  const desc = document.getElementById('bos-desc-inp').value.trim();
  const jumlah = parseFloat(document.getElementById('bos-jumlah-inp').value) || 0;
  const kategori = document.getElementById('bos-kat-inp').value;
  if (!desc) { showNotif('Deskripsi wajib diisi!', 'err'); return; }
  if (jumlah <= 0) { showNotif('Jumlah harus > 0!', 'err'); return; }
  const d = getD();
  if (jumlah > d.dana_bos.sisa_anggaran) {
    showNotif(`⚠️ Melebihi sisa BOS! Sisa: ${fmt(d.dana_bos.sisa_anggaran)}`, 'err'); return;
  }
  d.dana_bos.terpakai += jumlah;
  d.dana_bos.sisa_anggaran = d.dana_bos.pagu_tahunan - d.dana_bos.terpakai;
  d.dana_bos.log_pengeluaran.push({ id: 'BOS' + Date.now(), deskripsi: desc, jumlah, kategori, tanggal: new Date().toISOString() });
  addAktivitas('bos', `BOS: ${desc} (${kategori})`, -jumlah);
  saveDB(); buildTicker(); closeModal('modal-bos-keluar');
  document.getElementById('bos-desc-inp').value = '';
  document.getElementById('bos-jumlah-inp').value = '';
  showNotif(`✅ Pengeluaran BOS ${fmt(jumlah)} tercatat!`, 'ok');
  if (currentPage === 'bos') renderBOS();
  if (currentPage === 'dashboard') renderDashboard();
}

// ── RADAR KESEHATAN ──
function hitungRadar() {
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
function renderSetting() {
  const d = getD();
  document.getElementById('set-nama').value = d.profil_sekolah.nama || '';
  document.getElementById('set-tahun-ajaran').value = d.profil_sekolah.tahun_ajaran || '';
  document.getElementById('set-spp-nominal').value = d.profil_sekolah.spp_nominal || '';
  document.getElementById('set-pengumuman').value = d.profil_sekolah.pengumuman || '';
  // Populate rapor siswa select
  populateRaporSiswaSel();
  // Sync theme buttons
  updateThemeButtons();
  // Sync PIN toggle
  const tog = document.getElementById('set-pin-toggle');
  if (tog) {
    const enabled = !!d.profil_sekolah.pin_enabled;
    tog.checked = enabled;
    const area = document.getElementById('pin-setup-area');
    if (area) area.style.display = enabled ? 'block' : 'none';
    const slider = document.getElementById('pin-toggle-slider');
    const dot = document.getElementById('pin-toggle-dot');
    if (slider) slider.style.background = enabled ? 'var(--grn)' : 'var(--s3)';
    if (dot) dot.style.transform = enabled ? 'translateX(20px)' : 'translateX(0)';
  }
}

function saveSettings() {
  const d = getD();
  d.profil_sekolah.nama = document.getElementById('set-nama').value.trim() || d.profil_sekolah.nama;
  d.profil_sekolah.tahun_ajaran = document.getElementById('set-tahun-ajaran').value.trim();
  d.profil_sekolah.spp_nominal = parseFloat(document.getElementById('set-spp-nominal').value) || 0;
  d.profil_sekolah.pengumuman = document.getElementById('set-pengumuman').value.trim();
  saveDB();
  // Sync all name displays
  const nama = d.profil_sekolah.nama;
  ['banner-school-name','banner-nama-besar','sidebar-school-name'].forEach(id => {
    const el = document.getElementById(id); if (el) el.textContent = nama;
  });
  const taEl = document.getElementById('banner-ta');
  if (taEl) taEl.textContent = 'T.A. ' + (d.profil_sekolah.tahun_ajaran || '');
  buildTicker();
  showNotif('✅ Pengaturan disimpan!', 'ok');
  if (currentPage === 'dashboard') renderDashboard();
}

function exportData() {
  const blob = new Blob([JSON.stringify(DB, null, 2)], {type: 'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'sekolah_pro_backup_' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  showNotif('📤 Data berhasil diekspor!', 'ok');
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!imported.sekolah_pro) throw new Error('Format tidak valid');
        DB = imported;
        saveDB(); buildTicker();
        showNotif('📥 Data berhasil diimpor!', 'ok');
        renderPage(currentPage);
      } catch { showNotif('❌ File tidak valid!', 'err'); }
    };
    reader.readAsText(file);
  };
  input.click();
}

function resetData() {
  if (!confirm('⚠️ Reset semua data? Tindakan ini tidak bisa dibatalkan!')) return;
  DB = JSON.parse(JSON.stringify(DEFAULT_DATA));
  saveDB(); buildTicker();
  showNotif('🗑️ Semua data telah direset', 'warn');
  renderPage(currentPage);
}

// ── AKTIVITAS LOG ──
function addAktivitas(tipe, keterangan, nominal) {
  const d = getD();
  if (!d.riwayat_aktivitas) d.riwayat_aktivitas = [];
  d.riwayat_aktivitas.push({ id: 'ACT' + Date.now(), tipe, keterangan, nominal, waktu: new Date().toISOString() });
  if (d.riwayat_aktivitas.length > 100) d.riwayat_aktivitas = d.riwayat_aktivitas.slice(-100);
}

// ── MODAL UTILS ──
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}
document.querySelectorAll('.modal-bg').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
});

// ── NOTIF ──
let notifTimer;
function showNotif(msg, type) {
  const el = document.getElementById('notif');
  el.textContent = msg;
  el.className = type === 'ok' ? 'nok' : type === 'err' ? 'nerr' : 'nwarn';
  el.style.display = 'block';
  clearTimeout(notifTimer);
  notifTimer = setTimeout(() => el.style.display = 'none', 3200);
}

// ── JAM INP EVENT ──
document.addEventListener('DOMContentLoaded', () => {
  const jamInp = document.getElementById('jam-inp');
  if (jamInp) jamInp.addEventListener('input', () => {
    const d = getD();
    const guru = d.keuangan_guru.find(g => g.id === activeJamGuruId);
    if (guru) updateJamPreview(guru);
  });
});

// ══════════════════════════════════════
//  CRM SISWA MODULE
// ══════════════════════════════════════

let crmFilter = 'all';
let activeSiswaId = null;
let absYear = new Date().getFullYear();
let absMonth = new Date().getMonth();
let absMode = 'H';
let massalState = {};

const BULAN_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const MAPEL_COLORS = {'Matematika':'var(--blu)','IPA':'var(--grn)','IPS':'var(--yel)','Bahasa Indonesia':'var(--cyn)','Bahasa Inggris':'var(--pur)','PKn':'var(--amb)'};

function getAvatarColor(siswa) {
  const colors = [
    {bg:'rgba(0,230,118,.15)',border:'var(--grn)',text:'var(--grn)'},
    {bg:'rgba(68,138,255,.15)',border:'var(--blu)',text:'var(--blu)'},
    {bg:'rgba(255,202,40,.15)',border:'var(--yel)',text:'var(--yel)'},
    {bg:'rgba(192,132,252,.15)',border:'var(--pur)',text:'var(--pur)'},
    {bg:'rgba(38,198,218,.15)',border:'var(--cyn)',text:'var(--cyn)'},
    {bg:'rgba(255,152,0,.15)',border:'var(--amb)',text:'var(--amb)'},
  ];
  return colors[(siswa.nama||'?').charCodeAt(0) % colors.length];
}
function getInitials(nama) { return (nama||'?').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase(); }
function getAgeStr(tgl) {
  if (!tgl) return '—';
  return Math.floor((Date.now()-new Date(tgl).getTime())/(1000*60*60*24*365))+' thn';
}
function getNilaiGrade(n) {
  if (n>=90) return {g:'A',c:'var(--grn)'};
  if (n>=80) return {g:'B',c:'var(--cyn)'};
  if (n>=70) return {g:'C',c:'var(--yel)'};
  if (n>=60) return {g:'D',c:'var(--amb)'};
  return {g:'E',c:'var(--red)'};
}

function renderCRM() {
  const d = getD();
  const search = (document.getElementById('crm-search')||{value:''}).value.toLowerCase();
  let list = d.data_siswa.filter(s => {
    if (crmFilter==='lunas') return s.status_spp==='Lunas';
    if (crmFilter==='tunggakan') return s.status_spp==='Tunggakan';
    if (['1','2','3','4','5','6'].includes(crmFilter)) return (s.kelas||'').startsWith(crmFilter);
    return true;
  }).filter(s => !search || (s.nama||'').toLowerCase().includes(search) || (s.nisn||'').includes(search) || (s.ayah||'').toLowerCase().includes(search) || (s.ibu||'').toLowerCase().includes(search));

  document.getElementById('crm-stat-total').textContent = d.data_siswa.length;
  document.getElementById('crm-stat-lunas').textContent = d.data_siswa.filter(s=>s.status_spp==='Lunas').length;
  document.getElementById('crm-stat-piutang').textContent = d.data_siswa.filter(s=>s.total_piutang>0).length;
  const todayStr = new Date().toISOString().slice(0,10);
  document.getElementById('crm-stat-hadir').textContent = d.data_siswa.filter(s=>(s.absensi||{})[todayStr]==='H').length;

  const el = document.getElementById('crm-list');
  if (!list.length) {
    el.innerHTML = `<div class="empty-state"><span class="empty-icon">👤</span><span class="empty-text">${d.data_siswa.length===0?'Belum ada data siswa':'Tidak ada siswa yang sesuai filter'}</span></div>`;
    return;
  }
  el.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px;padding:0 12px 12px">` +
    list.map(s => {
      const c = getAvatarColor(s);
      const unpaidList = (s.piutang_detail||[]).filter(p=>p.status==='unpaid');
      const totalPiutang = unpaidList.reduce((a,p)=>a+p.jumlah,0);
      const todayAbs = (s.absensi||{})[todayStr];
      const absMap = {H:'✅ Hadir',I:'📝 Izin',S:'🤒 Sakit',A:'❌ Alpha'};
      return `<div class="crm-card" onclick="openSiswaDetail('${s.id}')">
        <div class="crm-card-head">
          <div class="crm-avatar" style="background:${c.bg};border-color:${c.border};color:${c.text}">${getInitials(s.nama)}</div>
          <div class="crm-info">
            <div class="crm-nama">${s.nama}</div>
            <div class="crm-sub">
              <span>Kelas ${s.kelas||'—'}</span>
              ${s.nisn?`<span class="crm-nisn">NISN: ${s.nisn}</span>`:''}
              ${s.ayah?`<span>👨 ${s.ayah}</span>`:''}
            </div>
            <div class="crm-badge-row">
              <span class="bdg ${s.status_spp==='Lunas'?'bdg-g':'bdg-r'}">${s.status_spp||'—'}</span>
              ${totalPiutang>0?`<span class="bdg bdg-am">Piutang ${fmtShort(totalPiutang)}</span>`:''}
              ${todayAbs?`<span class="bdg bdg-b">${absMap[todayAbs]||todayAbs}</span>`:''}
            </div>
          </div>
          <div style="font-size:20px;color:var(--t3)">›</div>
        </div>
      </div>`;
    }).join('') + '</div>';
}

function setCRMFilter(val, btn) {
  crmFilter = val;
  document.querySelectorAll('#crm-filter-chips .fchip').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  renderCRM();
}

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

function openSiswaDetail(siswaId) {
  activeSiswaId = siswaId;
  const d = getD();
  const s = d.data_siswa.find(x=>x.id===siswaId);
  if (!s) return;
  document.getElementById('detail-modal-title').textContent = s.nama;
  renderDetailProfil(s);
  renderDetailPiutang(s);
  absYear = new Date().getFullYear();
  absMonth = new Date().getMonth();
  document.querySelectorAll('.mtab-btn').forEach(b=>b.classList.remove('on'));
  document.querySelectorAll('.modal-tab-pane').forEach(p=>p.classList.remove('on'));
  document.querySelectorAll('.mtab-btn')[0].classList.add('on');
  document.getElementById('tab-profil').classList.add('on');
  openModal('modal-crm-detail');
}

function renderDetailProfil(s) {
  const c = getAvatarColor(s);
  document.getElementById('detail-profil-header').innerHTML = `
    <div class="profil-avatar-big" style="background:${c.bg};border-color:${c.border};color:${c.text}">${getInitials(s.nama)}</div>
    <div class="profil-info">
      <div class="profil-nama">${s.nama}</div>
      <div class="profil-sub">Kelas ${s.kelas||'—'} · ${s.jk==='P'?'👧 Perempuan':'👦 Laki-laki'}</div>
      ${s.nisn?`<div class="profil-nisn">NISN: ${s.nisn}</div>`:''}
      <div style="margin-top:6px;display:flex;gap:5px;flex-wrap:wrap">
        <span class="bdg ${s.status_spp==='Lunas'?'bdg-g':'bdg-r'}">${s.status_spp}</span>
        ${(s.piutang_detail||[]).filter(p=>p.status==='unpaid').length>0?`<span class="bdg bdg-am">${(s.piutang_detail||[]).filter(p=>p.status==='unpaid').length} tagihan belum lunas</span>`:''}
      </div>
    </div>`;
  const rows = [
    ['🎂 Tanggal Lahir', s.tgl_lahir?new Date(s.tgl_lahir).toLocaleDateString('id-ID',{dateStyle:'long'})+` (${getAgeStr(s.tgl_lahir)})`:'—'],
    ['📅 Tahun Masuk', s.tahun_masuk||'—'],
    ['👨 Nama Ayah / Wali', s.ayah||'—'],
    ['👩 Nama Ibu', s.ibu||'—'],
    ['📱 HP Orang Tua', s.hp_ortu?`<a href="tel:${s.hp_ortu}" style="color:var(--cyn)">${s.hp_ortu}</a>`:'—'],
    ['💼 Pekerjaan Ortu', s.pekerjaan_ortu||'—'],
    ['🏠 Alamat', s.alamat||'—'],
  ];
  document.getElementById('detail-profil-content').innerHTML = `<div style="display:flex;flex-direction:column">
    ${rows.map(([l,v])=>`<div style="display:flex;padding:9px 0;border-bottom:1px solid var(--bdr);gap:10px;align-items:start">
      <span style="font-size:11px;color:var(--t3);min-width:130px;flex-shrink:0">${l}</span>
      <span style="font-size:12px;font-weight:600;flex:1">${v}</span>
    </div>`).join('')}
  </div>`;
}

function renderDetailPiutang(s) {
  const list = s.piutang_detail||[];
  const el = document.getElementById('detail-piutang-list');
  if (!el) return;
  const totalUnpaid = list.filter(p=>p.status==='unpaid').reduce((a,p)=>a+p.jumlah,0);
  const totEl = document.getElementById('detail-piutang-total');
  if(totEl) totEl.textContent = fmt(totalUnpaid);
  const totBox = document.getElementById('detail-piutang-total-box');
  if(totBox) totBox.style.display = totalUnpaid>0?'flex':'none';
  if (!list.length) { el.innerHTML = '<div class="empty-state" style="padding:20px"><span class="empty-icon">✅</span><span class="empty-text">Tidak ada tagihan</span></div>'; return; }
  el.innerHTML = list.slice().reverse().map(p=>`
    <div class="piutang-item">
      <div class="piutang-status-dot" style="background:${p.status==='paid'?'var(--grn)':'var(--red)'}"></div>
      <div class="piutang-info">
        <div class="piutang-title">${p.jenis} <span class="bdg ${p.status==='paid'?'bdg-g':'bdg-r'}">${p.status==='paid'?'Lunas':'Belum'}</span></div>
        <div class="piutang-date">${p.keterangan||''} · ${new Date(p.tanggal).toLocaleDateString('id-ID',{dateStyle:'short'})}${p.jatuh_tempo?` · Tempo: ${new Date(p.jatuh_tempo).toLocaleDateString('id-ID',{dateStyle:'short'})}`:''}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
        <div class="piutang-jumlah" style="color:${p.status==='paid'?'var(--grn)':'var(--red)'}">${fmt(p.jumlah)}</div>
        ${p.status==='unpaid'?`<button class="abtn abtn-g" style="padding:3px 8px;font-size:10px" onclick="lunasPiutang('${s.id}','${p.id}')">Lunas</button>`:''}
      </div>
    </div>`).join('');
}

function lunasPiutang(siswaId, piutangId) {
  const d = getD();
  const s = d.data_siswa.find(x=>x.id===siswaId);
  if (!s) return;
  const p = (s.piutang_detail||[]).find(x=>x.id===piutangId);
  if (!p||p.status==='paid') return;
  p.status = 'paid';
  p.tanggal_lunas = new Date().toISOString();
  d.profil_sekolah.saldo_utama += p.jumlah;
  s.total_piutang = (s.piutang_detail||[]).filter(x=>x.status==='unpaid').reduce((a,x)=>a+x.jumlah,0);
  s.status_spp = s.total_piutang>0?'Tunggakan':'Lunas';
  if (!d.riwayat_spp) d.riwayat_spp=[];
  d.riwayat_spp.push({id:'SPP'+Date.now(),siswa_id:siswaId,nama:s.nama,jumlah:p.jumlah,bulan:p.keterangan,catatan:p.jenis,waktu:new Date().toISOString()});
  addAktivitas('spp',`Lunas: ${p.jenis} ${s.nama} (${p.keterangan})`,p.jumlah);
  saveDB(); buildTicker();
  showNotif(`✅ ${p.jenis} ${s.nama} ${fmt(p.jumlah)} — LUNAS!`,'ok');
  renderDetailPiutang(s); renderDetailProfil(s); renderCRM();
}

function openTagihanModal() {
  const d = getD();
  const sppNominal = d.profil_sekolah.spp_nominal||0;
  const el=document.getElementById('tagihan-jumlah-inp');
  if(el) el.value=sppNominal||'';
  const tEl=document.getElementById('tagihan-tempo-inp');
  if(tEl) tEl.value=new Date().toISOString().slice(0,10);
  openModal('modal-tagihan');
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
  s.piutang_detail.push({id:'P'+Date.now(),jenis,keterangan:ket,jumlah,tanggal:new Date().toISOString(),status:'unpaid',jatuh_tempo:tempo});
  s.total_piutang = s.piutang_detail.filter(p=>p.status==='unpaid').reduce((a,p)=>a+p.jumlah,0);
  s.status_spp='Tunggakan';
  addAktivitas('spp',`Tagihan baru: ${jenis} ${s.nama} (${ket})`,0);
  saveDB(); closeModal('modal-tagihan');
  ['tagihan-ket-inp','tagihan-jumlah-inp'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  showNotif(`💳 Tagihan ${jenis} ${fmt(jumlah)} ditambahkan untuk ${s.nama}`,'ok');
  renderDetailPiutang(s); renderCRM();
}

function switchDetailTab(tab, btn) {
  document.querySelectorAll('.mtab-btn').forEach(b=>b.classList.remove('on'));
  document.querySelectorAll('.modal-tab-pane').forEach(p=>p.classList.remove('on'));
  btn.classList.add('on');
  document.getElementById('tab-'+tab).classList.add('on');
  if (tab==='absensi') { const d=getD(); const s=d.data_siswa.find(x=>x.id===activeSiswaId); if(s) renderAbsCalendar(s); }
  if (tab==='nilai') renderNilai();
}

function setAbsMode(m) {
  absMode = m;
  const labels={H:'Hadir (H)',I:'Izin (I)',S:'Sakit (S)',A:'Alpha (A)'};
  const colors={H:'var(--grn)',I:'var(--yel)',S:'var(--blu)',A:'var(--red)'};
  const el=document.getElementById('abs-mode-label');
  if(el){el.textContent=labels[m];el.style.color=colors[m];}
}
function prevAbsMonth() { absMonth--; if(absMonth<0){absMonth=11;absYear--;} const d=getD(); const s=d.data_siswa.find(x=>x.id===activeSiswaId); if(s)renderAbsCalendar(s); }
function nextAbsMonth() { absMonth++; if(absMonth>11){absMonth=0;absYear++;} const d=getD(); const s=d.data_siswa.find(x=>x.id===activeSiswaId); if(s)renderAbsCalendar(s); }

function renderAbsCalendar(s) {
  const el=document.getElementById('abs-cal-grid');
  const lblEl=document.getElementById('abs-month-label');
  if(!el||!lblEl) return;
  lblEl.textContent=`${BULAN_NAMES[absMonth]} ${absYear}`;
  const daysInMonth=new Date(absYear,absMonth+1,0).getDate();
  const firstDay=new Date(absYear,absMonth,1).getDay();
  const absensi=s.absensi||{};
  const absClassMap={H:'hadir',I:'izin',S:'sakit',A:'alpha'};
  const absLblMap={H:'HAD',I:'IZN',S:'SKT',A:'ALP'};
  let html='';
  ['M','S','S','R','K','J','S'].forEach(d=>{html+=`<div style="text-align:center;font-size:9px;color:var(--t3);font-weight:700;padding:3px 0">${d}</div>`;});
  for(let i=0;i<firstDay;i++) html+='<div class="abs-day libur"></div>';
  for(let d=1;d<=daysInMonth;d++){
    const dateStr=`${absYear}-${String(absMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dow=new Date(absYear,absMonth,d).getDay();
    const isWE=dow===0||dow===6;
    const status=absensi[dateStr];
    const cls=status?absClassMap[status]:(isWE?'libur':'');
    const lbl=status?absLblMap[status]:(isWE?'—':'');
    html+=`<div class="abs-day ${cls}" onclick="toggleAbsensi('${dateStr}')"><span class="abs-day-num">${d}</span>${lbl?`<span class="abs-day-lbl">${lbl}</span>`:''}</div>`;
  }
  el.innerHTML=html;
  const mk=Object.keys(absensi).filter(k=>k.startsWith(`${absYear}-${String(absMonth+1).padStart(2,'0')}`));
  const counts={H:0,I:0,S:0,A:0};
  mk.forEach(k=>{if(counts[absensi[k]]!==undefined)counts[absensi[k]]++;});
  const sumEl=document.getElementById('abs-summary');
  if(sumEl) sumEl.innerHTML=[{label:'Hadir',val:counts.H,color:'var(--grn)'},{label:'Izin',val:counts.I,color:'var(--yel)'},{label:'Sakit',val:counts.S,color:'var(--blu)'},{label:'Alpha',val:counts.A,color:'var(--red)'}].map(x=>`<div style="text-align:center;background:${x.color}15;border:1px solid ${x.color}44;border-radius:8px;padding:8px"><div style="font-size:20px;font-weight:900;color:${x.color}">${x.val}</div><div style="font-size:9px;color:var(--t3);font-weight:700">${x.label}</div></div>`).join('');
}

function toggleAbsensi(dateStr) {
  const d=getD(); const s=d.data_siswa.find(x=>x.id===activeSiswaId);
  if(!s) return;
  if(!s.absensi) s.absensi={};
  if(s.absensi[dateStr]===absMode) delete s.absensi[dateStr];
  else s.absensi[dateStr]=absMode;
  saveDB(); renderAbsCalendar(s);
}

function renderMassalList() {
  const d=getD();
  const kf=(document.getElementById('massal-kelas-sel')||{value:''}).value;
  const list=d.data_siswa.filter(s=>!kf||s.kelas===kf);
  const el=document.getElementById('massal-siswa-list');
  if(!el) return;
  if(!list.length){el.innerHTML='<div style="text-align:center;color:var(--t3);padding:20px;font-size:12px">Tidak ada siswa</div>';return;}
  el.innerHTML=list.map(s=>{
    const c=getAvatarColor(s);
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--bdr)">
      <div style="width:32px;height:32px;border-radius:50%;background:${c.bg};border:1.5px solid ${c.border};color:${c.text};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;flex-shrink:0">${getInitials(s.nama)}</div>
      <div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.nama}</div><div style="font-size:10px;color:var(--t3)">Kelas ${s.kelas}</div></div>
      <div style="display:flex;gap:4px">
        ${['H','I','S','A'].map(k=>{const clrs={H:'var(--grn)',I:'var(--yel)',S:'var(--blu)',A:'var(--red)'};return `<button class="abtn" id="massal-btn-${s.id}-${k}" style="padding:5px 7px;font-size:10px;background:${clrs[k]}15;color:${clrs[k]};border:1px solid ${clrs[k]}44" onclick="massalToggle('${s.id}','${k}')">${k}</button>`;}).join('')}
      </div>
    </div>`;
  }).join('');
}

function massalToggle(siswaId, status) {
  massalState[siswaId]=status;
  ['H','I','S','A'].forEach(k=>{
    const btn=document.getElementById(`massal-btn-${siswaId}-${k}`);
    const clrs={H:'var(--grn)',I:'var(--yel)',S:'var(--blu)',A:'var(--red)'};
    if(btn){if(k===status){btn.style.background=clrs[k];btn.style.color='#000';btn.style.borderColor=clrs[k];}else{btn.style.background=`${clrs[k]}15`;btn.style.color=clrs[k];btn.style.borderColor=`${clrs[k]}44`;}}
  });
}
function massalSetAll(status) {
  const d=getD(); const kf=(document.getElementById('massal-kelas-sel')||{value:''}).value;
  d.data_siswa.filter(s=>!kf||s.kelas===kf).forEach(s=>massalToggle(s.id,status));
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

function renderNilai() {
  if (!activeSiswaId) return;
  const d=getD(); const s=d.data_siswa.find(x=>x.id===activeSiswaId);
  if (!s) return;
  const sem=(document.getElementById('nilai-semester-sel')||{value:'1'}).value;
  const nilaiData=(s.nilai||{})[sem]||[];
  const el=document.getElementById('detail-nilai-list');
  if (!el) return;
  if (!nilaiData.length) {
    el.innerHTML='<div class="empty-state" style="padding:20px"><span class="empty-icon">📊</span><span class="empty-text">Belum ada nilai</span></div>';
    const avgEl=document.getElementById('detail-nilai-avg');
    if(avgEl)avgEl.textContent='—';
    return;
  }
  const byMapel={};
  nilaiData.forEach(n=>{if(!byMapel[n.mapel])byMapel[n.mapel]=[];byMapel[n.mapel].push(n);});
  let totAll=0,cntAll=0;
  el.innerHTML=Object.entries(byMapel).map(([mapel,entries])=>{
    const avg=entries.reduce((a,e)=>a+e.nilai,0)/entries.length;
    totAll+=avg;cntAll++;
    const grd=getNilaiGrade(avg);
    const color=MAPEL_COLORS[mapel]||'var(--t2)';
    return `<div class="nilai-row">
      <div style="flex:1"><div class="nilai-mapel">${mapel}</div><div style="display:flex;gap:5px;margin-top:3px;flex-wrap:wrap">${entries.map(e=>`<span class="bdg bdg-x">${e.jenis}: ${e.nilai}</span>`).join('')}</div></div>
      <div class="nilai-bar"><div class="nilai-bar-fill" style="width:${avg}%;background:${color}"></div></div>
      <div class="nilai-score" style="color:${color}">${avg.toFixed(0)}</div>
      <div class="nilai-grade" style="color:${grd.c}">${grd.g}</div>
    </div>`;
  }).join('');
  const avgAll=cntAll>0?(totAll/cntAll).toFixed(1):'—';
  const avgGrd=cntAll>0?getNilaiGrade(totAll/cntAll):{c:'var(--t3)'};
  const avgEl=document.getElementById('detail-nilai-avg');
  if(avgEl){avgEl.textContent=avgAll;avgEl.style.color=avgGrd.c;}
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

function buatTagihanMassal() {
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
      s.piutang_detail.push({id:'P'+Date.now()+Math.random(),jenis:'SPP Bulanan',keterangan:bulan,jumlah:nominal,tanggal:new Date().toISOString(),status:'unpaid',jatuh_tempo:''});
      s.total_piutang=s.piutang_detail.filter(p=>p.status==='unpaid').reduce((a,p)=>a+p.jumlah,0);
      s.status_spp='Tunggakan';count++;
    }
  });
  addAktivitas('spp',`Tagihan SPP ${bulan} dibuat untuk ${count} siswa`,0);
  saveDB(); buildTicker(); closeModal('modal-piutang-massal');
  showNotif(`✅ Tagihan SPP ${bulan} ${fmt(nominal)} dibuat untuk ${count} siswa!`,'ok');
  renderCRM();
}

function editSiswa() { showNotif('Hapus & tambah ulang untuk sementara. Fitur edit segera hadir!','warn'); }
function hapusSiswa() {
  if(!activeSiswaId) return;
  const d=getD(); const s=d.data_siswa.find(x=>x.id===activeSiswaId);
  if(!s||!confirm(`Hapus data ${s.nama}? Semua data termasuk absensi & nilai akan terhapus.`)) return;
  d.data_siswa=d.data_siswa.filter(x=>x.id!==activeSiswaId);
  saveDB(); closeModal('modal-crm-detail');
  showNotif(`🗑️ Data ${s.nama} dihapus`,'ok');
  renderCRM(); populateSiswaSelect();
}

// Patch openModal to init massal
const _origOpen = typeof openModal === 'function' ? openModal : null;
window._origOpen = openModal;
window.openModal = function(id) {
  document.getElementById(id).classList.add('open');
  if (id==='modal-absensi-massal') {
    massalState={};
    const el=document.getElementById('massal-tanggal');
    if(el)el.value=new Date().toISOString().slice(0,10);
    renderMassalList();
  }
};
// Re-patch closeModal too for safety
window.closeModal = function(id) { document.getElementById(id).classList.remove('open'); };

// ══════════════════════════════════════
//  REMINDER ENGINE
// ══════════════════════════════════════
function buildReminders() {
  const d = getD();
  const reminders = [];
  const today = new Date();
  const todayStr = today.toISOString().slice(0,10);

  // Piutang jatuh tempo
  d.data_siswa.forEach(s => {
    (s.piutang_detail||[]).filter(p=>p.status==='unpaid'&&p.jatuh_tempo).forEach(p => {
      const diff = Math.ceil((new Date(p.jatuh_tempo)-today)/(1000*60*60*24));
      if (diff <= 7) {
        reminders.push({
          color: diff < 0 ? 'var(--red)' : diff === 0 ? 'var(--red)' : 'var(--yel)',
          title: `${s.nama} — ${p.jenis} ${fmt(p.jumlah)}`,
          sub: diff < 0 ? `Jatuh tempo ${Math.abs(diff)} hari yang lalu (${p.keterangan})` : diff === 0 ? `Jatuh tempo HARI INI (${p.keterangan})` : `Jatuh tempo ${diff} hari lagi — ${p.keterangan}`,
          action: `openSiswaDetail('${s.id}')`,
          actionLabel: 'Bayar'
        });
      }
    });
  });

  // BOS hampir habis
  if (d.dana_bos.pagu_tahunan > 0) {
    const pct = (d.dana_bos.terpakai/d.dana_bos.pagu_tahunan)*100;
    if (pct >= 90) reminders.push({ color:'var(--red)', title:'Dana BOS kritis!', sub:`Sudah ${pct.toFixed(0)}% terpakai. Sisa ${fmt(d.dana_bos.sisa_anggaran)}`, action:`switchPage('bos')`, actionLabel:'Lihat' });
    else if (pct >= 75) reminders.push({ color:'var(--amb)', title:'Dana BOS perlu perhatian', sub:`${pct.toFixed(0)}% terpakai. Sisa ${fmt(d.dana_bos.sisa_anggaran)}`, action:`switchPage('bos')`, actionLabel:'Lihat' });
  }

  // Saldo tidak cukup bayar gaji
  const totalGaji = d.keuangan_guru.filter(g=>!g.sudah_dibayar).reduce((a,g)=>a+(g.total_terima||0),0);
  if (totalGaji > 0 && d.profil_sekolah.saldo_utama < totalGaji) {
    reminders.push({ color:'var(--red)', title:'Saldo tidak cukup bayar gaji!', sub:`Butuh ${fmt(totalGaji)}, saldo ${fmt(d.profil_sekolah.saldo_utama)}`, action:`switchPage('guru')`, actionLabel:'Guru' });
  }

  // Tunggakan SPP banyak
  const tunggakCount = d.data_siswa.filter(s=>s.status_spp==='Tunggakan').length;
  if (tunggakCount >= 3) {
    reminders.push({ color:'var(--amb)', title:`${tunggakCount} siswa belum bayar SPP`, sub:'Segera lakukan penagihan', action:`switchPage('crm')`, actionLabel:'Lihat' });
  }

  return reminders;
}

// ══════════════════════════════════════
//  JADWAL KELAS MODULE
// ══════════════════════════════════════
function getJadwalDB() {
  const d = getD();
  if (!d.jadwal) d.jadwal = {};
  if (!d.jadwal_slots) d.jadwal_slots = [
    {id:'s1',mulai:'07:00',selesai:'07:40',label:'Jam 1'},
    {id:'s2',mulai:'07:40',selesai:'08:20',label:'Jam 2'},
    {id:'s3',mulai:'08:20',selesai:'09:00',label:'Jam 3'},
    {id:'s4',mulai:'09:00',selesai:'09:15',label:'Istirahat'},
    {id:'s5',mulai:'09:15',selesai:'09:55',label:'Jam 4'},
    {id:'s6',mulai:'09:55',selesai:'10:35',label:'Jam 5'},
    {id:'s7',mulai:'10:35',selesai:'11:15',label:'Jam 6'},
  ];
  return d;
}

const HARI_NAMES = ['','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const MAPEL_CELL_COLORS = ['filled','filled-blu','filled-pur','filled-yel'];
const MAPEL_COLOR_MAP = {};
let _mapelColorIdx = 0;
function getMapelColor(mapel) {
  if (!MAPEL_COLOR_MAP[mapel]) {
    MAPEL_COLOR_MAP[mapel] = MAPEL_CELL_COLORS[_mapelColorIdx % MAPEL_CELL_COLORS.length];
    _mapelColorIdx++;
  }
  return MAPEL_COLOR_MAP[mapel];
}

function renderJadwal() {
  const d = getJadwalDB();
  const kelas = (document.getElementById('jd-kelas-sel')||{value:'1A'}).value;
  const slots = d.jadwal_slots;
  const jadwalKelas = d.jadwal[kelas] || {};

  // Stats
  const allMapel = new Set();
  const allGuru = new Set();
  let totalJam = 0;
  Object.values(jadwalKelas).forEach(hari => Object.values(hari).forEach(cell => {
    allMapel.add(cell.mapel); if(cell.guru)allGuru.add(cell.guru); totalJam++;
  }));
  const todayDay = new Date().getDay(); // 0=Sun,1=Mon...
  const hariMap = {1:'Senin',2:'Selasa',3:'Rabu',4:'Kamis',5:'Jumat',6:'Sabtu'};
  document.getElementById('jd-stat-mapel').textContent = allMapel.size;
  document.getElementById('jd-stat-guru').textContent = allGuru.size;
  document.getElementById('jd-stat-jam').textContent = totalJam;
  document.getElementById('jd-stat-hari').textContent = hariMap[todayDay] || '—';

  // Build grid
  const grid = document.getElementById('jadwal-grid');
  if (!grid) return;
  let html = `<div class="jd-header">Waktu</div>`;
  for (let h=1;h<=6;h++) html += `<div class="jd-header">${HARI_NAMES[h]}</div>`;

  slots.forEach(slot => {
    html += `<div class="jd-time">${slot.mulai}<br><span style="font-size:8px;color:var(--t3)">${slot.label}</span></div>`;
    for (let h=1;h<=6;h++) {
      const cell = (jadwalKelas[h]||{})[slot.id];
      if (cell) {
        const cc = getMapelColor(cell.mapel);
        html += `<div class="jd-cell ${cc}" onclick="hapusJadwalCell('${kelas}','${h}','${slot.id}')">
          <div class="jd-mapel">${cell.mapel}</div>
          ${cell.guru?`<div class="jd-guru">${cell.guru.split(' ')[0]}</div>`:''}
        </div>`;
      } else {
        html += `<div class="jd-cell" onclick="quickAddJadwal('${h}','${slot.id}')"><div style="text-align:center;color:var(--bdr2);font-size:16px;margin-top:6px">+</div></div>`;
      }
    }
  });
  grid.innerHTML = html;

  // Slots list
  const sEl = document.getElementById('jadwal-slots-list');
  if (sEl) sEl.innerHTML = slots.map(s => `
    <div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--bdr)">
      <span style="font-size:13px;font-weight:700;font-family:'Courier New',monospace;color:var(--cyn);min-width:100px">${s.mulai}–${s.selesai}</span>
      <span style="font-size:12px;font-weight:600;flex:1">${s.label}</span>
      <button class="abtn abtn-r" style="padding:4px 8px;font-size:10px" onclick="hapusSlot('${s.id}')">✕</button>
    </div>`).join('');

  // Populate slot select in modal
  const slotSel = document.getElementById('jd-slot-inp');
  if (slotSel) slotSel.innerHTML = slots.map(s => `<option value="${s.id}">${s.label} (${s.mulai}–${s.selesai})</option>`).join('');

  // Populate guru select
  const guruSel = document.getElementById('jd-guru-inp');
  if (guruSel) {
    guruSel.innerHTML = '<option value="">-- Pilih Guru --</option>' + d.keuangan_guru.map(g=>`<option value="${g.nama}">${g.nama}</option>`).join('');
  }

  saveDB();
}

function quickAddJadwal(hari, slotId) {
  const d = getJadwalDB();
  const slotSel = document.getElementById('jd-slot-inp');
  if (slotSel) slotSel.value = slotId;
  const hariSel = document.getElementById('jd-hari-inp');
  if (hariSel) hariSel.value = hari;
  openModal('modal-jadwal-add');
}

function simpanJadwal() {
  const d = getJadwalDB();
  const kelas = (document.getElementById('jd-kelas-sel')||{value:'1A'}).value;
  const hari = document.getElementById('jd-hari-inp').value;
  const slotId = document.getElementById('jd-slot-inp').value;
  const mapel = document.getElementById('jd-mapel-inp').value;
  const guru = document.getElementById('jd-guru-inp').value;
  if (!d.jadwal[kelas]) d.jadwal[kelas] = {};
  if (!d.jadwal[kelas][hari]) d.jadwal[kelas][hari] = {};
  d.jadwal[kelas][hari][slotId] = { mapel, guru };
  saveDB(); closeModal('modal-jadwal-add');
  showNotif(`✅ Jadwal ${mapel} Kelas ${kelas} ${HARI_NAMES[hari]} disimpan!`, 'ok');
  renderJadwal();
}

function hapusJadwalCell(kelas, hari, slotId) {
  if (!confirm('Hapus jadwal ini?')) return;
  const d = getJadwalDB();
  if (d.jadwal[kelas]&&d.jadwal[kelas][hari]) delete d.jadwal[kelas][hari][slotId];
  saveDB(); renderJadwal();
}

function hapusJadwalKelas() {
  const kelas = (document.getElementById('jd-kelas-sel')||{value:'1A'}).value;
  if (!confirm(`Hapus semua jadwal kelas ${kelas}?`)) return;
  const d = getJadwalDB();
  delete d.jadwal[kelas];
  saveDB(); showNotif(`🗑️ Jadwal kelas ${kelas} dihapus`, 'ok'); renderJadwal();
}

function simpanSlot() {
  const mulai = document.getElementById('slot-mulai').value;
  const selesai = document.getElementById('slot-selesai').value;
  const label = document.getElementById('slot-label').value.trim() || `${mulai}–${selesai}`;
  if (!mulai||!selesai) { showNotif('Jam mulai dan selesai wajib diisi!','err'); return; }
  const d = getJadwalDB();
  d.jadwal_slots.push({ id:'slot'+Date.now(), mulai, selesai, label });
  d.jadwal_slots.sort((a,b) => a.mulai.localeCompare(b.mulai));
  saveDB(); closeModal('modal-slot-add');
  document.getElementById('slot-label').value='';
  showNotif(`✅ Slot ${label} ditambah!`, 'ok');
  renderJadwal();
}

function hapusSlot(slotId) {
  const d = getJadwalDB();
  d.jadwal_slots = d.jadwal_slots.filter(s=>s.id!==slotId);
  saveDB(); renderJadwal();
}

// ══════════════════════════════════════
//  LAPORAN & CETAK MODULE
// ══════════════════════════════════════
function renderLaporan() {
  renderReminderLaporan();
  renderGrafikAbsensi();
  renderRankingNilai();
  // Set default bulan to current
  const bulanSel = document.getElementById('grafik-bulan-sel');
  if (bulanSel) bulanSel.value = new Date().getMonth();
}

function renderReminderLaporan() {
  const reminders = buildReminders();
  const el = document.getElementById('lap-reminder-list');
  if (!el) return;
  if (!reminders.length) {
    el.innerHTML = '<div style="font-size:12px;color:var(--t3);padding:8px 0">✅ Tidak ada piutang jatuh tempo atau peringatan aktif</div>';
    return;
  }
  el.innerHTML = reminders.map(r => `
    <div class="reminder-item">
      <div class="reminder-dot" style="background:${r.color}"></div>
      <div class="reminder-info">
        <div class="reminder-title">${r.title}</div>
        <div class="reminder-sub">${r.sub}</div>
      </div>
      ${r.action?`<button class="abtn" style="padding:5px 10px;font-size:10px;background:${r.color}15;color:${r.color};border:1px solid ${r.color}44" onclick="${r.action}">${r.actionLabel}</button>`:''}
    </div>`).join('');
}

function renderGrafikAbsensi() {
  const d = getD();
  const kf = (document.getElementById('grafik-kelas-sel')||{value:''}).value;
  const bulan = parseInt((document.getElementById('grafik-bulan-sel')||{value:new Date().getMonth()}).value);
  const year = new Date().getFullYear();
  const siswaList = d.data_siswa.filter(s => !kf || s.kelas===kf);
  const el = document.getElementById('grafik-absensi-wrap');
  if (!el) return;
  if (!siswaList.length) { el.innerHTML='<div class="empty-state" style="padding:20px"><span>📭</span><span style="font-size:12px;color:var(--t3)">Tidak ada data</span></div>'; return; }

  // Aggregate per day
  const daysInMonth = new Date(year, bulan+1, 0).getDate();
  const summary = {H:0,I:0,S:0,A:0};
  const perDay = [];
  for (let day=1; day<=daysInMonth; day++) {
    const dateStr = `${year}-${String(bulan+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const dow = new Date(year,bulan,day).getDay();
    if (dow===0||dow===6) { perDay.push({day,hadir:0,total:0,isWE:true}); continue; }
    let hadir=0, total=0;
    siswaList.forEach(s => { const a=(s.absensi||{})[dateStr]; if(a){total++;if(a==='H')hadir++;if(summary[a]!==undefined)summary[a]++;} });
    perDay.push({day,hadir,total,isWE:false});
  }
  const maxHadir = Math.max(...perDay.map(p=>p.hadir), 1);

  // Bar chart
  const bars = perDay.map(p => {
    if (p.isWE) return `<div class="mini-bar" style="background:var(--bdr);height:${p.hadir?Math.max(4,(p.hadir/maxHadir)*54):4}px;opacity:.3">
      <span class="mini-bar-lbl">${p.day}</span></div>`;
    const pct = p.total>0?(p.hadir/p.total)*100:100;
    const color = pct>=90?'var(--grn)':pct>=75?'var(--yel)':pct>=50?'var(--amb)':'var(--red)';
    return `<div class="mini-bar" style="background:${color};height:${Math.max(4,(p.hadir/maxHadir)*54)}px" title="Tgl ${p.day}: ${p.hadir}/${p.total} hadir">
      ${p.day%5===0?`<span class="mini-bar-lbl">${p.day}</span>`:''}
    </div>`;
  }).join('');

  el.innerHTML = `
    <div style="margin-bottom:8px">
      <div class="mini-chart-wrap">
        <div class="mini-chart" style="height:70px">${bars}</div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--t3);margin-top:4px">
        <span>1</span><span style="flex:1;text-align:center">${BULAN_NAMES[bulan]} ${year}</span><span>${daysInMonth}</span>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:8px">
      <div style="text-align:center;background:var(--grn-bg);border:1px solid rgba(0,230,118,.2);border-radius:8px;padding:8px">
        <div style="font-size:20px;font-weight:900;color:var(--grn)">${summary.H}</div>
        <div style="font-size:9px;color:var(--t3);font-weight:700">HADIR</div>
      </div>
      <div style="text-align:center;background:var(--yel-bg);border:1px solid rgba(255,202,40,.2);border-radius:8px;padding:8px">
        <div style="font-size:20px;font-weight:900;color:var(--yel)">${summary.I}</div>
        <div style="font-size:9px;color:var(--t3);font-weight:700">IZIN</div>
      </div>
      <div style="text-align:center;background:var(--blu-bg);border:1px solid rgba(68,138,255,.2);border-radius:8px;padding:8px">
        <div style="font-size:20px;font-weight:900;color:var(--blu)">${summary.S}</div>
        <div style="font-size:9px;color:var(--t3);font-weight:700">SAKIT</div>
      </div>
      <div style="text-align:center;background:var(--red-bg);border:1px solid rgba(255,82,82,.2);border-radius:8px;padding:8px">
        <div style="font-size:20px;font-weight:900;color:var(--red)">${summary.A}</div>
        <div style="font-size:9px;color:var(--t3);font-weight:700">ALPHA</div>
      </div>
    </div>`;
}

function renderRankingNilai() {
  const d = getD();
  const kf = (document.getElementById('ranking-kelas-sel')||{value:''}).value;
  const sem = (document.getElementById('ranking-sem-sel')||{value:'1'}).value;
  const el = document.getElementById('ranking-nilai-list');
  if (!el) return;
  const list = d.data_siswa.filter(s=>!kf||s.kelas===kf).map(s=>{
    const nilaiData = (s.nilai||{})[sem]||[];
    const byMapel={};
    nilaiData.forEach(n=>{if(!byMapel[n.mapel])byMapel[n.mapel]=[];byMapel[n.mapel].push(n.nilai);});
    const mapelAvgs = Object.values(byMapel).map(vals=>vals.reduce((a,b)=>a+b,0)/vals.length);
    const avg = mapelAvgs.length? mapelAvgs.reduce((a,b)=>a+b,0)/mapelAvgs.length : null;
    return {...s, avg};
  }).filter(s=>s.avg!==null).sort((a,b)=>b.avg-a.avg);

  if (!list.length) { el.innerHTML='<div class="empty-state" style="padding:20px"><span>📊</span><span style="font-size:12px;color:var(--t3)">Belum ada data nilai</span></div>'; return; }
  el.innerHTML = `<table class="rekap-tbl">
    <thead><tr><th>#</th><th>Nama</th><th>Kelas</th><th>Rata-rata</th><th>Grade</th></tr></thead>
    <tbody>${list.map((s,i)=>{
      const grd=getNilaiGrade(s.avg);
      const medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':'';
      return `<tr>
        <td style="font-weight:700;color:var(--t2)">${medal||i+1}</td>
        <td style="font-weight:700;cursor:pointer;color:var(--cyn)" onclick="openSiswaDetail('${s.id}')">${s.nama}</td>
        <td>${s.kelas}</td>
        <td style="font-weight:900;font-family:'Courier New',monospace;color:${grd.c}">${s.avg.toFixed(1)}</td>
        <td style="font-weight:700;color:${grd.c}">${grd.g}</td>
      </tr>`;
    }).join('')}</tbody>
  </table>`;
}

// ── CETAK LAPORAN ──
function cetakRekap(tipe) {
  const d = getD();
  const el = document.getElementById('print-modal-content');
  const titleEl = document.getElementById('print-modal-title');
  let title='', html='', csvData=[], csvTitle='';

  if (tipe==='spp') {
    title='💳 Rekap Pembayaran SPP';
    csvTitle='rekap_spp';
    const rows = d.data_siswa.map(s => {
      const unpaid = (s.piutang_detail||[]).filter(p=>p.status==='unpaid').reduce((a,p)=>a+p.jumlah,0);
      const paid = (s.piutang_detail||[]).filter(p=>p.status==='paid').reduce((a,p)=>a+p.jumlah,0);
      return {nama:s.nama,kelas:s.kelas,nisn:s.nisn||'—',status:s.status_spp,lunas:paid,piutang:unpaid};
    });
    csvData=rows;
    html=`<table class="rekap-tbl">
      <thead><tr><th>Nama</th><th>Kelas</th><th>NISN</th><th>Status</th><th>Total Lunas</th><th>Piutang</th></tr></thead>
      <tbody>${rows.map(r=>`<tr>
        <td style="font-weight:700">${r.nama}</td><td>${r.kelas}</td><td style="font-family:'Courier New',monospace">${r.nisn}</td>
        <td><span class="bdg ${r.status==='Lunas'?'bdg-g':'bdg-r'}">${r.status}</span></td>
        <td style="color:var(--grn);font-weight:700;font-family:'Courier New',monospace">${fmt(r.lunas)}</td>
        <td style="color:${r.piutang>0?'var(--red)':'var(--t3)'};font-weight:700;font-family:'Courier New',monospace">${r.piutang>0?fmt(r.piutang):'—'}</td>
      </tr>`).join('')}</tbody>
    </table>
    <div style="margin-top:12px;padding:10px;background:var(--s2);border-radius:8px;display:flex;justify-content:space-between">
      <span style="font-size:12px;font-weight:700">Total Piutang Keseluruhan</span>
      <span style="font-size:16px;font-weight:900;color:var(--red);font-family:'Courier New',monospace">${fmt(rows.reduce((a,r)=>a+r.piutang,0))}</span>
    </div>`;
  }

  else if (tipe==='absensi') {
    title='📅 Rekap Absensi Bulanan';
    csvTitle='rekap_absensi';
    const bulan = new Date().getMonth();
    const year = new Date().getFullYear();
    const rows = d.data_siswa.map(s => {
      const absensi=s.absensi||{};
      const mk=Object.keys(absensi).filter(k=>k.startsWith(`${year}-${String(bulan+1).padStart(2,'0')}`));
      return {nama:s.nama,kelas:s.kelas,H:mk.filter(k=>absensi[k]==='H').length,I:mk.filter(k=>absensi[k]==='I').length,S:mk.filter(k=>absensi[k]==='S').length,A:mk.filter(k=>absensi[k]==='A').length};
    });
    csvData=rows;
    html=`<div style="margin-bottom:8px;font-size:12px;color:var(--t2)">Bulan: ${BULAN_NAMES[bulan]} ${year}</div>
    <table class="rekap-tbl">
      <thead><tr><th>Nama</th><th>Kelas</th><th style="color:var(--grn)">H</th><th style="color:var(--yel)">I</th><th style="color:var(--blu)">S</th><th style="color:var(--red)">A</th><th>%Hadir</th></tr></thead>
      <tbody>${rows.map(r=>{
        const tot=r.H+r.I+r.S+r.A;
        const pct=tot>0?((r.H/tot)*100).toFixed(0)+'%':'—';
        const pctColor=tot===0?'var(--t3)':r.H/tot>=.9?'var(--grn)':r.H/tot>=.75?'var(--yel)':'var(--red)';
        return `<tr><td style="font-weight:700">${r.nama}</td><td>${r.kelas}</td>
          <td style="color:var(--grn);font-weight:700">${r.H}</td><td style="color:var(--yel);font-weight:700">${r.I}</td>
          <td style="color:var(--blu);font-weight:700">${r.S}</td><td style="color:var(--red);font-weight:700">${r.A}</td>
          <td style="color:${pctColor};font-weight:700">${pct}</td></tr>`;
      }).join('')}</tbody>
    </table>`;
  }

  else if (tipe==='nilai') {
    title='📊 Rekap Nilai Akademik';
    csvTitle='rekap_nilai';
    const sem='1';
    const rows = d.data_siswa.map(s=>{
      const nd=(s.nilai||{})[sem]||[];
      const bm={};
      nd.forEach(n=>{if(!bm[n.mapel])bm[n.mapel]=[];bm[n.mapel].push(n.nilai);});
      const avgs=Object.values(bm).map(v=>v.reduce((a,b)=>a+b,0)/v.length);
      const avg=avgs.length?avgs.reduce((a,b)=>a+b,0)/avgs.length:null;
      return {nama:s.nama,kelas:s.kelas,avg,mapelCount:Object.keys(bm).length};
    }).filter(r=>r.avg!==null).sort((a,b)=>b.avg-a.avg);
    csvData=rows;
    html=`<table class="rekap-tbl">
      <thead><tr><th>#</th><th>Nama</th><th>Kelas</th><th>Mapel</th><th>Rata-rata</th><th>Grade</th></tr></thead>
      <tbody>${rows.map((r,i)=>{
        const grd=getNilaiGrade(r.avg);
        return `<tr><td style="font-weight:700">${i+1}</td><td style="font-weight:700">${r.nama}</td><td>${r.kelas}</td>
          <td style="color:var(--t3)">${r.mapelCount} mapel</td>
          <td style="font-weight:900;font-family:'Courier New',monospace;color:${grd.c}">${r.avg.toFixed(1)}</td>
          <td style="font-weight:700;color:${grd.c}">${grd.g}</td></tr>`;
      }).join('')}</tbody>
    </table>`;
  }

  else if (tipe==='gaji') {
    title='💸 Rekap Penggajian Guru';
    csvTitle='rekap_gaji';
    const rows=d.keuangan_guru.map(g=>({nama:g.nama,jabatan:g.jabatan,gaji_pokok:g.gaji_pokok,jam:g.jam_mengajar||0,honor:g.honor_per_jam,honor_total:(g.jam_mengajar||0)*(g.honor_per_jam||0),total:g.total_terima||0,status:g.sudah_dibayar?'Lunas':'Belum'}));
    const grandTotal=rows.reduce((a,r)=>a+r.total,0);
    csvData=rows;
    html=`<table class="rekap-tbl">
      <thead><tr><th>Nama</th><th>Jabatan</th><th>Gaji Pokok</th><th>Jam</th><th>Honor</th><th>Total</th><th>Status</th></tr></thead>
      <tbody>${rows.map(r=>`<tr>
        <td style="font-weight:700">${r.nama}</td><td style="color:var(--t3)">${r.jabatan}</td>
        <td style="font-family:'Courier New',monospace">${fmt(r.gaji_pokok)}</td>
        <td style="text-align:center">${r.jam}</td>
        <td style="font-family:'Courier New',monospace">${fmt(r.honor_total)}</td>
        <td style="font-weight:900;font-family:'Courier New',monospace;color:var(--pur)">${fmt(r.total)}</td>
        <td><span class="bdg ${r.status==='Lunas'?'bdg-g':'bdg-am'}">${r.status}</span></td>
      </tr>`).join('')}</tbody>
    </table>
    <div style="margin-top:12px;padding:10px;background:var(--pur-bg);border-radius:8px;display:flex;justify-content:space-between">
      <span style="font-size:12px;font-weight:700">Grand Total Gaji</span>
      <span style="font-size:16px;font-weight:900;color:var(--pur);font-family:'Courier New',monospace">${fmt(grandTotal)}</span>
    </div>`;
  }

  else if (tipe==='bos') {
    title='🏦 Laporan Dana BOS';
    csvTitle='laporan_bos';
    const bos=d.dana_bos;
    const pct=bos.pagu_tahunan>0?((bos.terpakai/bos.pagu_tahunan)*100).toFixed(1):'0';
    const rows=bos.log_pengeluaran.map(l=>({desc:l.deskripsi,kat:l.kategori,jumlah:l.jumlah,tgl:new Date(l.tanggal).toLocaleDateString('id-ID')}));
    csvData=rows;
    html=`
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
      <div style="text-align:center;background:var(--yel-bg);border:1px solid rgba(255,202,40,.2);border-radius:8px;padding:10px">
        <div style="font-size:11px;color:var(--yel);font-weight:700">PAGU</div>
        <div style="font-size:14px;font-weight:900;color:var(--yel);font-family:'Courier New',monospace">${fmt(bos.pagu_tahunan)}</div>
      </div>
      <div style="text-align:center;background:var(--amb-bg);border:1px solid rgba(255,152,0,.2);border-radius:8px;padding:10px">
        <div style="font-size:11px;color:var(--amb);font-weight:700">TERPAKAI ${pct}%</div>
        <div style="font-size:14px;font-weight:900;color:var(--amb);font-family:'Courier New',monospace">${fmt(bos.terpakai)}</div>
      </div>
      <div style="text-align:center;background:var(--grn-bg);border:1px solid rgba(0,230,118,.2);border-radius:8px;padding:10px">
        <div style="font-size:11px;color:var(--grn);font-weight:700">SISA</div>
        <div style="font-size:14px;font-weight:900;color:var(--grn);font-family:'Courier New',monospace">${fmt(bos.sisa_anggaran)}</div>
      </div>
    </div>
    <table class="rekap-tbl">
      <thead><tr><th>Deskripsi</th><th>Kategori</th><th>Jumlah</th><th>Tanggal</th></tr></thead>
      <tbody>${rows.map(r=>`<tr>
        <td>${r.desc}</td><td><span class="bdg bdg-am">${r.kat}</span></td>
        <td style="font-weight:700;font-family:'Courier New',monospace;color:var(--amb)">${fmt(r.jumlah)}</td>
        <td style="color:var(--t3)">${r.tgl}</td>
      </tr>`).join('')}</tbody>
    </table>`;
  }

  if (titleEl) titleEl.textContent = title;
  if (el) el.innerHTML = html;
  // Store for CSV export
  window._csvData = csvData;
  window._csvTitle = csvTitle;
  openModal('modal-print');
}

function eksporCSV() {
  const data = window._csvData || [];
  if (!data.length) { showNotif('Tidak ada data untuk diekspor!','err'); return; }
  const keys = Object.keys(data[0]);
  const rows = [keys.join(','), ...data.map(r=>keys.map(k=>JSON.stringify(r[k]||'')).join(','))];
  const blob = new Blob([rows.join('\n')], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (window._csvTitle||'laporan')+'_'+new Date().toISOString().slice(0,10)+'.csv';
  a.click();
  showNotif('📊 CSV berhasil diekspor!','ok');
}

function eksporJSON() {
  exportData();
}

// ── KARTU SPP ──
function renderKartuSPP() {
  var siswaId = (document.getElementById("kartu-siswa-sel")||{value:""}).value;
  var tahun   = (document.getElementById("kartu-tahun")||{value:"2024/2025"}).value;
  var d  = getD();
  var s  = d.data_siswa.find(function(x){ return x.id === siswaId; });
  var el = document.getElementById("kartu-preview");
  if (!el) return;
  if (!s) { el.innerHTML = ""; return; }

  var bulanList = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  var paidBulan = {};
  (s.piutang_detail||[]).filter(function(p){ return p.status==="paid" && p.jenis==="SPP Bulanan"; }).forEach(function(p) {
    bulanList.forEach(function(b,i) {
      if ((p.keterangan||"").includes(b) || (p.keterangan||"").toLowerCase().includes(b.toLowerCase())) {
        paidBulan[i] = true;
      }
    });
  });

  var bulanGrid = bulanList.map(function(b,i) {
    var cls = paidBulan[i] ? "lunas" : "belum";
    return "<div class=\"kartu-bulan " + cls + "\">" + b + "</div>";
  }).join("");

  var tglCetak = new Date().toLocaleDateString("id-ID", {dateStyle:"long"});

  el.innerHTML = "<div class=\"kartu-spp\">" +
    "<div class=\"kartu-header\">" +
      "<div class=\"kartu-logo\">&#127983;</div>" +
      "<div class=\"kartu-school\">" +
        "<div class=\"kartu-school-name\">" + (d.profil_sekolah.nama||"") + "</div>" +
        "<div class=\"kartu-school-sub\">KARTU PEMBAYARAN SPP</div>" +
        "<div class=\"kartu-school-sub\">T.A. " + tahun + "</div>" +
      "</div>" +
    "</div>" +
    "<div class=\"kartu-siswa-name\">" + s.nama + "</div>" +
    "<div class=\"kartu-grid\">" +
      "<div class=\"kartu-cell\"><div class=\"kartu-cell-lbl\">KELAS</div><div class=\"kartu-cell-val\">" + (s.kelas||"-") + "</div></div>" +
      "<div class=\"kartu-cell\"><div class=\"kartu-cell-lbl\">NISN</div><div class=\"kartu-cell-val\">" + (s.nisn||"-") + "</div></div>" +
      "<div class=\"kartu-cell\"><div class=\"kartu-cell-lbl\">ORANG TUA</div><div class=\"kartu-cell-val\">" + (s.ayah||"-") + "</div></div>" +
      "<div class=\"kartu-cell\"><div class=\"kartu-cell-lbl\">NOMINAL SPP</div><div class=\"kartu-cell-val\">" + fmt(d.profil_sekolah.spp_nominal||0) + "</div></div>" +
    "</div>" +
    "<hr style=\"border:none;border-top:1px dashed #ccc;margin:8px 0\"/>" +
    "<div style=\"font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;margin-bottom:5px\">Status Pembayaran</div>" +
    "<div class=\"kartu-bulan-grid\">" + bulanGrid + "</div>" +
    "<div style=\"margin-top:8px;font-size:8px;color:#888;text-align:center\">Dicetak " + tglCetak + "</div>" +
  "</div>";
}

function printKartu() {
  var el = document.getElementById("kartu-preview");
  if (!el) return;
  var css = [
    "*{box-sizing:border-box;margin:0;padding:0}",
    "body{font-family:Arial,sans-serif;background:#fff;padding:20px}",
    ".kartu-spp{border:2px solid #000;border-radius:8px;padding:16px;max-width:320px;font-size:10px}",
    ".kartu-header{display:flex;gap:12px;align-items:center;border-bottom:1px dashed #999;padding-bottom:10px;margin-bottom:10px}",
    ".kartu-logo{font-size:28px}",
    ".kartu-school-name{font-size:12px;font-weight:900}",
    ".kartu-school-sub{font-size:9px;color:#666;margin-top:2px}",
    ".kartu-siswa-name{font-size:14px;font-weight:900;margin:8px 0 4px}",
    ".kartu-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin:8px 0}",
    ".kartu-cell{background:#f5f5f5;padding:6px 8px;border-radius:4px}",
    ".kartu-cell-lbl{font-size:8px;color:#666;text-transform:uppercase}",
    ".kartu-cell-val{font-size:11px;font-weight:900;margin-top:2px}",
    ".kartu-bulan-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:3px;margin-top:8px}",
    ".kartu-bulan{text-align:center;padding:4px 2px;border-radius:3px;border:1px solid #ddd;font-size:8px;font-weight:700}",
    ".lunas{background:#d4edda;border-color:#28a745;color:#155724}",
    ".belum{background:#f8d7da;border-color:#dc3545;color:#721c24}"
  ].join("");
  var html = "<html><head><title>Kartu SPP</title><style>" + css + "</style></head><body>" + el.innerHTML + "</body></html>";
  var blob = new Blob([html], {type:"text/html"});
  var url = URL.createObjectURL(blob);
  var w = window.open(url, "_blank", "width=400,height=600");
  setTimeout(function(){ if(w) w.print(); }, 800);
}

function getKomDB() {
  const d = getD();
  if (!d.komunikasi) d.komunikasi = { pesan: [], broadcast: [] };
  return d;
}

const WA_TEMPLATES = {
  tagihan: `Assalamualaikum Wr. Wb.\nYth. Bapak/Ibu Orang Tua/Wali Siswa,\n\nDengan hormat, kami mengingatkan bahwa pembayaran SPP bulan ini belum kami terima. Mohon segera melakukan pembayaran.\n\nTerima kasih atas perhatiannya.\n\nHormat kami,\n*{sekolah}*`,
  agenda: `Assalamualaikum Wr. Wb.\nYth. Bapak/Ibu Orang Tua/Wali Siswa,\n\nKami ingin menginformasikan agenda kegiatan sekolah:\n📅 [Nama Kegiatan]\n🗓 [Tanggal]\n📍 [Tempat]\n\nMohon perhatian dan dukungannya.\n\nTerima kasih.\n*{sekolah}*`,
  prestasi: `Assalamualaikum Wr. Wb.\nYth. Bapak/Ibu Orang Tua {nama},\n\n🎉 Selamat! Putra/putri Anda telah meraih prestasi membanggakan!\n\nKami bangga atas pencapaian {nama} dan berharap dapat terus berprestasi.\n\nTerima kasih.\n*{sekolah}*`,
  libur: `Assalamualaikum Wr. Wb.\nYth. Bapak/Ibu Orang Tua/Wali Siswa,\n\n🏖️ *PENGUMUMAN HARI LIBUR*\n\nDiberitahukan bahwa sekolah akan LIBUR pada:\n📅 [Tanggal]\nKarena: [Alasan]\n\nKegiatan belajar mengajar kembali normal pada: [Tanggal]\n\nTerima kasih.\n*{sekolah}*`
};

function setTemplate(key) {
  const d = getD();
  let tpl = WA_TEMPLATES[key] || '';
  tpl = tpl.replace(/{sekolah}/g, d.profil_sekolah.nama);
  tpl = tpl.replace(/{nama}/g, '[Nama Siswa]');
  const el = document.getElementById('bc-pesan-inp');
  if (el) el.value = tpl;
}

function renderKomunikasi() {
  const d = getKomDB();
  const kom = d.komunikasi;
  const totalOrtuHP = d.data_siswa.filter(s => s.hp_ortu).length;

  document.getElementById('kom-stat-total').textContent = kom.pesan.length;
  document.getElementById('kom-stat-broadcast').textContent = kom.broadcast.length;
  document.getElementById('kom-stat-ortu').textContent = totalOrtuHP;
  document.getElementById('kom-stat-unread').textContent = kom.pesan.filter(p => !p.dibaca).length;

  // Pesan list
  const el = document.getElementById('kom-pesan-list');
  if (!kom.pesan.length) {
    el.innerHTML = '<div class="empty-state"><span class="empty-icon">💬</span><span class="empty-text">Belum ada riwayat pesan</span></div>';
  } else {
    const katColors = {'Tagihan SPP':'var(--red)','Absensi':'var(--blu)','Nilai/Akademik':'var(--cyn)','Prestasi':'var(--grn)','Perilaku':'var(--amb)','Informasi Umum':'var(--t2)','Lainnya':'var(--t3)'};
    el.innerHTML = kom.pesan.slice().reverse().slice(0, 20).map(p => {
      const s = d.data_siswa.find(x => x.id === p.siswa_id);
      const c = s ? getAvatarColor(s) : {bg:'var(--s2)',border:'var(--bdr2)',text:'var(--t3)'};
      const color = katColors[p.kategori] || 'var(--t2)';
      return `<div class="pesan-item">
        <div class="pesan-avatar" style="background:${c.bg};border-color:${c.border};color:${c.text}">${s?getInitials(s.nama):'?'}</div>
        <div class="pesan-body">
          <div class="pesan-header">
            <span class="pesan-nama">${s?s.nama:'Unknown'}</span>
            <span class="pesan-waktu">${new Date(p.waktu).toLocaleDateString('id-ID',{dateStyle:'short'})}</span>
          </div>
          <div class="pesan-teks">${p.isi}</div>
          <span class="pesan-tag" style="background:${color}15;color:${color};border:1px solid ${color}44">${p.kategori}</span>
          ${s&&s.hp_ortu ? `<button class="abtn" style="margin-top:6px;padding:4px 10px;font-size:10px;background:#25D36615;color:#25D366;border:1px solid #25D36644" onclick="bukaWA('${s.hp_ortu}','${encodeURIComponent(p.isi)}')">📱 WA</button>` : ''}
        </div>
      </div>`;
    }).join('');
  }

  // HP direktori
  const el2 = document.getElementById('kom-hp-list');
  const siswaHP = d.data_siswa.filter(s => s.hp_ortu);
  if (!siswaHP.length) {
    el2.innerHTML = '<div style="font-size:12px;color:var(--t3);padding:8px">Belum ada data no HP orang tua. Tambahkan melalui CRM Siswa.</div>';
  } else {
    el2.innerHTML = siswaHP.map(s => {
      const c = getAvatarColor(s);
      return `<div class="broadcast-item">
        <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">
          <div style="width:32px;height:32px;border-radius:50%;background:${c.bg};border:1.5px solid ${c.border};color:${c.text};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;flex-shrink:0">${getInitials(s.nama)}</div>
          <div style="min-width:0">
            <div style="font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.nama} <span style="color:var(--t3);font-size:10px">(${s.ayah||'—'})</span></div>
            <div style="font-size:11px;color:var(--cyn);font-family:'Courier New',monospace">${s.hp_ortu}</div>
          </div>
        </div>
        <button class="wa-btn" style="width:auto;padding:6px 12px;font-size:11px" onclick="bukaWA('${s.hp_ortu}','')">📱</button>
      </div>`;
    }).join('');
  }

  // Populate siswa select
  const sel = document.getElementById('pesan-siswa-sel');
  if (sel) sel.innerHTML = d.data_siswa.map(s => `<option value="${s.id}">${s.nama} (${s.kelas})</option>`).join('') || '<option>-- Belum ada siswa --</option>';
}

function bukaWA(hp, pesan) {
  const num = hp.replace(/[^0-9]/g,'').replace(/^0/, '62');
  const url = `https://wa.me/${num}${pesan ? '?text='+pesan : ''}`;
  window.open(url, '_blank');
}

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
function getInvDB() {
  const d = getD();
  if (!d.inventaris) d.inventaris = [];
  return d;
}

let invFilter = 'all';
let activeAsetId = null;

const ASET_ICONS = { Elektronik:'💻', Furnitur:'🪑', Olahraga:'⚽', Perpustakaan:'📚', Laboratorium:'🔬', Lainnya:'📌' };
const KONDISI_LABELS = { baik:'Baik', 'rusak-ringan':'Rusak Ringan', 'rusak-berat':'Rusak Berat', hilang:'Hilang' };
const KONDISI_CLASSES = { baik:'aset-baik', 'rusak-ringan':'aset-rusak-ringan', 'rusak-berat':'aset-rusak-berat', hilang:'aset-hilang' };

function setInvFilter(val, btn) {
  invFilter = val;
  document.querySelectorAll('#inventaris-page .fchip').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  renderInventaris();
}

function renderInventaris() {
  const d = getInvDB();
  const list = d.inventaris.filter(a => invFilter === 'all' || a.kategori === invFilter);
  const total = d.inventaris.length;
  const baik = d.inventaris.filter(a => a.kondisi === 'baik').length;
  const rusak = d.inventaris.filter(a => a.kondisi === 'rusak-ringan' || a.kondisi === 'rusak-berat').length;
  const nilaiTotal = d.inventaris.reduce((s, a) => s + ((a.nilai || 0) * (a.jumlah || 1)), 0);

  document.getElementById('inv-stat-total').textContent = total;
  document.getElementById('inv-stat-baik').textContent = baik;
  document.getElementById('inv-stat-rusak').textContent = rusak;
  document.getElementById('inv-stat-nilai').textContent = fmtShort(nilaiTotal);

  const el = document.getElementById('inv-aset-list');
  if (!list.length) {
    el.innerHTML = '<div class="empty-state"><span class="empty-icon">📦</span><span class="empty-text">' + (total === 0 ? 'Belum ada data aset' : 'Tidak ada aset dalam kategori ini') + '</span></div>';
    return;
  }
  el.innerHTML = '<div style="display:flex;flex-direction:column;gap:8px;padding:0 12px 12px">' +
    list.map(a => `<div class="aset-card" onclick="openAsetDetail('${a.id}')">
      <div class="aset-icon" style="background:${a.kondisi==='baik'?'var(--grn-bg)':a.kondisi==='rusak-berat'?'var(--red-bg)':a.kondisi==='hilang'?'rgba(255,255,255,.04)':'var(--yel-bg)'}">${ASET_ICONS[a.kategori] || '📌'}</div>
      <div class="aset-info">
        <div class="aset-nama">${a.nama}</div>
        <div class="aset-meta">
          <span>${a.kategori}</span>
          ${a.lokasi ? `<span>📍 ${a.lokasi}</span>` : ''}
          ${a.no_inventaris ? `<span style="font-family:'Courier New',monospace">#${a.no_inventaris}</span>` : ''}
          <span>Qty: ${a.jumlah || 1}</span>
        </div>
        <span class="aset-kondisi ${KONDISI_CLASSES[a.kondisi] || 'aset-baik'}">${KONDISI_LABELS[a.kondisi] || 'Baik'}</span>
        ${a.nilai ? `<div class="aset-nilai">${fmt(a.nilai * (a.jumlah||1))}</div>` : ''}
      </div>
      <div style="font-size:18px;color:var(--t3)">›</div>
    </div>`).join('') + '</div>';
}

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

function openAsetDetail(asetId) {
  activeAsetId = asetId;
  const d = getInvDB();
  const a = d.inventaris.find(x => x.id === asetId);
  if (!a) return;
  document.getElementById('aset-detail-title').textContent = a.nama;
  const nilaiTotal = (a.nilai || 0) * (a.jumlah || 1);
  const rows = [
    ['Kategori', a.kategori], ['Jumlah', a.jumlah || 1], ['Kondisi', KONDISI_LABELS[a.kondisi] || '—'],
    ['Lokasi', a.lokasi || '—'], ['No. Inventaris', a.no_inventaris || '—'],
    ['Tahun Perolehan', a.tahun || '—'], ['Nilai Satuan', fmt(a.nilai || 0)],
    ['Nilai Total', fmt(nilaiTotal)], ['Keterangan', a.keterangan || '—'],
  ];
  document.getElementById('aset-detail-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
      <div style="width:52px;height:52px;border-radius:12px;background:var(--s2);display:flex;align-items:center;justify-content:center;font-size:26px">${ASET_ICONS[a.kategori]||'📌'}</div>
      <div><div style="font-size:16px;font-weight:900">${a.nama}</div><span class="aset-kondisi ${KONDISI_CLASSES[a.kondisi]||'aset-baik'}">${KONDISI_LABELS[a.kondisi]||'Baik'}</span></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:0">${rows.map(([l,v])=>`<div style="display:flex;padding:9px 0;border-bottom:1px solid var(--bdr);gap:10px">
      <span style="font-size:11px;color:var(--t3);min-width:130px;flex-shrink:0">${l}</span>
      <span style="font-size:12px;font-weight:600;flex:1">${v}</span>
    </div>`).join('')}</div>
    ${a.riwayat_kondisi.length ? `<div style="margin-top:10px"><div style="font-size:11px;font-weight:700;color:var(--t3);margin-bottom:6px;text-transform:uppercase">Riwayat Kondisi</div>${a.riwayat_kondisi.slice(-5).reverse().map(r=>`<div style="font-size:11px;color:var(--t2);padding:5px 0;border-bottom:1px solid var(--bdr)">${new Date(r.waktu).toLocaleDateString('id-ID')} — <b>${KONDISI_LABELS[r.kondisi]||r.kondisi}</b> — ${r.catatan||''}</div>`).join('')}</div>` : ''}`;
  openModal('modal-aset-detail');
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
function getKalDB() {
  const d = getD();
  if (!d.kalender) d.kalender = [];
  return d;
}

let kalYear = new Date().getFullYear();
let kalMonth = new Date().getMonth();

const EV_TYPE_MAP = { libur:{label:'Libur',cls:'ev-libur',color:'var(--red)'}, ujian:{label:'Ujian',cls:'ev-ujian',color:'var(--amb)'}, kegiatan:{label:'Kegiatan',cls:'ev-kegiatan',color:'var(--blu)'}, rapat:{label:'Rapat',cls:'ev-rapat',color:'var(--pur)'}, lain:{label:'Lainnya',cls:'ev-lain',color:'var(--t2)'} };

function prevKalMonth() { kalMonth--; if(kalMonth<0){kalMonth=11;kalYear--;} renderKalender(); }
function nextKalMonth() { kalMonth++; if(kalMonth>11){kalMonth=0;kalYear++;} renderKalender(); }

function renderKalender() {
  const d = getKalDB();
  const today = new Date();
  const todayStr = today.toISOString().slice(0,10);

  // Header days
  const hdrEl = document.getElementById('kal-day-headers');
  if (hdrEl) hdrEl.innerHTML = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(h => `<div class="kal-day-hdr">${h}</div>`).join('');

  const daysInMonth = new Date(kalYear, kalMonth+1, 0).getDate();
  const firstDay = new Date(kalYear, kalMonth, 1).getDay();
  const lblEl = document.getElementById('kal-month-label');
  if (lblEl) lblEl.textContent = `${BULAN_NAMES[kalMonth]} ${kalYear}`;

  // Build event map
  const eventMap = {};
  d.kalender.forEach(ev => {
    const start = new Date(ev.tgl_mulai);
    const end = ev.tgl_selesai ? new Date(ev.tgl_selesai) : start;
    for (let d2 = new Date(start); d2 <= end; d2.setDate(d2.getDate()+1)) {
      const key = d2.toISOString().slice(0,10);
      if (!eventMap[key]) eventMap[key] = [];
      eventMap[key].push(ev);
    }
  });

  let html = '';
  // Empty cells
  for (let i=0;i<firstDay;i++) html += '<div></div>';
  for (let day=1; day<=daysInMonth; day++) {
    const dateStr = `${kalYear}-${String(kalMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const evs = eventMap[dateStr] || [];
    const isToday = dateStr === todayStr;
    const hasLibur = evs.some(e => e.tipe === 'libur');
    let cls = 'kal-day';
    if (isToday) cls += ' today';
    if (evs.length) cls += ' has-event';
    if (hasLibur) cls += ' libur';
    const chips = evs.slice(0,2).map(e => {
      const et = EV_TYPE_MAP[e.tipe] || EV_TYPE_MAP.lain;
      return `<span class="kal-event-chip ${et.cls}-cal">${e.judul}</span>`;
    }).join('');
    html += `<div class="${cls}" onclick="showDayEvents('${dateStr}')">
      <div class="kal-day-num" style="${isToday?'color:var(--grn);font-weight:900':''}">${day}</div>
      ${chips}
    </div>`;
  }
  const gridEl = document.getElementById('kal-grid');
  if (gridEl) gridEl.innerHTML = html;

  // Upcoming events list
  renderEventList(d.kalender);
}

function showDayEvents(dateStr) {
  const d = getKalDB();
  const evs = d.kalender.filter(ev => {
    const start = ev.tgl_mulai;
    const end = ev.tgl_selesai || ev.tgl_mulai;
    return dateStr >= start && dateStr <= end;
  });
  if (!evs.length) {
    // Pre-fill date for new event
    const inp = document.getElementById('event-tgl-mulai');
    if (inp) inp.value = dateStr;
    const inp2 = document.getElementById('event-tgl-selesai');
    if (inp2) inp2.value = dateStr;
    openModal('modal-event-add');
    return;
  }
  const et = EV_TYPE_MAP;
  const msg = evs.map(e => `• ${e.judul} (${et[e.tipe]?.label||''})\n  ${e.deskripsi||''}`).join('\n\n');
  if (confirm(`📅 ${new Date(dateStr).toLocaleDateString('id-ID',{dateStyle:'full'})}\n\n${msg}\n\nHapus event pertama?`)) {
    d.kalender = d.kalender.filter(ev => ev.id !== evs[0].id);
    saveDB(); renderKalender();
    showNotif('🗑️ Event dihapus', 'ok');
  }
}

function renderEventList(events) {
  const today = new Date().toISOString().slice(0,10);
  const upcoming = events.filter(e => (e.tgl_selesai || e.tgl_mulai) >= today)
    .sort((a,b) => a.tgl_mulai.localeCompare(b.tgl_mulai));
  const el = document.getElementById('kal-event-list');
  if (!el) return;
  if (!upcoming.length) { el.innerHTML = '<div class="empty-state"><span class="empty-icon">📅</span><span class="empty-text">Tidak ada event mendatang</span></div>'; return; }
  el.innerHTML = upcoming.slice(0,15).map(ev => {
    const et = EV_TYPE_MAP[ev.tipe] || EV_TYPE_MAP.lain;
    const tgl = new Date(ev.tgl_mulai);
    return `<div class="event-item">
      <div class="event-date-box" style="border-left:3px solid ${et.color}">
        <div class="event-date-day" style="color:${et.color}">${String(tgl.getDate()).padStart(2,'0')}</div>
        <div class="event-date-mon">${BULAN_NAMES[tgl.getMonth()].slice(0,3)}</div>
      </div>
      <div class="event-info">
        <div class="event-title">${ev.judul}</div>
        ${ev.deskripsi ? `<div class="event-desc">${ev.deskripsi}</div>` : ''}
        ${ev.tgl_selesai && ev.tgl_selesai !== ev.tgl_mulai ? `<div class="event-desc">s/d ${new Date(ev.tgl_selesai).toLocaleDateString('id-ID',{dateStyle:'medium'})}</div>` : ''}
        <span class="event-badge ${et.cls}">${et.label}</span>
      </div>
      <button style="background:transparent;border:none;color:var(--t3);font-size:16px;padding:4px;flex-shrink:0" onclick="hapusEvent('${ev.id}')">✕</button>
    </div>`;
  }).join('');
}

function simpanEvent() {
  const judul = document.getElementById('event-judul-inp').value.trim();
  const tglMulai = document.getElementById('event-tgl-mulai').value;
  if (!judul || !tglMulai) { showNotif('Judul dan tanggal mulai wajib diisi!', 'err'); return; }
  const d = getKalDB();
  d.kalender.push({
    id: 'EV' + Date.now(),
    judul, tipe: document.getElementById('event-tipe-inp').value,
    tgl_mulai: tglMulai,
    tgl_selesai: document.getElementById('event-tgl-selesai').value || tglMulai,
    deskripsi: document.getElementById('event-desc-inp').value.trim()
  });
  saveDB(); closeModal('modal-event-add');
  ['event-judul-inp','event-tgl-mulai','event-tgl-selesai','event-desc-inp'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  showNotif(`✅ Event "${judul}" ditambahkan!`, 'ok');
  buildTicker(); renderKalender();
}

function hapusEvent(evId) {
  const d = getKalDB();
  d.kalender = d.kalender.filter(e => e.id !== evId);
  saveDB(); renderEventList(d.kalender);
  showNotif('🗑️ Event dihapus', 'ok');
}

// ══════════════════════════════════════
//  KELULUSAN & ALUMNI
// ══════════════════════════════════════
function getAlumniDB() {
  const d = getD();
  if (!d.alumni) d.alumni = [];
  return d;
}

const AL_STATUS_STYLE = {
  lanjut: {cls:'bdg-g', label:'✅ Lanjut SMP'},
  bekerja: {cls:'bdg-b', label:'💼 Bekerja'},
  'tidak-diketahui': {cls:'bdg-x', label:'❓ Tidak Diketahui'}
};

function renderAlumni() {
  const d = getAlumniDB();
  const filterAngkatan = (document.getElementById('al-filter-angkatan')||{value:''}).value;
  const list = d.alumni.filter(a => !filterAngkatan || String(a.tahun_lulus) === filterAngkatan);
  const angkatanSet = [...new Set(d.alumni.map(a => a.tahun_lulus).filter(Boolean))].sort((a,b)=>b-a);

  // Stats
  document.getElementById('al-stat-total').textContent = d.alumni.length;
  document.getElementById('al-stat-angkatan').textContent = angkatanSet.length;
  const withNilai = d.alumni.filter(a => a.nilai_rata);
  const avgNilai = withNilai.length ? (withNilai.reduce((s,a)=>s+parseFloat(a.nilai_rata),0)/withNilai.length).toFixed(1) : '—';
  document.getElementById('al-stat-nilai').textContent = avgNilai;
  document.getElementById('al-stat-terlacak').textContent = d.alumni.filter(a=>a.status!=='tidak-diketahui').length;

  // Populate filter dropdown
  const sel = document.getElementById('al-filter-angkatan');
  if (sel) {
    const curVal = sel.value;
    sel.innerHTML = '<option value="">Semua Angkatan</option>' + angkatanSet.map(y=>`<option value="${y}">${y}</option>`).join('');
    sel.value = curVal;
  }

  // Alumni list
  const el = document.getElementById('alumni-list');
  if (!list.length) {
    el.innerHTML = '<div class="empty-state"><span class="empty-icon">🎓</span><span class="empty-text">' + (d.alumni.length===0?'Belum ada data alumni':'Tidak ada alumni untuk angkatan ini') + '</span></div>';
  } else {
    const colors = [{bg:'rgba(192,132,252,.15)',border:'var(--pur)',text:'var(--pur)'},{bg:'rgba(0,230,118,.15)',border:'var(--grn)',text:'var(--grn)'},{bg:'rgba(38,198,218,.15)',border:'var(--cyn)',text:'var(--cyn)'}];
    el.innerHTML = '<div style="display:flex;flex-direction:column;gap:8px;padding:0 12px 12px">' +
      list.map((a, i) => {
        const c = colors[i % colors.length];
        const st = AL_STATUS_STYLE[a.status] || AL_STATUS_STYLE['tidak-diketahui'];
        const grd = a.nilai_rata ? getNilaiGrade(parseFloat(a.nilai_rata)) : null;
        return `<div class="alumni-card">
          <div class="alumni-avatar" style="background:${c.bg};border-color:${c.border};color:${c.text}">${getInitials(a.nama)}</div>
          <div class="alumni-info">
            <div class="alumni-nama">${a.nama}</div>
            <div class="alumni-sub">
              <span>🎓 ${a.tahun_lulus || '—'}</span>
              ${a.nisn ? `<span style="font-family:'Courier New',monospace">${a.nisn}</span>` : ''}
              ${a.sekolah_lanjutan ? `<span>→ ${a.sekolah_lanjutan}</span>` : ''}
            </div>
            <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:4px">
              <span class="bdg ${st.cls}">${st.label}</span>
              ${grd ? `<span class="bdg" style="background:${grd.c}15;color:${grd.c}">Nilai: ${a.nilai_rata} (${grd.g})</span>` : ''}
              ${a.prestasi ? `<span class="bdg bdg-y">🏆 ${a.prestasi}</span>` : ''}
            </div>
          </div>
          <button style="background:transparent;border:none;color:var(--t3);font-size:16px;padding:4px" onclick="hapusAlumni('${a.id}')">✕</button>
        </div>`;
      }).join('') + '</div>';
  }

  // Statistik
  renderAlumniStatistik(d.alumni);
}

function renderAlumniStatistik(alumni) {
  const el = document.getElementById('al-statistik');
  if (!el || !alumni.length) { if(el) el.innerHTML='<div style="font-size:12px;color:var(--t3);padding:8px">Belum ada data untuk dianalisis</div>'; return; }

  const angkatanData = {};
  alumni.forEach(a => {
    const y = a.tahun_lulus || 'Unknown';
    if (!angkatanData[y]) angkatanData[y] = {total:0,lanjut:0,avgNilai:[]};
    angkatanData[y].total++;
    if (a.status==='lanjut') angkatanData[y].lanjut++;
    if (a.nilai_rata) angkatanData[y].avgNilai.push(parseFloat(a.nilai_rata));
  });

  const years = Object.keys(angkatanData).sort((a,b)=>b-a);
  el.innerHTML = `<table class="rekap-tbl">
    <thead><tr><th>Angkatan</th><th>Jumlah</th><th>Lanjut SMP</th><th>Rata Nilai</th><th>% Lanjut</th></tr></thead>
    <tbody>${years.map(y => {
      const dat = angkatanData[y];
      const avg = dat.avgNilai.length ? (dat.avgNilai.reduce((a,b)=>a+b,0)/dat.avgNilai.length).toFixed(1) : '—';
      const pctLanjut = dat.total > 0 ? Math.round((dat.lanjut/dat.total)*100) : 0;
      const grd = dat.avgNilai.length ? getNilaiGrade(parseFloat(avg)) : null;
      return `<tr>
        <td style="font-weight:700;color:var(--pur)">${y}</td>
        <td style="font-weight:700">${dat.total}</td>
        <td style="color:var(--grn);font-weight:700">${dat.lanjut}</td>
        <td style="font-weight:700;color:${grd?grd.c:'var(--t3)'}">${avg}</td>
        <td><div style="display:flex;align-items:center;gap:6px">
          <div style="flex:1;height:6px;background:var(--s2);border-radius:3px;overflow:hidden;min-width:40px"><div style="width:${pctLanjut}%;height:100%;background:var(--grn);border-radius:3px"></div></div>
          <span style="font-size:11px;font-weight:700;color:var(--grn)">${pctLanjut}%</span>
        </div></td>
      </tr>`;
    }).join('')}</tbody>
  </table>`;
}

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

// ── Update openModal for new modals ──
window.openModal = function(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('open');
  if (id==='modal-absensi-massal') { massalState={}; const e=document.getElementById('massal-tanggal'); if(e)e.value=new Date().toISOString().slice(0,10); renderMassalList(); }
  if (id==='modal-kartu-spp') { const s=document.getElementById('kartu-siswa-sel'); if(s){const d=getD();s.innerHTML=d.data_siswa.map(x=>`<option value="${x.id}">${x.nama} (${x.kelas})</option>`).join('')||'<option>--</option>';renderKartuSPP();} }
  if (id==='modal-jadwal-add') { const d=getJadwalDB();const ss=document.getElementById('jd-slot-inp');if(ss)ss.innerHTML=d.jadwal_slots.map(s=>`<option value="${s.id}">${s.label} (${s.mulai}–${s.selesai})</option>`).join('');const gs=document.getElementById('jd-guru-inp');if(gs)gs.innerHTML='<option value="">--</option>'+d.keuangan_guru.map(g=>`<option value="${g.nama}">${g.nama}</option>`).join(''); }
  if (id==='modal-pesan-siswa') { const d=getD();const s=document.getElementById('pesan-siswa-sel');if(s)s.innerHTML=d.data_siswa.map(x=>`<option value="${x.id}">${x.nama} (${x.kelas})</option>`).join('')||'<option>--</option>'; }
  if (id==='modal-event-add') { const e=document.getElementById('event-tgl-mulai');if(e&&!e.value)e.value=new Date().toISOString().slice(0,10); }
  // ── Akademik Siklus hooks ──
  if (id==='modal-akd-config') { openKonfigAkademik(); }
  if (id==='modal-akd-kenaikan') { /* preview already built by openKenaikanKonfirmasi() before this call */ }
  if (id==='modal-mutasi') { toggleMutasiAlasan(); }
  // ── Payroll Pro hooks ──
  if (id==='modal-payroll-config') { openPayrollConfigModal(); }
  if (id==='modal-arsip-gaji') { /* populated by openPayrollArsip() */ }
};
window.closeModal = function(id) { const el=document.getElementById(id);if(el)el.classList.remove('open'); };

// ══════════════════════════════════════
//  SIKLUS AKADEMIK MODULE
//  Kenaikan Kelas, Mutasi, Arsip TA
//  Copyright © 2026 Arblok Digital. All Rights Reserved.
// ══════════════════════════════════════

// ── Helpers ──────────────────────────
function getAkademikCfg() {
  const d = getD();
  if (!d.akademik_config) {
    // Init from DEFAULT_DATA structure, incorporating user JSON schema
    d.akademik_config = {
      tahun_ajaran_aktif: d.profil_sekolah.tahun_ajaran || '2025/2026',
      semester: 'Ganjil',
      kelas_max: 6,
      logic_kenaikan: {
        status_pilihan: ['Aktif', 'Lulus', 'Pindah', 'Keluar'],
        tingkat_kelas: [1, 2, 3, 4, 5, 6]
      },
      history_ta: [],
      log_akademik: [],
      mutasi_log: [],
      spp_arsip: {},
      history_alumni: []
    };
  }
  // Ensure all sub-keys exist (safe migration for existing data)
  const cfg = d.akademik_config;
  if (!cfg.logic_kenaikan) cfg.logic_kenaikan = { status_pilihan: ['Aktif','Lulus','Pindah','Keluar'], tingkat_kelas: [1,2,3,4,5,6] };
  if (!cfg.history_ta) cfg.history_ta = [];
  if (!cfg.log_akademik) cfg.log_akademik = [];
  if (!cfg.mutasi_log) cfg.mutasi_log = [];
  if (!cfg.spp_arsip) cfg.spp_arsip = {};
  if (!cfg.history_alumni) cfg.history_alumni = [];
  if (!cfg.kelas_max) cfg.kelas_max = 6;
  // Sync tahun ajaran to profil_sekolah if set
  if (cfg.tahun_ajaran_aktif && !d.profil_sekolah.tahun_ajaran) {
    d.profil_sekolah.tahun_ajaran = cfg.tahun_ajaran_aktif;
  }
  return d;
}

function getKelasNum(kelasStr) {
  // Extract numeric level from "1A", "2B", etc.
  const m = String(kelasStr || '').match(/^(\d+)/);
  return m ? parseInt(m[1]) : 0;
}
function getRombel(kelasStr) {
  // Extract rombel suffix: "1A" → "A"
  return String(kelasStr || '').replace(/^\d+/, '') || 'A';
}
function buildNextKelas(kelasStr) {
  const num = getKelasNum(kelasStr);
  const rombel = getRombel(kelasStr);
  return `${num + 1}${rombel}`;
}

function logAkademik(tipe, keterangan, data) {
  const d = getAkademikCfg();
  if (!d.akademik_config.log_akademik) d.akademik_config.log_akademik = [];
  d.akademik_config.log_akademik.unshift({
    id: 'AKD' + Date.now(),
    tipe, keterangan,
    data: data || null,
    waktu: new Date().toISOString(),
    ta: d.akademik_config.tahun_ajaran_aktif,
    semester: d.akademik_config.semester
  });
  // Keep last 100 logs
  if (d.akademik_config.log_akademik.length > 100)
    d.akademik_config.log_akademik = d.akademik_config.log_akademik.slice(0, 100);
}

// ── RENDER AKADEMIK PAGE ─────────────
function renderAkademik() {
  const d = getAkademikCfg();
  const cfg = d.akademik_config;
  const siswa = d.data_siswa;
  // Use dynamic tingkat_kelas from logic_kenaikan (user JSON schema)
  const tingkatKelas = (cfg.logic_kenaikan && cfg.logic_kenaikan.tingkat_kelas) || [1,2,3,4,5,6];
  const kelasMax = cfg.kelas_max || Math.max(...tingkatKelas);
  const statusPilihan = (cfg.logic_kenaikan && cfg.logic_kenaikan.status_pilihan) || ['Aktif','Lulus','Pindah','Keluar'];

  // Hero stats
  const el_ta = document.getElementById('akd-ta-display');
  const el_sem = document.getElementById('akd-sem-display');
  if (el_ta) el_ta.textContent = cfg.tahun_ajaran_aktif || '—';
  if (el_sem) el_sem.textContent = 'Semester ' + (cfg.semester || 'Ganjil');

  const aktif = siswa.filter(s => !s.status_akademik || s.status_akademik === 'Aktif');
  const lulus = siswa.filter(s => s.status_akademik === 'Lulus');
  const pindah = siswa.filter(s => s.status_akademik === 'Pindah');
  const keluar = siswa.filter(s => s.status_akademik === 'Keluar');
  const kelasSet = new Set(aktif.map(s => s.kelas).filter(Boolean));

  const el_meta1 = document.getElementById('akd-total-siswa-aktif');
  const el_meta2 = document.getElementById('akd-total-kelas');
  const el_meta3 = document.getElementById('akd-update-time');
  if (el_meta1) el_meta1.textContent = `${aktif.length} Siswa Aktif`;
  if (el_meta2) el_meta2.textContent = `${kelasSet.size} Kelas`;
  if (el_meta3) el_meta3.textContent = `Update: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'medium' })}`;

  // Status counts
  ['aktif','lulus','pindah','keluar'].forEach(k => {
    const el = document.getElementById(`akd-s-${k}`);
    if (el) el.textContent = { aktif: aktif.length, lulus: lulus.length, pindah: pindah.length, keluar: keluar.length }[k];
  });

  // Kelas grid — uses tingkatKelas from logic_kenaikan
  const kelasGrid = document.getElementById('akd-kelas-grid');
  if (kelasGrid) {
    const kelasData = {};
    tingkatKelas.forEach(i => {
      kelasData[i] = aktif.filter(s => getKelasNum(s.kelas) === i).length;
    });
    kelasGrid.innerHTML = Object.entries(kelasData).map(([k, count]) => {
      const isMax = parseInt(k) === kelasMax;
      return `<div class="akd-kelas-card ${isMax ? 'kelas-lulus' : ''}" onclick="filterByKelas(${k})">
        <div class="akd-kelas-num">${k}</div>
        <div class="akd-kelas-lbl">Kelas ${k}${isMax ? ' (Lulus)' : ''}</div>
        <div class="akd-kelas-siswa">${count} siswa</div>
        ${isMax ? '<div style="font-size:8px;color:var(--pur);margin-top:4px;font-weight:700">→ AKAN LULUS</div>' : ''}
      </div>`;
    }).join('');
  }

  // Kenaikan preview
  renderNaikPreview();

  // Arsip
  renderArsipList();

  // Log akademik
  renderLogAkademik();
}

function filterByKelas(k) {
  switchPage('crm');
  setTimeout(() => {
    const fchip = document.querySelector(`#crm-filter-chips .fchip[onclick*="'${k}'"]`);
    if (fchip) { crmFilter = String(k); fchip.click(); }
  }, 200);
}

function renderNaikPreview() {
  const d = getAkademikCfg();
  const cfg = d.akademik_config;
  const tingkatKelas = (cfg.logic_kenaikan && cfg.logic_kenaikan.tingkat_kelas) || [1,2,3,4,5,6];
  const kelasMax = cfg.kelas_max || Math.max(...tingkatKelas);
  const aktif = d.data_siswa.filter(s => !s.status_akademik || s.status_akademik === 'Aktif');

  const summary = {};
  tingkatKelas.forEach(i => {
    const count = aktif.filter(s => getKelasNum(s.kelas) === i).length;
    summary[i] = count;
  });

  const el = document.getElementById('akd-naik-preview');
  if (!el) return;

  const arrows = Object.entries(summary).map(([k, count]) => {
    const num = parseInt(k);
    const isMax = num === kelasMax;
    const arrowColor = isMax ? 'var(--pur)' : 'var(--grn)';
    const dest = isMax ? '🎓 Lulus' : `Kelas ${num + 1}`;
    return `<div style="display:flex;align-items:center;gap:4px;font-size:11px">
      <span style="font-weight:700;color:${arrowColor}">Kelas ${num}</span>
      <span style="color:var(--t3);font-size:10px">(${count})</span>
      <span style="color:${arrowColor}">→</span>
      <span style="font-weight:700;color:${arrowColor}">${dest}</span>
    </div>`;
  }).join('');

  const totalLulus = summary[kelasMax] || 0;
  const totalNaik = aktif.length - totalLulus;
  el.innerHTML = `<div style="flex:1;display:flex;flex-wrap:wrap;gap:8px">${arrows}</div>
    <div style="text-align:right;flex-shrink:0;font-size:11px;color:var(--t3)">
      <b style="color:var(--grn)">${totalNaik}</b> naik kelas<br/>
      <b style="color:var(--pur)">${totalLulus}</b> lulus
    </div>`;
}

function renderMutasiList() {
  const d = getD();
  const q = (document.getElementById('mutasi-search') || { value: '' }).value.toLowerCase().trim();
  const el = document.getElementById('mutasi-list');
  if (!el) return;
  if (!q) {
    el.innerHTML = '<div style="text-align:center;color:var(--t3);padding:20px;font-size:11px">Ketik nama untuk mencari siswa</div>';
    return;
  }
  const found = d.data_siswa.filter(s => (s.nama || '').toLowerCase().includes(q)).slice(0, 15);
  if (!found.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--t3);padding:20px;font-size:11px">Tidak ditemukan</div>';
    return;
  }
  const STATUS_STYLE = {
    Aktif: { c: 'var(--grn)', bg: 'var(--grn-bg)' },
    Lulus: { c: 'var(--pur)', bg: 'var(--pur-bg)' },
    Pindah: { c: 'var(--yel)', bg: 'var(--yel-bg)' },
    Keluar: { c: 'var(--red)', bg: 'var(--red-bg)' },
  };
  el.innerHTML = found.map(s => {
    const status = s.status_akademik || 'Aktif';
    const st = STATUS_STYLE[status] || STATUS_STYLE.Aktif;
    const col = getAvatarColor(s);
    return `<div class="mutasi-item">
      <div class="mutasi-avatar" style="background:${col.bg};border-color:${col.border};color:${col.text}">${getInitials(s.nama)}</div>
      <div class="mutasi-info">
        <div class="mutasi-nama">${s.nama}</div>
        <div class="mutasi-meta">Kelas ${s.kelas || '—'} · ${s.nisn || 'No NISN'}</div>
        <span class="bdg" style="background:${st.bg};color:${st.c}">${status}</span>
        ${s.mutasi_alasan ? `<span style="font-size:9px;color:var(--t3);margin-left:4px">${s.mutasi_alasan}</span>` : ''}
      </div>
      <button class="abtn" style="padding:6px 10px;font-size:10px;background:var(--s2);color:var(--t2);border:1px solid var(--bdr2)" onclick="openMutasiModal('${s.id}')">✏️ Mutasi</button>
    </div>`;
  }).join('');
}

function renderArsipList() {
  const d = getAkademikCfg();
  const arsip = d.akademik_config.history_ta || [];
  const el = document.getElementById('akd-arsip-list');
  const cnt = document.getElementById('akd-arsip-count');
  if (cnt) cnt.textContent = `${arsip.length} arsip`;
  if (!el) return;
  if (!arsip.length) {
    el.innerHTML = '<div class="empty-state" style="padding:24px"><span class="empty-icon">🗂️</span><span class="empty-text">Belum ada arsip tahun ajaran sebelumnya</span></div>';
    return;
  }
  el.innerHTML = arsip.slice().reverse().map(ar => `
    <div class="arsip-item">
      <div class="arsip-ta">${ar.tahun_ajaran}</div>
      <div class="arsip-info">
        <div class="arsip-title">${ar.nama_sekolah || 'SD Islam Sahara'} · Semester ${ar.semester || '—'}</div>
        <div class="arsip-meta">
          ${ar.total_siswa || 0} siswa terdaftar ·
          ${ar.total_lulus || 0} lulus ·
          SPP ${fmtShort(ar.total_spp || 0)} ·
          Diarsip: ${new Date(ar.waktu_arsip).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
        </div>
      </div>
      <button class="abtn abtn-b" style="padding:6px 10px;font-size:10px;flex-shrink:0" onclick="lihatArsipTA('${ar.tahun_ajaran}')">👁️ Lihat</button>
    </div>`).join('');
}

function renderLogAkademik() {
  const d = getAkademikCfg();
  const logs = d.akademik_config.log_akademik || [];
  const el = document.getElementById('akd-log-list');
  if (!el) return;
  if (!logs.length) {
    el.innerHTML = '<div class="empty-state" style="padding:20px"><span>📭</span><span style="font-size:11px;color:var(--t3)">Belum ada aktivitas akademik</span></div>';
    return;
  }
  const COLOR_MAP = {
    kenaikan: 'var(--grn)', mutasi: 'var(--yel)', config: 'var(--cyn)',
    arsip: 'var(--pur)', reset: 'var(--red)', siswa_baru: 'var(--blu)'
  };
  const ICON_MAP = {
    kenaikan: '🔁', mutasi: '🚌', config: '⚙️',
    arsip: '🗄️', reset: '🔄', siswa_baru: '🆕'
  };
  el.innerHTML = '<div class="akd-timeline">' + logs.slice(0, 20).map(log => {
    const color = COLOR_MAP[log.tipe] || 'var(--t2)';
    const icon = ICON_MAP[log.tipe] || '📝';
    return `<div class="akd-tl-item">
      <div class="akd-tl-dot" style="background:${color}15;border-color:${color}">${icon}</div>
      <div class="akd-tl-body">
        <div class="akd-tl-title">${log.keterangan}</div>
        <div class="akd-tl-meta">${new Date(log.waktu).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })} · T.A. ${log.ta || '—'}</div>
        <span class="akd-tl-badge" style="background:${color}15;color:${color}">${log.tipe.toUpperCase()}</span>
      </div>
    </div>`;
  }).join('') + '</div>';
}

// ── KONFIGURASI T.A. ──────────────────
function openKonfigAkademik() {
  const d = getAkademikCfg();
  const cfg = d.akademik_config;
  const ta = document.getElementById('akd-ta-inp');
  const sem = document.getElementById('akd-sem-inp');
  const kmax = document.getElementById('akd-kelas-max-inp');
  if (ta) ta.value = cfg.tahun_ajaran_aktif || '';
  if (sem) sem.value = cfg.semester || 'Ganjil';
  if (kmax) kmax.value = String(cfg.kelas_max || 6);
}

function simpanKonfigAkademik() {
  const ta = (document.getElementById('akd-ta-inp') || { value: '' }).value.trim();
  const sem = (document.getElementById('akd-sem-inp') || { value: 'Ganjil' }).value;
  const kmax = parseInt((document.getElementById('akd-kelas-max-inp') || { value: '6' }).value) || 6;
  if (!ta || !/\d{4}\/\d{4}/.test(ta)) { showNotif('Format Tahun Ajaran: YYYY/YYYY (contoh: 2025/2026)', 'err'); return; }

  const d = getAkademikCfg();
  const oldTA = d.akademik_config.tahun_ajaran_aktif;
  const isNewTA = oldTA && oldTA !== ta;

  if (isNewTA) {
    // Archive current year's SPP data before resetting
    if (confirm(`Tahun Ajaran berubah dari ${oldTA} ke ${ta}.\nData SPP tahun ini akan diarsip. Lanjutkan?`)) {
      arsipkanSPPTahunIni(oldTA, d);
    } else return;
  }

  d.akademik_config.tahun_ajaran_aktif = ta;
  d.akademik_config.semester = sem;
  d.akademik_config.kelas_max = kmax;
  // Sync to profil_sekolah
  d.profil_sekolah.tahun_ajaran = ta;

  logAkademik('config', `Tahun Ajaran diubah ke ${ta} Semester ${sem}`, { ta, sem, kmax });
  saveDB(); buildTicker(); closeModal('modal-akd-config');
  showNotif(`✅ Tahun Ajaran ${ta} Semester ${sem} tersimpan!`, 'ok');
  renderAkademik();
  // Sync banner
  const taEl = document.getElementById('banner-ta');
  if (taEl) taEl.textContent = 'T.A. ' + ta;
}

function arsipkanSPPTahunIni(tahunLama, d) {
  if (!d.akademik_config.history_ta) d.akademik_config.history_ta = [];
  if (!d.akademik_config.spp_arsip) d.akademik_config.spp_arsip = {};

  const riwayatSPP = d.riwayat_spp || [];
  const totalSPP = riwayatSPP.reduce((a, x) => a + (x.jumlah || 0), 0);

  d.akademik_config.spp_arsip[tahunLama] = {
    total_masuk: totalSPP,
    detail: riwayatSPP.slice()
  };

  // Reset riwayat SPP untuk tahun baru
  d.riwayat_spp = [];

  logAkademik('arsip', `SPP T.A. ${tahunLama} diarsip. Total: ${fmt(totalSPP)}`, { tahun: tahunLama, total: totalSPP });
  addAktivitas('spp', `📦 SPP T.A. ${tahunLama} diarsip: ${fmt(totalSPP)}`, 0);
}

// ── KENAIKAN KELAS ────────────────────
let konfirmasiState = { step1: false, step2: false };

function openKenaikanKonfirmasi() {
  const d = getAkademikCfg();
  const cfg = d.akademik_config;
  const tingkatKelas = (cfg.logic_kenaikan && cfg.logic_kenaikan.tingkat_kelas) || [1,2,3,4,5,6];
  const kelasMax = cfg.kelas_max || Math.max(...tingkatKelas);
  const aktif = d.data_siswa.filter(s => !s.status_akademik || s.status_akademik === 'Aktif');

  // Reset konfirmasi state
  konfirmasiState = { step1: false, step2: false };
  ['1','2'].forEach(i => {
    const item = document.getElementById(`cs-item-${i}`);
    const num = document.getElementById(`cs-num-${i}`);
    const check = document.getElementById(`cs-check-${i}`);
    if (item) item.classList.remove('done');
    if (num) { num.textContent = i; num.style.background = 'var(--bdr2)'; num.style.color = 'var(--t3)'; }
    if (check) check.style.opacity = '0';
  });

  // Reset text input
  const inp = document.getElementById('knf-text-input');
  if (inp) inp.value = '';
  updateKonfirmasiBtn();

  // Update jumlah siswa
  const jmlEl = document.getElementById('knf-jumlah-siswa');
  if (jmlEl) jmlEl.textContent = `${aktif.length} siswa aktif`;

  // Build preview changes using tingkatKelas from logic_kenaikan
  const summary = {};
  tingkatKelas.forEach(i => {
    const kelasAktif = aktif.filter(s => getKelasNum(s.kelas) === i);
    if (kelasAktif.length > 0) summary[i] = kelasAktif.length;
  });

  const prevEl = document.getElementById('knf-preview');
  if (prevEl) {
    prevEl.innerHTML = Object.entries(summary).map(([k, count]) => {
      const num = parseInt(k);
      const isMax = num === kelasMax;
      const color = isMax ? 'var(--pur)' : 'var(--grn)';
      const dest = isMax ? `🎓 Lulus & Masuk Alumni` : `Kelas ${num + 1}`;
      return `<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 10px;border-radius:8px;background:var(--s2);margin-bottom:4px">
        <div style="font-size:12px"><b style="color:${color}">Kelas ${num}</b> <span style="color:var(--t3)">(${count} siswa)</span></div>
        <div style="font-size:11px;font-weight:700;color:${color}">→ ${dest}</div>
      </div>`;
    }).join('');
  }

  openModal('modal-akd-kenaikan');
}

function konfirmasiLangkah(step) {
  if (step === 1) {
    konfirmasiState.step1 = !konfirmasiState.step1;
    const item = document.getElementById('cs-item-1');
    const num = document.getElementById('cs-num-1');
    const check = document.getElementById('cs-check-1');
    if (item) item.classList.toggle('done', konfirmasiState.step1);
    if (num) { num.style.background = konfirmasiState.step1 ? 'var(--grn)' : 'var(--bdr2)'; num.style.color = konfirmasiState.step1 ? '#000' : 'var(--t3)'; }
    if (check) check.style.opacity = konfirmasiState.step1 ? '1' : '0';
  } else if (step === 2) {
    konfirmasiState.step2 = !konfirmasiState.step2;
    const item = document.getElementById('cs-item-2');
    const num = document.getElementById('cs-num-2');
    const check = document.getElementById('cs-check-2');
    if (item) item.classList.toggle('done', konfirmasiState.step2);
    if (num) { num.style.background = konfirmasiState.step2 ? 'var(--grn)' : 'var(--bdr2)'; num.style.color = konfirmasiState.step2 ? '#000' : 'var(--t3)'; }
    if (check) check.style.opacity = konfirmasiState.step2 ? '1' : '0';
  }
  updateKonfirmasiBtn();
}

function cekKonfirmasiText() {
  updateKonfirmasiBtn();
}

function updateKonfirmasiBtn() {
  const inp = document.getElementById('knf-text-input');
  const btn = document.getElementById('knf-execute-btn');
  if (!btn) return;
  const textOk = inp && inp.value.trim().toUpperCase() === 'NAIK KELAS';
  const allOk = konfirmasiState.step1 && konfirmasiState.step2 && textOk;
  btn.disabled = !allOk;
  btn.style.background = allOk ? 'linear-gradient(135deg,var(--grn2),var(--grn))' : 'var(--s2)';
  btn.style.color = allOk ? '#000' : 'var(--t3)';
  btn.style.cursor = allOk ? 'pointer' : 'not-allowed';
  btn.textContent = allOk ? '🚀 Proses Kenaikan Kelas' : '🔒 Proses Kenaikan Kelas';
}

function eksekusiKenaikanKelas() {
  const btn = document.getElementById('knf-execute-btn');
  if (btn && btn.disabled) return;

  const d = getAkademikCfg();
  const cfg = d.akademik_config;
  const kelasMax = cfg.kelas_max || 6;
  const ta = cfg.tahun_ajaran_aktif;
  const sem = cfg.semester;

  let naik = 0, lulus = 0, skipped = 0;
  const alumniDibuat = [];

  // Process each active student
  d.data_siswa.forEach(s => {
    // Skip non-active
    if (s.status_akademik && s.status_akademik !== 'Aktif') { skipped++; return; }

    const level = getKelasNum(s.kelas);
    if (!level) { skipped++; return; }

    if (level >= kelasMax) {
      // Kelas max → LULUS
      s.status_akademik = 'Lulus';
      s.tahun_lulus = new Date().getFullYear();
      s.ta_lulus = ta;
      s.status_spp = s.status_spp || 'Lunas'; // keep existing

      // Compute average nilai
      const allNilai = [...((s.nilai || {})['1'] || []), ...((s.nilai || {})['2'] || [])];
      const byM = {};
      allNilai.forEach(n => { if (!byM[n.mapel]) byM[n.mapel] = []; byM[n.mapel].push(n.nilai); });
      const avgs = Object.values(byM).map(v => v.reduce((a, b) => a + b, 0) / v.length);
      const avgNilai = avgs.length ? (avgs.reduce((a, b) => a + b, 0) / avgs.length).toFixed(1) : null;

      // Add to alumni
      if (!d.alumni) d.alumni = [];
      const existAlumni = d.alumni.find(al => al.data_siswa_id === s.id);
      if (!existAlumni) {
        d.alumni.push({
          id: 'AL' + Date.now() + Math.random().toString(36).slice(2, 5),
          nama: s.nama, nisn: s.nisn,
          tahun_lulus: new Date().getFullYear(),
          kelas_terakhir: s.kelas,
          nilai_rata: avgNilai,
          sekolah_lanjutan: '',
          status: 'lanjut',
          prestasi: '',
          tgl_input: new Date().toISOString(),
          data_siswa_id: s.id
        });
        alumniDibuat.push(s.nama);
      }
      lulus++;
    } else {
      // Naik ke kelas berikutnya — pertahankan rombel
      s.kelas = buildNextKelas(s.kelas);
      naik++;
    }
  });

  // Arsip snapshot tahun ajaran ini
  if (!cfg.history_ta) cfg.history_ta = [];
  cfg.history_ta.push({
    tahun_ajaran: ta,
    semester: sem,
    nama_sekolah: d.profil_sekolah.nama,
    total_siswa: d.data_siswa.length,
    total_lulus: lulus,
    total_naik: naik,
    total_skipped: skipped,
    total_spp: (d.riwayat_spp || []).reduce((a, x) => a + (x.jumlah || 0), 0),
    waktu_arsip: new Date().toISOString(),
    alumni: alumniDibuat
  });

  logAkademik('kenaikan',
    `Kenaikan kelas T.A. ${ta}: ${naik} naik, ${lulus} lulus, ${skipped} dilewati`,
    { naik, lulus, skipped, alumni: alumniDibuat.length }
  );
  addAktivitas('siswa', `🔁 Kenaikan kelas massal T.A. ${ta}: ${naik} naik, ${lulus} lulus`, 0);

  saveDB(); buildTicker(); closeModal('modal-akd-kenaikan');

  showNotif(`🎉 Selesai! ${naik} siswa naik kelas, ${lulus} siswa lulus.`, 'ok');

  // Refresh semua halaman terkait
  renderAkademik();
  renderCRM();
  if (currentPage === 'dashboard') renderDashboard();
}

// ── MUTASI SISWA ─────────────────────
function openMutasiModal(siswaId) {
  const d = getD();
  const s = d.data_siswa.find(x => x.id === siswaId);
  if (!s) return;

  document.getElementById('mutasi-siswa-id').value = siswaId;

  // Siswa info header
  const c = getAvatarColor(s);
  const infoEl = document.getElementById('mutasi-modal-siswa-info');
  if (infoEl) {
    infoEl.innerHTML = `
      <div style="width:44px;height:44px;border-radius:50%;background:${c.bg};border:2px solid ${c.border};color:${c.text};display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;flex-shrink:0">${getInitials(s.nama)}</div>
      <div>
        <div style="font-size:14px;font-weight:900">${s.nama}</div>
        <div style="font-size:11px;color:var(--t3)">Kelas ${s.kelas || '—'} · ${s.nisn || 'No NISN'}</div>
        <span class="bdg ${s.status_akademik === 'Aktif' || !s.status_akademik ? 'bdg-g' : 'bdg-r'}">${s.status_akademik || 'Aktif'}</span>
      </div>`;
  }

  const statusSel = document.getElementById('mutasi-status-sel');
  if (statusSel) statusSel.value = s.status_akademik || 'Aktif';

  const tglInp = document.getElementById('mutasi-tgl-inp');
  if (tglInp) tglInp.value = new Date().toISOString().slice(0, 10);

  const alasanInp = document.getElementById('mutasi-alasan-inp');
  if (alasanInp) alasanInp.value = s.mutasi_alasan || '';

  const tujuanInp = document.getElementById('mutasi-tujuan-inp');
  if (tujuanInp) tujuanInp.value = s.mutasi_tujuan || '';

  toggleMutasiAlasan();
  openModal('modal-mutasi');
}

function toggleMutasiAlasan() {
  const status = (document.getElementById('mutasi-status-sel') || { value: 'Aktif' }).value;
  const alasanWrap = document.getElementById('mutasi-alasan-wrap');
  const tujuanWrap = document.getElementById('mutasi-tujuan-wrap');
  if (alasanWrap) alasanWrap.style.display = status !== 'Aktif' ? 'flex' : 'none';
  if (tujuanWrap) tujuanWrap.style.display = status === 'Pindah' ? 'flex' : 'none';
}

function simpanMutasi() {
  const siswaId = document.getElementById('mutasi-siswa-id').value;
  const statusBaru = document.getElementById('mutasi-status-sel').value;
  const tgl = document.getElementById('mutasi-tgl-inp').value;
  const alasan = (document.getElementById('mutasi-alasan-inp') || { value: '' }).value.trim();
  const tujuan = (document.getElementById('mutasi-tujuan-inp') || { value: '' }).value.trim();

  const d = getAkademikCfg();
  const s = d.data_siswa.find(x => x.id === siswaId);
  if (!s) return;

  const statusLama = s.status_akademik || 'Aktif';
  s.status_akademik = statusBaru;
  s.mutasi_alasan = alasan;
  s.mutasi_tujuan = tujuan;
  s.mutasi_tgl = tgl;
  // Tetap aktif di daftar siswa, status berubah — histori SPP tidak dihapus

  // Log mutasi
  if (!d.akademik_config.mutasi_log) d.akademik_config.mutasi_log = [];
  d.akademik_config.mutasi_log.unshift({
    id: 'MUT' + Date.now(),
    siswa_id: siswaId, nama: s.nama, kelas: s.kelas,
    status_lama: statusLama, status_baru: statusBaru,
    alasan, tujuan, tgl,
    waktu: new Date().toISOString()
  });

  logAkademik('mutasi',
    `Mutasi ${s.nama}: ${statusLama} → ${statusBaru}${alasan ? ' (' + alasan + ')' : ''}`,
    { siswaId, statusLama, statusBaru, alasan, tujuan }
  );
  addAktivitas('siswa', `🚌 Mutasi ${s.nama}: ${statusLama} → ${statusBaru}`, 0);

  saveDB(); closeModal('modal-mutasi');
  showNotif(`✅ Mutasi ${s.nama}: ${statusLama} → ${statusBaru}`, 'ok');
  renderMutasiList();
  renderAkademik();
  renderCRM();
}

// ── ARSIP VIEWER ────────────────────
function lihatArsipTA(tahunAjaran) {
  const d = getAkademikCfg();
  const ar = (d.akademik_config.history_ta || []).find(x => x.tahun_ajaran === tahunAjaran);
  if (!ar) { showNotif('Arsip tidak ditemukan!', 'err'); return; }

  const sppArsip = (d.akademik_config.spp_arsip || {})[tahunAjaran];
  const totalSPP = sppArsip ? sppArsip.total_masuk : ar.total_spp || 0;

  const el = document.getElementById('print-modal-content');
  const titleEl = document.getElementById('print-modal-title');
  if (titleEl) titleEl.textContent = `🗄️ Arsip T.A. ${tahunAjaran}`;
  if (el) {
    el.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px">
        <div style="text-align:center;background:var(--cyn-bg);border:1px solid rgba(38,198,218,.2);border-radius:9px;padding:10px">
          <div style="font-size:20px;font-weight:900;color:var(--cyn)">${ar.total_siswa || 0}</div>
          <div style="font-size:9px;color:var(--t3);font-weight:700">TOTAL SISWA</div>
        </div>
        <div style="text-align:center;background:var(--pur-bg);border:1px solid rgba(192,132,252,.2);border-radius:9px;padding:10px">
          <div style="font-size:20px;font-weight:900;color:var(--pur)">${ar.total_lulus || 0}</div>
          <div style="font-size:9px;color:var(--t3);font-weight:700">LULUS</div>
        </div>
        <div style="text-align:center;background:var(--grn-bg);border:1px solid rgba(0,230,118,.2);border-radius:9px;padding:10px">
          <div style="font-size:16px;font-weight:900;color:var(--grn)">${fmt(totalSPP)}</div>
          <div style="font-size:9px;color:var(--t3);font-weight:700">TOTAL SPP</div>
        </div>
      </div>
      <div style="font-size:12px;color:var(--t2);padding:10px;background:var(--s2);border-radius:9px;line-height:1.8">
        <b>Tahun Ajaran:</b> ${ar.tahun_ajaran}<br/>
        <b>Semester:</b> ${ar.semester || '—'}<br/>
        <b>Sekolah:</b> ${ar.nama_sekolah || '—'}<br/>
        <b>Siswa Naik Kelas:</b> ${ar.total_naik || 0}<br/>
        <b>Diarsip pada:</b> ${new Date(ar.waktu_arsip).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}<br/>
        ${ar.alumni && ar.alumni.length ? `<b>Alumni dari arsip ini:</b> ${ar.alumni.join(', ')}` : ''}
      </div>`;
    window._csvData = [ar];
    window._csvTitle = `arsip_ta_${tahunAjaran.replace('/', '-')}`;
  }
  openModal('modal-print');
}

// ══════════════════════════════════════
//  SMART IMPORT MODULE
//  CSV/Excel → Auto Mapping → Validate → Import
//  Copyright © 2026 Arblok Digital. All Rights Reserved.
// ══════════════════════════════════════

let impState = {
  step:1, type:'siswa', rawRows:[], headers:[],
  mapping:{}, previewRows:[], dupRows:new Set()
};

const IMP_FIELDS_SISWA = [
  {key:'nama',        label:'Nama Lengkap*',  required:true},
  {key:'nisn',        label:'NISN',           required:false},
  {key:'kelas',       label:'Kelas',          required:false},
  {key:'jk',          label:'Jenis Kelamin',  required:false},
  {key:'tgl_lahir',   label:'Tanggal Lahir',  required:false},
  {key:'ayah',        label:'Nama Ayah/Wali', required:false},
  {key:'ibu',         label:'Nama Ibu',       required:false},
  {key:'hp_ortu',     label:'HP Orang Tua',   required:false},
  {key:'alamat',      label:'Alamat',         required:false},
  {key:'tahun_masuk', label:'Tahun Masuk',    required:false},
  {key:'_skip',       label:'— Lewati —',     required:false},
];
const IMP_FIELDS_GURU = [
  {key:'nama',         label:'Nama Lengkap*',   required:true},
  {key:'jabatan',      label:'Jabatan',          required:false},
  {key:'gaji_pokok',   label:'Gaji Pokok (Rp)',  required:false},
  {key:'honor_per_jam',label:'Honor/Jam (Rp)',   required:false},
  {key:'_skip',        label:'— Lewati —',       required:false},
];

const IMP_SYNONYMS = {
  nama:['nama','name','nama lengkap','full name','nama siswa','nama guru'],
  nisn:['nisn','nis','nomor induk','student id'],
  kelas:['kelas','class','rombel','grade'],
  jk:['jenis kelamin','gender','sex','jk','l/p'],
  tgl_lahir:['tanggal lahir','tgl lahir','birth date','dob','lahir'],
  ayah:['ayah','nama ayah','wali','nama wali','father','orang tua'],
  ibu:['ibu','nama ibu','mother'],
  hp_ortu:['hp','no hp','nomor hp','telepon','phone','handphone','hp ortu','kontak'],
  alamat:['alamat','address'],
  tahun_masuk:['tahun masuk','angkatan','year'],
  jabatan:['jabatan','position','posisi'],
  gaji_pokok:['gaji','gaji pokok','salary'],
  honor_per_jam:['honor','honor per jam','honor/jam','rate'],
};

function autoMapColumns(headers, type) {
  const fields = type==='siswa' ? IMP_FIELDS_SISWA : IMP_FIELDS_GURU;
  const mapping = {};
  headers.forEach(h => {
    const hl = (h||'').toLowerCase().trim();
    let matched = '_skip';
    for (const [field,syns] of Object.entries(IMP_SYNONYMS)) {
      if (fields.some(f=>f.key===field) && syns.some(s=>hl.includes(s)||s.includes(hl))) {
        matched=field; break;
      }
    }
    mapping[h] = matched;
  });
  return mapping;
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length) return {headers:[],rows:[]};
  const parseRow = line => {
    const res=[]; let cur=''; let inQ=false;
    for (let i=0;i<line.length;i++) {
      const c=line[i];
      if (c==='"'){if(inQ&&line[i+1]==='"'){cur+='"';i++;}else inQ=!inQ;}
      else if (c===','&&!inQ){res.push(cur.trim());cur='';}
      else cur+=c;
    }
    res.push(cur.trim()); return res;
  };
  const headers=parseRow(lines[0]);
  const rows=lines.slice(1).filter(l=>l.trim()).map(l=>{
    const vals=parseRow(l); const obj={};
    headers.forEach((h,i)=>obj[h]=vals[i]||''); return obj;
  });
  return {headers,rows};
}

async function parseXLSX(file) {
  return new Promise((resolve,reject)=>{
    const load = () => {
      const reader=new FileReader();
      reader.onload=e=>{
        try {
          const wb=window.XLSX.read(e.target.result,{type:'array',cellDates:true});
          const ws=wb.Sheets[wb.SheetNames[0]];
          const data=window.XLSX.utils.sheet_to_json(ws,{defval:''});
          if (!data.length){reject(new Error('Sheet kosong'));return;}
          const headers=Object.keys(data[0]);
          resolve({headers,rows:data.map(r=>{const obj={};headers.forEach(h=>obj[h]=String(r[h]||'').trim());return obj;})});
        } catch(err){reject(err);}
      };
      reader.onerror=()=>reject(new Error('Gagal membaca file'));
      reader.readAsArrayBuffer(file);
    };
    if (!window.XLSX) {
      const s=document.createElement('script');
      s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      s.onload=load; s.onerror=()=>reject(new Error('Gagal load library XLSX'));
      document.head.appendChild(s);
    } else load();
  });
}

function openSmartImport(type) {
  resetImport(); setImportType(type); openModal('modal-smart-import');
}

function setImportType(type) {
  impState.type=type;
  const s=['siswa','guru'];
  const c={siswa:'var(--cyn)',guru:'var(--pur)'};
  s.forEach(t=>{
    const btn=document.getElementById(`imp-type-${t}`);
    if (!btn) return;
    const active=t===type;
    btn.style.background=active?`${c[t]}15`:'var(--s2)';
    btn.style.borderColor=active?c[t]:'var(--bdr2)';
    btn.style.color=active?c[t]:'var(--t3)';
  });
}

function handleFileDrop(e) {
  e.preventDefault();
  document.getElementById('imp-drop-zone').classList.remove('drag-over');
  if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
}
function handleFileSelect(e) { if (e.target.files[0]) processFile(e.target.files[0]); }

async function processFile(file) {
  const nm=file.name.toLowerCase();
  try {
    showNotif('🔄 Membaca file...','warn');
    let result;
    if (nm.endsWith('.csv')) { result=parseCSV(await file.text()); }
    else if (nm.endsWith('.xlsx')||nm.endsWith('.xls')) { result=await parseXLSX(file); }
    else { showNotif('❌ Gunakan format CSV atau Excel!','err'); return; }
    if (!result.rows.length) { showNotif('⚠️ File kosong!','err'); return; }
    impState.rawRows=result.rows; impState.headers=result.headers;
    impState.mapping=autoMapColumns(result.headers,impState.type);
    const fi=document.getElementById('imp-file-info');
    fi.style.display='flex';
    document.getElementById('imp-filename').textContent=file.name;
    document.getElementById('imp-fileinfo').textContent=`${result.rows.length} baris · ${result.headers.length} kolom · ${(file.size/1024).toFixed(1)} KB`;
    showNotif(`✅ ${result.rows.length} baris berhasil dibaca`,'ok');
  } catch(err) { showNotif('❌ '+err.message,'err'); }
}

function importNextStep() {
  const s=impState.step;
  if (s===1) {
    if (!impState.rawRows.length){showNotif('Upload file dulu!','err');return;}
    impState.step=2; renderMappingStep();
  } else if (s===2) {
    const fields=impState.type==='siswa'?IMP_FIELDS_SISWA:IMP_FIELDS_GURU;
    const missing=fields.filter(f=>f.required&&!Object.values(impState.mapping).includes(f.key));
    if (missing.length){showNotif('⚠️ Petakan kolom wajib: '+missing.map(f=>f.label).join(', '),'err');return;}
    impState.step=3; renderPreviewStep();
  } else if (s===3) { impState.step=4; runImport(); }
  updateStepUI();
}
function importPrevStep() { if (impState.step>1&&impState.step<4){impState.step--;updateStepUI();showStepPane(impState.step);} }

function updateStepUI() {
  showStepPane(impState.step);
  const back=document.getElementById('imp-btn-back');
  const next=document.getElementById('imp-btn-next');
  if (back) back.style.display=impState.step>1&&impState.step<4?'block':'none';
  if (next) next.style.display=impState.step<4?'block':'none';
  if (next) next.textContent=impState.step===3?'✅ Import Sekarang':'Lanjut →';
  for (let i=1;i<=4;i++) {
    const el=document.getElementById(`imp-s${i}`);
    if (!el) continue;
    if (i<impState.step){el.style.background='var(--grn-bg)';el.style.color='var(--grn)';el.style.borderColor='var(--grn)';el.textContent='✓';}
    else if (i===impState.step){el.style.background='var(--cyn-bg)';el.style.color='var(--cyn)';el.style.borderColor='var(--cyn)';el.textContent=i;}
    else{el.style.background='var(--s2)';el.style.color='var(--t3)';el.style.borderColor='var(--bdr2)';el.textContent=i;}
    const ln=document.getElementById(`imp-line${i}`);
    if (ln) ln.style.background=i<impState.step?'var(--grn)':'var(--bdr2)';
  }
}
function showStepPane(step) {
  for (let i=1;i<=4;i++){const p=document.getElementById(`imp-pane-${i}`);if(p)p.className=i===step?'modal-tab-pane on':'modal-tab-pane';}
}

function renderMappingStep() {
  const fields=impState.type==='siswa'?IMP_FIELDS_SISWA:IMP_FIELDS_GURU;
  document.getElementById('imp-mapping-container').innerHTML=impState.headers.map(h=>{
    const opts=fields.map(f=>`<option value="${f.key}"${impState.mapping[h]===f.key?' selected':''}>${f.label}</option>`).join('');
    const isReq=fields.find(f=>f.key===impState.mapping[h])?.required;
    return `<div class="col-map-row">
      <div class="col-src" title="${h}">${h}${isReq?'<span class="bdg bdg-g" style="font-size:8px;margin-left:4px">Wajib</span>':''}</div>
      <div class="col-arrow">→</div>
      <div class="col-dest"><select onchange="impState.mapping['${h.replace(/'/g,"\\'")}'] = this.value;renderMappingStep()">${opts}</select></div>
    </div>`;
  }).join('');
}

function renderPreviewStep() {
  const d=getD();
  const fields=(impState.type==='siswa'?IMP_FIELDS_SISWA:IMP_FIELDS_GURU).filter(f=>f.key!=='_skip');
  const activeCols=fields.filter(f=>Object.values(impState.mapping).includes(f.key));
  impState.previewRows=impState.rawRows.map(raw=>{
    const row={};
    Object.entries(impState.mapping).forEach(([src,dest])=>{if(dest!=='_skip')row[dest]=(raw[src]||'').trim();});
    return row;
  }).filter(r=>r.nama&&r.nama.trim());
  impState.dupRows=new Set();
  const existing=(impState.type==='siswa'?d.data_siswa:d.keuangan_guru).map(x=>x.nama.trim().toLowerCase());
  const seen=new Set();
  impState.previewRows.forEach((row,i)=>{
    const k=(row.nama||'').toLowerCase();
    if (existing.includes(k)||seen.has(k)) impState.dupRows.add(i);
    seen.add(k);
  });
  const total=impState.previewRows.length, dups=impState.dupRows.size, news=total-dups;
  document.getElementById('imp-summary').innerHTML=`
    <div class="imp-sum-box" style="background:var(--cyn-bg);border:1px solid rgba(38,198,218,.2)"><div class="imp-sum-num" style="color:var(--cyn)">${total}</div><div class="imp-sum-lbl">Total</div></div>
    <div class="imp-sum-box" style="background:var(--grn-bg);border:1px solid rgba(0,230,118,.2)"><div class="imp-sum-num" style="color:var(--grn)">${news}</div><div class="imp-sum-lbl">Data Baru</div></div>
    <div class="imp-sum-box" style="background:var(--red-bg);border:1px solid rgba(255,82,82,.2)"><div class="imp-sum-num" style="color:var(--red)">${dups}</div><div class="imp-sum-lbl">Duplikat</div></div>`;
  document.getElementById('imp-preview-head').innerHTML=`<tr><th>#</th><th>Status</th>${activeCols.map(f=>`<th>${f.label.replace('*','')}</th>`).join('')}</tr>`;
  document.getElementById('imp-preview-body').innerHTML=impState.previewRows.slice(0,50).map((row,i)=>{
    const dup=impState.dupRows.has(i);
    return `<tr class="${dup?'dup-row':'ok-row'}"><td style="color:var(--t3);font-family:'Courier New',monospace">${i+1}</td><td>${dup?'<span class="bdg bdg-r">Duplikat</span>':'<span class="bdg bdg-g">Baru</span>'}</td>${activeCols.map(f=>`<td>${row[f.key]||'—'}</td>`).join('')}</tr>`;
  }).join('')+(impState.previewRows.length>50?`<tr><td colspan="${activeCols.length+2}" style="text-align:center;color:var(--t3);padding:10px;font-style:italic">...dan ${impState.previewRows.length-50} baris lagi</td></tr>`:'');
}

async function runImport() {
  const d=getD();
  const newRows=impState.previewRows.filter((_,i)=>!impState.dupRows.has(i));
  const total=newRows.length;
  let imported=0;
  const bar=document.getElementById('imp-result-bar');
  const title=document.getElementById('imp-result-title');
  const sub=document.getElementById('imp-result-sub');
  title.textContent=`Mengimport ${total} data...`;
  const CHUNK=20;
  for (let i=0;i<newRows.length;i+=CHUNK) {
    newRows.slice(i,i+CHUNK).forEach(row=>{
      if (impState.type==='siswa') {
        d.data_siswa.push({id:'S'+Date.now()+Math.random().toString(36).slice(2,6),nama:row.nama||'',nisn:row.nisn||'',kelas:row.kelas||'',jk:row.jk?(row.jk.toLowerCase().includes('p')?'P':'L'):'L',tgl_lahir:row.tgl_lahir||'',tahun_masuk:row.tahun_masuk||new Date().getFullYear(),ayah:row.ayah||'',ibu:row.ibu||'',hp_ortu:row.hp_ortu||'',alamat:row.alamat||'',pekerjaan_ortu:'',status_spp:'Lunas',total_piutang:0,piutang_detail:[],absensi:{},nilai:{}});
      } else {
        d.keuangan_guru.push({id:'G'+Date.now()+Math.random().toString(36).slice(2,6),nama:row.nama||'',jabatan:row.jabatan||'Guru',gaji_pokok:parseFloat((row.gaji_pokok||'0').replace(/[^\d.]/g,''))||0,honor_per_jam:parseFloat((row.honor_per_jam||'0').replace(/[^\d.]/g,''))||0,jam_mengajar:0,total_terima:parseFloat((row.gaji_pokok||'0').replace(/[^\d.]/g,''))||0,sudah_dibayar:false});
      }
      imported++;
    });
    if (bar) bar.style.width=Math.round((imported/total)*100)+'%';
    if (sub) sub.textContent=`${imported} / ${total} diproses...`;
    await new Promise(r=>setTimeout(r,10));
  }
  saveDB(); buildTicker();
  addAktivitas('siswa',`Smart Import: ${imported} ${impState.type} berhasil diimport`,0);
  const pane=document.getElementById('imp-pane-4');
  if (pane) pane.innerHTML=`<div style="padding:16px;text-align:center">
    <div style="font-size:56px;margin-bottom:14px">🎉</div>
    <div style="font-size:18px;font-weight:900;color:var(--grn);margin-bottom:8px">Import Berhasil!</div>
    <div style="font-size:13px;color:var(--t2);margin-bottom:16px"><b style="color:var(--grn)">${imported}</b> data ${impState.type} berhasil diimport${impState.dupRows.size>0?`<br/><span style="color:var(--yel)">${impState.dupRows.size} duplikat dilewati</span>`:''}</div>
    <div class="import-summary">
      <div class="imp-sum-box" style="background:var(--grn-bg);border:1px solid rgba(0,230,118,.2)"><div class="imp-sum-num" style="color:var(--grn)">${imported}</div><div class="imp-sum-lbl">Diimport</div></div>
      <div class="imp-sum-box" style="background:var(--red-bg);border:1px solid rgba(255,82,82,.2)"><div class="imp-sum-num" style="color:var(--red)">${impState.dupRows.size}</div><div class="imp-sum-lbl">Dilewati</div></div>
      <div class="imp-sum-box" style="background:var(--cyn-bg);border:1px solid rgba(38,198,218,.2)"><div class="imp-sum-num" style="color:var(--cyn)">${impState.previewRows.length}</div><div class="imp-sum-lbl">Total</div></div>
    </div>
    <button class="abtn abtn-g" style="width:100%;padding:13px;font-size:14px;margin-top:8px" onclick="closeModal('modal-smart-import');switchPage('${impState.type==='siswa'?'crm':'guru'}')">👁️ Lihat Data ${impState.type==='siswa'?'Siswa':'Guru'}</button>
  </div>`;
  if (currentPage==='crm') renderCRM();
  if (currentPage==='guru') renderGuru();
  if (currentPage==='dashboard') renderDashboard();
  populateSiswaSelect();
}

function downloadTemplate(type) {
  let csv=type==='siswa'
    ?'Nama,NISN,Kelas,Jenis Kelamin,Tanggal Lahir,Nama Ayah,Nama Ibu,HP Orang Tua,Alamat,Tahun Masuk\nAhmad Fauzi,0012345678,4A,L,2014-05-12,Budi Santoso,Sari Dewi,08123456789,Jl. Merdeka No.1,2021\nSiti Rahmah,0087654321,4A,P,2015-03-20,Rahman Ali,Nur Fadilah,08987654321,Jl. Pahlawan No.5,2021'
    :'Nama,Jabatan,Gaji Pokok,Honor Per Jam\nBudi Santoso,Wali Kelas 4A,2500000,50000\nSiti Rahmah,Guru Matematika,2000000,45000';
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download=`template_${type}_sekolahpro.csv`; a.click();
  showNotif(`📥 Template ${type} didownload!`,'ok');
}

function resetImport() {
  impState={step:1,type:impState.type,rawRows:[],headers:[],mapping:{},previewRows:[],dupRows:new Set()};
  const fi=document.getElementById('imp-file-info');if(fi)fi.style.display='none';
  const inp=document.getElementById('imp-file-input');if(inp)inp.value='';
  updateStepUI(); showStepPane(1);
}

// ══════════════════════════════════════
//  PIN LOCK MODULE
//  Copyright © 2026 Arblok Digital
// ══════════════════════════════════════

let pinBuffer = '';
const PIN_LENGTH = 4;
const PIN_DEFAULT = '1234';

function initPinLock() {
  const cfg = getD().profil_sekolah;
  const enabled = cfg.pin_enabled && cfg.pin_hash;
  if (enabled && !sessionStorage.getItem('sp_unlocked')) {
    showPinScreen();
  }
  // Sync toggle UI
  const tog = document.getElementById('set-pin-toggle');
  if (tog) tog.checked = !!enabled;
  const area = document.getElementById('pin-setup-area');
  if (area) area.style.display = enabled ? 'block' : 'none';
  updateThemeButtons();
}

function showPinScreen() {
  pinBuffer = '';
  updatePinDots();
  document.getElementById('pin-lock-screen').classList.add('show');
  const d = getD();
  const role = d.profil_sekolah.pin_role || 'Admin';
  const roleEl = document.getElementById('pin-role-label');
  if (roleEl) {
    roleEl.textContent = role;
    const colors = { Admin:'var(--grn)', Bendahara:'var(--cyn)', Guru:'var(--pur)' };
    roleEl.style.color = colors[role] || 'var(--grn)';
    roleEl.style.background = (colors[role]||'var(--grn)').replace(')', ',.12)').replace('var(', 'rgba(').replace('--grn','0,230,118').replace('--cyn','38,198,218').replace('--pur','192,132,252');
  }
}

function hidePinScreen() {
  document.getElementById('pin-lock-screen').classList.remove('show');
  sessionStorage.setItem('sp_unlocked', '1');
}

function pinPress(digit) {
  if (pinBuffer.length >= PIN_LENGTH) return;
  pinBuffer += digit;
  updatePinDots();
  if (pinBuffer.length === PIN_LENGTH) {
    setTimeout(verifyPin, 150);
  }
}

function pinDel() {
  pinBuffer = pinBuffer.slice(0, -1);
  updatePinDots();
  clearPinError();
}

function updatePinDots() {
  for (let i = 0; i < PIN_LENGTH; i++) {
    const dot = document.getElementById(`pd-${i}`);
    if (dot) dot.classList.toggle('filled', i < pinBuffer.length);
  }
}

function verifyPin() {
  const d = getD();
  const stored = d.profil_sekolah.pin_hash || hashPin(PIN_DEFAULT);
  if (hashPin(pinBuffer) === stored) {
    hidePinScreen();
    showNotif('✅ Selamat datang!', 'ok');
  } else {
    pinBuffer = '';
    updatePinDots();
    showPinError('❌ PIN salah! Coba lagi.');
  }
}

function hashPin(pin) {
  // Simple deterministic hash — not cryptographic, just obfuscation
  let h = 0;
  const s = pin + 'sp_salt_arblok_2026';
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return String(h);
}

function showPinError(msg) {
  const el = document.getElementById('pin-error-msg');
  if (!el) return;
  el.textContent = msg;
  el.style.animation = 'none';
  el.offsetHeight; // reflow
  el.style.animation = 'shake .4s ease';
}
function clearPinError() {
  const el = document.getElementById('pin-error-msg');
  if (el) el.textContent = '';
}

function skipPin() {
  hidePinScreen();
}

function togglePinLock(enabled) {
  const area = document.getElementById('pin-setup-area');
  if (area) area.style.display = enabled ? 'block' : 'none';
  if (!enabled) {
    const d = getD();
    d.profil_sekolah.pin_enabled = false;
    saveDB();
    showNotif('🔓 PIN Lock dinonaktifkan', 'warn');
  }
  // Sync visual slider
  const slider = document.getElementById('pin-toggle-slider');
  const dot = document.getElementById('pin-toggle-dot');
  if (slider) slider.style.background = enabled ? 'var(--grn)' : 'var(--s3)';
  if (dot) dot.style.transform = enabled ? 'translateX(20px)' : 'translateX(0)';
}

function savePIN() {
  const p1 = document.getElementById('set-pin-new').value;
  const p2 = document.getElementById('set-pin-confirm').value;
  if (p1.length !== 4 || !/^\d{4}$/.test(p1)) { showNotif('PIN harus 4 digit angka!', 'err'); return; }
  if (p1 !== p2) { showNotif('Konfirmasi PIN tidak cocok!', 'err'); return; }
  const d = getD();
  d.profil_sekolah.pin_enabled = true;
  d.profil_sekolah.pin_hash = hashPin(p1);
  saveDB();
  document.getElementById('set-pin-new').value = '';
  document.getElementById('set-pin-confirm').value = '';
  showNotif('✅ PIN berhasil disimpan!', 'ok');
}

// ══════════════════════════════════════
//  THEME MODULE — Dark / Light
// ══════════════════════════════════════

function setTheme(mode) {
  if (mode === 'light') {
    document.body.classList.add('light-mode');
    localStorage.setItem('sp_theme', 'light');
  } else {
    document.body.classList.remove('light-mode');
    localStorage.setItem('sp_theme', 'dark');
  }
  updateThemeButtons();
}

function updateThemeButtons() {
  const isDark = !document.body.classList.contains('light-mode');
  const db = document.getElementById('theme-dark-btn');
  const lb = document.getElementById('theme-light-btn');
  if (db) {
    db.style.background = isDark ? 'var(--grn-bg)' : 'var(--s2)';
    db.style.borderColor = isDark ? 'var(--grn)' : 'var(--bdr2)';
    db.style.color = isDark ? 'var(--grn)' : 'var(--t2)';
  }
  if (lb) {
    lb.style.background = !isDark ? 'var(--yel-bg)' : 'var(--s2)';
    lb.style.borderColor = !isDark ? 'var(--yel)' : 'var(--bdr2)';
    lb.style.color = !isDark ? 'var(--yel)' : 'var(--t2)';
  }
}

function loadTheme() {
  const saved = localStorage.getItem('sp_theme');
  if (saved === 'light') document.body.classList.add('light-mode');
}

// ══════════════════════════════════════
//  RAPOR DIGITAL MODULE
// ══════════════════════════════════════

function populateRaporSiswaSel() {
  const d = getD();
  const sel = document.getElementById('rapor-siswa-sel');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Pilih Siswa --</option>' +
    d.data_siswa.map(s => `<option value="${s.id}">${s.nama} — Kelas ${s.kelas}</option>`).join('');
}

function bukaRapor() {
  const siswaId = (document.getElementById('rapor-siswa-sel') || {}).value;
  const sem = (document.getElementById('rapor-sem-sel') || { value: '1' }).value;
  if (!siswaId) { showNotif('Pilih siswa terlebih dahulu!', 'err'); return; }
  const html = generateRaporHTML(siswaId, sem);
  const el = document.getElementById('rapor-content');
  if (el) el.innerHTML = html;
  openModal('modal-rapor');
}

function cetakRapor(siswaId, sem) {
  var html = generateRaporHTML(siswaId, sem);
  var fullHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Rapor Siswa</title>' +
    '<style>*{box-sizing:border-box;margin:0;padding:0}body{background:#fff;font-family:"Courier New",monospace;font-size:10px}' +
    '@media print{body{margin:0;padding:0}}</style>' +
    '</head><body>' + html +
    '<br/><div style="text-align:center;font-size:8px;color:#999;margin-top:12px;padding-top:8px;border-top:1px solid #eee">' +
    'Dicetak dari Sekolah Pro · © 2026 Arblok Digital</div></body></html>';
  var blob = new Blob([fullHtml], {type:'text/html'});
  var url  = URL.createObjectURL(blob);
  var w    = window.open(url, '_blank', 'width=700,height=900');
  setTimeout(function(){ if(w) w.print(); }, 800);
}

function generateRaporHTML(siswaId, sem) {
  const d = getD();
  const s = d.data_siswa.find(x => x.id === siswaId);
  if (!s) return '<p>Siswa tidak ditemukan</p>';

  const sekolah = d.profil_sekolah.nama || 'SD Islam Sahara';
  const ta = d.profil_sekolah.tahun_ajaran || new Date().getFullYear() + '/' + (new Date().getFullYear() + 1);
  const semLabel = sem === '1' ? 'Ganjil' : 'Genap';

  // Nilai
  const nilaiData = (s.nilai || {})[sem] || [];
  const byMapel = {};
  nilaiData.forEach(n => {
    if (!byMapel[n.mapel]) byMapel[n.mapel] = [];
    byMapel[n.mapel].push(n);
  });
  const mapelRows = Object.entries(byMapel).map(([mapel, entries]) => {
    const avg = entries.reduce((a, e) => a + e.nilai, 0) / entries.length;
    const grades = { A: 90, B: 80, C: 70, D: 60 };
    const grade = avg >= 90 ? 'A' : avg >= 80 ? 'B' : avg >= 70 ? 'C' : avg >= 60 ? 'D' : 'E';
    const uh = entries.filter(e => e.jenis === 'UH').map(e => e.nilai).join(', ') || '-';
    const uts = entries.find(e => e.jenis === 'UTS')?.nilai || '-';
    const uas = entries.find(e => e.jenis === 'UAS')?.nilai || '-';
    return `<tr><td>${mapel}</td><td style="text-align:center">${uh}</td>
      <td style="text-align:center">${uts}</td><td style="text-align:center">${uas}</td>
      <td style="text-align:center;font-weight:900">${avg.toFixed(1)}</td>
      <td style="text-align:center;font-weight:900">${grade}</td>
      <td style="font-size:8px">${avg >= 70 ? 'Tuntas' : 'Belum Tuntas'}</td></tr>`;
  });
  const allAvgs = Object.values(byMapel).map(entries =>
    entries.reduce((a, e) => a + e.nilai, 0) / entries.length
  );
  const rataRata = allAvgs.length ? (allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length).toFixed(2) : '—';
  const rankGrade = parseFloat(rataRata) >= 90 ? 'A' : parseFloat(rataRata) >= 80 ? 'B' : parseFloat(rataRata) >= 70 ? 'C' : parseFloat(rataRata) >= 60 ? 'D' : '—';

  // Absensi bulan ini
  const absensi = s.absensi || {};
  const year = new Date().getFullYear();
  const counts = { H: 0, I: 0, S: 0, A: 0 };
  Object.entries(absensi).forEach(([tgl, status]) => {
    if (tgl.startsWith(String(year)) && counts[status] !== undefined) counts[status]++;
  });
  const totalHari = counts.H + counts.I + counts.S + counts.A;
  const pctHadir = totalHari > 0 ? ((counts.H / totalHari) * 100).toFixed(0) : '0';

  const today = new Date().toLocaleDateString('id-ID', { dateStyle: 'long' });

  return `<div class="rapor-wrap">
    <div class="rapor-header">
      <div class="rapor-logo">🏫</div>
      <div>
        <div class="rapor-school-name">${sekolah}</div>
        <div class="rapor-school-sub">Laporan Hasil Belajar Siswa</div>
        <div class="rapor-school-sub">Tahun Ajaran ${ta} · Semester ${semLabel}</div>
      </div>
    </div>
    <div class="rapor-title">LAPORAN HASIL BELAJAR SISWA</div>
    <div class="rapor-info-grid">
      <div class="rapor-info-item"><span class="rapor-info-label">Nama</span><span class="rapor-info-val">: ${s.nama}</span></div>
      <div class="rapor-info-item"><span class="rapor-info-label">Kelas</span><span class="rapor-info-val">: ${s.kelas || '—'}</span></div>
      <div class="rapor-info-item"><span class="rapor-info-label">NISN</span><span class="rapor-info-val">: ${s.nisn || '—'}</span></div>
      <div class="rapor-info-item"><span class="rapor-info-label">Semester</span><span class="rapor-info-val">: ${semLabel}</span></div>
      <div class="rapor-info-item"><span class="rapor-info-label">Nama Ayah</span><span class="rapor-info-val">: ${s.ayah || '—'}</span></div>
      <div class="rapor-info-item"><span class="rapor-info-label">Nama Ibu</span><span class="rapor-info-val">: ${s.ibu || '—'}</span></div>
    </div>
    <div class="rapor-section-title">A. HASIL BELAJAR</div>
    ${mapelRows.length > 0 ? `
    <table class="rapor-tbl">
      <thead><tr>
        <th style="width:30%">Mata Pelajaran</th><th>UH</th><th>UTS</th><th>UAS</th>
        <th>Rata-rata</th><th>Grade</th><th>Ket.</th>
      </tr></thead>
      <tbody>${mapelRows.join('')}
        <tr style="font-weight:900;background:#f5f5f5">
          <td colspan="4">Rata-rata Keseluruhan</td>
          <td style="text-align:center;font-weight:900">${rataRata}</td>
          <td style="text-align:center;font-weight:900">${rankGrade}</td>
          <td>${parseFloat(rataRata) >= 70 ? '✅ Naik Kelas' : '⚠️ Perlu Evaluasi'}</td>
        </tr>
      </tbody>
    </table>` :
    '<p style="color:#999;text-align:center;padding:10px;font-style:italic">Belum ada data nilai untuk semester ini</p>'}
    <div class="rapor-section-title">B. KEHADIRAN</div>
    <div class="rapor-abs-grid">
      <div class="rapor-abs-box"><div class="rapor-abs-num">${counts.H}</div><div class="rapor-abs-lbl">Hadir</div></div>
      <div class="rapor-abs-box"><div class="rapor-abs-num">${counts.I}</div><div class="rapor-abs-lbl">Izin</div></div>
      <div class="rapor-abs-box"><div class="rapor-abs-num">${counts.S}</div><div class="rapor-abs-lbl">Sakit</div></div>
      <div class="rapor-abs-box"><div class="rapor-abs-num">${counts.A}</div><div class="rapor-abs-lbl">Alpha</div></div>
    </div>
    <p style="font-size:9px">Persentase kehadiran: <b>${pctHadir}%</b> dari ${totalHari} hari efektif</p>
    <div class="rapor-section-title">C. CATATAN WALI KELAS</div>
    <div style="border:1px solid #ccc;padding:8px;min-height:50px;margin-bottom:10px;font-size:10px;color:#999;font-style:italic">
      ${s.catatan_rapor || 'Siswa menunjukkan perkembangan yang baik. Tetap semangat belajar!'}
    </div>
    <div class="rapor-footer">
      <div class="rapor-sign">
        <div>Mengetahui,</div>
        <div>Orang Tua / Wali</div>
        <div class="rapor-sign-line"></div>
        <div>(${s.ayah || '....................'})</div>
      </div>
      <div class="rapor-sign">
        <div>${sekolah ? sekolah.split(' ')[0] : 'Sekolah'}, ${today}</div>
        <div>Wali Kelas ${s.kelas || '—'},</div>
        <div class="rapor-sign-line"></div>
        <div>(..............................)</div>
      </div>
    </div>
  </div>`;
}

function shareRaporWA() {
  const siswaId = (document.getElementById('rapor-siswa-sel') || {}).value;
  const d = getD();
  const s = d.data_siswa.find(x => x.id === siswaId);
  if (!s || !s.hp_ortu) { showNotif('No HP orang tua tidak ada di profil siswa!', 'warn'); return; }
  const sem = (document.getElementById('rapor-sem-sel') || { value: '1' }).value;
  const semLabel = sem === '1' ? 'Ganjil' : 'Genap';
  const nilaiData = (s.nilai || {})[sem] || [];
  const byMapel = {};
  nilaiData.forEach(n => { if (!byMapel[n.mapel]) byMapel[n.mapel] = []; byMapel[n.mapel].push(n.nilai); });
  const allAvgs = Object.values(byMapel).map(v => v.reduce((a, b) => a + b, 0) / v.length);
  const rata = allAvgs.length ? (allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length).toFixed(1) : '—';
  const absensi = s.absensi || {};
  const H = Object.values(absensi).filter(x => x === 'H').length;
  const A = Object.values(absensi).filter(x => x === 'A').length;
  const msg = `*Laporan Nilai Semester ${semLabel}*\n${d.profil_sekolah.nama}\n\n`+
    `👤 *${s.nama}* — Kelas ${s.kelas}\n`+
    `📊 Rata-rata: *${rata}*\n`+
    `📅 Hadir: *${H} hari* | Alpha: *${A} hari*\n\n`+
    `Terima kasih atas perhatiannya 🙏\n_Sekolah Pro by Arblok Digital_`;
  bukaWA(s.hp_ortu, encodeURIComponent(msg));
}

// ══════════════════════════════════════
//  SHEETS SYNC & SHARE MODULE
// ══════════════════════════════════════

async function importFromSheets() {
  const url = (document.getElementById('sheets-url-inp') || {}).value.trim();
  const type = (document.getElementById('sheets-type-sel') || { value: 'siswa' }).value;
  if (!url) { showNotif('Masukkan URL Google Sheets!', 'err'); return; }
  showNotif('🔄 Mengambil data dari Sheets...', 'warn');
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Gagal mengambil data');
    const text = await res.text();
    const parsed = parseCSV(text);
    if (!parsed.rows.length) { showNotif('Data kosong!', 'err'); return; }
    const mapping = autoMapColumns(parsed.headers, type);
    // Run through import pipeline
    impState = { step: 3, type, rawRows: parsed.rows, headers: parsed.headers, mapping, previewRows: [], dupRows: new Set() };
    renderPreviewStep();
    const total = impState.previewRows.length;
    const news = total - impState.dupRows.size;
    if (!confirm(`Ditemukan ${total} baris data dari Sheets.\n${news} data baru, ${impState.dupRows.size} duplikat.\nImport sekarang?`)) return;
    impState.step = 4;
    closeModal('modal-sheets-sync');
    openModal('modal-smart-import');
    updateStepUI();
    await runImport();
  } catch (err) {
    showNotif('❌ ' + (err.message || 'Gagal import'), 'err');
    console.error('[Sheets]', err);
  }
}

function backupNow() {
  exportData();
  showNotif('✅ Backup berhasil di-download!', 'ok');
}

function shareViaWA() {
  const d = getD();
  const saldo = fmt(d.profil_sekolah.saldo_utama);
  const siswaCount = d.data_siswa.length;
  const tunggakan = d.data_siswa.filter(s => s.status_spp === 'Tunggakan').length;
  const totalGaji = d.keuangan_guru.reduce((a, g) => a + (g.total_terima || 0), 0);
  const bosUsed = d.dana_bos.pagu_tahunan > 0
    ? Math.round((d.dana_bos.terpakai / d.dana_bos.pagu_tahunan) * 100) : 0;
  const msg = `*📊 Ringkasan ${d.profil_sekolah.nama}*\n`+
    `🗓 ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}\n\n`+
    `💰 Saldo Kas: *${saldo}*\n`+
    `👥 Total Siswa: *${siswaCount}*\n`+
    `⚠️ Tunggakan SPP: *${tunggakan} siswa*\n`+
    `💸 Total Gaji Guru: *${fmtShort(totalGaji)}*\n`+
    `🏦 BOS Terpakai: *${bosUsed}%*\n\n`+
    `_Laporan dari Sekolah Pro · Arblok Digital_\n`+
    `_wa.me/6289508053795_`;
  bukaWA('6289508053795', encodeURIComponent(msg));
}

// ══════════════════════════════════════
//  INIT — Run on startup
// ══════════════════════════════════════

(function appInit() {
  // Load saved theme
  loadTheme();
  // Populate rapor siswa select when settings opened
  const origRenderPage = window.renderPage || renderPage;
  window.renderPage = function(name) {
    origRenderPage(name);
    if (name === 'setting') {
      if (typeof updatePWAStatus === 'function') setTimeout(updatePWAStatus, 150);
      populateRaporSiswaSel();
      updateThemeButtons();
      // Sync PIN toggle
      const d = getD();
      const tog = document.getElementById('set-pin-toggle');
      if (tog) {
        tog.checked = !!d.profil_sekolah.pin_enabled;
        const area = document.getElementById('pin-setup-area');
        if (area) area.style.display = tog.checked ? 'block' : 'none';
        const slider = document.getElementById('pin-toggle-slider');
        const dot = document.getElementById('pin-toggle-dot');
        if (slider) slider.style.background = tog.checked ? 'var(--grn)' : 'var(--s3)';
        if (dot) dot.style.transform = tog.checked ? 'translateX(20px)' : 'translateX(0)';
      }
    }
  };
  // Show PIN lock if enabled
  setTimeout(initPinLock, 300);
})();

// ════════════════════════════════════════════════════
//  PWA — Install Prompt + Service Worker
//  Copyright © 2026 Arblok Digital
// ════════════════════════════════════════════════════

// ── Global state ──────────────────────────────────
var _pwaPrompt   = null;   // deferred BeforeInstallPromptEvent
var _pwaWorker   = null;   // pending SW waiting to activate

// ── Platform ──────────────────────────────────────
var _pwaUA         = navigator.userAgent;
var _pwaIsIOS      = /iphone|ipad|ipod/i.test(_pwaUA);
var _pwaIsAndroid  = /android/i.test(_pwaUA);
var _pwaIsSafari   = /^((?!chrome|android).)*safari/i.test(_pwaUA);
var _pwaIsStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  !!window.navigator.standalone;

// ── 1. Capture install prompt ─────────────────────
window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  _pwaPrompt = e;
  console.log('[PWA] install prompt ready');
  // Show banner 3s after prompt is ready
  setTimeout(pwaShowBanner, 3000);
  // Show button in settings
  var btn = document.getElementById('set-install-btn');
  if (btn) btn.style.display = 'block';
});

// ── 2. App installed ──────────────────────────────
window.addEventListener('appinstalled', function() {
  _pwaPrompt = null;
  pwaHideBanner();
  console.log('[PWA] installed');
  if (typeof showNotif === 'function') showNotif('🎉 Sekolah Pro berhasil diinstall!', 'ok');
});

// ── 3. Banner ─────────────────────────────────────
function pwaShowBanner() {
  if (_pwaIsStandalone) return;
  if (localStorage.getItem('pwa_no_banner')) return;
  var el = document.getElementById('pwa-install-banner');
  if (!el) return;
  var btnEl = document.getElementById('pwa-install-btn');
  if (btnEl) btnEl.textContent = _pwaIsIOS ? '📲 Cara Install' : '📲 Install';
  el.style.display = 'block';
}
function pwaHideBanner() {
  var el = document.getElementById('pwa-install-banner');
  if (el) el.style.display = 'none';
}

// ── 4. Public: trigger install ────────────────────
function triggerInstall() {
  if (_pwaIsStandalone) {
    if (typeof showNotif === 'function') showNotif('✅ App sudah terinstall!', 'ok');
    return;
  }
  if (_pwaPrompt) {
    _pwaPrompt.prompt();
    _pwaPrompt.userChoice.then(function(r) {
      console.log('[PWA] choice:', r.outcome);
      _pwaPrompt = null;
      pwaHideBanner();
    });
    return;
  }
  if (_pwaIsIOS) { pwaShowIOSGuide(); return; }
  if (typeof showNotif === 'function')
    showNotif('💡 Buka di Chrome/Edge untuk install. iOS: gunakan Safari.', 'warn');
}

// ── 5. Dismiss banner ─────────────────────────────
function dismissInstall() {
  pwaHideBanner();
  localStorage.setItem('pwa_no_banner', '1');
}

// ── 6. iOS guide ──────────────────────────────────
function pwaShowIOSGuide() {
  var id = 'ios-guide-modal';
  var el = document.getElementById(id);
  if (el) { el.classList.add('open'); return; }
  var d = document.createElement('div');
  d.id = id; d.className = 'modal-bg open';
  d.innerHTML =
    '<div class="sheet" style="max-width:380px;padding:0">' +
      '<div class="mhdr"><h2>📱 Install di iPhone/iPad</h2>' +
        '<button class="mclose" onclick="document.getElementById(\'ios-guide-modal\').classList.remove(\'open\')">✕</button>' +
      '</div>' +
      '<div style="padding:20px 20px 28px">' +
        '<div style="font-size:40px;text-align:center;margin-bottom:12px">🏫</div>' +
        '<div style="display:flex;flex-direction:column;gap:12px">' +
          '<div style="display:flex;gap:10px;align-items:start"><div style="min-width:26px;height:26px;border-radius:50%;background:var(--grn);color:#000;font-weight:900;font-size:12px;display:flex;align-items:center;justify-content:center">1</div><div style="font-size:13px;color:var(--t2);padding-top:3px">Buka di <b>Safari</b> (bukan Chrome)</div></div>' +
          '<div style="display:flex;gap:10px;align-items:start"><div style="min-width:26px;height:26px;border-radius:50%;background:var(--grn);color:#000;font-weight:900;font-size:12px;display:flex;align-items:center;justify-content:center">2</div><div style="font-size:13px;color:var(--t2);padding-top:3px">Tap ikon <b>Share ⬆️</b> di bawah</div></div>' +
          '<div style="display:flex;gap:10px;align-items:start"><div style="min-width:26px;height:26px;border-radius:50%;background:var(--grn);color:#000;font-weight:900;font-size:12px;display:flex;align-items:center;justify-content:center">3</div><div style="font-size:13px;color:var(--t2);padding-top:3px">Pilih <b>"Add to Home Screen"</b></div></div>' +
          '<div style="display:flex;gap:10px;align-items:start"><div style="min-width:26px;height:26px;border-radius:50%;background:var(--grn);color:#000;font-weight:900;font-size:12px;display:flex;align-items:center;justify-content:center">4</div><div style="font-size:13px;color:var(--t2);padding-top:3px">Tap <b>"Add"</b> — selesai! ✅</div></div>' +
        '</div>' +
        '<div style="margin-top:16px;background:var(--grn-bg);border:1px solid rgba(0,230,118,.2);border-radius:9px;padding:10px 12px;font-size:11px;color:var(--t2)">✅ App berjalan offline setelah diinstall</div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(d);
  d.addEventListener('click', function(e) { if (e.target === d) d.classList.remove('open'); });
}

// ── 7. Apply SW update ────────────────────────────
function applyUpdate() {
  if (_pwaWorker) _pwaWorker.postMessage({ type: 'SKIP_WAITING' });
  var el = document.getElementById('pwa-update-banner');
  if (el) el.style.display = 'none';
  if (typeof showNotif === 'function') showNotif('🔄 Memuat versi terbaru...', 'warn');
  setTimeout(function() { location.reload(); }, 800);
}

// ── 8. Update status in Settings ──────────────────
function updatePWAStatus() {
  var el  = document.getElementById('set-pwa-status');
  var btn = document.getElementById('set-install-btn');
  var bd  = document.getElementById('set-build-date');
  if (bd) bd.textContent = 'v4.0 · © 2026 Arblok Digital';
  if (!el) return;
  if (_pwaIsStandalone) {
    el.innerHTML = '<span style="color:var(--grn);font-weight:700">✅ Terinstall sebagai App</span>';
    if (btn) btn.style.display = 'none';
  } else if (_pwaIsIOS && _pwaIsSafari) {
    el.innerHTML = '<span style="color:var(--yel)">📱 iOS: tap Share ⬆️ → Add to Home Screen</span>';
    if (btn) { btn.textContent = '📲 Cara Install (iOS)'; btn.style.display = 'block'; }
  } else if (_pwaPrompt) {
    el.innerHTML = '<span style="color:var(--yel)">📲 Klik Install App untuk memasang</span>';
    if (btn) { btn.textContent = '📲 Install App'; btn.style.display = 'block'; }
  } else {
    el.innerHTML = '<span style="color:var(--t3)">Berjalan di browser (install via Chrome/Edge)</span>';
  }
}

// ── 9. Wire banner button ─────────────────────────
(function() {
  function wire() {
    var btn = document.getElementById('pwa-install-btn');
    if (btn && !btn._w) { btn._w = 1; btn.addEventListener('click', triggerInstall); }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else { wire(); }
})();

// ── 10. Register Service Worker ───────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    Promise.resolve({update:function(){},addEventListener:function(){}})
      .then(function(reg) {
        console.log('[PWA] SW registered:', reg.scope);
        reg.update();
        setInterval(function() { reg.update(); }, 30 * 60 * 1000);
        reg.addEventListener('updatefound', function() {
          var inst = reg.installing;
          if (!inst) return;
          inst.addEventListener('statechange', function() {
            if (inst.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                _pwaWorker = inst;
                var b = document.getElementById('pwa-update-banner');
                if (b) b.style.display = 'block';
              } else {
                if (typeof showNotif === 'function') showNotif('📦 App siap offline!', 'ok');
              }
            }
          });
        });
        navigator.serviceWorker.addEventListener('controllerchange', function() {
          location.reload();
        });
        setTimeout(updatePWAStatus, 300);
      })
      .catch(function(e) { console.warn('[PWA] SW error:', e.message); });
  });
}

// ── 11. iOS first-visit hint ──────────────────────
if (_pwaIsIOS && _pwaIsSafari && !_pwaIsStandalone && !localStorage.getItem('ios_hint')) {
  setTimeout(function() {
    localStorage.setItem('ios_hint', '1');
    pwaShowBanner();
    if (typeof showNotif === 'function')
      showNotif('💡 Install: tap Share ⬆️ → Add to Home Screen', 'warn');
  }, 5000);
}

// ── 12. Deep-link: ?page= from manifest shortcuts ─
(function() {
  var p = new URLSearchParams(location.search).get('page');
  if (p) setTimeout(function() {
    if (typeof switchPage === 'function') switchPage(p);
  }, 600);
})();

// ── SCROLL TO TOP (desktop) ──────────
function scrollToTop() {
  const dc = document.getElementById('desktop-content');
  if (dc) dc.scrollTo({ top: 0, behavior: 'smooth' });
}

// Show/hide scroll-to-top button based on scroll position
(function initScrollTop() {
  const dc = document.getElementById('desktop-content');
  const btn = document.getElementById('scroll-top-btn');
  if (!dc || !btn) return;
  dc.addEventListener('scroll', () => {
    if (dc.scrollTop > 300) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  });
})();



