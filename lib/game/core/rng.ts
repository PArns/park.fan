/**
 * Seeded random numbers for the simulation.
 *
 * xoshiro128** — small, fast, and deterministic across engines. Every module gets its own
 * stream via `fork(label)` so that adding a random call in one module cannot shift the
 * sequence another module sees. `Math.random` is banned in `lib/game/**` (see
 * `scripts/test-game-lint.mjs`).
 */

function splitmix32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x9e3779b9) >>> 0;
    let t = a ^ (a >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t ^= t >>> 15;
    t = Math.imul(t, 0x735a2d97);
    return (t ^ (t >>> 15)) >>> 0;
  };
}

function hashLabel(label: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < label.length; i++) {
    h ^= label.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

export class Rng {
  private s0: number;
  private s1: number;
  private s2: number;
  private s3: number;
  readonly seed: number;

  constructor(seed: number) {
    this.seed = seed >>> 0;
    const sm = splitmix32(this.seed);
    this.s0 = sm();
    this.s1 = sm();
    this.s2 = sm();
    this.s3 = sm();
    if ((this.s0 | this.s1 | this.s2 | this.s3) === 0) this.s0 = 1;
  }

  /** Uniform in [0, 1). */
  next(): number {
    const result = Math.imul(rotl(Math.imul(this.s1, 5), 7), 9) >>> 0;
    const t = this.s1 << 9;
    this.s2 ^= this.s0;
    this.s3 ^= this.s1;
    this.s1 ^= this.s2;
    this.s0 ^= this.s3;
    this.s2 ^= t;
    this.s3 = rotl(this.s3, 11);
    return result / 4294967296;
  }

  /** Uniform in [min, max). */
  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(list: readonly T[]): T {
    return list[Math.floor(this.next() * list.length)];
  }

  /** Approximately normal, mean 0, sd 1 (Box–Muller). */
  gaussian(): number {
    let u = 0;
    let v = 0;
    while (u === 0) u = this.next();
    while (v === 0) v = this.next();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /** A new independent stream derived from this seed and a label. */
  fork(label: string): Rng {
    return new Rng((this.seed ^ hashLabel(label)) >>> 0);
  }

  /** Current internal state, for saves. */
  state(): [number, number, number, number] {
    return [this.s0, this.s1, this.s2, this.s3];
  }

  restore(state: [number, number, number, number]): void {
    [this.s0, this.s1, this.s2, this.s3] = state;
  }
}

function rotl(x: number, k: number): number {
  return ((x << k) | (x >>> (32 - k))) >>> 0;
}

/** Deterministic seed from a string, for `?seed=demo`. */
export function seedFromString(text: string): number {
  const n = Number(text);
  if (Number.isFinite(n) && text.trim() !== '') return n >>> 0;
  return hashLabel(text);
}
