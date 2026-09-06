/**
 * Supports: footings on the terrain, columns up to the track, bracing between neighbours.
 *
 * Pure. The terrain arrives as a `ground(x, z)` callback — the `terrain` module's own
 * `api.height`, never a second guess at the heightfield — so a column stands on the ground the
 * player sculpted and moves with it.
 *
 * **Spacing follows load, not a ruler.** A column carries the vertical force the train puts
 * through the track at that point, so the spacing here is a base figure scaled by the local
 * vertical g and by the column's own height (a 25 m column buckles at a fraction of what a 4 m one
 * carries). The result is what a real structure looks like: bents crowded together through the
 * bottom of a drop where the load peaks at 3 g, and stretched out along a straight where it is 1.
 * A fixed interval gives the opposite impression — evenly spaced legs under a coaster read as
 * scaffolding.
 *
 * **A support must not float and must not sink.** The base is the terrain height at the column's
 * own (x, z), and the footing is a pad whose top sits 12 cm proud of it, so the join is visible
 * rather than a post disappearing into grass. The top is the underside of the structure at that
 * frame, so a banked turn's columns lean with the track instead of meeting it at a corner.
 *
 * **And it must not stand where the track already is.** A column is a vertical line from the
 * ground to the track, and on a layout that crosses over itself — every out-and-back does — that
 * line can pass through the return leg. Every candidate is tested against a grid of the track's
 * own frames and dropped if it comes within a clearance of one that is not its own.
 */

import { strut, type Geo } from './profile';
import type { TrackFrame, TrackSpline } from './spline';
import { HEARTLINE_HEIGHT } from './types';
import { clamp, type V3 } from './vec';

export interface SupportOptions {
  kind: 'steel' | 'timber' | 'none';
  /** Terrain height, metres. From `terrain` module's `api.height`. */
  ground(x: number, z: number): number;
  /** Vertical load in g at an arc length; the spacing follows it. */
  load(s: number): number;
  /** How far below the heartline the underside of the structure sits, metres. */
  structureDepth: number;
  /** How close a column may pass to a different part of the track, metres. Default 2.2. */
  clearance?: number;
  /** Shortest column worth drawing. Below this the track is on the ground. Default 1.1. */
  minHeight?: number;
}

export interface SupportBuild {
  /** Steel or timber members. */
  member: Geo;
  /** Concrete pads. */
  footing: Geo;
  columns: number;
  braces: number;
  triangles: number;
}

interface Column {
  /** Where it meets the track. */
  top: V3;
  /** Where it meets the ground. */
  base: V3;
  height: number;
  s: number;
  frame: TrackFrame;
}

/** Base spacing per style, metres. Timber bents are close together; steel columns are not. */
const BASE_SPACING = { timber: 3.2, steel: 9.5, none: 0 } as const;
/**
 * Half-width of a column, metres.
 *
 * A steel coaster's columns are 0.4–0.9 m tubes, not the poles the first pass drew: 0.32 m square
 * under a 20 m column read as scaffolding in the ground-level frame. Timber bents are doubled
 * 6×8 posts, so 0.26 m square is right for those.
 */
const COLUMN_HALF = { timber: 0.13, steel: 0.22, none: 0.1 } as const;
/** Half-width of a bracing member. Thinner than a column, but not a cable. */
const BRACE_HALF = 0.07;

function emptyGeo(): Geo {
  return { positions: [], normals: [], uvs: [], indices: [] };
}

/** An axis-aligned box in world space, six flat-shaded faces. */
function worldBox(geo: Geo, centre: V3, half: V3): void {
  const faces: Array<{ n: V3; c: Array<[number, number, number]> }> = [
    {
      n: [1, 0, 0],
      c: [
        [1, -1, -1],
        [1, 1, -1],
        [1, 1, 1],
        [1, -1, 1],
      ],
    },
    {
      n: [-1, 0, 0],
      c: [
        [-1, -1, 1],
        [-1, 1, 1],
        [-1, 1, -1],
        [-1, -1, -1],
      ],
    },
    {
      n: [0, 1, 0],
      c: [
        [-1, 1, -1],
        [1, 1, -1],
        [1, 1, 1],
        [-1, 1, 1],
      ],
    },
    {
      n: [0, -1, 0],
      c: [
        [-1, -1, 1],
        [1, -1, 1],
        [1, -1, -1],
        [-1, -1, -1],
      ],
    },
    {
      n: [0, 0, 1],
      c: [
        [-1, -1, 1],
        [1, -1, 1],
        [1, 1, 1],
        [-1, 1, 1],
      ],
    },
    {
      n: [0, 0, -1],
      c: [
        [-1, 1, -1],
        [1, 1, -1],
        [1, -1, -1],
        [-1, -1, -1],
      ],
    },
  ];
  for (const face of faces) {
    const start = geo.positions.length / 3;
    face.c.forEach((corner, i) => {
      geo.positions.push(
        centre[0] + corner[0] * half[0],
        centre[1] + corner[1] * half[1],
        centre[2] + corner[2] * half[2]
      );
      geo.normals.push(face.n[0], face.n[1], face.n[2]);
      geo.uvs.push(i === 1 || i === 2 ? 1 : 0, i >= 2 ? 1 : 0);
    });
    // Same winding rule as `profile.ts`: front faces wind so the cross product points inward.
    geo.indices.push(start, start + 2, start + 1, start, start + 3, start + 2);
  }
}

/** A coarse grid of the track's own points, so a clearance test is not O(n) per candidate. */
class TrackGrid {
  private cells = new Map<string, Array<{ p: V3; s: number }>>();
  private size: number;

  constructor(frames: readonly TrackFrame[], size: number) {
    this.size = size;
    for (const frame of frames) {
      const key = this.key(frame.p[0], frame.p[2]);
      const bucket = this.cells.get(key);
      if (bucket) bucket.push({ p: frame.p, s: frame.s });
      else this.cells.set(key, [{ p: frame.p, s: frame.s }]);
    }
  }

  private key(x: number, z: number): string {
    return `${Math.floor(x / this.size)}:${Math.floor(z / this.size)}`;
  }

  /**
   * True when a vertical line at (x, z) between `yLow` and `yHigh` passes within `radius` of a
   * piece of track more than `ignoreWithin` metres of arc away from `s`.
   */
  blocked(
    x: number,
    z: number,
    yLow: number,
    yHigh: number,
    s: number,
    radius: number,
    ignoreWithin: number,
    total: number
  ): boolean {
    const cx = Math.floor(x / this.size);
    const cz = Math.floor(z / this.size);
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const bucket = this.cells.get(`${cx + i}:${cz + j}`);
        if (!bucket) continue;
        for (const point of bucket) {
          let ds = Math.abs(point.s - s);
          if (total > 0) ds = Math.min(ds, total - ds);
          if (ds < ignoreWithin) continue;
          if (point.p[1] < yLow || point.p[1] > yHigh) continue;
          if (Math.hypot(point.p[0] - x, point.p[2] - z) < radius) return true;
        }
      }
    }
    return false;
  }
}

export function buildSupports(
  spline: TrackSpline,
  frames: readonly TrackFrame[],
  options: SupportOptions
): SupportBuild {
  const member = emptyGeo();
  const footing = emptyGeo();
  if (options.kind === 'none' || frames.length < 2) {
    return { member, footing, columns: 0, braces: 0, triangles: 0 };
  }
  const clearance = options.clearance ?? 2.2;
  const minHeight = options.minHeight ?? 1.1;
  const half = COLUMN_HALF[options.kind];
  const grid = new TrackGrid(frames, 6);
  const total = spline.closed ? spline.length() : 0;

  const columns: Column[] = [];
  let s = 0;
  const length = spline.length();
  let guard = 0;
  while (s < length && guard++ < 4000) {
    const frame = spline.frameAt(s);
    const top: V3 = [
      frame.p[0] - frame.up[0] * (HEARTLINE_HEIGHT + options.structureDepth),
      frame.p[1] - frame.up[1] * (HEARTLINE_HEIGHT + options.structureDepth),
      frame.p[2] - frame.up[2] * (HEARTLINE_HEIGHT + options.structureDepth),
    ];
    const groundY = options.ground(top[0], top[2]);
    const height = top[1] - groundY;
    // Advance BEFORE the acceptance tests, so a rejected candidate does not stall the walk.
    const step =
      BASE_SPACING[options.kind] *
      clamp(1 / (0.55 + 0.45 * Math.abs(options.load(s))), 0.6, 1.15) *
      clamp(1 - Math.max(0, height) / 70, 0.62, 1);
    s += Math.max(1.5, step);

    // Track rolled past 78° has its underside pointing sideways; a vertical column would meet it
    // edge-on. Those stretches want a cantilever off a neighbour, which this does not draw yet.
    if (frame.up[1] < 0.2) continue;
    if (height < minHeight) continue;
    if (grid.blocked(top[0], top[2], groundY, top[1] - 0.6, frame.s, clearance, 14, total))
      continue;
    columns.push({ top, base: [top[0], groundY, top[2]], height, s: frame.s, frame });
  }

  let braces = 0;
  for (let i = 0; i < columns.length; i++) {
    const column = columns[i];
    if (options.kind === 'timber') {
      drawBent(member, footing, column, half);
    } else {
      drawColumn(member, footing, column, half);
    }
    const next = columns[i + 1];
    if (!next) continue;
    const span = Math.hypot(next.base[0] - column.base[0], next.base[2] - column.base[2]);
    // Bracing is what stops a row of legs reading as scaffolding poles, and it is what a real
    // structure needs: two columns 12 m apart and 6 m tall are a portal frame, not two posts.
    if (span < 1.5 || span > 22) continue;
    if (Math.min(column.height, next.height) < 4) continue;
    braces += drawBracing(member, column, next, options.kind);
  }

  return {
    member,
    footing,
    columns: columns.length,
    braces,
    triangles: member.indices.length / 3 + footing.indices.length / 3,
  };
}

function pad(footing: Geo, base: V3, size: number): void {
  // The top sits 12 cm proud of the ground and the block reaches 40 cm below it: a footing that is
  // flush reads as a post pushed into grass, and one that floats is the classic tell.
  worldBox(footing, [base[0], base[1] - 0.14, base[2]], [size, 0.26, size]);
}

function drawColumn(member: Geo, footing: Geo, column: Column, half: number): void {
  pad(footing, column.base, Math.max(0.45, half * 3.4));
  strut(member, [column.base[0], column.base[1] + 0.1, column.base[2]], column.top, half);
  // A short head plate where the column meets the track, so the join is a detail and not a butt.
  const head: V3 = [column.top[0], column.top[1] - 0.12, column.top[2]];
  worldBox(member, head, [half * 2.1, 0.07, half * 2.1]);
}

/**
 * A timber bent: two splayed legs, a ledger and a diagonal.
 *
 * The splay is 1 in 9, which is roughly what a wooden coaster's bents run at; it is what makes a
 * 20 m-tall structure stand up sideways, and it is the silhouette everyone recognises.
 */
function drawBent(member: Geo, footing: Geo, column: Column, half: number): void {
  const frame = column.frame;
  const splay = Math.max(0.5, column.height / 9);
  for (const side of [-1, 1]) {
    const foot: V3 = [
      column.base[0] + frame.right[0] * side * splay,
      column.base[1],
      column.base[2] + frame.right[2] * side * splay,
    ];
    const head: V3 = [
      column.top[0] + frame.right[0] * side * 0.45,
      column.top[1],
      column.top[2] + frame.right[2] * side * 0.45,
    ];
    pad(footing, foot, 0.42);
    strut(member, [foot[0], foot[1] + 0.1, foot[2]], head, half);
  }
  const levels = Math.max(1, Math.floor(column.height / 3.4));
  for (let i = 1; i <= levels; i++) {
    const t = i / (levels + 1);
    const y = column.base[1] + column.height * t;
    const spread = splay * (1 - t) + 0.45 * t;
    const a: V3 = [
      column.base[0] - frame.right[0] * spread,
      y,
      column.base[2] - frame.right[2] * spread,
    ];
    const b: V3 = [
      column.base[0] + frame.right[0] * spread,
      y,
      column.base[2] + frame.right[2] * spread,
    ];
    strut(member, a, b, half * 0.72);
  }
}

/**
 * Ledgers and X-bracing between two neighbouring columns, in TIERS.
 *
 * The round-1 critique caught two things here and the second was a claim, not a bug. One X per bay
 * whatever its height means a twenty-metre bay gets a single diagonal across the whole of it, and
 * from sixty metres the wooden coaster read as a row of bare poles with the occasional thin cross
 * — measured on `wood-hill.png`, with no aliasing involved. And the code skipped every second bay
 * on timber, with a comment claiming that "is also how a real wooden coaster is braced". It is
 * not. A woodie's bents stand three to four metres apart and EVERY bay between them is braced,
 * tier by tier, which is the lattice the whole silhouette is made of.
 *
 * So: a horizontal ledger roughly every four and a half metres of height, an X in each tier
 * between them, and no bay skipped. The tier count is capped at four because past that the members
 * are thinner than a pixel at any distance the game is played from, and the far-distance problem
 * they would make worse is a silhouette LOD nobody has built yet (see the module's report).
 */
function drawBracing(member: Geo, a: Column, b: Column, kind: 'steel' | 'timber' | 'none'): number {
  const lower = Math.min(a.height, b.height);
  const tiers = Math.max(1, Math.min(4, Math.round(lower / 4.5)));
  const ledgerHalf = kind === 'timber' ? BRACE_HALF * 1.15 : BRACE_HALF;
  let count = 0;
  // The lowest ledger sits clear of the footings; the top one under the track, not on it.
  const first = 0.45;
  const span = lower * 0.94 - first;
  for (let t = 0; t < tiers; t++) {
    const y0 = first + (span * t) / tiers;
    const y1 = first + (span * (t + 1)) / tiers;
    const a0: V3 = [a.base[0], a.base[1] + y0, a.base[2]];
    const b0: V3 = [b.base[0], b.base[1] + y0, b.base[2]];
    const a1: V3 = [a.base[0], a.base[1] + y1, a.base[2]];
    const b1: V3 = [b.base[0], b.base[1] + y1, b.base[2]];
    // One ledger per tier boundary, so the top of tier n is the bottom of tier n+1 and the bay
    // does not get two members in the same place.
    if (t === 0) {
      strut(member, a0, b0, ledgerHalf);
      count += 1;
    }
    strut(member, a1, b1, ledgerHalf);
    strut(member, a0, b1, BRACE_HALF * 0.85);
    strut(member, b0, a1, BRACE_HALF * 0.85);
    count += 3;
  }
  return count;
}
