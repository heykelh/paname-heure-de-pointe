// ============================================================
//  HUD (barre du haut, 180×36 pixels)
//  À gauche : humeur + jauge de sérénité, pièces, héroïsme, chrono,
//             ligne, et les effets actifs (feuille, Pardon, bulle).
//  À droite : la carte de notification (avatar + nom + réplique),
//             ou l'objectif en cours quand il ne se passe rien.
// ============================================================
import { CFG } from '../config.js';
import { ctx } from '../core/canvas.js';
import { game } from '../core/state.js';
import { DSHORT, LINES, ST } from '../data/network.js';
import { eventName, modeName, tr } from '../i18n/i18n.js';
import { drawTiny, tinyW, tinyWrap } from './font.js';
import { body, drawEnt, ENAMEL, SP } from './sprites.js';
import { crisp, txt } from './text.js';

export const HUD_PX = 36;
const hud = { ghost: 100, ghostWait: 0, last: 100, heal: 0, run: null };

/* ---------- Visage d'humeur (9×9) ---------- */
function face(x, y, ser, t) {
  const col = ser > 50 ? '#F8D878' : ser > 25 ? '#F8A050' : '#F87858';
  ctx.fillStyle = '#000'; ctx.fillRect(x + 2, y, 5, 9); ctx.fillRect(x + 1, y + 1, 7, 7); ctx.fillRect(x, y + 2, 9, 5);
  ctx.fillStyle = col; ctx.fillRect(x + 2, y + 1, 5, 7); ctx.fillRect(x + 1, y + 2, 7, 5);
  ctx.fillStyle = '#F8F8F8'; ctx.fillRect(x + 2, y + 2, 1, 1);    // reflet
  ctx.fillStyle = '#000';
  const blink = Math.floor(t * 10) % 37 === 0;
  if (!blink) { ctx.fillRect(x + 3, y + 3, 1, 2); ctx.fillRect(x + 5, y + 3, 1, 2); } else { ctx.fillRect(x + 3, y + 4, 1, 1); ctx.fillRect(x + 5, y + 4, 1, 1); }
  if (ser > 70) { ctx.fillRect(x + 2, y + 5, 1, 1); ctx.fillRect(x + 6, y + 5, 1, 1); ctx.fillRect(x + 3, y + 6, 3, 1); }          // sourire
  else if (ser > 45) ctx.fillRect(x + 3, y + 6, 3, 1);                                                                            // neutre
  else if (ser > 25) { ctx.fillRect(x + 3, y + 5, 3, 1); ctx.fillRect(x + 2, y + 6, 1, 1); ctx.fillRect(x + 6, y + 6, 1, 1);        // inquiet + goutte
    ctx.fillStyle = '#7FE0F8'; ctx.fillRect(x + 8, y + 1 + Math.floor(t * 3) % 3, 1, 2); }
  else { ctx.fillRect(x + 2, y + 2, 2, 1); ctx.fillRect(x + 5, y + 2, 2, 1); ctx.fillRect(x + 3, y + 6, 3, 1); ctx.fillRect(x + 4, y + 5, 1, 1);   // furieux + vapeur
    if (Math.floor(t * 4) % 2) { ctx.fillStyle = '#F8F8F8'; ctx.fillRect(x - 1, y - 1, 2, 1); ctx.fillRect(x + 8, y - 1, 2, 1); } }
}

/* ---------- Jauge de sérénité, lisse et arrondie ---------- */
function serBar(x, y, w, h, ser, dt, t) {
  // traînée blanche après un choc (elle rattrape la vraie valeur après un court délai)
  if (ser < hud.last - .01) hud.ghostWait = .35;
  if (ser > hud.last + .3) hud.heal = .4;
  hud.last = ser;
  if (ser >= hud.ghost) hud.ghost = ser; else if ((hud.ghostWait -= dt) <= 0) hud.ghost = Math.max(ser, hud.ghost - 30 * dt);
  hud.heal = Math.max(0, hud.heal - dt);
  const pal = ser > 50 ? ['#2FD0A8', '#8AF8D8', '#17907A'] : ser > 25 ? ['#F2C230', '#F8E890', '#B08410'] : ['#E83A2A', '#F89880', '#981808'];
  const low = ser <= 25 && Math.floor(t * 6) % 2;
  // cadre aux coins arrondis
  ctx.fillStyle = '#000'; ctx.fillRect(x + 1, y, w - 2, h); ctx.fillRect(x, y + 1, w, h - 2);
  ctx.fillStyle = '#0B1026'; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  const iw = w - 2, ih = h - 2, fill = Math.round(iw * ser / 100), ghost = Math.round(iw * hud.ghost / 100);
  if (ghost > fill) { ctx.fillStyle = '#F8F8F8'; ctx.fillRect(x + 1 + fill, y + 1, ghost - fill, ih); }
  if (fill > 0) {
    ctx.fillStyle = low ? pal[1] : pal[0]; ctx.fillRect(x + 1, y + 1, fill, ih);
    ctx.fillStyle = pal[1]; ctx.fillRect(x + 1, y + 1, fill, 1); ctx.fillRect(x + 2, y + 2, Math.max(0, fill - 2), 1);   // reflet
    ctx.fillStyle = pal[2]; ctx.fillRect(x + 1, y + ih, fill, 1);                                                      // ombre
    const sh = Math.floor((t * 40) % (iw + 20)) - 10;                                                                   // éclat qui glisse
    if (sh > 0 && sh < fill - 2) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x + 1 + sh, y + 2, 2, 1); }
    if (hud.heal > 0) { ctx.fillStyle = '#F8F8F8'; ctx.fillRect(x + fill - 1, y + 1, 2, ih); }
  }
  // repères discrets à 25 / 50 / 75 %
  ctx.fillStyle = 'rgba(0,0,0,.35)'; for (const k of [.25, .5, .75]) ctx.fillRect(x + 1 + Math.round(iw * k), y + ih, 1, 1);
}

/* ---------- Effets actifs ---------- */
function effects(x, y, pl, t) {
  const list = [];
  if (pl.pardon > 0) list.push([SP.handsMini, pl.pardon / CFG.pardon.duration, '#F8D878', pl.pardon]);
  if (pl.aura > 0) list.push([SP.bubbleMini, pl.aura / CFG.aura.duration, '#7FE0F8', pl.aura]);
  if (pl.boost > 0) list.push([SP.leaf, pl.boost / CFG.leaf.duration, '#58D854', pl.boost]);
  list.slice(0, 3).forEach(([img, k, col, left], i) => {
    const px = x + i * 31;
    if (left < 2 && Math.floor(t * 8) % 2) return;   // clignote quand ça se termine
    ctx.drawImage(img, px, y);
    ctx.fillStyle = '#000'; ctx.fillRect(px + 9, y + 2, 20, 4);
    ctx.fillStyle = col; ctx.fillRect(px + 10, y + 3, Math.max(1, Math.round(18 * k)), 2);
  });
  return list.length;
}

/* ---------- Carte de notification (ou objectif) ---------- */
function objective() {
  const P = game.phase, run = game.run, leg = run.legs[run.leg];
  const lineTxt = 'RER ' + leg.line + ' > ' + DSHORT[LINES[leg.line].dir[leg.dir]];
  if (P.kind === 1) return P.gatePassed === false ? [tr('hud.gates'), lineTxt] : [tr('hud.goQuai', { d: DSHORT[LINES[leg.line].dir[leg.dir]] }), lineTxt];
  if (P.kind === 2) return [P.station ? P.station : tr('hud.next', { s: P.nextStop || '' }), lineTxt];
  return [tr('hud.goExit', { s: '' }).trim(), ST[run.to].n];
}
function card(x, y, w, h, t) {
  const N = game.notes, n = N.cur;
  const fresh = n && n.t < .18;
  ctx.fillStyle = fresh ? n.col : '#F8F8F8'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#0B1026'; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  // avatar
  const ax = x + 2, ay = y + 2, aw = 16, ah = h - 4;
  ctx.fillStyle = n ? '#3A4A80' : '#1D2A5C'; ctx.fillRect(ax, ay, aw, ah);
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(ax, ay + ah - 6, aw, 6);   // petit sol
  ctx.save(); ctx.beginPath(); ctx.rect(ax, ay, aw, ah); ctx.clip();
  const cx = ax + aw / 2, cy = ay + ah - 9;
  if (n && n.ent) drawEnt(ctx, n.ent, t, cx, cy);
  else if (n && n.icon) icon(n.icon, cx, ay + ah / 2, t);
  else ctx.drawImage(body('player', undefined, Math.floor(t * 3) % 2), cx - 6, cy - 12);
  ctx.restore();
  // textes (mini-police : 5 lignes)
  const tx = ax + aw + 3, tw = x + w - tx - 2;
  let title, sub, col;
  if (n) { title = n.title; sub = n.sub; col = n.col; } else { [title, sub] = objective(); col = '#F8D878'; }
  const tl = tinyWrap(title, tw).slice(0, 2), sl = tinyWrap(sub, tw).slice(0, 5 - tl.length);
  tl.forEach((l, i) => drawTiny(ctx, l, tx, y + 3 + i * 6, col, 'left', null));
  sl.forEach((l, i) => drawTiny(ctx, l, tx, y + 3 + (tl.length + i) * 6, n ? '#F8F8F8' : '#BCBCBC', 'left', null));
  // temps restant de la notification + file d'attente
  if (n) {
    const lim = N.queue.length ? CFG.notify.min : CFG.notify.time;
    ctx.fillStyle = n.col; ctx.fillRect(x + 1, y + h - 1, Math.round((w - 2) * Math.max(0, 1 - n.t / lim)), 1);   // sur la bordure du bas
    for (let i = 0; i < N.queue.length; i++) { ctx.fillStyle = '#F8F8F8'; ctx.fillRect(x + w - 3 - i * 3, y + 1, 2, 1); }
  }
}
// Icônes d'objets et de situations pour la carte
function icon(name, x, y, t) {
  const draw = img => ctx.drawImage(img, Math.round(x - img.width / 2), Math.round(y - img.height / 2));
  switch (name) {
    case 'leaf': return draw(SP.leaf);
    case 'hands': return draw(SP.hands[Math.floor(t * 8) % 2]);
    case 'bubble': return draw(SP.bubble);
    case 'gel': return draw(SP.gel);
    case 'pq': return draw(SP.pq);
    case 'coin': return draw(SP.coin[Math.floor(t * 5) % 2]);
    case 'hero': return draw(SP.hstar);
    case 'seat': ctx.fillStyle = '#000'; ctx.fillRect(x - 6, y - 5, 12, 11); ctx.fillStyle = '#2B3E8C'; ctx.fillRect(x - 5, y - 4, 10, 9); ctx.fillStyle = '#4A5EB0'; ctx.fillRect(x - 5, y - 4, 10, 2); ctx.fillStyle = '#E2007A'; ctx.fillRect(x - 2, y, 1, 1); ctx.fillStyle = '#00A88F'; ctx.fillRect(x + 2, y + 2, 1, 1); return;
    case 'ticket': ctx.fillStyle = '#000'; ctx.fillRect(x - 7, y - 4, 14, 9); ctx.fillStyle = '#F8E8B0'; ctx.fillRect(x - 6, y - 3, 12, 7); ctx.fillStyle = '#8C4FBF'; ctx.fillRect(x - 6, y - 3, 12, 2); ctx.fillStyle = '#000'; ctx.fillRect(x - 4, y + 1, 8, 1); return;
    case 'brake': drawTiny(ctx, '!', x, y - 3, Math.floor(t * 8) % 2 ? '#F87858' : '#F8D878', 'center'); ctx.fillStyle = '#F8D878'; ctx.fillRect(x - 6, y + 4, 12, 1); return;
    case 'station': ctx.fillStyle = '#000'; ctx.fillRect(x - 7, y - 5, 14, 10); ctx.fillStyle = ENAMEL; ctx.fillRect(x - 6, y - 4, 12, 8); ctx.fillStyle = '#F8F8F8'; ctx.fillRect(x - 4, y - 1, 8, 1); ctx.fillRect(x - 4, y + 1, 5, 1); return;
  }
}

/* ---------- Le HUD complet ---------- */
export function drawHUD(dt, t) {
  const run = game.run, P = game.phase, pl = P.pl;
  if (hud.run !== run) Object.assign(hud, { ghost: run.ser, last: run.ser, heal: 0, run });   // nouvelle course
  ctx.fillStyle = ENAMEL; ctx.fillRect(0, 0, 180, HUD_PX - 1);
  ctx.fillStyle = '#F8F8F8'; ctx.fillRect(0, HUD_PX - 1, 180, 1);
  ctx.fillStyle = '#000'; ctx.fillRect(0, HUD_PX, 180, 1);
  // ligne 1 : humeur + sérénité
  face(2, 2, run.ser, t);
  serBar(13, 2, 62, 9, run.ser, dt, t);
  drawTiny(ctx, Math.ceil(run.ser) + '%', 95, 4, run.ser > 25 ? '#F8F8F8' : '#F87858', 'right');
  // ligne 2 : pièces, héroïsme, chrono, ligne
  ctx.drawImage(SP.coin[0], 2, 14); txt(String(Math.min(999, run.coins)).padStart(3, '0'), 10, 13);
  ctx.drawImage(SP.hstar, 36, 13); txt(String(Math.min(99, run.hero)).padStart(2, '0'), 45, 13);
  const T = P.kind === 2 ? Math.max(0, Math.ceil(P.timer)) : null;
  if (T !== null) txt(String(T).padStart(2, '0'), 63, 13, T < 6 ? '#F2C230' : '#F8F8F8');
  else { ctx.drawImage(crisp('P' + P.kind, '#BCBCBC'), 63, 13); }
  const L = run.legs[run.leg].line;
  ctx.fillStyle = '#F8F8F8'; ctx.fillRect(83, 12, 11, 11); ctx.fillStyle = LINES[L].c; ctx.fillRect(84, 13, 9, 9);
  drawTiny(ctx, L, 89, 15, LINES[L].ink, 'center', null);
  // ligne 3 : effets actifs, sinon mode + événement du jour
  if (!effects(2, 25, pl, t)) {
    const label = modeName(run.mode) + (run.event !== 'calme' ? ' · ' + eventName(run.event) : '');
    drawTiny(ctx, tinyW(label) > 92 ? modeName(run.mode) : label, 3, 27, '#8C9AC8', 'left', null);
  }
  // carte de droite
  card(98, 1, 81, 33, t);
}
