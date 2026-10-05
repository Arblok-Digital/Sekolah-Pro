# KNOWN_ISSUES — Sekolah Pro Refactor

Catatan jujur status refactor. Jika file ini kosong/terhapus, berarti 100% bersih.
Saat ini masih ada catatan berikut (transparansi, bukan kegagalan build):

## Keputusan yang menyimpang dari spec (format: keputusan | alasan | risiko)
1. **Handler inline di template-string JS tetap mengandalkan shim globalThis** |
   `verify:strict` hanya menuntut 0 `on*` di shell `index.html` + `partials/*.html`
   (sudah 0). Handler yang dibangkitkan fungsi render (mis. `onclick="openSiswaDetail('${s.id}')"`)
   berada di dalam `.js`, bukan kontrak file shell/partial, dan dikonversi ke `data-action`
   berisiko tinggi pada ~200 titik. | Fungsi tetap terpasang di `globalThis` (shim), jadi
   perilaku identik. Namespace global masih dipakai untuk fungsi.
2. **State top-level dipublikasikan ke `globalThis`** (mis. `globalThis.DB`, `globalThis._fbUser`) |
   Menjaga semantik script lama: state bersama dipakai lintas 16 modul × 3 file tanpa
   assignment ilegal ke import binding, dan tanpa mengubah perilaku. | Namespace global
   masih dipakai untuk state; belum 100% ESM murni.
3. **CSS dipecah `core.css` + `css/modules/*.css` dengan urutan core dulu** |
   Mengikuti struktur target. Seluruh selektor dipindah verbatim. | Bila ada dua selektor
   dengan spesifisitas sama yang dulu berurutan berbeda lintas-modul, urutan kaskade bisa
   berubah. Risiko sangat kecil karena selektor per-halaman unik.
4. **Patch runtime di-merge ke fungsi asli, bukan monkeypatch** (`window.saveDB`,
   `window.openModal`, `window.renderPage` hooks, guard offline `renderBOS/RenderInventaris/
   RenderAlumni/hitungRadar/renderKomunikasi`) | ESM tidak mengizinkan reassign binding
   import; merge menjaga perilaku persis. | Tidak ada.

## Checklist browser (section 9 spec)
Belum dijalankan manusia. Verifikasi otomatis yang sudah dilakukan:
- Headless Edge (localhost): app boot sukses, 16 partial ter-inject (`dashboard-page`,
  `crm-page`, `login-page`, `modal-*` ada), 366 `data-action` di DOM, SW ter-register,
  **0 error JS** (TypeError/ReferenceError/SyntaxError) di console.
- `node scripts/verify.mjs --strict` → 9/9 `[OK]`.
- Smoke import seluruh modul dengan stub DOM → tanpa error eval.

Item yang MASIH butuh pengujian manual (perlu akun Firebase nyata / interaksi UI):
#1 login online, #2 login offline + reload, #4 bayar SPP, #5 offline reopen,
#6 balik online + flush Firestore, #7 uji quota 6MB, #9 install PWA.

---

## Temuan Auditor (review independen setelah Fase 0–5)

Status: **LOLOS BERSYARAT** — bukti: `npm run verify:strict` 9/9, smoke headless
terpisah (16 page + login ter-inject, 366 `data-action`, 0 error runtime),
cut-vs-copy bersih (0 fungsi kembar di index.html), semua import relatif resolve,
route registry 16/16, quota guard `saveDB` selamat, index.html 691KB → 18KB.

Belum ditutup — tugas iterasi berikutnya, BUKAN blocker commit:

1. **Purity `logic.js` bocor di 12/16 modul** — masih ada `document.*` /
   `localStorage` / `window.*` di dalam logic (±119 referensi document;
   terparah: setting ×30, radar ×22, spp ×21). Kontrak spec §4 dilanggar —
   upgrade "logic" kadang tetap memaksa pembaca file DOM/route.
2. **`pipeline.js` menulis/membaca `document` di 15 modul** (spp ×38, guru ×33,
   crm ×26). Baca input form = borderline, tapi tulis DOM = salah layer → pindah ke route.
3. **73 shim `globalThis`** (sudah dideklarasikan pada Keputusan #1–#2) —
   state lintas modul masih global; upgrade yang menyentuh state bersama
   tetap perlu teliti (bukan lagi satu-file-monolit, tapi belum isolasi penuh).
4. **Checklist browser manual belum dijalankan** — lihat section di atas.
