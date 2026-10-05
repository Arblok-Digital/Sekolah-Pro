// js/modules/setting/logic.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

function exportData() {
  const blob = new Blob([JSON.stringify(DB, null, 2)], {type: 'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'sekolah_pro_backup_' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  showNotif('📤 Data berhasil diekspor!', 'ok');
}


globalThis.impState = {
  step:1, type:'siswa', rawRows:[], headers:[],
  mapping:{}, previewRows:[], dupRows:new Set(),
  mode: 'add'  // 'add' | 'overwrite' | 'replace'
};


globalThis.IMP_FIELDS_SISWA = [
  {key:'nama',        label:'Nama Lengkap*',   required:true},
  {key:'nisn',        label:'NISN',            required:false},
  {key:'kelas',       label:'Kelas',           required:false},
  {key:'jk',          label:'Jenis Kelamin',   required:false},
  {key:'tgl_lahir',   label:'Tanggal Lahir',   required:false},
  {key:'ayah',        label:'Nama Ayah/Wali',  required:false},
  {key:'ibu',         label:'Nama Ibu',        required:false},
  {key:'hp_ortu',     label:'HP Orang Tua',    required:false},
  {key:'email_ortu',  label:'Email Orang Tua', required:false},
  {key:'alamat',      label:'Alamat',          required:false},
  {key:'tahun_masuk', label:'Tahun Masuk',     required:false},
  {key:'_skip',       label:'— Lewati —',      required:false},
];

globalThis.IMP_FIELDS_GURU = [
  {key:'nama',         label:'Nama Lengkap*',   required:true},
  {key:'jabatan',      label:'Jabatan',          required:false},
  {key:'gaji_pokok',   label:'Gaji Pokok (Rp)',  required:false},
  {key:'honor_per_jam',label:'Honor/Jam (Rp)',   required:false},
  {key:'_skip',        label:'— Lewati —',       required:false},
];


globalThis.IMP_SYNONYMS = {
  nama:        ['nama','nama lengkap','full name','nama siswa','nama guru','student name','studentname'],
  nisn:        ['nisn','nis','nomor induk','student id','no induk','no. induk','id siswa'],
  kelas:       ['kelas','class','rombel','grade','classid','class id'],
  jk:          ['jenis kelamin','gender','sex','jk','l/p','lp','kelamin'],
  tgl_lahir:   ['tanggal lahir','tgl lahir','birth date','dob','tgl.lahir','tanggal_lahir','lahir'],
  ayah:        ['nama ayah','nama_ayah','ayah','father','nama wali','wali'],
  ibu:         ['nama ibu','nama_ibu','ibu','mother'],
  hp_ortu:     ['hp orang tua','no hp orang tua','hp_ortu','hp ortu','nomor hp','no.hp','no. hp','kontak ortu','telepon ortu'],
  email_ortu:  ['email orang tua','email_ortu','email ortu','parent email','email ayah','email ibu'],
  alamat:      ['alamat','address','domisili'],
  tahun_masuk: ['tahun masuk','tahun_masuk','angkatan','year','thn masuk','tahun ajaran masuk'],
  jabatan:     ['jabatan','position','posisi','mata pelajaran','mapel'],
  gaji_pokok:  ['gaji pokok','gaji_pokok','gaji','salary','basic salary'],
  honor_per_jam:['honor per jam','honor/jam','honor_per_jam','honor','rate per jam','upah per jam'],
};

// ── autoMapColumns: exact word matching, bukan substring bebas ────────
// Bug lama: 'hl.includes(s)' → "jenis kelamin".includes("nis") = TRUE (salah!)
// Fix: cek apakah header SAMA PERSIS atau mengandung seluruh kata sinonim

function autoMapColumns(headers, type) {
  const fields = type==='siswa' ? IMP_FIELDS_SISWA : IMP_FIELDS_GURU;
  const mapping = {};

  headers.forEach(h => {
    const hl = (h||'').toLowerCase().trim();
    let matched = '_skip';
    let bestScore = 0;

    for (const [field, syns] of Object.entries(IMP_SYNONYMS)) {
      if (!fields.some(f=>f.key===field)) continue;
      for (const syn of syns) {
        let score = 0;
        if (hl === syn) {
          score = 100;  // exact match
        } else if (hl === syn || syn === hl) {
          score = 90;
        } else if (hl.startsWith(syn+' ') || hl.endsWith(' '+syn) || hl.includes(' '+syn+' ')) {
          score = 70;   // syn adalah kata utuh di dalam header
        } else if (syn.startsWith(hl+' ') || syn.endsWith(' '+hl) || syn.includes(' '+hl+' ')) {
          score = 60;   // header adalah kata utuh di dalam syn
        } else if (syn === hl.split(' ')[0]) {
          score = 50;   // syn adalah kata pertama header
        }
        if (score > bestScore) {
          bestScore = score;
          matched = field;
        }
      }
    }

    mapping[h] = matched;
  });

  return mapping;
}


function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length) return {headers:[],rows:[]};
  const parseRow = line => {
    const res=[]; let cur=''; let inQ=false;
    for (let i=0;i<line.length;i++) {
      const c=line[i];
      if (c==='"'){if(inQ&&line[i+1]==='"'){cur+='"';i++;}else inQ=!inQ;}
      else if (c===','&&!inQ){res.push(cur.trim());cur='';}
      else cur+=c;
    }
    res.push(cur.trim()); return res;
  };
  const headers=parseRow(lines[0]);
  const rows=lines.slice(1).filter(l=>l.trim()).map(l=>{
    const vals=parseRow(l); const obj={};
    headers.forEach((h,i)=>obj[h]=vals[i]||''); return obj;
  });
  return {headers,rows};
}


async function parseXLSX(file) {
  return new Promise((resolve,reject)=>{
    const load = () => {
      const reader=new FileReader();
      reader.onload=e=>{
        try {
          const wb=window.XLSX.read(e.target.result,{type:'array',cellDates:true});
          const ws=wb.Sheets[wb.SheetNames[0]];
          const data=window.XLSX.utils.sheet_to_json(ws,{defval:''});
          if (!data.length){reject(new Error('Sheet kosong'));return;}
          const headers=Object.keys(data[0]);
          resolve({headers,rows:data.map(r=>{const obj={};headers.forEach(h=>obj[h]=String(r[h]||'').trim());return obj;})});
        } catch(err){reject(err);}
      };
      reader.onerror=()=>reject(new Error('Gagal membaca file'));
      reader.readAsArrayBuffer(file);
    };
    if (!window.XLSX) {
      const s=document.createElement('script');
      s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      s.onload=load; s.onerror=()=>reject(new Error('Gagal load library XLSX'));
      document.head.appendChild(s);
    } else load();
  });
}


function updateStepUI() {
  showStepPane(impState.step);
  const back=document.getElementById('imp-btn-back');
  const next=document.getElementById('imp-btn-next');
  if (back) back.style.display=impState.step>1&&impState.step<4?'block':'none';
  if (next) next.style.display=impState.step<4?'block':'none';
  if (next) next.textContent=impState.step===3?'✅ Import Sekarang':'Lanjut →';
  for (let i=1;i<=4;i++) {
    const el=document.getElementById(`imp-s${i}`);
    if (!el) continue;
    if (i<impState.step){el.style.background='var(--grn-bg)';el.style.color='var(--grn)';el.style.borderColor='var(--grn)';el.textContent='✓';}
    else if (i===impState.step){el.style.background='var(--cyn-bg)';el.style.color='var(--cyn)';el.style.borderColor='var(--cyn)';el.textContent=i;}
    else{el.style.background='var(--s2)';el.style.color='var(--t3)';el.style.borderColor='var(--bdr2)';el.textContent=i;}
    const ln=document.getElementById(`imp-line${i}`);
    if (ln) ln.style.background=i<impState.step?'var(--grn)':'var(--bdr2)';
  }
}

function downloadTemplate(type) {
  let csv = type === 'siswa'
    ? 'Nama,NISN,Kelas,Jenis Kelamin,Tanggal Lahir,Nama Ayah,Nama Ibu,HP Orang Tua,Email Orang Tua,Alamat,Tahun Masuk\n' +
      'Ahmad Fauzi,0012345678,7-A,L,2014-05-12,Budi Santoso,Sari Dewi,08123456789,budi.santoso@gmail.com,"Jl. Merdeka No.1, Kota",2021\n' +
      'Siti Rahmah,0087654321,8-B,P,2015-03-20,Rahman Ali,Nur Fadilah,08987654321,rahman.ali@gmail.com,"Jl. Pahlawan No.5, Kota",2021'
    : 'Nama,Jabatan,NIP,Gaji Pokok (Rp),Honor/Jam (Rp),Email,HP\n' +
      'Budi Santoso,Guru Matematika,197001011990011001,3500000,35000,budi@sekolah.sch.id,08123456789\n' +
      'Siti Rahmah,Wali Kelas 7A,197505151999012002,3000000,30000,siti@sekolah.sch.id,08987654321';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'}));
  a.download = `template_${type}_sekolahpro.csv`;
  a.click();
  showNotif(`📥 Template ${type} didownload!`, 'ok');
}


globalThis.pinBuffer = '';

globalThis.PIN_LENGTH = 4;

globalThis.PIN_DEFAULT = '1234';


function initPinLock() {
  const cfg = getD().profil_sekolah;
  const enabled = cfg.pin_enabled && cfg.pin_hash;
  if (enabled && !sessionStorage.getItem('sp_unlocked')) {
    showPinScreen();
  }
  // Sync toggle UI
  const tog = document.getElementById('set-pin-toggle');
  if (tog) tog.checked = !!enabled;
  const area = document.getElementById('pin-setup-area');
  if (area) area.style.display = enabled ? 'block' : 'none';
  updateThemeButtons();
}


function hidePinScreen() {
  document.getElementById('pin-lock-screen').classList.remove('show');
  sessionStorage.setItem('sp_unlocked', '1');
}


function pinPress(digit) {
  if (pinBuffer.length >= PIN_LENGTH) return;
  pinBuffer += digit;
  updatePinDots();
  if (pinBuffer.length === PIN_LENGTH) {
    setTimeout(verifyPin, 150);
  }
}


function pinDel() {
  pinBuffer = pinBuffer.slice(0, -1);
  updatePinDots();
  clearPinError();
}


function updatePinDots() {
  for (let i = 0; i < PIN_LENGTH; i++) {
    const dot = document.getElementById(`pd-${i}`);
    if (dot) dot.classList.toggle('filled', i < pinBuffer.length);
  }
}


function verifyPin() {
  const d = getD();
  const stored = d.profil_sekolah.pin_hash || hashPin(PIN_DEFAULT);
  if (hashPin(pinBuffer) === stored) {
    hidePinScreen();
    showNotif('✅ Selamat datang!', 'ok');
  } else {
    pinBuffer = '';
    updatePinDots();
    showPinError('❌ PIN salah! Coba lagi.');
  }
}


function hashPin(pin) {
  // Simple deterministic hash — not cryptographic, just obfuscation
  let h = 0;
  const s = pin + 'sp_salt_arblok_2026';
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return String(h);
}


function clearPinError() {
  const el = document.getElementById('pin-error-msg');
  if (el) el.textContent = '';
}


function skipPin() {
  hidePinScreen();
}


function updateThemeButtons() {
  const isDark = !document.body.classList.contains('light-mode');
  const db = document.getElementById('theme-dark-btn');
  const lb = document.getElementById('theme-light-btn');
  if (db) {
    db.style.background = isDark ? 'var(--grn-bg)' : 'var(--s2)';
    db.style.borderColor = isDark ? 'var(--grn)' : 'var(--bdr2)';
    db.style.color = isDark ? 'var(--grn)' : 'var(--t2)';
  }
  if (lb) {
    lb.style.background = !isDark ? 'var(--yel-bg)' : 'var(--s2)';
    lb.style.borderColor = !isDark ? 'var(--yel)' : 'var(--bdr2)';
    lb.style.color = !isDark ? 'var(--yel)' : 'var(--t2)';
  }
}


function loadTheme() {
  const saved = localStorage.getItem('sp_theme');
  if (saved === 'light') document.body.classList.add('light-mode');
}

// ══════════════════════════════════════
//  RAPOR DIGITAL MODULE
// ══════════════════════════════════════


function bukaRapor() {
  const siswaId = (document.getElementById('rapor-siswa-sel') || {}).value;
  const sem = (document.getElementById('rapor-sem-sel') || { value: '1' }).value;
  if (!siswaId) { showNotif('Pilih siswa terlebih dahulu!', 'err'); return; }
  const html = generateRaporHTML(siswaId, sem);
  const el = document.getElementById('rapor-content');
  if (el) el.innerHTML = html;
  openModal('modal-rapor');
}


function cetakRapor() {
  const siswaId = (document.getElementById('rapor-siswa-sel') || {}).value;
  const sem = (document.getElementById('rapor-sem-sel') || { value: '1' }).value;
  if (!siswaId) { showNotif('Pilih siswa terlebih dahulu!', 'err'); return; }
  const html = generateRaporHTML(siswaId, sem);
  const w = window.open('', '_blank', 'width=700,height=900');
  w.document.write(`<!DOCTYPE html><html><head>
    <meta charset="UTF-8"><title>Rapor Siswa</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{background:#fff;font-family:'Courier New',monospace;font-size:10px}
    @media print{body{margin:0;padding:0}}<\/style>
    <\/head><body>${html}<br/><div style="text-align:center;font-size:8px;color:#999;margin-top:12px;padding-top:8px;border-top:1px solid #eee">
    Dicetak dari Sekolah Pro · © 2026 Arblok Digital · wa.me/6289508053795</div><\/body><\/html>`);
  w.document.close();
  setTimeout(() => w.print(), 500);
}


function generateRaporHTML(siswaId, sem) {
  const d = getD();
  const s = d.data_siswa.find(x => x.id === siswaId);
  if (!s) return '<p>Siswa tidak ditemukan</p>';

  const sekolah = d.profil_sekolah.nama || 'SD Islam Sahara';
  const ta = d.profil_sekolah.tahun_ajaran || new Date().getFullYear() + '/' + (new Date().getFullYear() + 1);
  const semLabel = sem === '1' ? 'Ganjil' : 'Genap';

  // Nilai
  const nilaiData = (s.nilai || {})[sem] || [];
  const byMapel = {};
  nilaiData.forEach(n => {
    if (!byMapel[n.mapel]) byMapel[n.mapel] = [];
    byMapel[n.mapel].push(n);
  });
  const mapelRows = Object.entries(byMapel).map(([mapel, entries]) => {
    const avg = entries.reduce((a, e) => a + e.nilai, 0) / entries.length;
    const grades = { A: 90, B: 80, C: 70, D: 60 };
    const grade = avg >= 90 ? 'A' : avg >= 80 ? 'B' : avg >= 70 ? 'C' : avg >= 60 ? 'D' : 'E';
    const uh = entries.filter(e => e.jenis === 'UH').map(e => e.nilai).join(', ') || '-';
    const uts = entries.find(e => e.jenis === 'UTS')?.nilai || '-';
    const uas = entries.find(e => e.jenis === 'UAS')?.nilai || '-';
    return `<tr><td>${mapel}</td><td style="text-align:center">${uh}</td>
      <td style="text-align:center">${uts}</td><td style="text-align:center">${uas}</td>
      <td style="text-align:center;font-weight:900">${avg.toFixed(1)}</td>
      <td style="text-align:center;font-weight:900">${grade}</td>
      <td style="font-size:8px">${avg >= 70 ? 'Tuntas' : 'Belum Tuntas'}</td></tr>`;
  });
  const allAvgs = Object.values(byMapel).map(entries =>
    entries.reduce((a, e) => a + e.nilai, 0) / entries.length
  );
  const rataRata = allAvgs.length ? (allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length).toFixed(2) : '—';
  const rankGrade = parseFloat(rataRata) >= 90 ? 'A' : parseFloat(rataRata) >= 80 ? 'B' : parseFloat(rataRata) >= 70 ? 'C' : parseFloat(rataRata) >= 60 ? 'D' : '—';

  // Absensi bulan ini
  const absensi = s.absensi || {};
  const year = new Date().getFullYear();
  const counts = { H: 0, I: 0, S: 0, A: 0 };
  Object.entries(absensi).forEach(([tgl, status]) => {
    if (tgl.startsWith(String(year)) && counts[status] !== undefined) counts[status]++;
  });
  const totalHari = counts.H + counts.I + counts.S + counts.A;
  const pctHadir = totalHari > 0 ? ((counts.H / totalHari) * 100).toFixed(0) : '0';

  const today = new Date().toLocaleDateString('id-ID', { dateStyle: 'long' });

  return `<div class="rapor-wrap">
    <div class="rapor-header">
      <div class="rapor-logo">🏫</div>
      <div>
        <div class="rapor-school-name">${sekolah}</div>
        <div class="rapor-school-sub">Laporan Hasil Belajar Siswa</div>
        <div class="rapor-school-sub">Tahun Ajaran ${ta} · Semester ${semLabel}</div>
      </div>
    </div>
    <div class="rapor-title">LAPORAN HASIL BELAJAR SISWA</div>
    <div class="rapor-info-grid">
      <div class="rapor-info-item"><span class="rapor-info-label">Nama</span><span class="rapor-info-val">: ${s.nama}</span></div>
      <div class="rapor-info-item"><span class="rapor-info-label">Kelas</span><span class="rapor-info-val">: ${s.kelas || '—'}</span></div>
      <div class="rapor-info-item"><span class="rapor-info-label">NISN</span><span class="rapor-info-val">: ${s.nisn || '—'}</span></div>
      <div class="rapor-info-item"><span class="rapor-info-label">Semester</span><span class="rapor-info-val">: ${semLabel}</span></div>
      <div class="rapor-info-item"><span class="rapor-info-label">Nama Ayah</span><span class="rapor-info-val">: ${s.ayah || '—'}</span></div>
      <div class="rapor-info-item"><span class="rapor-info-label">Nama Ibu</span><span class="rapor-info-val">: ${s.ibu || '—'}</span></div>
    </div>
    <div class="rapor-section-title">A. HASIL BELAJAR</div>
    ${mapelRows.length > 0 ? `
    <table class="rapor-tbl">
      <thead><tr>
        <th style="width:30%">Mata Pelajaran</th><th>UH</th><th>UTS</th><th>UAS</th>
        <th>Rata-rata</th><th>Grade</th><th>Ket.</th>
      </tr></thead>
      <tbody>${mapelRows.join('')}
        <tr style="font-weight:900;background:#f5f5f5">
          <td colspan="4">Rata-rata Keseluruhan</td>
          <td style="text-align:center;font-weight:900">${rataRata}</td>
          <td style="text-align:center;font-weight:900">${rankGrade}</td>
          <td>${parseFloat(rataRata) >= 70 ? '✅ Naik Kelas' : '⚠️ Perlu Evaluasi'}</td>
        </tr>
      </tbody>
    </table>` :
    '<p style="color:#999;text-align:center;padding:10px;font-style:italic">Belum ada data nilai untuk semester ini</p>'}
    <div class="rapor-section-title">B. KEHADIRAN</div>
    <div class="rapor-abs-grid">
      <div class="rapor-abs-box"><div class="rapor-abs-num">${counts.H}</div><div class="rapor-abs-lbl">Hadir</div></div>
      <div class="rapor-abs-box"><div class="rapor-abs-num">${counts.I}</div><div class="rapor-abs-lbl">Izin</div></div>
      <div class="rapor-abs-box"><div class="rapor-abs-num">${counts.S}</div><div class="rapor-abs-lbl">Sakit</div></div>
      <div class="rapor-abs-box"><div class="rapor-abs-num">${counts.A}</div><div class="rapor-abs-lbl">Alpha</div></div>
    </div>
    <p style="font-size:9px">Persentase kehadiran: <b>${pctHadir}%</b> dari ${totalHari} hari efektif</p>
    <div class="rapor-section-title">C. CATATAN WALI KELAS</div>
    <div style="border:1px solid #ccc;padding:8px;min-height:50px;margin-bottom:10px;font-size:10px;color:#999;font-style:italic">
      ${s.catatan_rapor || 'Siswa menunjukkan perkembangan yang baik. Tetap semangat belajar!'}
    </div>
    <div class="rapor-footer">
      <div class="rapor-sign">
        <div>Mengetahui,</div>
        <div>Orang Tua / Wali</div>
        <div class="rapor-sign-line"></div>
        <div>(${s.ayah || '....................'})</div>
      </div>
      <div class="rapor-sign">
        <div>${sekolah ? sekolah.split(' ')[0] : 'Sekolah'}, ${today}</div>
        <div>Wali Kelas ${s.kelas || '—'},</div>
        <div class="rapor-sign-line"></div>
        <div>(..............................)</div>
      </div>
    </div>
  </div>`;
}


function shareRaporWA() {
  const siswaId = (document.getElementById('rapor-siswa-sel') || {}).value;
  const d = getD();
  const s = d.data_siswa.find(x => x.id === siswaId);
  if (!s || !s.hp_ortu) { showNotif('No HP orang tua tidak ada di profil siswa!', 'warn'); return; }
  const sem = (document.getElementById('rapor-sem-sel') || { value: '1' }).value;
  const semLabel = sem === '1' ? 'Ganjil' : 'Genap';
  const nilaiData = (s.nilai || {})[sem] || [];
  const byMapel = {};
  nilaiData.forEach(n => { if (!byMapel[n.mapel]) byMapel[n.mapel] = []; byMapel[n.mapel].push(n.nilai); });
  const allAvgs = Object.values(byMapel).map(v => v.reduce((a, b) => a + b, 0) / v.length);
  const rata = allAvgs.length ? (allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length).toFixed(1) : '—';
  const absensi = s.absensi || {};
  const H = Object.values(absensi).filter(x => x === 'H').length;
  const A = Object.values(absensi).filter(x => x === 'A').length;
  const msg = `*Laporan Nilai Semester ${semLabel}*\n${d.profil_sekolah.nama}\n\n`+
    `👤 *${s.nama}* — Kelas ${s.kelas}\n`+
    `📊 Rata-rata: *${rata}*\n`+
    `📅 Hadir: *${H} hari* | Alpha: *${A} hari*\n\n`+
    `Terima kasih atas perhatiannya 🙏\n_Sekolah Pro by Arblok Digital_`;
  bukaWA(s.hp_ortu, encodeURIComponent(msg));
}

// ══════════════════════════════════════
//  SHEETS SYNC & SHARE MODULE
// ══════════════════════════════════════


function shareViaWA() {
  const d = getD();
  const saldo = fmt(d.profil_sekolah.saldo_utama);
  const siswaCount = d.data_siswa.length;
  const tunggakan = d.data_siswa.filter(s => s.status_spp === 'Tunggakan').length;
  const totalGaji = d.keuangan_guru.reduce((a, g) => a + (g.total_terima || 0), 0);
  const bosUsed = d.dana_bos.pagu_tahunan > 0
    ? Math.round((d.dana_bos.terpakai / d.dana_bos.pagu_tahunan) * 100) : 0;
  const msg = `*📊 Ringkasan ${d.profil_sekolah.nama}*\n`+
    `🗓 ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}\n\n`+
    `💰 Saldo Kas: *${saldo}*\n`+
    `👥 Total Siswa: *${siswaCount}*\n`+
    `⚠️ Tunggakan SPP: *${tunggakan} siswa*\n`+
    `💸 Total Gaji Guru: *${fmtShort(totalGaji)}*\n`+
    `🏦 BOS Terpakai: *${bosUsed}%*\n\n`+
    `_Laporan dari Sekolah Pro · Arblok Digital_\n`+
    `_wa.me/6289508053795_`;
  bukaWA('6289508053795', encodeURIComponent(msg));
}

// ══════════════════════════════════════
//  INIT — Run on startup
// ══════════════════════════════════════

(function appInit() {
  // Load saved theme
  loadTheme();
  // renderPage patched below (after all functions defined)
  // Show PIN lock if enabled
  setTimeout(initPinLock, 300);
})();

// ════════════════════════════════════════════════════
//  FIREBASE AUTH + OFFLINE-FIRST SYNC MODULE
//  localStorage → online → Firestore background sync
//  Copyright © 2026 Arblok Digital. All Rights Reserved.
// ════════════════════════════════════════════════════

// ── Firebase Config ───────────────────────────────

function _diagLog(msg) {
  const log = document.getElementById('diag-log');
  if (!log) return;
  log.style.display = 'block';
  const ts = new Date().toLocaleTimeString('id-ID');
  log.innerHTML += `<span style="color:var(--t3)">[${ts}]</span> ${msg}\n`;
  log.scrollTop = log.scrollHeight;
}


function _diagRow(label, value, ok, color) {
  const c = color || (ok ? 'var(--grn)' : 'var(--red)');
  const bg = ok ? 'rgba(0,230,118,.05)' : 'rgba(255,82,82,.06)';
  const br = ok ? 'rgba(0,230,118,.15)' : 'rgba(255,82,82,.2)';
  return `<div style="display:flex;align-items:start;gap:8px;padding:6px 8px;background:${bg};border-radius:7px;border:1px solid ${br}">
    <span style="font-size:10px;color:var(--t3);min-width:84px;flex-shrink:0;font-weight:600;padding-top:1px">${label}</span>
    <span style="font-size:11px;font-weight:700;color:${c};flex:1;word-break:break-all">${value}</span>
  </div>`;
}


async function runDiagnostic() {
  const el = document.getElementById('diagnostic-results');
  if (!el) return;

  // Bersihkan log
  const logEl = document.getElementById('diag-log');
  if (logEl) { logEl.innerHTML = ''; logEl.style.display = 'none'; }

  // Render status statis
  renderDiagnosticPanel();
  _diagLog('Diagnostik dimulai...');

  // Jika belum login/offline — hentikan di sini
  if (!_fbDb || !_fbUser || !navigator.onLine) {
    _diagLog('⚠️ Tidak dapat uji Firestore — login dulu atau cek koneksi.');
    showNotif('⚠️ Cek status di Pengaturan', 'warn');
    return;
  }

  // Tambah baris loading sementara
  const isDesktop = window.innerWidth >= 900;
  el.style.gridTemplateColumns = isDesktop ? '1fr 1fr' : '1fr';
  el.innerHTML += _diagRow('⏳ Firestore', 'Menghubungi...', true, 'var(--yel)');
  const fbRows = [];

  // ── Test 1: Latency baca doc user ──────────────────────────
  _diagLog('Membaca users/' + _fbUser.uid.slice(0,12) + '...');
  try {
    const t0 = Date.now();
    const doc = await _fbDb.collection('users').doc(_fbUser.uid).get();
    const ms  = Date.now() - t0;
    const ok  = doc.exists;
    fbRows.push(['👤 Read users', ok ? `✅ ${ms}ms · ${Object.keys(doc.data()).length} field` : `⚠️ Doc tidak ada (${ms}ms)`, ok, 'var(--cyn)']);
    _diagLog((ok?'✅':'⚠️') + ' users read: ' + ms + 'ms');
  } catch(e) {
    fbRows.push(['👤 Read users', '❌ ' + (e.code||e.message).slice(0,40), false]);
    _diagLog('❌ users read error: ' + (e.code||e.message));
  }

  // ── Test 2: Hitung students ────────────────────────────────
  const sid = _fbSchoolId || '';
  _diagLog('Query students schoolId=' + sid + '...');
  try {
    const t0 = Date.now();
    let snap;
    try { snap = await _fbDb.collection('students').where('schoolid','==',sid).limit(10).get(); }
    catch { snap = await _fbDb.collection('students').where('schoolId','==',sid).limit(10).get(); }
    const ms = Date.now() - t0;
    const ok = snap.size > 0;
    fbRows.push(['📚 Students DB', `${ok?'✅':'⚠️'} ${snap.size} doc (${ms}ms)`, ok, 'var(--cyn)']);
    _diagLog((ok?'✅':'⚠️') + ' students: ' + snap.size + ' doc, ' + ms + 'ms');
  } catch(e) {
    fbRows.push(['📚 Students DB', '❌ ' + (e.code||'').slice(0,35), false]);
    _diagLog('❌ students error: ' + (e.code||e.message));
  }

  // ── Test 3: schools/{sid}/settings ────────────────────────
  // Dev mode (schoolId kosong) → skip test ini, tidak relevan
  if (!_fbSchoolId) {
    fbRows.push(['🏫 School Settings', '⚠️ Dev mode — tidak ada sekolah terkait', true, 'var(--t3)']);
    _diagLog('⚠️ Dev mode: skip school settings test (no schoolId)');
  } else {
    _diagLog('Cek schools/' + _fbSchoolId + '/settings/profile...');
    try {
      const t0 = Date.now();
      const snap = await _fbDb.collection('schools').doc(_fbSchoolId).collection('settings').doc('profile').get();
      const ms  = Date.now() - t0;
      fbRows.push(['🏫 School Settings', snap.exists ? `✅ Ada (${ms}ms)` : `⚠️ Belum ada (${ms}ms)`, snap.exists, 'var(--cyn)']);
      _diagLog((snap.exists?'✅':'⚠️') + ' settings: ' + ms + 'ms');
    } catch(e) {
      fbRows.push(['🏫 School Settings', '❌ ' + (e.code||'').slice(0,35), false]);
      _diagLog('❌ settings error: ' + (e.code||e.message));
    }
  }

  // ── Test 4: Write ping ─────────────────────────────────────
  _diagLog('Write test ke users/_last_ping...');
  try {
    const t0 = Date.now();
    await _fbDb.collection('users').doc(_fbUser.uid).set(
      { _last_ping: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    const ms = Date.now() - t0;
    fbRows.push(['✏️ Write Test', `✅ Berhasil (${ms}ms)`, true, 'var(--cyn)']);
    _diagLog('✅ write: ' + ms + 'ms');
  } catch(e) {
    fbRows.push(['✏️ Write Test', '❌ ' + (e.code||e.message).slice(0,35), false]);
    _diagLog('❌ write error: ' + (e.code||e.message));
  }

  // Ganti loading row dengan hasil
  const allOk = fbRows.every(r => r[2]);
  renderDiagnosticPanel();
  el.innerHTML += fbRows.map(([l,v,ok,c]) => _diagRow(l,v,ok,c)).join('');

  // Update badge
  const badge = document.getElementById('diag-status-badge');
  if (badge) {
    badge.textContent = allOk ? '✅ Semua OK' : '⚠️ Ada masalah';
    badge.style.background = allOk ? 'var(--grn-bg)' : 'var(--red-bg)';
    badge.style.borderColor = allOk ? 'var(--grn)' : 'var(--red)';
    badge.style.color = allOk ? 'var(--grn)' : 'var(--red)';
  }

  _diagLog(allOk ? '🎉 Semua tes Firebase berhasil!' : '⚠️ Ada tes yang gagal, cek detail di atas.');
  showNotif(allOk ? '✅ Firebase OK — data siap ditarik/dipush!' : '⚠️ Ada masalah koneksi Firebase', allOk ? 'ok' : 'warn');
}

// ════════════════════════════════════════════════════════════════════
//  MODUL KELAS — SD / SMP / SMA dengan Sub A B C
//  Mendukung offline dan online, data di localStorage
// ════════════════════════════════════════════════════════════════════

// ── Konstanta jenjang ─────────────────────────────────────────────

// ── getKelasList() — generate daftar kelas dari config ──────────
// Contoh SD + A,B,C → ["1-A","1-B","1-C","2-A",...]
// Contoh SMP + A,B → ["7-A","7-B","8-A","8-B","9-A","9-B"]

Object.assign(globalThis, { exportData, autoMapColumns, parseCSV, parseXLSX, updateStepUI, downloadTemplate, initPinLock, hidePinScreen, pinPress, pinDel, updatePinDots, verifyPin, hashPin, clearPinError, skipPin, updateThemeButtons, loadTheme, bukaRapor, cetakRapor, generateRaporHTML, shareRaporWA, shareViaWA, _diagLog, _diagRow, runDiagnostic });
export { exportData, autoMapColumns, parseCSV, parseXLSX, updateStepUI, downloadTemplate, initPinLock, hidePinScreen, pinPress, pinDel, updatePinDots, verifyPin, hashPin, clearPinError, skipPin, updateThemeButtons, loadTheme, bukaRapor, cetakRapor, generateRaporHTML, shareRaporWA, shareViaWA, _diagLog, _diagRow, runDiagnostic };
