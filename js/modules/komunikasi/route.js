// js/modules/komunikasi/route.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

import './logic.js';
import './pipeline.js';

function setTemplate(key) {
  const d = getD();
  let tpl = WA_TEMPLATES[key] || '';
  tpl = tpl.replace(/{sekolah}/g, d.profil_sekolah.nama);
  tpl = tpl.replace(/{nama}/g, '[Nama Siswa]');
  const el = document.getElementById('bc-pesan-inp');
  if (el) el.value = tpl;
}


function renderKomunikasi() {
  if (isOfflineMode()) { requireOnline('Komunikasi Ortu (Cloud)'); return; }
  const d = getKomDB();
  const kom = d.komunikasi;
  const totalOrtuHP = d.data_siswa.filter(s => s.hp_ortu).length;

  document.getElementById('kom-stat-total').textContent = kom.pesan.length;
  document.getElementById('kom-stat-broadcast').textContent = kom.broadcast.length;
  document.getElementById('kom-stat-ortu').textContent = totalOrtuHP;
  document.getElementById('kom-stat-unread').textContent = kom.pesan.filter(p => !p.dibaca).length;

  // Pesan list
  const el = document.getElementById('kom-pesan-list');
  if (!kom.pesan.length) {
    el.innerHTML = '<div class="empty-state"><span class="empty-icon">💬</span><span class="empty-text">Belum ada riwayat pesan</span></div>';
  } else {
    const katColors = {'Tagihan SPP':'var(--red)','Absensi':'var(--blu)','Nilai/Akademik':'var(--cyn)','Prestasi':'var(--grn)','Perilaku':'var(--amb)','Informasi Umum':'var(--t2)','Lainnya':'var(--t3)'};
    el.innerHTML = kom.pesan.slice().reverse().slice(0, 20).map(p => {
      const s = d.data_siswa.find(x => x.id === p.siswa_id);
      const c = s ? getAvatarColor(s) : {bg:'var(--s2)',border:'var(--bdr2)',text:'var(--t3)'};
      const color = katColors[p.kategori] || 'var(--t2)';
      return `<div class="pesan-item">
        <div class="pesan-avatar" style="background:${c.bg};border-color:${c.border};color:${c.text}">${s?getInitials(s.nama):'?'}</div>
        <div class="pesan-body">
          <div class="pesan-header">
            <span class="pesan-nama">${s?s.nama:'Unknown'}</span>
            <span class="pesan-waktu">${new Date(p.waktu).toLocaleDateString('id-ID',{dateStyle:'short'})}</span>
          </div>
          <div class="pesan-teks">${p.isi}</div>
          <span class="pesan-tag" style="background:${color}15;color:${color};border:1px solid ${color}44">${p.kategori}</span>
          ${s&&s.hp_ortu ? `<button class="abtn" style="margin-top:6px;padding:4px 10px;font-size:10px;background:#25D36615;color:#25D366;border:1px solid #25D36644" onclick="bukaWA('${s.hp_ortu}','${encodeURIComponent(p.isi)}')">📱 WA</button>` : ''}
        </div>
      </div>`;
    }).join('');
  }

  // HP direktori
  const el2 = document.getElementById('kom-hp-list');
  const siswaHP = d.data_siswa.filter(s => s.hp_ortu);
  if (!siswaHP.length) {
    el2.innerHTML = '<div style="font-size:12px;color:var(--t3);padding:8px">Belum ada data no HP orang tua. Tambahkan melalui CRM Siswa.</div>';
  } else {
    el2.innerHTML = siswaHP.map(s => {
      const c = getAvatarColor(s);
      return `<div class="broadcast-item">
        <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">
          <div style="width:32px;height:32px;border-radius:50%;background:${c.bg};border:1.5px solid ${c.border};color:${c.text};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;flex-shrink:0">${getInitials(s.nama)}</div>
          <div style="min-width:0">
            <div style="font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.nama} <span style="color:var(--t3);font-size:10px">(${s.ayah||'—'})</span></div>
            <div style="font-size:11px;color:var(--cyn);font-family:'Courier New',monospace">${s.hp_ortu}</div>
          </div>
        </div>
        <button class="wa-btn" style="width:auto;padding:6px 12px;font-size:11px" onclick="bukaWA('${s.hp_ortu}','')">📱</button>
      </div>`;
    }).join('');
  }

  // Populate siswa select
  const sel = document.getElementById('pesan-siswa-sel');
  if (sel) sel.innerHTML = d.data_siswa.map(s => `<option value="${s.id}">${s.nama} (${s.kelas})</option>`).join('') || '<option>-- Belum ada siswa --</option>';
}


Object.assign(globalThis, { setTemplate, renderKomunikasi });

export async function mount(container, modalsRoot) {
  return globalThis.mountPartial('komunikasi', container, modalsRoot);
}
export { setTemplate, renderKomunikasi };
