# DEALS — Rapport des phases 1 (moteur) et 2 (simulation)
18/11/2026 — règles `1.0.0-provisional` (recommandations de l'audit acceptées provisoirement par le créateur)

## 1. Ce qui est terminé, avec preuve

| Élément | Statut | Preuve |
|---|---|---|
| Contenu officiel : 24 cases, 18 propriétés, 6 quartiers, 36 cartes, 12 objectifs | ✅ Terminé | `content.test.ts` (12 tests) |
| Moteur pur `applyCommand(state, cmd, {rng, now})` — 24 commandes | ✅ Terminé | 107 tests, 0 échec ; typecheck strict OK |
| Dés exacts, Départ +40 D une fois, wrap 24 cases | ✅ | `core.test.ts` |
| Achat, réserve 25 D, refus → enchère ouverte à tous (refusant inclus), chrono serveur | ✅ | `core.test.ts` |
| Loyers en arithmétique entière, niveaux 0–3, bonus quartier, hypothèque | ✅ | `core.test.ts` |
| Construction : majorité 2/3, ordre des niveaux, coûts, 1 par tour (+ cartes) | ✅ | `core.test.ts`, `cards.test.ts` |
| Chance : piocher 2 garder 1, main ≤ 5, remplacement main pleine, main secrète | ✅ | `core.test.ts` |
| **Les 36 cartes** : coûts, cibles, durées, non-cumul, protections, ordre de résolution | ✅ | `cards.test.ts` (46 tests, une vérification par carte) |
| Attaque immobilière → enchère, jamais de transfert direct | ✅ | `cards.test.ts` |
| Échanges atomiques, consentement, expiration 30 s, 3 offres/tour | ✅ | `core.test.ts` |
| Dettes, liquidation, Réserve d'urgence, redressement, vente forcée aux enchères | ✅ | `core.test.ts`, `cards.test.ts` |
| Score final, objectifs, égalités, fin après 12 manches | ✅ | `core.test.ts` |
| Vues filtrées (main, objectif, pioche des adversaires jamais exposés) | ✅ | `core.test.ts` |
| Commande refusée = état inchangé ; version et séquence d'événements monotones | ✅ | `core.test.ts`, `property.test.ts` |
| Invariants sur parties aléatoires | ✅ | 300 parties complètes vérifiées à chaque commande (fast-check) + 4 000 parties de simulation vérifiées à chaque commande : 0 violation |
| Rejeu à l'identique depuis seed + journal | ✅ | `property.test.ts` (4 parties, comparaison octet pour octet) |
| Hasard de production cryptographique sans biais modulo | ✅ | `rng.test.ts` |
| Bots (5 profils) utilisant le même moteur | ✅ | 0 décision refusée sur 6,26 M de commandes |
| Simulation 1 000 puis 10 000 parties × 4 campagnes | ✅ Réellement exécutées | `docs/simulations/rapport_1000.md`, `rapport_10000.md` (+ .json) |

Couverture du moteur : 96,8 % des instructions, 86,4 % des branches.

## 2. Bug trouvé et corrigé grâce aux tests
Le fuzzing a révélé qu'en revendant un bâtiment construit avec une réduction (Placement malin, bonus Résidentiel), le coût historique devenait négatif. Correction : le prix payé est mémorisé par niveau ; la revente rend 50 % de ce prix réel. Un invariant vérifie désormais la cohérence.

## 3. Ce qui reste provisoire ou non fait
- **Provisoire** : tous les paramètres marqués `provisional` dans `packages/engine/src/content/rules.ts` et les interprétations R01–R13.
- **Non implémenté (attente de décision)** : pile d'événements de la case 12 (case neutre en v1.0), conformément à la valeur par défaut C.
- **Choix d'implémentation à valider** : la liquidation en cas d'impayé est automatique (ressources → bâtiments → hypothèques) plutôt que choisie par le joueur ; Partenariat est résolu automatiquement (10 D, sinon 1 ressource).
- **Pas encore commencé** : backend multijoueur (Phase 3), client 3D (Phases 4-7).
- **Non poussé sur GitHub** : le code est versionné localement (git) ; il faut un dépôt (voir §6).

## 4. Résultats de simulation (40 000 parties, réels)
Agents heuristiques, pas des humains : les chiffres décrivent la structure du jeu, pas le ressenti.

| Constat | Mesure (10 000 parties/campagne) | Seuil d'alerte du plan |
|---|---|---|
| Passages par Départ par joueur et par partie | **0,57** | — |
| Cartes piochées / jouées par joueur et par partie | **1,02 / 0,5** | — |
| Enchères sans acheteur | **60 à 68 %** (les joueurs n'ont plus d'argent) | — |
| Propriétés par joueur en fin | 3,0 – 3,2 | [2 ; 7] ✅ |
| Joueurs sans propriété en fin | 0 % | < 15 % ✅ |
| Joueurs en redressement | **0 %** (le système n'est jamais sollicité) | < 20 % ✅ |
| Quartiers contrôlés par joueur | 0,72 – 0,76 | — |
| Joueurs atteignant un niveau 3 | 2,7 – 4 % | — |
| Victoires du 1er joueur | **41,3 % à 3 joueurs** (équitable 33,3 %), 34,5 % à 4 (25 %) | écart > 5 pts ⚠️ |
| Écart 1er / dernier (médiane) | 1,44 – 1,60 | < 2,5 ✅ |
| Meilleur profil en tables mélangées | Agressif 36,5 % | < 45 % ✅ |
| Durée estimée (modèle de temps par action) | **12 à 16 min** | [20 ; 40] ⚠️ |

**Lecture :** les règles actuelles donnent une partie courte, à court d'argent, où le premier joueur a un avantage net et où les cartes, le redressement et la construction de haut niveau sont presque absents. Les calculs de l'audit (§4.3) sont confirmés par la mesure.

## 5. Propositions chiffrables (décision R03, rien n'est appliqué)
Prochaine étape proposée : rendre ces leviers paramétrables et simuler chaque variante (10 000 parties chacune) avant de choisir :
1. Dé de mouvement 1,2,2,3,3,4 (≈ 1,25 tour) ;
2. Départ +40 D **et** pioche Chance au passage ;
3. Revenu de manche : +10 D à chaque joueur au début de son tour ;
4. Compensation de siège : le dernier joueur commence avec +10/+20 D (ou ordre « serpent ») ;
5. Combinaisons des précédentes.

## 6. Reproduire
```
npm install
npm test                                   # 107 tests
npm run typecheck
npx tsx packages/sim/src/cli.ts --games 1000 --check   # ~40 s
npx tsx packages/sim/src/cli.ts --games 10000          # ~5 min
```
