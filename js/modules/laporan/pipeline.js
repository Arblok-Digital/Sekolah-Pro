// js/modules/laporan/pipeline.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

function renderRankingNilai() {
  const d = getD();
  const kf = (document.getElementById('ranking-kelas-sel')||{value:''}).value;
  const sem = (document.getElementById('ranking-sem-sel')||{value:'1'}).value;
  const el = document.getElementById('ranking-nilai-list');
  if (!el) return;
  const list = d.data_siswa.filter(s=>!kf||s.kelas===kf).map(s=>{
    const nilaiData = (s.nilai||{})[sem]||[];
    const byMapel={};
    nilaiData.forEach(n=>{if(!byMapel[n.mapel])byMapel[n.mapel]=[];byMapel[n.mapel].push(n.nilai);});
    const mapelAvgs = Object.values(byMapel).map(vals=>vals.reduce((a,b)=>a+b,0)/vals.length);
    const avg = mapelAvgs.length? mapelAvgs.reduce((a,b)=>a+b,0)/mapelAvgs.length : null;
    return {...s, avg};
  }).filter(s=>s.avg!==null).sort((a,b)=>b.avg-a.avg);

  if (!list.length) { el.innerHTML='<div class="empty-state" style="padding:20px"><span>📊</span><span style="font-size:12px;color:var(--t3)">Belum ada data nilai</span></div>'; return; }
  el.innerHTML = `<table class="rekap-tbl">
    <thead><tr><th>#</th><th>Nama</th><th>Kelas</th><th>Rata-rata</th><th>Grade</th></tr></thead>
    <tbody>${list.map((s,i)=>{
      const grd=getNilaiGrade(s.avg);
      const medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':'';
      return `<tr>
        <td style="font-weight:700;color:var(--t2)">${medal||i+1}</td>
        <td style="font-weight:700;cursor:pointer;color:var(--cyn)" onclick="openSiswaDetail('${s.id}')">${s.nama}</td>
        <td>${s.kelas}</td>
        <td style="font-weight:900;font-family:'Courier New',monospace;color:${grd.c}">${s.avg.toFixed(1)}</td>
        <td style="font-weight:700;color:${grd.c}">${grd.g}</td>
      </tr>`;
    }).join('')}</tbody>
  </table>`;
}

// ── CETAK LAPORAN ──

Object.assign(globalThis, { renderRankingNilai });
export { renderRankingNilai };
