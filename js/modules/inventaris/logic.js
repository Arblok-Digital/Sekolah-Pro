// js/modules/inventaris/logic.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

function getInvDB() {
  const d = getD();
  if (!d.inventaris) d.inventaris = [];
  return d;
}


globalThis.invFilter = 'all';

globalThis.activeAsetId = null;


globalThis.ASET_ICONS = { Elektronik:'💻', Furnitur:'🪑', Olahraga:'⚽', Perpustakaan:'📚', Laboratorium:'🔬', Lainnya:'📌' };

globalThis.KONDISI_LABELS = { baik:'Baik', 'rusak-ringan':'Rusak Ringan', 'rusak-berat':'Rusak Berat', hilang:'Hilang' };

globalThis.KONDISI_CLASSES = { baik:'aset-baik', 'rusak-ringan':'aset-rusak-ringan', 'rusak-berat':'aset-rusak-berat', hilang:'aset-hilang' };


Object.assign(globalThis, { getInvDB });
export { getInvDB };
