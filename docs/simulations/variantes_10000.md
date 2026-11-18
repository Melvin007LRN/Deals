# DEALS — Comparaison des variantes d'équilibrage (R03)
Généré le 2026-11-18T13:35:53.195Z — règles 1.0.0-provisional — **10000 parties réellement jouées par variante** (110000 au total), profil Mixte, alternance 3/4 joueurs, **mêmes seeds 30000000–30009999 pour toutes les variantes**. Calcul : 1416 s.
Reproduire : `npx tsx packages/sim/src/variants.ts --games 10000`.
Limites : bots heuristiques (pas des humains) ; durée = modèle de temps par action ; case Événement neutre.

- **V0** — Règles actuelles (référence)
- **V1** — Dé de mouvement 1-2-2-3-3-4
- **V2** — Carte piochée au passage de Départ
- **V3** — +10 D au début de chaque tour
- **V4** — Compensation de siège +0/+10/+20/+30 D
- **V5** — V1 + V2 (dé 1-4, carte au Départ)
- **V6** — V1 + V2 + V4
- **V7** — V1 + V2 + V3 + V4
- **V9** — V7 avec compensation forte +0/+20/+40/+60 D
- **V10** — V1 + V2 + +5 D par tour + compensation forte
- **V8** — Dé 2-2-3-3-4-4 + carte au Départ + compensation de siège

Repères : siège 1 équitable = 33,3 % (3 j.) / 25 % (4 j.) ; durée visée 25–35 min ; écart 1er/dernier < 2,5.

| Mesure | V0 | V1 | V2 | V3 | V4 | V5 | V6 | V7 | V9 | V10 | V8 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Passages Départ / joueur | 0.57 | 0.98 | 0.57 | 0.57 | 0.57 | 0.98 | 0.98 | 0.98 | 0.98 | 0.98 | 1.00 |
| Cartes piochées / joueur | 1.03 | 1.15 | 1.60 | 1.03 | 1.03 | 2.12 | 2.12 | 2.12 | 2.12 | 2.12 | 2.17 |
| Cartes jouées / joueur | 0.49 | 0.51 | 0.70 | 0.48 | 0.49 | 0.90 | 0.89 | 0.83 | 0.82 | 0.86 | 0.96 |
| Cartes jamais jouées (sur 36) | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 |
| Enchères sans acheteur | 63.7 % | 55.6 % | 63.5 % | 32.9 % | 62.4 % | 55.3 % | 54.2 % | 27.3 % | 25.1 % | 39.2 % | 43.1 % |
| Propriétés / joueur | 3.0 | 3.2 | 3.0 | 4.0 | 3.1 | 3.2 | 3.2 | 4.0 | 4.1 | 3.7 | 3.4 |
| Niveaux de bâtiment / joueur | 1.5 | 1.6 | 1.5 | 3.2 | 1.8 | 1.6 | 2.0 | 3.6 | 3.8 | 3.1 | 1.8 |
| Joueurs avec un niveau 3 | 3.3 % | 5.2 % | 3.2 % | 27.6 % | 5.6 % | 4.9 % | 8.1 % | 41.0 % | 44.6 % | 27.0 % | 5.1 % |
| Quartiers contrôlés / joueur | 0.73 | 0.74 | 0.72 | 1.10 | 0.82 | 0.74 | 0.82 | 1.13 | 1.17 | 1.02 | 0.84 |
| Joueurs en redressement | 0.0 % | 0.0 % | 0.0 % | 0.0 % | 0.0 % | 0.0 % | 0.0 % | 0.0 % | 0.0 % | 0.0 % | 0.0 % |
| Échanges / partie | 1.0 | 0.9 | 1.0 | 1.5 | 1.2 | 0.9 | 1.2 | 1.7 | 1.9 | 1.6 | 1.0 |
| Objectif secret réussi | 20.7 % | 22.5 % | 20.7 % | 35.3 % | 22.8 % | 22.5 % | 24.7 % | 38.1 % | 38.9 % | 33.0 % | 24.9 % |
| Victoires siège 1 (3 j.) | 41.6 % | 45.7 % | 41.4 % | 44.1 % | 37.4 % | 44.7 % | 42.7 % | 44.0 % | 40.7 % | 41.0 % | 40.7 % |
| Victoires dernier siège (3 j.) | 30.3 % | 25.3 % | 30.3 % | 27.4 % | 35.4 % | 25.9 % | 27.8 % | 25.5 % | 29.2 % | 29.4 % | 30.0 % |
| Victoires siège 1 (4 j.) | 34.5 % | 40.2 % | 34.2 % | 35.3 % | 29.0 % | 39.1 % | 34.1 % | 34.8 % | 28.5 % | 29.0 % | 35.5 % |
| Victoires dernier siège (4 j.) | 20.1 % | 16.1 % | 20.8 % | 18.3 % | 27.4 % | 16.2 % | 21.4 % | 18.3 % | 24.6 % | 25.0 % | 19.5 % |
| Écart score 1er/dernier (médiane) | 1.52 | 1.43 | 1.51 | 1.51 | 1.53 | 1.43 | 1.45 | 1.42 | 1.40 | 1.43 | 1.43 |
| Durée estimée médiane (min) | 13.7 | 13.5 | 13.8 | 14.3 | 13.7 | 13.8 | 14.0 | 14.8 | 14.9 | 14.4 | 13.8 |

## Lecture (analyse, pas une décision)
- **+10 D par tour (V3) est le levier le plus fort** : enchères sans acheteur 64 % → 33 %, propriétés 3,0 → 4,0, joueurs atteignant un niveau 3 : 3 % → 28 %, objectifs réussis 21 % → 35 %.
- **Carte au Départ** seule apporte peu (+0,6 carte) ; combinée au **dé 1-4** elle double les cartes piochées (1,0 → 2,1 par joueur).
- **Le dé 1-4 seul aggrave l'avantage du 1er joueur** (41,6 % → 45,7 % à 3 joueurs).
- **Avantage du 1er joueur à 3** : résistant. Meilleur résultat : V4 (compensation seule) 37,4 % ; V9 40,7 %. À 4 joueurs, V9 et V10 sont quasi équitables (28,5 % / 24,6 % pour 25 % attendu).
- **Candidat le plus complet : V9** (dé 1-4, carte au Départ, +10 D par tour, compensation +0/+20/+40/+60 D).
- **Limites des bots, pas des règles** : 13 cartes ne sont jamais jouées dans aucune variante (cartes de défense et effets différés mal évalués par les bots), et aucun bot n'entre en redressement (ils gardent toujours une réserve). Ces deux points ne peuvent pas être jugés avec ces simulations ; il faut améliorer les bots (nécessaire de toute façon pour des adversaires crédibles).
- **Durée** : le modèle de temps par action donne ~14-15 min quelle que soit la variante, car le nombre de tours est fixe (12 × 3-4). Ce chiffre ne reflète pas le temps réel de négociation humaine ; seul un test avec de vrais joueurs le mesurera.
