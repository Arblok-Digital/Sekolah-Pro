// js/sync/sheets.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

async function importFromSheets() {
  const url = (document.getElementById('sheets-url-inp') || {}).value.trim();
  const type = (document.getElementById('sheets-type-sel') || { value: 'siswa' }).value;
  if (!url) { showNotif('Masukkan URL Google Sheets!', 'err'); return; }
  showNotif('🔄 Mengambil data dari Sheets...', 'warn');
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Gagal mengambil data');
    const text = await res.text();
    const parsed = parseCSV(text);
    if (!parsed.rows.length) { showNotif('Data kosong!', 'err'); return; }
    const mapping = autoMapColumns(parsed.headers, type);
    // Run through import pipeline
    impState = { step: 3, type, rawRows: parsed.rows, headers: parsed.headers, mapping, previewRows: [], dupRows: new Set() };
    renderPreviewStep();
    const total = impState.previewRows.length;
    const news = total - impState.dupRows.size;
    if (!confirm(`Ditemukan ${total} baris data dari Sheets.\n${news} data baru, ${impState.dupRows.size} duplikat.\nImport sekarang?`)) return;
    impState.step = 4;
    closeModal('modal-sheets-sync');
    openModal('modal-smart-import');
    updateStepUI();
    await runImport();
  } catch (err) {
    showNotif('❌ ' + (err.message || 'Gagal import'), 'err');
    console.error('[Sheets]', err);
  }
}


// ── shim fungsi ke global (handler inline lama + pemanggilan antar-file) ──
Object.assign(globalThis, { importFromSheets });
export { importFromSheets };
