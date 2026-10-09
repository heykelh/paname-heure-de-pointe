// ============================================================
//  PERSONNAGES & OBJETS — statistiques de jeu.
//  Les noms et textes sont dans i18n/fr.js et i18n/en.js (clé 'char.<id>').
//  dmg : sérénité perdue · r : rayon de collision · beh : comportement
//  kind : 'item' (objet), 'friend' (à aider), 'bonus' (rapporte), 'deco'
//  aura : rayon d'une zone qui fait perdre auraDmg de sérénité par seconde
//  Pour ajouter un personnage : une ligne ici, une palette dans
//  render/sprites.js (PAL), des textes dans i18n, un son dans audio.hit().
// ============================================================
export const T = {
  basique:      { dmg: 6,  r: 10, beh: 'walk' },
  shlagg:       { dmg: 10, r: 11, beh: 'wander' },
  shlagg_shiny: { r: 11, beh: 'flee',   kind: 'bonus', bonus: 'shiny' },   // il fuit le joueur !
  shlagg_rolex: { r: 11, beh: 'wander', kind: 'bonus', bonus: 'rolex' },
  tchipeur:     { dmg: 5,  r: 10, beh: 'walk' },
  frotteur:     { dmg: 14, r: 10, beh: 'home' },
  susu:         { dmg: 9,  r: 11, beh: 'wander' },
  theologiste:  { dmg: 6,  r: 10, beh: 'static' },
  voleur:       { dmg: 3,  r: 10, beh: 'dash', steal: true },
  artiste:      { dmg: 8,  r: 11, beh: 'static', aura: 58, auraDmg: 5, auraSnd: 'aura' },
  enfant:       { dmg: 12, r: 8,  beh: 'erratic' },
  poussette:    { dmg: 15, r: 15, beh: 'charge' },
  encombrant:   { dmg: 8,  r: 17, beh: 'walk' },
  runner:       { dmg: 10, r: 10, beh: 'runner' },
  rambarde:     { dmg: 7,  r: 7,  beh: 'pole' },
  controleur:   { dmg: 0,  r: 10, beh: 'ctrl' },
  debout:       { dmg: 2,  r: 9,  beh: 'stand' },
  // Mode Grève
  manifestant:  { dmg: 9,  r: 10, beh: 'march' },
  trottinette:  { dmg: 13, r: 10, beh: 'scoot' },
  // Mode Pandémie
  zombie:       { dmg: 16, r: 10, beh: 'zombie' },
  tousseur:     { dmg: 4,  r: 10, beh: 'walk', aura: 50, auraDmg: 4, auraSnd: 'cough' },
  // Gentils et décor
  mendiant:     { r: 11, kind: 'friend', beh: 'static' },
  dame:         { r: 10, kind: 'friend', beh: 'dame' },
  pigeon:       { r: 6,  kind: 'deco', beh: 'pigeon' },
  // Objets
  piece:        { r: 8,  kind: 'item' },
  feuille:      { r: 9,  kind: 'item' },
  pardon:       { r: 10, kind: 'item' },
  aura:         { r: 10, kind: 'item' },
  gel:          { r: 9,  kind: 'item' },
  pq:           { r: 9,  kind: 'item' }
};

// Fréquence d'apparition dans les couloirs (plus le nombre est grand, plus c'est fréquent).
// Les modes (data/modes.js) et les événements du jour (data/events.js) modifient ces poids.
export const WAVE = [['basique', 5], ['tchipeur', 2], ['shlagg', 1.5], ['susu', 1.4], ['encombrant', 1.6], ['poussette', 1.1],
                     ['enfant', 1], ['runner', 1], ['voleur', 1], ['theologiste', .7], ['artiste', .6], ['frotteur', .7]];

// Ordre d'affichage dans « Les gens du métro »
export const BESTIARY = [
  ['people.avoid', ['basique', 'shlagg', 'tchipeur', 'frotteur', 'susu', 'theologiste', 'voleur', 'artiste', 'enfant', 'poussette', 'encombrant', 'runner', 'rambarde', 'controleur']],
  ['people.rare', ['shlagg_rolex', 'shlagg_shiny']],
  ['people.modes', ['manifestant', 'trottinette', 'tousseur', 'zombie']],
  ['people.help', ['mendiant', 'dame']], ['people.regulars', ['debout', 'pigeon']],
  ['people.items', ['piece', 'feuille', 'pardon', 'aura', 'gel', 'pq']]
];
