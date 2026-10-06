// ============================================================
//  PHASE 2 — LE WAGON : places, strapontins, foule debout,
//  arrêts en station, freinages, dame à la canne, annonces.
// ============================================================
import { Snd } from '../audio/audio.js';
import { CFG } from '../config.js';
import { game } from '../core/state.js';
import { clamp, rnd, shuffle } from '../core/utils.js';
import { ST } from '../data/network.js';
import { tr } from '../i18n/i18n.js';
import { input } from '../input.js';
import { haptic } from '../platform/native.js';
import { addEnt, float, hurt } from './entities.js';
import { phaseDone } from './run.js';

export const DOORS = [92, 300, 520]; // position des portes (y logique)

/* ---------- Bandeau d'annonces défilant (toutes phases) ---------- */
export function nextTick() {
  const P = game.phase;
  if (!P.tickQ || !P.tickQ.length) P.tickQ = shuffle(tr('tick.' + P.kind));
  P.tick = { msg: P.tickQ.shift(), x: 182, w: 999 };
}
export function announce(msg) { const P = game.phase; P.tickQ = P.tickQ || []; P.tick = { msg, x: 182, w: 999 }; Snd.play('chime'); }
export function updateTicker(dt) { const P = game.phase; if (!P.tick) nextTick(); P.tick.x -= 42 * dt; if (P.tick.x < -P.tick.w - 20) nextTick(); }

export function stationsBetween(leg) {
  const L = leg.line, a = ST[leg.from][L], b = ST[leg.to][L], out = [];
  for (let p = a + leg.dir; leg.dir > 0 ? p <= b : p >= b; p += leg.dir) { const id = Object.keys(ST).find(k => ST[k][L] === p); if (id) out.push(ST[id].n); }
  return out;
}
function freeSpot(minD) {
  const P = game.phase;
  for (let i = 0; i < 40; i++) {
    const dz = Math.random() < .45, dy = DOORS[Math.floor(Math.random() * 3)];
    const x = dz ? rnd(80, 280) : rnd(124, 236), y = dz ? dy + rnd(-22, 22) : rnd(70, 600);
    if (Math.hypot(x - P.pl.x, y - P.pl.y) < 46) continue;
    if (P.ents.every(e => Math.hypot(e.x - x, e.y - y) > minD)) return [x, y];
  }
  return null;
}
function addStander(x, y) { const e = addEnt('debout', x, y); e.v = Math.floor(Math.random() * 8); e.ph = rnd(0, 6); return e; }

export function buildWagon(leg) {
  const P = game.phase, C = CFG.wagon;
  P.timer = P.timerMax = clamp(C.baseTime + leg.stops * C.timePerStop, C.minTime, C.maxTime);
  P.seats = []; P.pl.x = 120; P.pl.y = 520;
  const deb = () => 'deb' + Math.floor(Math.random() * 8);
  // carrés de 4 sièges de chaque côté
  [132, 196, 340, 404, 560].forEach(y0 => [y0, y0 + 24].forEach(y => [62, 88, 246, 272].forEach(x => P.seats.push({ x, y, w: 26, h: 24, occ: true, pal: deb(), aisle: x === 88 || x === 246 }))));
  // strapontins près des portes
  DOORS.forEach(dy => [[64, dy - 30], [64, dy + 16], [276, dy - 30], [276, dy + 16]].forEach(([x, y]) => { if (y > 60 && y < 600) P.seats.push({ x, y, w: 20, h: 14, occ: Math.random() < .6, pal: deb(), strap: true }); }));
  shuffle(P.seats.filter(s => s.aisle)).slice(0, C.freeSeats).forEach(s => s.occ = false);
  [[180, 92], [180, 300], [180, 520], [180, 196], [180, 404]].forEach(([x, y]) => addEnt('rambarde', x, y));
  for (let i = 0; i < C.standers; i++) { const p = freeSpot(26); if (p) addStander(p[0], p[1]); }
  ['tchipeur', 'enfant', 'voleur'].forEach(k => { const p = freeSpot(24); if (p) addEnt(k, p[0], p[1]); });
  addEnt('artiste', 230, 318);
  for (let i = 0; i < 5; i++) { const p = freeSpot(14); if (p) addEnt('piece', p[0], p[1]); }
  const p = freeSpot(14); if (p) addEnt(Math.random() < .5 ? 'feuille' : 'pardon', p[0], p[1]);
  const names = stationsBetween(leg);
  P.stopAt = names.slice(0, -1).map((n, k) => ({ t: P.timerMax * (1 - (k + 1) / leg.stops), name: n }));
  P.dameT = 6; P.brakeT = rnd(5, 8); P.strapT = 3; P.doorsOpen = 0;
  P.tickQ = []; P.tick = { msg: tr('tick.next', { s: names[0] || ST[leg.to].n }) + tr('tick.2')[0], x: 182, w: 999 };
}

function doStop(name) {
  const P = game.phase;
  P.doorsOpen = 2.6; Snd.play('doorsOpen'); haptic('light');
  P.tick = { msg: tr('tick.station', { s: name }) + tr('tick.2')[0], x: 182, w: 999 };
  float(180, 300, name, tr('f.stationS'), 'gold');
  shuffle(P.ents.filter(e => e.type === 'debout')).slice(0, 3).forEach(e => e.dead = true);
  for (let i = 0; i < 5; i++) {
    const dy = DOORS[Math.floor(Math.random() * 3)], x = Math.random() < .5 ? rnd(80, 120) : rnd(240, 280), y = dy + rnd(-18, 18);
    if (Math.hypot(x - P.pl.x, y - P.pl.y) > 30) addStander(x, y);
  }
}

export function updateWagon(dt) {
  const P = game.phase, run = game.run, pl = P.pl, C = CFG.wagon;
  P.timer -= dt;
  if (P.doorsOpen > 0 && (P.doorsOpen -= dt) <= 0) { P.doorsOpen = 0; Snd.play('doorsClose'); }
  if (P.stopAt.length && P.timer <= P.stopAt[0].t) doStop(P.stopAt.shift().name);

  // S'asseoir sur une place libre
  if (!pl.seat) {
    for (const s of P.seats) {
      const cx = s.x + s.w / 2, cy = s.y + s.h / 2;
      if (!s.occ && Math.abs(pl.x - cx) < 12 && Math.abs(pl.y - cy) < 12) {
        pl.seat = s; pl.x = cx; pl.y = cy; input.tgt = input.drag ? { x: pl.x, y: pl.y } : null; run.seats++;
        Snd.play(s.strap ? 'strap' : 'seat'); haptic('light');
        float(pl.x, pl.y - 22, tr(s.strap ? 'f.strap' : 'f.seat'), tr(s.strap ? 'f.strapS' : 'f.seatS'), s.strap ? 'gold' : 'green');
        break;
      }
    }
  } else {
    const s = pl.seat;
    if (Math.hypot(pl.x - (s.x + s.w / 2), pl.y - (s.y + s.h / 2)) > 14) pl.seat = null;
    else {
      run.ser = Math.min(100, run.ser + (s.strap ? C.strapRegen : C.seatRegen) * dt);
      if (s.strap && (P.strapT -= dt) <= 0) {
        P.strapT = C.strapGlareEvery; hurt(C.strapGlareDmg); Snd.play('glare');
        float(pl.x, pl.y - 22, tr('f.glare'), tr('f.glareS'), 'red');
        if (game.state !== 'play') return;
      }
    }
  }
  // Freinage brutal
  if ((P.brakeT -= dt) <= 0) {
    P.brakeT = rnd(...C.brakeEvery); P.shake = .35; Snd.play('brake'); haptic('medium');
    const dir = Math.random() < .5 ? -1 : 1;
    P.ents.forEach(e => { if (e.type === 'debout') e.y += dir * 6; });
    if (!pl.seat) { pl.y += dir * C.brakePush; float(pl.x, pl.y - 20, tr('f.brake'), tr('f.brakeS'), 'gold'); }
  }
  // La dame à la canne cherche une place… la vôtre
  P.dameT -= dt;
  if (P.dameT <= 0 && !P.ents.some(e => e.type === 'dame')) { P.dameT = 999; addEnt('dame', 180, 300).k = 0; }
  const dame = P.ents.find(e => e.type === 'dame');
  if (dame) {
    let tx, ty;
    if (pl.seat) { tx = pl.seat.x + pl.seat.w / 2 + (pl.seat.x < 180 ? 24 : -24); ty = pl.seat.y + pl.seat.h / 2; }
    else { if ((dame.k -= dt) <= 0) { dame.k = 2; dame.wx = rnd(130, 230); dame.wy = rnd(120, 560); } tx = dame.wx; ty = dame.wy; }
    const dx = tx - dame.x, dy = ty - dame.y, d = Math.hypot(dx, dy);
    if (d > 2) { dame.x += dx / d * 24 * dt; dame.y += dy / d * 24 * dt; }
    dame.vx = 0; dame.vy = 0;
  }
  if (P.timer <= 0) { Snd.play('doorsOpen'); phaseDone(); }
}

export function dameTouch(e, d) {
  const pl = game.phase.pl;
  if (d > pl.r + e.r + 14) return;
  if (pl.seat && !e.done) {
    e.done = true; const s = pl.seat; s.occ = true; s.pal = 'dame'; s.dame = true; e.dead = true;
    pl.seat = null; pl.x = s.x < 180 ? s.x + 52 : s.x - 30; input.tgt = null;
    game.run.hero++; Snd.play('thanks'); Snd.play('hero'); haptic('success');
    float(pl.x, pl.y - 22, tr('f.gaveSeat'), tr('f.hero'), 'green');
  } else if (!pl.seat && (e.cd || 0) <= 0) { e.cd = 3; float(e.x, e.y - 20, tr('f.dameNo'), null, 'grey'); }
  e.cd = Math.max(0, (e.cd || 0) - 1 / 60);
}
