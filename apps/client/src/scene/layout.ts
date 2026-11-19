/** Géométrie du plateau : 24 cases sur le pourtour d'une grille 7 × 7. */
export const CELL = 1.42;
export const TILE = 1.34;

export function tileSide(i: number): 0 | 1 | 2 | 3 {
  return Math.floor(i / 6) as 0 | 1 | 2 | 3;
}

export function tilePos(i: number): [number, number] {
  const k = i % 6;
  switch (tileSide(i)) {
    case 0: return [(3 - k) * CELL, 3 * CELL];
    case 1: return [-3 * CELL, (3 - k) * CELL];
    case 2: return [(-3 + k) * CELL, -3 * CELL];
    default: return [3 * CELL, (-3 + k) * CELL];
  }
}

/** Rotation Y de la case : le bas du texte tourné vers le bord extérieur. */
export function tileRot(i: number): number {
  return [0, -Math.PI / 2, Math.PI, Math.PI / 2][tileSide(i)]!;
}

/** Décalage d'un pion sur une case (jusqu'à 4 pions). */
export function pawnOffset(seat: number, i: number): [number, number] {
  const o = 0.3;
  const local: [number, number][] = [[-o, -o * 0.2], [o, -o * 0.2], [-o, o * 0.9], [o, o * 0.9]];
  const [lx, lz] = local[seat % 4]!;
  const r = tileRot(i);
  return [lx * Math.cos(r) + lz * Math.sin(r), -lx * Math.sin(r) + lz * Math.cos(r)];
}

/** Petit générateur seedé pour le décor (stable d'une partie à l'autre). */
export function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
