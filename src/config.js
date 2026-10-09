// ============================================================
//  RÉGLAGES DU JEU — modifiez ces valeurs pour équilibrer le jeu.
//  Les réglages propres à chaque mode sont dans data/modes.js,
//  ceux des événements du jour dans data/events.js.
// ============================================================
export const CFG = {
  player: { speed: 200, radius: 11, invulnerableAfterHit: 0.7 },

  // Phases 1 et 3 (couloirs qui défilent)
  scrollSpeed: 68,          // vitesse de défilement (unités logiques / s)
  phase1Length: 1900,       // distance à parcourir avant le quai
  phase3Length: 1700,       // distance à parcourir avant la sortie
  spawnEvery: [0.95, 0.6],  // délai entre deux apparitions : début → fin de phase
  groupChance: .35,         // probabilité qu'un « basique » arrive en groupe de 3

  // Objets
  leaf:   { duration: 8, radius: 6, speedMul: 1.3 },  // Feuille de légèreté : on rapetisse
  pardon: { duration: 8 },                            // Pardon (mains jointes) : invincible
  aura:   { duration: 7, radius: 34 },                // Aura de sécurité : bulle qui éjecte les gêneurs
  gel:    { heal: 15 },                               // Gel hydroalcoolique (mode Pandémie)
  itemEvery: [8, 12],       // délai entre deux objets dans les couloirs (s)

  // Shlaggs rares : chance qu'un Shlagg soit spécial, et ce qu'il rapporte quand on le touche
  rare: { shiny: .04, rolex: .09 },
  bonus: { shiny: { coins: 15, hero: 3 }, rolex: { coins: 8, hero: 1 }, pq: 5 },

  // Mode sans Navigo
  fine: 10,                                    // amende en pièces
  jump: { taps: 6, time: 2.5, failDmg: 4 },    // sauter les tourniquets : appuis, temps imparti (s), dégâts si raté

  // Phase 2 (wagon) — valeurs de base, ajustées par le mode (data/modes.js)
  wagon: {
    baseTime: 16, timePerStop: 12, minTime: 26, maxTime: 52,
    seatRegen: 9, strapRegen: 4, strapGlareEvery: 3.5, strapGlareDmg: 3,
    brakeEvery: [6, 10], brakePush: 24,
    standDmg: 2,
    doorTime: 4.2,          // durée d'ouverture des portes en station (s)
    seatLeaveChance: .18,   // chance qu'un voyageur assis descende à chaque station (libère une place)
    boardSeatChance: .4     // chance qu'un voyageur qui monte fonce sur une place libre
  },

  // Notifications du HUD
  notify: { time: 1.9, min: .7 },

  // Itinéraire : une correspondance « coûte » autant que N stations
  transferCost: 3
};
