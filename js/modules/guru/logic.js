// js/modules/guru/logic.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

globalThis.activeJamGuruId = null;


globalThis.guruFilter = 'all';

globalThis.activeGuruId = null;

// ── Payroll Config ──

function getPayrollCfg() {
  const d = getD();
  if (!d.payroll_config) d.payroll_config = {
    bpjs_kes: 50000, bpjs_tk: 25000,
    uang_makan_per_hari: 15000, transport_per_hari: 10000,
    hari_kerja_default: 22
  };
  if (!d.arsip_gaji) d.arsip_gaji = [];
  return d;
}

// ── Compute payroll for one guru ──

function hitungGaji(g, hariHadir) {
  const cfg = getPayrollCfg().payroll_config;
  const jam = g.jam_mengajar || 0;
  const hadir = hariHadir !== undefined ? hariHadir : (g.hari_hadir || cfg.hari_kerja_default);

  // Penghasilan
  const gajiPokok    = g.gaji_pokok || 0;
  const honorJam     = (g.honor_per_jam || 0) * jam;
  const tunjangan    = g.tunjangan || 0;
  const uangMakan    = (g.uang_makan_per_hari || cfg.uang_makan_per_hari) * hadir;
  const transport    = (g.transport_per_hari || cfg.transport_per_hari) * hadir;
  const insentif     = g.insentif || 0;
  const bruto = gajiPokok + honorJam + tunjangan + uangMakan + transport + insentif;

  // Potongan
  const bpjsKes   = g.bpjs_kes !== undefined ? g.bpjs_kes : cfg.bpjs_kes;
  const bpjsTK    = g.bpjs_tk  !== undefined ? g.bpjs_tk  : cfg.bpjs_tk;
  const kasbonAktif = (g.kasbon_list || []).filter(k => k.status === 'aktif');
  const kasbonPotong = kasbonAktif.reduce((a, k) => a + (k.cicilan_per_bulan || 0), 0);
  const potonganLain = g.potongan_lain || 0;
  const totalPotongan = bpjsKes + bpjsTK + kasbonPotong + potonganLain;

  const netto = Math.max(0, bruto - totalPotongan);

  return {
    gajiPokok, honorJam, tunjangan, uangMakan, transport, insentif,
    bruto, bpjsKes, bpjsTK, kasbonPotong, potonganLain, totalPotongan,
    netto, jam, hadir
  };
}

// ── Get absensi hadir count for guru (sync attendance) ──

function getHariHadirGuru(guru) {
  // Match guru to siswa absensi? No — guru has separate hari_hadir field
  // Attendance sync: use guru.hari_hadir if set, else payroll config default
  const cfg = getPayrollCfg().payroll_config;
  return guru.hari_hadir !== undefined ? guru.hari_hadir : cfg.hari_kerja_default;
}

// ── Set guru filter ──

function updateJamPreview(guru) {
  const jam = parseInt(document.getElementById('jam-inp').value) || 0;
  const h = hitungGaji({...guru, jam_mengajar: jam});
  document.getElementById('jam-preview-total').textContent = fmt(h.netto);
  document.getElementById('jam-preview-detail').textContent =
    `Bruto ${fmt(h.bruto)} − Potongan ${fmt(h.totalPotongan)}`;
}


function adjustJam(delta) {
  const inp = document.getElementById('jam-inp');
  const d = getD();
  const guru = d.keuangan_guru.find(g => g.id === activeJamGuruId);
  inp.value = Math.max(0, (parseInt(inp.value)||0) + delta);
  if (guru) updateJamPreview(guru);
}


globalThis.GURU_COLORS = [
  {bg:'rgba(192,132,252,.15)',border:'var(--pur)',text:'var(--pur)'},
  {bg:'rgba(0,230,118,.15)',border:'var(--grn)',text:'var(--grn)'},
  {bg:'rgba(38,198,218,.15)',border:'var(--cyn)',text:'var(--cyn)'},
  {bg:'rgba(68,138,255,.15)',border:'var(--blu)',text:'var(--blu)'},
];

// ── KASBON MODULE ──

function updateKasbonPreview() {
  const jumlah = parseFloat(document.getElementById('kasbon-jumlah-inp').value)||0;
  const cicil = parseInt((document.getElementById('kasbon-cicil-inp')||{value:1}).value)||1;
  const prevEl = document.getElementById('kasbon-preview-box');
  const cicilEl = document.getElementById('kasbon-cicil-preview');
  if (jumlah>0 && prevEl && cicilEl) {
    prevEl.style.display='block';
    cicilEl.textContent = fmt(Math.ceil(jumlah/cicil));
  } else if(prevEl) prevEl.style.display='none';
}


function generateSlipHTML(g, d) {
  const h = hitungGaji(g, getHariHadirGuru(g));
  const sekolah = d.profil_sekolah.nama || 'SekolahPro';
  const bulan = new Date().toLocaleDateString('id-ID',{month:'long',year:'numeric'});
  const noSlip = `SLIP-${g.id.slice(-4)}-${new Date().getMonth()+1}${new Date().getFullYear()}`;

  const penghasilan = [
    ['Gaji Pokok', h.gajiPokok],
    ['Honor Mengajar', h.honorJam, `${h.jam} jam × ${fmt(g.honor_per_jam||0)}`],
    ['Tunjangan Jabatan', h.tunjangan],
    ['Uang Makan', h.uangMakan, `${h.hadir} hari × ${fmt(g.uang_makan_per_hari||0)}`],
    ['Transport', h.transport, `${h.hadir} hari × ${fmt(g.transport_per_hari||0)}`],
    ['Insentif', h.insentif],
  ].filter(([,val])=>val>0);

  const potongan = [
    ['BPJS Kesehatan', h.bpjsKes],
    ['BPJS Ketenagakerjaan', h.bpjsTK],
    ['Potongan Kasbon', h.kasbonPotong],
    ['Potongan Lain-lain', h.potonganLain],
  ].filter(([,val])=>val>0);

  return `<div class="slip-wrap">
    <div class="slip-header">
      <div class="slip-header-logo">🏫</div>
      <div style="flex:1">
        <div class="slip-header-school-name">${sekolah}</div>
        <div class="slip-header-sub">SLIP GAJI KARYAWAN</div>
      </div>
      <div class="slip-month-badge">${bulan}</div>
    </div>
    <div class="slip-guru-row">
      <div class="slip-guru-cell"><div class="slip-guru-label">Nama Karyawan</div><div class="slip-guru-value">${g.nama}</div></div>
      <div class="slip-guru-cell"><div class="slip-guru-label">Jabatan</div><div class="slip-guru-value">${g.jabatan}</div></div>
      <div class="slip-guru-cell"><div class="slip-guru-label">No. Slip</div><div class="slip-guru-value" style="font-family:'Courier New',monospace">${noSlip}</div></div>
      <div class="slip-guru-cell"><div class="slip-guru-label">No. Rekening</div><div class="slip-guru-value">${g.no_rekening||'—'}</div></div>
    </div>
    <div style="display:flex;gap:0">
      <div class="slip-section" style="flex:1;border-right:1px solid #e0e0e0">
        <div class="slip-section-title">💰 Penghasilan</div>
        ${penghasilan.map(([lbl,val,ket])=>`<div class="slip-row plus"><span class="slip-row-lbl">${lbl}${ket?`<br/><span style="font-size:8px;color:#aaa">${ket}</span>`:''}</span><span class="slip-row-val">+${fmt(val)}</span></div>`).join('')}
        <div class="slip-row" style="border-top:1px solid #e0e0e0;padding-top:5px;margin-top:3px"><span class="slip-row-lbl" style="font-weight:900">Total Bruto</span><span class="slip-row-val" style="font-weight:900">${fmt(h.bruto)}</span></div>
      </div>
      <div class="slip-section" style="flex:1">
        <div class="slip-section-title">✂️ Potongan</div>
        ${potongan.length?potongan.map(([lbl,val])=>`<div class="slip-row minus"><span class="slip-row-lbl">${lbl}</span><span class="slip-row-val">-${fmt(val)}</span></div>`).join(''):'<div style="font-size:10px;color:#aaa">Tidak ada potongan</div>'}
        ${potongan.length?`<div class="slip-row" style="border-top:1px solid #e0e0e0;padding-top:5px;margin-top:3px"><span class="slip-row-lbl" style="font-weight:900">Total Potongan</span><span class="slip-row-val minus" style="font-weight:900">-${fmt(h.totalPotongan)}</span></div>`:''}
      </div>
    </div>
    <div class="slip-total-box">
      <div><div class="slip-total-label">GAJI BERSIH (TAKE-HOME PAY)</div><div style="font-size:9px;color:#4a6080;margin-top:1px">Bruto ${fmt(h.bruto)} − Potongan ${fmt(h.totalPotongan)}</div></div>
      <div class="slip-total-value">${fmt(h.netto)}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:14px 16px;background:#f9f9f9">
      <div style="text-align:center;font-size:9px;color:#666">
        <div>Dikeluarkan oleh,</div>
        <div style="border-bottom:1px solid #000;margin:28px 8px 3px"></div>
        <div style="font-weight:700">Bendahara Sekolah</div>
      </div>
      <div style="text-align:center;font-size:9px;color:#666">
        <div>Diterima oleh,</div>
        <div style="border-bottom:1px solid #000;margin:28px 8px 3px"></div>
        <div style="font-weight:700">${g.nama}</div>
      </div>
    </div>
    <div class="slip-footer">
      <span>Dicetak: ${new Date().toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'})}</span>
      <span>Sekolah Pro · © 2026 Arblok Digital · 0895-0805-3795</span>
    </div>
  </div>`;
}


function cetakSlipGaji() {
  const d = getPayrollCfg();
  const g = d.keuangan_guru.find(x=>x.id===activeGuruId);
  if (!g) return;
  const html = generateSlipHTML(g, d);
  const w = window.open('','_blank','width=600,height=800');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Slip Gaji ${g.nama}</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{background:#fff;font-family:'Courier New',monospace;font-size:10px}
    .slip-wrap,.slip-header,.slip-guru-row,.slip-guru-cell,.slip-section,.slip-total-box,.slip-footer,.slip-row,.slip-section-title{all:unset;display:revert}
    @import url('data:text/css,${encodeURIComponent(`.slip-wrap{background:#fff;color:#000;font-family:'Courier New',monospace;font-size:10px;max-width:100%;border:1px solid #ddd}.slip-header{background:#0a0f1a;color:#fff;padding:14px 18px;display:flex;align-items:center;gap:12px}.slip-header-logo{font-size:26px}.slip-header-school-name{font-size:13px;font-weight:900}.slip-header-sub{font-size:9px;color:#8ba3c7;margin-top:2px}.slip-month-badge{background:rgba(0,230,118,.2);border:1px solid rgba(0,230,118,.4);border-radius:6px;padding:4px 10px;font-size:10px;font-weight:900;color:#00e676;white-space:nowrap}.slip-guru-row{display:flex;background:#f8f8f8;border-bottom:2px solid #ddd;flex-wrap:wrap}.slip-guru-cell{flex:1;padding:8px 14px;min-width:110px}.slip-guru-label{font-size:8px;color:#888;text-transform:uppercase}.slip-guru-value{font-size:11px;font-weight:700}.slip-section{padding:10px 16px;flex:1;border-right:1px solid #e0e0e0}.slip-section:last-child{border-right:none}.slip-section-title{font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.8px;color:#555;border-bottom:1px solid #e0e0e0;padding-bottom:4px;margin-bottom:8px}.slip-row{display:flex;justify-content:space-between;padding:3px 0;font-size:10px}.slip-row-lbl{color:#666;flex:1}.slip-row-val{font-weight:700;text-align:right}.slip-row.plus .slip-row-val{color:#00a040}.slip-row.minus .slip-row-val{color:#cc0000}.slip-total-box{background:#0a0f1a;color:#fff;padding:12px 16px;display:flex;justify-content:space-between;align-items:center}.slip-total-label{font-size:12px;font-weight:700;color:#8ba3c7}.slip-total-value{font-size:20px;font-weight:900;color:#00e676;font-family:'Courier New',monospace}.slip-footer{padding:10px 16px;background:#f5f5f5;display:flex;justify-content:space-between;font-size:8px;color:#888;border-top:1px solid #e0e0e0}`)}');<\/style>
    <\/head><body>${html}<\/body><\/html>`);
  w.document.close();
  setTimeout(()=>w.print(),500);
}


function shareSlipWA() {
  const d = getPayrollCfg();
  const g = d.keuangan_guru.find(x=>x.id===activeGuruId);
  if (!g) return;
  if (!g.hp_guru && !g.no_rekening) { showNotif('No HP guru belum ada di profil!','warn'); return; }
  const h = hitungGaji(g, getHariHadirGuru(g));
  const bulan = new Date().toLocaleDateString('id-ID',{month:'long',year:'numeric'});
  const msg = `*SLIP GAJI — ${(d.profil_sekolah.nama||'SekolahPro').toUpperCase()}*\n`+
    `📅 ${bulan}\n\n👤 *${g.nama}* — ${g.jabatan}\n\n`+
    `💰 *PENGHASILAN*\n`+
    `├ Gaji Pokok: ${fmt(h.gajiPokok)}\n`+
    (h.honorJam?`├ Honor (${h.jam}j): ${fmt(h.honorJam)}\n`:'')+
    (h.tunjangan?`├ Tunjangan: ${fmt(h.tunjangan)}\n`:'')+
    (h.uangMakan?`├ Uang Makan: ${fmt(h.uangMakan)}\n`:'')+
    (h.transport?`├ Transport: ${fmt(h.transport)}\n`:'')+
    `└ Total Bruto: *${fmt(h.bruto)}*\n\n`+
    `✂️ *POTONGAN*\n`+
    (h.bpjsKes?`├ BPJS Kes: -${fmt(h.bpjsKes)}\n`:'')+
    (h.bpjsTK?`├ BPJS TK: -${fmt(h.bpjsTK)}\n`:'')+
    (h.kasbonPotong?`├ Kasbon: -${fmt(h.kasbonPotong)}\n`:'')+
    `└ Total Potong: *-${fmt(h.totalPotongan)}*\n\n`+
    `━━━━━━━━━━━━━━━━\n💵 *GAJI BERSIH: ${fmt(h.netto)}*\n`+
    `Rekening: ${g.no_rekening||'—'}\n\n`+
    `_Sekolah Pro by Arblok Digital_\n_0895-0805-3795_`;
  const hp = (g.hp_guru||'6289508053795').replace(/[^0-9]/g,'').replace(/^0/,'62');
  bukaWA(hp, encodeURIComponent(msg));
}

// ── PAYROLL CONFIG ──

function eksporArsipGaji() {
  const d = getPayrollCfg();
  const list = d.arsip_gaji||[];
  if (!list.length) { showNotif('Belum ada arsip!','warn'); return; }
  const headers = 'Nama,Jabatan,Bulan,Bruto,BPJS Kes,BPJS TK,Kasbon,Potongan Total,Net,Tgl Bayar,T.A.';
  const rows = list.map(a=>`${a.nama},${a.jabatan||''},${a.bulan},${a.bruto||0},${a.bpjsKes||0},${a.bpjsTK||0},${a.kasbonPotong||0},${a.totalPotongan||0},${a.netto||0},${new Date(a.tgl_bayar).toLocaleDateString('id-ID')},${a.ta||''}`);
  const blob = new Blob([[headers,...rows].join('\n')],{type:'text/csv'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=`arsip_gaji_${new Date().getFullYear()}.csv`; a.click();
  showNotif('📊 Arsip gaji berhasil diekspor!','ok');
}

// ── GURU DETAIL MODAL ──

Object.assign(globalThis, { getPayrollCfg, hitungGaji, getHariHadirGuru, updateJamPreview, adjustJam, updateKasbonPreview, generateSlipHTML, cetakSlipGaji, shareSlipWA, eksporArsipGaji });
export { getPayrollCfg, hitungGaji, getHariHadirGuru, updateJamPreview, adjustJam, updateKasbonPreview, generateSlipHTML, cetakSlipGaji, shareSlipWA, eksporArsipGaji };
