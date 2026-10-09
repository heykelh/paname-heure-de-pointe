// ============================================================
//  BOUCLE DE JEU : déplacement, comportements, collisions.
//  Appelée à chaque image quand game.state === 'play'.
// ============================================================
import { Snd } from '../audio/audio.js';
import { CFG } from '../config.js';
import { game } from '../core/state.js';
import { clamp, H, HUD, rnd } from '../core/utils.js';
import { T } from '../data/characters.js';
import { trAny, trPair } from '../i18n/i18n.js';
import { input } from '../input.js';
import { haptic } from '../platform/native.js';
import { bonusTouch, collide, eventOf, fine, hurt, inCone, pickItem, pushOut, spawnScroll, yeet } from './entities.js';
import { gatesPending, updateGates } from './gates.js';
import { notify, popup, updateNotes } from './notify.js';
import { phaseDone } from './run.js';
import { dameTouch, moveWalker, updateTicker, updateWagon } from './wagon.js';

const STREAK = 15;   // secondes sans bousculade pour une « série zen »

export function update(dt) {
  const run = game.run, P = game.phase, pl = P.pl, wagon = P.kind === 2, E = eventOf();
  run.time += dt; P.t += dt; updateTicker(dt); updateNotes(dt);

  // Défilement (s'arrête quand l'arrivée est en vue)
  let S = P.S;
  if (P.finish && P.finish.y >= 120) S = 0;
  if (gatesPending()) S = 0;   // on ne défile qu'une fois les tourniquets passés
  if (!wagon) { P.prog += S * dt; P.scroll = (P.scroll + S * dt) % 768; }

  // Joueur : clavier ou doigt (sol glissant les jours de pluie)
  const sp = CFG.player.speed * (pl.boost > 0 ? CFG.leaf.speedMul : 1), ox = pl.x, oy = pl.y;
  let mx = 0, my = 0, wx = 0, wy = 0; const k = input.keys;
  if (k.arrowleft || k.q || k.a) mx -= 1; if (k.arrowright || k.d) mx += 1; if (k.arrowup || k.z || k.w) my -= 1; if (k.arrowdown || k.s) my += 1;
  if (mx || my) { const m = Math.hypot(mx, my); wx = mx / m * sp; wy = my / m * sp; }
  else if (input.tgt) {
    const dx = input.tgt.x - pl.x, dy = input.tgt.y - pl.y, d = Math.hypot(dx, dy);
    if (d > .5) { const st = Math.min(d, sp * dt) / dt; wx = dx / d * st; wy = dy / d * st; }
  }
  if (E.slippery && !pl.seat && !P.jump) { const a = Math.min(1, dt * 3.2); pl.vx += (wx - pl.vx) * a; pl.vy += (wy - pl.vy) * a; }
  else { pl.vx = wx; pl.vy = wy; }
  if (!P.jump) { pl.x += pl.vx * dt; pl.y += pl.vy * dt; }
  const minX = wagon ? 64 : 34, maxX = wagon ? 296 : 326, minY = HUD + 18;
  pl.x = clamp(pl.x, minX, maxX); pl.y = clamp(pl.y, minY, H - 32);
  const wasSmall = pl.boost > 0;
  pl.inv = Math.max(0, pl.inv - dt); pl.boost = Math.max(0, pl.boost - dt); pl.pardon = Math.max(0, pl.pardon - dt); pl.aura = Math.max(0, pl.aura - dt);
  pl.r = pl.boost > 0 ? CFG.leaf.radius : CFG.player.radius;
  if (wasSmall && pl.boost <= 0) Snd.play('grow');

  // Décor mobile et obstacles
  P.solids.forEach(s => s.y += S * dt); P.decos.forEach(d => d.y += S * dt);
  if (P.esc) P.escY += S * dt;
  if (P.finish) P.finish.y = Math.min(P.finish.y + S * dt, 120);
  P.solids = P.solids.filter(s => s.y < H + 40);
  P.solids.forEach(s => pushOut(pl, s));
  if (wagon) P.seats.forEach(s => { if (s.occ) pushOut(pl, s); });
  pl.x = clamp(pl.x, minX, maxX); pl.y = clamp(pl.y, minY, H - 32);
  P.solids.forEach(s => pushOut(pl, s));

  if (!wagon) { updateGates(dt); spawnScroll(dt); } else updateWagon(dt);
  if (game.state !== 'play') return;

  // Canicule : la sérénité fond toute seule dans les couloirs
  if (E.drain && !wagon) hurt(E.drain * dt, true);
  if (game.state !== 'play') return;

  // Série zen : X secondes sans bousculade = des pièces en bonus
  run.streak += dt;
  if (run.streak >= STREAK * (run.streakLv + 1)) {
    run.streakLv++; const c = run.streakLv * 2; run.coins += c;
    run.st.bestStreak = Math.max(run.st.bestStreak, Math.floor(run.streak));
    Snd.play('streak');
    const [t, sub] = trPair('n.streak', { n: run.streakLv, s: STREAK * run.streakLv, c });
    notify(t, sub, { icon: 'hero', col: 'green', key: 'streak', quiet: true, pop: { x: pl.x, y: pl.y - 30, text: '+' + c, col: 'gold' } });
  }
  run.st.bestStreak = Math.max(run.st.bestStreak, Math.floor(run.streak));

  // Comportements des personnages
  let nearCtrl = 0;
  for (const e of P.ents) {
    const D = T[e.type]; e.t += dt;
    if (e.yeet !== undefined) { // éjecté par la bulle : il s'envole en tournoyant, puis « POF »
      e.yeet += dt; e.x += e.vx * dt; e.y += e.vy * dt; e.vy += 200 * dt;
      if (e.yeet > .5) { e.dead = true; (P.puffs = P.puffs || []).push({ x: e.x, y: e.y, t: 0 }); }
      continue;
    }
    if (e.go) { moveWalker(e, dt); continue; }   // wagon : voyageur qui monte ou descend
    let beh = D.beh;
    if (wagon && (beh === 'walk' || beh === 'charge' || beh === 'march' || beh === 'scoot')) beh = 'wander';
    switch (beh) {
      case 'wander': if ((e.k -= dt) <= 0) { e.k = rnd(.8, 2); const a = rnd(0, 6.28), v = wagon ? 26 : 30; e.vx = Math.cos(a) * v; e.vy = Math.sin(a) * v; } break;
      case 'erratic': if ((e.k -= dt) <= 0) { e.k = rnd(.25, .6); const a = rnd(0, 6.28); e.vx = Math.cos(a) * 88; e.vy = Math.sin(a) * 88; } break;
      case 'home': { const dx = pl.x - e.x, dy = pl.y - e.y, d = Math.hypot(dx, dy) || 1, v = d < 190 ? 42 : 0; e.vx = dx / d * v; e.vy = dy / d * v; break; }
      case 'zombie': { const dx = pl.x - e.x, dy = pl.y - e.y, d = Math.hypot(dx, dy) || 1, v = d < 260 ? 28 : 8; e.vx = dx / d * v + Math.sin(e.t * 3) * 6; e.vy = dy / d * v; break; }
      case 'flee': { const dx = e.x - pl.x, dy = e.y - pl.y, d = Math.hypot(dx, dy) || 1;
        if (d < 130) { e.vx = dx / d * 44; e.vy = dy / d * 30; } else if ((e.k -= dt) <= 0) { e.k = rnd(.8, 2); const a = rnd(0, 6.28); e.vx = Math.cos(a) * 30; e.vy = Math.sin(a) * 30; } break; }
      case 'dash': { const dx = pl.x - e.x, dy = pl.y - e.y, d = Math.hypot(dx, dy) || 1; if (d < 150 && !e.done) { e.vx = dx / d * 100; e.vy = dy / d * 100; } else if (!e.done) { e.vx = 0; e.vy = 20; } break; }
      case 'charge': e.vx = 0; e.vy = 110; break;
      case 'march': e.vy = 0; break;                         // cortège : avance droit, en rang
      case 'scoot': break;                                    // trottinette : garde sa trajectoire, rebondit sur les murs
      case 'runner': if (e.t < .9) { e.vx = 0; e.vy = -S; } else { e.armed = true; e.vy = 260; } break;
      case 'ctrl': e.vx = 0; e.vy = 0; e.ang = Math.PI / 2 + Math.sin(P.t * e.sw + e.ph) * .75; if (!e.spent) nearCtrl = Math.max(nearCtrl, clamp(1 - (Math.hypot(pl.x - e.x, pl.y - e.y) - 60) / 120, 0, 1)); break;
      case 'dame': break;
      case 'pigeon': if (!e.fly) { e.vx = 0; e.vy = 0; } break;
      default: e.vx = 0; e.vy = 0;
    }
    e.x += e.vx * dt; e.y += (e.vy + (wagon ? 0 : S)) * dt;
    if (e.type === 'dame' || e.type === 'debout' || e.type === 'pigeon') continue;
    if (beh === 'march') { if (e.x < -90 || e.x > 450) e.dead = true; continue; }
    const lo = wagon ? 124 : 36, hi = wagon ? 236 : 324;
    if (e.x < lo) { e.x = lo; e.vx = Math.abs(e.vx); } if (e.x > hi) { e.x = hi; e.vx = -Math.abs(e.vx); }
    if (wagon) { if (e.y < HUD + 24) { e.y = HUD + 24; e.vy = Math.abs(e.vy); } if (e.y > H - 34) { e.y = H - 34; e.vy = -Math.abs(e.vy); } }
    else if (P.esc && P.escY < H && e.y > P.escY && e.y < P.escY + 300 && D.kind !== 'item') e.x = clamp(e.x, 140, 220);
  }
  P.ents = wagon ? P.ents.filter(e => !e.dead) : P.ents.filter(e => !e.dead && e.y < H + 50 && e.y > -500 && !(e.fly && e.y < 20));

  // Collisions
  const auraR = CFG.aura.radius;
  for (const e of P.ents) {
    if (e.yeet !== undefined) continue;
    const D = T[e.type], d = Math.hypot(pl.x - e.x, pl.y - e.y);
    if (D.kind === 'item') { if (d < pl.r + e.r) pickItem(e); continue; }
    if (D.kind === 'bonus') { if (d < pl.r + e.r + 2) bonusTouch(e); continue; }
    if (e.type === 'controleur') { if (!e.spent && inCone(e, pl)) fine(e); if (game.state !== 'play') return; continue; }
    if (e.type === 'pigeon') {
      if (!e.fly && d < 46) {
        e.fly = true; e.vx = rnd(-70, 70); e.vy = -150; Snd.play('coo'); Snd.play('flap'); run.st.pigeons++;
        if (Math.random() < .5) { const [t, sub] = trPair('n.pigeon'); notify(t, sub, { ent: e, col: 'grey', key: 'pigeon', quiet: true }); }
      }
      continue;
    }
    if (e.type === 'debout') { // le mur humain du wagon : on pousse, ça râle (la bulle les écarte sans dégâts)
      const rr = e.r + pl.r + (pl.aura > 0 ? auraR - pl.r : 0);
      if (d < rr && !pl.seat) {
        const ux = d > .01 ? (e.x - pl.x) / d : 1, uy = d > .01 ? (e.y - pl.y) / d : 0;
        if (pl.aura > 0) { e.x = pl.x + ux * rr; e.y = pl.y + uy * rr; }
        else {
          pl.x = e.x - ux * rr; pl.y = e.y - uy * rr;
          if (e.cd <= 0 && pl.pardon <= 0 && !e.calm) {
            e.cd = 1.6; hurt(CFG.wagon.standDmg, true); Snd.hit('debout'); haptic('light');
            popup(e.x, e.y - 24, '-' + CFG.wagon.standDmg, 'red');
            if (Math.random() < .45) notify(trPair('char.debout')[0], trAny('stand'), { ent: e, col: 'grey', key: 'stand', quiet: true });
            if (game.state !== 'play') return;
          }
        }
      }
      e.cd -= dt; continue;
    }
    if (e.type === 'mendiant') {
      if (d < pl.r + e.r + 4 && !e.done && e.cd <= 0) {
        if (run.coins > 0) {
          run.coins--; run.hero++; run.st.donated++; e.done = true; Snd.play('hero'); haptic('success');
          const [t, sub] = trPair('n.hero'); notify(t, sub, { ent: e, col: 'green', pop: { x: e.x, y: e.y - 24, text: '+1', col: 'green' } });
        } else { e.cd = 2; const [t, sub] = trPair('n.nocoin'); notify(t, sub, { ent: e, col: 'grey', key: 'nocoin', quiet: true }); }
      }
      e.cd -= dt; continue;
    }
    if (e.type === 'dame') { dameTouch(e, d); continue; }
    // Bulle de sécurité : tout gêneur qui la touche est éjecté
    if (pl.aura > 0 && D.dmg > 0 && e.type !== 'rambarde' && d < auraR + e.r) { yeet(e); continue; }
    if (D.aura && d < D.aura && pl.aura <= 0) { // accordéon, toux… : la sérénité fond à proximité
      hurt((D.auraDmg || 5) * dt, true);
      if ((e.auraT = (e.auraT || 0) - dt) <= 0) { e.auraT = D.auraSnd === 'cough' ? 1.1 : .6; Snd.play(D.auraSnd || 'aura'); }
      if (!e.auraNoted) { e.auraNoted = true; notify(trPair('char.' + e.type)[0], trPair('char.' + e.type)[1], { ent: e, col: 'pink' }); }
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
  if (P.puffs) { P.puffs.forEach(f => f.t += dt); P.puffs = P.puffs.filter(f => f.t < .5); }
  P.shake = Math.max(0, P.shake - dt);
}
