// js/modules/komunikasi/logic.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

function getKomDB() {
  const d = getD();
  if (!d.komunikasi) d.komunikasi = { pesan: [], broadcast: [] };
  return d;
}


globalThis.WA_TEMPLATES = {
  tagihan: `Assalamualaikum Wr. Wb.\nYth. Bapak/Ibu Orang Tua/Wali Siswa,\n\nDengan hormat, kami mengingatkan bahwa pembayaran SPP bulan ini belum kami terima. Mohon segera melakukan pembayaran.\n\nTerima kasih atas perhatiannya.\n\nHormat kami,\n*{sekolah}*`,
  agenda: `Assalamualaikum Wr. Wb.\nYth. Bapak/Ibu Orang Tua/Wali Siswa,\n\nKami ingin menginformasikan agenda kegiatan sekolah:\n📅 [Nama Kegiatan]\n🗓 [Tanggal]\n📍 [Tempat]\n\nMohon perhatian dan dukungannya.\n\nTerima kasih.\n*{sekolah}*`,
  prestasi: `Assalamualaikum Wr. Wb.\nYth. Bapak/Ibu Orang Tua {nama},\n\n🎉 Selamat! Putra/putri Anda telah meraih prestasi membanggakan!\n\nKami bangga atas pencapaian {nama} dan berharap dapat terus berprestasi.\n\nTerima kasih.\n*{sekolah}*`,
  libur: `Assalamualaikum Wr. Wb.\nYth. Bapak/Ibu Orang Tua/Wali Siswa,\n\n🏖️ *PENGUMUMAN HARI LIBUR*\n\nDiberitahukan bahwa sekolah akan LIBUR pada:\n📅 [Tanggal]\nKarena: [Alasan]\n\nKegiatan belajar mengajar kembali normal pada: [Tanggal]\n\nTerima kasih.\n*{sekolah}*`
};


function bukaWA(hp, pesan) {
  const num = hp.replace(/[^0-9]/g,'').replace(/^0/, '62');
  const url = `https://wa.me/${num}${pesan ? '?text='+pesan : ''}`;
  window.open(url, '_blank');
}


Object.assign(globalThis, { getKomDB, bukaWA });
export { getKomDB, bukaWA };
