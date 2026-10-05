// js/modules/setting/route.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

import './logic.js';
import './pipeline.js';

function renderSetting() {
  const d = getD();
  // Auto-fill schoolId di user management card
  setTimeout(() => {
    const el = document.getElementById('usr-schoolid');
    if (el) el.value = _fbSchoolId || '';
    // Sembunyikan card user management jika bukan admin/dev
    const card = document.getElementById('card-user-mgmt');
    if (card) card.style.display = (_fbRole==='dev'||_fbRole==='admin') ? 'block' : 'none';
  }, 100);
  document.getElementById('set-nama').value = d.profil_sekolah.nama || '';
  document.getElementById('set-tahun-ajaran').value = d.profil_sekolah.tahun_ajaran || '';
  document.getElementById('set-spp-nominal').value = d.profil_sekolah.spp_nominal || '';
  document.getElementById('set-pengumuman').value = d.profil_sekolah.pengumuman || '';
  populateRaporSiswaSel();
  updateThemeButtons();
  // Sync PIN toggle
  const tog = document.getElementById('set-pin-toggle');
  if (tog) {
    const enabled = !!d.profil_sekolah.pin_enabled;
    tog.checked = enabled;
    const area = document.getElementById('pin-setup-area');
    if (area) area.style.display = enabled ? 'block' : 'none';
    const slider = document.getElementById('pin-toggle-slider');
    const dot = document.getElementById('pin-toggle-dot');
    if (slider) slider.style.background = enabled ? 'var(--grn)' : 'var(--s3)';
    if (dot) dot.style.transform = enabled ? 'translateX(20px)' : 'translateX(0)';
  }
  // Login info
  const loginInfo = document.getElementById('set-login-info');
  if (loginInfo) {
    if (_fbUser) {
      const lastSync = localStorage.getItem('sp_last_sync');
      const syncStr = lastSync ? new Date(lastSync).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}) : 'Belum pernah';
      loginInfo.innerHTML = `Login sebagai: <b style="color:var(--grn)">${_fbUser.email}</b> · Role: <b>${_fbRole}</b><br/>Last sync: ${syncStr}`;
    } else if (_fbOfflineMode) {
      loginInfo.innerHTML = '<span style="color:var(--yel)">📴 Mode Offline — data tersimpan lokal saja</span>';
    } else {
      loginInfo.innerHTML = '<span style="color:var(--t3)">Belum login</span>';
    }
  }
  // Sync status label
  const syncLbl = document.getElementById('set-sync-status-sub');
  if (syncLbl) {
    if (!_fbUser) syncLbl.textContent = 'Login dulu untuk mengaktifkan sync';
    else if (!navigator.onLine) syncLbl.textContent = '📴 Offline — akan sync saat online';
    else if (_fbSyncPending) syncLbl.textContent = '🔄 Ada perubahan yang belum tersync';
    else syncLbl.textContent = '✅ Semua data sudah tersyncronisasi';
  }
  // Last sync time
  const lastSyncEl = document.getElementById('set-last-sync-time');
  if (lastSyncEl) {
    const ls = localStorage.getItem('sp_last_sync');
    lastSyncEl.textContent = ls
      ? new Date(ls).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})
      : '—';
  }
}


function setImportMode(mode) {
  impState.mode = mode;
  const modes = ['add','overwrite','replace'];
  const colors = { add:'var(--grn)', overwrite:'var(--amb)', replace:'var(--cyn)' };
  const descs  = {
    add:       '➕ <b>Tambah Baru:</b> Hanya import data yang belum ada (skip duplikat)',
    overwrite: '🔄 <b>Timpa Semua:</b> Hapus semua data lama, ganti dengan file ini',
    replace:   '💾 <b>Update Duplikat:</b> Data baru ditambah, duplikat di-update dengan data terbaru',
  };
  modes.forEach(m => {
    const btn = document.getElementById('imp-mode-'+m);
    if (!btn) return;
    const active = m === mode;
    const c = colors[m];
    btn.style.background = active ? c+'22' : 'var(--s2)';
    btn.style.borderColor = active ? c : 'var(--bdr2)';
    btn.style.color = active ? c : 'var(--t3)';
  });
  const descEl = document.getElementById('imp-mode-desc');
  if (descEl) descEl.innerHTML = descs[mode] || '';
  // Re-render preview dengan mode baru
  if (impState.previewRows.length) renderPreviewStep();
}


function openSmartImport(type) {
  resetImport(); setImportType(type); openModal('modal-smart-import');
}


function setImportType(type) {
  impState.type=type;
  const s=['siswa','guru'];
  const c={siswa:'var(--cyn)',guru:'var(--pur)'};
  s.forEach(t=>{
    const btn=document.getElementById(`imp-type-${t}`);
    if (!btn) return;
    const active=t===type;
    btn.style.background=active?`${c[t]}15`:'var(--s2)';
    btn.style.borderColor=active?c[t]:'var(--bdr2)';
    btn.style.color=active?c[t]:'var(--t3)';
  });
}


function handleFileDrop(e) {
  e.preventDefault();
  document.getElementById('imp-drop-zone').classList.remove('drag-over');
  if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
}

function handleFileSelect(e) { if (e.target.files[0]) processFile(e.target.files[0]); }


function showStepPane(step) {
  for (let i=1;i<=4;i++){const p=document.getElementById(`imp-pane-${i}`);if(p)p.className=i===step?'modal-tab-pane on':'modal-tab-pane';}
}


function renderMappingStep() {
  const fields=impState.type==='siswa'?IMP_FIELDS_SISWA:IMP_FIELDS_GURU;
  document.getElementById('imp-mapping-container').innerHTML=impState.headers.map(h=>{
    const opts=fields.map(f=>`<option value="${f.key}"${impState.mapping[h]===f.key?' selected':''}>${f.label}</option>`).join('');
    const isReq=fields.find(f=>f.key===impState.mapping[h])?.required;
    return `<div class="col-map-row">
      <div class="col-src" title="${h}">${h}${isReq?'<span class="bdg bdg-g" style="font-size:8px;margin-left:4px">Wajib</span>':''}</div>
      <div class="col-arrow">→</div>
      <div class="col-dest"><select onchange="impState.mapping['${h.replace(/'/g,"\\'")}'] = this.value;renderMappingStep()">${opts}</select></div>
    </div>`;
  }).join('');
}


function renderPreviewStep() {
  const d=getD();
  const fields=(impState.type==='siswa'?IMP_FIELDS_SISWA:IMP_FIELDS_GURU).filter(f=>f.key!=='_skip');
  const activeCols=fields.filter(f=>Object.values(impState.mapping).includes(f.key));
  impState.previewRows=impState.rawRows.map(raw=>{
    const row={};
    Object.entries(impState.mapping).forEach(([src,dest])=>{if(dest!=='_skip')row[dest]=(raw[src]||'').trim();});
    return row;
  }).filter(r=>r.nama&&r.nama.trim());
  impState.dupRows=new Set();

  // ── FIX: duplikat check pakai NISN jika ada, bukan nama ──────────────
  // Nama bisa sama (Ahmad Santoso bisa ada 2 orang berbeda)
  // NISN pasti unik per siswa
  const existing = impState.type==='siswa' ? d.data_siswa : d.keuangan_guru;
  const existingNisn = new Set(existing.map(x=>(x.nisn||'').trim()).filter(Boolean));
  const existingNama = new Set(existing.map(x=>(x.nama||'').trim().toLowerCase()));
  const seenNisn = new Set();
  const seenNama = new Set();

  impState.previewRows.forEach((row,i)=>{
    const nisn = (row.nisn||'').trim();
    const nama = (row.nama||'').toLowerCase().trim();
    let isDup = false;

    if (nisn) {
      // Ada NISN → cek duplikat berdasarkan NISN
      isDup = existingNisn.has(nisn) || seenNisn.has(nisn);
      seenNisn.add(nisn);
    } else {
      // Tidak ada NISN → fallback ke nama
      isDup = existingNama.has(nama) || seenNama.has(nama);
    }
    seenNama.add(nama);
    if (isDup) impState.dupRows.add(i);
  });

  const total=impState.previewRows.length, dups=impState.dupRows.size, news=total-dups;
  document.getElementById('imp-summary').innerHTML=`
    <div class="imp-sum-box" style="background:var(--cyn-bg);border:1px solid rgba(38,198,218,.2)"><div class="imp-sum-num" style="color:var(--cyn)">${total}</div><div class="imp-sum-lbl">Total</div></div>
    <div class="imp-sum-box" style="background:var(--grn-bg);border:1px solid rgba(0,230,118,.2)"><div class="imp-sum-num" style="color:var(--grn)">${news}</div><div class="imp-sum-lbl">Data Baru</div></div>
    <div class="imp-sum-box" style="background:var(--red-bg);border:1px solid rgba(255,82,82,.2)"><div class="imp-sum-num" style="color:var(--red)">${dups}</div><div class="imp-sum-lbl">Duplikat</div></div>`;
  document.getElementById('imp-preview-head').innerHTML=`<tr><th>#</th><th>Status</th>${activeCols.map(f=>`<th>${f.label.replace('*','')}</th>`).join('')}</tr>`;
  document.getElementById('imp-preview-body').innerHTML=impState.previewRows.slice(0,50).map((row,i)=>{
    const dup=impState.dupRows.has(i);
    return `<tr class="${dup?'dup-row':'ok-row'}"><td style="color:var(--t3);font-family:'Courier New',monospace">${i+1}</td><td>${dup?'<span class="bdg bdg-r">Duplikat</span>':'<span class="bdg bdg-g">Baru</span>'}</td>${activeCols.map(f=>`<td>${row[f.key]||'—'}</td>`).join('')}</tr>`;
  }).join('')+(impState.previewRows.length>50?`<tr><td colspan="${activeCols.length+2}" style="text-align:center;color:var(--t3);padding:10px;font-style:italic">...dan ${impState.previewRows.length-50} baris lagi</td></tr>`:'');
}


async function _syncOrtuAfterImport(siswaList) {
  const ortuBatch = {};
  // Kelompokkan berdasarkan email ortu
  siswaList.forEach(siswa => {
    const email = (siswa.email_ortu || '').trim().toLowerCase();
    if (!email) return;
    if (!ortuBatch[email]) {
      ortuBatch[email] = {
        email:      email,
        displayName: siswa.ayah || siswa.ibu || 'Orang Tua',
        role:       'ortu',
        schoolId:   siswa.schoolId || _fbSchoolId || '',
        isActive:   true,
        children:   [],
        hp:         siswa.hp_ortu || '',
      };
    }
    ortuBatch[email].children.push(siswa.id);
  });

  const emails = Object.keys(ortuBatch);
  if (!emails.length) return;

  console.log('[Import] Sync', emails.length, 'profil ortu ke Firestore...');

  let synced = 0;
  for (const email of emails) {
    try {
      const ortuData = ortuBatch[email];
      // Cari user existing berdasarkan email
      const existing = await _fbDb.collection('users')
        .where('email', '==', email)
        .limit(1).get();

      if (existing.empty) {
        // Belum ada → buat dokumen baru
        const newRef = _fbDb.collection('users').doc();
        await newRef.set({
          email:       ortuData.email,
          'display name': ortuData.displayName,
          role:        'ortu',
          schoolId:    ortuData.schoolId,
          isActive:    true,
          children:    ortuData.children,
          hp:          ortuData.hp,
          createdAt:   firebase.firestore.FieldValue.serverTimestamp(),
          _imported:   true,
        });
        console.log('[Import] Ortu baru dibuat:', email, '→ children:', ortuData.children);
      } else {
        // Sudah ada → tambahkan children yang belum ada
        const doc = existing.docs[0];
        const existingChildren = doc.data().children || doc.data().children || [];
        const merged = [...new Set([...existingChildren, ...ortuData.children])];
        await doc.ref.update({
          children: merged,
          _last_updated: firebase.firestore.FieldValue.serverTimestamp(),
        });
        console.log('[Import] Ortu existing updated:', email, '→ children:', merged);
      }
      synced++;
    } catch(e) {
      console.warn('[Import] Gagal sync ortu:', email, e.message);
    }
  }
  showNotif(`✅ ${synced} profil ortu berhasil disinkronkan ke Firestore`, 'ok');
}


function showPinScreen() {
  pinBuffer = '';
  updatePinDots();
  document.getElementById('pin-lock-screen').classList.add('show');
  const d = getD();
  const role = d.profil_sekolah.pin_role || 'Admin';
  const roleEl = document.getElementById('pin-role-label');
  if (roleEl) {
    roleEl.textContent = role;
    const colors = { Admin:'var(--grn)', Bendahara:'var(--cyn)', Guru:'var(--pur)' };
    roleEl.style.color = colors[role] || 'var(--grn)';
    roleEl.style.background = (colors[role]||'var(--grn)').replace(')', ',.12)').replace('var(', 'rgba(').replace('--grn','0,230,118').replace('--cyn','38,198,218').replace('--pur','192,132,252');
  }
}


function showPinError(msg) {
  const el = document.getElementById('pin-error-msg');
  if (!el) return;
  el.textContent = msg;
  el.style.animation = 'none';
  el.offsetHeight; // reflow
  el.style.animation = 'shake .4s ease';
}

function setTheme(mode) {
  if (mode === 'light') {
    document.body.classList.add('light-mode');
    localStorage.setItem('sp_theme', 'light');
  } else {
    document.body.classList.remove('light-mode');
    localStorage.setItem('sp_theme', 'dark');
  }
  updateThemeButtons();
}


function populateRaporSiswaSel() {
  const d = getD();
  const sel = document.getElementById('rapor-siswa-sel');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Pilih Siswa --</option>' +
    d.data_siswa.map(s => `<option value="${s.id}">${s.nama} — Kelas ${s.kelas}</option>`).join('');
}


function renderDiagnosticPanel() {
  const el = document.getElementById('diagnostic-results');
  if (!el) return;
  const d = getD();
  const lastSync = localStorage.getItem('sp_last_sync');
  const syncStr  = lastSync
    ? new Date(lastSync).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'})
    : 'Belum pernah';
  const isSecure = location.protocol === 'https:' || ['localhost','127.0.0.1'].includes(location.hostname);

  // Desktop: 2 kolom
  const isDesktop = window.innerWidth >= 900;
  el.style.gridTemplateColumns = isDesktop ? '1fr 1fr' : '1fr';

  const rows = [
    ['🌐 Protokol',   isSecure
      ? '✅ ' + location.protocol + '//' + location.hostname
      : '❌ ' + location.protocol + ' — butuh HTTPS/localhost', isSecure],
    ['📶 Internet',   navigator.onLine ? '✅ Online' : '❌ Offline', navigator.onLine],
    ['🔥 Firebase SDK', window.firebase ? '✅ SDK Loaded' : '❌ Gagal load', !!window.firebase],
    ['🔐 Auth Status', _fbAuth ? '✅ Initialized' : '❌ Belum init', !!_fbAuth],
    ['👤 User Login',  _fbUser ? '✅ ' + (_fbUser.email || _fbUser.uid) : '❌ Belum login', !!_fbUser],
    ['🏷️ Role',       _fbRole ? '✅ ' + _fbRole.toUpperCase() : '❌ Kosong', !!_fbRole],
    ['🏫 SchoolId',   _fbSchoolId ? '✅ ' + _fbSchoolId : '⚠️ Null (mode dev)', true],
    ['🗄️ Firestore',  _fbDb ? '✅ Ready' : '❌ Belum init', !!_fbDb],
    ['📚 Siswa Lokal', '💾 ' + (d.data_siswa||[]).length + ' siswa', true],
    ['👨‍🏫 Guru Lokal', '💾 ' + (d.keuangan_guru||[]).length + ' guru', true],
    ['🕒 Last Sync',  syncStr, true],
    ['🔄 Pending',    _fbSyncPending ? '🟡 Ada antrian' : '✅ Bersih', !_fbSyncPending],
  ];

  el.innerHTML = rows.map(([l,v,ok]) => _diagRow(l,v,ok)).join('');

  // Update badge
  const badge = document.getElementById('diag-status-badge');
  if (badge) {
    const allOk = rows.every(r => r[2]);
    badge.textContent = allOk ? '✅ Normal' : '⚠️ Ada masalah';
    badge.style.background = allOk ? 'var(--grn-bg)' : 'var(--yel-bg)';
    badge.style.borderColor = allOk ? 'var(--grn)' : 'var(--yel)';
    badge.style.color = allOk ? 'var(--grn)' : 'var(--yel)';
  }
}


Object.assign(globalThis, { renderSetting, setImportMode, openSmartImport, setImportType, handleFileDrop, handleFileSelect, showStepPane, renderMappingStep, renderPreviewStep, _syncOrtuAfterImport, showPinScreen, showPinError, setTheme, populateRaporSiswaSel, renderDiagnosticPanel });

export async function mount(container, modalsRoot) {
  return globalThis.mountPartial('setting', container, modalsRoot);
}
export { renderSetting, setImportMode, openSmartImport, setImportType, handleFileDrop, handleFileSelect, showStepPane, renderMappingStep, renderPreviewStep, _syncOrtuAfterImport, showPinScreen, showPinError, setTheme, populateRaporSiswaSel, renderDiagnosticPanel };
