// ============================================================
//  RÉGLAGES DU JEU — modifiez ces valeurs pour équilibrer le jeu
// ============================================================
export const CFG = {
  player: { speed: 200, radius: 11, invulnerableAfterHit: 0.7 },

  // Phases 1 et 3 (couloirs qui défilent)
  scrollSpeed: 68,          // vitesse de défilement (pixels logiques / s)
  phase1Length: 1900,       // distance à parcourir avant le quai
  phase3Length: 1700,       // distance à parcourir avant la sortie
  spawnEvery: [0.95, 0.6],  // délai entre deux apparitions : début → fin de phase

  // Objets
  leaf:   { duration: 8, radius: 6, speedMul: 1.3 },  // Feuille de légèreté
  pardon: { duration: 5 },                            // étoile d'invincibilité

  // Mode sans Navigo
  fine: 10,                 // amende en pièces
  sansNavigoHeroBonus: 2,

  // Phase 2 (wagon)
  wagon: {
    baseTime: 16, timePerStop: 12, minTime: 26, maxTime: 52,
    standers: 22,           // voyageurs debout au départ
    freeSeats: 2,           // places libres
    seatRegen: 9, strapRegen: 4, strapGlareEvery: 3.5, strapGlareDmg: 3,
    brakeEvery: [6, 10], brakePush: 24,
    standDmg: 2
  },

  // Itinéraire : une correspondance « coûte » autant que N stations
  transferCost: 3
};
