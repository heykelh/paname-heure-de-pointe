// ============================================================
//  NOTIFICATIONS — affichées en haut à droite, dans le HUD, avec
//  l'avatar du personnage et son nom (le terrain reste dégagé).
//  + petits chiffres qui s'envolent sur le terrain (« -6 », « +15 »).
// ============================================================
import { Snd } from '../audio/audio.js';
import { CFG } from '../config.js';
import { game } from '../core/state.js';

// Couleurs des titres
export const NC = { red: '#F87858', gold: '#F8D878', green: '#58D854', grey: '#BCBCBC', blue: '#7FE0F8', pink: '#F878F8', white: '#F8F8F8' };

/* notify(titre, sous-titre, options)
   options.ent  : l'entité à montrer en avatar (on en garde une copie)
   options.icon : 'leaf' | 'hands' | 'bubble' | 'gel' | 'pq' | 'coin' | 'hero' | 'seat' | 'ticket' | 'brake' | 'station'
   options.col  : couleur du titre (clé de NC ou #RRGGBB)
   options.pop  : { x, y, text, col } → petit texte qui s'envole sur le terrain
   options.key  : si une notification de même clé est affichée, elle est remplacée (pas d'empilement)
   options.quiet: pas de « blip » */
export function notify(title, sub, o = {}) {
  const N = game.notes;
  if (o.pop) popup(o.pop.x, o.pop.y, o.pop.text, o.pop.col);
  const ent = o.ent ? { type: o.ent.type, skin: o.ent.skin, v: o.ent.v, mask: o.ent.mask, t: 0, x: 0, y: 0 } : null;
  const note = { title: String(title || ''), sub: String(sub || ''), ent, icon: o.icon || null, col: NC[o.col] || o.col || NC.white, key: o.key || null, t: 0 };
  if (note.key && N.cur && N.cur.key === note.key) { Object.assign(N.cur, note); return; }
  if (note.key) { const i = N.queue.findIndex(q => q.key === note.key); if (i >= 0) { N.queue[i] = note; return; } }
  N.queue.push(note);
  while (N.queue.length > 3) N.queue.shift();   // trop de monde : on oublie les plus anciennes
  if (!o.quiet) Snd.play('notify');
}
export function clearNotes() { game.notes.queue = []; game.notes.cur = null; }

export function updateNotes(dt) {
  const N = game.notes;
  if (N.cur) {
    N.cur.t += dt;
    const limit = N.queue.length ? CFG.notify.min : CFG.notify.time;
    if (N.cur.t >= limit) N.cur = null;
  }
  if (!N.cur && N.queue.length) N.cur = N.queue.shift();
  const P = game.phase;
  if (P && P.pops) { P.pops.forEach(p => p.t += dt); P.pops = P.pops.filter(p => p.t < .9); }
}

// Petit texte qui monte depuis (x, y) en unités logiques
export function popup(x, y, text, col = 'red') {
  const P = game.phase; if (!P) return;
  (P.pops = P.pops || []).push({ x, y, text: String(text), col: NC[col] || col, t: 0 });
}
