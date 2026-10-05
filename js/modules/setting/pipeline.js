// js/modules/setting/pipeline.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

function saveSettings() {
  const d = getD();
  d.profil_sekolah.nama = document.getElementById('set-nama').value.trim() || d.profil_sekolah.nama;
  d.profil_sekolah.tahun_ajaran = document.getElementById('set-tahun-ajaran').value.trim();
  d.profil_sekolah.spp_nominal = parseFloat(document.getElementById('set-spp-nominal').value) || 0;
  d.profil_sekolah.pengumuman = document.getElementById('set-pengumuman').value.trim();
  saveDB();
  // Sync all name displays
  const nama = d.profil_sekolah.nama;
  ['banner-school-name','banner-nama-besar','sidebar-school-name'].forEach(id => {
    const el = document.getElementById(id); if (el) el.textContent = nama;
  });
  const taEl = document.getElementById('banner-ta');
  if (taEl) taEl.textContent = 'T.A. ' + (d.profil_sekolah.tahun_ajaran || '');
  buildTicker();
  showNotif('✅ Pengaturan disimpan!', 'ok');
  if (currentPage === 'dashboard') renderDashboard();
}


function importData() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!imported.sekolah_pro) throw new Error('Format tidak valid');
        DB = imported;
        saveDB(); buildTicker();
        showNotif('📥 Data berhasil diimpor!', 'ok');
        renderPage(currentPage);
      } catch { showNotif('❌ File tidak valid!', 'err'); }
    };
    reader.readAsText(file);
  };
  input.click();
}


async function resetData() {
  if (!confirm('⚠️ Reset semua data lokal?\n\nData di Firestore TIDAK akan dihapus otomatis.\nHanya cache lokal yang direset.')) return;

  const hapusFirestore = _fbDb && navigator.onLine &&
    confirm('🔥 Hapus juga data dari Firestore?\n(TIDAK BISA DIBATALKAN)');

  if (hapusFirestore) {
    showNotif('🔄 Menghapus dari Firestore...', 'warn');
    try {
      const batches = [];
      let batch = _fbDb.batch();
      let count = 0;

      const addToBatch = (ref) => {
        batch.delete(ref);
        count++;
        if (count % 500 === 0) {
          batches.push(batch.commit());
          batch = _fbDb.batch();
        }
      };

      // Hapus broadcasts (dev & admin bisa)
      const bcSnap = await _fbDb.collection('broadcasts').get()
        .catch(() => ({ docs: [] }));
      bcSnap.docs.forEach(doc => addToBatch(doc.ref));

      // Hapus students
      // Dev: hapus semua | Admin: hapus sesuai schoolId atau semua jika kosong
      let sQuery = _fbDb.collection('students').limit(500);
      if (_fbSchoolId) {
        // Coba filter dulu
        const filtered = await _fbDb.collection('students')
          .where('schoolid', '==', _fbSchoolId).get()
          .catch(() => ({ docs: [] }));
        const sSnap = filtered.docs.length > 0 ? filtered
          : await _fbDb.collection('students').limit(500).get()
              .catch(() => ({ docs: [] }));
        sSnap.docs.forEach(doc => addToBatch(doc.ref));
      } else {
        const sSnap = await sQuery.get().catch(() => ({ docs: [] }));
        sSnap.docs.forEach(doc => addToBatch(doc.ref));
      }

      if (count % 500 !== 0) batches.push(batch.commit());
      await Promise.all(batches);
      _ADS_ACTIVE = [];
      showNotif(`🔥 ${count} dokumen Firestore dihapus`, 'warn');
    } catch(e) {
      console.error('[RESET]', e);
      showNotif('❌ Firestore delete error: ' + (e.code || e.message), 'err');
    }
  }

  // Reset lokal
  DB = JSON.parse(JSON.stringify(DEFAULT_DATA));
  saveDB(); buildTicker(); _renderAllAds();
  showNotif('🗑️ Data lokal direset', 'warn');
  renderPage(currentPage);
}

// ── AKTIVITAS LOG ──

async function processFile(file) {
  const nm=file.name.toLowerCase();
  try {
    showNotif('🔄 Membaca file...','warn');
    let result;
    if (nm.endsWith('.csv')) { result=parseCSV(await file.text()); }
    else if (nm.endsWith('.xlsx')||nm.endsWith('.xls')) { result=await parseXLSX(file); }
    else { showNotif('❌ Gunakan format CSV atau Excel!','err'); return; }
    if (!result.rows.length) { showNotif('⚠️ File kosong!','err'); return; }
    impState.rawRows=result.rows; impState.headers=result.headers;
    impState.mapping=autoMapColumns(result.headers,impState.type);
    const fi=document.getElementById('imp-file-info');
    fi.style.display='flex';
    document.getElementById('imp-filename').textContent=file.name;
    document.getElementById('imp-fileinfo').textContent=`${result.rows.length} baris · ${result.headers.length} kolom · ${(file.size/1024).toFixed(1)} KB`;
    showNotif(`✅ ${result.rows.length} baris berhasil dibaca`,'ok');
  } catch(err) { showNotif('❌ '+err.message,'err'); }
}


function importNextStep() {
  const s=impState.step;
  if (s===1) {
    if (!impState.rawRows.length){showNotif('Upload file dulu!','err');return;}
    impState.step=2; renderMappingStep();
  } else if (s===2) {
    const fields=impState.type==='siswa'?IMP_FIELDS_SISWA:IMP_FIELDS_GURU;
    const missing=fields.filter(f=>f.required&&!Object.values(impState.mapping).includes(f.key));
    if (missing.length){showNotif('⚠️ Petakan kolom wajib: '+missing.map(f=>f.label).join(', '),'err');return;}
    impState.step=3; renderPreviewStep();
  } else if (s===3) { impState.step=4; runImport(); }
  updateStepUI();
}

function importPrevStep() { if (impState.step>1&&impState.step<4){impState.step--;updateStepUI();showStepPane(impState.step);} }


async function runImport() {
  const d    = getD();
  const mode = impState.mode || 'add';

  // ── Pilih baris yang akan diproses berdasarkan mode ──────────────────
  let rowsToProcess;
  if (mode === 'overwrite') {
    // Hapus data lama, import semua
    rowsToProcess = impState.previewRows;
    if (impState.type === 'siswa') d.data_siswa      = [];
    else                           d.keuangan_guru   = [];
  } else if (mode === 'replace') {
    // Semua baris — duplikat akan di-update
    rowsToProcess = impState.previewRows;
  } else {
    // 'add' — hanya baris baru (skip duplikat)
    rowsToProcess = impState.previewRows.filter((_,i) => !impState.dupRows.has(i));
  }

  const total = rowsToProcess.length;
  let imported = 0;
  const bar   = document.getElementById('imp-result-bar');
  const title = document.getElementById('imp-result-title');
  const sub   = document.getElementById('imp-result-sub');
  if (title) title.textContent = `Mengimport ${total} data...`;

  // ID unik: pakai baseTimestamp + globalIndex (bukan Date.now() per item!)
  const baseTs = Date.now();
  const importedSiswaList = [];

  for (let i = 0; i < rowsToProcess.length; i += 20) {
    rowsToProcess.slice(i, i+20).forEach((row, ci) => {
      const globalIdx = i + ci;

      if (impState.type === 'siswa') {
        const jkNorm = (row.jk||'').toLowerCase().includes('p') ? 'P' : 'L';
        const newId  = 'S' + baseTs + '_' + globalIdx + '_' + Math.random().toString(36).slice(2,5);

        const obj = {
          id:             newId,
          nama:           row.nama          || '',
          nisn:           row.nisn          || '',
          kelas:          row.kelas         || '',
          jk:             jkNorm,
          tgl_lahir:      row.tgl_lahir     || '',
          tahun_masuk:    row.tahun_masuk   || new Date().getFullYear(),
          ayah:           row.ayah          || '',
          ibu:            row.ibu           || '',
          hp_ortu:        row.hp_ortu       || '',
          email_ortu:     row.email_ortu    || '',
          alamat:         row.alamat        || '',
          pekerjaan_ortu: '',
          status_spp:     'Lunas',
          total_piutang:  0,
          piutang_detail: [],
          absensi:        {},
          nilai:          {},
          schoolId:       _fbSchoolId       || '',
        };

        if (mode === 'replace') {
          // Update existing jika NISN sama, atau nama sama jika tidak ada NISN
          const nisn = obj.nisn.trim();
          const existIdx = d.data_siswa.findIndex(s =>
            (nisn && s.nisn === nisn) ||
            (!nisn && (s.nama||'').toLowerCase() === obj.nama.toLowerCase())
          );
          if (existIdx >= 0) {
            // Pertahankan id, status SPP, absensi, nilai lama
            obj.id           = d.data_siswa[existIdx].id;
            obj.status_spp   = d.data_siswa[existIdx].status_spp;
            obj.total_piutang= d.data_siswa[existIdx].total_piutang;
            obj.absensi      = d.data_siswa[existIdx].absensi;
            obj.nilai        = d.data_siswa[existIdx].nilai;
            d.data_siswa[existIdx] = obj;
          } else {
            d.data_siswa.push(obj);
          }
        } else {
          d.data_siswa.push(obj);
        }
        importedSiswaList.push(obj);

      } else {
        // GURU
        const guruId  = 'G' + baseTs + '_' + globalIdx;
        const guruObj = {
          id:            guruId,
          nama:          row.nama          || '',
          jabatan:       row.jabatan       || 'Guru',
          gaji_pokok:    parseFloat((row.gaji_pokok||'0').replace(/[^\d.]/g,''))    || 0,
          honor_per_jam: parseFloat((row.honor_per_jam||'0').replace(/[^\d.]/g,'')) || 0,
          jam_mengajar:  0,
          total_terima:  parseFloat((row.gaji_pokok||'0').replace(/[^\d.]/g,''))    || 0,
          sudah_dibayar: false,
          schoolId:      _fbSchoolId       || '',
        };
        if (mode === 'replace') {
          const ex = d.keuangan_guru.findIndex(g =>
            (g.nama||'').toLowerCase() === guruObj.nama.toLowerCase()
          );
          if (ex >= 0) { guruObj.id = d.keuangan_guru[ex].id; d.keuangan_guru[ex] = guruObj; }
          else d.keuangan_guru.push(guruObj);
        } else {
          d.keuangan_guru.push(guruObj);
        }
      }
      imported++;
    });

    if (bar) bar.style.width = Math.round((imported/total)*100) + '%';
    if (sub) sub.textContent  = `${imported} / ${total} diproses...`;
    await new Promise(r => setTimeout(r, 10));
  }

  // ── Simpan ke localStorage ───────────────────────────────────────────
  saveDB();
  buildTicker();
  addAktivitas('import', `Smart Import (${mode}): ${imported} ${impState.type}`, 0);

  // ── AUTO SYNC KE FIRESTORE langsung setelah import ───────────────────
  if (_fbDb && _fbUser && navigator.onLine) {
    console.log('[Import] Memulai sync ke Firestore...');
    _fbSyncPending = true;
    _updateSyncBadge();
    _fbFlushQueue()
      .then(() => {
        showNotif(`☁️ ${imported} ${impState.type} berhasil disimpan ke Firestore`, 'ok');
      })
      .catch(e => {
        console.warn('[Import] Firestore sync error:', e.message);
        showNotif('⚠️ Tersimpan lokal, sync Firestore gagal: ' + e.message, 'warn');
      });
  }

  // ── Auto buat/update profil ortu di Firestore ────────────────────────
  if (impState.type === 'siswa' && _fbDb && _fbUser && importedSiswaList.length > 0) {
    const withEmail = importedSiswaList.filter(s => s.email_ortu);
    if (withEmail.length) {
      showNotif(`🔄 Membuat ${withEmail.length} profil ortu di Firestore...`, 'warn');
      _syncOrtuAfterImport(withEmail);
    }
  }

  // ── Render hasil ─────────────────────────────────────────────────────
  const modeLabel = { add:'Tambah Baru', overwrite:'Timpa Semua', replace:'Update Duplikat' }[mode];
  const skipped   = impState.previewRows.length - (mode==='add' ? imported : 0);
  const pane = document.getElementById('imp-pane-4');
  if (pane) pane.innerHTML = `
    <div style="padding:20px;text-align:center">
      <div style="font-size:56px;margin-bottom:12px">🎉</div>
      <div style="font-size:18px;font-weight:900;color:var(--grn);margin-bottom:6px">Import Berhasil!</div>
      <div style="display:inline-block;background:var(--grn-bg);border:1px solid var(--grn);border-radius:20px;padding:3px 12px;font-size:10px;font-weight:800;color:var(--grn);margin-bottom:12px;text-transform:uppercase">
        Mode: ${modeLabel}
      </div>
      <div style="font-size:13px;color:var(--t2);margin-bottom:16px;line-height:1.8">
        <b style="color:var(--grn);font-size:18px">${imported}</b> data ${impState.type} berhasil diimport
        ${mode==='add' && impState.dupRows.size>0 ? `<br/><span style="color:var(--yel)">⏭️ ${impState.dupRows.size} duplikat dilewati</span>` : ''}
        ${mode==='overwrite' ? '<br/><span style="color:var(--amb)">♻️ Data lama sudah diganti</span>' : ''}
        ${mode==='replace'   ? '<br/><span style="color:var(--cyn)">✏️ Duplikat diperbarui</span>' : ''}
        <br/><span style="color:var(--cyn)">☁️ Sinkronisasi ke Firestore berjalan...</span>
        ${impState.type==='siswa' && importedSiswaList.filter(s=>s.email_ortu).length>0
          ? `<br/><span style="color:var(--pur)">👨‍👩‍👦 ${importedSiswaList.filter(s=>s.email_ortu).length} profil ortu dibuat di Firestore</span>`
          : ''}
      </div>
      <div style="display:flex;gap:8px;justify-content:center;margin-bottom:16px">
        <div class="imp-sum-box" style="background:var(--grn-bg);border:1px solid rgba(0,230,118,.2)"><div class="imp-sum-num" style="color:var(--grn)">${imported}</div><div class="imp-sum-lbl">Diimport</div></div>
        <div class="imp-sum-box" style="background:var(--cyn-bg);border:1px solid rgba(38,198,218,.2)"><div class="imp-sum-num" style="color:var(--cyn)">${impState.previewRows.length}</div><div class="imp-sum-lbl">Total File</div></div>
        ${importedSiswaList.filter(s=>s.email_ortu).length>0
          ? `<div class="imp-sum-box" style="background:var(--pur-bg);border:1px solid rgba(192,132,252,.2)"><div class="imp-sum-num" style="color:var(--pur)">${importedSiswaList.filter(s=>s.email_ortu).length}</div><div class="imp-sum-lbl">Profil Ortu</div></div>`
          : ''}
      </div>
      <button class="abtn abtn-g" style="width:100%;padding:13px;font-size:14px"
        onclick="closeModal('modal-smart-import');switchPage('${impState.type==='siswa'?'crm':'guru'}')">
        👁️ Lihat Data ${impState.type==='siswa'?'Siswa':'Guru'}
      </button>
    </div>`;

  if (currentPage==='crm')       renderCRM();
  if (currentPage==='guru')      renderGuru();
  // Force reload DB dari localStorage dulu, lalu render dashboard
  DB = loadDB();
  renderDashboard();
  populateSiswaSelect();
}

// ── Sync profil ortu ke Firestore setelah import siswa ────────────────
// Untuk setiap siswa yang punya email_ortu:
//   1. Cek apakah user dengan email tersebut sudah ada di Firestore
//   2. Jika belum → buat dokumen user baru di koleksi 'users'
//      dengan role 'ortu', schoolId, dan children = [siswaId]
//   3. Jika sudah ada → tambahkan siswaId ke children (jika belum ada)

function resetImport() {
  impState = { step:1, type:impState.type, rawRows:[], headers:[], mapping:{}, previewRows:[], dupRows:new Set(), mode:'add' };
  const fi = document.getElementById('imp-file-info'); if (fi) fi.style.display='none';
  const inp= document.getElementById('imp-file-input');if (inp) inp.value='';
  // Reset mode button UI ke default 'add'
  setTimeout(() => setImportMode('add'), 50);
  updateStepUI(); showStepPane(1);
}

// ══════════════════════════════════════
//  PIN LOCK MODULE
//  Copyright © 2026 Arblok Digital
// ══════════════════════════════════════


function togglePinLock(enabled) {
  const area = document.getElementById('pin-setup-area');
  if (area) area.style.display = enabled ? 'block' : 'none';
  if (!enabled) {
    const d = getD();
    d.profil_sekolah.pin_enabled = false;
    saveDB();
    showNotif('🔓 PIN Lock dinonaktifkan', 'warn');
  }
  // Sync visual slider
  const slider = document.getElementById('pin-toggle-slider');
  const dot = document.getElementById('pin-toggle-dot');
  if (slider) slider.style.background = enabled ? 'var(--grn)' : 'var(--s3)';
  if (dot) dot.style.transform = enabled ? 'translateX(20px)' : 'translateX(0)';
}


function savePIN() {
  const p1 = document.getElementById('set-pin-new').value;
  const p2 = document.getElementById('set-pin-confirm').value;
  if (p1.length !== 4 || !/^\d{4}$/.test(p1)) { showNotif('PIN harus 4 digit angka!', 'err'); return; }
  if (p1 !== p2) { showNotif('Konfirmasi PIN tidak cocok!', 'err'); return; }
  const d = getD();
  d.profil_sekolah.pin_enabled = true;
  d.profil_sekolah.pin_hash = hashPin(p1);
  saveDB();
  document.getElementById('set-pin-new').value = '';
  document.getElementById('set-pin-confirm').value = '';
  showNotif('✅ PIN berhasil disimpan!', 'ok');
}

// ══════════════════════════════════════
//  THEME MODULE — Dark / Light
// ══════════════════════════════════════


function backupNow() {
  exportData();
  showNotif('✅ Backup berhasil di-download!', 'ok');
}


Object.assign(globalThis, { saveSettings, importData, resetData, processFile, importNextStep, importPrevStep, runImport, resetImport, togglePinLock, savePIN, backupNow });
export { saveSettings, importData, resetData, processFile, importNextStep, importPrevStep, runImport, resetImport, togglePinLock, savePIN, backupNow };
