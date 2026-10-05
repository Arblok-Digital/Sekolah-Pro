// js/modules/dashboard/route.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

import './logic.js';
import './pipeline.js';

function buildTicker() {
  // ══ TICKER = KHUSUS IKLAN SPONSOR ══
  // Data sekolah (saldo, gaji, dll) TIDAK masuk ticker
  // Ticker hanya menampilkan broadcast iklan dari dev
  const adsItems = _getAdsTickerItems();

  let items;
  if (adsItems.length > 0) {
    // Ada iklan — tampilkan semua iklan
    items = adsItems;
  } else {
    // Belum ada iklan — tampilkan placeholder branding
    items = [
      `<span class="tick-item"><span class="tick-ads-brand">⚡ SEKOLAH PRO</span> <span class="tick-ads-sep">·</span> <span class="tick-ads-text">Sistem Informasi Manajemen Sekolah Terpadu</span></span>`,
      `<span class="tick-item"><span class="tick-ads-brand">📢 IKLAN</span> <span class="tick-ads-text">Pasang iklan Anda di sini — hubungi Arblok Digital</span> <span class="tick-ads-cta" onclick="window.open('https://wa.me/6289508053795','_blank')">Hubungi »</span></span>`,
      `<span class="tick-item"><span class="tick-ads-brand">🏫 ARBLOK DIGITAL</span> <span class="tick-ads-sep">·</span> <span class="tick-ads-text">Digital Solutions for Education · 0895-0805-3795</span></span>`,
    ];
  }

  const html = items.join('');
  const ticker = document.getElementById('ticker-inner');
  if (ticker) ticker.innerHTML = html + html;
}

// ── PAGE ROUTING ──

function renderDashboard() {
  const d = getD();
  const namaSekolah = d.profil_sekolah.nama || 'SD Islam Sahara';

  // Sync all school name locations
  ['banner-school-name','banner-nama-besar','sidebar-school-name'].forEach(id => {
    const el = document.getElementById(id); if (el) el.textContent = namaSekolah;
  });

  // Tanggal hari ini di banner
  const tglEl = document.getElementById('banner-tanggal');
  if (tglEl) tglEl.textContent = new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

  // Tahun ajaran (setting)
  const taEl = document.getElementById('banner-ta');
  if (taEl) taEl.textContent = 'T.A. ' + (d.profil_sekolah.tahun_ajaran || new Date().getFullYear() + '/' + (new Date().getFullYear()+1));

  document.getElementById('saldo-display').textContent = fmt(d.profil_sekolah.saldo_utama);
  document.getElementById('stat-siswa').textContent = d.data_siswa.length;
  const lunas = d.data_siswa.filter(s => s.status_spp === 'Lunas').length;
  const tunggak = d.data_siswa.filter(s => s.status_spp === 'Tunggakan').length;
  document.getElementById('stat-lunas').textContent = lunas;
  document.getElementById('stat-tunggak').textContent = tunggak;

  // Infak hari ini
  const today = new Date().toDateString();
  const infakHariIni = d.infak_harian
    .filter(i => new Date(i.tanggal).toDateString() === today)
    .reduce((a, i) => a + i.jumlah, 0);
  document.getElementById('stat-infak-today').textContent = fmtShort(infakHariIni);

  // BOS
  const pct = d.dana_bos.pagu_tahunan > 0
    ? Math.round((d.dana_bos.terpakai / d.dana_bos.pagu_tahunan)*100) : 0;
  document.getElementById('bos-bar').style.width = Math.min(pct,100) + '%';
  document.getElementById('bos-pct-badge').textContent = pct + '%';
  document.getElementById('bos-pct-badge').className = 'bdg ' + (pct > 80 ? 'bdg-r' : pct > 50 ? 'bdg-am' : 'bdg-g');
  document.getElementById('bos-terpakai-d').textContent = fmtShort(d.dana_bos.terpakai);
  document.getElementById('bos-sisa-d').textContent = fmtShort(d.dana_bos.sisa_anggaran);

  // ── REMINDER PANEL ──
  const reminders = buildReminders();
  const rPanel = document.getElementById('reminder-panel');
  const rList = document.getElementById('reminder-list');
  if (reminders.length > 0) {
    rPanel.style.display = 'block';
    rList.innerHTML = reminders.slice(0,5).map(r => `
      <div class="reminder-item">
        <div class="reminder-dot" style="background:${r.color}"></div>
        <div class="reminder-info">
          <div class="reminder-title">${r.title}</div>
          <div class="reminder-sub">${r.sub}</div>
        </div>
        ${r.action ? `<button class="abtn" style="padding:5px 10px;font-size:10px;background:${r.color}15;color:${r.color};border:1px solid ${r.color}44;flex-shrink:0" onclick="${r.action}">${r.actionLabel}</button>` : ''}
      </div>`).join('');
  } else {
    rPanel.style.display = 'none';
  }

  // Aktivitas
  const acts = d.riwayat_aktivitas || [];
  const el = document.getElementById('aktivitas-list');
  if (!acts.length) {
    el.innerHTML = '<div class="empty-state"><span class="empty-icon">📭</span><span class="empty-text">Belum ada aktivitas</span></div>';
    return;
  }
  const recent = acts.slice(-10).reverse();
  el.innerHTML = '<div class="timeline">' + recent.map(a => {
    const colorMap = {spp:'var(--grn)',infak:'var(--yel)',gaji:'var(--pur)',bos:'var(--amb)',siswa:'var(--blu)',guru:'var(--cyn)'};
    const iconMap = {spp:'💳',infak:'🙏',gaji:'💸',bos:'🏦',siswa:'👤',guru:'👨‍🏫'};
    const color = colorMap[a.tipe] || 'var(--t2)';
    const icon = iconMap[a.tipe] || '📝';
    const hasKwitansi = a.tipe === 'spp' && a.ref_id;
    return `<div class="tl-item" style="cursor:${hasKwitansi?'pointer':'default'};border-radius:9px;transition:background .12s"
      ${hasKwitansi ? `onclick="generateKwitansi('${a.ref_id}')" onmouseover="this.style.background='rgba(255,255,255,.03)'" onmouseout="this.style.background=''"` : ''}>
      <div class="tl-dot" style="background:${color}22;border:1.5px solid ${color}">${icon}</div>
      <div class="tl-content">
        <div class="tl-title">${a.keterangan}</div>
        <div class="tl-sub">${new Date(a.waktu).toLocaleString('id-ID',{dateStyle:'short',timeStyle:'short'})}</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <div class="tl-amt" style="color:${a.nominal > 0 ? 'var(--grn)' : 'var(--red)'}">${a.nominal !== 0 ? (a.nominal > 0 ? '+' : '') + fmtShort(a.nominal) : ''}</div>
        ${hasKwitansi ? `<span style="font-size:11px;color:var(--cyn);opacity:.6" title="Klik untuk kwitansi">🧾</span>` : ''}
      </div>
    </div>`;
  }).join('') + '</div>';
}

// ── SPP ──
// ══════════════════════════════════════════════════
//  KEUANGAN SISWA MODULE
//  SPP + Bangunan + Buku + Seragam + Akhir Tahun
//  + Pentas Seni + Rihlah / Field Trip
//  Copyright © 2026 Arblok Digital
// ══════════════════════════════════════════════════


function _showTunggakanModal(arr) {
  // Pakai modal edit siswa sebagai container darurat
  const existing = document.getElementById('modal-tunggakan-dash');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'modal-tunggakan-dash';
  modal.className = 'modal-bg open';
  modal.onclick = e => { if(e.target===modal) modal.remove(); };
  modal.innerHTML = `
    <div class="sheet" style="max-width:480px">
      <div class="mhdr">
        <h2>⚠️ Siswa Tunggakan (${arr.length})</h2>
        <button class="mclose" onclick="document.getElementById('modal-tunggakan-dash').remove()">✕</button>
      </div>
      <div style="padding:12px 16px;max-height:65vh;overflow-y:auto;display:flex;flex-direction:column;gap:6px">
        ${arr.map(s => `
          <div style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:var(--s2);border:1px solid rgba(255,82,82,.2);border-radius:9px">
            <div style="width:32px;height:32px;border-radius:50%;background:var(--red-bg);border:1px solid rgba(255,82,82,.25);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:var(--red);flex-shrink:0">
              ${s.nama.charAt(0).toUpperCase()}
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:700;color:var(--t1)">${s.nama}</div>
              <div style="font-size:10px;color:var(--t3)">Kelas ${s.kelas||'—'}</div>
            </div>
            <span style="font-size:9px;padding:2px 8px;border-radius:8px;background:var(--red-bg);color:var(--red);font-weight:700;border:1px solid rgba(255,82,82,.2)">Tunggakan</span>
          </div>`).join('')}
      </div>
      <div style="padding:12px 16px;border-top:1px solid var(--bdr);display:flex;gap:8px">
        <button class="abtn" style="flex:1" onclick="document.getElementById('modal-tunggakan-dash').remove()">Tutup</button>
        <button class="abtn abtn-g" style="flex:1" onclick="document.getElementById('modal-tunggakan-dash').remove();switchPage('spp')">Lihat SPP →</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

// ── MODAL UTILS ──

function _showDashFilterBadge(type) {
  const existing = document.getElementById('dash-filter-badge');
  if (existing) existing.remove();

  const labels = {
    siswa: { icon:'📚', text:'Semua Siswa', color:'var(--cyn)' },
    lunas: { icon:'✅', text:'SPP Lunas',   color:'var(--grn)' },
    tunggak:{ icon:'⚠️', text:'Tunggakan', color:'var(--red)' },
    txn:   { icon:'💳', text:'Transaksi Terbaru', color:'var(--yel)' },
  };
  const cfg = labels[type] || labels.siswa;

  const badge = document.createElement('div');
  badge.id = 'dash-filter-badge';
  badge.style.cssText = `
    display:flex;align-items:center;justify-content:space-between;
    background:var(--s2);border:1px solid ${cfg.color}44;border-radius:9px;
    padding:8px 12px;margin-bottom:8px;
  `;
  badge.innerHTML = `
    <span style="font-size:12px;font-weight:700;color:${cfg.color}">${cfg.icon} Filter aktif: ${cfg.text}</span>
    <button onclick="clearDashFilter()" style="padding:3px 9px;border-radius:6px;background:var(--red-bg);border:1px solid rgba(255,82,82,.2);color:var(--red);font-size:10px;font-weight:700;cursor:pointer">✕ Reset</button>
  `;

  const actCard = document.getElementById('aktivitas-list')?.closest('.card');
  if (actCard) actCard.insertAdjacentElement('beforebegin', badge);
}


function _renderFilteredActivity(type) {
  const d      = getD();
  const el     = document.getElementById('aktivitas-list');
  if (!el) return;

  const siswa  = _filterBySchool(d.data_siswa || []);
  const acts   = _filterBySchool(d.riwayat_aktivitas || []);
  const txns   = _filterBySchool(d.riwayat_spp || []);

  let filtered = acts;
  let headerTxt = 'Aktivitas Terbaru';

  if (type === 'lunas') {
    const lunasIds = new Set(siswa.filter(s => s.status_spp === 'Lunas').map(s => s.id));
    filtered = acts.filter(a => a.tipe === 'spp' && txns.find(t => t.id === a.ref_id && lunasIds.has(t.siswa_id)));
    headerTxt = `✅ Transaksi Siswa Lunas (${filtered.length})`;
  } else if (type === 'tunggak') {
    const tunggakIds = new Set(siswa.filter(s => s.status_spp === 'Tunggakan').map(s => s.id));
    // Tampilkan daftar siswa tunggak
    const tunggakList = siswa.filter(s => s.status_spp === 'Tunggakan');
    const colorMap = {spp:'var(--grn)',infak:'var(--yel)',gaji:'var(--pur)',bos:'var(--amb)',siswa:'var(--blu)',guru:'var(--cyn)'};
    el.innerHTML = `
      <div style="margin-bottom:8px;font-size:11px;color:var(--red);font-weight:700">⚠️ ${tunggakList.length} siswa belum lunas SPP</div>
      ${tunggakList.length ? tunggakList.map(s => `
        <div style="display:flex;align-items:center;gap:10px;padding:9px 4px;border-bottom:1px solid var(--bdr2)">
          <div style="width:32px;height:32px;border-radius:50%;background:var(--red-bg);border:1.5px solid var(--red);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:var(--red);flex-shrink:0">
            ${(s.nama||'?').charAt(0).toUpperCase()}
          </div>
          <div style="flex:1">
            <div style="font-size:12px;font-weight:600">${s.nama}</div>
            <div style="font-size:10px;color:var(--t3)">Kelas ${s.kelas||'—'}</div>
          </div>
          <span style="font-size:9px;padding:2px 8px;border-radius:10px;background:var(--red-bg);color:var(--red);border:1px solid rgba(255,82,82,.2);font-weight:700">Tunggakan</span>
        </div>`).join('') : '<div class="empty-state"><span class="empty-icon">✅</span><span class="empty-text">Semua siswa lunas</span></div>'}`;
    return;
  } else if (type === 'txn') {
    // Tampilkan riwayat SPP terbaru
    const recent = txns.slice(-8).reverse();
    el.innerHTML = recent.length ? `
      <div style="margin-bottom:8px;font-size:11px;color:var(--yel);font-weight:700">💳 ${recent.length} transaksi terakhir</div>
      ${recent.map(t => `
        <div class="tl-item" onclick="generateKwitansi('${t.id}')" style="cursor:pointer" title="Klik untuk kwitansi">
          <div class="tl-dot" style="background:var(--grn-bg);border:1.5px solid var(--grn)">💳</div>
          <div class="tl-content">
            <div class="tl-title">${t.nama} — ${t.jenis}</div>
            <div class="tl-sub">${t.metode||'Tunai'} · ${new Date(t.waktu).toLocaleDateString('id-ID',{dateStyle:'short'})}</div>
          </div>
          <div class="tl-amt" style="color:var(--grn)">+${fmt(t.jumlah)}</div>
          <div style="font-size:11px;color:var(--cyn);margin-left:4px;opacity:.7">🧾</div>
        </div>`).join('')}` :
      '<div class="empty-state"><span class="empty-icon">📭</span><span class="empty-text">Belum ada transaksi</span></div>';
    return;
  } else if (type === 'siswa') {
    // Tampilkan daftar siswa
    el.innerHTML = `
      <div style="margin-bottom:8px;font-size:11px;color:var(--cyn);font-weight:700">📚 ${siswa.length} siswa terdaftar</div>
      ${siswa.slice(0,10).map(s => `
        <div style="display:flex;align-items:center;gap:10px;padding:9px 4px;border-bottom:1px solid var(--bdr2)">
          <div style="width:32px;height:32px;border-radius:50%;background:var(--cyn-bg);border:1.5px solid var(--cyn);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:var(--cyn);flex-shrink:0">
            ${(s.nama||'?').charAt(0).toUpperCase()}
          </div>
          <div style="flex:1">
            <div style="font-size:12px;font-weight:600">${s.nama}</div>
            <div style="font-size:10px;color:var(--t3)">Kelas ${s.kelas||'—'} · NISN: ${s.nisn||'—'}</div>
          </div>
          <span style="font-size:9px;padding:2px 8px;border-radius:10px;font-weight:700;${s.status_spp==='Lunas'?'background:var(--grn-bg);color:var(--grn);border:1px solid rgba(0,230,118,.2)':'background:var(--red-bg);color:var(--red);border:1px solid rgba(255,82,82,.2)'}">
            ${s.status_spp||'—'}
          </span>
        </div>`).join('')}
      ${siswa.length > 10 ? `<div style="text-align:center;padding:8px;font-size:10px;color:var(--t3)">...dan ${siswa.length-10} siswa lainnya</div>` : ''}`;
    return;
  }

  // Default: render aktivitas dengan kwitansi link
  _renderAktivitasWithKwitansi(filtered.slice(-10).reverse());
}


Object.assign(globalThis, { buildTicker, renderDashboard, _showTunggakanModal, _showDashFilterBadge, _renderFilteredActivity });

export async function mount(container, modalsRoot) {
  return globalThis.mountPartial('dashboard', container, modalsRoot);
}
export { buildTicker, renderDashboard, _showTunggakanModal, _showDashFilterBadge, _renderFilteredActivity };
