# CLAUDE.md — contexte du projet « Paname Heure de Pointe »

## Le projet
Jeu mobile rétro (pixel art NES) : survivre à l'heure de pointe du RER parisien. Vite + Capacitor (web/PWA, Android, iOS), bilingue FR/EN, en ligne sur https://paname-heure-de-pointe.vercel.app/.
Auteur : Rigobert (GitHub `heykelh`), sous Windows / PowerShell, édite dans VS Code. Version actuelle : **1.0.0**.
Lire `README.md` (fonctionnement complet), `CHANGELOG.md` (historique), `docs/GAME_DESIGN.md` (règles et chiffres), `docs/SPINOFF_GUIDE.md` (déclinaisons).

## Règles de travail avec l'auteur
- **Répondre en français.**
- **Ne pas envoyer de zip.** Livrer des **fichiers complets** prêts à copier-coller, en indiquant leur chemin. Pas de morceaux de code à insérer (des collages partiels ont déjà cassé le jeu).
- Ne pas pousser sur GitHub : l'auteur copie les fichiers lui-même, puis commit. Donner les commandes git à la fin.
- À chaque version : changer `CACHE` dans `public/sw.js`, `version` dans `package.json`, `menu.version` dans les i18n, et compléter `CHANGELOG.md`.

## Sécurité pnpm (important pour l'auteur)
- pnpm 11.27.1, Corepack désactivé sur son PC. Versions **exactes** dans `package.json`.
- `pnpm-workspace.yaml` : `minimumReleaseAge: 10080`, `strictDepBuilds`, `blockExoticSubdeps`, `allowBuilds: esbuild: false`. Ne pas assouplir.
- Jamais `npx` ni `pnpm dlx` ; installer avec `pnpm install --frozen-lockfile` ; refuser `pnpm approve-builds`.
- Vercel : `ENABLE_EXPERIMENTAL_COREPACK=1`, commande d'installation `pnpm install --frozen-lockfile`.

## Règles de contenu
- **Aucun personnage négatif à la peau foncée** (gêneurs : `NEG_SKINS = [0,1]`, foule gênante `LIGHT_DEB = [0,2,5,6]`). Toutes les teintes pour les gentils (`KIND`) et les voyageurs assis. Vaut aussi pour le bestiaire.
- **Rien sous copyright** : musiques originales (une demande de musique Nintendo a été refusée, remplacée par « Envol »), sprites originaux, pas de logos RATP/IDFM.
- Direction artistique : NES rétro, mais couleurs **réelles** du métro et du RER ; ambiance drôle ; sons adaptés à chaque situation.

## Architecture (src/)
- `theme/paname.js` : tout ce qui est parisien (réseau, plan, couleurs, logo, hashtag). `theme/index.js` choisit le thème.
- `data/` : `characters.js` (stats, WAVE, bestiaire), `modes.js` (4 modes), `events.js` (événements du jour), `titles.js` (titres drôles, notes), `network.js` (réseau + itinéraires Dijkstra, correspondance = 3 stations).
- `game/` : `run.js` (phases, victoire), `update.js` (boucle), `entities.js` (apparitions, collisions, objets, bulle, raretés), `wagon.js` (phase 2, stations), `gates.js` (tourniquets), `notify.js` (notifications HUD), `stats.js` (score, titres, records).
- `render/` : `sprites.js` (pixel art en code : HEADS, BODIES, PAL), `font.js` (police 3×5), `text.js` (Press Start net), `hud.js`, `renderer.js`.
- `ui/` : `screens.js` (écrans HTML), `share.js` (image de partage 720×1280).
- `audio/` : `audio.js` (moteur WebAudio, fichiers perso dans `public/sounds/index.json`), `tracks.js` (musiques).
- Canvas 180×320 px ; coordonnées logiques 360×640 (`B(x) = x/2`) ; HUD = 72 unités logiques (36 px).

## Tester
`pnpm build` puis servir `dist/` ; ouvrir avec `?debug` : `window.game`, `window.Snd`, `window.dbg.spawn(type, x, y)`.
Raccourcis : `game.phase.prog = game.phase.len` (fin de couloir), `game.phase.timer = 1` (fin du wagon), `game.run.ser = 100`.
