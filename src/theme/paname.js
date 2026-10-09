// ============================================================
//  THÈME « PANAME » — tout ce qui est propre à Paris et à son RER.
//  Pour un spin-off (ex. NYC Rush Hour), on copie ce fichier en
//  theme/nyc.js, on remplace les lignes, stations, couleurs et
//  on le sélectionne dans theme/index.js. Voir docs/SPINOFF_GUIDE.md.
// ============================================================
export default {
  id: 'paname',
  logo: 'PANAME',                 // grand titre de l'écran d'accueil
  hashtag: { fr: '#PanameHeureDePointe', en: '#PanameRushHour' },

  // ---------- Réseau : lignes (couleurs officielles) et stations principales ----------
  network: {
    lines: {
      A: { c: '#E3051C', ink: '#FFFFFF', stations: ['saintgermain', 'ladefense', 'etoile', 'auber', 'chatelet', 'gdl', 'nation', 'vincennes', 'valdefontenay', 'marne'] },
      B: { c: '#5291CE', ink: '#FFFFFF', stations: ['cdg', 'gdn', 'chatelet', 'stmichel', 'luxembourg', 'denfert', 'massy', 'saintremy'] },
      C: { c: '#FFCE00', ink: '#1D2A5C', stations: ['versailles', 'champdemars', 'invalides', 'orsay', 'stmichel', 'austerlitz', 'bnf', 'juvisy'] },
      D: { c: '#00814F', ink: '#FFFFFF', stations: ['creil', 'stadefrance', 'gdn', 'chatelet', 'gdl', 'juvisy', 'corbeil'] },
      E: { c: '#C04191', ink: '#FFFFFF', stations: ['nanterre', 'ladefense', 'portemaillot', 'haussmann', 'gdn', 'pantin', 'rosny', 'valdefontenay', 'tournan'] }
    },
    names: {
      saintgermain: 'Saint-Germain-en-Laye', ladefense: 'La Défense', etoile: 'Charles de Gaulle–Étoile', auber: 'Auber', chatelet: 'Châtelet–Les Halles',
      gdl: 'Gare de Lyon', nation: 'Nation', vincennes: 'Vincennes', valdefontenay: 'Val de Fontenay', marne: 'Marne-la-Vallée–Chessy',
      cdg: 'Aéroport CDG', gdn: 'Gare du Nord', stmichel: 'Saint-Michel–Notre-Dame', luxembourg: 'Luxembourg', denfert: 'Denfert-Rochereau',
      massy: 'Massy-Palaiseau', saintremy: 'Saint-Rémy-lès-Chevreuse', versailles: 'Versailles-Château', champdemars: 'Champ de Mars–Tour Eiffel',
      invalides: 'Invalides', orsay: 'Musée d\'Orsay', austerlitz: 'Gare d\'Austerlitz', bnf: 'Bibliothèque F. Mitterrand', juvisy: 'Juvisy',
      creil: 'Creil', stadefrance: 'Stade de France–Saint-Denis', corbeil: 'Corbeil-Essonnes', nanterre: 'Nanterre–La Folie',
      portemaillot: 'Porte Maillot', haussmann: 'Haussmann–Saint-Lazare', pantin: 'Pantin', rosny: 'Rosny-Bois-Perrier', tournan: 'Tournan'
    },
    // nom court des terminus, pour les panneaux pixel (« QUAI CDG »)
    term: { saintgermain: 'ST-GERMAIN', marne: 'CHESSY', cdg: 'CDG', saintremy: 'ST-RÉMY', versailles: 'VERSAILLES', juvisy: 'JUVISY',
            creil: 'CREIL', corbeil: 'CORBEIL', nanterre: 'NANTERRE', tournan: 'TOURNAN' },
    // la grande gare de correspondance (blague des « 12 km de couloirs »)
    megaHub: 'chatelet'
  },

  // ---------- Plan schématique (écran de choix du trajet) ----------
  map: {
    viewBox: '0 0 362 306',
    pos: {
      saintgermain: [18, 112], ladefense: [62, 112], etoile: [110, 124], auber: [146, 124], chatelet: [184, 146], gdl: [216, 166], nation: [246, 160],
      vincennes: [276, 160], valdefontenay: [306, 150], marne: [344, 170],
      cdg: [254, 18], gdn: [192, 92], stmichel: [178, 168], luxembourg: [172, 190], denfert: [172, 212], massy: [146, 262], saintremy: [104, 290],
      versailles: [30, 232], champdemars: [104, 168], invalides: [128, 154], orsay: [152, 160], austerlitz: [206, 186], bnf: [222, 206], juvisy: [226, 262],
      creil: [168, 12], stadefrance: [186, 50], corbeil: [250, 294],
      nanterre: [24, 88], portemaillot: [104, 100], haussmann: [148, 102], pantin: [232, 92], rosny: [272, 118], tournan: [348, 214]
    }
  },

  // ---------- Couleurs de l'ambiance ----------
  colors: {
    enamel: '#1D2A5C',          // plaques émaillées bleues (panneaux, HUD, menus)
    tile: '#F4F4EC', tileHi: '#FFFFFF', tileLo: '#D8DCD0', grout: '#A8ACA4',   // carreaux biseautés blancs
    frieze: '#F07D19',          // frise orange des couloirs
    floorA: '#8C8E88', floorB: '#979993', floorLine: '#7A7C76',
    seat: '#2B3E8C', seatHi: '#4A5EB0', strap: '#E4572E',
    posters: ['#E83A6A', '#2E8BD8', '#F2C230', '#3AB86A', '#F07D19', '#8C4FBF']
  }
};
