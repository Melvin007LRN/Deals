/** Effet de la valeur de fin de partie des ressources sur l'usage des cartes. Usage : npx tsx packages/sim/src/resources.ts --games 3000 */
import { writeFileSync } from "node:fs";
import { CARDS, DEFAULT_CONFIG, RULES_VERSION } from "@deals/engine";
import { runGame } from "./run.ts";
const args = process.argv.slice(2);
const N = Number(args[args.indexOf("--games") + 1] ?? 3000) || 3000;
const values = [10, 5, 3, 0];
const res: { v: number; plays: Record<number, number>; played: number; lvl3: number; seat: number[]; props: number; players: number }[] = [];
for (const v of values) {
  const plays: Record<number, number> = Object.fromEntries(CARDS.map((c) => [c.id, 0]));
  let played = 0, lvl3 = 0, props = 0, players = 0; const seat = [0, 0, 0, 0];
  for (let i = 0; i < N; i++) {
    const n = i % 2 ? 4 : 3;
    const r = runGame(50_000_000 + i, Array(n).fill("balanced"), { config: { ...DEFAULT_CONFIG, resourceScore: v } });
    for (const [k, c] of Object.entries(r.cardPlays)) plays[+k]! += c;
    for (const p of r.players) { played += p.cardsPlayed; lvl3 += p.maxLevel === 3 ? 1 : 0; props += p.properties; players++; if (p.rank === 1 && n === 3) seat[p.seat]! += 1 / r.winners.length; }
  }
  res.push({ v, plays, played, lvl3, seat, props, players });
  process.stderr.write(`valeur ${v} : fait\n`);
}
const per100 = (x: number) => ((100 * x) / N).toFixed(0);
let out = `# Valeur des ressources en fin de partie et usage des cartes
Généré le ${new Date().toISOString()} — règles ${RULES_VERSION} (V9 + compensation par nombre de joueurs) — **${N} parties réellement jouées par valeur**, profil Mixte (bots à valeur espérée), alternance 3/4 joueurs, mêmes seeds.

| Mesure | ${values.map((v) => `${v} pts/ressource`).join(" | ")} |
|---|${values.map(() => "---|").join("")}
| Cartes jouées par joueur | ${res.map((r) => (r.played / r.players).toFixed(2)).join(" | ")} |
| Cartes jamais jouées (sur 36) | ${res.map((r) => Object.values(r.plays).filter((x) => x === 0).length).join(" | ")} |
| Joueurs avec un niveau 3 | ${res.map((r) => ((100 * r.lvl3) / r.players).toFixed(1) + " %").join(" | ")} |
| Propriétés par joueur | ${res.map((r) => (r.props / r.players).toFixed(1)).join(" | ")} |
| Siège 1 à 3 joueurs | ${res.map((r) => ((100 * r.seat[0]!) / (N / 2)).toFixed(1) + " %").join(" | ")} |

## Nombre de fois où chaque carte est jouée pour 100 parties
| # | Carte | Coût | ${values.map((v) => `${v} pts`).join(" | ")} |
|---|---|---|${values.map(() => "---|").join("")}
${CARDS.map((c) => `| ${c.id} | ${c.name} | ${c.cost.materials}M ${c.cost.energy}É | ${res.map((r) => per100(r.plays[c.id]!)).join(" | ")} |`).join("\n")}

Note : une carte n'apparaît qu'une fois dans la pioche ; avec ~2 pioches par joueur, chaque carte est vue dans environ 15-20 % des parties. Une valeur de 0 signifie que les bots, lorsqu'ils l'ont, ne trouvent jamais de situation où elle rapporte plus qu'elle ne coûte.
`;
writeFileSync(`docs/simulations/ressources_${N}.md`, out);
console.log(out.split("## Nombre")[0]);
