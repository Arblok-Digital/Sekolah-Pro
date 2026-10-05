// js/modules/kalender/logic.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

function getKalDB() {
  const d = getD();
  if (!d.kalender) d.kalender = [];
  return d;
}


globalThis.kalYear = new Date().getFullYear();

globalThis.kalMonth = new Date().getMonth();


globalThis.EV_TYPE_MAP = { libur:{label:'Libur',cls:'ev-libur',color:'var(--red)'}, ujian:{label:'Ujian',cls:'ev-ujian',color:'var(--amb)'}, kegiatan:{label:'Kegiatan',cls:'ev-kegiatan',color:'var(--blu)'}, rapat:{label:'Rapat',cls:'ev-rapat',color:'var(--pur)'}, lain:{label:'Lainnya',cls:'ev-lain',color:'var(--t2)'} };


function prevKalMonth() { kalMonth--; if(kalMonth<0){kalMonth=11;kalYear--;} renderKalender(); }

function nextKalMonth() { kalMonth++; if(kalMonth>11){kalMonth=0;kalYear++;} renderKalender(); }


Object.assign(globalThis, { getKalDB, prevKalMonth, nextKalMonth });
export { getKalDB, prevKalMonth, nextKalMonth };
