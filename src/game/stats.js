// ============================================================
//  STATISTIQUES, SCORE, NOTE ET TITRE DRÔLE DE FIN DE COURSE
// ============================================================
import { store } from '../core/storage.js';
import { MODES } from '../data/modes.js';
import { GRADES, TITLES } from '../data/titles.js';

export function newStats() {
  return { hits: 0, hitBy: {}, stolen: 0, donated: 0, seatsGiven: 0, frauds: 0, fines: 0, seats: 0, straps: 0,
           pigeons: 0, yeet: 0, shiny: 0, rolex: 0, zombies: 0, pq: 0, gel: 0, items: 0, minSer: 100, bestStreak: 0 };
}

// Score : sérénité, pièces, héroïsme, éjections et raretés rapportent ; les bousculades coûtent.
export function computeScore(run) {
  const s = run.st, M = MODES[run.mode] || MODES.navigo;
  const raw = Math.round(run.ser) * 10 + run.coins * 20 + run.hero * 150 - s.hits * 30 + s.yeet * 50 + s.shiny * 500 + s.rolex * 200 + s.bestStreak * 4;
  return Math.max(0, Math.round(raw * M.scoreMul));
}
export function gradeOf(score) { for (const [g, min] of GRADES) if (score >= min) return g; return 'D'; }

// Valeur affichée dans le texte du titre ({n})
const TITLE_N = { bulle: s => s.yeet, frappe: s => s.stolen, tamponneuse: s => s.hits, limite: (s, r) => Math.round(r.ser), picsou: (s, r) => r.coins,
                  pigeons: s => s.pigeons, tchip: s => s.hitBy.tchipeur || 0 };
// Le titre principal (le plus prioritaire rempli) + jusqu'à 2 mentions
export function titlesFor(run) {
  const ok = TITLES.filter(t => t.ok(run.st, run)).sort((a, b) => b.p - a.p);
  const n = id => (TITLE_N[id] ? TITLE_N[id](run.st, run) : 0);
  return { main: { id: ok[0].id, n: n(ok[0].id) }, badges: ok.slice(1).filter(t => t.id !== 'piece').slice(0, 2).map(t => ({ id: t.id, n: n(t.id) })) };
}

// Record par mode (sauvegardé sur l'appareil)
export const bestOf = mode => store.get('best:' + mode, 0);
export function saveBest(mode, score) { const old = bestOf(mode); if (score > old) { store.set('best:' + mode, score); return true; } return false; }
