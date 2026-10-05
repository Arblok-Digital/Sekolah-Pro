// js/modules/crm/route.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

import './logic.js';
import './pipeline.js';

function renderCRM() {
  const d = getD();
  const search = (document.getElementById('crm-search')||{value:''}).value.toLowerCase();
  let list = d.data_siswa.filter(s => {
    if (crmFilter==='lunas') return s.status_spp==='Lunas';
    if (crmFilter==='tunggakan') return s.status_spp==='Tunggakan';
    if (['1','2','3','4','5','6'].includes(crmFilter)) return (s.kelas||'').startsWith(crmFilter);
    return true;
  }).filter(s => !search || (s.nama||'').toLowerCase().includes(search) || (s.nisn||'').includes(search) || (s.ayah||'').toLowerCase().includes(search) || (s.ibu||'').toLowerCase().includes(search));

  document.getElementById('crm-stat-total').textContent = d.data_siswa.length;
  document.getElementById('crm-stat-lunas').textContent = d.data_siswa.filter(s=>s.status_spp==='Lunas').length;
  document.getElementById('crm-stat-piutang').textContent = d.data_siswa.filter(s=>s.total_piutang>0).length;
  const todayStr = new Date().toISOString().slice(0,10);
  document.getElementById('crm-stat-hadir').textContent = d.data_siswa.filter(s=>(s.absensi||{})[todayStr]==='H').length;

  const el = document.getElementById('crm-list');
  if (!list.length) {
    el.innerHTML = `<div class="empty-state"><span class="empty-icon">👤</span><span class="empty-text">${d.data_siswa.length===0?'Belum ada data siswa':'Tidak ada siswa yang sesuai filter'}</span></div>`;
    return;
  }
  el.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px;padding:0 12px 12px">` +
    list.map(s => {
      const c = getAvatarColor(s);
      const unpaidList = (s.piutang_detail||[]).filter(p=>p.status==='unpaid');
      const totalPiutang = unpaidList.reduce((a,p)=>a+p.jumlah,0);
      const todayAbs = (s.absensi||{})[todayStr];
      const absMap = {H:'✅ Hadir',I:'📝 Izin',S:'🤒 Sakit',A:'❌ Alpha'};
      return `<div class="crm-card" onclick="openSiswaDetail('${s.id}')">
        <div class="crm-card-head">
          <div class="crm-avatar" style="background:${c.bg};border-color:${c.border};color:${c.text}">${getInitials(s.nama)}</div>
          <div class="crm-info">
            <div class="crm-nama">${s.nama}</div>
            <div class="crm-sub">
              <span>Kelas ${s.kelas||'—'}</span>
              ${s.nisn?`<span class="crm-nisn">NISN: ${s.nisn}</span>`:''}
              ${s.ayah?`<span>👨 ${s.ayah}</span>`:''}
            </div>
            <div class="crm-badge-row">
              <span class="bdg ${s.status_spp==='Lunas'?'bdg-g':'bdg-r'}">${s.status_spp||'—'}</span>
              ${totalPiutang>0?`<span class="bdg bdg-am">Piutang ${fmtShort(totalPiutang)}</span>`:''}
              ${todayAbs?`<span class="bdg bdg-b">${absMap[todayAbs]||todayAbs}</span>`:''}
            </div>
          </div>
          <div style="font-size:20px;color:var(--t3)">›</div>
        </div>
      </div>`;
    }).join('') + '</div>';
}


function setCRMFilter(val, btn) {
  crmFilter = val;
  document.querySelectorAll('#crm-filter-chips .fchip').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  renderCRM();
}


function openSiswaDetail(siswaId) {
  activeSiswaId = siswaId;
  const d = getD();
  const s = d.data_siswa.find(x=>x.id===siswaId);
  if (!s) return;
  document.getElementById('detail-modal-title').textContent = s.nama;
  renderDetailProfil(s);
  renderDetailPiutang(s);
  absYear = new Date().getFullYear();
  absMonth = new Date().getMonth();
  document.querySelectorAll('.mtab-btn').forEach(b=>b.classList.remove('on'));
  document.querySelectorAll('.modal-tab-pane').forEach(p=>p.classList.remove('on'));
  document.querySelectorAll('.mtab-btn')[0].classList.add('on');
  document.getElementById('tab-profil').classList.add('on');
  openModal('modal-crm-detail');
}


function renderDetailProfil(s) {
  const c = getAvatarColor(s);
  document.getElementById('detail-profil-header').innerHTML = `
    <div class="profil-avatar-big" style="background:${c.bg};border-color:${c.border};color:${c.text}">${getInitials(s.nama)}</div>
    <div class="profil-info">
      <div class="profil-nama">${s.nama}</div>
      <div class="profil-sub">Kelas ${s.kelas||'—'} · ${s.jk==='P'?'👧 Perempuan':'👦 Laki-laki'}</div>
      ${s.nisn?`<div class="profil-nisn">NISN: ${s.nisn}</div>`:''}
      <div style="margin-top:6px;display:flex;gap:5px;flex-wrap:wrap">
        <span class="bdg ${s.status_spp==='Lunas'?'bdg-g':'bdg-r'}">${s.status_spp}</span>
        ${(s.piutang_detail||[]).filter(p=>p.status==='unpaid').length>0?`<span class="bdg bdg-am">${(s.piutang_detail||[]).filter(p=>p.status==='unpaid').length} tagihan belum lunas</span>`:''}
      </div>
    </div>`;
  const rows = [
    ['🎂 Tanggal Lahir', s.tgl_lahir?new Date(s.tgl_lahir).toLocaleDateString('id-ID',{dateStyle:'long'})+` (${getAgeStr(s.tgl_lahir)})`:'—'],
    ['📅 Tahun Masuk', s.tahun_masuk||'—'],
    ['👨 Nama Ayah / Wali', s.ayah||'—'],
    ['👩 Nama Ibu', s.ibu||'—'],
    ['📱 HP Orang Tua', s.hp_ortu?`<a href="tel:${s.hp_ortu}" style="color:var(--cyn)">${s.hp_ortu}</a>`:'—'],
    ['💼 Pekerjaan Ortu', s.pekerjaan_ortu||'—'],
    ['🏠 Alamat', s.alamat||'—'],
  ];
  document.getElementById('detail-profil-content').innerHTML = `<div style="display:flex;flex-direction:column">
    ${rows.map(([l,v])=>`<div style="display:flex;padding:9px 0;border-bottom:1px solid var(--bdr);gap:10px;align-items:start">
      <span style="font-size:11px;color:var(--t3);min-width:130px;flex-shrink:0">${l}</span>
      <span style="font-size:12px;font-weight:600;flex:1">${v}</span>
    </div>`).join('')}
  </div>`;
}

// ── Helper: hitung ulang total piutang dari detail ───────────────
// Menyamakan dua field: p.lunas (boolean) dan p.status (string)
// Item dianggap lunas jika: p.lunas===true ATAU p.status==='paid' ATAU p.sisa<=0

function renderDetailPiutang(s) {
  const list = s.piutang_detail||[];
  const el = document.getElementById('detail-piutang-list');
  if (!el) return;
  const totalUnpaid = list.filter(p=>p.status==='unpaid').reduce((a,p)=>a+p.jumlah,0);
  const totEl = document.getElementById('detail-piutang-total');
  if(totEl) totEl.textContent = fmt(totalUnpaid);
  const totBox = document.getElementById('detail-piutang-total-box');
  if(totBox) totBox.style.display = totalUnpaid>0?'flex':'none';
  if (!list.length) { el.innerHTML = '<div class="empty-state" style="padding:20px"><span class="empty-icon">✅</span><span class="empty-text">Tidak ada tagihan</span></div>'; return; }
  el.innerHTML = list.slice().reverse().map(p=>`
    <div class="piutang-item">
      <div class="piutang-status-dot" style="background:${p.status==='paid'?'var(--grn)':'var(--red)'}"></div>
      <div class="piutang-info">
        <div class="piutang-title">${p.jenis} <span class="bdg ${p.status==='paid'?'bdg-g':'bdg-r'}">${p.status==='paid'?'Lunas':'Belum'}</span></div>
        <div class="piutang-date">${p.keterangan||''} · ${new Date(p.tanggal).toLocaleDateString('id-ID',{dateStyle:'short'})}${p.jatuh_tempo?` · Tempo: ${new Date(p.jatuh_tempo).toLocaleDateString('id-ID',{dateStyle:'short'})}`:''}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
        <div class="piutang-jumlah" style="color:${p.status==='paid'?'var(--grn)':'var(--red)'}">${fmt(p.jumlah)}</div>
        ${p.status==='unpaid'?`<button class="abtn abtn-g" style="padding:3px 8px;font-size:10px" onclick="lunasPiutang('${s.id}','${p.id}')">Lunas</button>`:''}
      </div>
    </div>`).join('');
}


function openTagihanModal() {
  const d = getD();
  const sppNominal = d.profil_sekolah.spp_nominal||0;
  const el=document.getElementById('tagihan-jumlah-inp');
  if(el) el.value=sppNominal||'';
  const tEl=document.getElementById('tagihan-tempo-inp');
  if(tEl) tEl.value=new Date().toISOString().slice(0,10);
  openModal('modal-tagihan');
}


function switchDetailTab(tab, btn) {
  document.querySelectorAll('.mtab-btn').forEach(b=>b.classList.remove('on'));
  document.querySelectorAll('.modal-tab-pane').forEach(p=>p.classList.remove('on'));
  btn.classList.add('on');
  document.getElementById('tab-'+tab).classList.add('on');
  if (tab==='absensi') { const d=getD(); const s=d.data_siswa.find(x=>x.id===activeSiswaId); if(s) renderAbsCalendar(s); }
  if (tab==='nilai') renderNilai();
}


function setAbsMode(m) {
  absMode = m;
  const labels={H:'Hadir (H)',I:'Izin (I)',S:'Sakit (S)',A:'Alpha (A)'};
  const colors={H:'var(--grn)',I:'var(--yel)',S:'var(--blu)',A:'var(--red)'};
  const el=document.getElementById('abs-mode-label');
  if(el){el.textContent=labels[m];el.style.color=colors[m];}
}

function renderAbsCalendar(s) {
  const el=document.getElementById('abs-cal-grid');
  const lblEl=document.getElementById('abs-month-label');
  if(!el||!lblEl) return;
  lblEl.textContent=`${BULAN_NAMES[absMonth]} ${absYear}`;
  const daysInMonth=new Date(absYear,absMonth+1,0).getDate();
  const firstDay=new Date(absYear,absMonth,1).getDay();
  const absensi=s.absensi||{};
  const absClassMap={H:'hadir',I:'izin',S:'sakit',A:'alpha'};
  const absLblMap={H:'HAD',I:'IZN',S:'SKT',A:'ALP'};
  let html='';
  ['M','S','S','R','K','J','S'].forEach(d=>{html+=`<div style="text-align:center;font-size:9px;color:var(--t3);font-weight:700;padding:3px 0">${d}</div>`;});
  for(let i=0;i<firstDay;i++) html+='<div class="abs-day libur"></div>';
  for(let d=1;d<=daysInMonth;d++){
    const dateStr=`${absYear}-${String(absMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dow=new Date(absYear,absMonth,d).getDay();
    const isWE=dow===0||dow===6;
    const status=absensi[dateStr];
    const cls=status?absClassMap[status]:(isWE?'libur':'');
    const lbl=status?absLblMap[status]:(isWE?'—':'');
    html+=`<div class="abs-day ${cls}" onclick="toggleAbsensi('${dateStr}')"><span class="abs-day-num">${d}</span>${lbl?`<span class="abs-day-lbl">${lbl}</span>`:''}</div>`;
  }
  el.innerHTML=html;
  const mk=Object.keys(absensi).filter(k=>k.startsWith(`${absYear}-${String(absMonth+1).padStart(2,'0')}`));
  const counts={H:0,I:0,S:0,A:0};
  mk.forEach(k=>{if(counts[absensi[k]]!==undefined)counts[absensi[k]]++;});
  const sumEl=document.getElementById('abs-summary');
  if(sumEl) sumEl.innerHTML=[{label:'Hadir',val:counts.H,color:'var(--grn)'},{label:'Izin',val:counts.I,color:'var(--yel)'},{label:'Sakit',val:counts.S,color:'var(--blu)'},{label:'Alpha',val:counts.A,color:'var(--red)'}].map(x=>`<div style="text-align:center;background:${x.color}15;border:1px solid ${x.color}44;border-radius:8px;padding:8px"><div style="font-size:20px;font-weight:900;color:${x.color}">${x.val}</div><div style="font-size:9px;color:var(--t3);font-weight:700">${x.label}</div></div>`).join('');
}


function renderMassalList() {
  const d=getD();
  const kf=(document.getElementById('massal-kelas-sel')||{value:''}).value;
  const list=d.data_siswa.filter(s=>!kf||s.kelas===kf);
  const el=document.getElementById('massal-siswa-list');
  if(!el) return;
  if(!list.length){el.innerHTML='<div style="text-align:center;color:var(--t3);padding:20px;font-size:12px">Tidak ada siswa</div>';return;}
  el.innerHTML=list.map(s=>{
    const c=getAvatarColor(s);
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--bdr)">
      <div style="width:32px;height:32px;border-radius:50%;background:${c.bg};border:1.5px solid ${c.border};color:${c.text};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;flex-shrink:0">${getInitials(s.nama)}</div>
      <div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.nama}</div><div style="font-size:10px;color:var(--t3)">Kelas ${s.kelas}</div></div>
      <div style="display:flex;gap:4px">
        ${['H','I','S','A'].map(k=>{const clrs={H:'var(--grn)',I:'var(--yel)',S:'var(--blu)',A:'var(--red)'};return `<button class="abtn" id="massal-btn-${s.id}-${k}" style="padding:5px 7px;font-size:10px;background:${clrs[k]}15;color:${clrs[k]};border:1px solid ${clrs[k]}44" onclick="massalToggle('${s.id}','${k}')">${k}</button>`;}).join('')}
      </div>
    </div>`;
  }).join('');
}


function renderNilai() {
  if (!activeSiswaId) return;
  const d=getD(); const s=d.data_siswa.find(x=>x.id===activeSiswaId);
  if (!s) return;
  const sem=(document.getElementById('nilai-semester-sel')||{value:'1'}).value;
  const nilaiData=(s.nilai||{})[sem]||[];
  const el=document.getElementById('detail-nilai-list');
  if (!el) return;
  if (!nilaiData.length) {
    el.innerHTML='<div class="empty-state" style="padding:20px"><span class="empty-icon">📊</span><span class="empty-text">Belum ada nilai</span></div>';
    const avgEl=document.getElementById('detail-nilai-avg');
    if(avgEl)avgEl.textContent='—';
    return;
  }
  const byMapel={};
  nilaiData.forEach(n=>{if(!byMapel[n.mapel])byMapel[n.mapel]=[];byMapel[n.mapel].push(n);});
  let totAll=0,cntAll=0;
  el.innerHTML=Object.entries(byMapel).map(([mapel,entries])=>{
    const avg=entries.reduce((a,e)=>a+e.nilai,0)/entries.length;
    totAll+=avg;cntAll++;
    const grd=getNilaiGrade(avg);
    const color=MAPEL_COLORS[mapel]||'var(--t2)';
    return `<div class="nilai-row">
      <div style="flex:1"><div class="nilai-mapel">${mapel}</div><div style="display:flex;gap:5px;margin-top:3px;flex-wrap:wrap">${entries.map(e=>`<span class="bdg bdg-x">${e.jenis}: ${e.nilai}</span>`).join('')}</div></div>
      <div class="nilai-bar"><div class="nilai-bar-fill" style="width:${avg}%;background:${color}"></div></div>
      <div class="nilai-score" style="color:${color}">${avg.toFixed(0)}</div>
      <div class="nilai-grade" style="color:${grd.c}">${grd.g}</div>
    </div>`;
  }).join('');
  const avgAll=cntAll>0?(totAll/cntAll).toFixed(1):'—';
  const avgGrd=cntAll>0?getNilaiGrade(totAll/cntAll):{c:'var(--t3)'};
  const avgEl=document.getElementById('detail-nilai-avg');
  if(avgEl){avgEl.textContent=avgAll;avgEl.style.color=avgGrd.c;}
}


Object.assign(globalThis, { renderCRM, setCRMFilter, openSiswaDetail, renderDetailProfil, renderDetailPiutang, openTagihanModal, switchDetailTab, setAbsMode, renderAbsCalendar, renderMassalList, renderNilai });

export async function mount(container, modalsRoot) {
  return globalThis.mountPartial('crm', container, modalsRoot);
}
export { renderCRM, setCRMFilter, openSiswaDetail, renderDetailProfil, renderDetailPiutang, openTagihanModal, switchDetailTab, setAbsMode, renderAbsCalendar, renderMassalList, renderNilai };
