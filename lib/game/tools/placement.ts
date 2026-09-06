/**
 * Whether a thing may stand where the cursor is, and what is already standing there.
 *
 * Pure, injected samplers, covered by `selftest.mjs` — because this is the half of a build tool
 * that a screenshot cannot argue with: a red ghost in a frame proves the colour changed, not that
 * the rule is right. Four rules, each of which refuses something a park would not have:
 *
 *   `out-of-bounds`  the footprint leaves the square the world is (`world.terrain.size`).
 *   `under-water`    any corner is at or below the water table. A bench in the lake.
 *   `too-steep`      the ground under the footprint drops more than the item can bridge. Every
 *                    module in this game draws a flat slab and lets a skirt cover the difference
 *                    (`shops/build.ts`), so the tolerance is a slope plus a base, not a constant.
 *   `overlap`        another entity's footprint is in the way, with a margin.
 *
 * **Picking is geometric and not `scene.pick`.** Everything placed in this game is a thin instance
 * — one mesh per shop TYPE, one per prop batch — so a ray hit answers "the burger-stand batch",
 * which is every burger stand at once and is at the origin besides. The rectangle each entity
 * occupies is a fact this module already has to know for `overlap`, so the same table answers
 * both. It also means a click can pick a thing whose mesh has not been built yet, which is what
 * makes undo of a placement selectable the moment it comes back.
 */

import { pointInRect, rectArea, rectsOverlap, type Rect } from './snap';
import type { PlacementReason } from './types';

export interface GroundProbe {
  height(x: number, z: number): number;
  waterLevel(): number;
}

export interface Obstacle {
  id: string;
  rect: Rect;
}

export interface PlacementRules {
  /** Metres of level ground an item is assumed to be able to bridge, whatever its size. */
  maxDropBase: number;
  /** Plus this fraction of its longest side. A 12 m fence may follow more fall than a bin. */
  maxSlope: number;
  /** Metres a footprint keeps out of the water table. */
  waterClearance: number;
  /** Metres of air between two footprints. */
  margin: number;
}

export const DEFAULT_PLACEMENT_RULES: PlacementRules = {
  maxDropBase: 0.35,
  maxSlope: 0.18,
  waterClearance: 0.05,
  margin: 0.1,
};

export interface PlacementQuery {
  rect: Rect;
  /** Half the park's side, metres. The world is a square centred on the origin. */
  parkHalf: number;
  ground: GroundProbe;
  obstacles: readonly Obstacle[];
  /**
   * Entities this placement does not have to avoid.
   *
   * Two of them, and the second is the interesting one. The entity being MOVED is in the list and
   * would collide with itself. And when an existing thing is rotated or nudged, whatever it
   * already overlaps is passed in too: a park built by a generator has props that touch, and a
   * rule that refuses to rotate a bench because the hedge behind it was already against it
   * punishes the player for a collision somebody else made. Only NEW collisions are refused.
   */
  ignore?: ReadonlySet<string>;
  rules?: PlacementRules;
}

export interface PlacementVerdict {
  ok: boolean;
  reasons: PlacementReason[];
  /** The ground the item would stand on: the highest corner, so nothing floats over a hollow. */
  y: number;
  /** Height difference across the footprint, metres. */
  drop: number;
  blockedBy: string | null;
}

/** The five points a footprint is judged on: its four corners and its centre. */
export function samplePoints(rect: Rect): Array<[number, number]> {
  const cos = Math.cos(rect.yaw);
  const sin = Math.sin(rect.yaw);
  const hx = rect.sizeX / 2;
  const hz = rect.sizeZ / 2;
  const local: Array<[number, number]> = [
    [-hx, -hz],
    [hx, -hz],
    [hx, hz],
    [-hx, hz],
    [0, 0],
  ];
  return local.map(([lx, lz]) => [rect.x + lx * cos + lz * sin, rect.z - lx * sin + lz * cos]);
}

export function evaluatePlacement(query: PlacementQuery): PlacementVerdict {
  const rules = query.rules ?? DEFAULT_PLACEMENT_RULES;
  const reasons: PlacementReason[] = [];
  const points = samplePoints(query.rect);

  let min = Infinity;
  let max = -Infinity;
  let outside = false;
  for (const [x, z] of points) {
    if (Math.abs(x) > query.parkHalf || Math.abs(z) > query.parkHalf) outside = true;
    const h = query.ground.height(x, z);
    if (!Number.isFinite(h)) {
      // A sampler that cannot answer is not a flat park: refusing is the only honest verdict.
      reasons.push('no-ground');
      return { ok: false, reasons, y: 0, drop: 0, blockedBy: null };
    }
    if (h < min) min = h;
    if (h > max) max = h;
  }
  if (outside) reasons.push('out-of-bounds');

  const water = query.ground.waterLevel();
  if (min <= water + rules.waterClearance) reasons.push('under-water');

  const drop = max - min;
  const longest = Math.max(query.rect.sizeX, query.rect.sizeZ);
  if (drop > rules.maxDropBase + rules.maxSlope * longest) reasons.push('too-steep');

  let blockedBy: string | null = null;
  for (const obstacle of query.obstacles) {
    if (query.ignore?.has(obstacle.id)) continue;
    if (rectsOverlap(query.rect, obstacle.rect, rules.margin)) {
      blockedBy = obstacle.id;
      reasons.push('overlap');
      break;
    }
  }

  return { ok: reasons.length === 0, reasons, y: max, drop, blockedBy };
}

/**
 * The entity under a ground point: the smallest footprint that contains it.
 *
 * Smallest rather than nearest-centre, because a bench standing on a plaza is inside the plaza's
 * rectangle as well as its own, and clicking a bench has to select the bench.
 */
export function pickEntityAt(x: number, z: number, obstacles: readonly Obstacle[]): string | null {
  let best: string | null = null;
  let bestArea = Infinity;
  for (const obstacle of obstacles) {
    if (!pointInRect(x, z, obstacle.rect)) continue;
    const area = rectArea(obstacle.rect);
    if (area < bestArea) {
      bestArea = area;
      best = obstacle.id;
    }
  }
  return best;
}
