/**
 * Agents DEALS (bots). Ils ne voient que ce qu'un joueur verrait : leur propre main,
 * l'état public, et n'utilisent jamais la pioche ni les objectifs adverses.
 * Ils produisent des intentions ; le moteur reste seul juge (applyCommand).
 */
import {
  BOARD,
  PROPERTY_INDICES,
  activePlayerId,
  buildCost,
  canBuild,
  canBuy,
  candidateCommands,
  card,
  cardPlays,
  computeRent,
  computeScores,
  districtOf,
  districtProperties,
  minBid,
  ownedCount,
  priceOf,
  resourceChoices,
  RULES,
  type Command,
  type GameState,
  type PlayerId,
  type Rng,
} from "@deals/engine";

export type ProfileName = "investor" | "aggressive" | "negotiator" | "random" | "balanced";

export interface Profile {
  name: ProfileName;
  label: string;
  /** marge de crédits gardée en plus de la réserve obligatoire pour acheter */
  buyMargin: number;
  /** fraction de la valeur jusqu'où il enchérit */
  bidFraction: number;
  /** crédits minimum gardés avant de construire */
  buildReserve: number;
  attack: number;
  defense: number;
  invest: number;
  trade: number;
}

export const PROFILES: Record<ProfileName, Profile> = {
  investor: { name: "investor", label: "Investisseur", buyMargin: 0, bidFraction: 0.85, buildReserve: 20, attack: 0.4, defense: 0.8, invest: 1.4, trade: 0.6 },
  aggressive: { name: "aggressive", label: "Agressif", buyMargin: 10, bidFraction: 0.75, buildReserve: 35, attack: 1.6, defense: 0.6, invest: 0.8, trade: 0.4 },
  negotiator: { name: "negotiator", label: "Négociateur", buyMargin: 5, bidFraction: 0.8, buildReserve: 30, attack: 0.7, defense: 0.8, invest: 1, trade: 1.6 },
  random: { name: "random", label: "Aléatoire raisonnable", buyMargin: 0, bidFraction: 0.7, buildReserve: 25, attack: 1, defense: 1, invest: 1, trade: 1 },
  balanced: { name: "balanced", label: "Mixte", buyMargin: 5, bidFraction: 0.8, buildReserve: 25, attack: 1, defense: 1, invest: 1, trade: 1 },
};

function wealthOf(s: GameState, id: PlayerId): number {
  return computeScores(s).find((l) => l.playerId === id)!.wealth;
}

function leaderOpponent(s: GameState, me: PlayerId): PlayerId {
  const lines = computeScores(s).filter((l) => l.playerId !== me);
  return lines.sort((a, b) => b.wealth - a.wealth)[0]!.playerId;
}

/** Valeur subjective d'une propriété pour un joueur (bonus si elle donne la majorité). */
function propertyValue(s: GameState, me: PlayerId, index: number): number {
  const d = districtOf(index);
  const mine = ownedCount(s, me, d) - (s.properties[index]!.ownerId === me ? 1 : 0);
  const blocks = districtProperties(d).some((i) => s.properties[i]!.ownerId && s.properties[i]!.ownerId !== me && ownedCount(s, s.properties[i]!.ownerId!, d) >= 1);
  let v = priceOf(index);
  if (mine === 1) v *= 1.45; // complète la majorité : contrôle + construction
  else if (mine === 0 && !blocks) v *= 1.1;
  const roundsLeft = RULES.rounds - s.round;
  v *= 0.75 + 0.25 * (roundsLeft / RULES.rounds) + 0.05;
  return v;
}

function staticCardValue(s: GameState, me: PlayerId, cmd: Extract<Command, { type: "PLAY_CARD" }>, pf: Profile): number {
  const def = card(s.cardInstances[cmd.instanceId]!);
  const p = s.players[me]!;
  const leader = leaderOpponent(s, me);
  const cost = 10 * (def.cost.materials + def.cost.energy) * 0.55;
  const target = cmd.targetPlayerId ?? (cmd.propertyIndex !== undefined ? s.properties[cmd.propertyIndex]!.ownerId : null);
  const onLeader = target === leader ? 1.3 : 0.8;
  const canBuildAny = PROPERTY_INDICES.some((i) => canBuild(s, me, i) === null);
  let v = -Infinity;
  switch (def.key) {
    case "coup_de_pouce": v = 20 * pf.invest; break;
    case "magnat": v = 50 * pf.invest; break;
    case "bon_investissement": v = 10 * pf.invest; break;
    case "placement_malin": v = s.phase === "MANAGE" && canBuildAny ? 10 * pf.invest : -Infinity; break;
    case "chantier_express":
    case "permis_exceptionnel": {
      const buildable = PROPERTY_INDICES.filter((i) => s.properties[i]!.ownerId === me && canBuild(s, me, i) !== "NO_MAJORITY" && s.properties[i]!.level < 3).length;
      v = s.phase === "MANAGE" && buildable >= 2 && p.credits > 90 ? 35 * pf.invest : -Infinity;
      break;
    }
    case "rendement_bonus": v = 8 * pf.invest; break;
    case "revenus_garantis": v = p.position >= 17 ? 20 * pf.invest : 3; break;
    case "reduction_fiscale": v = s.phase === "TAX_DUE" ? 15 : -Infinity; break;
    case "vote_municipal": v = s.phase === "TAX_DUE" ? 10 : -Infinity; break;
    case "nouvelle_opportunite": v = s.phase === "BUY_DECISION" && canBuy(s, me) !== "IN_RECOVERY" ? 20 * pf.invest : -Infinity; break;
    case "contrat_privilegie": v = s.phase === "BUY_DECISION" && canBuy(s, me) !== "IN_RECOVERY" ? 15 * pf.invest : -Infinity; break;
    case "sabotage": v = (computeRent(s, cmd.propertyIndex!).total / 2) * pf.attack * onLeader; break;
    case "pression_fiscale": v = 12 * pf.attack * onLeader; break;
    case "greve": v = (s.properties[cmd.propertyIndex!]!.level < 3 ? 5 : 0) * pf.attack * onLeader; break;
    case "inspection":
    case "fraude_commerciale": v = 8 * pf.attack * onLeader; break;
    case "blocage_bancaire": v = 8 * pf.attack * onLeader; break;
    case "detournement": v = Math.min(10, s.players[target!]!.credits) * 1.6 * pf.attack * onLeader; break;
    case "concurrence_agressive": v = 4 * pf.attack * onLeader; break;
    case "crise_locale": v = 3 * pf.attack; break;
    case "prise_de_controle":
    case "opa_hostile": {
      const pr = s.properties[cmd.propertyIndex!]!;
      const d = districtOf(pr.index);
      const breaks = ownedCount(s, pr.ownerId!, d) >= 2 ? 25 : 0;
      v = (priceOf(pr.index) * 0.35 + pr.buildingCredits * 0.3 + breaks) * pf.attack * onLeader;
      break;
    }
    case "assurance": v = 3 * pf.defense; break;
    case "bouclier_financier": v = 6 * pf.defense; break;
    case "protection_juridique":
    case "assurance_immobiliere": {
      const pr = s.properties[cmd.propertyIndex!]!;
      v = (ownedCount(s, me, districtOf(pr.index)) >= 2 ? 12 : 3) * pf.defense;
      break;
    }
    case "contre_offensive": v = 10 * pf.defense; break;
    case "reserve_urgence": v = (p.credits < 40 ? 12 : 1) * pf.defense; break;
    case "negociateur":
    case "offre_speciale": v = s.phase === "MANAGE" ? 4 * pf.trade : -Infinity; break;
    case "courtier": v = 10; break;
    case "partenariat": v = 10 * pf.trade; break;
    case "fusion": {
      const mine = districtOf(cmd.propertyIndex!);
      const theirs = districtOf(cmd.otherPropertyIndex!);
      v = mine !== theirs && ownedCount(s, me, theirs) === 1 ? 30 * pf.trade : -Infinity;
      break;
    }
    case "influence_locale": {
      const d = cmd.district!;
      v = s.phase === "MANAGE" && ownedCount(s, me, d) === 1 && p.credits > 60 && p.materials >= 2 ? 15 * pf.invest : -Infinity;
      break;
    }
    case "reforme_urbaine": v = ownedCount(s, me, cmd.district!) >= 2 ? 8 : -Infinity; break;
  }
  return v - cost;
}

function bestCardPlay(s: GameState, me: PlayerId, pf: Profile, rng: Rng): Command | null {
  if (s.turn.cardPlayed) return null;
  const plays = cardPlays(s);
  if (!plays.length) return null;
  let best: Command | null = null;
  let bestV = 2;
  for (const c of plays) {
    let v = staticCardValue(s, me, c, pf);
    if (pf.name === "random") v += rng.int(10) - 5;
    if (v > bestV) {
      bestV = v;
      best = c;
    }
  }
  return best;
}

function keepValue(s: GameState, me: PlayerId, cardId: number, pf: Profile): number {
  const def = card(cardId);
  const fam = { investment: pf.invest, attack: pf.attack, defense: pf.defense, commerce: pf.trade, politics: 1 }[def.family];
  const rarity = { common: 1, rare: 1.3, epic: 1.7, legendary: 2.2 }[def.rarity];
  const affordable = s.players[me]!.materials >= def.cost.materials && s.players[me]!.energy >= def.cost.energy ? 1.2 : 0.8;
  return fam * rarity * affordable;
}

/** Décision d'un agent. Retourne null s'il n'a rien à décider. */
export function decide(s: GameState, me: PlayerId, pf: Profile, rng: Rng, now: number): Command | null {
  if (s.phase === "FINISHED") return null;
  const active = activePlayerId(s);
  const p = s.players[me]!;

  if (s.phase === "AUCTION") {
    const a = s.auction!;
    if (!a.activeBidders.includes(me) || a.highestBidderId === me) return null;
    const m = minBid(s);
    const value = propertyValue(s, me, a.propertyIndex) + (a.reason !== "declined" ? s.properties[a.propertyIndex]!.buildingCredits * 0.5 : 0);
    const limit = value * pf.bidFraction + (pf.name === "random" ? rng.int(15) - 7 : 0);
    if (m <= limit && p.credits - m >= 15) return { type: "PLACE_BID", playerId: me, amount: m };
    return { type: "PASS_AUCTION", playerId: me };
  }
  if (s.phase === "TRADE_PENDING") {
    const t = s.trade!;
    if (t.toId !== me) return null;
    const val = (b: typeof t.give, owner: PlayerId) =>
      b.credits + 10 * (b.materials + b.energy) + b.properties.reduce((acc, i) => acc + (owner === me ? propertyValue(s, me, i) : propertyValue(s, me, i)), 0);
    const gain = val(t.give, t.fromId);
    const loss = val(t.receive, me) * (t.receive.properties.some((i) => ownedCount(s, me, districtOf(i)) >= 2) ? 1.6 : 1);
    return { type: gain >= loss * (pf.name === "negotiator" ? 1.0 : 1.08) ? "ACCEPT_TRADE" : "REJECT_TRADE", playerId: me };
  }
  if (active !== me) return null;

  switch (s.phase) {
    case "PRE_ROLL": {
      const c = bestCardPlay(s, me, pf, rng);
      if (c && rng.int(2) === 0) return c;
      if (p.debt > 0 && p.credits > 0) return { type: "SETTLE_DEBT", playerId: me };
      return { type: "ROLL_DICE", playerId: me };
    }
    case "RESOURCE_CHOICE": {
      const ch = resourceChoices(s, p);
      if (ch.includes("materials") && p.materials < 4) return { type: "CHOOSE_RESOURCE", playerId: me, resource: "materials" };
      if (ch.includes("energy") && p.energy < 2) return { type: "CHOOSE_RESOURCE", playerId: me, resource: "energy" };
      return { type: "CHOOSE_RESOURCE", playerId: me, resource: ch.includes("materials") && p.materials < 6 ? "materials" : "credits" };
    }
    case "BUY_DECISION": {
      const index = p.position;
      const c = bestCardPlay(s, me, pf, rng);
      if (c) return c;
      const price = priceOf(index) - s.turn.buyDiscount;
      const wants = propertyValue(s, me, index) >= price * (pf.name === "random" ? 0.7 + rng.int(5) / 10 : 0.85);
      if (canBuy(s, me) === null && wants && p.credits - price >= RULES.voluntaryBuyReserve + pf.buyMargin) return { type: "BUY_PROPERTY", playerId: me };
      return { type: "DECLINE_PROPERTY", playerId: me };
    }
    case "TAX_DUE": {
      const c = bestCardPlay(s, me, pf, rng);
      return c ?? { type: "PAY_TAX", playerId: me };
    }
    case "CHANCE_CHOICE": {
      const ranked = [...s.pendingDraw].sort((x, y) => keepValue(s, me, s.cardInstances[y]!, pf) - keepValue(s, me, s.cardInstances[x]!, pf));
      const keep = ranked[0]!;
      if (p.hand.length < RULES.maxHand) return { type: "CHOOSE_CARD", playerId: me, keep };
      const worst = [...p.hand].sort((x, y) => keepValue(s, me, s.cardInstances[x]!, pf) - keepValue(s, me, s.cardInstances[y]!, pf))[0]!;
      return { type: "CHOOSE_CARD", playerId: me, keep, replace: worst };
    }
    case "MANAGE": {
      // 1) construire
      const builds = PROPERTY_INDICES.filter((i) => canBuild(s, me, i) === null)
        .map((i) => ({ i, gain: rentGain(s, i), cost: buildCost(s, me, i).credits }))
        .filter((b) => p.credits - b.cost >= pf.buildReserve)
        .sort((x, y) => y.gain - x.gain);
      if (builds.length && (pf.name !== "random" || rng.int(3) > 0)) return { type: "BUILD", playerId: me, propertyIndex: builds[0]!.i };
      // 2) carte
      const c = bestCardPlay(s, me, pf, rng);
      if (c) return c;
      // 3) marché : acheter des matériaux pour construire
      if (s.turn.marketAvailable && s.turn.marketTransactions < RULES.marketMaxTransactions) {
        const ownsMajority = BOARD.some((sp) => sp.district && ownedCount(s, me, sp.district) >= 2);
        if (ownsMajority && p.materials < 3 && p.credits > 70) return { type: "BUY_RESOURCE", playerId: me, resource: "materials" };
      }
      // 4) dette
      if (p.debt > 0 && p.credits > 0) return { type: "SETTLE_DEBT", playerId: me };
      // 5) échange : compléter une majorité
      if (s.turn.tradeOffers < (pf.name === "negotiator" ? 2 : 1) && rng.int(100) < 45 * pf.trade) {
        const offer = tradeOffer(s, me, pf);
        if (offer) return offer;
      }
      return { type: "END_TURN", playerId: me };
    }
    default:
      void now;
      void wealthOf;
      return null;
  }
}

function rentGain(s: GameState, i: number): number {
  const before = computeRent(s, i).total;
  const pr = s.properties[i]!;
  const save = pr.level;
  pr.level = (save + 1) as 1 | 2 | 3;
  const after = computeRent(s, i).total;
  pr.level = save;
  return after - before;
}

function tradeOffer(s: GameState, me: PlayerId, pf: Profile): Command | null {
  const p = s.players[me]!;
  for (const i of PROPERTY_INDICES) {
    const pr = s.properties[i]!;
    if (!pr.ownerId || pr.ownerId === me || pr.mortgaged) continue;
    const d = districtOf(i);
    if (ownedCount(s, me, d) !== 1) continue;
    if (ownedCount(s, pr.ownerId, d) >= 2) continue; // il ne lâchera pas sa majorité
    const offer = Math.round((priceOf(i) * (1.15 + 0.15 * pf.trade) + pr.buildingCredits * 0.6) / 5) * 5;
    if (p.credits - offer < 30) continue;
    return { type: "PROPOSE_TRADE", playerId: me, toId: pr.ownerId, give: { credits: offer, materials: 0, energy: 0, properties: [] }, receive: { credits: 0, materials: 0, energy: 0, properties: [i] } };
  }
  return null;
}

/** Repli : une commande candidate quelconque acceptable (utilisé si une décision est refusée). */
export function fallback(s: GameState, now: number): Command[] {
  return candidateCommands(s, now);
}
