// js/sync/queue.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

globalThis._fbSyncPending = false;   // Dirty flag — needs sync

globalThis._syncTimer = null;

globalThis._syncQueue = JSON.parse(localStorage.getItem('sp_sync_queue') || '[]');

// Called by saveDB() every time data changes

function _fbSyncQueue() {
  _fbSyncPending = true;
  _updateSyncBadge();
  // Debounce: wait 2s after last change before syncing
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(_fbFlushQueue, 2000);
}

// Attempt to sync queued changes to Firestore

async function _fbFlushQueue() {
  if (!_fbUser || !_fbDb || !navigator.onLine) return;
  if (!_fbSyncPending) return;

  const d = getD();
  // Dev punya schoolId kosong → pakai 'dev-global' sebagai bucket khusus
  // TAPI schools/ collection untuk dev di-skip — dev tidak perlu sync ke schools/
  const schoolId = _fbSchoolId || null;

  // Dev mode tanpa schoolId → skip sync schools/ (tidak ada school yang dimiliki dev)
  // Dev hanya sync broadcasts/ yang sudah ditangani kirimBroadcastDev()
  if (!schoolId) {
    _fbSyncPending = false;
    _updateSyncBadge('synced');
    console.log('[FB] Dev mode: skip schools/ sync (no schoolId)');
    return;
  }

  try {
    // Batch write — efficient
    const batch = _fbDb.batch();
    const ref = _fbDb.collection('schools').doc(schoolId);

    // Sync profile settings
    batch.set(
      ref.collection('settings').doc('profile'),
      { ...d.profil_sekolah, _synced_at: firebase.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );

    // Sync students — ke TOP-LEVEL collection 'students' (sesuai struktur Firestore kamu)
    // Field names disesuaikan dengan yang ada di Firestore: studentname, classid, schoolid
    if (d.data_siswa && d.data_siswa.length > 0) {
      d.data_siswa.forEach(siswa => {
        const docId = siswa._firestoreId || siswa.id;
        const docRef = _fbDb.collection('students').doc(docId);
        batch.set(docRef, {
          // Field names sesuai Firestore kamu
          studentname:  siswa.nama         || '',
          classid:      siswa.kelas        || '',
          schoolid:     siswa.schoolId     || _fbSchoolId || '',
          isactive:     siswa.isActive     !== undefined ? siswa.isActive : true,
          nisn:         siswa.nisn         || '',
          jk:           siswa.jk           || 'L',
          tgl_lahir:    siswa.tgl_lahir    || '',
          tahun_masuk:  siswa.tahun_masuk  || new Date().getFullYear(),
          ayah:         siswa.ayah         || '',
          ibu:          siswa.ibu          || '',
          hp_ortu:      siswa.hp_ortu      || '',
          alamat:       siswa.alamat       || '',
          status_spp:   siswa.status_spp   || 'Lunas',
          total_piutang:siswa.total_piutang|| 0,
          _synced_at:   firebase.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      });
    }

    // Sync staff/guru
    if (d.keuangan_guru && d.keuangan_guru.length > 0) {
      d.keuangan_guru.forEach(guru => {
        batch.set(
          ref.collection('staff').doc(guru.id),
          { ...guru, _synced_at: firebase.firestore.FieldValue.serverTimestamp() },
          { merge: true }
        );
      });
    }

    // Sync SPP payments (append only — only new ones)
    if (d.riwayat_spp && d.riwayat_spp.length > 0) {
      const lastSync = localStorage.getItem('sp_last_spp_sync_count') || 0;
      const newPayments = d.riwayat_spp.slice(parseInt(lastSync));
      newPayments.forEach(spp => {
        if (spp.id) {
          batch.set(
            ref.collection('spp_payments').doc(spp.id),
            { ...spp, _synced_at: firebase.firestore.FieldValue.serverTimestamp() },
            { merge: true }
          );
        }
      });
      localStorage.setItem('sp_last_spp_sync_count', d.riwayat_spp.length);
    }

    // Commit batch
    await batch.commit();

    _fbSyncPending = false;
    _syncQueue = [];
    localStorage.setItem('sp_sync_queue', '[]');
    _updateSyncBadge();
    console.log('[FB] Sync complete ✅');

    // Update sync timestamp
    localStorage.setItem('sp_last_sync', new Date().toISOString());

  } catch(err) {
    console.warn('[FB] Sync failed (will retry):', err.message);
    // Will retry next time saveDB is called or online event fires
  }
}

// ── Manual sync trigger (from Settings) ──────────

function manualSync() {
  if (!navigator.onLine) { showNotif('📴 Tidak ada koneksi internet', 'warn'); return; }
  if (!_fbUser) { showNotif('Login diperlukan untuk sync', 'warn'); return; }
  _fbSyncPending = true;
  _fbFlushQueue().then(() => {
    showNotif('☁️ Data berhasil disinkronisasi ke cloud!', 'ok');
  });
}

// ── Load data FROM Firestore (pull on login) ──────

// ── shim fungsi ke global (handler inline lama + pemanggilan antar-file) ──
Object.assign(globalThis, { _fbSyncQueue, _fbFlushQueue, manualSync });
export { _fbSyncQueue, _fbFlushQueue, manualSync };
