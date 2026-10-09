// ============================================================
//  DÉROULEMENT D'UNE COURSE : phases, transitions, fin de partie.
//  Phase 1 : couloir → quai · Phase 2 : wagon · Phase 3 : sortie
//  (avec correspondance : phase 1 et 2 se répètent pour chaque ligne)
//  Chaque course tire un « événement du jour » (data/events.js).
// ============================================================
import { Snd } from '../audio/audio.js';
import { CFG } from '../config.js';
import { game } from '../core/state.js';
import { $, clamp, H, pick, rnd } from '../core/utils.js';
import { WAVE } from '../data/characters.js';
import { EVENTS } from '../data/events.js';
import { MODES } from '../data/modes.js';
import { LINES, ST, computeLegs } from '../data/network.js';
import { fmt, tr, trPair } from '../i18n/i18n.js';
import { input } from '../input.js';
import { haptic } from '../platform/native.js';
import { show, showWin } from '../ui/screens.js';
import { addEnt, buildWave } from './entities.js';
import { buildGates } from './gates.js';
import { clearNotes, notify } from './notify.js';
import { bestOf, computeScore, gradeOf, newStats, saveBest, titlesFor } from './stats.js';
import { buildWagon } from './wagon.js';
import THEME from '../theme/index.js';

// Événement du jour : tiré au hasard (pondéré), jamais deux fois de suite le même
export function rollEvent(prev) {
  const list = Object.entries(EVENTS).filter(([k]) => k !== prev || k === 'calme').map(([k, e]) => [k, e.w]);
  return pick(list);
}

export function newRun() {
  const s = game.sel, mode = game.mode;
  const event = game.nextEvent || rollEvent(game.run && game.run.event);
  game.nextEvent = null;
  game.run = { from: s.from, to: s.to, mode, event, wave: buildWave(mode, event), legs: computeLegs(s.from, s.to), leg: 0, phase: 1,
               ser: 100, coins: 0, hero: 0, time: 0, fines: 0, streak: 0, streakLv: 0, st: newStats() };
  clearNotes();
  // Synopsis : une petite histoire (trop sérieuse) avant la phase 1, + l'événement du jour
  const h = 7 + Math.floor(Math.random() * 2), m = String(Math.floor(Math.random() * 60)).padStart(2, '0');
  const stories = tr('story'), story = stories[Math.floor(Math.random() * stories.length)];
  const [en, el] = trPair('event.' + event);
  const text = fmt(story, { t: tr('story.time', { h, m }), from: ST[s.from].n, to: ST[s.to].n }) + '\n\n' + tr('gen.event', { e: en }) + ' — ' + el;
  Snd.play('chime');
  banner(tr('story.title'), text, () => startPhase(1));
}
export function mkPlayer(x, y) { return { x, y, vx: 0, vy: 0, r: CFG.player.radius, inv: 0, boost: 0, pardon: 0, aura: 0, seat: null, face: 1 }; }

export function startPhase(n) {
  const run = game.run, M = MODES[run.mode];
  run.phase = n;
  const leg = run.legs[run.leg], corr = run.leg > 0;
  game.phase = { kind: n, t: 0, prog: 0, S: n === 2 ? 0 : CFG.scrollSpeed, len: (n === 1 ? CFG.phase1Length : CFG.phase3Length) * M.lenMul,
    ents: [], solids: [], decos: [], pops: [], puffs: [], spawnT: 1.2, coinT: 1, itemT: 6, pigT: 3, cortT: 4, pqT: 3,
    finish: null, scroll: 0, shake: 0, beggar: false, esc: false, pl: mkPlayer(180, n === 2 ? 600 : 590), noted: {} };
  const P = game.phase;
  if (n === 1 && !corr) { // on entre dans la gare : les tourniquets
    buildGates(520, M.jump);
    P.decos.push({ kind: 'acces', y: 560 });
  }
  if (n === 1 && corr) { P.decos.push({ kind: 'train', y: 580, line: run.legs[run.leg - 1].line }); P.pl.y = 545; } // correspondance : on descend du train précédent
  if (n === 3) { P.decos.push({ kind: 'train', y: 580 }); P.pl.y = 545; } // on descend du train
  if (n === 2) buildWagon(leg);

  const dir = LINES[leg.line].dir[leg.dir];
  let title, text;
  if (n === 1) {
    title = corr ? tr('ph1.corrTitle', { s: ST[leg.from].n }) : tr('ph1.title');
    text = (corr ? tr('ph1.corrText', { l: leg.line, d: dir }) + tr(leg.from === THEME.network.megaHub ? 'ph1.chatelet' : 'ph1.signs') : tr('ph1.text', { d: dir }))
         + tr('ph1.core') + (M.jump ? tr('ph1.sans') : '') + (run.mode === 'greve' ? tr('ph1.greve') : '') + (run.mode === 'pandemie' ? tr('ph1.pandemie') : '');
  } else if (n === 2) {
    title = tr('ph2.title'); text = tr('ph2.text', { n: leg.stops });
  } else {
    title = tr('ph3.title'); text = tr('ph3.text', { s: ST[run.to].n }) + (M.inspectors ? tr('ph3.sans') : '');
  }
  Snd.music(n === 1 ? M.music || 'corridor' : n === 2 ? 'wagon' : 'exit');
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
  const run = game.run, P = game.phase;
  if (P.kind === 2) Snd.play('doorsClose');
  // Rappel de l'événement du jour au tout début de la course
  if (P.kind === 1 && run.leg === 0 && !run.eventShown && run.event !== 'calme') {
    run.eventShown = true;
    const [t, sub] = trPair('event.' + run.event);
    notify(t, sub, { icon: 'ticket', col: 'gold' });
  }
}
export function phaseDone() {
  game.state = 'trans'; input.tgt = null; input.drag = false;
  const run = game.run, n = game.phase.kind;
  if (n === 1) { Snd.play('quai'); return startPhase(2); }   // le train entre en gare
  if (n === 2) {
    if (run.leg < run.legs.length - 1) { run.leg++; return startPhase(1); }
    return startPhase(3);
  }
  Snd.play('sortie');   // l'air libre !
  win();
}

export function gameOver(why) {
  const run = game.run;
  game.state = 'over'; Snd.play('over'); Snd.ambience('none'); haptic('error');
  if (why === 'fine') { $('#ovT').textContent = tr('over.fine'); $('#ovP').textContent = tr('over.fineP', { fine: CFG.fine }); }
  else { $('#ovT').textContent = tr('over.ser'); $('#ovP').textContent = tr('over.serP', { a: ST[run.from].n, b: ST[run.to].n }); }
  $('#ovS').textContent = tr('over.stats', { h: run.st.hits, c: run.coins, r: run.hero });
  show('over');
}
export function win() {
  const run = game.run, M = MODES[run.mode];
  game.state = 'win'; Snd.play('win'); Snd.ambience('none'); haptic('success');
  run.heroBonus = M.heroBonus; run.hero += M.heroBonus;
  run.score = computeScore(run); run.grade = gradeOf(run.score);
  run.prevBest = bestOf(run.mode); run.record = saveBest(run.mode, run.score);
  run.titles = titlesFor(run);
  setTimeout(() => { if (game.state === 'win') Snd.play(run.record ? 'record' : 'grade'); }, 1300);
  showWin(run);
}
export function pause() {
  if (game.state !== 'play') return;
  game.state = 'pause'; input.tgt = null; input.drag = false; Snd.setPaused(true); Snd.play('pause');
  show('pause'); setTimeout(() => $('#resumeBtn').focus(), 30);
}
export function resume() { game.state = 'play'; Snd.init(); Snd.setPaused(false); Snd.play('unpause'); show(null); }
export function toTitle() { game.run = null; game.state = 'menu'; clearNotes(); Snd.setPaused(false); Snd.music('menu'); Snd.ambience('menu'); makeAmbient(); show('title'); }

/* ---------- Écran titre : la foule qui déambule en fond ---------- */
export function makeAmbient() {
  game.phase = { kind: 0, t: 0, S: 40, ents: [], solids: [], decos: [], pops: [], puffs: [], scroll: 0, pl: null };
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
