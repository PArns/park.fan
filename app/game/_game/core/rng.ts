/**
 * Seeded randomness. The only source of it inside the simulation.
 *
 * `Math.random` is banned under `_game/**` and `pnpm test:game-determinism` greps for it, because
 * one call is enough to make a save round-trip and a soak run stop meaning anything.
 *
 * The generator is **xoshiro128\*\***: four 32-bit words of state, a 2^128-1 period, and it passes
 * the statistical batteries that a linear congruential generator fails in exactly the way a park
 * sim would notice — LCG low bits correlate, and "pick a guest's next need" reads low bits.
 *
 * ## Streams
 *
 * Randomness is split into **named streams** — `guests`, `weather`, `breakdowns`, `naming`,
 * `layout`, … — each seeded by hashing its name together with the world seed. That is not tidiness:
 * with one shared generator, adding a single `rng.next()` to the weather system shifts every guest
 * decision for the rest of the run, so a one-line change to an unrelated system invalidates every
 * saved comparison. With streams it does not.
 *
 * Presentation code (particle jitter, idle animation offsets) gets its own stream on the MAIN
 * thread and its values never reach the sim.
 */

/** FNV-1a over a string, used to derive a stream seed from its name. */
function hashString(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** SplitMix32 — used only to expand one seed into the four words xoshiro needs. */
function splitMix32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x9e3779b9) >>> 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 16), 0x21f0aaad);
    z = Math.imul(z ^ (z >>> 15), 0x735a2d97);
    return (z ^ (z >>> 15)) >>> 0;
  };
}

export interface RngState {
  readonly s0: number;
  readonly s1: number;
  readonly s2: number;
  readonly s3: number;
}

export class RngStream {
  private s0: number;
  private s1: number;
  private s2: number;
  private s3: number;

  private constructor(s0: number, s1: number, s2: number, s3: number) {
    // All-zero state is a fixed point of xoshiro and would emit zeros forever.
    this.s0 = s0 || 1;
    this.s1 = s1;
    this.s2 = s2;
    this.s3 = s3;
  }

  /** A stream for `name`, derived from the world seed. Same (seed, name) → same sequence. */
  static create(worldSeed: number, name: string): RngStream {
    const expand = splitMix32((worldSeed ^ hashString(name)) >>> 0);
    return new RngStream(expand(), expand(), expand(), expand());
  }

  static restore(state: RngState): RngStream {
    return new RngStream(state.s0, state.s1, state.s2, state.s3);
  }

  save(): RngState {
    return { s0: this.s0, s1: this.s1, s2: this.s2, s3: this.s3 };
  }

  /** Raw 32-bit output. */
  nextUint32(): number {
    const t = Math.imul(this.s1, 5);
    const result = (((t << 7) | (t >>> 25)) * 9) >>> 0;
    const shifted = (this.s1 << 9) >>> 0;

    this.s2 ^= this.s0;
    this.s3 ^= this.s1;
    this.s1 ^= this.s2;
    this.s0 ^= this.s3;
    this.s2 = (this.s2 ^ shifted) >>> 0;
    this.s3 = ((this.s3 << 11) | (this.s3 >>> 21)) >>> 0;
    this.s0 >>>= 0;
    this.s1 >>>= 0;

    return result;
  }

  /** Uniform in [0, 1). 24 significant bits — enough for everything here and exactly reproducible. */
  next(): number {
    return (this.nextUint32() >>> 8) / 0x1000000;
  }

  /** Uniform in [min, max). */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Uniform integer in [min, max]. Rejection-free; the modulo bias is below 2^-24 at these sizes. */
  int(min: number, max: number): number {
    if (max <= min) return min;
    return min + Math.floor(this.next() * (max - min + 1));
  }

  bool(probability = 0.5): boolean {
    return this.next() < probability;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('rng.pick on an empty list');
    return items[this.int(0, items.length - 1)]!;
  }

  /** Weighted pick. `weights` must be the same length as `items` and sum above zero. */
  pickWeighted<T>(items: readonly T[], weights: readonly number[]): T {
    let total = 0;
    for (const w of weights) total += Math.max(0, w);
    if (total <= 0) return this.pick(items);
    let roll = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      roll -= Math.max(0, weights[i] ?? 0);
      if (roll <= 0) return items[i]!;
    }
    return items[items.length - 1]!;
  }

  /** Fisher–Yates, in place. Deterministic given the stream. */
  shuffle<T>(items: T[]): T[] {
    for (let i = items.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      const tmp = items[i]!;
      items[i] = items[j]!;
      items[j] = tmp;
    }
    return items;
  }

  /**
   * Normal-ish deviate by the sum of three uniforms.
   *
   * Not Box–Muller on purpose: that needs a `Math.log` and a cached second value, and a cached
   * value is state that has to be saved or the round-trip stops being byte-identical. Three
   * uniforms are within a few percent of a Gaussian over ±3σ, which is far inside what a guest's
   * patience threshold needs.
   */
  normal(mean = 0, stdDev = 1): number {
    const sum = this.next() + this.next() + this.next();
    return mean + ((sum - 1.5) / 0.5) * 0.577 * stdDev;
  }
}

/** The stream names the simulation uses. Adding one here is how a system gets its own sequence. */
export const SIM_STREAMS = [
  'guests',
  'guestSpawn',
  'guestNames',
  'needs',
  'weather',
  'breakdowns',
  'economy',
  'staff',
  'ratings',
  'layout',
] as const;

export type SimStreamName = (typeof SIM_STREAMS)[number];
