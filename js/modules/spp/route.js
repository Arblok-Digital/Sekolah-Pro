// js/modules/spp/route.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

import './logic.js';
import './pipeline.js';

function setBiayaFilter(val, btn) {
  biayaFilterAktif = val;
  document.querySelectorAll('#spp-page .fchip').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  renderSPP();
}


function renderSPP() {
  const d = getD();
  const riwayat = d.riwayat_spp || [];

  // ── Stats ──
  const totalMasuk  = riwayat.reduce((a, s) => a + (s.jumlah || 0), 0);
  const totalPiutang = d.data_siswa.reduce((a, s) => a + (s.total_piutang || 0), 0);
  const infakTotal  = (d.infak_harian || []).reduce((a, i) => a + (i.jumlah || 0), 0);
  const setEl = (id, v) => { const e = document.getElementById(id); if(e) e.textContent = v; };
  setEl('stat-spp-total',    fmtShort(totalMasuk));
  setEl('stat-piutang-total',fmtShort(totalPiutang));
  setEl('stat-infak-total',  fmtShort(infakTotal));
  setEl('stat-siswa-2',      d.data_siswa.length);

  // ── FIX 9: Summary cards SELALU tampilkan semua (tidak ikut filter)
  //    tapi highlight jenis yang sedang aktif
  const summaryEl = document.getElementById('biaya-summary-cards');
  if (summaryEl) {
    const totalPerJenis = {};
    JENIS_BIAYA.forEach(j => totalPerJenis[j.key] = 0);
    riwayat.forEach(r => {
      const k = r.jenis || 'SPP';
      if (totalPerJenis[k] !== undefined) totalPerJenis[k] += (r.jumlah || 0);
      else totalPerJenis['Lainnya'] = (totalPerJenis['Lainnya'] || 0) + (r.jumlah || 0);
    });
    const aktifJenis = biayaFilterAktif !== 'semua' ? biayaFilterAktif : null;
    summaryEl.innerHTML = JENIS_BIAYA.filter(j => totalPerJenis[j.key] > 0).map(j => {
      const isAktif = aktifJenis === j.key;
      return `<div style="background:${isAktif ? j.color+'22' : 'var(--s2)'};border:1px solid ${isAktif ? j.color : 'var(--bdr)'};border-radius:var(--r);padding:10px 12px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:all .15s" onclick="setBiayaFilter('${j.key}',null)">
        <span style="font-size:20px">${j.icon}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:10px;color:var(--t3);font-weight:700">${j.label}</div>
          <div style="font-size:13px;font-weight:900;color:${j.color};font-family:'Courier New',monospace">${fmtShort(totalPerJenis[j.key])}</div>
        </div>
        ${isAktif ? '<span style="font-size:10px;color:'+j.color+'">✓</span>' : ''}
      </div>`;
    }).join('');
  }

  // ── Siswa list ──
  const el = document.getElementById('siswa-list');
  const q = (document.getElementById('spp-search') || {value:''}).value.toLowerCase().trim();
  let siswaList = d.data_siswa.filter(s =>
    (!s.status_akademik || s.status_akademik === 'Aktif') &&
    (!q || s.nama.toLowerCase().includes(q))
  );

  if (!siswaList.length) {
    el.innerHTML = '<div class="empty-state"><span class="empty-icon">👥</span><span class="empty-text">Belum ada data siswa</span></div>';
  } else {
    el.innerHTML = siswaList.map((s, i) => {
      // Hitung tagihan per jenis untuk siswa ini
      const bayarSiswa = riwayat.filter(r => r.siswa_id === s.id);
      const tagihanDetail = (s.piutang_detail || []);
      const piutangPerJenis = {};
      tagihanDetail.forEach(t => {
        piutangPerJenis[t.jenis] = (piutangPerJenis[t.jenis] || 0) + (t.sisa || 0);
      });
      const piutangJenisHtml = Object.entries(piutangPerJenis)
        .filter(([,v]) => v > 0)
        .map(([k,v]) => {
          const j = JENIS_BIAYA.find(x => x.key === k) || {icon:'📌',color:'var(--t2)'};
          return `<span class="bdg" style="background:${j.color}15;color:${j.color};border:1px solid ${j.color}30;font-size:9px">${j.icon} ${fmtShort(v)}</span>`;
        }).join('');

      const avatarColors = ['var(--grn)','var(--cyn)','var(--pur)','var(--blu)','var(--amb)','var(--yel)'];
      const ac = avatarColors[i % avatarColors.length];
      const hasTagihan = s.total_piutang > 0;

      return `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--bdr);cursor:pointer" onclick="openBayarBiaya('${s.id}')">
        <div style="width:38px;height:38px;border-radius:50%;background:${ac}20;border:2px solid ${ac};color:${ac};display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;flex-shrink:0">${getInitials(s.nama)}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.nama}</div>
          <div style="font-size:10px;color:var(--t3);margin-top:2px">Kelas ${s.kelas || '—'}</div>
          ${piutangJenisHtml ? `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">${piutangJenisHtml}</div>` : ''}
        </div>
        <div style="text-align:right;flex-shrink:0">
          <span class="bdg ${hasTagihan ? 'bdg-r' : 'bdg-g'}" style="font-size:10px">${hasTagihan ? '⚠️ ' + fmt(s.total_piutang) : '✅ Lunas'}</span>
          ${(s.deposit||0) > 0 ? `<div style="font-size:9px;color:var(--grn);margin-top:2px;font-weight:700">🔵 Deposit ${fmt(s.deposit)}</div>` : ''}
          <div style="font-size:9px;color:var(--t3);margin-top:2px">${bayarSiswa.length} transaksi</div>
        </div>
      </div>`;
    }).join('');
  }

  // ── Riwayat pembayaran ──
  const rwEl = document.getElementById('riwayat-biaya-list');
  if (rwEl) {
    let filtered = biayaFilterAktif === 'semua'
      ? riwayat
      : riwayat.filter(r => (r.jenis || 'SPP') === biayaFilterAktif);
    filtered = filtered.slice().reverse().slice(0, 30);
    if (!filtered.length) {
      rwEl.innerHTML = '<div class="empty-state" style="padding:20px"><span>📜</span><span style="font-size:11px;color:var(--t3)">Belum ada riwayat pembayaran</span></div>';
    } else {
      rwEl.innerHTML = filtered.map(r => {
        const j = JENIS_BIAYA.find(x => x.key === (r.jenis || 'SPP')) || {icon:'💳',color:'var(--grn)',label:'SPP'};
        return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--bdr)">
          <div style="width:32px;height:32px;border-radius:8px;background:${j.color}15;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">${j.icon}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.nama}</div>
            <div style="font-size:10px;color:var(--t3);margin-top:1px">${j.label}${r.bulan ? ' · ' + r.bulan : ''}${r.metode ? ' · ' + r.metode : ''}</div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-size:13px;font-weight:900;color:${j.color};font-family:'Courier New',monospace">+${fmt(r.jumlah)}</div>
            <div style="font-size:9px;color:var(--t3)">${new Date(r.waktu).toLocaleDateString('id-ID',{dateStyle:'short'})}</div>
          </div>
        </div>`;
      }).join('');
    }
  }

  // ── Infak list ──
  const el2 = document.getElementById('infak-list');
  if (el2) {
    if (!(d.infak_harian || []).length) {
      el2.innerHTML = '<div class="empty-state"><span class="empty-icon">🙏</span><span class="empty-text">Belum ada catatan infak</span></div>';
    } else {
      el2.innerHTML = d.infak_harian.slice(-10).reverse().map(i => `
        <div class="infak-item">
          <div class="infak-left">
            <span class="infak-icon">🙏</span>
            <div class="infak-info">
              <div class="infak-nama">${i.nama || 'Anonim'} <span class="bdg bdg-b">${i.kategori}</span></div>
              <div class="infak-tgl">${new Date(i.tanggal).toLocaleDateString('id-ID',{dateStyle:'medium'})}</div>
            </div>
          </div>
          <div class="infak-amt">+${fmt(i.jumlah)}</div>
        </div>`).join('');
    }
  }

  populateSiswaSelect();
  populateBiayaSiswaSelect();
}

// ── Open bayar dari click siswa ──

function openBayarBiaya(siswaId) {
  populateBiayaSiswaSelect();
  const sel = document.getElementById('biaya-siswa-sel');
  if (sel) sel.value = siswaId;
  updateBiayaInfo();
  onBiayaJenisChange();
  openModal('modal-bayar-biaya');
}

// ── Populate siswa select di modal ──

function populateBiayaSiswaSelect() {
  const d = getD();
  const sel = document.getElementById('biaya-siswa-sel');
  if (!sel) return;
  sel.innerHTML = d.data_siswa.length
    ? d.data_siswa.map(s => `<option value="${s.id}">${s.nama} — Kelas ${s.kelas}</option>`).join('')
    : '<option value="">-- Belum ada siswa --</option>';
}

// ── Update info siswa saat dipilih ──

function populateSiswaSelect() {
  const d = getD();
  const sel = document.getElementById('spp-siswa-sel');
  if (!sel) return;
  sel.innerHTML = d.data_siswa.length
    ? d.data_siswa.map(s => `<option value="${s.id}">${s.nama} (${s.kelas})</option>`).join('')
    : '<option value="">-- Belum ada siswa --</option>';
}


function openPaySPP(siswaId) {
  // Redirect ke modal baru yang lebih lengkap
  openBayarBiaya(siswaId);
}


function renderKartuSPP() {
  const siswaId = (document.getElementById('kartu-siswa-sel')||{value:''}).value;
  const tahun = (document.getElementById('kartu-tahun')||{value:'2024/2025'}).value;
  const d = getD();
  const s = d.data_siswa.find(x=>x.id===siswaId);
  const el = document.getElementById('kartu-preview');
  if (!el) return;
  if (!s) { el.innerHTML=''; return; }
  const c = getAvatarColor(s);
  const bulanList = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const paidBulan = new Set();
  (s.piutang_detail||[]).filter(p=>p.status==='paid'&&p.jenis==='SPP Bulanan').forEach(p=>{
    bulanList.forEach((b,i)=>{ if((p.keterangan||'').includes(b)||(p.keterangan||'').toLowerCase().includes(b.toLowerCase())) paidBulan.add(i); });
  });
  el.innerHTML = `<div class="kartu-spp">
    <div class="kartu-header">
      <div class="kartu-logo">🏫</div>
      <div class="kartu-school">
        <div class="kartu-school-name">${d.profil_sekolah.nama}</div>
        <div class="kartu-school-sub">KARTU PEMBAYARAN SPP</div>
        <div class="kartu-school-sub">T.A. ${tahun}</div>
      </div>
    </div>
    <div class="kartu-siswa-name">${s.nama}</div>
    <div class="kartu-grid">
      <div class="kartu-cell"><div class="kartu-cell-lbl">KELAS</div><div class="kartu-cell-val">${s.kelas||'—'}</div></div>
      <div class="kartu-cell"><div class="kartu-cell-lbl">NISN</div><div class="kartu-cell-val">${s.nisn||'—'}</div></div>
      <div class="kartu-cell"><div class="kartu-cell-lbl">ORANG TUA</div><div class="kartu-cell-val">${s.ayah||'—'}</div></div>
      <div class="kartu-cell"><div class="kartu-cell-lbl">NOMINAL SPP</div><div class="kartu-cell-val">${fmt(d.profil_sekolah.spp_nominal)}</div></div>
    </div>
    <hr style="border:none;border-top:1px dashed #ccc;margin:8px 0"/>
    <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;margin-bottom:5px">Status Pembayaran</div>
    <div class="kartu-bulan-grid">
      ${bulanList.map((b,i)=>`<div class="kartu-bulan ${paidBulan.has(i)?'lunas':'belum'}">${b}</div>`).join('')}
    </div>
    <div style="margin-top:8px;font-size:8px;color:#888;text-align:center">
      Dicetak ${new Date().toLocaleDateString('id-ID',{dateStyle:'long'})}
    </div>
  </div>`;
}


Object.assign(globalThis, { setBiayaFilter, renderSPP, openBayarBiaya, populateBiayaSiswaSelect, populateSiswaSelect, openPaySPP, renderKartuSPP });

export async function mount(container, modalsRoot) {
  return globalThis.mountPartial('spp', container, modalsRoot);
}
export { setBiayaFilter, renderSPP, openBayarBiaya, populateBiayaSiswaSelect, populateSiswaSelect, openPaySPP, renderKartuSPP };
