// js/modules/jadwal/logic.js — diekstrak dari index.html oleh scripts/_js.mjs (dipindah, bukan ditulis ulang).
// Semua deklarasi top-level dipublikasikan ke globalThis sesuai semantik script lama.

function getJadwalDB() {
  const d = getD();
  if (!d.jadwal) d.jadwal = {};
  if (!d.jadwal_slots) d.jadwal_slots = [
    {id:'s1',mulai:'07:00',selesai:'07:40',label:'Jam 1'},
    {id:'s2',mulai:'07:40',selesai:'08:20',label:'Jam 2'},
    {id:'s3',mulai:'08:20',selesai:'09:00',label:'Jam 3'},
    {id:'s4',mulai:'09:00',selesai:'09:15',label:'Istirahat'},
    {id:'s5',mulai:'09:15',selesai:'09:55',label:'Jam 4'},
    {id:'s6',mulai:'09:55',selesai:'10:35',label:'Jam 5'},
    {id:'s7',mulai:'10:35',selesai:'11:15',label:'Jam 6'},
  ];
  return d;
}


globalThis.HARI_NAMES = ['','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

globalThis.MAPEL_CELL_COLORS = ['filled','filled-blu','filled-pur','filled-yel'];

globalThis.MAPEL_COLOR_MAP = {};

globalThis._mapelColorIdx = 0;

function getMapelColor(mapel) {
  if (!MAPEL_COLOR_MAP[mapel]) {
    MAPEL_COLOR_MAP[mapel] = MAPEL_CELL_COLORS[_mapelColorIdx % MAPEL_CELL_COLORS.length];
    _mapelColorIdx++;
  }
  return MAPEL_COLOR_MAP[mapel];
}


Object.assign(globalThis, { getJadwalDB, getMapelColor });
export { getJadwalDB, getMapelColor };
