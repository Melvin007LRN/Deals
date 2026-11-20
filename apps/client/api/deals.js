// Fichier généré par server/build.mjs — ne pas modifier à la main.

// ../../packages/engine/src/content/board.ts
var DISTRICTS = [
  { id: "residential", name: "R\xE9sidentiel", color: "#2fa84f" },
  { id: "commercial", name: "Commercial", color: "#d8343a" },
  { id: "industrial", name: "Industriel", color: "#f08a1c" },
  { id: "touristic", name: "Touristique", color: "#19b5c4" },
  { id: "business", name: "Affaires", color: "#8a4fd8" },
  { id: "downtown", name: "Centre-ville", color: "#d9a92b" }
];
var BOARD = [
  { index: 0, name: "D\xE9part DEALS", type: "start" },
  { index: 1, name: "Rue des Tilleuls", type: "property", district: "residential", price: 40 },
  { index: 2, name: "Place des Jardins", type: "property", district: "residential", price: 50 },
  { index: 3, name: "Avenue du Parc", type: "property", district: "residential", price: 60 },
  { index: 4, name: "Opportunit\xE9", type: "chance" },
  { index: 5, name: "Galerie Centrale", type: "property", district: "commercial", price: 50 },
  { index: 6, name: "March\xE9 Saint-Pierre", type: "property", district: "commercial", price: 60 },
  { index: 7, name: "Boulevard du Commerce", type: "property", district: "commercial", price: 70 },
  { index: 8, name: "March\xE9 des ressources", type: "market" },
  { index: 9, name: "Entrep\xF4t Nord", type: "property", district: "industrial", price: 40 },
  { index: 10, name: "Usine des Quais", type: "property", district: "industrial", price: 60 },
  { index: 11, name: "Complexe industriel", type: "property", district: "industrial", price: 80 },
  { index: 12, name: "Actualit\xE9 \xE9conomique", type: "event" },
  { index: 13, name: "H\xF4tel du Lac", type: "property", district: "touristic", price: 60 },
  { index: 14, name: "Promenade des Arts", type: "property", district: "touristic", price: 70 },
  { index: 15, name: "Grand Palace", type: "property", district: "touristic", price: 90 },
  { index: 16, name: "Coup du destin", type: "chance" },
  { index: 17, name: "Tour des Finances", type: "property", district: "business", price: 70 },
  { index: 18, name: "Place des Investisseurs", type: "property", district: "business", price: 80 },
  { index: 19, name: "Centre des Affaires", type: "property", district: "business", price: 100 },
  { index: 20, name: "Taxe municipale", type: "tax" },
  { index: 21, name: "Avenue Royale", type: "property", district: "downtown", price: 80 },
  { index: 22, name: "Grand Boulevard", type: "property", district: "downtown", price: 90 },
  { index: 23, name: "Place Imp\xE9riale", type: "property", district: "downtown", price: 110 }
];
var PROPERTY_INDICES = BOARD.filter((s) => s.type === "property").map((s) => s.index);
function space(index) {
  const s = BOARD[index];
  if (!s) throw new Error(`Invalid board index ${index}`);
  return s;
}
function districtProperties(d) {
  return BOARD.filter((s) => s.district === d).map((s) => s.index);
}
function priceOf(index) {
  const s = space(index);
  if (s.type !== "property" || s.price === void 0) throw new Error(`Space ${index} is not a property`);
  return s.price;
}
function districtOf(index) {
  const s = space(index);
  if (!s.district) throw new Error(`Space ${index} has no district`);
  return s.district;
}

// ../../packages/engine/src/content/cards.ts
var c = (id, key, name, family, rarity, materials, energy, target, attack, text, rulesNote) => ({ id, key, name, family, rarity, cost: { materials, energy }, target, attack, text, ...rulesNote ? { rulesNote } : {} });
var CARDS = [
  // Investissement (8) + Magnat
  c(1, "placement_malin", "Placement malin", "investment", "common", 1, 0, "none", null, "R\xE9duit de 10 D une construction ce tour, minimum 0."),
  c(2, "coup_de_pouce", "Coup de pouce", "investment", "common", 0, 1, "none", null, "Gagne 20 D."),
  c(3, "rendement_bonus", "Rendement bonus", "investment", "rare", 1, 1, "ownProperty", null, "Une propri\xE9t\xE9 poss\xE9d\xE9e rapporte +15 D \xE0 son prochain loyer r\xE9ellement pay\xE9.", "Expire \xE0 la fin de la manche suivante si aucun loyer n'est pay\xE9 (R09)."),
  c(4, "chantier_express", "Chantier express", "investment", "rare", 2, 0, "none", null, "Autorise une construction suppl\xE9mentaire ce tour ; co\xFBts et majorit\xE9 restent requis."),
  c(5, "bon_investissement", "Bon investissement", "investment", "common", 0, 1, "none", null, "Gagne 1 Mat\xE9riau (plafond applicable).", "Au plafond : +5 D."),
  c(6, "revenus_garantis", "Revenus garantis", "investment", "common", 1, 0, "none", null, "Gagne 20 D au prochain passage D\xE9part ; un effet actif maximum."),
  c(7, "reduction_fiscale", "R\xE9duction fiscale", "investment", "rare", 1, 1, "none", null, "Annule la taxe municipale de case due ce tour."),
  c(8, "nouvelle_opportunite", "Nouvelle opportunit\xE9", "investment", "epic", 2, 0, "none", null, "R\xE9duit de 20 D un achat volontaire de propri\xE9t\xE9 ce tour, pas une ench\xE8re."),
  // Attaque (10) + OPA
  c(9, "sabotage", "Sabotage", "attack", "common", 0, 1, "opponentProperty", "minor", "Prochain loyer d'une propri\xE9t\xE9 adverse r\xE9duit de 50 %, minimum 0, puis effet consomm\xE9.", "Expire \xE0 la fin de la manche suivante (R09)."),
  c(10, "pression_fiscale", "Pression fiscale", "attack", "common", 0, 1, "opponent", "minor", "Une cible paie 15 D \xE0 la banque ; dette si insuffisant."),
  c(11, "greve", "Gr\xE8ve", "attack", "common", 1, 0, "opponentProperty", "minor", "Une propri\xE9t\xE9 adverse ne peut pas \xEAtre am\xE9lior\xE9e pendant le prochain tour de son propri\xE9taire."),
  c(12, "inspection", "Inspection", "attack", "common", 0, 1, "opponent", "minor", "La cible perd 1 Mat\xE9riau ; si aucun, 5 D."),
  c(13, "blocage_bancaire", "Blocage bancaire", "attack", "rare", 1, 1, "opponent", "minor", "La cible ne peut pas acheter volontairement pendant son prochain tour, mais peut ench\xE9rir."),
  c(14, "detournement", "D\xE9tournement", "attack", "common", 0, 1, "opponent", "minor", "Prend jusqu'\xE0 10 D \xE0 un adversaire et les transf\xE8re \xE0 l'attaquant."),
  c(15, "concurrence_agressive", "Concurrence agressive", "attack", "rare", 1, 0, "opponent", "minor", "Prochain loyer re\xE7u par une cible r\xE9duit de 10 D, minimum 0.", "Expire \xE0 la fin de la manche suivante (R09)."),
  c(16, "fraude_commerciale", "Fraude commerciale", "attack", "common", 0, 1, "opponent", "minor", "La cible perd 1 \xC9nergie ; si aucun, 5 D."),
  c(17, "prise_de_controle", "Prise de contr\xF4le", "attack", "epic", 2, 2, "opponentProperty", "realty", "Propri\xE9t\xE9 adverse non prot\xE9g\xE9e retir\xE9e puis mise aux ench\xE8res ; l'attaquant peut ench\xE9rir.", "B\xE2timents vendus avec la propri\xE9t\xE9, produit de l'ench\xE8re vers\xE9 \xE0 l'ancien propri\xE9taire, propri\xE9t\xE9 hypoth\xE9qu\xE9e non ciblable (R06)."),
  c(18, "crise_locale", "Crise locale", "attack", "rare", 1, 1, "district", "minor", "Loyers d'un quartier r\xE9duits de 25 % jusqu'au prochain tour du lanceur ; non cumulable."),
  // Défense (6)
  c(19, "assurance", "Assurance", "defense", "common", 1, 0, "ownProperty", null, "Prot\xE8ge une propri\xE9t\xE9 contre le prochain sabotage/r\xE9duction de loyer jusqu'au d\xE9but du prochain tour du propri\xE9taire."),
  c(20, "bouclier_financier", "Bouclier financier", "defense", "common", 0, 1, "none", null, "R\xE9duit de 15 D la prochaine perte financi\xE8re caus\xE9e par une carte, pas les loyers normaux/taxes.", "Expire \xE0 la fin de la manche suivante (R09)."),
  c(21, "protection_juridique", "Protection juridique", "defense", "rare", 1, 1, "ownProperty", null, "Prot\xE8ge une propri\xE9t\xE9 contre une attaque immobili\xE8re jusqu'au d\xE9but du prochain tour du propri\xE9taire."),
  c(22, "contre_offensive", "Contre-offensive", "defense", "epic", 0, 2, "none", null, "Protection personnelle pr\xE9install\xE9e : annule la prochaine attaque ciblant le joueur ; l'attaquant perd 1 \xC9nergie si possible.", "Jusqu'au d\xE9but du prochain tour du joueur ; une attaque sur une de ses propri\xE9t\xE9s le cible (R09)."),
  c(23, "reserve_urgence", "R\xE9serve d'urgence", "defense", "common", 1, 0, "none", null, "Si loyer/taxe de case provoque incapacit\xE9 pendant la dur\xE9e, avance 15 D sous forme de dette.", "Dur\xE9e : jusqu'au d\xE9but du prochain tour du joueur (R09)."),
  c(24, "assurance_immobiliere", "Assurance immobili\xE8re", "defense", "rare", 1, 0, "ownProperty", null, "Prot\xE8ge une propri\xE9t\xE9 contre la prochaine attaque immobili\xE8re jusqu'au d\xE9but du prochain tour du propri\xE9taire."),
  // Commerce (6)
  c(25, "negociateur", "N\xE9gociateur", "commerce", "common", 1, 0, "none", null, "R\xE9duit de 10 D le montant en Cr\xE9dits que le joueur doit ajouter \xE0 un \xE9change ce tour ; ne cr\xE9e pas d'argent.", "Appliqu\xE9 au prochain \xE9change accept\xE9 ce tour o\xF9 le joueur donne des Cr\xE9dits (les deux c\xF4t\xE9s voient le montant r\xE9duit)."),
  c(26, "offre_speciale", "Offre sp\xE9ciale", "commerce", "common", 0, 1, "none", null, "Apr\xE8s un \xE9change accept\xE9 ce tour, gagne 1 Mat\xE9riau."),
  c(27, "courtier", "Courtier", "commerce", "rare", 1, 0, "resource", null, "Vend une ressource \xE0 la banque contre 15 D (une seule ressource)."),
  c(28, "partenariat", "Partenariat", "commerce", "common", 0, 1, "opponent", null, "Propose un contrat ; si la cible accepte, elle verse 10 D au lanceur.", "R07 : la cible doit verser 10 D, ou \xE0 d\xE9faut c\xE9der 1 ressource (Mat\xE9riau puis \xC9nergie)."),
  c(29, "contrat_privilegie", "Contrat privil\xE9gi\xE9", "commerce", "rare", 1, 1, "none", null, "R\xE9duit de 15 D un achat volontaire ce tour ; pas une ench\xE8re ; ne se cumule pas avec Nouvelle opportunit\xE9."),
  c(30, "fusion", "Fusion", "commerce", "epic", 2, 0, "swap", null, "Propose \xE9change d'une propri\xE9t\xE9 contre une autre ; consentement des deux joueurs.", "R07 : \xE9change impos\xE9 de deux propri\xE9t\xE9s sans b\xE2timent ni hypoth\xE8que, de valeur \xE9gale \xE0 \xB110 D."),
  // Politique (4)
  c(31, "influence_locale", "Influence locale", "politics", "common", 1, 0, "district", null, "+1 influence temporaire dans un quartier jusqu'\xE0 fin du tour ; ne donne pas les points de contr\xF4le final.", "R01 : Commune, co\xFBt 1 Mat\xE9riau. R08 : compte comme +1 propri\xE9t\xE9 pour la majorit\xE9 (construction, bonus) jusqu'\xE0 la fin du tour."),
  c(32, "vote_municipal", "Vote municipal", "politics", "common", 1, 1, "none", null, "R\xE9duit de 10 D une taxe de case ce tour."),
  c(33, "permis_exceptionnel", "Permis exceptionnel", "politics", "rare", 2, 1, "none", null, "Autorise une construction suppl\xE9mentaire, conditions habituelles maintenues."),
  c(34, "reforme_urbaine", "R\xE9forme urbaine", "politics", "rare", 2, 0, "district", null, "Double temporairement le bonus \xE9conomique d'un quartier jusqu'au prochain tour du lanceur ; ne double pas les points."),
  // Légendaires (2)
  c(35, "magnat", "Magnat", "investment", "legendary", 2, 2, "none", null, "Gagne 40 D et 1 Mat\xE9riau ; si plafond, convertir en 5 D."),
  c(36, "opa_hostile", "OPA hostile", "attack", "legendary", 3, 2, "opponentProperty", "realty", "Propri\xE9t\xE9 adverse non prot\xE9g\xE9e remise aux ench\xE8res ; attaque immobili\xE8re limit\xE9e \xE0 une par propri\xE9t\xE9 et par manche.", "R05 : ignore toutes les protections. R06 comme Prise de contr\xF4le.")
];
function card(id) {
  const d = CARDS[id - 1];
  if (!d || d.id !== id) throw new Error(`Unknown card ${id}`);
  return d;
}
var CARD_KEYS = Object.fromEntries(CARDS.map((d) => [d.key, d.id]));
var CARD_REVISION_2 = {
  bon_investissement: { text: "Gagne 2 Mat\xE9riaux (plafond applicable, exc\xE9dent converti en 5 D)." },
  vote_municipal: { cost: { materials: 1, energy: 0 }, text: "R\xE9duit de 20 D la taxe de case ou le loyer que tu paies ce tour." },
  inspection: { text: "Vole 1 Mat\xE9riau \xE0 la cible ; si elle n'en a pas, lui prend jusqu'\xE0 10 D." },
  fraude_commerciale: { text: "Vole 1 \xC9nergie \xE0 la cible ; si elle n'en a pas, lui prend jusqu'\xE0 10 D." },
  blocage_bancaire: { cost: { materials: 0, energy: 1 }, text: "La cible ne peut pas acheter volontairement pendant son prochain tour, mais peut ench\xE9rir." },
  crise_locale: { text: "Aucun loyer n'est pay\xE9 dans un quartier jusqu'au prochain tour du lanceur ; non cumulable." },
  assurance: { target: "none", text: "Prot\xE8ge toutes tes propri\xE9t\xE9s contre Sabotage, Gr\xE8ve et Crise locale jusqu'au d\xE9but de ton prochain tour (non consomm\xE9e)." },
  reforme_urbaine: { cost: { materials: 1, energy: 0 }, text: "Double le bonus \xE9conomique d'un quartier jusqu'au prochain tour du lanceur ; ne double pas les points." }
};
function cardCost(def, revision = 1) {
  return revision === 2 ? CARD_REVISION_2[def.key]?.cost ?? def.cost : def.cost;
}
function cardTarget(def, revision = 1) {
  return revision === 2 ? CARD_REVISION_2[def.key]?.target ?? def.target : def.target;
}

// ../../packages/engine/src/content/objectives.ts
var OBJECTIVES = [
  { id: 1, key: "own_3", difficulty: "easy", text: "Poss\xE9der au moins 3 propri\xE9t\xE9s." },
  { id: 2, key: "credits_120", difficulty: "easy", text: "Terminer avec au moins 120 D." },
  { id: 3, key: "level_2", difficulty: "easy", text: "Poss\xE9der un b\xE2timent de niveau 2 ou plus." },
  { id: 4, key: "trades_2", difficulty: "easy", text: "R\xE9ussir au moins 2 \xE9changes." },
  { id: 5, key: "control_1", difficulty: "medium", text: "Contr\xF4ler au moins 1 quartier." },
  { id: 6, key: "four_districts", difficulty: "medium", text: "Poss\xE9der des propri\xE9t\xE9s dans 4 quartiers diff\xE9rents." },
  { id: 7, key: "auctions_2", difficulty: "medium", text: "Gagner au moins 2 ench\xE8res." },
  { id: 8, key: "cards_3", difficulty: "medium", text: "Jouer au moins 3 cartes." },
  { id: 9, key: "control_2", difficulty: "hard", text: "Contr\xF4ler au moins 2 quartiers." },
  { id: 10, key: "level_3", difficulty: "hard", text: "Poss\xE9der un b\xE2timent de niveau 3." },
  { id: 11, key: "downtown_business_built", difficulty: "hard", text: "Poss\xE9der une propri\xE9t\xE9 construite au Centre-ville et une aux Affaires." },
  { id: 12, key: "clean_6", difficulty: "hard", text: "Terminer sans dette ni hypoth\xE8que avec au moins 6 propri\xE9t\xE9s." }
];
function objective(id) {
  const o = OBJECTIVES[id - 1];
  if (!o) throw new Error(`Unknown objective ${id}`);
  return o;
}

// ../../packages/engine/src/content/rules.ts
var RULES_VERSION = "1.4.0-test";
var RULES = {
  // confirmed
  playersMin: 3,
  playersMax: 4,
  rounds: 12,
  boardSize: 24,
  startingCredits: 150,
  startingMaterials: 2,
  startingEnergy: 1,
  startReward: 40,
  maxHand: 5,
  cardsPerTurn: 1,
  chanceDraw: 2,
  districtMajority: 2,
  // provisional (brief §13, DECISIONS A/C)
  maxMaterials: 8,
  maxEnergy: 6,
  capConversionCredits: 5,
  voluntaryBuyReserve: 25,
  taxAmount: 15,
  marketBuyMaterial: 15,
  marketBuyEnergy: 20,
  marketSell: 5,
  marketMaxTransactions: 3,
  auctionStartPercent: 50,
  auctionIncrement: 5,
  auctionTimerMs: 1e4,
  tradeOfferTtlMs: 3e4,
  tradeOffersPerTurn: 3,
  mortgagePercent: 50,
  mortgageRedeemPercent: 55,
  buildingResalePercent: 50,
  recoveryAdvance: 20,
  emergencyReserveAdvance: 15,
  // score
  scorePerResource: 10,
  scorePropertyPercent: 70,
  scoreBuildingPercent: 50,
  scorePerDistrict: 25,
  objectivePoints: { easy: 15, medium: 25, hard: 35 },
  // district bonuses (provisional)
  bonusResidentialBuildDiscount: 5,
  bonusCommercialRent: 5,
  bonusIndustrialMaterials: 1,
  bonusTouristicStart: 10,
  bonusBusinessAuctionDiscount: 5,
  bonusDowntownMinorShields: 1
};
var MOVEMENT_DIE = [1, 1, 2, 2, 3, 3];
var RESOURCE_DIE = ["credits", "credits", "materials", "materials", "energy", "choice"];
var RESOURCE_FACE_CREDITS = 10;
var CHOICE_CREDITS = 5;
var BUILDING_COSTS = {
  1: { credits: 20, materials: 1, energy: 0 },
  2: { credits: 35, materials: 2, energy: 0 },
  3: { credits: 50, materials: 2, energy: 1 }
};
var RENT_MULT_HALVES = [2, 3, 4, 6];

// ../../packages/engine/src/rng.ts
function cryptoRng() {
  return {
    int(n) {
      if (!Number.isInteger(n) || n <= 0 || n > 2 ** 32) throw new Error(`rng.int(${n})`);
      const limit = Math.floor(2 ** 32 / n) * n;
      const buf = new Uint32Array(1);
      for (; ; ) {
        globalThis.crypto.getRandomValues(buf);
        const v = buf[0];
        if (v < limit) return v % n;
      }
    }
  };
}
function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

// ../../packages/engine/src/engine.ts
var OFFICIAL_CONFIG = {
  movementDie: [...MOVEMENT_DIE],
  startReward: RULES.startReward,
  drawOnStart: false,
  turnIncome: 0,
  seatBonus: [0, 0, 0, 0],
  seatBonusByCount: {},
  resourceScore: 10,
  cardRevision: 1
};
var DEFAULT_CONFIG = {
  movementDie: [1, 2, 2, 3, 3, 4],
  startReward: RULES.startReward,
  drawOnStart: true,
  turnIncome: 10,
  seatBonus: [0, 20, 40, 60],
  // réglage fin validé le 19/11/2026 (docs/simulations/sieges_10000.md)
  seatBonusByCount: { 3: [0, 40, 60], 4: [0, 30, 50, 70] },
  // validé le 19/11/2026 (docs/simulations/ressources_3000.md)
  resourceScore: 5,
  // révision 2 des cartes (docs/simulations/revision_cartes_3000.md)
  cardRevision: 2
};
var RuleError = class extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
  code;
};
var fail = (code, msg) => {
  throw new RuleError(code, msg);
};
function emit(g, type, data = {}, playerId, privateTo) {
  g.s.eventSeq += 1;
  const e = { seq: g.s.eventSeq, type, data };
  if (playerId !== void 0) e.playerId = playerId;
  if (privateTo !== void 0) e.privateTo = privateTo;
  g.ev.push(e);
}
function activePlayerId(s) {
  const id = s.turnOrder[s.activeIndex];
  if (id === void 0) throw new Error("no active player");
  return id;
}
function player(s, id) {
  const p = s.players[id];
  if (!p) return fail("UNKNOWN_PLAYER", `Joueur inconnu : ${id}`);
  return p;
}
function prop(s, index) {
  const p = s.properties[index];
  if (!p) return fail("NOT_A_PROPERTY", `La case ${index} n'est pas une propri\xE9t\xE9`);
  return p;
}
function freshTurn() {
  return {
    cardPlayed: false,
    buildsDone: 0,
    extraBuilds: 0,
    buildDiscount: 0,
    residentialDiscountUsed: false,
    buyDiscount: 0,
    buyDiscountSource: null,
    taxCancel: false,
    taxReduction: 0,
    rentReduction: 0,
    marketAvailable: false,
    marketTransactions: 0,
    tradeOffers: 0,
    tradeCreditReduction: 0,
    specialOffer: false,
    specialOfferUsed: false,
    landed: false
  };
}
function ownedCount(s, playerId, d) {
  return districtProperties(d).filter((i) => s.properties[i]?.ownerId === playerId).length;
}
function influence(s, playerId, d) {
  return s.effects.filter((e) => e.kind === "influence" && e.sourceId === playerId && e.district === d).length;
}
function controls(s, playerId, d) {
  return ownedCount(s, playerId, d) >= RULES.districtMajority;
}
function controlsWithInfluence(s, playerId, d) {
  return ownedCount(s, playerId, d) + influence(s, playerId, d) >= RULES.districtMajority;
}
function districtController(s, d) {
  for (const id of s.turnOrder) if (controls(s, id, d)) return id;
  return null;
}
function bonusHolder(s, d) {
  const real = districtController(s, d);
  if (real) return real;
  if (s.phase === "FINISHED") return null;
  const a = activePlayerId(s);
  return controlsWithInfluence(s, a, d) ? a : null;
}
function reformFactor(s, d) {
  return s.effects.some((e) => e.kind === "reform" && e.district === d) ? 2 : 1;
}
function hasBonus(s, playerId, d) {
  return bonusHolder(s, d) === playerId;
}
function findEffect(s, pred) {
  return s.effects.find(pred);
}
function removeEffect(s, id) {
  s.effects = s.effects.filter((e) => e.id !== id);
}
function addEffect(g, e) {
  const full = { ...e, id: g.s.nextEffectId++ };
  g.s.effects.push(full);
  emit(g, "EFFECT_ADDED", { effect: full });
  return full;
}
function replaceEffect(g, kind, match, e) {
  for (const old of g.s.effects.filter((x) => x.kind === kind && match(x))) {
    removeEffect(g.s, old.id);
    emit(g, "EFFECT_REPLACED", { effectId: old.id, kind });
  }
  addEffect(g, e);
}
function expire(g, test) {
  const gone = g.s.effects.filter((e) => test(e.expiry));
  if (!gone.length) return;
  g.s.effects = g.s.effects.filter((e) => !test(e.expiry));
  for (const e of gone) emit(g, "EFFECT_EXPIRED", { effectId: e.id, kind: e.kind });
}
function cap(kind) {
  return kind === "materials" ? RULES.maxMaterials : RULES.maxEnergy;
}
function gainResource(g, p, kind, n, reason) {
  for (let i = 0; i < n; i++) {
    if (p[kind] < cap(kind)) {
      p[kind] += 1;
      emit(g, "RESOURCE_GAINED", { kind, amount: 1, reason }, p.id);
    } else {
      p.credits += RULES.capConversionCredits;
      emit(g, "CAP_CONVERTED", { kind, credits: RULES.capConversionCredits, reason }, p.id);
    }
  }
}
function gainCredits(g, p, amount, reason) {
  if (amount <= 0) return;
  p.credits += amount;
  emit(g, "CREDITS_GAINED", { amount, reason }, p.id);
}
function mortgageValue(index) {
  return Math.floor(priceOf(index) * RULES.mortgagePercent / 100);
}
function redeemValue(index) {
  return Math.ceil(priceOf(index) * RULES.mortgageRedeemPercent / 100);
}
function buildingResale(pr) {
  const paid = pr.levelPaid[pr.level - 1] ?? 0;
  return Math.floor(paid * RULES.buildingResalePercent / 100);
}
function inRecovery(p) {
  return p.recoveryResolveTurn !== null;
}
function sellBuildingRaw(g, p, pr, reason) {
  const refund = buildingResale(pr);
  const paid = pr.levelPaid.pop() ?? 0;
  pr.level = pr.level - 1;
  pr.buildingCredits -= paid;
  p.credits += refund;
  emit(g, "BUILDING_SOLD", { propertyIndex: pr.index, newLevel: pr.level, refund, reason }, p.id);
}
function mortgageRaw(g, p, pr, reason) {
  pr.mortgaged = true;
  const v = mortgageValue(pr.index);
  p.credits += v;
  emit(g, "PROPERTY_MORTGAGED", { propertyIndex: pr.index, amount: v, reason }, p.id);
}
function liquidate(g, p, needed) {
  for (const kind of ["materials", "energy"]) {
    while (p.credits < needed && p[kind] > 0) {
      p[kind] -= 1;
      p.credits += RULES.marketSell;
      emit(g, "RESOURCE_SOLD", { kind, amount: RULES.marketSell, reason: "liquidation" }, p.id);
    }
  }
  while (p.credits < needed) {
    const built = PROPERTY_INDICES.map((i) => prop(g.s, i)).filter((x) => x.ownerId === p.id && x.level > 0).sort((a, b) => b.level - a.level || priceOf(a.index) - priceOf(b.index));
    const target = built[0];
    if (!target) break;
    sellBuildingRaw(g, p, target, "liquidation");
  }
  while (p.credits < needed) {
    const free = PROPERTY_INDICES.map((i) => prop(g.s, i)).filter((x) => x.ownerId === p.id && x.level === 0 && !x.mortgaged).sort((a, b) => priceOf(a.index) - priceOf(b.index));
    const target = free[0];
    if (!target) break;
    mortgageRaw(g, p, target, "liquidation");
  }
}
function enterRecovery(g, p) {
  if (inRecovery(p)) return;
  p.recoveryResolveTurn = p.turnsStarted + 1;
  p.credits += RULES.recoveryAdvance;
  p.debt += RULES.recoveryAdvance;
  p.stats.bankruptcies += 1;
  emit(g, "RECOVERY_STARTED", { advance: RULES.recoveryAdvance, resolveTurn: p.recoveryResolveTurn }, p.id);
}
function charge(g, p, amount, payeeId, reason, mode, debtIfShort = true) {
  if (amount <= 0) return 0;
  if (p.credits < amount && mode === "landing") {
    liquidate(g, p, amount);
    if (p.credits < amount) {
      const reserve = findEffect(g.s, (e) => e.kind === "emergencyReserve" && e.targetPlayerId === p.id);
      if (reserve) {
        removeEffect(g.s, reserve.id);
        p.credits += RULES.emergencyReserveAdvance;
        p.debt += RULES.emergencyReserveAdvance;
        emit(g, "EMERGENCY_RESERVE_USED", { advance: RULES.emergencyReserveAdvance }, p.id);
      }
    }
    if (p.credits < amount) enterRecovery(g, p);
  }
  if (mode === "voluntary" && p.credits < amount) fail("INSUFFICIENT_FUNDS", "Cr\xE9dits insuffisants");
  const paid = Math.min(p.credits, amount);
  p.credits -= paid;
  const missing = amount - paid;
  if (missing > 0 && debtIfShort) {
    p.debt += missing;
    emit(g, "DEBT_ADDED", { amount: missing, reason }, p.id);
  }
  if (payeeId) player(g.s, payeeId).credits += paid;
  emit(g, "PAYMENT", { from: p.id, to: payeeId, amount: paid, due: amount, reason }, p.id);
  return paid;
}
function autoSettleDebt(g, p) {
  if (p.debt <= 0 || p.credits <= 0) return;
  const x = Math.min(p.debt, p.credits);
  p.debt -= x;
  p.credits -= x;
  emit(g, "DEBT_SETTLED", { amount: x, remaining: p.debt }, p.id);
}
function baseRent(price) {
  return 5 * Math.ceil(12 * price / 500);
}
function isInsured(s, index) {
  const owner = s.properties[index]?.ownerId;
  return s.effects.some((e) => e.kind === "insurance" && (e.propertyIndex === index || e.propertyIndex === void 0 && owner != null && e.targetPlayerId === owner));
}
function computeRent(s, index) {
  const pr = prop(s, index);
  const price = priceOf(index);
  const d = districtOf(index);
  const base = baseRent(price);
  const owner = pr.ownerId;
  const districtBonus = owner !== null && controls(s, owner, d);
  const insured = isInsured(s, index);
  const crisis = !insured && s.effects.some((e) => e.kind === "districtCrisis" && e.district === d);
  const sabotage = s.effects.some((e) => e.kind === "sabotage" && e.propertyIndex === index);
  const crisisZero = crisis && s.config.cardRevision === 2;
  const num = base * RENT_MULT_HALVES[pr.level] * (districtBonus ? 11 : 10) * (crisis && !crisisZero ? 3 : 4) * (sabotage ? 1 : 2);
  const den = 2 * 10 * 4 * 2;
  let total = 5 * Math.ceil(num / (den * 5));
  if (crisisZero) total = 0;
  const receivedMinus = owner !== null && s.effects.some((e) => e.kind === "rentReceivedMinus" && e.targetPlayerId === owner) ? 10 : 0;
  total = Math.max(0, total - receivedMinus);
  const rentBonus = s.effects.some((e) => e.kind === "rentBonus" && e.propertyIndex === index) ? 15 : 0;
  total += rentBonus;
  return { base, level: pr.level, districtBonus, crisis, sabotage, receivedMinus, rentBonus, total };
}
function payRent(g, payer, index) {
  const pr = prop(g.s, index);
  const ownerId = pr.ownerId;
  if (!ownerId || ownerId === payer.id || pr.mortgaged) return;
  const r = computeRent(g.s, index);
  const consume = (pred) => {
    const e = findEffect(g.s, pred);
    if (e) {
      removeEffect(g.s, e.id);
      emit(g, "EFFECT_CONSUMED", { effectId: e.id, kind: e.kind });
    }
  };
  if (r.sabotage) consume((e) => e.kind === "sabotage" && e.propertyIndex === index);
  if (r.receivedMinus) consume((e) => e.kind === "rentReceivedMinus" && e.targetPlayerId === ownerId);
  if (r.rentBonus) consume((e) => e.kind === "rentBonus" && e.propertyIndex === index);
  if (g.s.effects.some((e) => e.kind === "districtCrisis" && e.district === districtOf(index))) {
    if (g.s.config.cardRevision !== 2) consume((e) => e.kind === "insurance" && e.propertyIndex === index);
  }
  const owner = player(g.s, ownerId);
  const due = Math.max(0, r.total - (payer.id === activePlayerId(g.s) ? g.s.turn.rentReduction : 0));
  if (due !== r.total) emit(g, "RENT_REDUCED", { amount: r.total - due, reason: "vote_municipal" }, payer.id);
  const paid = charge(g, payer, due, ownerId, "rent", "landing");
  payer.stats.rentPaid += paid;
  owner.stats.rentReceived += paid;
  emit(g, "RENT_PAID", { propertyIndex: index, ownerId, amount: paid, breakdown: r }, payer.id);
  const d = districtOf(index);
  if (d === "commercial" && paid > 0) {
    const holder = districtController(g.s, d);
    if (holder && holder !== payer.id) {
      gainCredits(g, player(g.s, holder), RULES.bonusCommercialRent * reformFactor(g.s, d), "bonus_commercial");
    }
  }
}
function createGame(players, ctx, configOverride = {}) {
  const config = { ...DEFAULT_CONFIG, ...configOverride };
  if (!config.movementDie.length || config.movementDie.some((m) => !Number.isInteger(m) || m < 1 || m > 6)) {
    throw new RuleError("INVALID_CONFIG", "D\xE9 de mouvement invalide");
  }
  if (players.length < RULES.playersMin || players.length > RULES.playersMax) {
    throw new RuleError("PLAYER_COUNT", `Il faut entre ${RULES.playersMin} et ${RULES.playersMax} joueurs`);
  }
  const ids = new Set(players.map((p) => p.id));
  if (ids.size !== players.length) throw new RuleError("DUPLICATE_PLAYER", "Identifiants de joueurs en double");
  const order = shuffle(players.map((p) => p.id), ctx.rng);
  const objectiveIds = shuffle(OBJECTIVES.map((o) => o.id), ctx.rng);
  const instanceIds = shuffle(CARDS.map((_, i) => 1e3 + i * 7 + ctx.rng.int(7)), ctx.rng);
  const cardInstances = {};
  CARDS.forEach((c2, i) => {
    cardInstances[instanceIds[i]] = c2.id;
  });
  const deck = shuffle(Object.keys(cardInstances).map(Number), ctx.rng);
  const seatBonus = config.seatBonusByCount?.[order.length] ?? config.seatBonus;
  const ps = {};
  order.forEach((id, seat) => {
    const np = players.find((p) => p.id === id);
    ps[id] = {
      id,
      name: np.name,
      seat,
      position: config.spreadStart ? Math.floor(seat * RULES.boardSize / order.length) : 0,
      credits: RULES.startingCredits + (seatBonus[seat] ?? 0),
      materials: RULES.startingMaterials,
      energy: RULES.startingEnergy,
      debt: 0,
      hand: [],
      objectiveId: objectiveIds[seat],
      turnsStarted: 0,
      recoveryResolveTurn: null,
      stats: { trades: 0, auctionsWon: 0, cardsPlayed: 0, cardsDrawn: 0, rentPaid: 0, rentReceived: 0, bankruptcies: 0 }
    };
  });
  const properties = {};
  for (const i of PROPERTY_INDICES) properties[i] = { index: i, ownerId: null, level: 0, mortgaged: false, buildingCredits: 0, levelPaid: [], lastRealtyAttackRound: 0 };
  const s = {
    rulesVersion: RULES_VERSION,
    config,
    version: 0,
    eventSeq: 0,
    round: 1,
    turnOrder: order,
    activeIndex: 0,
    phase: "PRE_ROLL",
    players: ps,
    properties,
    cardInstances,
    deck,
    discard: [],
    pendingDraw: [],
    pendingResource: null,
    lastRoll: null,
    effects: [],
    nextEffectId: 1,
    turn: freshTurn(),
    auction: null,
    forcedSaleQueue: null,
    trade: null,
    nextTradeId: 1,
    downtownShieldsUsed: {},
    scores: null
  };
  const g = { s, ctx, ev: [] };
  emit(g, "GAME_CREATED", { order, rulesVersion: RULES_VERSION });
  for (const id of order) emit(g, "OBJECTIVE_DEALT", { objectiveId: ps[id].objectiveId }, id, id);
  beginTurn(g);
  return { state: s, events: g.ev };
}
function beginTurn(g) {
  const s = g.s;
  const p = player(s, activePlayerId(s));
  p.turnsStarted += 1;
  const income = s.config.turnIncome;
  s.turn = freshTurn();
  s.phase = "PRE_ROLL";
  s.lastRoll = null;
  expire(g, (x) => x.kind === "turnStart" && x.playerId === p.id && x.turn <= p.turnsStarted);
  emit(g, "TURN_STARTED", { round: s.round, turn: p.turnsStarted, recovery: inRecovery(p) }, p.id);
  if (income > 0) gainCredits(g, p, income, "turn_income");
  if (districtController(s, "industrial") === p.id) {
    gainResource(g, p, "materials", RULES.bonusIndustrialMaterials * reformFactor(s, "industrial"), "bonus_industrial");
  }
}
function endTurn(g) {
  const s = g.s;
  const p = player(s, activePlayerId(s));
  autoSettleDebt(g, p);
  if (p.recoveryResolveTurn !== null && p.turnsStarted >= p.recoveryResolveTurn) {
    if (p.debt > 0) {
      const indices = PROPERTY_INDICES.filter((i) => prop(s, i).ownerId === p.id).sort((a, b) => priceOf(a) - priceOf(b));
      if (indices.length > 0) {
        s.forcedSaleQueue = { playerId: p.id, indices };
        emit(g, "FORCED_SALE_STARTED", { indices, debt: p.debt }, p.id);
        continueForcedSale(g);
        return;
      }
    }
    finishRecovery(g, p);
  }
  advanceTurn(g);
}
function finishRecovery(g, p) {
  p.recoveryResolveTurn = null;
  emit(g, "RECOVERY_ENDED", { remainingDebt: p.debt }, p.id);
}
function continueForcedSale(g) {
  const s = g.s;
  const q = s.forcedSaleQueue;
  if (!q) return;
  const p = player(s, q.playerId);
  autoSettleDebt(g, p);
  const next = q.indices.find((i) => prop(s, i).ownerId === p.id);
  if (p.debt <= 0 || next === void 0) {
    s.forcedSaleQueue = null;
    finishRecovery(g, p);
    advanceTurn(g);
    return;
  }
  q.indices = q.indices.filter((i) => i !== next);
  const pr = prop(s, next);
  let start;
  if (pr.mortgaged) {
    start = floor5(Math.max(redeemValue(next), Math.floor((priceOf(next) + pr.buildingCredits) / 2)));
  } else {
    start = floor5(Math.floor((priceOf(next) + pr.buildingCredits) / 2));
  }
  startAuction(g, next, "forced", start, p.id, "MANAGE", [p.id]);
}
function advanceTurn(g) {
  const s = g.s;
  const p = player(s, activePlayerId(s));
  expire(g, (x) => x.kind === "turnEnd" && x.playerId === p.id && x.turn <= p.turnsStarted);
  emit(g, "TURN_ENDED", { round: s.round }, p.id);
  s.activeIndex += 1;
  if (s.activeIndex >= s.turnOrder.length) {
    s.activeIndex = 0;
    expire(g, (x) => x.kind === "roundEnd" && x.round <= s.round);
    emit(g, "ROUND_ENDED", { round: s.round });
    if (s.round >= RULES.rounds) {
      finishGame(g);
      return;
    }
    s.round += 1;
  }
  beginTurn(g);
}
function floor5(n) {
  return Math.max(0, 5 * Math.floor(n / 5));
}
function rollDice(g, p) {
  const die = g.s.config.movementDie;
  const movement = die[g.ctx.rng.int(die.length)];
  const face = RESOURCE_DIE[g.ctx.rng.int(RESOURCE_DIE.length)];
  g.s.lastRoll = { movement, resource: face };
  emit(g, "DICE_ROLLED", { movement, resource: face }, p.id);
  if (face === "credits") {
    gainCredits(g, p, RESOURCE_FACE_CREDITS, "resource_die");
  } else if (face === "materials" || face === "energy") {
    if (p[face] >= cap(face)) {
      g.s.pendingResource = { reason: "cap", blocked: face };
      g.s.phase = "RESOURCE_CHOICE";
      return;
    }
    gainResource(g, p, face, 1, "resource_die");
  } else {
    g.s.pendingResource = { reason: "choice", blocked: null };
    g.s.phase = "RESOURCE_CHOICE";
    return;
  }
  moveAndLand(g, p);
}
function resourceChoices(s, p) {
  const pr = s.pendingResource;
  const out = ["credits"];
  for (const k of ["materials", "energy"]) if (p[k] < cap(k) && pr?.blocked !== k) out.push(k);
  return out;
}
function moveAndLand(g, p) {
  const s = g.s;
  const steps = s.lastRoll.movement;
  const from = p.position;
  const path = [];
  for (let i = 1; i <= steps; i++) path.push((from + i) % RULES.boardSize);
  const passedStart = from + steps >= RULES.boardSize;
  p.position = (from + steps) % RULES.boardSize;
  emit(g, "PLAYER_MOVED", { from, to: p.position, path, passedStart }, p.id);
  if (passedStart) {
    let reward = s.config.startReward;
    if (hasBonus(s, p.id, "touristic")) reward += RULES.bonusTouristicStart * reformFactor(s, "touristic");
    gainCredits(g, p, reward, "start");
    emit(g, "START_PASSED", { reward }, p.id);
    const gi = findEffect(s, (e) => e.kind === "guaranteedIncome" && e.targetPlayerId === p.id);
    if (gi) {
      removeEffect(s, gi.id);
      gainCredits(g, p, 20, "guaranteed_income");
    }
    if (s.config.drawOnStart) drawToHand(g, p);
  }
  resolveLanding(g, p);
}
function resolveLanding(g, p) {
  const s = g.s;
  const sp = space(p.position);
  s.turn.landed = true;
  emit(g, "LANDED", { index: sp.index, type: sp.type }, p.id);
  switch (sp.type) {
    case "property": {
      const pr = prop(s, sp.index);
      if (pr.ownerId === null) {
        s.phase = "BUY_DECISION";
        return;
      }
      payRent(g, p, sp.index);
      s.phase = "MANAGE";
      return;
    }
    case "chance":
      drawChance(g, p);
      return;
    case "market":
      s.turn.marketAvailable = true;
      s.phase = "MANAGE";
      return;
    case "tax":
      s.phase = "TAX_DUE";
      return;
    case "event":
      emit(g, "EVENT_SPACE_NEUTRAL", {}, p.id);
      s.phase = "MANAGE";
      return;
    case "start":
    default:
      s.phase = "MANAGE";
  }
}
function drawToHand(g, p) {
  const s = g.s;
  if (p.hand.length >= RULES.maxHand) return;
  if (s.deck.length === 0 && s.discard.length > 0) {
    s.deck.push(...shuffle(s.discard.splice(0), g.ctx.rng));
    emit(g, "DECK_RESHUFFLED", { size: s.deck.length });
  }
  const inst = s.deck.shift();
  if (inst === void 0) return;
  p.hand.push(inst);
  p.stats.cardsDrawn += 1;
  emit(g, "START_CARD_DRAWN", { handSize: p.hand.length }, p.id);
  emit(g, "CARD_KEPT_PRIVATE", { instanceId: inst, cardId: s.cardInstances[inst] }, p.id, p.id);
}
function drawChance(g, p) {
  const s = g.s;
  if (s.deck.length < RULES.chanceDraw && s.discard.length > 0) {
    s.deck.push(...shuffle(s.discard.splice(0), g.ctx.rng));
    emit(g, "DECK_RESHUFFLED", { size: s.deck.length });
  }
  const drawn = s.deck.splice(0, RULES.chanceDraw);
  if (drawn.length === 0) {
    emit(g, "DECK_EMPTY", {}, p.id);
    s.phase = "MANAGE";
    return;
  }
  s.pendingDraw = drawn;
  p.stats.cardsDrawn += 1;
  emit(g, "CHANCE_DRAWN", { count: drawn.length }, p.id);
  emit(g, "CHANCE_DRAWN_PRIVATE", { instances: drawn.map((i) => ({ instanceId: i, cardId: s.cardInstances[i] })) }, p.id, p.id);
  s.phase = "CHANCE_CHOICE";
}
function startAuction(g, index, reason, startPrice, beneficiaryId, resume, excluded = []) {
  const s = g.s;
  const bidders = s.turnOrder.filter((id) => {
    const p = player(s, id);
    return !excluded.includes(id) && !inRecovery(p) && p.credits >= startPrice;
  });
  s.auction = {
    propertyIndex: index,
    reason,
    startPrice,
    currentBid: null,
    highestBidderId: null,
    activeBidders: bidders,
    deadline: g.ctx.now + RULES.auctionTimerMs,
    beneficiaryId,
    resume
  };
  s.phase = "AUCTION";
  emit(g, "AUCTION_STARTED", { propertyIndex: index, reason, startPrice, bidders, deadline: s.auction.deadline });
  checkAuctionEnd(g);
}
function minBid(s) {
  const a = s.auction;
  if (!a) return 0;
  return a.currentBid === null ? a.startPrice : a.currentBid + RULES.auctionIncrement;
}
function checkAuctionEnd(g, timedOut = false) {
  const a = g.s.auction;
  if (!a) return;
  const others = a.activeBidders.filter((id) => id !== a.highestBidderId);
  if (timedOut || others.length === 0) closeAuction(g);
}
function closeAuction(g) {
  const s = g.s;
  const a = s.auction;
  const pr = prop(s, a.propertyIndex);
  s.auction = null;
  if (a.highestBidderId && a.currentBid !== null) {
    const w = player(s, a.highestBidderId);
    let price = a.currentBid;
    if (hasBonus(s, w.id, "business")) price = Math.max(0, price - RULES.bonusBusinessAuctionDiscount * reformFactor(s, "business"));
    if (a.reason === "forced" && pr.mortgaged) {
      const redeem = redeemValue(pr.index);
      charge(g, w, price, null, "auction", "voluntary");
      const toSeller = Math.max(0, price - redeem);
      if (a.beneficiaryId) player(s, a.beneficiaryId).credits += toSeller;
      emit(g, "MORTGAGE_CLEARED_BY_SALE", { propertyIndex: pr.index, redeem, toSeller });
    } else {
      charge(g, w, price, a.beneficiaryId, "auction", "voluntary");
    }
    pr.ownerId = w.id;
    pr.mortgaged = false;
    if (a.reason === "declined") {
      pr.level = 0;
      pr.buildingCredits = 0;
      pr.levelPaid = [];
    }
    w.stats.auctionsWon += 1;
    emit(g, "AUCTION_WON", { propertyIndex: pr.index, winnerId: w.id, bid: a.currentBid, paid: price, reason: a.reason }, w.id);
  } else {
    if (a.reason === "forced") {
      const seller = player(s, a.beneficiaryId);
      const value = pr.mortgaged ? 0 : mortgageValue(pr.index) + Math.floor(pr.buildingCredits / 2);
      seller.credits += value;
      emit(g, "BANK_BUYOUT", { propertyIndex: pr.index, amount: value }, seller.id);
    }
    pr.ownerId = null;
    pr.mortgaged = false;
    pr.level = 0;
    pr.buildingCredits = 0;
    pr.levelPaid = [];
    emit(g, "AUCTION_NO_SALE", { propertyIndex: pr.index, reason: a.reason });
  }
  if (a.reason === "forced") {
    continueForcedSale(g);
    return;
  }
  s.phase = a.resume;
}
function buildCost(s, playerId, index) {
  const pr = prop(s, index);
  const next = pr.level + 1;
  const base = BUILDING_COSTS[next];
  let credits = base.credits - s.turn.buildDiscount;
  if (!s.turn.residentialDiscountUsed && hasBonus(s, playerId, "residential")) {
    credits -= RULES.bonusResidentialBuildDiscount * reformFactor(s, "residential");
  }
  return { credits: Math.max(0, credits), materials: base.materials, energy: base.energy };
}
function canBuild(s, playerId, index) {
  const p = s.players[playerId];
  const pr = s.properties[index];
  if (!p || !pr) return "NOT_A_PROPERTY";
  if (pr.ownerId !== playerId) return "NOT_OWNER";
  if (pr.mortgaged) return "MORTGAGED";
  if (pr.level >= 3) return "MAX_LEVEL";
  if (inRecovery(p)) return "IN_RECOVERY";
  if (!controlsWithInfluence(s, playerId, districtOf(index))) return "NO_MAJORITY";
  if (s.effects.some((e) => e.kind === "noUpgrade" && e.propertyIndex === index)) return "STRIKE";
  if (s.turn.buildsDone >= 1 + s.turn.extraBuilds) return "BUILD_LIMIT";
  const c2 = buildCost(s, playerId, index);
  if (p.credits < c2.credits || p.materials < c2.materials || p.energy < c2.energy) return "INSUFFICIENT_RESOURCES";
  return null;
}
var PHASES_FOR_CARDS = ["PRE_ROLL", "BUY_DECISION", "TAX_DUE", "MANAGE"];
function canPlayCard(s, cmd) {
  const p = s.players[cmd.playerId];
  if (!p) return "UNKNOWN_PLAYER";
  if (s.turnOrder[s.activeIndex] !== p.id) return "NOT_YOUR_TURN";
  if (!PHASES_FOR_CARDS.includes(s.phase)) return "WRONG_PHASE";
  if (s.turn.cardPlayed) return "CARD_ALREADY_PLAYED";
  if (!p.hand.includes(cmd.instanceId)) return "CARD_NOT_IN_HAND";
  const cardId = s.cardInstances[cmd.instanceId];
  if (cardId === void 0) return "UNKNOWN_CARD";
  const def = card(cardId);
  const cost = cardCost(def, s.config.cardRevision ?? 1);
  if (p.materials < cost.materials || p.energy < cost.energy) return "INSUFFICIENT_RESOURCES";
  if (def.attack && inRecovery(p)) return "IN_RECOVERY";
  if (def.attack === "realty" && s.phase !== "PRE_ROLL" && s.phase !== "MANAGE") return "WRONG_PHASE";
  const isOpp = (id) => id !== void 0 && id !== p.id && s.players[id] !== void 0;
  switch (cardTarget(def, s.config.cardRevision ?? 1)) {
    case "opponent":
      if (!isOpp(cmd.targetPlayerId)) return "INVALID_TARGET";
      break;
    case "ownProperty": {
      const pr = cmd.propertyIndex === void 0 ? void 0 : s.properties[cmd.propertyIndex];
      if (!pr || pr.ownerId !== p.id) return "INVALID_TARGET";
      break;
    }
    case "opponentProperty": {
      const pr = cmd.propertyIndex === void 0 ? void 0 : s.properties[cmd.propertyIndex];
      if (!pr || pr.ownerId === null || pr.ownerId === p.id) return "INVALID_TARGET";
      if (def.attack === "realty") {
        if (pr.mortgaged) return "TARGET_MORTGAGED";
        if (pr.lastRealtyAttackRound === s.round) return "ALREADY_ATTACKED_THIS_ROUND";
      }
      break;
    }
    case "district":
      if (!cmd.district || !DISTRICTS.some((d) => d.id === cmd.district)) return "INVALID_TARGET";
      break;
    case "resource":
      if (cmd.resource !== "materials" && cmd.resource !== "energy") return "INVALID_TARGET";
      break;
    case "swap": {
      const mine = cmd.propertyIndex === void 0 ? void 0 : s.properties[cmd.propertyIndex];
      const theirs = cmd.otherPropertyIndex === void 0 ? void 0 : s.properties[cmd.otherPropertyIndex];
      if (!mine || !theirs || mine.ownerId !== p.id || theirs.ownerId === null || theirs.ownerId === p.id) return "INVALID_TARGET";
      if (mine.level > 0 || theirs.level > 0 || mine.mortgaged || theirs.mortgaged) return "INVALID_TARGET";
      if (Math.abs(priceOf(mine.index) - priceOf(theirs.index)) > 10) return "VALUE_MISMATCH";
      break;
    }
    case "none":
      break;
  }
  const afterCost = { materials: p.materials - cost.materials, energy: p.energy - cost.energy };
  switch (def.key) {
    case "revenus_garantis":
      if (s.effects.some((e) => e.kind === "guaranteedIncome" && e.targetPlayerId === p.id)) return "ALREADY_ACTIVE";
      break;
    case "crise_locale":
      if (s.effects.some((e) => e.kind === "districtCrisis" && e.district === cmd.district)) return "NOT_CUMULATIVE";
      break;
    case "courtier":
      if ((cmd.resource === "materials" ? afterCost.materials : afterCost.energy) < 1) return "NO_RESOURCE";
      break;
    case "reduction_fiscale":
    case "vote_municipal":
      if (s.phase !== "TAX_DUE" && s.phase !== "PRE_ROLL") return "WRONG_PHASE";
      break;
    case "nouvelle_opportunite":
    case "contrat_privilegie":
      if (s.phase !== "BUY_DECISION" && s.phase !== "PRE_ROLL") return "WRONG_PHASE";
      break;
  }
  return null;
}
function attackBlocked(g, attacker, def, targetId, propertyIndex) {
  const s = g.s;
  const ignoreAll = def.key === "opa_hostile";
  const block = (by, effectId) => {
    if (effectId !== void 0) removeEffect(s, effectId);
    emit(g, "ATTACK_BLOCKED", { cardId: def.id, by, targetId, propertyIndex }, attacker.id);
    return true;
  };
  if (ignoreAll) return false;
  if (propertyIndex !== void 0) {
    if (def.attack === "realty") {
      if (s.effects.some((e) => e.kind === "legalProtection" && e.propertyIndex === propertyIndex)) return block("legalProtection");
      const ri = findEffect(s, (e) => e.kind === "realtyInsurance" && e.propertyIndex === propertyIndex);
      if (ri) return block("realtyInsurance", ri.id);
    }
    if (def.key === "sabotage" || def.key === "greve" && s.config.cardRevision === 2) {
      const ins = findEffect(s, (e) => e.kind === "insurance" && (e.propertyIndex === propertyIndex || s.config.cardRevision === 2 && e.propertyIndex === void 0 && e.targetPlayerId === targetId));
      if (ins) return block("insurance", s.config.cardRevision === 2 ? void 0 : ins.id);
    }
  }
  const co = findEffect(s, (e) => e.kind === "counterOffensive" && e.targetPlayerId === targetId);
  if (co) {
    block("counterOffensive", co.id);
    if (attacker.energy > 0) {
      attacker.energy -= 1;
      emit(g, "COUNTER_OFFENSIVE_PENALTY", { energy: 1 }, attacker.id);
    }
    return true;
  }
  if (def.attack === "minor" && districtController(s, "downtown") === targetId) {
    const key = String(s.round);
    const used = s.downtownShieldsUsed[key] ?? 0;
    if (used < RULES.bonusDowntownMinorShields * reformFactor(s, "downtown")) {
      s.downtownShieldsUsed[key] = used + 1;
      return block("bonus_downtown");
    }
  }
  return false;
}
function cardLoss(g, target, amount, payeeId, reason, debtIfShort, capAtCredits) {
  let x = amount;
  const sh = findEffect(g.s, (e) => e.kind === "financialShield" && e.targetPlayerId === target.id);
  if (sh && x > 0) {
    removeEffect(g.s, sh.id);
    const reduced = Math.min(15, x);
    x -= reduced;
    emit(g, "SHIELD_ABSORBED", { amount: reduced }, target.id);
  }
  if (capAtCredits) x = Math.min(x, target.credits);
  charge(g, target, x, payeeId, reason, "card", debtIfShort);
}
function playCard(g, cmd) {
  const s = g.s;
  const err = canPlayCard(s, cmd);
  if (err) fail(err, `Carte non jouable : ${err}`);
  const p = player(s, cmd.playerId);
  const def = card(s.cardInstances[cmd.instanceId]);
  const cost = cardCost(def, s.config.cardRevision ?? 1);
  p.materials -= cost.materials;
  p.energy -= cost.energy;
  p.hand = p.hand.filter((i) => i !== cmd.instanceId);
  s.discard.push(cmd.instanceId);
  s.turn.cardPlayed = true;
  p.stats.cardsPlayed += 1;
  emit(g, "CARD_PLAYED", {
    cardId: def.id,
    instanceId: cmd.instanceId,
    targetPlayerId: cmd.targetPlayerId,
    propertyIndex: cmd.propertyIndex,
    otherPropertyIndex: cmd.otherPropertyIndex,
    district: cmd.district,
    resource: cmd.resource
  }, p.id);
  const nextOwnTurn = p.turnsStarted + 1;
  const targetOwnerId = cmd.propertyIndex !== void 0 ? s.properties[cmd.propertyIndex]?.ownerId ?? void 0 : void 0;
  const attackTarget = def.target === "opponentProperty" ? targetOwnerId : cmd.targetPlayerId;
  if (def.attack && attackTarget) {
    if (def.attack === "realty") prop(s, cmd.propertyIndex).lastRealtyAttackRound = s.round;
    if (attackBlocked(g, p, def, attackTarget, def.target === "opponentProperty" ? cmd.propertyIndex : void 0)) return;
  }
  switch (def.key) {
    case "placement_malin":
      s.turn.buildDiscount = 10;
      break;
    case "coup_de_pouce":
      gainCredits(g, p, 20, def.key);
      break;
    case "rendement_bonus":
      replaceEffect(g, "rentBonus", (e) => e.propertyIndex === cmd.propertyIndex, { kind: "rentBonus", sourceId: p.id, propertyIndex: cmd.propertyIndex, expiry: { kind: "roundEnd", round: s.round + 1 } });
      break;
    case "chantier_express":
    case "permis_exceptionnel":
      s.turn.extraBuilds += 1;
      break;
    case "bon_investissement":
      gainResource(g, p, "materials", s.config.cardRevision === 2 ? 2 : 1, def.key);
      break;
    case "revenus_garantis":
      addEffect(g, { kind: "guaranteedIncome", sourceId: p.id, targetPlayerId: p.id, expiry: { kind: "never" } });
      break;
    case "reduction_fiscale":
      s.turn.taxCancel = true;
      break;
    case "vote_municipal":
      s.turn.taxReduction = s.config.cardRevision === 2 ? 20 : 10;
      if (s.config.cardRevision === 2) s.turn.rentReduction = 20;
      break;
    case "nouvelle_opportunite":
      s.turn.buyDiscount = 20;
      s.turn.buyDiscountSource = def.id;
      break;
    case "contrat_privilegie":
      s.turn.buyDiscount = 15;
      s.turn.buyDiscountSource = def.id;
      break;
    case "sabotage":
      replaceEffect(g, "sabotage", (e) => e.propertyIndex === cmd.propertyIndex, { kind: "sabotage", sourceId: p.id, propertyIndex: cmd.propertyIndex, expiry: { kind: "roundEnd", round: s.round + 1 } });
      break;
    case "pression_fiscale":
      cardLoss(g, player(s, attackTarget), 15, null, def.key, true, false);
      break;
    case "greve": {
      const owner = player(s, targetOwnerId);
      replaceEffect(g, "noUpgrade", (e) => e.propertyIndex === cmd.propertyIndex, { kind: "noUpgrade", sourceId: p.id, propertyIndex: cmd.propertyIndex, targetPlayerId: owner.id, expiry: { kind: "turnEnd", playerId: owner.id, turn: owner.turnsStarted + 1 } });
      break;
    }
    case "inspection":
    case "fraude_commerciale": {
      const t = player(s, attackTarget);
      const kind = def.key === "inspection" ? "materials" : "energy";
      if (s.config.cardRevision === 2) {
        if (t[kind] > 0) {
          t[kind] -= 1;
          emit(g, "RESOURCE_LOST", { kind, amount: 1, reason: def.key }, t.id);
          gainResource(g, p, kind, 1, def.key);
        } else cardLoss(g, t, 10, p.id, def.key, false, true);
      } else if (t[kind] > 0) {
        t[kind] -= 1;
        emit(g, "RESOURCE_LOST", { kind, amount: 1, reason: def.key }, t.id);
      } else cardLoss(g, t, 5, null, def.key, false, true);
      break;
    }
    case "blocage_bancaire": {
      const t = player(s, attackTarget);
      replaceEffect(g, "noBuy", (e) => e.targetPlayerId === t.id, { kind: "noBuy", sourceId: p.id, targetPlayerId: t.id, expiry: { kind: "turnEnd", playerId: t.id, turn: t.turnsStarted + 1 } });
      break;
    }
    case "detournement":
      cardLoss(g, player(s, attackTarget), 10, p.id, def.key, false, true);
      break;
    case "concurrence_agressive":
      replaceEffect(g, "rentReceivedMinus", (e) => e.targetPlayerId === attackTarget, { kind: "rentReceivedMinus", sourceId: p.id, targetPlayerId: attackTarget, expiry: { kind: "roundEnd", round: s.round + 1 } });
      break;
    case "prise_de_controle":
    case "opa_hostile": {
      const pr = prop(s, cmd.propertyIndex);
      const former = pr.ownerId;
      pr.ownerId = null;
      emit(g, "PROPERTY_SEIZED", { propertyIndex: pr.index, formerOwnerId: former, level: pr.level }, p.id);
      const start = floor5(Math.floor((priceOf(pr.index) + pr.buildingCredits) / 2));
      startAuction(g, pr.index, "attack", start, former, s.phase);
      break;
    }
    case "crise_locale":
      addEffect(g, { kind: "districtCrisis", sourceId: p.id, district: cmd.district, expiry: { kind: "turnStart", playerId: p.id, turn: nextOwnTurn } });
      break;
    case "assurance":
      if (s.config.cardRevision === 2) {
        replaceEffect(g, "insurance", (e) => e.targetPlayerId === p.id && e.propertyIndex === void 0, { kind: "insurance", sourceId: p.id, targetPlayerId: p.id, expiry: { kind: "turnStart", playerId: p.id, turn: nextOwnTurn } });
        break;
      }
      replaceEffect(g, "insurance", (e) => e.propertyIndex === cmd.propertyIndex, { kind: "insurance", sourceId: p.id, propertyIndex: cmd.propertyIndex, expiry: { kind: "turnStart", playerId: p.id, turn: nextOwnTurn } });
      break;
    case "bouclier_financier":
      replaceEffect(g, "financialShield", (e) => e.targetPlayerId === p.id, { kind: "financialShield", sourceId: p.id, targetPlayerId: p.id, expiry: { kind: "roundEnd", round: s.round + 1 } });
      break;
    case "protection_juridique":
      replaceEffect(g, "legalProtection", (e) => e.propertyIndex === cmd.propertyIndex, { kind: "legalProtection", sourceId: p.id, propertyIndex: cmd.propertyIndex, expiry: { kind: "turnStart", playerId: p.id, turn: nextOwnTurn } });
      break;
    case "contre_offensive":
      replaceEffect(g, "counterOffensive", (e) => e.targetPlayerId === p.id, { kind: "counterOffensive", sourceId: p.id, targetPlayerId: p.id, expiry: { kind: "turnStart", playerId: p.id, turn: nextOwnTurn } });
      break;
    case "reserve_urgence":
      replaceEffect(g, "emergencyReserve", (e) => e.targetPlayerId === p.id, { kind: "emergencyReserve", sourceId: p.id, targetPlayerId: p.id, expiry: { kind: "turnStart", playerId: p.id, turn: nextOwnTurn } });
      break;
    case "assurance_immobiliere":
      replaceEffect(g, "realtyInsurance", (e) => e.propertyIndex === cmd.propertyIndex, { kind: "realtyInsurance", sourceId: p.id, propertyIndex: cmd.propertyIndex, expiry: { kind: "turnStart", playerId: p.id, turn: nextOwnTurn } });
      break;
    case "negociateur":
      s.turn.tradeCreditReduction = 10;
      break;
    case "offre_speciale":
      s.turn.specialOffer = true;
      break;
    case "courtier": {
      const k = cmd.resource;
      p[k] -= 1;
      gainCredits(g, p, 15, def.key);
      emit(g, "RESOURCE_SOLD", { kind: k, amount: 15, reason: def.key }, p.id);
      break;
    }
    case "partenariat": {
      const t = player(s, cmd.targetPlayerId);
      if (t.credits >= 10) {
        t.credits -= 10;
        p.credits += 10;
        emit(g, "PARTNERSHIP_PAID", { from: t.id, credits: 10 }, p.id);
      } else {
        const k = t.materials > 0 ? "materials" : t.energy > 0 ? "energy" : null;
        if (k) {
          t[k] -= 1;
          gainResource(g, p, k, 1, def.key);
          emit(g, "PARTNERSHIP_PAID", { from: t.id, resource: k }, p.id);
        } else emit(g, "PARTNERSHIP_EMPTY", { from: t.id }, p.id);
      }
      break;
    }
    case "fusion": {
      const mine = prop(s, cmd.propertyIndex);
      const theirs = prop(s, cmd.otherPropertyIndex);
      const other = theirs.ownerId;
      mine.ownerId = other;
      theirs.ownerId = p.id;
      emit(g, "PROPERTIES_SWAPPED", { a: mine.index, b: theirs.index, with: other }, p.id);
      break;
    }
    case "influence_locale":
      addEffect(g, { kind: "influence", sourceId: p.id, district: cmd.district, expiry: { kind: "turnEnd", playerId: p.id, turn: p.turnsStarted } });
      break;
    case "reforme_urbaine":
      replaceEffect(g, "reform", (e) => e.district === cmd.district, { kind: "reform", sourceId: p.id, district: cmd.district, expiry: { kind: "turnStart", playerId: p.id, turn: nextOwnTurn } });
      break;
    case "magnat":
      gainCredits(g, p, 40, def.key);
      gainResource(g, p, "materials", 1, def.key);
      break;
    default:
      fail("UNIMPLEMENTED_CARD", def.key);
  }
}
function validBundle(b) {
  return [b.credits, b.materials, b.energy].every((n) => Number.isInteger(n) && n >= 0) && Array.isArray(b.properties) && b.properties.every((i) => Number.isInteger(i)) && new Set(b.properties).size === b.properties.length;
}
function bundleEmpty(b) {
  return b.credits === 0 && b.materials === 0 && b.energy === 0 && b.properties.length === 0;
}
function checkBundleOwned(s, ownerId, b, creditsDue) {
  const p = player(s, ownerId);
  if (p.credits < creditsDue || p.materials < b.materials || p.energy < b.energy) return "INSUFFICIENT_RESOURCES";
  for (const i of b.properties) {
    const pr = s.properties[i];
    if (!pr || pr.ownerId !== ownerId) return "NOT_OWNER";
    if (pr.mortgaged) return "MORTGAGED";
  }
  return null;
}
function tradeCreditsDue(s, b) {
  return Math.max(0, b.credits - (b.credits > 0 ? s.turn.tradeCreditReduction : 0));
}
function validateTrade(s, fromId, toId, give, receive) {
  if (!validBundle(give) || !validBundle(receive)) return "INVALID_BUNDLE";
  if (bundleEmpty(give) && bundleEmpty(receive)) return "EMPTY_TRADE";
  if (fromId === toId || !s.players[toId]) return "INVALID_TARGET";
  const giveCredits = tradeCreditsDue(s, give);
  const e1 = checkBundleOwned(s, fromId, give, giveCredits);
  if (e1) return e1;
  const e2 = checkBundleOwned(s, toId, receive, receive.credits);
  if (e2) return e2;
  const a = player(s, fromId);
  const b = player(s, toId);
  if (a.materials - give.materials + receive.materials > RULES.maxMaterials) return "CAP_EXCEEDED";
  if (a.energy - give.energy + receive.energy > RULES.maxEnergy) return "CAP_EXCEEDED";
  if (b.materials - receive.materials + give.materials > RULES.maxMaterials) return "CAP_EXCEEDED";
  if (b.energy - receive.energy + give.energy > RULES.maxEnergy) return "CAP_EXCEEDED";
  return null;
}
function executeTrade(g) {
  const s = g.s;
  const t = s.trade;
  const err = validateTrade(s, t.fromId, t.toId, t.give, t.receive);
  if (err) fail(err, `\xC9change devenu invalide : ${err}`);
  const a = player(s, t.fromId);
  const b = player(s, t.toId);
  const giveCredits = tradeCreditsDue(s, t.give);
  a.credits -= giveCredits;
  b.credits += giveCredits;
  a.materials -= t.give.materials;
  b.materials += t.give.materials;
  a.energy -= t.give.energy;
  b.energy += t.give.energy;
  for (const i of t.give.properties) prop(s, i).ownerId = b.id;
  b.credits -= t.receive.credits;
  a.credits += t.receive.credits;
  b.materials -= t.receive.materials;
  a.materials += t.receive.materials;
  b.energy -= t.receive.energy;
  a.energy += t.receive.energy;
  for (const i of t.receive.properties) prop(s, i).ownerId = a.id;
  if (giveCredits !== t.give.credits) s.turn.tradeCreditReduction = 0;
  a.stats.trades += 1;
  b.stats.trades += 1;
  emit(g, "TRADE_ACCEPTED", { tradeId: t.id, fromId: a.id, toId: b.id, give: { ...t.give, credits: giveCredits }, receive: t.receive }, b.id);
  s.trade = null;
  s.phase = "MANAGE";
  if (s.turn.specialOffer && !s.turn.specialOfferUsed) {
    s.turn.specialOfferUsed = true;
    gainResource(g, a, "materials", 1, "offre_speciale");
  }
}
function objectiveMet(s, p, id) {
  const owned = PROPERTY_INDICES.map((i) => prop(s, i)).filter((x) => x.ownerId === p.id);
  const ctrl = DISTRICTS.filter((d) => controls(s, p.id, d.id)).length;
  switch (objective(id).key) {
    case "own_3":
      return owned.length >= 3;
    case "credits_120":
      return p.credits >= 120;
    case "level_2":
      return owned.some((x) => x.level >= 2);
    case "trades_2":
      return p.stats.trades >= 2;
    case "control_1":
      return ctrl >= 1;
    case "four_districts":
      return new Set(owned.map((x) => districtOf(x.index))).size >= 4;
    case "auctions_2":
      return p.stats.auctionsWon >= 2;
    case "cards_3":
      return p.stats.cardsPlayed >= 3;
    case "control_2":
      return ctrl >= 2;
    case "level_3":
      return owned.some((x) => x.level === 3);
    case "downtown_business_built":
      return owned.some((x) => x.level >= 1 && districtOf(x.index) === "downtown") && owned.some((x) => x.level >= 1 && districtOf(x.index) === "business");
    case "clean_6":
      return p.debt === 0 && owned.length >= 6 && owned.every((x) => !x.mortgaged);
    default:
      return false;
  }
}
function computeScores(s) {
  const lines = s.turnOrder.map((id) => {
    const p = player(s, id);
    const owned = PROPERTY_INDICES.map((i) => prop(s, i)).filter((x) => x.ownerId === id);
    const properties = Math.floor(owned.reduce((acc, x) => acc + priceOf(x.index), 0) * RULES.scorePropertyPercent / 100);
    const mortgages = owned.filter((x) => x.mortgaged).reduce((acc, x) => acc + redeemValue(x.index), 0);
    const buildings = Math.floor(owned.reduce((acc, x) => acc + x.buildingCredits, 0) * RULES.scoreBuildingPercent / 100);
    const resources = (s.config.resourceScore ?? RULES.scorePerResource) * (p.materials + p.energy);
    const districts = RULES.scorePerDistrict * DISTRICTS.filter((d) => controls(s, id, d.id)).length;
    const o = objective(p.objectiveId);
    const objectivePts = objectiveMet(s, p, o.id) ? RULES.objectivePoints[o.difficulty] : 0;
    const wealth = p.credits + resources + properties + buildings + districts - p.debt - mortgages;
    return {
      playerId: id,
      credits: p.credits,
      resources,
      properties,
      buildings,
      objective: objectivePts,
      districts,
      debt: p.debt,
      mortgages,
      total: wealth + objectivePts,
      wealth,
      rank: 0,
      _props: owned.length
    };
  });
  const cmp = (a, b) => b.total - a.total || b.wealth - a.wealth || b._props - a._props || b.credits - a.credits;
  lines.sort(cmp);
  lines.forEach((l, i) => {
    const prev = lines[i - 1];
    l.rank = prev && cmp(prev, l) === 0 ? prev.rank : i + 1;
  });
  return lines.map(({ _props, ...rest }) => rest);
}
function finishGame(g) {
  const s = g.s;
  s.phase = "FINISHED";
  s.scores = computeScores(s);
  emit(g, "GAME_FINISHED", {
    scores: s.scores,
    objectives: Object.fromEntries(s.turnOrder.map((id) => [id, player(s, id).objectiveId]))
  });
}
function requireActive(s, playerId, phases) {
  if (s.phase === "FINISHED") fail("GAME_FINISHED", "La partie est termin\xE9e");
  if (activePlayerId(s) !== playerId) fail("NOT_YOUR_TURN", "Ce n'est pas ton tour");
  if (!phases.includes(s.phase)) fail("WRONG_PHASE", `Action impossible pendant la phase ${s.phase}`);
  return player(s, playerId);
}
function dispatch(g, cmd) {
  const s = g.s;
  switch (cmd.type) {
    case "ROLL_DICE": {
      const p = requireActive(s, cmd.playerId, ["PRE_ROLL"]);
      rollDice(g, p);
      return;
    }
    case "CHOOSE_RESOURCE": {
      const p = requireActive(s, cmd.playerId, ["RESOURCE_CHOICE"]);
      if (!resourceChoices(s, p).includes(cmd.resource)) fail("INVALID_CHOICE", "Ressource indisponible");
      if (cmd.resource === "credits") gainCredits(g, p, CHOICE_CREDITS, "resource_choice");
      else gainResource(g, p, cmd.resource, 1, "resource_choice");
      s.pendingResource = null;
      moveAndLand(g, p);
      return;
    }
    case "BUY_PROPERTY": {
      const p = requireActive(s, cmd.playerId, ["BUY_DECISION"]);
      const err = canBuy(s, p.id);
      if (err) fail(err, `Achat impossible : ${err}`);
      const index = p.position;
      const price = Math.max(0, priceOf(index) - s.turn.buyDiscount);
      charge(g, p, price, null, "purchase", "voluntary");
      prop(s, index).ownerId = p.id;
      s.turn.buyDiscount = 0;
      emit(g, "PROPERTY_BOUGHT", { propertyIndex: index, price }, p.id);
      s.phase = "MANAGE";
      return;
    }
    case "DECLINE_PROPERTY": {
      const p = requireActive(s, cmd.playerId, ["BUY_DECISION"]);
      emit(g, "PROPERTY_DECLINED", { propertyIndex: p.position }, p.id);
      startAuction(g, p.position, "declined", floor5(Math.floor(priceOf(p.position) * RULES.auctionStartPercent / 100)), null, "MANAGE");
      return;
    }
    case "PAY_TAX": {
      const p = requireActive(s, cmd.playerId, ["TAX_DUE"]);
      const amount = s.turn.taxCancel ? 0 : Math.max(0, RULES.taxAmount - s.turn.taxReduction);
      if (amount > 0) charge(g, p, amount, null, "tax", "landing");
      emit(g, "TAX_PAID", { amount, cancelled: s.turn.taxCancel }, p.id);
      s.phase = "MANAGE";
      return;
    }
    case "CHOOSE_CARD": {
      const p = requireActive(s, cmd.playerId, ["CHANCE_CHOICE"]);
      if (!s.pendingDraw.includes(cmd.keep)) fail("INVALID_CHOICE", "Carte non pioch\xE9e");
      const full = p.hand.length >= RULES.maxHand;
      if (full && (cmd.replace === void 0 || !p.hand.includes(cmd.replace))) fail("HAND_FULL", "Main pleine : choisis une carte \xE0 remplacer");
      if (!full && cmd.replace !== void 0) fail("INVALID_CHOICE", "Pas de remplacement : la main n'est pas pleine");
      if (full) {
        p.hand = p.hand.filter((i) => i !== cmd.replace);
        s.discard.push(cmd.replace);
      }
      p.hand.push(cmd.keep);
      for (const i of s.pendingDraw) if (i !== cmd.keep) s.discard.push(i);
      s.pendingDraw = [];
      emit(g, "CARD_KEPT", { handSize: p.hand.length, replaced: full }, p.id);
      emit(g, "CARD_KEPT_PRIVATE", { instanceId: cmd.keep, cardId: s.cardInstances[cmd.keep] }, p.id, p.id);
      s.phase = "MANAGE";
      return;
    }
    case "PLACE_BID": {
      const a = s.auction;
      if (s.phase !== "AUCTION" || !a) return fail("WRONG_PHASE", "Aucune ench\xE8re en cours");
      if (!a.activeBidders.includes(cmd.playerId)) fail("NOT_BIDDER", "Tu ne participes plus \xE0 cette ench\xE8re");
      if (a.highestBidderId === cmd.playerId) fail("ALREADY_HIGHEST", "Tu es d\xE9j\xE0 le meilleur ench\xE9risseur");
      if (g.ctx.now > a.deadline) fail("AUCTION_EXPIRED", "Ench\xE8re expir\xE9e");
      const p = player(s, cmd.playerId);
      if (!Number.isInteger(cmd.amount) || cmd.amount % RULES.auctionIncrement !== 0) fail("INVALID_AMOUNT", "Montant invalide");
      if (cmd.amount < minBid(s)) fail("BID_TOO_LOW", `Offre minimale : ${minBid(s)} D`);
      if (cmd.amount > p.credits) fail("INSUFFICIENT_FUNDS", "Cr\xE9dits insuffisants");
      a.currentBid = cmd.amount;
      a.highestBidderId = p.id;
      a.deadline = g.ctx.now + RULES.auctionTimerMs;
      const dropped = a.activeBidders.filter((id) => id !== p.id && player(s, id).credits < cmd.amount + RULES.auctionIncrement);
      a.activeBidders = a.activeBidders.filter((id) => !dropped.includes(id));
      emit(g, "BID_PLACED", { amount: cmd.amount, deadline: a.deadline, dropped }, p.id);
      checkAuctionEnd(g);
      return;
    }
    case "PASS_AUCTION": {
      const a = s.auction;
      if (s.phase !== "AUCTION" || !a) return fail("WRONG_PHASE", "Aucune ench\xE8re en cours");
      if (!a.activeBidders.includes(cmd.playerId)) fail("NOT_BIDDER", "Tu ne participes plus \xE0 cette ench\xE8re");
      if (a.highestBidderId === cmd.playerId) fail("ALREADY_HIGHEST", "Le meilleur ench\xE9risseur ne peut pas passer");
      a.activeBidders = a.activeBidders.filter((id) => id !== cmd.playerId);
      emit(g, "AUCTION_PASSED", {}, cmd.playerId);
      checkAuctionEnd(g);
      return;
    }
    case "CLOSE_AUCTION": {
      const a = s.auction;
      if (s.phase !== "AUCTION" || !a) return fail("WRONG_PHASE", "Aucune ench\xE8re en cours");
      if (!s.players[cmd.playerId]) fail("UNKNOWN_PLAYER", "Joueur inconnu");
      if (g.ctx.now < a.deadline) fail("AUCTION_RUNNING", "Le chrono n'est pas termin\xE9");
      emit(g, "AUCTION_TIMEOUT", {});
      checkAuctionEnd(g, true);
      return;
    }
    case "BUILD": {
      const p = requireActive(s, cmd.playerId, ["MANAGE"]);
      const err = canBuild(s, p.id, cmd.propertyIndex);
      if (err) fail(err, `Construction impossible : ${err}`);
      const c2 = buildCost(s, p.id, cmd.propertyIndex);
      const pr = prop(s, cmd.propertyIndex);
      const usedResidential = !s.turn.residentialDiscountUsed && hasBonus(s, p.id, "residential");
      p.credits -= c2.credits;
      p.materials -= c2.materials;
      p.energy -= c2.energy;
      pr.level = pr.level + 1;
      pr.buildingCredits += c2.credits;
      pr.levelPaid.push(c2.credits);
      s.turn.buildsDone += 1;
      s.turn.buildDiscount = 0;
      if (usedResidential) s.turn.residentialDiscountUsed = true;
      emit(g, "BUILT", { propertyIndex: pr.index, level: pr.level, cost: c2 }, p.id);
      return;
    }
    case "SELL_BUILDING": {
      const p = requireActive(s, cmd.playerId, ["PRE_ROLL", "MANAGE"]);
      const pr = prop(s, cmd.propertyIndex);
      if (pr.ownerId !== p.id) fail("NOT_OWNER", "Propri\xE9t\xE9 non poss\xE9d\xE9e");
      if (pr.level === 0) fail("NO_BUILDING", "Aucun b\xE2timent");
      sellBuildingRaw(g, p, pr, "voluntary");
      return;
    }
    case "MORTGAGE": {
      const p = requireActive(s, cmd.playerId, ["PRE_ROLL", "MANAGE"]);
      const pr = prop(s, cmd.propertyIndex);
      if (pr.ownerId !== p.id) fail("NOT_OWNER", "Propri\xE9t\xE9 non poss\xE9d\xE9e");
      if (pr.mortgaged) fail("MORTGAGED", "D\xE9j\xE0 hypoth\xE9qu\xE9e");
      if (pr.level > 0) fail("HAS_BUILDING", "Vends d'abord les b\xE2timents");
      mortgageRaw(g, p, pr, "voluntary");
      return;
    }
    case "REDEEM_MORTGAGE": {
      const p = requireActive(s, cmd.playerId, ["PRE_ROLL", "MANAGE"]);
      const pr = prop(s, cmd.propertyIndex);
      if (pr.ownerId !== p.id) fail("NOT_OWNER", "Propri\xE9t\xE9 non poss\xE9d\xE9e");
      if (!pr.mortgaged) fail("NOT_MORTGAGED", "Propri\xE9t\xE9 non hypoth\xE9qu\xE9e");
      if (inRecovery(p)) fail("IN_RECOVERY", "Impossible pendant le redressement");
      charge(g, p, redeemValue(pr.index), null, "redeem", "voluntary");
      pr.mortgaged = false;
      emit(g, "MORTGAGE_REDEEMED", { propertyIndex: pr.index }, p.id);
      return;
    }
    case "BUY_RESOURCE":
    case "SELL_RESOURCE": {
      const p = requireActive(s, cmd.playerId, ["MANAGE"]);
      if (!s.turn.marketAvailable) fail("NO_MARKET", "Le march\xE9 n'est accessible que sur la case March\xE9");
      if (s.turn.marketTransactions >= RULES.marketMaxTransactions) fail("MARKET_LIMIT", "Limite de transactions atteinte");
      const k = cmd.resource;
      if (k !== "materials" && k !== "energy") fail("INVALID_CHOICE", "Ressource invalide");
      if (cmd.type === "BUY_RESOURCE") {
        if (inRecovery(p)) fail("IN_RECOVERY", "Impossible pendant le redressement");
        if (p[k] >= cap(k)) fail("CAP_REACHED", "Plafond atteint");
        const price = k === "materials" ? RULES.marketBuyMaterial : RULES.marketBuyEnergy;
        charge(g, p, price, null, "market", "voluntary");
        p[k] += 1;
      } else {
        if (p[k] < 1) fail("NO_RESOURCE", "Ressource insuffisante");
        p[k] -= 1;
        p.credits += RULES.marketSell;
      }
      s.turn.marketTransactions += 1;
      emit(g, cmd.type === "BUY_RESOURCE" ? "MARKET_BOUGHT" : "MARKET_SOLD", { kind: k }, p.id);
      return;
    }
    case "SETTLE_DEBT": {
      const p = requireActive(s, cmd.playerId, ["PRE_ROLL", "MANAGE"]);
      if (p.debt <= 0) fail("NO_DEBT", "Aucune dette");
      if (p.credits <= 0) fail("INSUFFICIENT_FUNDS", "Cr\xE9dits insuffisants");
      autoSettleDebt(g, p);
      return;
    }
    case "PLAY_CARD":
      if (s.phase === "FINISHED") fail("GAME_FINISHED", "La partie est termin\xE9e");
      playCard(g, cmd);
      return;
    case "PROPOSE_TRADE": {
      const p = requireActive(s, cmd.playerId, ["MANAGE"]);
      if (s.turn.tradeOffers >= RULES.tradeOffersPerTurn) fail("TRADE_LIMIT", "Limite d'offres atteinte");
      const err = validateTrade(s, p.id, cmd.toId, cmd.give, cmd.receive);
      if (err) fail(err, `\xC9change invalide : ${err}`);
      s.turn.tradeOffers += 1;
      s.trade = {
        id: s.nextTradeId++,
        fromId: p.id,
        toId: cmd.toId,
        give: { ...cmd.give, properties: [...cmd.give.properties] },
        receive: { ...cmd.receive, properties: [...cmd.receive.properties] },
        expiresAt: g.ctx.now + RULES.tradeOfferTtlMs
      };
      s.phase = "TRADE_PENDING";
      emit(g, "TRADE_PROPOSED", { trade: s.trade, effectiveGiveCredits: tradeCreditsDue(s, cmd.give) }, p.id);
      return;
    }
    case "ACCEPT_TRADE": {
      const t = s.trade;
      if (s.phase !== "TRADE_PENDING" || !t) return fail("WRONG_PHASE", "Aucune offre en attente");
      if (t.toId !== cmd.playerId) fail("NOT_RECIPIENT", "Cette offre ne t'est pas destin\xE9e");
      if (g.ctx.now > t.expiresAt) fail("TRADE_EXPIRED", "Offre expir\xE9e");
      executeTrade(g);
      return;
    }
    case "REJECT_TRADE": {
      const t = s.trade;
      if (s.phase !== "TRADE_PENDING" || !t) return fail("WRONG_PHASE", "Aucune offre en attente");
      if (t.toId !== cmd.playerId && t.fromId !== cmd.playerId) fail("NOT_PARTY", "Tu n'es pas concern\xE9 par cette offre");
      emit(g, t.fromId === cmd.playerId ? "TRADE_CANCELLED" : "TRADE_REJECTED", { tradeId: t.id }, cmd.playerId);
      s.trade = null;
      s.phase = "MANAGE";
      return;
    }
    case "EXPIRE_TRADE": {
      const t = s.trade;
      if (s.phase !== "TRADE_PENDING" || !t) return fail("WRONG_PHASE", "Aucune offre en attente");
      if (g.ctx.now < t.expiresAt) fail("TRADE_RUNNING", "L'offre n'a pas expir\xE9");
      emit(g, "TRADE_EXPIRED", { tradeId: t.id });
      s.trade = null;
      s.phase = "MANAGE";
      return;
    }
    case "END_TURN": {
      requireActive(s, cmd.playerId, ["MANAGE"]);
      endTurn(g);
      return;
    }
    default: {
      const never = cmd;
      fail("UNKNOWN_COMMAND", `Commande inconnue ${never.type}`);
    }
  }
}
function canBuy(s, playerId) {
  const p = s.players[playerId];
  if (!p) return "UNKNOWN_PLAYER";
  if (s.phase !== "BUY_DECISION") return "WRONG_PHASE";
  if (inRecovery(p)) return "IN_RECOVERY";
  if (s.effects.some((e) => e.kind === "noBuy" && e.targetPlayerId === p.id)) return "BANK_BLOCKED";
  const price = Math.max(0, priceOf(p.position) - s.turn.buyDiscount);
  if (p.credits - price < RULES.voluntaryBuyReserve) return "RESERVE_REQUIRED";
  return null;
}
function cloneState(s) {
  return structuredClone(s);
}
function applyCommand(state, cmd, ctx) {
  const g = { s: cloneState(state), ctx, ev: [] };
  try {
    dispatch(g, cmd);
  } catch (e) {
    if (e instanceof RuleError) return { ok: false, code: e.code, error: e.message };
    throw e;
  }
  g.s.version += 1;
  return { ok: true, state: g.s, events: g.ev };
}

// ../../packages/engine/src/view.ts
function viewFor(s, viewerId) {
  const c2 = structuredClone(s);
  const finished = s.phase === "FINISHED";
  const handCounts = {};
  const visibleCards = {};
  for (const id of Object.keys(c2.players)) {
    const p = c2.players[id];
    handCounts[id] = p.hand.length;
    if (id === viewerId) {
      for (const i of p.hand) visibleCards[i] = s.cardInstances[i];
    } else {
      p.hand = [];
      if (!finished) p.objectiveId = 0;
    }
  }
  const active = s.turnOrder[s.activeIndex];
  const pendingDraw = viewerId !== null && viewerId === active ? [...s.pendingDraw] : [];
  for (const i of pendingDraw) visibleCards[i] = s.cardInstances[i];
  const { deck, discard, cardInstances, pendingDraw: _pd, ...rest } = c2;
  return {
    ...rest,
    viewerId,
    deckCount: deck.length,
    discardCount: discard.length,
    handCounts,
    visibleCards,
    pendingDraw
  };
}
function eventsFor(events, viewerId) {
  return events.filter((e) => e.privateTo === void 0 || e.privateTo === viewerId);
}

// ../../packages/engine/src/legal.ts
var EMPTY = { credits: 0, materials: 0, energy: 0, properties: [] };
function cardPlays(s) {
  const a = activePlayerId(s);
  const p = s.players[a];
  const out = [];
  const opponents = s.turnOrder.filter((id) => id !== a);
  for (const inst of p.hand) {
    const def = card(s.cardInstances[inst]);
    const base = { type: "PLAY_CARD", playerId: a, instanceId: inst };
    const cands = [];
    switch (cardTarget(def, s.config.cardRevision ?? 1)) {
      case "none":
        cands.push(base);
        break;
      case "opponent":
        for (const o of opponents) cands.push({ ...base, targetPlayerId: o });
        break;
      case "ownProperty":
      case "opponentProperty":
        for (const i of PROPERTY_INDICES) cands.push({ ...base, propertyIndex: i });
        break;
      case "district":
        for (const d of DISTRICTS) cands.push({ ...base, district: d.id });
        break;
      case "resource":
        cands.push({ ...base, resource: "materials" }, { ...base, resource: "energy" });
        break;
      case "swap":
        for (const i of PROPERTY_INDICES) if (s.properties[i].ownerId === a) {
          for (const j of PROPERTY_INDICES) if (s.properties[j].ownerId && s.properties[j].ownerId !== a) cands.push({ ...base, propertyIndex: i, otherPropertyIndex: j });
        }
        break;
    }
    for (const c2 of cands) if (canPlayCard(s, c2) === null) out.push(c2);
  }
  return out;
}
function candidateCommands(s, now) {
  if (s.phase === "FINISHED") return [];
  const a = activePlayerId(s);
  const p = s.players[a];
  const out = [];
  const manage = () => {
    for (const i of PROPERTY_INDICES) {
      const pr = s.properties[i];
      if (pr.ownerId !== a) continue;
      if (pr.level > 0) out.push({ type: "SELL_BUILDING", playerId: a, propertyIndex: i });
      if (!pr.mortgaged && pr.level === 0) out.push({ type: "MORTGAGE", playerId: a, propertyIndex: i });
      if (pr.mortgaged) out.push({ type: "REDEEM_MORTGAGE", playerId: a, propertyIndex: i });
    }
    if (p.debt > 0 && p.credits > 0) out.push({ type: "SETTLE_DEBT", playerId: a });
    out.push(...cardPlays(s));
  };
  switch (s.phase) {
    case "PRE_ROLL":
      out.push({ type: "ROLL_DICE", playerId: a });
      manage();
      break;
    case "RESOURCE_CHOICE":
      for (const r of resourceChoices(s, p)) out.push({ type: "CHOOSE_RESOURCE", playerId: a, resource: r });
      break;
    case "BUY_DECISION":
      if (canBuy(s, a) === null) out.push({ type: "BUY_PROPERTY", playerId: a });
      out.push({ type: "DECLINE_PROPERTY", playerId: a });
      out.push(...cardPlays(s));
      break;
    case "TAX_DUE":
      out.push({ type: "PAY_TAX", playerId: a });
      out.push(...cardPlays(s));
      break;
    case "CHANCE_CHOICE":
      for (const k of s.pendingDraw) {
        if (p.hand.length < RULES.maxHand) out.push({ type: "CHOOSE_CARD", playerId: a, keep: k });
        else for (const r of p.hand) out.push({ type: "CHOOSE_CARD", playerId: a, keep: k, replace: r });
      }
      break;
    case "MANAGE":
      out.push({ type: "END_TURN", playerId: a });
      for (const i of PROPERTY_INDICES) if (canBuild(s, a, i) === null) out.push({ type: "BUILD", playerId: a, propertyIndex: i });
      if (s.turn.marketAvailable && s.turn.marketTransactions < RULES.marketMaxTransactions) {
        for (const r of ["materials", "energy"]) {
          out.push({ type: "BUY_RESOURCE", playerId: a, resource: r }, { type: "SELL_RESOURCE", playerId: a, resource: r });
        }
      }
      manage();
      if (s.turn.tradeOffers < RULES.tradeOffersPerTurn) {
        for (const o of s.turnOrder) {
          if (o === a) continue;
          for (const i of PROPERTY_INDICES) {
            const pr = s.properties[i];
            if (pr.ownerId === o && !pr.mortgaged && p.credits >= priceOf(i)) {
              out.push({ type: "PROPOSE_TRADE", playerId: a, toId: o, give: { ...EMPTY, credits: priceOf(i) }, receive: { ...EMPTY, properties: [i] } });
            }
            if (pr.ownerId === a && !pr.mortgaged) {
              out.push({ type: "PROPOSE_TRADE", playerId: a, toId: o, give: { ...EMPTY, properties: [i] }, receive: { ...EMPTY, credits: priceOf(i) } });
            }
          }
          if (p.materials > 0) out.push({ type: "PROPOSE_TRADE", playerId: a, toId: o, give: { ...EMPTY, materials: 1 }, receive: { ...EMPTY, credits: 10 } });
        }
      }
      break;
    case "AUCTION": {
      const au = s.auction;
      for (const id of au.activeBidders) {
        if (id === au.highestBidderId) continue;
        out.push({ type: "PASS_AUCTION", playerId: id });
        const m = minBid(s);
        for (const amt of [m, m + 10, m + 25]) if (s.players[id].credits >= amt) out.push({ type: "PLACE_BID", playerId: id, amount: amt });
      }
      if (now >= au.deadline) out.push({ type: "CLOSE_AUCTION", playerId: a });
      break;
    }
    case "TRADE_PENDING": {
      const t = s.trade;
      out.push({ type: "ACCEPT_TRADE", playerId: t.toId }, { type: "REJECT_TRADE", playerId: t.toId }, { type: "REJECT_TRADE", playerId: t.fromId });
      if (now >= t.expiresAt) out.push({ type: "EXPIRE_TRADE", playerId: a });
      break;
    }
  }
  return out;
}

// ../../packages/sim/src/agents.ts
var PROFILES = {
  investor: { name: "investor", label: "Investisseur", buyMargin: 0, bidFraction: 0.85, buildReserve: 20, attack: 0.4, defense: 0.8, invest: 1.4, trade: 0.6 },
  aggressive: { name: "aggressive", label: "Agressif", buyMargin: 10, bidFraction: 0.75, buildReserve: 35, attack: 1.6, defense: 0.6, invest: 0.8, trade: 0.4 },
  negotiator: { name: "negotiator", label: "N\xE9gociateur", buyMargin: 5, bidFraction: 0.8, buildReserve: 30, attack: 0.7, defense: 0.8, invest: 1, trade: 1.6 },
  random: { name: "random", label: "Al\xE9atoire raisonnable", buyMargin: 0, bidFraction: 0.7, buildReserve: 25, attack: 1, defense: 1, invest: 1, trade: 1 },
  balanced: { name: "balanced", label: "Mixte", buyMargin: 5, bidFraction: 0.8, buildReserve: 25, attack: 1, defense: 1, invest: 1, trade: 1 }
};
function wealthOf(s, id) {
  return computeScores(s).find((l) => l.playerId === id).wealth;
}
function leaderOpponent(s, me) {
  const lines = computeScores(s).filter((l) => l.playerId !== me);
  return lines.sort((a, b) => b.wealth - a.wealth)[0].playerId;
}
function propertyValue(s, me, index) {
  const d = districtOf(index);
  const mine = ownedCount(s, me, d) - (s.properties[index].ownerId === me ? 1 : 0);
  const blocks = districtProperties(d).some((i) => s.properties[i].ownerId && s.properties[i].ownerId !== me && ownedCount(s, s.properties[i].ownerId, d) >= 1);
  let v = priceOf(index);
  if (mine === 1) v *= 1.45;
  else if (mine === 0 && !blocks) v *= 1.1;
  const roundsLeft = RULES.rounds - s.round;
  v *= 0.75 + 0.25 * (roundsLeft / RULES.rounds) + 0.05;
  return v;
}
function relativeWealth(s, me) {
  const lines = computeScores(s);
  const mine = lines.find((l) => l.playerId === me).wealth;
  const opp = lines.filter((l) => l.playerId !== me);
  const leader = Math.max(...opp.map((l) => l.wealth));
  const avg = opp.reduce((a, l) => a + l.wealth, 0) / opp.length;
  return mine - (avg + leader) / 2;
}
function landChance(s, index, excludeId) {
  let miss = 1;
  for (const id of s.turnOrder) {
    if (id === excludeId) continue;
    const pos = s.players[id].position;
    const d = (index - pos + 24) % 24;
    const pHit = d >= 1 && d <= 4 ? 0.3 : d <= 8 ? 0.15 : 0.05;
    miss *= 1 - pHit;
  }
  return 1 - miss;
}
function cardEV(s, me, cmd, pf) {
  const def = card(s.cardInstances[cmd.instanceId]);
  const r = applyCommand(s, cmd, { rng: { int: () => 0 }, now: 0 });
  if (!r.ok) return -Infinity;
  const after = r.state;
  let immediate = relativeWealth(after, me) - relativeWealth(s, me);
  const p = s.players[me];
  const n = s.turnOrder.length;
  const roundsLeft = RULES.rounds - s.round;
  const opps = s.turnOrder.filter((x) => x !== me);
  const oppCards = opps.reduce((a, id) => a + s.players[id].hand.length, 0);
  const attackThreat = Math.min(0.9, oppCards * 0.18);
  const myProps = PROPERTY_INDICES.filter((i) => s.properties[i].ownerId === me);
  const target = cmd.targetPlayerId ?? (cmd.propertyIndex !== void 0 ? s.properties[cmd.propertyIndex].ownerId : null);
  const leader = leaderOpponent(s, me);
  const lead = target === leader ? 1.25 : 1;
  let later = 0;
  switch (def.key) {
    case "placement_malin":
      later = s.phase === "MANAGE" && PROPERTY_INDICES.some((i) => canBuild(s, me, i) === null) ? 10 : -99;
      break;
    case "chantier_express":
    case "permis_exceptionnel": {
      const buildable = myProps.filter((i) => controlsLevel(s, me, i)).length;
      later = s.phase === "MANAGE" && buildable >= 1 && p.credits > 80 && p.materials >= 3 ? 12 + 2 * roundsLeft : -99;
      break;
    }
    case "rendement_bonus":
      later = 15 * Math.min(1, landChance(s, cmd.propertyIndex, me) * 1.6);
      break;
    case "revenus_garantis": {
      const dist = 24 - p.position;
      later = dist <= 2.5 * Math.max(1, roundsLeft) ? 18 : 2;
      break;
    }
    case "reduction_fiscale":
      later = s.phase === "TAX_DUE" ? 15 : -99;
      break;
    case "vote_municipal": {
      const cut = s.config.cardRevision === 2 ? 20 : 10;
      if (s.phase === "TAX_DUE") later = Math.min(cut, 15);
      else if (s.phase === "PRE_ROLL" && s.config.cardRevision === 2) {
        const die = s.config.movementDie;
        later = die.reduce((acc, m) => {
          const i = (p.position + m) % 24;
          const pr = s.properties[i];
          const due = i === 20 ? 15 : pr && pr.ownerId && pr.ownerId !== me && !pr.mortgaged ? computeRent(s, i).total : 0;
          return acc + Math.min(cut, due) / die.length;
        }, 0);
      } else later = -99;
      break;
    }
    case "nouvelle_opportunite":
      later = s.phase === "BUY_DECISION" ? 20 : -99;
      break;
    case "contrat_privilegie":
      later = s.phase === "BUY_DECISION" ? 15 : -99;
      break;
    case "sabotage": {
      const rent = computeRent(s, cmd.propertyIndex).total;
      later = (rent - Math.ceil(rent / 10) * 5) * landChance(s, cmd.propertyIndex, s.properties[cmd.propertyIndex].ownerId) * lead;
      break;
    }
    case "greve": {
      const owner = s.properties[cmd.propertyIndex].ownerId;
      const ctrl = ownedCount(s, owner, districtOf(cmd.propertyIndex)) >= 2;
      later = ctrl && s.properties[cmd.propertyIndex].level < 3 && s.players[owner].materials >= 1 ? 9 * lead : 0;
      break;
    }
    case "blocage_bancaire":
      later = 4 * lead;
      break;
    case "concurrence_agressive": {
      const t = cmd.targetPlayerId;
      const owned = PROPERTY_INDICES.filter((i) => s.properties[i].ownerId === t);
      const pRent = 1 - owned.reduce((m, i) => m * (1 - landChance(s, i, t) * 0.8), 1);
      later = 10 * pRent * lead;
      break;
    }
    case "crise_locale": {
      const d = cmd.district;
      let delta = 0;
      for (const i of PROPERTY_INDICES) {
        const pr = after.properties[i];
        if (districtOf(i) !== d || !pr.ownerId) continue;
        const loss = computeRent(s, i).total - computeRent(after, i).total;
        delta += (pr.ownerId === me ? -1 : 1) * loss * landChance(s, i, pr.ownerId);
      }
      later = delta;
      break;
    }
    case "prise_de_controle":
    case "opa_hostile": {
      const pr = s.properties[cmd.propertyIndex];
      const breaks = ownedCount(s, pr.ownerId, districtOf(pr.index)) >= 2 ? 25 : 0;
      later = -immediate + (priceOf(pr.index) * 0.7 + pr.buildingCredits * 0.5) * 0.4 + breaks * 0.8;
      later *= lead;
      const cc = cardCost(def, s.config.cardRevision ?? 1);
      immediate = -10 * (cc.materials + cc.energy) * resourceWeight(s);
      break;
    }
    case "assurance": {
      if (cmd.propertyIndex === void 0) {
        const rents = myProps.reduce((a, i) => a + computeRent(s, i).total, 0);
        later = attackThreat * 0.35 * rents * 0.5 + attackThreat * 4;
      } else later = attackThreat * 0.3 * computeRent(s, cmd.propertyIndex).total * 0.5;
      break;
    }
    case "bouclier_financier":
      later = attackThreat * 12;
      break;
    case "protection_juridique":
    case "assurance_immobiliere": {
      const pr = s.properties[cmd.propertyIndex];
      const valueAtRisk = priceOf(pr.index) * 0.7 * 0.4 + pr.buildingCredits * 0.5 + (ownedCount(s, me, districtOf(pr.index)) >= 2 ? 20 : 0);
      later = attackThreat * 0.25 * valueAtRisk * (def.key === "protection_juridique" ? 1.2 : 1);
      break;
    }
    case "contre_offensive":
      later = attackThreat * 14 + attackThreat * 5;
      break;
    case "reserve_urgence":
      later = p.credits < 30 ? 12 : 0;
      break;
    case "negociateur":
      later = s.phase === "MANAGE" && tradeOffer(s, me, pf) ? 10 : -99;
      break;
    case "offre_speciale":
      later = s.phase === "MANAGE" && tradeOffer(s, me, pf) ? 8 : -99;
      break;
    case "influence_locale": {
      const d = cmd.district;
      const enables = PROPERTY_INDICES.some((i) => districtOf(i) === d && after.properties[i].ownerId === me && canBuild(after, me, i) === null && canBuild(s, me, i) === "NO_MAJORITY");
      later = s.phase === "MANAGE" && enables ? 14 + roundsLeft : -99;
      break;
    }
    case "reforme_urbaine":
      later = ownedCount(s, me, cmd.district) >= 2 ? 6 : -99;
      break;
  }
  const fam = { investment: pf.invest, attack: pf.attack, defense: pf.defense, commerce: pf.trade, politics: 1 }[def.family];
  return immediate + later * fam;
}
function controlsLevel(s, me, i) {
  const pr = s.properties[i];
  return pr.ownerId === me && !pr.mortgaged && pr.level < 3 && ownedCount(s, me, districtOf(i)) >= 2;
}
function resourceWeight(s) {
  return (s.config.resourceScore ?? RULES.scorePerResource) / 10;
}
function bestCardPlay(s, me, pf, rng) {
  if (s.turn.cardPlayed) return null;
  const plays = cardPlays(s);
  if (!plays.length) return null;
  const threshold = Math.max(0, 4 - s.round / 3);
  let best = null;
  let bestV = threshold;
  for (const c2 of plays) {
    let v = cardEV(s, me, c2, pf);
    if (pf.name === "random") v += rng.int(8) - 4;
    if (v > bestV) {
      bestV = v;
      best = c2;
    }
  }
  return best;
}
function keepValue(s, me, cardId, pf) {
  const def = card(cardId);
  const fam = { investment: pf.invest, attack: pf.attack, defense: pf.defense, commerce: pf.trade, politics: 1 }[def.family];
  const rarity = { common: 1, rare: 1.3, epic: 1.7, legendary: 2.2 }[def.rarity];
  const affordable = s.players[me].materials >= def.cost.materials && s.players[me].energy >= def.cost.energy ? 1.2 : 0.8;
  return fam * rarity * affordable;
}
function decide(s, me, pf, rng, now) {
  if (s.phase === "FINISHED") return null;
  const active = activePlayerId(s);
  const p = s.players[me];
  if (s.phase === "AUCTION") {
    const a = s.auction;
    if (!a.activeBidders.includes(me) || a.highestBidderId === me) return null;
    const m = minBid(s);
    const value = propertyValue(s, me, a.propertyIndex) + (a.reason !== "declined" ? s.properties[a.propertyIndex].buildingCredits * 0.5 : 0);
    const limit = value * pf.bidFraction + (pf.name === "random" ? rng.int(15) - 7 : 0);
    if (m <= limit && p.credits - m >= 15) return { type: "PLACE_BID", playerId: me, amount: m };
    return { type: "PASS_AUCTION", playerId: me };
  }
  if (s.phase === "TRADE_PENDING") {
    const t = s.trade;
    if (t.toId !== me) return null;
    const val = (b, owner) => b.credits + 10 * (b.materials + b.energy) + b.properties.reduce((acc, i) => acc + (owner === me ? propertyValue(s, me, i) : propertyValue(s, me, i)), 0);
    const gain = val(t.give, t.fromId);
    const loss = val(t.receive, me) * (t.receive.properties.some((i) => ownedCount(s, me, districtOf(i)) >= 2) ? 1.6 : 1);
    return { type: gain >= loss * (pf.name === "negotiator" ? 1 : 1.08) ? "ACCEPT_TRADE" : "REJECT_TRADE", playerId: me };
  }
  if (active !== me) return null;
  switch (s.phase) {
    case "PRE_ROLL": {
      const c2 = bestCardPlay(s, me, pf, rng);
      if (c2 && rng.int(2) === 0) return c2;
      if (p.debt > 0 && p.credits > 0) return { type: "SETTLE_DEBT", playerId: me };
      return { type: "ROLL_DICE", playerId: me };
    }
    case "RESOURCE_CHOICE": {
      const ch = resourceChoices(s, p);
      if (ch.includes("materials") && p.materials < 4) return { type: "CHOOSE_RESOURCE", playerId: me, resource: "materials" };
      if (ch.includes("energy") && p.energy < 2) return { type: "CHOOSE_RESOURCE", playerId: me, resource: "energy" };
      return { type: "CHOOSE_RESOURCE", playerId: me, resource: ch.includes("materials") && p.materials < 6 ? "materials" : "credits" };
    }
    case "BUY_DECISION": {
      const index = p.position;
      const c2 = bestCardPlay(s, me, pf, rng);
      if (c2) return c2;
      const price = priceOf(index) - s.turn.buyDiscount;
      const wants = propertyValue(s, me, index) >= price * (pf.name === "random" ? 0.7 + rng.int(5) / 10 : 0.85);
      if (canBuy(s, me) === null && wants && p.credits - price >= RULES.voluntaryBuyReserve + pf.buyMargin) return { type: "BUY_PROPERTY", playerId: me };
      return { type: "DECLINE_PROPERTY", playerId: me };
    }
    case "TAX_DUE": {
      const c2 = bestCardPlay(s, me, pf, rng);
      return c2 ?? { type: "PAY_TAX", playerId: me };
    }
    case "CHANCE_CHOICE": {
      const ranked = [...s.pendingDraw].sort((x, y) => keepValue(s, me, s.cardInstances[y], pf) - keepValue(s, me, s.cardInstances[x], pf));
      const keep = ranked[0];
      if (p.hand.length < RULES.maxHand) return { type: "CHOOSE_CARD", playerId: me, keep };
      const worst = [...p.hand].sort((x, y) => keepValue(s, me, s.cardInstances[x], pf) - keepValue(s, me, s.cardInstances[y], pf))[0];
      return { type: "CHOOSE_CARD", playerId: me, keep, replace: worst };
    }
    case "MANAGE": {
      const builds = PROPERTY_INDICES.filter((i) => canBuild(s, me, i) === null).map((i) => ({ i, gain: rentGain(s, i), cost: buildCost(s, me, i).credits })).filter((b) => p.credits - b.cost >= pf.buildReserve).sort((x, y) => y.gain - x.gain);
      if (builds.length && (pf.name !== "random" || rng.int(3) > 0)) return { type: "BUILD", playerId: me, propertyIndex: builds[0].i };
      const c2 = bestCardPlay(s, me, pf, rng);
      if (c2) return c2;
      if (s.turn.marketAvailable && s.turn.marketTransactions < RULES.marketMaxTransactions) {
        const ownsMajority = BOARD.some((sp) => sp.district && ownedCount(s, me, sp.district) >= 2);
        if (ownsMajority && p.materials < 3 && p.credits > 70) return { type: "BUY_RESOURCE", playerId: me, resource: "materials" };
      }
      if (p.debt > 0 && p.credits > 0) return { type: "SETTLE_DEBT", playerId: me };
      if (s.turn.tradeOffers < (pf.name === "negotiator" ? 2 : 1) && rng.int(100) < 45 * pf.trade) {
        const offer = tradeOffer(s, me, pf);
        if (offer) return offer;
      }
      return { type: "END_TURN", playerId: me };
    }
    default:
      void now;
      void wealthOf;
      return null;
  }
}
function rentGain(s, i) {
  const before = computeRent(s, i).total;
  const pr = s.properties[i];
  const save = pr.level;
  pr.level = save + 1;
  const after = computeRent(s, i).total;
  pr.level = save;
  return after - before;
}
function tradeOffer(s, me, pf) {
  const p = s.players[me];
  for (const i of PROPERTY_INDICES) {
    const pr = s.properties[i];
    if (!pr.ownerId || pr.ownerId === me || pr.mortgaged) continue;
    const d = districtOf(i);
    if (ownedCount(s, me, d) !== 1) continue;
    if (ownedCount(s, pr.ownerId, d) >= 2) continue;
    const offer = Math.round((priceOf(i) * (1.15 + 0.15 * pf.trade) + pr.buildingCredits * 0.6) / 5) * 5;
    if (p.credits - offer < 30) continue;
    return { type: "PROPOSE_TRADE", playerId: me, toId: pr.ownerId, give: { credits: offer, materials: 0, energy: 0, properties: [] }, receive: { credits: 0, materials: 0, energy: 0, properties: [i] } };
  }
  return null;
}
function fallback(s, now) {
  return candidateCommands(s, now);
}

// server/deals.ts
var SUPA = "https://gbqgfsvwsunbmetdkdfd.supabase.co";
var ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdicWdmc3Z3c3VuYm1ldGRrZGZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxMjI3NDAsImV4cCI6MjExMDY5ODc0MH0.hD9AVIjHm7wdZbwNOGMBo0pV_w6zWVbJjDf1RUJ36wY";
var SECRET = () => {
  const s = globalThis.process?.env?.DEALS_SERVER_SECRET;
  if (!s) throw new HttpError(500, "Serveur non configur\xE9");
  return s;
};
var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
var BOT_NAMES = ["Victor", "In\xE8s", "Marco", "L\xE9a", "Samir", "Chlo\xE9"];
var AWAY_MS = 45e3;
var HttpError = class extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
  status;
};
async function rpc(fn, args) {
  const res = await fetch(`${SUPA}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_secret: SECRET(), ...args })
  });
  const text = await res.text();
  if (!res.ok) throw new HttpError(500, `db ${fn} ${res.status}: ${text.slice(0, 160)}`);
  return text ? JSON.parse(text) : null;
}
var rand = (n, alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789") => {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => alphabet[x % alphabet.length]).join("");
};
var hex = (n) => {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
};
async function sha256(s) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d), (x) => x.toString(16).padStart(2, "0")).join("");
}
var cleanName = (n) => String(n ?? "").replace(/[<>\u0000-\u001f]/g, "").trim().slice(0, 16) || "Joueur";
var cleanCode = (c2) => String(c2 ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
async function loadAll(code) {
  const r = await rpc("srv_room_get", { p_code: code });
  if (!r.room) throw new HttpError(404, "Partie introuvable");
  return { room: r.room, seats: r.seats, game: r.game };
}
async function loadRoom(code) {
  return loadAll(code);
}
async function auth(code, token) {
  if (typeof token !== "string" || token.length < 32) throw new HttpError(401, "Jeton manquant");
  const { room, seats } = await loadRoom(code);
  const h = await sha256(token);
  const me = seats.find((s) => s.token_hash === h);
  if (!me) throw new HttpError(403, "Tu ne fais pas partie de cette partie");
  return { room, seats, me };
}
async function touch(code, playerId) {
  await rpc("srv_seat_touch", { p_code: code, p_player: playerId });
}
var COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b"];
function seatInfo(seats, state) {
  const order = state ? state.turnOrder : seats.map((s) => s.player_id);
  const now = Date.now();
  return order.map((id, i) => {
    const s = seats.find((x) => x.player_id === id);
    return { id, name: s.name, isBot: s.is_bot, color: COLORS[i], pawn: i, connected: s.is_bot || now - Date.parse(s.last_seen) < 3e4 };
  });
}
async function broadcast(messages) {
  if (!messages.length) return;
  const res = await fetch(`${SUPA}/realtime/v1/api/broadcast`, {
    method: "POST",
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messages: messages.map((m) => ({ ...m, private: false })) })
  });
  if (!res.ok) console.error("broadcast", res.status, await res.text());
}
async function pushGame(seats, state, version, events) {
  const info = seatInfo(seats, state);
  await broadcast(
    seats.filter((s) => !s.is_bot && s.channel).map((s) => ({
      topic: s.channel,
      event: "update",
      payload: { kind: "game", version, view: viewFor(state, s.player_id), events: eventsFor(events, s.player_id), seats: info, serverNow: Date.now() }
    }))
  );
}
async function pushLobby(room, seats) {
  const info = seatInfo(seats, null);
  await broadcast(seats.filter((s) => !s.is_bot && s.channel).map((s) => ({ topic: s.channel, event: "update", payload: { kind: "lobby", room: publicRoom(room), seats: info } })));
}
var publicRoom = (r) => ({ code: r.code, host: r.host_player, status: r.status, maxPlayers: r.max_players, fillBots: r.fill_bots });
async function loadGame(code) {
  const { game } = await loadAll(code);
  if (!game) throw new HttpError(409, "La partie n'a pas commenc\xE9");
  return game;
}
async function commit(code, row, cmd, cmdId, nextBotAt) {
  const r = applyCommand(row.state, cmd, { rng: cryptoRng(), now: Date.now() });
  if (!r.ok) return { ok: false, error: r.error, code: r.code };
  const processed = cmdId ? [...row.processed.slice(-60), cmdId] : row.processed;
  const v = await rpc("srv_game_update", { p_code: code, p_version: row.version, p_state: r.state, p_processed: processed, p_next_bot_at: nextBotAt ?? row.next_bot_at, p_finished: r.state.phase === "FINISHED" });
  if (v === null) return { ok: false, error: "conflict", code: "CONFLICT" };
  return { ok: true, state: r.state, version: row.version + 1, events: r.events };
}
function deciders(s) {
  if (s.phase === "FINISHED") return [];
  if (s.phase === "AUCTION") return [...s.auction.activeBidders];
  if (s.phase === "TRADE_PENDING") return [s.trade.toId];
  return [s.turnOrder[s.activeIndex]];
}
async function automate(code, seats) {
  const row = await loadGame(code);
  const s = row.state;
  const now = Date.now();
  if (s.phase === "FINISHED") return false;
  const arbiter = s.turnOrder[s.activeIndex];
  let cmd = null;
  if (s.phase === "AUCTION" && s.auction && now >= s.auction.deadline) cmd = { type: "CLOSE_AUCTION", playerId: arbiter };
  else if (s.phase === "TRADE_PENDING" && s.trade && now >= s.trade.expiresAt) cmd = { type: "EXPIRE_TRADE", playerId: arbiter };
  else if (now >= row.next_bot_at) {
    const auto = new Set(seats.filter((x) => x.is_bot || now - Date.parse(x.last_seen) > AWAY_MS).map((x) => x.player_id));
    const ds = deciders(s).filter((id) => auto.has(id)).sort(() => Math.random() - 0.5);
    const rng = { int: (n) => Math.floor(Math.random() * n) };
    for (const id of ds) {
      const c2 = decide(s, id, PROFILES.balanced, rng, now);
      if (c2) {
        cmd = c2;
        break;
      }
    }
    if (!cmd && s.phase === "AUCTION") {
      const away = ds.find((id) => id !== s.auction.highestBidderId);
      if (away) cmd = { type: "PASS_AUCTION", playerId: away };
    }
  }
  if (!cmd) return false;
  let res = await commit(code, row, cmd, null, now + 800 + Math.floor(Math.random() * 900));
  if (!res.ok && res.code !== "CONFLICT") {
    const fb = fallback(s, now).find((c2) => c2.playerId === cmd.playerId && ["END_TURN", "PASS_AUCTION", "DECLINE_PROPERTY", "PAY_TAX", "ROLL_DICE", "REJECT_TRADE"].includes(c2.type));
    if (fb) res = await commit(code, row, fb, null, now + 800);
  }
  if (res.ok) await pushGame(seats, res.state, res.version, res.events);
  return res.ok;
}
async function handle(body) {
  const action = body.action;
  if (action === "create") {
    const max = body.maxPlayers === 3 ? 3 : 4;
    let code2 = "";
    for (let i = 0; i < 5; i++) {
      code2 = rand(5);
      if (!await rpc("srv_room_exists", { p_code: code2 })) break;
    }
    const playerId = `p_${hex(6)}`;
    const token = hex(24);
    const channel = `deals-${hex(12)}`;
    await rpc("srv_room_create", { p_code: code2, p_host: playerId, p_max: max, p_fill: body.fillBots !== false });
    await rpc("srv_seat_insert", { p_code: code2, p_player: playerId, p_name: cleanName(body.name), p_bot: false, p_token_hash: await sha256(token), p_channel: channel });
    return { code: code2, playerId, token, channel };
  }
  const code = cleanCode(body.code);
  if (code.length !== 5) throw new HttpError(400, "Code de partie invalide");
  if (action === "join") {
    const { room: room2, seats: seats2 } = await loadRoom(code);
    if (room2.status !== "lobby") throw new HttpError(409, "La partie a d\xE9j\xE0 commenc\xE9");
    if (seats2.length >= room2.max_players) throw new HttpError(409, "La partie est compl\xE8te");
    const playerId = `p_${hex(6)}`;
    const token = hex(24);
    const channel = `deals-${hex(12)}`;
    await rpc("srv_seat_insert", { p_code: code, p_player: playerId, p_name: cleanName(body.name), p_bot: false, p_token_hash: await sha256(token), p_channel: channel });
    const after = await loadRoom(code);
    await pushLobby(after.room, after.seats);
    return { code, playerId, token, channel };
  }
  const { room, seats, me } = await auth(code, body.token);
  await touch(code, me.player_id);
  if (action === "lobby") return { room: publicRoom(room), seats: seatInfo(seats, null), me: me.player_id };
  if (action === "start") {
    if (room.host_player !== me.player_id) throw new HttpError(403, "Seul l'h\xF4te peut lancer la partie");
    if (room.status !== "lobby") throw new HttpError(409, "D\xE9j\xE0 lanc\xE9e");
    const all = [...seats];
    if (room.fill_bots) {
      const used = new Set(all.map((s) => s.name));
      const names = BOT_NAMES.filter((n) => !used.has(n));
      while (all.length < room.max_players) {
        const bot = { room_code: code, player_id: `b_${hex(4)}`, name: names.shift() ?? "Bot", is_bot: true, token_hash: null, channel: null };
        await rpc("srv_seat_insert", { p_code: code, p_player: bot.player_id, p_name: bot.name, p_bot: true, p_token_hash: null, p_channel: null });
        all.push({ ...bot, joined_at: (/* @__PURE__ */ new Date()).toISOString(), last_seen: (/* @__PURE__ */ new Date()).toISOString() });
      }
    }
    if (all.length < 3) throw new HttpError(409, "Il faut au moins 3 joueurs (active les bots)");
    const { state, events } = createGame(all.map((s) => ({ id: s.player_id, name: s.name })), { rng: cryptoRng(), now: Date.now() });
    await rpc("srv_game_start", { p_code: code, p_state: state, p_next_bot_at: Date.now() + 1500 });
    await pushGame(all, state, 0, events);
    return { ok: true };
  }
  if (action === "state") {
    if (room.status === "lobby") return { kind: "lobby", room: publicRoom(room), seats: seatInfo(seats, null), me: me.player_id };
    const row = await loadGame(code);
    return { kind: "game", version: row.version, view: viewFor(row.state, me.player_id), events: [], seats: seatInfo(seats, row.state), serverNow: Date.now(), me: me.player_id };
  }
  if (action === "command") {
    const cmd = body.cmd;
    if (!cmd || typeof cmd !== "object" || typeof cmd.type !== "string") throw new HttpError(400, "Commande invalide");
    const cmdId = typeof body.cmdId === "string" ? body.cmdId.slice(0, 64) : null;
    const safe = { ...cmd, playerId: me.player_id };
    for (let attempt = 0; attempt < 4; attempt++) {
      const row = await loadGame(code);
      if (cmdId && row.processed.includes(cmdId)) return { ok: true, duplicate: true };
      const res = await commit(code, row, safe, cmdId);
      if (res.ok) {
        await pushGame(seats, res.state, res.version, res.events);
        return { ok: true, version: res.version };
      }
      if (res.code !== "CONFLICT") return { ok: false, error: res.error, code: res.code };
    }
    throw new HttpError(409, "Partie tr\xE8s sollicit\xE9e, r\xE9essaie");
  }
  if (action === "tick") {
    if (room.status !== "playing") return { ok: true };
    const changed = await automate(code, seats);
    return { ok: true, changed, serverNow: Date.now() };
  }
  throw new HttpError(400, "Action inconnue");
}
async function selftest() {
  const checks = {};
  const t0 = Date.now();
  const A = await handle({ action: "create", name: "Autotest A", maxPlayers: 3, fillBots: true });
  checks.create = /^[A-Z0-9]{5}$/.test(A.code);
  const B = await handle({ action: "join", code: A.code, name: "Autotest B" });
  checks.join = typeof B.token === "string";
  try {
    await handle({ action: "start", code: A.code, token: B.token });
    checks.nonHostCannotStart = false;
  } catch (e) {
    checks.nonHostCannotStart = e instanceof HttpError && e.status === 403;
  }
  checks.start = (await handle({ action: "start", code: A.code, token: A.token })).ok === true;
  const sa = await handle({ action: "state", code: A.code, token: A.token });
  const sbv = await handle({ action: "state", code: A.code, token: B.token });
  checks.seats = sa.seats.length === 3 && sa.seats.filter((x) => x.isBot).length === 1;
  const others = (v, me) => Object.entries(v.players).filter(([id]) => id !== me);
  checks.noLeak = others(sa.view, A.playerId).every(([, p]) => p.hand.length === 0 && p.objectiveId === 0) && !("deck" in sa.view) && others(sbv.view, B.playerId).every(([, p]) => p.objectiveId === 0);
  const active = sa.view.turnOrder[sa.view.activeIndex];
  const tokenOf = active === A.playerId ? A.token : active === B.playerId ? B.token : null;
  if (tokenOf) {
    const r = await handle({ action: "command", code: A.code, token: tokenOf, cmd: { type: "ROLL_DICE" }, cmdId: "selftest-1" });
    const d = await handle({ action: "command", code: A.code, token: tokenOf, cmd: { type: "ROLL_DICE" }, cmdId: "selftest-1" });
    checks.command = r.ok === true;
    checks.idempotent = d.duplicate === true;
  } else {
    checks.botTick = (await handle({ action: "tick", code: A.code, token: A.token })).ok === true;
  }
  const after = await handle({ action: "state", code: A.code, token: A.token });
  checks.versionAdvanced = after.version >= 1 || !tokenOf;
  const bc = await fetch(`${SUPA}/realtime/v1/api/broadcast`, { method: "POST", headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ topic: "deals-selftest", event: "update", payload: {}, private: false }] }) });
  checks.realtime = bc.status;
  checks.ms = Date.now() - t0;
  checks.room = A.code;
  return checks;
}
async function serve(req) {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method === "GET") {
    const key = new URL(req.url).searchParams.get("selftest");
    if (key !== "088e386f0d42") return new Response("", { status: 405 });
    try {
      return new Response(JSON.stringify(await selftest()), { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
    } catch (e) {
      return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }
  try {
    if (req.method !== "POST") throw new HttpError(405, "POST attendu");
    const raw = await req.text();
    if (raw.length > 2e4) throw new HttpError(413, "Requ\xEAte trop grande");
    const body = JSON.parse(raw);
    const out = await handle(body);
    return new Response(JSON.stringify(out), { headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    const message = e instanceof HttpError ? e.message : "Erreur serveur";
    if (!(e instanceof HttpError)) console.error(e);
    return new Response(JSON.stringify({ error: message }), { status, headers: { ...CORS, "Content-Type": "application/json" } });
  }
}

// server/entry.ts
var POST = serve;
var OPTIONS = serve;
var GET = serve;
export {
  GET,
  OPTIONS,
  POST
};
