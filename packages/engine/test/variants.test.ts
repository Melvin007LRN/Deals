import { describe, expect, it } from "vitest";
import { createGame, DEFAULT_CONFIG, OFFICIAL_CONFIG } from "../src/engine.ts";
import { seededRng } from "../src/rng.ts";
import { ctx, endTurn, run, scripted, toManage } from "./helpers.ts";

const mk = (cfg: Parameters<typeof createGame>[2]) =>
  createGame(["A", "B", "C"].map((id) => ({ id, name: id })), ctx(seededRng(3)), cfg && Object.keys(cfg).length ? { ...OFFICIAL_CONFIG, ...cfg } : cfg).state;

describe("Variantes de règles (leviers d'équilibrage)", () => {
  it("par défaut = v1.1 (variante V9 validée)", () => {
    const s = mk({});
    expect(s.config).toEqual(DEFAULT_CONFIG);
    expect(s.config).toEqual({ movementDie: [1, 2, 2, 3, 3, 4], startReward: 40, drawOnStart: true, turnIncome: 10, seatBonus: [0, 20, 40, 60] });
    // siège 1 : 150 + 10 (revenu de son premier tour) ; sièges 2 et 3 : compensation
    expect(s.turnOrder.map((id) => s.players[id]!.credits)).toEqual([160, 170, 190]);
  });
  it("règles d'origine du dossier toujours disponibles", () => {
    expect(OFFICIAL_CONFIG.movementDie).toEqual([1, 1, 2, 2, 3, 3]);
    expect(mk(OFFICIAL_CONFIG).turnOrder.map((id) => 0)).toEqual([0, 0, 0]);
  });
  it("dé de mouvement personnalisé", () => {
    const s = mk({ movementDie: [4, 4, 4, 4, 4, 4] });
    const a = s.turnOrder[0]!;
    const t = run(s, { type: "ROLL_DICE", playerId: a }, ctx(scripted([0, 2])));
    expect(t.players[a]!.position).toBe(4);
  });
  it("dé invalide refusé", () => {
    expect(() => mk({ movementDie: [] })).toThrow();
    expect(() => mk({ movementDie: [0, 9] })).toThrow();
  });
  it("carte piochée au passage de Départ, directement en main", () => {
    const s = mk({ drawOnStart: true });
    const a = s.turnOrder[0]!;
    s.players[a]!.position = 23;
    const t = run(s, { type: "ROLL_DICE", playerId: a }, ctx(scripted([0, 2])));
    expect(t.players[a]!.hand.length).toBe(1);
    expect(t.deck.length).toBe(35);
  });
  it("revenu de tour versé au début de chaque tour", () => {
    let s = mk({ turnIncome: 10 });
    const [a, b] = s.turnOrder;
    expect(s.players[a!]!.credits).toBe(160);
    s = endTurn(toManage(s));
    expect(s.players[b!]!.credits).toBe(160);
  });
  it("compensation de siège", () => {
    const s = mk({ seatBonus: [0, 10, 20, 30] });
    expect(s.turnOrder.map((id) => s.players[id]!.credits)).toEqual([150, 160, 170]);
  });
  it("départs répartis : siège k sur la case floor(k × 24 / n)", () => {
    const s3 = mk({ spreadStart: true });
    expect(s3.turnOrder.map((id) => s3.players[id]!.position)).toEqual([0, 8, 16]);
    const s4 = createGame(["A", "B", "C", "D"].map((id) => ({ id, name: id })), ctx(seededRng(3)), { ...OFFICIAL_CONFIG, spreadStart: true }).state;
    expect(s4.turnOrder.map((id) => s4.players[id]!.position)).toEqual([0, 6, 12, 18]);
  });
});
