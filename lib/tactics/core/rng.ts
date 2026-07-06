/**
 * Deterministic seeded RNG for the Queue Tactics simulation.
 *
 * Mulberry32 — tiny, fast, good-enough statistical quality for shop rolls.
 * The RNG is used ONLY for out-of-combat randomness (shop rolls, AI variety).
 * Combat itself is 100% RNG-free (chance effects are deterministic counters)
 * so that a mirror match is an exact draw and replays never diverge.
 */

export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [0, maxExclusive). */
  int(maxExclusive: number): number;
  /** Current internal state (serialisable). */
  state(): number;
}

export function createRng(seed: number): Rng {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (maxExclusive: number) => Math.floor(next() * maxExclusive),
    state: () => s,
  };
}

/** Deterministic 32-bit string hash (FNV-1a) — for deriving sub-seeds. */
export function hashSeed(...parts: (string | number)[]): number {
  let h = 0x811c9dc5;
  const str = parts.join('|');
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
