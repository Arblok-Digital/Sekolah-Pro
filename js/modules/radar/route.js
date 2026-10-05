// js/modules/radar/route.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

import './logic.js';
import './pipeline.js';



Object.assign(globalThis, {  });

export async function mount(container, modalsRoot) {
  return globalThis.mountPartial('radar', container, modalsRoot);
}
