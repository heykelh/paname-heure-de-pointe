# Game design — Paname Heure de Pointe (v1.0)

Document de référence du concept, pour faire évoluer le jeu ou le décliner (spin-offs). Les valeurs chiffrées sont celles de `src/config.js`, `src/data/*.js` au moment de la v1.0.

## 1. Pitch
« Survivre à l'heure de pointe. » Un jeu d'esquive vertical en pixel art NES, où l'on traverse le réseau de transport d'une grande ville à l'heure de pointe en gardant sa **sérénité**. L'humour vient des **archétypes de voyageurs** que tout le monde reconnaît, et de l'absurdité des **annonces** et des situations.

## 2. Piliers (à garder dans toute déclinaison)
1. **Reconnaissable** : chaque personnage est une figure que les usagers croisent vraiment (le tchipeur, la poussette, l'accordéoniste, le contrôleur…).
2. **Drôle, jamais méchant** : on rit des situations, pas des gens. Les personnages négatifs n'ont que des teintes de peau claires ; les gentils et les voyageurs assis ont toutes les teintes.
3. **Partie courte et toujours différente** : 2 à 5 minutes ; trajet, mode, événement du jour, raretés et histoire changent à chaque course.
4. **Lisible** : le terrain reste dégagé ; les informations vont dans le HUD (notifications avec avatar en haut à droite).
5. **Partageable** : un titre drôle et une image à partager à la fin de chaque course.
6. **Rétro authentique** : 180×320 pixels, palette limitée, sons synthétisés, rien sous copyright.

## 3. Boucle de jeu
```
Choisir un trajet → choisir sa galère (mode) → découvrir l'événement du jour → synopsis
  → Phase 1 : couloir (tourniquets, foule, pièces, objets) → quai
  → Phase 2 : wagon (places, stations, montées/descentes, freinages)
  → (correspondance : phases 1 et 2 à nouveau)
  → Phase 3 : couloir de sortie (escalator, portillons)
  → Note + score + titre drôle + partage → « Recommencer » (nouvel événement)
```

## 4. Ressources du joueur
| Ressource | Rôle |
|---|---|
| **Sérénité** (0–100) | La vie. Baisse à chaque bousculade, dans les zones d'aura, sur un strapontin quand c'est plein, pendant la canicule. Remonte assis dans le wagon (+9/s ; +4/s sur un strapontin), avec le gel. À 0 : game over. |
| **Pièces** | Ramassées par terre. Servent à donner aux mendiants, à payer les amendes, et au score. |
| **Héroïsme** | Bonnes actions : donner une pièce, céder sa place, toucher un Shlagg rare, bonus de mode. Vaut cher au score (×150). |

## 5. Phases
- **Couloir (phases 1 et 3)** : défilement vertical à 68 unités/s, longueur 1900 / 1700 (× mode). Apparitions de plus en plus rapprochées (0,95 s → 0,6 s, ÷ densité du mode). Pièces en lignes, un objet toutes les 8–12 s, un mendiant par couloir, pigeons. Phase 1 : tourniquets en premier. Phase 3 : escalator puis portillons (+ contrôleurs en mode Sans Navigo).
- **Wagon (phase 2)** : durée 16 s + 12 s par station (26–52 s, × mode). Carrés de 4 sièges, strapontins près des portes, foule debout (22 / 34 en Grève), rambardes, artiste, gêneurs. À chaque station : portes ouvertes 4,2 s, 2–4 voyageurs debout descendent, des assis se lèvent (18 % par place, 3 max), 3–6 voyageurs montent (× densité), 40 % d'entre eux foncent sur une place libre. Freinages toutes les 6–10 s. La dame à la canne arrive au bout de 6 s.

## 6. Modes
| | Navigo | Sans Navigo | Grève | Pandémie |
|---|---|---|---|---|
| Densité couloir | ×1 | ×1 | ×1,75 | ×1,15 |
| Longueur couloir / wagon | ×1 / ×1 | ×1 / ×1 | ×1,3 / ×1,3 | ×1,1 / ×1 |
| Debout / places libres | 22 / 2 | 22 / 2 | 34 / 1 | 20 / 2 |
| Spécial | — | tourniquets à sauter, contrôleurs | cortèges (6–10 s), trottinettes, groupes ×1,7 | masques 85 %, tousseurs, zombies (2 dans le wagon), gel, PQ (5–8 s) |
| Héroïsme bonus / score | 0 / ×1 | +2 / ×1,3 | +3 / ×1,5 | +3 / ×1,5 |

## 7. Événements du jour
Tirage pondéré (Jour normal ×3, Pluie ×1,2, Pleine lune ×0,6, autres ×1), jamais deux fois de suite le même (sauf Jour normal). Ils modifient les poids d'apparition (`mul`), et parfois les règles : `slippery` (inertie), `drain` (perte de sérénité/s debout), `groups` (groupes plus gros), `rareMul` (raretés plus fréquentes).

## 8. Personnages (archétypes)
Chaque archétype = un **comportement** + des **dégâts** + un **cri** + une **réplique** :
`walk` (marche droit), `wander` (erre), `erratic` (enfant), `home` (vous suit), `dash` (fonce sur vous puis s'enfuit), `charge` (tout droit, vite), `runner` (annoncé par « ! » puis traverse), `static`, `ctrl` (cône de vision), `march` (cortège horizontal), `scoot` (diagonale qui rebondit), `zombie` (vous suit lentement), `flee` (vous fuit : le Shiny), `stand` (foule du wagon), `dame`, `pigeon`.
Une **aura** (rayon + dégâts/s + son) peut s'ajouter : accordéon, toux.

## 9. Objets
Feuille (8 s, rayon réduit 11 → 6, vitesse ×1,3), Pardon (8 s, invincible), Aura (7 s, rayon 34 : éjecte), Gel (+15), PQ (+5 pièces). Raretés : Shiny 4 % des Shlaggs, Rolex 9 % (× pleine lune).

## 10. Score et titres
Score = sérénité×10 + pièces×20 + héroïsme×150 − bousculades×30 + éjections×50 + Shiny×500 + Rolex×200 + meilleure série×4, × mode.
Notes : S 4500, A 3200, B 2200, C 1300.
Titres : le plus prioritaire dont la condition est remplie (voir `data/titles.js`), + 2 mentions. Règle d'écriture : un titre = une **identité drôle** (« Roi de la fraude ») + une **explication** courte, souvent avec un chiffre de la course.

## 11. Feedback (ce qui rend le jeu vivant)
Chaque événement a : un **son** signature, une **vibration** (mobile), une **notification** avec avatar, et souvent un **petit chiffre** qui s'envole. Les annonces défilantes rappellent le mode et l'événement du jour. La musique change selon la phase, le mode et l'objet actif ; elle s'étouffe quand la sérénité est basse.

## 12. Pistes pour la suite
- Défis quotidiens (même trajet + même événement pour tout le monde, classement).
- Succès à débloquer et collection (bestiaire à compléter, raretés vues).
- Personnalisation du personnage (tenues gagnées avec les pièces).
- Nouveaux modes : « Ligne fermée » (détour imposé), « Dernier métro » (de nuit, pressé par le temps), « JO » (touristes du monde entier).
- Métro (lignes 1 à 14) et tramways.
- Classement en ligne et partage d'un lien de défi.
