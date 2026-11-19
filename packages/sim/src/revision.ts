/** Cartes révision 1 vs 2 (règles 1.3 par défaut). Usage : npx tsx packages/sim/src/revision.ts --games 3000 */
import { writeFileSync } from "node:fs";
import { CARDS, CARD_REVISION_2, DEFAULT_CONFIG, RULES_VERSION } from "@deals/engine";
import { PROFILES, type ProfileName } from "./agents.ts";
import { runGame } from "./run.ts";
import { seededRng } from "@deals/engine";
const args = process.argv.slice(2);
const N = Number(args[args.indexOf("--games") + 1] ?? 3000) || 3000;
const ALL: ProfileName[] = ["investor", "aggressive", "negotiator", "random", "balanced"];
type Row = { plays: Record<number, number>; played: number; players: number; seat3: number[]; seat4: number[]; prof: Record<string, [number, number]> };
const rows: Record<number, Row> = {};
for (const rev of [1, 2] as const) {
  const row: Row = { plays: Object.fromEntries(CARDS.map((c) => [c.id, 0])), played: 0, players: 0, seat3: [0, 0, 0], seat4: [0, 0, 0, 0], prof: Object.fromEntries(ALL.map((p) => [p, [0, 0]])) };
  for (let i = 0; i < N; i++) {
    const n = i % 2 ? 4 : 3;
    // moitié tables Mixte (équité, usage), moitié profils tirés au hasard (domination d'un style)
    const mixed = i % 4 >= 2;
    const r0 = seededRng(60_000_000 + i);
    const profiles = mixed ? Array.from({ length: n }, () => ALL[r0.int(5)]!) : Array(n).fill("balanced");
    const r = runGame(60_000_000 + i, profiles, { config: { ...DEFAULT_CONFIG, cardRevision: rev } });
    for (const [k, c] of Object.entries(r.cardPlays)) row.plays[+k]! += c;
    for (const p of r.players) {
      row.played += p.cardsPlayed; row.players++;
      const w = p.rank === 1 ? 1 / r.winners.length : 0;
      if (!mixed) (n === 3 ? row.seat3 : row.seat4)[p.seat]! += w;
      else { row.prof[p.profile]![0] += w; row.prof[p.profile]![1] += 1; }
    }
  }
  rows[rev] = row;
  process.stderr.write(`révision ${rev} faite\n`);
}
const g3 = N / 4, g4 = N / 4; // tables Mixte : i%4 ∈ {0,1} → 3j pour i%4=0, 4j pour i%4=1
const pc = (x: number) => (100 * x).toFixed(1) + " %";
const changed = Object.keys(CARD_REVISION_2);
let out = `# Révision des cartes : catalogue V2.5 (R1) vs proposition (R2)
Généré le ${new Date().toISOString()} — règles ${RULES_VERSION} — **${N} parties réellement jouées par révision** (mêmes seeds) : moitié tables Mixte, moitié profils tirés au hasard ; alternance 3/4 joueurs ; 5 points par ressource.

## Cartes modifiées (R2)
${CARDS.filter((c) => changed.includes(c.key)).map((c) => `- **${c.name}** — R1 : ${c.text} (${c.cost.materials}M ${c.cost.energy}É) → **R2 : ${CARD_REVISION_2[c.key]!.text}** (${(CARD_REVISION_2[c.key]!.cost ?? c.cost).materials}M ${(CARD_REVISION_2[c.key]!.cost ?? c.cost).energy}É)`).join("\n")}

| Mesure | R1 | R2 |
|---|---|---|
| Cartes jouées par joueur | ${(rows[1]!.played / rows[1]!.players).toFixed(2)} | ${(rows[2]!.played / rows[2]!.players).toFixed(2)} |
| Cartes jamais jouées (sur 36) | ${Object.values(rows[1]!.plays).filter((x) => !x).length} | ${Object.values(rows[2]!.plays).filter((x) => !x).length} |
| Sièges à 3 joueurs (Mixte) | ${rows[1]!.seat3.map((w) => pc(w / g3)).join(" / ")} | ${rows[2]!.seat3.map((w) => pc(w / g3)).join(" / ")} |
| Sièges à 4 joueurs (Mixte) | ${rows[1]!.seat4.map((w) => pc(w / g4)).join(" / ")} | ${rows[2]!.seat4.map((w) => pc(w / g4)).join(" / ")} |
${ALL.map((p) => `| Victoires ${PROFILES[p].label} (tables mélangées) | ${pc(rows[1]!.prof[p]![0] / rows[1]!.prof[p]![1])} | ${pc(rows[2]!.prof[p]![0] / rows[2]!.prof[p]![1])} |`).join("\n")}

## Utilisation pour 100 parties
| # | Carte | R1 | R2 |
|---|---|---|---|
${CARDS.map((c) => `| ${c.id} | ${changed.includes(c.key) ? "**" + c.name + "**" : c.name} | ${(100 * rows[1]!.plays[c.id]! / N).toFixed(0)} | ${(100 * rows[2]!.plays[c.id]! / N).toFixed(0)} |`).join("\n")}
`;
writeFileSync(`docs/simulations/revision_cartes_${N}.md`, out);
console.log(out);
