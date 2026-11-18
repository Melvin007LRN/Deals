import type { Rng } from "./types.ts";

/** RNG déterministe (sfc32) pour le simulateur et les rejeux. Jamais utilisé en production pour les tirages. */
export function seededRng(seed: number): Rng & { state(): number[] } {
  let a = 0x9e3779b9 ^ seed,
    b = 0x243f6a88 ^ (seed * 31),
    c = 0xb7e15162 ^ (seed * 17),
    d = seed >>> 0 || 1;
  const next = (): number => {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
  for (let i = 0; i < 15; i++) next();
  return {
    int(n: number) {
      if (!Number.isInteger(n) || n <= 0) throw new Error(`rng.int(${n})`);
      return Math.floor(next() * n);
    },
    state: () => [a, b, c, d],
  };
}

/** RNG cryptographique (production, côté serveur). Rejet pour éviter le biais modulo. */
export function cryptoRng(): Rng {
  return {
    int(n: number) {
      if (!Number.isInteger(n) || n <= 0 || n > 2 ** 32) throw new Error(`rng.int(${n})`);
      const limit = Math.floor(2 ** 32 / n) * n;
      const buf = new Uint32Array(1);
      for (;;) {
        globalThis.crypto.getRandomValues(buf);
        const v = buf[0]!;
        if (v < limit) return v % n;
      }
    },
  };
}

export function shuffle<T>(arr: T[], rng: Rng): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}
