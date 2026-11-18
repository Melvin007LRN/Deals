import type { GameEvent, GameState, PlayerId } from "./types.ts";

/**
 * Vue filtrée envoyée à un joueur : ne révèle jamais la main ni l'objectif d'un adversaire,
 * ni l'ordre de la pioche, ni les cartes piochées par un autre joueur.
 */
export interface PlayerView extends Omit<GameState, "deck" | "discard" | "cardInstances" | "pendingDraw"> {
  viewerId: PlayerId | null;
  deckCount: number;
  discardCount: number;
  handCounts: Record<PlayerId, number>;
  /** cartes visibles par le viewer : sa main et sa pioche en cours */
  visibleCards: Record<number, number>;
  pendingDraw: number[];
}

export function viewFor(s: GameState, viewerId: PlayerId | null): PlayerView {
  const c = structuredClone(s);
  const finished = s.phase === "FINISHED";
  const handCounts: Record<PlayerId, number> = {};
  const visibleCards: Record<number, number> = {};
  for (const id of Object.keys(c.players)) {
    const p = c.players[id]!;
    handCounts[id] = p.hand.length;
    if (id === viewerId) {
      for (const i of p.hand) visibleCards[i] = s.cardInstances[i]!;
    } else {
      p.hand = [];
      if (!finished) p.objectiveId = 0;
    }
  }
  const active = s.turnOrder[s.activeIndex];
  const pendingDraw = viewerId !== null && viewerId === active ? [...s.pendingDraw] : [];
  for (const i of pendingDraw) visibleCards[i] = s.cardInstances[i]!;
  const { deck, discard, cardInstances, pendingDraw: _pd, ...rest } = c;
  return {
    ...rest,
    viewerId,
    deckCount: deck.length,
    discardCount: discard.length,
    handCounts,
    visibleCards,
    pendingDraw,
  };
}

/** Événements visibles par un joueur. */
export function eventsFor(events: GameEvent[], viewerId: PlayerId | null): GameEvent[] {
  return events.filter((e) => e.privateTo === undefined || e.privateTo === viewerId);
}
