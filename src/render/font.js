// ============================================================
//  MINI-POLICE PIXEL 3×5 — pour le HUD, les notifications et les
//  petits chiffres qui s'envolent. Majuscules uniquement (les accents
//  sont retirés automatiquement). 1 pixel d'espace entre les lettres.
//  Pour ajouter un caractère : 5 lignes de même largeur, '#' = pixel allumé.
// ============================================================
const G = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['.##', '#..', '#..', '#..', '.##'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'], E: ['###', '#..', '##.', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'],
  G: ['.##', '#..', '#.#', '#.#', '.##'], H: ['#.#', '#.#', '###', '#.#', '#.#'], I: ['###', '.#.', '.#.', '.#.', '###'],
  J: ['..#', '..#', '..#', '#.#', '.#.'], K: ['#.#', '#.#', '##.', '#.#', '#.#'], L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'], N: ['#..#', '##.#', '#.##', '#..#', '#..#'], O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
  P: ['##.', '#.#', '##.', '#..', '#..'], Q: ['.#.', '#.#', '#.#', '##.', '.##'], R: ['##.', '#.#', '##.', '#.#', '#.#'],
  S: ['.##', '#..', '.#.', '..#', '##.'], T: ['###', '.#.', '.#.', '.#.', '.#.'], U: ['#.#', '#.#', '#.#', '#.#', '###'],
  V: ['#.#', '#.#', '#.#', '#.#', '.#.'], W: ['#...#', '#...#', '#.#.#', '##.##', '#...#'], X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], Z: ['###', '..#', '.#.', '#..', '###'],
  0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['##.', '..#', '.#.', '#..', '###'],
  3: ['##.', '..#', '.#.', '..#', '##.'], 4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '##.', '..#', '##.'],
  6: ['.##', '#..', '###', '#.#', '###'], 7: ['###', '..#', '.#.', '.#.', '.#.'], 8: ['###', '#.#', '###', '#.#', '###'],
  9: ['###', '#.#', '###', '..#', '##.'],
  '.': ['.', '.', '.', '.', '#'], ',': ['.', '.', '.', '#', '#'], '!': ['#', '#', '#', '.', '#'], '?': ['##.', '..#', '.#.', '...', '.#.'],
  ':': ['.', '#', '.', '#', '.'], ';': ['.', '#', '.', '#', '#'], "'": ['#', '#', '.', '.', '.'], '"': ['#.#', '#.#', '...', '...', '...'],
  '-': ['...', '...', '###', '...', '...'], '+': ['...', '.#.', '###', '.#.', '...'], '=': ['...', '###', '...', '###', '...'],
  '%': ['#.#', '..#', '.#.', '#..', '#.#'], '/': ['..#', '..#', '.#.', '#..', '#..'], '(': ['.#', '#.', '#.', '#.', '.#'],
  ')': ['#.', '.#', '.#', '.#', '#.'], '>': ['#..', '.#.', '..#', '.#.', '#..'], '<': ['..#', '.#.', '#..', '.#.', '..#'],
  '*': ['#.#', '.#.', '#.#', '...', '...'], '°': ['##', '##', '..', '..', '..'], '#': ['#.#', '###', '#.#', '###', '#.#'],
  '_': ['...', '...', '...', '...', '###'], '&': ['.#.', '#.#', '.#.', '#.#', '.##'], '$': ['.##', '##.', '.#.', '.##', '##.'],
  ' ': ['..', '..', '..', '..', '..']
};
// Équivalences (guillemets, apostrophes typographiques, symboles…)
const ALIAS = { '«': '"', '»': '"', '’': "'", '‘': "'", '“': '"', '”': '"', '…': '...', '—': '-', '–': '-', '−': '-', '×': 'X', '·': '.', 'Œ': 'OE', 'Æ': 'AE', 'ß': 'SS', '€': 'E', ' ': ' ', ' ': ' ' };

// Normalise le texte : majuscules, sans accents, caractères inconnus → '?'
export function tinyNorm(s) {
  let out = '';
  for (const ch of String(s).toUpperCase()) {
    if (G[ch]) { out += ch; continue; }
    if (ALIAS[ch]) { out += ALIAS[ch]; continue; }
    const base = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
    out += G[base] ? base : ALIAS[base] || '?';
  }
  return out;
}
export const TINY_H = 5;
// Largeur en pixels d'un texte
export function tinyW(s) { let w = 0; for (const ch of tinyNorm(s)) w += G[ch][0].length + 1; return Math.max(0, w - 1); }

const CACHE = new Map();
// Renvoie un petit canvas contenant le texte dans la couleur demandée (mis en cache)
export function tiny(s, col = '#F8F8F8') {
  const key = col + '|' + s;
  let c = CACHE.get(key);
  if (c) return c;
  if (CACHE.size > 500) CACHE.clear();
  const t = tinyNorm(s);
  c = document.createElement('canvas'); c.width = Math.max(1, tinyW(s)); c.height = TINY_H;
  const g = c.getContext('2d'); g.fillStyle = col;
  let x = 0;
  for (const ch of t) {
    const rows = G[ch];
    rows.forEach((r, y) => { for (let i = 0; i < r.length; i++) if (r[i] === '#') g.fillRect(x + i, y, 1, 1); });
    x += rows[0].length + 1;
  }
  CACHE.set(key, c);
  return c;
}
// Dessine le texte. align : 'left' | 'center' | 'right' · shadow : couleur de l'ombre (ou null)
export function drawTiny(g, s, x, y, col = '#F8F8F8', align = 'left', shadow = '#000000') {
  if (!s) return 0;
  const c = tiny(s, col), w = c.width;
  const x0 = Math.round(align === 'center' ? x - w / 2 : align === 'right' ? x - w : x), y0 = Math.round(y);
  if (shadow) g.drawImage(tiny(s, shadow), x0 + 1, y0 + 1);
  g.drawImage(c, x0, y0);
  return w;
}
// Coupe un texte en lignes de largeur maximale maxW pixels
export function tinyWrap(s, maxW) {
  const out = []; let cur = '';
  for (const word of String(s).split(/\s+/).filter(Boolean)) {
    const next = cur ? cur + ' ' + word : word;
    if (tinyW(next) <= maxW) { cur = next; continue; }
    if (cur) out.push(cur);
    // mot trop long : on le coupe
    let w = word;
    while (tinyW(w) > maxW) { let k = w.length - 1; while (k > 1 && tinyW(w.slice(0, k)) > maxW) k--; out.push(w.slice(0, k)); w = w.slice(k); }
    cur = w;
  }
  if (cur) out.push(cur);
  return out;
}
