// ============================================================
//  TOURNIQUETS (entrée en gare, phase 1)
//  - Avec Navigo : « bip » de validation et le bras s'ouvre au passage.
//  - Sans Navigo : les bras sont fermés. Le joueur doit tapoter vite
//    l'écran (ou Espace) pour sauter par-dessus. Les gens le remarquent…
// ============================================================
import { Snd } from '../audio/audio.js';
import { CFG } from '../config.js';
import { game } from '../core/state.js';
import { tr, trPair } from '../i18n/i18n.js';
import { haptic } from '../platform/native.js';
import { hurt, modeOf } from './entities.js';
import { notify } from './notify.js';

// Crée la rangée de tourniquets (appelée au début de la phase 1)
export function buildGates(y, sans) {   // sans = true : bras fermés (mode sans Navigo)
  const P = game.phase;
  const bodies = [[24, 62], [112, 160], [210, 258], [308, 336]];
  bodies.forEach(([a, b], i) => {
    const s = { x: a, y, w: b - a, h: 20, kind: 'tourniquet' };
    const next = bodies[i + 1];
    if (next) {
      s.gap = { w: next[0] - b, open: 0, beeped: false, blocked: sans };
      // sans Navigo : un bras fermé (invisible, mais solide) bloque le passage
      if (sans) { s.gap.arm = { x: b, y: y + 6, w: next[0] - b, h: 8, kind: 'arm' }; P.solids.push(s.gap.arm); }
    }
    P.solids.push(s);
  });
  P.gatePassed = false;
}

// Le passage est-il franchi ? (sert aussi à bloquer le défilement avant les tourniquets)
export const gatesPending = () => { const P = game.phase; return P.kind === 1 && P.gatePassed === false; };

export function tapGate() { const q = game.phase && game.phase.qte; if (q && !game.phase.jump) q.taps++; }

export function updateGates(dt) {
  const P = game.phase, pl = P.pl, run = game.run;
  const row = P.solids.filter(s => s.kind === 'tourniquet');
  row.forEach(s => { if (s.gap) s.gap.open = Math.max(0, s.gap.open - dt); });
  if (P.jump) return updateJump(dt);
  if (!row.length || P.gatePassed) return;
  const rowY = row[0].y, below = pl.y - (rowY + 20);
  const g = row.find(s => s.gap && pl.x > s.x + s.w && pl.x < s.x + s.w + s.gap.w);

  // le joueur est passé de l'autre côté
  if (pl.y < rowY - 2) {
    P.gatePassed = true; P.qte = null;
    if (g) { g.gap.open = .6; Snd.play('turnstile'); }
    return;
  }
  if (!modeOf().jump) {
    // avec Navigo : bip de validation à l'approche, le bras s'ouvre
    if (g && below < 26 && !g.gap.beeped) { g.gap.beeped = true; g.gap.open = .8; Snd.play('navigo'); haptic('light'); }
    return;
  }
  // sans Navigo : épreuve « tapote vite ! » devant un bras fermé
  const near = g && g.gap.blocked && below < 34 && pl.y > rowY;
  if (!near) { P.qte = null; return; }
  if (!P.qte || P.qte.gap !== g) P.qte = { taps: 0, t: CFG.jump.time, gap: g };
  P.qte.t -= dt;
  if (P.qte.taps >= CFG.jump.taps) return startJump(g, rowY);
  if (P.qte.t <= 0) {
    hurt(CFG.jump.failDmg); Snd.play('glare'); haptic('medium');
    const [t, sub] = trPair('n.qteFail');
    notify(t, sub, { icon: 'ticket', col: 'red', key: 'qte', pop: { x: pl.x, y: pl.y - 28, text: '-' + CFG.jump.failDmg, col: 'red' } });
    P.qte = { taps: 0, t: CFG.jump.time, gap: g };
  }
}

function startJump(g, rowY) {
  const P = game.phase, pl = P.pl;
  P.solids = P.solids.filter(s => s !== g.gap.arm);
  g.gap.blocked = false; g.gap.open = 1;
  P.qte = null;
  pl.x = g.x + g.w + g.gap.w / 2;
  P.jump = { t: 0, y0: pl.y, y1: rowY - 20 };
  Snd.play('jump'); Snd.play('crowdOh'); haptic('medium');
  const [t, sub] = trPair('n.fraud');
  notify(t, sub, { icon: 'ticket', col: 'red', pop: { x: pl.x, y: pl.y - 32, text: t, col: 'red' } });
  P.tick = { msg: tr('fraud.msg'), x: 182, w: 999 };   // message en bas de l'écran
  game.run.st.frauds++;
}

function updateJump(dt) {
  const P = game.phase, pl = P.pl, j = P.jump;
  j.t += dt;
  const k = Math.min(1, j.t / .55);
  pl.y = j.y0 + (j.y1 - j.y0) * k;
  pl.jumpH = Math.sin(k * Math.PI) * 16;   // hauteur du saut (dessin)
  pl.inv = Math.max(pl.inv, .1);
  if (k >= 1) { P.jump = null; pl.jumpH = 0; P.gatePassed = true; Snd.play('turnstile'); }
}
