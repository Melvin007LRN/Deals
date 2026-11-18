# Rapport de simulation DEALS
Généré le 2026-11-18T06:34:45.979Z — règles **1.0.0-provisional** — moteur @deals/engine 1.0.0 — 10000 parties par campagne (40000 au total) — seed de base 20261118
Durée de calcul : 317 s.

**Ce rapport est réel et reproductible** : `npx tsx packages/sim/src/cli.ts --games 10000 --seed 20261118`.
Limites : les agents sont des heuristiques (pas des joueurs humains) ; la durée est estimée par un modèle de temps par action (voir run.ts), pas mesurée ; la case Événement est neutre (R11 non validé).
Paramètres provisoires : réserve 25 D, taxe 15 D, plafonds 8/6, hypothèque 50 %/55 %, enchère départ 50 %.

Profils : Investisseur (achat marge 0, enchère 85 %, attaque ×0.4, échange ×0.6) ; Agressif (achat marge 10, enchère 75 %, attaque ×1.6, échange ×0.4) ; Négociateur (achat marge 5, enchère 80 %, attaque ×0.7, échange ×1.6) ; Aléatoire raisonnable (achat marge 0, enchère 70 %, attaque ×1, échange ×1) ; Mixte (achat marge 5, enchère 80 %, attaque ×1, échange ×1).

### 3 joueurs — profil Mixte à chaque siège (structure, avantage de siège)
Parties réellement terminées : **10000** — seeds 20261118 à 20271117 — commandes acceptées : 1342842 — décisions d'agents refusées par le moteur : 0

| Mesure | Valeur |
|---|---|
| Score moyen / médian / écart-type | 286.3 / 282.0 / 58.3 |
| Score moyen du vainqueur | 342.8 |
| Ratio score 1er / dernier (médiane) | 1.44 |
| Propriétés par joueur en fin | 3.1 |
| Joueurs sans propriété en fin | 0.0 % |
| Manches passées sans propriété (moyenne) | 1.9 |
| Niveaux de bâtiment par joueur | 1.5 — joueurs ayant un niveau 3 : 2.7 % |
| Quartiers contrôlés par joueur | 0.76 |
| Passages par Départ par joueur | 0.57 |
| Pioches Chance / cartes jouées par joueur | 1.02 / 0.49 |
| Objectif secret réussi | 21.2 % |
| Joueurs passés en redressement | 0.0 % — avec dette en fin : 0.0 % |
| Enchères par partie (sans acheteur) | 15.3 (68.0 %) |
| Échanges acceptés / proposés par partie | 0.8 / 0.8 |
| Attaques immobilières par partie | 0.27 |
| Durée estimée (modèle) médiane / 90e centile | 11.8 / 12.6 min |

Victoires par siège : siège 1 41.3 % · siège 2 28.6 % · siège 3 30.1 %

Cartes les plus jouées : Magnat (1460), OPA hostile (1451), Nouvelle opportunité (1443), Prise de contrôle (1239), Courtier (1183). Jamais jouées : Rendement bonus, Grève, Blocage bancaire, Concurrence agressive, Crise locale, Assurance, Bouclier financier, Protection juridique, Contre-offensive, Négociateur, Offre spéciale, Vote municipal, Réforme urbaine.

**Alertes :** 
- ⚠️ Durée médiane estimée hors [20 ; 40] min (11.8 min)
- ⚠️ Avantage de siège 1 : 41.3 % (équitable 33.3 %)

### 4 joueurs — profil Mixte à chaque siège
Parties réellement terminées : **10000** — seeds 21261118 à 21271117 — commandes acceptées : 1778057 — décisions d'agents refusées par le moteur : 0

| Mesure | Valeur |
|---|---|
| Score moyen / médian / écart-type | 284.5 / 280.0 / 62.6 |
| Score moyen du vainqueur | 357.5 |
| Ratio score 1er / dernier (médiane) | 1.60 |
| Propriétés par joueur en fin | 3.0 |
| Joueurs sans propriété en fin | 0.0 % |
| Manches passées sans propriété (moyenne) | 2.4 |
| Niveaux de bâtiment par joueur | 1.5 — joueurs ayant un niveau 3 : 4.0 % |
| Quartiers contrôlés par joueur | 0.72 |
| Passages par Départ par joueur | 0.57 |
| Pioches Chance / cartes jouées par joueur | 1.02 / 0.49 |
| Objectif secret réussi | 20.7 % |
| Joueurs passés en redressement | 0.0 % — avec dette en fin : 0.0 % |
| Enchères par partie (sans acheteur) | 16.4 (59.5 %) |
| Échanges acceptés / proposés par partie | 1.1 / 1.1 |
| Attaques immobilières par partie | 0.35 |
| Durée estimée (modèle) médiane / 90e centile | 15.7 / 16.5 min |

Victoires par siège : siège 1 34.5 % · siège 2 23.8 % · siège 3 22.0 % · siège 4 19.7 %

Cartes les plus jouées : Magnat (2145), Nouvelle opportunité (1922), OPA hostile (1920), Prise de contrôle (1613), Courtier (1569). Jamais jouées : Rendement bonus, Grève, Blocage bancaire, Concurrence agressive, Crise locale, Assurance, Bouclier financier, Protection juridique, Contre-offensive, Négociateur, Offre spéciale, Vote municipal, Réforme urbaine.

**Alertes :** 
- ⚠️ Durée médiane estimée hors [20 ; 40] min (15.7 min)
- ⚠️ Avantage de siège 1 : 34.5 % (équitable 25.0 %)
- ⚠️ Avantage de siège 4 : 19.7 % (équitable 25.0 %)

### Tables de 3 ou 4 joueurs aux profils tirés au hasard (taux de victoire par profil)
Parties réellement terminées : **10000** — seeds 22261118 à 22271117 — commandes acceptées : 1569186 — décisions d'agents refusées par le moteur : 0

| Mesure | Valeur |
|---|---|
| Score moyen / médian / écart-type | 292.5 / 287.0 / 64.6 |
| Score moyen du vainqueur | 361.9 |
| Ratio score 1er / dernier (médiane) | 1.54 |
| Propriétés par joueur en fin | 3.1 |
| Joueurs sans propriété en fin | 0.0 % |
| Manches passées sans propriété (moyenne) | 2.2 |
| Niveaux de bâtiment par joueur | 1.4 — joueurs ayant un niveau 3 : 2.8 % |
| Quartiers contrôlés par joueur | 0.76 |
| Passages par Départ par joueur | 0.57 |
| Pioches Chance / cartes jouées par joueur | 1.02 / 0.55 |
| Objectif secret réussi | 20.9 % |
| Joueurs passés en redressement | 0.0 % — avec dette en fin : 0.0 % |
| Enchères par partie (sans acheteur) | 15.7 (60.5 %) |
| Échanges acceptés / proposés par partie | 0.9 / 0.9 |
| Attaques immobilières par partie | 0.25 |
| Durée estimée (modèle) médiane / 90e centile | 13.6 / 16.2 min |

Victoires par siège : siège 1 37.6 % · siège 2 27.4 % · siège 3 25.6 % · siège 4 18.6 %

Victoires par profil : Investisseur 24.7 % (n=6959) · Agressif 36.5 % (n=7125) · Négociateur 24.7 % (n=6929) · Aléatoire raisonnable 32.1 % (n=6911) · Mixte 24.7 % (n=7076)

Cartes les plus jouées : Magnat (1758), Nouvelle opportunité (1671), OPA hostile (1336), Prise de contrôle (1158), Courtier (1115). Jamais jouées : Rendement bonus, Crise locale, Assurance, Réforme urbaine.

**Alertes :** 
- ⚠️ Durée médiane estimée hors [20 ; 40] min (13.6 min)

> Note ajoutée après génération : dans la campagne « extrêmes », la ligne « Victoires par profil » n'est pas significative (tables homogènes : chaque profil ne joue que contre lui-même). Le générateur a été corrigé pour ne plus l'afficher.

### Scénarios extrêmes : tables 100 % Agressif / 100 % Investisseur / 100 % Négociateur / 100 % Aléatoire
Parties réellement terminées : **10000** — seeds 23261118 à 23271117 — commandes acceptées : 1570217 — décisions d'agents refusées par le moteur : 0

| Mesure | Valeur |
|---|---|
| Score moyen / médian / écart-type | 294.3 / 289.0 / 64.3 |
| Score moyen du vainqueur | 363.3 |
| Ratio score 1er / dernier (médiane) | 1.52 |
| Propriétés par joueur en fin | 3.2 |
| Joueurs sans propriété en fin | 0.0 % |
| Manches passées sans propriété (moyenne) | 2.2 |
| Niveaux de bâtiment par joueur | 1.4 — joueurs ayant un niveau 3 : 2.8 % |
| Quartiers contrôlés par joueur | 0.76 |
| Passages par Départ par joueur | 0.57 |
| Pioches Chance / cartes jouées par joueur | 1.02 / 0.55 |
| Objectif secret réussi | 21.3 % |
| Joueurs passés en redressement | 0.0 % — avec dette en fin : 0.0 % |
| Enchères par partie (sans acheteur) | 15.7 (59.7 %) |
| Échanges acceptés / proposés par partie | 0.8 / 0.8 |
| Attaques immobilières par partie | 0.23 |
| Durée estimée (modèle) médiane / 90e centile | 13.6 / 16.1 min |

Victoires par siège : siège 1 38.5 % · siège 2 27.0 % · siège 3 24.5 % · siège 4 20.0 %

Victoires par profil : Investisseur 25.0 % (n=10000) · Agressif 33.3 % (n=7500) · Négociateur 33.3 % (n=7500) · Aléatoire raisonnable 25.0 % (n=10000)

Cartes les plus jouées : Magnat (1690), Nouvelle opportunité (1519), OPA hostile (1242), Prise de contrôle (1109), Courtier (1090). Jamais jouées : Rendement bonus, Crise locale, Assurance, Réforme urbaine.

**Alertes :** 
- ⚠️ Durée médiane estimée hors [20 ; 40] min (13.6 min)
