// État global du jeu, partagé entre les modules
export const game = {
  state: 'menu',   // 'menu' | 'banner' | 'play' | 'pause' | 'trans' | 'over' | 'win'
  run: null,       // la course en cours (trajet, sérénité, pièces, statistiques…)
  phase: null,     // la phase en cours (entités, joueur, décor…)
  notes: { queue: [], cur: null },   // notifications affichées dans le HUD
  sel: { step: 'from', from: null, to: null, pending: null }, selLine: 'A',
  mode: 'navigo',  // 'navigo' | 'sans' | 'greve' | 'pandemie'  (voir data/modes.js)
  bannerNext: null,
  BGC: null, PAT: null
};
