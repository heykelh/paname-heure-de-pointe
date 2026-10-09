import { CFG } from '../config.js';
import { ctx } from '../core/canvas.js';
import { game } from '../core/state.js';
import { H, HUD, hash, rnd } from '../core/utils.js';
import { T } from '../data/characters.js';
import { LINES } from '../data/network.js';
import { tr } from '../i18n/i18n.js';
import { input } from '../input.js';
import { DOORS } from '../game/wagon.js';
import { drawTiny } from './font.js';
import { drawHUD } from './hud.js';
import { B, body, drawEnt, drawMask, faience, kid, seated, SP } from './sprites.js';
import { box, crisp, plaque, txt } from './text.js';

// ============================================================
//  RENDU — tout est dessiné sur un canvas de 180×320 pixels,
//  agrandi sans lissage (CSS image-rendering: pixelated).
//  Les positions du jeu sont en unités logiques (360×640) : B(x) = x / 2.
// ============================================================
export { txt, plaque, box };
const TOP = B(HUD);   // bas du HUD, en pixels

export function drawBG() { const y = Math.floor(game.phase.scroll / 2) % 384; ctx.drawImage(game.BGC, 0, y - 384); ctx.drawImage(game.BGC, 0, y); }

export function drawDecos() {
  const P = game.phase;
  for (const d of P.decos) {
    const y = B(d.y);
    if (d.kind === 'acces') { ctx.fillStyle = '#5A5C58'; ctx.fillRect(12, y - 4, 156, 3); }
    if (d.kind === 'train') {
      const lc = LINES[d.line || game.run.legs[game.run.leg].line].c;
      ctx.fillStyle = '#E8E4D8'; ctx.fillRect(12, y - 8, 156, 4); ctx.fillStyle = '#F2C230'; ctx.fillRect(12, y - 5, 156, 2);
      ctx.fillStyle = '#000'; ctx.fillRect(0, y - 2, 180, 26);
      ctx.fillStyle = '#ECECE8'; ctx.fillRect(0, y, 180, 22);
      ctx.fillStyle = lc; ctx.fillRect(0, y + 3, 180, 3);
      for (let x = 8; x < 180; x += 36) { ctx.fillStyle = '#000'; ctx.fillRect(x, y + 9, 22, 9); ctx.fillStyle = '#2A3A4A'; ctx.fillRect(x + 1, y + 10, 20, 7); ctx.fillStyle = '#6A8AA8'; ctx.fillRect(x + 2, y + 11, 6, 1); }
    }
  }
  if (P.esc && P.escY < H && P.escY > -320) {
    const y = B(P.escY);
    ctx.fillStyle = '#1A1A1A'; ctx.fillRect(64, y, 52, 150);
    ctx.fillStyle = '#9EA2A8'; ctx.fillRect(67, y, 46, 150);
    const o = Math.floor(P.t * 16) % 6;
    for (let k = y + o; k < y + 150; k += 6) { ctx.fillStyle = '#6E7278'; ctx.fillRect(67, k, 46, 2); ctx.fillStyle = '#F2C230'; ctx.fillRect(67, k, 2, 1); ctx.fillRect(111, k, 2, 1); }
    ctx.fillStyle = '#F2C230'; ctx.fillRect(67, y + 146, 46, 2);
  }
  if (P.finish) {
    const y = B(P.finish.y);
    if (P.kind === 1) {
      ctx.fillStyle = '#3A3630'; ctx.fillRect(12, y - 48, 156, 34);
      ctx.fillStyle = '#5A544A'; for (let i = 0; i < 60; i++) ctx.fillRect(12 + Math.floor(hash(i, 3) * 156), y - 48 + Math.floor(hash(i, 7) * 34), 1, 1);
      ctx.fillStyle = '#6A4A2A'; for (let x = 14; x < 168; x += 6) ctx.fillRect(x, y - 42, 2, 22);
      ctx.fillStyle = '#B8BCC4'; ctx.fillRect(12, y - 38, 156, 2); ctx.fillRect(12, y - 26, 156, 2);
      const rx = 12 + Math.floor(P.t * 18) % 150; ctx.drawImage(SP.rat[Math.floor(P.t * 8) % 2], rx, y - 33);
      ctx.fillStyle = '#E8E4D8'; ctx.fillRect(12, y - 14, 156, 5);
      ctx.fillStyle = '#F2C230'; ctx.fillRect(12, y - 9, 156, 2);
      plaque(P.finish.label, 90, y - 4);
    } else {
      ctx.fillStyle = '#F8E8B0'; ctx.fillRect(12, y - 40, 156, 6);
      for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? '#8C9096' : '#B8BCC4'; ctx.fillRect(12, y - 34 + k * 5, 156, 5); }
      ctx.fillStyle = '#000'; ctx.fillRect(12, y - 4, 156, 1);
      plaque(P.finish.label, 90, y - 2);
    }
  }
}
export function drawSolids() {
  const P = game.phase;
  for (const s of P.solids) {
    const x = B(s.x), y = B(s.y), w = B(s.w), h = B(s.h);
    if (s.kind === 'wall') { faience(ctx, x, y, w, h); ctx.fillStyle = '#F07D19'; ctx.fillRect(s.x < 180 ? x + w - 2 : x, y, 2, h); ctx.fillStyle = '#000'; ctx.fillRect(x, y + h - 1, w, 1); continue; }
    if (s.kind === 'tourniquet') {
      ctx.fillStyle = '#000'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#7C8088'; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
      ctx.fillStyle = '#B8BCC4'; ctx.fillRect(x + 1, y + 1, w - 2, 2);
      if (s.gap) {
        const gw = B(s.gap.w), open = s.gap.open > 0;
        // lecteur Navigo (violet) + voyant : vert quand ça s'ouvre, rouge si le passage est bloqué
        ctx.fillStyle = '#8C4FBF'; ctx.fillRect(x + w - 6, y + 4, 4, 3);
        ctx.fillStyle = open ? '#3AD86A' : s.gap.blocked ? (Math.floor(P.t * 4) % 2 ? '#E83A2A' : '#7A1A10') : '#1A8A3A';
        ctx.fillRect(x + w - 9, y + 4, 2, 2);
        ctx.fillStyle = '#000';
        if (open) {            // le bras pivote : il se replie le long du tourniquet
          const k = Math.min(1, s.gap.open * 3), len = Math.round(9 - 6 * k);
          ctx.fillRect(x + w, y + 3 - Math.round(4 * k), len, 4); ctx.fillStyle = '#B8BCC4'; ctx.fillRect(x + w, y + 4 - Math.round(4 * k), len - 1, 2);
        } else if (s.gap.blocked) { // sans Navigo : bras fermé sur toute la largeur
          ctx.fillRect(x + w, y + 3, gw, 4); ctx.fillStyle = '#B8BCC4'; ctx.fillRect(x + w, y + 4, gw, 2);
          ctx.fillStyle = '#E83A2A'; ctx.fillRect(x + w + Math.floor(gw / 2) - 1, y + 4, 2, 2);
        } else {
          ctx.fillRect(x + w, y + 3, 9, 4); ctx.fillStyle = '#B8BCC4'; ctx.fillRect(x + w, y + 4, 8, 2);
        }
      }
      continue;
    }
    if (s.kind === 'arm') continue; // bras fermé : déjà dessiné avec son tourniquet
    ctx.fillStyle = '#000'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#5A5E66'; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    ctx.fillStyle = '#A8D8E8'; ctx.fillRect(x + 3, y + 2, w - 6, h - 4);
    ctx.fillStyle = '#F8F8F8'; ctx.fillRect(x + 4, y + 3, 2, h - 6);
    ctx.fillStyle = Math.floor(P.t * 3) % 2 ? '#3AD86A' : '#E83A2A'; ctx.fillRect(x + w - 4, y + 2, 2, 2);
  }
}
export function drawCones() {
  for (const e of game.phase.ents) if (e.type === 'controleur') {
    const x = B(e.x), y = B(e.y);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, 52, e.ang - .46, e.ang + .46); ctx.closePath();
    ctx.fillStyle = e.spent ? game.PAT.grey : game.PAT.red; ctx.fill();
  }
}

/* ---------- Le wagon ---------- */
// Le quai vu par les portes ouvertes : des gens qui attendent
function platformCrowd(side, t) {
  const x0 = side ? 160 : 1;
  for (let i = 0; i < 9; i++) {
    const y = 40 + i * 31 + Math.floor(hash(i, side) * 10);
    if (y > 300) break;
    const k = Math.floor(hash(i, side + 7) * 8);
    ctx.drawImage(body('deb' + k, undefined, Math.floor(t * 4 + i) % 2), x0 + Math.floor(hash(i, 9) * 8), y);
  }
}
export function drawWagon() {
  const P = game.phase, lc = LINES[game.run.legs[game.run.leg].line].c, open = P.doorsOpen > 0, t = P.t;
  // dehors : le tunnel qui défile, ou le quai quand les portes sont ouvertes
  if (open) {
    faience(ctx, 0, 0, 24, 320); faience(ctx, 156, 0, 24, 320);
    ctx.fillStyle = '#8C8E88'; ctx.fillRect(12, 0, 12, 320); ctx.fillRect(156, 0, 12, 320);
    platformCrowd(0, t); platformCrowd(1, t);
    ctx.fillStyle = '#F2C230'; ctx.fillRect(22, 0, 2, 320); ctx.fillRect(156, 0, 2, 320);
  } else {
    ctx.fillStyle = '#14161A'; ctx.fillRect(0, 0, 180, 320);
    ctx.fillStyle = '#2A2C30'; ctx.fillRect(10, 0, 1, 320); ctx.fillRect(14, 0, 1, 320); ctx.fillRect(165, 0, 1, 320); ctx.fillRect(169, 0, 1, 320);
    ctx.fillStyle = '#F2E6A0'; const sp = t * 260; for (let k = 0; k < 4; k++) { const yy = Math.floor((sp + k * 90) % 380) - 30; ctx.fillRect(4, yy, 3, 12); ctx.fillRect(173, (yy + 45 + 380) % 380 - 30, 3, 12); }
  }
  // caisse
  ctx.fillStyle = '#000'; ctx.fillRect(25, 0, 130, 320);
  ctx.fillStyle = '#ECECE8'; ctx.fillRect(26, 0, 4, 320); ctx.fillRect(150, 0, 4, 320);
  ctx.fillStyle = lc; ctx.fillRect(26, 0, 1, 320); ctx.fillRect(153, 0, 1, 320);
  ctx.fillStyle = '#5A5C60'; ctx.fillRect(30, 0, 120, 320);
  for (let i = 0; i < 260; i++) { ctx.fillStyle = i % 2 ? '#6E7074' : '#4A4C50'; ctx.fillRect(30 + Math.floor(hash(i, 1) * 120), Math.floor(hash(i, 2) * 320), 1, 1); }
  for (const dy0 of DOORS) {
    const dy = B(dy0), o = open ? Math.min(9, Math.round((CFG.wagon.doorTime - P.doorsOpen) * 30), Math.round(P.doorsOpen * 30)) : 0;
    ctx.fillStyle = '#4A4C50'; ctx.fillRect(30, dy - 14, 120, 28);
    ctx.fillStyle = '#F2C230'; ctx.fillRect(30, dy - 14, 120, 1); ctx.fillRect(30, dy + 13, 120, 1);
    ctx.fillStyle = '#9AA0A8'; ctx.fillRect(25, dy - 14, 5, 14 - o); ctx.fillRect(25, dy + o, 5, 14 - o); ctx.fillRect(150, dy - 14, 5, 14 - o); ctx.fillRect(150, dy + o, 5, 14 - o);
    ctx.fillStyle = open && Math.floor(t * 4) % 2 ? '#3AD86A' : '#E83A2A'; ctx.fillRect(28, dy - 1, 1, 2); ctx.fillRect(151, dy - 1, 1, 2);
  }
  const on = Math.floor(t * 4) % 2, fast = Math.floor(t * 10) % 2;
  for (const s of P.seats) {
    const x = B(s.x), y = B(s.y), w = B(s.w), h = B(s.h);
    ctx.fillStyle = '#000'; ctx.fillRect(x, y, w, h);
    if (s.strap) { ctx.fillStyle = '#E4572E'; ctx.fillRect(x + 1, y + 1, w - 2, h - 2); ctx.fillStyle = '#F8905A'; ctx.fillRect(x + 1, y + 1, w - 2, 1); }
    else {
      ctx.fillStyle = '#2B3E8C'; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
      ctx.fillStyle = '#4A5EB0'; ctx.fillRect(x + 1, y + 1, w - 2, 2);
      ctx.fillStyle = '#00A88F'; ctx.fillRect(x + 3, y + 5, 1, 1); ctx.fillRect(x + 8, y + 7, 1, 1);
      ctx.fillStyle = '#E2007A'; ctx.fillRect(x + 6, y + 4, 1, 1); ctx.fillRect(x + 10, y + 8, 1, 1);
    }
    if (!s.occ && (s.freed > 0 ? fast : on)) { ctx.fillStyle = s.freed > 0 ? '#F8F8F8' : '#F8D878'; ctx.fillRect(x - 1, y - 1, w + 2, 1); ctx.fillRect(x - 1, y + h, w + 2, 1); ctx.fillRect(x - 1, y - 1, 1, h + 2); ctx.fillRect(x + w, y - 1, 1, h + 2); }
  }
  for (const s of P.seats) if (s.occ) {
    const sx = B(s.x) + (s.strap ? -1 : 0), sy = B(s.y) - (s.strap ? 8 : 5);
    ctx.drawImage(seated(s.pal), sx, sy);
    drawMask(ctx, sx + 6, sy + 12, s.mask);
    if (s.dame) { ctx.fillStyle = '#503000'; ctx.fillRect(sx + 12, sy + 7, 1, 8); }
  }
}
// Panneau en haut du wagon : la ligne au départ, le nom de la station quand les portes sont ouvertes
function wagonSign() {
  const P = game.phase, L = game.run.legs[game.run.leg];
  if (P.station) plaque(P.station.toUpperCase().slice(0, 20), 90, TOP + 4);
  else if (P.t < 4) plaque(tr('plaque.line') + ' ' + L.line, 90, TOP + 4);
}

/* ---------- Le joueur ---------- */
function bubble(x, y, t, left) {
  if (left < 2 && Math.floor(t * 10) % 2) return;
  const r = B(CFG.aura.radius) + Math.round(Math.sin(t * 6)), cy = y - 3;
  ctx.save(); ctx.globalAlpha = .22; ctx.fillStyle = '#7FE0F8';   // voile bleuté à l'intérieur
  ctx.beginPath(); ctx.ellipse(x, cy, r, r * .9, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  for (let i = 0; i < 72; i++) {   // anneau épais qui scintille
    const a = i / 72 * Math.PI * 2, px = Math.round(x + Math.cos(a) * r), py = Math.round(cy + Math.sin(a) * r * .9);
    ctx.fillStyle = (i + Math.floor(t * 14)) % 9 < 2 ? '#F8F8F8' : i % 2 ? '#7FE0F8' : '#3CA8D8';
    ctx.fillRect(px, py, 2, 2);
  }
  ctx.fillStyle = '#F8F8F8'; ctx.fillRect(Math.round(x - r * .5), Math.round(cy - r * .6), 3, 1); ctx.fillRect(Math.round(x - r * .6), Math.round(cy - r * .45), 1, 2);
}
export function drawPlayer() {
  const P = game.phase, pl = P.pl, t = P.t;
  if (pl.aura > 0) bubble(B(pl.x), B(pl.y - (pl.jumpH || 0)), t, pl.aura);
  if (pl.inv > 0 && Math.floor(pl.inv * 20) % 2) return;
  const x = B(pl.x), y = B(pl.y - (pl.jumpH || 0));
  if (pl.jumpH) { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x - 4, B(pl.y) + 6, 8, 2); } // ombre au sol pendant le saut
  const moving = !pl.seat && (input.tgt || Object.values(input.keys).some(Boolean));
  const f = moving ? Math.floor(t * 8) % 2 : 0;
  if (pl.boost > 0) { ctx.fillStyle = '#58D854'; for (let i = 0; i < 3; i++) ctx.fillRect(x - 4 + i * 4, y + 7 + ((Math.floor(t * 12) + i) % 3), 1, 3); }
  const key = pl.pardon > 0 ? 'pstar' + Math.floor(t * 12) % 4 : 'player';
  const small = pl.boost > 0 && !(pl.boost < 2 && Math.floor(t * 10) % 2);
  if (pl.seat) { if (small) ctx.drawImage(kid('player', 0, true), x - 4, y - 7); else ctx.drawImage(seated(key), x - 6, y - 12 + (pl.seat.strap ? -2 : 0)); }
  else if (small && pl.pardon <= 0) ctx.drawImage(kid('player', f), x - 4, y - 7);
  else ctx.drawImage(body(key, undefined, f), x - 6, y - 12);
  if (pl.pardon > 0) { ctx.drawImage(SP.handsMini, x - 3, y - 22 + Math.round(Math.sin(t * 5))); }
  if (P.t < 2.5 && game.state === 'play') { txt('1P', x, y - 26, '#F8F8F8', 'center'); ctx.fillStyle = '#F8F8F8'; ctx.fillRect(x - 1, y - 16, 3, 1); ctx.fillRect(x, y - 15, 1, 1); }
}

/* ---------- Petits textes qui s'envolent, nuages « POF » ---------- */
function drawPops() {
  for (const p of game.phase.pops || []) {
    if (p.t > .7 && Math.floor(p.t * 20) % 2) continue;
    drawTiny(ctx, p.text, B(p.x), Math.max(TOP + 2, B(p.y) - Math.round(p.t * 16)), p.col, 'center');
  }
}
function drawPuffs() {
  for (const f of game.phase.puffs || []) {
    const x = B(f.x), y = B(f.y), k = f.t / .5;
    if (f.star) { for (let i = 0; i < 8; i++) { const a = i * .785, r = 4 + k * 14; ctx.fillStyle = i % 2 ? '#F8D878' : '#F878F8'; ctx.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 2, 2); } continue; }
    ctx.drawImage(SP.puff[k < .5 ? 0 : 1], x - 3, y - 3);
    if (k < .6) drawTiny(ctx, 'POF', x, y - 10, '#F8F8F8', 'center');
  }
}
// Sans Navigo : « TAPOTEZ VITE ! » + jauge d'appuis + temps restant
function drawQTE() {
  const q = game.phase.qte; if (!q) return;
  const cx = 90, y = B(q.gap.y) - 30;
  box(cx - 56, y, 112, 26);
  txt(tr('qte.title'), cx, y + 4, Math.floor(game.phase.t * 6) % 2 ? '#F8D878' : '#F8F8F8', 'center');
  const n = CFG.jump.taps;
  for (let i = 0; i < n; i++) { ctx.fillStyle = i < q.taps ? '#3AD86A' : '#3A4A80'; ctx.fillRect(cx - n * 5 + i * 10 + 1, y + 14, 8, 4); }
  ctx.fillStyle = '#E83A2A'; ctx.fillRect(cx - 50, y + 21, Math.round(100 * Math.max(0, q.t) / CFG.jump.time), 2);
}
export function drawTicker() {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 310, 180, 10);
  ctx.fillStyle = '#3A2A00'; for (let x = 0; x < 180; x += 2) ctx.fillRect(x, 311, 1, 8);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 310, 180, 10); ctx.clip();
  const tk = game.phase.tick; if (tk) { const c = crisp(tk.msg, '#FFB000'); tk.w = c.width; ctx.drawImage(c, Math.round(tk.x), 311); }
  ctx.restore();
}

let lastT = performance.now();
export function render() {
  const now = performance.now(), rdt = Math.min(.1, (now - lastT) / 1000); lastT = now;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  const P = game.phase;
  if (!P) return;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 180, 320);
  ctx.save();
  if (P.shake > 0) ctx.translate(Math.round(rnd(-2, 2)), Math.round(rnd(-2, 2)));
  if (P.kind === 2) drawWagon(); else { drawBG(); drawDecos(); drawSolids(); }
  drawCones();
  const list = P.ents.slice().sort((a, b) => a.y - b.y);
  for (const e of list) {
    if (e.type === 'runner' && !e.armed) { if (Math.floor(P.t * 8) % 2) txt('!', B(e.x), TOP + 4, '#F83800', 'center'); continue; }
    const D = T[e.type];
    if (D.aura && e.yeet === undefined) {   // zone d'accordéon / de toux
      const r = B(D.aura); ctx.fillStyle = D.auraSnd === 'cough' ? '#A8C890' : '#F878F8';
      for (let i = 0; i < 28; i += 2) { const a = i * Math.PI / 14 + P.t * .6; ctx.fillRect(Math.round(B(e.x) + Math.cos(a) * r), Math.round(B(e.y) + Math.sin(a) * r), 1, 1); }
    }
    if (e.yeet !== undefined) {   // éjecté : il tournoie
      ctx.save(); ctx.translate(B(e.x), B(e.y) - 3); ctx.rotate(e.spin * e.yeet * 14); drawEnt(ctx, e, e.t, 0, 3); ctx.restore();
      continue;
    }
    if (e.type === 'manifestant' && e.flag) {   // banderole entre le premier et le deuxième manifestant
      const mate = P.ents.find(o => o !== e && o.type === 'manifestant' && o.yeet === undefined && Math.abs(o.x - e.x) < 60 && Math.abs(o.y - e.y) < 30);
      if (mate) {
        const x1 = Math.min(B(e.x), B(mate.x)), x2 = Math.max(B(e.x), B(mate.x)), yb = Math.min(B(e.y), B(mate.y)) - 22;
        ctx.fillStyle = '#000'; ctx.fillRect(x1 - 1, yb - 1, x2 - x1 + 2, 9); ctx.fillStyle = '#F8F8F8'; ctx.fillRect(x1, yb, x2 - x1, 7);
        ctx.fillRect(x1, yb + 7, 1, 10); ctx.fillRect(x2 - 1, yb + 7, 1, 10);
        drawTiny(ctx, tr('banner.greve'), (x1 + x2) / 2, yb + 1, '#E83A2A', 'center', null);
      }
    }
    drawEnt(ctx, e, e.t);
  }
  if (P.kind === 2) wagonSign();
  if (P.pl) drawPlayer();
  drawPuffs();
  drawQTE();
  drawPops();
  ctx.restore();
  if (game.run && P.kind) { drawTicker(); drawHUD(game.state === 'play' ? rdt : 0, P.t); }
}
