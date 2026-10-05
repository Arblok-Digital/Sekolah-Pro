// js/modules/laporan/route.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

import './logic.js';
import './pipeline.js';

function buildReminders() {
  const d = getD();
  const reminders = [];
  const today = new Date();
  const todayStr = today.toISOString().slice(0,10);

  // Piutang jatuh tempo
  d.data_siswa.forEach(s => {
    (s.piutang_detail||[]).filter(p=>p.status==='unpaid'&&p.jatuh_tempo).forEach(p => {
      const diff = Math.ceil((new Date(p.jatuh_tempo)-today)/(1000*60*60*24));
      if (diff <= 7) {
        reminders.push({
          color: diff < 0 ? 'var(--red)' : diff === 0 ? 'var(--red)' : 'var(--yel)',
          title: `${s.nama} — ${p.jenis} ${fmt(p.jumlah)}`,
          sub: diff < 0 ? `Jatuh tempo ${Math.abs(diff)} hari yang lalu (${p.keterangan})` : diff === 0 ? `Jatuh tempo HARI INI (${p.keterangan})` : `Jatuh tempo ${diff} hari lagi — ${p.keterangan}`,
          action: `openSiswaDetail('${s.id}')`,
          actionLabel: 'Bayar'
        });
      }
    });
  });

  // BOS hampir habis
  if (d.dana_bos.pagu_tahunan > 0) {
    const pct = (d.dana_bos.terpakai/d.dana_bos.pagu_tahunan)*100;
    if (pct >= 90) reminders.push({ color:'var(--red)', title:'Dana BOS kritis!', sub:`Sudah ${pct.toFixed(0)}% terpakai. Sisa ${fmt(d.dana_bos.sisa_anggaran)}`, action:`switchPage('bos')`, actionLabel:'Lihat' });
    else if (pct >= 75) reminders.push({ color:'var(--amb)', title:'Dana BOS perlu perhatian', sub:`${pct.toFixed(0)}% terpakai. Sisa ${fmt(d.dana_bos.sisa_anggaran)}`, action:`switchPage('bos')`, actionLabel:'Lihat' });
  }

  // Saldo tidak cukup bayar gaji
  const totalGaji = d.keuangan_guru.filter(g=>!g.sudah_dibayar).reduce((a,g)=>a+(g.total_terima||0),0);
  if (totalGaji > 0 && d.profil_sekolah.saldo_utama < totalGaji) {
    reminders.push({ color:'var(--red)', title:'Saldo tidak cukup bayar gaji!', sub:`Butuh ${fmt(totalGaji)}, saldo ${fmt(d.profil_sekolah.saldo_utama)}`, action:`switchPage('guru')`, actionLabel:'Guru' });
  }

  // Tunggakan SPP banyak
  const tunggakCount = d.data_siswa.filter(s=>s.status_spp==='Tunggakan').length;
  if (tunggakCount >= 3) {
    reminders.push({ color:'var(--amb)', title:`${tunggakCount} siswa belum bayar SPP`, sub:'Segera lakukan penagihan', action:`switchPage('crm')`, actionLabel:'Lihat' });
  }

  return reminders;
}

// ══════════════════════════════════════
//  JADWAL KELAS MODULE
// ══════════════════════════════════════

function renderLaporan() {
  renderReminderLaporan();
  renderGrafikAbsensi();
  renderRankingNilai();
  // Set default bulan to current
  const bulanSel = document.getElementById('grafik-bulan-sel');
  if (bulanSel) bulanSel.value = new Date().getMonth();
}


function renderReminderLaporan() {
  const reminders = buildReminders();
  const el = document.getElementById('lap-reminder-list');
  if (!el) return;
  if (!reminders.length) {
    el.innerHTML = '<div style="font-size:12px;color:var(--t3);padding:8px 0">✅ Tidak ada piutang jatuh tempo atau peringatan aktif</div>';
    return;
  }
  el.innerHTML = reminders.map(r => `
    <div class="reminder-item">
      <div class="reminder-dot" style="background:${r.color}"></div>
      <div class="reminder-info">
        <div class="reminder-title">${r.title}</div>
        <div class="reminder-sub">${r.sub}</div>
      </div>
      ${r.action?`<button class="abtn" style="padding:5px 10px;font-size:10px;background:${r.color}15;color:${r.color};border:1px solid ${r.color}44" onclick="${r.action}">${r.actionLabel}</button>`:''}
    </div>`).join('');
}


function renderGrafikAbsensi() {
  const d = getD();
  const kf = (document.getElementById('grafik-kelas-sel')||{value:''}).value;
  const bulan = parseInt((document.getElementById('grafik-bulan-sel')||{value:new Date().getMonth()}).value);
  const year = new Date().getFullYear();
  const siswaList = d.data_siswa.filter(s => !kf || s.kelas===kf);
  const el = document.getElementById('grafik-absensi-wrap');
  if (!el) return;
  if (!siswaList.length) { el.innerHTML='<div class="empty-state" style="padding:20px"><span>📭</span><span style="font-size:12px;color:var(--t3)">Tidak ada data</span></div>'; return; }

  // Aggregate per day
  const daysInMonth = new Date(year, bulan+1, 0).getDate();
  const summary = {H:0,I:0,S:0,A:0};
  const perDay = [];
  for (let day=1; day<=daysInMonth; day++) {
    const dateStr = `${year}-${String(bulan+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const dow = new Date(year,bulan,day).getDay();
    if (dow===0||dow===6) { perDay.push({day,hadir:0,total:0,isWE:true}); continue; }
    let hadir=0, total=0;
    siswaList.forEach(s => { const a=(s.absensi||{})[dateStr]; if(a){total++;if(a==='H')hadir++;if(summary[a]!==undefined)summary[a]++;} });
    perDay.push({day,hadir,total,isWE:false});
  }
  const maxHadir = Math.max(...perDay.map(p=>p.hadir), 1);

  // Bar chart
  const bars = perDay.map(p => {
    if (p.isWE) return `<div class="mini-bar" style="background:var(--bdr);height:${p.hadir?Math.max(4,(p.hadir/maxHadir)*54):4}px;opacity:.3">
      <span class="mini-bar-lbl">${p.day}</span></div>`;
    const pct = p.total>0?(p.hadir/p.total)*100:100;
    const color = pct>=90?'var(--grn)':pct>=75?'var(--yel)':pct>=50?'var(--amb)':'var(--red)';
    return `<div class="mini-bar" style="background:${color};height:${Math.max(4,(p.hadir/maxHadir)*54)}px" title="Tgl ${p.day}: ${p.hadir}/${p.total} hadir">
      ${p.day%5===0?`<span class="mini-bar-lbl">${p.day}</span>`:''}
    </div>`;
  }).join('');

  el.innerHTML = `
    <div style="margin-bottom:8px">
      <div class="mini-chart-wrap">
        <div class="mini-chart" style="height:70px">${bars}</div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--t3);margin-top:4px">
        <span>1</span><span style="flex:1;text-align:center">${BULAN_NAMES[bulan]} ${year}</span><span>${daysInMonth}</span>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:8px">
      <div style="text-align:center;background:var(--grn-bg);border:1px solid rgba(0,230,118,.2);border-radius:8px;padding:8px">
        <div style="font-size:20px;font-weight:900;color:var(--grn)">${summary.H}</div>
        <div style="font-size:9px;color:var(--t3);font-weight:700">HADIR</div>
      </div>
      <div style="text-align:center;background:var(--yel-bg);border:1px solid rgba(255,202,40,.2);border-radius:8px;padding:8px">
        <div style="font-size:20px;font-weight:900;color:var(--yel)">${summary.I}</div>
        <div style="font-size:9px;color:var(--t3);font-weight:700">IZIN</div>
      </div>
      <div style="text-align:center;background:var(--blu-bg);border:1px solid rgba(68,138,255,.2);border-radius:8px;padding:8px">
        <div style="font-size:20px;font-weight:900;color:var(--blu)">${summary.S}</div>
        <div style="font-size:9px;color:var(--t3);font-weight:700">SAKIT</div>
      </div>
      <div style="text-align:center;background:var(--red-bg);border:1px solid rgba(255,82,82,.2);border-radius:8px;padding:8px">
        <div style="font-size:20px;font-weight:900;color:var(--red)">${summary.A}</div>
        <div style="font-size:9px;color:var(--t3);font-weight:700">ALPHA</div>
      </div>
    </div>`;
}


Object.assign(globalThis, { buildReminders, renderLaporan, renderReminderLaporan, renderGrafikAbsensi });

export async function mount(container, modalsRoot) {
  return globalThis.mountPartial('laporan', container, modalsRoot);
}
export { buildReminders, renderLaporan, renderReminderLaporan, renderGrafikAbsensi };
