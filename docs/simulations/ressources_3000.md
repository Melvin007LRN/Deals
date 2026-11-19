# Valeur des ressources en fin de partie et usage des cartes
Généré le 2026-11-19T16:13:07.491Z — règles 1.2.0-provisional (V9 + compensation par nombre de joueurs) — **3000 parties réellement jouées par valeur**, profil Mixte (bots à valeur espérée), alternance 3/4 joueurs, mêmes seeds.

| Mesure | 10 pts/ressource | 5 pts/ressource | 3 pts/ressource | 0 pts/ressource |
|---|---|---|---|---|
| Cartes jouées par joueur | 0.51 | 0.95 | 1.07 | 1.34 |
| Cartes jamais jouées (sur 36) | 18 | 6 | 2 | 0 |
| Joueurs avec un niveau 3 | 48.8 % | 45.7 % | 44.7 % | 42.5 % |
| Propriétés par joueur | 4.1 | 4.1 | 4.1 | 4.1 |
| Siège 1 à 3 joueurs | 35.1 % | 32.1 % | 31.3 % | 30.5 % |

## Nombre de fois où chaque carte est jouée pour 100 parties
| # | Carte | Coût | 10 pts | 5 pts | 3 pts | 0 pts |
|---|---|---|---|---|---|---|
| 1 | Placement malin | 1M 0É | 0 | 7 | 7 | 7 |
| 2 | Coup de pouce | 0M 1É | 14 | 14 | 14 | 14 |
| 3 | Rendement bonus | 1M 1É | 0 | 14 | 20 | 21 |
| 4 | Chantier express | 2M 0É | 1 | 2 | 2 | 2 |
| 5 | Bon investissement | 0M 1É | 0 | 0 | 2 | 2 |
| 6 | Revenus garantis | 1M 0É | 4 | 4 | 4 | 15 |
| 7 | Réduction fiscale | 1M 1É | 0 | 4 | 4 | 4 |
| 8 | Nouvelle opportunité | 2M 0É | 0 | 15 | 15 | 15 |
| 9 | Sabotage | 0M 1É | 1 | 12 | 14 | 15 |
| 10 | Pression fiscale | 0M 1É | 6 | 12 | 12 | 13 |
| 11 | Grève | 1M 0É | 13 | 15 | 15 | 15 |
| 12 | Inspection | 0M 1É | 0 | 0 | 4 | 10 |
| 13 | Blocage bancaire | 1M 1É | 0 | 0 | 0 | 21 |
| 14 | Détournement | 0M 1É | 15 | 14 | 14 | 14 |
| 15 | Concurrence agressive | 1M 0É | 4 | 23 | 24 | 24 |
| 16 | Fraude commerciale | 0M 1É | 0 | 0 | 3 | 8 |
| 17 | Prise de contrôle | 2M 2É | 17 | 16 | 16 | 15 |
| 18 | Crise locale | 1M 1É | 0 | 0 | 8 | 22 |
| 19 | Assurance | 1M 0É | 0 | 0 | 2 | 13 |
| 20 | Bouclier financier | 0M 1É | 6 | 10 | 12 | 14 |
| 21 | Protection juridique | 1M 1É | 4 | 11 | 16 | 20 |
| 22 | Contre-offensive | 0M 2É | 0 | 11 | 16 | 18 |
| 23 | Réserve d'urgence | 1M 0É | 5 | 5 | 5 | 5 |
| 24 | Assurance immobilière | 1M 0É | 15 | 18 | 20 | 21 |
| 25 | Négociateur | 1M 0É | 0 | 2 | 2 | 2 |
| 26 | Offre spéciale | 0M 1É | 0 | 2 | 3 | 3 |
| 27 | Courtier | 1M 0É | 0 | 24 | 24 | 24 |
| 28 | Partenariat | 0M 1É | 16 | 16 | 16 | 16 |
| 29 | Contrat privilégié | 1M 1É | 0 | 14 | 14 | 13 |
| 30 | Fusion | 2M 0É | 11 | 17 | 19 | 19 |
| 31 | Influence locale | 1M 0É | 8 | 8 | 8 | 8 |
| 32 | Vote municipal | 1M 1É | 0 | 0 | 1 | 1 |
| 33 | Permis exceptionnel | 2M 1É | 0 | 1 | 1 | 1 |
| 34 | Réforme urbaine | 2M 0É | 0 | 0 | 0 | 18 |
| 35 | Magnat | 2M 2É | 21 | 20 | 19 | 19 |
| 36 | OPA hostile | 3M 2É | 17 | 17 | 16 | 15 |

Note : une carte n'apparaît qu'une fois dans la pioche ; avec ~2 pioches par joueur, chaque carte est vue dans environ 15-20 % des parties. Une valeur de 0 signifie que les bots, lorsqu'ils l'ont, ne trouvent jamais de situation où elle rapporte plus qu'elle ne coûte.

## Lecture (analyse, pas une décision)
- Avec 10 points par ressource, une carte qui coûte 2 ressources doit rapporter plus de 20 points pour valoir le coup : **18 cartes sur 36 ne sont jamais rentables** pour un bot qui calcule le gain réel.
- À **5 points**, il en reste 6 ; à **3 points**, 2 ; à **0 point**, toutes sont jouées. L'équité des sièges et la construction restent bonnes dans tous les cas.
- Cartes faibles quelle que soit la valeur : **Bon investissement** (échange 1 Énergie contre 1 Matériau : gain nul), **Vote municipal** (2 ressources pour économiser 10 D), **Blocage bancaire**, **Réforme urbaine**, **Crise locale**, **Assurance** (effets trop faibles ou trop rares).
- Le redressement n'est jamais déclenché en simulation (avec +10 D par tour, les bots ne tombent jamais à court). Le mécanisme reste couvert par les tests unitaires et le fuzzing.
