# Guide spin-off — « Heure de Pointe » dans une autre ville

Paname Heure de Pointe est construit pour être décliné : **NYC Rush Hour**, **London Rush Hour**, **Tokyo Rush Hour**, **Dakar Heure de Pointe**… Le moteur (déplacements, collisions, phases, HUD, notifications, score, partage, son) reste le même ; on change **l'univers**.

Ce guide liste tout ce qui est propre à Paris, dans l'ordre où le changer, avec l'exemple de **NYC Rush Hour**.

---

## 0. Créer le nouveau projet

Un spin-off = un **nouveau dépôt** (copie de celui-ci), pour que chaque jeu ait sa propre appli sur les stores.
```bash
# copier le dossier du projet, puis dans la copie :
rm -rf node_modules dist android ios .git
git init
pnpm install --frozen-lockfile
```
Garder la même sécurité pnpm (`pnpm-workspace.yaml` inchangé, versions exactes, jamais `npx` / `pnpm dlx`).

## 1. L'identité de l'appli

| Fichier | À changer | Exemple NYC |
|---|---|---|
| `package.json` | `name`, `description`, `version` (repartir à 1.0.0) | `nyc-rush-hour` |
| `capacitor.config.json` | `appId`, `appName` | `com.hyke.nycrushhour`, `NYC Rush Hour` |
| `index.html` | `<title>`, `description`, couleur `theme-color` | |
| `public/manifest.webmanifest` | `name`, `short_name`, `description`, couleurs | |
| `public/sw.js` | `CACHE` (préfixe unique : sinon les deux jeux partagent le cache) | `nycrh-v1.0.0` |
| `src/core/storage.js` | préfixe `phdp:` (records et réglages séparés) | `nycrh:` |
| `public/icons/`, `assets/` | icônes et écran de démarrage | |

## 2. Le thème : `src/theme/<ville>.js`

Copier `src/theme/paname.js` en `src/theme/nyc.js`, puis dans `src/theme/index.js` :
```js
import THEME from './nyc.js';
export default THEME;
```

Le thème contient :
- `id`, `logo` (grand titre de l'écran d'accueil, 6–8 lettres max), `hashtag` (fr / en).
- `network.lines` : chaque ligne avec sa couleur officielle `c`, la couleur du texte `ink`, et la **liste ordonnée** de ses stations (identifiants).
- `network.names` : nom affiché de chaque station.
- `network.term` : nom court des terminus (panneaux pixel, ~10 caractères).
- `network.megaHub` : la grande station « labyrinthe » (Châtelet → Times Sq–42 St).
- `map.viewBox` et `map.pos` : position de chaque station sur le plan SVG (coordonnées libres dans le viewBox).
- `colors` : l'ambiance (plaques, carrelage, frise, sol, sièges, affiches).

Exemple NYC (extrait) :
```js
export default {
  id: 'nyc', logo: 'NYC', hashtag: { fr: '#NYCRushHour', en: '#NYCRushHour' },
  network: {
    lines: {
      '1': { c: '#EE352E', ink: '#FFFFFF', stations: ['vancortlandt', 'columbus', 'times', 'penn14', 'southferry'] },
      '4': { c: '#00933C', ink: '#FFFFFF', stations: ['woodlawn', 'yankee', 'grandcentral', 'unionsq', 'bowlinggreen'] },
      '7': { c: '#B933AD', ink: '#FFFFFF', stations: ['flushing', 'queensboro', 'grandcentral', 'times', 'hudsonyards'] },
      'A': { c: '#0039A6', ink: '#FFFFFF', stations: ['inwood', 'columbus', 'times', 'fulton', 'jfk'] },
      'Q': { c: '#FCCC0A', ink: '#000000', stations: ['96st', 'times', 'unionsq', 'canal', 'coney'] },
      'L': { c: '#A7A9AC', ink: '#000000', stations: ['8av', 'unionsq', 'bedford', 'canarsie'] }
    },
    names: { times: 'Times Sq–42 St', grandcentral: 'Grand Central', unionsq: '14 St–Union Sq', coney: 'Coney Island', /* … */ },
    term: { vancortlandt: 'VAN CORTLANDT', southferry: 'S FERRY', coney: 'CONEY IS', /* … */ },
    megaHub: 'times'
  },
  map: { viewBox: '0 0 362 306', pos: { times: [150, 140], grandcentral: [190, 140], /* … */ } },
  colors: {
    enamel: '#111111',            // panneaux noirs du métro new-yorkais
    tile: '#F2EEE2', tileHi: '#FFFFFF', tileLo: '#D6D0C0', grout: '#9A968A',
    frieze: '#2E7D5B',            // mosaïques vertes
    floorA: '#7E7A72', floorB: '#88847C', floorLine: '#6A665E',
    seat: '#F2A900', seatHi: '#F8C850', strap: '#5A6A7A',
    posters: ['#EE352E', '#0039A6', '#FCCC0A', '#00933C', '#B933AD', '#FF6319']
  }
};
```
> Les identifiants de ligne doivent rester courts (1 caractère idéalement) : ils s'affichent dans un petit carré du HUD.

## 3. Les textes : `src/i18n/fr.js` et `en.js`

Tous les textes sont là. À réécrire pour la ville :
- `title.sub` (sous-titre du logo), `opt.*` si besoin.
- `story` (5 synopsis), `ph1.*`, `ph2.*`, `ph3.*` (« Escalator », « portillons »…), `itin.*`.
- `tick.1`, `tick.2`, `tick.3` (annonces absurdes : « Stand clear of the closing doors, please »…), `tick.<mode>`, `tick.event.<id>`.
- `mode.<id>`, `event.<id>`, `ttl.<id>` (titres de fin : « King of Fare Evasion », « Bodega Cat Whisperer »…).
- `char.<id>` : nom, réplique, description de chaque personnage.
- `share.text`, `share.img.kicker`, `plaque.*` (« UPTOWN », « EXIT »…).
- Gardez les `{variables}` telles quelles.

## 4. Les personnages : archétypes locaux

Le moteur connaît des **comportements** (voir `docs/GAME_DESIGN.md` §8). Pour chaque ville, on associe des archétypes locaux à ces comportements :

| Comportement | Paris | NYC (idées) |
|---|---|---|
| `walk` | Personne basique, Tchipeur | Commuter au téléphone, « It's showtime » qui annonce |
| `wander` | Shlagg, Susu Man | Mec au rat de pizza, voyageur en manspreading |
| `static` + aura | Accordéoniste | Breakdancers « It's showtime! », mariachis |
| `dash` + vol | Voleur | Vendeur de churros qui vous colle |
| `charge` | Poussette | Livreur à vélo électrique |
| `runner` | Runner | Coursier de Wall Street |
| `ctrl` | Contrôleur | Police du MTA |
| `march` | Manifestant (Grève) | Parade (Thanksgiving, St Patrick) |
| `scoot` | Trottinette | Skateur |
| `flee` (rare) | Shlagg Shiny | Pizza Rat Shiny |
| `friend` | Mendiant, dame à la canne | Musicien, mamie de Brooklyn |

Pour chaque personnage : `T` (`data/characters.js`), `WAVE`, `BESTIARY`, une palette dans `PAL` (`render/sprites.js`, coiffure `head` + silhouette `body`), ses accessoires dans `drawEnt`, son cri dans `Snd.hit()`, ses textes `char.<id>`.

> **Règle à conserver** : aucun personnage négatif à la peau foncée (`NEG_SKINS`, `LIGHT_DEB`) ; toutes les teintes pour les gentils et les voyageurs assis. Humour sur les situations, jamais sur une origine ou une religion.

## 5. Modes et événements

- `src/data/modes.js` : garder la structure, adapter le contenu. NYC : « With MetroCard » / « Turnstile Jumper » / « Blizzard » (sol glissant, foule en doudounes) / « Marathon Day » (runners partout).
- `src/data/events.js` : Snowstorm, Heatwave, Yankees game night, Fashion Week, Tourist season, Full moon…
- `src/data/titles.js` : conditions identiques, textes réécrits.

## 6. Le son et la musique

- `src/audio/tracks.js` : la valse musette est très parisienne. NYC : boucle jazz/hip-hop chiptune, Blizzard plus calme.
- Cris des personnages dans `Snd.hit()` ; annonces : `chime` (carillon) → les deux notes du métro new-yorkais (composer un motif **original**).
- Tout son peut aussi venir d'un fichier dans `public/sounds/` (voir README §12).
- Toujours des compositions **originales** (jamais un morceau existant).

## 7. Le décor

- `render/sprites.js` : `faience` (carrelage), `floorTiles`, `poster`, `wall`, `makeBG` utilisent `THEME.colors`. Pour un autre style de carrelage (mosaïques new-yorkaises), modifier ces fonctions.
- `render/renderer.js` : `drawWagon` (sièges, portes), `drawDecos` (quai, escalator), plaques via `plaque()`.
- `ui/share.js` : l'image de partage reprend logo, hashtag et couleurs du thème.

## 8. Vérifier

1. `pnpm build` sans erreur.
2. `pnpm dev`, ouvrir avec `?debug`, faire une course dans chaque mode (raccourcis : `game.phase.prog = game.phase.len`, `game.phase.timer = 1`).
3. Console sans erreur, bestiaire complet, plan cliquable, itinéraires avec correspondances corrects.
4. Les deux langues.

## 9. Checklist rapide

- [ ] Identité (package, appId, manifest, icônes, cache SW, préfixe de stockage)
- [ ] `theme/<ville>.js` + `theme/index.js`
- [ ] Textes FR et EN
- [ ] Personnages (stats, palettes, cris, textes, bestiaire)
- [ ] Modes, événements, titres
- [ ] Musiques et carillon
- [ ] Décor et image de partage
- [ ] Tests dans les 4 modes et les 2 langues
- [ ] README + CHANGELOG du spin-off
