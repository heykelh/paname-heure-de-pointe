// ============================================================
//  ENTITÉS : apparitions, collisions, dégâts, objets, bulle,
//  Shlaggs rares, contrôleurs, cortèges (Grève), PQ (Pandémie).
// ============================================================
import { Snd } from '../audio/audio.js';
import { CFG } from '../config.js';
import { game } from '../core/state.js';
import { any, chance, clamp, HUD, pick, rnd, rndi } from '../core/utils.js';
import { T, WAVE } from '../data/characters.js';
import { EVENTS } from '../data/events.js';
import { MODES } from '../data/modes.js';
import { DSHORT, LINES } from '../data/network.js';
import { charName, charNote, tr } from '../i18n/i18n.js';
import { haptic } from '../platform/native.js';
import { KIND, LIGHT_DEB, NEG_SKINS, SKINNED, SKINS } from '../render/sprites.js';
import { notify } from './notify.js';
import { gameOver } from './run.js';

export const modeOf = () => MODES[(game.run && game.run.mode) || 'navigo'];
export const eventOf = () => EVENTS[(game.run && game.run.event) || 'calme'];
const HUMAN = t => !T[t].kind || T[t].kind === 'friend' || T[t].kind === 'bonus';

export function addEnt(type, x, y) {
  const D = T[type], e = { type, x, y, vx: 0, vy: 0, r: D.r, t: Math.random() * 3, k: 0, cd: 0 };
  if (D.beh === 'walk') { e.vy = Math.random() < .62 ? rnd(22, 46) : -rnd(14, 30); e.vx = rnd(-8, 8); }
  if (D.beh === 'runner') { e.armed = false; e.y = HUD + 22; e.t = 0; Snd.play('runnerWarn'); }
  if (type === 'basique') e.v = any(LIGHT_DEB);                     // tenue au hasard (gêneur : peau claire)
  if (SKINNED.includes(type)) e.skin = KIND.includes(type)
    ? Math.floor(Math.random() * SKINS.length)                       // personnages bienveillants : toutes les teintes
    : any(NEG_SKINS);                                                 // personnages négatifs : teintes claires uniquement
  if (D.beh === 'ctrl') { e.ang = Math.PI / 2; e.sw = rnd(.7, 1.2); e.ph = rnd(0, 6); }
  // Pandémie : la plupart des gens portent un masque (souvent sous le nez…)
  const M = modeOf();
  if (game.run && M.mask && HUMAN(type) && type !== 'zombie' && chance(M.mask)) e.mask = chance(.3) ? 'nose' : 'on';
  if (type === 'tousseur') e.mask = game.run && M.mask ? 'nose' : undefined;
  game.phase.ents.push(e); return e;
}

// Liste pondérée des apparitions pour la course (mode + événement du jour)
export function buildWave(mode, event) {
  const M = MODES[mode], E = EVENTS[event];
  const list = WAVE.map(([k, w]) => [k, w * (M.mul[k] ?? 1) * (E.mul[k] ?? 1)]).concat(M.extra.map(([k, w]) => [k, w * (E.mul[k] ?? 1)]));
  return list.filter(([, w]) => w > 0);
}
// Un Shlagg peut être rare (Shiny ou à la Rolex)
function rollShlagg() {
  const m = eventOf().rareMul || 1, r = Math.random();
  if (r < CFG.rare.shiny * m) return 'shlagg_shiny';
  if (r < (CFG.rare.shiny + CFG.rare.rolex) * m) return 'shlagg_rolex';
  return 'shlagg';
}
export function spawnKind(k, x, y) {
  if (k === 'shlagg') k = rollShlagg();
  const e = addEnt(k, x, y);
  if (k === 'shlagg_shiny') { Snd.play('streak'); notify(tr('n.shinySpawn')[0], tr('n.shinySpawn')[1], { ent: e, col: 'pink' }); }
  if (k === 'shlagg_rolex') notify(tr('n.rolexSpawn')[0], tr('n.rolexSpawn')[1], { ent: e, col: 'gold' });
  if (k === 'trottinette') { e.vx = (x < 180 ? 1 : -1) * rnd(80, 100); e.vy = rnd(100, 130); Snd.play('bell'); }
  return e;
}

// Grève : un cortège de manifestants traverse le couloir en rang serré
function spawnCortege() {
  const dir = chance(.5) ? 1 : -1, y0 = rnd(HUD + 30, 230), n = rndi(4, 6), sp = rnd(46, 56);
  let lead = null;
  for (let i = 0; i < n; i++) {
    const e = addEnt('manifestant', dir > 0 ? -24 - i * 24 : 384 + i * 24, y0 + (i % 2) * 18);
    e.vx = dir * sp; e.vy = 0;
    if (i === 0) { e.flag = true; lead = e; }
  }
  Snd.play('cortege');
  notify(tr('n.cortege')[0], tr('n.cortege')[1], { ent: lead, col: 'red', key: 'cortege' });
}

// Apparitions dans les couloirs qui défilent (phases 1 et 3)
export function spawnScroll(dt) {
  const P = game.phase, run = game.run, M = modeOf(), E = eventOf(), prog = P.prog / P.len;
  if (P.finish) return;
  const escOn = P.esc && P.escY < 20;
  P.spawnT -= dt;
  if (P.spawnT <= 0 && !escOn) {
    const [a, b] = CFG.spawnEvery; P.spawnT = (a + (b - a) * prog + rnd(-.15, .15)) / M.spawnMul;
    const k = pick(run.wave);
    const group = (M.groupChance ?? CFG.groupChance) * (E.groups ? 1.4 : 1), size = E.groups ? 4 : 3;
    if (k === 'basique' && Math.random() < group) { const x = rnd(50, 300); for (let i = 0; i < size; i++) addEnt('basique', clamp(x + (i - (size - 1) / 2) * 22, 40, 320), -20 - Math.abs(i - 1) * 14); }
    else spawnKind(k, rnd(34, 326), -24);
  }
  if ((P.coinT -= dt) <= 0) {
    P.coinT = rnd(1.6, 2.6);
    const x = escOn ? 180 : rnd(40, 320), dx = escOn ? 0 : rnd(-14, 14);
    for (let i = 0; i < 4; i++) addEnt('piece', clamp(x + dx * i, 30, 330), -20 - i * 26);
  }
  if ((P.pigT -= dt) <= 0 && !escOn) { P.pigT = rnd(6, 10); addEnt('pigeon', rnd(50, 310), -12); }
  if ((P.itemT -= dt) <= 0 && !escOn) { P.itemT = rnd(...CFG.itemEvery); addEnt(any(M.items), rnd(50, 310), -20); }
  if (M.cortege && (P.cortT -= dt) <= 0 && !escOn && prog < .92) { P.cortT = rnd(...M.cortege); spawnCortege(); }
  if (M.pq && (P.pqT -= dt) <= 0 && !escOn) { P.pqT = rnd(...M.pq); addEnt('pq', rnd(50, 310), -20); }
  if (!P.beggar && prog > .3) { P.beggar = true; addEnt('mendiant', Math.random() < .5 ? 46 : 314, -20); }
  if (P.kind === 3 && !P.esc && prog > .42) {
    P.esc = true; P.escY = -300;
    P.solids.push({ x: 24, y: -300, w: 104, h: 300, kind: 'wall' }, { x: 232, y: -300, w: 104, h: 300, kind: 'wall' });
  }
  if (P.prog >= P.len) {
    if (P.kind === 1) { const leg = run.legs[run.leg]; P.finish = { y: -40, label: tr('plaque.quai') + ' ' + DSHORT[LINES[leg.line].dir[leg.dir]] }; }
    else {
      P.finish = { y: -170, label: tr('plaque.exit') };
      [[24, 64], [104, 158], [202, 256], [296, 336]].forEach(([a, b]) => P.solids.push({ x: a, y: -40, w: b - a, h: 18, kind: 'porte' }));
      if (M.inspectors) [[82, -96], [180, -112], [278, -96]].forEach(([x, y]) => { addEnt('controleur', x, y).team = true; });
    }
  }
}

// Perte de sérénité. soft = true : ne casse pas la série zen (aura d'accordéon, canicule…)
export function hurt(n, soft = false) {
  const run = game.run;
  run.ser = Math.max(0, run.ser - n);
  run.st.minSer = Math.min(run.st.minSer, run.ser);
  if (!soft) { run.streak = 0; run.streakLv = 0; }
  if (run.ser <= 0) gameOver('ser');
}

// Collision avec un gêneur
export function collide(e) {
  const P = game.phase, pl = P.pl, D = T[e.type], run = game.run;
  if (pl.aura > 0) return yeet(e);
  if (pl.pardon > 0) {
    if (e.cd <= 0) { notify(charName(e.type), tr('n.pardonHit')[1], { ent: e, col: 'gold', key: 'pardonHit', quiet: true }); Snd.play('tap'); }
    return;
  }
  if (pl.inv > 0) return;
  hurt(D.dmg); pl.inv = CFG.player.invulnerableAfterHit; P.shake = .22;
  Snd.hit(e.type); haptic(D.dmg >= 12 ? 'heavy' : 'medium');
  run.st.hits++; run.st.hitBy[e.type] = (run.st.hitBy[e.type] || 0) + 1;
  if (e.type === 'zombie') run.st.zombies++;
  let pop = '-' + D.dmg;
  if (D.steal && run.coins > 0) { run.coins--; run.st.stolen++; pop += ' -1$'; }
  notify(charName(e.type), charNote(e.type), { ent: e, col: 'red', pop: { x: e.x, y: e.y - 26, text: pop, col: 'red' } });
  const dx = pl.x - e.x, dy = pl.y - e.y, d = Math.hypot(dx, dy) || 1; pl.x += dx / d * 12; pl.y += dy / d * 12;
}

// Aura de sécurité : le gêneur rebondit sur la bulle et s'envole (puis « POF »)
export function yeet(e) {
  if (e.yeet !== undefined) return;
  const P = game.phase, pl = P.pl, run = game.run;
  const dx = e.x - pl.x, dy = e.y - pl.y, d = Math.hypot(dx, dy) || 1;
  e.yeet = 0; e.vx = dx / d * 340; e.vy = dy / d * 340 - 60; e.spin = chance(.5) ? 1 : -1;
  run.st.yeet++;
  Snd.play('auraPop'); Snd.hit(e.type); Snd.play('yeet'); haptic('light');
  notify(charName(e.type), tr('n.yeet')[0] + ' ' + tr('n.yeet')[1], { ent: e, col: 'blue', key: 'yeet', quiet: true, pop: { x: e.x, y: e.y - 24, text: 'POF !', col: 'blue' } });
}

// Shlagg rare touché : jackpot
export function bonusTouch(e) {
  const run = game.run, P = game.phase, kind = T[e.type].bonus, b = CFG.bonus[kind];
  e.dead = true; run.coins += b.coins; run.hero += b.hero; run.st[kind]++;
  Snd.play(kind); haptic('success'); P.shake = .15;
  (P.puffs = P.puffs || []).push({ x: e.x, y: e.y, t: 0, star: true });
  notify(tr('n.' + kind)[0], tr('n.' + kind, {})[1].replace('{c}', b.coins).replace('{h}', b.hero), { ent: e, col: kind === 'shiny' ? 'pink' : 'gold', pop: { x: e.x, y: e.y - 26, text: '+' + b.coins, col: 'gold' } });
}

// Ramassage d'un objet
export function pickItem(e) {
  const run = game.run, pl = game.phase.pl, n = s => tr('n.' + s);
  e.dead = true;
  if (e.type === 'piece') { run.coins++; Snd.play('coin'); return; }
  run.st.items++; haptic('light');
  switch (e.type) {
    case 'feuille': pl.boost = CFG.leaf.duration; Snd.play('shrink');
      notify(n('leaf')[0], n('leaf')[1].replace('{s}', CFG.leaf.duration), { icon: 'leaf', col: 'green', key: 'leaf' }); break;
    case 'pardon': pl.pardon = CFG.pardon.duration; Snd.play('star'); Snd.override('star', CFG.pardon.duration);
      notify(n('pardon')[0], n('pardon')[1].replace('{s}', CFG.pardon.duration), { icon: 'hands', col: 'gold', key: 'pardon' }); break;
    case 'aura': pl.aura = CFG.aura.duration; Snd.play('auraOn'); Snd.override('aura', CFG.aura.duration);
      notify(n('aura')[0], n('aura')[1].replace('{s}', CFG.aura.duration), { icon: 'bubble', col: 'blue', key: 'aura' }); break;
    case 'gel': run.ser = Math.min(100, run.ser + CFG.gel.heal); run.st.gel++; Snd.play('gel');
      notify(n('gel')[0], n('gel')[1].replace('{n}', CFG.gel.heal), { icon: 'gel', col: 'green', pop: { x: e.x, y: e.y - 20, text: '+' + CFG.gel.heal, col: 'green' } }); break;
    case 'pq': run.coins += CFG.bonus.pq; run.st.pq++; Snd.play('pq');
      notify(n('pq')[0], n('pq')[1].replace('{n}', CFG.bonus.pq), { icon: 'pq', col: 'gold', pop: { x: e.x, y: e.y - 20, text: '+' + CFG.bonus.pq, col: 'gold' } }); break;
  }
}

// Le joueur est-il dans le champ de vision du contrôleur ?
export function inCone(e, pl) {
  const dx = pl.x - e.x, dy = pl.y - e.y, d = Math.hypot(dx, dy);
  if (d > 104 || d < 1) return d < e.r + pl.r;
  let a = Math.atan2(dy, dx) - e.ang; a = Math.atan2(Math.sin(a), Math.cos(a));
  return Math.abs(a) < .46;
}
export function fine(e) {
  const run = game.run;
  e.spent = true; run.fines++; run.st.fines++;
  Snd.play('fine'); haptic('heavy');
  if (run.coins >= CFG.fine) {
    run.coins -= CFG.fine; game.phase.shake = .3;
    notify(tr('n.ctrl')[0], tr('n.ctrl', { fine: CFG.fine })[1].replace('{fine}', CFG.fine), { ent: e, col: 'red', pop: { x: e.x, y: e.y - 26, text: '-' + CFG.fine + '$', col: 'red' } });
  } else gameOver('fine');
}

// Repousse le joueur hors d'un obstacle rectangulaire
export function pushOut(p, s) {
  const cx = clamp(p.x, s.x, s.x + s.w), cy = clamp(p.y, s.y, s.y + s.h);
  const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy);
  if (d >= p.r) return;
  if (d > .001) { p.x = cx + dx / d * p.r; p.y = cy + dy / d * p.r; }
  else { const l = p.x - s.x, r = s.x + s.w - p.x; p.x = l < r ? s.x - p.r : s.x + s.w + p.r; }
}
