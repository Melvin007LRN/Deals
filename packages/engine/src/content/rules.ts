/**
 * DEALS — paramètres de règles v1.0.
 *
 * Statut : "confirmed" = décision explicite du créateur (pack V2.5).
 * "provisional" = recommandation de l'audit acceptée provisoirement le 18/11/2026,
 * à confirmer ou ajuster avec les rapports de simulation (voir docs/DECISIONS_A_VALIDER.md).
 */
export const RULES_VERSION = "1.4.0-test";

export const RULES = {
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
  auctionTimerMs: 10_000,
  tradeOfferTtlMs: 30_000,
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
  bonusDowntownMinorShields: 1,
} as const;

/** Dé de mouvement (confirmé). */
export const MOVEMENT_DIE = [1, 1, 2, 2, 3, 3] as const;

/** Dé de ressources (confirmé) : 2 Crédits, 2 Matériaux, 1 Énergie, 1 Choix. */
export type ResourceFace = "credits" | "materials" | "energy" | "choice";
export const RESOURCE_DIE: readonly ResourceFace[] = ["credits", "credits", "materials", "materials", "energy", "choice"];
export const RESOURCE_FACE_CREDITS = 10;
export const CHOICE_CREDITS = 5;

/** Coûts de construction par niveau (confirmés). */
export const BUILDING_COSTS: Record<1 | 2 | 3, { credits: number; materials: number; energy: number }> = {
  1: { credits: 20, materials: 1, energy: 0 },
  2: { credits: 35, materials: 2, energy: 0 },
  3: { credits: 50, materials: 2, energy: 1 },
};

/** Multiplicateurs de loyer par niveau, en demis (1, 1.5, 2, 3) pour rester en entiers. */
export const RENT_MULT_HALVES = [2, 3, 4, 6] as const;
