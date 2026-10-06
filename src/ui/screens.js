// ============================================================
//  ÉCRANS (HTML) : menus, options, bestiaire, choix du trajet,
//  itinéraire, bannières, pause, fin de partie.
// ============================================================
import { Snd } from '../audio/audio.js';
import { CFG } from '../config.js';
import { game } from '../core/state.js';
import { $ } from '../core/utils.js';
import { BESTIARY, T } from '../data/characters.js';
import { LINES, LINE_ST, ST, computeLegs, linesOf } from '../data/network.js';
import { newRun, pause, resume, startPlaying, toTitle } from '../game/run.js';
import { LANGS, applyDom, charFx, charName, getLang, setLang, tr } from '../i18n/i18n.js';
import { hapticsEnabled, haptic, isNative, platform, quitApp, setHaptics, shareText } from '../platform/native.js';
import { KIND, NEG_SKINS, SKINNED, SKINS, drawEnt } from '../render/sprites.js';

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

/* ---------- Bestiaire ---------- */
let peopleBuilt = false;
function buildPeople() {
  if (peopleBuilt) return; peopleBuilt = true;
  const list = $('#peopleList'); list.innerHTML = '';
  const params = k => ({ dmg: T[k].dmg, fine: CFG.fine, leaf: CFG.leaf.duration, pardon: CFG.pardon.duration });
  BESTIARY.forEach(([title, keys]) => {
    const h = document.createElement('h3'); h.textContent = tr(title); list.appendChild(h);
    keys.forEach((k, i) => {
      const row = document.createElement('div'); row.className = 'prow';
      const c = document.createElement('canvas'); c.width = 24; c.height = 24;
      drawEnt(c.getContext('2d'), { type: k, x: k === 'poussette' ? 20 : 24, y: 28, t: 0, skin: !SKINNED.includes(k) ? undefined : KIND.includes(k) ? (i * 3) % SKINS.length : NEG_SKINS[i % NEG_SKINS.length] }, 0.3);
      const txt = document.createElement('div'); txt.innerHTML = '<b></b><span></span>';
      txt.querySelector('b').textContent = charName(k); txt.querySelector('span').textContent = charFx(k, params(k));
      row.append(c, txt); list.appendChild(row);
    });
  });
}

/* ---------- Plan & choix des stations ---------- */
const MAPPOS = {
  saintgermain: [18, 112], ladefense: [62, 112], etoile: [110, 124], auber: [146, 124], chatelet: [184, 146], gdl: [216, 166], nation: [246, 160],
  vincennes: [276, 160], valdefontenay: [306, 150], marne: [344, 170],
  cdg: [254, 18], gdn: [192, 92], stmichel: [178, 168], luxembourg: [172, 190], denfert: [172, 212], massy: [146, 262], saintremy: [104, 290],
  versailles: [30, 232], champdemars: [104, 168], invalides: [128, 154], orsay: [152, 160], austerlitz: [206, 186], bnf: [222, 206], juvisy: [226, 262],
  creil: [168, 12], stadefrance: [186, 50], corbeil: [250, 294],
  nanterre: [24, 88], portemaillot: [104, 100], haussmann: [148, 102], pantin: [232, 92], rosny: [272, 118], tournan: [348, 214]
};
function pickStation(id) {
  const sel = game.sel;
  if (sel.step === 'to' && id === sel.from) return;
  Snd.init(); Snd.play('tap'); sel.pending = id;
  $('#confirmQ').textContent = tr(sel.step === 'from' ? 'sel.askFrom' : 'sel.askTo', { s: ST[id].n });
  $('#confirm').classList.add('on'); $('#yesBtn').focus();
}
export function buildMap() {
  const svg = $('#map'), NS = 'http://www.w3.org/2000/svg';
  svg.innerHTML = '';
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
    const b = document.createElement('button'); b.className = 'tab badge ' + L; b.textContent = L; b.setAttribute('aria-label', 'RER ' + L);
    b.addEventListener('click', () => { Snd.play('tap'); game.selLine = L; buildList(); });
    tabs.appendChild(b);
  });
}
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
    linesOf(id).filter(o => o !== L).forEach(o => { const i = document.createElement('i'); i.className = 'badge mini ' + o; i.textContent = o; cx.appendChild(i); });
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

function buildItin() {
  const legs = computeLegs(game.sel.from, game.sel.to), ul = $('#itin'); ul.innerHTML = '';
  const li = (badge, main, sub) => {
    const l = document.createElement('li');
    l.innerHTML = (badge ? `<i class="badge ${badge}">${badge}</i>` : '<i class="badge X">&gt;</i>') + '<div><span></span><small></small></div>';
    l.querySelector('span').textContent = main; l.querySelector('small').textContent = sub; ul.appendChild(l);
  };
  legs.forEach((L, i) => {
    if (i > 0) li(null, tr('itin.corr', { s: ST[L.from].n }), tr('itin.corrSub', { a: legs[i - 1].line, b: L.line }));
    li(L.line, ST[L.from].n + ' > ' + ST[L.to].n, tr('itin.dir', { d: LINES[L.line].dir[L.dir], n: L.stops }));
  });
  li(null, tr('itin.exit', { s: ST[game.sel.to].n }), tr(game.mode === 'sans' ? 'itin.exitSans' : 'itin.exitNavigo'));
}

// Bouton retour Android : remonte d'un écran
export function goBack() {
  if (game.state === 'play') return pause();
  if (game.state === 'pause') return resume();
  const back = { options: 'title', people: 'title', select: 'title', diff: 'select', gen: 'diff', over: 'title', win: 'title' }[current];
  if (current === 'select' && $('#confirm').classList.contains('on')) { $('#confirm').classList.remove('on'); return; }
  if (back === 'title') toTitle(); else if (back === 'select') openSelect(); else if (back) show(back);
  else if (current === 'title') quitApp();
}

function relabel() { applyDom(); peopleBuilt = false; if (current === 'people') buildPeople(); refreshMap(); syncOpts(); }

/* ---------- Branchement des boutons ---------- */
export function initScreens() {
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
    else { sel.to = sel.pending; refreshMap(); show('diff'); }
  });
  $('#noBtn').addEventListener('click', () => { Snd.play('tap'); $('#confirm').classList.remove('on'); game.sel.pending = null; });
  document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { Snd.play('select'); game.mode = b.dataset.mode; buildItin(); show('gen'); }));
  $('#startRun').addEventListener('click', () => { Snd.init(); newRun(); });
  $('#bnGo').addEventListener('click', () => {
    Snd.init();
    const next = game.bannerNext; game.bannerNext = null;
    if (next) next(); else startPlaying();   // le synopsis enchaîne sur la phase 1
  });
  $('#retryBtn').addEventListener('click', () => { Snd.play('tap'); newRun(); });
  $('#againBtn').addEventListener('click', () => { Snd.play('tap'); newRun(); });
  $('#shareBtn').addEventListener('click', () => { const text = game.run && game.run.shareText; if (text) shareText(text, t => toast(t || tr('share.copied'))); });
  $('#pauseBtn').addEventListener('click', () => pause());
  $('#resumeBtn').addEventListener('click', resume);
  $('#pauseMenu').addEventListener('click', () => toTitle());
  $('#diffSans').dataset.i18nParams = JSON.stringify({ fine: CFG.fine, bonus: CFG.sansNavigoHeroBonus });
  applyDom();
}
