# DEALS — Décisions à valider
Version 1.1 — 18/11/2026. **Statut : toutes les recommandations sont appliquées PROVISOIREMENT (accord du créateur du 18/11/2026 : « tes recos, puis ajuste »)** dans les règles `1.0.0-provisional`. Elles restent modifiables point par point. Bots : validés (remplacement + parties à 1-2 humains). 3D : Blender + kits CC0 validé. Supabase : mise en pause de la-villa validée (à faire en Phase 3).
Format : question → options → recommandation → impact → valeur par défaut temporaire (utilisée seulement pour coder et simuler, jamais présentée comme règle).

Les points marqués 🔴 bloquent le gel des règles v1.0. 🟠 = peut attendre les simulations. 🔵 = produit / technique.

---

## A. Structure et rythme

### ✅ R03 — Durée effective de la partie — **VALIDÉ le 19/11/2026 : variante V9** (règles v1.1)
- Dé de mouvement 1-2-2-3-3-4, 1 carte Chance piochée en main à chaque passage de Départ, +10 D au début de chaque tour, compensation de départ +0/+20/+40/+60 D selon le siège. Règles d'origine conservées dans le code (`OFFICIAL_CONFIG`) pour comparaison.
- Reste ouvert : avantage du 1er joueur à 3 joueurs (~41 %).

#### Historique R03
- **Constat :** dé 1-3 (moyenne 2) × 12 manches = ~24 cases = 1 tour. ~1 carte piochée par joueur et par partie ; Départ franchi par ~55 % des joueurs.
- **Options :** (a) garder tel quel et laisser la simulation trancher ; (b) dé de mouvement 1,2,2,3,3,4 (moyenne 2,5 → ~1,25 tour) ; (c) piocher aussi une carte au passage de Départ ; (d) 1 carte gratuite en début de partie + Chance inchangée ; (e) combinaison b+d.
- **Recommandation :** (a) d'abord — je simule la version officielle — puis je te présente (b), (c), (d), (e) chiffrés. Ne rien changer sans chiffres.
- **Impact :** cœur de l'intérêt du jeu (cartes, loyers, Départ).
- **Défaut temporaire :** règles officielles inchangées.
- **Mesuré (40 000 parties) :** 0,57 passage par Départ et 1,02 carte piochée par joueur ; économie à sec ; 1er joueur 41 % de victoires à 3. Voir `PHASE_1_2_RAPPORT.md` §5 pour les variantes à simuler.

### 🔴 R02 / Brief 8-9 — Ordre du tour et fenêtre des cartes
- **Constat :** carte en étape 8 = après achat/taxe/construction → 7 cartes injouables telles qu'écrites (#1, #4, #7, #8, #29, #32, #33).
- **Options :** (a) séquence stricte actuelle (et réécrire ces 7 cartes) ; (b) **fenêtres** : la carte (1 max/tour) peut se jouer *avant le lancer*, *pendant la résolution de sa case d'arrivée* (avant de payer/acheter), ou *pendant la phase de gestion* ; gestion = construction, marché, carte, échanges **dans l'ordre que le joueur veut**.
- **Recommandation :** (b). Conserve toutes les cartes telles qu'écrites.
- **Carte piochée jouable le même tour ?** Recommandation : **oui**, si le joueur n'a pas déjà joué de carte ce tour (une carte max reste respectée).
- **Défaut temporaire :** (b) + oui.

### 🔴 D-P1 — Bots
- Remplacer un joueur déconnecté par un bot, et/ou permettre des parties contre bots (solo, ou compléter à 3) ?
- **Recommandation :** oui aux deux (les agents du simulateur servent de bots, même moteur). Indispensable pour tester seul et pour ne jamais bloquer une partie.

## B. Cartes

### 🔴 R01 — Raretés : le catalogue donne 17 C / 13 R / 4 E / 2 L (cible 18/12/4/2)
- **Options :** passer en Commune (a) Influence locale (#31), (b) Réforme urbaine (#34), (c) Permis exceptionnel (#33).
- **Recommandation :** (a) Influence locale — effet le plus faible et temporaire ; coût 2 Matériaux à baisser à 1 Matériau.
- **Défaut temporaire :** (a).

### 🔴 R04 — Famille des 2 légendaires
- **Recommandation :** Magnat → Investissement ; OPA hostile → Attaque. Cadre légendaire spécifique, illustration de leur famille. Pas de 6ᵉ famille.

### 🔴 R05 — Différencier Prise de contrôle (Épique) et OPA hostile (Légendaire)
- **Options :** (a) OPA **ignore les protections** (Protection juridique, Assurance immobilière, Contre-offensive) ; (b) OPA donne à l'attaquant une remise de 20 % sur sa propre enchère ; (c) OPA vise aussi une propriété construite, Prise de contrôle seulement niveau 0.
- **Recommandation :** (a).

### 🔴 R06 — Propriété perdue par attaque : bâtiments, hypothèque, indemnité
- **Recommandation :** les bâtiments restent sur la propriété et sont vendus avec elle ; l'ancien propriétaire reçoit **le prix de l'enchère** (sinon l'attaque est trop punitive et sans contre-partie) — option alternative : il ne reçoit rien, la banque encaisse. Propriété hypothéquée : non ciblable.
- **Point de départ de l'enchère :** 50 % du prix de la propriété (bâtiments compris à 50 % de leur coût en D).

### 🔴 R07 — Partenariat (#28) et Fusion (#30) sans effet réel
- **Recommandation :** Partenariat : « la cible choisit : te verser 10 D **ou** te céder 1 ressource » (obligatoire, pas de refus). Fusion : « échange imposé de deux propriétés de **même valeur ±10 D**, sans consentement, hors propriétés construites ».
- **Alternative :** garder ton texte tel quel (cartes faibles).

### 🔴 R08 — Influence locale : définition de « +1 influence »
- **Recommandation :** compte comme +1 propriété du quartier pour la **majorité de construction et les bonus** jusqu'à la fin du tour ; jamais pour le score final.

### 🔴 R09 — Durées et échéances des effets (brief 10-11)
- **Recommandation :** tous les effets « prochain loyer / prochaine perte / prochaine attaque » expirent au plus tard **à la fin de la manche suivante** s'ils n'ont pas servi. Contre-offensive : jusqu'au début du prochain tour du propriétaire, comme les autres défenses ; une attaque sur une propriété du joueur compte comme attaque le ciblant. Réserve d'urgence : jusqu'au début du prochain tour du propriétaire.
- **Ordre des protections multiples :** la plus spécifique d'abord (protection de propriété), puis protection personnelle (Contre-offensive), puis Bouclier financier ; une seule protection consommée par attaque.
- **Cumul :** effets identiques non cumulables sur la même cible (le nouveau remplace l'ancien), effets différents cumulables.

## C. Économie

| # | Question | Recommandation | Défaut temporaire |
|---|---|---|---|
| 🟠 Brief 1 | Garder 25 D après achat volontaire ? | Oui (évite les faillites en chaîne) ; à confirmer par simulation | 25 D |
| 🟠 Brief 2 | Marché : prix et accès | Accessible **uniquement en s'arrêtant sur la case 8** ; achat Matériau 15 D, Énergie 20 D, vente 5 D ; max 3 transactions | Idem |
| 🟠 Brief 3 | Taxe municipale | 15 D | 15 D |
| 🟠 Brief 4 / R10 | Bonus de quartier | Garder les 6 proposés ; « attaque mineure » (Centre-ville) = toute carte Attaque non immobilière | Idem |
| 🟠 Brief 5-6 | Plafonds 8 Mat. / 6 Én., conversion | Oui ; au plafond : choix d'une autre ressource ou +5 D | Idem |
| 🔴 Brief 7 | Enchères | **Enchère ouverte en direct** : chacun enchérit quand il veut par +5/+10/+20 D ; chrono 10 s relancé à chaque offre ; « Passer » = sortie définitive ; on ne peut pas enchérir au-delà de ses crédits ; égalité impossible (le serveur ordonne les offres) ; joueur déconnecté = considéré comme ayant passé | Idem |
| 🟠 Brief 12 | Propriété hypothéquée échangeable ? | Non | Non |
| 🟠 Brief 13 | Hypothèque | 50 % du prix, levée à 55 % ; uniquement sur propriété **sans bâtiment** | Idem |
| 🔴 R13 | Revente de bâtiments | Possible en phase de gestion à 50 % du coût en D (ressources non rendues), un niveau à la fois | Idem |
| 🔴 Brief 14-15 | Impayé et redressement | 1) payer avec les crédits ; 2) vendre ressources 5 D ; 3) vendre bâtiments ; 4) hypothéquer ; 5) reste = dette, entrée en redressement : +20 D de dette, 1 tour sans achat/construction/attaque ; à la fin du tour suivant, si dette > 0 : vente aux enchères forcée des propriétés (la moins chère d'abord) jusqu'à apurement ; dette résiduelle déduite du score final | Idem |
| 🟠 Brief 18 | Bonus +10 % de quartier : calculé quand ? | Au moment du paiement, avec la propriété actuelle ; effets temporaires appliqués après, dans l'ordre : multiplicateur bâtiment → bonus quartier → réductions de cartes → arrondi au 5 supérieur | Idem |

## D. Score et fin

### 🔴 Brief 16 / R12 — Objectifs secrets (aucun n'existe)
- **Proposition (à valider ou remplacer) :** 12 objectifs, 1 tiré par joueur, révélés en fin de partie.
  - Faciles 15 pts : posséder 3 propriétés ; avoir ≥ 120 D en fin ; posséder un bâtiment niveau 2 ; réussir 2 échanges.
  - Moyens 25 pts : contrôler 1 quartier ; posséder des propriétés dans 4 quartiers différents ; gagner 2 enchères ; jouer 3 cartes.
  - Difficiles 35 pts : contrôler 2 quartiers ; posséder un bâtiment niveau 3 ; posséder 1 propriété au Centre-ville + 1 aux Affaires construites ; terminer sans aucune dette ni hypothèque avec ≥ 6 propriétés.

### 🔴 R11 — Pile d'événements (case 12)
- **Proposition :** 12 événements à effet immédiat ou d'une manche (ex. « Travaux : loyers Industriel −50 % jusqu'à la fin de la manche », « Subvention : chaque joueur gagne 1 Matériau », « Bourse : propriétés Affaires +5 D de loyer pendant 1 manche »…). Je rédige la liste complète si tu acceptes le principe. **Option B :** case 12 = « piocher 1 événement global » ; **Option C :** case 12 neutre en v1.
- **Défaut temporaire :** C (aucun effet) jusqu'à validation.

### 🔴 Brief 17 — Formule exacte du score
`Crédits + 10×Mat. + 10×Én. + floor(70 % prix propriétés) + floor(50 % coûts historiques bâtiments en D uniquement) + objectifs + 25×quartiers contrôlés − dettes`, chaque terme arrondi à l'entier inférieur, hypothéquées comptées à 70 % − montant à rembourser.

### 🟠 Brief 19-22
- Joueur qui quitte : un bot reprend sa place (D-P1) ; la partie continue toujours à 3 ou 4 sièges.
- Durée de négociation : offre d'échange valable 30 s ; 3 offres max par tour.
- Commande refusée ou concurrente : rejetée sans aucun changement d'état, message clair au joueur.
- Égalité finale : critères du dossier puis égalité partagée (confirmé).

## E. Produit, art et technique

| # | Question | Options | Recommandation |
|---|---|---|---|
| 🔵 D-A1 | Qualité 3D | (a) tout modélisé par moi en Blender scripté (style stylisé « low-poly premium ») ; (b) (a) + kits CC0 libres (Kenney, Quaternius) pour le décor ; (c) artiste 3D externe pour les héros (pions, bâtiments) | (b), et (c) plus tard si budget |
| 🔵 D-A2 | Illustrations des cartes | Utiliser tes 5 modèles 25-29 + dos 01 comme art final ? | Oui ; recolorer le cadre Commerce (vert = Investissement) en **or/ambre** |
| 🔵 D-A3 | Pions | 4 silhouettes distinctes (tour, maison, usine, grue) ou ton modèle unique ×4 couleurs | 4 silhouettes distinctes sur le socle de ta référence |
| 🔵 D-A4 | Bâtiments | 1 modèle générique 0-3 ou 6 styles de quartier × 4 niveaux | Générique en vertical slice, 6 styles en Phase 5 |
| 🔵 D-P2 | Méta-jeu (profils, XP, badges, classement, boutique, saisons vus dans les images) | Aucun en v1 / profil + avatar + historique + classement / tout | Profil + avatar + historique + classement simple. Pas de boutique ni d'achats intégrés en v1 |
| 🔵 D-T1 | Comptes joueurs | Invité seulement / invité + email / + Apple & Google | Invité + email magique en v1, Apple/Google avant publication store |
| 🔵 D-T2 | Plateforme | Web (PWA) seulement / web + App Store + Play Store via Capacitor | Web d'abord, stores en Phase 8 (tes comptes développeur nécessaires) |
| 🔵 D-T3 | Supabase | Nouveau projet « deals » (gratuit limité à 2 actifs : il faut mettre en pause un projet) / passer en Pro 25 $/mois | Nouveau projet ; me dire lequel mettre en pause, ou passer en Pro |
| 🔵 D-T4 | Hébergement client | Vercel (comme tes autres sites) | Vercel |
| 🔵 D-T5 | Dépôt | Créer `Melvin007LRN/deals` (privé) | Oui — tu crées le dépôt vide sur GitHub (mon jeton actuel ne peut pas le faire) et je m'y attache |
| 🔵 D-T6 | Langue | FR seul / FR + EN | FR en v1, textes prêts pour traduction |
