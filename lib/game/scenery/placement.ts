/**
 * Where a prop goes: the three placement modes, as pure functions.
 *
 * Nothing here touches the scene or the world — a mode takes a spec, a shape and a source of
 * randomness, and returns positions. That is what lets the tools module preview a line of lamps
 * before it dispatches one, and what lets the self-test assert that two runs of the same seed put
 * the same bench in the same square millimetre.
 *
 * The randomness is passed in as `next()` rather than taken from a module-level generator: the
 * caller owns which stream this draws from, so a preview that is thrown away can be rolled on a
 * throwaway fork instead of shifting the stream the committed placement will use.
 */

import type { PropSpec } from './catalog';
import { clamp, rand2 } from './noise';

export interface PlacedProp {
  key: string;
  x: number;
  z: number;
  /** Radians about +Y. */
  yaw: number;
  scale: number;
}

export interface PlaceOptions {
  /** Radians. `null` picks one at random (foliage) or keeps 0 (furniture). */
  yaw?: number | null;
  /** Overrides the spec's scale range. */
  scale?: number;
  /** Metres of positional jitter. */
  jitter?: number;
}

export type Random = () => number;

function scaleFor(spec: PropSpec, next: Random, override?: number): number {
  if (override != null) return override;
  const [lo, hi] = spec.scaleRange;
  // Two rolls averaged: a copse whose sizes are uniform reads as noise, one that clusters around
  // the species' own height reads as a species.
  return lo + ((hi - lo) * (next() + next())) / 2;
}

function yawFor(spec: PropSpec, next: Random, override?: number | null): number {
  if (override != null) return override;
  // A bench has a front; a boulder does not. Manufactured things keep the yaw the tool gave them.
  if (spec.cls === 'prop' && spec.source !== 'ambient') return 0;
  return next() * Math.PI * 2;
}

/** One prop at one point. */
export function placeSingle(
  spec: PropSpec,
  x: number,
  z: number,
  next: Random,
  opts: PlaceOptions = {}
): PlacedProp {
  const jitter = opts.jitter ?? 0;
  return {
    key: spec.key,
    x: x + (jitter ? (next() * 2 - 1) * jitter : 0),
    z: z + (jitter ? (next() * 2 - 1) * jitter : 0),
    yaw: yawFor(spec, next, opts.yaw),
    scale: scaleFor(spec, next, opts.scale),
  };
}

export interface LineOptions extends PlaceOptions {
  /** Centre-to-centre spacing in metres. Defaults to the footprint plus a gap. */
  spacing?: number;
  /** Face the props along the line (a fence) or across it (a bench). */
  facing?: 'along' | 'across';
  /** Drop the last item when the run does not divide evenly, instead of stretching the spacing. */
  exact?: boolean;
}

/**
 * A run of props from `a` to `b`.
 *
 * The spacing is adjusted so the run ends where it was asked to end rather than a third of a
 * fence panel short: a fence that stops 0.7 m from the gatepost is the single most visible thing
 * about a fence tool. `exact` turns that off for props that must not be stretched (lamps at a
 * documented interval).
 */
export function placeLine(
  spec: PropSpec,
  a: [number, number],
  b: [number, number],
  next: Random,
  opts: LineOptions = {}
): PlacedProp[] {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const length = Math.hypot(dx, dz);
  const nominal = opts.spacing ?? defaultSpacing(spec);
  if (length < 1e-3 || nominal <= 0) {
    return [placeSingle(spec, a[0], a[1], next, opts)];
  }
  const heading = Math.atan2(dx, dz);
  const yaw = opts.yaw ?? (opts.facing === 'across' ? heading + Math.PI / 2 : heading);
  const segments = Math.max(1, Math.round(length / nominal));
  const spacing = opts.exact ? nominal : length / segments;
  const count = Math.floor(length / spacing + 1e-6) + 1;
  const out: PlacedProp[] = [];
  const ux = dx / length;
  const uz = dz / length;
  for (let i = 0; i < count; i++) {
    const t = i * spacing;
    const jitter = opts.jitter ?? 0;
    out.push({
      key: spec.key,
      x: a[0] + ux * t + (jitter ? (next() * 2 - 1) * jitter : 0),
      z: a[1] + uz * t + (jitter ? (next() * 2 - 1) * jitter : 0),
      yaw,
      scale: scaleFor(spec, next, opts.scale),
    });
  }
  return out;
}

/** Panels butt together; everything else gets air around it. */
function defaultSpacing(spec: PropSpec): number {
  const width = Math.max(spec.footprint[0], 0.4);
  if (spec.generator === 'fence-iron' || spec.generator === 'hedge') return width;
  if (spec.cls === 'foliage') return Math.max(width * 0.9, 3);
  return width + 2.4;
}

export interface ScatterOptions extends PlaceOptions {
  /** Props per 100 m². */
  density?: number;
  /** Hard cap, so a drag across the whole park cannot allocate a million matrices. */
  max?: number;
  /** Reject a candidate — terrain slope, a path, water, another prop. */
  reject?: (x: number, z: number) => boolean;
  /** Metres to keep between two props of this scatter. Defaults to the spec's clearance. */
  clearance?: number;
  /** Weighted mix. When set, `spec` is only used for the defaults. */
  mix?: Array<{ spec: PropSpec; weight: number }>;
}

/**
 * The scatter brush: a disc of props with Poisson-ish spacing.
 *
 * Dart throwing against a grid rather than true Poisson sampling — the grid makes the rejection
 * test O(9) neighbours instead of O(n), and at brush sizes (a few hundred props) the difference
 * between this and a real Bridson sampler is not something a player can see. What they can see is
 * a clump, which is what an unrejected uniform scatter produces about a third of the time.
 */
export function scatterBrush(
  spec: PropSpec,
  centreX: number,
  centreZ: number,
  radius: number,
  next: Random,
  opts: ScatterOptions = {}
): PlacedProp[] {
  const mix = opts.mix?.length ? opts.mix : [{ spec, weight: 1 }];
  const totalWeight = mix.reduce((s, m) => s + Math.max(0, m.weight), 0) || 1;
  const density = opts.density ?? defaultDensity(spec);
  const area = Math.PI * radius * radius;
  const target = clamp(Math.round((area / 100) * density), 1, opts.max ?? 4000);
  const clearance = opts.clearance ?? spec.clearance;
  const cell = Math.max(clearance, 0.35);
  const grid = new Map<number, PlacedProp[]>();
  const key = (cx: number, cz: number) => (cx + 4096) * 8192 + (cz + 4096);
  const out: PlacedProp[] = [];
  // Six tries per prop: enough to fill a disc to the density the brush asks for, few enough that
  // a brush over a full exclusion zone gives up in microseconds instead of spinning.
  const attempts = target * 6;
  for (let i = 0; i < attempts && out.length < target; i++) {
    const angle = next() * Math.PI * 2;
    // sqrt keeps the disc uniform; without it every brush stroke has a bald ring at its edge.
    const r = Math.sqrt(next()) * radius;
    const x = centreX + Math.cos(angle) * r;
    const z = centreZ + Math.sin(angle) * r;
    let pick = mix[0].spec;
    let roll = next() * totalWeight;
    for (const m of mix) {
      roll -= Math.max(0, m.weight);
      if (roll <= 0) {
        pick = m.spec;
        break;
      }
    }
    const need = Math.max(clearance, pick.clearance);
    if (opts.reject?.(x, z)) continue;
    const cx = Math.floor(x / cell);
    const cz = Math.floor(z / cell);
    let blocked = false;
    for (let ox = -1; ox <= 1 && !blocked; ox++) {
      for (let oz = -1; oz <= 1 && !blocked; oz++) {
        const bucket = grid.get(key(cx + ox, cz + oz));
        if (!bucket) continue;
        for (const other of bucket) {
          const dx = other.x - x;
          const dz = other.z - z;
          if (dx * dx + dz * dz < need * need) {
            blocked = true;
            break;
          }
        }
      }
    }
    if (blocked) continue;
    const placed: PlacedProp = {
      key: pick.key,
      x,
      z,
      yaw: yawFor(pick, next, opts.yaw),
      scale: scaleFor(pick, next, opts.scale),
    };
    out.push(placed);
    const bucketKey = key(cx, cz);
    const bucket = grid.get(bucketKey);
    if (bucket) bucket.push(placed);
    else grid.set(bucketKey, [placed]);
  }
  return out;
}

function defaultDensity(spec: PropSpec): number {
  if (spec.cls !== 'foliage') return 4;
  if (spec.generator === 'grass-tuft' || spec.generator === 'flowers') return 90;
  if (spec.generator === 'shrub') return 26;
  return 6;
}

/**
 * A stable per-instance variation seed.
 *
 * Two props of the same species standing next to each other must not be the same mesh at the same
 * angle, and the difference has to survive a save: it is derived from the entity id, not rolled at
 * spawn. `main.ts` uses it for the per-instance tint and the sub-species pick.
 */
export function variantSeed(entityId: string, salt: number): number {
  let h = salt >>> 0;
  for (let i = 0; i < entityId.length; i++) {
    h ^= entityId.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** 0..1 from a variant seed and a channel index; the same seed always answers the same. */
export function variant01(seed: number, channel: number): number {
  return rand2(seed & 0xffff, seed >>> 16, channel * 2654435761);
}
