// js/modules/kalender/route.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

import './logic.js';
import './pipeline.js';

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


Object.assign(globalThis, { renderKalender, renderEventList });

export async function mount(container, modalsRoot) {
  return globalThis.mountPartial('kalender', container, modalsRoot);
}
export { renderKalender, renderEventList };
