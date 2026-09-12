/**
 * Tileable value noise for the procedural textures (clouds, star field, the showcase's PBR set).
 *
 * Every texture this module makes is generated once at boot and then scrolled or reused, so the
 * noise has to tile: a cloud sheet that does not wrap shows its seam every time the wind pushes
 * it past the edge. The lattice is therefore indexed modulo a period rather than over the whole
 * plane, and `fbm` keeps that property by halving the period with every octave.
 *
 * Pure and DOM-free: the sim never reaches it today, but the showcase and the texture builders
 * both do, and a second copy of a hash is a second set of results.
 */

/** Deterministic 0..1 hash of an integer lattice point. */
export function hash2(ix: number, iy: number, seed: number): number {
  let h = (ix * 374761393 + iy * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function smootherstep(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** Value noise on a lattice that wraps every `period` units in both axes. */
export function valueNoise(x: number, y: number, period: number, seed: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = smootherstep(x - x0);
  const fy = smootherstep(y - y0);
  const wrap = (v: number) => ((v % period) + period) % period;
  const xa = wrap(x0);
  const xb = wrap(x0 + 1);
  const ya = wrap(y0);
  const yb = wrap(y0 + 1);
  const n00 = hash2(xa, ya, seed);
  const n10 = hash2(xb, ya, seed);
  const n01 = hash2(xa, yb, seed);
  const n11 = hash2(xb, yb, seed);
  const a = n00 + (n10 - n00) * fx;
  const b = n01 + (n11 - n01) * fx;
  return a + (b - a) * fy;
}

export interface FbmOptions {
  octaves: number;
  /** Lattice cells across the tile at the first octave. */
  period: number;
  gain?: number;
  lacunarity?: number;
  seed?: number;
}

/** Fractal value noise in 0..1, tiling over the unit square. */
export function fbm(u: number, v: number, opts: FbmOptions): number {
  const gain = opts.gain ?? 0.5;
  const lacunarity = opts.lacunarity ?? 2;
  const seed = opts.seed ?? 1;
  let amplitude = 1;
  let total = 0;
  let norm = 0;
  let period = opts.period;
  for (let o = 0; o < opts.octaves; o++) {
    total += amplitude * valueNoise(u * period, v * period, period, seed + o * 7919);
    norm += amplitude;
    amplitude *= gain;
    period = Math.round(period * lacunarity);
  }
  return total / norm;
}

/** Ridged variant — the crisper edges read as cumulus rather than as a blur. */
export function ridged(u: number, v: number, opts: FbmOptions): number {
  const gain = opts.gain ?? 0.5;
  const lacunarity = opts.lacunarity ?? 2;
  const seed = opts.seed ?? 1;
  let amplitude = 1;
  let total = 0;
  let norm = 0;
  let period = opts.period;
  for (let o = 0; o < opts.octaves; o++) {
    const n = valueNoise(u * period, v * period, period, seed + o * 6151);
    total += amplitude * (1 - Math.abs(n * 2 - 1));
    norm += amplitude;
    amplitude *= gain;
    period = Math.round(period * lacunarity);
  }
  return total / norm;
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0 || 1e-6));
  return t * t * (3 - 2 * t);
}

export function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
