import { ctx } from '../core/canvas.js';
import { game } from '../core/state.js';
import { H, clamp, hash, rnd } from '../core/utils.js';
import { T } from '../data/characters.js';
import { DSHORT, LINES } from '../data/network.js';
import { input } from '../input.js';
import { tr } from '../i18n/i18n.js';
import { DOORS } from '../game/wagon.js';
import { B, ENAMEL, F8, SP, drawEnt, faience } from './sprites.js';

// ============================================================
//  RENDU — tout est dessiné sur un canvas de 180×320 pixels,
//  agrandi sans lissage (CSS image-rendering: pixelated).
//  Les positions du jeu sont en unités logiques (360×640) : B(x) = x / 2.
// ============================================================
export function txt(s, x, y, col = '#F8F8F8', align = 'left') {
  ctx.font = F8; ctx.textBaseline = 'top'; ctx.textAlign = align;
  ctx.fillStyle = '#000'; ctx.fillText(s, x + 1, y + 1); ctx.fillStyle = col; ctx.fillText(s, x, y);
}
export function box(x, y, w, h, bg = ENAMEL) { ctx.fillStyle = '#F8F8F8'; ctx.fillRect(x, y, w, h); ctx.fillStyle = bg; ctx.fillRect(x + 1, y + 1, w - 2, h - 2); }
export function plaque(text, cx, y) { ctx.font = F8; const w = Math.ceil(ctx.measureText(text).width) + 10; ctx.fillStyle = '#000'; ctx.fillRect(Math.round(cx - w / 2) - 1, y - 1, w + 2, 16); box(Math.round(cx - w / 2), y, w, 14); txt(text, cx, y + 4, '#F8F8F8', 'center'); }
export function wrap(s, n) { const out = []; let cur = ''; for (const w of s.split(' ')) { if ((cur + ' ' + w).trim().length > n) { if (cur) out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); } if (cur) out.push(cur); return out; }
export function drawBG() { const y = Math.floor(game.phase.scroll / 2) % 384; ctx.drawImage(game.BGC, 0, y - 384); ctx.drawImage(game.BGC, 0, y); }

export function drawDecos() {
  for (const d of game.phase.decos) {
    const y = B(d.y);
    if (d.kind === 'acces') { ctx.fillStyle = '#5A5C58'; ctx.fillRect(12, y - 4, 156, 3); }
    if (d.kind === 'train') {
      const lc = LINES[game.run.legs[game.run.leg].line].c;
      ctx.fillStyle = '#E8E4D8'; ctx.fillRect(12, y - 8, 156, 4); ctx.fillStyle = '#F2C230'; ctx.fillRect(12, y - 5, 156, 2);
      ctx.fillStyle = '#000'; ctx.fillRect(0, y - 2, 180, 26);
      ctx.fillStyle = '#ECECE8'; ctx.fillRect(0, y, 180, 22);
      ctx.fillStyle = lc; ctx.fillRect(0, y + 3, 180, 3);
      for (let x = 8; x < 180; x += 36) { ctx.fillStyle = '#000'; ctx.fillRect(x, y + 9, 22, 9); ctx.fillStyle = '#2A3A4A'; ctx.fillRect(x + 1, y + 10, 20, 7); ctx.fillStyle = '#6A8AA8'; ctx.fillRect(x + 2, y + 11, 6, 1); }
    }
  }
  if (game.phase.esc && game.phase.escY < H && game.phase.escY > -320) {
    const y = B(game.phase.escY);
    ctx.fillStyle = '#1A1A1A'; ctx.fillRect(64, y, 52, 150);
    ctx.fillStyle = '#9EA2A8'; ctx.fillRect(67, y, 46, 150);
    const o = Math.floor(game.phase.t * 16) % 6;
    for (let k = y + o; k < y + 150; k += 6) { ctx.fillStyle = '#6E7278'; ctx.fillRect(67, k, 46, 2); ctx.fillStyle = '#F2C230'; ctx.fillRect(67, k, 2, 1); ctx.fillRect(111, k, 2, 1); }
    ctx.fillStyle = '#F2C230'; ctx.fillRect(67, y + 146, 46, 2);
  }
  if (game.phase.finish) {
    const y = B(game.phase.finish.y);
    if (game.phase.kind === 1) {
      ctx.fillStyle = '#3A3630'; ctx.fillRect(12, y - 48, 156, 34);
      ctx.fillStyle = '#5A544A'; for (let i = 0; i < 60; i++) ctx.fillRect(12 + Math.floor(hash(i, 3) * 156), y - 48 + Math.floor(hash(i, 7) * 34), 1, 1);
      ctx.fillStyle = '#6A4A2A'; for (let x = 14; x < 168; x += 6) ctx.fillRect(x, y - 42, 2, 22);
      ctx.fillStyle = '#B8BCC4'; ctx.fillRect(12, y - 38, 156, 2); ctx.fillRect(12, y - 26, 156, 2);
      const rx = 12 + Math.floor(game.phase.t * 18) % 150; ctx.drawImage(SP.rat[Math.floor(game.phase.t * 8) % 2], rx, y - 33);
      ctx.fillStyle = '#E8E4D8'; ctx.fillRect(12, y - 14, 156, 5);
      ctx.fillStyle = '#F2C230'; ctx.fillRect(12, y - 9, 156, 2);
      plaque(game.phase.finish.label, 90, y - 4);
    } else {
      ctx.fillStyle = '#F8E8B0'; ctx.fillRect(12, y - 40, 156, 6);
      for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? '#8C9096' : '#B8BCC4'; ctx.fillRect(12, y - 34 + k * 5, 156, 5); }
      ctx.fillStyle = '#000'; ctx.fillRect(12, y - 4, 156, 1);
      plaque(game.phase.finish.label, 90, y - 2);
    }
  }
}
export function drawSolids() {
  for (const s of game.phase.solids) {
    const x = B(s.x), y = B(s.y), w = B(s.w), h = B(s.h);
    if (s.kind === 'wall') { faience(ctx, x, y, w, h); ctx.fillStyle = '#F07D19'; ctx.fillRect(s.x < 180 ? x + w - 2 : x, y, 2, h); ctx.fillStyle = '#000'; ctx.fillRect(x, y + h - 1, w, 1); continue; }
    if (s.kind === 'tourniquet') {
      ctx.fillStyle = '#000'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#7C8088'; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
      ctx.fillStyle = '#B8BCC4'; ctx.fillRect(x + 1, y + 1, w - 2, 2);
      if (x + w < 166) {
        ctx.fillStyle = '#8C4FBF'; ctx.fillRect(x + w - 6, y + 4, 4, 3);
        ctx.fillStyle = Math.floor(game.phase.t * 2) % 2 ? '#3AD86A' : '#1A8A3A'; ctx.fillRect(x + w - 9, y + 4, 2, 2);
        ctx.fillStyle = '#000'; ctx.fillRect(x + w, y + 3, 9, 4); ctx.fillStyle = '#B8BCC4'; ctx.fillRect(x + w, y + 4, 8, 2);
      }
      continue;
    }
    ctx.fillStyle = '#000'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#5A5E66'; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    ctx.fillStyle = '#A8D8E8'; ctx.fillRect(x + 3, y + 2, w - 6, h - 4);
    ctx.fillStyle = '#F8F8F8'; ctx.fillRect(x + 4, y + 3, 2, h - 6);
    ctx.fillStyle = Math.floor(game.phase.t * 3) % 2 ? '#3AD86A' : '#E83A2A'; ctx.fillRect(x + w - 4, y + 2, 2, 2);
  }
}
export function drawCones() {
  for (const e of game.phase.ents) if (e.type === 'controleur') {
    const x = B(e.x), y = B(e.y);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, 52, e.ang - .46, e.ang + .46); ctx.closePath();
    ctx.fillStyle = e.spent ? game.PAT.grey : game.PAT.red; ctx.fill();
  }
}
export function drawWagon() {
  const lc = LINES[game.run.legs[game.run.leg].line].c, open = game.phase.doorsOpen > 0;
  // dehors : le tunnel qui défile, ou le quai quand les portes sont ouvertes
  if (open) { faience(ctx, 0, 0, 24, 320); faience(ctx, 156, 0, 24, 320); ctx.fillStyle = '#F2C230'; ctx.fillRect(22, 0, 2, 320); ctx.fillRect(156, 0, 2, 320); }
  else {
    ctx.fillStyle = '#14161A'; ctx.fillRect(0, 0, 180, 320);
    ctx.fillStyle = '#2A2C30'; ctx.fillRect(10, 0, 1, 320); ctx.fillRect(14, 0, 1, 320); ctx.fillRect(165, 0, 1, 320); ctx.fillRect(169, 0, 1, 320);
    ctx.fillStyle = '#F2E6A0'; const sp = game.phase.t * 260; for (let k = 0; k < 4; k++) { const yy = Math.floor((sp + k * 90) % 380) - 30; ctx.fillRect(4, yy, 3, 12); ctx.fillRect(173, (yy + 45 + 380) % 380 - 30, 3, 12); }
  }
  // caisse
  ctx.fillStyle = '#000'; ctx.fillRect(25, 0, 130, 320);
  ctx.fillStyle = '#ECECE8'; ctx.fillRect(26, 0, 4, 320); ctx.fillRect(150, 0, 4, 320);
  ctx.fillStyle = lc; ctx.fillRect(26, 0, 1, 320); ctx.fillRect(153, 0, 1, 320);
  ctx.fillStyle = '#5A5C60'; ctx.fillRect(30, 0, 120, 320);
  for (let i = 0; i < 260; i++) { ctx.fillStyle = i % 2 ? '#6E7074' : '#4A4C50'; ctx.fillRect(30 + Math.floor(hash(i, 1) * 120), Math.floor(hash(i, 2) * 320), 1, 1); }
  for (const dy0 of DOORS) {
    const dy = B(dy0), o = open ? 9 : 0;
    ctx.fillStyle = '#4A4C50'; ctx.fillRect(30, dy - 14, 120, 28);
    ctx.fillStyle = '#F2C230'; ctx.fillRect(30, dy - 14, 120, 1); ctx.fillRect(30, dy + 13, 120, 1);
    ctx.fillStyle = '#9AA0A8'; ctx.fillRect(25, dy - 14, 5, 14 - o); ctx.fillRect(25, dy + o, 5, 14 - o); ctx.fillRect(150, dy - 14, 5, 14 - o); ctx.fillRect(150, dy + o, 5, 14 - o);
    ctx.fillStyle = '#E83A2A'; ctx.fillRect(28, dy - 1, 1, 2); ctx.fillRect(151, dy - 1, 1, 2);
  }
  const on = Math.floor(game.phase.t * 4) % 2;
  for (const s of game.phase.seats) {
    const x = B(s.x), y = B(s.y), w = B(s.w), h = B(s.h);
    ctx.fillStyle = '#000'; ctx.fillRect(x, y, w, h);
    if (s.strap) { ctx.fillStyle = '#E4572E'; ctx.fillRect(x + 1, y + 1, w - 2, h - 2); ctx.fillStyle = '#F8905A'; ctx.fillRect(x + 1, y + 1, w - 2, 1); }
    else {
      ctx.fillStyle = '#2B3E8C'; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
      ctx.fillStyle = '#4A5EB0'; ctx.fillRect(x + 1, y + 1, w - 2, 2);
      ctx.fillStyle = '#00A88F'; ctx.fillRect(x + 3, y + 5, 1, 1); ctx.fillRect(x + 8, y + 7, 1, 1);
      ctx.fillStyle = '#E2007A'; ctx.fillRect(x + 6, y + 4, 1, 1); ctx.fillRect(x + 10, y + 8, 1, 1);
    }
    if (!s.occ && on) { ctx.fillStyle = '#F8D878'; ctx.fillRect(x - 1, y - 1, w + 2, 1); ctx.fillRect(x - 1, y + h, w + 2, 1); ctx.fillRect(x - 1, y - 1, 1, h + 2); ctx.fillRect(x + w, y - 1, 1, h + 2); }
  }
  for (const s of game.phase.seats) if (s.occ) {
    ctx.drawImage(SP.sit[s.pal], B(s.x) + (s.strap ? 0 : 1), B(s.y) - (s.strap ? 6 : 4));
    if (s.dame) { ctx.fillStyle = '#503000'; ctx.fillRect(B(s.x) + 11, B(s.y) + 2, 1, 8); }
  }
  const L = game.run.legs[game.run.leg]; plaque(tr('plaque.line') + ' ' + L.line + ' > ' + DSHORT[LINES[L.line].dir[L.dir]], 90, 27);
}
export function drawPlayer() {
  const pl = game.phase.pl;
  if (pl.inv > 0 && Math.floor(pl.inv * 20) % 2) return;
  const x = B(pl.x), y = B(pl.y);
  const moving = !pl.seat && (input.tgt || Object.values(input.keys).some(Boolean));
  const f = moving ? Math.floor(game.phase.t * 8) % 2 : 0;
  if (pl.boost > 0) { ctx.fillStyle = '#58D854'; for (let i = 0; i < 3; i++) ctx.fillRect(x - 4 + i * 4, y + 7 + ((Math.floor(game.phase.t * 12) + i) % 3), 1, 3); }
  const img = pl.pardon > 0 ? SP.star[Math.floor(game.phase.t * 12) % 4][f] : SP.p.player[f];
  const small = pl.boost > 0 && !(pl.boost < 2 && Math.floor(game.phase.t * 10) % 2);
  if (pl.seat) { if (small) ctx.drawImage(SP.miniSit, x - 4, y - 6); else ctx.drawImage(SP.sit.player, x - 5, y - 9 + (pl.seat.strap ? -2 : 0)); }
  else if (small && pl.pardon <= 0) ctx.drawImage(SP.mini[f], x - 4, y - 5);
  else ctx.drawImage(img, x - 5, y - 9);
  if (game.phase.t < 2.5 && game.state === 'play') { txt('1P', x, y - 22, '#F8F8F8', 'center'); ctx.fillStyle = '#F8F8F8'; ctx.fillRect(x - 1, y - 13, 3, 1); ctx.fillRect(x, y - 12, 1, 1); }
}
export function drawFloats() {
  ctx.font = F8; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  for (const f of game.phase.floats) {
    if (f.t > 1.25 && Math.floor(f.t * 16) % 2) continue;
    const lines = [f.text].concat(f.sub ? wrap(f.sub, 19) : []);
    const w = Math.ceil(Math.max(...lines.map(l => ctx.measureText(l).width))) + 7, h = lines.length * 10 + 4;
    const x = clamp(B(f.x) - Math.floor(w / 2), 2, 178 - w), y = clamp(Math.round(B(f.y) - f.t * 10) - h, 25, 296);
    box(x, y, w, h);
    lines.forEach((l, i) => { ctx.fillStyle = i === 0 ? f.col : '#F8F8F8'; ctx.fillText(l, x + 4, y + 3 + i * 10); });
  }
}
export function drawTicker() {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 310, 180, 10);
  ctx.fillStyle = '#3A2A00'; for (let x = 0; x < 180; x += 2) ctx.fillRect(x, 311, 1, 8);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 310, 180, 10); ctx.clip();
  ctx.font = F8; ctx.textBaseline = 'top'; ctx.textAlign = 'left'; ctx.fillStyle = '#FFB000';
  const tk = game.phase.tick; if (tk) { tk.w = ctx.measureText(tk.msg).width; ctx.fillText(tk.msg, Math.round(tk.x), 311); }
  ctx.restore();
}
export function drawHUD() {
  ctx.fillStyle = ENAMEL; ctx.fillRect(0, 0, 180, 23);
  ctx.fillStyle = '#F8F8F8'; ctx.fillRect(0, 23, 180, 1);
  txt(tr('hud.ser'), 3, 3);
  const n = Math.ceil(game.run.ser / 12.5), blink = game.run.ser < 30 && Math.floor(game.phase.t * 6) % 2;
  const col = game.run.ser > 50 ? '#2FD0A8' : game.run.ser > 25 ? '#F2C230' : '#E83A2A';
  for (let i = 0; i < 8; i++) {
    const x = 38 + i * 7;
    ctx.fillStyle = '#000'; ctx.fillRect(x, 3, 6, 6);
    if (i < n && !blink) { ctx.fillStyle = col; ctx.fillRect(x, 3, 5, 5); }
    else { ctx.fillStyle = '#F8F8F8'; ctx.fillRect(x, 3, 5, 5); ctx.fillStyle = ENAMEL; ctx.fillRect(x + 1, 4, 3, 3); }
  }
  ctx.drawImage(SP.coin[0], 3, 13); txt(String(game.run.coins).padStart(3, '0'), 11, 13);
  ctx.drawImage(SP.hstar, 39, 12); txt(String(game.run.hero).padStart(2, '0'), 48, 13);
  txt(game.phase.kind === 2 ? 'T' + String(Math.max(0, Math.ceil(game.phase.timer))).padStart(2, '0') : 'P' + game.phase.kind, 70, 13, game.phase.kind === 2 && game.phase.timer < 6 ? '#F2C230' : '#F8F8F8');
  box(100, 2, 19, 19, '#0E1530');
  const it = game.phase.pl.pardon > 0 ? SP.pstar[Math.floor(game.phase.t * 8) % 2] : game.phase.pl.boost > 0 ? SP.leaf : null;
  if (it) ctx.drawImage(it, 100 + Math.floor((19 - it.width) / 2), 2 + Math.floor((19 - it.height) / 2));
  const L = game.run.legs[game.run.leg].line;
  ctx.fillStyle = '#F8F8F8'; ctx.fillRect(123, 2, 19, 19); ctx.fillStyle = LINES[L].c; ctx.fillRect(125, 4, 15, 15);
  txt(L, 129, 8, LINES[L].ink);
}
export function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  if (!game.phase) return;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 180, 320);
  ctx.save();
  if (game.phase.shake > 0) ctx.translate(Math.round(rnd(-2, 2)), Math.round(rnd(-2, 2)));
  if (game.phase.kind === 2) drawWagon(); else { drawBG(); drawDecos(); drawSolids(); }
  drawCones();
  const list = game.phase.ents.slice().sort((a, b) => a.y - b.y);
  for (const e of list) {
    if (e.type === 'runner' && !e.armed) { if (Math.floor(game.phase.t * 8) % 2) txt('!', B(e.x), 27, '#F83800', 'center'); continue; }
    const au = T[e.type].aura;
    if (au) { const r = B(au); ctx.fillStyle = '#F878F8'; for (let i = 0; i < 28; i += 2) { const a = i * Math.PI / 14 + game.phase.t * .6; ctx.fillRect(Math.round(B(e.x) + Math.cos(a) * r), Math.round(B(e.y) + Math.sin(a) * r), 1, 1); } }
    drawEnt(ctx, e, e.t);
  }
  if (game.phase.pl) drawPlayer();
  drawFloats();
  ctx.restore();
  if (game.run && game.phase.kind) { drawTicker(); drawHUD(); }
}

