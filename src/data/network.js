import { CFG } from '../config.js';

// ============================================================
//  RÉSEAU — les 5 lignes de RER et leurs stations principales.
//  Pour ajouter une station : son nom dans NAMES, sa place dans LINE_ST,
//  sa position sur le plan dans ui/screens.js (MAPPOS).
//  Les noms de stations restent en français dans toutes les langues.
// ============================================================
export const LINE_ST = {
  A: ['saintgermain', 'ladefense', 'etoile', 'auber', 'chatelet', 'gdl', 'nation', 'vincennes', 'valdefontenay', 'marne'],
  B: ['cdg', 'gdn', 'chatelet', 'stmichel', 'luxembourg', 'denfert', 'massy', 'saintremy'],
  C: ['versailles', 'champdemars', 'invalides', 'orsay', 'stmichel', 'austerlitz', 'bnf', 'juvisy'],
  D: ['creil', 'stadefrance', 'gdn', 'chatelet', 'gdl', 'juvisy', 'corbeil'],
  E: ['nanterre', 'ladefense', 'portemaillot', 'haussmann', 'gdn', 'pantin', 'rosny', 'valdefontenay', 'tournan']
};
export const NAMES = {
  saintgermain: 'Saint-Germain-en-Laye', ladefense: 'La Défense', etoile: 'Charles de Gaulle–Étoile', auber: 'Auber', chatelet: 'Châtelet–Les Halles',
  gdl: 'Gare de Lyon', nation: 'Nation', vincennes: 'Vincennes', valdefontenay: 'Val de Fontenay', marne: 'Marne-la-Vallée–Chessy',
  cdg: 'Aéroport CDG', gdn: 'Gare du Nord', stmichel: 'Saint-Michel–Notre-Dame', luxembourg: 'Luxembourg', denfert: 'Denfert-Rochereau',
  massy: 'Massy-Palaiseau', saintremy: 'Saint-Rémy-lès-Chevreuse', versailles: 'Versailles-Château', champdemars: 'Champ de Mars–Tour Eiffel',
  invalides: 'Invalides', orsay: 'Musée d\'Orsay', austerlitz: 'Gare d\'Austerlitz', bnf: 'Bibliothèque F. Mitterrand', juvisy: 'Juvisy',
  creil: 'Creil', stadefrance: 'Stade de France–Saint-Denis', corbeil: 'Corbeil-Essonnes', nanterre: 'Nanterre–La Folie',
  portemaillot: 'Porte Maillot', haussmann: 'Haussmann–Saint-Lazare', pantin: 'Pantin', rosny: 'Rosny-Bois-Perrier', tournan: 'Tournan'
};
export const ST = {};
Object.keys(NAMES).forEach(id => ST[id] = { n: NAMES[id] });
Object.entries(LINE_ST).forEach(([L, list]) => list.forEach((id, i) => ST[id][L] = i));
export const LINES = {
  A: { c: '#E3051C', ink: '#FFFFFF' }, B: { c: '#5291CE', ink: '#FFFFFF' }, C: { c: '#FFCE00', ink: '#1D2A5C' },
  D: { c: '#00814F', ink: '#FFFFFF' }, E: { c: '#C04191', ink: '#FFFFFF' }
};
Object.entries(LINE_ST).forEach(([L, list]) => { LINES[L].dir = { '-1': NAMES[list[0]], '1': NAMES[list[list.length - 1]] }; });
export const TERM = { saintgermain: 'ST-GERMAIN', marne: 'CHESSY', cdg: 'CDG', saintremy: 'ST-RÉMY', versailles: 'VERSAILLES', juvisy: 'JUVISY',
               creil: 'CREIL', corbeil: 'CORBEIL', nanterre: 'NANTERRE', tournan: 'TOURNAN' };
export const linesOf = id => Object.keys(LINE_ST).filter(L => L in ST[id]);
// Itinéraire : compromis entre nombre de stations et correspondances (une correspondance « coûte » 3 stations)
export function computeLegs(a, b) {
  const key = (s, L) => s + '|' + L, dist = {}, prev = {}, open = [];
  linesOf(a).forEach(L => { dist[key(a, L)] = 0; open.push([0, a, L]); });
  while (open.length) {
    open.sort((x, y) => x[0] - y[0]);
    const [d, s, L] = open.shift();
    if (d > dist[key(s, L)]) continue;
    if (s === b) { // reconstruction
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

// Nom court du terminus pour les panneaux pixel
export const DSHORT = {}; Object.keys(TERM).forEach(id => DSHORT[NAMES[id]] = TERM[id]);
