import {
  applyCommand,
  createGame,
  cryptoRng,
  viewFor,
  eventsFor,
  type Command,
  type GameEvent,
  type GameState,
  type PlayerId,
  type PlayerView,
} from "@deals/engine";
import { PROFILES, decide, fallback, type ProfileName } from "@deals/sim";
import { PLAYER_COLORS, type GameController, type SeatInfo } from "./types.ts";

const BOT_NAMES = ["Victor", "Inès", "Marco", "Léa", "Samir", "Chloé"];
const BOT_PROFILES: ProfileName[] = ["balanced", "investor", "aggressive", "negotiator"];

/**
 * Partie locale : le moteur tourne dans le navigateur, les adversaires sont des bots
 * (les mêmes agents que le simulateur). Le joueur humain ne reçoit que sa vue filtrée.
 */
export class LocalGame implements GameController {
  readonly me: PlayerId = "you";
  readonly mode = "local" as const;
  private state: GameState;
  private listeners = new Set<(v: PlayerView, e: GameEvent[]) => void>();
  private timer: ReturnType<typeof setInterval>;
  private seatInfo: SeatInfo[];
  private profiles: Record<PlayerId, ProfileName> = {};
  private rng = cryptoRng();
  private botRng = { int: (n: number) => Math.floor(Math.random() * n) };
  /** les bots attendent la fin des animations affichées */
  busyUntil = 0;
  private nextBotAt = 0;

  constructor(playerName: string, bots: number) {
    const ids = [this.me, ...Array.from({ length: bots }, (_, i) => `bot${i + 1}`)];
    const names = [...BOT_NAMES].sort(() => Math.random() - 0.5);
    const { state, events } = createGame(
      ids.map((id, i) => ({ id, name: id === this.me ? playerName : names[i]! })),
      { rng: this.rng, now: Date.now() },
    );
    this.state = state;
    ids.forEach((id, i) => {
      if (id !== this.me) this.profiles[id] = BOT_PROFILES[(i - 1) % BOT_PROFILES.length]!;
    });
    this.seatInfo = state.turnOrder.map((id, seat) => ({
      id,
      name: state.players[id]!.name,
      isBot: id !== this.me,
      color: PLAYER_COLORS[seat]!,
      pawn: seat as 0 | 1 | 2 | 3,
      connected: true,
    }));
    this.pending = events;
    this.timer = setInterval(() => this.tick(), 200);
  }

  private pending: GameEvent[] = [];

  seats(): SeatInfo[] {
    return this.seatInfo;
  }

  view(): PlayerView {
    return viewFor(this.state, this.me);
  }

  now(): number {
    return Date.now();
  }

  onUpdate(cb: (v: PlayerView, e: GameEvent[]) => void): () => void {
    this.listeners.add(cb);
    if (this.pending.length) {
      cb(this.view(), eventsFor(this.pending, this.me));
      this.pending = [];
    }
    return () => this.listeners.delete(cb);
  }

  private apply(cmd: Command): string | null {
    const r = applyCommand(this.state, cmd, { rng: this.rng, now: Date.now() });
    if (!r.ok) return r.error;
    this.state = r.state;
    const view = this.view();
    const evs = eventsFor(r.events, this.me);
    for (const l of this.listeners) l(view, evs);
    return null;
  }

  async send(cmd: Command): Promise<string | null> {
    if (cmd.playerId !== this.me) return "Commande non autorisée";
    return this.apply(cmd);
  }

  /** Boucle des bots et des échéances (enchère, échange). */
  private tick(): void {
    const s = this.state;
    if (s.phase === "FINISHED") return;
    const now = Date.now();
    if (now < this.busyUntil) return;
    // échéances : clôture par l'arbitre (ici le client local, en ligne le serveur)
    if (s.phase === "AUCTION" && s.auction && now >= s.auction.deadline) {
      this.apply({ type: "CLOSE_AUCTION", playerId: s.turnOrder[s.activeIndex]! });
      return;
    }
    if (s.phase === "TRADE_PENDING" && s.trade && now >= s.trade.expiresAt) {
      this.apply({ type: "EXPIRE_TRADE", playerId: s.turnOrder[s.activeIndex]! });
      return;
    }
    if (now < this.nextBotAt) return;
    const deciders =
      s.phase === "AUCTION"
        ? [...s.auction!.activeBidders].filter((id) => id !== this.me).sort(() => Math.random() - 0.5)
        : s.phase === "TRADE_PENDING"
          ? [s.trade!.toId].filter((id) => id !== this.me)
          : [s.turnOrder[s.activeIndex]!].filter((id) => id !== this.me);
    for (const id of deciders) {
      const cmd = decide(s, id, PROFILES[this.profiles[id]!], this.botRng, now);
      if (!cmd) continue;
      // rythme humain : les bots « réfléchissent »
      this.nextBotAt = now + (cmd.type === "PLACE_BID" || cmd.type === "PASS_AUCTION" ? 900 + Math.random() * 1400 : 700 + Math.random() * 600);
      if (this.apply(cmd) !== null) {
        const fb = fallback(s, now).find((c) => c.playerId === id && ["END_TURN", "PASS_AUCTION", "DECLINE_PROPERTY", "PAY_TAX", "ROLL_DICE", "REJECT_TRADE"].includes(c.type));
        if (fb) this.apply(fb);
      }
      return;
    }
  }

  dispose(): void {
    clearInterval(this.timer);
    this.listeners.clear();
  }
}
