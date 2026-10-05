// js/modules/alumni/logic.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

function getAlumniDB() {
  const d = getD();
  if (!d.alumni) d.alumni = [];
  return d;
}


globalThis.AL_STATUS_STYLE = {
  lanjut: {cls:'bdg-g', label:'✅ Lanjut SMP'},
  bekerja: {cls:'bdg-b', label:'💼 Bekerja'},
  'tidak-diketahui': {cls:'bdg-x', label:'❓ Tidak Diketahui'}
};


Object.assign(globalThis, { getAlumniDB });
export { getAlumniDB };
