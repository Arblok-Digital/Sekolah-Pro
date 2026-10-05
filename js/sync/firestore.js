// js/sync/firestore.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

async function pullFromFirestore() {
  if (!_fbUser || !_fbDb || !navigator.onLine) {
    showNotif('📴 Offline — menggunakan data lokal', 'warn'); return;
  }
  const schoolId = _fbSchoolId || null;
  showNotif('🔄 Mengambil data dari Firestore...', 'warn');
  try {
    const d = getD();
    let pulled = { siswa: 0, guru: 0, broadcasts: 0 };

    // ── 1. STUDENTS ──────────────────────────────────────────────
    // Dev (schoolId kosong) → ambil SEMUA
    // Admin → coba filter schoolId, fallback ambil semua jika kosong
    let studentsSnap;
    if (!schoolId) {
      // Dev: ambil semua
      studentsSnap = await _fbDb.collection('students').limit(500).get()
        .catch(() => ({ empty: true, docs: [] }));
    } else {
      // Admin: coba filter, tapi kalau kosong fallback ke semua
      // (karena data lama mungkin schoolid kosong saat di-push dari dev)
      const filtered = await _fbDb.collection('students')
        .where('schoolid', '==', schoolId).get()
        .catch(() => null);

      const filtered2 = (!filtered || filtered.empty)
        ? await _fbDb.collection('students')
            .where('schoolId', '==', schoolId).get()
            .catch(() => null)
        : null;

      // Kalau filter ada hasil → pakai
      // Kalau tetap kosong → ambil semua (fallback dev-pushed data)
      if (filtered && !filtered.empty) {
        studentsSnap = filtered;
      } else if (filtered2 && !filtered2.empty) {
        studentsSnap = filtered2;
      } else {
        console.log('[PULL] Filter kosong, fallback ambil semua students...');
        studentsSnap = await _fbDb.collection('students').limit(500).get()
          .catch(() => ({ empty: true, docs: [] }));
      }
    }

    console.log('[PULL] Students:', studentsSnap.docs?.length || 0);

    if (studentsSnap.docs && studentsSnap.docs.length > 0) {
      d.data_siswa = studentsSnap.docs.map(doc => {
        const raw = doc.data();
        delete raw._synced_at;
        // Normalisasi field — support field names Firestore (lowercase) dan app (camelCase)
        const fm = {};
        Object.keys(raw).forEach(k => { fm[k.trim().toLowerCase()] = raw[k]; });

        return {
          id:           doc.id,
          _firestoreId: doc.id,
          // Field mapping sesuai struktur Firestore (screenshot 26 Mar 2026)
          // studentname, classid, schoolid (lowercase), email_ortu, tagihan_spp, dll
          nama:         fm.studentname || fm.nama || fm.name || 'Tanpa Nama',
          nisn:         fm.nisn || fm.nis || fm.studentid || '',
          kelas:        fm.classid || fm.kelas || fm.class || fm.grade || '',
          jk:           fm.jk || fm.gender || 'L',
          tgl_lahir:    fm.tgl_lahir || fm.tanggallahir || fm.birthdate || '',
          tahun_masuk:  fm.tahun_masuk || fm.tahunmasuk || fm.angkatan || new Date().getFullYear(),
          ayah:         fm.ayah || fm.wali || '',
          ibu:          fm.ibu || fm.namaibu || '',
          hp_ortu:      fm.hp_ortu || fm.hportu || fm.hp || '',
          email_ortu:   fm.email_ortu || fm.emailortu || '',
          alamat:       fm.alamat || fm.address || '',
          schoolId:     fm.schoolid || fm.schoolId || fm.school_id || '',
          isActive:     fm.isactive !== undefined ? fm.isactive : (fm.isActive !== undefined ? fm.isActive : true),
          status_spp:   fm.status_spp || fm.statusspp || 'Lunas',
          tagihan_spp:  parseFloat(fm.tagihan_spp || fm.taghanspp || 0),
          total_piutang: parseFloat(fm.tagihan_spp || fm.total_piutang || 0),
          rata_rata_nilai: parseFloat(fm.rata_rata_nilai || fm.rataratanilai || 0),
          absen_hari_ini: fm.absen_hari_ini || fm.absenharini || '',
          catatan_wali_kelas: fm.catatan_wali_kelas || fm.catatanwalikelas || '',
          piutang_detail: fm.piutang_detail || [],
          absensi:      fm.absensi || {},
          nilai:        fm.nilai || {},
        };
      });
      pulled.siswa = d.data_siswa.length;
    }

    // ── 2. BROADCASTS (ads) ───────────────────────────────────────
    const bcSnap = await _fbDb.collection('broadcasts').get()
      .catch(() => ({ empty: true, docs: [] }));
    if (bcSnap.docs && bcSnap.docs.length > 0) {
      d.broadcasts = bcSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      pulled.broadcasts = d.broadcasts.length;
    }

    // ── 3. STAFF / GURU (dari schools/{schoolId}/staff jika ada) ──
    if (schoolId) {
      const staffSnap = await _fbDb.collection('schools').doc(schoolId)
        .collection('staff').get()
        .catch(() => ({ empty: true, docs: [] }));
      if (staffSnap.docs && staffSnap.docs.length > 0) {
        d.keuangan_guru = staffSnap.docs.map(doc => {
          const data = doc.data(); delete data._synced_at;
          if (!data.nama) data.nama = data.name || 'Tanpa Nama';
          return data;
        });
        pulled.guru = d.keuangan_guru.length;
      }
    }

    try {
      localStorage.setItem('sekolah_pro_db', JSON.stringify(DB));
      localStorage.setItem('sp_last_pull', new Date().toISOString());
    } catch (e) {
      console.error('[SP] Pull: gagal simpan ke localStorage:', e && e.name);
    }

    // Reload ads juga
    _ADS_ACTIVE = (d.broadcasts || []);
    _renderAllAds();
    buildTicker();
    renderPage(currentPage);

    showNotif(`✅ Pulled: ${pulled.siswa} siswa, ${pulled.broadcasts} iklan, ${pulled.guru} guru`, 'ok');
  } catch(err) {
    console.error('[PULL] Error:', err);
    showNotif('❌ Gagal pull: ' + err.message, 'err');
  }
}


// ════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════
//  BROADCAST ADS ENGINE — Running Text Ticker + Dashboard Banner
//  Dev tulis iklan ke Firestore → semua user baca (online + offline)
//  Online  → fetch Firestore langsung + simpan ke cache
//  Offline → baca dari localStorage cache (sp_ads_cache)
//  Tampil  → running text di ticker bar + banner di dashboard
//
//  Collection: /broadcasts/{adId}   ← sesuai kirimBroadcastDev()
//  Security:   write = dev only | read = allow true (offline safe)
//  Copyright © 2026 Arblok Digital. All Rights Reserved.
// ════════════════════════════════════════════════════════════════


// ── shim fungsi ke global (handler inline lama + pemanggilan antar-file) ──
Object.assign(globalThis, { pullFromFirestore });
export { pullFromFirestore };
