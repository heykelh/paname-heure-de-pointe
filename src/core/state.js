// État global du jeu, partagé entre les modules
export const game = {
  state: 'menu',   // 'menu' | 'banner' | 'play' | 'pause' | 'trans' | 'over' | 'win'
  run: null,       // la course en cours (trajet, sérénité, pièces…)
  phase: null,     // la phase en cours (entités, joueur, décor…)
  sel: { step: 'from', from: null, to: null, pending: null }, selLine: 'A',
  mode: 'navigo',  // 'navigo' | 'sans'
  BGC: null, PAT: null
};
