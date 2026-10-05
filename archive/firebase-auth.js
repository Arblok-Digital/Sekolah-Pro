
// ─────────────────────────────────────────────────────────────────
// FIREBASE CONFIG — sekolahpro-a0ff0
// GANTI DENGAN API KEY LO DI SINI jika perlu
// ─────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyATc7UWSIwLyYlex34lQaiLZUPuMz3ZreA",
  authDomain:        "sekolahpro-a0ff0.firebaseapp.com",
  projectId:         "sekolahpro-a0ff0",
  storageBucket:     "sekolahpro-a0ff0.firebasestorage.app",
  messagingSenderId: "287917969897",
  appId:             "1:287917969897:web:8c04d83c61bd503642bb78"
};
// ─────────────────────────────────────────────────────────────────

firebase.initializeApp(firebaseConfig);
var _auth = firebase.auth();
var _db   = firebase.firestore();

// ── ROLE NORMALIZATION ──
var ROLE_ALIAS = {
  "admin":"kepala_sekolah","superadmin":"dev",
  "teacher":"guru","staff":"tata_usaha",
  "parent":"ortu","student":"siswa"
};
function _normalizeRole(r) {
  if (!r) return "siswa";
  return ROLE_ALIAS[r.toLowerCase()] || r.toLowerCase();
}

// ── ROLE PERMISSIONS ──
var PAGE_ACCESS = {
  dev:            ["dashboard","crm","spp","guru","bos","akademik","jadwal","kalender","komunikasi","inventaris","alumni","laporan","radar","setting"],
  kepala_sekolah: ["dashboard","crm","spp","guru","bos","akademik","jadwal","kalender","komunikasi","inventaris","alumni","laporan","radar","setting"],
  bendahara:      ["dashboard","spp","guru","bos","laporan","setting"],
  guru:           ["dashboard","crm","jadwal","kalender","komunikasi","laporan"],
  tata_usaha:     ["dashboard","crm","spp","jadwal","kalender","komunikasi","inventaris","alumni","laporan","setting"],
  ortu:           ["dashboard","spp","komunikasi"],
  siswa:          ["dashboard","spp"]
};
var HOME_PAGE = {
  dev:"dashboard", kepala_sekolah:"dashboard", bendahara:"spp",
  guru:"dashboard", tata_usaha:"dashboard", ortu:"spp", siswa:"spp"
};
var ROLE_BADGE_CFG = {
  dev:            {label:"DEV",         bg:"var(--red-bg)", color:"var(--red)"},
  kepala_sekolah: {label:"Admin/KS",    bg:"var(--grn-bg)", color:"var(--grn)"},
  bendahara:      {label:"Bendahara",   bg:"var(--yel-bg)", color:"var(--yel)"},
  guru:           {label:"Guru",        bg:"var(--blu-bg)", color:"var(--blu)"},
  tata_usaha:     {label:"TU",          bg:"var(--cyn-bg)", color:"var(--cyn)"},
  ortu:           {label:"Ortu",        bg:"var(--amb-bg)", color:"var(--amb)"},
  siswa:          {label:"Siswa",       bg:"var(--pur-bg)", color:"var(--pur)"}
};
var UI_GUARDS = [
  {s:"[onclick*='modal-spp']",             r:["dev","kepala_sekolah","bendahara","tata_usaha"]},
  {s:"[onclick*='modal-absensi-massal']",  r:["dev","kepala_sekolah","guru","tata_usaha"]},
  {s:"[onclick*='modal-infak']",           r:["dev","kepala_sekolah","bendahara","tata_usaha"]},
  {s:"[onclick*='modal-crm-add']",         r:["dev","kepala_sekolah","tata_usaha"]},
  {s:"[onclick*='modal-piutang-massal']",  r:["dev","kepala_sekolah","bendahara"]},
  {s:"[onclick*='bayarSemuaGuru']",        r:["dev","kepala_sekolah","bendahara"]},
  {s:"[onclick*='modal-payroll-config']",  r:["dev","kepala_sekolah","bendahara"]},
  {s:"[onclick*='modal-bos-pagu']",        r:["dev","kepala_sekolah","bendahara"]},
  {s:"[onclick*='modal-bos-keluar']",      r:["dev","kepala_sekolah","bendahara"]},
  {s:"[onclick*='openKenaikanKonfirmasi']",r:["dev","kepala_sekolah"]},
  {s:"[onclick*='modal-akd-config']",      r:["dev","kepala_sekolah"]},
  {s:"[onclick*='cetakRekap']",            r:["dev","kepala_sekolah","bendahara","tata_usaha"]},
  {s:"[onclick*='openSmartImport']",       r:["dev","kepala_sekolah","tata_usaha"]},
  {s:"[onclick*='kirimBroadcast']",        r:["dev","kepala_sekolah","guru","tata_usaha"]},
  {s:"[onclick*='eksporCSV']",             r:["dev","kepala_sekolah","bendahara","tata_usaha"]}
];

window.currentUser        = null;
window.currentUserProfile = null;

// ── GATEKEEPER ──
_auth.onAuthStateChanged(function(fbUser) {
  if (!fbUser) { _showLP(); return; }
  _db.collection("users").doc(fbUser.uid).get().then(function(snap) {
    if (!snap.exists) {
      _db.collection("users").doc(fbUser.uid).set({
        uid: fbUser.uid, email: fbUser.email,
        displayName: fbUser.displayName || fbUser.email,
        photoURL: fbUser.photoURL || null,
        role: "siswa", schoolId: null, isActive: false,
        fcmToken: null, createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      _showLP(); _setErr("Akun baru dibuat. Tunggu admin mengaktifkan akun Anda.");
      _auth.signOut(); return;
    }
    var p = snap.data();
    p.role = _normalizeRole(p.role);
    if (!p.isActive) { _showLP(); _setErr("Akun belum aktif. Hubungi admin sekolah."); _auth.signOut(); return; }
    if (p.role !== "dev" && !p.schoolId) { _showLP(); _setErr("Akun belum dihubungkan ke sekolah. Hubungi admin."); _auth.signOut(); return; }

    window.currentUser = fbUser;
    window.currentUserProfile = p;
    _db.collection("users").doc(fbUser.uid).update({lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()}).catch(function(){});
    _hideLP();
    _applyUI(p.role);
    setTimeout(function() { if (typeof switchPage === "function") switchPage(HOME_PAGE[p.role] || "dashboard"); }, 100);
    window.dispatchEvent(new CustomEvent("sekolahpro:auth", {detail: {user: fbUser, profile: p}}));
  }).catch(function(err) {
    console.error("[Auth]", err);
    _showLP(); _setErr("Gagal memuat profil. Periksa koneksi."); _auth.signOut();
  });
});

// ── APPLY ROLE UI ──
function _applyUI(role) {
  var ok = PAGE_ACCESS[role] || ["dashboard"];
  var ALL = ["dashboard","crm","spp","guru","bos","akademik","jadwal","kalender","komunikasi","inventaris","alumni","laporan","radar","setting"];
  ALL.forEach(function(p) {
    var el = document.getElementById("bn-"+p);
    if (el) el.style.display = ok.indexOf(p) >= 0 ? "" : "none";
  });
  document.querySelectorAll("#sidebar .snav").forEach(function(b) {
    var m = (b.getAttribute("onclick")||"").match(/switchPage\('([^']+)'\)/);
    if (m) b.style.display = ok.indexOf(m[1]) >= 0 ? "" : "none";
  });
  document.querySelectorAll("#hdr .htab").forEach(function(b) {
    var m = (b.getAttribute("onclick")||"").match(/switchPage\('([^']+)'\)/);
    if (m) b.style.display = ok.indexOf(m[1]) >= 0 ? "" : "none";
  });
  UI_GUARDS.forEach(function(g) {
    document.querySelectorAll(g.s).forEach(function(el) {
      el.style.display = g.r.indexOf(role) >= 0 ? "" : "none";
    });
  });
  if (role === "ortu" || role === "siswa") {
    document.querySelectorAll(".toolbar").forEach(function(el) { el.style.display = "none"; });
    var c = document.getElementById("crm-filter-chips"); if (c) c.style.display = "none";
  }
  if (!document.getElementById("role-badge")) {
    var cfg = ROLE_BADGE_CFG[role] || {label: role, bg:"var(--s2)", color:"var(--t2)"};
    var b = document.createElement("span");
    b.id = "role-badge";
    b.style.cssText = "font-size:9px;font-weight:700;padding:3px 8px;border-radius:10px;background:"+cfg.bg+";color:"+cfg.color+";white-space:nowrap;cursor:pointer;flex-shrink:0;";
    b.textContent = cfg.label;
    b.title = "Klik untuk logout";
    b.onclick = function() { doLogout(); };
    var hr = document.querySelector("#hdr .hdr-right"); if (hr) hr.prepend(b);
  }
  if (role === "dev" && !document.getElementById("dev-banner")) {
    var bann = document.createElement("div");
    bann.id = "dev-banner";
    bann.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:9998;background:var(--red-bg);border-bottom:2px solid var(--red);padding:3px 14px;font-size:10px;font-weight:700;color:var(--red);text-align:center;pointer-events:none;";
    bann.textContent = "DEV MODE - Full Access";
    document.body.prepend(bann);
    var hdr = document.getElementById("hdr"); if (hdr) hdr.style.marginTop = "22px";
  }
  if (typeof switchPage === "function" && !window._spPatched) {
    window._spPatched = true;
    var orig = window.switchPage;
    window.switchPage = function(pid) {
      if (!window.currentUserProfile) { _showLP(); return; }
      var r = window.currentUserProfile.role;
      var a = PAGE_ACCESS[r] || ["dashboard"];
      if (a.indexOf(pid) < 0) {
        if (typeof showNotif === "function") showNotif("Akses ditolak.", "err");
        orig(HOME_PAGE[r] || "dashboard"); return;
      }
      orig(pid);
    };
  }
}

// ── AUTH ACTIONS (global scope - bisa dipanggil dari onclick HTML) ──
function doLogin() {
  var em = (document.getElementById("login-email") || {}).value;
  var pw = (document.getElementById("login-password") || {}).value;
  if (!em || !pw) { _setErr("Email dan password wajib diisi."); return; }
  _setLoad(true);
  _auth.signInWithEmailAndPassword(em.trim(), pw)
    .catch(function(e) { _setLoad(false); _setErr(_errMsg(e.code)); });
}
function doGoogleLogin() {
  _setLoad(true);
  var provider = new firebase.auth.GoogleAuthProvider();
  _auth.signInWithPopup(provider)
    .catch(function(e) { _setLoad(false); _setErr(_errMsg(e.code)); });
}
function doLogout() {
  if (!confirm("Yakin ingin keluar dari Sekolah Pro?")) return;
  _auth.signOut();
  window.currentUser = null; window.currentUserProfile = null;
  ["role-badge","dev-banner"].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.remove();
  });
  _showLP();
  if (typeof showNotif === "function") showNotif("Berhasil keluar", "ok");
}

// ── HELPER PUBLIK ──
window.hasAccess     = function(r)  { if (!window.currentUserProfile) return false; if (window.currentUserProfile.role === "dev") return true; return Array.isArray(r) ? r.indexOf(window.currentUserProfile.role) >= 0 : window.currentUserProfile.role === r; };
window.getMySchoolId = function()   { return window.currentUserProfile ? window.currentUserProfile.schoolId : null; };
window.getMyRole     = function()   { return window.currentUserProfile ? window.currentUserProfile.role : null; };
window.canAccessPage = function(p)  { if (!window.currentUserProfile) return false; return (PAGE_ACCESS[window.currentUserProfile.role]||["dashboard"]).indexOf(p) >= 0; };

// ── INTERNAL ──
function _showLP() {
  var lp = document.getElementById("login-page"); if (lp) lp.style.display = "flex";
  ["hdr","ticker-bar","bottom-nav","desktop-layout"].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.style.visibility = "hidden";
  });
}
function _hideLP() {
  var lp = document.getElementById("login-page"); if (lp) lp.style.display = "none";
  ["hdr","ticker-bar","bottom-nav","desktop-layout"].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.style.visibility = "";
  });
  var e = document.getElementById("login-error"); if (e) { e.style.display="none"; e.textContent=""; }
}
function _setErr(msg) {
  var el = document.getElementById("login-error"); if (el) { el.textContent=msg; el.style.display="block"; } _setLoad(false);
}
function _setLoad(on) {
  var ld  = document.getElementById("login-loading");
  var btn = document.getElementById("login-btn");
  var gb  = document.getElementById("login-google-btn");
  var em  = document.getElementById("login-email");
  var pw  = document.getElementById("login-password");
  if (ld) ld.style.display = on ? "flex" : "none";
  [btn,gb,em,pw].forEach(function(el) { if (el) el.disabled = on; });
  if (btn) btn.textContent = on ? "Memverifikasi..." : "Masuk";
}
function _errMsg(c) {
  var M = {
    "auth/user-not-found":"Email tidak terdaftar.",
    "auth/wrong-password":"Password salah.",
    "auth/invalid-email":"Format email tidak valid.",
    "auth/user-disabled":"Akun dinonaktifkan.",
    "auth/too-many-requests":"Terlalu banyak percobaan, coba nanti.",
    "auth/network-request-failed":"Tidak ada koneksi internet.",
    "auth/popup-closed-by-user":"Login Google dibatalkan.",
    "auth/invalid-credential":"Email atau password salah."
  };
  return M[c] || ("Gagal: " + c);
}

// Enter key
document.addEventListener("DOMContentLoaded", function() {
  var pw = document.getElementById("login-password");
  if (pw) pw.addEventListener("keydown", function(e) { if (e.key === "Enter") doLogin(); });
});

console.log("[SekolahPro] Auth v2.0 (compat) loaded");
