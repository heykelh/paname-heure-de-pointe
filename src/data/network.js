// ============================================================
//  RÉSEAU — construit à partir du thème (theme/paname.js) :
//  stations, lignes, et calcul d'itinéraire avec correspondances.
//  Les noms de stations restent dans la langue du thème.
// ============================================================
import { CFG } from '../config.js';
import THEME from '../theme/index.js';

const NET = THEME.network;
export const NAMES = NET.names;
export const TERM = NET.term;
export const LINE_ST = {};
export const LINES = {};
export const ST = {};
Object.keys(NAMES).forEach(id => ST[id] = { n: NAMES[id] });
Object.entries(NET.lines).forEach(([L, def]) => {
  LINE_ST[L] = def.stations;
  LINES[L] = { c: def.c, ink: def.ink, dir: { '-1': NAMES[def.stations[0]], '1': NAMES[def.stations[def.stations.length - 1]] } };
  def.stations.forEach((id, i) => ST[id][L] = i);
});
export const linesOf = id => Object.keys(LINE_ST).filter(L => L in ST[id]);
// Nom court du terminus pour les panneaux pixel
export const DSHORT = {}; Object.keys(TERM).forEach(id => DSHORT[NAMES[id]] = TERM[id]);

// Itinéraire : compromis entre nombre de stations et correspondances (une correspondance « coûte » CFG.transferCost stations)
export function computeLegs(a, b) {
  const key = (s, L) => s + '|' + L, dist = {}, prev = {}, open = [];
  linesOf(a).forEach(L => { dist[key(a, L)] = 0; open.push([0, a, L]); });
  while (open.length) {
    open.sort((x, y) => x[0] - y[0]);
    const [d, s, L] = open.shift();
    if (d > dist[key(s, L)]) continue;
    if (s === b) {
      const path = [[s, L]]; let k = key(s, L);
      while (prev[k]) { path.unshift(prev[k]); k = key(prev[k][0], prev[k][1]); }
      const legs = []; let start = path[0];
      for (let i = 1; i <= path.length; i++) {
        const cur = path[i];
        if (!cur || cur[1] !== start[1]) {
          const end = path[i - 1], Ln = start[1];
          if (end[0] !== start[0]) { const pa = ST[start[0]][Ln], pb = ST[end[0]][Ln]; legs.push({ line: Ln, from: start[0], to: end[0], stops: Math.abs(pb - pa), dir: Math.sign(pb - pa) }); }
          start = cur;
        }
      }
      return legs;
    }
    const relax = (s2, L2, c) => { const k2 = key(s2, L2), nd = d + c; if (dist[k2] === undefined || nd < dist[k2]) { dist[k2] = nd; prev[k2] = [s, L]; open.push([nd, s2, L2]); } };
    const list = LINE_ST[L], i = ST[s][L];
    if (i > 0) relax(list[i - 1], L, 1);
    if (i < list.length - 1) relax(list[i + 1], L, 1);
    linesOf(s).forEach(L2 => { if (L2 !== L) relax(s, L2, CFG.transferCost); });
  }
  return [];
}
// Stations traversées par un tronçon (sans celle de départ)
export function stationsBetween(leg) {
  const L = leg.line, a = ST[leg.from][L], b = ST[leg.to][L], out = [];
  for (let p = a + leg.dir; leg.dir > 0 ? p <= b : p >= b; p += leg.dir) out.push(NAMES[LINE_ST[L][p]]);
  return out;
}
