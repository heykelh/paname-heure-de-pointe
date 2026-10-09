// ============================================================
//  MODES DE JEU — chaque mode change la foule, les règles et le score.
//  spawnMul : densité de la foule dans les couloirs (×)
//  lenMul / wagonMul : longueur des couloirs / durée du trajet en wagon (×)
//  standers / freeSeats : voyageurs debout et places libres dans le wagon
//  extra : personnages en plus [id, poids] · mul : multiplie le poids d'un personnage
//  items : objets possibles dans les couloirs · mask : part des gens masqués
//  heroBonus : héroïsme offert à l'arrivée · scoreMul : multiplicateur de score
// ============================================================
export const MODES = {
  navigo: {
    spawnMul: 1, lenMul: 1, wagonMul: 1, standers: 22, freeSeats: 2,
    inspectors: false, jump: false, heroBonus: 0, scoreMul: 1,
    extra: [], mul: {}, items: ['feuille', 'pardon', 'aura'], mask: 0
  },
  sans: {
    spawnMul: 1, lenMul: 1, wagonMul: 1, standers: 22, freeSeats: 2,
    inspectors: true, jump: true, heroBonus: 2, scoreMul: 1.3,
    extra: [['controleur', .8]], mul: {}, items: ['feuille', 'pardon', 'aura'], mask: 0
  },
  greve: {
    spawnMul: 1.75, lenMul: 1.3, wagonMul: 1.3, standers: 34, freeSeats: 1,
    inspectors: false, jump: false, heroBonus: 3, scoreMul: 1.5, groupChance: .6,
    extra: [['trottinette', 1.3]], mul: { encombrant: 1.4, runner: 1.6 },
    items: ['feuille', 'pardon', 'aura', 'aura'], mask: 0,
    cortege: [6, 10],        // un cortège de manifestants traverse le couloir toutes les 6 à 10 s
    music: 'greve'
  },
  pandemie: {
    spawnMul: 1.15, lenMul: 1.1, wagonMul: 1, standers: 20, freeSeats: 2,
    inspectors: false, jump: false, heroBonus: 3, scoreMul: 1.5,
    extra: [['zombie', 1.1], ['tousseur', 1.6]], mul: { tchipeur: .6 },
    items: ['feuille', 'pardon', 'aura', 'gel', 'gel'], mask: .85,
    pq: [5, 8],              // un rouleau de PQ apparaît toutes les 5 à 8 s
    wagonZombies: 2,
    music: 'pandemie'
  }
};
export const MODE_ORDER = ['navigo', 'sans', 'greve', 'pandemie'];
