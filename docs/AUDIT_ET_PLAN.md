# DEALS — Audit complet et plan de réalisation
Version 1.0 — 18/11/2026 — Phase 0 (aucun code de production écrit à ce stade)

---

## 1. Confirmation de lecture

Tout le pack `DEALS_PACK_COMPLET_CLAUDE_V2_5.zip` a été lu (59 fichiers, 78 Mo) :

| Bloc | Fichiers lus |
|---|---|
| 00_LIRE_EN_PREMIER | PROMPT_MAITRE_A_CLAUDE.md (brief 2.0, 18 sections), MESSAGE_DE_TRANSMISSION.md |
| Racine | README.md, MANIFEST.json |
| 01_REGLES_ET_GAME_DESIGN | README, REGLEMENT_COMPLET, PLATEAU_24_CASES, CARTES_36, ECONOMIE_SCORE, ARCHITECTURE, MODELE_DONNEES, REGLES_MOTEUR, PLAN_SIMULATION, PROMPT_CLAUDE, LISTE_COMPLETE_IMAGES_A_GENERER, MANIFEST.json, package.json, tsconfig.json, src/rules.ts, src/economy.ts, tests/economy.test.ts |
| 02 à 07 | DIRECTION_ARTISTIQUE, PIPELINE_3D_ANIMATIONS, MATRICE_QA, INVENTAIRE_IMAGES (.md/.json) |
| Zip interne | `DOSSIER_REGLES_ET_TECHNIQUE.zip` : vérifié par `diff -r`, **identique** au dossier 01 (copie de sauvegarde, rien de nouveau) |
| Images | les 31 PNG examinés un par un (voir §2) |

## 2. Inventaire des images et usage retenu

Rappel : les images sont des références artistiques. Aucune valeur, case ou règle n'en est tirée.

| # | Image | Usage retenu | Erreurs / écarts avec les règles (à ignorer) |
|---|---|---|---|
| 01 | Dos de cartes | **Utilisable tel quel** comme dos de carte (2D légitime). Base du logo | — |
| 02-03 | Pions (4 couleurs) | Référence de modélisation 3D | Même silhouette teintée ×4 (le brief préfère 4 silhouettes distinctes) |
| 04 | Dés proposition A | Référence matériaux (or + pierre bleue) | Mélange chiffres et ressources sur un même dé, face « poignée de main » |
| 05 | Dés proposition B | Référence | Points de dé classiques (pas 1,1,2,2,3,3), engrenage/lingots |
| 06 | Ressources + dés | **Meilleure référence** : dé chiffres 1/2/3, dé ressources, pièce D, matériaux (poutre/bois/parpaing), batterie énergie | — |
| 07 | Bâtiments niv. 1-2-3 | Référence de progression visuelle | Bâtiment générique « D », pas par quartier |
| 08 | Six quartiers | Référence d'ambiance | Montre « Transports » et « Politique » au lieu de Touristique/Centre-ville |
| 09 | Plateau prototype | Ambiance | « Prison », « Jackpot », cases 1-24, ordre des quartiers faux |
| 10 | 24 visuels de cases | Style des tuiles | 24 propriétés (au lieu de 18), mélange de quartiers |
| 11 | Cases spéciales | Style des tuiles spéciales | Taxe −30 D (officiel : 15 D proposé), 2 cartes Chance de couleurs différentes |
| 12 | Centre-ville / monuments | Décor central du diorama (hors cases) | Banque, port, musée = décor uniquement |
| 13 | Décors urbains | Liste du kit décor modulaire (arbres, lampadaires, routes, véhicules) | — |
| 14 | Accueil / lobby / plateau / fiche | Composition UI | Montants (12 450, 600 D, 120 D/tour), XP, saison, boutique, « 2 à 4 joueurs » |
| 15 | Fenêtres achat/enchère/échange/construction/Chance/événement | Composition des modales | Tous les montants sont faux (400 D, 620 D, +100 D…) |
| 16 | Profils / classement | Idées méta (avatars, cadres, badges) | Fonctions non définies dans les règles |
| 17 | Storyboard animations | Liste des animations | Dés blancs à points classiques |
| 18 | Icônes | Style d'iconographie | « Bois », « Béton », « Ressource rare » n'existent pas |
| 19 | Fin de partie | Composition podium/stats | Stats fictives, récompenses non définies |
| 20 = PROTOTYPE_02 | Planche concept | Ambiance | **Doublon exact** (même hash MD5) ; couleurs de quartiers inversées |
| 21 = PROTOTYPE_01 | Planche assets/UI | Ambiance | **Doublon exact** ; cartes inventées (Expansion, Expropriation…) |
| 22-23 | UI concept initiale | **Obsolète** | Ville 6×6 à 36 terrains, 5 joueurs, montants en € — ancien concept abandonné |
| 24 | Présentation promo | Ambiance téléphone | €, « Alliances », ressource violette |
| 25-29 | Modèles de cartes (5 familles) | **Utilisables comme illustrations de famille** (zones de texte vides : le texte sera rendu en code) | Commerce et Investissement ont **le même cadre vert** → confusion |

Conclusion visuelle : direction artistique claire et cohérente (bleu nuit, or, verre bleu, fenêtres chaudes, diorama). Les PNG ne sont pas intégrables comme 3D : tout le plateau, les pions, dés, ressources et bâtiments seront **reconstruits en géométrie 3D**.

## 3. Audit de l'existant technique

- **Aucun dépôt DEALS** trouvé sur ton GitHub (Melvin007LRN : skull-arena, la-villa, Braise, bynathalie, melvcard). Aucun projet Vercel « deals ». Le prototype 3D mentionné précédemment n'a jamais été versionné.
- Code fourni dans le pack : un squelette de 3 fonctions (`baseRent`, `rent`, `crossedStart`, `nextPosition`) + constantes + 3 tests. Correct mais minime. `rent()` utilise des flottants (`× 1.1`) : vérifié sans erreur d'arrondi sur toutes les combinaisons actuelles, mais le moteur final calculera en entiers.
- `RULES.voluntaryBuyReserve = 25` est codé en dur alors que c'est une règle **à valider** → sera rendu paramétrable.
- Supabase : 3 projets existants (Skull Arena actif, la-villa actif, melvcard inactif). Sur l'offre gratuite, **2 projets actifs maximum** → créer DEALS demande une décision (voir D-T3).
- Environnement de travail : Node 22, Python 3.13 ; **Blender headless installable** (module `bpy` 5.x via pip) → modélisation 3D scriptée possible, sources `.blend` + exports `.glb`.
- Le jeton GitHub de cette session est invalide : je ne peux pas pousser de code pour l'instant (voir D-T5).

## 4. Audit des règles — contradictions et problèmes détectés

### 4.1 Contrôles structurels (vérifiés par script)
| Contrôle | Résultat |
|---|---|
| 24 cases, index 0-23 uniques | ✅ |
| 18 propriétés, 6 quartiers × 3 | ✅ |
| 2 Chance, 1 Départ, 1 Marché, 1 Événement, 1 Taxe | ✅ |
| 36 cartes numérotées 1-36 | ✅ |
| Raretés cibles 18/12/4/2 | ❌ **Le catalogue donne 17 communes / 13 rares / 4 / 2** |

**Cause :** la section Politique liste 3 rares (Influence locale, Permis exceptionnel, Réforme urbaine) et 1 commune, alors que la proposition de répartition dit « Politique = 2 communes, 2 rares ». Il faut qu'une carte Politique passe de Rare à Commune. Non corrigé silencieusement → décision R01.

### 4.2 Contradictions de timing (bloquantes pour le moteur)
La séquence officielle du tour place **la carte en étape 8**, **après** la résolution de la case (6) et la construction (7). Conséquence : plusieurs cartes deviennent **injouables** telles qu'écrites :
- Réduction fiscale (#7) et Vote municipal (#32) : réduisent une taxe « due ce tour », mais la taxe est déjà payée à l'étape 6.
- Nouvelle opportunité (#8) et Contrat privilégié (#29) : réduisent un achat « ce tour », mais l'achat a lieu à l'étape 6.
- Placement malin (#1), Chantier express (#4), Permis exceptionnel (#33) : concernent la construction de l'étape 7, avant la carte.
→ Décision R02 (recommandation : fusionner les étapes 7-8-9 en une phase de gestion libre et ouvrir une fenêtre « avant le lancer » et « à l'arrivée »).

### 4.3 Problème d'équilibrage structurel majeur (calcul, pas simulation)
- Dé de mouvement : moyenne **2 cases**. 12 manches → **24 cases en moyenne par joueur = un seul tour de plateau par partie.**
- Probabilité de franchir Départ au moins une fois ≈ 55 % (écart-type de la somme ≈ 2,8). Donc le +40 D, le bonus Touristique (+10 D au Départ) et la carte Revenus garantis ne servent presque jamais.
- Chaque joueur passe sur ~12 cases sur 24 ; chaque case Chance est atteinte avec une probabilité ~50 % → **≈ 1 carte piochée par joueur et par partie** (3-4 cartes au total sur 36). La main de 5, le remplacement main pleine et la plupart des 36 cartes ne seront presque jamais vus.
- Le Centre-ville (cases 21-23, les plus chères) n'est atteint qu'en fin de partie, où un achat rapporte peu de loyers.
- Avec le score proposé (propriété = 70 % de sa valeur), **acheter fait perdre 30 % de score** : l'achat n'est rentable que via loyers et contrôle de quartier, rares sur une partie d'un seul tour.

Ce sont des calculs d'espérance, pas des résultats de simulation. Ils seront confirmés ou infirmés par le simulateur (Phase 2). Mais ils justifient une décision avant de figer : R03.

### 4.4 Ambiguïtés de cartes
| Carte | Problème |
|---|---|
| Légendaires (#35, #36) | Rangées à part : sans famille. Il faut les rattacher (Magnat → Investissement, OPA hostile → Attaque recommandé) — R04 |
| Prise de contrôle (#17) vs OPA hostile (#36) | Effet quasi identique ; la légendaire coûte plus cher pour le même résultat. Différenciation nécessaire — R05 |
| Prise de contrôle / OPA | Que deviennent les **bâtiments** et une éventuelle **hypothèque** ? L'ancien propriétaire est-il indemnisé ? — R06 |
| Partenariat (#28) | La cible n'a aucun intérêt à accepter de payer 10 D → carte morte — R07 |
| Fusion (#30) | Les échanges propriété contre propriété sont déjà libres → carte sans effet propre — R07 |
| Influence locale (#31) | « Influence » n'est défini nulle part. Compte-t-elle comme une propriété pour la majorité (et donc la construction) ? — R08 |
| Réforme urbaine (#34) | Dépend des bonus de quartier non validés — lié à R10 |
| Contre-offensive (#22) | Une attaque sur une propriété « cible-t-elle le joueur » ? Durée illimitée ? — R09 |
| Réserve d'urgence (#23) | « Pendant la durée » : durée non définie — R09 |
| Rendement bonus (#3), Sabotage (#9), Concurrence agressive (#15) | Pas d'échéance si aucun loyer n'est jamais payé — R09 |
| Centre-ville bonus | « Attaque mineure » non définie (≠ attaque immobilière) — R10 |

### 4.5 Contenu manquant (ne peut pas être inventé sans accord)
- **Pile d'événements** de la case 12 : aucun événement défini — R11.
- **Objectifs secrets** : aucun catalogue, seulement « 15/25/35 points » — R12.
- Vente de bâtiments : jamais mentionnée (peut-on revendre un niveau ?) — R13.
- Hypothèque d'une propriété construite — R13.

### 4.6 Points déjà listés par ton brief (§13) — tous repris
Les 22 points du brief sont traités dans `DECISIONS_A_VALIDER.md` avec options, recommandation et valeur par défaut.

### 4.7 Écart avec tes choix antérieurs
Lors de nos échanges précédents tu parlais de 3 à 6 joueurs, plateau 6×6 et chrono de 75 s. Le pack actuel fixe **3-4 joueurs, 24 cases, 12 manches** comme décisions confirmées. **Je suis le pack.** Les bots (que tu voulais) ne sont pas mentionnés dans le pack → D-P2.

### 4.8 Constats ajoutés pendant la Phase 1 (preuves : tests et simulations)
- **Erreur arithmétique du dossier** : ECONOMIE_SCORE.md annonce une valeur faciale totale de 1 180 D ; la somme réelle des 18 prix officiels est **1 260 D** (test `content.test.ts`). Les prix eux-mêmes ne sont pas modifiés.
- **Arrondi au 5 supérieur et réductions** : Crise locale (-25 %) n'a aucun effet sur une propriété sans bâtiment (10 → 7,5 → 10 ; 15 → 11,25 → 15) ; Sabotage (-50 %) ne fait rien sur les propriétés à 5 D de loyer. Ces cartes ne valent que sur des propriétés construites.
- **Négociateur (#25)** : « réduit de 10 D les crédits ajoutés à un échange, sans créer d'argent » revient à proposer 10 D de moins — effet quasi nul (implémenté tel quel, à revoir avec R07).
- **Simulations (40 000 parties)** : un seul tour de plateau (0,57 passage par Départ par joueur), ≈ 1 carte piochée par joueur et par partie, économie à sec dès la manche 5 (60 à 68 % des enchères sans acheteur), aucun redressement déclenché, avantage du 1er joueur (41 % de victoires à 3 au lieu de 33 %), durée estimée 12-16 min au lieu de 25-35. Détails : `docs/simulations/rapport_10000.md` et `docs/PHASE_1_2_RAPPORT.md`.

## 5. Architecture proposée

```
deals/
├─ packages/engine     Moteur TypeScript pur : applyCommand(state, cmd, rng) → {state, events}
│                      Zéro dépendance DOM/réseau. Règles versionnées (rules v1.x), entiers seulement.
├─ packages/content    Plateau 24 cases, 36 cartes, événements, objectifs (données + schémas Zod)
├─ packages/sim        Agents (Investisseur, Agressif, Négociateur, Aléatoire, Mixte) + campagnes seedées
├─ supabase/           Postgres (tables du MODELE_DONNEES + commandes + journal), RLS, Edge Function
│                      « game-command » qui exécute le MÊME moteur, verrou de version + idempotency key
├─ apps/client         React + TypeScript + React Three Fiber, mobile portrait, Zustand, i18n FR
│   ├─ scene/          plateau, pions, dés, bâtiments, décor (GLB), animations pilotées par événements
│   └─ ui/             HUD, main de cartes, modales, lobby, fin de partie (texte rendu en HTML)
├─ assets-src/         Scripts Blender (bpy) → .blend + .glb, fiches d'asset, aperçus
└─ docs/               Règles versionnées, décisions, rapports de simulation, QA
```

**Serveur autoritaire :** le client n'envoie que des intentions (`PLACE_BID 35`). L'Edge Function vérifie auth, siège, joueur actif, phase, version de partie, idempotency key, puis applique le moteur dans une transaction Postgres (`SELECT … FOR UPDATE`). Dés et pioches tirés côté serveur (crypto). Les mains et objectifs ne sont envoyés qu'à leur propriétaire (vue filtrée par joueur). Realtime diffuse les événements séquencés ; reconnexion = snapshot filtré + reprise du journal.

**Minuteurs (enchères, échanges, tour inactif) :** échéance stockée en base ; clôture déclenchée par la prochaine commande ou par un job pg_cron chaque seconde côté serveur — jamais par le client.

**3D :** modèles scriptés dans Blender (bpy headless), PBR, atlas de textures, instancing du décor, LOD, colliders simples, export GLB compressé (Draco/Meshopt + KTX2). Les dés s'arrêtent sur la face décidée par le serveur (animation calculée à rebours).

**Mobile / publication :** web app (PWA) déployée sur Vercel, puis empaquetage iOS/Android via Capacitor — D-T2.

## 6. Plan par phases et critères de réussite

| Phase | Contenu | Critère « terminé » (preuve) |
|---|---|---|
| **0 — Audit** (ce document) | Audit, décisions, plan | Tes réponses aux décisions bloquantes |
| **1 — Moteur** | État, 26 commandes, 36 cartes, enchères, échanges, dettes, score, journal rejouable | Tests unitaires de tous les points du §15 du brief + tests de propriétés (invariants) sur ≥100 000 séquences aléatoires, 0 rouge ; couverture ≥ 90 % du moteur |
| **2 — Simulation** | 5 agents, campagnes 1 000 → 10 000 → 40 000 parties | Rapport horodaté réel (seeds, métriques, alertes). Propositions d'ajustement soumises à ton accord |
| **3 — Backend** | Supabase : auth (invité + compte), lobby public/privé à code, Edge Function autoritaire, Realtime, reconnexion, timeouts | Tests d'intégration : double-clic, commande obsolète, déconnexion pendant enchère, main jamais visible par l'adversaire |
| **4 — Vertical slice** | Partie complète 3 joueurs jouable sur téléphone (plateau 3D provisoire mais réel) | Une partie de bout en bout enregistrée en vidéo, rejouable depuis son journal |
| **5 — Production 3D** | Plateau, 24 cases, 6 quartiers, bâtiments 0-3, 4 pions, 2 dés, 3 ressources, décor, centre-ville | Fiche par asset (poids, échelle, pivot, LOD), budget mesuré |
| **6 — UI/UX** | Accueil, lobby, partie, modales, règles, paramètres, fin, accessibilité | Tests sur 3 tailles d'écran, safe areas, aucun scroll parasite |
| **7 — Animations** | Dés, pion, Départ, achat, construction, cartes, attaque/bouclier, enchère, échange, quartier, redressement, victoire | Toutes déclenchées par événements serveur ; option « réduire les animations » |
| **8 — QA & release** | Charge, réseau lent, sécurité RLS, builds Capacitor, fiches stores | Matrice QA cochée avec preuves |

Je livre phase par phase ; à chaque étape : fichiers modifiés, tests lancés et résultat exact, limites connues. Rien n'est déclaré terminé sans preuve.

## 7. Risques majeurs

1. **Équilibrage** (§4.3) : en l'état, la partie dure un seul tour de plateau et les cartes sont quasi absentes. Risque n° 1 pour l'intérêt du jeu.
2. **Qualité 3D** : la modélisation scriptée (Blender en code) donnera un rendu stylisé propre et cohérent, mais **pas** le niveau de détail des rendus IA du dossier (qui ne sont pas réalisables tels quels en temps réel sur mobile, de toute façon). Pour s'en approcher : kits CC0 (Kenney, Quaternius) en complément, ou un artiste 3D — D-A1.
3. **Minuteurs serveur** sur Supabase (enchères 10-15 s) : faisable avec échéances en base + pg_cron, à valider par tests de charge.
4. **Publication stores** : nécessite tes comptes Apple Developer (99 $/an) et Google Play (25 $ une fois), une politique de confidentialité et des captures.
5. **Volume** : c'est un projet de plusieurs semaines de travail effectif. Il avancera en plusieurs sessions ; le code doit vivre dans un dépôt GitHub pour ne rien perdre entre sessions.

## 8. Priorités P0 (dès validation)
1. Geler `rules v1.0` avec tes réponses (R01-R13 + points du brief).
2. Moteur + tests (Phase 1) — indépendant de toutes les décisions visuelles.
3. Simulateur (Phase 2) pour trancher l'équilibrage avec des chiffres réels.
4. En parallèle : dépôt GitHub, projet Supabase, pipeline Blender → GLB sur un premier asset (dé de mouvement) pour valider la chaîne.
