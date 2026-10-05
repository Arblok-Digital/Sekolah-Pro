// ══════════════════════════════════════════════════════════════════
//  scripts/gen-precache.mjs
//  Scan css/, js/, partials/ + shell + icons → tulis PRECACHE_URLS di sw.js
//  Jalankan: npm run build:sw
//  Jangan daftar manual — selalu generate supaya tidak telat saat file baru.
// ══════════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, posix } from 'node:path';

const ROOT = process.cwd();

function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (['node_modules', '.git', 'archive'].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const urls = ['./index.html', './manifest.json'];

// icons
for (const f of readdirSync(ROOT)) {
  if (/^icon-.*\.png$/.test(f)) urls.push('./' + f);
}

// asset dirs
for (const dir of ['css', 'js', 'partials']) {
  const abs = join(ROOT, dir);
  try { statSync(abs); } catch { continue; }
  for (const f of walk(abs)) {
    const rel = posix.join(dir, ...f.slice(abs.length + 1).split(/[\\/]/));
    if (/\.(css|js|html)$/.test(rel)) urls.push('./' + rel);
  }
}

// unik + urut
const list = [...new Set(urls)].sort();

let sw = readFileSync(join(ROOT, 'sw.js'), 'utf8');
const block =
  'const PRECACHE_URLS = [\n' +
  list.map((u) => `  '${u}',`).join('\n') +
  '\n];';

if (/const PRECACHE_URLS = \[[\s\S]*?\];/.test(sw)) {
  sw = sw.replace(/const PRECACHE_URLS = \[[\s\S]*?\];/, block);
} else {
  sw = sw.replace(
    /(const CACHE_DYNAMIC = [^\n]*\n)/,
    `$1\n${block}\n`
  );
}

// bump versi cache supaya SW baru langsung aktif
sw = sw.replace(/sekolahpro-static-v\d+/, 'sekolahpro-static-v4');
sw = sw.replace(/sekolahpro-dynamic-v\d+/, 'sekolahpro-dynamic-v4');

writeFileSync(join(ROOT, 'sw.js'), sw, 'utf8');
console.log(`[build:sw] ${list.length} URL ditulis ke PRECACHE_URLS`);
