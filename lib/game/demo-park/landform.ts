/**
 * The ground under park.fan Resort: one height pass and one paint pass, both pure.
 *
 * **The order of the height pass is the design.** Rolling land first, then the ridge and the
 * valley that give the park a west side worth walking, then the rim that turns the boundary into
 * a bowl, then the flattens — the street corridor, the three terraces and the seven pads (five
 * reserved plots and two forecourts) — and the lake last of all. Flattens come after the rim
 * because a plot a berm has just tilted is not a plot; the lake comes after the flattens because a
 * basin a pad can fill in is not a lake.
 *
 * **The paint pass is what makes the planting look planted.** `scenery.dress()` weights every
 * species by the terrain paint layer and refuses to grow anything on concrete, so the paint is the
 * only lever this module has over where the ambient scatter goes — and it is a good one: meadow in
 * the developed core (flowers ×1.4, trees ×0.4), grass in the outer band (trees ×1.0), dirt under
 * the woodland edge (undergrowth ×1.0), sand around the waterline, and a
 * concrete corridor under every path so the scatter treats the network as built ground. Without
 * that last one a park comes back with grass tufts standing in the middle of the main street.
 *
 * DOM-free and Babylon-free: this is the copy of the terrain the worker gets too.
 */

import type { Entity, TerrainData } from '../core/types';
import { buildLayout, MESH_SPACING, pathMaterial } from '../paths';
import {
  fbm2,
  LAYER_CONCRETE,
  LAYER_DIRT,
  LAYER_GRASS,
  LAYER_MEADOW,
  LAYER_SAND,
  LAYER_WOOD,
} from '../terrain';
import {
  CORE_RADIUS,
  chebyshev,
  distanceToPolyline,
  LAKE,
  lakeProfile,
  PADS,
  pointInPolygon,
  RIDGE,
  RIM,
  smooth01,
  STREET_BLEND,
  STREET_FROM_Z,
  STREET_HALF_WIDTH,
  STREET_TO_Z,
  streetHeight,
  VALLEY,
  VALLEY_DEPTH,
  VALLEY_FADE,
  VALLEY_HALF,
  WATER_LEVEL,
  WOODLAND_FROM,
  PARK_HALF,
  ENTRANCE_PLAZA,
  MARKET_SQUARE,
  FOUNTAIN_SQUARE,
} from './plan';
import type { Terrace } from './plan';

/** The lowest the land is allowed outside the lake basin, so no stray puddle appears. */
const DRY_FLOOR = WATER_LEVEL + 1.4;

interface Bump {
  x: number;
  z: number;
  r: number;
  h: number;
}

/**
 * Shape the heightfield.
 *
 * `next()` is the demo park's own random stream — the bumps are rolled once, in a fixed order, so
 * the same seed produces the same hills and a save that reloads never re-rolls them (the heights
 * travel in the save; this function runs only when a park is created).
 */
export function sculptDemoTerrain(terrain: TerrainData, seed: number, next: () => number): void {
  const n = terrain.resolution;
  const w = n + 1;
  const half = terrain.size / 2;

  // Low-frequency relief. Eleven bumps, kept out of the middle third of the axis so the main
  // street is a street and not a rollercoaster of its own.
  const bumps: Bump[] = [];
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2 + next() * 0.5;
    const r = 96 + next() * 120;
    bumps.push({
      x: Math.cos(a) * r,
      z: Math.sin(a) * r,
      r: 54 + next() * 92,
      h: 1.6 + next() * 5.4,
    });
  }

  const valley: [number, number][] = VALLEY.map((p) => [p[0], p[1]]);

  for (let j = 0; j < w; j++) {
    for (let i = 0; i < w; i++) {
      const x = -half + (i / n) * terrain.size;
      const z = -half + (j / n) * terrain.size;
      let h = 0.9;

      // 1. rolling land
      for (const b of bumps) {
        const d2 = ((x - b.x) ** 2 + (z - b.z) ** 2) / (b.r * b.r);
        h += b.h * Math.exp(-d2 * 1.5);
      }
      h += (fbm2(x, z, 1 / 150, 4, seed + 17) - 0.5) * 3.4;

      // 2. the wooded ridge behind the coaster shelf
      const dRidge = distanceToPolyline(x, z, [
        [RIDGE.fromX, RIDGE.fromZ],
        [RIDGE.toX, RIDGE.toZ],
      ]);
      h += RIDGE.height * Math.exp(-(dRidge * dRidge) / (2 * RIDGE.sigma * RIDGE.sigma));

      // 3. the valley down the west side
      const dValley = distanceToPolyline(x, z, valley);
      if (dValley < VALLEY_FADE) {
        h -= VALLEY_DEPTH * (1 - smooth01(VALLEY_HALF, VALLEY_FADE, dValley));
      }

      // 4. the rim, with a gap south of the gate
      const rim = smooth01(RIM.from, RIM.to, chebyshev(x, z));
      const gate =
        z > RIM.gateFromZ
          ? 1 - smooth01(RIM.gateHalfWidth, RIM.gateHalfWidth + 26, Math.abs(x))
          : 0;
      const rimNoise = 0.55 + fbm2(x, z, 1 / 210, 3, seed + 401) * 0.9;
      h += rim * RIM.height * rimNoise * (1 - gate);

      if (h < DRY_FLOOR) h = DRY_FLOOR + (h - DRY_FLOOR) * 0.25;

      // 5. the flattens: the axis, then every reserved plot
      const streetK =
        z > STREET_FROM_Z - STREET_BLEND && z < STREET_TO_Z + STREET_BLEND
          ? (1 - smooth01(STREET_HALF_WIDTH, STREET_HALF_WIDTH + STREET_BLEND, Math.abs(x))) *
            (1 - smooth01(STREET_TO_Z, STREET_TO_Z + STREET_BLEND, z)) *
            smooth01(STREET_FROM_Z - STREET_BLEND, STREET_FROM_Z, z)
          : 0;
      if (streetK > 0) h += (streetHeight(z) - h) * streetK;

      for (const terrace of [ENTRANCE_PLAZA, MARKET_SQUARE, FOUNTAIN_SQUARE] as Terrace[]) {
        const d = Math.hypot(x - terrace.x, z - terrace.z);
        // Sixteen metres of blend, not twenty-two: the entrance terrace is 46 m from the point
        // the `ground` camera stands on, and a longer skirt lifted the street under it.
        const k = 1 - smooth01(terrace.radius + 2, terrace.radius + 16, d);
        if (k > 0) h += (terrace.height - h) * k;
      }

      for (const pad of PADS) {
        if (pad.height == null) continue;
        const k = padWeight(pad.x, pad.z, pad.halfX, pad.halfZ, pad.blend, x, z);
        if (k > 0) h += (pad.height - h) * k;
      }

      // 6. the lake, last, so nothing can fill it in
      const dLake = Math.hypot(x - LAKE.x, z - LAKE.z);
      if (dLake < LAKE.fade) {
        const k = 1 - smooth01(LAKE.reach, LAKE.fade, dLake);
        h += (lakeProfile(dLake) - h) * k;
      } else if (h < DRY_FLOOR) {
        h = DRY_FLOOR;
      }

      terrain.heights[j * w + i] = h;
    }
  }
  terrain.waterLevel = WATER_LEVEL;
}

/** 1 inside the pad, falling to 0 over `blend` metres outside it. */
function padWeight(
  cx: number,
  cz: number,
  halfX: number,
  halfZ: number,
  blend: number,
  x: number,
  z: number
): number {
  const dx = Math.abs(x - cx) - halfX;
  const dz = Math.abs(z - cz) - halfZ;
  const d = Math.max(0, Math.max(dx, dz));
  return 1 - smooth01(0, blend, d);
}

/**
 * Write the paint layer.
 *
 * Paths are painted from their own layouts rather than from the control points, so the concrete
 * follows the same Catmull-Rom curve the mesh is built on. `buildLayout` is the paths module's own
 * function; re-implementing the spline here would be two curves that agree until somebody changes
 * one of them.
 */
export function paintDemoTerrain(terrain: TerrainData, seed: number, paths: Entity[]): void {
  const n = terrain.resolution;
  const cell = terrain.size / n;
  const half = terrain.size / 2;
  const paint = terrain.paint;

  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = -half + (i + 0.5) * cell;
      const z = -half + (j + 0.5) * cell;
      paint[j * n + i] = groundLayer(seed, x, z);
    }
  }

  const stamp = (px: number, pz: number, radius: number, layer: number) => {
    const i0 = Math.max(0, Math.floor((px - radius + half) / cell));
    const i1 = Math.min(n - 1, Math.ceil((px + radius + half) / cell));
    const j0 = Math.max(0, Math.floor((pz - radius + half) / cell));
    const j1 = Math.min(n - 1, Math.ceil((pz + radius + half) / cell));
    const r2 = radius * radius;
    for (let j = j0; j <= j1; j++) {
      const cz = -half + (j + 0.5) * cell;
      for (let i = i0; i <= i1; i++) {
        const cx = -half + (i + 0.5) * cell;
        if ((cx - px) ** 2 + (cz - pz) ** 2 <= r2) paint[j * n + i] = layer;
      }
    }
  };

  for (const entity of paths) {
    const layout = buildLayout(entity, MESH_SPACING);
    if (!layout) continue;
    // A boardwalk is timber and the scatter should read it as such; everything else is paving.
    // The rule is the surface recipe's own `pattern`, not the style id — a pack that registers a
    // second plank style gets the same answer with no edit here.
    const layer =
      pathMaterial(layout.style.surface).pattern === 'planks' ? LAYER_WOOD : LAYER_CONCRETE;
    if (layout.form === 'plaza') {
      const ring = layout.ring;
      let minX = Infinity;
      let maxX = -Infinity;
      let minZ = Infinity;
      let maxZ = -Infinity;
      const flat: number[] = [];
      for (const p of ring) {
        flat.push(p.x, p.z);
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.z < minZ) minZ = p.z;
        if (p.z > maxZ) maxZ = p.z;
      }
      const i0 = Math.max(0, Math.floor((minX + half) / cell));
      const i1 = Math.min(n - 1, Math.ceil((maxX + half) / cell));
      const j0 = Math.max(0, Math.floor((minZ + half) / cell));
      const j1 = Math.min(n - 1, Math.ceil((maxZ + half) / cell));
      for (let j = j0; j <= j1; j++) {
        const cz = -half + (j + 0.5) * cell;
        for (let i = i0; i <= i1; i++) {
          const cx = -half + (i + 0.5) * cell;
          if (pointInPolygon(flat, cx, cz)) paint[j * n + i] = layer;
        }
      }
      continue;
    }
    const radius = layout.halfWidth + 1.4;
    for (const st of layout.stations) stamp(st.x, st.z, radius, layer);
  }
}

/**
 * The layer a square metre of open ground gets, before the paths are stamped over it.
 *
 * The point of the bands is the planting rather than the colour: `defaultSpecies` puts flowers on
 * meadow and `woodlandSpecies` weights grass at 1.0 against meadow at 0.4 — so the developed core
 * is meadow and the outer band is grass, and the park comes out with an open middle and a wooded
 * edge without a single per-tree decision.
 *
 * Rock is deliberately NOT painted. The splat material already blends its rock layer by slope
 * between `CLIFF_SLOPE_START` and `CLIFF_SLOPE_FULL`; painting a second, gentler rock rule on top
 * of it put pale grey quarries on every cut slope under a reserved plot, and two rules for one
 * thing is one rule too many.
 */
function groundLayer(seed: number, x: number, z: number): number {
  const norm = chebyshev(x, z);
  // The last few metres of the park are left plain, and it is not a detail. The splat texture is
  // sampled with CLAMP addressing and the 1.5 km apron takes its colour from whatever the edge
  // row of the paint holds, so a dirt patch that touches the boundary is smeared as a stripe from
  // the park edge to the horizon — which is what the first overview shot came back with, a park
  // sitting in a field of ploughed furrows.
  if (norm > PARK_HALF - 8) return LAYER_GRASS;

  // Sand is a beach, not a bathtub: a band either side of the waterline, with the deeper bed left
  // as dirt so a lake bottom reads as a lake bottom. And nothing near the water gets the woodland
  // band's leaf litter, which otherwise draws a brown fringe right along the promenade.
  const dLake = Math.hypot(x - LAKE.x, z - LAKE.z);
  if (dLake < LAKE.shore + 3) return dLake > LAKE.shore - 7 ? LAYER_SAND : LAYER_DIRT;
  if (dLake < LAKE.fade) return LAYER_GRASS;

  // Two scales, and the second one is why. A single low-frequency threshold paints 60-metre
  // patches with long straight isolines, and from the overview camera the park came back looking
  // like ploughed fields; multiplying it by a 26 m field breaks every patch into something the
  // size of a thicket.
  const drift = fbm2(x, z, 1 / 84, 3, seed + 733);
  const fine = fbm2(x, z, 1 / 26, 3, seed + 977);
  if (norm > WOODLAND_FROM) {
    // Woodland floor: mostly grass so the trees come, with leaf litter in the hollows under them.
    return drift > 0.6 && fine > 0.63 ? LAYER_DIRT : LAYER_GRASS;
  }
  if (norm < CORE_RADIUS && drift > 0.46 && fine > 0.42) return LAYER_MEADOW;
  return LAYER_GRASS;
}
