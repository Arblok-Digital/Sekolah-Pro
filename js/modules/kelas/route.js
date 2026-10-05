// js/modules/kelas/route.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

import './logic.js';
import './pipeline.js';

function renderKelas() {
  const d  = getD();
  const kc = d.kelas_config || { jenjang:'SD', rombel_aktif:['A','B','C'] };

  // Update badge jenjang di header
  const badge = document.getElementById('kelas-jenjang-badge');
  if (badge) badge.textContent = kc.jenjang || 'SD';

  // Sync jenjang selector
  document.querySelectorAll('.jenjang-btn').forEach(btn => {
    btn.classList.toggle('on', btn.getAttribute('data-j') === (kc.jenjang || 'SD'));
  });

  // Sync rombel selector
  const rombelAktif = kc.rombel_aktif || ['A','B','C'];
  document.querySelectorAll('.rombel-btn').forEach(btn => {
    btn.classList.toggle('on', rombelAktif.includes(btn.getAttribute('data-r')));
  });

  // Render grid kelas
  _renderKelasGrid();
  _renderWaliKelasList();
  _renderKelasStats();

  // Populate wali kelas modal selects
  _populateWaliKelasModal();
}

// ── Grid visual semua kelas aktif ─────────────────────────────────

function _renderKelasGrid() {
  const el = document.getElementById('kelas-grid');
  if (!el) return;
  const d   = getD();
  const kc  = d.kelas_config || { jenjang:'SD', rombel_aktif:['A','B','C'] };
  const wk  = d.wali_kelas  || {};
  const map = getSiswaPerKelas();
  const list= getKelasList();
  const jenjang = JENJANG_CFG[kc.jenjang] || JENJANG_CFG.SD;

  if (!list.length) {
    el.innerHTML = '<div style="color:var(--t3);font-size:12px;text-align:center;padding:16px;grid-column:1/-1">Belum ada kelas. Atur jenjang dan rombel dulu.</div>';
    return;
  }

  // Kelompokkan per tingkat
  const byTingkat = {};
  jenjang.tingkat.forEach(t => { byTingkat[t] = list.filter(k => k.startsWith(`${t}-`)); });

  let html = '';
  Object.entries(byTingkat).forEach(([tingkat, kelas]) => {
    html += `<div style="grid-column:1/-1;font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.5px;padding:6px 0 2px;margin-top:4px">Tingkat ${tingkat}</div>`;
    kelas.forEach(k => {
      const count   = map[k] || 0;
      const waliGuru= wk[k] ? wk[k].nama_guru : null;
      const pct     = count > 0 ? Math.min(100, Math.round(count/40*100)) : 0;
      html += `
        <div class="kelas-card" onclick="filterCRMByKelas('${k}')">
          <div class="kelas-card-name">Kelas ${k}</div>
          <div class="kelas-card-count">${count} siswa</div>
          ${waliGuru
            ? `<div class="kelas-card-wk">👩‍🏫 ${waliGuru}</div>`
            : `<div class="kelas-card-wk" style="color:var(--t3)">Belum ada wali</div>`}
          <div style="margin-top:6px;height:3px;background:var(--bdr);border-radius:2px;overflow:hidden">
            <div style="width:${pct}%;height:100%;background:var(--cyn);border-radius:2px;transition:width .8s"></div>
          </div>
        </div>`;
    });
  });
  el.innerHTML = html;
}

// ── Wali kelas list ───────────────────────────────────────────────

function _renderWaliKelasList() {
  const el = document.getElementById('walikelas-list');
  if (!el) return;
  const d  = getD();
  const wk = d.wali_kelas || {};
  const list = getKelasList();
  const assigned = list.filter(k => wk[k]);

  if (!assigned.length) {
    el.innerHTML = '<div style="font-size:11px;color:var(--t3);text-align:center;padding:10px">Belum ada penugasan wali kelas</div>';
    return;
  }
  el.innerHTML = assigned.map(k => `
    <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--s2);border-radius:9px;border:1px solid var(--bdr2)">
      <div style="width:30px;height:30px;border-radius:8px;background:var(--cyn-bg);border:1px solid rgba(38,198,218,.25);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:var(--cyn);flex-shrink:0">
        ${k}
      </div>
      <div style="flex:1">
        <div style="font-size:12px;font-weight:700;color:var(--t1)">Kelas ${k}</div>
        <div style="font-size:10px;color:var(--t3)">👩‍🏫 ${wk[k].nama_guru}</div>
      </div>
      <button onclick="hapusWaliKelas('${k}')" style="padding:4px 8px;border-radius:6px;background:var(--red-bg);border:1px solid rgba(255,82,82,.2);color:var(--red);font-size:10px;cursor:pointer">✕</button>
    </div>`).join('');
}

// ── Statistik siswa per kelas ─────────────────────────────────────

function _renderKelasStats() {
  const el = document.getElementById('kelas-stat-list');
  if (!el) return;
  const map  = getSiswaPerKelas();
  const list = getKelasList();
  if (!list.length) { el.innerHTML = '<div style="font-size:11px;color:var(--t3);padding:8px">Belum ada kelas dikonfigurasi</div>'; return; }

  el.innerHTML = list.map(k => {
    const count = map[k] || 0;
    const lunas = (getD().data_siswa || []).filter(s => s.kelas === k && s.status_spp === 'Lunas').length;
    const pct   = count > 0 ? Math.min(100, Math.round(count/40*100)) : 0;
    return `
      <div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--bdr2)">
        <div style="font-size:11px;font-weight:700;color:var(--t1);min-width:48px">Kelas ${k}</div>
        <div style="flex:1;height:8px;background:var(--s2);border-radius:4px;overflow:hidden">
          <div style="width:${pct}%;height:100%;background:var(--cyn);border-radius:4px"></div>
        </div>
        <div style="font-size:10px;font-family:'Courier New',monospace;min-width:70px;text-align:right">
          <span style="color:var(--t1)">${count}</span><span style="color:var(--t3)"> siswa</span>
        </div>
        <div style="font-size:10px;color:var(--grn);min-width:40px;text-align:right">${lunas}✓</div>
      </div>`;
  }).join('');
}

// ── Populate selects di modal wali kelas ─────────────────────────

function _populateWaliKelasModal() {
  const kelasEl = document.getElementById('wk-kelas-sel');
  const guruEl  = document.getElementById('wk-guru-sel');
  if (!kelasEl || !guruEl) return;
  const list = getKelasList();
  const d    = getD();
  const wk   = d.wali_kelas || {};

  kelasEl.innerHTML = list.map(k =>
    `<option value="${k}">Kelas ${k}${wk[k] ? ' — ' + wk[k].nama_guru : ''}</option>`
  ).join('');

  const guru = d.keuangan_guru || [];
  guruEl.innerHTML = '<option value="">-- Pilih Guru --</option>' +
    guru.map(g => `<option value="${g.id}">${g.nama} (${g.jabatan || 'Guru'})</option>`).join('');
}

// ── Filter CRM berdasarkan kelas ──────────────────────────────────

function setJenjang(jenjang, btn) {
  document.querySelectorAll('.jenjang-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  // Simpan sementara ke state UI — belum ke DB sampai "Simpan"
  btn._pendingJenjang = jenjang;
  // Update badge preview
  const badge = document.getElementById('kelas-jenjang-badge');
  if (badge) badge.textContent = jenjang;
  // Preview grid
  _previewKelasGrid(jenjang);
}


function _previewKelasGrid(jenjang) {
  const jCfg   = JENJANG_CFG[jenjang] || JENJANG_CFG.SD;
  const rombel = _getActiveRombel();
  const list   = [];
  jCfg.tingkat.forEach(t => rombel.forEach(r => list.push(`${t}-${r}`)));

  const el = document.getElementById('kelas-grid');
  if (!el) return;
  el.innerHTML = list.map(k => `
    <div class="kelas-card" style="opacity:.7">
      <div class="kelas-card-name">Kelas ${k}</div>
      <div class="kelas-card-count">Preview</div>
    </div>`).join('');
}


function toggleRombel(rombel, btn) {
  btn.classList.toggle('on');
  // Preview grid dengan rombel terkini
  const jenjangBtn = document.querySelector('.jenjang-btn.on');
  const jenjang    = jenjangBtn ? jenjangBtn.getAttribute('data-j') : 'SD';
  _previewKelasGrid(jenjang);
}

// ── Simpan konfigurasi kelas ke localStorage ─────────────────────

function _syncKelasDropdowns() {
  const list = getKelasList();
  const opts = '<option value="">-- Pilih Kelas --</option>' +
    list.map(k => `<option value="${k}">${k}</option>`).join('');

  // Semua select yang berisi kelas
  ['crm-add-kelas','edit-siswa-kelas','jadwal-kelas-sel','wk-kelas-sel'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = opts;
  });
}

// ── Tugaskan wali kelas ───────────────────────────────────────────

Object.assign(globalThis, { renderKelas, _renderKelasGrid, _renderWaliKelasList, _renderKelasStats, _populateWaliKelasModal, setJenjang, _previewKelasGrid, toggleRombel, _syncKelasDropdowns });

export async function mount(container, modalsRoot) {
  return globalThis.mountPartial('kelas', container, modalsRoot);
}
export { renderKelas, _renderKelasGrid, _renderWaliKelasList, _renderKelasStats, _populateWaliKelasModal, setJenjang, _previewKelasGrid, toggleRombel, _syncKelasDropdowns };
