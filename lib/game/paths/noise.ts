/**
 * The small amount of noise this module needs. Pure and DOM-free; the texture generator and the
 * vertex-colour pass both use it, so a stain in the albedo and the wear painted over it come from
 * the same field rather than from two that happen to look similar.
 *
 * Everything is seeded and integer-hashed — no `Math.random`, and the same park generates the same
 * concrete on every machine.
 */

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0 || 1e-6));
  return t * t * (3 - 2 * t);
}

/** Deterministic hash of two integers to [0, 1). */
export function hash2(x: number, y: number, seed: number): number {
  let h = (Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1) ^ (seed | 0)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0;
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39) >>> 0;
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

export function hash1(x: number, seed: number): number {
  return hash2(x, 0x9e37, seed);
}

/** Value noise on a `period`-wide integer lattice; wraps, so the texture tiles. */
export function valueNoise(u: number, v: number, period: number, seed: number): number {
  const x = u * period;
  const y = v * period;
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const sx = xf * xf * (3 - 2 * xf);
  const sy = yf * yf * (3 - 2 * yf);
  const wrap = (n: number) => ((n % period) + period) % period;
  const x0 = wrap(xi);
  const x1 = wrap(xi + 1);
  const y0 = wrap(yi);
  const y1 = wrap(yi + 1);
  const n00 = hash2(x0, y0, seed);
  const n10 = hash2(x1, y0, seed);
  const n01 = hash2(x0, y1, seed);
  const n11 = hash2(x1, y1, seed);
  return mix(mix(n00, n10, sx), mix(n01, n11, sx), sy);
}

export interface FbmOptions {
  octaves?: number;
  period?: number;
  seed?: number;
  gain?: number;
}

/** Tiling fBm in [0, 1]. Periods double per octave so every octave still wraps. */
export function fbm(u: number, v: number, opts: FbmOptions = {}): number {
  const octaves = opts.octaves ?? 4;
  let period = opts.period ?? 4;
  const seed = opts.seed ?? 0;
  const gain = opts.gain ?? 0.5;
  let amp = 1;
  let sum = 0;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoise(u, v, Math.max(1, Math.round(period)), seed + o * 131);
    norm += amp;
    amp *= gain;
    period *= 2;
  }
  return sum / (norm || 1);
}

/** Ridged variant: |2n − 1| inverted, for cracks and grain. */
export function ridged(u: number, v: number, opts: FbmOptions = {}): number {
  return 1 - Math.abs(fbm(u, v, opts) * 2 - 1);
}
