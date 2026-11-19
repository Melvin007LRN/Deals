/**
 * DEALS — moteur de règles pur et déterministe.
 * applyCommand(state, command, ctx) -> { state, events } | erreur.
 * Aucune dépendance DOM/réseau. Toute commande refusée laisse l'état intact (travail sur une copie).
 */
import { BOARD, DISTRICTS, PROPERTY_INDICES, districtOf, districtProperties, priceOf, space, type DistrictId } from "./content/board.ts";
import { CARDS, card, cardCost, type CardDef } from "./content/cards.ts";
import { OBJECTIVES, objective } from "./content/objectives.ts";
import {
  BUILDING_COSTS,
  CHOICE_CREDITS,
  MOVEMENT_DIE,
  RENT_MULT_HALVES,
  RESOURCE_DIE,
  RESOURCE_FACE_CREDITS,
  RULES,
  RULES_VERSION,
} from "./content/rules.ts";
import { shuffle } from "./rng.ts";
import type {
  ActiveEffect,
  ApplyResult,
  Bundle,
  Command,
  Ctx,
  EffectKind,
  Expiry,
  GameEvent,
  GameState,
  Phase,
  PlayerId,
  PlayerState,
  PropertyState,
  ResourceKind,
  RuleConfig,
  ScoreLine,
  TurnFlags,
} from "./types.ts";

/** Règles d'origine du dossier V2.5 (référence de comparaison). */
export const OFFICIAL_CONFIG: RuleConfig = {
  movementDie: [...MOVEMENT_DIE],
  startReward: RULES.startReward,
  drawOnStart: false,
  turnIncome: 0,
  seatBonus: [0, 0, 0, 0],
  seatBonusByCount: {},
  resourceScore: 10,
};

/**
 * Règles par défaut v1.1 = variante V9, validée par le créateur le 19/11/2026
 * (docs/simulations/variantes_10000.md) : dé 1-2-2-3-3-4, carte au passage de Départ,
 * +10 D au début de chaque tour, compensation de siège +0/+20/+40/+60 D.
 */
export const DEFAULT_CONFIG: RuleConfig = {
  movementDie: [1, 2, 2, 3, 3, 4],
  startReward: RULES.startReward,
  drawOnStart: true,
  turnIncome: 10,
  seatBonus: [0, 20, 40, 60],
  // réglage fin validé le 19/11/2026 (docs/simulations/sieges_10000.md)
  seatBonusByCount: { 3: [0, 40, 60], 4: [0, 30, 50, 70] },
  // validé le 19/11/2026 (docs/simulations/ressources_3000.md)
  resourceScore: 5,
};

export class RuleError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

const fail = (code: string, msg: string): never => {
  throw new RuleError(code, msg);
};

interface G {
  s: GameState;
  ctx: Ctx;
  ev: GameEvent[];
}

function emit(g: G, type: string, data: Record<string, unknown> = {}, playerId?: PlayerId, privateTo?: PlayerId): void {
  g.s.eventSeq += 1;
  const e: GameEvent = { seq: g.s.eventSeq, type, data };
  if (playerId !== undefined) e.playerId = playerId;
  if (privateTo !== undefined) e.privateTo = privateTo;
  g.ev.push(e);
}

/* ------------------------------------------------------------------ */
/* Accès                                                               */
/* ------------------------------------------------------------------ */

export function activePlayerId(s: GameState): PlayerId {
  const id = s.turnOrder[s.activeIndex];
  if (id === undefined) throw new Error("no active player");
  return id;
}

function player(s: GameState, id: PlayerId): PlayerState {
  const p = s.players[id];
  if (!p) return fail("UNKNOWN_PLAYER", `Joueur inconnu : ${id}`);
  return p;
}

function prop(s: GameState, index: number): PropertyState {
  const p = s.properties[index];
  if (!p) return fail("NOT_A_PROPERTY", `La case ${index} n'est pas une propriété`);
  return p;
}

function freshTurn(): TurnFlags {
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
    landed: false,
  };
}

export function ownedCount(s: GameState, playerId: PlayerId, d: DistrictId): number {
  return districtProperties(d).filter((i) => s.properties[i]?.ownerId === playerId).length;
}

function influence(s: GameState, playerId: PlayerId, d: DistrictId): number {
  return s.effects.filter((e) => e.kind === "influence" && e.sourceId === playerId && e.district === d).length;
}

/** Contrôle réel (propriété ≥ 2/3). C'est celui qui compte pour le score et les loyers. */
export function controls(s: GameState, playerId: PlayerId, d: DistrictId): boolean {
  return ownedCount(s, playerId, d) >= RULES.districtMajority;
}

/** Contrôle incluant l'influence temporaire (R08) : construction et bonus pendant son tour. */
export function controlsWithInfluence(s: GameState, playerId: PlayerId, d: DistrictId): boolean {
  return ownedCount(s, playerId, d) + influence(s, playerId, d) >= RULES.districtMajority;
}

export function districtController(s: GameState, d: DistrictId): PlayerId | null {
  for (const id of s.turnOrder) if (controls(s, id, d)) return id;
  return null;
}

/** Bénéficiaire des bonus économiques d'un quartier (contrôle réel prioritaire, puis influence du joueur actif). */
function bonusHolder(s: GameState, d: DistrictId): PlayerId | null {
  const real = districtController(s, d);
  if (real) return real;
  if (s.phase === "FINISHED") return null;
  const a = activePlayerId(s);
  return controlsWithInfluence(s, a, d) ? a : null;
}

function reformFactor(s: GameState, d: DistrictId): number {
  return s.effects.some((e) => e.kind === "reform" && e.district === d) ? 2 : 1;
}

function hasBonus(s: GameState, playerId: PlayerId, d: DistrictId): boolean {
  return bonusHolder(s, d) === playerId;
}

function findEffect(s: GameState, pred: (e: ActiveEffect) => boolean): ActiveEffect | undefined {
  return s.effects.find(pred);
}

function removeEffect(s: GameState, id: number): void {
  s.effects = s.effects.filter((e) => e.id !== id);
}

function addEffect(g: G, e: Omit<ActiveEffect, "id">): ActiveEffect {
  const full: ActiveEffect = { ...e, id: g.s.nextEffectId++ };
  g.s.effects.push(full);
  emit(g, "EFFECT_ADDED", { effect: full });
  return full;
}

function replaceEffect(g: G, kind: EffectKind, match: (e: ActiveEffect) => boolean, e: Omit<ActiveEffect, "id">): void {
  for (const old of g.s.effects.filter((x) => x.kind === kind && match(x))) {
    removeEffect(g.s, old.id);
    emit(g, "EFFECT_REPLACED", { effectId: old.id, kind });
  }
  addEffect(g, e);
}

function expire(g: G, test: (x: Expiry) => boolean): void {
  const gone = g.s.effects.filter((e) => test(e.expiry));
  if (!gone.length) return;
  g.s.effects = g.s.effects.filter((e) => !test(e.expiry));
  for (const e of gone) emit(g, "EFFECT_EXPIRED", { effectId: e.id, kind: e.kind });
}

/* ------------------------------------------------------------------ */
/* Ressources                                                          */
/* ------------------------------------------------------------------ */

function cap(kind: "materials" | "energy"): number {
  return kind === "materials" ? RULES.maxMaterials : RULES.maxEnergy;
}

/** Gagne 1 ressource ; au plafond, conversion en +5 D (cartes et bonus). */
function gainResource(g: G, p: PlayerState, kind: "materials" | "energy", n: number, reason: string): void {
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

function gainCredits(g: G, p: PlayerState, amount: number, reason: string): void {
  if (amount <= 0) return;
  p.credits += amount;
  emit(g, "CREDITS_GAINED", { amount, reason }, p.id);
}

/* ------------------------------------------------------------------ */
/* Paiements, liquidation, redressement                                */
/* ------------------------------------------------------------------ */

export function mortgageValue(index: number): number {
  return Math.floor((priceOf(index) * RULES.mortgagePercent) / 100);
}

export function redeemValue(index: number): number {
  return Math.ceil((priceOf(index) * RULES.mortgageRedeemPercent) / 100);
}

/** Revente d'un niveau : 50 % des crédits réellement payés pour ce niveau. */
export function buildingResale(pr: PropertyState): number {
  const paid = pr.levelPaid[pr.level - 1] ?? 0;
  return Math.floor((paid * RULES.buildingResalePercent) / 100);
}

export function inRecovery(p: PlayerState): boolean {
  return p.recoveryResolveTurn !== null;
}

function sellBuildingRaw(g: G, p: PlayerState, pr: PropertyState, reason: string): void {
  const refund = buildingResale(pr);
  const paid = pr.levelPaid.pop() ?? 0;
  pr.level = (pr.level - 1) as 0 | 1 | 2;
  pr.buildingCredits -= paid;
  p.credits += refund;
  emit(g, "BUILDING_SOLD", { propertyIndex: pr.index, newLevel: pr.level, refund, reason }, p.id);
}

function mortgageRaw(g: G, p: PlayerState, pr: PropertyState, reason: string): void {
  pr.mortgaged = true;
  const v = mortgageValue(pr.index);
  p.credits += v;
  emit(g, "PROPERTY_MORTGAGED", { propertyIndex: pr.index, amount: v, reason }, p.id);
}

/** Liquidation automatique dans l'ordre : ressources → bâtiments → hypothèques (DECISIONS C, brief 14-15). */
function liquidate(g: G, p: PlayerState, needed: number): void {
  for (const kind of ["materials", "energy"] as const) {
    while (p.credits < needed && p[kind] > 0) {
      p[kind] -= 1;
      p.credits += RULES.marketSell;
      emit(g, "RESOURCE_SOLD", { kind, amount: RULES.marketSell, reason: "liquidation" }, p.id);
    }
  }
  while (p.credits < needed) {
    const built = PROPERTY_INDICES.map((i) => prop(g.s, i))
      .filter((x) => x.ownerId === p.id && x.level > 0)
      .sort((a, b) => b.level - a.level || priceOf(a.index) - priceOf(b.index));
    const target = built[0];
    if (!target) break;
    sellBuildingRaw(g, p, target, "liquidation");
  }
  while (p.credits < needed) {
    const free = PROPERTY_INDICES.map((i) => prop(g.s, i))
      .filter((x) => x.ownerId === p.id && x.level === 0 && !x.mortgaged)
      .sort((a, b) => priceOf(a.index) - priceOf(b.index));
    const target = free[0];
    if (!target) break;
    mortgageRaw(g, p, target, "liquidation");
  }
}

function enterRecovery(g: G, p: PlayerState): void {
  if (inRecovery(p)) return;
  p.recoveryResolveTurn = p.turnsStarted + 1;
  p.credits += RULES.recoveryAdvance;
  p.debt += RULES.recoveryAdvance;
  p.stats.bankruptcies += 1;
  emit(g, "RECOVERY_STARTED", { advance: RULES.recoveryAdvance, resolveTurn: p.recoveryResolveTurn }, p.id);
}

/**
 * Paiement d'une somme due.
 * - mode "landing" (loyer/taxe de case) : liquidation, Réserve d'urgence, puis redressement.
 * - mode "card" (perte causée par une carte) : paie ce qu'il peut, le reste en dette si `debtIfShort`.
 * Retourne le montant effectivement transféré au bénéficiaire.
 */
function charge(
  g: G,
  p: PlayerState,
  amount: number,
  payeeId: PlayerId | null,
  reason: string,
  mode: "landing" | "card" | "voluntary",
  debtIfShort = true,
): number {
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
  if (mode === "voluntary" && p.credits < amount) fail("INSUFFICIENT_FUNDS", "Crédits insuffisants");
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

function autoSettleDebt(g: G, p: PlayerState): void {
  if (p.debt <= 0 || p.credits <= 0) return;
  const x = Math.min(p.debt, p.credits);
  p.debt -= x;
  p.credits -= x;
  emit(g, "DEBT_SETTLED", { amount: x, remaining: p.debt }, p.id);
}

/* ------------------------------------------------------------------ */
/* Loyers                                                              */
/* ------------------------------------------------------------------ */

export function baseRent(price: number): number {
  return 5 * Math.ceil((12 * price) / 500);
}

export interface RentBreakdown {
  base: number;
  level: number;
  districtBonus: boolean;
  crisis: boolean;
  sabotage: boolean;
  receivedMinus: number;
  rentBonus: number;
  total: number;
}

/** Calcul exact en entiers : multiplicateur bâtiment → bonus quartier → crise/sabotage → arrondi au 5 sup. → -10 / +15. */
export function computeRent(s: GameState, index: number): RentBreakdown {
  const pr = prop(s, index);
  const price = priceOf(index);
  const d = districtOf(index);
  const base = baseRent(price);
  const owner = pr.ownerId;
  const districtBonus = owner !== null && controls(s, owner, d);
  const insured = s.effects.some((e) => e.kind === "insurance" && e.propertyIndex === index);
  const crisis = !insured && s.effects.some((e) => e.kind === "districtCrisis" && e.district === d);
  const sabotage = s.effects.some((e) => e.kind === "sabotage" && e.propertyIndex === index);
  const crisisFlat = crisis && s.config.cardRevision === 2;
  const num = base * RENT_MULT_HALVES[pr.level] * (districtBonus ? 11 : 10) * (crisis && !crisisFlat ? 3 : 4) * (sabotage ? 1 : 2);
  const den = 2 * 10 * 4 * 2;
  let total = 5 * Math.ceil(num / (den * 5));
  if (crisisFlat) total = Math.max(0, total - 5);
  const receivedMinus = owner !== null && s.effects.some((e) => e.kind === "rentReceivedMinus" && e.targetPlayerId === owner) ? 10 : 0;
  total = Math.max(0, total - receivedMinus);
  const rentBonus = s.effects.some((e) => e.kind === "rentBonus" && e.propertyIndex === index) ? 15 : 0;
  total += rentBonus;
  return { base, level: pr.level, districtBonus, crisis, sabotage, receivedMinus, rentBonus, total };
}

function payRent(g: G, payer: PlayerState, index: number): void {
  const pr = prop(g.s, index);
  const ownerId = pr.ownerId;
  if (!ownerId || ownerId === payer.id || pr.mortgaged) return;
  const r = computeRent(g.s, index);
  // consommation des effets "prochain loyer"
  const consume = (pred: (e: ActiveEffect) => boolean) => {
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
    // révision 1 : l'assurance protège contre la crise et est consommée ; révision 2 : non consommée
    if (g.s.config.cardRevision !== 2) consume((e) => e.kind === "insurance" && e.propertyIndex === index);
  }
  const owner = player(g.s, ownerId);
  const due = Math.max(0, r.total - (payer.id === activePlayerId(g.s) ? g.s.turn.rentReduction : 0));
  if (due !== r.total) emit(g, "RENT_REDUCED", { amount: r.total - due, reason: "vote_municipal" }, payer.id);
  const paid = charge(g, payer, due, ownerId, "rent", "landing");
  payer.stats.rentPaid += paid;
  owner.stats.rentReceived += paid;
  emit(g, "RENT_PAID", { propertyIndex: index, ownerId, amount: paid, breakdown: r }, payer.id);
  // Bonus Commercial : +5 D au contrôleur quand un adversaire paie un loyer dans le quartier
  const d = districtOf(index);
  if (d === "commercial" && paid > 0) {
    const holder = districtController(g.s, d);
    if (holder && holder !== payer.id) {
      gainCredits(g, player(g.s, holder), RULES.bonusCommercialRent * reformFactor(g.s, d), "bonus_commercial");
    }
  }
}

/* ------------------------------------------------------------------ */
/* Création de partie                                                   */
/* ------------------------------------------------------------------ */

export interface NewPlayer {
  id: PlayerId;
  name: string;
}

export function createGame(players: NewPlayer[], ctx: Ctx, configOverride: Partial<RuleConfig> = {}): { state: GameState; events: GameEvent[] } {
  const config: RuleConfig = { ...DEFAULT_CONFIG, ...configOverride };
  if (!config.movementDie.length || config.movementDie.some((m) => !Number.isInteger(m) || m < 1 || m > 6)) {
    throw new RuleError("INVALID_CONFIG", "Dé de mouvement invalide");
  }
  if (players.length < RULES.playersMin || players.length > RULES.playersMax) {
    throw new RuleError("PLAYER_COUNT", `Il faut entre ${RULES.playersMin} et ${RULES.playersMax} joueurs`);
  }
  const ids = new Set(players.map((p) => p.id));
  if (ids.size !== players.length) throw new RuleError("DUPLICATE_PLAYER", "Identifiants de joueurs en double");
  const order = shuffle(players.map((p) => p.id), ctx.rng);
  const objectiveIds = shuffle(OBJECTIVES.map((o) => o.id), ctx.rng);
  // identifiants d'instances opaques : l'id d'instance ne révèle pas la carte
  const instanceIds = shuffle(CARDS.map((_, i) => 1000 + i * 7 + ctx.rng.int(7)), ctx.rng);
  const cardInstances: Record<number, number> = {};
  CARDS.forEach((c, i) => {
    cardInstances[instanceIds[i]!] = c.id;
  });
  const deck = shuffle(Object.keys(cardInstances).map(Number), ctx.rng);
  const seatBonus = config.seatBonusByCount?.[order.length as 3 | 4] ?? config.seatBonus;
  const ps: Record<PlayerId, PlayerState> = {};
  order.forEach((id, seat) => {
    const np = players.find((p) => p.id === id)!;
    ps[id] = {
      id,
      name: np.name,
      seat,
      position: config.spreadStart ? Math.floor((seat * RULES.boardSize) / order.length) : 0,
      credits: RULES.startingCredits + (seatBonus[seat] ?? 0),
      materials: RULES.startingMaterials,
      energy: RULES.startingEnergy,
      debt: 0,
      hand: [],
      objectiveId: objectiveIds[seat]!,
      turnsStarted: 0,
      recoveryResolveTurn: null,
      stats: { trades: 0, auctionsWon: 0, cardsPlayed: 0, cardsDrawn: 0, rentPaid: 0, rentReceived: 0, bankruptcies: 0 },
    };
  });
  const properties: Record<number, PropertyState> = {};
  for (const i of PROPERTY_INDICES) properties[i] = { index: i, ownerId: null, level: 0, mortgaged: false, buildingCredits: 0, levelPaid: [], lastRealtyAttackRound: 0 };
  const s: GameState = {
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
    scores: null,
  };
  const g: G = { s, ctx, ev: [] };
  emit(g, "GAME_CREATED", { order, rulesVersion: RULES_VERSION });
  for (const id of order) emit(g, "OBJECTIVE_DEALT", { objectiveId: ps[id]!.objectiveId }, id, id);
  beginTurn(g);
  return { state: s, events: g.ev };
}

/* ------------------------------------------------------------------ */
/* Tours                                                               */
/* ------------------------------------------------------------------ */

function beginTurn(g: G): void {
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
  // Bonus Industriel : +1 Matériau une fois par manche (au début du tour du contrôleur)
  if (districtController(s, "industrial") === p.id) {
    gainResource(g, p, "materials", RULES.bonusIndustrialMaterials * reformFactor(s, "industrial"), "bonus_industrial");
  }
}

function endTurn(g: G): void {
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

function finishRecovery(g: G, p: PlayerState): void {
  p.recoveryResolveTurn = null;
  emit(g, "RECOVERY_ENDED", { remainingDebt: p.debt }, p.id);
}

function continueForcedSale(g: G): void {
  const s = g.s;
  const q = s.forcedSaleQueue;
  if (!q) return;
  const p = player(s, q.playerId);
  autoSettleDebt(g, p);
  const next = q.indices.find((i) => prop(s, i).ownerId === p.id);
  if (p.debt <= 0 || next === undefined) {
    s.forcedSaleQueue = null;
    finishRecovery(g, p);
    advanceTurn(g);
    return;
  }
  q.indices = q.indices.filter((i) => i !== next);
  const pr = prop(s, next);
  let start: number;
  if (pr.mortgaged) {
    // la propriété hypothéquée est levée par la banque sur le produit : départ au prix de levée
    start = floor5(Math.max(redeemValue(next), Math.floor((priceOf(next) + pr.buildingCredits) / 2)));
  } else {
    start = floor5(Math.floor((priceOf(next) + pr.buildingCredits) / 2));
  }
  startAuction(g, next, "forced", start, p.id, "MANAGE", [p.id]);
}

function advanceTurn(g: G): void {
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

function floor5(n: number): number {
  return Math.max(0, 5 * Math.floor(n / 5));
}

/* ------------------------------------------------------------------ */
/* Dés, déplacement, arrivée                                           */
/* ------------------------------------------------------------------ */

function rollDice(g: G, p: PlayerState): void {
  const die = g.s.config.movementDie;
  const movement = die[g.ctx.rng.int(die.length)]!;
  const face = RESOURCE_DIE[g.ctx.rng.int(RESOURCE_DIE.length)]!;
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

export function resourceChoices(s: GameState, p: PlayerState): ResourceKind[] {
  const pr = s.pendingResource;
  const out: ResourceKind[] = ["credits"];
  for (const k of ["materials", "energy"] as const) if (p[k] < cap(k) && pr?.blocked !== k) out.push(k);
  return out;
}

function moveAndLand(g: G, p: PlayerState): void {
  const s = g.s;
  const steps = s.lastRoll!.movement;
  const from = p.position;
  const path: number[] = [];
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

function resolveLanding(g: G, p: PlayerState): void {
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
      // R11 : pile d'événements non validée — case neutre en v1.0 (défaut temporaire C)
      emit(g, "EVENT_SPACE_NEUTRAL", {}, p.id);
      s.phase = "MANAGE";
      return;
    case "start":
    default:
      s.phase = "MANAGE";
  }
}

/** Pioche directe d'une carte en main (variante drawOnStart). Main pleine : rien. */
function drawToHand(g: G, p: PlayerState): void {
  const s = g.s;
  if (p.hand.length >= RULES.maxHand) return;
  if (s.deck.length === 0 && s.discard.length > 0) {
    s.deck.push(...shuffle(s.discard.splice(0), g.ctx.rng));
    emit(g, "DECK_RESHUFFLED", { size: s.deck.length });
  }
  const inst = s.deck.shift();
  if (inst === undefined) return;
  p.hand.push(inst);
  p.stats.cardsDrawn += 1;
  emit(g, "START_CARD_DRAWN", { handSize: p.hand.length }, p.id);
  emit(g, "CARD_KEPT_PRIVATE", { instanceId: inst, cardId: s.cardInstances[inst] }, p.id, p.id);
}

function drawChance(g: G, p: PlayerState): void {
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

/* ------------------------------------------------------------------ */
/* Enchères                                                             */
/* ------------------------------------------------------------------ */

function startAuction(
  g: G,
  index: number,
  reason: "declined" | "attack" | "forced",
  startPrice: number,
  beneficiaryId: PlayerId | null,
  resume: Phase,
  excluded: PlayerId[] = [],
): void {
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
    resume,
  };
  s.phase = "AUCTION";
  emit(g, "AUCTION_STARTED", { propertyIndex: index, reason, startPrice, bidders, deadline: s.auction.deadline });
  checkAuctionEnd(g);
}

export function minBid(s: GameState): number {
  const a = s.auction;
  if (!a) return 0;
  return a.currentBid === null ? a.startPrice : a.currentBid + RULES.auctionIncrement;
}

function checkAuctionEnd(g: G, timedOut = false): void {
  const a = g.s.auction;
  if (!a) return;
  const others = a.activeBidders.filter((id) => id !== a.highestBidderId);
  if (timedOut || others.length === 0) closeAuction(g);
}

function closeAuction(g: G): void {
  const s = g.s;
  const a = s.auction!;
  const pr = prop(s, a.propertyIndex);
  s.auction = null;
  if (a.highestBidderId && a.currentBid !== null) {
    const w = player(s, a.highestBidderId);
    let price = a.currentBid;
    if (hasBonus(s, w.id, "business")) price = Math.max(0, price - RULES.bonusBusinessAuctionDiscount * reformFactor(s, "business"));
    if (a.reason === "forced" && pr.mortgaged) {
      // la banque est remboursée de l'hypothèque sur le produit
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
      // aucun enchérisseur : la banque rachète à la valeur d'hypothèque (+ bâtiments à 50 %)
      const seller = player(s, a.beneficiaryId!);
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

/* ------------------------------------------------------------------ */
/* Construction                                                         */
/* ------------------------------------------------------------------ */

export function buildCost(s: GameState, playerId: PlayerId, index: number): { credits: number; materials: number; energy: number } {
  const pr = prop(s, index);
  const next = (pr.level + 1) as 1 | 2 | 3;
  const base = BUILDING_COSTS[next];
  let credits = base.credits - s.turn.buildDiscount;
  if (!s.turn.residentialDiscountUsed && hasBonus(s, playerId, "residential")) {
    credits -= RULES.bonusResidentialBuildDiscount * reformFactor(s, "residential");
  }
  return { credits: Math.max(0, credits), materials: base.materials, energy: base.energy };
}

export function canBuild(s: GameState, playerId: PlayerId, index: number): string | null {
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
  const c = buildCost(s, playerId, index);
  if (p.credits < c.credits || p.materials < c.materials || p.energy < c.energy) return "INSUFFICIENT_RESOURCES";
  return null;
}

/* ------------------------------------------------------------------ */
/* Cartes                                                               */
/* ------------------------------------------------------------------ */

type PlayCmd = Extract<Command, { type: "PLAY_CARD" }>;

const PHASES_FOR_CARDS: Phase[] = ["PRE_ROLL", "BUY_DECISION", "TAX_DUE", "MANAGE"];

/** Valide sans muter. Retourne null si jouable, sinon code d'erreur. */
export function canPlayCard(s: GameState, cmd: PlayCmd): string | null {
  const p = s.players[cmd.playerId];
  if (!p) return "UNKNOWN_PLAYER";
  if (s.turnOrder[s.activeIndex] !== p.id) return "NOT_YOUR_TURN";
  if (!PHASES_FOR_CARDS.includes(s.phase)) return "WRONG_PHASE";
  if (s.turn.cardPlayed) return "CARD_ALREADY_PLAYED";
  if (!p.hand.includes(cmd.instanceId)) return "CARD_NOT_IN_HAND";
  const cardId = s.cardInstances[cmd.instanceId];
  if (cardId === undefined) return "UNKNOWN_CARD";
  const def = card(cardId);
  const cost = cardCost(def, s.config.cardRevision ?? 1);
  if (p.materials < cost.materials || p.energy < cost.energy) return "INSUFFICIENT_RESOURCES";
  if (def.attack && inRecovery(p)) return "IN_RECOVERY";
  if (def.attack === "realty" && s.phase !== "PRE_ROLL" && s.phase !== "MANAGE") return "WRONG_PHASE";
  const isOpp = (id?: PlayerId) => id !== undefined && id !== p.id && s.players[id] !== undefined;
  switch (def.target) {
    case "opponent":
      if (!isOpp(cmd.targetPlayerId)) return "INVALID_TARGET";
      break;
    case "ownProperty": {
      const pr = cmd.propertyIndex === undefined ? undefined : s.properties[cmd.propertyIndex];
      if (!pr || pr.ownerId !== p.id) return "INVALID_TARGET";
      break;
    }
    case "opponentProperty": {
      const pr = cmd.propertyIndex === undefined ? undefined : s.properties[cmd.propertyIndex];
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
      const mine = cmd.propertyIndex === undefined ? undefined : s.properties[cmd.propertyIndex];
      const theirs = cmd.otherPropertyIndex === undefined ? undefined : s.properties[cmd.otherPropertyIndex];
      if (!mine || !theirs || mine.ownerId !== p.id || theirs.ownerId === null || theirs.ownerId === p.id) return "INVALID_TARGET";
      if (mine.level > 0 || theirs.level > 0 || mine.mortgaged || theirs.mortgaged) return "INVALID_TARGET";
      if (Math.abs(priceOf(mine.index) - priceOf(theirs.index)) > 10) return "VALUE_MISMATCH";
      break;
    }
    case "none":
      break;
  }
  // contraintes spécifiques
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

/** Résolution des protections, dans l'ordre R09. Retourne true si l'attaque est bloquée. */
function attackBlocked(g: G, attacker: PlayerState, def: CardDef, targetId: PlayerId, propertyIndex?: number): boolean {
  const s = g.s;
  const ignoreAll = def.key === "opa_hostile";
  const block = (by: string, effectId?: number) => {
    if (effectId !== undefined) removeEffect(s, effectId);
    emit(g, "ATTACK_BLOCKED", { cardId: def.id, by, targetId, propertyIndex }, attacker.id);
    return true;
  };
  if (ignoreAll) return false;
  if (propertyIndex !== undefined) {
    if (def.attack === "realty") {
      if (s.effects.some((e) => e.kind === "legalProtection" && e.propertyIndex === propertyIndex)) return block("legalProtection");
      const ri = findEffect(s, (e) => e.kind === "realtyInsurance" && e.propertyIndex === propertyIndex);
      if (ri) return block("realtyInsurance", ri.id);
    }
    if (def.key === "sabotage" || (def.key === "greve" && s.config.cardRevision === 2)) {
      const ins = findEffect(s, (e) => e.kind === "insurance" && e.propertyIndex === propertyIndex);
      if (ins) return block("insurance", s.config.cardRevision === 2 ? undefined : ins.id);
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

/** Perte financière causée par une carte : Bouclier financier réduit de 15 D. */
function cardLoss(g: G, target: PlayerState, amount: number, payeeId: PlayerId | null, reason: string, debtIfShort: boolean, capAtCredits: boolean): void {
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

function playCard(g: G, cmd: PlayCmd): void {
  const s = g.s;
  const err = canPlayCard(s, cmd);
  if (err) fail(err, `Carte non jouable : ${err}`);
  const p = player(s, cmd.playerId);
  const def = card(s.cardInstances[cmd.instanceId]!);
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
    resource: cmd.resource,
  }, p.id);

  const nextOwnTurn = p.turnsStarted + 1;
  const targetOwnerId = cmd.propertyIndex !== undefined ? s.properties[cmd.propertyIndex]?.ownerId ?? undefined : undefined;
  const attackTarget = def.target === "opponentProperty" ? targetOwnerId : cmd.targetPlayerId;

  if (def.attack && attackTarget) {
    if (def.attack === "realty") prop(s, cmd.propertyIndex!).lastRealtyAttackRound = s.round;
    if (attackBlocked(g, p, def, attackTarget, def.target === "opponentProperty" ? cmd.propertyIndex : undefined)) return;
  }

  switch (def.key) {
    case "placement_malin":
      s.turn.buildDiscount = 10;
      break;
    case "coup_de_pouce":
      gainCredits(g, p, 20, def.key);
      break;
    case "rendement_bonus":
      replaceEffect(g, "rentBonus", (e) => e.propertyIndex === cmd.propertyIndex, { kind: "rentBonus", sourceId: p.id, propertyIndex: cmd.propertyIndex!, expiry: { kind: "roundEnd", round: s.round + 1 } });
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
      s.turn.taxReduction = 10;
      if (s.config.cardRevision === 2) s.turn.rentReduction = 10;
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
      replaceEffect(g, "sabotage", (e) => e.propertyIndex === cmd.propertyIndex, { kind: "sabotage", sourceId: p.id, propertyIndex: cmd.propertyIndex!, expiry: { kind: "roundEnd", round: s.round + 1 } });
      break;
    case "pression_fiscale":
      cardLoss(g, player(s, attackTarget!), 15, null, def.key, true, false);
      break;
    case "greve": {
      const owner = player(s, targetOwnerId!);
      replaceEffect(g, "noUpgrade", (e) => e.propertyIndex === cmd.propertyIndex, { kind: "noUpgrade", sourceId: p.id, propertyIndex: cmd.propertyIndex!, targetPlayerId: owner.id, expiry: { kind: "turnEnd", playerId: owner.id, turn: owner.turnsStarted + 1 } });
      break;
    }
    case "inspection":
    case "fraude_commerciale": {
      const t = player(s, attackTarget!);
      const kind = def.key === "inspection" ? "materials" : "energy";
      if (t[kind] > 0) {
        t[kind] -= 1;
        emit(g, "RESOURCE_LOST", { kind, amount: 1, reason: def.key }, t.id);
      } else cardLoss(g, t, 5, null, def.key, false, true);
      break;
    }
    case "blocage_bancaire": {
      const t = player(s, attackTarget!);
      replaceEffect(g, "noBuy", (e) => e.targetPlayerId === t.id, { kind: "noBuy", sourceId: p.id, targetPlayerId: t.id, expiry: { kind: "turnEnd", playerId: t.id, turn: t.turnsStarted + 1 } });
      break;
    }
    case "detournement":
      cardLoss(g, player(s, attackTarget!), 10, p.id, def.key, false, true);
      break;
    case "concurrence_agressive":
      replaceEffect(g, "rentReceivedMinus", (e) => e.targetPlayerId === attackTarget, { kind: "rentReceivedMinus", sourceId: p.id, targetPlayerId: attackTarget!, expiry: { kind: "roundEnd", round: s.round + 1 } });
      break;
    case "prise_de_controle":
    case "opa_hostile": {
      const pr = prop(s, cmd.propertyIndex!);
      const former = pr.ownerId!;
      pr.ownerId = null;
      emit(g, "PROPERTY_SEIZED", { propertyIndex: pr.index, formerOwnerId: former, level: pr.level }, p.id);
      const start = floor5(Math.floor((priceOf(pr.index) + pr.buildingCredits) / 2));
      startAuction(g, pr.index, "attack", start, former, s.phase);
      break;
    }
    case "crise_locale":
      addEffect(g, { kind: "districtCrisis", sourceId: p.id, district: cmd.district!, expiry: { kind: "turnStart", playerId: p.id, turn: nextOwnTurn } });
      break;
    case "assurance":
      replaceEffect(g, "insurance", (e) => e.propertyIndex === cmd.propertyIndex, { kind: "insurance", sourceId: p.id, propertyIndex: cmd.propertyIndex!, expiry: { kind: "turnStart", playerId: p.id, turn: nextOwnTurn } });
      break;
    case "bouclier_financier":
      replaceEffect(g, "financialShield", (e) => e.targetPlayerId === p.id, { kind: "financialShield", sourceId: p.id, targetPlayerId: p.id, expiry: { kind: "roundEnd", round: s.round + 1 } });
      break;
    case "protection_juridique":
      replaceEffect(g, "legalProtection", (e) => e.propertyIndex === cmd.propertyIndex, { kind: "legalProtection", sourceId: p.id, propertyIndex: cmd.propertyIndex!, expiry: { kind: "turnStart", playerId: p.id, turn: nextOwnTurn } });
      break;
    case "contre_offensive":
      replaceEffect(g, "counterOffensive", (e) => e.targetPlayerId === p.id, { kind: "counterOffensive", sourceId: p.id, targetPlayerId: p.id, expiry: { kind: "turnStart", playerId: p.id, turn: nextOwnTurn } });
      break;
    case "reserve_urgence":
      replaceEffect(g, "emergencyReserve", (e) => e.targetPlayerId === p.id, { kind: "emergencyReserve", sourceId: p.id, targetPlayerId: p.id, expiry: { kind: "turnStart", playerId: p.id, turn: nextOwnTurn } });
      break;
    case "assurance_immobiliere":
      replaceEffect(g, "realtyInsurance", (e) => e.propertyIndex === cmd.propertyIndex, { kind: "realtyInsurance", sourceId: p.id, propertyIndex: cmd.propertyIndex!, expiry: { kind: "turnStart", playerId: p.id, turn: nextOwnTurn } });
      break;
    case "negociateur":
      s.turn.tradeCreditReduction = 10;
      break;
    case "offre_speciale":
      s.turn.specialOffer = true;
      break;
    case "courtier": {
      const k = cmd.resource!;
      p[k] -= 1;
      gainCredits(g, p, 15, def.key);
      emit(g, "RESOURCE_SOLD", { kind: k, amount: 15, reason: def.key }, p.id);
      break;
    }
    case "partenariat": {
      const t = player(s, cmd.targetPlayerId!);
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
      const mine = prop(s, cmd.propertyIndex!);
      const theirs = prop(s, cmd.otherPropertyIndex!);
      const other = theirs.ownerId!;
      mine.ownerId = other;
      theirs.ownerId = p.id;
      emit(g, "PROPERTIES_SWAPPED", { a: mine.index, b: theirs.index, with: other }, p.id);
      break;
    }
    case "influence_locale":
      addEffect(g, { kind: "influence", sourceId: p.id, district: cmd.district!, expiry: { kind: "turnEnd", playerId: p.id, turn: p.turnsStarted } });
      break;
    case "reforme_urbaine":
      replaceEffect(g, "reform", (e) => e.district === cmd.district, { kind: "reform", sourceId: p.id, district: cmd.district!, expiry: { kind: "turnStart", playerId: p.id, turn: nextOwnTurn } });
      break;
    case "magnat":
      gainCredits(g, p, 40, def.key);
      gainResource(g, p, "materials", 1, def.key);
      break;
    default:
      fail("UNIMPLEMENTED_CARD", def.key);
  }
}

/* ------------------------------------------------------------------ */
/* Échanges                                                             */
/* ------------------------------------------------------------------ */

function validBundle(b: Bundle): boolean {
  return (
    [b.credits, b.materials, b.energy].every((n) => Number.isInteger(n) && n >= 0) &&
    Array.isArray(b.properties) &&
    b.properties.every((i) => Number.isInteger(i)) &&
    new Set(b.properties).size === b.properties.length
  );
}

function bundleEmpty(b: Bundle): boolean {
  return b.credits === 0 && b.materials === 0 && b.energy === 0 && b.properties.length === 0;
}

function checkBundleOwned(s: GameState, ownerId: PlayerId, b: Bundle, creditsDue: number): string | null {
  const p = player(s, ownerId);
  if (p.credits < creditsDue || p.materials < b.materials || p.energy < b.energy) return "INSUFFICIENT_RESOURCES";
  for (const i of b.properties) {
    const pr = s.properties[i];
    if (!pr || pr.ownerId !== ownerId) return "NOT_OWNER";
    if (pr.mortgaged) return "MORTGAGED";
  }
  return null;
}

export function tradeCreditsDue(s: GameState, b: Bundle): number {
  return Math.max(0, b.credits - (b.credits > 0 ? s.turn.tradeCreditReduction : 0));
}

function validateTrade(s: GameState, fromId: PlayerId, toId: PlayerId, give: Bundle, receive: Bundle): string | null {
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

function executeTrade(g: G): void {
  const s = g.s;
  const t = s.trade!;
  const err = validateTrade(s, t.fromId, t.toId, t.give, t.receive);
  if (err) fail(err, `Échange devenu invalide : ${err}`);
  const a = player(s, t.fromId);
  const b = player(s, t.toId);
  const giveCredits = tradeCreditsDue(s, t.give);
  a.credits -= giveCredits; b.credits += giveCredits;
  a.materials -= t.give.materials; b.materials += t.give.materials;
  a.energy -= t.give.energy; b.energy += t.give.energy;
  for (const i of t.give.properties) prop(s, i).ownerId = b.id;
  b.credits -= t.receive.credits; a.credits += t.receive.credits;
  b.materials -= t.receive.materials; a.materials += t.receive.materials;
  b.energy -= t.receive.energy; a.energy += t.receive.energy;
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

/* ------------------------------------------------------------------ */
/* Fin de partie et score                                               */
/* ------------------------------------------------------------------ */

function objectiveMet(s: GameState, p: PlayerState, id: number): boolean {
  const owned = PROPERTY_INDICES.map((i) => prop(s, i)).filter((x) => x.ownerId === p.id);
  const ctrl = DISTRICTS.filter((d) => controls(s, p.id, d.id)).length;
  switch (objective(id).key) {
    case "own_3": return owned.length >= 3;
    case "credits_120": return p.credits >= 120;
    case "level_2": return owned.some((x) => x.level >= 2);
    case "trades_2": return p.stats.trades >= 2;
    case "control_1": return ctrl >= 1;
    case "four_districts": return new Set(owned.map((x) => districtOf(x.index))).size >= 4;
    case "auctions_2": return p.stats.auctionsWon >= 2;
    case "cards_3": return p.stats.cardsPlayed >= 3;
    case "control_2": return ctrl >= 2;
    case "level_3": return owned.some((x) => x.level === 3);
    case "downtown_business_built":
      return owned.some((x) => x.level >= 1 && districtOf(x.index) === "downtown") && owned.some((x) => x.level >= 1 && districtOf(x.index) === "business");
    case "clean_6": return p.debt === 0 && owned.length >= 6 && owned.every((x) => !x.mortgaged);
    default: return false;
  }
}

export function computeScores(s: GameState): ScoreLine[] {
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
      _props: owned.length,
    };
  });
  const cmp = (a: (typeof lines)[number], b: (typeof lines)[number]) =>
    b.total - a.total || b.wealth - a.wealth || b._props - a._props || b.credits - a.credits;
  lines.sort(cmp);
  lines.forEach((l, i) => {
    const prev = lines[i - 1];
    l.rank = prev && cmp(prev, l) === 0 ? prev.rank : i + 1;
  });
  return lines.map(({ _props, ...rest }) => rest);
}

function finishGame(g: G): void {
  const s = g.s;
  s.phase = "FINISHED";
  s.scores = computeScores(s);
  emit(g, "GAME_FINISHED", {
    scores: s.scores,
    objectives: Object.fromEntries(s.turnOrder.map((id) => [id, player(s, id).objectiveId])),
  });
}

/* ------------------------------------------------------------------ */
/* Commande                                                             */
/* ------------------------------------------------------------------ */

function requireActive(s: GameState, playerId: PlayerId, phases: Phase[]): PlayerState {
  if (s.phase === "FINISHED") fail("GAME_FINISHED", "La partie est terminée");
  if (activePlayerId(s) !== playerId) fail("NOT_YOUR_TURN", "Ce n'est pas ton tour");
  if (!phases.includes(s.phase)) fail("WRONG_PHASE", `Action impossible pendant la phase ${s.phase}`);
  return player(s, playerId);
}

function dispatch(g: G, cmd: Command): void {
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
      startAuction(g, p.position, "declined", floor5(Math.floor((priceOf(p.position) * RULES.auctionStartPercent) / 100)), null, "MANAGE");
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
      if (!s.pendingDraw.includes(cmd.keep)) fail("INVALID_CHOICE", "Carte non piochée");
      const full = p.hand.length >= RULES.maxHand;
      if (full && (cmd.replace === undefined || !p.hand.includes(cmd.replace))) fail("HAND_FULL", "Main pleine : choisis une carte à remplacer");
      if (!full && cmd.replace !== undefined) fail("INVALID_CHOICE", "Pas de remplacement : la main n'est pas pleine");
      if (full) {
        p.hand = p.hand.filter((i) => i !== cmd.replace);
        s.discard.push(cmd.replace!);
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
      if (s.phase !== "AUCTION" || !a) return fail("WRONG_PHASE", "Aucune enchère en cours");
      if (!a.activeBidders.includes(cmd.playerId)) fail("NOT_BIDDER", "Tu ne participes plus à cette enchère");
      if (a.highestBidderId === cmd.playerId) fail("ALREADY_HIGHEST", "Tu es déjà le meilleur enchérisseur");
      if (g.ctx.now > a.deadline) fail("AUCTION_EXPIRED", "Enchère expirée");
      const p = player(s, cmd.playerId);
      if (!Number.isInteger(cmd.amount) || cmd.amount % RULES.auctionIncrement !== 0) fail("INVALID_AMOUNT", "Montant invalide");
      if (cmd.amount < minBid(s)) fail("BID_TOO_LOW", `Offre minimale : ${minBid(s)} D`);
      if (cmd.amount > p.credits) fail("INSUFFICIENT_FUNDS", "Crédits insuffisants");
      a.currentBid = cmd.amount;
      a.highestBidderId = p.id;
      a.deadline = g.ctx.now + RULES.auctionTimerMs;
      // ceux qui ne peuvent plus surenchérir sortent
      const dropped = a.activeBidders.filter((id) => id !== p.id && player(s, id).credits < cmd.amount + RULES.auctionIncrement);
      a.activeBidders = a.activeBidders.filter((id) => !dropped.includes(id));
      emit(g, "BID_PLACED", { amount: cmd.amount, deadline: a.deadline, dropped }, p.id);
      checkAuctionEnd(g);
      return;
    }
    case "PASS_AUCTION": {
      const a = s.auction;
      if (s.phase !== "AUCTION" || !a) return fail("WRONG_PHASE", "Aucune enchère en cours");
      if (!a.activeBidders.includes(cmd.playerId)) fail("NOT_BIDDER", "Tu ne participes plus à cette enchère");
      if (a.highestBidderId === cmd.playerId) fail("ALREADY_HIGHEST", "Le meilleur enchérisseur ne peut pas passer");
      a.activeBidders = a.activeBidders.filter((id) => id !== cmd.playerId);
      emit(g, "AUCTION_PASSED", {}, cmd.playerId);
      checkAuctionEnd(g);
      return;
    }
    case "CLOSE_AUCTION": {
      const a = s.auction;
      if (s.phase !== "AUCTION" || !a) return fail("WRONG_PHASE", "Aucune enchère en cours");
      if (!s.players[cmd.playerId]) fail("UNKNOWN_PLAYER", "Joueur inconnu");
      if (g.ctx.now < a.deadline) fail("AUCTION_RUNNING", "Le chrono n'est pas terminé");
      emit(g, "AUCTION_TIMEOUT", {});
      checkAuctionEnd(g, true);
      return;
    }
    case "BUILD": {
      const p = requireActive(s, cmd.playerId, ["MANAGE"]);
      const err = canBuild(s, p.id, cmd.propertyIndex);
      if (err) fail(err, `Construction impossible : ${err}`);
      const c = buildCost(s, p.id, cmd.propertyIndex);
      const pr = prop(s, cmd.propertyIndex);
      const usedResidential = !s.turn.residentialDiscountUsed && hasBonus(s, p.id, "residential");
      p.credits -= c.credits;
      p.materials -= c.materials;
      p.energy -= c.energy;
      pr.level = (pr.level + 1) as 1 | 2 | 3;
      pr.buildingCredits += c.credits;
      pr.levelPaid.push(c.credits);
      s.turn.buildsDone += 1;
      s.turn.buildDiscount = 0;
      if (usedResidential) s.turn.residentialDiscountUsed = true;
      emit(g, "BUILT", { propertyIndex: pr.index, level: pr.level, cost: c }, p.id);
      return;
    }
    case "SELL_BUILDING": {
      const p = requireActive(s, cmd.playerId, ["PRE_ROLL", "MANAGE"]);
      const pr = prop(s, cmd.propertyIndex);
      if (pr.ownerId !== p.id) fail("NOT_OWNER", "Propriété non possédée");
      if (pr.level === 0) fail("NO_BUILDING", "Aucun bâtiment");
      sellBuildingRaw(g, p, pr, "voluntary");
      return;
    }
    case "MORTGAGE": {
      const p = requireActive(s, cmd.playerId, ["PRE_ROLL", "MANAGE"]);
      const pr = prop(s, cmd.propertyIndex);
      if (pr.ownerId !== p.id) fail("NOT_OWNER", "Propriété non possédée");
      if (pr.mortgaged) fail("MORTGAGED", "Déjà hypothéquée");
      if (pr.level > 0) fail("HAS_BUILDING", "Vends d'abord les bâtiments");
      mortgageRaw(g, p, pr, "voluntary");
      return;
    }
    case "REDEEM_MORTGAGE": {
      const p = requireActive(s, cmd.playerId, ["PRE_ROLL", "MANAGE"]);
      const pr = prop(s, cmd.propertyIndex);
      if (pr.ownerId !== p.id) fail("NOT_OWNER", "Propriété non possédée");
      if (!pr.mortgaged) fail("NOT_MORTGAGED", "Propriété non hypothéquée");
      if (inRecovery(p)) fail("IN_RECOVERY", "Impossible pendant le redressement");
      charge(g, p, redeemValue(pr.index), null, "redeem", "voluntary");
      pr.mortgaged = false;
      emit(g, "MORTGAGE_REDEEMED", { propertyIndex: pr.index }, p.id);
      return;
    }
    case "BUY_RESOURCE":
    case "SELL_RESOURCE": {
      const p = requireActive(s, cmd.playerId, ["MANAGE"]);
      if (!s.turn.marketAvailable) fail("NO_MARKET", "Le marché n'est accessible que sur la case Marché");
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
      if (p.credits <= 0) fail("INSUFFICIENT_FUNDS", "Crédits insuffisants");
      autoSettleDebt(g, p);
      return;
    }
    case "PLAY_CARD":
      if (s.phase === "FINISHED") fail("GAME_FINISHED", "La partie est terminée");
      playCard(g, cmd);
      return;
    case "PROPOSE_TRADE": {
      const p = requireActive(s, cmd.playerId, ["MANAGE"]);
      if (s.turn.tradeOffers >= RULES.tradeOffersPerTurn) fail("TRADE_LIMIT", "Limite d'offres atteinte");
      const err = validateTrade(s, p.id, cmd.toId, cmd.give, cmd.receive);
      if (err) fail(err, `Échange invalide : ${err}`);
      s.turn.tradeOffers += 1;
      s.trade = {
        id: s.nextTradeId++,
        fromId: p.id,
        toId: cmd.toId,
        give: { ...cmd.give, properties: [...cmd.give.properties] },
        receive: { ...cmd.receive, properties: [...cmd.receive.properties] },
        expiresAt: g.ctx.now + RULES.tradeOfferTtlMs,
      };
      s.phase = "TRADE_PENDING";
      emit(g, "TRADE_PROPOSED", { trade: s.trade, effectiveGiveCredits: tradeCreditsDue(s, cmd.give) }, p.id);
      return;
    }
    case "ACCEPT_TRADE": {
      const t = s.trade;
      if (s.phase !== "TRADE_PENDING" || !t) return fail("WRONG_PHASE", "Aucune offre en attente");
      if (t.toId !== cmd.playerId) fail("NOT_RECIPIENT", "Cette offre ne t'est pas destinée");
      if (g.ctx.now > t.expiresAt) fail("TRADE_EXPIRED", "Offre expirée");
      executeTrade(g);
      return;
    }
    case "REJECT_TRADE": {
      const t = s.trade;
      if (s.phase !== "TRADE_PENDING" || !t) return fail("WRONG_PHASE", "Aucune offre en attente");
      if (t.toId !== cmd.playerId && t.fromId !== cmd.playerId) fail("NOT_PARTY", "Tu n'es pas concerné par cette offre");
      emit(g, t.fromId === cmd.playerId ? "TRADE_CANCELLED" : "TRADE_REJECTED", { tradeId: t.id }, cmd.playerId);
      s.trade = null;
      s.phase = "MANAGE";
      return;
    }
    case "EXPIRE_TRADE": {
      const t = s.trade;
      if (s.phase !== "TRADE_PENDING" || !t) return fail("WRONG_PHASE", "Aucune offre en attente");
      if (g.ctx.now < t.expiresAt) fail("TRADE_RUNNING", "L'offre n'a pas expiré");
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
      const never: never = cmd;
      fail("UNKNOWN_COMMAND", `Commande inconnue ${(never as { type: string }).type}`);
    }
  }
}

export function canBuy(s: GameState, playerId: PlayerId): string | null {
  const p = s.players[playerId];
  if (!p) return "UNKNOWN_PLAYER";
  if (s.phase !== "BUY_DECISION") return "WRONG_PHASE";
  if (inRecovery(p)) return "IN_RECOVERY";
  if (s.effects.some((e) => e.kind === "noBuy" && e.targetPlayerId === p.id)) return "BANK_BLOCKED";
  const price = Math.max(0, priceOf(p.position) - s.turn.buyDiscount);
  if (p.credits - price < RULES.voluntaryBuyReserve) return "RESERVE_REQUIRED";
  return null;
}

/** Copie profonde rapide (état 100 % JSON). */
export function cloneState(s: GameState): GameState {
  return structuredClone(s);
}

export function applyCommand(state: GameState, cmd: Command, ctx: Ctx): ApplyResult {
  const g: G = { s: cloneState(state), ctx, ev: [] };
  try {
    dispatch(g, cmd);
  } catch (e) {
    if (e instanceof RuleError) return { ok: false, code: e.code, error: e.message };
    throw e;
  }
  g.s.version += 1;
  return { ok: true, state: g.s, events: g.ev };
}

export { BOARD };
