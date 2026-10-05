// js/modules/broadcast/route.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

import './logic.js';
import './pipeline.js';

function openCtaLink(link) {
  if (!link) return;
  const url = _normalizeCtaLink(link);
  window.open(url, '_blank');
}


function _renderAllAds() {
  if (typeof buildTicker === 'function') buildTicker();
  _renderAdsDashboardBanner();
}

// ── Banner di dashboard (card di atas quick stats) ────────────

function _renderAdsDashboardBanner() {
  // Cari atau buat slot banner
  var wrap = document.getElementById('ads-banner-slot');
  if (!wrap) {
    // Inject slot setelah saldo-main, sebelum stats-row
    var statsRow = document.querySelector('#dashboard-page .stats-row');
    if (!statsRow) return;
    wrap = document.createElement('div');
    wrap.id = 'ads-banner-slot';
    statsRow.parentNode.insertBefore(wrap, statsRow);
  }

  var now = new Date().toISOString();
  var dismissed = JSON.parse(localStorage.getItem('sp_ads_dismissed') || '[]');

  // Filter: aktif, belum expired, belum di-dismiss, cocok target
  var bannerAds = _ADS_ACTIVE.filter(function(ad) {
    if (dismissed.includes(ad.id)) return false;
    if (ad.expires_at && ad.expires_at < now) return false;
    return true;
  });

  if (!bannerAds.length) { wrap.innerHTML = ''; return; }

  // Ambil 1 iklan — prioritas tertinggi (sentAt terbaru)
  var ad = bannerAds[0];

  // Mapping type → style
  var TYPE_STYLE = {
    promo:   { bg:'linear-gradient(135deg,#100020,#1a0035)', border:'rgba(192,132,252,.3)', color:'var(--pur)', icon:'🎯' },
    info:    { bg:'linear-gradient(135deg,#060d1a,#0a1628)', border:'rgba(68,138,255,.3)',  color:'var(--blu)', icon:'ℹ️'  },
    warning: { bg:'linear-gradient(135deg,#1a1200,#2a1e00)', border:'rgba(255,202,40,.3)',  color:'var(--yel)', icon:'⚠️' },
    event:   { bg:'linear-gradient(135deg,#061a0a,#0a2212)', border:'rgba(0,230,118,.3)',   color:'var(--grn)', icon:'📅' },
  };
  var st = TYPE_STYLE[ad.type] || TYPE_STYLE.info;
  var icon = ad.typeIcon || st.icon;
  var ctaLink = _normalizeCtaLink(ad.ctaLink || ad.cta_link || '');
  var ctaText = ad.cta   || ad.cta_text || '';

  wrap.innerHTML =
    '<div style="' +
      'background:' + st.bg + ';' +
      'border:1px solid ' + st.border + ';' +
      'border-radius:12px;padding:12px 14px;' +
      'margin-bottom:12px;position:relative;overflow:hidden' +
    '">' +
      // Glow
      '<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 10% 50%,' + st.border + ' 0%,transparent 60%);pointer-events:none"></div>' +
      // Dismiss button
      '<button onclick="_dismissAdBanner(\'' + ad.id + '\')" style="' +
        'position:absolute;top:7px;right:8px;background:rgba(255,255,255,.07);' +
        'border:none;color:var(--t3);width:20px;height:20px;border-radius:50%;' +
        'font-size:11px;cursor:pointer;z-index:1;display:flex;align-items:center;justify-content:center' +
      '">✕</button>' +
      // Content
      '<div style="display:flex;gap:10px;align-items:center;position:relative">' +
        '<span style="font-size:22px;flex-shrink:0">' + icon + '</span>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">' +
            '<span style="font-size:9px;font-weight:800;padding:1px 7px;border-radius:6px;background:' + st.border + ';color:' + st.color + ';text-transform:uppercase;letter-spacing:.5px">' + (ad.typeLabel || ad.type || 'INFO') + '</span>' +
          '</div>' +
          '<div style="font-size:12px;font-weight:800;color:var(--t1);line-height:1.3">' + (ad.title || '') + '</div>' +
          (ad.body ? '<div style="font-size:11px;color:var(--t2);margin-top:2px;line-height:1.5">' + ad.body + '</div>' : '') +
        '</div>' +
        (ctaText ? '<button onclick="openCtaLink(\'' + ctaLink + '\')" style="' +
          'background:' + st.color + ';color:#000;border:none;border-radius:8px;' +
          'padding:8px 12px;font-weight:900;font-size:10px;cursor:pointer;' +
          'flex-shrink:0;white-space:nowrap">' + ctaText + '</button>' : '') +
      '</div>' +
      // Watermark offline
      (_fbOfflineMode ? '<div style="position:absolute;bottom:4px;right:10px;font-size:8px;color:var(--t3)">📢 Arblok Digital</div>' : '') +
    '</div>';
}

// ── Dismiss banner ────────────────────────────────────────────

function renderBroadcast() {
  if (_fbRole !== 'dev') {
    showNotif('🚫 Fitur ini hanya untuk Developer', 'err');
    switchPage('dashboard');
    return;
  }
  // Set initial active state untuk tombol target & type
  setTimeout(() => {
    document.querySelectorAll('.bc-tgt').forEach(b => {
      b.classList.toggle('on', b.getAttribute('data-t') === _bcState.target);
    });
    document.querySelectorAll('.bc-typ').forEach(b => {
      b.classList.toggle('on', b.getAttribute('data-y') === _bcState.type);
    });
  }, 50);
  renderBcHistory();
  updateBcPreview();
}


function setBcTarget(btn) {
  _bcState.target = btn.getAttribute('data-t');
  document.querySelectorAll('.bc-tgt').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  updateBcPreview();
}


function setBcType(btn) {
  _bcState.type = btn.getAttribute('data-y');
  document.querySelectorAll('.bc-typ').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  updateBcPreview();
}


function renderBcHistory() {
  const el = document.getElementById('bc-history-list');
  if (!el) return;
  const d = getD();
  const list = d.broadcasts || [];

  // Hitung iklan aktif (belum expired)
  const now = new Date().toISOString();
  const aktif = (_ADS_ACTIVE||[]).length;

  // Header info slot
  const slotInfo = `
    <div style="display:flex;align-items:center;justify-content:space-between;
      padding:10px 14px;background:var(--s2);border-radius:10px;margin-bottom:10px;gap:8px">
      <div>
        <div style="font-size:12px;font-weight:700;color:var(--t1)">
          📢 Slot Iklan Aktif: <span style="color:${aktif>0?'var(--grn)':'var(--t3)'};font-family:'Courier New',monospace">${aktif}</span>
          <span style="color:var(--t3);font-size:10px"> iklan di ticker</span>
        </div>
        <div style="font-size:10px;color:var(--t3);margin-top:2px">
          ∞ Tidak ada batas — semua iklan aktif tampil bergantian di ticker
        </div>
      </div>
      <button onclick="hapusSemua_BC()" style="
        background:var(--red-bg);color:var(--red);border:1px solid rgba(255,82,82,.3);
        border-radius:8px;padding:6px 12px;font-size:10px;font-weight:700;cursor:pointer;
        flex-shrink:0">🗑️ Hapus Semua</button>
    </div>`;

  if (!list.length) {
    el.innerHTML = slotInfo + '<div class="empty-state"><span class="empty-icon">📭</span><span class="empty-text">Belum ada broadcast dikirim</span></div>';
    return;
  }
  const tgtLabel = { all:'Semua', admin:'Admin', guru:'Guru', ortu:'Ortu', siswa:'Siswa' };
  el.innerHTML = slotInfo + list.slice(0,30).map(b => {
    const cfg = BC_TYPE_CFG[b.type] || BC_TYPE_CFG.info;
    const sentAtStr = b.sentAt
      ? (typeof b.sentAt === 'object' && b.sentAt.seconds
          ? new Date(b.sentAt.seconds*1000).toLocaleString('id-ID',{dateStyle:'short',timeStyle:'short'})
          : new Date(b.sentAt).toLocaleString('id-ID',{dateStyle:'short',timeStyle:'short'}))
      : '—';
    const isAktif = (_ADS_ACTIVE||[]).some(a => a.id === b.id);
    return `
      <div style="padding:10px 0;border-bottom:1px solid var(--bdr);display:flex;gap:10px;align-items:start">
        <div style="width:32px;height:32px;border-radius:8px;background:${cfg.bg};border:1px solid ${cfg.color};
          display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">${cfg.icon}</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span style="font-size:12px;font-weight:700;color:var(--t1)">${b.title}</span>
            ${isAktif ? '<span style="font-size:9px;padding:1px 6px;background:var(--grn-bg);color:var(--grn);border-radius:6px;font-weight:700">● LIVE</span>' : ''}
          </div>
          <div style="font-size:11px;color:var(--t3);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${b.body}</div>
          ${b.ctaLink ? `<div style="font-size:10px;color:var(--cyn);margin-top:2px">🔗 ${b.ctaLink}</div>` : ''}
          <div style="display:flex;gap:6px;margin-top:5px;flex-wrap:wrap;align-items:center">
            <span style="font-size:9px;padding:2px 7px;background:${cfg.bg};color:${cfg.color};border-radius:10px;font-weight:700">${cfg.label}</span>
            <span style="font-size:9px;padding:2px 7px;background:var(--pur-bg);color:var(--pur);border-radius:10px;font-weight:700">→ ${tgtLabel[b.target]||b.target}</span>
            <span style="font-size:9px;color:var(--t3)">${sentAtStr}</span>
          </div>
        </div>
        <button onclick="hapusIklan('${b.id}')" style="
          background:var(--red-bg);color:var(--red);border:1px solid rgba(255,82,82,.25);
          border-radius:7px;padding:5px 9px;font-size:11px;cursor:pointer;flex-shrink:0;
          font-weight:700" title="Hapus iklan ini">🗑️</button>
      </div>`;
  }).join('');
}

// Hapus 1 iklan dari Firestore + localStorage

Object.assign(globalThis, { openCtaLink, _renderAllAds, _renderAdsDashboardBanner, renderBroadcast, setBcTarget, setBcType, renderBcHistory });

export async function mount(container, modalsRoot) {
  return globalThis.mountPartial('broadcast', container, modalsRoot);
}
export { openCtaLink, _renderAllAds, _renderAdsDashboardBanner, renderBroadcast, setBcTarget, setBcType, renderBcHistory };
