/**
 * Everything that stands on the ground: the furniture, the avenues, the copses and the treeline.
 *
 * **Nothing here names a content id.** The demo park asks the registry for a *role* — "the lamp",
 * "the tallest broadleaf", "the clipped hedge" — and takes whatever the packs answer with,
 * preferring the pack that was registered first. Two consequences are the point of doing it that
 * way: a pack with different furniture produces the same park drawn in its own vocabulary, and a
 * pack that answers a role with nothing simply gets no lamps rather than a crash. The roles that
 * came back empty are recorded on the world so the report can say which ones, instead of a
 * screenshot being the first place anybody finds out.
 *
 * The one vocabulary this file does share with another module is the scenery module's own
 * generator names, and it shares them as a TYPE (`(typeof GENERATORS)[number]`) rather than as
 * string literals, so renaming a generator over there is a compile error over here.
 *
 * DOM-free and Babylon-free.
 */

import type { Entity, TerrainData, Vec3 } from '../core/types';
import type { Rng } from '../core/rng';
import { GENERATORS, placeLine, placeSingle, scatterBrush } from '../scenery';
import type { PlacedProp, PropSpec } from '../scenery';
import { LAYER_CONCRETE, LAYER_WOOD, sampleHeight, samplePaint } from '../terrain';
import {
  chebyshev,
  ENTRANCE_PLAZA,
  FOUNTAIN_SQUARE,
  LAKE,
  lakeRing,
  LAKE_RING_COUNT,
  MARKET_SQUARE,
  PARK_HALF,
  PATHS,
  RIM,
  WATER_LEVEL,
} from './plan';

type GeneratorName = (typeof GENERATORS)[number];

/** The roles the demo park is laid out in terms of. */
export interface ParkRoles {
  lamp: PropSpec | null;
  bench: PropSpec | null;
  bin: PropSpec | null;
  planter: PropSpec | null;
  fountain: PropSpec | null;
  arch: PropSpec | null;
  flag: PropSpec | null;
  hedge: PropSpec | null;
  canopyTree: PropSpec | null;
  streetTree: PropSpec | null;
  conifer: PropSpec | null;
  shrub: PropSpec | null;
  flowers: PropSpec | null;
}

const GEN_FOUNTAIN: GeneratorName = 'fountain-tier';
const GEN_ARCH: GeneratorName = 'entrance-arch';
const GEN_FLAG: GeneratorName = 'flag';
const GEN_HEDGE: GeneratorName = 'hedge';
const GEN_PLANTER: GeneratorName = 'planter-round';

/**
 * Resolve every role against the catalogue.
 *
 * Ties are broken by pack registration order and then by key, never by a preferred id: "the first
 * pack that can answer" is a rule; "core-classic" would be a hard-coded list of one.
 */
export function resolveRoles(catalog: Map<string, PropSpec>, packOrder: string[]): ParkRoles {
  const all = [...catalog.values()].sort((a, b) => {
    const pa = packOrder.indexOf(a.pack);
    const pb = packOrder.indexOf(b.pack);
    if (pa !== pb) return (pa < 0 ? 99 : pa) - (pb < 0 ? 99 : pb);
    return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
  });
  const first = (test: (s: PropSpec) => boolean): PropSpec | null => all.find(test) ?? null;
  const broadleaf = all.filter((s) => s.source === 'foliage' && s.category === 'broadleaf');
  const byHeight = [...broadleaf].sort((a, b) => a.height - b.height);

  return {
    lamp: first((s) => s.furniture === 'lamp'),
    bench: first((s) => s.furniture === 'bench'),
    bin: first((s) => s.furniture === 'bin'),
    planter: first((s) => s.generator === GEN_PLANTER && s.source === 'scenery'),
    fountain: first((s) => s.generator === GEN_FOUNTAIN),
    arch: first((s) => s.generator === GEN_ARCH),
    flag: first((s) => s.generator === GEN_FLAG),
    hedge: first((s) => s.generator === GEN_HEDGE && s.source === 'scenery'),
    canopyTree: byHeight.length ? byHeight[byHeight.length - 1] : null,
    streetTree: byHeight.length ? byHeight[0] : null,
    conifer: first((s) => s.source === 'foliage' && s.category === 'conifer'),
    shrub: first((s) => s.source === 'foliage' && s.category === 'shrub'),
    flowers: first((s) => s.source === 'foliage' && s.category === 'flower'),
  };
}

export function missingRoles(roles: ParkRoles): string[] {
  return Object.entries(roles)
    .filter(([, spec]) => spec == null)
    .map(([role]) => role)
    .sort();
}

export interface PropContext {
  terrain: TerrainData;
  rng: Rng;
  roles: ParkRoles;
  /** Deterministic id source; see the docblock on `build.ts`. */
  allocId: (kind: string) => string;
}

/** Places everything and returns the entities, in creation order. */
export function placeDemoProps(ctx: PropContext): Entity[] {
  const out: Entity[] = [];
  const next = () => ctx.rng.next();

  const commit = (placed: PlacedProp, spec: PropSpec): void => {
    const id = ctx.allocId('scenery');
    const position: Vec3 = [placed.x, sampleHeight(ctx.terrain, placed.x, placed.z), placed.z];
    out.push({
      id,
      kind: 'scenery',
      pack: spec.pack,
      item: spec.item,
      position,
      yaw: placed.yaw,
      scale: placed.scale,
    });
  };

  const one = (spec: PropSpec | null, x: number, z: number, yaw?: number): void => {
    if (!spec) return;
    commit(placeSingle(spec, x, z, next, { yaw: yaw ?? null }), spec);
  };

  const run = (
    spec: PropSpec | null,
    a: [number, number],
    b: [number, number],
    spacing: number,
    facing: 'along' | 'across' = 'along'
  ): void => {
    if (!spec) return;
    for (const p of placeLine(spec, a, b, next, { spacing, facing })) commit(p, spec);
  };

  /** A copse. `reject` keeps trees off the paving, out of the water and inside the park. */
  const copse = (
    spec: PropSpec | null,
    x: number,
    z: number,
    radius: number,
    count: number
  ): void => {
    if (!spec) return;
    for (const p of scatterBrush(spec, x, z, radius, next, {
      density: (count / (Math.PI * radius * radius)) * 100,
      max: count,
      reject: (px, pz) => rejectPlanting(ctx.terrain, px, pz),
    })) {
      commit(p, spec);
    }
  };

  /** Props on a ring, facing the centre. A plaza's furniture is laid out this way and no other. */
  const around = (
    spec: PropSpec | null,
    cx: number,
    cz: number,
    radius: number,
    count: number,
    phase: number,
    faceIn: boolean
  ): void => {
    if (!spec) return;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + phase;
      const x = cx + Math.cos(a) * radius;
      const z = cz + Math.sin(a) * radius;
      // A bench's front is +Z at yaw 0, so facing the centre is the heading from here to there.
      const yaw = faceIn ? Math.atan2(-Math.cos(a), -Math.sin(a)) + Math.PI / 2 : 0;
      one(spec, x, z, faceIn ? yaw : 0);
    }
  };

  /**
   * Trees along a path, at a setback, on one or both sides.
   *
   * This is the shape of the whole planting decision and not just a helper. Round 1 planted 893
   * trees, of which 62 — **6.9 %** — stood within ten metres of a path, and the density by distance
   * band came out as a bathtub: 61.6 trees per hectare in the boundary belt against **7.8/ha** in
   * the 80–120 m band, which is exactly where a visitor spends the day. A real park is planted
   * along its circulation and thins towards the fence; that was upside down.
   *
   * `placeLine` cannot be used for this even though it is the obvious call: it takes no `reject`,
   * so it would drop trees into the paving and the lake. The walk is done here so every candidate
   * goes through `rejectPlanting` and through a clearance test against everything already placed —
   * a bench with a tree in it is worse than a gap in an avenue.
   *
   * The setback is half the path's width plus a margin, so the trunk stands clear of the kerb
   * rather than over the walk. Spacing follows the hierarchy, and so does the species: an avenue
   * is ONE species — that repetition is what makes a row of trees read as an avenue rather than as
   * scattered planting — while the narrower branches mix.
   */
  const avenue = (
    spec: PropSpec | null,
    points: readonly number[],
    closed: boolean,
    setback: number,
    spacing: number,
    side: 'both' | 'outer',
    jitter = 0
  ): void => {
    if (!spec) return;
    const n = points.length / 2;
    if (n < 2) return;
    // For `outer`, "away from the park's centre" is the right side of a loop: a four-metre path
    // with trees on both sides is a corridor, and these loops ring a reserved plot that something
    // will be built on.
    let cx = 0;
    let cz = 0;
    for (let i = 0; i < n; i++) {
      cx += points[i * 2]!;
      cz += points[i * 2 + 1]!;
    }
    cx /= n;
    cz /= n;
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const ax = points[i * 2]!;
      const az = points[i * 2 + 1]!;
      const bx = points[((i + 1) % n) * 2]!;
      const bz = points[((i + 1) % n) * 2 + 1]!;
      const dx = bx - ax;
      const dz = bz - az;
      const len = Math.hypot(dx, dz);
      if (len < 1e-3) continue;
      const ux = dx / len;
      const uz = dz / len;
      // Left normal in a right-handed +Y-up frame.
      const nx = -uz;
      const nz = ux;
      const outward = ((ax + bx) / 2 - cx) * nx + ((az + bz) / 2 - cz) * nz;
      const signs: number[] = side === 'both' ? [1, -1] : [outward > 0 ? 1 : -1];
      const steps = Math.max(1, Math.round(len / spacing));
      for (const sign of signs) {
        for (let k = 0; k <= steps; k++) {
          // The last point of a segment is the first of the next one; skip it or every corner
          // gets a double tree.
          if (k === steps && (closed || i < last - 1)) continue;
          const t = (k / steps) * len;
          const jx = jitter ? (next() * 2 - 1) * jitter : 0;
          const jz = jitter ? (next() * 2 - 1) * jitter : 0;
          const x = ax + ux * t + nx * sign * setback + jx;
          const z = az + uz * t + nz * sign * setback + jz;
          if (rejectPlanting(ctx.terrain, x, z)) continue;
          if (occupied(x, z, 2.8)) continue;
          one(spec, x, z);
        }
      }
    }
  };

  /** Is something already standing within `radius` of this point? */
  const occupied = (x: number, z: number, radius: number): boolean => {
    const r2 = radius * radius;
    for (const e of out) {
      const dx = e.position[0] - x;
      const dz = e.position[2] - z;
      if (dx * dx + dz * dz < r2) return true;
    }
    return false;
  };

  const r = ctx.roles;

  // ── The gate ──────────────────────────────────────────────────────────────────────────────
  // The arch's piers sit at ±6 m, two metres clear of the eight-metre gate walk's kerb.
  one(r.arch, 0, 210, 0);
  for (const x of [-8.6, 8.6]) {
    one(r.flag, x, 212);
    one(r.flag, x, 203);
  }
  run(r.lamp, [-6.4, 226], [-6.4, 200], 13);
  run(r.lamp, [6.4, 226], [6.4, 200], 13);
  one(r.bin, 6.4, 196);

  // ── Entrance plaza ────────────────────────────────────────────────────────────────────────
  // A sixty-metre disc of paving with furniture only round its rim reads as a car park; the middle
  // gets a planted roundel the main street runs either side of, which is what a forecourt this
  // size actually has in it.
  const ep = ENTRANCE_PLAZA;
  around(r.lamp, ep.x, ep.z, ep.radius - 3, 12, 0.26, false);
  around(r.bench, ep.x, ep.z, ep.radius - 9, 8, 0.52, true);
  around(r.planter, ep.x, ep.z, ep.radius - 1, 8, 0, false);
  around(r.hedge, ep.x, ep.z, 9.4, 14, 0.11, true);
  around(r.planter, ep.x, ep.z, 6, 6, 0.4, false);
  copse(r.flowers, ep.x, ep.z, 5.2, 10);
  one(r.bin, -9, 158);
  one(r.bin, 9, 194);
  // Two clipped hedge blocks either side of the axis, the formal frame of the forecourt.
  run(r.hedge, [-16, 156], [-16, 172], 2, 'along');
  run(r.hedge, [16, 156], [16, 172], 2, 'along');
  copse(r.streetTree, -24, 166, 9, 5);
  copse(r.streetTree, 24, 166, 9, 5);

  // ── Main street: two avenues of the smaller broadleaf, lamps staggered between them ───────
  for (const side of [-1, 1]) {
    run(r.streetTree, [side * 9.5, 100], [side * 9.5, 148], 13);
    run(r.streetTree, [side * 9.5, 24], [side * 9.5, 66], 13);
  }
  run(r.lamp, [-6.2, 102], [-6.2, 144], 21);
  run(r.lamp, [6.2, 112], [6.2, 148], 18);
  run(r.lamp, [-6.2, 26], [-6.2, 62], 18);
  run(r.lamp, [6.2, 34], [6.2, 66], 16);
  one(r.bench, -6.6, 122, Math.PI / 2);
  one(r.bench, 6.6, 132, -Math.PI / 2);
  one(r.bench, -6.6, 44, Math.PI / 2);
  one(r.bench, 6.6, 52, -Math.PI / 2);
  one(r.bin, 6.6, 104);
  one(r.bin, -6.6, 140);
  one(r.bin, 6.6, 30);
  run(r.hedge, [-11.5, 106], [-11.5, 142], 2, 'along');
  run(r.hedge, [11.5, 106], [11.5, 142], 2, 'along');

  // ── Market square ─────────────────────────────────────────────────────────────────────────
  around(r.lamp, MARKET_SQUARE.x, MARKET_SQUARE.z, MARKET_SQUARE.radius - 3.5, 8, 0.4, false);
  around(r.bench, MARKET_SQUARE.x, MARKET_SQUARE.z, MARKET_SQUARE.radius - 8.5, 6, 0.9, true);
  around(r.planter, MARKET_SQUARE.x, MARKET_SQUARE.z, MARKET_SQUARE.radius - 1.5, 6, 0.2, false);
  one(r.flag, -13, 66);
  one(r.flag, 13, 66);
  one(r.bin, -8, 104);

  // ── Fountain square: the hub, and what the `close` camera is pointed at ───────────────────
  one(r.fountain, FOUNTAIN_SQUARE.x, FOUNTAIN_SQUARE.z, 0);
  around(r.bench, FOUNTAIN_SQUARE.x, FOUNTAIN_SQUARE.z, 9.5, 8, Math.PI / 8, true);
  around(r.lamp, FOUNTAIN_SQUARE.x, FOUNTAIN_SQUARE.z, 14.5, 8, 0, false);
  around(r.planter, FOUNTAIN_SQUARE.x, FOUNTAIN_SQUARE.z, 19.5, 8, Math.PI / 8, false);
  around(
    r.lamp,
    FOUNTAIN_SQUARE.x,
    FOUNTAIN_SQUARE.z,
    FOUNTAIN_SQUARE.radius - 2.5,
    12,
    0.26,
    false
  );
  one(r.bin, 11, -14);
  one(r.bin, -11, 6);
  // A ring of limes just outside the kerb. A sixty-metre square with a six-metre fountain in it
  // has nothing to give the eye a scale, and the trees are what a European park puts there.
  around(
    r.streetTree,
    FOUNTAIN_SQUARE.x,
    FOUNTAIN_SQUARE.z,
    FOUNTAIN_SQUARE.radius + 4.5,
    10,
    0.31,
    false
  );
  // Four parterres in the corners of the square: a box hedge round all four sides, flowers inside
  // it, and a lime standing behind each one. Two open sides was the first version and read as two
  // stray hedges rather than as a bed.
  for (const [sx, sz] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ] as Array<[number, number]>) {
    const cx = FOUNTAIN_SQUARE.x + sx * 17.5;
    const cz = FOUNTAIN_SQUARE.z + sz * 17.5;
    const b = 5;
    run(r.hedge, [cx - b, cz - b], [cx + b, cz - b], 2, 'along');
    run(r.hedge, [cx + b, cz - b], [cx + b, cz + b], 2, 'along');
    run(r.hedge, [cx + b, cz + b], [cx - b, cz + b], 2, 'along');
    run(r.hedge, [cx - b, cz + b], [cx - b, cz - b], 2, 'along');
    copse(r.flowers, cx, cz, 3.8, 8);
    one(r.streetTree, cx + sx * 9.5, cz + sz * 9.5);
  }

  // ── The lakeside promenade ────────────────────────────────────────────────────────────────
  // A lamp at every vertex and a bench between every other pair, both pushed away from the water
  // so the boardwalk itself stays clear.
  for (let i = 0; i < LAKE_RING_COUNT; i++) {
    const [x, z] = lakeRing(i, LAKE_RING_COUNT);
    const [nx, nz] = outward(x, z);
    one(r.lamp, x + nx * 3.4, z + nz * 3.4);
    if (i % 2 === 0) {
      const [bx, bz] = lakeRing(i + 0.5, LAKE_RING_COUNT);
      const [ox, oz] = outward(bx, bz);
      // Benches face the water, i.e. back the way the outward normal points.
      one(r.bench, bx + ox * 3.2, bz + oz * 3.2, Math.atan2(-ox, -oz));
    }
    if (i % 4 === 0) one(r.bin, x + nx * 5.2, z + nz * 5.2);
  }
  copse(r.conifer, 96, 196, 20, 9);
  copse(r.canopyTree, 200, 178, 22, 9);
  copse(r.shrub, 118, 122, 12, 12);
  copse(r.shrub, 186, 118, 12, 10);

  // ── Copses in the open park ───────────────────────────────────────────────────────────────
  const stands: Array<[PropSpec | null, number, number, number, number]> = [
    [r.canopyTree, -46, 140, 20, 9],
    [r.canopyTree, 48, 132, 18, 8],
    [r.streetTree, -52, 60, 17, 8],
    [r.conifer, -78, 40, 22, 10],
    [r.canopyTree, 46, 12, 18, 8],
    [r.conifer, -140, -6, 24, 11],
    [r.canopyTree, -40, -84, 22, 10],
    [r.conifer, 34, -74, 20, 9],
    [r.canopyTree, 150, -100, 24, 10],
    [r.streetTree, -150, 96, 22, 9],
    // A second set, put where the overview camera showed bald green: the valley's west flank, the
    // ground either side of the entrance terrace, and the four quadrants between the loops.
    [r.conifer, -172, 40, 24, 11],
    [r.canopyTree, -62, 176, 18, 8],
    [r.canopyTree, 62, 178, 18, 8],
    [r.conifer, 122, -140, 22, 10],
    [r.conifer, -152, -152, 26, 12],
    [r.canopyTree, 174, -58, 22, 10],
    [r.streetTree, 44, 202, 18, 8],
    [r.canopyTree, -112, 132, 20, 9],
    [r.conifer, 28, -164, 20, 9],
    [r.streetTree, 92, 104, 16, 7],
    [r.canopyTree, -196, -22, 22, 10],
    [r.streetTree, 196, 78, 18, 8],
  ];
  for (const [spec, x, z, radius, count] of stands) copse(spec, x, z, radius, count);
  copse(r.shrub, -30, 110, 10, 9);
  copse(r.shrub, 30, 96, 10, 9);
  copse(r.shrub, -66, -14, 12, 10);
  copse(r.flowers, -34, 92, 8, 12);
  copse(r.flowers, 36, 70, 8, 12);

  // ── Avenues ───────────────────────────────────────────────────────────────────────────────
  // The planting follows the circulation, which is the thing round 1 got backwards. Read the path
  // plans rather than repeating their coordinates here: a path that moves takes its trees with it,
  // and there is exactly one place a route is written down.
  //
  // The hierarchy is the whole design. The eight-metre spine gets a formal double avenue of ONE
  // species at 13 m, which is a boulevard; the six-metre walks get a mixed, jittered planting at
  // 17 m, which is a garden walk; the four-metre loops get one side only at 21 m, because a
  // four-metre path with trees to left and right is a corridor and these loops ring the plots
  // something will be built on. The service road behind the treeline gets nothing — it is a back
  // way, and planting it would say otherwise.
  const AVENUE_SKIP = new Set(['service-road', 'gate']);
  for (const plan of PATHS) {
    if (plan.form !== 'path' || AVENUE_SKIP.has(plan.id)) continue;
    const width = plan.width ?? 4;
    if (width >= 8) {
      avenue(r.streetTree, plan.points, !!plan.closed, width / 2 + 4.0, 11, 'both');
    } else if (width >= 6) {
      avenue(r.canopyTree, plan.points, !!plan.closed, width / 2 + 4.4, 14, 'both', 1.6);
    } else {
      // Both sides, but stood further back. The corridor a narrow path with trees either side
      // makes is a function of the SETBACK, not of the number of sides: at five metres off a
      // four-metre walk the canopy closes over it, at eight it is a glade the path runs through.
      avenue(r.canopyTree, plan.points, !!plan.closed, width / 2 + 6.0, 15, 'both', 2.0);
    }
  }
  // Groves off the walks. An avenue alone is a street, not a park: the other half of how a park
  // is planted is a stand of trees set back from the path, close enough to walk into and far
  // enough to be a place rather than a verge. One every fifty-five metres of route, alternating
  // sides, which is what puts trees in the 80-120 m band the round-1 critique measured at 7.8 per
  // hectare — the band a visitor actually spends the day in.
  {
    let sideFlip = 0;
    for (const plan of PATHS) {
      if (plan.form !== 'path' || AVENUE_SKIP.has(plan.id)) continue;
      const pts = plan.points;
      const count = pts.length / 2;
      const last = plan.closed ? count : count - 1;
      let travelled = 0;
      let nextAt = 26;
      for (let i = 0; i < last; i++) {
        const ax = pts[i * 2]!;
        const az = pts[i * 2 + 1]!;
        const bx = pts[((i + 1) % count) * 2]!;
        const bz = pts[((i + 1) % count) * 2 + 1]!;
        const len = Math.hypot(bx - ax, bz - az);
        if (len < 1e-3) continue;
        const ux = (bx - ax) / len;
        const uz = (bz - az) / len;
        while (nextAt <= travelled + len) {
          const t = nextAt - travelled;
          const sign = sideFlip++ % 2 === 0 ? 1 : -1;
          const off = 13 + ctx.rng.next() * 6;
          const cx2 = ax + ux * t - uz * sign * off;
          const cz2 = az + uz * t + ux * sign * off;
          copse(sideFlip % 3 === 0 ? r.conifer : r.canopyTree, cx2, cz2, 11, 7);
          nextAt += 55;
        }
        travelled += len;
      }
    }
  }

  // The two plazas people stand still on get a ring of shade, outside the furniture that is
  // already there. A square with no canopy is a square nobody sits on in July.
  for (const sq of [MARKET_SQUARE, FOUNTAIN_SQUARE]) {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.31;
      const x = sq.x + Math.cos(a) * (sq.radius + 5.5);
      const z = sq.z + Math.sin(a) * (sq.radius + 5.5);
      if (rejectPlanting(ctx.terrain, x, z) || occupied(x, z, 2.8)) continue;
      one(r.canopyTree, x, z);
    }
  }

  // ── The treeline ──────────────────────────────────────────────────────────────────────────
  // A belt of copses walked twice round the rim, alternating species, each one offset in and out
  // of the band so the edge of the park is a wood rather than a hedge. It is authored rather than
  // left to `dress()` because the treeline has a job — hiding where the built park stops — and the
  // ambient scatter spreads its budget evenly over the whole 512 m square: at the density that
  // fills this belt, the flowers eat the instance cap and the ground cover never arrives.
  //
  // Two passes rather than one long one. A single ring of wide copses came back as scattered
  // individual trees from the overview camera; tight copses (eight trees inside fifteen metres,
  // which their own clearance spaces at three to four metres apart) read as woodland, and a second
  // offset pass fills the gaps between them.
  const species = [r.canopyTree, r.conifer, r.streetTree, r.conifer, r.canopyTree, r.conifer];
  const stops = 40;
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < stops; i++) {
      const t = (i + pass * 0.5) / stops;
      const [x, z] = rimPoint(t, ctx.rng);
      copse(species[(i + pass * 3) % species.length], x, z, 15, 8);
    }
  }

  return out;
}

/** A point on the boundary band, walked as a square ring with a little radial wander. */
function rimPoint(t: number, rng: Rng): [number, number] {
  const band = RIM.from + 12 + rng.next() * 30;
  const side = Math.floor(t * 4) % 4;
  const f = t * 4 - Math.floor(t * 4);
  const s = -band + 2 * band * f;
  if (side === 0) return [s, -band];
  if (side === 1) return [band, s];
  if (side === 2) return [-s, band];
  return [-band, -s];
}

/** Unit vector pointing away from the lake, for furniture on the promenade. */
function outward(x: number, z: number): [number, number] {
  const dx = x - LAKE.x;
  const dz = z - LAKE.z;
  const len = Math.hypot(dx, dz) || 1;
  return [dx / len, dz / len];
}

/**
 * Where nothing may be planted: on the paving, in the water, or outside the park.
 *
 * The paint test is what keeps a copse out of the main street — the paths were stamped into the
 * paint layer before this runs, so "is this concrete" is the same question the ambient scatter
 * asks, answered from the same array.
 */
function rejectPlanting(terrain: TerrainData, x: number, z: number): boolean {
  if (chebyshev(x, z) > PARK_HALF - 8) return true;
  if (sampleHeight(terrain, x, z) < WATER_LEVEL + 0.6) return true;
  const layer = samplePaint(terrain, x, z);
  if (layer === LAYER_CONCRETE || layer === LAYER_WOOD) return true;
  // Four probes at four metres: a canopy may lean over a kerb, it may not stand on one.
  for (const [ox, oz] of [
    [4, 0],
    [-4, 0],
    [0, 4],
    [0, -4],
  ]) {
    const l = samplePaint(terrain, x + ox, z + oz);
    if (l === LAYER_CONCRETE || l === LAYER_WOOD) return true;
  }
  return false;
}
