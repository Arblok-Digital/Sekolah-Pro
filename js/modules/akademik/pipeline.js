// js/modules/akademik/pipeline.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

function logAkademik(tipe, keterangan, data) {
  const d = getAkademikCfg();
  if (!d.akademik_config.log_akademik) d.akademik_config.log_akademik = [];
  d.akademik_config.log_akademik.unshift({
    id: 'AKD' + Date.now(),
    tipe, keterangan,
    data: data || null,
    waktu: new Date().toISOString(),
    ta: d.akademik_config.tahun_ajaran_aktif,
    semester: d.akademik_config.semester
  });
  // Keep last 100 logs
  if (d.akademik_config.log_akademik.length > 100)
    d.akademik_config.log_akademik = d.akademik_config.log_akademik.slice(0, 100);
}

// ── RENDER AKADEMIK PAGE ─────────────

function simpanKonfigAkademik() {
  const ta = (document.getElementById('akd-ta-inp') || { value: '' }).value.trim();
  const sem = (document.getElementById('akd-sem-inp') || { value: 'Ganjil' }).value;
  const kmax = parseInt((document.getElementById('akd-kelas-max-inp') || { value: '6' }).value) || 6;
  if (!ta || !/\d{4}\/\d{4}/.test(ta)) { showNotif('Format Tahun Ajaran: YYYY/YYYY (contoh: 2025/2026)', 'err'); return; }

  const d = getAkademikCfg();
  const oldTA = d.akademik_config.tahun_ajaran_aktif;
  const isNewTA = oldTA && oldTA !== ta;

  if (isNewTA) {
    // Archive current year's SPP data before resetting
    if (confirm(`Tahun Ajaran berubah dari ${oldTA} ke ${ta}.\nData SPP tahun ini akan diarsip. Lanjutkan?`)) {
      arsipkanSPPTahunIni(oldTA, d);
    } else return;
  }

  d.akademik_config.tahun_ajaran_aktif = ta;
  d.akademik_config.semester = sem;
  d.akademik_config.kelas_max = kmax;
  // Sync to profil_sekolah
  d.profil_sekolah.tahun_ajaran = ta;

  logAkademik('config', `Tahun Ajaran diubah ke ${ta} Semester ${sem}`, { ta, sem, kmax });
  saveDB(); buildTicker(); closeModal('modal-akd-config');
  showNotif(`✅ Tahun Ajaran ${ta} Semester ${sem} tersimpan!`, 'ok');
  renderAkademik();
  // Sync banner
  const taEl = document.getElementById('banner-ta');
  if (taEl) taEl.textContent = 'T.A. ' + ta;
}


function arsipkanSPPTahunIni(tahunLama, d) {
  if (!d.akademik_config.history_ta) d.akademik_config.history_ta = [];
  if (!d.akademik_config.spp_arsip) d.akademik_config.spp_arsip = {};

  const riwayatSPP = d.riwayat_spp || [];
  const totalSPP = riwayatSPP.reduce((a, x) => a + (x.jumlah || 0), 0);

  d.akademik_config.spp_arsip[tahunLama] = {
    total_masuk: totalSPP,
    detail: riwayatSPP.slice()
  };

  // Reset riwayat SPP untuk tahun baru
  d.riwayat_spp = [];

  logAkademik('arsip', `SPP T.A. ${tahunLama} diarsip. Total: ${fmt(totalSPP)}`, { tahun: tahunLama, total: totalSPP });
  addAktivitas('spp', `📦 SPP T.A. ${tahunLama} diarsip: ${fmt(totalSPP)}`, 0);
}

// ── KENAIKAN KELAS ────────────────────

function eksekusiKenaikanKelas() {
  const btn = document.getElementById('knf-execute-btn');
  if (btn && btn.disabled) return;

  const d = getAkademikCfg();
  const cfg = d.akademik_config;
  const kelasMax = cfg.kelas_max || 6;
  const ta = cfg.tahun_ajaran_aktif;
  const sem = cfg.semester;

  let naik = 0, lulus = 0, skipped = 0;
  const alumniDibuat = [];

  // Process each active student
  d.data_siswa.forEach(s => {
    // Skip non-active
    if (s.status_akademik && s.status_akademik !== 'Aktif') { skipped++; return; }

    const level = getKelasNum(s.kelas);
    if (!level) { skipped++; return; }

    if (level >= kelasMax) {
      // Kelas max → LULUS
      s.status_akademik = 'Lulus';
      s.tahun_lulus = new Date().getFullYear();
      s.ta_lulus = ta;
      s.status_spp = s.status_spp || 'Lunas'; // keep existing

      // Compute average nilai
      const allNilai = [...((s.nilai || {})['1'] || []), ...((s.nilai || {})['2'] || [])];
      const byM = {};
      allNilai.forEach(n => { if (!byM[n.mapel]) byM[n.mapel] = []; byM[n.mapel].push(n.nilai); });
      const avgs = Object.values(byM).map(v => v.reduce((a, b) => a + b, 0) / v.length);
      const avgNilai = avgs.length ? (avgs.reduce((a, b) => a + b, 0) / avgs.length).toFixed(1) : null;

      // Add to alumni
      if (!d.alumni) d.alumni = [];
      const existAlumni = d.alumni.find(al => al.data_siswa_id === s.id);
      if (!existAlumni) {
        d.alumni.push({
          id: 'AL' + Date.now() + Math.random().toString(36).slice(2, 5),
          nama: s.nama, nisn: s.nisn,
          tahun_lulus: new Date().getFullYear(),
          kelas_terakhir: s.kelas,
          nilai_rata: avgNilai,
          sekolah_lanjutan: '',
          status: 'lanjut',
          prestasi: '',
          tgl_input: new Date().toISOString(),
          data_siswa_id: s.id
        });
        alumniDibuat.push(s.nama);
      }
      lulus++;
    } else {
      // Naik ke kelas berikutnya — pertahankan rombel
      s.kelas = buildNextKelas(s.kelas);
      naik++;
    }
  });

  // Arsip snapshot tahun ajaran ini
  if (!cfg.history_ta) cfg.history_ta = [];
  cfg.history_ta.push({
    tahun_ajaran: ta,
    semester: sem,
    nama_sekolah: d.profil_sekolah.nama,
    total_siswa: d.data_siswa.length,
    total_lulus: lulus,
    total_naik: naik,
    total_skipped: skipped,
    total_spp: (d.riwayat_spp || []).reduce((a, x) => a + (x.jumlah || 0), 0),
    waktu_arsip: new Date().toISOString(),
    alumni: alumniDibuat
  });

  logAkademik('kenaikan',
    `Kenaikan kelas T.A. ${ta}: ${naik} naik, ${lulus} lulus, ${skipped} dilewati`,
    { naik, lulus, skipped, alumni: alumniDibuat.length }
  );
  addAktivitas('siswa', `🔁 Kenaikan kelas massal T.A. ${ta}: ${naik} naik, ${lulus} lulus`, 0);

  saveDB(); buildTicker(); closeModal('modal-akd-kenaikan');

  showNotif(`🎉 Selesai! ${naik} siswa naik kelas, ${lulus} siswa lulus.`, 'ok');

  // Refresh semua halaman terkait
  renderAkademik();
  renderCRM();
  if (currentPage === 'dashboard') renderDashboard();
}

// ── MUTASI SISWA ─────────────────────

function simpanMutasi() {
  const siswaId = document.getElementById('mutasi-siswa-id').value;
  const statusBaru = document.getElementById('mutasi-status-sel').value;
  const tgl = document.getElementById('mutasi-tgl-inp').value;
  const alasan = (document.getElementById('mutasi-alasan-inp') || { value: '' }).value.trim();
  const tujuan = (document.getElementById('mutasi-tujuan-inp') || { value: '' }).value.trim();

  const d = getAkademikCfg();
  const s = d.data_siswa.find(x => x.id === siswaId);
  if (!s) return;

  const statusLama = s.status_akademik || 'Aktif';
  s.status_akademik = statusBaru;
  s.mutasi_alasan = alasan;
  s.mutasi_tujuan = tujuan;
  s.mutasi_tgl = tgl;
  // Tetap aktif di daftar siswa, status berubah — histori SPP tidak dihapus

  // Log mutasi
  if (!d.akademik_config.mutasi_log) d.akademik_config.mutasi_log = [];
  d.akademik_config.mutasi_log.unshift({
    id: 'MUT' + Date.now(),
    siswa_id: siswaId, nama: s.nama, kelas: s.kelas,
    status_lama: statusLama, status_baru: statusBaru,
    alasan, tujuan, tgl,
    waktu: new Date().toISOString()
  });

  logAkademik('mutasi',
    `Mutasi ${s.nama}: ${statusLama} → ${statusBaru}${alasan ? ' (' + alasan + ')' : ''}`,
    { siswaId, statusLama, statusBaru, alasan, tujuan }
  );
  addAktivitas('siswa', `🚌 Mutasi ${s.nama}: ${statusLama} → ${statusBaru}`, 0);

  saveDB(); closeModal('modal-mutasi');
  showNotif(`✅ Mutasi ${s.nama}: ${statusLama} → ${statusBaru}`, 'ok');
  renderMutasiList();
  renderAkademik();
  renderCRM();
}

// ── ARSIP VIEWER ────────────────────

Object.assign(globalThis, { logAkademik, simpanKonfigAkademik, arsipkanSPPTahunIni, eksekusiKenaikanKelas, simpanMutasi });
export { logAkademik, simpanKonfigAkademik, arsipkanSPPTahunIni, eksekusiKenaikanKelas, simpanMutasi };
