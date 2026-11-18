import {
  CARDS,
  PROPERTY_INDICES,
  applyCommand,
  checkInvariants,
  createGame,
  seededRng,
  type Command,
  type GameEvent,
  type GameState,
  type RuleConfig,
} from "@deals/engine";
import { PROFILES, decide, fallback, type ProfileName } from "./agents.ts";

/** Durées humaines estimées par type d'action (secondes) — modèle, pas une mesure. */
const SECONDS: Partial<Record<Command["type"], number>> = {
  ROLL_DICE: 6, CHOOSE_RESOURCE: 3, BUY_PROPERTY: 5, DECLINE_PROPERTY: 4, PAY_TAX: 2, CHOOSE_CARD: 7,
  PLACE_BID: 3, PASS_AUCTION: 2, BUILD: 5, SELL_BUILDING: 4, MORTGAGE: 4, REDEEM_MORTGAGE: 4,
  BUY_RESOURCE: 3, SELL_RESOURCE: 3, SETTLE_DEBT: 2, PLAY_CARD: 8, PROPOSE_TRADE: 20, ACCEPT_TRADE: 6,
  REJECT_TRADE: 4, END_TURN: 3,
};
const ANIMATION_SECONDS_PER_TURN = 4;

export interface PlayerResult {
  id: string;
  profile: ProfileName;
  seat: number;
  rank: number;
  total: number;
  wealth: number;
  properties: number;
  buildings: number;
  maxLevel: number;
  credits: number;
  debt: number;
  districts: number;
  objectiveMet: boolean;
  bankruptcies: number;
  cardsDrawn: number;
  cardsPlayed: number;
  trades: number;
  auctionsWon: number;
  roundsWithoutProperty: number;
}

export interface GameResult {
  seed: number;
  players: PlayerResult[];
  winners: string[];
  commands: number;
  rejected: number;
  estimatedMinutes: number;
  auctions: number;
  auctionsNoSale: number;
  trades: number;
  tradeOffers: number;
  realtyAttacks: number;
  attacksBlocked: number;
  startPasses: number;
  cardPlays: Record<number, number>;
  cardDraws: number;
  invariantViolations: string[];
}

export function runGame(seed: number, profiles: ProfileName[], opts: { checkInvariants?: boolean; config?: Partial<RuleConfig> } = {}): GameResult {
  const ids = profiles.map((_, i) => `P${i + 1}`);
  const engineRng = seededRng(seed);
  const agentRng = seededRng(seed ^ 0xa9e47);
  let now = 0;
  const created = createGame(ids.map((id) => ({ id, name: id })), { rng: engineRng, now }, opts.config ?? {});
  let s: GameState = created.state;
  const profileOf: Record<string, ProfileName> = Object.fromEntries(ids.map((id, i) => [id, profiles[i]!]));
  const events: GameEvent[] = [...created.events];
  let commands = 0;
  let rejected = 0;
  let seconds = 0;
  const violations: string[] = [];
  const noProperty: Record<string, number> = Object.fromEntries(ids.map((id) => [id, 0]));
  let lastRound = 0;

  let guard = 0;
  while (s.phase !== "FINISHED") {
    if (++guard > 50_000) throw new Error(`Partie bloquée seed=${seed} phase=${s.phase}`);
    if (s.round !== lastRound) {
      lastRound = s.round;
      for (const id of ids) if (!PROPERTY_INDICES.some((i) => s.properties[i]!.ownerId === id)) noProperty[id]! += 1;
    }
    // qui doit décider ? (enchère : tous les enchérisseurs dans un ordre aléatoire ; échange : le destinataire)
    const deciders = s.phase === "AUCTION" ? [...s.auction!.activeBidders].sort(() => agentRng.int(3) - 1) : s.phase === "TRADE_PENDING" ? [s.trade!.toId] : [s.turnOrder[s.activeIndex]!];
    let cmd: Command | null = null;
    for (const id of deciders) {
      cmd = decide(s, id, PROFILES[profileOf[id]!], agentRng, now);
      if (cmd) break;
    }
    if (!cmd) {
      const fb = fallback(s, now);
      cmd = fb.find((c) => c.type === "PASS_AUCTION" || c.type === "END_TURN") ?? fb[0] ?? null;
      if (!cmd) throw new Error(`Aucune décision possible seed=${seed} phase=${s.phase}`);
    }
    now += 1000;
    const r = applyCommand(s, cmd, { rng: engineRng, now });
    if (!r.ok) {
      rejected++;
      // décision invalide d'un agent : on retombe sur une commande sûre
      const fb = fallback(s, now).find((c) => c.type === "END_TURN" || c.type === "PASS_AUCTION" || c.type === "DECLINE_PROPERTY" || c.type === "PAY_TAX" || c.type === "ROLL_DICE" || c.type === "REJECT_TRADE");
      if (!fb) throw new Error(`Commande refusée sans repli seed=${seed}: ${r.code}`);
      const r2 = applyCommand(s, fb, { rng: engineRng, now });
      if (!r2.ok) throw new Error(`Repli refusé seed=${seed}: ${r2.code}`);
      s = r2.state;
      events.push(...r2.events);
      continue;
    }
    commands++;
    seconds += SECONDS[cmd.type] ?? 3;
    if (cmd.type === "END_TURN") seconds += ANIMATION_SECONDS_PER_TURN;
    s = r.state;
    events.push(...r.events);
    if (opts.checkInvariants) {
      const v = checkInvariants(s);
      if (v.length) violations.push(...v.map((x) => `${cmd!.type}: ${x}`));
    }
  }

  const scores = s.scores!;
  const players: PlayerResult[] = ids.map((id) => {
    const p = s.players[id]!;
    const line = scores.find((l) => l.playerId === id)!;
    const owned = PROPERTY_INDICES.map((i) => s.properties[i]!).filter((x) => x.ownerId === id);
    return {
      id,
      profile: profileOf[id]!,
      seat: p.seat,
      rank: line.rank,
      total: line.total,
      wealth: line.wealth,
      properties: owned.length,
      buildings: owned.reduce((a, x) => a + x.level, 0),
      maxLevel: owned.reduce((a, x) => Math.max(a, x.level), 0),
      credits: p.credits,
      debt: p.debt,
      districts: line.districts / 25,
      objectiveMet: line.objective > 0,
      bankruptcies: p.stats.bankruptcies,
      cardsDrawn: p.stats.cardsDrawn,
      cardsPlayed: p.stats.cardsPlayed,
      trades: p.stats.trades,
      auctionsWon: p.stats.auctionsWon,
      roundsWithoutProperty: noProperty[id]!,
    };
  });
  const count = (t: string) => events.filter((e) => e.type === t).length;
  const cardPlays: Record<number, number> = Object.fromEntries(CARDS.map((c) => [c.id, 0]));
  for (const e of events) if (e.type === "CARD_PLAYED") cardPlays[e.data.cardId as number]! += 1;
  return {
    seed,
    players,
    winners: players.filter((p) => p.rank === 1).map((p) => p.id),
    commands,
    rejected,
    estimatedMinutes: seconds / 60,
    auctions: count("AUCTION_STARTED"),
    auctionsNoSale: count("AUCTION_NO_SALE"),
    trades: count("TRADE_ACCEPTED"),
    tradeOffers: count("TRADE_PROPOSED"),
    realtyAttacks: count("PROPERTY_SEIZED"),
    attacksBlocked: count("ATTACK_BLOCKED"),
    startPasses: count("START_PASSED"),
    cardPlays,
    cardDraws: count("CHANCE_DRAWN"),
    invariantViolations: violations,
  };
}
