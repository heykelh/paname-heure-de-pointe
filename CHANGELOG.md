# Historique — Paname Heure de Pointe

Toutes les étapes du projet, de la première maquette à la v1.0.
Les dates sont celles des commits sur GitHub (`heykelh/paname-heure-de-pointe`) quand elles existent.

---

## v1.0.0 — « Grève & Pandémie » (octobre 2026)

La première version complète du jeu. Objectif : que chaque partie soit une expérience différente, drôle et partageable.

### Nouveaux modes de jeu (4 au total)
- **Grève** : deux fois plus de monde, groupes plus gros, couloirs et trajet plus longs, 34 voyageurs debout et une seule place libre dans le wagon. **Cortèges de manifestants** qui traversent le couloir avec leur banderole « GRÈVE ! », **trottinettes** qui foncent en diagonale, fanfare de cortège, annonces spéciales. Bonus : +3 héroïsme, score ×1,5.
- **Pandémie** : la plupart des gens sont **masqués** (souvent sous le nez), **tousseurs** avec nuage de toux, **zombies** qui vous suivent jusque dans le wagon, **gel hydroalcoolique** (+15 sérénité), **rouleaux de PQ** (+5 pièces), musique façon film de zombies. Bonus : +3 héroïsme, score ×1,5.
- Écran de choix du mode refait : 4 cartes colorées avec le **record** de chaque mode.

### Rejouabilité
- **Événement du jour** tiré à chaque course : pluie (sol glissant), canicule (la sérénité fond), fête de la musique, soldes, soir de match, touristes, pleine lune (raretés ×3). Annoncé dans le synopsis, l'écran de course, le HUD et le bandeau d'annonces.
- **Shlaggs rares** : Shlagg à la Rolex (+8 pièces, +1 héroïsme) et **Shlagg Shiny** qui change de couleur, scintille et vous fuit (+15 pièces, +3 héroïsme). Notification à leur apparition.
- **Série zen** : toutes les 15 s sans bousculade, des pièces en bonus.
- Synopsis : 5 histoires différentes.

### Nouvel objet : Aura de sécurité
- 7 secondes dans une **bulle** : les gêneurs qui la touchent rebondissent, s'envolent en tournoyant avec un cri drôle (sifflet à coulisse) et disparaissent dans un « POF ». Dans le wagon, la bulle écarte la foule. Musique dédiée.

### Le Pardon
- Nouvelle icône : **deux mains jointes** (au lieu de l'étoile), dans le couloir, le HUD et au-dessus du joueur.

### HUD et notifications
- HUD agrandi (36 px) et redessiné.
- **Notifications en haut à droite** : avatar du personnage percuté, son nom et sa réplique, au moment de son cri. Le terrain reste dégagé (les bulles de texte qui cachaient le personnage sont supprimées). Seuls de petits chiffres s'envolent (« -6 », « +15 », « POF ! »).
- File d'attente des notifications (max. 3), barre de temps restant.
- Quand il ne se passe rien : l'**objectif** en cours (quai, prochain arrêt, sortie).
- **Nouvelle jauge de sérénité** : barre lisse aux coins arrondis, reflet, éclat qui glisse, traînée blanche après un choc, couleur verte → jaune → rouge clignotant, pourcentage, et un **visage d'humeur** (souriant, neutre, inquiet avec goutte de sueur, furieux qui fume). Fini les petits carrés.
- Effets actifs (Pardon, bulle, feuille) avec leur temps restant.
- Bouton pause déplacé en bas à gauche.
- Mini-police pixel 3×5 pour le HUD.

### Graphismes des personnages
- Nouveaux sprites **12×18 avec ombrages** (au lieu de 10×15), 8 coiffures (courte, longue, casquette, chauve, chignon, capuche, volume, bonnet), 4 silhouettes (normale, manteau long, costume-cravate, robe).
- Chaque personnage a son look : Shlagg en vieux manteau, voleur à capuche et loup, contrôleur en casquette et cravate, théologiste en robe blanche, tchipeur en bonnet avec sa bulle « TCHIP », dame à chignon…
- Masques, zombies (bras tendus, yeux rouges), manifestants (chasuble, drapeau, banderole), trottinette, tousseur (nuage), Rolex (lunettes noires, chaîne en or, montre qui brille), Shiny (palette arc-en-ciel).
- Le joueur porte une casquette bleue ; pendant le Pardon, sa tenue change de couleur et des mains jointes flottent au-dessus de lui.

### Le wagon, version réaliste
- À chaque station : les portes s'ouvrent (animation), on voit **le quai et les gens qui attendent**, le **nom de la station** s'affiche.
- **Des voyageurs descendent** : certains debout marchent jusqu'à la porte, des voyageurs assis se lèvent (leur place se libère et clignote).
- **D'autres montent** par les portes, et certains **foncent sur les places libres** : si vous êtes trop lent, « Place volée ! ».
- Zombies et tousseurs à bord en Pandémie, manifestant en Grève, voyageurs masqués.

### Fin de course
- **Titre drôle** parmi 23 (Roi de la fraude, MVP du don de la place, Meilleur donateur de pièces, Tu t'es fait trop peta des thunes petite frappe, Chasseur de Shlagg Shiny, Patient zéro, Baron du PQ, Bulle humaine, Ninja du métro, Picsou de Châtelet…) + 2 mentions.
- **Note S à D**, **score**, **record par mode** (« NOUVEAU RECORD ! »).
- Statistiques détaillées : bousculades, événement, correspondances, temps, amendes.
- **Image de partage 720×1280** (format story) en pixel art, partagée directement depuis le téléphone ou téléchargée.
- Game over : résumé des bousculades, pièces et héroïsme.

### Son
- Nouvelles musiques : fanfare de cortège (Grève), ambiance zombie (Pandémie), boucle « bulle » (Aura).
- Nouveaux bruitages : bulle, éjection, Shiny, Rolex, gel, PQ, toux, cortège, sonnette, notification, série zen, place volée, note, record. Cris pour manifestant, trottinette, tousseur, zombie.
- Tous remplaçables par des fichiers (`public/sounds/`).

### Architecture (préparation des spin-offs)
- `src/theme/paname.js` : tout ce qui est propre à Paris (lignes, stations, plan, couleurs, logo, hashtag).
- `src/data/modes.js`, `events.js`, `titles.js` : modes, événements et titres séparés du moteur.
- `game/notify.js`, `game/stats.js`, `render/hud.js`, `render/font.js`, `render/text.js`, `ui/share.js` : nouveaux modules.
- Documentation : README détaillé, ce CHANGELOG, `CLAUDE.md`, `docs/GAME_DESIGN.md`, `docs/SPINOFF_GUIDE.md`, skill `.claude/skills/spinoff-heure-de-pointe`.
- Cache hors ligne : `phdp-v1.0.0`.

---

## v0.9.1 — Volume des sons (octobre 2026)
- `public/sounds/index.json` accepte un objet `{ "nom": volume }` pour régler le volume de chaque son (la liste simple marche toujours).
- Les musiques en fichier respectent aussi leur volume.
- Précision sur les sons du pigeon (`coo`, `flap`) et du Pardon (`star`, `music-star`).

## v0.9 — Tes propres sons (8 octobre 2026)
- Chaque bruitage et chaque musique peuvent être remplacés par un fichier mp3 dans `public/sounds/` (déclaré dans `index.json`), avec variantes tirées au hasard (`hit-tchipeur-2`…).
- Musiques en fichier jouées en boucle (`music-menu`, `music-corridor`…).
- Nouveaux sons d'arrivée : `quai` (le train entre en gare) et `sortie` (l'air libre, les oiseaux).
- Premiers sons personnels ajoutés au dépôt (game over, collisions, musiques).

## v0.8 — Tourniquets et HUD net (8 octobre 2026)
- **Tourniquets animés** : bip Navigo, voyant vert, bras qui pivote.
- **Mode Sans Navigo** : tapoter vite pour sauter le tourniquet, foule qui fait « ohhh », message « Oh le fraudeur ! Sale pauvre ! ».
- **HUD net** : le texte est « binarisé » (plus de flou).
- Correction : écran blanc dû à un bloc collé hors de sa fonction (depuis, les fichiers sont toujours livrés en entier).

## v0.7 — Synopsis et bruitages drôles (6 octobre 2026)
- **Synopsis** en début de course (petites histoires trop sérieuses).
- Les phases ne commencent plus toujours aux tourniquets (correspondance : on descend du train).
- **Un bruitage drôle par personnage** (vrai « tchip », rot, accordéon faux, « hihihi »…).
- **Étoile (Pardon) de 8 s** avec un thème original, « Envol ».
- **Teintes de peau** : les personnages négatifs n'ont plus que des teintes claires ; toutes les teintes pour les personnages bienveillants. Le tchipeur n'est plus systématiquement noir.

## v0.6 — Le vrai projet (6 octobre 2026)
- Passage d'une démo à un **vrai projet** : Vite + Capacitor (Android, iOS), code découpé en modules.
- **Français / anglais**, options (musique, bruitages, ambiance, vibrations, langue).
- **pnpm sécurisé** (versions exactes, `minimumReleaseAge`, aucun script d'installation) au lieu de npm, après les attaques récentes de la chaîne d'approvisionnement npm.
- Résolution des erreurs d'installation (`ERR_PNPM_IGNORED_BUILDS`, Corepack, `MINIMUM_RELEASE_AGE`).
- PWA installable et jouable hors ligne, **mise en ligne sur Vercel**.

## v0.5 — Les 5 RER
- Ajout des lignes **C (jaune), D (verte), E (rose)** avec leurs grandes stations, en plus de A et B.
- Plan interactif du RER, calcul d'itinéraire avec correspondances.

## v0.4 — Plus drôle, plus réaliste
- Couleurs réelles du métro et du RER (au lieu d'une palette de jeu existant).
- Phase wagon plus serrée et réaliste (strapontins, freinages, dame à la canne).
- Pièce au son 8 bits, **Feuille de légèreté** (on rapetisse 8 s).
- Ambiance plus drôle (annonces absurdes, répliques).

## v0.2 / v0.3 — Style rétro NES
- Passage au **pixel art NES** (180×320, sans lissage), sons chiptune.
- Carrelage blanc biseauté, plaques émaillées bleues, frise orange.

## v0.1 — La démo
- Première démo jouable construite à partir du **GDD**, de la transcription vidéo et des photos de la **maquette papier** : couloirs, foule à éviter, jauge de sérénité, pièces, héroïsme.
