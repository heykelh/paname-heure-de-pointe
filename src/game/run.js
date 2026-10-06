// ============================================================
//  DÉROULEMENT D'UNE COURSE : phases, transitions, fin de partie.
//  Phase 1 : couloir → quai · Phase 2 : wagon · Phase 3 : sortie
//  (avec correspondance : phase 1 et 2 se répètent pour chaque ligne)
// ============================================================
import { Snd } from '../audio/audio.js';
import { CFG } from '../config.js';
import { game } from '../core/state.js';
import { $, clamp, H, pick, rnd } from '../core/utils.js';
import { WAVE } from '../data/characters.js';
import { LINES, ST, computeLegs } from '../data/network.js';
import { fmt, tr } from '../i18n/i18n.js';
import { input } from '../input.js';
import { haptic } from '../platform/native.js';
import { show } from '../ui/screens.js';
import { addEnt } from './entities.js';
import { buildWagon } from './wagon.js';

export function newRun() {
  const s = game.sel;
  game.run = { from: s.from, to: s.to, mode: game.mode, legs: computeLegs(s.from, s.to), leg: 0, phase: 1, ser: 100, coins: 0, hero: 0, time: 0, fines: 0, seats: 0 };
  // Synopsis : une petite histoire (trop sérieuse) avant la phase 1
  const h = 7 + Math.floor(Math.random() * 2), m = String(Math.floor(Math.random() * 60)).padStart(2, '0');
  const stories = tr('story'), story = stories[Math.floor(Math.random() * stories.length)];
  const text = fmt(story, { t: tr('story.time', { h, m }), from: ST[s.from].n, to: ST[s.to].n });
  Snd.play('chime');
  banner(tr('story.title'), text, () => startPhase(1));
}
export function mkPlayer(x, y) { return { x, y, r: CFG.player.radius, inv: 0, boost: 0, pardon: 0, seat: null, face: 1 }; }

export function startPhase(n) {
  const run = game.run;
  run.phase = n;
  const leg = run.legs[run.leg], corr = run.leg > 0;
  game.phase = { kind: n, t: 0, prog: 0, S: n === 2 ? 0 : CFG.scrollSpeed, len: n === 1 ? CFG.phase1Length : CFG.phase3Length,
    ents: [], solids: [], decos: [], floats: [], spawnT: 1.2, coinT: 1, itemT: 6,
    finish: null, scroll: 0, shake: 0, beggar: false, esc: false, pl: mkPlayer(180, n === 2 ? 600 : 590), noted: {} };
  const P = game.phase;
  if (n === 1 && !corr) { // on entre dans la gare : les tourniquets
    [[24, 62], [112, 160], [210, 258], [308, 336]].forEach(([a, b]) => P.solids.push({ x: a, y: 520, w: b - a, h: 20, kind: 'tourniquet' }));
    P.decos.push({ kind: 'acces', y: 560 });
  }
  if (n === 1 && corr) { P.decos.push({ kind: 'train', y: 580, line: run.legs[run.leg - 1].line }); P.pl.y = 545; } // correspondance : on descend du train précédent
  if (n === 3) { P.decos.push({ kind: 'train', y: 580 }); P.pl.y = 545; } // on descend du train
  if (n === 2) buildWagon(leg);

  const dir = LINES[leg.line].dir[leg.dir];
  let title, text;
  if (n === 1) {
    title = corr ? tr('ph1.corrTitle', { s: ST[leg.from].n }) : tr('ph1.title');
    text = (corr ? tr('ph1.corrText', { l: leg.line, d: dir }) + tr(leg.from === 'chatelet' ? 'ph1.chatelet' : 'ph1.signs') : tr('ph1.text', { d: dir }))
         + tr('ph1.core') + (run.mode === 'sans' ? tr('ph1.sans') : '');
  } else if (n === 2) {
    title = tr('ph2.title'); text = tr('ph2.text', { n: leg.stops });
  } else {
    title = tr('ph3.title'); text = tr('ph3.text', { s: ST[run.to].n }) + (run.mode === 'sans' ? tr('ph3.sans') : '');
  }
  Snd.music(n === 1 ? 'corridor' : n === 2 ? 'wagon' : 'exit');
  Snd.ambience(n === 2 ? 'wagon' : 'corridor');
  Snd.play('phase');
  banner(title, text);
}
// next : ce qui se passe quand on appuie sur le bouton (par défaut, la phase commence)
export function banner(title, text, next = null) {
  game.bannerNext = next;
  game.state = 'banner'; $('#bnT').textContent = title; $('#bnP').textContent = text; show('banner');
  setTimeout(() => $('#bnGo').focus(), 50);
}
export function startPlaying() {
  game.state = 'play'; show(null);
  if (game.phase.kind === 2) Snd.play('doorsClose');
}
export function phaseDone() {
  game.state = 'trans'; input.tgt = null; input.drag = false;
  const run = game.run, n = game.phase.kind;
  if (n === 1) return startPhase(2);
  if (n === 2) {
    if (run.leg < run.legs.length - 1) { run.leg++; return startPhase(1); }
    return startPhase(3);
  }
  win();
}

export function gameOver(why) {
  const run = game.run;
  game.state = 'over'; Snd.play('over'); Snd.ambience('none'); haptic('error');
  if (why === 'fine') { $('#ovT').textContent = tr('over.fine'); $('#ovP').textContent = tr('over.fineP', { fine: CFG.fine }); }
  else { $('#ovT').textContent = tr('over.ser'); $('#ovP').textContent = tr('over.serP', { a: ST[run.from].n, b: ST[run.to].n }); }
  show('over');
}
export function win() {
  const run = game.run;
  game.state = 'win'; Snd.play('win'); Snd.ambience('none'); haptic('success');
  const bonus = run.mode === 'sans' ? CFG.sansNavigoHeroBonus : 0, total = run.hero + bonus;
  const mode = tr(run.mode === 'sans' ? 'mode.sans' : 'mode.navigo');
  $('#wT').textContent = ST[run.from].n + ' > ' + ST[run.to].n;
  $('#wStamp').textContent = run.mode === 'sans' ? mode : tr('win.stampOk');
  const rows = [[tr('win.ser'), Math.round(run.ser) + ' %'], [tr('win.coins'), run.coins],
                [tr('win.hero'), bonus ? tr('win.heroBonus', { n: total, b: bonus }) : total], [tr('win.diff'), mode],
                [tr('win.corr'), run.legs.length - 1],
                [tr('win.time'), tr('win.timeV', { m: Math.floor(run.time / 60), s: String(Math.floor(run.time % 60)).padStart(2, '0') })]];
  if (run.fines) rows.push([tr('win.fines'), run.fines]);
  const dl = $('#wStats'); dl.innerHTML = '';
  rows.forEach(([a, b]) => { const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = a; dd.textContent = b; dl.append(dt, dd); });
  run.shareText = tr('share.text', { a: ST[run.from].n, b: ST[run.to].n, ser: Math.round(run.ser), coins: run.coins, hero: total, mode });
  show('win');
}
export function pause() {
  if (game.state !== 'play') return;
  game.state = 'pause'; input.tgt = null; input.drag = false; Snd.setPaused(true); Snd.play('pause');
  show('pause'); setTimeout(() => $('#resumeBtn').focus(), 30);
}
export function resume() { game.state = 'play'; Snd.init(); Snd.setPaused(false); Snd.play('unpause'); show(null); }
export function toTitle() { game.run = null; game.state = 'menu'; Snd.setPaused(false); Snd.music('menu'); Snd.ambience('menu'); makeAmbient(); show('title'); }

/* ---------- Écran titre : la foule qui déambule en fond ---------- */
export function makeAmbient() {
  game.phase = { kind: 0, t: 0, S: 40, ents: [], solids: [], decos: [], floats: [], scroll: 0, pl: null };
  for (let i = 0; i < 16; i++) addEnt(pick(WAVE.filter(w => w[0] !== 'runner')), rnd(30, 330), rnd(260, 640));
}
export function updateAmbient(dt) {
  const P = game.phase;
  P.t += dt; P.scroll = (P.scroll + 30 * dt) % 768;
  for (const e of P.ents) {
    e.t += dt;
    if ((e.k -= dt) <= 0) { e.k = rnd(1, 2.5); const a = rnd(0, 6.28); e.vx = Math.cos(a) * 22; e.vy = Math.sin(a) * 18 + 8; }
    e.x += e.vx * dt; e.y += e.vy * dt;
    if (e.x < 36 || e.x > 324) { e.vx *= -1; e.x = clamp(e.x, 36, 324); }
    if (e.y > H + 30) { e.y = 250; e.x = rnd(30, 330); }
    if (e.y < 250) e.vy = Math.abs(e.vy);
  }
}
