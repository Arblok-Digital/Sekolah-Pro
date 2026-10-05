// js/modules/jadwal/pipeline.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

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

Object.assign(globalThis, { renderJadwal, simpanJadwal, hapusJadwalCell, hapusJadwalKelas, simpanSlot, hapusSlot });
export { renderJadwal, simpanJadwal, hapusJadwalCell, hapusJadwalKelas, simpanSlot, hapusSlot };
