// Empaquette le serveur de jeu (moteur + bots) en une fonction Vercel autonome : api/deals.js
import { build } from "esbuild";
await build({
  entryPoints: [new URL("./entry.ts", import.meta.url).pathname],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node20",
  outfile: new URL("../api/deals.js", import.meta.url).pathname,
  banner: { js: "// Fichier généré par server/build.mjs — ne pas modifier à la main." },
});
console.log("api/deals.js généré");
