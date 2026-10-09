// ============================================================
//  PHASE 2 — LE WAGON : places, strapontins, foule debout,
//  arrêts en station (des gens descendent, d'autres montent et
//  foncent sur les places libres), freinages, dame à la canne,
//  annonces défilantes.
// ============================================================
import { Snd } from '../audio/audio.js';
import { CFG } from '../config.js';
import { game } from '../core/state.js';
import { any, chance, clamp, HUD, rnd, rndi, shuffle } from '../core/utils.js';
import { ST, stationsBetween } from '../data/network.js';
import { tr, trPair } from '../i18n/i18n.js';
import { input } from '../input.js';
import { haptic } from '../platform/native.js';
import { LIGHT_DEB } from '../render/sprites.js';
import { addEnt, eventOf, hurt, modeOf } from './entities.js';
import { notify } from './notify.js';
import { phaseDone } from './run.js';

export const DOORS = [92, 300, 520];   // position des portes (y logique)
const DOOR_X = [44, 316];              // bord gauche / droit du wagon (là où l'on monte et descend)

/* ---------- Bandeau d'annonces défilant (toutes phases) ---------- */
export function nextTick() {
  const P = game.phase, run = game.run;
  if (!P.tickQ || !P.tickQ.length) {
    let list = tr('tick.' + P.kind);
    if (run && ['greve', 'pandemie'].includes(run.mode)) list = list.concat(tr('tick.' + run.mode));
    if (run && run.event !== 'calme') list = list.concat([tr('tick.event.' + run.event)]);
    P.tickQ = shuffle(list);
  }
  P.tick = { msg: P.tickQ.shift(), x: 182, w: 999 };
}
export function announce(msg) { const P = game.phase; P.tickQ = P.tickQ || []; P.tick = { msg, x: 182, w: 999 }; Snd.play('chime'); }
export function updateTicker(dt) { const P = game.phase; if (!P.tick) nextTick(); P.tick.x -= 42 * dt; if (P.tick.x < -P.tick.w - 20) nextTick(); }

function freeSpot(minD) {
  const P = game.phase;
  for (let i = 0; i < 40; i++) {
    const dz = Math.random() < .45, dy = any(DOORS);
    const x = dz ? rnd(80, 280) : rnd(124, 236), y = dz ? dy + rnd(-22, 22) : rnd(HUD + 30, 600);
    if (Math.hypot(x - P.pl.x, y - P.pl.y) < 46) continue;
    if (P.ents.every(e => Math.hypot(e.x - x, e.y - y) > minD)) return [x, y];
  }
  return null;
}
function addStander(x, y, v) {
  const e = addEnt('debout', x, y);
  e.v = v ?? any(LIGHT_DEB); e.ph = rnd(0, 6);
  return e;
}
const debPal = () => 'deb' + Math.floor(Math.random() * 8);
function seatMask() { const M = modeOf(); return M.mask && chance(M.mask) ? (chance(.3) ? 'nose' : 'on') : null; }

export function buildWagon(leg) {
  const P = game.phase, C = CFG.wagon, M = modeOf();
  P.timer = P.timerMax = clamp(C.baseTime + leg.stops * C.timePerStop, C.minTime, C.maxTime) * M.wagonMul;
  P.seats = []; P.pl.x = 120; P.pl.y = 520;
  // carrés de 4 sièges de chaque côté
  [132, 196, 340, 404, 560].forEach(y0 => [y0, y0 + 24].forEach(y => [62, 88, 246, 272].forEach(x => P.seats.push({ x, y, w: 26, h: 24, occ: true, pal: debPal(), mask: seatMask(), aisle: x === 88 || x === 246 }))));
  // strapontins près des portes
  DOORS.forEach(dy => [[64, dy - 30], [64, dy + 16], [276, dy - 30], [276, dy + 16]].forEach(([x, y]) => { if (y > HUD + 20 && y < 600) P.seats.push({ x, y, w: 20, h: 14, occ: Math.random() < .6, pal: debPal(), mask: seatMask(), strap: true }); }));
  shuffle(P.seats.filter(s => s.aisle)).slice(0, M.freeSeats).forEach(s => s.occ = false);
  [[180, 92], [180, 300], [180, 520], [180, 196], [180, 404]].forEach(([x, y]) => addEnt('rambarde', x, y));
  for (let i = 0; i < M.standers; i++) { const p = freeSpot(26); if (p) addStander(p[0], p[1]); }
  const extra = ['tchipeur', 'enfant', 'voleur'];
  if (game.run.mode === 'greve') extra.push('manifestant', 'encombrant');
  if (game.run.mode === 'pandemie') extra.push('tousseur', 'tousseur');
  extra.forEach(k => { const p = freeSpot(24); if (p) addEnt(k, p[0], p[1]); });
  for (let i = 0; i < (M.wagonZombies || 0); i++) { const p = freeSpot(30); if (p) addEnt('zombie', p[0], p[1]); }
  addEnt('artiste', 230, 318);
  for (let i = 0; i < 5; i++) { const p = freeSpot(14); if (p) addEnt('piece', p[0], p[1]); }
  const p = freeSpot(14); if (p) addEnt(any(M.items), p[0], p[1]);
  const names = stationsBetween(leg);
  P.stopNames = names;
  P.stopAt = names.slice(0, -1).map((n, k) => ({ t: P.timerMax * (1 - (k + 1) / leg.stops), name: n }));
  P.nextStop = names[0] || ST[leg.to].n;
  P.dameT = 6; P.brakeT = rnd(5, 8); P.strapT = 3; P.doorsOpen = 0; P.boardQ = []; P.station = null;
  P.tickQ = []; P.tick = { msg: tr('tick.next', { s: P.nextStop }) + tr('tick.2')[0], x: 182, w: 999 };
  if (M.wagonZombies) setTimeout(() => { if (game.phase === P) { const z = P.ents.find(e => e.type === 'zombie'); const [t, s] = trPair('n.zombieWagon'); notify(t, s, { ent: z, col: 'green' }); } }, 1500);
}

/* ---------- Arrêt en station : ça descend, ça monte, ça pousse ---------- */
const nearestDoor = (x, y) => ({ x: x < 180 ? DOOR_X[0] : DOOR_X[1], y: DOORS.reduce((a, b) => Math.abs(b - y) < Math.abs(a - y) ? b : a) });
function doStop(name) {
  const P = game.phase, C = CFG.wagon, M = modeOf(), pl = P.pl;
  P.doorsOpen = C.doorTime; P.station = name; Snd.play('doorsOpen'); haptic('light');
  P.tick = { msg: tr('tick.station', { s: name }) + tr('tick.2')[0], x: 182, w: 999 };
  const [t, sub] = trPair('n.station', { s: name });
  notify(t, sub, { icon: 'station', col: 'gold', key: 'station' });
  // 1) des voyageurs debout descendent : ils vont vers la porte la plus proche
  shuffle(P.ents.filter(e => e.type === 'debout' && !e.go)).slice(0, rndi(2, 4)).forEach(e => { e.go = nearestDoor(e.x, e.y); e.leave = true; e.calm = true; e.sp = rnd(60, 75); });
  // 2) des voyageurs assis se lèvent : leur place se libère (elle clignote)
  shuffle(P.seats.filter(s => s.occ && !s.dame && s !== pl.seat)).filter(() => chance(C.seatLeaveChance)).slice(0, 3).forEach(s => {
    s.occ = false; s.freed = 1.5;
    const e = addStander(s.x + s.w / 2, s.y + s.h / 2, +s.pal.slice(3)); e.mask = s.mask;
    e.go = nearestDoor(e.x, e.y); e.leave = true; e.calm = true; e.sp = rnd(55, 70);   // voyageur neutre : il ne gêne pas
  });
  // 3) d'autres montent par les portes, un peu plus tard (certains foncent sur les places libres)
  const n = Math.round(rndi(3, 6) * M.standers / 22);
  for (let i = 0; i < n; i++) P.boardQ.push(rnd(.5, C.doorTime - 1.2));
  P.boardQ.sort((a, b) => a - b);
}
function board() {
  const P = game.phase, C = CFG.wagon, side = chance(.5) ? 0 : 1, dy = any(DOORS);
  const e = addStander(DOOR_X[side] + (side ? 10 : -10), dy + rnd(-12, 12));
  e.mask = seatMask() || undefined; e.sp = rnd(62, 80); e.board = true;
  const free = P.seats.filter(s => !s.occ && !s.claim && s !== P.pl.seat);
  if (free.length && chance(C.boardSeatChance)) {
    const s = free.reduce((a, b) => Math.abs(b.y - e.y) < Math.abs(a.y - e.y) ? b : a);
    s.claim = e; e.seatT = s; e.go = { x: s.x + s.w / 2, y: s.y + s.h / 2 }; e.sp = 95;   // il a vu une place : il fonce
  } else { const p = freeSpot(22) || [180, dy]; e.go = { x: p[0], y: p[1] }; }
}
// Déplacement des voyageurs qui montent / descendent (appelé pour chaque « debout » en mouvement)
export function moveWalker(e, dt) {
  const P = game.phase, dx = e.go.x - e.x, dy = e.go.y - e.y, d = Math.hypot(dx, dy);
  if (d > 3) { const st = Math.min(d, e.sp * dt); e.x += dx / d * st; e.y += dy / d * st; return; }
  if (e.leave) { e.dead = true; return; }
  if (e.seatT) {
    const s = e.seatT; s.claim = null;
    if (!s.occ && P.pl.seat !== s) {
      s.occ = true; s.pal = 'deb' + e.v; s.mask = e.mask; e.dead = true;
      if (Math.hypot(P.pl.x - e.x, P.pl.y - e.y) < 110) { Snd.play('stolen'); const [t, sub] = trPair('n.stolenSeat'); notify(t, sub, { ent: e, col: 'red', key: 'stolen' }); }
      return;
    }
    e.seatT = null;
  }
  e.go = null; e.board = false;
}

export function updateWagon(dt) {
  const P = game.phase, run = game.run, pl = P.pl, C = CFG.wagon;
  P.timer -= dt;
  if (P.doorsOpen > 0) {
    P.doorsOpen -= dt;
    while (P.boardQ.length && C.doorTime - P.doorsOpen >= P.boardQ[0]) { P.boardQ.shift(); board(); }
    if (P.doorsOpen <= 0) {
      P.doorsOpen = 0; P.boardQ = []; Snd.play('doorsClose');
      const k = P.stopNames.indexOf(P.station); P.nextStop = P.stopNames[k + 1] || P.nextStop; P.station = null;
      announce(tr('tick.next', { s: P.nextStop }) + tr('tick.2')[Math.floor(Math.random() * 4)]);
    }
  }
  P.seats.forEach(s => { if (s.freed > 0) s.freed -= dt; });
  if (P.stopAt.length && P.timer <= P.stopAt[0].t) doStop(P.stopAt.shift().name);

  // S'asseoir sur une place libre
  if (!pl.seat) {
    for (const s of P.seats) {
      const cx = s.x + s.w / 2, cy = s.y + s.h / 2;
      if (!s.occ && Math.abs(pl.x - cx) < 12 && Math.abs(pl.y - cy) < 12) {
        pl.seat = s; pl.x = cx; pl.y = cy; input.tgt = input.drag ? { x: pl.x, y: pl.y } : null;
        run.st.seats++; if (s.strap) run.st.straps++;
        if (s.claim) { s.claim.seatT = null; s.claim.go = null; s.claim = null; }   // grillé, le voyageur qui fonçait !
        Snd.play(s.strap ? 'strap' : 'seat'); haptic('light');
        const [t, sub] = trPair(s.strap ? 'n.strap' : 'n.seat');
        notify(t, sub, { icon: 'seat', col: s.strap ? 'gold' : 'green', key: 'seat' });
        break;
      }
    }
  } else {
    const s = pl.seat;
    if (Math.hypot(pl.x - (s.x + s.w / 2), pl.y - (s.y + s.h / 2)) > 14) pl.seat = null;
    else {
      run.ser = Math.min(100, run.ser + (s.strap ? C.strapRegen : C.seatRegen) * dt);
      if (s.strap && (P.strapT -= dt) <= 0) {
        P.strapT = C.strapGlareEvery; hurt(C.strapGlareDmg, true); Snd.play('glare');
        const [t, sub] = trPair('n.glare');
        notify(t, sub, { ent: { type: 'debout', v: any(LIGHT_DEB) }, col: 'red', key: 'glare', pop: { x: pl.x, y: pl.y - 26, text: '-' + C.strapGlareDmg, col: 'red' } });
        if (game.state !== 'play') return;
      }
    }
  }
  // Freinage brutal (pas en station)
  if (!P.doorsOpen && (P.brakeT -= dt) <= 0) {
    P.brakeT = rnd(...C.brakeEvery); P.shake = .35; Snd.play('brake'); haptic('medium');
    const dir = Math.random() < .5 ? -1 : 1;
    P.ents.forEach(e => { if (e.type === 'debout') e.y += dir * 6; });
    if (!pl.seat) { pl.y += dir * C.brakePush; const [t, sub] = trPair('n.brake'); notify(t, sub, { icon: 'brake', col: 'gold', key: 'brake' }); }
  }
  // La dame à la canne cherche une place… la vôtre
  P.dameT -= dt;
  if (P.dameT <= 0 && !P.ents.some(e => e.type === 'dame')) { P.dameT = 999; addEnt('dame', 180, 300).k = 0; }
  const dame = P.ents.find(e => e.type === 'dame');
  if (dame) {
    let tx, ty;
    if (pl.seat) { tx = pl.seat.x + pl.seat.w / 2 + (pl.seat.x < 180 ? 24 : -24); ty = pl.seat.y + pl.seat.h / 2; }
    else { if ((dame.k -= dt) <= 0) { dame.k = 2; dame.wx = rnd(130, 230); dame.wy = rnd(HUD + 50, 560); } tx = dame.wx; ty = dame.wy; }
    const dx = tx - dame.x, dy = ty - dame.y, d = Math.hypot(dx, dy);
    if (d > 2) { dame.x += dx / d * 24 * dt; dame.y += dy / d * 24 * dt; }
    dame.vx = 0; dame.vy = 0;
  }
  // Canicule : on transpire aussi dans le wagon (sauf assis)
  if (eventOf().drain && !pl.seat) hurt(eventOf().drain * dt, true);
  if (P.timer <= 0) { Snd.play('doorsOpen'); phaseDone(); }
}

export function dameTouch(e, d) {
  const pl = game.phase.pl, run = game.run;
  if (d > pl.r + e.r + 14) return;
  if (pl.seat && !e.done) {
    e.done = true; const s = pl.seat; s.occ = true; s.pal = 'dame'; s.dame = true; s.mask = e.mask; e.dead = true;
    pl.seat = null; pl.x = s.x < 180 ? s.x + 52 : s.x - 30; input.tgt = null;
    run.hero++; run.st.seatsGiven++; Snd.play('thanks'); Snd.play('hero'); haptic('success');
    const [t, sub] = trPair('n.gaveSeat');
    notify(t, sub, { ent: e, col: 'green', pop: { x: pl.x, y: pl.y - 26, text: '+1', col: 'green' } });
  } else if (!pl.seat && (e.cd || 0) <= 0) { e.cd = 3; const [t, sub] = trPair('n.dameNo'); notify(t, sub, { ent: e, col: 'grey', key: 'dame', quiet: true }); }
  e.cd = Math.max(0, (e.cd || 0) - 1 / 60);
}
