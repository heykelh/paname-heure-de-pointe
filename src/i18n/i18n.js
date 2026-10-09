// ============================================================
//  TRADUCTIONS — tr('clé', { variable: valeur }) renvoie le texte
//  dans la langue choisie. Les textes sont dans fr.js et en.js.
// ============================================================
import fr from './fr.js';
import en from './en.js';
import { store } from '../core/storage.js';

const DICTS = { fr, en };
export const LANGS = Object.keys(DICTS);
let lang = store.get('lang', (navigator.language || 'fr').toLowerCase().startsWith('fr') ? 'fr' : 'en');

export function getLang() { return lang; }
export function setLang(l) { if (DICTS[l]) { lang = l; store.set('lang', l); document.documentElement.lang = l; applyDom(); } }

// Renvoie le texte (ou le tableau) associé à la clé ; la clé elle-même si elle n'existe pas.
export function tr(key, params) {
  const s = DICTS[lang][key] ?? DICTS.fr[key] ?? key;
  if (typeof s !== 'string') return s;
  return fmt(s, params);
}
export function fmt(s, params) {
  return params ? s.replace(/\{(\w+)\}/g, (m, k) => (params[k] !== undefined ? params[k] : m)) : s;
}
// Personnages : 'char.<id>' = [nom, réplique, description]
export const charName = k => tr('char.' + k)[0];
export const charNote = k => tr('char.' + k)[1];
export const charFx = (k, params) => fmt(tr('char.' + k)[2], params);
// Modes : 'mode.<id>' = [nom, description] · Événements : 'event.<id>' = [nom, annonce]
export const modeName = id => tr('mode.' + id)[0];
export const eventName = id => tr('event.' + id)[0];
// Tableau de textes au hasard (répliques, annonces…)
export const trAny = key => { const a = tr(key); return Array.isArray(a) ? a[Math.floor(Math.random() * a.length)] : a; };

// Remplit tous les éléments HTML marqués data-i18n="clé"
export function applyDom() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = tr(el.dataset.i18n, el.dataset.i18nParams ? JSON.parse(el.dataset.i18nParams) : undefined); });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', tr(el.dataset.i18nAria)));
}
// Paire [titre, sous-titre] avec variables remplacées (notifications 'n.<id>', modes, événements…)
export const trPair = (key, params) => { const a = tr(key); return Array.isArray(a) ? a.map(s => fmt(s, params)) : [fmt(String(a), params), '']; };
