// js/modules/akademik/route.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

import './logic.js';
import './pipeline.js';

function buildNextKelas(kelasStr) {
  const num = getKelasNum(kelasStr);
  const rombel = getRombel(kelasStr);
  return `${num + 1}${rombel}`;
}


function renderAkademik() {
  const d = getAkademikCfg();
  const cfg = d.akademik_config;
  const siswa = d.data_siswa;
  // Use dynamic tingkat_kelas from logic_kenaikan (user JSON schema)
  const tingkatKelas = (cfg.logic_kenaikan && cfg.logic_kenaikan.tingkat_kelas) || [1,2,3,4,5,6];
  const kelasMax = cfg.kelas_max || Math.max(...tingkatKelas);
  const statusPilihan = (cfg.logic_kenaikan && cfg.logic_kenaikan.status_pilihan) || ['Aktif','Lulus','Pindah','Keluar'];

  // Hero stats
  const el_ta = document.getElementById('akd-ta-display');
  const el_sem = document.getElementById('akd-sem-display');
  if (el_ta) el_ta.textContent = cfg.tahun_ajaran_aktif || '—';
  if (el_sem) el_sem.textContent = 'Semester ' + (cfg.semester || 'Ganjil');

  const aktif = siswa.filter(s => !s.status_akademik || s.status_akademik === 'Aktif');
  const lulus = siswa.filter(s => s.status_akademik === 'Lulus');
  const pindah = siswa.filter(s => s.status_akademik === 'Pindah');
  const keluar = siswa.filter(s => s.status_akademik === 'Keluar');
  const kelasSet = new Set(aktif.map(s => s.kelas).filter(Boolean));

  const el_meta1 = document.getElementById('akd-total-siswa-aktif');
  const el_meta2 = document.getElementById('akd-total-kelas');
  const el_meta3 = document.getElementById('akd-update-time');
  if (el_meta1) el_meta1.textContent = `${aktif.length} Siswa Aktif`;
  if (el_meta2) el_meta2.textContent = `${kelasSet.size} Kelas`;
  if (el_meta3) el_meta3.textContent = `Update: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'medium' })}`;

  // Status counts
  ['aktif','lulus','pindah','keluar'].forEach(k => {
    const el = document.getElementById(`akd-s-${k}`);
    if (el) el.textContent = { aktif: aktif.length, lulus: lulus.length, pindah: pindah.length, keluar: keluar.length }[k];
  });

  // Kelas grid — uses tingkatKelas from logic_kenaikan
  const kelasGrid = document.getElementById('akd-kelas-grid');
  if (kelasGrid) {
    const kelasData = {};
    tingkatKelas.forEach(i => {
      kelasData[i] = aktif.filter(s => getKelasNum(s.kelas) === i).length;
    });
    kelasGrid.innerHTML = Object.entries(kelasData).map(([k, count]) => {
      const isMax = parseInt(k) === kelasMax;
      return `<div class="akd-kelas-card ${isMax ? 'kelas-lulus' : ''}" onclick="filterByKelas(${k})">
        <div class="akd-kelas-num">${k}</div>
        <div class="akd-kelas-lbl">Kelas ${k}${isMax ? ' (Lulus)' : ''}</div>
        <div class="akd-kelas-siswa">${count} siswa</div>
        ${isMax ? '<div style="font-size:8px;color:var(--pur);margin-top:4px;font-weight:700">→ AKAN LULUS</div>' : ''}
      </div>`;
    }).join('');
  }

  // Kenaikan preview
  renderNaikPreview();

  // Arsip
  renderArsipList();

  // Log akademik
  renderLogAkademik();
}


function renderNaikPreview() {
  const d = getAkademikCfg();
  const cfg = d.akademik_config;
  const tingkatKelas = (cfg.logic_kenaikan && cfg.logic_kenaikan.tingkat_kelas) || [1,2,3,4,5,6];
  const kelasMax = cfg.kelas_max || Math.max(...tingkatKelas);
  const aktif = d.data_siswa.filter(s => !s.status_akademik || s.status_akademik === 'Aktif');

  const summary = {};
  tingkatKelas.forEach(i => {
    const count = aktif.filter(s => getKelasNum(s.kelas) === i).length;
    summary[i] = count;
  });

  const el = document.getElementById('akd-naik-preview');
  if (!el) return;

  const arrows = Object.entries(summary).map(([k, count]) => {
    const num = parseInt(k);
    const isMax = num === kelasMax;
    const arrowColor = isMax ? 'var(--pur)' : 'var(--grn)';
    const dest = isMax ? '🎓 Lulus' : `Kelas ${num + 1}`;
    return `<div style="display:flex;align-items:center;gap:4px;font-size:11px">
      <span style="font-weight:700;color:${arrowColor}">Kelas ${num}</span>
      <span style="color:var(--t3);font-size:10px">(${count})</span>
      <span style="color:${arrowColor}">→</span>
      <span style="font-weight:700;color:${arrowColor}">${dest}</span>
    </div>`;
  }).join('');

  const totalLulus = summary[kelasMax] || 0;
  const totalNaik = aktif.length - totalLulus;
  el.innerHTML = `<div style="flex:1;display:flex;flex-wrap:wrap;gap:8px">${arrows}</div>
    <div style="text-align:right;flex-shrink:0;font-size:11px;color:var(--t3)">
      <b style="color:var(--grn)">${totalNaik}</b> naik kelas<br/>
      <b style="color:var(--pur)">${totalLulus}</b> lulus
    </div>`;
}


function renderMutasiList() {
  const d = getD();
  const q = (document.getElementById('mutasi-search') || { value: '' }).value.toLowerCase().trim();
  const el = document.getElementById('mutasi-list');
  if (!el) return;
  if (!q) {
    el.innerHTML = '<div style="text-align:center;color:var(--t3);padding:20px;font-size:11px">Ketik nama untuk mencari siswa</div>';
    return;
  }
  const found = d.data_siswa.filter(s => (s.nama || '').toLowerCase().includes(q)).slice(0, 15);
  if (!found.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--t3);padding:20px;font-size:11px">Tidak ditemukan</div>';
    return;
  }
  const STATUS_STYLE = {
    Aktif: { c: 'var(--grn)', bg: 'var(--grn-bg)' },
    Lulus: { c: 'var(--pur)', bg: 'var(--pur-bg)' },
    Pindah: { c: 'var(--yel)', bg: 'var(--yel-bg)' },
    Keluar: { c: 'var(--red)', bg: 'var(--red-bg)' },
  };
  el.innerHTML = found.map(s => {
    const status = s.status_akademik || 'Aktif';
    const st = STATUS_STYLE[status] || STATUS_STYLE.Aktif;
    const col = getAvatarColor(s);
    return `<div class="mutasi-item">
      <div class="mutasi-avatar" style="background:${col.bg};border-color:${col.border};color:${col.text}">${getInitials(s.nama)}</div>
      <div class="mutasi-info">
        <div class="mutasi-nama">${s.nama}</div>
        <div class="mutasi-meta">Kelas ${s.kelas || '—'} · ${s.nisn || 'No NISN'}</div>
        <span class="bdg" style="background:${st.bg};color:${st.c}">${status}</span>
        ${s.mutasi_alasan ? `<span style="font-size:9px;color:var(--t3);margin-left:4px">${s.mutasi_alasan}</span>` : ''}
      </div>
      <button class="abtn" style="padding:6px 10px;font-size:10px;background:var(--s2);color:var(--t2);border:1px solid var(--bdr2)" onclick="openMutasiModal('${s.id}')">✏️ Mutasi</button>
    </div>`;
  }).join('');
}


function renderArsipList() {
  const d = getAkademikCfg();
  const arsip = d.akademik_config.history_ta || [];
  const el = document.getElementById('akd-arsip-list');
  const cnt = document.getElementById('akd-arsip-count');
  if (cnt) cnt.textContent = `${arsip.length} arsip`;
  if (!el) return;
  if (!arsip.length) {
    el.innerHTML = '<div class="empty-state" style="padding:24px"><span class="empty-icon">🗂️</span><span class="empty-text">Belum ada arsip tahun ajaran sebelumnya</span></div>';
    return;
  }
  el.innerHTML = arsip.slice().reverse().map(ar => `
    <div class="arsip-item">
      <div class="arsip-ta">${ar.tahun_ajaran}</div>
      <div class="arsip-info">
        <div class="arsip-title">${ar.nama_sekolah || 'SD Islam Sahara'} · Semester ${ar.semester || '—'}</div>
        <div class="arsip-meta">
          ${ar.total_siswa || 0} siswa terdaftar ·
          ${ar.total_lulus || 0} lulus ·
          SPP ${fmtShort(ar.total_spp || 0)} ·
          Diarsip: ${new Date(ar.waktu_arsip).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
        </div>
      </div>
      <button class="abtn abtn-b" style="padding:6px 10px;font-size:10px;flex-shrink:0" onclick="lihatArsipTA('${ar.tahun_ajaran}')">👁️ Lihat</button>
    </div>`).join('');
}


function renderLogAkademik() {
  const d = getAkademikCfg();
  const logs = d.akademik_config.log_akademik || [];
  const el = document.getElementById('akd-log-list');
  if (!el) return;
  if (!logs.length) {
    el.innerHTML = '<div class="empty-state" style="padding:20px"><span>📭</span><span style="font-size:11px;color:var(--t3)">Belum ada aktivitas akademik</span></div>';
    return;
  }
  const COLOR_MAP = {
    kenaikan: 'var(--grn)', mutasi: 'var(--yel)', config: 'var(--cyn)',
    arsip: 'var(--pur)', reset: 'var(--red)', siswa_baru: 'var(--blu)'
  };
  const ICON_MAP = {
    kenaikan: '🔁', mutasi: '🚌', config: '⚙️',
    arsip: '🗄️', reset: '🔄', siswa_baru: '🆕'
  };
  el.innerHTML = '<div class="akd-timeline">' + logs.slice(0, 20).map(log => {
    const color = COLOR_MAP[log.tipe] || 'var(--t2)';
    const icon = ICON_MAP[log.tipe] || '📝';
    return `<div class="akd-tl-item">
      <div class="akd-tl-dot" style="background:${color}15;border-color:${color}">${icon}</div>
      <div class="akd-tl-body">
        <div class="akd-tl-title">${log.keterangan}</div>
        <div class="akd-tl-meta">${new Date(log.waktu).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })} · T.A. ${log.ta || '—'}</div>
        <span class="akd-tl-badge" style="background:${color}15;color:${color}">${log.tipe.toUpperCase()}</span>
      </div>
    </div>`;
  }).join('') + '</div>';
}

// ── KONFIGURASI T.A. ──────────────────

function openKonfigAkademik() {
  const d = getAkademikCfg();
  const cfg = d.akademik_config;
  const ta = document.getElementById('akd-ta-inp');
  const sem = document.getElementById('akd-sem-inp');
  const kmax = document.getElementById('akd-kelas-max-inp');
  if (ta) ta.value = cfg.tahun_ajaran_aktif || '';
  if (sem) sem.value = cfg.semester || 'Ganjil';
  if (kmax) kmax.value = String(cfg.kelas_max || 6);
}


function openKenaikanKonfirmasi() {
  const d = getAkademikCfg();
  const cfg = d.akademik_config;
  const tingkatKelas = (cfg.logic_kenaikan && cfg.logic_kenaikan.tingkat_kelas) || [1,2,3,4,5,6];
  const kelasMax = cfg.kelas_max || Math.max(...tingkatKelas);
  const aktif = d.data_siswa.filter(s => !s.status_akademik || s.status_akademik === 'Aktif');

  // Reset konfirmasi state
  konfirmasiState = { step1: false, step2: false };
  ['1','2'].forEach(i => {
    const item = document.getElementById(`cs-item-${i}`);
    const num = document.getElementById(`cs-num-${i}`);
    const check = document.getElementById(`cs-check-${i}`);
    if (item) item.classList.remove('done');
    if (num) { num.textContent = i; num.style.background = 'var(--bdr2)'; num.style.color = 'var(--t3)'; }
    if (check) check.style.opacity = '0';
  });

  // Reset text input
  const inp = document.getElementById('knf-text-input');
  if (inp) inp.value = '';
  updateKonfirmasiBtn();

  // Update jumlah siswa
  const jmlEl = document.getElementById('knf-jumlah-siswa');
  if (jmlEl) jmlEl.textContent = `${aktif.length} siswa aktif`;

  // Build preview changes using tingkatKelas from logic_kenaikan
  const summary = {};
  tingkatKelas.forEach(i => {
    const kelasAktif = aktif.filter(s => getKelasNum(s.kelas) === i);
    if (kelasAktif.length > 0) summary[i] = kelasAktif.length;
  });

  const prevEl = document.getElementById('knf-preview');
  if (prevEl) {
    prevEl.innerHTML = Object.entries(summary).map(([k, count]) => {
      const num = parseInt(k);
      const isMax = num === kelasMax;
      const color = isMax ? 'var(--pur)' : 'var(--grn)';
      const dest = isMax ? `🎓 Lulus & Masuk Alumni` : `Kelas ${num + 1}`;
      return `<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 10px;border-radius:8px;background:var(--s2);margin-bottom:4px">
        <div style="font-size:12px"><b style="color:${color}">Kelas ${num}</b> <span style="color:var(--t3)">(${count} siswa)</span></div>
        <div style="font-size:11px;font-weight:700;color:${color}">→ ${dest}</div>
      </div>`;
    }).join('');
  }

  openModal('modal-akd-kenaikan');
}


function openMutasiModal(siswaId) {
  const d = getD();
  const s = d.data_siswa.find(x => x.id === siswaId);
  if (!s) return;

  document.getElementById('mutasi-siswa-id').value = siswaId;

  // Siswa info header
  const c = getAvatarColor(s);
  const infoEl = document.getElementById('mutasi-modal-siswa-info');
  if (infoEl) {
    infoEl.innerHTML = `
      <div style="width:44px;height:44px;border-radius:50%;background:${c.bg};border:2px solid ${c.border};color:${c.text};display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;flex-shrink:0">${getInitials(s.nama)}</div>
      <div>
        <div style="font-size:14px;font-weight:900">${s.nama}</div>
        <div style="font-size:11px;color:var(--t3)">Kelas ${s.kelas || '—'} · ${s.nisn || 'No NISN'}</div>
        <span class="bdg ${s.status_akademik === 'Aktif' || !s.status_akademik ? 'bdg-g' : 'bdg-r'}">${s.status_akademik || 'Aktif'}</span>
      </div>`;
  }

  const statusSel = document.getElementById('mutasi-status-sel');
  if (statusSel) statusSel.value = s.status_akademik || 'Aktif';

  const tglInp = document.getElementById('mutasi-tgl-inp');
  if (tglInp) tglInp.value = new Date().toISOString().slice(0, 10);

  const alasanInp = document.getElementById('mutasi-alasan-inp');
  if (alasanInp) alasanInp.value = s.mutasi_alasan || '';

  const tujuanInp = document.getElementById('mutasi-tujuan-inp');
  if (tujuanInp) tujuanInp.value = s.mutasi_tujuan || '';

  toggleMutasiAlasan();
  openModal('modal-mutasi');
}


function toggleMutasiAlasan() {
  const status = (document.getElementById('mutasi-status-sel') || { value: 'Aktif' }).value;
  const alasanWrap = document.getElementById('mutasi-alasan-wrap');
  const tujuanWrap = document.getElementById('mutasi-tujuan-wrap');
  if (alasanWrap) alasanWrap.style.display = status !== 'Aktif' ? 'flex' : 'none';
  if (tujuanWrap) tujuanWrap.style.display = status === 'Pindah' ? 'flex' : 'none';
}


Object.assign(globalThis, { buildNextKelas, renderAkademik, renderNaikPreview, renderMutasiList, renderArsipList, renderLogAkademik, openKonfigAkademik, openKenaikanKonfirmasi, openMutasiModal, toggleMutasiAlasan });

export async function mount(container, modalsRoot) {
  return globalThis.mountPartial('akademik', container, modalsRoot);
}
export { buildNextKelas, renderAkademik, renderNaikPreview, renderMutasiList, renderArsipList, renderLogAkademik, openKonfigAkademik, openKenaikanKonfirmasi, openMutasiModal, toggleMutasiAlasan };
