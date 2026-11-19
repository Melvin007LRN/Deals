/** Test ciblé : avantage du 1er joueur (V9 vs V9 + départs répartis). Usage : npx tsx packages/sim/src/seat.ts --games 10000 */
import { writeFileSync } from "node:fs";
import { DEFAULT_CONFIG, type RuleConfig } from "@deals/engine";
import { runGame } from "./run.ts";
const args = process.argv.slice(2);
const N = Number(args[args.indexOf("--games") + 1] ?? 10000) || 10000;
const variants: [string, Partial<RuleConfig>][] = [
  ["V9 (règles v1.1)", { ...DEFAULT_CONFIG }],
  ["V9 + départs répartis", { ...DEFAULT_CONFIG, spreadStart: true }],
  ["V9 + départs répartis, sans compensation", { ...DEFAULT_CONFIG, spreadStart: true, seatBonus: [0, 0, 0, 0] }],
];
let out = `# Avantage de siège — ${N} parties par variante et par nombre de joueurs (profil Mixte, mêmes seeds)\n\n| Variante | Joueurs | ${[1, 2, 3, 4].map((k) => `Siège ${k}`).join(" | ")} | Propriétés/joueur | Niv. 3 |\n|---|---|---|---|---|---|---|---|\n`;
for (const [label, cfg] of variants) for (const n of [3, 4]) {
  const wins = [0, 0, 0, 0]; let props = 0, l3 = 0, players = 0;
  for (let i = 0; i < N; i++) {
    const r = runGame(40_000_000 + i, Array(n).fill("balanced"), { config: cfg });
    for (const p of r.players) { if (p.rank === 1) wins[p.seat]! += 1 / r.winners.length; props += p.properties; l3 += p.maxLevel === 3 ? 1 : 0; players++; }
  }
  out += `| ${label} | ${n} | ${wins.slice(0, n).map((w) => `${((100 * w) / N).toFixed(1)} %`).concat(n === 3 ? ["—"] : []).join(" | ")} | ${(props / players).toFixed(1)} | ${((100 * l3) / players).toFixed(1)} % |\n`;
  process.stderr.write(`${label} ${n}j fait\n`);
}
out += `\nÉquitable : 33,3 % à 3 joueurs, 25 % à 4 joueurs.\n`;
writeFileSync(`docs/simulations/sieges_${N}.md`, out);
console.log(out);
