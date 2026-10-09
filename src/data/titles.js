// ============================================================
//  TITRES DE FIN DE COURSE — le joueur reçoit le titre le plus
//  prioritaire dont la condition est remplie, + 2 badges.
//  Textes : i18n 'ttl.<id>' = [titre, explication].
//  s = statistiques de la course (game/stats.js), r = la course.
// ============================================================
export const TITLES = [
  { id: 'shiny',       p: 100, ok: s => s.shiny > 0 },
  { id: 'fraude',      p: 95,  ok: s => s.frauds >= 1 && s.fines === 0 },
  { id: 'zombie',      p: 92,  ok: s => (s.hitBy.zombie || 0) >= 3 },
  { id: 'pq',          p: 90,  ok: s => s.pq >= 3 },
  { id: 'bulle',       p: 88,  ok: s => s.yeet >= 6 },
  { id: 'place',       p: 86,  ok: s => s.seatsGiven >= 1 },
  { id: 'donateur',    p: 84,  ok: s => s.donated >= 2 },
  { id: 'frappe',      p: 83,  ok: s => s.stolen >= 3 },
  { id: 'amende',      p: 82,  ok: s => s.fines >= 1 },
  { id: 'rolex',       p: 80,  ok: s => s.rolex > 0 },
  { id: 'ninja',       p: 78,  ok: s => s.hits === 0 },
  { id: 'zen',         p: 76,  ok: (s, r) => r.ser >= 92 },
  { id: 'tamponneuse', p: 74,  ok: s => s.hits >= 15 },
  { id: 'limite',      p: 72,  ok: (s, r) => r.ser < 15 },
  { id: 'picsou',      p: 70,  ok: (s, r) => r.coins >= 40 },
  { id: 'strapontin',  p: 68,  ok: s => s.straps >= 1 && s.seats === s.straps },
  { id: 'pigeons',     p: 66,  ok: s => s.pigeons >= 4 },
  { id: 'shlagg',      p: 64,  ok: s => (s.hitBy.shlagg || 0) >= 3 },
  { id: 'tchip',       p: 63,  ok: s => (s.hitBy.tchipeur || 0) >= 3 },
  { id: 'greve',       p: 62,  ok: (s, r) => r.mode === 'greve' },
  { id: 'pandemie',    p: 61,  ok: (s, r) => r.mode === 'pandemie' },
  { id: 'debout',      p: 60,  ok: s => s.seats === 0 },
  { id: 'piece',       p: 10,  ok: () => true }           // titre par défaut
];
// Note finale selon le score
export const GRADES = [['S', 4500], ['A', 3200], ['B', 2200], ['C', 1300], ['D', 0]];
