// js/modules/laporan/logic.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

function cetakRekap(tipe) {
  const d = getD();
  const el = document.getElementById('print-modal-content');
  const titleEl = document.getElementById('print-modal-title');
  let title='', html='', csvData=[], csvTitle='';

  if (tipe==='spp') {
    title='💳 Rekap Pembayaran SPP';
    csvTitle='rekap_spp';
    const rows = d.data_siswa.map(s => {
      const unpaid = (s.piutang_detail||[]).filter(p=>p.status==='unpaid').reduce((a,p)=>a+p.jumlah,0);
      const paid = (s.piutang_detail||[]).filter(p=>p.status==='paid').reduce((a,p)=>a+p.jumlah,0);
      return {nama:s.nama,kelas:s.kelas,nisn:s.nisn||'—',status:s.status_spp,lunas:paid,piutang:unpaid};
    });
    csvData=rows;
    html=`<table class="rekap-tbl">
      <thead><tr><th>Nama</th><th>Kelas</th><th>NISN</th><th>Status</th><th>Total Lunas</th><th>Piutang</th></tr></thead>
      <tbody>${rows.map(r=>`<tr>
        <td style="font-weight:700">${r.nama}</td><td>${r.kelas}</td><td style="font-family:'Courier New',monospace">${r.nisn}</td>
        <td><span class="bdg ${r.status==='Lunas'?'bdg-g':'bdg-r'}">${r.status}</span></td>
        <td style="color:var(--grn);font-weight:700;font-family:'Courier New',monospace">${fmt(r.lunas)}</td>
        <td style="color:${r.piutang>0?'var(--red)':'var(--t3)'};font-weight:700;font-family:'Courier New',monospace">${r.piutang>0?fmt(r.piutang):'—'}</td>
      </tr>`).join('')}</tbody>
    </table>
    <div style="margin-top:12px;padding:10px;background:var(--s2);border-radius:8px;display:flex;justify-content:space-between">
      <span style="font-size:12px;font-weight:700">Total Piutang Keseluruhan</span>
      <span style="font-size:16px;font-weight:900;color:var(--red);font-family:'Courier New',monospace">${fmt(rows.reduce((a,r)=>a+r.piutang,0))}</span>
    </div>`;
  }

  else if (tipe==='absensi') {
    title='📅 Rekap Absensi Bulanan';
    csvTitle='rekap_absensi';
    const bulan = new Date().getMonth();
    const year = new Date().getFullYear();
    const rows = d.data_siswa.map(s => {
      const absensi=s.absensi||{};
      const mk=Object.keys(absensi).filter(k=>k.startsWith(`${year}-${String(bulan+1).padStart(2,'0')}`));
      return {nama:s.nama,kelas:s.kelas,H:mk.filter(k=>absensi[k]==='H').length,I:mk.filter(k=>absensi[k]==='I').length,S:mk.filter(k=>absensi[k]==='S').length,A:mk.filter(k=>absensi[k]==='A').length};
    });
    csvData=rows;
    html=`<div style="margin-bottom:8px;font-size:12px;color:var(--t2)">Bulan: ${BULAN_NAMES[bulan]} ${year}</div>
    <table class="rekap-tbl">
      <thead><tr><th>Nama</th><th>Kelas</th><th style="color:var(--grn)">H</th><th style="color:var(--yel)">I</th><th style="color:var(--blu)">S</th><th style="color:var(--red)">A</th><th>%Hadir</th></tr></thead>
      <tbody>${rows.map(r=>{
        const tot=r.H+r.I+r.S+r.A;
        const pct=tot>0?((r.H/tot)*100).toFixed(0)+'%':'—';
        const pctColor=tot===0?'var(--t3)':r.H/tot>=.9?'var(--grn)':r.H/tot>=.75?'var(--yel)':'var(--red)';
        return `<tr><td style="font-weight:700">${r.nama}</td><td>${r.kelas}</td>
          <td style="color:var(--grn);font-weight:700">${r.H}</td><td style="color:var(--yel);font-weight:700">${r.I}</td>
          <td style="color:var(--blu);font-weight:700">${r.S}</td><td style="color:var(--red);font-weight:700">${r.A}</td>
          <td style="color:${pctColor};font-weight:700">${pct}</td></tr>`;
      }).join('')}</tbody>
    </table>`;
  }

  else if (tipe==='nilai') {
    title='📊 Rekap Nilai Akademik';
    csvTitle='rekap_nilai';
    const sem='1';
    const rows = d.data_siswa.map(s=>{
      const nd=(s.nilai||{})[sem]||[];
      const bm={};
      nd.forEach(n=>{if(!bm[n.mapel])bm[n.mapel]=[];bm[n.mapel].push(n.nilai);});
      const avgs=Object.values(bm).map(v=>v.reduce((a,b)=>a+b,0)/v.length);
      const avg=avgs.length?avgs.reduce((a,b)=>a+b,0)/avgs.length:null;
      return {nama:s.nama,kelas:s.kelas,avg,mapelCount:Object.keys(bm).length};
    }).filter(r=>r.avg!==null).sort((a,b)=>b.avg-a.avg);
    csvData=rows;
    html=`<table class="rekap-tbl">
      <thead><tr><th>#</th><th>Nama</th><th>Kelas</th><th>Mapel</th><th>Rata-rata</th><th>Grade</th></tr></thead>
      <tbody>${rows.map((r,i)=>{
        const grd=getNilaiGrade(r.avg);
        return `<tr><td style="font-weight:700">${i+1}</td><td style="font-weight:700">${r.nama}</td><td>${r.kelas}</td>
          <td style="color:var(--t3)">${r.mapelCount} mapel</td>
          <td style="font-weight:900;font-family:'Courier New',monospace;color:${grd.c}">${r.avg.toFixed(1)}</td>
          <td style="font-weight:700;color:${grd.c}">${grd.g}</td></tr>`;
      }).join('')}</tbody>
    </table>`;
  }

  else if (tipe==='gaji') {
    title='💸 Rekap Penggajian Guru';
    csvTitle='rekap_gaji';
    const rows=d.keuangan_guru.map(g=>({nama:g.nama,jabatan:g.jabatan,gaji_pokok:g.gaji_pokok,jam:g.jam_mengajar||0,honor:g.honor_per_jam,honor_total:(g.jam_mengajar||0)*(g.honor_per_jam||0),total:g.total_terima||0,status:g.sudah_dibayar?'Lunas':'Belum'}));
    const grandTotal=rows.reduce((a,r)=>a+r.total,0);
    csvData=rows;
    html=`<table class="rekap-tbl">
      <thead><tr><th>Nama</th><th>Jabatan</th><th>Gaji Pokok</th><th>Jam</th><th>Honor</th><th>Total</th><th>Status</th></tr></thead>
      <tbody>${rows.map(r=>`<tr>
        <td style="font-weight:700">${r.nama}</td><td style="color:var(--t3)">${r.jabatan}</td>
        <td style="font-family:'Courier New',monospace">${fmt(r.gaji_pokok)}</td>
        <td style="text-align:center">${r.jam}</td>
        <td style="font-family:'Courier New',monospace">${fmt(r.honor_total)}</td>
        <td style="font-weight:900;font-family:'Courier New',monospace;color:var(--pur)">${fmt(r.total)}</td>
        <td><span class="bdg ${r.status==='Lunas'?'bdg-g':'bdg-am'}">${r.status}</span></td>
      </tr>`).join('')}</tbody>
    </table>
    <div style="margin-top:12px;padding:10px;background:var(--pur-bg);border-radius:8px;display:flex;justify-content:space-between">
      <span style="font-size:12px;font-weight:700">Grand Total Gaji</span>
      <span style="font-size:16px;font-weight:900;color:var(--pur);font-family:'Courier New',monospace">${fmt(grandTotal)}</span>
    </div>`;
  }

  else if (tipe==='bos') {
    title='🏦 Laporan Dana BOS';
    csvTitle='laporan_bos';
    const bos=d.dana_bos;
    const pct=bos.pagu_tahunan>0?((bos.terpakai/bos.pagu_tahunan)*100).toFixed(1):'0';
    const rows=bos.log_pengeluaran.map(l=>({desc:l.deskripsi,kat:l.kategori,jumlah:l.jumlah,tgl:new Date(l.tanggal).toLocaleDateString('id-ID')}));
    csvData=rows;
    html=`
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
      <div style="text-align:center;background:var(--yel-bg);border:1px solid rgba(255,202,40,.2);border-radius:8px;padding:10px">
        <div style="font-size:11px;color:var(--yel);font-weight:700">PAGU</div>
        <div style="font-size:14px;font-weight:900;color:var(--yel);font-family:'Courier New',monospace">${fmt(bos.pagu_tahunan)}</div>
      </div>
      <div style="text-align:center;background:var(--amb-bg);border:1px solid rgba(255,152,0,.2);border-radius:8px;padding:10px">
        <div style="font-size:11px;color:var(--amb);font-weight:700">TERPAKAI ${pct}%</div>
        <div style="font-size:14px;font-weight:900;color:var(--amb);font-family:'Courier New',monospace">${fmt(bos.terpakai)}</div>
      </div>
      <div style="text-align:center;background:var(--grn-bg);border:1px solid rgba(0,230,118,.2);border-radius:8px;padding:10px">
        <div style="font-size:11px;color:var(--grn);font-weight:700">SISA</div>
        <div style="font-size:14px;font-weight:900;color:var(--grn);font-family:'Courier New',monospace">${fmt(bos.sisa_anggaran)}</div>
      </div>
    </div>
    <table class="rekap-tbl">
      <thead><tr><th>Deskripsi</th><th>Kategori</th><th>Jumlah</th><th>Tanggal</th></tr></thead>
      <tbody>${rows.map(r=>`<tr>
        <td>${r.desc}</td><td><span class="bdg bdg-am">${r.kat}</span></td>
        <td style="font-weight:700;font-family:'Courier New',monospace;color:var(--amb)">${fmt(r.jumlah)}</td>
        <td style="color:var(--t3)">${r.tgl}</td>
      </tr>`).join('')}</tbody>
    </table>`;
  }

  if (titleEl) titleEl.textContent = title;
  if (el) el.innerHTML = html;
  // Store for CSV export
  window._csvData = csvData;
  window._csvTitle = csvTitle;
  openModal('modal-print');
}


function eksporCSV() {
  const data = window._csvData || [];
  if (!data.length) { showNotif('Tidak ada data untuk diekspor!','err'); return; }
  const keys = Object.keys(data[0]);
  const rows = [keys.join(','), ...data.map(r=>keys.map(k=>JSON.stringify(r[k]||'')).join(','))];
  const blob = new Blob([rows.join('\n')], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (window._csvTitle||'laporan')+'_'+new Date().toISOString().slice(0,10)+'.csv';
  a.click();
  showNotif('📊 CSV berhasil diekspor!','ok');
}


function eksporJSON() {
  exportData();
}

// ── KARTU SPP ──

Object.assign(globalThis, { cetakRekap, eksporCSV, eksporJSON });
export { cetakRekap, eksporCSV, eksporJSON };
