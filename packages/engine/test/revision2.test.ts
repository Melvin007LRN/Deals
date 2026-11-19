import { describe, expect, it } from "vitest";
import { OFFICIAL_CONFIG, computeRent, computeScores, createGame } from "../src/engine.ts";
import { seededRng } from "../src/rng.ts";
import { ctx, giveCard, own, rejects, roll, run, runEv, setLevel, toManage } from "./helpers.ts";

const game = (cfg: object) => {
  const { state } = createGame(["A", "B", "C"].map((id) => ({ id, name: id })), ctx(seededRng(42)), { ...OFFICIAL_CONFIG, ...cfg });
  const [a, b, c] = state.turnOrder as [string, string, string];
  return { s: state, a, b, c };
};
const rich = (s: ReturnType<typeof game>["s"], id: string) => { s.players[id]!.materials = 6; s.players[id]!.energy = 5; };

describe("Valeur des ressources en fin de partie (configurable)", () => {
  it("5 points par ressource avec resourceScore 5", () => {
    const { s, a } = game({ resourceScore: 5 });
    expect(computeScores(s).find((l) => l.playerId === a)!.resources).toBe(15);
  });
});

describe("Révision 2 des cartes (proposition)", () => {
  it("Bon investissement : +2 Matériaux", () => {
    const { s, a } = game({ cardRevision: 2 });
    toManage(s); rich(s, a);
    const t = run(s, { type: "PLAY_CARD", playerId: a, instanceId: giveCard(s, a, "bon_investissement") });
    expect([t.players[a]!.materials, t.players[a]!.energy]).toEqual([8, 4]);
  });
  it("Vote municipal : coûte 1 Matériau et réduit de 20 D la taxe ou le loyer payé ce tour", () => {
    const { s, a, b } = game({ cardRevision: 2 });
    own(s, b, 3); setLevel(s, 3, 1); // loyer 15
    rich(s, a);
    let t = run(s, { type: "PLAY_CARD", playerId: a, instanceId: giveCard(s, a, "vote_municipal") });
    expect([t.players[a]!.materials, t.players[a]!.energy]).toEqual([5, 5]);
    t = roll(t, a, 3, "materials");
    expect(t.players[a]!.credits).toBe(150);
    expect(t.players[b]!.credits).toBe(150);
  });
  it("Blocage bancaire coûte 1 Énergie ; Réforme urbaine coûte 1 Matériau", () => {
    const { s, a, b } = game({ cardRevision: 2 });
    toManage(s);
    s.players[a]!.materials = 0; s.players[a]!.energy = 1;
    const t = run(s, { type: "PLAY_CARD", playerId: a, instanceId: giveCard(s, a, "blocage_bancaire"), targetPlayerId: b });
    expect(t.players[a]!.energy).toBe(0);
    const g2 = game({ cardRevision: 2 }); toManage(g2.s);
    g2.s.players[g2.a]!.materials = 1; g2.s.players[g2.a]!.energy = 0;
    own(g2.s, g2.a, 13, 14);
    expect(run(g2.s, { type: "PLAY_CARD", playerId: g2.a, instanceId: giveCard(g2.s, g2.a, "reforme_urbaine"), district: "touristic" }).players[g2.a]!.materials).toBe(0);
  });
  it("Crise locale : aucun loyer dans le quartier", () => {
    const { s, b } = game({ cardRevision: 2 });
    own(s, b, 13);
    s.effects.push({ id: 1, kind: "districtCrisis", sourceId: "x", district: "touristic", expiry: { kind: "never" } });
    expect(computeRent(s, 13).total).toBe(0);
    const r1 = game({ cardRevision: 1 });
    own(r1.s, r1.b, 13);
    r1.s.effects.push({ id: 1, kind: "districtCrisis", sourceId: "x", district: "touristic", expiry: { kind: "never" } });
    expect(computeRent(r1.s, 13).total).toBe(10);
  });
  it("Assurance : bloque Sabotage et Grève sans être consommée", () => {
    const { s, a, b } = game({ cardRevision: 2 });
    toManage(s); rich(s, a);
    own(s, b, 9, 10);
    s.effects.push({ id: 900, kind: "insurance", sourceId: b, propertyIndex: 9, expiry: { kind: "never" } });
    const r = runEv(s, { type: "PLAY_CARD", playerId: a, instanceId: giveCard(s, a, "greve"), propertyIndex: 9 });
    expect(r.events.some((e) => e.type === "ATTACK_BLOCKED")).toBe(true);
    expect(r.state.effects.map((e) => e.kind)).toEqual(["insurance"]);
    void rejects;
  });
  it("Inspection / Fraude : volent la ressource, sinon 10 D", () => {
    for (const [key, kind] of [["inspection", "materials"], ["fraude_commerciale", "energy"]] as const) {
      const { s, a, b } = game({ cardRevision: 2 });
      toManage(s); rich(s, a);
      const inst = giveCard(s, a, key);
      const before = s.players[a]![kind];
      let t = run(structuredClone(s), { type: "PLAY_CARD", playerId: a, instanceId: inst, targetPlayerId: b });
      expect(t.players[b]![kind]).toBe(s.players[b]![kind] - 1);
      expect(t.players[a]![kind]).toBe(before - (kind === "energy" ? 1 : 0) + 1);
      s.players[b]![kind] = 0;
      t = run(s, { type: "PLAY_CARD", playerId: a, instanceId: inst, targetPlayerId: b });
      expect([t.players[b]!.credits, t.players[a]!.credits]).toEqual([140, 160]);
    }
  });
  it("Assurance : protège toutes les propriétés du joueur, sans cible", () => {
    const { s, a, b } = game({ cardRevision: 2 });
    toManage(s); rich(s, a);
    own(s, a, 13, 3);
    s.effects.push({ id: 1, kind: "districtCrisis", sourceId: b, district: "touristic", expiry: { kind: "never" } });
    const t = run(s, { type: "PLAY_CARD", playerId: a, instanceId: giveCard(s, a, "assurance") });
    expect(computeRent(t, 13).total).toBe(10);
  });
});
