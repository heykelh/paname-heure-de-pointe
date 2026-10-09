# Paname Heure de Pointe — v1.0

> Survivre à l'heure de pointe du RER parisien, en pixel art rétro façon NES.
> Jeu web + appli Android/iOS, en français et en anglais.
> En ligne : **https://paname-heure-de-pointe.vercel.app/**

Esquivez la foule, gardez votre **sérénité**, ramassez des pièces, aidez les gens (ça rapporte de l'**héroïsme**), trouvez une place assise dans le wagon… et arrivez à destination sans péter un câble. À la fin, le jeu vous attribue un **titre drôle** (« Roi de la fraude », « MVP du don de la place », « Tu t'es fait trop peta des thunes, petite frappe »…) et une **carte à partager** sur les réseaux.

---

## Sommaire

1. [Le jeu en bref](#1-le-jeu-en-bref)
2. [Comment se déroule une partie](#2-comment-se-déroule-une-partie)
3. [Les 4 modes de jeu](#3-les-4-modes-de-jeu)
4. [Les événements du jour](#4-les-événements-du-jour)
5. [Les personnages](#5-les-personnages)
6. [Les objets](#6-les-objets)
7. [L'écran de jeu (HUD)](#7-lécran-de-jeu-hud)
8. [Score, note, titres drôles et partage](#8-score-note-titres-drôles-et-partage)
9. [Le son](#9-le-son)
10. [Installer, lancer, publier](#10-installer-lancer-publier)
11. [Organisation du code : où modifier quoi](#11-organisation-du-code--où-modifier-quoi)
12. [Mettre tes propres sons](#12-mettre-tes-propres-sons)
13. [Mode test (debug)](#13-mode-test-debug)
14. [Faire un spin-off (NYC Rush Hour…)](#14-faire-un-spin-off-nyc-rush-hour)
15. [À savoir avant de publier](#15-à-savoir-avant-de-publier)

L'historique complet des versions est dans **[CHANGELOG.md](CHANGELOG.md)**.
Le document de game design est dans **[docs/GAME_DESIGN.md](docs/GAME_DESIGN.md)**.

---

## 1. Le jeu en bref

| | |
|---|---|
| **Genre** | Jeu d'esquive / runner vertical, parties de 2 à 5 minutes |
| **Univers** | Le RER parisien à l'heure de pointe (lignes A, B, C, D, E et leurs grandes stations) |
| **Style** | Pixel art NES (180×320 pixels agrandis), couleurs officielles du métro et du RER, carrelage blanc biseauté, plaques émaillées bleues |
| **Ton** | Humour parisien du quotidien : tchips, Shlaggs, accordéonistes, strapontins, contrôleurs… |
| **Plateformes** | Navigateur (PWA installable, marche hors ligne), Android et iOS (Capacitor) |
| **Langues** | Français et anglais (détection automatique, choix dans Options) |
| **Commandes** | Le doigt posé n'importe où : le personnage suit le glissé. Clavier : flèches ou ZQSD, Espace pour sauter les tourniquets, P pour la pause |

**La jauge à surveiller : la sérénité (100 %).** Chaque bousculade en fait perdre. À 0 %, c'est le game over : « Vous avez pété un câble. »

## 2. Comment se déroule une partie

1. **Choix du trajet** sur le plan du RER (ou dans la liste par ligne). Le jeu calcule l'itinéraire le plus court ; une correspondance « coûte » 3 stations.
2. **Choix du mode** (4 « galères », voir plus bas). Le record de chaque mode est affiché.
3. **Votre course** : l'itinéraire détaillé et l'**événement du jour** tiré au hasard (pluie, canicule, soldes…).
4. **Synopsis** : une petite histoire trop sérieuse (rendez-vous crucial, entretien d'embauche, le gratin de maman qui refroidit…).
5. **Phase 1 — rejoindre le quai** : le couloir défile. On passe d'abord les tourniquets (bip Navigo, ou saut en mode Sans Navigo), puis on esquive la foule jusqu'au quai.
6. **Phase 2 — survivre au wagon** : vue de dessus d'une rame bondée. Les places libres clignotent : s'asseoir recharge la sérénité. À chaque station, les portes s'ouvrent : **des voyageurs descendent, d'autres montent et foncent sur les places libres**. Freinages brutaux, regards noirs sur les strapontins, dame à la canne à qui céder sa place.
7. **Correspondance** (si besoin) : phases 1 et 2 recommencent sur la ligne suivante.
8. **Phase 3 — atteindre la sortie** : couloir, escalator, portillons de sortie (contrôleurs en mode Sans Navigo).
9. **Fin de course** : note (S à D), score, record, titre drôle, mentions, et carte à partager.

## 3. Les 4 modes de jeu

| Mode | Ce qui change | Bonus |
|---|---|---|
| **Avec Navigo** | Le mode normal. La foule, rien que la foule. | — |
| **Sans Navigo** | Tourniquets fermés : il faut **tapoter vite** pour les sauter (« Oh le fraudeur ! Sale pauvre ! »). Des **contrôleurs** balaient le couloir du regard : être vu coûte 10 pièces, ou la partie si on ne peut pas payer. Ils patrouillent en équipe à la sortie. | +2 héroïsme à l'arrivée, score ×1,3 |
| **Grève** | Deux fois plus de monde, des groupes plus gros, couloirs et trajet plus longs, 34 voyageurs debout et **une seule** place libre dans le wagon. Des **cortèges de manifestants** traversent le couloir en rang serré avec leur banderole « GRÈVE ! », et des **trottinettes** foncent en diagonale. Musique de fanfare, annonces spéciales. | +3 héroïsme, score ×1,5 |
| **Pandémie** | Ambiance Covid : **la plupart des gens portent un masque** (souvent sous le nez…). Des **tousseurs** répandent un nuage qui fait fondre la sérénité, des **zombies** vous suivent lentement partout, y compris dans le wagon. Le **gel hydroalcoolique** soigne, les **rouleaux de PQ** rapportent gros. Musique inquiétante. | +3 héroïsme, score ×1,5 |

Tous les réglages des modes sont dans `src/data/modes.js`.

## 4. Les événements du jour

Chaque course tire un événement au hasard (jamais deux fois de suite le même), annoncé dans le synopsis, sur l'écran « Votre course » et dans le HUD. Il change la foule et parfois les règles, pour que **deux parties ne se ressemblent jamais**.

| Événement | Effet |
|---|---|
| Jour normal | Rien de spécial (c'est déjà beaucoup) |
| Jour de pluie | Sol glissant : le personnage a de l'inertie, plus de voyageurs encombrants |
| Canicule | La sérénité fond toute seule quand on est debout, Susu Men ×3 |
| Fête de la musique | Accordéonistes ×3,5 |
| Premier jour des soldes | Sacs géants et voleurs en masse |
| Soir de match | Supporters en groupes de 4, runners en retard |
| Invasion de touristes | Valises et théologistes partout |
| Pleine lune | Les Shlaggs rares sortent **3 fois plus souvent** |

Réglages : `src/data/events.js`. Textes : clés `event.<id>` dans `src/i18n/fr.js` et `en.js`.

## 5. Les personnages

Tous dessinés en code (pixel art original 12×18, avec ombrages), dans `src/render/sprites.js`.

**À éviter** (perte de sérénité entre parenthèses) : Personne basique (6), Shlagg (10), Tchipeur (5, bulle « TCHIP »), Frotteur sauvage (14, vous suit), Susu Man (9), Théologiste (6, immobile), Voleur (3 + vole une pièce), L'artiste (accordéon : la sérénité fond dans son rayon), Enfant agité (12, trajectoire folle), Poussette infernale (15, fonce tout droit), Voyageur encombrant (8, valise), Runner (10, annoncé par un « ! »), Rambarde salée (7, dans le wagon), Contrôleur (amende, mode Sans Navigo).

**Raretés — à toucher !**
- **Shlagg à la Rolex** (≈ 9 % des Shlaggs) : lunettes noires, chaîne en or, Rolex qui brille. Le toucher rapporte **+8 pièces et +1 héroïsme**.
- **Shlagg Shiny** (≈ 4 % des Shlaggs) : il change de couleur et scintille… **et il vous fuit**. L'attraper rapporte **+15 pièces et +3 héroïsme**, et le titre légendaire « Chasseur de Shlagg Shiny ».

**Spécial Grève et Pandémie** : Manifestant (9, en cortège), Trottinette (13, en diagonale), Tousseur (4 + nuage de toux), Zombie (16, lent mais il vous suit).

**À aider** : Mendiant (donnez une pièce : +1 héroïsme), Dame à la canne (cédez-lui votre place dans le wagon : +1 héroïsme).

**Les habitués** : Voyageur debout (le mur humain du wagon, 2 par bousculade), Pigeon (inoffensif, il s'envole).

> Règle de conception : **aucun personnage négatif n'a la peau foncée** (teintes claires uniquement pour les gêneurs). Toutes les teintes sont utilisées pour les personnages bienveillants et les voyageurs assis. Voir `NEG_SKINS`, `LIGHT_DEB` et `KIND` dans `sprites.js`.

## 6. Les objets

| Objet | Effet | Où |
|---|---|---|
| Pièce | +1 pièce (pour donner, payer les amendes, le score) | Partout |
| Feuille de légèreté | On rapetisse 8 s : hitbox réduite, on va plus vite | Tous modes |
| **Pardon** (deux mains jointes) | Invincible 8 s, musique « Envol » | Tous modes |
| **Aura de sécurité** (bulle) | 7 s dans une bulle : **tout gêneur qui la touche rebondit, s'envole en tournoyant avec un cri drôle et disparaît dans un « POF »**. Dans le wagon, elle écarte la foule. +50 points par éjection | Tous modes (2× plus en Grève) |
| Gel hydroalcoolique | +15 sérénité | Pandémie |
| Rouleau de PQ | +5 pièces | Pandémie |

**Série zen** : toutes les 15 secondes sans bousculade, des pièces en bonus (+2, +4, +6…).

## 7. L'écran de jeu (HUD)

La barre du haut (36 pixels) :

- **À gauche** : un **visage d'humeur** (souriant → inquiet → furieux), la **jauge de sérénité** lisse (verte, jaune puis rouge clignotante, avec une traînée blanche après chaque choc), le pourcentage, les pièces, l'héroïsme, le chrono du wagon, la ligne, et les **effets actifs** avec leur temps restant (mains, bulle, feuille). Sans effet actif : le mode et l'événement du jour.
- **À droite : la carte de notification**. Quand on bouscule quelqu'un, son **avatar**, son **nom** et sa **réplique** s'affichent ici, en même temps que son cri. Le terrain reste dégagé : seuls de petits chiffres s'envolent (« -6 », « +15 », « POF ! »). Quand il ne se passe rien, la carte affiche l'**objectif** (« PROCHAIN ARRÊT : GARE DE LYON »…).
- **En bas** : le bandeau d'annonces défilant (annonces RATP absurdes, spéciales Grève, Pandémie et événement du jour).
- Le bouton pause est en bas à gauche, sur le mur.

## 8. Score, note, titres drôles et partage

**Score** = sérénité × 10 + pièces × 20 + héroïsme × 150 − bousculades × 30 + éjections × 50 + Shiny × 500 + Rolex × 200 + meilleure série zen × 4, multiplié par le bonus du mode.
**Note** : S (4500+), A (3200+), B (2200+), C (1300+), D. Un **record par mode** est sauvegardé sur l'appareil.

**Titre drôle** : le jeu choisit le plus marquant parmi 23 titres, plus 2 mentions. Exemples : Chasseur de Shlagg Shiny, Roi de la fraude, Patient zéro, Baron du PQ, Bulle humaine, MVP du don de la place, Meilleur donateur de pièces, Tu t'es fait trop peta des thunes petite frappe, Ami des contrôleurs, Ninja du métro, Moine bouddhiste du RER, Auto-tamponneuse humaine, À deux doigts du pétage de plomb, Picsou de Châtelet, Fan de strapontin, Terreur des pigeons, Aimant à Shlagg, Jambes en béton…
Conditions : `src/data/titles.js`. Textes : clés `ttl.<id>`.

**Partage** : le bouton « Partager ma course » crée une **image 720×1280 (format story)** en pixel art : titre drôle, note, score, trajet, mode, hashtag. Sur téléphone, elle part directement dans la feuille de partage (Instagram, WhatsApp, TikTok…) ; sur ordinateur, elle est téléchargée et le texte est copié. Dans l'appli native, c'est le texte qui est partagé.

## 9. Le son

Tout est **synthétisé en direct** (WebAudio, style chiptune), et chaque son peut être remplacé par ton propre fichier (section 12).

- **Musiques originales** : valse musette (menu, couloirs), lounge feutré (wagon), morceau entraînant (sortie), « Envol » (Pardon), boucle aérienne (bulle), **fanfare de cortège** (couloirs en Grève), **ambiance film de zombies** (couloirs en Pandémie).
- **Ambiance** : brouhaha qui suit la foule, trains au loin, escalator ; dans le wagon, « ta-dam » des rails et sifflement moteur.
- **Chaque personnage a son cri** : tchip, rot du Shlagg, accordéon faux, « hihihi » de l'enfant, sifflet du manifestant, « dring » + crash de la trottinette, « keuf keuf », grognement de zombie…
- **Bulle** : « boïng » sur la bulle, sifflet à coulisse quand le gêneur s'envole, puis « pof ». **Shiny** : jingle scintillant. **Rolex** : tic-tac et caisse enregistreuse. **PQ** : fanfare ridicule.
- **Tension** : battements de cœur quand la sérénité est basse, grésillement de radio près d'un contrôleur.

## 10. Installer, lancer, publier

Le projet utilise **pnpm** (et non npm), avec des réglages de sécurité contre les attaques de la chaîne d'approvisionnement (voir `pnpm-workspace.yaml`) :
- versions **exactes** des dépendances, `pnpm-lock.yaml` versionné ;
- `minimumReleaseAge: 10080` : refuse les paquets publiés depuis moins de 7 jours ;
- `strictDepBuilds`, `blockExoticSubdeps` ; aucun script d'installation autorisé (`esbuild: false`) ;
- on n'utilise **jamais** `npx` ni `pnpm dlx`, et on refuse `pnpm approve-builds`.

### Outils (une seule fois)
Node.js LTS, Git, VS Code, pnpm 11.27.1 (`npm install -g pnpm@11.27.1`, Corepack désactivé), Android Studio (Android), Xcode sur Mac (iOS).

### Lancer sur l'ordinateur
```bash
pnpm install --frozen-lockfile
pnpm dev
```
Ouvrez `http://localhost:5173`, ou l'adresse « Network » sur votre téléphone (même Wi-Fi).

### Mettre en ligne (Vercel)
Chaque `git push` met le site à jour. Réglages Vercel : variable d'environnement `ENABLE_EXPERIMENTAL_COREPACK=1`, commande d'installation `pnpm install --frozen-lockfile`.
**À chaque version**, changez `CACHE` dans `public/sw.js` (ex. `phdp-v1.0.0`) pour que les joueurs reçoivent la mise à jour.

### Android / iOS
```bash
pnpm exec cap add android      # une seule fois (idem : ios, sur Mac)
pnpm android                    # construit, synchronise, ouvre Android Studio
pnpm ios                        # idem pour Xcode
```
Publication : Android App Bundle signé → Google Play Console ; iOS : Product → Archive → App Store Connect / TestFlight. Pensez à augmenter `versionCode`/`versionName` (Android) et la version (Xcode) à chaque mise à jour.

## 11. Organisation du code : où modifier quoi

```
src/
  config.js              ← ÉQUILIBRAGE : vitesses, durées, objets, raretés, wagon, notifications
  theme/
    paname.js            ← TOUT CE QUI EST PROPRE À PARIS : lignes, stations, plan, couleurs, logo, hashtag
    index.js             ← le thème actif (changer ici pour un spin-off)
  data/
    characters.js        ← stats des personnages et objets, fréquences d'apparition, bestiaire
    modes.js             ← les 4 modes (foule, wagon, règles, bonus)
    events.js            ← les événements du jour
    titles.js            ← les titres drôles de fin et les seuils de note
    network.js           ← construit le réseau depuis le thème + calcul d'itinéraire
  i18n/fr.js, en.js      ← TOUS LES TEXTES (menus, annonces, répliques, titres, notifications)
  audio/audio.js         ← moteur sonore : bruitages, cris des personnages, ambiance, fichiers perso
  audio/tracks.js        ← musiques chiptune originales
  render/sprites.js      ← pixel art : têtes, corps, palettes (PAL), objets, accessoires
  render/font.js         ← mini-police pixel 3×5 du HUD et des notifications
  render/text.js         ← texte Press Start net, plaques émaillées
  render/hud.js          ← la barre du haut (humeur, jauge, carte de notification)
  render/renderer.js     ← décor, wagon, joueur, bulle, petits textes
  game/run.js            ← enchaînement des phases, victoire, game over, pause
  game/update.js         ← boucle de jeu : déplacements, comportements, collisions, bulle, série zen
  game/entities.js       ← apparitions, cortèges, raretés, dégâts, objets, contrôleurs
  game/wagon.js          ← phase 2 : sièges, stations, montées/descentes, freinages, dame
  game/gates.js          ← tourniquets et saut (Sans Navigo)
  game/notify.js         ← notifications du HUD et petits chiffres
  game/stats.js          ← statistiques, score, note, titres, records
  ui/screens.js          ← écrans HTML : menus, plan, modes, itinéraire, fin de course
  ui/share.js            ← l'image de partage
  platform/native.js     ← vibrations, partage, bouton retour Android (Capacitor)
  styles.css             ← apparence des menus
index.html               ← structure des écrans
docs/                    ← game design et guide spin-off
.claude/skills/          ← instructions pour créer un spin-off avec Claude
CLAUDE.md                ← contexte du projet pour Claude
```

**Exemples**
- *Rendre le jeu plus facile* : `config.js` → `scrollSpeed`, `leaf.duration`, `aura.duration` ; `modes.js` → `freeSeats`, `standers`.
- *Ajouter un personnage* : une ligne dans `T` (`data/characters.js`), son poids dans `WAVE` ou dans un mode, une palette dans `PAL` (`render/sprites.js`), ses textes `char.<id>` (fr + en), son cri dans `Snd.hit()` (`audio/audio.js`), et sa place dans `BESTIARY`.
- *Ajouter un mode* : une entrée dans `MODES` + `MODE_ORDER`, ses textes `mode.<id>`, éventuellement une musique dans `tracks.js` et un titre dans `titles.js`.
- *Ajouter un événement du jour* : une entrée dans `EVENTS`, ses textes `event.<id>` et `tick.event.<id>`.
- *Ajouter une station* : dans `theme/paname.js` (ligne, nom, position sur le plan).

## 12. Mettre tes propres sons

1. Mets le fichier dans `public/sounds/` (mp3 conseillé).
2. Déclare-le dans `public/sounds/index.json`, avec son volume (1 = normal) :
   ```json
   { "hit-tchipeur": 1, "coo": 0.6, "music-menu": 0.8 }
   ```
   (l'ancienne forme en liste `["hit-tchipeur", "coo"]` marche toujours.)
3. Variantes tirées au hasard : `hit-tchipeur-2`, `hit-tchipeur-3`…

**Noms reconnus**
- Cris de collision : `hit-basique`, `hit-tchipeur`, `hit-shlagg`, `hit-frotteur`, `hit-susu`, `hit-theologiste`, `hit-voleur`, `hit-artiste`, `hit-enfant`, `hit-poussette`, `hit-encombrant`, `hit-runner`, `hit-rambarde`, `hit-debout`, et nouveaux en v1.0 : `hit-manifestant`, `hit-trottinette`, `hit-tousseur`, `hit-zombie`.
- Musiques (en boucle) : `music-menu`, `music-corridor`, `music-wagon`, `music-exit`, `music-star`, et nouvelles : `music-aura`, `music-greve`, `music-pandemie`.
- Moments : `quai`, `sortie`, `coo` et `flap` (pigeon), `star` (Pardon), `coin`, `win`, `over`, `fine`, `seat`, `brake`, `doorsOpen`, `doorsClose`, `navigo`, `jump`, `crowdOh`…
- Nouveaux en v1.0 : `auraOn`, `auraPop`, `yeet` (gêneur éjecté), `shiny`, `rolex`, `gel`, `pq`, `cough`, `cortege`, `bell`, `notify`, `streak`, `stolen` (place volée), `grade`, `record`.

## 13. Mode test (debug)

Ajoutez `?debug` à l'adresse, puis dans la console (F12) :
```js
game.run.ser = 100                          // sérénité pleine
game.run.coins = 50
game.phase.prog = game.phase.len            // sauter à la fin d'un couloir
game.phase.timer = 1                        // finir le trajet en wagon
dbg.spawn('shlagg_shiny', 180, 250)         // faire apparaître un personnage ou un objet
dbg.spawn('aura', game.phase.pl.x, game.phase.pl.y)
Snd.hit('zombie'); Snd.play('yeet')         // écouter un son
```

## 14. Faire un spin-off (NYC Rush Hour…)

Le moteur est séparé de l'univers : tout ce qui est parisien est dans `src/theme/paname.js` et dans les textes. Pour créer « NYC Rush Hour », « Tokyo Rush Hour » ou « London Rush Hour », suivez **[docs/SPINOFF_GUIDE.md](docs/SPINOFF_GUIDE.md)**. Avec Claude, il suffit de demander « fais un spin-off NYC » : le skill `.claude/skills/spinoff-heure-de-pointe` décrit toute la procédure.

## 15. À savoir avant de publier

- « RATP », « RER », « Navigo » et « Île-de-France Mobilités » sont des marques. Le jeu n'utilise aucun logo officiel ; sur les stores, évitez ces noms dans le titre et l'icône, et présentez le jeu comme une parodie non officielle.
- Toute la musique et tout le pixel art sont **originaux** (aucune ressource sous copyright).
- Les stores demandent une **politique de confidentialité** : le jeu ne collecte aucune donnée (réglages et records restent sur l'appareil).

---
© 2026 HYKE
