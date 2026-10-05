// js/modules/spp/logic.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

globalThis.JENIS_BIAYA = [
  { key: 'SPP',         label: 'SPP Bulanan',          icon: '💳', color: 'var(--grn)'  },
  { key: 'Bangunan',    label: 'Bangunan / Infaq',      icon: '🏗️', color: 'var(--blu)'  },
  { key: 'Buku',        label: 'Buku',                  icon: '📚', color: 'var(--cyn)'  },
  { key: 'Seragam',     label: 'Seragam',               icon: '👕', color: 'var(--pur)'  },
  { key: 'Akhir Tahun', label: 'Biaya Akhir Tahun',     icon: '🎓', color: 'var(--yel)'  },
  { key: 'Pentas Seni', label: 'Pentas Seni',           icon: '🎭', color: 'var(--amb)'  },
  { key: 'Rihlah',      label: 'Rihlah / Field Trip',   icon: '🚌', color: 'var(--red)'  },
  { key: 'Lainnya',     label: 'Lainnya',               icon: '📌', color: 'var(--t2)'   },
];


globalThis.biayaFilterAktif = 'semua';


function updateBiayaInfo() {
  const d = getD();
  const id = (document.getElementById('biaya-siswa-sel') || {value:''}).value;
  const s = d.data_siswa.find(x => x.id === id);
  const infoEl = document.getElementById('biaya-siswa-info');
  if (!infoEl) return;
  if (s && s.total_piutang > 0) {
    infoEl.style.display = 'block';
    // FIX 4+6: robust isLunas check — handle p.status undefined & p.lunas boolean
    const detail = (s.piutang_detail || []).filter(p => {
      const isLunas = p.lunas === true || p.status === 'lunas' || p.status === 'paid';
      const sisa = p.sisa !== undefined ? p.sisa : (p.jumlah || 0);
      return !isLunas && sisa > 0;
    });
    infoEl.innerHTML = `<b style="color:var(--yel)">⚠️ Sisa tagihan: ${fmt(s.total_piutang)}</b><br/>` +
      (detail.length ? detail.map(p => {
        const sisa = p.sisa !== undefined ? p.sisa : (p.jumlah || 0);
        const j = JENIS_BIAYA.find(x => x.key === p.jenis) || {icon:'📌'};
        return `${j.icon} ${p.jenis}: ${fmt(sisa)}${p.keterangan ? ' ('+p.keterangan+')' : ''}`;
      }).join(' · ') : 'Total piutang: ' + fmt(s.total_piutang));
  } else {
    infoEl.style.display = 'none';
  }
}


function updateBiayaMetode() {
  const metode = (document.getElementById('biaya-metode') || {value:'Tunai'}).value;
  const infoEl = document.getElementById('biaya-deposit-info');
  if (!infoEl) return;
  if (metode === 'Deposit') {
    const d = getD();
    const siswaId = (document.getElementById('biaya-siswa-sel') || {value:''}).value;
    const s = d.data_siswa.find(x => x.id === siswaId);
    const deposit = s ? (s.deposit || 0) : 0;
    infoEl.style.display = 'block';
    infoEl.innerHTML = deposit > 0
      ? `🔵 Deposit tersedia: <b style="color:var(--grn)">${fmt(deposit)}</b>. Akan dipotong otomatis.`
      : `⚠️ Siswa ini tidak punya deposit. Pilih metode lain.`;
    // Auto-fill jumlah dari deposit jika ada
    const jumlahInp = document.getElementById('biaya-jumlah');
    if (jumlahInp && !jumlahInp.value && deposit > 0) jumlahInp.value = deposit;
    updateBiayaPreview();
  } else {
    infoEl.style.display = 'none';
  }
}


function onBiayaJenisChange() {
  const jenis = (document.getElementById('biaya-jenis-sel') || {value:'SPP'}).value;
  const periodeWrap = document.getElementById('biaya-periode-wrap');
  if (periodeWrap) periodeWrap.style.display = jenis === 'SPP' ? 'flex' : 'none';
  // Auto-fill nominal dari setting jika SPP
  const d = getD();
  if (jenis === 'SPP') {
    const inp = document.getElementById('biaya-jumlah');
    if (inp && !inp.value) inp.value = d.profil_sekolah.spp_nominal || '';
  }
  updateBiayaPreview();
}


function updateBiayaPreview() {
  const jumlah = parseFloat((document.getElementById('biaya-jumlah') || {value:0}).value) || 0;
  const el = document.getElementById('biaya-preview-total');
  if (el) el.textContent = fmt(jumlah);
}

// ── Catat Pembayaran ──

function printKartu() {
  const el = document.getElementById('kartu-preview');
  if (!el) return;
  const w = window.open('','_blank','width=400,height=600');
  w.document.write(`<html><head><title>Kartu SPP</title>
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Courier New',monospace;background:#fff;padding:20px}
  .kartu-spp{border:2px solid #000;border-radius:8px;padding:16px;max-width:320px;font-size:10px}
  .kartu-header{display:flex;gap:12px;align-items:center;border-bottom:1px dashed #999;padding-bottom:10px;margin-bottom:10px}
  .kartu-logo{font-size:28px}.kartu-school-name{font-size:12px;font-weight:900}.kartu-school-sub{font-size:9px;color:#666;margin-top:2px}
  .kartu-siswa-name{font-size:14px;font-weight:900;margin:8px 0 4px}
  .kartu-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin:8px 0}
  .kartu-cell{background:#f5f5f5;padding:6px 8px;border-radius:4px}.kartu-cell-lbl{font-size:8px;color:#666;text-transform:uppercase}.kartu-cell-val{font-size:11px;font-weight:900;margin-top:2px}
  .kartu-bulan-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:3px;margin-top:8px}
  .kartu-bulan{text-align:center;padding:4px 2px;border-radius:3px;border:1px solid #ddd;font-size:8px;font-weight:700}
  .lunas{background:#d4edda;border-color:#28a745;color:#155724}.belum{background:#f8d7da;border-color:#dc3545;color:#721c24}
  <\/style><\/head><body>${el.innerHTML}<\/body><\/html>`);
  w.document.close();
  setTimeout(()=>w.print(),300);
}

// Populate kartu siswa sel on modal open

globalThis._kwCache = null; // simpan data kwitansi aktif


function generateKwitansi(paymentId) {
  if (!paymentId) { showNotif('ID transaksi tidak tersedia','warn'); return; }
  const d    = getD();
  const txns = d.riwayat_spp || [];
  const txn  = txns.find(t => t.id === paymentId);
  if (!txn) { showNotif('Data transaksi tidak ditemukan','err'); return; }

  const profil    = d.profil_sekolah || {};
  const nmSekolah = profil.nama || 'SD Islam Sahara';
  const alamat    = profil.alamat || '';
  const telp      = profil.telepon || '';
  const ks        = profil.kepala_sekolah || 'Kepala Sekolah';
  const schoolId  = profil.schoolId || _fbSchoolId || 'SKL';

  // Nomor kwitansi
  const yr = new Date(txn.waktu).getFullYear();
  const seq = (txn.id||'').replace(/\D/g,'').slice(-6).padStart(6,'0');
  const noKw = `KWT/${schoolId}/${yr}/${seq}`;

  // QR payload
  const qrPayload = JSON.stringify({
    id: txn.id, no: noKw,
    siswa: txn.nama, jenis: txn.jenis,
    jumlah: txn.jumlah, waktu: txn.waktu,
    school: schoolId,
    v: btoa(txn.id+'|'+txn.jumlah).slice(0,10).toUpperCase()
  });

  _kwCache = { txn, profil, qrPayload, noKw };

  const tglTxn  = new Date(txn.waktu).toLocaleDateString('id-ID',{dateStyle:'long'});
  const jamTxn  = new Date(txn.waktu).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
  const tglCetak= new Date().toLocaleDateString('id-ID',{dateStyle:'full'});

  const html = `
    <div class="kw-paper" id="kw-paper-el">
      <div class="kw-header">
        <div class="kw-school-name">${nmSekolah.toUpperCase()}</div>
        ${alamat ? `<div class="kw-school-addr">${alamat}${telp ? ' · Telp: '+telp : ''}</div>` : ''}
      </div>
      <div class="kw-title">KWITANSI PEMBAYARAN</div>
      <div class="kw-no">No: ${noKw}</div>

      <div class="kw-row"><span class="kw-row-key">Nama Siswa</span><span class="kw-row-val">${txn.nama}</span></div>
      <div class="kw-row"><span class="kw-row-key">Kelas</span><span class="kw-row-val">${txn.kelas||'—'}</span></div>
      <div class="kw-row"><span class="kw-row-key">Jenis Pembayaran</span><span class="kw-row-val">${txn.jenis}</span></div>
      <div class="kw-row"><span class="kw-row-key">Periode</span><span class="kw-row-val">${txn.bulan||'—'}</span></div>
      <div class="kw-row"><span class="kw-row-key">Metode</span><span class="kw-row-val">${txn.metode||'Tunai'}</span></div>
      ${txn.catatan ? `<div class="kw-row"><span class="kw-row-key">Keterangan</span><span class="kw-row-val">${txn.catatan}</span></div>` : ''}
      <div class="kw-row"><span class="kw-row-key">Tanggal</span><span class="kw-row-val">${tglTxn}, ${jamTxn}</span></div>

      <div class="kw-amount">
        <div class="kw-amount-label">Jumlah Dibayar</div>
        <div class="kw-amount-val">${fmt(txn.jumlah)}</div>
        <div class="kw-amount-terbilang"># ${_tbCapital(txn.jumlah)} #</div>
      </div>

      <div class="kw-qr"><div id="kw-qr-box"></div></div>
      <div class="kw-valid">Scan QR untuk verifikasi kwitansi · ${noKw}</div>

      <div class="kw-ttd-row">
        <div class="kw-ttd">
          <div class="kw-ttd-label">Penerima / Bendahara,</div>
          <div class="kw-ttd-line">${nmSekolah}</div>
          <div class="kw-ttd-name">Bendahara</div>
        </div>
        <div class="kw-ttd">
          <div class="kw-ttd-label">Mengetahui,</div>
          <div class="kw-ttd-line">${ks}</div>
          <div class="kw-ttd-name">Kepala Sekolah</div>
        </div>
      </div>

      <div class="kw-footer">
        Dicetak: ${tglCetak}<br/>
        Kwitansi ini sah sebagai bukti pembayaran yang valid
      </div>
      <div class="kw-logo-arblok">Powered by <b>Arblok Digital</b> · SekolahPro v6</div>
    </div>`;

  document.getElementById('kw-preview-content').innerHTML = html;
  document.getElementById('kw-modal-title').textContent = `🧾 ${txn.nama} — ${fmt(txn.jumlah)}`;

  // Generate QR setelah DOM ready
  setTimeout(() => {
    const qrEl = document.getElementById('kw-qr-box');
    if (!qrEl) return;
    qrEl.innerHTML = '';
    try {
      new QRCode(qrEl, {
        text: qrPayload, width: 80, height: 80,
        colorDark: '#111111', colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    } catch(e) {
      qrEl.innerHTML = `<div style="width:80px;height:80px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-size:8px;color:#999;border:1px dashed #ccc;text-align:center">[QR]<br/>${txn.id.slice(-6)}</div>`;
    }
  }, 120);

  openModal('modal-kwitansi');
}


function cetakKwitansi(mode) {
  if (!_kwCache) return;
  const pa = document.getElementById('kw-print-area');
  const el = document.getElementById('kw-paper-el');
  if (!el) return;
  pa.innerHTML = el.outerHTML;
  document.body.classList.toggle('kw-thermal', mode === 'thermal');
  if (mode === 'thermal') showNotif('💡 Pilih paper size "58mm x auto" di dialog print','warn');
  window.print();
  setTimeout(() => { document.body.classList.remove('kw-thermal'); pa.innerHTML = ''; }, 2500);
}


Object.assign(globalThis, { updateBiayaInfo, updateBiayaMetode, onBiayaJenisChange, updateBiayaPreview, printKartu, generateKwitansi, cetakKwitansi });
export { updateBiayaInfo, updateBiayaMetode, onBiayaJenisChange, updateBiayaPreview, printKartu, generateKwitansi, cetakKwitansi };
