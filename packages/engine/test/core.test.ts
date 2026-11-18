import { describe, expect, it } from "vitest";
import { applyCommand, computeRent, computeScores, createGame } from "../src/engine.ts";
import { seededRng } from "../src/rng.ts";
import { viewFor } from "../src/view.ts";
import { ctx, endTurn, giveCard, newGame, own, rejects, roll, run, runEv, scripted, toManage, MOVE, RES } from "./helpers.ts";
import { setLevel } from "./helpers.ts";

describe("Création de partie", () => {
  it("3 ou 4 joueurs seulement", () => {
    expect(() => createGame([{ id: "A", name: "A" }, { id: "B", name: "B" }], ctx())).toThrow();
    expect(() => createGame(["A", "B", "C", "D", "E"].map((id) => ({ id, name: id })), ctx())).toThrow();
    expect(() => createGame(["A", "B", "C", "D"].map((id) => ({ id, name: id })), ctx())).not.toThrow();
  });
  it("capital de départ, position 0, objectifs distincts, 36 cartes en pioche", () => {
    const { s } = newGame(4);
    const ps = Object.values(s.players);
    for (const p of ps) expect([p.credits, p.materials, p.energy, p.position, p.hand.length]).toEqual([150, 2, 1, 0, 0]);
    expect(new Set(ps.map((p) => p.objectiveId)).size).toBe(4);
    expect(s.deck.length).toBe(36);
    expect(s.round).toBe(1);
    expect(s.phase).toBe("PRE_ROLL");
  });
  it("ordre aléatoire puis fixe", () => {
    const orders = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((seed) => newGame(3, seed).s.turnOrder.join("")));
    expect(orders.size).toBeGreaterThan(1);
  });
});

describe("Dés, ressources, déplacement", () => {
  it("face Crédits +10 D, puis déplacement exact", () => {
    const { s, a } = newGame();
    const t = roll(s, a, 2, "credits");
    expect(t.players[a]!.credits).toBe(160);
    expect(t.players[a]!.position).toBe(2);
  });
  it("face Matériaux +1, face Énergie +1", () => {
    let { s, a } = newGame();
    expect(roll(s, a, 1, "materials").players[a]!.materials).toBe(3);
    ({ s, a } = newGame());
    expect(roll(s, a, 1, "energy").players[a]!.energy).toBe(2);
  });
  it("face Choix : +5 D ou +1 Matériau ou +1 Énergie, puis déplacement", () => {
    const { s, a } = newGame();
    let t = roll(s, a, 3, "choice");
    expect(t.phase).toBe("RESOURCE_CHOICE");
    expect(t.players[a]!.position).toBe(0);
    t = run(t, { type: "CHOOSE_RESOURCE", playerId: a, resource: "credits" });
    expect(t.players[a]!.credits).toBe(155);
    expect(t.players[a]!.position).toBe(3);
  });
  it("plafond Matériaux 8 : choix d'une autre récompense, matériaux refusés", () => {
    const { s, a } = newGame();
    s.players[a]!.materials = 8;
    let t = roll(s, a, 1, "materials");
    expect(t.phase).toBe("RESOURCE_CHOICE");
    rejects(t, { type: "CHOOSE_RESOURCE", playerId: a, resource: "materials" }, "INVALID_CHOICE");
    t = run(t, { type: "CHOOSE_RESOURCE", playerId: a, resource: "energy" });
    expect(t.players[a]!.energy).toBe(2);
    expect(t.players[a]!.materials).toBe(8);
  });
  it("wrap 23 → 1 et +40 D une seule fois", () => {
    const { s, a } = newGame();
    s.players[a]!.position = 23;
    const r = runEv(s, { type: "ROLL_DICE", playerId: a }, ctx(scripted([MOVE(2), RES.materials])));
    expect(r.state.players[a]!.position).toBe(1);
    expect(r.state.players[a]!.credits).toBe(190);
    expect(r.events.filter((e) => e.type === "START_PASSED").length).toBe(1);
  });
  it("arriver exactement sur Départ compte comme franchissement", () => {
    const { s, a } = newGame();
    s.players[a]!.position = 21;
    const t = roll(s, a, 3, "materials");
    expect(t.players[a]!.position).toBe(0);
    expect(t.players[a]!.credits).toBe(190);
  });
  it("pas de bonus sans franchissement", () => {
    const { s, a } = newGame();
    s.players[a]!.position = 20;
    expect(roll(s, a, 3, "materials").players[a]!.credits).toBe(150);
  });
  it("seul le joueur actif lance, une seule fois", () => {
    const { s, a, b } = newGame();
    rejects(s, { type: "ROLL_DICE", playerId: b }, "NOT_YOUR_TURN");
    const t = roll(s, a, 1);
    rejects(t, { type: "ROLL_DICE", playerId: a }, "WRONG_PHASE");
  });
});

describe("Achat, refus et enchères", () => {
  it("achat au prix affiché", () => {
    const { s, a } = newGame();
    let t = roll(s, a, 1, "materials"); // case 1 : 40 D
    expect(t.phase).toBe("BUY_DECISION");
    t = run(t, { type: "BUY_PROPERTY", playerId: a });
    expect(t.properties[1]!.ownerId).toBe(a);
    expect(t.players[a]!.credits).toBe(110);
    expect(t.phase).toBe("MANAGE");
  });
  it("réserve de 25 D après achat volontaire", () => {
    const { s, a } = newGame();
    s.players[a]!.credits = 64;
    const t = roll(s, a, 1, "materials");
    rejects(t, { type: "BUY_PROPERTY", playerId: a }, "RESERVE_REQUIRED");
    t.players[a]!.credits = 65;
    expect(run(t, { type: "BUY_PROPERTY", playerId: a }).players[a]!.credits).toBe(25);
  });
  it("refus → enchère ouverte à tous, y compris le joueur qui refuse ; départ 50 % arrondi au 5 inférieur", () => {
    const { s, a, b, c } = newGame();
    let t = roll(s, a, 3, "materials"); // case 3 : 60 D
    t = run(t, { type: "DECLINE_PROPERTY", playerId: a });
    expect(t.phase).toBe("AUCTION");
    expect(t.auction!.startPrice).toBe(30);
    expect(t.auction!.activeBidders.sort()).toEqual([a, b, c].sort());
    rejects(t, { type: "PLACE_BID", playerId: b, amount: 25 }, "BID_TOO_LOW");
    rejects(t, { type: "PLACE_BID", playerId: b, amount: 32 }, "INVALID_AMOUNT");
    t = run(t, { type: "PLACE_BID", playerId: b, amount: 30 });
    rejects(t, { type: "PLACE_BID", playerId: c, amount: 30 }, "BID_TOO_LOW");
    t = run(t, { type: "PLACE_BID", playerId: a, amount: 35 });
    t = run(t, { type: "PASS_AUCTION", playerId: b });
    t = run(t, { type: "PASS_AUCTION", playerId: c });
    expect(t.phase).toBe("MANAGE");
    expect(t.properties[3]!.ownerId).toBe(a);
    expect(t.players[a]!.credits).toBe(115);
  });
  it("tous passent → propriété libre", () => {
    const { s, a, b, c } = newGame();
    let t = roll(s, a, 2, "materials");
    t = run(t, { type: "DECLINE_PROPERTY", playerId: a });
    for (const id of [a, b, c]) t = run(t, { type: "PASS_AUCTION", playerId: id });
    expect(t.properties[2]!.ownerId).toBeNull();
    expect(t.phase).toBe("MANAGE");
  });
  it("clôture serveur au chrono uniquement, jamais avant l'échéance", () => {
    const { s, a, b } = newGame();
    let t = roll(s, a, 2, "materials");
    t = run(t, { type: "DECLINE_PROPERTY", playerId: a }, ctx(undefined, 1000));
    t = run(t, { type: "PLACE_BID", playerId: b, amount: 25 }, ctx(undefined, 2000));
    rejects(t, { type: "CLOSE_AUCTION", playerId: a }, "AUCTION_RUNNING", ctx(undefined, 5000));
    rejects(t, { type: "PLACE_BID", playerId: a, amount: 30 }, "AUCTION_EXPIRED", ctx(undefined, 12_001));
    t = run(t, { type: "CLOSE_AUCTION", playerId: a }, ctx(undefined, 12_000));
    expect(t.properties[2]!.ownerId).toBe(b);
  });
  it("un joueur ne peut pas enchérir au-delà de ses crédits ; exclu s'il ne peut pas couvrir le départ", () => {
    const { s, a, b, c } = newGame();
    s.players[c]!.credits = 10;
    let t = roll(s, a, 3, "materials");
    t = run(t, { type: "DECLINE_PROPERTY", playerId: a });
    expect(t.auction!.activeBidders).not.toContain(c);
    rejects(t, { type: "PLACE_BID", playerId: b, amount: 155 }, "INSUFFICIENT_FUNDS");
  });
  it("Blocage bancaire n'empêche pas d'enchérir", () => {
    const { s, a, b } = newGame();
    s.effects.push({ id: 99, kind: "noBuy", sourceId: b, targetPlayerId: a, expiry: { kind: "never" } });
    let t = roll(s, a, 1, "materials");
    rejects(t, { type: "BUY_PROPERTY", playerId: a }, "BANK_BLOCKED");
    t = run(t, { type: "DECLINE_PROPERTY", playerId: a });
    t = run(t, { type: "PLACE_BID", playerId: a, amount: 20 });
    expect(t.auction!.highestBidderId).toBe(a);
  });
});

describe("Loyers", () => {
  it("niveaux 0–3, arrondi au 5 supérieur", () => {
    const { s, b } = newGame();
    own(s, b, 3);
    const lv = [0, 1, 2, 3].map((l) => {
      s.properties[3]!.level = l as 0;
      return computeRent(s, 3).total;
    });
    expect(lv).toEqual([10, 15, 20, 30]);
  });
  it("bonus quartier +10 % puis arrondi", () => {
    const { s, b } = newGame();
    own(s, b, 1, 2);
    expect(computeRent(s, 1).total).toBe(10); // 5 × 1,1 = 5,5 → 10
    setLevel(s, 2, 3);
    expect(computeRent(s, 2).total).toBe(35); // 10 × 3 × 1,1 = 33 → 35
  });
  it("loyer payé seulement par un adversaire qui termine sur la case ; hypothéquée = aucun loyer", () => {
    let { s, a, b } = newGame();
    own(s, b, 2);
    let t = roll(s, a, 2, "materials");
    expect(t.players[a]!.credits).toBe(140);
    expect(t.players[b]!.credits).toBe(160);
    ({ s, a, b } = newGame());
    own(s, b, 2);
    s.properties[2]!.mortgaged = true;
    t = roll(s, a, 2, "materials");
    expect(t.players[a]!.credits).toBe(150);
    ({ s, a, b } = newGame());
    own(s, b, 1); // passage sur la case 1 sans s'y arrêter
    t = roll(s, a, 2, "materials");
    expect(t.players[a]!.credits).toBe(150);
  });
  it("pas de loyer sur sa propre propriété", () => {
    const { s, a } = newGame();
    own(s, a, 2);
    expect(roll(s, a, 2, "materials").players[a]!.credits).toBe(150);
  });
});

describe("Construction", () => {
  it("majorité 2/3 requise, ordre 0→1→2→3, coûts exacts, une construction par tour", () => {
    const { s, a } = newGame();
    toManage(s);
    own(s, a, 1);
    s.players[a]!.materials = 8;
    s.players[a]!.energy = 6;
    s.players[a]!.credits = 500;
    rejects(s, { type: "BUILD", playerId: a, propertyIndex: 1 }, "NO_MAJORITY");
    own(s, a, 2);
    let t = run(s, { type: "BUILD", playerId: a, propertyIndex: 1 });
    // résidentiel contrôlé → bonus -5 D sur une construction par tour
    expect([t.players[a]!.credits, t.players[a]!.materials, t.properties[1]!.level]).toEqual([485, 7, 1]);
    rejects(t, { type: "BUILD", playerId: a, propertyIndex: 1 }, "BUILD_LIMIT");
    t.turn.buildsDone = 0; // simule le tour suivant
    t = run(t, { type: "BUILD", playerId: a, propertyIndex: 1 });
    expect([t.players[a]!.credits, t.players[a]!.materials, t.properties[1]!.level]).toEqual([450, 5, 2]);
    t.turn.buildsDone = 0;
    t = run(t, { type: "BUILD", playerId: a, propertyIndex: 1 });
    expect([t.players[a]!.credits, t.players[a]!.materials, t.players[a]!.energy, t.properties[1]!.level]).toEqual([400, 3, 5, 3]);
    t.turn.buildsDone = 0;
    rejects(t, { type: "BUILD", playerId: a, propertyIndex: 1 }, "MAX_LEVEL");
  });
  it("coût sans bonus résidentiel (autre quartier)", () => {
    const { s, a } = newGame();
    toManage(s);
    own(s, a, 9, 10);
    const t = run(s, { type: "BUILD", playerId: a, propertyIndex: 9 });
    expect([t.players[a]!.credits, t.players[a]!.materials]).toEqual([130, 1]);
  });
  it("interdit sur propriété hypothéquée et pendant le redressement", () => {
    const { s, a } = newGame();
    toManage(s);
    own(s, a, 9, 10);
    s.properties[9]!.mortgaged = true;
    rejects(s, { type: "BUILD", playerId: a, propertyIndex: 9 }, "MORTGAGED");
    s.players[a]!.recoveryResolveTurn = 2;
    rejects(s, { type: "BUILD", playerId: a, propertyIndex: 10 }, "IN_RECOVERY");
  });
  it("contrôle recalculé immédiatement après un échange", () => {
    let { s, a, b } = newGame();
    toManage(s);
    own(s, a, 9, 10);
    s = run(s, { type: "PROPOSE_TRADE", playerId: a, toId: b, give: { credits: 0, materials: 0, energy: 0, properties: [10] }, receive: { credits: 20, materials: 0, energy: 0, properties: [] } });
    s = run(s, { type: "ACCEPT_TRADE", playerId: b });
    rejects(s, { type: "BUILD", playerId: a, propertyIndex: 9 }, "NO_MAJORITY");
  });
});

describe("Chance", () => {
  it("piocher 2, garder 1, l'autre à la défausse ; main secrète", () => {
    const { s, a, b } = newGame();
    s.players[a]!.position = 2;
    let t = roll(s, a, 2, "materials");
    expect(t.phase).toBe("CHANCE_CHOICE");
    expect(t.pendingDraw.length).toBe(2);
    const [k, d] = t.pendingDraw;
    rejects(t, { type: "CHOOSE_CARD", playerId: a, keep: 1 }, "INVALID_CHOICE");
    t = run(t, { type: "CHOOSE_CARD", playerId: a, keep: k! });
    expect(t.players[a]!.hand).toEqual([k]);
    expect(t.discard).toContain(d);
    expect(t.deck.length).toBe(34);
    const vb = viewFor(t, b);
    expect(vb.players[a]!.hand).toEqual([]);
    expect(vb.handCounts[a]).toBe(1);
    expect(vb.visibleCards[k!]).toBeUndefined();
    expect(viewFor(t, a).visibleCards[k!]).toBe(t.cardInstances[k!]);
  });
  it("main pleine : remplacement obligatoire, main jamais > 5", () => {
    const { s, a } = newGame();
    for (const key of ["coup_de_pouce", "sabotage", "greve", "assurance", "magnat"]) giveCard(s, a, key);
    s.players[a]!.position = 2;
    let t = roll(s, a, 2, "materials");
    const [k] = t.pendingDraw;
    rejects(t, { type: "CHOOSE_CARD", playerId: a, keep: k! }, "HAND_FULL");
    const out = t.players[a]!.hand[0]!;
    t = run(t, { type: "CHOOSE_CARD", playerId: a, keep: k!, replace: out });
    expect(t.players[a]!.hand.length).toBe(5);
    expect(t.players[a]!.hand).toContain(k);
    expect(t.discard).toContain(out);
  });
  it("la carte piochée est jouable le même tour (une carte max)", () => {
    const { s, a } = newGame();
    s.players[a]!.position = 2;
    let t = roll(s, a, 2, "materials");
    const inst = Number(Object.entries(t.cardInstances).find(([, c]) => c === 2)![0]); // Coup de pouce
    t.deck = t.deck.filter((i) => i !== inst);
    t.pendingDraw[0] && t.deck.push(t.pendingDraw[0]);
    t.pendingDraw[0] = inst;
    t = run(t, { type: "CHOOSE_CARD", playerId: a, keep: inst });
    t = run(t, { type: "PLAY_CARD", playerId: a, instanceId: inst });
    expect(t.players[a]!.credits).toBe(170);
  });
});

describe("Marché et taxe", () => {
  it("marché accessible uniquement sur la case 8, prix et limite de 3", () => {
    const { s, a } = newGame();
    rejects(toManage(structuredClone(s)), { type: "BUY_RESOURCE", playerId: a, resource: "materials" }, "NO_MARKET");
    s.players[a]!.position = 6;
    let t = roll(s, a, 2, "credits");
    expect(t.turn.marketAvailable).toBe(true);
    t = run(t, { type: "BUY_RESOURCE", playerId: a, resource: "materials" });
    t = run(t, { type: "BUY_RESOURCE", playerId: a, resource: "energy" });
    t = run(t, { type: "SELL_RESOURCE", playerId: a, resource: "materials" });
    expect(t.players[a]!.credits).toBe(160 - 15 - 20 + 5);
    rejects(t, { type: "SELL_RESOURCE", playerId: a, resource: "materials" }, "MARKET_LIMIT");
  });
  it("taxe municipale 15 D", () => {
    const { s, a } = newGame();
    s.players[a]!.position = 18;
    let t = roll(s, a, 2, "materials");
    expect(t.phase).toBe("TAX_DUE");
    t = run(t, { type: "PAY_TAX", playerId: a });
    expect(t.players[a]!.credits).toBe(135);
  });
});

describe("Échanges", () => {
  it("atomique, avec consentement, aucun bien dupliqué ou perdu", () => {
    let { s, a, b } = newGame();
    toManage(s);
    own(s, a, 1);
    own(s, b, 5);
    s = run(s, { type: "PROPOSE_TRADE", playerId: a, toId: b, give: { credits: 10, materials: 1, energy: 0, properties: [1] }, receive: { credits: 0, materials: 0, energy: 1, properties: [5] } });
    expect(s.phase).toBe("TRADE_PENDING");
    rejects(s, { type: "ACCEPT_TRADE", playerId: a }, "NOT_RECIPIENT");
    const total = (st: typeof s) => Object.values(st.players).reduce((x, p) => x + p.credits + p.materials + p.energy, 0);
    const before = total(s);
    s = run(s, { type: "ACCEPT_TRADE", playerId: b });
    expect(total(s)).toBe(before);
    expect(s.properties[1]!.ownerId).toBe(b);
    expect(s.properties[5]!.ownerId).toBe(a);
    expect([s.players[a]!.credits, s.players[a]!.materials, s.players[a]!.energy]).toEqual([140, 1, 2]);
  });
  it("refus : aucun changement ; biens non possédés refusés ; hypothéquée non échangeable", () => {
    let { s, a, b } = newGame();
    toManage(s);
    own(s, a, 1);
    rejects(s, { type: "PROPOSE_TRADE", playerId: a, toId: b, give: { credits: 0, materials: 0, energy: 0, properties: [2] }, receive: { credits: 5, materials: 0, energy: 0, properties: [] } }, "NOT_OWNER");
    s.properties[1]!.mortgaged = true;
    rejects(s, { type: "PROPOSE_TRADE", playerId: a, toId: b, give: { credits: 0, materials: 0, energy: 0, properties: [1] }, receive: { credits: 5, materials: 0, energy: 0, properties: [] } }, "MORTGAGED");
    s.properties[1]!.mortgaged = false;
    rejects(s, { type: "PROPOSE_TRADE", playerId: a, toId: b, give: { credits: 500, materials: 0, energy: 0, properties: [] }, receive: { credits: 0, materials: 0, energy: 0, properties: [] } }, "INSUFFICIENT_RESOURCES");
    const t = run(s, { type: "PROPOSE_TRADE", playerId: a, toId: b, give: { credits: 0, materials: 0, energy: 0, properties: [1] }, receive: { credits: 5, materials: 0, energy: 0, properties: [] } });
    const r = run(t, { type: "REJECT_TRADE", playerId: b });
    expect(r.properties[1]!.ownerId).toBe(a);
    expect(r.players[b]!.credits).toBe(150);
  });
  it("offre qui devient invalide avant acceptation : refusée sans changement", () => {
    let { s, a, b } = newGame();
    toManage(s);
    s = run(s, { type: "PROPOSE_TRADE", playerId: a, toId: b, give: { credits: 0, materials: 0, energy: 0, properties: [] }, receive: { credits: 100, materials: 0, energy: 0, properties: [] } });
    s.players[b]!.credits = 50;
    rejects(s, { type: "ACCEPT_TRADE", playerId: b }, "INSUFFICIENT_RESOURCES");
  });
  it("expiration 30 s, limite de 3 offres par tour, uniquement pendant son tour", () => {
    let { s, a, b, c } = newGame();
    toManage(s);
    const offer = { type: "PROPOSE_TRADE" as const, playerId: a, toId: b, give: { credits: 5, materials: 0, energy: 0, properties: [] }, receive: { credits: 0, materials: 1, energy: 0, properties: [] } };
    rejects(s, { ...offer, playerId: b, toId: a }, "NOT_YOUR_TURN");
    for (let i = 0; i < 3; i++) {
      s = run(s, offer, ctx(undefined, 0));
      rejects(s, { type: "EXPIRE_TRADE", playerId: c }, "TRADE_RUNNING", ctx(undefined, 29_999));
      s = run(s, { type: "EXPIRE_TRADE", playerId: c }, ctx(undefined, 30_000));
    }
    rejects(s, offer, "TRADE_LIMIT");
  });
});

describe("Hypothèque, dettes, redressement", () => {
  it("hypothèque 50 %, levée 55 %, interdite avec bâtiment", () => {
    let { s, a } = newGame();
    toManage(s);
    own(s, a, 3);
    s = run(s, { type: "MORTGAGE", playerId: a, propertyIndex: 3 });
    expect(s.players[a]!.credits).toBe(180);
    s = run(s, { type: "REDEEM_MORTGAGE", playerId: a, propertyIndex: 3 });
    expect(s.players[a]!.credits).toBe(147);
    setLevel(s, 3, 1);
    rejects(s, { type: "MORTGAGE", playerId: a, propertyIndex: 3 }, "HAS_BUILDING");
  });
  it("impayé : liquidation ressources → bâtiments → hypothèques avant redressement", () => {
    const { s, a, b } = newGame();
    own(s, b, 23);
    setLevel(s, 23, 3); // loyer 15 × 3 = 45
    own(s, a, 9, 10);
    setLevel(s, 9, 1);
    s.players[a]!.credits = 0;
    s.players[a]!.materials = 1;
    s.players[a]!.energy = 1;
    s.players[a]!.position = 20;
    const t = roll(s, a, 3, "credits"); // +10 D puis arrivée case 23
    const p = t.players[a]!;
    // 10 + 5 + 5 (ressources) + 10 (bâtiment) = 30 < 45 → hypothèque 9 (20) → 50 ≥ 45
    expect(p.credits).toBe(5);
    expect(t.properties[9]!.mortgaged).toBe(true);
    expect(t.properties[10]!.mortgaged).toBe(false);
    expect(p.debt).toBe(0);
    expect(p.recoveryResolveTurn).toBeNull();
    expect(t.players[b]!.credits).toBe(195);
  });
  it("redressement : +20 D en dette, restrictions, vente forcée aux enchères en fin du tour suivant", () => {
    let { s, a, b, c } = newGame();
    own(s, b, 23);
    setLevel(s, 23, 3);
    own(s, a, 1);
    s.properties[1]!.mortgaged = true;
    s.players[a]!.credits = 0;
    s.players[a]!.materials = 0;
    s.players[a]!.energy = 0;
    s.players[a]!.position = 20;
    s = roll(s, a, 3, "credits"); // 10 D + avance 20 D = 30 < 45 → 15 D de dette supplémentaire
    const p = s.players[a]!;
    expect(p.recoveryResolveTurn).toBe(2);
    expect(p.debt).toBe(35);
    expect(p.credits).toBe(0);
    s = endTurn(s);
    for (const id of [b, c]) {
      s = roll(s, id, 1, "materials");
      if (s.phase === "BUY_DECISION") s = run(s, { type: "BUY_PROPERTY", playerId: id });
      s = endTurn(s);
    }
    // tour de redressement de A (sans passer par Départ)
    s.players[a]!.position = 10;
    s = roll(s, a, 1, "credits");
    if (s.phase === "BUY_DECISION") rejects(s, { type: "BUY_PROPERTY", playerId: a }, "IN_RECOVERY");
    if (s.phase === "BUY_DECISION") s = run(s, { type: "DECLINE_PROPERTY", playerId: a });
    while (s.phase === "AUCTION") s = run(s, { type: "PASS_AUCTION", playerId: s.auction!.activeBidders.find((x) => x !== s.auction!.highestBidderId)! });
    s = endTurn(s);
    expect(s.phase).toBe("AUCTION");
    expect(s.auction!.reason).toBe("forced");
    expect(s.auction!.activeBidders).not.toContain(a);
    s = run(s, { type: "PLACE_BID", playerId: b, amount: s.auction!.startPrice });
    s = run(s, { type: "PASS_AUCTION", playerId: c });
    expect(s.properties[1]!.ownerId).toBe(b);
    expect(s.players[a]!.recoveryResolveTurn).toBeNull();
    expect(s.turnOrder[s.activeIndex]).toBe(b);
  });
});

describe("Fin de partie et score", () => {
  it("fin après exactement 12 manches complètes", () => {
    let { s } = newGame(3, 7);
    let turns = 0;
    while (s.phase !== "FINISHED") {
      const id = s.turnOrder[s.activeIndex]!;
      s = run(s, { type: "ROLL_DICE", playerId: id }, ctx(seededRng(turns)));
      if (s.phase === "RESOURCE_CHOICE") s = run(s, { type: "CHOOSE_RESOURCE", playerId: id, resource: "credits" });
      if (s.phase === "BUY_DECISION") {
        s = run(s, { type: "DECLINE_PROPERTY", playerId: id });
        while (s.phase === "AUCTION") s = run(s, { type: "PASS_AUCTION", playerId: s.auction!.activeBidders[0]! });
      }
      if (s.phase === "TAX_DUE") s = run(s, { type: "PAY_TAX", playerId: id });
      if (s.phase === "CHANCE_CHOICE") s = run(s, { type: "CHOOSE_CARD", playerId: id, keep: s.pendingDraw[0]!, ...(s.players[id]!.hand.length >= 5 ? { replace: s.players[id]!.hand[0]! } : {}) });
      s = run(s, { type: "END_TURN", playerId: id });
      turns++;
    }
    expect(turns).toBe(36);
    expect(s.round).toBe(12);
    expect(s.scores!.length).toBe(3);
    rejects(s, { type: "ROLL_DICE", playerId: s.turnOrder[0]! }, "GAME_FINISHED");
  });
  it("formule de score et objectifs", () => {
    const { s, a } = newGame();
    const p = s.players[a]!;
    p.credits = 100; p.materials = 2; p.energy = 1; p.debt = 10;
    own(s, a, 21, 22); // 170 → 119, Centre-ville contrôlé
    setLevel(s, 21, 1);
    p.objectiveId = 5; // contrôler 1 quartier : 25
    const l = computeScores(s).find((x) => x.playerId === a)!;
    expect([l.credits, l.resources, l.properties, l.buildings, l.districts, l.objective, l.debt]).toEqual([100, 30, 119, 10, 25, 25, 10]);
    expect(l.total).toBe(100 + 30 + 119 + 10 + 25 + 25 - 10);
    expect(l.wealth).toBe(l.total - 25);
  });
  it("égalités : patrimoine hors objectif, propriétés, crédits, puis égalité partagée", () => {
    const { s, a, b, c } = newGame();
    for (const id of [a, b, c]) s.players[id]!.objectiveId = 12; // impossible ici
    const l = computeScores(s);
    expect(l.every((x) => x.rank === 1)).toBe(true);
    s.players[c]!.credits = 151;
    expect(computeScores(s)[0]!.playerId).toBe(c);
  });
});

describe("Sécurité et rejeu", () => {
  it("une commande refusée ne modifie pas l'état", () => {
    const { s, b } = newGame();
    const snap = JSON.stringify(s);
    const r = applyCommand(s, { type: "ROLL_DICE", playerId: b }, ctx());
    expect(r.ok).toBe(false);
    expect(JSON.stringify(s)).toBe(snap);
  });
  it("version incrémentée, événements strictement croissants", () => {
    const { s, a } = newGame();
    const r = runEv(s, { type: "ROLL_DICE", playerId: a }, ctx(scripted([MOVE(2), RES.credits])));
    expect(r.state.version).toBe(s.version + 1);
    const seqs = r.events.map((e) => e.seq);
    expect(seqs).toEqual([...seqs].sort((x, y) => x - y));
    expect(seqs[0]).toBe(s.eventSeq + 1);
  });
  it("vue adverse : pas d'objectif, pas de pioche, pas de main", () => {
    const { s, a, b } = newGame();
    giveCard(s, a, "magnat");
    const v = viewFor(s, b);
    expect(v.players[a]!.objectiveId).toBe(0);
    expect(v.players[b]!.objectiveId).toBe(s.players[b]!.objectiveId);
    expect((v as unknown as { deck?: unknown }).deck).toBeUndefined();
    expect(JSON.stringify(v)).not.toContain('"cardInstances"');
  });
});
