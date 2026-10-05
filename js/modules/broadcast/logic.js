// js/modules/broadcast/logic.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

globalThis._ADS_ACTIVE  = [];

globalThis._ADS_CACHE_KEY = 'sp_ads_cache';

// ── Load dari Firestore ───────────────────────────────────────

function _loadBroadcastAds(schoolId) {
  if (!_fbDb) { _loadAdsFromCache(); return; }

  // Offline → langsung dari cache
  if (!navigator.onLine) { _loadAdsFromCache(); return; }

  // Baca dari 'broadcasts' — sesuai collection yang ditulis kirimBroadcastDev()
  _fbDb.collection('broadcasts')
    .get()
    .then(function(snap) {
      var now = new Date().toISOString();
      var ads = [];
      snap.forEach(function(doc) {
        var ad = Object.assign({ id: doc.id }, doc.data());

        // Skip jika is_active eksplisit = false (field opsional — kalau tidak ada = aktif)
        if (ad.is_active === false) return;

        // Filter expired
        if (ad.expires_at && ad.expires_at < now) return;

        // Filter target sekolah
        var tgtSchool = ad.schoolId || ad.target_school || 'ALL';
        if (tgtSchool !== 'ALL' && tgtSchool !== 'all' &&
            schoolId && tgtSchool !== schoolId) return;

        // Filter target role (toleran — kalau 'all' atau tidak ada = tampil semua)
        var tgtRole = ad.target || ad.target_role || 'all';
        if (tgtRole !== 'all' && tgtRole !== 'ALL' &&
            _fbRole && _fbRole !== 'offline' && _fbRole !== 'dev' &&
            tgtRole !== _fbRole) return;

        ads.push(ad);
      });

      // Sort: priority ASC (1 duluan), lalu sentAt DESC
      // sentAt bisa berupa Firestore Timestamp (object dengan .toMillis())
      // atau string ISO — harus di-handle keduanya
      ads.sort(function(a, b) {
        var pa = a.priority || 99, pb = b.priority || 99;
        if (pa !== pb) return pa - pb;
        // Convert sentAt ke number ms — handle Timestamp object & string
        function toMs(v) {
          if (!v) return 0;
          if (typeof v === 'object' && typeof v.toMillis === 'function') return v.toMillis();
          if (typeof v === 'object' && v.seconds) return v.seconds * 1000;
          return new Date(v).getTime() || 0;
        }
        return toMs(b.sentAt || b.created_at) - toMs(a.sentAt || a.created_at);
      });

      // ── SLOT SYSTEM ────────────────────────────────────────────
      // Ticker: tampilkan SEMUA iklan aktif (scrolling)
      // Banner dashboard: hanya 1 iklan (prioritas tertinggi)
      // Total slot aktif = tidak dibatasi (semua muncul di ticker)
      // Dev bisa publish iklan sebanyak apapun
      // ───────────────────────────────────────────────────────────

      _ADS_ACTIVE = ads;

      // Cache ke localStorage — tetap tampil saat offline
      try {
        localStorage.setItem(_ADS_CACHE_KEY, JSON.stringify({
          ads: ads,
          cached_at: new Date().toISOString(),
          school_id: schoolId || 'ALL'
        }));
      } catch(e) {}

      console.log('[ADS] Loaded', ads.length, 'broadcasts from Firestore');
      _renderAllAds();
    })
    .catch(function(e) {
      console.warn('[ADS] Fetch failed:', e.message,
        '— kemungkinan Security Rules belum dipublish atau network error');
      _loadAdsFromCache();
    });
}

// ── Load dari cache (offline mode) ───────────────────────────

function _loadAdsFromCache() {
  try {
    var raw = localStorage.getItem(_ADS_CACHE_KEY);
    if (!raw) { _ADS_ACTIVE = []; return; }
    var p = JSON.parse(raw);
    var age = (Date.now() - new Date(p.cached_at).getTime()) / 86400000;
    if (age > 7) { _ADS_ACTIVE = []; return; }
    _ADS_ACTIVE = p.ads || [];
    console.log('[ADS] Cache:', _ADS_ACTIVE.length, 'ads (', age.toFixed(1), 'd old)');
    _renderAllAds();
  } catch(e) { _ADS_ACTIVE = []; }
}

// ── Render semua: ticker + banner dashboard ───────────────────
// ── CTA Link helpers ─────────────────────────────────────────
// Auto-detect nomor WA (08xx / 62xx / +62xx) → https://wa.me/62xxx

function _normalizeCtaLink(raw) {
  if (!raw) return '';
  raw = raw.trim();
  // Sudah URL lengkap
  if (/^https?:\/\//i.test(raw)) return raw;
  // Nomor WA: 08xx, 62xx, +62xx, atau hanya angka 10-13 digit
  const digits = raw.replace(/[\s\-\+\(\)]/g, '');
  if (/^\d{9,13}$/.test(digits)) {
    const normalized = digits.startsWith('0') ? '62' + digits.slice(1) : digits;
    return 'https://wa.me/' + normalized;
  }
  // Tidak ada protokol → tambah https://
  return 'https://' + raw;
}


function _dismissAdBanner(adId) {
  var dismissed = JSON.parse(localStorage.getItem('sp_ads_dismissed') || '[]');
  if (!dismissed.includes(adId)) dismissed.push(adId);
  // Max simpan 50 dismissed
  localStorage.setItem('sp_ads_dismissed', JSON.stringify(dismissed.slice(-50)));
  _renderAdsDashboardBanner();
}

// ── Items untuk running ticker ────────────────────────────────

function _getAdsTickerItems() {
  if (!_ADS_ACTIVE || !_ADS_ACTIVE.length) return [];
  var now = new Date().toISOString();
  var TYPE_COLOR = {
    promo:'#c084fc', info:'#448aff', warning:'#ffca28', event:'#00e676'
  };
  return _ADS_ACTIVE
    .filter(function(ad) {
      return ad.is_active !== false && (!ad.expires_at || ad.expires_at >= now);
    })
    .map(function(ad) {
      var color   = TYPE_COLOR[ad.type] || '#ffca28';
      var icon    = ad.typeIcon  || '📢';
      var label   = ad.typeLabel || ad.type || 'ADS';
      var text    = (ad.body || ad.title || '').slice(0, 80);
      var ctaText = ad.cta || ad.cta_text || '';
      var ctaLink = _normalizeCtaLink(ad.ctaLink || ad.cta_link || '');
      return '<span class="tick-item">' +
        '<span class="tick-ads-brand" style="background:' + color + '20;color:' + color + ';font-size:11px;font-weight:900;padding:2px 8px;border-radius:4px;letter-spacing:.5px">' + label + '</span>' +
        ' <span style="font-size:15px">' + icon + '</span>' +
        ' <span style="font-size:14px;font-weight:600;color:#e8f0fe">' + text + '</span>' +
        (ctaText
          ? ' <span style="font-size:13px;font-weight:900;color:#00e676;cursor:pointer;text-decoration:underline;padding:1px 8px;border-radius:4px;background:rgba(0,230,118,.12)" onclick="openCtaLink(\'' + ctaLink + '\')">' + ctaText + ' »</span>'
          : '') +
        '</span>';
    });
}

// ── Auto refresh setiap 30 menit saat online ──────────────────
setInterval(function() {
  if (navigator.onLine && _fbDb) _loadBroadcastAds(_fbSchoolId || null);
}, 30 * 60 * 1000);

window.addEventListener('online', function() {
  setTimeout(function() { if (_fbDb) _loadBroadcastAds(_fbSchoolId || null); }, 3000);
});

//  PWA — Install Prompt + Service Worker
//  Copyright © 2026 Arblok Digital
// ════════════════════════════════════════════════════

// ── Global state ──────────────────────────────────

globalThis._bcState = { target: 'all', type: 'info' };


globalThis.BC_TYPE_CFG = {
  info:    { icon:'ℹ️', color:'var(--blu)',  bg:'var(--blu-bg)',  label:'Info'       },
  promo:   { icon:'🎯', color:'var(--grn)',  bg:'var(--grn-bg)',  label:'Promo'      },
  warning: { icon:'⚠️', color:'var(--yel)',  bg:'var(--yel-bg)',  label:'Peringatan' },
  event:   { icon:'📅', color:'var(--cyn)',  bg:'var(--cyn-bg)',  label:'Event'      },
};


function updateBcPreview() {
  const title  = (document.getElementById('bc-title')||{value:''}).value.trim();
  const body   = (document.getElementById('bc-body') ||{value:''}).value.trim();
  const cta    = (document.getElementById('bc-cta-label')||{value:''}).value.trim();
  const link   = (document.getElementById('bc-cta-link') ||{value:''}).value.trim();
  const cfg    = BC_TYPE_CFG[_bcState.type] || BC_TYPE_CFG.info;
  const box    = document.getElementById('bc-preview-box');
  const inner  = document.getElementById('bc-preview-inner');
  if (!box || !inner) return;

  if (!title && !body) {
    inner.innerHTML = '<span style="color:var(--t3);font-style:italic">Mulai ketik untuk preview pesan...</span>';
    box.style.borderColor = 'var(--bdr)';
    return;
  }

  box.style.borderColor = cfg.color;
  const targetLabels = { all:'Semua User', admin:'Admin', guru:'Guru', ortu:'Orang Tua', siswa:'Siswa' };
  inner.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <span style="font-size:18px">${cfg.icon}</span>
      <div>
        <div style="font-size:9px;font-weight:800;color:${cfg.color};text-transform:uppercase;letter-spacing:.5px">${cfg.label} · ${targetLabels[_bcState.target]||''}</div>
        <div style="font-size:13px;font-weight:900;color:var(--t1)">${title || '<em style="color:var(--t3)">Tanpa judul</em>'}</div>
      </div>
    </div>
    <div style="font-size:12px;color:var(--t2);line-height:1.7;white-space:pre-wrap">${body || ''}</div>
    ${cta ? `<div style="margin-top:10px"><a href="${_normalizeCtaLink(link)||'#'}" target="_blank" onclick="if(_normalizeCtaLink(link)){event.preventDefault();openCtaLink(link);}" style="
      display:inline-block;padding:7px 16px;background:${cfg.color};color:#000;
      border-radius:8px;font-size:11px;font-weight:900;text-decoration:none">${cta} →</a></div>` : ''}
    <div style="margin-top:10px;font-size:9px;color:var(--t3)">Dikirim oleh: ${_fbUser?(_fbUser._docDisplayName||_fbUser.email):'Dev'} · ${new Date().toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'})}</div>
  `;
}


function clearBcHistory() {
  hapusSemua_BC();
}

// ══════════════════════════════════════════════════════
//  USER MANAGEMENT — Admin daftarkan email user
//  Agar bisa Login with Google di SekolahPro
// ══════════════════════════════════════════════════════


Object.assign(globalThis, { _loadBroadcastAds, _loadAdsFromCache, _normalizeCtaLink, _dismissAdBanner, _getAdsTickerItems, updateBcPreview, clearBcHistory });
export { _loadBroadcastAds, _loadAdsFromCache, _normalizeCtaLink, _dismissAdBanner, _getAdsTickerItems, updateBcPreview, clearBcHistory };
