// js/modules/inventaris/route.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

import './logic.js';
import './pipeline.js';

function setInvFilter(val, btn) {
  invFilter = val;
  document.querySelectorAll('#inventaris-page .fchip').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  renderInventaris();
}


function renderInventaris() {
  if (isOfflineMode()) { requireOnline('Inventaris Aset'); return; }
  const d = getInvDB();
  const list = d.inventaris.filter(a => invFilter === 'all' || a.kategori === invFilter);
  const total = d.inventaris.length;
  const baik = d.inventaris.filter(a => a.kondisi === 'baik').length;
  const rusak = d.inventaris.filter(a => a.kondisi === 'rusak-ringan' || a.kondisi === 'rusak-berat').length;
  const nilaiTotal = d.inventaris.reduce((s, a) => s + ((a.nilai || 0) * (a.jumlah || 1)), 0);

  document.getElementById('inv-stat-total').textContent = total;
  document.getElementById('inv-stat-baik').textContent = baik;
  document.getElementById('inv-stat-rusak').textContent = rusak;
  document.getElementById('inv-stat-nilai').textContent = fmtShort(nilaiTotal);

  const el = document.getElementById('inv-aset-list');
  if (!list.length) {
    el.innerHTML = '<div class="empty-state"><span class="empty-icon">📦</span><span class="empty-text">' + (total === 0 ? 'Belum ada data aset' : 'Tidak ada aset dalam kategori ini') + '</span></div>';
    return;
  }
  el.innerHTML = '<div style="display:flex;flex-direction:column;gap:8px;padding:0 12px 12px">' +
    list.map(a => `<div class="aset-card" onclick="openAsetDetail('${a.id}')">
      <div class="aset-icon" style="background:${a.kondisi==='baik'?'var(--grn-bg)':a.kondisi==='rusak-berat'?'var(--red-bg)':a.kondisi==='hilang'?'rgba(255,255,255,.04)':'var(--yel-bg)'}">${ASET_ICONS[a.kategori] || '📌'}</div>
      <div class="aset-info">
        <div class="aset-nama">${a.nama}</div>
        <div class="aset-meta">
          <span>${a.kategori}</span>
          ${a.lokasi ? `<span>📍 ${a.lokasi}</span>` : ''}
          ${a.no_inventaris ? `<span style="font-family:'Courier New',monospace">#${a.no_inventaris}</span>` : ''}
          <span>Qty: ${a.jumlah || 1}</span>
        </div>
        <span class="aset-kondisi ${KONDISI_CLASSES[a.kondisi] || 'aset-baik'}">${KONDISI_LABELS[a.kondisi] || 'Baik'}</span>
        ${a.nilai ? `<div class="aset-nilai">${fmt(a.nilai * (a.jumlah||1))}</div>` : ''}
      </div>
      <div style="font-size:18px;color:var(--t3)">›</div>
    </div>`).join('') + '</div>';
}


function openAsetDetail(asetId) {
  activeAsetId = asetId;
  const d = getInvDB();
  const a = d.inventaris.find(x => x.id === asetId);
  if (!a) return;
  document.getElementById('aset-detail-title').textContent = a.nama;
  const nilaiTotal = (a.nilai || 0) * (a.jumlah || 1);
  const rows = [
    ['Kategori', a.kategori], ['Jumlah', a.jumlah || 1], ['Kondisi', KONDISI_LABELS[a.kondisi] || '—'],
    ['Lokasi', a.lokasi || '—'], ['No. Inventaris', a.no_inventaris || '—'],
    ['Tahun Perolehan', a.tahun || '—'], ['Nilai Satuan', fmt(a.nilai || 0)],
    ['Nilai Total', fmt(nilaiTotal)], ['Keterangan', a.keterangan || '—'],
  ];
  document.getElementById('aset-detail-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
      <div style="width:52px;height:52px;border-radius:12px;background:var(--s2);display:flex;align-items:center;justify-content:center;font-size:26px">${ASET_ICONS[a.kategori]||'📌'}</div>
      <div><div style="font-size:16px;font-weight:900">${a.nama}</div><span class="aset-kondisi ${KONDISI_CLASSES[a.kondisi]||'aset-baik'}">${KONDISI_LABELS[a.kondisi]||'Baik'}</span></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:0">${rows.map(([l,v])=>`<div style="display:flex;padding:9px 0;border-bottom:1px solid var(--bdr);gap:10px">
      <span style="font-size:11px;color:var(--t3);min-width:130px;flex-shrink:0">${l}</span>
      <span style="font-size:12px;font-weight:600;flex:1">${v}</span>
    </div>`).join('')}</div>
    ${a.riwayat_kondisi.length ? `<div style="margin-top:10px"><div style="font-size:11px;font-weight:700;color:var(--t3);margin-bottom:6px;text-transform:uppercase">Riwayat Kondisi</div>${a.riwayat_kondisi.slice(-5).reverse().map(r=>`<div style="font-size:11px;color:var(--t2);padding:5px 0;border-bottom:1px solid var(--bdr)">${new Date(r.waktu).toLocaleDateString('id-ID')} — <b>${KONDISI_LABELS[r.kondisi]||r.kondisi}</b> — ${r.catatan||''}</div>`).join('')}</div>` : ''}`;
  openModal('modal-aset-detail');
}


Object.assign(globalThis, { setInvFilter, renderInventaris, openAsetDetail });

export async function mount(container, modalsRoot) {
  return globalThis.mountPartial('inventaris', container, modalsRoot);
}
export { setInvFilter, renderInventaris, openAsetDetail };
