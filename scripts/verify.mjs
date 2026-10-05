// ══════════════════════════════════════════════════════════════════
//  scripts/verify.mjs — VERIFIKASI REFAKTOR SEKOLAH PRO
//  Disediakan reviewer. DILARANG mengubah kecuali MENAMBAH check baru.
//
//  Jalankan:
//    npm run verify           → check dasar (jalan kapan saja)
//    npm run verify:strict    → DoD final (wajib PASS sebelum klaim "selesai")
//
//  Setiap check cetak [OK] / [XX]. Exit code 1 kalau ada yang gagal.
//  Klaim "done" TANPA menempelkan output lengkap script ini = TIDAK VALID.
// ══════════════════════════════════════════════════════════════════

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const STRICT = process.argv.includes('--strict');

// 16 modul halaman — HARUS sama dengan route registry di js/core/router.js
const MODULES = [
  'dashboard', 'crm', 'kelas', 'spp', 'guru', 'bos', 'akademik', 'jadwal',
  'kalender', 'komunikasi', 'inventaris', 'alumni', 'laporan', 'radar',
  'setting', 'broadcast',
];

const results = [];
function rec(name, pass, detail = '') {
  results.push({ name, pass, detail });
}
function read(p) {
  try { return readFileSync(join(ROOT, p), 'utf8'); } catch { return null; }
}
function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (['node_modules', '.git', 'archive', '.next'].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(js|mjs)$/.test(e.name)) out.push(p);
  }
  return out;
}

// ── 1. SYNTAX: semua .js/.mjs harus valid (ESM via package.json type=module)
{
  const bad = [];
  for (const f of walk(ROOT)) {
    const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8', cwd: ROOT });
    if (r.status !== 0) {
      const errLine = (r.stderr || '').split('\n').find((l) => l.includes('Error')) || 'syntax error';
      bad.push(`${relative(ROOT, f)} → ${errLine.trim()}`);
    }
  }
  rec('SYNTAX semua .js/.mjs valid', bad.length === 0, bad.slice(0, 5).join(' | '));
}

// ── 2. STRUKTUR: file target wajib ada
{
  const required = [
    'index.html', 'sw.js', 'manifest.json',
    'css/core.css',
    'js/app.js',
    'js/core/config.js', 'js/core/db.js', 'js/core/router.js',
    'js/core/auth.js', 'js/core/events.js', 'js/core/utils.js',
    'js/sync/queue.js', 'js/sync/firestore.js', 'js/sync/sheets.js', 'js/sync/status.js',
    'scripts/gen-precache.mjs',
    'partials/login.html',
  ];
  for (const m of MODULES) {
    required.push(`partials/${m}.html`, `css/modules/${m}.css`);
    required.push(`js/modules/${m}/route.js`, `js/modules/${m}/logic.js`, `js/modules/${m}/pipeline.js`);
  }
  const missing = required.filter((p) => !existsSync(join(ROOT, p)));
  const detail = missing.length
    ? `hilang ${missing.length}/${required.length}: ${missing.slice(0, 6).join(', ')}${missing.length > 6 ? ', …' : ''}`
    : '';
  rec('STRUKTUR file target lengkap (16 modul × css+partial+3 js, core, sync)', missing.length === 0, detail);
}

// ── 3. ANTI-STUB: dilarang export fungsi kosong
{
  const offenders = [];
  const modDir = join(ROOT, 'js', 'modules');
  if (existsSync(modDir)) {
    for (const f of walk(modDir)) {
      const src = readFileSync(f, 'utf8');
      const m = src.matchAll(/export\s+(async\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{\s*\}/g);
      for (const x of m) offenders.push(`${relative(ROOT, f)}:${x[2]}()`);
    }
  }
  // stub lama di modules/ root (phase lama) juga harus hilang
  const oldDir = join(ROOT, 'modules');
  if (existsSync(oldDir)) {
    for (const f of walk(oldDir)) {
      const src = readFileSync(f, 'utf8');
      if (/export\s+function\s+\w+\s*\([^)]*\)\s*\{\s*\}/.test(src)) offenders.push(`${relative(ROOT, f)} (stub lama)`);
    }
  }
  rec('ANTI-STUB: tidak ada export fungsi kosong', offenders.length === 0, offenders.slice(0, 6).join(' | '));
}

// ── 4. ANTI-CRUFT: artefak RAG/comment chunk harus dibersihkan
{
  const offenders = [];
  for (const dir of ['js', 'modules', 'partials']) {
    const base = join(ROOT, dir);
    if (!existsSync(base)) continue;
    const files = dir === 'partials'
      ? readdirSync(base).filter((n) => n.endsWith('.html')).map((n) => join(base, n))
      : walk(base);
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      if (/RETRIEVED CONTENT|Chunk: app\.js line|GENERATED EXPORTS|stub phase/i.test(src)) {
        offenders.push(relative(ROOT, f));
      }
    }
  }
  rec('ANTI-CRUFT: artefak RAG/stub lama bersih', offenders.length === 0, offenders.slice(0, 6).join(', '));
}

// ── 5. SHELL index.html: tipis, tanpa style/logic, terhubung ke modul
{
  const src = read('index.html') || '';
  const problems = [];
  if (/<style[\s>]/i.test(src)) problems.push('masih ada <style> inline (harus di css/)');
  const moduleScripts = [...src.matchAll(/<script[^>]*type="module"[^>]*src="([^"]+)"/g)].map((m) => m[1]);
  if (!moduleScripts.includes('js/app.js')) problems.push('tidak ada <script type="module" src="js/app.js">');
  if (!/href="css\/core\.css"/.test(src)) problems.push('tidak ada <link href="css/core.css">');
  // total isi <script> inline (tanpa src) harus kecil — boot/warn doang
  const inline = [...src.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)]
    .reduce((sum, m) => sum + m[1].length, 0);
  if (inline > 8000) problems.push(`script inline masih ${inline} char (budget 8000 — pindahkan ke js/)`);
  if (!/firebase-app-compat\.js/.test(src)) problems.push('CDN Firebase compat hilang (jangan diubah)');
  rec('SHELL index.html (tanpa <style>, boot via js/app.js, inline script ≤ 8KB)', problems.length === 0, problems.join(' | '));
}

// ── 6. DATA: skema localStorage tidak berubah
{
  const dbSrc = read('js/core/db.js') || '';
  const problems = [];
  if (!dbSrc.includes('sekolah_pro_db')) problems.push("key 'sekolah_pro_db' tidak ada di js/core/db.js");
  if (!dbSrc.includes('DEFAULT_DATA')) problems.push('DEFAULT_DATA tidak ada di js/core/db.js');
  if (!/try\s*\{[\s\S]*?setItem/.test(dbSrc)) problems.push('saveDB tanpa try/catch quota');
  rec('SKEMA DATA: key localStorage + DEFAULT_DATA + quota guard', problems.length === 0, problems.join(' | '));
}

// ── 7. DUPLIKAT: fungsi kritis boleh terdefinisi TEPAT 1× di js/
{
  const NAMES = ['saveDB', 'loadDB', 'switchPage', 'fmt', '_fbFlushQueue', 'masukOfflineMode'];
  const files = walk(join(ROOT, 'js'));
  const problems = [];
  if (files.length === 0) {
    problems.push('folder js/ belum ada');
  } else {
    for (const name of NAMES) {
      let count = 0;
      for (const f of files) {
        const src = readFileSync(f, 'utf8');
        count += (src.match(new RegExp(`function\\s+${name}\\s*\\(`, 'g')) || []).length;
        count += (src.match(new RegExp(`(?:const|let)\\s+${name}\\s*=`, 'g')) || []).length;
      }
      if (count !== 1) problems.push(`${name} terdefinisi ${count}× (harus 1×)`);
    }
  }
  rec('DUPLIKAT: fungsi kritis hanya 1 definisi di js/', problems.length === 0, problems.join(' | '));
}

// ── 8. OFFLINE: sw.js precache ikut file hasil ekstrak
{
  const sw = read('sw.js') || '';
  const problems = [];
  if (!sw.includes('css/core.css')) problems.push('PRECACHE belum include css/core.css');
  if (!sw.includes('js/app.js')) problems.push('PRECACHE belum include js/app.js');
  if (!sw.includes('partials/')) problems.push('PRECACHE belum include partials/');
  rec('SW precache: css + js + partials (offline tetap hidup)', problems.length === 0, problems.join(' | '));
}

// ── 9. (strict) HANDLER: nol onclick inline — wajib data-action
{
  const files = ['index.html'];
  if (existsSync(join(ROOT, 'partials'))) {
    for (const n of readdirSync(join(ROOT, 'partials'))) if (n.endsWith('.html')) files.push(`partials/${n}`);
  }
  let count = 0;
  const where = [];
  for (const f of files) {
    const src = read(f) || '';
    const c = (src.match(/\son(click|change|input|submit|keyup|keydown)=/g) || []).length;
    if (c) { count += c; where.push(`${f}:${c}`); }
  }
  if (!STRICT) {
    rec(`[strict] HANDLER: 0 inline on* (sekarang ${count} — konversi ke data-action)`, true, `info: ${where.join(', ') || '0'}`);
  } else {
    rec('HANDLER: 0 inline on* (semua sudah data-action)', count === 0, count ? `${count} tersisa: ${where.join(', ')}` : '');
  }
}

// ── Ringkasan ──────────────────────────────────────────────────────
console.log('');
console.log(`═══ VERIFY SEKOLAH PRO — mode ${STRICT ? 'STRICT (DoD final)' : 'DASAR'} ═══`);
for (const r of results) {
  console.log(`${r.pass ? ' [OK] ' : ' [XX] '} ${r.name}`);
  if (r.detail) console.log(`        → ${r.detail}`);
}
const failed = results.filter((r) => !r.pass);
console.log('──────────────────────────────────────────────');
console.log(`${results.length - failed.length}/${results.length} PASS${failed.length ? ` — GAGAL: ${failed.length}` : ' — SEMUA BERSIH ✅'}`);
if (failed.length) {
  console.log('Sebelum klaim SELESAI: semua check harus [OK] + tempel output ini + isi checklist browser di spec.');
}
process.exit(failed.length ? 1 : 0);
