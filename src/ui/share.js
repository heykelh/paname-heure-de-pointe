// ============================================================
//  CARTE DE PARTAGE — une image 720×1280 (format story) dessinée en
//  pixel art : titre drôle, note, score, trajet, mode. Parfait pour
//  Instagram, TikTok, WhatsApp… c'est le moteur viral du jeu.
// ============================================================
import { ST } from '../data/network.js';
import { eventName, getLang, modeName, tr, trPair } from '../i18n/i18n.js';
import { drawTiny, tinyWrap } from '../render/font.js';
import { body, ENAMEL, faience, SP } from '../render/sprites.js';
import { crisp } from '../render/text.js';
import THEME from '../theme/index.js';

const GRADE_COL = { S: '#F8D878', A: '#58D854', B: '#7FE0F8', C: '#F8A050', D: '#F87858' };

// Texte Press Start agrandi d'un facteur k (reste net)
function big(g, s, x, y, col, k = 2, align = 'center') {
  const c = crisp(s, col), sh = crisp(s, '#000000'), w = c.width * k, x0 = Math.round(align === 'center' ? x - w / 2 : x);
  g.drawImage(sh, x0 + k, y + k, w, c.height * k); g.drawImage(c, x0, y, w, c.height * k);
}
// Coupe un texte en lignes de n caractères (police Press Start : 8 px par caractère)
function wrapChars(s, n) { const out = []; let cur = ''; for (const w of s.split(' ')) { if ((cur + ' ' + w).trim().length > n) { if (cur) out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); } if (cur) out.push(cur); return out; }

export function drawShareCard(run) {
  const c = document.createElement('canvas'); c.width = 180; c.height = 320;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  g.fillStyle = '#0E1530'; g.fillRect(0, 0, 180, 320);
  // bandeau carrelé + frise
  faience(g, 0, 0, 180, 46); g.fillStyle = THEME.colors.frieze; g.fillRect(0, 46, 180, 3); g.fillStyle = '#000'; g.fillRect(0, 49, 180, 1);
  g.fillStyle = '#000'; g.fillRect(31, 7, 118, 33); g.fillStyle = '#F8F8F8'; g.fillRect(32, 8, 116, 31); g.fillStyle = ENAMEL; g.fillRect(33, 9, 114, 29);
  big(g, THEME.logo, 90, 12, '#F8F8F8', 2);
  drawTiny(g, tr('title.sub'), 90, 31, '#F8D878', 'center');
  // accroche + trajet
  drawTiny(g, tr('share.img.kicker'), 90, 56, '#58D854', 'center');
  const route = wrapChars(ST[run.from].n + ' > ' + ST[run.to].n, 20).slice(0, 2);
  route.forEach((l, i) => big(g, l, 90, 66 + i * 11, '#F8F8F8', 1));
  // note + personnage
  const y0 = 94, gc = GRADE_COL[run.grade] || '#F8F8F8';
  g.fillStyle = '#F8F8F8'; g.fillRect(14, y0, 44, 44); g.fillStyle = '#000'; g.fillRect(15, y0 + 1, 42, 42);
  big(g, run.grade, 36, y0 + 8, gc, 4);
  drawTiny(g, tr('grade'), 36, y0 + 46, '#BCBCBC', 'center');
  g.fillStyle = '#1D2A5C'; g.fillRect(70, y0, 96, 44);
  const pl = body('player', undefined, 0); g.drawImage(pl, 76, y0 + 4, 24, 36);
  drawTiny(g, tr('win.score'), 108, y0 + 8, '#BCBCBC');
  big(g, String(run.score), 108, y0 + 18, '#F8D878', 1, 'left');
  if (run.record) drawTiny(g, tr('win.record'), 108, y0 + 33, '#F878F8');
  // titre drôle
  const [title, why] = trPair('ttl.' + run.titles.main.id, { n: run.titles.main.n });
  const tl = wrapChars(title, 20).slice(0, 3);
  tl.forEach((l, i) => big(g, l, 90, 152 + i * 11, '#F8D878', 1));
  tinyWrap(why, 160).slice(0, 3).forEach((l, i) => drawTiny(g, l, 90, 156 + tl.length * 11 + i * 7, '#F8F8F8', 'center'));
  // chiffres de la course
  const yS = 214;
  g.fillStyle = '#000'; g.fillRect(10, yS, 160, 40); g.fillStyle = '#1D2A5C'; g.fillRect(11, yS + 1, 158, 38);
  const cells = [[tr('win.ser'), Math.round(run.ser) + '%'], [tr('win.coins'), run.coins], [tr('win.hero'), run.hero], [tr('win.hits'), run.st.hits]];
  cells.forEach(([k, v], i) => { const x = 30 + i * 40; drawTiny(g, String(v), x, yS + 9, '#F8F8F8', 'center'); drawTiny(g, k.split(' ')[0], x, yS + 23, '#8C9AC8', 'center'); });
  g.drawImage(SP.coin[0], 67, yS + 30); g.drawImage(SP.hstar, 107, yS + 29);
  // mode + événement + mentions
  drawTiny(g, (modeName(run.mode) + ' · ' + eventName(run.event)).toUpperCase(), 90, 262, '#F8A050', 'center');
  run.titles.badges.forEach((b, i) => drawTiny(g, '* ' + trPair('ttl.' + b.id)[0], 90, 274 + i * 8, '#BCBCBC', 'center'));
  // signature
  g.fillStyle = THEME.colors.frieze; g.fillRect(0, 300, 180, 2);
  drawTiny(g, THEME.hashtag[getLang()] || THEME.hashtag.fr, 90, 307, '#F8F8F8', 'center');
  // agrandissement ×4 (pixels nets)
  const out = document.createElement('canvas'); out.width = 720; out.height = 1280;
  const o = out.getContext('2d'); o.imageSmoothingEnabled = false; o.drawImage(c, 0, 0, 720, 1280);
  return out;
}
export function shareCardBlob(run) {
  return new Promise(res => { try { drawShareCard(run).toBlob(b => res(b), 'image/png'); } catch (e) { res(null); } });
}
