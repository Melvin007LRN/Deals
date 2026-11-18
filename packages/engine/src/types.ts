import type { DistrictId } from "./content/board.ts";
import type { ResourceFace } from "./content/rules.ts";

export type PlayerId = string;
export type ResourceKind = "credits" | "materials" | "energy";

export interface Bundle {
  credits: number;
  materials: number;
  energy: number;
  properties: number[];
}

export interface PlayerState {
  id: PlayerId;
  name: string;
  seat: number;
  position: number;
  credits: number;
  materials: number;
  energy: number;
  debt: number;
  hand: number[]; // card instance ids
  objectiveId: number;
  /** nombre de tours commencés par ce joueur (sert d'horloge aux effets) */
  turnsStarted: number;
  /** null = normal ; sinon le numéro du tour (turnsStarted) à la fin duquel le redressement est résolu */
  recoveryResolveTurn: number | null;
  stats: { trades: number; auctionsWon: number; cardsPlayed: number; cardsDrawn: number; rentPaid: number; rentReceived: number; bankruptcies: number };
}

export interface PropertyState {
  index: number;
  ownerId: PlayerId | null;
  level: 0 | 1 | 2 | 3;
  mortgaged: boolean;
  /** crédits historiquement payés pour les bâtiments existants (somme de levelPaid) */
  buildingCredits: number;
  /** crédits réellement payés pour chaque niveau construit (index 0 = niveau 1) */
  levelPaid: number[];
  /** manche de la dernière attaque immobilière */
  lastRealtyAttackRound: number;
}

export type Expiry =
  | { kind: "turnStart"; playerId: PlayerId; turn: number } // expire au début du tour n° turn de playerId
  | { kind: "turnEnd"; playerId: PlayerId; turn: number } // expire à la fin du tour n° turn de playerId
  | { kind: "roundEnd"; round: number }
  | { kind: "never" };

export type EffectKind =
  | "rentBonus" // carte 3 : +15 prochain loyer d'une propriété
  | "sabotage" // carte 9 : -50% prochain loyer propriété
  | "noUpgrade" // carte 11
  | "noBuy" // carte 13
  | "rentReceivedMinus" // carte 15 : -10 prochain loyer reçu par joueur
  | "districtCrisis" // carte 18
  | "insurance" // carte 19 (propriété)
  | "financialShield" // carte 20 (joueur)
  | "legalProtection" // carte 21 (propriété, non consommée)
  | "counterOffensive" // carte 22 (joueur)
  | "emergencyReserve" // carte 23 (joueur)
  | "realtyInsurance" // carte 24 (propriété, consommée)
  | "guaranteedIncome" // carte 6 (joueur)
  | "reform" // carte 34 (quartier)
  | "influence"; // carte 31 (quartier, joueur)

export interface ActiveEffect {
  id: number;
  kind: EffectKind;
  sourceId: PlayerId;
  targetPlayerId?: PlayerId;
  propertyIndex?: number;
  district?: DistrictId;
  expiry: Expiry;
}

export interface TurnFlags {
  cardPlayed: boolean;
  buildsDone: number;
  extraBuilds: number;
  buildDiscount: number; // Placement malin (une construction)
  residentialDiscountUsed: boolean;
  buyDiscount: number; // Nouvelle opportunité / Contrat privilégié
  buyDiscountSource: number | null; // id carte
  taxCancel: boolean;
  taxReduction: number;
  marketAvailable: boolean;
  marketTransactions: number;
  tradeOffers: number;
  tradeCreditReduction: number; // Négociateur
  specialOffer: boolean; // Offre spéciale
  specialOfferUsed: boolean;
  landed: boolean;
}

export type Phase =
  | "PRE_ROLL"
  | "RESOURCE_CHOICE"
  | "BUY_DECISION"
  | "TAX_DUE"
  | "CHANCE_CHOICE"
  | "MANAGE"
  | "AUCTION"
  | "TRADE_PENDING"
  | "FINISHED";

export interface Auction {
  propertyIndex: number;
  reason: "declined" | "attack" | "forced";
  startPrice: number;
  currentBid: number | null;
  highestBidderId: PlayerId | null;
  activeBidders: PlayerId[];
  deadline: number;
  /** reçoit le produit de la vente (null = banque) */
  beneficiaryId: PlayerId | null;
  /** phase à reprendre après clôture */
  resume: Phase;
}

export interface TradeOffer {
  id: number;
  fromId: PlayerId;
  toId: PlayerId;
  give: Bundle;
  receive: Bundle;
  expiresAt: number;
}

export interface ScoreLine {
  playerId: PlayerId;
  credits: number;
  resources: number;
  properties: number;
  buildings: number;
  objective: number;
  districts: number;
  debt: number;
  mortgages: number;
  total: number;
  /** patrimoine hors objectifs (1er critère d'égalité) */
  wealth: number;
  rank: number;
}

export interface GameState {
  rulesVersion: string;
  /** variante de règles de cette partie (par défaut = règles officielles provisoires) */
  config: RuleConfig;
  version: number; // incrémentée à chaque commande acceptée
  eventSeq: number;
  round: number; // 1..12
  turnOrder: PlayerId[];
  activeIndex: number;
  phase: Phase;
  players: Record<PlayerId, PlayerState>;
  properties: Record<number, PropertyState>;
  /** instanceId -> cardId */
  cardInstances: Record<number, number>;
  deck: number[];
  discard: number[];
  pendingDraw: number[];
  pendingResource: { reason: "choice" | "cap"; blocked: ResourceKind | null } | null;
  lastRoll: { movement: number; resource: ResourceFace } | null;
  effects: ActiveEffect[];
  nextEffectId: number;
  turn: TurnFlags;
  auction: Auction | null;
  forcedSaleQueue: { playerId: PlayerId; indices: number[] } | null;
  trade: TradeOffer | null;
  nextTradeId: number;
  /** boucliers mineurs Centre-ville consommés : clé `${round}` -> nb */
  downtownShieldsUsed: Record<string, number>;
  scores: ScoreLine[] | null;
}

export interface Rng {
  /** entier uniforme dans [0, n) */
  int(n: number): number;
}

export interface Ctx {
  rng: Rng;
  /** horloge serveur en ms */
  now: number;
}

export type Command =
  | { type: "ROLL_DICE"; playerId: PlayerId }
  | { type: "CHOOSE_RESOURCE"; playerId: PlayerId; resource: ResourceKind }
  | { type: "BUY_PROPERTY"; playerId: PlayerId }
  | { type: "DECLINE_PROPERTY"; playerId: PlayerId }
  | { type: "PAY_TAX"; playerId: PlayerId }
  | { type: "CHOOSE_CARD"; playerId: PlayerId; keep: number; replace?: number }
  | { type: "PLACE_BID"; playerId: PlayerId; amount: number }
  | { type: "PASS_AUCTION"; playerId: PlayerId }
  | { type: "CLOSE_AUCTION"; playerId: PlayerId } // n'importe qui, uniquement après l'échéance
  | { type: "BUILD"; playerId: PlayerId; propertyIndex: number }
  | { type: "SELL_BUILDING"; playerId: PlayerId; propertyIndex: number }
  | { type: "MORTGAGE"; playerId: PlayerId; propertyIndex: number }
  | { type: "REDEEM_MORTGAGE"; playerId: PlayerId; propertyIndex: number }
  | { type: "BUY_RESOURCE"; playerId: PlayerId; resource: "materials" | "energy" }
  | { type: "SELL_RESOURCE"; playerId: PlayerId; resource: "materials" | "energy" }
  | { type: "SETTLE_DEBT"; playerId: PlayerId }
  | {
      type: "PLAY_CARD";
      playerId: PlayerId;
      instanceId: number;
      targetPlayerId?: PlayerId;
      propertyIndex?: number;
      otherPropertyIndex?: number;
      district?: DistrictId;
      resource?: "materials" | "energy";
    }
  | { type: "PROPOSE_TRADE"; playerId: PlayerId; toId: PlayerId; give: Bundle; receive: Bundle }
  | { type: "ACCEPT_TRADE"; playerId: PlayerId }
  | { type: "REJECT_TRADE"; playerId: PlayerId } // destinataire refuse ou auteur annule
  | { type: "EXPIRE_TRADE"; playerId: PlayerId }
  | { type: "END_TURN"; playerId: PlayerId };

export type CommandType = Command["type"];

export interface GameEvent {
  seq: number;
  type: string;
  playerId?: PlayerId;
  /** visible uniquement par ce joueur (main secrète) */
  privateTo?: PlayerId;
  data: Record<string, unknown>;
}

export type ApplyResult =
  | { ok: true; state: GameState; events: GameEvent[] }
  | { ok: false; error: string; code: string };

/** Leviers d'équilibrage testables par simulation. Les valeurs par défaut = règles 1.0.0-provisional. */
export interface RuleConfig {
  movementDie: number[];
  startReward: number;
  /** au passage de Départ, piocher 1 carte Chance directement en main (ignoré si main pleine) */
  drawOnStart: boolean;
  /** crédits versés au début de chaque tour */
  turnIncome: number;
  /** crédits de départ supplémentaires par siège (index = siège) */
  seatBonus: number[];
}
