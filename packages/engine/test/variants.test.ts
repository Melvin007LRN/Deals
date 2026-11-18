import { describe, expect, it } from "vitest";
import { createGame, DEFAULT_CONFIG } from "../src/engine.ts";
import { seededRng } from "../src/rng.ts";
import { ctx, endTurn, run, scripted, toManage } from "./helpers.ts";

const mk = (cfg: Parameters<typeof createGame>[2]) =>
  createGame(["A", "B", "C"].map((id) => ({ id, name: id })), ctx(seededRng(3)), cfg).state;

describe("Variantes de règles (leviers d'équilibrage)", () => {
  it("par défaut = règles officielles", () => {
    const s = mk({});
    expect(s.config).toEqual(DEFAULT_CONFIG);
    expect(s.config.movementDie).toEqual([1, 1, 2, 2, 3, 3]);
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
});
