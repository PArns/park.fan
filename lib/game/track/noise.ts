/**
 * Tileable value noise for the track's procedural materials.
 *
 * Its own copy rather than an import from `paths` or `scenery`: those live behind their modules'
 * public APIs and neither exports its noise, and a shared helper between two module folders is a
 * coupling nobody declared. It is forty lines.
 *
 * Everything here is periodic in the lattice, so a texture generated from it tiles without a seam —
 * which matters because a rail is one long strip of UV that repeats every few metres.
 */

export function hash2(x: number, y: number, seed: number): number {
  let h = (x | 0) * 374761393 + (y | 0) * 668265263 + (seed | 0) * 1442695041;
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function fade(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Value noise on a `period`×`period` lattice, wrapping at the period. */
export function valueNoise(u: number, v: number, period: number, seed: number): number {
  const x = u * period;
  const y = v * period;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = fade(x - x0);
  const fy = fade(y - y0);
  const wrap = (n: number) => ((n % period) + period) % period;
  const a = hash2(wrap(x0), wrap(y0), seed);
  const b = hash2(wrap(x0 + 1), wrap(y0), seed);
  const c = hash2(wrap(x0), wrap(y0 + 1), seed);
  const d = hash2(wrap(x0 + 1), wrap(y0 + 1), seed);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

export interface FbmOptions {
  octaves?: number;
  period?: number;
  seed?: number;
  gain?: number;
}

export function fbm(u: number, v: number, options: FbmOptions = {}): number {
  const octaves = options.octaves ?? 4;
  const gain = options.gain ?? 0.5;
  let period = options.period ?? 8;
  let amplitude = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amplitude * valueNoise(u, v, period, (options.seed ?? 0) + i * 101);
    norm += amplitude;
    amplitude *= gain;
    period *= 2;
  }
  return sum / norm;
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x < edge0 ? 0 : 1;
  return fade(clamp01((x - edge0) / (edge1 - edge0)));
}
