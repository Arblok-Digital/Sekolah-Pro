// js/modules/jadwal/route.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

import './logic.js';
import './pipeline.js';

function quickAddJadwal(hari, slotId) {
  const d = getJadwalDB();
  const slotSel = document.getElementById('jd-slot-inp');
  if (slotSel) slotSel.value = slotId;
  const hariSel = document.getElementById('jd-hari-inp');
  if (hariSel) hariSel.value = hari;
  openModal('modal-jadwal-add');
}


Object.assign(globalThis, { quickAddJadwal });

export async function mount(container, modalsRoot) {
  return globalThis.mountPartial('jadwal', container, modalsRoot);
}
export { quickAddJadwal };
