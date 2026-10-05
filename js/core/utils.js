// js/core/utils.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

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

globalThis.MODAL_HOOKS = globalThis.MODAL_HOOKS || {};
function registerModalHook(id, fn) { globalThis.MODAL_HOOKS[id] = fn; }

function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('open');
  if (id === 'modal-absensi-massal') { massalState = {}; const e = document.getElementById('massal-tanggal'); if (e) e.value = new Date().toISOString().slice(0, 10); renderMassalList(); }
  if (id === 'modal-kartu-spp') { const s = document.getElementById('kartu-siswa-sel'); if (s) { const d = getD(); s.innerHTML = d.data_siswa.map(x => `<option value="${x.id}">${x.nama} (${x.kelas})</option>`).join('') || '<option>--</option>'; renderKartuSPP(); } }
  if (id === 'modal-jadwal-add') { const d = getJadwalDB(); const ss = document.getElementById('jd-slot-inp'); if (ss) ss.innerHTML = d.jadwal_slots.map(s => `<option value="${s.id}">${s.label} (${s.mulai}–${s.selesai})</option>`).join(''); const gs = document.getElementById('jd-guru-inp'); if (gs) gs.innerHTML = '<option value="">--</option>' + d.keuangan_guru.map(g => `<option value="${g.nama}">${g.nama}</option>`).join(''); }
  if (id === 'modal-pesan-siswa') { const d = getD(); const s = document.getElementById('pesan-siswa-sel'); if (s) s.innerHTML = d.data_siswa.map(x => `<option value="${x.id}">${x.nama} (${x.kelas})</option>`).join('') || '<option>--</option>'; }
  if (id === 'modal-event-add') { const e = document.getElementById('event-tgl-mulai'); if (e && !e.value) e.value = new Date().toISOString().slice(0, 10); }
  if (id === 'modal-bayar-biaya') { onBiayaJenisChange(); }
  if (id === 'modal-spp') { populateSiswaSelect(); }
  if (id === 'modal-akd-config') { openKonfigAkademik(); }
  if (id === 'modal-mutasi') { toggleMutasiAlasan(); }
  if (id === 'modal-payroll-config') { openPayrollConfigModal(); }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

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



// ════════════════════════════════════════════════════════════════════
//  KWITANSI / RECEIPT MODULE
//  generateKwitansi(paymentId) — dipanggil dari aktivitas & transaksi
//  cetakKwitansi(mode)         — 'a4' atau 'thermal'
//  simpanKwitansiPDF()         — trigger browser save as PDF
// ════════════════════════════════════════════════════════════════════


function _terbilang(n) {
  const s = ['','satu','dua','tiga','empat','lima','enam','tujuh','delapan','sembilan','sepuluh','sebelas'];
  n = Math.floor(n);
  if (n <= 0)     return 'nol';
  if (n < 12)     return s[n];
  if (n < 20)     return s[n-10] + ' belas';
  if (n < 100)    return s[Math.floor(n/10)] + ' puluh ' + (n%10 ? s[n%10] : '');
  if (n < 200)    return 'seratus ' + _terbilang(n%100);
  if (n < 1000)   return s[Math.floor(n/100)] + ' ratus ' + _terbilang(n%100);
  if (n < 2000)   return 'seribu ' + _terbilang(n%1000);
  if (n < 1e6)    return _terbilang(Math.floor(n/1000)) + ' ribu ' + _terbilang(n%1000);
  if (n < 1e9)    return _terbilang(Math.floor(n/1e6)) + ' juta ' + _terbilang(n%1e6);
  return _terbilang(Math.floor(n/1e9)) + ' miliar ' + _terbilang(n%1e9);
}

function _tbCapital(n) {
  return _terbilang(n).trim().replace(/\s+/g,' ').replace(/^\w/, c => c.toUpperCase()) + ' Rupiah';
}


// ── shim fungsi ke global (handler inline lama + pemanggilan antar-file) ──
Object.assign(globalThis, { fmt, fmtShort, updateClock, openModal, closeModal, showNotif, getAvatarColor, getInitials, getAgeStr, getNilaiGrade, scrollToTop, _terbilang, _tbCapital, registerModalHook });
export { fmt, fmtShort, updateClock, openModal, closeModal, showNotif, getAvatarColor, getInitials, getAgeStr, getNilaiGrade, scrollToTop, _terbilang, _tbCapital, registerModalHook };
