import { DEFAULT_CONFIG } from "@deals/engine";
import { runGame } from "./run.ts";
const N = 10000;
for (const sb of [[0, 35, 55], [0, 40, 60], [0, 30, 60]]) {
  const wins = [0, 0, 0]; let l3 = 0;
  for (let i = 0; i < N; i++) {
    const r = runGame(40_000_000 + i, ["balanced", "balanced", "balanced"], { config: { ...DEFAULT_CONFIG, seatBonus: [...sb, 0] } });
    for (const p of r.players) { if (p.rank === 1) wins[p.seat]! += 1 / r.winners.length; l3 += p.maxLevel === 3 ? 1 : 0; }
  }
  console.log(`| V9, 3 joueurs, compensation +${sb.join("/+")} D | ${wins.map((w) => (100 * w / N).toFixed(1) + " %").join(" | ")} | niv. 3 ${(100 * l3 / N / 3).toFixed(1)} % |`);
}
