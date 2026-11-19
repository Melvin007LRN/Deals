import type { Command, GameEvent, PlayerId, PlayerView } from "@deals/engine";

export interface SeatInfo {
  id: PlayerId;
  name: string;
  isBot: boolean;
  color: string;
  pawn: 0 | 1 | 2 | 3;
  connected: boolean;
}

/** Interface commune à une partie locale (contre bots) et à une partie en ligne. */
export interface GameController {
  readonly me: PlayerId;
  readonly mode: "local" | "online";
  seats(): SeatInfo[];
  view(): PlayerView | null;
  /** Envoie une intention ; le moteur (local ou serveur) décide. Résout avec un message d'erreur ou null. */
  send(cmd: Command): Promise<string | null>;
  onUpdate(cb: (view: PlayerView, events: GameEvent[]) => void): () => void;
  /** horloge de référence (serveur en ligne) */
  now(): number;
  dispose(): void;
}

export const PLAYER_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b"] as const;
export const PLAYER_COLOR_NAMES = ["Bleu", "Rouge", "Vert", "Or"] as const;
