/**
 * Deterministic noise and hashing for the scenery module.
 *
 * DOM-free, Babylon-free and reachable from `sim.ts`: the ambient scatter is evaluated on both
 * threads and the two answers have to be the same bit pattern, which is why everything here is a
 * pure function of its arguments and nothing draws from an `Rng` stream. A stream is ordered — add
 * one call anywhere and every later value shifts — and the scatter is asked "what is in this cell"
 * in whatever order a camera happens to move, so it must be addressable rather than sequential.
 * `ctx.rng` still owns the placement of things a player places; a hash owns the landscape.
 */

/** 32-bit integer hash (a variant of Thomas Wang's), avalanche-tested by eye and good enough. */
export function hashInt(x: number): number {
  let h = x | 0;
  h = Math.imul(h ^ (h >>> 16), 0x21f0aaad);
  h = Math.imul(h ^ (h >>> 15), 0x735a2d97);
  return (h ^ (h >>> 15)) >>> 0;
}

/** Hash of a lattice point plus a salt. Returns a uint32. */
export function hash2(x: number, y: number, salt: number): number {
  return hashInt((Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1)) + (salt | 0));
}

/** Hash of a lattice point in [0, 1). */
export function rand2(x: number, y: number, salt: number): number {
  return hash2(x, y, salt) / 4294967296;
}

/** Hash of a string (FNV-1a), so a species key can salt a lattice. */
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

/** Value noise on the integer lattice, smooth-interpolated. */
export function valueNoise(x: number, y: number, salt: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = rand2(xi, yi, salt);
  const b = rand2(xi + 1, yi, salt);
  const c = rand2(xi, yi + 1, salt);
  const d = rand2(xi + 1, yi + 1, salt);
  return mix(mix(a, b, u), mix(c, d, u), v);
}

/** Fractal value noise, `octaves` layers at half amplitude and double frequency. */
export function fbm(x: number, y: number, salt: number, octaves: number): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let fx = x;
  let fy = y;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(fx, fy, salt + i * 7919) * amp;
    norm += amp;
    amp *= 0.5;
    fx *= 2.03;
    fy *= 1.97;
  }
  return sum / (norm || 1);
}

/**
 * Tileable fractal noise on a `period` × `period` lattice — the texture generators need a field
 * that wraps, or every generated albedo shows a seam where the wrap lands.
 */
export function tileableFbm(
  x: number,
  y: number,
  period: number,
  salt: number,
  octaves: number
): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let p = period;
  let fx = x;
  let fy = y;
  for (let i = 0; i < octaves; i++) {
    sum += tileableValue(fx, fy, p, salt + i * 6151) * amp;
    norm += amp;
    amp *= 0.5;
    fx *= 2;
    fy *= 2;
    p *= 2;
  }
  return sum / (norm || 1);
}

function tileableValue(x: number, y: number, period: number, salt: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const wrap = (n: number) => ((n % period) + period) % period;
  const x0 = wrap(xi);
  const y0 = wrap(yi);
  const x1 = wrap(xi + 1);
  const y1 = wrap(yi + 1);
  const a = rand2(x0, y0, salt);
  const b = rand2(x1, y0, salt);
  const c = rand2(x0, y1, salt);
  const d = rand2(x1, y1, salt);
  return mix(mix(a, b, u), mix(c, d, u), v);
}
