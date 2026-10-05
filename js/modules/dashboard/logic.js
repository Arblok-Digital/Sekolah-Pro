// js/modules/dashboard/logic.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

function addAktivitas(tipe, keterangan, nominal, ref_id) {
  const d = getD();
  if (!d.riwayat_aktivitas) d.riwayat_aktivitas = [];
  d.riwayat_aktivitas.push({
    id: 'ACT' + Date.now(), tipe, keterangan, nominal,
    waktu: new Date().toISOString(),
    ref_id: ref_id || null   // ID transaksi untuk link ke kwitansi
  });
  if (d.riwayat_aktivitas.length > 100) d.riwayat_aktivitas = d.riwayat_aktivitas.slice(-100);
}

// ── DASHBOARD STAT CARD ACTIONS ──────────────────────────────────
// Klik stat card → action yang relevan (multi-tenant safe)

function dashStatClick(type) {
  const d = getD();
  switch(type) {
    case 'siswa':
      // Buka CRM Siswa
      switchPage('crm');
      showNotif(`📚 ${d.data_siswa.length} siswa terdaftar`, 'ok');
      break;
    case 'lunas': {
      // Buka CRM dengan filter lunas
      switchPage('spp');
      setTimeout(() => {
        const btn = document.getElementById('biaya-filter-spp');
        if (btn) btn.click();
        showNotif(`✅ ${d.data_siswa.filter(s=>s.status_spp==='Lunas').length} siswa sudah lunas`, 'ok');
      }, 150);
      break;
    }
    case 'tunggak': {
      // Tampilkan modal list tunggakan dengan opsi tagih
      const tunggakArr = (d.data_siswa||[]).filter(s => s.status_spp === 'Tunggakan');
      if (!tunggakArr.length) {
        showNotif('✅ Tidak ada tunggakan!', 'ok'); return;
      }
      _showTunggakanModal(tunggakArr);
      break;
    }
    case 'infak':
      // Langsung buka modal catat infak
      openModal('modal-infak');
      break;
  }
}

// Popup list tunggakan dari dashboard

globalThis._dashFilter = null;


function _filterBySchool(arr) {
  // Multi-tenant guard: filter array berdasarkan schoolId
  const sid = _fbSchoolId || (getD().profil_sekolah?.schoolId) || null;
  if (!sid || _fbRole === 'dev') return arr || [];
  return (arr||[]).filter(x => !x.schoolId || x.schoolId === sid);
}


function onStatClick(type) {
  // Toggle: klik yang sama = reset
  if (_dashFilter === type) { clearDashFilter(); return; }
  _dashFilter = type;

  // Update semua stat card visual
  const map = { siswa:'sc-siswa', lunas:'sc-lunas', tunggak:'sc-tunggak', txn:'sc-txn' };
  Object.entries(map).forEach(([k,id]) => {
    const el = document.getElementById(id);
    if (!el) return;
    const isActive = k === type;
    el.style.transition = 'all .18s';
    el.style.transform  = isActive ? 'translateY(-3px)' : '';
    el.style.boxShadow  = isActive ? '0 4px 16px rgba(0,0,0,.3)' : '';
  });

  // Tampilkan filter badge di dashboard
  _showDashFilterBadge(type);

  // Scroll ke aktivitas dan filter
  const actEl = document.getElementById('aktivitas-list');
  if (actEl) actEl.scrollIntoView({ behavior:'smooth', block:'start' });
  _renderFilteredActivity(type);
}


function clearDashFilter() {
  _dashFilter = null;
  ['sc-siswa','sc-lunas','sc-tunggak','sc-txn'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.style.transform=''; el.style.boxShadow=''; }
  });
  document.getElementById('dash-filter-badge')?.remove();
  renderDashboard(); // Re-render ke state normal
}

// ── Render aktivitas dengan link kwitansi (override renderDashboard) ─

Object.assign(globalThis, { addAktivitas, dashStatClick, _filterBySchool, onStatClick, clearDashFilter });
export { addAktivitas, dashStatClick, _filterBySchool, onStatClick, clearDashFilter };
