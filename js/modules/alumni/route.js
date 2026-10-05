// js/modules/alumni/route.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

import './logic.js';
import './pipeline.js';

function renderAlumni() {
  if (isOfflineMode()) { requireOnline('Kelulusan & Alumni'); return; }
  const d = getAlumniDB();
  const filterAngkatan = (document.getElementById('al-filter-angkatan')||{value:''}).value;
  const list = d.alumni.filter(a => !filterAngkatan || String(a.tahun_lulus) === filterAngkatan);
  const angkatanSet = [...new Set(d.alumni.map(a => a.tahun_lulus).filter(Boolean))].sort((a,b)=>b-a);

  // Stats
  document.getElementById('al-stat-total').textContent = d.alumni.length;
  document.getElementById('al-stat-angkatan').textContent = angkatanSet.length;
  const withNilai = d.alumni.filter(a => a.nilai_rata);
  const avgNilai = withNilai.length ? (withNilai.reduce((s,a)=>s+parseFloat(a.nilai_rata),0)/withNilai.length).toFixed(1) : '—';
  document.getElementById('al-stat-nilai').textContent = avgNilai;
  document.getElementById('al-stat-terlacak').textContent = d.alumni.filter(a=>a.status!=='tidak-diketahui').length;

  // Populate filter dropdown
  const sel = document.getElementById('al-filter-angkatan');
  if (sel) {
    const curVal = sel.value;
    sel.innerHTML = '<option value="">Semua Angkatan</option>' + angkatanSet.map(y=>`<option value="${y}">${y}</option>`).join('');
    sel.value = curVal;
  }

  // Alumni list
  const el = document.getElementById('alumni-list');
  if (!list.length) {
    el.innerHTML = '<div class="empty-state"><span class="empty-icon">🎓</span><span class="empty-text">' + (d.alumni.length===0?'Belum ada data alumni':'Tidak ada alumni untuk angkatan ini') + '</span></div>';
  } else {
    const colors = [{bg:'rgba(192,132,252,.15)',border:'var(--pur)',text:'var(--pur)'},{bg:'rgba(0,230,118,.15)',border:'var(--grn)',text:'var(--grn)'},{bg:'rgba(38,198,218,.15)',border:'var(--cyn)',text:'var(--cyn)'}];
    el.innerHTML = '<div style="display:flex;flex-direction:column;gap:8px;padding:0 12px 12px">' +
      list.map((a, i) => {
        const c = colors[i % colors.length];
        const st = AL_STATUS_STYLE[a.status] || AL_STATUS_STYLE['tidak-diketahui'];
        const grd = a.nilai_rata ? getNilaiGrade(parseFloat(a.nilai_rata)) : null;
        return `<div class="alumni-card">
          <div class="alumni-avatar" style="background:${c.bg};border-color:${c.border};color:${c.text}">${getInitials(a.nama)}</div>
          <div class="alumni-info">
            <div class="alumni-nama">${a.nama}</div>
            <div class="alumni-sub">
              <span>🎓 ${a.tahun_lulus || '—'}</span>
              ${a.nisn ? `<span style="font-family:'Courier New',monospace">${a.nisn}</span>` : ''}
              ${a.sekolah_lanjutan ? `<span>→ ${a.sekolah_lanjutan}</span>` : ''}
            </div>
            <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:4px">
              <span class="bdg ${st.cls}">${st.label}</span>
              ${grd ? `<span class="bdg" style="background:${grd.c}15;color:${grd.c}">Nilai: ${a.nilai_rata} (${grd.g})</span>` : ''}
              ${a.prestasi ? `<span class="bdg bdg-y">🏆 ${a.prestasi}</span>` : ''}
            </div>
          </div>
          <button style="background:transparent;border:none;color:var(--t3);font-size:16px;padding:4px" onclick="hapusAlumni('${a.id}')">✕</button>
        </div>`;
      }).join('') + '</div>';
  }

  // Statistik
  renderAlumniStatistik(d.alumni);
}


function renderAlumniStatistik(alumni) {
  const el = document.getElementById('al-statistik');
  if (!el || !alumni.length) { if(el) el.innerHTML='<div style="font-size:12px;color:var(--t3);padding:8px">Belum ada data untuk dianalisis</div>'; return; }

  const angkatanData = {};
  alumni.forEach(a => {
    const y = a.tahun_lulus || 'Unknown';
    if (!angkatanData[y]) angkatanData[y] = {total:0,lanjut:0,avgNilai:[]};
    angkatanData[y].total++;
    if (a.status==='lanjut') angkatanData[y].lanjut++;
    if (a.nilai_rata) angkatanData[y].avgNilai.push(parseFloat(a.nilai_rata));
  });

  const years = Object.keys(angkatanData).sort((a,b)=>b-a);
  el.innerHTML = `<table class="rekap-tbl">
    <thead><tr><th>Angkatan</th><th>Jumlah</th><th>Lanjut SMP</th><th>Rata Nilai</th><th>% Lanjut</th></tr></thead>
    <tbody>${years.map(y => {
      const dat = angkatanData[y];
      const avg = dat.avgNilai.length ? (dat.avgNilai.reduce((a,b)=>a+b,0)/dat.avgNilai.length).toFixed(1) : '—';
      const pctLanjut = dat.total > 0 ? Math.round((dat.lanjut/dat.total)*100) : 0;
      const grd = dat.avgNilai.length ? getNilaiGrade(parseFloat(avg)) : null;
      return `<tr>
        <td style="font-weight:700;color:var(--pur)">${y}</td>
        <td style="font-weight:700">${dat.total}</td>
        <td style="color:var(--grn);font-weight:700">${dat.lanjut}</td>
        <td style="font-weight:700;color:${grd?grd.c:'var(--t3)'}">${avg}</td>
        <td><div style="display:flex;align-items:center;gap:6px">
          <div style="flex:1;height:6px;background:var(--s2);border-radius:3px;overflow:hidden;min-width:40px"><div style="width:${pctLanjut}%;height:100%;background:var(--grn);border-radius:3px"></div></div>
          <span style="font-size:11px;font-weight:700;color:var(--grn)">${pctLanjut}%</span>
        </div></td>
      </tr>`;
    }).join('')}</tbody>
  </table>`;
}


Object.assign(globalThis, { renderAlumni, renderAlumniStatistik });

export async function mount(container, modalsRoot) {
  return globalThis.mountPartial('alumni', container, modalsRoot);
}
export { renderAlumni, renderAlumniStatistik };
