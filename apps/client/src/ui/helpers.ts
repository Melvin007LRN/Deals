import { BOARD, card, cardCost, cardTarget, cardText, type CardDef, type GameState, type PlayerView } from "@deals/engine";

/** Adapte la vue filtrée d'un joueur pour réutiliser les validations du moteur côté interface. */
export function asState(v: PlayerView): GameState {
  return { ...(v as unknown as GameState), cardInstances: v.visibleCards, deck: [], discard: [], pendingDraw: v.pendingDraw };
}

export const FAMILY_LABEL: Record<string, string> = {
  investment: "Investissement",
  attack: "Attaque",
  defense: "Défense",
  commerce: "Commerce",
  politics: "Politique",
};
export const RARITY_LABEL: Record<string, string> = { common: "Commune", rare: "Rare", epic: "Épique", legendary: "Légendaire" };
export const RARITY_COLOR: Record<string, string> = { common: "#cbd5e1", rare: "#60a5fa", epic: "#c084fc", legendary: "#fbbf24" };

export function cardInfo(v: PlayerView, cardId: number): { def: CardDef; text: string; cost: { materials: number; energy: number }; target: string } {
  const def = card(cardId);
  const rev = v.config.cardRevision ?? 1;
  return { def, text: cardText(def, rev), cost: cardCost(def, rev), target: cardTarget(def, rev) };
}

export const spaceName = (i: number) => BOARD[i]?.name ?? "";
