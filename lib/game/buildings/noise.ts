/**
 * Deterministic hashing and noise for the buildings module.
 *
 * Pure functions of their arguments and not an `Rng` stream, for the reason every generator in this
 * repo carries its own copy of this file: a texture shader and a facade builder are both asked
 * "what is at this point" in whatever order the caller happens to walk, so the source has to be
 * **addressable** rather than sequential. A stream is ordered — add one call anywhere and every
 * later value shifts — which is right for placing things a player placed and wrong for deciding
 * which of a hall's twenty-two windows has a light on.
 *
 * DOM-free, Babylon-free, node-safe.
 */

/** 32-bit integer hash (a variant of Thomas Wang's). */
export function hashInt(x: number): number {
  let h = x | 0;
  h = Math.imul(h ^ (h >>> 16), 0x21f0aaad);
  h = Math.imul(h ^ (h >>> 15), 0x735a2d97);
  return (h ^ (h >>> 15)) >>> 0;
}

export function hash2(x: number, y: number, salt: number): number {
  return hashInt((Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1)) + (salt | 0));
}

/** Hash of a lattice point in [0, 1). */
export function rand2(x: number, y: number, salt: number): number {
  return hash2(x, y, salt) / 4294967296;
}

/** FNV-1a over a string, so a blueprint id or an entity id can salt a lattice. */
export function hashString(text: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0 || 1e-6));
  return t * t * (3 - 2 * t);
}

/**
 * Value noise on a lattice that WRAPS at `period`.
 *
 * Every texture here tiles, so a non-wrapping noise would put a seam down the middle of every wall
 * in the park. The period is the caller's, in lattice units.
 */
export function tileableNoise(x: number, y: number, period: number, salt: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const p = Math.max(1, Math.round(period));
  const wrap = (n: number): number => ((n % p) + p) % p;
  const x0 = wrap(xi);
  const y0 = wrap(yi);
  const x1 = wrap(xi + 1);
  const y1 = wrap(yi + 1);
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = rand2(x0, y0, salt);
  const b = rand2(x1, y0, salt);
  const c = rand2(x0, y1, salt);
  const d = rand2(x1, y1, salt);
  return mix(mix(a, b, u), mix(c, d, u), v);
}

/** Fractal sum of {@link tileableNoise}, normalised to roughly 0..1. */
export function tileableFbm(
  x: number,
  y: number,
  period: number,
  salt: number,
  octaves = 4
): number {
  let sum = 0;
  let amp = 0.5;
  let total = 0;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += tileableNoise(x * freq, y * freq, period * freq, salt + i * 97) * amp;
    total += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / (total || 1);
}
