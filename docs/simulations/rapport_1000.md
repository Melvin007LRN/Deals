# Rapport de simulation DEALS
Généré le 2026-11-18T06:29:26.479Z — règles **1.0.0-provisional** — moteur @deals/engine 1.0.0 — 1000 parties par campagne (4000 au total) — seed de base 20261118
Durée de calcul : 40 s.

**Ce rapport est réel et reproductible** : `npx tsx packages/sim/src/cli.ts --games 1000 --seed 20261118 --check`.
Limites : les agents sont des heuristiques (pas des joueurs humains) ; la durée est estimée par un modèle de temps par action (voir run.ts), pas mesurée ; la case Événement est neutre (R11 non validé).
Paramètres provisoires : réserve 25 D, taxe 15 D, plafonds 8/6, hypothèque 50 %/55 %, enchère départ 50 %.

Profils : Investisseur (achat marge 0, enchère 85 %, attaque ×0.4, échange ×0.6) ; Agressif (achat marge 10, enchère 75 %, attaque ×1.6, échange ×0.4) ; Négociateur (achat marge 5, enchère 80 %, attaque ×0.7, échange ×1.6) ; Aléatoire raisonnable (achat marge 0, enchère 70 %, attaque ×1, échange ×1) ; Mixte (achat marge 5, enchère 80 %, attaque ×1, échange ×1).

### 3 joueurs — profil Mixte à chaque siège (structure, avantage de siège)
Parties réellement terminées : **1000** — seeds 20261118 à 20262117 — commandes acceptées : 134310 — décisions d'agents refusées par le moteur : 0 — invariants vérifiés à chaque commande : 0 violation(s)

| Mesure | Valeur |
|---|---|
| Score moyen / médian / écart-type | 285.9 / 281.0 / 59.2 |
| Score moyen du vainqueur | 343.7 |
| Ratio score 1er / dernier (médiane) | 1.44 |
| Propriétés par joueur en fin | 3.1 |
| Joueurs sans propriété en fin | 0.0 % |
| Manches passées sans propriété (moyenne) | 1.9 |
| Niveaux de bâtiment par joueur | 1.5 — joueurs ayant un niveau 3 : 3.1 % |
| Quartiers contrôlés par joueur | 0.76 |
| Passages par Départ par joueur | 0.58 |
| Pioches Chance / cartes jouées par joueur | 1.02 / 0.49 |
| Objectif secret réussi | 21.1 % |
| Joueurs passés en redressement | 0.0 % — avec dette en fin : 0.0 % |
| Enchères par partie (sans acheteur) | 15.4 (68.3 %) |
| Échanges acceptés / proposés par partie | 0.8 / 0.8 |
| Attaques immobilières par partie | 0.28 |
| Durée estimée (modèle) médiane / 90e centile | 11.9 / 12.6 min |

Victoires par siège : siège 1 43.4 % · siège 2 26.7 % · siège 3 29.9 %

Cartes les plus jouées : OPA hostile (151), Magnat (149), Nouvelle opportunité (128), Prise de contrôle (127), Contrat privilégié (112). Jamais jouées : Rendement bonus, Chantier express, Grève, Blocage bancaire, Concurrence agressive, Crise locale, Assurance, Bouclier financier, Protection juridique, Contre-offensive, Négociateur, Offre spéciale, Vote municipal, Permis exceptionnel, Réforme urbaine.

**Alertes :** 
- ⚠️ Durée médiane estimée hors [20 ; 40] min (11.9 min)
- ⚠️ Avantage de siège 1 : 43.4 % (équitable 33.3 %)
- ⚠️ Avantage de siège 2 : 26.7 % (équitable 33.3 %)

### 4 joueurs — profil Mixte à chaque siège
Parties réellement terminées : **1000** — seeds 21261118 à 21262117 — commandes acceptées : 177920 — décisions d'agents refusées par le moteur : 0 — invariants vérifiés à chaque commande : 0 violation(s)

| Mesure | Valeur |
|---|---|
| Score moyen / médian / écart-type | 284.0 / 279.0 / 64.6 |
| Score moyen du vainqueur | 359.8 |
| Ratio score 1er / dernier (médiane) | 1.61 |
| Propriétés par joueur en fin | 3.0 |
| Joueurs sans propriété en fin | 0.0 % |
| Manches passées sans propriété (moyenne) | 2.4 |
| Niveaux de bâtiment par joueur | 1.5 — joueurs ayant un niveau 3 : 4.3 % |
| Quartiers contrôlés par joueur | 0.71 |
| Passages par Départ par joueur | 0.57 |
| Pioches Chance / cartes jouées par joueur | 1.03 / 0.50 |
| Objectif secret réussi | 20.5 % |
| Joueurs passés en redressement | 0.0 % — avec dette en fin : 0.0 % |
| Enchères par partie (sans acheteur) | 16.4 (59.5 %) |
| Échanges acceptés / proposés par partie | 1.1 / 1.1 |
| Attaques immobilières par partie | 0.38 |
| Durée estimée (modèle) médiane / 90e centile | 15.7 / 16.5 min |

Victoires par siège : siège 1 35.3 % · siège 2 23.8 % · siège 3 20.5 % · siège 4 20.4 %

Cartes les plus jouées : Magnat (235), OPA hostile (207), Nouvelle opportunité (203), Prise de contrôle (172), Courtier (166). Jamais jouées : Rendement bonus, Chantier express, Grève, Blocage bancaire, Concurrence agressive, Crise locale, Assurance, Bouclier financier, Protection juridique, Contre-offensive, Négociateur, Offre spéciale, Vote municipal, Permis exceptionnel, Réforme urbaine.

**Alertes :** 
- ⚠️ Durée médiane estimée hors [20 ; 40] min (15.7 min)
- ⚠️ Avantage de siège 1 : 35.3 % (équitable 25.0 %)

### Tables de 3 ou 4 joueurs aux profils tirés au hasard (taux de victoire par profil)
Parties réellement terminées : **1000** — seeds 22261118 à 22262117 — commandes acceptées : 157399 — décisions d'agents refusées par le moteur : 0 — invariants vérifiés à chaque commande : 0 violation(s)

| Mesure | Valeur |
|---|---|
| Score moyen / médian / écart-type | 290.7 / 286.0 / 63.8 |
| Score moyen du vainqueur | 359.5 |
| Ratio score 1er / dernier (médiane) | 1.54 |
| Propriétés par joueur en fin | 3.1 |
| Joueurs sans propriété en fin | 0.0 % |
| Manches passées sans propriété (moyenne) | 2.2 |
| Niveaux de bâtiment par joueur | 1.4 — joueurs ayant un niveau 3 : 3.2 % |
| Quartiers contrôlés par joueur | 0.75 |
| Passages par Départ par joueur | 0.56 |
| Pioches Chance / cartes jouées par joueur | 1.04 / 0.55 |
| Objectif secret réussi | 20.4 % |
| Joueurs passés en redressement | 0.0 % — avec dette en fin : 0.0 % |
| Enchères par partie (sans acheteur) | 15.7 (60.9 %) |
| Échanges acceptés / proposés par partie | 0.9 / 0.9 |
| Attaques immobilières par partie | 0.24 |
| Durée estimée (modèle) médiane / 90e centile | 13.7 / 16.3 min |

Victoires par siège : siège 1 39.0 % · siège 2 28.3 % · siège 3 24.8 % · siège 4 15.8 %

Victoires par profil : Investisseur 24.4 % (n=667) · Agressif 36.6 % (n=757) · Négociateur 25.0 % (n=719) · Aléatoire raisonnable 30.6 % (n=654) · Mixte 25.6 % (n=703)

Cartes les plus jouées : Magnat (181), Nouvelle opportunité (164), OPA hostile (135), Prise de contrôle (106), Courtier (98). Jamais jouées : Rendement bonus, Chantier express, Crise locale, Assurance, Vote municipal, Permis exceptionnel, Réforme urbaine.

**Alertes :** 
- ⚠️ Durée médiane estimée hors [20 ; 40] min (13.7 min)

### Scénarios extrêmes : tables 100 % Agressif / 100 % Investisseur / 100 % Négociateur / 100 % Aléatoire
Parties réellement terminées : **1000** — seeds 23261118 à 23262117 — commandes acceptées : 157040 — décisions d'agents refusées par le moteur : 0 — invariants vérifiés à chaque commande : 0 violation(s)

| Mesure | Valeur |
|---|---|
| Score moyen / médian / écart-type | 294.1 / 288.0 / 63.6 |
| Score moyen du vainqueur | 363.1 |
| Ratio score 1er / dernier (médiane) | 1.52 |
| Propriétés par joueur en fin | 3.2 |
| Joueurs sans propriété en fin | 0.0 % |
| Manches passées sans propriété (moyenne) | 2.2 |
| Niveaux de bâtiment par joueur | 1.4 — joueurs ayant un niveau 3 : 3.3 % |
| Quartiers contrôlés par joueur | 0.76 |
| Passages par Départ par joueur | 0.58 |
| Pioches Chance / cartes jouées par joueur | 1.03 / 0.55 |
| Objectif secret réussi | 20.7 % |
| Joueurs passés en redressement | 0.0 % — avec dette en fin : 0.0 % |
| Enchères par partie (sans acheteur) | 15.7 (59.7 %) |
| Échanges acceptés / proposés par partie | 0.8 / 0.8 |
| Attaques immobilières par partie | 0.24 |
| Durée estimée (modèle) médiane / 90e centile | 13.6 / 16.1 min |

Victoires par siège : siège 1 39.5 % · siège 2 27.0 % · siège 3 24.9 % · siège 4 17.2 %

Victoires par profil : Investisseur 25.0 % (n=1000) · Agressif 33.3 % (n=750) · Négociateur 33.3 % (n=750) · Aléatoire raisonnable 25.0 % (n=1000)

Cartes les plus jouées : Magnat (155), Nouvelle opportunité (152), OPA hostile (128), Prise de contrôle (115), Bon investissement (103). Jamais jouées : Rendement bonus, Crise locale, Assurance, Réforme urbaine.

**Alertes :** 
- ⚠️ Durée médiane estimée hors [20 ; 40] min (13.6 min)
