// ============================================================
//  ÉVÉNEMENTS DU JOUR — un par course, tiré au hasard, pour que
//  chaque partie soit différente. Textes : i18n 'event.<id>'.
//  w : probabilité relative · mul : multiplie le poids d'un personnage
//  slippery : sol glissant (inertie) · drain : sérénité perdue / s (hors siège)
//  groups : multiplie la taille des groupes
// ============================================================
export const EVENTS = {
  calme:     { w: 3, mul: {} },
  pluie:     { w: 1.2, mul: { encombrant: 1.3 }, slippery: true },
  canicule:  { w: 1, mul: { susu: 3, shlagg: 1.4 }, drain: .5 },
  fete:      { w: 1, mul: { artiste: 3.5 } },
  soldes:    { w: 1, mul: { encombrant: 2.5, voleur: 1.8 } },
  match:     { w: 1, mul: { runner: 2.2 }, groups: 2 },
  touristes: { w: 1, mul: { encombrant: 2.2, theologiste: 1.5 } },
  pleinelune:{ w: .6, mul: { shlagg: 2.5 }, rareMul: 3 }     // les Shlaggs rares sortent plus souvent
};
