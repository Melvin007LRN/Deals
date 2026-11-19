import { DISTRICTS, PROPERTY_INDICES, priceOf } from "./content/board.ts";
import { card, cardTarget } from "./content/cards.ts";
import { RULES } from "./content/rules.ts";
import { activePlayerId, canBuild, canBuy, canPlayCard, minBid, resourceChoices } from "./engine.ts";
import type { Bundle, Command, GameState, PlayerId } from "./types.ts";

const EMPTY: Bundle = { credits: 0, materials: 0, energy: 0, properties: [] };

/** Toutes les façons valides de jouer chaque carte de la main du joueur actif. */
export function cardPlays(s: GameState): Extract<Command, { type: "PLAY_CARD" }>[] {
  const a = activePlayerId(s);
  const p = s.players[a]!;
  const out: Extract<Command, { type: "PLAY_CARD" }>[] = [];
  const opponents = s.turnOrder.filter((id) => id !== a);
  for (const inst of p.hand) {
    const def = card(s.cardInstances[inst]!);
    const base = { type: "PLAY_CARD" as const, playerId: a, instanceId: inst };
    const cands: Extract<Command, { type: "PLAY_CARD" }>[] = [];
    switch (cardTarget(def, s.config.cardRevision ?? 1)) {
      case "none": cands.push(base); break;
      case "opponent": for (const o of opponents) cands.push({ ...base, targetPlayerId: o }); break;
      case "ownProperty":
      case "opponentProperty": for (const i of PROPERTY_INDICES) cands.push({ ...base, propertyIndex: i }); break;
      case "district": for (const d of DISTRICTS) cands.push({ ...base, district: d.id }); break;
      case "resource": cands.push({ ...base, resource: "materials" }, { ...base, resource: "energy" }); break;
      case "swap":
        for (const i of PROPERTY_INDICES) if (s.properties[i]!.ownerId === a)
          for (const j of PROPERTY_INDICES) if (s.properties[j]!.ownerId && s.properties[j]!.ownerId !== a) cands.push({ ...base, propertyIndex: i, otherPropertyIndex: j });
        break;
    }
    for (const c of cands) if (canPlayCard(s, c) === null) out.push(c);
  }
  return out;
}

/**
 * Commandes candidates pour l'état courant (tous les joueurs qui ont une décision à prendre).
 * Les commandes renvoyées sont pré-validées quand c'est bon marché ; l'appelant doit toujours passer par applyCommand.
 */
export function candidateCommands(s: GameState, now: number): Command[] {
  if (s.phase === "FINISHED") return [];
  const a = activePlayerId(s);
  const p = s.players[a]!;
  const out: Command[] = [];
  const manage = () => {
    for (const i of PROPERTY_INDICES) {
      const pr = s.properties[i]!;
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
        for (const r of ["materials", "energy"] as const) {
          out.push({ type: "BUY_RESOURCE", playerId: a, resource: r }, { type: "SELL_RESOURCE", playerId: a, resource: r });
        }
      }
      manage();
      if (s.turn.tradeOffers < RULES.tradeOffersPerTurn) {
        for (const o of s.turnOrder) {
          if (o === a) continue;
          for (const i of PROPERTY_INDICES) {
            const pr = s.properties[i]!;
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
      const au = s.auction!;
      for (const id of au.activeBidders) {
        if (id === au.highestBidderId) continue;
        out.push({ type: "PASS_AUCTION", playerId: id });
        const m = minBid(s);
        for (const amt of [m, m + 10, m + 25]) if (s.players[id]!.credits >= amt) out.push({ type: "PLACE_BID", playerId: id, amount: amt });
      }
      if (now >= au.deadline) out.push({ type: "CLOSE_AUCTION", playerId: a });
      break;
    }
    case "TRADE_PENDING": {
      const t = s.trade!;
      out.push({ type: "ACCEPT_TRADE", playerId: t.toId }, { type: "REJECT_TRADE", playerId: t.toId }, { type: "REJECT_TRADE", playerId: t.fromId });
      if (now >= t.expiresAt) out.push({ type: "EXPIRE_TRADE", playerId: a });
      break;
    }
  }
  return out;
}

export type { PlayerId };
