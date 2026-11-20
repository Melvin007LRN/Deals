# DEALS — Version de test : rapport
20/11/2026 — règles **1.4.0-test** — en ligne : **https://deals-melcard.vercel.app**

## 1. Ce qui est livré et vérifié

| Élément | État | Preuve |
|---|---|---|
| Moteur de règles complet (24 cases, 36 cartes, enchères, échanges, dettes, score) | ✅ | 123 tests automatisés, 0 échec ; fuzzing 300 parties complètes vérifiées à chaque action ; rejeu identique |
| Équilibrage (règles 1.4) | ✅ | > 200 000 parties simulées (voir `docs/simulations/`) |
| Bots (5 profils, décisions par valeur espérée) | ✅ | Utilisés en simulation, en local et par le serveur |
| Plateau 3D (R3F) : 24 cases, ville centrale, bâtiments niv. 1-3, 4 pions distincts, dés physiques, effets | ✅ | Captures d'écran sur un téléphone simulé 390 × 844 |
| Interface mobile : accueil, joueurs, actions contextuelles, cartes illustrées, enchères en direct, échanges, construction, marché, journal, fin de partie | ✅ | Parties complètes jouées par un script qui clique dans l'interface (12 manches → écran de fin) |
| Partie contre bots (2 ou 3 bots) | ✅ | Idem |
| Partie en ligne entre amis (code à 5 caractères, lien de partage, bots pour compléter) | ✅ serveur / ⚠️ navigateur | Test d'intégration 18/18 (base simulée) + autotest de production 3/3 sur la vraie base et le vrai temps réel. Non testé : la réception temps réel dans un vrai navigateur (réseau de travail bloqué) — une resynchronisation automatique toutes les 5 s couvre ce cas |
| Sécurité en ligne | ✅ | Serveur autoritaire ; identité imposée par jeton (empreinte seule en base) ; tables fermées au public (vérifié) ; secret serveur obligatoire (refus vérifié) ; vue filtrée par joueur (mains, objectifs, pioche jamais diffusés) ; commandes idempotentes ; verrou de version |
| Reprise après fermeture de l'onglet | ✅ | Session gardée sur l'appareil ; retour automatique dans la partie |
| Joueur absent > 45 s | ✅ | Un bot joue à sa place jusqu'à son retour |

## 2. Architecture en ligne
- **Site + serveur de jeu** : Vercel (projet `deals`, région Paris), déployé automatiquement à chaque push sur `main` du dépôt `Melvin007LRN/Deals`.
- **Base et temps réel** : Supabase (projet `deals`, Paris). Tables sans accès public ; le serveur passe par des fonctions SQL gardées par un secret dont seule l'empreinte est stockée.
- **Canaux temps réel** : un canal privé aléatoire par joueur, connu de lui seul.
- Le projet Supabase **la-villa a été mis en pause** (limite de 2 projets gratuits) : il se relance en un clic depuis le tableau de bord Supabase.

## 3. Limites connues (honnêtes)
- **Modèles 3D** : générés en code (stylisés), pas encore les modèles Blender détaillés ni les kits CC0 prévus ; pas de bâtiments propres à chaque quartier.
- **Case Événement** : neutre (aucune pile d'événements validée).
- **Animations** : dés, déplacement, construction, achats, attaques/protections, Départ, échanges en anneaux lumineux ; pas encore d'animations de cartes en 3D ni de sons.
- **Comptes** : pas de compte joueur (pseudo + session sur l'appareil). Pas de classement, profils, boutique.
- **Stores** : pas d'empaquetage App Store / Play Store (le site s'installe sur l'écran d'accueil comme une app).
- **Durée réelle** et ressenti : à mesurer avec de vrais joueurs.
- Dépendances de développement signalées par `npm audit` (esbuild, vitest) : n'affectent pas le jeu publié.

## 4. Reproduire les vérifications
```
npm ci
npm test                                          # 123 tests moteur
npx tsx packages/sim/src/cli.ts --games 1000 --check
cd apps/client && DEALS_SERVER_SECRET=… npm run test:online   # 18 vérifications serveur
GET https://deals-melcard.vercel.app/api/deals?selftest=<clé>  # autotest de production
```
