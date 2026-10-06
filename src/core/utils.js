// Petits outils partagés
export const W = 360, H = 640, HUD = 46;   // zone de jeu « logique » (le rendu se fait en 180×320 pixels)
export const $ = s => document.querySelector(s);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const rnd = (a, b) => a + Math.random() * (b - a);
export function hash(a, b) { let h = (a * 374761393 + b * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
// tirage pondéré : pick([['a', 3], ['b', 1]])
export function pick(list) { let s = 0; list.forEach(([, w]) => s += w); let r = Math.random() * s; for (const [k, w] of list) if ((r -= w) < 0) return k; return list[0][0]; }
export const shuffle = a => a.slice().sort(() => Math.random() - .5);
