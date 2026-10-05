// js/modules/dashboard/pipeline.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

function _renderAktivitasWithKwitansi(acts) {
  const el = document.getElementById('aktivitas-list');
  if (!el) return;
  if (!acts || !acts.length) {
    el.innerHTML = '<div class="empty-state"><span class="empty-icon">📭</span><span class="empty-text">Belum ada aktivitas</span></div>';
    return;
  }
  const d = getD();
  const txns = d.riwayat_spp || [];
  const colorMap = {spp:'var(--grn)',infak:'var(--yel)',gaji:'var(--pur)',bos:'var(--amb)',siswa:'var(--blu)',guru:'var(--cyn)'};
  const iconMap  = {spp:'💳',infak:'🙏',gaji:'💸',bos:'🏦',siswa:'👤',guru:'👨‍🏫'};

  el.innerHTML = '<div class="timeline">' + acts.map(a => {
    const c    = colorMap[a.tipe] || 'var(--t2)';
    const icon = iconMap[a.tipe]  || '📝';
    const hasKw = !!a.ref_id && txns.some(t => t.id === a.ref_id);
    const clickHandler = hasKw
      ? `generateKwitansi('${a.ref_id}')`
      : `showNotif('Tidak ada kwitansi untuk aktivitas ini','warn')`;
    return `<div class="tl-item" onclick="${clickHandler}" style="cursor:pointer" title="${hasKw ? 'Klik untuk lihat kwitansi':''}">
      <div class="tl-dot" style="background:${c}22;border:1.5px solid ${c}">${icon}</div>
      <div class="tl-content">
        <div class="tl-title">${a.keterangan}</div>
        <div class="tl-sub">${new Date(a.waktu).toLocaleString('id-ID',{dateStyle:'short',timeStyle:'short'})}</div>
      </div>
      <div class="tl-amt" style="color:${a.nominal > 0 ? 'var(--grn)' : 'var(--red)'}">${a.nominal !== 0 ? (a.nominal > 0 ? '+' : '') + fmtShort(a.nominal) : ''}</div>
      ${hasKw ? '<span style="font-size:11px;color:var(--cyn);margin-left:2px;opacity:.65">🧾</span>' : ''}
    </div>`;
  }).join('') + '</div>';
}

// ════════════════════════════════════════════════════════════════════
//  BROADCAST IKLAN — DEV ONLY
//  Halaman khusus untuk mengirim broadcast ke pengguna SekolahPro
//  via Firestore + WhatsApp. Hanya role 'dev' yang bisa akses.
// ════════════════════════════════════════════════════════════════════


Object.assign(globalThis, { _renderAktivitasWithKwitansi });
export { _renderAktivitasWithKwitansi };
