// js/modules/kalender/pipeline.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

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

Object.assign(globalThis, { showDayEvents, simpanEvent, hapusEvent });
export { showDayEvents, simpanEvent, hapusEvent };
