# SEKOLAH PRO — SPEC REFAKTOR MODULAR
### Dokumen kerja WAJIB untuk agent. Baca habis sebelum menyentuh file apapun.

> **ANTI-HALUSINASI — baca dulu:**
> Dokumen ini dibuat karena agent sebelumnya **mengklaim** "modul berisi chunk asli (bukan stub)"
> padahal kenyataannya export-nya `function loadDB() {}` (kosong) + kode di-comment.
> **Klaim tanpa bukti = tidak valid.** Satu-satunya bukti yang diterima:
> 1. Output lengkap `npm run verify:strict` berstatus semua `[OK]`
> 2. Checklist browser (section 9) terisi jujur
> 3. Diff git yang menunjukkan kode **DIPINDAH** (ada di file baru, HILANG dari file lama)
> Jika verifikasi gagal sebagian → tulis jujur di `KNOWN_ISSUES.md`, JANGAN di-skip diam-diam.

---

## 1. Kondisi awal (fakta — jangan diklaim lain)

| Fakta | Detail |
|---|---|
| `index.html` | ~691KB: `<style>` besar + HTML semua halaman/modal + ±8700 baris JS inline dalam SATU file |
| `modules/*.js` (10 file) | **STUB**: `export function x() {}` + kode asli hanya di-comment ("RETRIEVED CONTENT") |
| `index.html` block module | Dynamic import scaffold (aman, jangan dihapus — ganti dengan boot beneran) |
| `app.js` (237KB) | **Kode mati** — tidak direferensikan. Sumber referensi migrasi |
| `firebase-auth.js` | Tidak direferensikan manapun |
| `sw.js` | Jalan: cache-first shell, network-first fallback, CDN di-cache |
| Data | localStorage key **`sekolah_pro_db`** (blob JSON) + `_fbSyncQueue` debounce 2s → flush kalau online |
| Route | `switchPage(name)` + RBAC `_FB_ROLE_PAGES` (16 halaman + role `offline`) |
| Handler | 169 inline `onclick="fn()"` — SEMUA terdefinisi |

---

## 2. Keputusan arsitektur (tetap, jangan diganti kecuali catat di section 11)

1. **Vanilla JS + ES Modules, ZERO build.** Tidak ada webpack/vite/babel/react. Cukup `node scripts/verify.mjs`.
2. **Diserve via HTTP** (localhost / hosting). `file://` = mode degradasi (banner warning sudah ada di login).
3. **Skema data TIDAK BERUBAH**: key `sekolah_pro_db`, bentuk `DEFAULT_DATA` sama persis — user lama tidak boleh kehilangan data.
4. **Firebase SDK tetap compat 10.14.1 via CDN** di index.html (jangan upgrade, jangan ganti modul).
5. **CSS dipindah TAPI selektor tidak boleh diubah** — UI harus identik 100%.
6. **Semua sintaks JS baru = ESM** (`import`/`export`), file klasik lama = sumber dipindah (cut), bukan ditulis ulang dari ingatan.
7. **Setiap halaman/modul = 4 file terpisah** (css, html, dan 3 js) — detail section 4.

---

## 3. Struktur target (final)

```
sekolah-pro/
├── index.html                 ← SHELL tipis (< 40KB): head, CDN, <main id="app">, <script type="module" src="js/app.js">
├── sw.js                      ← precache semua css/js/partial (generate via npm run build:sw)
├── manifest.json, icon-*.png  ← tidak diubah
├── package.json               ← sudah ada (type: module + script verify)
├── KNOWN_ISSUES.md            ← buat kalau ada yang tertinggal (jangan kosong kalau belum 100%)
│
├── css/
│   ├── core.css               ← :root tokens, reset, layout shell, nav, tombol, badge, modal-primitif
│   └── modules/
│       ├── dashboard.css … 1 file per modul (16) + login.css
│
├── partials/
│   ├── login.html
│   └── <modul>.html …         ← HTML halaman + modal milik modul itu (id/class DIPERTAHANKAN persis)
│
├── js/
│   ├── app.js                 ← BOOT saja (< 150 baris): import core → init auth → init router → register SW → init events
│   ├── core/
│   │   ├── config.js          ← JENJANG_CFG, ROLE_PAGES, HOME_PAGE, konstanta global, versi
│   │   ├── db.js              ← DEFAULT_DATA, loadDB, saveDB (dgn try/catch quota), getD, mutasi penyimpanan
│   │   ├── router.js          ← ROUTE_REGISTRY (16 dynamic import), switchPage + RBAC gate + mount partial
│   │   ├── auth.js            ← firebase init, onAuthState, masukOfflineMode, session, halaman login
│   │   ├── events.js          ← DELEGASI data-action (pengganti 169 onclick) + window-shim transisi
│   │   └── utils.js           ← fmt, fmtShort, generator id, tanggal, helper DOM (el/h)
│   ├── sync/
│   │   ├── queue.js           ← _fbSyncQueue, debounce, _fbFlushQueue (nikahin sama core/db.js)
│   │   ├── firestore.js       ← pull/push schools, staff, broadcasts, profile
│   │   ├── sheets.js          ← sync Google Sheets CSV
│   │   └── status.js          ← badge/sync-dot/banner status
│   └── modules/
│       └── <modul>/           ← 16 folder: dashboard, crm, kelas, spp, guru, bos, akademik,
│           ├── route.js           jadwal, kalender, komunikasi, inventaris, alumni, laporan,
│           ├── logic.js           radar, setting, broadcast
│           └── pipeline.js
│
├── archive/                   ← app.js, app.js-pre-split-backup, firebase-auth.js (dipindah, jangan dihapus)
└── scripts/
    ├── verify.mjs             ← SUDAH ADA — jangan diubah selain nambah check
    └── gen-precache.mjs       ← BUAT: scan css/js/partials → tulis PRECACHE_URLS di sw.js
```

**Total file wajib: 16 modul × 4 (partial + css + route/logic/pipeline) + 17 core/sync/app + 2 script.**
`npm run verify` menghitung semuanya — tidak ada alasan "lupa".

---

## 4. Kontrak per file (INI YANG DIPERIKSA AUDITOR)

### `css/modules/<m>.css`
- Hanya style milik halaman/modal modul itu. Selektor **persis** seperti aslinya (copy-paste, jangan rename class).
- Yang boleh di `core.css`: variabel `:root`, reset, layout, nav, tombol, badge, primitif modal — dipakai ≥ 2 tempat.

### `partials/<m>.html`
- Hapus semua `onclick="..."` / `onchange` dll → ganti `data-action="namaAksi"` + `data-*` payload (id dsb).
- `id` dan `class` elemen **TIDAK BOLEH BERUBAH** (CSS/JS lama mengandalkan itu).
- Isi = subtree halaman (`<div class="page" id="<m>-page">…`) + modal milik modul.

### `js/modules/<m>/route.js`
- Export: `export async function mount(container)` (dan `unmount()` kalau perlu).
- Tugas: fetch `partials/<m>.html` → inject → wire event lewat `core/events.js` → panggil pipeline untuk data awal → render.
- **HARUS ringan.** Kalau file > ~400 baris, pindahkan yang murni ke logic/pipeline.

### `js/modules/<m>/logic.js`
- **Murni**: hitung, format, validasi, derive state (contoh: `hitungSisaTagihan(pembayaran)`).
- **HARAM**: akses `document`, `localStorage`, `fetch`, `firebase`. (Boleh terima data, balikkan hasil.)
- Export fungsi yang dipakai route/pipeline modul ini — export kosong = GAGAL (dicek `verify`).

### `js/modules/<m>/pipeline.js`
- **Alur data modul**: baca dari `core/db` → transform (panggil logic) → tulis via `saveDB()` → status sync.
- Contoh spp: `bayarSPP(id, nominal)` → validasi → mutasi riwayat → `saveDB()` → queue sync → signal render.
- Satu fungsi satu alur — jangan bikkan "service raksasa".

### `js/core/events.js`
- Satu dispatcher: `document.addEventListener('click', …)` baca `e.target.closest('[data-action]')` → lookup handler.
- Modul daftarkan handler via `registerActions({ 'spp.bayar': fn, … })`.
- Selama transisi boleh isi `window.<fnLama>` sebagai shim — **shim wajib dihapus di Fase 5** saat onclick = 0.

---

## 5. Aturan migrasi (Fase — commit KEcil per fase)

**Aturan emas:**
- **PINDAHKAN (cut), jangan salin.** Bukti: di commit yang sama, fungsi hilang dari file lama DAN muncul di file baru. Duplikat = GAGAL audit.
- **Jangan ubah perilaku**: RBAC, offline mode, alur sync, tampilan — sama persis. Ini refactor, bukan redesign.
- Jangan sentuh: `manifest.json`, icon, isi `DEFAULT_DATA`, konfigurasi Firebase, versi CDN.
- Commit message rapi: `fase-2: ekstrak core js (db/router/auth)` — JANGAN `Add files via upload`.

| Fase | Isi | Keluaran |
|---|---|---|
| **0** | Fondasi: `package.json` ✓, `scripts/verify.mjs` ✓ (sudah ada), `mkdir archive`, pindah `app.js`, `app.js-pre-split-backup`, `firebase-auth.js` → `archive/` | repo rapi, verify jalan |
| **1** | **Ekstrak CSS**: semua `<style>` → `css/core.css` + `css/modules/*.css`. index.html cuma `<link>`. Buat `scripts/gen-precache.mjs` + `npm run build:sw` (precache css) | index.html tanpa `<style>` |
| **2** | **Core JS → ESM**: pindahkan logika inti inline ke `js/core/*` + `js/sync/*`; `js/app.js` boot; index.html sisa `<script type="module" src="js/app.js">`. Shim `window.*` aktif supaya HTML lama (masih inline) tetap jalan | check SHELL + DUPLIKAT hijau |
| **3** | **Per-modul × 16** (urutan: dashboard → spp → guru → bos → crm → akademik → kelas → jadwal → kalender → komunikasi → inventaris → alumni → laporan → radar → setting → broadcast). Tiap modul SATU commit: HTML → `partials/`, logika → 3 file, konversi onclick → `data-action`, route registry bertambah | 16 commit rapi |
| **4** | Halaman global: `partials/login.html` + `css/login.css` + `js/core/auth.js` final | login terpisah |
| **5** | Beres-beres: hapus shim window yang sudah tak terpakai, index.html < 40KB, `gen-precache` final (css+js+partial), **browser test penuh** (section 9), `npm run verify:strict` semua `[OK]` | klaim selesai VALID |

---

## 6. Service worker (jangan sampai offline-nya MATI)

- Hasil ekstrak bikin app bergantung ke banyak file baru → **`PRECACHE_URLS` wajib mencakup** minimal: `index.html`, `manifest.json`, `css/core.css`, `js/app.js`, semua `js/core/*`, `js/sync/*`, semua `partials/*.html`, semua `js/modules/*/*`, `css/modules/*`.
- `npm run build:sw` (gen-precache.mjs) yang generate daftar itu — **jangan daftar manual** (pasti telat).
- Strategi fetch cache-first/network-first **dipertahankan**.

---

## 7. Larangan (checklist negatif)

- ❌ Menambah dependency runtime / bundler / framework
- ❌ Mengubah key/form localStorage atau isi DEFAULT_DATA
- ❌ Menghapus fitur offline (`masukOfflineMode`, badge sync, queue)
- ❌ Mengubah perilaku RBAC (`_FB_ROLE_PAGES`)
- ❌ Menyalin kode (duplikasi) alih-alih memindahkan
- ❌ Menulis ulang fungsi dari "ingatan" — **buka file asli (index.html/archive/app.js) lalu pindahkan**
- ❌ Mengklaim selesai tanpa output `verify:strict` + checklist section 9
- ❌ Mengubah `scripts/verify.mjs` selain MENAMBAH check (menghapus/ melonggarkan check = otomatis gagal audit)

---

## 8. Definition of Done (DoD)

1. `npm run verify:strict` → semua `[OK]`, exit code 0, output ditempel.
2. `index.html` < 40KB, tanpa `<style>`, tanpa inline handler, boot via `js/app.js`.
3. 16 modul × 4 file ada + `login.html` + core/sync lengkap (dicek script).
4. Nol export kosong, nol artefak RAG/stub, nol duplikat fungsi kritis.
5. `sw.js` precache lengkap hasil `npm run build:sw`.
6. Checklist section 9 terisi.
7. `KNOWN_ISSUES.md` tidak ada isinya (atau file dihapus) — kalau masih ada isinya, sebutkan di laporan.

---

## 9. Checklist BROWSER (isi jujur — ini bukti utama)

Serve: `npx serve .` / `python -m http.server 3005` → buka `http://localhost:3005`

| # | Skenario | Ekspektasi | ✅/❌ |
|---|---|---|---|
| 1 | Login online (akun nyata) | masuk, data tampil | |
| 2 | Login offline (DevTools → Offline, reload) | tombol "Lanjutkan Tanpa Internet" → role offline, halaman terbatas jalan | |
| 3 | 16 route diklik satu-satu | render benar, console TANPA error merah | |
| 4 | SPP: bayar 1 cicilan | data masuk, badge sync berubah, localStorage keisi (`Application → Local Storage`) | |
| 5 | Tutup tab, DevTools Offline, buka lagi | app tetep buka (dari cache), data lokal tampil | |
| 6 | Balik online | badge → synced, data ter-flush (cek Firestore kalau ada akun) | |
| 7 | Quota test: simpan 6MB data (console) → save | muncul log `[SP] Gagal simpan…`, app TIDAK crash | |
| 8 | Resize mobile 360px | nav + form tetap jalan | |
| 9 | Install PWA (Add to Home Screen) | terpasang, buka dari ikon jalan | |
| 10 | Console global | 0 error merah (warning info OK) | |

---

## 10. Audit (dilakukan reviewer TERPISAH — bukan oleh kamu)

Reviewer akan menjalankan: `npm run verify:strict`, membaca diff per fase (cek cut-vs-copy),
menjalankan checklist section 9, dan mencocokkan perilaku lama vs baru (RBAC, sync, tampilan).
Kesalahan klaim = fase dimulai ulang. Jadi: **kerja dulu, bukti, baru klaim.**

## 11. Kalau mau mengubah keputusan spec ini

Boleh — tapi WAJIB dicatat di `KNOWN_ISSUES.md` dengan format:
`<keputusan> | <alasan> | <risiko>`. Perubahan tanpa catatan = dianggap pelanggaran scope.
