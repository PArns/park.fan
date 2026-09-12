/**
 * Anchors: what a preset points at, resolved at the moment it is applied.
 *
 * A preset that names coordinates is a preset that is wrong the day somebody moves the thing. So
 * `coaster` does not mean `(-90, 10, -40)` — it means `kinds:coaster | plot:coaster |
 * park:centre`, a fallback chain evaluated left to right against the world as it is now. The day
 * the `track` module places a coaster on that plot, the preset follows it with no edit here; and
 * `pool` frames the lake today because there is no pool in the demo park yet and the chain says
 * so out loud instead of pretending.
 *
 * Nothing in this file switches on a preset id or on a content id: `kinds:` takes whatever the
 * registry's open `EntityKind` union holds, `plot:` asks `demo-park`, and `registerAnchor()` lets
 * a module or a scenario add a resolver of its own. Pure — no Babylon, no DOM.
 */

import type { Entity, Vec3 } from '../core/types';
import type { AnchorSample } from './types';

export interface AnchorContext {
  /** Terrain height, metres. The module reads it through `terrain`'s public API. */
  ground(x: number, z: number): number;
  /** Every placed entity, in insertion order. */
  entities(): Iterable<Entity>;
  /** The park's half-size in metres (`world.terrain.size / 2`). */
  half: number;
  /** The water table height, for `park:water`. */
  waterLevel(): number;
  /** `paths.entrance()`, when the paths module is loaded. */
  entrance(): { x: number; z: number } | null;
  /** `demo-park.plots()`, when there is a demo park. */
  plots(): Array<{ id: string; x: number; z: number; sizeX: number; sizeZ: number }>;
}

type Extent = { x: number; z: number; radius: number; count: number };

function extentOf(points: Array<[number, number]>): Extent | null {
  if (points.length === 0) return null;
  let sx = 0;
  let sz = 0;
  for (const [x, z] of points) {
    sx += x;
    sz += z;
  }
  const cx = sx / points.length;
  const cz = sz / points.length;
  let r = 0;
  for (const [x, z] of points) {
    const d = Math.hypot(x - cx, z - cz);
    if (d > r) r = d;
  }
  return { x: cx, z: cz, radius: r, count: points.length };
}

/**
 * The largest body of water, found by walking the height grid rather than by asking a module that
 * does not exist yet.
 *
 * 65 × 65 samples over the park is 4,225 bilinear reads, taken once per resolve and cached by the
 * caller. Two lakes would give their midpoint, which is wrong and is the honest limit of a
 * centroid; the demo park has one, at (149, 149) with a 36 m radius, measured.
 */
function waterExtent(ctx: AnchorContext, steps = 64): Extent | null {
  const level = ctx.waterLevel();
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    for (let j = 0; j <= steps; j++) {
      const x = -ctx.half + (2 * ctx.half * i) / steps;
      const z = -ctx.half + (2 * ctx.half * j) / steps;
      if (ctx.ground(x, z) < level) pts.push([x, z]);
    }
  }
  return extentOf(pts);
}

const sample = (ctx: AnchorContext, e: Extent, from: string, minRadius = 6): AnchorSample => ({
  x: e.x,
  z: e.z,
  y: ctx.ground(e.x, e.z),
  radius: Math.max(minRadius, e.radius),
  from,
});

/**
 * The built-in resolvers, keyed by the part of a reference before the colon.
 *
 * A resolver gets the argument and returns null when it cannot answer, which is what makes the
 * `|` chain work: "the pools, or failing that the water, or failing that the middle" is three
 * nulls and an answer, not a conditional in the caller.
 */
export function builtinResolvers(
  ctx: AnchorContext
): Record<string, (arg: string) => AnchorSample | null> {
  let water: Extent | null | undefined;
  return {
    park: (arg) => {
      if (arg === 'centre' || arg === 'center') {
        return { x: 0, z: 0, y: ctx.ground(0, 0), radius: ctx.half * 0.75, from: 'park:centre' };
      }
      if (arg === 'content') {
        const pts: Array<[number, number]> = [];
        for (const e of ctx.entities()) pts.push([e.position[0], e.position[2]]);
        const ext = extentOf(pts);
        return ext ? sample(ctx, ext, 'park:content', 40) : null;
      }
      if (arg === 'water') {
        if (water === undefined) water = waterExtent(ctx);
        return water ? sample(ctx, water, 'park:water', 12) : null;
      }
      if (arg === 'entrance') {
        const g = ctx.entrance();
        return g
          ? { x: g.x, z: g.z, y: ctx.ground(g.x, g.z), radius: 16, from: 'park:entrance' }
          : null;
      }
      return null;
    },
    plot: (arg) => {
      const plot = ctx.plots().find((p) => p.id === arg);
      if (!plot) return null;
      return {
        x: plot.x,
        z: plot.z,
        y: ctx.ground(plot.x, plot.z),
        radius: Math.max(plot.sizeX, plot.sizeZ) / 2,
        from: `plot:${arg}`,
      };
    },
    entity: (arg) => {
      for (const e of ctx.entities()) {
        if (e.id !== arg) continue;
        return {
          x: e.position[0],
          z: e.position[2],
          y: e.position[1],
          radius: 8 * (e.scale ?? 1),
          from: `entity:${arg}`,
        };
      }
      return null;
    },
    kinds: (arg) => {
      const wanted = new Set(
        arg
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      );
      if (wanted.size === 0) return null;
      const pts: Array<[number, number]> = [];
      for (const e of ctx.entities()) {
        if (wanted.has(e.kind)) pts.push([e.position[0], e.position[2]]);
      }
      const ext = extentOf(pts);
      return ext ? sample(ctx, ext, `kinds:${arg}`, 14) : null;
    },
    xz: (arg) => {
      const parts = arg.split(',').map(Number);
      if (parts.length < 2 || parts.some((n) => !Number.isFinite(n))) return null;
      const [x, z, r] = parts;
      return { x, z, y: ctx.ground(x, z), radius: Number.isFinite(r) ? r : 20, from: `xz:${arg}` };
    },
  };
}

/** A registry of resolvers a module or a scenario can add to. */
export class AnchorTable {
  private extra = new Map<string, (arg: string) => AnchorSample | null>();

  register(prefix: string, resolve: (arg: string) => AnchorSample | null): () => void {
    this.extra.set(prefix, resolve);
    return () => {
      if (this.extra.get(prefix) === resolve) this.extra.delete(prefix);
    };
  }

  size(): number {
    return this.extra.size;
  }

  /**
   * Resolve one `|`-separated chain. Registered resolvers are tried before the built-ins so a
   * module can shadow `plot:` or `kinds:` with something it knows better.
   */
  resolve(chain: string, ctx: AnchorContext): AnchorSample | null {
    const builtins = builtinResolvers(ctx);
    for (const raw of chain.split('|')) {
      const ref = raw.trim();
      if (!ref) continue;
      const at = ref.indexOf(':');
      const prefix = at < 0 ? ref : ref.slice(0, at);
      const arg = at < 0 ? '' : ref.slice(at + 1);
      const hit = (this.extra.get(prefix) ?? builtins[prefix])?.(arg);
      if (hit) return hit;
    }
    return null;
  }
}

/** Squared horizontal distance, used by the follow code and the tests. */
export function distance2(a: Vec3, b: Vec3): number {
  return (a[0] - b[0]) ** 2 + (a[2] - b[2]) ** 2;
}
