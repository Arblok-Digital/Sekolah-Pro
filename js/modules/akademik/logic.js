// js/modules/akademik/logic.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

function getAkademikCfg() {
  const d = getD();
  if (!d.akademik_config) {
    // Init from DEFAULT_DATA structure, incorporating user JSON schema
    d.akademik_config = {
      tahun_ajaran_aktif: d.profil_sekolah.tahun_ajaran || '2025/2026',
      semester: 'Ganjil',
      kelas_max: 6,
      logic_kenaikan: {
        status_pilihan: ['Aktif', 'Lulus', 'Pindah', 'Keluar'],
        tingkat_kelas: [1, 2, 3, 4, 5, 6]
      },
      history_ta: [],
      log_akademik: [],
      mutasi_log: [],
      spp_arsip: {},
      history_alumni: []
    };
  }
  // Ensure all sub-keys exist (safe migration for existing data)
  const cfg = d.akademik_config;
  if (!cfg.logic_kenaikan) cfg.logic_kenaikan = { status_pilihan: ['Aktif','Lulus','Pindah','Keluar'], tingkat_kelas: [1,2,3,4,5,6] };
  if (!cfg.history_ta) cfg.history_ta = [];
  if (!cfg.log_akademik) cfg.log_akademik = [];
  if (!cfg.mutasi_log) cfg.mutasi_log = [];
  if (!cfg.spp_arsip) cfg.spp_arsip = {};
  if (!cfg.history_alumni) cfg.history_alumni = [];
  if (!cfg.kelas_max) cfg.kelas_max = 6;
  // Sync tahun ajaran to profil_sekolah if set
  if (cfg.tahun_ajaran_aktif && !d.profil_sekolah.tahun_ajaran) {
    d.profil_sekolah.tahun_ajaran = cfg.tahun_ajaran_aktif;
  }
  return d;
}


function getKelasNum(kelasStr) {
  // Extract numeric level from "1A", "2B", etc.
  const m = String(kelasStr || '').match(/^(\d+)/);
  return m ? parseInt(m[1]) : 0;
}

function getRombel(kelasStr) {
  // Extract rombel suffix: "1A" → "A"
  return String(kelasStr || '').replace(/^\d+/, '') || 'A';
}

function filterByKelas(k) {
  switchPage('crm');
  setTimeout(() => {
    const fchip = document.querySelector(`#crm-filter-chips .fchip[onclick*="'${k}'"]`);
    if (fchip) { crmFilter = String(k); fchip.click(); }
  }, 200);
}


globalThis.konfirmasiState = { step1: false, step2: false };


function konfirmasiLangkah(step) {
  if (step === 1) {
    konfirmasiState.step1 = !konfirmasiState.step1;
    const item = document.getElementById('cs-item-1');
    const num = document.getElementById('cs-num-1');
    const check = document.getElementById('cs-check-1');
    if (item) item.classList.toggle('done', konfirmasiState.step1);
    if (num) { num.style.background = konfirmasiState.step1 ? 'var(--grn)' : 'var(--bdr2)'; num.style.color = konfirmasiState.step1 ? '#000' : 'var(--t3)'; }
    if (check) check.style.opacity = konfirmasiState.step1 ? '1' : '0';
  } else if (step === 2) {
    konfirmasiState.step2 = !konfirmasiState.step2;
    const item = document.getElementById('cs-item-2');
    const num = document.getElementById('cs-num-2');
    const check = document.getElementById('cs-check-2');
    if (item) item.classList.toggle('done', konfirmasiState.step2);
    if (num) { num.style.background = konfirmasiState.step2 ? 'var(--grn)' : 'var(--bdr2)'; num.style.color = konfirmasiState.step2 ? '#000' : 'var(--t3)'; }
    if (check) check.style.opacity = konfirmasiState.step2 ? '1' : '0';
  }
  updateKonfirmasiBtn();
}


function cekKonfirmasiText() {
  updateKonfirmasiBtn();
}


function updateKonfirmasiBtn() {
  const inp = document.getElementById('knf-text-input');
  const btn = document.getElementById('knf-execute-btn');
  if (!btn) return;
  const textOk = inp && inp.value.trim().toUpperCase() === 'NAIK KELAS';
  const allOk = konfirmasiState.step1 && konfirmasiState.step2 && textOk;
  btn.disabled = !allOk;
  btn.style.background = allOk ? 'linear-gradient(135deg,var(--grn2),var(--grn))' : 'var(--s2)';
  btn.style.color = allOk ? '#000' : 'var(--t3)';
  btn.style.cursor = allOk ? 'pointer' : 'not-allowed';
  btn.textContent = allOk ? '🚀 Proses Kenaikan Kelas' : '🔒 Proses Kenaikan Kelas';
}


function lihatArsipTA(tahunAjaran) {
  const d = getAkademikCfg();
  const ar = (d.akademik_config.history_ta || []).find(x => x.tahun_ajaran === tahunAjaran);
  if (!ar) { showNotif('Arsip tidak ditemukan!', 'err'); return; }

  const sppArsip = (d.akademik_config.spp_arsip || {})[tahunAjaran];
  const totalSPP = sppArsip ? sppArsip.total_masuk : ar.total_spp || 0;

  const el = document.getElementById('print-modal-content');
  const titleEl = document.getElementById('print-modal-title');
  if (titleEl) titleEl.textContent = `🗄️ Arsip T.A. ${tahunAjaran}`;
  if (el) {
    el.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px">
        <div style="text-align:center;background:var(--cyn-bg);border:1px solid rgba(38,198,218,.2);border-radius:9px;padding:10px">
          <div style="font-size:20px;font-weight:900;color:var(--cyn)">${ar.total_siswa || 0}</div>
          <div style="font-size:9px;color:var(--t3);font-weight:700">TOTAL SISWA</div>
        </div>
        <div style="text-align:center;background:var(--pur-bg);border:1px solid rgba(192,132,252,.2);border-radius:9px;padding:10px">
          <div style="font-size:20px;font-weight:900;color:var(--pur)">${ar.total_lulus || 0}</div>
          <div style="font-size:9px;color:var(--t3);font-weight:700">LULUS</div>
        </div>
        <div style="text-align:center;background:var(--grn-bg);border:1px solid rgba(0,230,118,.2);border-radius:9px;padding:10px">
          <div style="font-size:16px;font-weight:900;color:var(--grn)">${fmt(totalSPP)}</div>
          <div style="font-size:9px;color:var(--t3);font-weight:700">TOTAL SPP</div>
        </div>
      </div>
      <div style="font-size:12px;color:var(--t2);padding:10px;background:var(--s2);border-radius:9px;line-height:1.8">
        <b>Tahun Ajaran:</b> ${ar.tahun_ajaran}<br/>
        <b>Semester:</b> ${ar.semester || '—'}<br/>
        <b>Sekolah:</b> ${ar.nama_sekolah || '—'}<br/>
        <b>Siswa Naik Kelas:</b> ${ar.total_naik || 0}<br/>
        <b>Diarsip pada:</b> ${new Date(ar.waktu_arsip).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}<br/>
        ${ar.alumni && ar.alumni.length ? `<b>Alumni dari arsip ini:</b> ${ar.alumni.join(', ')}` : ''}
      </div>`;
    window._csvData = [ar];
    window._csvTitle = `arsip_ta_${tahunAjaran.replace('/', '-')}`;
  }
  openModal('modal-print');
}

// ══════════════════════════════════════
//  SMART IMPORT MODULE
//  CSV/Excel → Auto Mapping → Validate → Import
//  Copyright © 2026 Arblok Digital. All Rights Reserved.
// ══════════════════════════════════════


Object.assign(globalThis, { getAkademikCfg, getKelasNum, getRombel, filterByKelas, konfirmasiLangkah, cekKonfirmasiText, updateKonfirmasiBtn, lihatArsipTA });
export { getAkademikCfg, getKelasNum, getRombel, filterByKelas, konfirmasiLangkah, cekKonfirmasiText, updateKonfirmasiBtn, lihatArsipTA };
