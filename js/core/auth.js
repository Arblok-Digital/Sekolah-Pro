// js/core/auth.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

globalThis._fbApp      = null;

globalThis._fbAuth     = null;

globalThis._fbDb       = null;

globalThis._fbUser     = null;       // Current Firebase user

globalThis._fbSchoolId = null;       // e.g. "SKL001"

globalThis._fbRole     = '';           // kosong sampai berhasil baca dari Firestore

globalThis._fbOnline   = navigator.onLine;

globalThis._fbInited   = false;

globalThis._fbOfflineMode = false;   // User chose offline mode

// ══════════════════════════════════════════════════════════════════════
//  ROLE SYSTEM — Sinkron dengan sekolahpro-lab
//  5 role final: dev | admin | guru | siswa | ortu
//
//  Akses per role (sesuai permintaan):
//  ┌────────┬──────────────────────────────────────────────────────────┐
//  │ dev    │ FULL akses semua halaman + semua schoolId (global)       │
//  │ admin  │ FULL akses 1 schoolId miliknya                          │
//  │ guru   │ Terbatas: crm (data murid), jadwal, kalender, laporan   │
//  │ siswa  │ Terbatas: spp (lihat sendiri), setting profil, dashboard │
//  │ ortu   │ Terbatas: komunikasi (data anak via children field)      │
//  └────────┴──────────────────────────────────────────────────────────┘
// ══════════════════════════════════════════════════════════════════════

// ── _normalizeRole — sinkron dengan normalizeRole() di lab ────────────
// Lab: String(role).trim().toLowerCase() — simpel, tidak ada alias
// Index: sama + tambahkan alias untuk role lama / bahasa Inggris
//
// ATURAN PENTING:
//   1. lowercase dulu SEBELUM cek map
//   2. '' / null / undefined → kembalikan '' (bukan full access!)
//   3. Role yang tidak dikenal → kembalikan apa adanya (lowercase)
//      → akan di-block oleh gate karena tidak ada di _FB_ROLE_PAGES

function _normalizeRole(r) {
  if (r === null || r === undefined || String(r).trim() === '') {
    return '';  // role tidak diketahui → DENY, bukan fallback ke admin
  }
  const lower = String(r).trim().toLowerCase();

  // Alias map: petakan role lama/bahasa Inggris → 5 role lab
  const map = {
    // DEV aliases
    'superadmin':      'dev',
    'super_admin':     'dev',
    'super admin':     'dev',
    // ADMIN aliases (role lama index.html dipetakan ke 'admin')
    'kepala_sekolah':  'admin',  // ← role lama → admin
    'kepala sekolah':  'admin',
    'bendahara':       'admin',  // ← bendahara dapat akses admin (termasuk keuangan)
    'tata_usaha':      'admin',  // ← tata usaha dapat akses admin
    'tata usaha':      'admin',
    'principal':       'admin',
    'teacher':         'guru',
    'staff':           'admin',
    'tu':              'admin',
    'parent':          'ortu',
    'orang_tua':       'ortu',
    'student':         'siswa',
    'murid':           'siswa',
  };

  return map[lower] || lower;
}

// ── Init Firebase (called once) ───────────────────

function _fbInit() {
  if (globalThis.__appReady === false) { setTimeout(_fbInit, 100); return; }
  if (_fbInited) return;
  _fbInited = true;
  try {
    if (!window.firebase) { console.warn('[FB] SDK not loaded'); return; }
    if (!firebase.apps.length) {
      _fbApp = firebase.initializeApp(_FB_CFG);
    } else {
      _fbApp = firebase.apps[0];
    }
    _fbAuth = firebase.auth();
    _fbDb   = firebase.firestore();
    // Enable Firestore offline persistence
    _fbDb.enablePersistence({ synchronizeTabs: true })
      .catch(err => console.warn('[FB] Persistence:', err.code));
    // Auth state listener
    _fbAuth.onAuthStateChanged(_onAuthState);
    // Handle Google redirect result (setelah redirect dari Google)
    setTimeout(_handleGoogleRedirectResult, 500);
    console.log('[FB] Firebase initialized');
  } catch(e) {
    console.warn('[FB] Init error:', e.message);
  }
}

// ── Auth State Change ─────────────────────────────

function _onAuthState(user) {
  if (user) {
    _fbUser = user;
    console.log('[FB] Logged in:', user.email);
    _fbDb.collection('users').doc(user.uid).get()
      .then(doc => {
        if (!doc.exists) {
          _fbShowError('Akun tidak ditemukan di sistem.');
          _fbAuth.signOut(); return;
        }
        const raw = doc.data();

        // ════════════════════════════════════════════════════════════
        //  FIELD READER — ROBUST FIELD SCAN
        //
        //  MASALAH DITEMUKAN dari console screenshot:
        //  [FB] Parsed → role: "" ← rawRole kosong!
        //  Karena di Firestore field ditulis "role " (ada SPASI setelah role)
        //  sehingga raw.role === undefined.
        //
        //  SOLUSI: scan semua key di dokumen, trim() nama field-nya,
        //  lalu ambil nilai yang cocok. Ini menangkap:
        //  "role ", " role", "role", "Role", "ROLE" — semua ketemu.
        // ════════════════════════════════════════════════════════════

        // Buat lookup map: { 'role': val, 'schoolid': val, ... }
        // dengan key yang sudah di-trim dan lowercase
        const rawKeys = Object.keys(raw);
        const fieldMap = {};
        rawKeys.forEach(k => { fieldMap[k.trim().toLowerCase()] = raw[k]; });

        console.log('[FB] Doc keys (original):', rawKeys);
        console.log('[FB] Doc fieldMap (trimmed):', JSON.stringify(fieldMap));

        // ROLE — baca dari fieldMap (nama field sudah di-trim)
        const rawRole = fieldMap['role']      ||
                        fieldMap['userrole']  ||
                        fieldMap['user_role'] || '';

        // isActive — toleran semua varian
        const isActiveVal = fieldMap['isactive'] !== undefined ? fieldMap['isactive'] :
                            fieldMap['active']   !== undefined ? fieldMap['active']   :
                            fieldMap['is_active']!== undefined ? fieldMap['is_active']: true;

        // schoolId — trim + uppercase
        const rawSchoolId = fieldMap['schoolid']   ||
                            fieldMap['school_id']  ||
                            fieldMap['sekolah_id'] || '';
        const schoolId = rawSchoolId ? String(rawSchoolId).trim().toUpperCase() : null;

        // displayName — tangkap "display name" (spasi) juga
        const displayName = fieldMap['displayname']  ||
                            fieldMap['display name'] ||
                            fieldMap['nama']         ||
                            fieldMap['name']         || '';

        console.log('[FB] Parsed → role:', JSON.stringify(rawRole),
                    '| schoolId:', schoolId, '| isActive:', isActiveVal);

        // Blokir akun yang dinonaktifkan
        if (isActiveVal === false) {
          _fbShowError('Akun Anda dinonaktifkan. Hubungi admin.');
          _fbAuth.signOut(); return;
        }

        _fbRole     = _normalizeRole(rawRole);
        _fbSchoolId = schoolId;
        // Simpan displayName dari Firestore doc ke _fbUser agar _applyRoleUI bisa pakai
        if (_fbUser && displayName) _fbUser._docDisplayName = displayName;

        console.log('[FB] Role resolved:', _fbRole, '| SchoolId:', _fbSchoolId);

        _fbLoadSchoolData({ role: _fbRole, schoolId: _fbSchoolId }).then(() => {
          // Simpan role terakhir yang valid — dipakai untuk offline fallback
          // HANYA disimpan setelah berhasil baca dari Firestore (bukan dari catch)
          localStorage.setItem('sp_last_role', _fbRole);
          localStorage.setItem('sp_last_schoolid', _fbSchoolId || '');
          _hideLoginPage();
          _applyRoleUI(_fbRole);
          const home = _FB_HOME_PAGE[_fbRole] || 'dashboard';
          switchPage(home);
          _updateSyncBadge();
          const nameDisplay = displayName || user.displayName || user.email;
          showNotif(`✅ Selamat datang, ${nameDisplay}! (${_fbRole})`, 'ok');
          // Load data anak untuk ortu
          if (_fbRole === 'ortu') _loadOrtuChildren();
        });
      })
      .catch(err => {
        console.warn('[FB] User doc error:', err.code, err.message);
        // ── PERBAIKAN CATCH BLOCK ────────────────────────────────────
        // Sebelumnya: catch selalu pakai 'kepala_sekolah' → full access
        // untuk SEMUA error termasuk permission-denied!
        //
        // Sekarang: bedakan antara error jaringan (offline) vs
        // permission-denied (tidak boleh masuk sama sekali)
        if (err.code === 'permission-denied' || err.code === 'PERMISSION_DENIED') {
          // Firestore rules menolak → paksa logout
          _fbShowError('Akses ditolak. Akun Anda tidak memiliki izin.');
          _fbAuth.signOut();
          return;
        }
        // Hanya untuk error offline/network — fallback ke role 'offline'
        // TIDAK pakai sp_last_role karena bisa saja 'dev' dari sesi sebelumnya
        // yang akan memberikan akses terlalu luas tanpa autentikasi Firebase.
        _fbRole = 'offline';
        _hideLoginPage();
        _applyRoleUI('offline');
        switchPage('dashboard');
        showNotif('📴 Offline — fitur terbatas tersedia', 'warn');
      });
  } else {
    // ── Tidak ada Firebase user ───────────────────────────────────
    // Firebase sudah konfirmasi: user tidak login.
    // Hapus session stale dari localStorage agar tidak bypass login.
    // Satu-satunya pengecualian: _fbOfflineMode yang SENGAJA dipilih user
    // via tombol "Lanjutkan Tanpa Internet" di halaman login.
    _fbUser = null;
    if (_fbOfflineMode) {
      // User sudah klik tombol offline — biarkan masuk
      _hideLoginPage();
      _applyRoleUI(_fbRole || 'offline');
      switchPage('dashboard');
    } else {
      // Bukan offline mode → hapus session stale → paksa login
      localStorage.removeItem('sp_session');
      _showLoginPage();
    }
  }
}

// ── Load School Data dari Firestore ──────────────

async function _fbLoadSchoolData(userData) {
  const role     = userData.role     || _fbRole;
  const schoolId = userData.schoolId || _fbSchoolId;
  // Dev tanpa schoolId → skip load school settings (tidak ada sekolah terkait)
  if (!schoolId) {
    console.log('[FB] Dev mode: skip school settings load (no schoolId)');
    // Langsung load ads
    try { await _loadBroadcastAds(null); } catch(e) { _loadAdsFromCache(); }
    return;
  }
  const sid = schoolId;
  try {
    const settingsDoc = await _fbDb
      .collection('schools').doc(sid)
      .collection('settings').doc('profile').get();
    if (settingsDoc.exists) {
      const remote = settingsDoc.data();
      const d = getD();
      const namaNya    = remote.nama        || remote.Nama        || remote.schoolName || '';
      const sppNominal = remote.spp_nominal || remote.sppNominal  || 0;
      const pengumuman = remote.pengumuman  || remote.announcement || '';
      if (namaNya)    d.profil_sekolah.nama        = namaNya;
      if (sppNominal) d.profil_sekolah.spp_nominal = sppNominal;
      if (pengumuman) d.profil_sekolah.pengumuman  = pengumuman;
      localStorage.setItem('sekolah_pro_db', JSON.stringify(DB));
      console.log('[FB] School profile loaded:', sid);
    }
  } catch(e) {
    console.log('[FB] Load school data offline:', e.message);
  }
// ── Load broadcast ads (online + cache offline) ──────────────
  try {
    await _loadBroadcastAds(_fbSchoolId || null);
  } catch(e) {
    _loadAdsFromCache();
  }
}

// ── Login Page Controls ───────────────────────────

function _showLoginPage() {
  const lp = document.getElementById('login-page');
  if (lp) lp.style.display = 'flex';
  _updateOnlineStatus();
}


function _hideLoginPage() {
  const lp = document.getElementById('login-page');
  if (lp) lp.style.display = 'none';
  // Show sync badge
  const sb = document.getElementById('sync-badge');
  if (sb) sb.style.display = 'flex';
}


function _fbShowError(msg) {
  const el = document.getElementById('login-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
  const btn = document.getElementById('login-btn');
  if (btn) { btn.disabled = false; btn.textContent = '🔐 Masuk'; }
}

// ── Login Action ──────────────────────────────────

function doLogin() {
  const email = (document.getElementById('login-email')||{value:''}).value.trim();
  const pass  = (document.getElementById('login-pass')||{value:''}).value;
  const remember = (document.getElementById('login-remember')||{checked:false}).checked;
  if (document.getElementById('login-error'))
    document.getElementById('login-error').style.display = 'none';

  if (!email || !pass) {
    _fbShowError('Email dan password wajib diisi.'); return;
  }

  // ── Deteksi protokol tidak aman ────────────────────────────────────
  // Firebase Auth TIDAK bisa jalan di:
  //  - content:// (file lokal Android)
  //  - file:// (file lokal desktop)
  // Harus diakses via http://localhost atau https://
  const proto = location.protocol;
  if (proto === 'content:' || proto === 'file:') {
    _fbShowError(
      '⚠️ Tidak bisa login dari file lokal.\n\n' +
      'Buka app via browser dengan URL:\n' +
      'http://127.0.0.1:5500/index.html\n' +
      'atau deploy ke Vercel/hosting.\n\n' +
      'Untuk sementara gunakan Mode Offline ↓'
    );
    const btn = document.getElementById('login-btn');
    if (btn) { btn.disabled = false; btn.innerHTML = '🔐 Masuk'; }
    return;
  }

  // ── Cek Firebase Auth siap ────────────────────────────────────────
  if (!_fbAuth) {
    _fbShowError('Firebase belum siap. Tunggu beberapa detik lalu coba lagi.');
    return;
  }

  const btn = document.getElementById('login-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Memproses...'; }

  const persistence = remember
    ? firebase.auth.Auth.Persistence.LOCAL
    : firebase.auth.Auth.Persistence.SESSION;

  _fbAuth.setPersistence(persistence)
    .then(() => _fbAuth.signInWithEmailAndPassword(email, pass))
    .then(() => {
      if (remember) localStorage.setItem('sp_session', '1');
      else localStorage.removeItem('sp_session');
      // btn akan di-reset oleh _onAuthState → _hideLoginPage
    })
    .catch(e => {
      // Reset tombol
      if (btn) { btn.disabled = false; btn.innerHTML = '🔐 Masuk'; }
      const code = e.code || '';
      let msg = 'Login gagal. Periksa email dan password.';
      if (code === 'auth/user-not-found'        ) msg = 'Email tidak terdaftar.';
      else if (code === 'auth/wrong-password'   ) msg = 'Password salah.';
      else if (code === 'auth/invalid-credential') msg = 'Email atau password salah.';
      else if (code === 'auth/invalid-email'    ) msg = 'Format email tidak valid.';
      else if (code === 'auth/user-disabled'    ) msg = 'Akun dinonaktifkan. Hubungi admin.';
      else if (code === 'auth/too-many-requests') msg = 'Terlalu banyak percobaan. Tunggu beberapa menit.';
      else if (code === 'auth/network-request-failed') msg = 'Tidak ada koneksi internet.';
      else if (code === 'auth/internal-error'   ) msg = 'Error internal Firebase. Coba lagi.';
      else if (code === 'auth/operation-not-allowed') msg = 'Login email/password belum diaktifkan di Firebase Console.';
      _fbShowError(msg);
      console.warn('[Login] Error:', code, e.message);
    });
}

// ══════════════════════════════════════════════════════════════
//  LOGIN WITH GOOGLE — Validasi ke Firestore
//  Flow:
//  1. Google popup → dapat email user
//  2. Cek email di Firestore collection users → cocok? lanjut
//  3. Cek juga di users/{uid} langsung
//  4. Ambil role + schoolId → apply ke session
//  5. Kalau tidak ada di Firestore → logout + tampilkan error
// ══════════════════════════════════════════════════════════════

async function doLoginGoogle() {
  if (!_fbAuth || !_fbDb) {
    _fbShowError('Firebase belum siap. Tunggu sebentar...'); return;
  }

  const btn = document.getElementById('google-login-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Menghubungi Google...'; }

  try {
    // Step 1: Google popup — fallback ke redirect jika popup diblokir/unauthorized
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    let result;
    try {
      result = await _fbAuth.signInWithPopup(provider);
    } catch(popupErr) {
      // Popup gagal (unauthorized-domain atau diblokir) → coba redirect
      if (popupErr.code === 'auth/unauthorized-domain' ||
          popupErr.code === 'auth/popup-blocked' ||
          popupErr.code === 'auth/operation-not-allowed') {
        // Simpan flag untuk handle redirect result setelah reload
        localStorage.setItem('sp_google_redirect', '1');
        await _fbAuth.signInWithRedirect(provider);
        return; // halaman akan reload
      }
      throw popupErr;
    }

    const user = result.user;
    if (btn) { btn.innerHTML = '🔍 Validasi ke Firestore...'; }
    await _validateGoogleUser(user, btn);

  } catch(e) {
    console.error('[GOOGLE] Login error:', e.code, e.message);
    if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') {
      if (btn) { btn.disabled = false; btn.innerHTML = _googleBtnHTML(); }
      return;
    }
    _fbShowError('❌ Google login gagal: ' + (e.message || e.code));
    if (btn) { btn.disabled = false; btn.innerHTML = _googleBtnHTML(); }
  }
}

// Handle redirect result (dipanggil saat app load)

async function _handleGoogleRedirectResult() {
  if (!_fbAuth || !_fbDb) return;
  if (!localStorage.getItem('sp_google_redirect')) return;
  localStorage.removeItem('sp_google_redirect');
  try {
    const result = await _fbAuth.getRedirectResult();
    if (!result || !result.user) return;
    await _validateGoogleUser(result.user, null);
  } catch(e) {
    console.error('[GOOGLE REDIRECT]', e.code, e.message);
    _fbShowError('❌ Google login gagal: ' + (e.message || e.code));
  }
}

// Core: validasi user Google ke Firestore
// Priority: users/{uid} → users by email → students by email_ortu

async function _validateGoogleUser(user, btn) {
  const email = user.email.toLowerCase().trim();

  // ── Step A: Cek /users/{uid} ───────────────────────────────
  const userDoc = await _fbDb.collection('users').doc(user.uid).get();
  if (userDoc.exists) {
    const data = userDoc.data();
    if (data.isActive === false) {
      await _fbAuth.signOut();
      _fbShowError('❌ Akun Anda dinonaktifkan.\nHubungi Admin sekolah.');
      if (btn) { btn.disabled = false; btn.innerHTML = _googleBtnHTML(); }
      return;
    }
    // Update last login
    _fbDb.collection('users').doc(user.uid).update({
      lastloginat: firebase.firestore.FieldValue.serverTimestamp(),
      displayname: user.displayName || data.displayname || ''
    }).catch(()=>{});
    console.log('[GOOGLE] ✅ Login via UID — role:', data.role);
    return; // _onAuthState handle sisanya
  }

  // ── Step B: Cek /users by email ───────────────────────────
  const emailSnap = await _fbDb.collection('users')
    .where('email', '==', email).limit(1).get();

  if (!emailSnap.empty) {
    const doc = emailSnap.docs[0];
    const data = doc.data();
    if (data.isActive === false) {
      await _fbAuth.signOut();
      _fbShowError('❌ Akun Anda dinonaktifkan.\nHubungi Admin sekolah.');
      if (btn) { btn.disabled = false; btn.innerHTML = _googleBtnHTML(); }
      return;
    }
    // Sambungkan UID ke doc yang ada
    const mergeData = {
      ...data, uid_google: user.uid,
      displayname: user.displayName || data.displayname || '',
      email: email,
      lastloginat: firebase.firestore.FieldValue.serverTimestamp()
    };
    await _fbDb.collection('users').doc(user.uid).set(mergeData, { merge: true });
    await _fbDb.collection('users').doc(doc.id).update({
      uid_google: user.uid,
      lastloginat: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(()=>{});
    console.log('[GOOGLE] ✅ Login via email match — role:', data.role);
    return; // _onAuthState handle sisanya
  }

  // ── Step C: Cek /students by email_ortu ──────────────────
  // Ortu bisa login pakai email yang ada di field email_ortu siswa
  const ortuSnap = await _fbDb.collection('students')
    .where('email_ortu', '==', email).limit(5).get()
    .catch(() => ({ empty: true, docs: [] }));

  if (!ortuSnap.empty) {
    const siswaList = ortuSnap.docs.map(d => d.data());
    const firstSiswa = siswaList[0];
    const schoolId = firstSiswa.schoolid || firstSiswa.schoolId || '';
    const childrenIds = ortuSnap.docs.map(d => d.id);

    // Buat/update user doc untuk ortu
    await _fbDb.collection('users').doc(user.uid).set({
      email: email,
      displayname: user.displayName || firstSiswa.ayah || firstSiswa.ibu || 'Orang Tua',
      role: 'ortu',
      schoolId: schoolId,
      isActive: true,
      children: childrenIds,     // ID siswa yang terkait
      uid_google: user.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastloginat: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: 'auto_ortu_login'
    }, { merge: true });

    console.log('[GOOGLE] ✅ Login sebagai ORTU — anak:', childrenIds, 'schoolId:', schoolId);
    // _onAuthState akan handle karena user sudah login
    return;
  }

  // ── Step D: Tidak ditemukan di mana pun → BLOKIR ─────────
  await _fbAuth.signOut();
  _fbShowError(
    '🚫 Email ' + email + ' tidak terdaftar.\n\n' +
    'Kemungkinan penyebab:\n' +
    '• Email belum didaftarkan Admin\n' +
    '• Email ortu belum diisi di data siswa\n\n' +
    'Hubungi Admin sekolah Anda.'
  );
  if (btn) { btn.disabled = false; btn.innerHTML = _googleBtnHTML(); }
}


function _googleBtnHTML() {
  return '<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg> Masuk dengan Google';
}


function doLogout() {
  // Bersihkan SEMUA key sesi — tidak boleh ada yang tertinggal
  function _clearSession() {
    localStorage.removeItem('sp_session');
    // sp_last_role dan sp_last_schoolid sengaja TIDAK dihapus
    // agar bisa dipakai sebagai offline fallback jika butuh
    _fbOfflineMode = false;
    _fbRole        = '';
    _fbUser        = null;
    _fbSchoolId    = null;
  }
  if (_fbAuth) {
    _fbAuth.signOut()
      .then(() => {
        _clearSession();
        _showLoginPage();
        showNotif('👋 Berhasil logout', 'ok');
      })
      .catch(() => { _clearSession(); _showLoginPage(); });
  } else {
    _clearSession();
    _showLoginPage();
  }
}


function masukOfflineMode() {
  _fbOfflineMode = true;
  localStorage.setItem('sp_session', 'offline');
  _hideLoginPage();

  _fbRole = 'offline';
  _fbUser = null;

  // ── Load ads — online: fetch fresh, offline: dari cache ──────
  if (_fbDb && navigator.onLine) {
    _loadBroadcastAds(null);  // schoolId null = ambil semua (ALL)
  } else {
    _loadAdsFromCache();
  }

  // Pakai _applyRoleUI — logika lock/unlock terpusat di sana
  // Menu yang tidak diizinkan akan DIKUNCI (bukan disembunyikan)
  _applyRoleUI('offline');

  // Override banner/badge untuk identitas offline
  const bannerAv   = document.getElementById('banner-avatar');
  const bannerName = document.getElementById('banner-user-name');
  const bannerRole = document.getElementById('banner-user-role');
  const brandBlock = document.getElementById('banner-brand-block');
  const bannerInfo = document.getElementById('banner-user-info');
  if (bannerInfo) {
    bannerInfo.style.display = 'flex';
    if (bannerAv)   { bannerAv.textContent = '📴'; bannerAv.style.background = '#8a6200'; }
    if (bannerName) bannerName.textContent  = 'Mode Offline';
    if (bannerRole) { bannerRole.innerHTML  = '📴 OFFLINE · Gratis'; bannerRole.style.color = 'var(--yel)'; }
    if (brandBlock) brandBlock.style.display = 'none';
  }
  const sideAv    = document.getElementById('sub-avatar');
  const sideName  = document.getElementById('sub-name');
  const sideRole  = document.getElementById('sub-role');
  const sideBadge = document.getElementById('sidebar-user-badge');
  if (sideBadge) {
    sideBadge.style.display = 'block';
    if (sideAv)   { sideAv.textContent  = '📴'; sideAv.style.background = '#8a6200'; }
    if (sideName) sideName.textContent  = 'Mode Offline';
    if (sideRole) { sideRole.textContent = '📴 OFFLINE — Gratis'; sideRole.style.color = 'var(--yel)'; }
  }

  _updateSyncBadge();
  switchPage('dashboard');
  showNotif('📴 Mode Offline aktif — SPP & Payroll tersedia', 'warn');
}


function togglePassVis() {
  const inp = document.getElementById('login-pass');
  const btn = document.getElementById('pass-eye');
  if (!inp) return;
  if (inp.type === 'password') { inp.type = 'text'; if(btn) btn.textContent = '🙈'; }
  else { inp.type = 'password'; if(btn) btn.textContent = '👁️'; }
}


function showForgotPassword() {
  const email = (document.getElementById('login-email')||{value:''}).value.trim();
  if (!email) { _fbShowError('Masukkan email dulu sebelum reset password.'); return; }
  if (!_fbAuth) return;
  _fbAuth.sendPasswordResetEmail(email)
    .then(() => { showNotif(`📧 Link reset password dikirim ke ${email}`, 'ok'); })
    .catch(() => { _fbShowError('Gagal kirim reset email. Periksa alamat email.'); });
}

// ── Role-based UI ─────────────────────────────────

function _applyRoleUI(role) {
  _fbRole = role;

  // Warna & label per role
  const ROLE_CFG = {
    dev:     { label:'Developer', icon:'🛠️',  color:'#c084fc' },
    admin:   { label:'Admin',     icon:'🔐',  color:'#ffca28' },
    guru:    { label:'Guru',      icon:'👨‍🏫', color:'#00e676' },
    ortu:    { label:'Ortu',      icon:'👨‍👩‍👦', color:'#26c6da' },
    siswa:   { label:'Siswa',     icon:'🎒',  color:'#448aff' },
    offline: { label:'Offline',   icon:'📴',  color:'#8a6200' },
  };
  const cfg = ROLE_CFG[role] || { label: role.toUpperCase(), icon:'👤', color:'var(--t2)' };

  // Guard: role tidak dikenal → sembunyikan semua nav
  const allowed = _FB_ROLE_PAGES[role];
  if (!allowed) {
    console.warn('[RBAC] _applyRoleUI: role tidak dikenali:', JSON.stringify(role));
    document.querySelectorAll('.snav, .bnav, .htab').forEach(b => { b.style.display = 'none'; });
    return;
  }

  // ── Show semua nav, lock yang tidak diizinkan ────────────────────────
  // TIDAK disembunyikan — tetap tampil agar user tahu fitur premium apa saja
  document.querySelectorAll('.snav, .bnav, .htab').forEach(btn => {
    const m = (btn.getAttribute('onclick') || '').match(/switchPage\('([^']+)'\)/);
    if (!m) return;
    const page = m[1];
    const isAllowed = allowed.includes(page);
    // Reset class
    btn.classList.remove('locked');
    btn.style.display = '';  // selalu tampil

    if (!isAllowed) {
      // Kunci — tampil tapi tidak bisa navigasi
      btn.classList.add('locked');
      // Override onclick: tampilkan upgrade prompt alih-alih switchPage
      btn.setAttribute('data-locked-page', page);
      btn.setAttribute('data-orig-onclick', btn.getAttribute('onclick'));
      btn.setAttribute('onclick', `_showLockedFeature('${page}')`);
      // Tambah gembok di label snav jika belum ada
      if (btn.classList.contains('snav')) {
        if (!btn.querySelector('.lock-badge')) {
          const badge = document.createElement('span');
          badge.className = 'lock-badge';
          badge.style.cssText = 'margin-left:auto;font-size:9px;background:rgba(255,202,40,.15);color:var(--yel);border:1px solid rgba(255,202,40,.2);padding:1px 6px;border-radius:8px;font-weight:700;flex-shrink:0';
          badge.textContent = '🔒 Pro';
          btn.appendChild(badge);
        }
      }
    } else {
      // Restore onclick asli jika sebelumnya dikunci
      const orig = btn.getAttribute('data-orig-onclick');
      if (orig) {
        btn.setAttribute('onclick', orig);
        btn.removeAttribute('data-orig-onclick');
        btn.removeAttribute('data-locked-page');
      }
      // Hapus lock badge jika ada
      const lb = btn.querySelector('.lock-badge');
      if (lb) lb.remove();
    }
  });

  // ── Isi banner user info (top banner) ────────────────────────────────
  const displayName = (_fbUser && (_fbUser._docDisplayName || _fbUser.displayName || _fbUser.email)) || 'User';
  const initials    = displayName.trim().charAt(0).toUpperCase();

  const bannerInfo  = document.getElementById('banner-user-info');
  const bannerAv    = document.getElementById('banner-avatar');
  const bannerName  = document.getElementById('banner-user-name');
  const bannerRole  = document.getElementById('banner-user-role');
  const brandBlock  = document.getElementById('banner-brand-block');
  if (bannerInfo) {
    bannerInfo.style.display = 'flex';
    if (bannerAv)   { bannerAv.textContent = initials; bannerAv.style.background = cfg.color; }
    if (bannerName) bannerName.textContent = displayName;
    if (bannerRole) { bannerRole.textContent = cfg.icon + ' ' + cfg.label; bannerRole.style.color = cfg.color; }
    // Sembunyikan brand "SEKOLAHPRO" saat user info tampil — hemat ruang mobile
    if (brandBlock) brandBlock.style.display = 'none';
  }
  // Update sync inline di banner
  _updateSyncBadge();

  // ── Isi sidebar user badge (desktop) ─────────────────────────────────
  const sideBadge = document.getElementById('sidebar-user-badge');
  const sideAv    = document.getElementById('sub-avatar');
  const sideName  = document.getElementById('sub-name');
  const sideRole  = document.getElementById('sub-role');
  if (sideBadge) {
    sideBadge.style.display = 'block';
    if (sideAv)   { sideAv.textContent = initials; sideAv.style.background = cfg.color; }
    if (sideName) sideName.textContent = displayName;
    if (sideRole) { sideRole.textContent = cfg.icon + ' ' + cfg.label; sideRole.style.color = cfg.color; }
  }

  // Sembunyikan / hapus semua logout lain — satu tombol saja (di sidebar)
  const oldLogout = document.getElementById('logout-btn-injected');
  if (oldLogout) oldLogout.remove();

  // Dev rainbow bar
  if (role === 'dev') {
    let b = document.getElementById('dev-banner');
    if (!b) {
      b = document.createElement('div');
      b.id = 'dev-banner';
      b.style.cssText = 'position:fixed;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#ff5252,#ff9800,#ffca28,#00e676,#26c6da,#c084fc);z-index:9999';
      document.body.prepend(b);
    }
  }

  console.log('[RBAC] ✅ Role applied:', role, '| Pages:', allowed.join(', '));
}

// _injectLogoutBtn dinonaktifkan — logout sudah ada di sidebar

function _injectLogoutBtn() { /* logout ada di sidebar, tidak perlu floating */ }

// ── Online Status Display ─────────────────────────

function _hubungiWA(fiturName, modalId) {
  // Ambil nama sekolah dari data lokal
  var sekolah = 'Sekolah';
  try {
    if (typeof getD === 'function') {
      sekolah = getD().profil_sekolah.nama || 'Sekolah';
    }
  } catch(e) {}

  // Tutup modal dulu
  var m = document.getElementById(modalId);
  if (m) m.remove();

  // Buat pesan WA yang natural
  var pesan = 'Halo Arblok Digital 👋'
    + '\n\nSaya dari *' + sekolah + '*'
    + ' ingin mengaktifkan fitur *' + fiturName + '* di SekolahPro.'
    + '\n\nMohon informasi paket dan cara upgradenya.'
    + '\nTerima kasih! 🙏';

  var url = 'https://wa.me/6289508053795?text=' + encodeURIComponent(pesan);
  window.open(url, '_blank');
}


function _showLockedFeature(page) {
  const PAGE_INFO = {
    bos:        { icon:'🏦', name:'Dana BOS',          desc:'Kelola pagu, realisasi, dan sisa anggaran BOS real-time. Log pengeluaran otomatis.',     role:'Basic / Pro' },
    komunikasi: { icon:'💬', name:'Komunikasi Ortu',    desc:'Kirim pesan ke orang tua siswa, terima laporan, dan pantau perkembangan anak.',          role:'Basic / Pro' },
    inventaris: { icon:'📦', name:'Inventaris Aset',    desc:'Catat aset sekolah, kondisi barang, dan lacak pengadaan per tahun ajaran.',               role:'Basic / Pro' },
    alumni:     { icon:'🎓', name:'Kelulusan & Alumni', desc:'Kelola data kelulusan, cetak ijazah digital, dan pantau jejak alumni sekolah.',           role:'Basic / Pro' },
    radar:      { icon:'📡', name:'Radar Kesehatan',    desc:'Analisis kesehatan akademik & keuangan sekolah secara visual dan real-time.',             role:'Pro' },
    laporan:    { icon:'📄', name:'Laporan & Cetak',    desc:'Generate laporan keuangan, rapor digital, dan ekspor PDF dengan satu klik.',             role:'Basic / Pro' },
    broadcast:  { icon:'📢', name:'Broadcast Iklan',    desc:'Kirim pengumuman dan iklan ke seluruh pengguna SekolahPro via Firestore.',                role:'Dev Only' },
    jadwal:     { icon:'📅', name:'Jadwal Kelas',       desc:'Atur jadwal pelajaran per kelas, guru, dan ruangan. Auto-deteksi konflik jadwal.',        role:'Basic / Pro' },
    kalender:   { icon:'🗓️', name:'Kalender Akademik',  desc:'Tandai hari libur, kegiatan sekolah, dan jadwal ujian dalam kalender interaktif.',       role:'Basic / Pro' },
  };

  const info = PAGE_INFO[page] || {
    icon: '🔒',
    name: page.charAt(0).toUpperCase() + page.slice(1),
    desc: 'Fitur ini tersedia di paket berbayar SekolahPro.',
    role: 'Basic / Pro'
  };

  const isOffline = isOfflineMode();
  const modalId = 'modal-locked-feature';
  const existing = document.getElementById(modalId);
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = modalId;
  modal.className = 'modal-bg open';
  modal.onclick = e => { if (e.target === modal) modal.remove(); };
  modal.innerHTML = `
    <div class="sheet" style="max-width:400px">
      <div class="mhdr">
        <h2>${info.icon} Fitur Terkunci</h2>
        <button class="mclose" onclick="document.getElementById('${modalId}').remove()">✕</button>
      </div>
      <div style="padding:20px 16px">

        <!-- Feature highlight -->
        <div style="background:var(--s2);border:1.5px solid var(--bdr);border-radius:12px;padding:16px;text-align:center;margin-bottom:16px">
          <div style="font-size:40px;margin-bottom:8px">${info.icon}</div>
          <div style="font-size:16px;font-weight:800;color:var(--t1);margin-bottom:6px">${info.name}</div>
          <div style="font-size:12px;color:var(--t2);line-height:1.6">${info.desc}</div>
          <div style="margin-top:10px;display:inline-flex;align-items:center;gap:5px;background:var(--yel-bg);border:1px solid rgba(255,202,40,.25);padding:4px 12px;border-radius:20px">
            <span style="font-size:10px">🔒</span>
            <span style="font-size:10px;font-weight:700;color:var(--yel)">Tersedia di paket ${info.role}</span>
          </div>
        </div>

        <!-- Perbandingan akses -->
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px">
          <div style="font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">Yang Kamu Butuhkan:</div>
          ${info.role === 'Dev Only' ? `
          <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--pur-bg);border-radius:8px;border:1px solid rgba(192,132,252,.2)">
            <span>🛠️</span><span style="font-size:12px;color:var(--pur);font-weight:600">Akses Developer — Hubungi Arblok Digital</span>
          </div>` : `
          <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--grn-bg);border-radius:8px;border:1px solid rgba(0,230,118,.15)">
            <span>☁️</span><span style="font-size:12px;color:var(--grn);font-weight:600">Login dengan akun sekolah aktif</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--yel-bg);border-radius:8px;border:1px solid rgba(255,202,40,.15)">
            <span>💳</span><span style="font-size:12px;color:var(--yel);font-weight:600">Paket ${info.role} (mulai Rp 149.000/bln)</span>
          </div>`}
        </div>

        <!-- Current mode info -->
        ${isOffline ? `
        <div style="background:rgba(255,202,40,.06);border:1px solid rgba(255,202,40,.2);border-radius:9px;padding:10px 12px;margin-bottom:16px;font-size:11px;color:var(--t2);line-height:1.6">
          📴 Kamu sedang di <b style="color:var(--yel)">Mode Offline (Gratis)</b>.<br/>
          Login dengan akun sekolah atau hubungi Arblok Digital untuk aktivasi.
        </div>` : `
        <div style="background:rgba(68,138,255,.06);border:1px solid rgba(68,138,255,.2);border-radius:9px;padding:10px 12px;margin-bottom:16px;font-size:11px;color:var(--t2);line-height:1.6">
          🔐 Role kamu saat ini belum memiliki akses ke fitur ini.<br/>
          Hubungi Arblok Digital untuk upgrade paket sekolahmu.
        </div>`}

        <!-- Kontak Arblok Digital -->
        <div style="background:linear-gradient(135deg,rgba(0,230,118,.06),rgba(37,211,102,.04));border:1.5px solid rgba(0,230,118,.2);border-radius:11px;padding:14px;margin-bottom:4px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <div style="width:36px;height:36px;border-radius:10px;background:rgba(37,211,102,.15);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">📲</div>
            <div>
              <div style="font-size:12px;font-weight:800;color:var(--t1)">Hubungi Arblok Digital</div>
              <div style="font-size:10px;color:var(--t3)">Respon cepat via WhatsApp</div>
            </div>
          </div>
          <div style="font-size:11px;color:var(--t2);line-height:1.7;margin-bottom:10px">
            Tim kami siap bantu aktivasi fitur <b style="color:var(--grn)">${info.name}</b> untuk sekolah Anda dalam hitungan menit.
          </div>
          <button onclick="_hubungiWA('${info.name.replace(/'/g,'&#39;')}', '${modalId}')"
            style="width:100%;padding:11px;border-radius:9px;border:none;cursor:pointer;background:linear-gradient(135deg,#25d366,#128c7e);color:white;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 3px 12px rgba(37,211,102,.3);transition:opacity .15s;"
            onmouseover="this.style.opacity='.9'" onmouseout="this.style.opacity='1'">
            <span style="font-size:18px">💬</span> Chat WhatsApp Sekarang
          </button>
        </div>

      </div>
      <!-- Actions -->
      <div class="mact">
        <button class="mbtn mbtn-c" onclick="document.getElementById('${modalId}').remove()">Nanti</button>
        ${isOffline
          ? `<button class="mbtn mbtn-s" onclick="document.getElementById('${modalId}').remove();doLogout()">🔐 Login Akun</button>`
          : `<button class="mbtn" style="background:var(--s2);border:1px solid var(--bdr2);color:var(--t2)" onclick="document.getElementById('${modalId}').remove();doLogout()">🔐 Ganti Akun</button>`
        }
      </div>
    </div>`;

  document.body.appendChild(modal);
}


function isOfflineMode() {
  return _fbOfflineMode === true && !_fbUser;
}

// Gate: fungsi-fungsi yang butuh login online untuk fitur premium
// Dipanggil di awal fungsi yang perlu dibatasi saat offline
// Saat ini: BOS, inventaris, alumni, radar, komunikasi cloud, broadcast

function requireOnline(featureName) {
  if (!isOfflineMode()) return true; // online → boleh
  showNotif(`☁️ "${featureName}" butuh login online`, 'warn');
  // Tampilkan prompt upgrade
  _showUpgradePrompt(featureName);
  return false;
}


function _showUpgradePrompt(feature) {
  const existing = document.getElementById('modal-upgrade-prompt');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'modal-upgrade-prompt';
  modal.className = 'modal-bg open';
  modal.onclick = e => { if(e.target===modal) modal.remove(); };
  modal.innerHTML = `
    <div class="sheet" style="max-width:380px;text-align:center">
      <div style="padding:24px 20px 8px">
        <div style="font-size:40px;margin-bottom:12px">☁️</div>
        <div style="font-size:16px;font-weight:900;color:var(--t1);margin-bottom:8px">Fitur Online</div>
        <div style="font-size:12px;color:var(--t2);line-height:1.7;margin-bottom:16px">
          <b style="color:var(--cyn)">${feature}</b> membutuhkan koneksi ke Firebase.<br/>
          Login dengan akun sekolah untuk mengaktifkan fitur cloud.
        </div>
        <div style="background:var(--s2);border:1px solid var(--bdr);border-radius:10px;padding:12px;margin-bottom:16px;text-align:left;font-size:11px">
          <div style="font-weight:700;color:var(--grn);margin-bottom:8px">✅ Tersedia di Mode Offline (Gratis):</div>
          <div style="color:var(--t2);line-height:1.8">
            📚 CRM Siswa (unlimited)<br/>
            🏫 Kelola Kelas SD/SMP/SMA<br/>
            💳 Catat Pembayaran SPP<br/>
            👨‍🏫 Payroll Guru<br/>
            📅 Jadwal & Kalender<br/>
            📄 Laporan lokal & Cetak<br/>
            🧾 Kwitansi digital
          </div>
        </div>
        <div style="background:var(--yel-bg);border:1px solid rgba(255,202,40,.3);border-radius:10px;padding:10px;margin-bottom:16px;text-align:left;font-size:11px">
          <div style="font-weight:700;color:var(--yel);margin-bottom:4px">☁️ Hanya Online (Login):</div>
          <div style="color:var(--t3);line-height:1.8">
            🏦 Dana BOS · 📦 Inventaris · 🎓 Alumni<br/>
            📡 Radar Kesehatan · 💬 Komunikasi Cloud<br/>
            📢 Broadcast · ☁️ Sync Firebase
          </div>
        </div>
      </div>
      <div style="padding:0 20px 20px;display:flex;flex-direction:column;gap:8px">
        <button onclick="document.getElementById('modal-upgrade-prompt').remove();doLogout()" style="
          width:100%;padding:12px;border-radius:10px;border:none;cursor:pointer;
          background:linear-gradient(135deg,var(--grn),#00c853);color:#000;font-weight:900;font-size:13px
        ">🔐 Login Sekarang</button>
        <button onclick="document.getElementById('modal-upgrade-prompt').remove()" style="
          width:100%;padding:10px;border-radius:10px;cursor:pointer;
          background:var(--s2);border:1px solid var(--bdr2);color:var(--t3);font-size:12px
        ">Lanjut Offline</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}


async function daftarkanUser() {
  if (!_fbDb || !navigator.onLine) {
    showNotif('📴 Butuh koneksi internet', 'err'); return;
  }
  const nama     = (document.getElementById('usr-nama')||{value:''}).value.trim();
  const email    = (document.getElementById('usr-email')||{value:''}).value.trim().toLowerCase();
  const role     = (document.getElementById('usr-role')||{value:'guru'}).value;
  const schoolId = _fbSchoolId || (document.getElementById('usr-schoolid')||{value:''}).value.trim();

  if (!email) { showNotif('Email wajib diisi!', 'err'); return; }
  if (!email.includes('@')) { showNotif('Format email tidak valid!', 'err'); return; }

  try {
    const existing = await _fbDb.collection('users').where('email','==',email).limit(1).get();
    if (!existing.empty) { showNotif('⚠️ Email ' + email + ' sudah terdaftar!', 'warn'); return; }

    const docId = email.replace(/[^a-zA-Z0-9]/g,'_') + '_' + Date.now().toString().slice(-6);
    await _fbDb.collection('users').doc(docId).set({
      email, displayname: nama || email.split('@')[0],
      role, schoolId: schoolId || '', isActive: true,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: _fbUser ? _fbUser.email : 'admin',
    });
    showNotif('✅ ' + (nama||email) + ' (' + role + ') berhasil didaftarkan!', 'ok');
    ['usr-nama','usr-email'].forEach(id => { const el=document.getElementById(id); if(el)el.value=''; });
    loadDaftarUser();
  } catch(e) {
    showNotif('❌ Gagal: ' + (e.code||e.message), 'err');
  }
}


async function loadDaftarUser() {
  const el = document.getElementById('usr-list');
  if (!el || !_fbDb || !navigator.onLine) return;
  el.innerHTML = '<div style="font-size:12px;color:var(--t3);text-align:center;padding:10px">⏳ Memuat...</div>';
  try {
    const snap = await _fbDb.collection('users').limit(100).get();
    if (snap.empty) {
      el.innerHTML = '<div style="font-size:12px;color:var(--t3);text-align:center;padding:10px">Belum ada user terdaftar</div>';
      return;
    }
    const RC = {
      dev:{l:'Developer',c:'var(--pur)'}, admin:{l:'Admin',c:'var(--yel)'},
      guru:{l:'Guru',c:'var(--grn)'}, ortu:{l:'Ortu',c:'var(--cyn)'},
      siswa:{l:'Siswa',c:'var(--blu)'}
    };
    el.innerHTML = snap.docs.map(doc => {
      const d = doc.data();
      const rc = RC[d.role] || {l: d.role||'—', c:'var(--t2)'};
      const ok = d.isActive !== false;
      const did = doc.id;
      const dem = (d.email||'').replace(/'/g,"\'");
      return `<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;
        border-radius:9px;background:var(--s2);border:1px solid var(--bdr)">
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.displayname||d.email}</div>
          <div style="font-size:10px;color:var(--t3)">${d.email}</div>
          <div style="display:flex;gap:5px;margin-top:4px;flex-wrap:wrap">
            <span style="font-size:9px;padding:1px 7px;border-radius:8px;font-weight:700;background:${rc.c}15;color:${rc.c}">${rc.l}</span>
            ${d.schoolId ? `<span style="font-size:9px;padding:1px 7px;border-radius:8px;background:var(--blu-bg);color:var(--blu);font-weight:700">${d.schoolId}</span>` : ''}
            <span style="font-size:9px;padding:1px 7px;border-radius:8px;font-weight:700;
              background:${ok?'var(--grn-bg)':'var(--red-bg)'};color:${ok?'var(--grn)':'var(--red)'}">
              ${ok?'✅ Aktif':'❌ Nonaktif'}
            </span>
          </div>
        </div>
        <div style="display:flex;gap:4px;flex-shrink:0">
          <button onclick="toggleAktifUser('${did}',${!ok})" style="
            padding:5px 8px;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer;
            background:${ok?'var(--red-bg)':'var(--grn-bg)'};
            color:${ok?'var(--red)':'var(--grn)'};
            border:1px solid ${ok?'rgba(255,82,82,.3)':'rgba(0,230,118,.3)'}">
            ${ok?'Nonaktif':'Aktifkan'}
          </button>
          <button onclick="hapusUser('${did}','${dem}')" style="
            padding:5px 8px;border-radius:6px;font-size:10px;cursor:pointer;
            background:var(--red-bg);color:var(--red);border:1px solid rgba(255,82,82,.3);font-weight:700">
            🗑️
          </button>
        </div>
      </div>`;
    }).join('');
  } catch(e) {
    el.innerHTML = `<div style="font-size:12px;color:var(--red);padding:10px">❌ ${e.code||e.message}</div>`;
  }
}


async function toggleAktifUser(docId, setActive) {
  if (!_fbDb) return;
  try { await _fbDb.collection('users').doc(docId).update({isActive:setActive}); showNotif(setActive?'✅ User diaktifkan':'❌ User dinonaktifkan','ok'); loadDaftarUser(); }
  catch(e) { showNotif('❌ '+(e.code||e.message),'err'); }
}


async function hapusUser(docId, email) {
  if (!confirm('Hapus user ' + email + '?\nUser tidak akan bisa login lagi.')) return;
  if (!_fbDb) return;
  try { await _fbDb.collection('users').doc(docId).delete(); showNotif('🗑️ ' + email + ' dihapus','ok'); loadDaftarUser(); }
  catch(e) { showNotif('❌ '+(e.code||e.message),'err'); }
}

// ════════════════════════════════════════════════════════════════════
//  FIX ORTU CHILDREN — Link data anak dari Firestore
//  Saat role ortu login, baca field 'children' di doc users mereka
//  → ambil data siswa dari koleksi 'students' berdasarkan ID itu
// ════════════════════════════════════════════════════════════════════


globalThis._ortuChildren = [];  // Cache data anak untuk ortu yang login


async function _loadOrtuChildren() {
  if (_fbRole !== 'ortu' || !_fbDb || !_fbUser) return;
  try {
    const userDoc = await _fbDb.collection('users').doc(_fbUser.uid).get();
    if (!userDoc.exists) return;
    const raw = userDoc.data();
    // Baca children array (toleran field name)
    const fm = {}; Object.keys(raw).forEach(k => { fm[k.trim().toLowerCase()] = raw[k]; });
    const childrenIds = fm['children'] || [];
    if (!childrenIds.length) {
      console.log('[Ortu] Tidak ada data anak di field children');
      return;
    }
    console.log('[Ortu] Children IDs:', childrenIds);
    // Ambil data siswa berdasarkan doc ID
    const promises = childrenIds.map(id =>
      _fbDb.collection('students').doc(id).get().catch(() => null)
    );
    const docs = await Promise.all(promises);
    _ortuChildren = docs
      .filter(d => d && d.exists)
      .map(d => {
        const r = d.data();
        const fm2 = {}; Object.keys(r).forEach(k => { fm2[k.trim().toLowerCase()] = r[k]; });
        return {
          id:       d.id,
          nama:     fm2['studentname'] || fm2['nama'] || fm2['name'] || 'Tanpa Nama',
          kelas:    fm2['classid']     || fm2['kelas'] || '',
          nisn:     fm2['nisn']        || '',
          schoolId: String(fm2['schoolid'] || fm2['schoolId'] || '').toUpperCase(),
          isActive: fm2['isactive']    !== undefined ? fm2['isactive'] : true,
          _docId:   d.id,
        };
      });
    console.log('[Ortu] Data anak loaded:', _ortuChildren.length);
    // Render komunikasi page jika sedang aktif
    if (currentPage === 'komunikasi') _renderOrtuView();
  } catch(e) {
    console.warn('[Ortu] Load children error:', e.message);
  }
}


function _renderOrtuView() {
  // Render tampilan ortu di halaman komunikasi
  const pageEl = document.getElementById('komunikasi-page');
  if (!pageEl) return;
  const top = pageEl.querySelector('[id="kom-ortu-view"]') || (() => {
    const div = document.createElement('div');
    div.id = 'kom-ortu-view';
    div.style.cssText = 'padding:12px;display:flex;flex-direction:column;gap:12px';
    pageEl.insertBefore(div, pageEl.firstChild);
    return div;
  })();

  if (!_ortuChildren.length) {
    top.innerHTML = `
      <div class="card" style="text-align:center;padding:24px">
        <div style="font-size:48px;margin-bottom:12px">👨‍👩‍👦</div>
        <div style="font-size:14px;font-weight:700;color:var(--t1);margin-bottom:8px">Belum ada data anak</div>
        <div style="font-size:12px;color:var(--t3)">
          Data anak akan muncul setelah admin mengimport data siswa<br/>
          dengan email orang tua yang sesuai akun ini.
        </div>
      </div>`;
    return;
  }

  top.innerHTML = `
    <div class="card" style="border:1px solid rgba(38,198,218,.2)">
      <div class="card-title" style="color:var(--cyn)">👨‍👩‍👦 Data Anak Saya (${_ortuChildren.length})</div>
      ${_ortuChildren.map(anak => `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--bdr)">
          <div style="width:40px;height:40px;border-radius:50%;background:var(--cyn-bg);border:2px solid var(--cyn);color:var(--cyn);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;flex-shrink:0">
            ${(anak.nama||'?').charAt(0).toUpperCase()}
          </div>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:700;color:var(--t1)">${anak.nama}</div>
            <div style="font-size:11px;color:var(--t3);margin-top:2px">
              Kelas ${anak.kelas||'—'} ${anak.nisn?`· NISN: ${anak.nisn}`:''}
            </div>
          </div>
          <span class="bdg ${anak.isActive?'bdg-g':'bdg-r'}">${anak.isActive?'Aktif':'Non-aktif'}</span>
        </div>`).join('')}
    </div>`;
}

// ════════════════════════════════════════════════════════════════════
//  FIX DASHBOARD COUNTER
//  Pastikan counter dashboard selalu sinkron setelah import/edit
// ════════════════════════════════════════════════════════════════════

// Patch saveDB untuk selalu update counter saat data berubah

// ── shim fungsi ke global (handler inline lama + pemanggilan antar-file) ──
Object.assign(globalThis, { _normalizeRole, _fbInit, _onAuthState, _fbLoadSchoolData, _showLoginPage, _hideLoginPage, _fbShowError, doLogin, doLoginGoogle, _handleGoogleRedirectResult, _validateGoogleUser, _googleBtnHTML, doLogout, masukOfflineMode, togglePassVis, showForgotPassword, _applyRoleUI, _injectLogoutBtn, _hubungiWA, _showLockedFeature, isOfflineMode, requireOnline, _showUpgradePrompt, daftarkanUser, loadDaftarUser, toggleAktifUser, hapusUser, _loadOrtuChildren, _renderOrtuView });
export { _normalizeRole, _fbInit, _onAuthState, _fbLoadSchoolData, _showLoginPage, _hideLoginPage, _fbShowError, doLogin, doLoginGoogle, _handleGoogleRedirectResult, _validateGoogleUser, _googleBtnHTML, doLogout, masukOfflineMode, togglePassVis, showForgotPassword, _applyRoleUI, _injectLogoutBtn, _hubungiWA, _showLockedFeature, isOfflineMode, requireOnline, _showUpgradePrompt, daftarkanUser, loadDaftarUser, toggleAktifUser, hapusUser, _loadOrtuChildren, _renderOrtuView };
