import fr from './fr.js';
import en from './en.js';
import { store } from '../core/storage.js';

const DICTS = { fr, en };
export const LANGS = Object.keys(DICTS);
let lang = store.get('lang', (navigator.language || 'fr').toLowerCase().startsWith('fr') ? 'fr' : 'en');

export function getLang() { return lang; }
export function setLang(l) { if (DICTS[l]) { lang = l; store.set('lang', l); document.documentElement.lang = l; applyDom(); } }

// tr('clé', { variable: valeur }) → texte traduit. Renvoie un tableau tel quel si la clé contient une liste.
export function tr(key, params) {
  let s = DICTS[lang][key] ?? DICTS.fr[key] ?? key;
  if (typeof s !== 'string') return s;
  return fmt(s, params);
}
export function fmt(s, params) {
  return params ? s.replace(/\{(\w+)\}/g, (m, k) => (params[k] !== undefined ? params[k] : m)) : s;
}
// Nom, réplique et description d'un personnage
export const charName = k => tr('char.' + k)[0];
export const charNote = k => tr('char.' + k)[1];
export const charFx = (k, params) => fmt(tr('char.' + k)[2], params);

// Remplit tous les éléments HTML marqués data-i18n="clé"
export function applyDom() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = tr(el.dataset.i18n, el.dataset.i18nParams ? JSON.parse(el.dataset.i18nParams) : undefined); });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', tr(el.dataset.i18nAria)));
}
