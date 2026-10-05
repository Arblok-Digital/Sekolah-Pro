// js/modules/guru/pipeline.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

function renderGuru() {
  const d = getPayrollCfg();
  const cfg = d.payroll_config;
  let list = d.keuangan_guru;

  // Apply filter
  if (guruFilter === 'belum') list = list.filter(g => !g.sudah_dibayar);
  else if (guruFilter === 'lunas') list = list.filter(g => g.sudah_dibayar);
  else if (guruFilter === 'kasbon') list = list.filter(g => (g.kasbon_list||[]).some(k=>k.status==='aktif'));

  // Compute totals across ALL guru (not filtered)
  let totalBruto = 0, totalPotongan = 0, totalNetto = 0, totalKasbon = 0;
  let lunasCount = 0, belumCount = 0;
  d.keuangan_guru.forEach(g => {
    const h = hitungGaji(g, getHariHadirGuru(g));
    totalBruto += h.bruto;
    totalPotongan += h.totalPotongan;
    totalNetto += h.netto;
    totalKasbon += (g.kasbon_list||[]).filter(k=>k.status==='aktif').reduce((a,k)=>a+k.jumlah_sisa,0);
    if (g.sudah_dibayar) lunasCount++; else belumCount++;
    g.total_terima = h.netto; // keep synced
  });

  // Hero dashboard
  const saldo = d.profil_sekolah.saldo_utama;
  const totalUnpaid = d.keuangan_guru.filter(g=>!g.sudah_dibayar).reduce((a,g)=>a+(g.total_terima||0),0);
  const ratio = totalUnpaid > 0 ? Math.min(100, (saldo/totalUnpaid)*100) : 100;

  const setEl = (id, val) => { const e=document.getElementById(id); if(e)e.textContent=val; };
  setEl('payroll-total-display', fmtShort(totalNetto));
  setEl('payroll-lunas-count', lunasCount);
  setEl('payroll-belum-count', belumCount);
  setEl('payroll-kasbon-total', fmtShort(totalKasbon));
  setEl('payroll-saldo-display', fmtShort(saldo));
  setEl('payroll-ratio-lbl', `${ratio.toFixed(0)}% saldo vs kebutuhan`);
  const bar = document.getElementById('payroll-saldo-bar');
  if (bar) {
    bar.style.width = Math.min(100,ratio)+'%';
    bar.style.background = ratio>=100?'var(--grn)':ratio>=60?'var(--yel)':'var(--red)';
  }
  setEl('stat-guru-total', d.keuangan_guru.length);
  setEl('stat-gaji-total', fmtShort(totalBruto));
  setEl('stat-potongan-total', fmtShort(totalPotongan));
  setEl('stat-netto-total', fmtShort(totalNetto));

  const el = document.getElementById('guru-list');
  if (!el) return;
  if (!list.length) {
    el.innerHTML = `<div class="empty-state" style="padding:40px"><span class="empty-icon">👨‍🏫</span><br><span class="empty-text">${d.keuangan_guru.length===0?'Belum ada data guru':'Tidak ada guru sesuai filter'}</span></div>`;
    saveDB(); return;
  }

  const COLORS = [
    {bg:'rgba(192,132,252,.15)',border:'var(--pur)',text:'var(--pur)'},
    {bg:'rgba(0,230,118,.15)',border:'var(--grn)',text:'var(--grn)'},
    {bg:'rgba(38,198,218,.15)',border:'var(--cyn)',text:'var(--cyn)'},
    {bg:'rgba(68,138,255,.15)',border:'var(--blu)',text:'var(--blu)'},
    {bg:'rgba(255,202,40,.15)',border:'var(--yel)',text:'var(--yel)'},
    {bg:'rgba(255,152,0,.15)',border:'var(--amb)',text:'var(--amb)'},
  ];

  el.innerHTML = '<div style="display:flex;flex-direction:column;gap:10px;padding:0 12px 16px">' +
    list.map((g, i) => {
      const c = COLORS[i % COLORS.length];
      const h = hitungGaji(g, getHariHadirGuru(g));
      g.total_terima = h.netto;
      const kasbonAktif = (g.kasbon_list||[]).filter(k=>k.status==='aktif');
      const kasbonTotal = kasbonAktif.reduce((a,k)=>a+k.jumlah_sisa,0);
      const statusClass = g.sudah_dibayar ? 'payroll-status-lunas' : 'payroll-status-belum';
      const statusLabel = g.sudah_dibayar ? '✅ Sudah Transfer' : '⏳ Belum Dibayar';

      return `<div class="payroll-card">
        <div class="payroll-card-header" onclick="openGuruDetail('${g.id}')">
          <div class="payroll-avatar" style="background:${c.bg};border-color:${c.border};color:${c.text}">${getInitials(g.nama)}</div>
          <div class="payroll-info">
            <div class="payroll-nama">${g.nama}</div>
            <div class="payroll-jabatan">${g.jabatan} · ${h.hadir} hari hadir · ${h.jam} jam</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:3px">
              <span class="payroll-status-badge ${statusClass}">${statusLabel}</span>
              ${kasbonTotal>0?`<span class="kasbon-badge">💼 Kasbon ${fmt(kasbonTotal)}</span>`:''}
            </div>
          </div>
          <div>
            <div class="payroll-netto" style="color:${g.sudah_dibayar?'var(--grn)':'var(--pur)'}">${fmt(h.netto)}</div>
            <div style="font-size:9px;color:var(--t3);text-align:right;margin-top:2px">Take-Home</div>
          </div>
        </div>
        <!-- Komponen breakdown -->
        <div class="payroll-body">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">
            <div>
              ${h.gajiPokok?`<div class="payroll-line plus"><span class="payroll-line-lbl">Gaji Pokok</span><span class="payroll-line-val">+${fmt(h.gajiPokok)}</span></div>`:''}
              ${h.honorJam?`<div class="payroll-line plus"><span class="payroll-line-lbl">Honor (${h.jam}j)</span><span class="payroll-line-val">+${fmt(h.honorJam)}</span></div>`:''}
              ${h.tunjangan?`<div class="payroll-line plus"><span class="payroll-line-lbl">Tunjangan</span><span class="payroll-line-val">+${fmt(h.tunjangan)}</span></div>`:''}
              ${h.uangMakan?`<div class="payroll-line plus"><span class="payroll-line-lbl">Makan (${h.hadir}h)</span><span class="payroll-line-val">+${fmt(h.uangMakan)}</span></div>`:''}
              ${h.transport?`<div class="payroll-line plus"><span class="payroll-line-lbl">Transport</span><span class="payroll-line-val">+${fmt(h.transport)}</span></div>`:''}
              ${h.insentif?`<div class="payroll-line plus"><span class="payroll-line-lbl">Insentif</span><span class="payroll-line-val">+${fmt(h.insentif)}</span></div>`:''}
            </div>
            <div style="border-left:1px solid var(--bdr);padding-left:10px">
              ${h.bpjsKes?`<div class="payroll-line minus"><span class="payroll-line-lbl">BPJS Kes.</span><span class="payroll-line-val">-${fmt(h.bpjsKes)}</span></div>`:''}
              ${h.bpjsTK?`<div class="payroll-line minus"><span class="payroll-line-lbl">BPJS TK</span><span class="payroll-line-val">-${fmt(h.bpjsTK)}</span></div>`:''}
              ${h.kasbonPotong?`<div class="payroll-line minus"><span class="payroll-line-lbl">Kasbon</span><span class="payroll-line-val">-${fmt(h.kasbonPotong)}</span></div>`:''}
              ${h.potonganLain?`<div class="payroll-line minus"><span class="payroll-line-lbl">Lain-lain</span><span class="payroll-line-val">-${fmt(h.potonganLain)}</span></div>`:''}
              <div class="payroll-line total-line" style="border-top:1px solid var(--bdr)">
                <span class="payroll-line-lbl" style="font-weight:900;color:var(--t1)">NET</span>
                <span class="payroll-line-val" style="color:var(--pur);font-size:14px">${fmt(h.netto)}</span>
              </div>
            </div>
          </div>
        </div>
        <!-- Actions -->
        <div class="payroll-actions">
          <button class="abtn ${g.sudah_dibayar?'abtn-b':'abtn-g'}" style="flex:1;padding:8px;font-size:11px" onclick="${g.sudah_dibayar?`batalBayarGuru('${g.id}')`:`bayarGuru('${g.id}')`}">
            ${g.sudah_dibayar?'↩️ Batalkan Transfer':'💸 Transfer Gaji'}
          </button>
          <button class="abtn abtn-b" style="padding:8px 10px;font-size:11px" onclick="openSlipGaji('${g.id}')">🧾 Slip</button>
          <button class="abtn abtn-a" style="padding:8px 10px;font-size:11px" onclick="openKasbonModal('${g.id}')">💼 Kasbon</button>
          <button class="abtn" style="padding:8px 10px;font-size:11px;background:var(--s2);color:var(--t2);border:1px solid var(--bdr2)" onclick="openJamModal('${g.id}')">⏰</button>
          <button class="abtn abtn-r" style="padding:8px 10px;font-size:11px" onclick="hapusGuru('${g.id}')">🗑️</button>
        </div>
      </div>`;
    }).join('') + '</div>';
  saveDB();
}

// ── Tambah Guru (upgraded) ──

function resetGuruForm() {
  const ids = ['guru-nama-inp','guru-jabatan-inp','guru-rekening-inp','guru-bpjs-no-inp','guru-gaji-inp','guru-honor-inp','guru-tunjangan-inp','guru-makan-inp','guru-transport-inp','guru-insentif-inp','guru-bpjs-kes-inp','guru-bpjs-tk-inp','guru-potongan-lain-inp'];
  ids.forEach(id => { const e=document.getElementById(id); if(e)e.value=''; });
  const eid = document.getElementById('guru-edit-id'); if(eid) eid.value='';
}


function tambahGuru() {
  const nama = (document.getElementById('guru-nama-inp')||{value:''}).value.trim();
  if (!nama) { showNotif('Nama guru wajib diisi!', 'err'); return; }
  const d = getPayrollCfg();
  const cfg = d.payroll_config;
  const editId = (document.getElementById('guru-edit-id')||{value:''}).value;

  const payload = {
    nama,
    jabatan:  (document.getElementById('guru-jabatan-inp')||{value:'Guru'}).value.trim()||'Guru',
    no_rekening: (document.getElementById('guru-rekening-inp')||{value:''}).value.trim(),
    no_bpjs: (document.getElementById('guru-bpjs-no-inp')||{value:''}).value.trim(),
    gaji_pokok:   parseFloat((document.getElementById('guru-gaji-inp')||{value:0}).value)||0,
    honor_per_jam:parseFloat((document.getElementById('guru-honor-inp')||{value:0}).value)||0,
    tunjangan:    parseFloat((document.getElementById('guru-tunjangan-inp')||{value:0}).value)||0,
    uang_makan_per_hari: parseFloat((document.getElementById('guru-makan-inp')||{value:0}).value)||cfg.uang_makan_per_hari,
    transport_per_hari:  parseFloat((document.getElementById('guru-transport-inp')||{value:0}).value)||cfg.transport_per_hari,
    insentif:     parseFloat((document.getElementById('guru-insentif-inp')||{value:0}).value)||0,
    bpjs_kes:     parseFloat((document.getElementById('guru-bpjs-kes-inp')||{value:0}).value)||cfg.bpjs_kes,
    bpjs_tk:      parseFloat((document.getElementById('guru-bpjs-tk-inp')||{value:0}).value)||cfg.bpjs_tk,
    potongan_lain:parseFloat((document.getElementById('guru-potongan-lain-inp')||{value:0}).value)||0,
    jam_mengajar: 0,
    hari_hadir:   cfg.hari_kerja_default,
    sudah_dibayar: false,
    kasbon_list: [],
    arsip_gaji: []
  };

  if (editId) {
    const g = d.keuangan_guru.find(x=>x.id===editId);
    if (g) Object.assign(g, payload);
    showNotif(`✅ Data ${nama} diperbarui!`, 'ok');
  } else {
    payload.id = 'G'+Date.now();
    payload.total_terima = hitungGaji(payload).netto;
    d.keuangan_guru.push(payload);
    addAktivitas('guru', `Guru baru: ${nama} (${payload.jabatan})`, 0);
    showNotif(`✅ Guru "${nama}" berhasil ditambah!`, 'ok');
  }
  saveDB(); closeModal('modal-guru'); resetGuruForm();

  // ── Langsung push ke Firestore ─────────────────────────────
  if (_fbDb && navigator.onLine && _fbSchoolId) {
    const guruId = editId || (d.keuangan_guru.find(g=>g.nama===nama)||{}).id || ('G'+Date.now());
    const guruData = {
      ...payload,
      id: guruId,
      schoolId: _fbSchoolId,
      _synced_at: firebase.firestore.FieldValue.serverTimestamp()
    };
    // Simpan ke schools/{schoolId}/staff/{id}
    _fbDb.collection('schools').doc(_fbSchoolId)
      .collection('staff').doc(guruId)
      .set(guruData, { merge: true })
      .then(() => {
        console.log('[FB] ✅ Guru synced to Firestore staff:', guruId);
        showNotif(`☁️ Data ${nama} tersimpan ke Firestore!`, 'ok');
      })
      .catch(e => {
        console.error('[FB] Guru sync error:', e.code, e.message);
        showNotif('⚠️ Guru tersimpan lokal, Firestore: ' + (e.code||e.message), 'warn');
      });
  }

  if (currentPage==='guru') renderGuru();
}

// ── Jam Mengajar (upgraded) ──

function simpanJam() {
  const guruId = document.getElementById('jam-guru-id').value;
  const jam = parseInt(document.getElementById('jam-inp').value) || 0;
  const d = getD();
  const guru = d.keuangan_guru.find(g => g.id === guruId);
  if (!guru) return;
  guru.jam_mengajar = jam;
  guru.total_terima = hitungGaji(guru).netto;
  guru.sudah_dibayar = false;
  addAktivitas('guru', `Jam mengajar ${guru.nama}: ${jam} jam`, 0);
  saveDB(); closeModal('modal-jam');
  showNotif(`✅ Jam ${guru.nama}: ${jam} jam`, 'ok');
  if (currentPage==='guru') renderGuru();
}

// ── Bayar Guru (upgraded with arsip) ──

function bayarGuru(guruId) {
  const d = getPayrollCfg();
  const guru = d.keuangan_guru.find(g => g.id === guruId);
  if (!guru) return;
  if (guru.sudah_dibayar) { showNotif('Gaji sudah dibayar!', 'warn'); return; }
  const h = hitungGaji(guru, getHariHadirGuru(guru));
  if (d.profil_sekolah.saldo_utama < h.netto) {
    showNotif(`⚠️ Saldo kurang! Butuh ${fmt(h.netto)}, ada ${fmt(d.profil_sekolah.saldo_utama)}`, 'err'); return;
  }
  // Deduct saldo
  d.profil_sekolah.saldo_utama -= h.netto;
  guru.sudah_dibayar = true;
  guru.tgl_bayar = new Date().toISOString();
  guru.total_terima = h.netto;

  // Process kasbon cicilan — kurangi sisa
  (guru.kasbon_list||[]).filter(k=>k.status==='aktif').forEach(k => {
    k.jumlah_sisa = Math.max(0, k.jumlah_sisa - k.cicilan_per_bulan);
    k.cicilan_dibayar = (k.cicilan_dibayar||0) + 1;
    if (k.jumlah_sisa <= 0) { k.status='lunas'; k.tgl_lunas=new Date().toISOString(); }
  });

  // Simpan ke arsip gaji
  const bulanTahun = new Date().toLocaleDateString('id-ID',{month:'long',year:'numeric'});
  if (!guru.arsip_gaji) guru.arsip_gaji = [];
  guru.arsip_gaji.push({
    id: 'ARS'+Date.now(),
    bulan: bulanTahun,
    tgl_bayar: new Date().toISOString(),
    ...h,
    ta: d.akademik_config?.tahun_ajaran_aktif || ''
  });

  // Simpan ke arsip global
  if (!d.arsip_gaji) d.arsip_gaji = [];
  d.arsip_gaji.push({
    id: 'AG'+Date.now(), guru_id: guruId, nama: guru.nama, jabatan: guru.jabatan,
    bulan: bulanTahun, tgl_bayar: new Date().toISOString(), ...h,
    ta: d.akademik_config?.tahun_ajaran_aktif || ''
  });

  addAktivitas('gaji', `💸 Gaji ${guru.nama} (${bulanTahun}) ditransfer`, -h.netto);
  saveDB(); buildTicker();
  showNotif(`✅ Gaji ${guru.nama} ${fmt(h.netto)} berhasil ditransfer!`, 'ok');
  if (currentPage==='guru') renderGuru();
  if (currentPage==='dashboard') renderDashboard();
}


function batalBayarGuru(guruId) {
  const d = getD();
  const guru = d.keuangan_guru.find(g => g.id === guruId);
  if (!guru || !guru.sudah_dibayar) return;
  if (!confirm(`Batalkan transfer gaji ${guru.nama}? Saldo akan dikembalikan.`)) return;
  d.profil_sekolah.saldo_utama += (guru.total_terima || 0);
  guru.sudah_dibayar = false;
  guru.tgl_bayar = null;
  // Remove last arsip entry
  if (guru.arsip_gaji?.length) guru.arsip_gaji.pop();
  if (d.arsip_gaji) {
    const idx = d.arsip_gaji.map(a=>a.guru_id).lastIndexOf(guruId);
    if (idx>=0) d.arsip_gaji.splice(idx,1);
  }
  saveDB(); buildTicker();
  showNotif(`↩️ Transfer gaji ${guru.nama} dibatalkan`, 'warn');
  if (currentPage==='guru') renderGuru();
}


function bayarSemuaGuru() {
  const d = getPayrollCfg();
  const unpaid = d.keuangan_guru.filter(g => !g.sudah_dibayar);
  if (!unpaid.length) { showNotif('Semua guru sudah dibayar!', 'warn'); return; }
  const totalAll = unpaid.reduce((a,g) => a + (g.total_terima || hitungGaji(g).netto), 0);
  if (d.profil_sekolah.saldo_utama < totalAll) {
    showNotif(`⚠️ Saldo kurang! Butuh ${fmt(totalAll)}, ada ${fmt(d.profil_sekolah.saldo_utama)}`, 'err'); return;
  }
  if (!confirm(`Transfer gaji ${unpaid.length} guru total ${fmt(totalAll)}?`)) return;
  unpaid.forEach(g => bayarGuru(g.id));
  showNotif(`🎉 ${unpaid.length} guru berhasil dibayar!`, 'ok');
}


function hapusGuru(guruId) {
  if (!confirm('Hapus data guru ini? Semua data payroll ikut terhapus.')) return;
  const d = getD();
  d.keuangan_guru = d.keuangan_guru.filter(g => g.id !== guruId);
  saveDB(); showNotif('🗑️ Data guru dihapus', 'ok');
  if (currentPage==='guru') renderGuru();
}

// ── GURU_COLORS (defined here so all functions below can use it) ──

function simpanKasbon() {
  const guruId = document.getElementById('kasbon-guru-id').value;
  const jumlah = parseFloat(document.getElementById('kasbon-jumlah-inp').value)||0;
  const tgl = document.getElementById('kasbon-tgl-inp').value;
  const ket = (document.getElementById('kasbon-ket-inp')||{value:''}).value.trim();
  const cicil = parseInt((document.getElementById('kasbon-cicil-inp')||{value:1}).value)||1;
  if (jumlah<=0) { showNotif('Jumlah kasbon harus > 0!','err'); return; }
  const d = getD();
  const g = d.keuangan_guru.find(x=>x.id===guruId);
  if (!g) return;
  if (!g.kasbon_list) g.kasbon_list=[];
  const cicilan = Math.ceil(jumlah/cicil);
  g.kasbon_list.push({
    id:'KB'+Date.now(), jumlah, jumlah_sisa:jumlah,
    cicilan_per_bulan:cicilan, cicilan_total:cicil, cicilan_dibayar:0,
    tgl, keterangan:ket, status:'aktif', tgl_input:new Date().toISOString()
  });
  g.sudah_dibayar=false;
  addAktivitas('guru',`💼 Kasbon ${g.nama}: ${fmt(jumlah)} (${cicil}×cicil)`,0);
  saveDB(); closeModal('modal-kasbon');
  document.getElementById('kasbon-jumlah-inp').value='';
  if(document.getElementById('kasbon-ket-inp'))document.getElementById('kasbon-ket-inp').value='';
  showNotif(`✅ Kasbon ${fmt(jumlah)} untuk ${g.nama} tercatat! Potongan ${fmt(cicilan)}/bulan.`,'ok');
  if(currentPage==='guru')renderGuru();
}

// ── SLIP GAJI ──

function simpanPayrollConfig() {
  const d = getPayrollCfg();
  const get = id => parseFloat((document.getElementById(id)||{value:0}).value)||0;
  d.payroll_config.bpjs_kes = get('cfg-bpjs-kes');
  d.payroll_config.bpjs_tk = get('cfg-bpjs-tk');
  d.payroll_config.uang_makan_per_hari = get('cfg-makan');
  d.payroll_config.transport_per_hari = get('cfg-transport');
  d.payroll_config.hari_kerja_default = parseInt((document.getElementById('cfg-hari-kerja')||{value:22}).value)||22;
  saveDB(); closeModal('modal-payroll-config');
  showNotif('✅ Konfigurasi payroll disimpan!','ok');
  if(currentPage==='guru')renderGuru();
}

// ── ARSIP GAJI ──

function editGuruFromDetail(guruId) {
  const d = getD();
  const g = d.keuangan_guru.find(x=>x.id===guruId);
  if (!g) return;
  closeModal('modal-guru-detail');
  const set = (id,val) => { const e=document.getElementById(id); if(e)e.value=val||''; };
  const eid = document.getElementById('guru-edit-id'); if(eid) eid.value=guruId;
  set('guru-nama-inp',g.nama); set('guru-jabatan-inp',g.jabatan);
  set('guru-rekening-inp',g.no_rekening); set('guru-bpjs-no-inp',g.no_bpjs);
  set('guru-gaji-inp',g.gaji_pokok); set('guru-honor-inp',g.honor_per_jam);
  set('guru-tunjangan-inp',g.tunjangan); set('guru-makan-inp',g.uang_makan_per_hari);
  set('guru-transport-inp',g.transport_per_hari); set('guru-insentif-inp',g.insentif);
  set('guru-bpjs-kes-inp',g.bpjs_kes); set('guru-bpjs-tk-inp',g.bpjs_tk);
  set('guru-potongan-lain-inp',g.potongan_lain);
  openModal('modal-guru');
}


function lunaskanKasbon(guruId, kasbonId) {
  const d = getD();
  const g = d.keuangan_guru.find(x=>x.id===guruId);
  if (!g) return;
  const k = (g.kasbon_list||[]).find(x=>x.id===kasbonId);
  if (!k) return;
  k.status='lunas'; k.jumlah_sisa=0; k.tgl_lunas=new Date().toISOString();
  saveDB(); showNotif(`✅ Kasbon ${g.nama} dilunasi!`,'ok');
  renderGuruTabKasbon(g);
  if(currentPage==='guru')renderGuru();
}


Object.assign(globalThis, { renderGuru, resetGuruForm, tambahGuru, simpanJam, bayarGuru, batalBayarGuru, bayarSemuaGuru, hapusGuru, simpanKasbon, simpanPayrollConfig, editGuruFromDetail, lunaskanKasbon });
export { renderGuru, resetGuruForm, tambahGuru, simpanJam, bayarGuru, batalBayarGuru, bayarSemuaGuru, hapusGuru, simpanKasbon, simpanPayrollConfig, editGuruFromDetail, lunaskanKasbon };
