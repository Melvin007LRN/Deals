import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { applyCommand, createGame } from "../src/engine.ts";
import { checkInvariants } from "../src/invariants.ts";
import { candidateCommands } from "../src/legal.ts";
import { seededRng } from "../src/rng.ts";
import type { Command } from "../src/types.ts";

/** Joue une partie entière en choisissant au hasard parmi les commandes candidates. */
function randomGame(seed: number, players: number, check = true) {
  const rng = seededRng(seed); // choix des commandes
  const engineRng = seededRng(seed ^ 0x5eed); // hasard du moteur (dés, pioches)
  const ids = ["A", "B", "C", "D"].slice(0, players);
  let { state } = createGame(ids.map((id) => ({ id, name: id })), { rng: engineRng, now: 0 });
  const log: { cmd: Command; now: number }[] = [];
  let now = 0;
  let steps = 0;
  let rejected = 0;
  while (state.phase !== "FINISHED") {
    if (++steps > 20_000) throw new Error(`partie bloquée (seed ${seed}) en phase ${state.phase}`);
    now += 1 + rng.int(4000);
    const cands = candidateCommands(state, now);
    if (cands.length === 0) throw new Error(`aucune action possible (seed ${seed}) en phase ${state.phase}`);
    // biais vers la progression pour garder des parties de longueur raisonnable
    const prog = cands.filter((c) => ["ROLL_DICE", "END_TURN", "PASS_AUCTION", "PAY_TAX", "CHOOSE_CARD", "CHOOSE_RESOURCE", "DECLINE_PROPERTY", "REJECT_TRADE"].includes(c.type));
    const pool = rng.int(3) === 0 || prog.length === 0 ? cands : prog;
    const cmd = pool[rng.int(pool.length)]!;
    const before = JSON.stringify(state);
    const r = applyCommand(state, cmd, { rng: engineRng, now });
    if (!r.ok) {
      rejected++;
      expect(JSON.stringify(state)).toBe(before);
      continue;
    }
    if (check) {
      const v = checkInvariants(r.state);
      if (v.length) throw new Error(`invariants violés (seed ${seed}) après ${cmd.type}: ${v.join("; ")}`);
      const seqs = r.events.map((e) => e.seq);
      expect(seqs.every((x, i) => i === 0 || x > seqs[i - 1]!)).toBe(true);
    }
    log.push({ cmd, now });
    state = r.state;
  }
  return { state, log, rejected };
}

describe("Propriétés / invariants sur parties aléatoires", () => {
  it("300 parties aléatoires (3 et 4 joueurs) : invariants respectés, aucune partie bloquée, fin après 12 manches", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 2 ** 31 - 1 }), fc.constantFrom(3, 4), (seed, n) => {
        const { state } = randomGame(seed, n);
        expect(state.phase).toBe("FINISHED");
        expect(state.round).toBe(12);
        expect(Object.values(state.players).every((p) => p.turnsStarted === 12)).toBe(true);
        expect(state.scores!.length).toBe(n);
      }),
      { numRuns: 300 },
    );
  }, 120_000);

  it("rejeu : même seed moteur + journal des commandes acceptées → état final identique (octet pour octet)", () => {
    for (const [seed, n] of [[11, 4], [222, 3], [3333, 4], [44444, 3]] as const) {
      const { state, log } = randomGame(seed, n, false);
      const engineRng = seededRng(seed ^ 0x5eed);
      const ids = ["A", "B", "C", "D"].slice(0, n);
      let { state: s } = createGame(ids.map((id) => ({ id, name: id })), { rng: engineRng, now: 0 });
      for (const { cmd, now } of log) {
        const r = applyCommand(s, cmd, { rng: engineRng, now });
        expect(r.ok).toBe(true);
        if (r.ok) s = r.state;
      }
      expect(JSON.stringify(s)).toBe(JSON.stringify(state));
    }
  });
});

export { randomGame };
