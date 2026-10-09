// ============================================================
//  ÉCRANS (HTML) : menus, options, bestiaire, choix du trajet,
//  choix du mode, itinéraire + événement du jour, bannières,
//  pause, game over, fin de course (titre drôle, note, partage).
// ============================================================
import { Snd } from '../audio/audio.js';
import { CFG } from '../config.js';
import { game } from '../core/state.js';
import { $ } from '../core/utils.js';
import { BESTIARY, T } from '../data/characters.js';
import { MODE_ORDER } from '../data/modes.js';
import { LINES, LINE_ST, ST, computeLegs, linesOf } from '../data/network.js';
import { newRun, pause, resume, rollEvent, startPlaying, toTitle } from '../game/run.js';
import { bestOf } from '../game/stats.js';
import { LANGS, applyDom, charFx, charName, getLang, modeName, setLang, tr, trPair } from '../i18n/i18n.js';
import { hapticsEnabled, haptic, isNative, platform, quitApp, setHaptics, shareImage } from '../platform/native.js';
import { KIND, NEG_SKINS, SKINNED, SKINS, drawEnt } from '../render/sprites.js';
import THEME from '../theme/index.js';
import { shareCardBlob } from './share.js';

const SCREENS = ['title', 'options', 'people', 'select', 'diff', 'gen', 'banner', 'pause', 'over', 'win'];
let current = 'title';
export function show(name) {
  current = name;
  SCREENS.forEach(s => $('#s-' + s).classList.toggle('on', s === name));
  $('#pauseBtn').classList.toggle('on', name === null && game.state === 'play');
}
export function currentScreen() { return current; }

let toastT = 0;
export function toast(msg) { const el = $('#toast'); el.textContent = msg; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 2600); }

/* ---------- Options ---------- */
function syncOpts() {
  const sw = (id, v) => $(id).setAttribute('aria-checked', v);
  sw('#optMusic', Snd.on.music); sw('#optSfx', Snd.on.sfx); sw('#optAmb', Snd.on.amb); sw('#optHaptics', hapticsEnabled());
  document.querySelectorAll('#optLang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === getLang()));
  $('#soundWarn').textContent = (!Snd.on.music || !Snd.on.sfx || !Snd.on.amb) ? tr('opt.warn') : '';
}

/* ---------- Bestiaire « Les gens du métro » ---------- */
let peopleBuilt = false;
function buildPeople() {
  if (peopleBuilt) return; peopleBuilt = true;
  const list = $('#peopleList'); list.innerHTML = '';
  const params = k => ({ dmg: T[k].dmg, fine: CFG.fine, leaf: CFG.leaf.duration, pardon: CFG.pardon.duration, aura: CFG.aura.duration, gel: CFG.gel.heal, pq: CFG.bonus.pq });
  BESTIARY.forEach(([title, keys]) => {
    const h = document.createElement('h3'); h.textContent = tr(title); list.appendChild(h);
    keys.forEach((k, i) => {
      const row = document.createElement('div'); row.className = 'prow';
      const c = document.createElement('canvas'); c.width = 28; c.height = 28;
      const skin = !SKINNED.includes(k) ? undefined : KIND.includes(k) ? (i * 3) % SKINS.length : NEG_SKINS[i % NEG_SKINS.length];
      drawEnt(c.getContext('2d'), { type: k, x: 0, y: 0, t: 0, v: 0, skin, flag: k === 'manifestant' }, 0.3, k === 'poussette' ? 12 : 14, T[k].kind === 'item' ? 14 : 18);
      const txt = document.createElement('div'); txt.innerHTML = '<b></b><span></span>';
      txt.querySelector('b').textContent = charName(k); txt.querySelector('span').textContent = charFx(k, params(k));
      row.append(c, txt); list.appendChild(row);
    });
  });
}

/* ---------- Plan & choix des stations ---------- */
const MAPPOS = THEME.map.pos;
function pickStation(id) {
  const sel = game.sel;
  if (sel.step === 'to' && id === sel.from) return;
  Snd.init(); Snd.play('tap'); sel.pending = id;
  $('#confirmQ').textContent = tr(sel.step === 'from' ? 'sel.askFrom' : 'sel.askTo', { s: ST[id].n });
  $('#confirm').classList.add('on'); $('#yesBtn').focus();
}
export function buildMap() {
  const svg = $('#map'), NS = 'http://www.w3.org/2000/svg';
  svg.innerHTML = ''; svg.setAttribute('viewBox', THEME.map.viewBox);
  Object.entries(LINE_ST).forEach(([L, list]) => {
    const pl = document.createElementNS(NS, 'polyline');
    pl.setAttribute('points', list.map(id => MAPPOS[id].join(',')).join(' '));
    Object.entries({ fill: 'none', stroke: LINES[L].c, 'stroke-width': 5, 'stroke-linejoin': 'miter', 'stroke-linecap': 'square' }).forEach(([k, v]) => pl.setAttribute(k, v));
    svg.appendChild(pl);
  });
  Object.keys(ST).forEach(id => {
    const [x, y] = MAPPOS[id], hub = linesOf(id).length > 1;
    const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'st'); g.setAttribute('aria-label', ST[id].n); g.dataset.id = id;
    const sq = document.createElementNS(NS, 'rect'), sz = hub ? 10 : 7;
    sq.setAttribute('x', x - sz / 2); sq.setAttribute('y', y - sz / 2); sq.setAttribute('width', sz); sq.setAttribute('height', sz);
    const hit = document.createElementNS(NS, 'circle'); hit.setAttribute('cx', x); hit.setAttribute('cy', y); hit.setAttribute('r', 11); hit.setAttribute('class', 'hit');
    g.append(hit, sq); svg.appendChild(g);
    g.addEventListener('click', () => pickStation(id));
  });
  const tabs = $('#lineTabs'); tabs.innerHTML = '';
  Object.keys(LINE_ST).forEach(L => {
    const b = document.createElement('button'); b.className = 'tab badge'; b.textContent = L; b.setAttribute('aria-label', 'RER ' + L);
    b.style.background = LINES[L].c; b.style.color = LINES[L].ink;
    b.addEventListener('click', () => { Snd.play('tap'); game.selLine = L; buildList(); });
    tabs.appendChild(b);
  });
}
const badge = (L, cls = '') => { const i = document.createElement('i'); i.className = 'badge ' + cls; i.textContent = L; i.style.background = LINES[L] ? LINES[L].c : ''; i.style.color = LINES[L] ? LINES[L].ink : ''; return i; };
function buildList() {
  const sel = game.sel, L = game.selLine;
  document.querySelectorAll('#lineTabs .tab').forEach(t => t.setAttribute('aria-pressed', t.textContent === L));
  const ul = $('#stList'); ul.innerHTML = '';
  $('#lineName').textContent = tr('sel.line', { l: L, a: LINES[L].dir['-1'], b: LINES[L].dir['1'] });
  LINE_ST[L].forEach(id => {
    const b = document.createElement('button'); b.className = 'stbtn'; b.style.setProperty('--lc', LINES[L].c);
    if (id === sel.from || id === sel.to) b.classList.add('sel');
    if (sel.step === 'to' && id === sel.from) b.disabled = true;
    const name = document.createElement('span'); name.textContent = ST[id].n; b.appendChild(name);
    const cx = document.createElement('span'); cx.className = 'cx';
    linesOf(id).filter(o => o !== L).forEach(o => cx.appendChild(badge(o, 'mini')));
    b.appendChild(cx);
    b.addEventListener('click', () => pickStation(id));
    ul.appendChild(b);
  });
}
function refreshMap() {
  const sel = game.sel;
  document.querySelectorAll('#map .st').forEach(g => {
    g.classList.toggle('sel', g.dataset.id === sel.from || g.dataset.id === sel.to);
    g.classList.toggle('off', sel.step === 'to' && g.dataset.id === sel.from);
  });
  $('#selTitle').textContent = tr(sel.step === 'from' ? 'sel.from' : 'sel.to');
  $('#selSub').textContent = sel.from ? tr('sel.fromIs', { s: ST[sel.from].n }) : tr('sel.hint');
  buildList();
}
function openSelect() { game.sel = { step: 'from', from: null, to: null, pending: null }; $('#confirm').classList.remove('on'); refreshMap(); show('select'); }

/* ---------- Choix du mode (4 galères) ---------- */
function buildModes() {
  const box = $('#modeList'); box.innerHTML = '';
  MODE_ORDER.forEach(id => {
    const [name, desc] = trPair('mode.' + id, { fine: CFG.fine });
    const b = document.createElement('button'); b.className = 'choice m-' + id; b.dataset.mode = id;
    b.innerHTML = '<b></b><span></span><small></small>';
    b.querySelector('b').textContent = name; b.querySelector('span').textContent = desc;
    const best = bestOf(id); b.querySelector('small').textContent = best ? tr('diff.best', { s: best }) : '';
    b.addEventListener('click', () => {
      Snd.play('select'); game.mode = id;
      game.nextEvent = rollEvent(game.run && game.run.event);
      buildItin(); show('gen');
    });
    box.appendChild(b);
  });
}
function openModes() { buildModes(); show('diff'); }

function buildItin() {
  const legs = computeLegs(game.sel.from, game.sel.to), ul = $('#itin'); ul.innerHTML = '';
  const li = (L, main, sub) => {
    const l = document.createElement('li');
    l.appendChild(L ? badge(L) : Object.assign(document.createElement('i'), { className: 'badge X', textContent: '>' }));
    const d = document.createElement('div'); d.innerHTML = '<span></span><small></small>';
    d.querySelector('span').textContent = main; d.querySelector('small').textContent = sub; l.appendChild(d); ul.appendChild(l);
  };
  legs.forEach((L, i) => {
    if (i > 0) li(null, tr('itin.corr', { s: ST[L.from].n }), tr('itin.corrSub', { a: legs[i - 1].line, b: L.line }));
    li(L.line, ST[L.from].n + ' > ' + ST[L.to].n, tr('itin.dir', { d: LINES[L.line].dir[L.dir], n: L.stops }));
  });
  li(null, tr('itin.exit', { s: ST[game.sel.to].n }), tr(game.mode === 'sans' ? 'itin.exitSans' : 'itin.exitNavigo'));
  const [en, el] = trPair('event.' + game.nextEvent);
  $('#genMode').textContent = modeName(game.mode);
  $('#genEvent').textContent = tr('gen.event', { e: en }); $('#genEventP').textContent = el;
}

/* ---------- Fin de course ---------- */
export function showWin(run) {
  $('#wT').textContent = ST[run.from].n + ' > ' + ST[run.to].n;
  $('#wStamp').textContent = modeName(run.mode);
  const [title, why] = trPair('ttl.' + run.titles.main.id, { n: run.titles.main.n });
  $('#wTitle').textContent = title; $('#wWhy').textContent = why;
  const g = $('#wGrade'); g.textContent = run.grade; g.dataset.g = run.grade;
  $('#wScore').textContent = run.score;
  $('#wRecord').textContent = run.record ? tr('win.record') : run.prevBest ? tr('win.best', { s: run.prevBest }) : '';
  $('#wRecord').classList.toggle('new', !!run.record);
  const rows = [[tr('win.ser'), Math.round(run.ser) + ' %'], [tr('win.coins'), run.coins],
                [tr('win.hero'), run.heroBonus ? tr('win.heroBonus', { n: run.hero, b: run.heroBonus }) : run.hero],
                [tr('win.hits'), run.st.hits], [tr('win.event'), trPair('event.' + run.event)[0]], [tr('win.corr'), run.legs.length - 1],
                [tr('win.time'), tr('win.timeV', { m: Math.floor(run.time / 60), s: String(Math.floor(run.time % 60)).padStart(2, '0') })]];
  if (run.st.fines) rows.push([tr('win.fines'), run.st.fines]);
  const dl = $('#wStats'); dl.innerHTML = '';
  rows.forEach(([a, b]) => { const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = a; dd.textContent = b; dl.append(dt, dd); });
  const bx = $('#wBadges'); bx.innerHTML = '';
  if (run.titles.badges.length) {
    const h = document.createElement('div'); h.className = 'bh'; h.textContent = tr('win.badges'); bx.appendChild(h);
    run.titles.badges.forEach(b => { const [t, w] = trPair('ttl.' + b.id, { n: b.n }); const d = document.createElement('div'); d.className = 'bdg'; d.innerHTML = '<b></b><small></small>'; d.querySelector('b').textContent = t; d.querySelector('small').textContent = w; bx.appendChild(d); });
  }
  run.shareText = tr('share.text', { title, a: ST[run.from].n, b: ST[run.to].n, mode: modeName(run.mode), grade: run.grade, score: run.score, tag: THEME.hashtag[getLang()] || THEME.hashtag.fr });
  show('win');
}
async function shareRun() {
  const run = game.run; if (!run || !run.shareText) return;
  const blob = await shareCardBlob(run);
  shareImage(blob, 'paname-' + run.grade + '-' + run.score + '.png', run.shareText, r => toast(r === 'saved' ? tr('share.saved') : r.startsWith('text:') ? r.slice(5) : tr('share.copied')));
}

// Bouton retour Android : remonte d'un écran
export function goBack() {
  if (game.state === 'play') return pause();
  if (game.state === 'pause') return resume();
  const back = { options: 'title', people: 'title', select: 'title', diff: 'select', gen: 'diff', over: 'title', win: 'title' }[current];
  if (current === 'select' && $('#confirm').classList.contains('on')) { $('#confirm').classList.remove('on'); return; }
  if (back === 'title') toTitle(); else if (back === 'select') openSelect(); else if (back === 'diff') openModes(); else if (back) show(back);
  else if (current === 'title') quitApp();
}

function relabel() { applyDom(); peopleBuilt = false; if (current === 'people') buildPeople(); if (current === 'diff') buildModes(); refreshMap(); syncOpts(); }

/* ---------- Branchement des boutons ---------- */
export function initScreens() {
  $('#logoL1').textContent = THEME.logo;
  document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => {
    Snd.init(); Snd.play('tap');
    const g = b.dataset.go;
    if (g === 'title') toTitle();
    else if (g === 'select') openSelect();
    else { if (g === 'people') buildPeople(); show(g); }
  }));
  $('#quitBtn').addEventListener('click', () => { if (isNative && platform === 'android') quitApp(); else toast(tr('quit.toast')); });
  if (platform === 'ios') $('#quitBtn').hidden = true; // Apple déconseille les boutons « Quitter »

  const toggle = (id, fn) => $(id).addEventListener('click', () => { Snd.init(); fn(); syncOpts(); Snd.play('select'); });
  toggle('#optMusic', () => Snd.setOn('music', !Snd.on.music));
  toggle('#optSfx', () => Snd.setOn('sfx', !Snd.on.sfx));
  toggle('#optAmb', () => Snd.setOn('amb', !Snd.on.amb));
  toggle('#optHaptics', () => { setHaptics(!hapticsEnabled()); haptic('medium'); });
  const langBox = $('#optLang');
  LANGS.forEach(l => { const b = document.createElement('button'); b.className = 'langbtn'; b.dataset.lang = l; b.textContent = l.toUpperCase(); b.addEventListener('click', () => { Snd.play('select'); setLang(l); relabel(); }); langBox.appendChild(b); });
  syncOpts();

  $('#yesBtn').addEventListener('click', () => {
    Snd.play('select'); $('#confirm').classList.remove('on');
    const sel = game.sel;
    if (sel.step === 'from') { sel.from = sel.pending; sel.step = 'to'; refreshMap(); }
    else { sel.to = sel.pending; refreshMap(); openModes(); }
  });
  $('#noBtn').addEventListener('click', () => { Snd.play('tap'); $('#confirm').classList.remove('on'); game.sel.pending = null; });
  $('#startRun').addEventListener('click', () => { Snd.init(); newRun(); });
  $('#genBack').addEventListener('click', () => { Snd.play('tap'); openModes(); });
  $('#bnGo').addEventListener('click', () => {
    Snd.init();
    const next = game.bannerNext; game.bannerNext = null;
    if (next) next(); else startPlaying();   // le synopsis enchaîne sur la phase 1
  });
  $('#retryBtn').addEventListener('click', () => { Snd.play('tap'); newRun(); });
  $('#againBtn').addEventListener('click', () => { Snd.play('tap'); newRun(); });
  $('#shareBtn').addEventListener('click', shareRun);
  $('#pauseBtn').addEventListener('click', () => pause());
  $('#resumeBtn').addEventListener('click', resume);
  $('#pauseMenu').addEventListener('click', () => toTitle());
  applyDom();
}
