# Paname Heure de Pointe

Jeu rétro (pixel art, sons chiptune) où l'on survit aux heures de pointe du RER parisien.
Une seule base de code pour **le web, Android et iOS** :

- **Web** : le jeu est un site (Vite). Il s'installe aussi comme une appli depuis le navigateur (PWA) et marche hors ligne.
- **Android et iOS** : le même site est emballé dans une vraie appli native avec [Capacitor](https://capacitorjs.com) (vibrations, partage natif, bouton retour Android, écran verrouillé en portrait).
- **Langues** : français et anglais (choix dans Options, détection automatique au premier lancement).

---

## 1. Installer les outils (une seule fois)

| Outil | À quoi il sert | Lien |
|---|---|---|
| Node.js (version LTS) | lancer et construire le jeu | https://nodejs.org |
| Git | sauvegarder les versions du code | https://git-scm.com |
| VS Code | éditer le code | https://code.visualstudio.com |
| Android Studio | construire l'appli Android | https://developer.android.com/studio |
| Xcode (Mac uniquement) | construire l'appli iOS | Mac App Store |

Vérifiez dans un terminal : `node -v` et `git --version` doivent afficher un numéro.

## 2. Lancer le jeu sur votre ordinateur

```bash
cd paname-heure-de-pointe
npm install        # télécharge les dépendances (une seule fois)
npm run dev        # lance le jeu
```

Ouvrez l'adresse `http://localhost:5173`. Le terminal affiche aussi une adresse « Network » (ex. `http://192.168.1.20:5173`) : ouvrez-la sur votre téléphone, connecté au même Wi-Fi, pour tester en vrai.
Chaque modification du code se voit immédiatement, sans relancer.

**Astuce de test** : ajoutez `?debug` à l'adresse, puis dans la console du navigateur (F12) :
`game.run.ser = 100` (sérénité pleine), `game.run.coins = 50`, `game.phase.prog = game.phase.len` (sauter à la fin d'une phase).

## 3. Mettre le code sur GitHub

```bash
git init
git add .
git commit -m "Paname Heure de Pointe v0.6"
```
Créez un dépôt vide sur github.com (ex. `paname-heure-de-pointe`), puis suivez les deux commandes `git remote add …` et `git push` que GitHub affiche.

## 4. Mettre le jeu en ligne (web + mobile via le navigateur)

1. Sur https://vercel.com, « Add New Project » → importez le dépôt GitHub.
2. Vercel détecte Vite tout seul (commande `npm run build`, dossier `dist`). Cliquez « Deploy ».
3. À chaque `git push`, le site se met à jour automatiquement.

Sur téléphone, le jeu est déjà installable :
- **iPhone** : Safari → bouton Partager → « Sur l'écran d'accueil ».
- **Android** : Chrome → menu ⋮ → « Installer l'application ».

## 5. Appli Android (Google Play)

```bash
npx cap add android     # une seule fois : crée le dossier android/
npm run assets          # génère icônes et écran de démarrage depuis assets/
npm run android         # construit le jeu, copie dans android/ et ouvre Android Studio
```
Dans Android Studio :
1. Branchez votre téléphone (activez « Débogage USB » dans les options développeur) et cliquez ▶ Run.
2. Pour publier : *Build → Generate Signed Bundle / APK → Android App Bundle*. Créez une clé de signature et **gardez-la précieusement** (sans elle, plus de mise à jour possible).
3. Sur https://play.google.com/console (25 $ une fois) : créez l'appli, envoyez le fichier `.aab` en « Test interne », remplissez la fiche (captures, description, classification du contenu, politique de confidentialité), puis passez en production.

## 6. Appli iOS (App Store)

Il faut un Mac avec Xcode, et le programme Apple Developer (99 $/an).
```bash
npx cap add ios         # une seule fois : crée le dossier ios/
npm run assets
npm run ios             # construit, copie dans ios/ et ouvre Xcode
```
Dans Xcode :
1. Onglet *Signing & Capabilities* : choisissez votre équipe (Team).
2. Branchez l'iPhone et cliquez ▶ pour tester.
3. Pour publier : *Product → Archive → Distribute App*, puis dans App Store Connect : TestFlight (tests), puis envoi en validation.

Pas de Mac ? Des services cloud construisent l'appli iOS pour vous : Codemagic, Ionic Appflow, ou un Mac loué (MacinCloud).

> iPhone : en mode silencieux (bouton latéral), iOS coupe les sons des pages web, y compris dans l'appli. C'est normal ; on pourra ajouter plus tard un plugin audio natif pour l'éviter.

## 7. Publier une mise à jour

1. Modifiez le code, testez avec `npm run dev`.
2. `git add . && git commit -m "…" && git push` → le site web est à jour.
3. Mobile : augmentez la version (`package.json`, puis `versionCode`/`versionName` dans `android/app/build.gradle` et la version dans Xcode), lancez `npm run android` / `npm run ios`, puis reconstruisez et envoyez comme aux étapes 5 et 6.
4. Changez `CACHE` dans `public/sw.js` pour forcer la mise à jour de la version installée depuis le navigateur.

---

## Où modifier quoi

```
src/
  config.js            ← ÉQUILIBRAGE : vitesses, durées, amende, places libres, freinages…
  i18n/fr.js, en.js    ← TOUS LES TEXTES (menus, annonces, répliques, bestiaire)
  data/characters.js   ← stats des personnages (dégâts, taille, comportement), fréquence d'apparition
  data/network.js      ← lignes de RER, stations, calcul d'itinéraire
  audio/audio.js       ← moteur sonore : bruitages, sons de collision, ambiance, battements de cœur…
  audio/tracks.js      ← musiques (menu, couloir, wagon, sortie, étoile)
  render/sprites.js    ← pixel art des personnages (palettes PAL), carrelage, affiches
  render/renderer.js   ← dessin du décor, du wagon, du HUD, des bulles
  game/run.js          ← enchaînement des phases, victoire, game over, pause
  game/update.js       ← boucle de jeu : déplacements, comportements, collisions
  game/entities.js     ← apparitions dans les couloirs, dégâts, contrôleurs
  game/wagon.js        ← phase 2 : sièges, strapontins, arrêts, freinage, dame à la canne
  ui/screens.js        ← écrans HTML : options, plan du RER, bestiaire, itinéraire
  platform/native.js   ← vibrations, partage, bouton retour, arrière-plan (Android/iOS)
  styles.css           ← apparence des menus
index.html             ← structure des écrans (les textes viennent de i18n)
```

**Exemples**
- *Rendre le jeu plus facile* : `config.js` → `scrollSpeed`, `wagon.freeSeats`, `leaf.duration`.
- *Ajouter un personnage* : une ligne dans `data/characters.js`, une palette dans `PAL` (`render/sprites.js`), ses textes `char.<id>` dans `fr.js` et `en.js`, son bruit dans `Snd.hit()` (`audio/audio.js`), et son poids dans `WAVE`.
- *Ajouter une station* : son nom dans `NAMES`, sa place dans `LINE_ST` (`data/network.js`), sa position sur le plan dans `MAPPOS` (`ui/screens.js`).
- *Ajouter une langue* : copiez `en.js` en `es.js`, traduisez, et ajoutez-le dans `DICTS` (`i18n/i18n.js`).

## Le son : ce qui réagit à la situation

- **Musiques** différentes par phase (valse musette dans les couloirs, ambiance feutrée dans le wagon, morceau entraînant vers la sortie, musique rapide pendant l'étoile Pardon).
- **Ambiance** : brouhaha de la foule qui suit le nombre de gens à l'écran, trains qui passent au loin, bourdonnement de l'escalator ; dans le wagon, grondement et « ta-dam » des rails, sifflement moteur qui monte avec la vitesse.
- **Annonces** : carillon avant chaque message, la musique baisse automatiquement.
- **Portes** : carillon + souffle pneumatique à l'ouverture, bip et claquement à la fermeture.
- **Chaque personnage a son bruit** de collision (le « tchip », l'accordéon, la poussette qui couine, l'enfant qui ricane, la rambarde métallique…).
- **Tension** : battements de cœur et musique étouffée quand la sérénité est basse ; grésillement de radio quand un contrôleur est proche.
- **Pas** du joueur, plus rapides avec la feuille ; **pause** : tout s'étouffe.
- **Vibrations** sur mobile pour les chocs, amendes, freinages et bonnes actions (désactivables).

## À savoir avant de publier

- « RATP », « RER », « Navigo » et « Île-de-France Mobilités » sont des marques. Le jeu n'utilise aucun logo, mais lors de la publication sur les stores, évitez ces noms dans le titre et l'icône, et présentez le jeu comme une parodie non officielle.
- Les stores demandent une **politique de confidentialité** : le jeu ne collecte aucune donnée (seuls les réglages sont stockés sur l'appareil), une page simple suffit.

## Pistes pour la suite

Meilleurs scores sauvegardés, reprise exacte d'une course après fermeture (prévue dans le GDD), mini-jeu du tourniquet en mode sans Navigo, nouvelles stations et lignes de métro, succès à débloquer, histoire « trop sérieuse » entre les phases.
