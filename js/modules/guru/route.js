// js/modules/guru/route.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

import './logic.js';
import './pipeline.js';

function setGuruFilter(val, btn) {
  guruFilter = val;
  document.querySelectorAll('#guru-page .fchip').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  renderGuru();
}

// ── Main render ──

function openJamModal(guruId) {
  const d = getD();
  const guru = d.keuangan_guru.find(g => g.id === guruId);
  if (!guru) return;
  activeJamGuruId = guruId;
  document.getElementById('jam-guru-nama').textContent = `👨‍🏫 ${guru.nama} — ${guru.jabatan}`;
  document.getElementById('jam-inp').value = guru.jam_mengajar || 0;
  document.getElementById('jam-guru-id').value = guruId;
  updateJamPreview(guru);
  openModal('modal-jam');
}


function openKasbonModal(guruId) {
  const d = getD();
  const g = d.keuangan_guru.find(x=>x.id===guruId);
  if (!g) return;
  activeGuruId = guruId;
  document.getElementById('kasbon-guru-id').value = guruId;
  const c = GURU_COLORS[d.keuangan_guru.indexOf(g) % GURU_COLORS.length];
  const infoEl = document.getElementById('kasbon-guru-info');
  if (infoEl) infoEl.innerHTML = `
    <div style="width:40px;height:40px;border-radius:50%;background:${c.bg};border:2px solid ${c.border};color:${c.text};display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;flex-shrink:0">${getInitials(g.nama)}</div>
    <div>
      <div style="font-size:13px;font-weight:900">${g.nama}</div>
      <div style="font-size:10px;color:var(--t3)">${g.jabatan}</div>
      ${(g.kasbon_list||[]).filter(k=>k.status==='aktif').length>0?`<span class="kasbon-badge">💼 Sisa kasbon: ${fmt((g.kasbon_list||[]).filter(k=>k.status==='aktif').reduce((a,k)=>a+k.jumlah_sisa,0))}</span>`:''}
    </div>`;
  const tglEl = document.getElementById('kasbon-tgl-inp'); if(tglEl) tglEl.value=new Date().toISOString().slice(0,10);
  const prevEl = document.getElementById('kasbon-preview-box'); if(prevEl) prevEl.style.display='none';
  openModal('modal-kasbon');
}


function openSlipGaji(guruId) {
  const d = getPayrollCfg();
  const g = d.keuangan_guru.find(x=>x.id===guruId);
  if (!g) return;
  activeGuruId = guruId;
  const slipEl = document.getElementById('slip-gaji-content');
  if (slipEl) slipEl.innerHTML = generateSlipHTML(g, d);
  openModal('modal-slip-gaji');
}


function openPayrollConfigModal() {
  const d = getPayrollCfg();
  const cfg = d.payroll_config;
  const set = (id,val) => { const e=document.getElementById(id); if(e)e.value=val||''; };
  set('cfg-bpjs-kes', cfg.bpjs_kes);
  set('cfg-bpjs-tk', cfg.bpjs_tk);
  set('cfg-makan', cfg.uang_makan_per_hari);
  set('cfg-transport', cfg.transport_per_hari);
  set('cfg-hari-kerja', cfg.hari_kerja_default);
}


function openPayrollArsip() {
  const d = getPayrollCfg();
  // Populate guru filter
  const guruSel = document.getElementById('arsip-filter-guru');
  if (guruSel) guruSel.innerHTML='<option value="">Semua Guru</option>'+d.keuangan_guru.map(g=>`<option value="${g.id}">${g.nama}</option>`).join('');
  // Populate tahun filter
  const tahunSel = document.getElementById('arsip-filter-tahun');
  if (tahunSel) {
    const tahunSet = new Set((d.arsip_gaji||[]).map(a=>new Date(a.tgl_bayar).getFullYear()));
    tahunSel.innerHTML='<option value="">Semua Tahun</option>'+[...tahunSet].sort((a,b)=>b-a).map(y=>`<option value="${y}">${y}</option>`).join('');
  }
  renderArsipGaji();
  openModal('modal-arsip-gaji');
}


function renderArsipGaji() {
  const d = getPayrollCfg();
  const guruFilter = (document.getElementById('arsip-filter-guru')||{value:''}).value;
  const tahunFilter = (document.getElementById('arsip-filter-tahun')||{value:''}).value;
  let list = d.arsip_gaji||[];
  if (guruFilter) list = list.filter(a=>a.guru_id===guruFilter);
  if (tahunFilter) list = list.filter(a=>String(new Date(a.tgl_bayar).getFullYear())===tahunFilter);
  list = list.slice().sort((a,b)=>new Date(b.tgl_bayar)-new Date(a.tgl_bayar));
  const grandTotal = list.reduce((s,a)=>s+(a.netto||0),0);
  const cntEl = document.getElementById('arsip-count'); if(cntEl) cntEl.textContent=list.length;
  const gtEl = document.getElementById('arsip-grand-total'); if(gtEl) gtEl.textContent=fmt(grandTotal);
  const el = document.getElementById('arsip-gaji-list');
  if (!el) return;
  if (!list.length) { el.innerHTML='<div class="empty-state" style="padding:24px"><span>📭</span><span style="font-size:12px;color:var(--t3)">Belum ada arsip gaji</span></div>'; return; }
  el.innerHTML=`<table class="arsip-tbl">
    <thead><tr><th>Nama Guru</th><th>Bulan</th><th>Bruto</th><th>Potongan</th><th>Net</th><th>Status</th></tr></thead>
    <tbody>${list.map(a=>`<tr>
      <td style="font-weight:700">${a.nama}</td>
      <td style="color:var(--t3)">${a.bulan}</td>
      <td style="font-family:'Courier New',monospace">${fmt(a.bruto||0)}</td>
      <td style="font-family:'Courier New',monospace;color:var(--red)">-${fmt(a.totalPotongan||0)}</td>
      <td style="font-family:'Courier New',monospace;color:var(--grn);font-weight:900">${fmt(a.netto||0)}</td>
      <td><span class="bdg bdg-g">Lunas</span></td>
    </tr>`).join('')}</tbody>
  </table>`;
}


function openGuruDetail(guruId) {
  const d = getPayrollCfg();
  const g = d.keuangan_guru.find(x=>x.id===guruId);
  if (!g) return;
  activeGuruId = guruId;
  document.getElementById('guru-detail-id').value = guruId;
  document.getElementById('guru-detail-title').textContent = g.nama;
  renderGuruDetailHeader(g, d);
  renderGuruTabProfil(g);
  renderGuruTabKomponen(g, d);
  renderGuruTabKasbon(g);
  renderGuruTabHistory(g);
  // Reset to profil tab
  document.querySelectorAll('#modal-guru-detail .mtab-btn').forEach(b=>b.classList.remove('on'));
  document.querySelectorAll('#modal-guru-detail .modal-tab-pane').forEach(p=>p.classList.remove('on'));
  document.querySelectorAll('#modal-guru-detail .mtab-btn')[0].classList.add('on');
  document.getElementById('guru-tab-profil').classList.add('on');
  openModal('modal-guru-detail');
}


function renderGuruDetailHeader(g, d) {
  const h = hitungGaji(g, getHariHadirGuru(g));
  const i = d.keuangan_guru.indexOf(g);
  const c = GURU_COLORS[i%GURU_COLORS.length];
  document.getElementById('guru-detail-profil-header').innerHTML=`
    <div style="display:flex;align-items:center;gap:14px">
      <div style="width:56px;height:56px;border-radius:50%;background:${c.bg};border:3px solid ${c.border};color:${c.text};display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;flex-shrink:0">${getInitials(g.nama)}</div>
      <div style="flex:1">
        <div style="font-size:16px;font-weight:900;color:var(--t1)">${g.nama}</div>
        <div style="font-size:11px;color:var(--t2);margin-top:2px">${g.jabatan}</div>
        <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">
          <span class="payroll-status-badge ${g.sudah_dibayar?'payroll-status-lunas':'payroll-status-belum'}">${g.sudah_dibayar?'✅ Sudah Transfer':'⏳ Belum Dibayar'}</span>
          ${(g.kasbon_list||[]).some(k=>k.status==='aktif')?`<span class="kasbon-badge">💼 Ada Kasbon</span>`:''}
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:10px;color:var(--t3)">Take-Home</div>
        <div style="font-size:20px;font-weight:900;color:var(--pur);font-family:'Courier New',monospace">${fmt(h.netto)}</div>
      </div>
    </div>`;
}


function renderGuruTabProfil(g) {
  const rows=[['No. Rekening',g.no_rekening||'—'],['No. BPJS',g.no_bpjs||'—'],['Jam Mengajar',`${g.jam_mengajar||0} jam/bulan`],['Hari Hadir',`${g.hari_hadir||'(default)'} hari`],['No. HP',g.hp_guru||'—']];
  document.getElementById('guru-tab-profil').innerHTML=`
    <div style="display:flex;flex-direction:column;gap:0;margin-bottom:12px">
      ${rows.map(([l,v])=>`<div style="display:flex;padding:9px 0;border-bottom:1px solid var(--bdr);gap:10px"><span style="font-size:11px;color:var(--t3);min-width:110px;flex-shrink:0">${l}</span><span style="font-size:12px;font-weight:600">${v}</span></div>`).join('')}
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      <button class="abtn abtn-b" style="flex:1;padding:10px" onclick="editGuruFromDetail('${g.id}')">✏️ Edit Data</button>
      <button class="abtn abtn-g" style="flex:1;padding:10px" onclick="closeModal('modal-guru-detail');openSlipGaji('${g.id}')">🧾 Slip Gaji</button>
      <button class="abtn abtn-r" style="padding:10px 14px" onclick="closeModal('modal-guru-detail');hapusGuru('${g.id}')">🗑️</button>
    </div>`;
}


function renderGuruTabKomponen(g, d) {
  const h = hitungGaji(g, getHariHadirGuru(g));
  const penghasilan=[['Gaji Pokok',h.gajiPokok,true],['Honor Jam',h.honorJam,true],['Tunjangan',h.tunjangan,true],['Uang Makan',h.uangMakan,true],['Transport',h.transport,true],['Insentif',h.insentif,true],['BPJS Kesehatan',h.bpjsKes,false],['BPJS Ketenagakerjaan',h.bpjsTK,false],['Kasbon Potong',h.kasbonPotong,false],['Potongan Lain',h.potonganLain,false]].filter(([,v])=>v>0);
  document.getElementById('guru-tab-komponen').innerHTML=`
    ${penghasilan.map(([l,v,plus])=>`<div class="payroll-line ${plus?'plus':'minus'}"><span class="payroll-line-lbl">${l}</span><span class="payroll-line-val">${plus?'+':'-'}${fmt(v)}</span></div>`).join('')}
    <div class="payroll-line total-line" style="border-top:2px solid var(--bdr);margin-top:6px;padding-top:8px">
      <span class="payroll-line-lbl">TAKE-HOME PAY</span><span class="payroll-line-val" style="font-size:18px;color:var(--pur)">${fmt(h.netto)}</span>
    </div>
    <div style="margin-top:12px;display:flex;gap:6px">
      <button class="abtn abtn-b" style="flex:1;padding:10px;font-size:11px" onclick="closeModal('modal-guru-detail');openModal('modal-guru');editGuruFromDetail('${g.id}')">✏️ Edit Komponen</button>
      <button class="abtn abtn-a" style="flex:1;padding:10px;font-size:11px" onclick="closeModal('modal-guru-detail');openKasbonModal('${g.id}')">💼 Input Kasbon</button>
    </div>`;
}


function renderGuruTabKasbon(g) {
  const kasbons = g.kasbon_list||[];
  const el = document.getElementById('guru-tab-kasbon');
  if (!kasbons.length) { el.innerHTML='<div class="empty-state" style="padding:20px"><span>✅</span><span style="font-size:11px;color:var(--t3)">Tidak ada kasbon aktif</span></div>'; return; }
  el.innerHTML=kasbons.map(k=>`
    <div style="display:flex;align-items:start;gap:10px;padding:10px 0;border-bottom:1px solid var(--bdr)">
      <div style="width:10px;height:10px;border-radius:50%;background:${k.status==='aktif'?'var(--yel)':'var(--grn)'};margin-top:2px;flex-shrink:0"></div>
      <div style="flex:1">
        <div style="font-size:12px;font-weight:700">${k.keterangan||'Kasbon'} <span class="bdg ${k.status==='aktif'?'bdg-am':'bdg-g'}">${k.status}</span></div>
        <div style="font-size:10px;color:var(--t3);margin-top:2px">${new Date(k.tgl_input).toLocaleDateString('id-ID',{dateStyle:'medium'})}</div>
        <div style="font-size:11px;margin-top:4px">
          Total: <b style="font-family:'Courier New',monospace">${fmt(k.jumlah)}</b> · 
          Sisa: <b style="color:${k.status==='aktif'?'var(--yel)':'var(--grn)'};font-family:'Courier New',monospace">${fmt(k.jumlah_sisa)}</b> · 
          Cicil: <b>${fmt(k.cicilan_per_bulan)}/bln</b>
        </div>
      </div>
      ${k.status==='aktif'?`<button class="abtn abtn-g" style="padding:5px 10px;font-size:10px" onclick="lunaskanKasbon('${g.id}','${k.id}')">Lunas</button>`:''}
    </div>`).join('');
}


function renderGuruTabHistory(g) {
  const arsip = (g.arsip_gaji||[]).slice().reverse();
  const el = document.getElementById('guru-tab-history');
  if (!arsip.length) { el.innerHTML='<div class="empty-state" style="padding:20px"><span>📋</span><span style="font-size:11px;color:var(--t3)">Belum ada riwayat pembayaran</span></div>'; return; }
  el.innerHTML=arsip.map(a=>`
    <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--bdr)">
      <div style="font-size:11px;color:var(--t3);min-width:80px">${a.bulan}</div>
      <div style="flex:1">
        <div style="font-size:11px;color:var(--t3)">Bruto ${fmt(a.bruto||0)} − Potong ${fmt(a.totalPotongan||0)}</div>
      </div>
      <div style="font-size:13px;font-weight:900;color:var(--grn);font-family:'Courier New',monospace">${fmt(a.netto||0)}</div>
      <span class="bdg bdg-g">Lunas</span>
    </div>`).join('');
}


function switchGuruTab(tab, btn) {
  document.querySelectorAll('#modal-guru-detail .mtab-btn').forEach(b=>b.classList.remove('on'));
  document.querySelectorAll('#modal-guru-detail .modal-tab-pane').forEach(p=>p.classList.remove('on'));
  btn.classList.add('on');
  document.getElementById('guru-tab-'+tab).classList.add('on');
}

// ── Dana BOS ──

Object.assign(globalThis, { setGuruFilter, openJamModal, openKasbonModal, openSlipGaji, openPayrollConfigModal, openPayrollArsip, renderArsipGaji, openGuruDetail, renderGuruDetailHeader, renderGuruTabProfil, renderGuruTabKomponen, renderGuruTabKasbon, renderGuruTabHistory, switchGuruTab });

export async function mount(container, modalsRoot) {
  return globalThis.mountPartial('guru', container, modalsRoot);
}
export { setGuruFilter, openJamModal, openKasbonModal, openSlipGaji, openPayrollConfigModal, openPayrollArsip, renderArsipGaji, openGuruDetail, renderGuruDetailHeader, renderGuruTabProfil, renderGuruTabKomponen, renderGuruTabKasbon, renderGuruTabHistory, switchGuruTab };
