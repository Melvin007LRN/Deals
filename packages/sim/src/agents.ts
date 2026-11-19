/**
 * Agents DEALS (bots). Ils ne voient que ce qu'un joueur verrait : leur propre main,
 * l'état public, et n'utilisent jamais la pioche ni les objectifs adverses.
 * Ils produisent des intentions ; le moteur reste seul juge (applyCommand).
 */
import {
  BOARD,
  PROPERTY_INDICES,
  activePlayerId,
  applyCommand,
  buildCost,
  canBuild,
  canBuy,
  candidateCommands,
  card,
  cardCost,
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

/** Écart de patrimoine relatif : mon gain moins le gain moyen des adversaires (le leader compte double). */
function relativeWealth(s: GameState, me: PlayerId): number {
  const lines = computeScores(s);
  const mine = lines.find((l) => l.playerId === me)!.wealth;
  const opp = lines.filter((l) => l.playerId !== me);
  const leader = Math.max(...opp.map((l) => l.wealth));
  const avg = opp.reduce((a, l) => a + l.wealth, 0) / opp.length;
  return mine - (avg + leader) / 2;
}

/** Probabilité grossière qu'au moins un adversaire s'arrête sur une case donnée d'ici une manche. */
function landChance(s: GameState, index: number, excludeId: PlayerId | null): number {
  let miss = 1;
  for (const id of s.turnOrder) {
    if (id === excludeId) continue;
    const pos = s.players[id]!.position;
    const d = (index - pos + 24) % 24;
    const pHit = d >= 1 && d <= 4 ? 0.3 : d <= 8 ? 0.15 : 0.05;
    miss *= 1 - pHit;
  }
  return 1 - miss;
}

/**
 * Valeur espérée d'un coup de carte, en points de score relatifs.
 * 1) effet immédiat mesuré exactement en simulant le coup sur une copie (coût en ressources inclus, au barème du score) ;
 * 2) + estimation de l'effet différé (protections, réductions, bonus futurs).
 */
function cardEV(s: GameState, me: PlayerId, cmd: Extract<Command, { type: "PLAY_CARD" }>, pf: Profile): number {
  const def = card(s.cardInstances[cmd.instanceId]!);
  const r = applyCommand(s, cmd, { rng: { int: () => 0 }, now: 0 });
  if (!r.ok) return -Infinity;
  const after = r.state;
  let immediate = relativeWealth(after, me) - relativeWealth(s, me);
  const p = s.players[me]!;
  const n = s.turnOrder.length;
  const roundsLeft = RULES.rounds - s.round;
  const opps = s.turnOrder.filter((x) => x !== me);
  const oppCards = opps.reduce((a, id) => a + s.players[id]!.hand.length, 0);
  const attackThreat = Math.min(0.9, oppCards * 0.18); // chance d'être visé par une attaque d'ici mon prochain tour
  const myProps = PROPERTY_INDICES.filter((i) => s.properties[i]!.ownerId === me);
  const target = cmd.targetPlayerId ?? (cmd.propertyIndex !== undefined ? s.properties[cmd.propertyIndex]!.ownerId : null);
  const leader = leaderOpponent(s, me);
  const lead = target === leader ? 1.25 : 1;
  let later = 0;
  switch (def.key) {
    case "placement_malin":
      later = s.phase === "MANAGE" && PROPERTY_INDICES.some((i) => canBuild(s, me, i) === null) ? 10 : -99;
      break;
    case "chantier_express":
    case "permis_exceptionnel": {
      const buildable = myProps.filter((i) => controlsLevel(s, me, i)).length;
      later = s.phase === "MANAGE" && buildable >= 1 && p.credits > 80 && p.materials >= 3 ? 12 + 2 * roundsLeft : -99;
      break;
    }
    case "rendement_bonus":
      later = 15 * Math.min(1, landChance(s, cmd.propertyIndex!, me) * 1.6);
      break;
    case "revenus_garantis": {
      const dist = 24 - p.position;
      later = dist <= 2.5 * Math.max(1, roundsLeft) ? 18 : 2;
      break;
    }
    case "reduction_fiscale": later = s.phase === "TAX_DUE" ? 15 : -99; break;
    case "vote_municipal": {
      const cut = s.config.cardRevision === 2 ? 20 : 10;
      if (s.phase === "TAX_DUE") later = Math.min(cut, 15);
      else if (s.phase === "PRE_ROLL" && s.config.cardRevision === 2) {
        // espérance de ce que je paierai en arrivant (loyer ou taxe), plafonnée à la réduction
        const die = s.config.movementDie;
        later = die.reduce((acc, m) => {
          const i = (p.position + m) % 24;
          const pr = s.properties[i];
          const due = i === 20 ? 15 : pr && pr.ownerId && pr.ownerId !== me && !pr.mortgaged ? computeRent(s, i).total : 0;
          return acc + Math.min(cut, due) / die.length;
        }, 0);
      } else later = -99;
      break;
    }
    case "nouvelle_opportunite": later = s.phase === "BUY_DECISION" ? 20 : -99; break;
    case "contrat_privilegie": later = s.phase === "BUY_DECISION" ? 15 : -99; break;
    case "sabotage": {
      const rent = computeRent(s, cmd.propertyIndex!).total;
      later = (rent - Math.ceil(rent / 10) * 5) * landChance(s, cmd.propertyIndex!, s.properties[cmd.propertyIndex!]!.ownerId) * lead;
      break;
    }
    case "greve": {
      const owner = s.properties[cmd.propertyIndex!]!.ownerId!;
      const ctrl = ownedCount(s, owner, districtOf(cmd.propertyIndex!)) >= 2;
      later = ctrl && s.properties[cmd.propertyIndex!]!.level < 3 && s.players[owner]!.materials >= 1 ? 9 * lead : 0;
      break;
    }
    case "blocage_bancaire": later = 4 * lead; break;
    case "concurrence_agressive": {
      const t = cmd.targetPlayerId!;
      const owned = PROPERTY_INDICES.filter((i) => s.properties[i]!.ownerId === t);
      const pRent = 1 - owned.reduce((m, i) => m * (1 - landChance(s, i, t) * 0.8), 1);
      later = 10 * pRent * lead;
      break;
    }
    case "crise_locale": {
      const d = cmd.district!;
      let delta = 0;
      for (const i of PROPERTY_INDICES) {
        const pr = after.properties[i]!;
        if (districtOf(i) !== d || !pr.ownerId) continue;
        const loss = computeRent(s, i).total - computeRent(after, i).total;
        delta += (pr.ownerId === me ? -1 : 1) * loss * landChance(s, i, pr.ownerId);
      }
      later = delta;
      break;
    }
    case "prise_de_controle":
    case "opa_hostile": {
      // l'adversaire perd le bien ; il récupère le produit d'une enchère (~60 % de la valeur) : perte nette estimée
      const pr = s.properties[cmd.propertyIndex!]!;
      const breaks = ownedCount(s, pr.ownerId!, districtOf(pr.index)) >= 2 ? 25 : 0;
      later = -immediate + (priceOf(pr.index) * 0.7 + pr.buildingCredits * 0.5) * 0.4 + breaks * 0.8;
      later *= lead;
      const cc = cardCost(def, s.config.cardRevision ?? 1);
      immediate = -10 * (cc.materials + cc.energy) * resourceWeight(s);
      break;
    }
    case "assurance": {
      if (cmd.propertyIndex === undefined) {
        const rents = myProps.reduce((a, i) => a + computeRent(s, i).total, 0);
        later = attackThreat * 0.35 * rents * 0.5 + attackThreat * 4;
      } else later = attackThreat * 0.3 * computeRent(s, cmd.propertyIndex).total * 0.5;
      break;
    }
    case "bouclier_financier": later = attackThreat * 12; break;
    case "protection_juridique":
    case "assurance_immobiliere": {
      const pr = s.properties[cmd.propertyIndex!]!;
      const valueAtRisk = priceOf(pr.index) * 0.7 * 0.4 + pr.buildingCredits * 0.5 + (ownedCount(s, me, districtOf(pr.index)) >= 2 ? 20 : 0);
      later = attackThreat * 0.25 * valueAtRisk * (def.key === "protection_juridique" ? 1.2 : 1);
      break;
    }
    case "contre_offensive": later = attackThreat * 14 + attackThreat * 5; break;
    case "reserve_urgence": later = p.credits < 30 ? 12 : 0; break;
    case "negociateur": later = s.phase === "MANAGE" && tradeOffer(s, me, pf) ? 10 : -99; break;
    case "offre_speciale": later = s.phase === "MANAGE" && tradeOffer(s, me, pf) ? 8 : -99; break;
    case "influence_locale": {
      const d = cmd.district!;
      const enables = PROPERTY_INDICES.some((i) => districtOf(i) === d && after.properties[i]!.ownerId === me && canBuild(after, me, i) === null && canBuild(s, me, i) === "NO_MAJORITY");
      later = s.phase === "MANAGE" && enables ? 14 + roundsLeft : -99;
      break;
    }
    case "reforme_urbaine": later = ownedCount(s, me, cmd.district!) >= 2 ? 6 : -99; break;
  }
  const fam = { investment: pf.invest, attack: pf.attack, defense: pf.defense, commerce: pf.trade, politics: 1 }[def.family];
  return immediate + later * fam;
}

function controlsLevel(s: GameState, me: PlayerId, i: number): boolean {
  const pr = s.properties[i]!;
  return pr.ownerId === me && !pr.mortgaged && pr.level < 3 && ownedCount(s, me, districtOf(i)) >= 2;
}

function resourceWeight(s: GameState): number {
  return (s.config.resourceScore ?? RULES.scorePerResource) / 10;
}

function bestCardPlay(s: GameState, me: PlayerId, pf: Profile, rng: Rng): Command | null {
  if (s.turn.cardPlayed) return null;
  const plays = cardPlays(s);
  if (!plays.length) return null;
  // une carte encore en main en fin de partie ne vaut rien : le seuil baisse au fil des manches
  const threshold = Math.max(0, 4 - s.round / 3);
  let best: Command | null = null;
  let bestV = threshold;
  for (const c of plays) {
    let v = cardEV(s, me, c, pf);
    if (pf.name === "random") v += rng.int(8) - 4;
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
