// ============================================================
//  BOUCLE DE JEU : déplacement, comportements, collisions.
//  Appelée à chaque image quand game.state === 'play'.
// ============================================================
import { Snd } from '../audio/audio.js';
import { CFG } from '../config.js';
import { game } from '../core/state.js';
import { clamp, H, HUD, rnd } from '../core/utils.js';
import { T } from '../data/characters.js';
import { charName, charNote, tr } from '../i18n/i18n.js';
import { input } from '../input.js';
import { haptic } from '../platform/native.js';
import { collide, fine, float, hurt, inCone, pushOut, spawnScroll } from './entities.js';
import { phaseDone } from './run.js';
import { dameTouch, updateTicker, updateWagon } from './wagon.js';

const randLine = key => { const a = tr(key); return a[Math.floor(Math.random() * a.length)]; };

export function update(dt) {
  const run = game.run, P = game.phase, pl = P.pl, wagon = P.kind === 2;
  run.time += dt; P.t += dt; updateTicker(dt);

  // Défilement (s'arrête quand l'arrivée est en vue)
  let S = P.S;
  if (P.finish && P.finish.y >= 120) S = 0;
  if (!wagon) { P.prog += S * dt; P.scroll = (P.scroll + S * dt) % 768; }

  // Joueur : clavier ou doigt
  const sp = CFG.player.speed * (pl.boost > 0 ? CFG.leaf.speedMul : 1), ox = pl.x, oy = pl.y;
  let mx = 0, my = 0; const k = input.keys;
  if (k.arrowleft || k.q || k.a) mx -= 1; if (k.arrowright || k.d) mx += 1; if (k.arrowup || k.z || k.w) my -= 1; if (k.arrowdown || k.s) my += 1;
  if (mx || my) { const m = Math.hypot(mx, my); pl.x += mx / m * sp * dt; pl.y += my / m * sp * dt; }
  else if (input.tgt) {
    const dx = input.tgt.x - pl.x, dy = input.tgt.y - pl.y, d = Math.hypot(dx, dy);
    if (d > .5) { const st = Math.min(d, sp * dt); pl.x += dx / d * st; pl.y += dy / d * st; }
  }
  const minX = wagon ? 64 : 34, maxX = wagon ? 296 : 326;
  pl.x = clamp(pl.x, minX, maxX); pl.y = clamp(pl.y, HUD + 16, H - 32);
  const wasSmall = pl.boost > 0;
  pl.inv = Math.max(0, pl.inv - dt); pl.boost = Math.max(0, pl.boost - dt); pl.pardon = Math.max(0, pl.pardon - dt);
  pl.r = pl.boost > 0 ? CFG.leaf.radius : CFG.player.radius;
  if (wasSmall && pl.boost <= 0) Snd.play('grow');

  // Décor mobile et obstacles
  P.solids.forEach(s => s.y += S * dt); P.decos.forEach(d => d.y += S * dt);
  if (P.esc) P.escY += S * dt;
  if (P.finish) P.finish.y = Math.min(P.finish.y + S * dt, 120);
  P.solids = P.solids.filter(s => s.y < H + 40);
  P.solids.forEach(s => pushOut(pl, s));
  if (wagon) P.seats.forEach(s => { if (s.occ) pushOut(pl, s); });
  pl.x = clamp(pl.x, minX, maxX); pl.y = clamp(pl.y, HUD + 16, H - 32);
  P.solids.forEach(s => pushOut(pl, s));

  if (!wagon) spawnScroll(dt); else updateWagon(dt);
  if (game.state !== 'play') return;

  // Comportements des personnages
  let nearCtrl = 0;
  for (const e of P.ents) {
    const D = T[e.type]; e.t += dt;
    let beh = D.beh;
    if (wagon && (beh === 'walk' || beh === 'charge')) beh = 'wander';
    switch (beh) {
      case 'wander': if ((e.k -= dt) <= 0) { e.k = rnd(.8, 2); const a = rnd(0, 6.28), v = wagon ? 26 : 30; e.vx = Math.cos(a) * v; e.vy = Math.sin(a) * v; } break;
      case 'erratic': if ((e.k -= dt) <= 0) { e.k = rnd(.25, .6); const a = rnd(0, 6.28); e.vx = Math.cos(a) * 88; e.vy = Math.sin(a) * 88; } break;
      case 'home': { const dx = pl.x - e.x, dy = pl.y - e.y, d = Math.hypot(dx, dy) || 1, v = d < 190 ? 42 : 0; e.vx = dx / d * v; e.vy = dy / d * v; break; }
      case 'dash': { const dx = pl.x - e.x, dy = pl.y - e.y, d = Math.hypot(dx, dy) || 1; if (d < 150 && !e.done) { e.vx = dx / d * 100; e.vy = dy / d * 100; } else if (!e.done) { e.vx = 0; e.vy = 20; } break; }
      case 'charge': e.vx = 0; e.vy = 110; break;
      case 'runner': if (e.t < .9) { e.vx = 0; e.vy = -S; } else { e.armed = true; e.vy = 260; } break;
      case 'ctrl': e.vx = 0; e.vy = 0; e.ang = Math.PI / 2 + Math.sin(P.t * e.sw + e.ph) * .75; if (!e.spent) nearCtrl = Math.max(nearCtrl, clamp(1 - (Math.hypot(pl.x - e.x, pl.y - e.y) - 60) / 120, 0, 1)); break;
      case 'dame': break;
      case 'pigeon': if (!e.fly) { e.vx = 0; e.vy = 0; } break;
      default: e.vx = 0; e.vy = 0;
    }
    e.x += e.vx * dt; e.y += (e.vy + (wagon ? 0 : S)) * dt;
    if (e.type === 'dame' || e.type === 'debout' || e.type === 'pigeon') continue;
    const lo = wagon ? 124 : 36, hi = wagon ? 236 : 324;
    if (e.x < lo) { e.x = lo; e.vx = Math.abs(e.vx); } if (e.x > hi) { e.x = hi; e.vx = -Math.abs(e.vx); }
    if (wagon) { if (e.y < HUD + 24) { e.y = HUD + 24; e.vy = Math.abs(e.vy); } if (e.y > H - 34) { e.y = H - 34; e.vy = -Math.abs(e.vy); } }
    else if (P.esc && P.escY < H && e.y > P.escY && e.y < P.escY + 300 && D.kind !== 'item') e.x = clamp(e.x, 140, 220);
  }
  P.ents = wagon ? P.ents.filter(e => !e.dead) : P.ents.filter(e => !e.dead && e.y < H + 50 && e.y > -500 && !(e.fly && e.y < 20));

  // Collisions
  for (const e of P.ents) {
    const D = T[e.type], d = Math.hypot(pl.x - e.x, pl.y - e.y);
    if (D.kind === 'item') {
      if (d < pl.r + e.r) {
        e.dead = true;
        if (e.type === 'piece') { run.coins++; Snd.play('coin'); }
        else if (e.type === 'feuille') { pl.boost = CFG.leaf.duration; Snd.play('shrink'); haptic('light'); float(e.x, e.y - 16, tr('f.leaf'), tr('f.leafS', { s: CFG.leaf.duration }), 'green'); }
        else { pl.pardon = CFG.pardon.duration; Snd.play('star'); Snd.override('star', CFG.pardon.duration); haptic('light'); float(e.x, e.y - 16, tr('f.star'), tr('f.starS', { s: CFG.pardon.duration }), 'gold'); }
      }
      continue;
    }
    if (e.type === 'controleur') { if (!e.spent && inCone(e, pl)) fine(e); if (game.state !== 'play') return; continue; }
    if (e.type === 'pigeon') {
      if (!e.fly && d < 46) { e.fly = true; e.vx = rnd(-70, 70); e.vy = -150; Snd.play('coo'); Snd.play('flap'); if (Math.random() < .6) float(e.x, e.y - 14, tr('f.pigeon'), tr(Math.random() < .5 ? 'f.pigeon1' : 'f.pigeon2'), 'grey'); }
      continue;
    }
    if (e.type === 'debout') { // le mur humain du wagon : on pousse, ça râle
      const rr = e.r + pl.r;
      if (d < rr && !pl.seat) {
        const ux = d > .01 ? (pl.x - e.x) / d : 1, uy = d > .01 ? (pl.y - e.y) / d : 0; pl.x = e.x + ux * rr; pl.y = e.y + uy * rr;
        if (e.cd <= 0 && pl.pardon <= 0) {
          e.cd = 1.6; hurt(CFG.wagon.standDmg); Snd.hit('debout'); haptic('light');
          if (Math.random() < .4) float(e.x, e.y - 18, randLine('stand'), null, 'grey');
          if (game.state !== 'play') return;
        }
      }
      e.cd -= dt; continue;
    }
    if (e.type === 'mendiant') {
      if (d < pl.r + e.r + 4 && !e.done && e.cd <= 0) {
        if (run.coins > 0) { run.coins--; run.hero++; e.done = true; Snd.play('hero'); haptic('success'); float(e.x, e.y - 20, tr('f.hero'), tr('f.gave'), 'green'); }
        else { e.cd = 2; float(e.x, e.y - 20, tr('f.nocoin'), null, 'grey'); }
      }
      e.cd -= dt; continue;
    }
    if (e.type === 'dame') { dameTouch(e, d); continue; }
    if (D.aura && d < D.aura) { // l'accordéon : la sérénité fond à proximité
      hurt(5 * dt);
      if ((e.auraT = (e.auraT || 0) - dt) <= 0) { e.auraT = .6; Snd.play('aura'); }
      if (!e.auraNoted) { e.auraNoted = true; float(e.x, e.y - 22, charName(e.type), charNote(e.type)); }
      if (game.state !== 'play') return;
    }
    if (e.cd > 0) { e.cd -= dt; continue; }
    if (e.armed === false) continue;
    if (d < pl.r + e.r) {
      e.cd = 1.2; collide(e);
      if (e.type === 'voleur') { e.done = true; e.vx = (e.x < 180 ? -1 : 1) * 160; e.vy = -40; }
      if (game.state !== 'play') return;
    }
  }

  // Ambiance sonore selon la situation
  const moved = Math.hypot(pl.x - ox, pl.y - oy) > 20 * dt;
  Snd.frame(dt, {
    moving: moved && !pl.seat, boost: pl.boost > 0, ser: run.ser, doorsOpen: P.doorsOpen > 0,
    crowd: Math.min(1, P.ents.filter(e => !T[e.type].kind).length / (wagon ? 30 : 14)),
    escalator: P.esc && P.escY > -320 && P.escY < H, nearCtrl, wagonSpeed: wagon ? Math.min(1, P.t / 3) : 0
  });

  // Fin de phase
  if (!wagon && P.finish && pl.y < P.finish.y + 6) return phaseDone();
  P.floats.forEach(f => f.t += dt); P.floats = P.floats.filter(f => f.t < 1.6);
  P.shake = Math.max(0, P.shake - dt);
}
