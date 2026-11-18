import { describe, expect, it } from "vitest";
import { BOARD, DISTRICTS, PROPERTY_INDICES, districtProperties } from "../src/content/board.ts";
import { CARDS } from "../src/content/cards.ts";
import { OBJECTIVES } from "../src/content/objectives.ts";
import { MOVEMENT_DIE, RESOURCE_DIE } from "../src/content/rules.ts";
import { baseRent } from "../src/engine.ts";

describe("Plateau officiel", () => {
  it("24 cases indexées 0–23, uniques et continues", () => {
    expect(BOARD.length).toBe(24);
    BOARD.forEach((s, i) => expect(s.index).toBe(i));
  });
  it("18 propriétés, 6 quartiers × 3, cases spéciales exactes", () => {
    expect(PROPERTY_INDICES.length).toBe(18);
    for (const d of DISTRICTS) expect(districtProperties(d.id).length).toBe(3);
    const count = (t: string) => BOARD.filter((s) => s.type === t).length;
    expect([count("start"), count("chance"), count("market"), count("event"), count("tax")]).toEqual([1, 2, 1, 1, 1]);
    expect(BOARD.filter((s) => s.type === "chance").map((s) => s.index)).toEqual([4, 16]);
    expect(BOARD[8]!.type).toBe("market");
    expect(BOARD[8]!.district).toBeUndefined();
  });
  it("prix officiels ; total réel 1 260 D (le dossier indique 1 180 D par erreur)", () => {
    const prices = PROPERTY_INDICES.map((i) => BOARD[i]!.price);
    expect(prices).toEqual([40, 50, 60, 50, 60, 70, 40, 60, 80, 60, 70, 90, 70, 80, 100, 80, 90, 110]);
    expect(prices.reduce((a, b) => a! + b!, 0)).toBe(1260);
  });
  it("loyers de base du dossier", () => {
    const table: [number, number][] = [[40, 5], [50, 10], [60, 10], [70, 10], [80, 10], [90, 15], [100, 15], [110, 15]];
    for (const [p, r] of table) expect(baseRent(p)).toBe(r);
  });
});

describe("Dés", () => {
  it("dé de mouvement 1,1,2,2,3,3", () => expect([...MOVEMENT_DIE]).toEqual([1, 1, 2, 2, 3, 3]));
  it("dé de ressources 2 Crédits / 2 Matériaux / 1 Énergie / 1 Choix", () => {
    const c = (f: string) => RESOURCE_DIE.filter((x) => x === f).length;
    expect([c("credits"), c("materials"), c("energy"), c("choice")]).toEqual([2, 2, 1, 1]);
  });
});

describe("Catalogue des 36 cartes", () => {
  it("36 identifiants uniques 1–36 et clés uniques", () => {
    expect(CARDS.map((c) => c.id)).toEqual(Array.from({ length: 36 }, (_, i) => i + 1));
    expect(new Set(CARDS.map((c) => c.key)).size).toBe(36);
  });
  it("raretés 18 communes / 12 rares / 4 épiques / 2 légendaires", () => {
    const n = (r: string) => CARDS.filter((c) => c.rarity === r).length;
    expect([n("common"), n("rare"), n("epic"), n("legendary")]).toEqual([18, 12, 4, 2]);
  });
  it("exactement 5 familles, effectifs 9/11/6/6/4 (légendaires rattachées)", () => {
    const n = (f: string) => CARDS.filter((c) => c.family === f).length;
    expect(new Set(CARDS.map((c) => c.family)).size).toBe(5);
    expect([n("investment"), n("attack"), n("defense"), n("commerce"), n("politics")]).toEqual([9, 11, 6, 6, 4]);
  });
  it("aucun coût en crédits (pas de mana), coûts ≥ 1 ressource", () => {
    for (const c of CARDS) expect(c.cost.materials + c.cost.energy).toBeGreaterThanOrEqual(1);
  });
  it("attaques immobilières = Prise de contrôle et OPA hostile", () => {
    expect(CARDS.filter((c) => c.attack === "realty").map((c) => c.key)).toEqual(["prise_de_controle", "opa_hostile"]);
  });
});

describe("Objectifs secrets", () => {
  it("12 objectifs, 4 par difficulté", () => {
    expect(OBJECTIVES.length).toBe(12);
    for (const d of ["easy", "medium", "hard"]) expect(OBJECTIVES.filter((o) => o.difficulty === d).length).toBe(4);
  });
});
