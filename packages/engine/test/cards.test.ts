import { describe, expect, it } from "vitest";
import { CARDS } from "../src/content/cards.ts";
import { computeRent } from "../src/engine.ts";
import type { Command, GameState } from "../src/types.ts";
import { ctx, endTurn, giveCard, newGame, own, rejects, roll, run, runEv, toManage } from "./helpers.ts";
import { setLevel } from "./helpers.ts";

/** Partie en phase MANAGE, joueur A riche en ressources, avec la carte en main. */
function withCard(key: string, phase: "MANAGE" | "PRE_ROLL" = "MANAGE") {
  const g = newGame();
  const { s, a } = g;
  if (phase === "MANAGE") toManage(s);
  s.players[a]!.materials = 6;
  s.players[a]!.energy = 5;
  const inst = giveCard(s, a, key);
  const play = (st: GameState, extra: Partial<Extract<Command, { type: "PLAY_CARD" }>> = {}) =>
    run(st, { type: "PLAY_CARD", playerId: a, instanceId: inst, ...extra });
  return { ...g, inst, play };
}

function passAllAuction(s: GameState): GameState {
  while (s.phase === "AUCTION") {
    const id = s.auction!.activeBidders.find((x) => x !== s.auction!.highestBidderId)!;
    s = run(s, { type: "PASS_AUCTION", playerId: id });
  }
  return s;
}

describe("Règles générales des cartes", () => {
  it("coût payé exactement une fois, carte défaussée, une seule carte par tour", () => {
    const { s, a, play } = withCard("coup_de_pouce");
    const inst2 = giveCard(s, a, "magnat");
    const t = play(s);
    expect([t.players[a]!.materials, t.players[a]!.energy, t.players[a]!.credits]).toEqual([6, 4, 170]);
    expect(t.players[a]!.hand).toEqual([inst2]);
    rejects(t, { type: "PLAY_CARD", playerId: a, instanceId: inst2 }, "CARD_ALREADY_PLAYED");
  });
  it("uniquement pendant son propre tour", () => {
    const { s, b } = withCard("coup_de_pouce");
    const ib = giveCard(s, b, "magnat");
    s.players[b]!.materials = 3; s.players[b]!.energy = 3;
    rejects(s, { type: "PLAY_CARD", playerId: b, instanceId: ib }, "NOT_YOUR_TURN");
  });
  it("ressources insuffisantes → refus sans changement", () => {
    const { s, a, inst } = withCard("magnat");
    s.players[a]!.energy = 1;
    rejects(s, { type: "PLAY_CARD", playerId: a, instanceId: inst }, "INSUFFICIENT_RESOURCES");
  });
  it("pas d'attaque pendant le redressement", () => {
    const { s, a, b, inst } = withCard("pression_fiscale");
    s.players[a]!.recoveryResolveTurn = 2;
    rejects(s, { type: "PLAY_CARD", playerId: a, instanceId: inst, targetPlayerId: b }, "IN_RECOVERY");
  });
  it("chaque carte du catalogue a un effet implémenté (aucune UNIMPLEMENTED_CARD)", () => {
    for (const def of CARDS) {
      const { s, a, b, inst } = withCard(def.key);
      own(s, a, 1, 2);
      own(s, b, 5, 6);
      const cmd: Extract<Command, { type: "PLAY_CARD" }> = { type: "PLAY_CARD", playerId: a, instanceId: inst };
      if (def.target === "opponent") cmd.targetPlayerId = b;
      if (def.target === "ownProperty") cmd.propertyIndex = 1;
      if (def.target === "opponentProperty") cmd.propertyIndex = 5;
      if (def.target === "district") cmd.district = "commercial";
      if (def.target === "resource") cmd.resource = "materials";
      if (def.target === "swap") { cmd.propertyIndex = 2; cmd.otherPropertyIndex = 5; }
      if (["reduction_fiscale", "vote_municipal", "nouvelle_opportunite", "contrat_privilegie"].includes(def.key)) s.phase = "PRE_ROLL";
      const r = runEv(s, cmd);
      expect(r.state.players[a]!.stats.cardsPlayed, def.key).toBe(1);
    }
  });
});

describe("Investissement", () => {
  it("1 Placement malin : -10 D sur une construction", () => {
    const { s, a, play } = withCard("placement_malin");
    own(s, a, 9, 10);
    const t = run(play(s), { type: "BUILD", playerId: a, propertyIndex: 9 });
    expect(t.players[a]!.credits).toBe(140);
    expect(t.properties[9]!.buildingCredits).toBe(10);
  });
  it("2 Coup de pouce : +20 D", () => {
    const { s, a, play } = withCard("coup_de_pouce");
    expect(play(s).players[a]!.credits).toBe(170);
  });
  it("3 Rendement bonus : +15 D au prochain loyer réellement payé, puis consommé", () => {
    const { s, a, play } = withCard("rendement_bonus");
    own(s, a, 3);
    const t = play(s, { propertyIndex: 3 });
    expect(computeRent(t, 3).total).toBe(25);
    // B s'arrête sur la case 3 au tour suivant : paie 25 D, l'effet est consommé
    let u = endTurn(t);
    const b = u.turnOrder[u.activeIndex]!;
    u.players[b]!.position = 0;
    u = roll(u, b, 3, "materials");
    expect(u.players[b]!.credits).toBe(125);
    expect(u.effects.some((e) => e.kind === "rentBonus")).toBe(false);
    expect(computeRent(u, 3).total).toBe(10);
  });
  it("4 Chantier express / 33 Permis exceptionnel : construction supplémentaire, conditions maintenues", () => {
    for (const key of ["chantier_express", "permis_exceptionnel"]) {
      const { s, a, play } = withCard(key);
      own(s, a, 9, 10);
      s.players[a]!.credits = 300;
      let t = play(s);
      t = run(t, { type: "BUILD", playerId: a, propertyIndex: 9 });
      t = run(t, { type: "BUILD", playerId: a, propertyIndex: 10 });
      rejects(t, { type: "BUILD", playerId: a, propertyIndex: 9 }, "BUILD_LIMIT");
      rejects(t, { type: "BUILD", playerId: a, propertyIndex: 1 }, "NOT_OWNER");
    }
  });
  it("5 Bon investissement : +1 Matériau, au plafond +5 D", () => {
    const { s, a, play } = withCard("bon_investissement");
    expect(play(s).players[a]!.materials).toBe(7);
    const g2 = withCard("bon_investissement");
    g2.s.players[g2.a]!.materials = 8;
    const t = g2.play(g2.s);
    expect([t.players[g2.a]!.materials, t.players[g2.a]!.credits]).toEqual([8, 155]);
  });
  it("6 Revenus garantis : +20 D au prochain passage Départ ; un seul effet actif", () => {
    const { s, a, play } = withCard("revenus_garantis", "PRE_ROLL");
    let t = play(s);
    const i2 = giveCard(t, a, "revenus_garantis".replace("revenus_garantis", "revenus_garantis"));
    void i2;
    t.players[a]!.position = 23;
    t = roll(t, a, 1, "materials");
    expect(t.players[a]!.credits).toBe(150 + 40 + 20);
    expect(t.effects.some((e) => e.kind === "guaranteedIncome")).toBe(false);
  });
  it("7 Réduction fiscale : taxe annulée ; 32 Vote municipal : -10 D", () => {
    for (const [key, expected] of [["reduction_fiscale", 150], ["vote_municipal", 145]] as const) {
      const { s, a, play } = withCard(key, "PRE_ROLL");
      s.players[a]!.position = 18;
      let t = roll(s, a, 2, "materials");
      expect(t.phase).toBe("TAX_DUE");
      t = play(t);
      t = run(t, { type: "PAY_TAX", playerId: a });
      expect(t.players[a]!.credits).toBe(expected);
    }
  });
  it("8 Nouvelle opportunité (-20) et 29 Contrat privilégié (-15) : achat volontaire seulement", () => {
    for (const [key, expected] of [["nouvelle_opportunite", 110], ["contrat_privilegie", 105]] as const) {
      const { s, a, play } = withCard(key, "PRE_ROLL");
      let t = roll(s, a, 3, "materials"); // 60 D
      t = play(t);
      t = run(t, { type: "BUY_PROPERTY", playerId: a });
      expect(t.players[a]!.credits).toBe(expected);
    }
  });
  it("35 Magnat : +40 D et +1 Matériau", () => {
    const { s, a, play } = withCard("magnat");
    const t = play(s);
    expect([t.players[a]!.credits, t.players[a]!.materials]).toEqual([190, 5]);
  });
});

describe("Attaque", () => {
  it("9 Sabotage : prochain loyer -50 %, puis consommé", () => {
    let { s, a, b, play } = withCard("sabotage");
    own(s, b, 3);
    s = play(s, { propertyIndex: 3 });
    expect(computeRent(s, 3).total).toBe(5);
    s = endTurn(s);
    // B ne paie pas sur sa propriété ; C s'arrête dessus
    s = roll(s, b, 1, "materials");
    if (s.phase === "BUY_DECISION") s = passAllAuction(run(s, { type: "DECLINE_PROPERTY", playerId: b }));
    s = endTurn(s);
    const c = s.turnOrder[s.activeIndex]!;
    s = roll(s, c, 3, "materials");
    expect(s.players[c]!.credits).toBe(145);
    expect(s.effects.some((e) => e.kind === "sabotage")).toBe(false);
  });
  it("10 Pression fiscale : 15 D à la banque, dette si insuffisant", () => {
    const { s, a, b, play } = withCard("pression_fiscale");
    s.players[b]!.credits = 5;
    const t = play(s, { targetPlayerId: b });
    expect([t.players[b]!.credits, t.players[b]!.debt]).toEqual([0, 10]);
    expect(t.players[a]!.credits).toBe(150);
  });
  it("11 Grève : propriété non améliorable pendant le prochain tour du propriétaire, puis libérée", () => {
    let { s, b, play } = withCard("greve");
    own(s, b, 9, 10);
    s = play(s, { propertyIndex: 9 });
    s = endTurn(s);
    s = roll(s, b, 1, "materials");
    if (s.phase === "BUY_DECISION") s = passAllAuction(run(s, { type: "DECLINE_PROPERTY", playerId: b }));
    rejects(s, { type: "BUILD", playerId: b, propertyIndex: 9 }, "STRIKE");
    s = run(s, { type: "BUILD", playerId: b, propertyIndex: 10 });
    s = endTurn(s);
    expect(s.effects.some((e) => e.kind === "noUpgrade")).toBe(false);
  });
  it("12 Inspection / 16 Fraude : -1 ressource, sinon -5 D", () => {
    for (const [key, kind] of [["inspection", "materials"], ["fraude_commerciale", "energy"]] as const) {
      const { s, b, play } = withCard(key);
      let t = play(structuredClone(s), { targetPlayerId: b });
      expect(t.players[b]![kind]).toBe(s.players[b]![kind] - 1);
      s.players[b]![kind] = 0;
      t = play(s, { targetPlayerId: b });
      expect(t.players[b]!.credits).toBe(145);
    }
  });
  it("13 Blocage bancaire : pas d'achat volontaire au prochain tour de la cible, enchère permise", () => {
    let { s, b, play } = withCard("blocage_bancaire");
    s = endTurn(play(s, { targetPlayerId: b }));
    s = roll(s, b, 1, "materials");
    rejects(s, { type: "BUY_PROPERTY", playerId: b }, "BANK_BLOCKED");
    s = run(s, { type: "DECLINE_PROPERTY", playerId: b });
    s = run(s, { type: "PLACE_BID", playerId: b, amount: 20 });
    s = passAllAuction(s);
    expect(s.properties[1]!.ownerId).toBe(b);
    s = endTurn(s);
    expect(s.effects.some((e) => e.kind === "noBuy")).toBe(false);
  });
  it("14 Détournement : jusqu'à 10 D transférés à l'attaquant", () => {
    const { s, a, b, play } = withCard("detournement");
    s.players[b]!.credits = 7;
    const t = play(s, { targetPlayerId: b });
    expect([t.players[a]!.credits, t.players[b]!.credits, t.players[b]!.debt]).toEqual([157, 0, 0]);
  });
  it("15 Concurrence agressive : prochain loyer reçu par la cible -10 D", () => {
    const { s, b, play } = withCard("concurrence_agressive");
    own(s, b, 15);
    const t = play(s, { targetPlayerId: b });
    expect(computeRent(t, 15).total).toBe(5);
  });
  it("17 Prise de contrôle : propriété retirée puis enchère ; jamais transférée directement ; ancien propriétaire payé", () => {
    let { s, a, b, c, play } = withCard("prise_de_controle");
    own(s, b, 6);
    setLevel(s, 6, 1);
    s = play(s, { propertyIndex: 6 });
    expect(s.phase).toBe("AUCTION");
    expect(s.properties[6]!.ownerId).toBeNull();
    expect(s.auction!.startPrice).toBe(40);
    expect(s.auction!.activeBidders.sort()).toEqual([a, b, c].sort());
    s = run(s, { type: "PLACE_BID", playerId: a, amount: 40 });
    s = run(s, { type: "PLACE_BID", playerId: b, amount: 45 });
    s = run(s, { type: "PLACE_BID", playerId: a, amount: 50 });
    s = passAllAuction(s);
    expect(s.properties[6]!.ownerId).toBe(a);
    expect(s.properties[6]!.level).toBe(1);
    expect(s.players[b]!.credits).toBe(200);
    expect(s.phase).toBe("MANAGE");
  });
  it("17 : une attaque immobilière par propriété et par manche ; hypothéquée non ciblable", () => {
    const { s, a, b, play } = withCard("prise_de_controle");
    own(s, b, 6, 7);
    s.properties[7]!.mortgaged = true;
    s.properties[6]!.lastRealtyAttackRound = 1;
    const i2 = s.players[a]!.hand[0]!;
    rejects(s, { type: "PLAY_CARD", playerId: a, instanceId: i2, propertyIndex: 6 }, "ALREADY_ATTACKED_THIS_ROUND");
    rejects(s, { type: "PLAY_CARD", playerId: a, instanceId: i2, propertyIndex: 7 }, "TARGET_MORTGAGED");
    void play;
  });
  it("18 Crise locale : loyers du quartier -25 % jusqu'au prochain tour du lanceur ; non cumulable", () => {
    let { s, a, b, play } = withCard("crise_locale");
    own(s, b, 15);
    setLevel(s, 15, 1); // 15 × 1,5 = 22,5 → ×0,75 = 16,9 → 20
    s = play(s, { district: "touristic" });
    expect(computeRent(s, 15).total).toBe(20);
    const i2 = giveCard(s, b, "crise_locale");
    s = endTurn(s);
    s = roll(s, b, 1, "materials");
    if (s.phase === "BUY_DECISION") s = passAllAuction(run(s, { type: "DECLINE_PROPERTY", playerId: b }));
    s.players[b]!.materials = 3; s.players[b]!.energy = 3;
    rejects(s, { type: "PLAY_CARD", playerId: b, instanceId: i2, district: "touristic" }, "NOT_CUMULATIVE");
    // expiration au début du prochain tour de A
    while (s.turnOrder[s.activeIndex] !== a) {
      const id = s.turnOrder[s.activeIndex]!;
      if (s.phase === "PRE_ROLL") s = roll(s, id, 1, "materials");
      if (s.phase === "BUY_DECISION") s = passAllAuction(run(s, { type: "DECLINE_PROPERTY", playerId: id }));
      if (s.phase === "CHANCE_CHOICE") s = run(s, { type: "CHOOSE_CARD", playerId: id, keep: s.pendingDraw[0]! });
      s = endTurn(s);
    }
    expect(s.effects.some((e) => e.kind === "districtCrisis")).toBe(false);
  });
  it("36 OPA hostile : ignore les protections (R05)", () => {
    let { s, a, b, play } = withCard("opa_hostile");
    own(s, b, 6);
    s.effects.push({ id: 900, kind: "legalProtection", sourceId: b, propertyIndex: 6, expiry: { kind: "never" } });
    s.effects.push({ id: 901, kind: "counterOffensive", sourceId: b, targetPlayerId: b, expiry: { kind: "never" } });
    s = play(s, { propertyIndex: 6 });
    expect(s.phase).toBe("AUCTION");
    void a;
  });
});

describe("Défense (préinstallée pendant son tour)", () => {
  it("19 Assurance : bloque le prochain Sabotage puis est consommée", () => {
    let { s, a, b } = withCard("sabotage");
    own(s, b, 3);
    s.effects.push({ id: 900, kind: "insurance", sourceId: b, propertyIndex: 3, expiry: { kind: "never" } });
    const r = runEv(s, { type: "PLAY_CARD", playerId: a, instanceId: s.players[a]!.hand[0]!, propertyIndex: 3 });
    expect(r.events.some((e) => e.type === "ATTACK_BLOCKED" && e.data.by === "insurance")).toBe(true);
    expect(r.state.effects.some((e) => e.kind === "sabotage" || e.kind === "insurance")).toBe(false);
  });
  it("19 Assurance : protège aussi contre la réduction de Crise locale", () => {
    const { s, b } = newGame();
    own(s, b, 15);
    setLevel(s, 15, 1); // 15 × 1,5 = 22,5 → 25 ; en crise 16,9 → 20
    s.effects.push({ id: 1, kind: "districtCrisis", sourceId: "x", district: "touristic", expiry: { kind: "never" } });
    expect(computeRent(s, 15).total).toBe(20);
    s.effects.push({ id: 2, kind: "insurance", sourceId: b, propertyIndex: 15, expiry: { kind: "never" } });
    expect(computeRent(s, 15).total).toBe(25);
  });
  it("19/21/24 : installées sur sa propre propriété, échéance au début de son prochain tour", () => {
    for (const key of ["assurance", "protection_juridique", "assurance_immobiliere"]) {
      let { s, a, play } = withCard(key);
      own(s, a, 1);
      s = play(s, { propertyIndex: 1 });
      expect(s.effects.length).toBe(1);
      expect(s.effects[0]!.expiry).toEqual({ kind: "turnStart", playerId: a, turn: 2 });
      rejects(s, { type: "PLAY_CARD", playerId: a, instanceId: giveCard(s, a, "magnat"), propertyIndex: 1 }, "CARD_ALREADY_PLAYED");
    }
  });
  it("20 Bouclier financier : réduit de 15 D une perte causée par une carte, pas un loyer", () => {
    const { s, a, b } = withCard("pression_fiscale");
    s.effects.push({ id: 900, kind: "financialShield", sourceId: b, targetPlayerId: b, expiry: { kind: "never" } });
    const t = run(s, { type: "PLAY_CARD", playerId: a, instanceId: s.players[a]!.hand[0]!, targetPlayerId: b });
    expect(t.players[b]!.credits).toBe(150);
    expect(t.effects.length).toBe(0);
  });
  it("21 Protection juridique : bloque Prise de contrôle sans être consommée", () => {
    const { s, a, b } = withCard("prise_de_controle");
    own(s, b, 6);
    s.effects.push({ id: 900, kind: "legalProtection", sourceId: b, propertyIndex: 6, expiry: { kind: "never" } });
    const t = run(s, { type: "PLAY_CARD", playerId: a, instanceId: s.players[a]!.hand[0]!, propertyIndex: 6 });
    expect(t.properties[6]!.ownerId).toBe(b);
    expect(t.effects.length).toBe(1);
    expect(t.properties[6]!.lastRealtyAttackRound).toBe(1);
  });
  it("24 Assurance immobilière : bloque la prochaine attaque immobilière et est consommée", () => {
    const { s, a, b } = withCard("prise_de_controle");
    own(s, b, 6);
    s.effects.push({ id: 900, kind: "realtyInsurance", sourceId: b, propertyIndex: 6, expiry: { kind: "never" } });
    const t = run(s, { type: "PLAY_CARD", playerId: a, instanceId: s.players[a]!.hand[0]!, propertyIndex: 6 });
    expect(t.properties[6]!.ownerId).toBe(b);
    expect(t.effects.length).toBe(0);
  });
  it("22 Contre-offensive : annule la prochaine attaque, l'attaquant perd 1 Énergie", () => {
    const { s, a, b } = withCard("detournement");
    s.effects.push({ id: 900, kind: "counterOffensive", sourceId: b, targetPlayerId: b, expiry: { kind: "never" } });
    const t = run(s, { type: "PLAY_CARD", playerId: a, instanceId: s.players[a]!.hand[0]!, targetPlayerId: b });
    expect(t.players[b]!.credits).toBe(150);
    expect(t.players[a]!.energy).toBe(5 - 1 - 1);
  });
  it("une seule protection consommée par attaque (ordre propriété → personnelle)", () => {
    const { s, a, b } = withCard("prise_de_controle");
    own(s, b, 6);
    s.effects.push({ id: 900, kind: "realtyInsurance", sourceId: b, propertyIndex: 6, expiry: { kind: "never" } });
    s.effects.push({ id: 901, kind: "counterOffensive", sourceId: b, targetPlayerId: b, expiry: { kind: "never" } });
    const t = run(s, { type: "PLAY_CARD", playerId: a, instanceId: s.players[a]!.hand[0]!, propertyIndex: 6 });
    expect(t.effects.map((e) => e.kind)).toEqual(["counterOffensive"]);
  });
  it("23 Réserve d'urgence : avance 15 D en dette si le loyer provoque l'incapacité", () => {
    const { s, a, b, play } = withCard("reserve_urgence", "PRE_ROLL");
    own(s, b, 23);
    setLevel(s, 23, 1); // 15 × 1,5 = 22,5 → 25
    let t = play(s);
    t.players[a]!.credits = 0;
    t.players[a]!.materials = 0;
    t.players[a]!.energy = 0;
    t.players[a]!.position = 20;
    t = roll(t, a, 3, "credits"); // 10 D + 15 D avance = 25
    expect([t.players[a]!.credits, t.players[a]!.debt, t.players[a]!.recoveryResolveTurn]).toEqual([0, 15, null]);
  });
  it("bonus Centre-ville : une attaque mineure bloquée par manche", () => {
    const { s, a, b } = withCard("detournement");
    own(s, b, 21, 22);
    const i2 = giveCard(s, a, "pression_fiscale");
    let t = run(s, { type: "PLAY_CARD", playerId: a, instanceId: s.players[a]!.hand[0]!, targetPlayerId: b });
    expect(t.players[b]!.credits).toBe(150);
    t.turn.cardPlayed = false;
    t = run(t, { type: "PLAY_CARD", playerId: a, instanceId: i2, targetPlayerId: b });
    expect(t.players[b]!.credits).toBe(135);
  });
});

describe("Commerce et Politique", () => {
  it("25 Négociateur : -10 D sur les crédits que le joueur ajoute à un échange", () => {
    let { s, a, b, play } = withCard("negociateur");
    own(s, b, 5);
    s = play(s);
    s = run(s, { type: "PROPOSE_TRADE", playerId: a, toId: b, give: { credits: 30, materials: 0, energy: 0, properties: [] }, receive: { credits: 0, materials: 0, energy: 0, properties: [5] } });
    s = run(s, { type: "ACCEPT_TRADE", playerId: b });
    expect([s.players[a]!.credits, s.players[b]!.credits]).toEqual([130, 170]);
  });
  it("26 Offre spéciale : +1 Matériau après un échange accepté", () => {
    let { s, a, b, play } = withCard("offre_speciale");
    s = play(s);
    s = run(s, { type: "PROPOSE_TRADE", playerId: a, toId: b, give: { credits: 5, materials: 0, energy: 0, properties: [] }, receive: { credits: 0, materials: 0, energy: 1, properties: [] } });
    s = run(s, { type: "ACCEPT_TRADE", playerId: b });
    expect(s.players[a]!.materials).toBe(7);
  });
  it("27 Courtier : vend une ressource 15 D", () => {
    const { s, a, play } = withCard("courtier");
    const t = play(s, { resource: "energy" });
    expect([t.players[a]!.energy, t.players[a]!.credits]).toEqual([4, 165]);
  });
  it("28 Partenariat (R07) : la cible verse 10 D, sinon 1 ressource", () => {
    const { s, a, b, play } = withCard("partenariat");
    let t = play(structuredClone(s), { targetPlayerId: b });
    expect([t.players[a]!.credits, t.players[b]!.credits]).toEqual([160, 140]);
    s.players[b]!.credits = 5;
    t = play(s, { targetPlayerId: b });
    expect([t.players[a]!.materials, t.players[b]!.materials]).toEqual([7, 1]);
  });
  it("30 Fusion (R07) : échange imposé de deux propriétés de valeur ±10 D sans bâtiment", () => {
    const { s, a, b, play } = withCard("fusion");
    own(s, a, 2);
    own(s, b, 5, 23);
    let t = play(structuredClone(s), { propertyIndex: 2, otherPropertyIndex: 5 });
    expect([t.properties[2]!.ownerId, t.properties[5]!.ownerId]).toEqual([b, a]);
    rejects(s, { type: "PLAY_CARD", playerId: a, instanceId: s.players[a]!.hand[0]!, propertyIndex: 2, otherPropertyIndex: 23 }, "VALUE_MISMATCH");
    setLevel(s, 5, 1);
    rejects(s, { type: "PLAY_CARD", playerId: a, instanceId: s.players[a]!.hand[0]!, propertyIndex: 2, otherPropertyIndex: 5 }, "INVALID_TARGET");
  });
  it("31 Influence locale : +1 pour la majorité de construction jusqu'à la fin du tour, jamais pour le score", () => {
    let { s, a, play } = withCard("influence_locale");
    own(s, a, 9);
    rejects(s, { type: "BUILD", playerId: a, propertyIndex: 9 }, "NO_MAJORITY");
    s = play(s, { district: "industrial" });
    s = run(s, { type: "BUILD", playerId: a, propertyIndex: 9 });
    expect(s.properties[9]!.level).toBe(1);
    s = endTurn(s);
    expect(s.effects.some((e) => e.kind === "influence")).toBe(false);
  });
  it("34 Réforme urbaine : double le bonus économique (Touristique +20 au Départ)", () => {
    let { s, a, play } = withCard("reforme_urbaine", "PRE_ROLL");
    own(s, a, 13, 14);
    s = play(s, { district: "touristic" });
    s.players[a]!.position = 23;
    s = roll(s, a, 1, "materials");
    expect(s.players[a]!.credits).toBe(150 + 40 + 20);
  });
});

describe("Bonus de quartier (provisoires)", () => {
  it("Commercial : +5 D au contrôleur quand un adversaire paie un loyer dans le quartier", () => {
    const { s, a, b } = newGame();
    own(s, b, 5, 6);
    s.players[a]!.position = 4;
    const t = roll(s, a, 1, "materials");
    expect(t.players[b]!.credits).toBe(150 + 15 + 5); // 10 × 1,1 → 15, + bonus 5
  });
  it("Industriel : +1 Matériau au début du tour du contrôleur", () => {
    let { s, a, b } = newGame();
    own(s, b, 9, 10);
    s = endTurn(roll(s, a, 1, "materials").phase === "BUY_DECISION" ? passAllAuction(run(roll(s, a, 1, "materials"), { type: "DECLINE_PROPERTY", playerId: a })) : roll(s, a, 1, "materials"));
    expect(s.players[b]!.materials).toBe(3);
  });
  it("Affaires : -5 D sur une enchère gagnée", () => {
    let { s, a, b } = newGame();
    own(s, a, 17, 18);
    s = roll(s, a, 2, "materials");
    s = run(s, { type: "DECLINE_PROPERTY", playerId: a });
    s = run(s, { type: "PLACE_BID", playerId: a, amount: 25 });
    s = passAllAuction(s);
    expect(s.players[a]!.credits).toBe(130);
    void b;
  });
  it("Touristique : +10 D au passage Départ", () => {
    const { s, a } = newGame();
    own(s, a, 13, 14);
    s.players[a]!.position = 23;
    expect(roll(s, a, 1, "materials").players[a]!.credits).toBe(200);
  });
});

void ctx;
