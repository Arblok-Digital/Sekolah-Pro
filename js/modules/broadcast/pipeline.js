// js/modules/broadcast/pipeline.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

async function kirimBroadcastDev() {
  if (_fbRole !== 'dev') { showNotif('🚫 Hanya Developer yang bisa kirim broadcast','err'); return; }
  const title  = (document.getElementById('bc-title')||{value:''}).value.trim();
  const body   = (document.getElementById('bc-body') ||{value:''}).value.trim();
  const cta    = (document.getElementById('bc-cta-label')||{value:''}).value.trim();
  const link   = _normalizeCtaLink((document.getElementById('bc-cta-link') ||{value:''}).value.trim());
  if (!title) { showNotif('Judul tidak boleh kosong!','err'); return; }
  if (!body)  { showNotif('Isi pesan tidak boleh kosong!','err'); return; }

  const cfg = BC_TYPE_CFG[_bcState.type] || BC_TYPE_CFG.info;
  const bcDoc = {
    id:        'BC' + Date.now(),
    title,
    body,
    type:      _bcState.type,
    typeLabel: cfg.label,
    typeIcon:  cfg.icon,
    target:    _bcState.target,
    cta:       cta || null,
    ctaLink:   link || null,
    sentBy:    _fbUser ? (_fbUser._docDisplayName || _fbUser.email) : 'dev',
    sentAt:    new Date().toISOString(),
    schoolId:  _fbSchoolId || 'ALL',
    readCount: 0,
  };

  // Simpan ke localStorage
  const d = getD();
  if (!d.broadcasts) d.broadcasts = [];
  d.broadcasts.unshift(bcDoc);
  saveDB();

  // Simpan ke Firestore jika online
  if (_fbDb && navigator.onLine) {
    try {
      console.log('[BC] Writing to Firestore broadcasts/', bcDoc.id, '...');
      console.log('[BC] _fbRole:', _fbRole, '| _fbUser:', _fbUser ? _fbUser.email : 'null');
      await _fbDb.collection('broadcasts').doc(bcDoc.id).set({
        ...bcDoc,
        sentAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      console.log('[BC] ✅ Firestore write SUCCESS');
      showNotif(`✅ Iklan "${title}" berhasil dikirim ke Firestore!`, 'ok');
      setTimeout(() => _loadBroadcastAds(_fbSchoolId || null), 800);
    } catch(e) {
      console.error('[BC] ❌ Firestore write FAILED:', e.code, e.message);
      showNotif('❌ Firestore gagal: ' + (e.code || e.message), 'err');
      // Tetap inject ke _ADS_ACTIVE offline
      _ADS_ACTIVE.unshift(bcDoc);
      _renderAllAds();
    }
  } else {
    console.warn('[BC] Skip Firestore: _fbDb=' + !!_fbDb + ' online=' + navigator.onLine);
    showNotif('📴 Broadcast tersimpan lokal (akan sync saat online)', 'warn');
    _ADS_ACTIVE.unshift(bcDoc);
    _renderAllAds();
  }

  // Reset form
  ['bc-title','bc-body','bc-cta-label','bc-cta-link'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  updateBcPreview();
  renderBcHistory();
}


async function hapusIklan(bcId) {
  if (!confirm('Hapus iklan ini dari Firestore?')) return;

  // Hapus dari lokal dulu
  const d = getD();
  d.broadcasts = (d.broadcasts||[]).filter(b => b.id !== bcId);
  _ADS_ACTIVE = (_ADS_ACTIVE||[]).filter(a => a.id !== bcId);
  saveDB();
  _renderAllAds();
  renderBcHistory();

  // Hapus dari Firestore — langsung pakai ID
  if (_fbDb && navigator.onLine) {
    try {
      await _fbDb.collection('broadcasts').doc(bcId).delete();
      showNotif('🗑️ Iklan dihapus dari Firestore!', 'ok');
    } catch(e) {
      console.error('[DELETE]', e);
      showNotif('❌ Firestore delete gagal: ' + (e.code || e.message), 'err');
    }
  } else {
    showNotif('⚠️ Offline — hanya lokal yang dihapus', 'warn');
  }
}

// Hapus SEMUA iklan

async function hapusSemua_BC() {
  if (!confirm('Hapus SEMUA iklan dari Firestore dan lokal?')) return;

  const d = getD();
  d.broadcasts = [];
  _ADS_ACTIVE = [];
  saveDB();
  _renderAllAds();
  renderBcHistory();

  // Hapus dari Firestore — query langsung, tidak bergantung localStorage
  if (_fbDb && navigator.onLine) {
    try {
      showNotif('🔄 Menghapus dari Firestore...', 'warn');
      const snap = await _fbDb.collection('broadcasts').get();
      if (snap.empty) {
        showNotif('✅ Firestore sudah kosong', 'ok');
        return;
      }
      // Batch delete max 500 per commit
      const batches = [];
      let batch = _fbDb.batch();
      let count = 0;
      snap.docs.forEach(doc => {
        batch.delete(doc.ref);
        count++;
        if (count % 500 === 0) {
          batches.push(batch.commit());
          batch = _fbDb.batch();
        }
      });
      if (count % 500 !== 0) batches.push(batch.commit());
      await Promise.all(batches);
      showNotif(`🗑️ ${snap.docs.length} iklan dihapus dari Firestore!`, 'ok');
    } catch(e) {
      console.error('[DELETE]', e);
      showNotif('❌ Firestore delete gagal: ' + (e.code || e.message), 'err');
    }
  } else {
    showNotif('⚠️ Offline — hanya lokal yang dihapus', 'warn');
  }
}

// Sync broadcasts dari Firestore ke lokal + tampilan

async function syncBroadcastsFromFirestore() {
  if (!_fbDb || !navigator.onLine) {
    showNotif('📴 Offline — tidak bisa sync', 'warn'); return;
  }
  try {
    showNotif('🔄 Sync iklan dari Firestore...', 'warn');
    const snap = await _fbDb.collection('broadcasts').get();
    const d = getD();
    d.broadcasts = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    _ADS_ACTIVE = d.broadcasts.slice(); // semua jadi aktif
    saveDB();
    _renderAllAds();
    buildTicker();
    renderBcHistory();
    showNotif(`✅ ${snap.docs.length} iklan di-sync dari Firestore!`, 'ok');
  } catch(e) {
    showNotif('❌ Sync gagal: ' + (e.code || e.message), 'err');
  }
}


Object.assign(globalThis, { kirimBroadcastDev, hapusIklan, hapusSemua_BC, syncBroadcastsFromFirestore });
export { kirimBroadcastDev, hapusIklan, hapusSemua_BC, syncBroadcastsFromFirestore };
