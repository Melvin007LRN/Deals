import { BOARD, DISTRICTS, PROPERTY_INDICES, districtProperties } from "./content/board.ts";
import { CARDS } from "./content/cards.ts";
import { RULES } from "./content/rules.ts";
import type { GameState } from "./types.ts";

/** Vérifie les invariants du brief (§11, §15). Retourne la liste des violations (vide = OK). */
export function checkInvariants(s: GameState): string[] {
  const v: string[] = [];
  const players = Object.values(s.players);
  for (const p of players) {
    for (const k of ["credits", "materials", "energy", "debt"] as const) {
      if (!Number.isInteger(p[k]) || p[k] < 0) v.push(`${p.id}.${k}=${p[k]} négatif ou non entier`);
    }
    if (p.materials > RULES.maxMaterials) v.push(`${p.id} dépasse le plafond de Matériaux`);
    if (p.energy > RULES.maxEnergy) v.push(`${p.id} dépasse le plafond d'Énergie`);
    if (p.hand.length > RULES.maxHand) v.push(`${p.id} a ${p.hand.length} cartes`);
    if (p.position < 0 || p.position >= RULES.boardSize) v.push(`${p.id} position ${p.position}`);
  }
  // chaque instance de carte dans exactement une zone
  const zones = [s.deck, s.discard, s.pendingDraw, ...players.map((p) => p.hand)].flat();
  const all = Object.keys(s.cardInstances).map(Number).sort((a, b) => a - b);
  const seen = [...zones].sort((a, b) => a - b);
  if (all.length !== CARDS.length) v.push(`${all.length} instances au lieu de ${CARDS.length}`);
  if (JSON.stringify(all) !== JSON.stringify(seen)) v.push("une carte est absente ou dans plusieurs zones");
  for (const i of PROPERTY_INDICES) {
    const pr = s.properties[i];
    if (!pr) { v.push(`propriété ${i} manquante`); continue; }
    if (pr.level < 0 || pr.level > 3) v.push(`niveau ${pr.level} sur ${i}`);
    if (pr.ownerId !== null && !s.players[pr.ownerId]) v.push(`propriétaire inconnu sur ${i}`);
    if (pr.ownerId === null && (pr.level > 0 || pr.mortgaged) && s.auction?.propertyIndex !== i) v.push(`propriété libre ${i} avec bâtiment/hypothèque`);
    if (pr.mortgaged && pr.level > 0) v.push(`propriété ${i} hypothéquée avec bâtiment`);
    if (pr.buildingCredits < 0) v.push(`coût bâtiment négatif sur ${i}`);
    if (pr.levelPaid.length !== pr.level) v.push(`levelPaid incohérent sur ${i}`);
    if (pr.levelPaid.reduce((a, b) => a + b, 0) !== pr.buildingCredits) v.push(`buildingCredits ≠ somme levelPaid sur ${i}`);
  }
  if (Object.keys(s.properties).length !== 18) v.push("nombre de propriétés ≠ 18");
  if (BOARD.length !== 24) v.push("plateau ≠ 24 cases");
  for (const d of DISTRICTS) if (districtProperties(d.id).length !== 3) v.push(`quartier ${d.id} ≠ 3`);
  if (s.activeIndex < 0 || s.activeIndex >= s.turnOrder.length) v.push("joueur actif invalide");
  if (s.round < 1 || s.round > RULES.rounds) v.push(`manche ${s.round}`);
  if (s.phase === "AUCTION" && !s.auction) v.push("phase AUCTION sans enchère");
  if (s.phase !== "AUCTION" && s.auction) v.push("enchère hors phase");
  if (s.phase === "TRADE_PENDING" && !s.trade) v.push("phase TRADE sans offre");
  if (s.phase !== "TRADE_PENDING" && s.trade) v.push("offre hors phase");
  if (s.phase !== "CHANCE_CHOICE" && s.pendingDraw.length > 0) v.push("pioche en attente hors phase");
  return v;
}
