import { DEFAULT_CONFIG } from "@deals/engine";
import { runGame } from "./run.ts";
const N = 10000;
for (const sb of [[0, 30, 45, 60], [0, 30, 50, 70]]) {
  const wins = [0, 0, 0, 0];
  for (let i = 0; i < N; i++) {
    const r = runGame(40_000_000 + i, ["balanced", "balanced", "balanced", "balanced"], { config: { ...DEFAULT_CONFIG, seatBonus: sb } });
    for (const p of r.players) if (p.rank === 1) wins[p.seat]! += 1 / r.winners.length;
  }
  console.log(`| V9, 4 joueurs, compensation +${sb.join("/+")} D | ${wins.map((w) => (100 * w / N).toFixed(1) + " %").join(" | ")} |`);
}
