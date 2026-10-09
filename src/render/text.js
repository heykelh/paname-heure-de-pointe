// ============================================================
//  TEXTE PIXEL (police Press Start 2P) : rendu net, sans flou.
//  La police est dessinée une fois puis « binarisée » (pixels pleins
//  ou vides, sans l'anti-crénelage du navigateur). Résultats en cache.
// ============================================================
import { ctx } from '../core/canvas.js';
import { ENAMEL, F8 } from './sprites.js';

const GLYPHS = new Map();
export function crisp(s, col) {
  const key = col + '|' + s;
  let c = GLYPHS.get(key);
  if (c) return c;
  if (GLYPHS.size > 400) GLYPHS.clear();
  ctx.font = F8;
  const w = Math.max(1, Math.ceil(ctx.measureText(s).width) + 1), h = 9;
  c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.font = F8; g.textBaseline = 'top'; g.fillStyle = '#fff'; g.fillText(s, 0, 0);
  const img = g.getImageData(0, 0, w, h), d = img.data;
  const r = parseInt(col.slice(1, 3), 16), gg = parseInt(col.slice(3, 5), 16), b = parseInt(col.slice(5, 7), 16);
  for (let i = 0; i < d.length; i += 4) { const on = d[i + 3] > 100; d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = on ? 255 : 0; }
  g.putImageData(img, 0, 0);
  GLYPHS.set(key, c);
  return c;
}
export function textWidth(s) { return crisp(s, '#FFFFFF').width - 1; }
// Texte avec une ombre noire d'un pixel. align : 'left' | 'center' | 'right'
export function txt(s, x, y, col = '#F8F8F8', align = 'left') {
  const c = crisp(s, col), sh = crisp(s, '#000000');
  const x0 = Math.round(align === 'center' ? x - (c.width - 1) / 2 : align === 'right' ? x - c.width + 1 : x), y0 = Math.round(y);
  ctx.drawImage(sh, x0 + 1, y0 + 1); ctx.drawImage(c, x0, y0);
}
export function box(x, y, w, h, bg = ENAMEL, border = '#F8F8F8') { ctx.fillStyle = border; ctx.fillRect(x, y, w, h); ctx.fillStyle = bg; ctx.fillRect(x + 1, y + 1, w - 2, h - 2); }
// Plaque émaillée bleue (style panneau de métro)
export function plaque(text, cx, y) { const w = textWidth(text) + 10; ctx.fillStyle = '#000'; ctx.fillRect(Math.round(cx - w / 2) - 1, y - 1, w + 2, 16); box(Math.round(cx - w / 2), y, w, 14); txt(text, cx, y + 4, '#F8F8F8', 'center'); }
