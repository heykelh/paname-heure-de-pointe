// ============================================================
//  ENTITÉS : apparition, collisions, dégâts, contrôleurs.
// ============================================================
import { Snd } from '../audio/audio.js';
import { CFG } from '../config.js';
import { game } from '../core/state.js';
import { clamp, HUD, pick, rnd } from '../core/utils.js';
import { T, WAVE } from '../data/characters.js';
import { DSHORT, LINES } from '../data/network.js';
import { charName, charNote, tr } from '../i18n/i18n.js';
import { haptic } from '../platform/native.js';
import { KIND, LIGHT_DEB, NEG_SKINS, SKINNED, SKINS } from '../render/sprites.js';
import { gameOver } from './run.js';

export function addEnt(type, x, y) {
  const D = T[type], e = { type, x, y, vx: 0, vy: 0, r: D.r, t: Math.random() * 3, k: 0, cd: 0 };
  if (D.beh === 'walk') { e.vy = Math.random() < .62 ? rnd(22, 46) : -rnd(14, 30); e.vx = rnd(-8, 8); }
  if (D.beh === 'runner') { e.armed = false; e.y = HUD + 22; e.t = 0; Snd.play('runnerWarn'); }
  const any = list => list[Math.floor(Math.random() * list.length)];
  if (type === 'basique') e.v = any(LIGHT_DEB);                    // tenue au hasard (gêneur : peau claire)
  if (SKINNED.includes(type)) e.skin = KIND.includes(type)
    ? Math.floor(Math.random() * SKINS.length)                      // personnages bienveillants : toutes les teintes
    : any(NEG_SKINS);                                                // personnages négatifs : teintes claires uniquement
  if (D.beh === 'ctrl') { e.ang = Math.PI / 2; e.sw = rnd(.7, 1.2); e.ph = rnd(0, 6); }
  game.phase.ents.push(e); return e;
}

// Apparitions dans les couloirs qui défilent (phases 1 et 3)
export function spawnScroll(dt) {
  const P = game.phase, run = game.run, prog = P.prog / P.len;
  if (P.finish) return;
  const escOn = P.esc && P.escY < 20;
  P.spawnT -= dt;
  if (P.spawnT <= 0 && !escOn) {
    const [a, b] = CFG.spawnEvery; P.spawnT = a + (b - a) * prog + rnd(-.15, .15);
    const k = pick(run.mode === 'sans' ? WAVE.concat([['controleur', .8]]) : WAVE);
    if (k === 'basique' && Math.random() < .35) { const x = rnd(50, 300); for (let i = 0; i < 3; i++) addEnt('basique', x + (i - 1) * 22, -20 - Math.abs(i - 1) * 14); }
    else addEnt(k, rnd(34, 326), -24);
  }
  if ((P.coinT -= dt) <= 0) {
    P.coinT = rnd(1.6, 2.6);
    const x = escOn ? 180 : rnd(40, 320), dx = escOn ? 0 : rnd(-14, 14);
    for (let i = 0; i < 4; i++) addEnt('piece', clamp(x + dx * i, 30, 330), -20 - i * 26);
  }
  P.pigT = (P.pigT === undefined ? 3 : P.pigT) - dt;
  if (P.pigT <= 0 && !escOn) { P.pigT = rnd(6, 10); addEnt('pigeon', rnd(50, 310), -12); }
  if ((P.itemT -= dt) <= 0 && !escOn) { P.itemT = rnd(8, 12); addEnt(Math.random() < .5 ? 'feuille' : 'pardon', rnd(50, 310), -20); }
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
      if (run.mode === 'sans') [[82, -96], [180, -112], [278, -96]].forEach(([x, y]) => { addEnt('controleur', x, y).team = true; });
    }
  }
}

export function hurt(n) {
  game.run.ser = Math.max(0, game.run.ser - n);
  if (game.run.ser <= 0) gameOver('ser');
}
// Petite bulle de texte au-dessus d'un personnage
const CMAP = { gold: '#F8D878', green: '#58D854', grey: '#BCBCBC', red: '#F87858' };
export function float(x, y, text, sub, col) { game.phase.floats.push({ x, y, text, sub, col: CMAP[col] || col || CMAP.red, t: 0 }); }

export function collide(e) {
  const P = game.phase, pl = P.pl, D = T[e.type];
  if (pl.pardon > 0) { float(e.x, e.y - 18, tr('f.pardon'), null, 'gold'); Snd.play('tap'); return; }
  if (pl.inv > 0) return;
  hurt(D.dmg); pl.inv = CFG.player.invulnerableAfterHit; P.shake = .22;
  Snd.hit(e.type); haptic(D.dmg >= 12 ? 'heavy' : 'medium');
  if (D.steal && game.run.coins > 0) game.run.coins--;
  float(e.x, e.y - 20, charName(e.type), charNote(e.type));
  const dx = pl.x - e.x, dy = pl.y - e.y, d = Math.hypot(dx, dy) || 1; pl.x += dx / d * 12; pl.y += dy / d * 12;
}

// Le joueur est-il dans le champ de vision du contrôleur ?
export function inCone(e, pl) {
  const dx = pl.x - e.x, dy = pl.y - e.y, d = Math.hypot(dx, dy);
  if (d > 104 || d < 1) return d < e.r + pl.r;
  let a = Math.atan2(dy, dx) - e.ang; a = Math.atan2(Math.sin(a), Math.cos(a));
  return Math.abs(a) < .46;
}
export function fine(e) {
  e.spent = true; game.run.fines++;
  Snd.play('fine'); haptic('heavy');
  if (game.run.coins >= CFG.fine) { game.run.coins -= CFG.fine; float(e.x, e.y - 22, tr('f.ctrl'), tr('f.ctrlS', { fine: CFG.fine })); game.phase.shake = .3; }
  else gameOver('fine');
}

// Repousse le joueur hors d'un obstacle rectangulaire
export function pushOut(p, s) {
  const cx = clamp(p.x, s.x, s.x + s.w), cy = clamp(p.y, s.y, s.y + s.h);
  const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy);
  if (d >= p.r) return;
  if (d > .001) { p.x = cx + dx / d * p.r; p.y = cy + dy / d * p.r; }
  else { const l = p.x - s.x, r = s.x + s.w - p.x; p.x = l < r ? s.x - p.r : s.x + s.w + p.r; }
}
