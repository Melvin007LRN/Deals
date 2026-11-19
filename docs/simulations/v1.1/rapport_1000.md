# Rapport de simulation DEALS
Généré le 2026-11-19T13:41:13.661Z — règles **1.1.0-provisional** — moteur @deals/engine 1.0.0 — 1000 parties par campagne (4000 au total) — seed de base 20261118
Durée de calcul : 40 s.

**Ce rapport est réel et reproductible** : `npx tsx packages/sim/src/cli.ts --games 1000 --seed 20261118 --check`.
Limites : les agents sont des heuristiques (pas des joueurs humains) ; la durée est estimée par un modèle de temps par action (voir run.ts), pas mesurée ; la case Événement est neutre (R11 non validé).
Paramètres provisoires : réserve 25 D, taxe 15 D, plafonds 8/6, hypothèque 50 %/55 %, enchère départ 50 %.

Profils : Investisseur (achat marge 0, enchère 85 %, attaque ×0.4, échange ×0.6) ; Agressif (achat marge 10, enchère 75 %, attaque ×1.6, échange ×0.4) ; Négociateur (achat marge 5, enchère 80 %, attaque ×0.7, échange ×1.6) ; Aléatoire raisonnable (achat marge 0, enchère 70 %, attaque ×1, échange ×1) ; Mixte (achat marge 5, enchère 80 %, attaque ×1, échange ×1).

### 3 joueurs — profil Mixte à chaque siège (structure, avantage de siège)
Parties réellement terminées : **1000** — seeds 20261118 à 20262117 — commandes acceptées : 142819 — décisions d'agents refusées par le moteur : 0 — invariants vérifiés à chaque commande : 0 violation(s)

| Mesure | Valeur |
|---|---|
| Score moyen / médian / écart-type | 387.2 / 385.0 / 66.4 |
| Score moyen du vainqueur | 450.7 |
| Ratio score 1er / dernier (médiane) | 1.35 |
| Propriétés par joueur en fin | 4.3 |
| Joueurs sans propriété en fin | 0.0 % |
| Manches passées sans propriété (moyenne) | 2.0 |
| Niveaux de bâtiment par joueur | 3.7 — joueurs ayant un niveau 3 : 37.7 % |
| Quartiers contrôlés par joueur | 1.21 |
| Passages par Départ par joueur | 0.98 |
| Pioches Chance / cartes jouées par joueur | 2.11 / 0.87 |
| Objectif secret réussi | 39.3 % |
| Joueurs passés en redressement | 0.0 % — avec dette en fin : 0.0 % |
| Enchères par partie (sans acheteur) | 9.9 (33.1 %) |
| Échanges acceptés / proposés par partie | 1.5 / 1.5 |
| Attaques immobilières par partie | 0.30 |
| Durée estimée (modèle) médiane / 90e centile | 12.8 / 13.6 min |

Victoires par siège : siège 1 40.8 % · siège 2 30.0 % · siège 3 29.2 %

Cartes les plus jouées : Assurance immobilière (204), Courtier (196), Magnat (182), OPA hostile (158), Détournement (149). Jamais jouées : Rendement bonus, Grève, Blocage bancaire, Concurrence agressive, Crise locale, Assurance, Bouclier financier, Protection juridique, Contre-offensive, Négociateur, Offre spéciale, Vote municipal, Réforme urbaine.

**Alertes :** 
- ⚠️ Durée médiane estimée hors [20 ; 40] min (12.8 min)
- ⚠️ Avantage de siège 1 : 40.8 % (équitable 33.3 %)

### 4 joueurs — profil Mixte à chaque siège
Parties réellement terminées : **1000** — seeds 21261118 à 21262117 — commandes acceptées : 187964 — décisions d'agents refusées par le moteur : 0 — invariants vérifiés à chaque commande : 0 violation(s)

| Mesure | Valeur |
|---|---|
| Score moyen / médian / écart-type | 380.5 / 377.0 / 63.1 |
| Score moyen du vainqueur | 452.7 |
| Ratio score 1er / dernier (médiane) | 1.42 |
| Propriétés par joueur en fin | 3.9 |
| Joueurs sans propriété en fin | 0.0 % |
| Manches passées sans propriété (moyenne) | 2.4 |
| Niveaux de bâtiment par joueur | 3.8 — joueurs ayant un niveau 3 : 48.4 % |
| Quartiers contrôlés par joueur | 1.13 |
| Passages par Départ par joueur | 0.98 |
| Pioches Chance / cartes jouées par joueur | 2.15 / 0.83 |
| Objectif secret réussi | 38.0 % |
| Joueurs passés en redressement | 0.0 % — avec dette en fin : 0.0 % |
| Enchères par partie (sans acheteur) | 8.8 (17.7 %) |
| Échanges acceptés / proposés par partie | 2.3 / 2.3 |
| Attaques immobilières par partie | 0.40 |
| Durée estimée (modèle) médiane / 90e centile | 17.0 / 18.0 min |

Victoires par siège : siège 1 28.1 % · siège 2 24.8 % · siège 3 24.1 % · siège 4 23.0 %

Cartes les plus jouées : Courtier (275), Assurance immobilière (259), Magnat (247), Prise de contrôle (201), OPA hostile (201). Jamais jouées : Rendement bonus, Grève, Blocage bancaire, Concurrence agressive, Crise locale, Assurance, Bouclier financier, Protection juridique, Contre-offensive, Négociateur, Offre spéciale, Vote municipal, Réforme urbaine.

**Alertes :** 
- ⚠️ Durée médiane estimée hors [20 ; 40] min (17.0 min)

### Tables de 3 ou 4 joueurs aux profils tirés au hasard (taux de victoire par profil)
Parties réellement terminées : **1000** — seeds 22261118 à 22262117 — commandes acceptées : 165854 — décisions d'agents refusées par le moteur : 0 — invariants vérifiés à chaque commande : 0 violation(s)

| Mesure | Valeur |
|---|---|
| Score moyen / médian / écart-type | 392.7 / 389.0 / 67.9 |
| Score moyen du vainqueur | 465.9 |
| Ratio score 1er / dernier (médiane) | 1.40 |
| Propriétés par joueur en fin | 4.1 |
| Joueurs sans propriété en fin | 0.0 % |
| Manches passées sans propriété (moyenne) | 2.2 |
| Niveaux de bâtiment par joueur | 3.6 — joueurs ayant un niveau 3 : 41.0 % |
| Quartiers contrôlés par joueur | 1.19 |
| Passages par Départ par joueur | 0.97 |
| Pioches Chance / cartes jouées par joueur | 2.12 / 0.88 |
| Objectif secret réussi | 38.2 % |
| Joueurs passés en redressement | 0.0 % — avec dette en fin : 0.0 % |
| Enchères par partie (sans acheteur) | 9.2 (20.0 %) |
| Échanges acceptés / proposés par partie | 1.7 / 1.7 |
| Attaques immobilières par partie | 0.30 |
| Durée estimée (modèle) médiane / 90e centile | 14.9 / 17.5 min |

Victoires par siège : siège 1 32.2 % · siège 2 27.4 % · siège 3 25.8 % · siège 4 29.2 %

Victoires par profil : Investisseur 28.2 % (n=667) · Agressif 34.6 % (n=757) · Négociateur 24.6 % (n=719) · Aléatoire raisonnable 30.7 % (n=654) · Mixte 24.5 % (n=703)

Cartes les plus jouées : Magnat (194), Courtier (183), Bon investissement (179), Coup de pouce (173), Assurance immobilière (173). Jamais jouées : Rendement bonus, Crise locale, Assurance, Vote municipal, Réforme urbaine.

**Alertes :** 
- ⚠️ Durée médiane estimée hors [20 ; 40] min (14.9 min)

### Scénarios extrêmes : tables 100 % Agressif / 100 % Investisseur / 100 % Négociateur / 100 % Aléatoire
Parties réellement terminées : **1000** — seeds 23261118 à 23262117 — commandes acceptées : 166080 — décisions d'agents refusées par le moteur : 0 — invariants vérifiés à chaque commande : 0 violation(s)

| Mesure | Valeur |
|---|---|
| Score moyen / médian / écart-type | 393.5 / 388.0 / 69.0 |
| Score moyen du vainqueur | 467.4 |
| Ratio score 1er / dernier (médiane) | 1.40 |
| Propriétés par joueur en fin | 4.1 |
| Joueurs sans propriété en fin | 0.0 % |
| Manches passées sans propriété (moyenne) | 2.2 |
| Niveaux de bâtiment par joueur | 3.5 — joueurs ayant un niveau 3 : 41.1 % |
| Quartiers contrôlés par joueur | 1.18 |
| Passages par Départ par joueur | 0.97 |
| Pioches Chance / cartes jouées par joueur | 2.14 / 0.92 |
| Objectif secret réussi | 38.3 % |
| Joueurs passés en redressement | 0.0 % — avec dette en fin : 0.0 % |
| Enchères par partie (sans acheteur) | 9.0 (18.8 %) |
| Échanges acceptés / proposés par partie | 1.6 / 1.6 |
| Attaques immobilières par partie | 0.32 |
| Durée estimée (modèle) médiane / 90e centile | 14.5 / 17.4 min |

Victoires par siège : siège 1 35.9 % · siège 2 25.1 % · siège 3 25.2 % · siège 4 27.6 %

Cartes les plus jouées : Magnat (217), Coup de pouce (204), Bon investissement (198), Courtier (188), Détournement (165). Jamais jouées : Rendement bonus, Crise locale, Assurance, Vote municipal, Réforme urbaine.

**Alertes :** 
- ⚠️ Durée médiane estimée hors [20 ; 40] min (14.5 min)
