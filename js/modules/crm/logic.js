// js/modules/crm/logic.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

globalThis.crmFilter = 'all';

globalThis.activeSiswaId = null;

globalThis.absYear = new Date().getFullYear();

globalThis.absMonth = new Date().getMonth();

globalThis.absMode = 'H';

globalThis.massalState = {};


globalThis.BULAN_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

globalThis.MAPEL_COLORS = {'Matematika':'var(--blu)','IPA':'var(--grn)','IPS':'var(--yel)','Bahasa Indonesia':'var(--cyn)','Bahasa Inggris':'var(--pur)','PKn':'var(--amb)'};


function _recalcPiutang(siswa) {
  if (!siswa) return;
  const detail = siswa.piutang_detail || [];
  let total = 0;
  detail.forEach(p => {
    const sisaVal = p.sisa !== undefined ? p.sisa : (p.jumlah || 0);
    const isLunas = p.lunas === true || p.status === 'paid' || p.status === 'lunas' || sisaVal <= 0;
    // Sinkronkan kedua field agar konsisten
    if (isLunas) {
      p.lunas  = true;
      p.status = 'paid';
      p.sisa   = 0;
    } else {
      p.lunas  = false;
      if (!p.status || p.status === 'paid') p.status = 'unpaid';
      total += sisaVal;
    }
  });
  siswa.total_piutang = Math.max(0, total);
  siswa.status_spp    = siswa.total_piutang <= 0 ? 'Lunas' : 'Tunggakan';
}


function prevAbsMonth() { absMonth--; if(absMonth<0){absMonth=11;absYear--;} const d=getD(); const s=d.data_siswa.find(x=>x.id===activeSiswaId); if(s)renderAbsCalendar(s); }

function nextAbsMonth() { absMonth++; if(absMonth>11){absMonth=0;absYear++;} const d=getD(); const s=d.data_siswa.find(x=>x.id===activeSiswaId); if(s)renderAbsCalendar(s); }


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

Object.assign(globalThis, { _recalcPiutang, prevAbsMonth, nextAbsMonth, massalToggle, massalSetAll });
export { _recalcPiutang, prevAbsMonth, nextAbsMonth, massalToggle, massalSetAll };
