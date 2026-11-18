import { describe, expect, it } from "vitest";
import { cryptoRng, seededRng, shuffle } from "../src/rng.ts";
import { MOVEMENT_DIE, RESOURCE_DIE } from "../src/content/rules.ts";

describe("Hasard", () => {
  it("RNG seedé reproductible", () => {
    const a = seededRng(5), b = seededRng(5);
    expect(Array.from({ length: 50 }, () => a.int(1000))).toEqual(Array.from({ length: 50 }, () => b.int(1000)));
  });
  it("RNG cryptographique (production) : uniforme sur les faces des dés (χ² large, 60 000 tirages)", () => {
    const r = cryptoRng();
    const counts = Array(6).fill(0);
    for (let i = 0; i < 60_000; i++) counts[r.int(6)]++;
    const chi = counts.reduce((acc, c) => acc + (c - 10_000) ** 2 / 10_000, 0);
    expect(chi).toBeLessThan(30); // seuil très large (p ≪ 0,001 pour 5 ddl)
    const moves = counts.map((c, i) => [MOVEMENT_DIE[i], c]);
    expect(moves.length).toBe(6);
    expect(RESOURCE_DIE.length).toBe(6);
  });
  it("mélange = permutation", () => {
    const x = shuffle([...Array(36).keys()], seededRng(1));
    expect([...x].sort((a, b) => a - b)).toEqual([...Array(36).keys()]);
  });
});
