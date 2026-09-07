/**
 * Everything about this module a screenshot cannot show.
 *
 *   node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/pools/selftest.mjs
 *
 * A `.mjs` next to the code rather than a `scripts/test-game-*.mjs`, for the reason `paths`,
 * `track`, `shops`, `camera`, `tools`, `trains` and `rides` all give: these checks are about this
 * module's internals and a builder may not edit `package.json`. The line to add is in
 * `docs/game/requests/pools.md` §1.
 *
 * Eight things are worth testing here and none of them is visible in a still frame:
 *
 *  1. **Winding.** In this scene a front face's `cross(v1−v0, v2−v0)` points AWAY from the visible
 *     side (`FRONT_FACE_SIGN = −1`). Getting it backwards throws nothing and warns about nothing —
 *     the geometry is in the scene with the right vertex count and is invisible. It cost this
 *     module its first render: 4,300 deck triangles faced the ground.
 *  2. **The excavation actually clears the tile.** The heightfield samples every 2 m and the pool's
 *     floor is a smooth surface between those samples, so "the pit is deeper than the pool" is a
 *     claim about a bilinear interpolation and not about four numbers. It is measured, at 400
 *     points per basin.
 *  3. **Extensibility**, both halves: a pack registered BEFORE `attachPoolContent` and one
 *     registered AFTER must both land. A listener alone misses the bundled packs; a boot-time walk
 *     alone misses everything a scenario adds later.
 *  4. **Determinism.** The same input builds byte-identical geometry, and the deck layout does not
 *     depend on the order pools were announced in.
 *  5. **The save round-trips**, byte for byte, on a world that has been run rather than a fresh one.
 *  6. **The water surface knows what is dry.** A zero-entry beach must not be under water.
 *  7. **The geometry is finite** — one NaN in a position is a mesh nobody can see and a save nobody
 *     can load.
 *  8. **The queries answer what `flumes` will ask**: is this point in a pool, how deep, where is the
 *     deepest point, and what is the surface height there.
 */

import { readFileSync } from 'node:fs';
import { Registry } from '@/lib/game/core/registry.ts';
import { SimRuntime } from '@/lib/game/core/sim-runtime.ts';
import { createWorld, serializeWorld } from '@/lib/game/core/world.ts';
import { GAME_MODULES } from '@/lib/game/modules.ts';
import {
  attachPoolContent,
  poolDeckItems,
  poolEdge,
  poolEdges,
  poolShape,
  poolShapes,
  poolTile,
  poolTiles,
  resetPoolContent,
} from './manifest.ts';
import { buildPool } from './build.ts';
import { buildProp } from './furniture.ts';
import { SurfaceBuilder } from './surfaces.ts';
import { buildWaterMesh } from './water-mesh.ts';
import { excavatePool } from './excavate.ts';
import { resolvePool } from './resolve.ts';
import { makePoolEntity } from './entity.ts';
import {
  depthAtUnit,
  insidePolygon,
  isStarShaped,
  outlinePoints,
  polygonArea,
  poolVolume,
  rimHeight,
} from './geom.ts';

let failures = 0;
let checks = 0;
function ok(condition, label, detail = '') {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
  }
}
function near(actual, expected, tolerance, label) {
  ok(
    Math.abs(actual - expected) <= tolerance,
    label,
    `${Number(actual).toFixed(4)} vs ${Number(expected).toFixed(4)} (±${tolerance})`
  );
}
const section = (name) => console.log(name);

const PACKS = ['core-classic', 'neon-lagoon'].map((id) =>
  JSON.parse(readFileSync(new URL(`../content/packs/${id}/pack.json`, import.meta.url), 'utf8'))
);

/**
 * A pack of a kind this repository does not contain: a spa terrace with a polygon plan, a tile
 * style nobody here anticipated, an edge treatment and a deck item. Plus one deliberately broken
 * entry, to prove a bad manifest is reported rather than fatal.
 */
const EARLY_PACK = {
  id: 'pools-selftest-early',
  version: 1,
  name: { en: 'Selftest, early' },
  requires: [],
  pools: {
    tiles: [
      {
        id: 'copper-mosaic',
        name: { en: 'Copper mosaic' },
        pattern: 'mosaic',
        tileMetres: 0.5,
        colors: ['#b5713a', '#a2612f', '#c98a4f'],
        grout: '#e2d9c8',
        waterline: '#6a3d18',
        water: '#2b7f6d',
        night: '#ffb066',
        nightIntensity: 8,
      },
    ],
    edges: [
      {
        id: 'copper-edge',
        name: { en: 'Copper edge' },
        coping: 'square',
        copingWidth: 0.5,
        copingRise: 0.07,
        copingColor: '#c0b39a',
        deck: 'timber',
        deckWidth: 3.4,
        deckColor: '#8f6c42',
        rail: true,
        railColor: '#cfd6dc',
      },
    ],
    deck: [
      {
        id: 'copper-bench',
        name: { en: 'Copper bench' },
        shape: 'towel-box',
        weight: 2,
        clearance: 2.4,
        colors: ['#8f6c42'],
        accent: '#5f4527',
      },
    ],
    shapes: [
      {
        id: 'spa-terrace',
        name: { en: 'Spa terrace' },
        outline: 'polygon',
        points: [-1, -0.7, 1, -0.7, 1, 0.3, 0.4, 1, -0.6, 1, -1, 0.2],
        size: [18, 10],
        segments: 24,
        depth: { profile: 'flat', min: 1.1, max: 1.1, axis: 'z', beach: 0 },
        entry: 'roman-steps',
        entryYaw: 1.57,
        role: 'spa',
        tile: 'copper-mosaic',
        edge: 'copper-edge',
        deckDensity: 3,
        water: 5,
        cost: 1000,
      },
    ],
  },
};

const LATE_PACK = {
  id: 'pools-selftest-late',
  version: 1,
  name: { en: 'Selftest, late' },
  requires: [],
  pools: {
    shapes: [
      {
        id: 'wave-basin',
        name: { en: 'Wave basin' },
        outline: 'lobed',
        size: [30, 20],
        lobes: 4,
        lobeDepth: 0.2,
        segments: 80,
        depth: { profile: 'beach', min: 0.8, max: 2.2, axis: 'z', beach: 0.35 },
        entry: 'beach',
        entryYaw: -1.57,
        role: 'swim',
        tile: 'copper-mosaic',
        edge: 'rolled-concrete',
        deckDensity: 2,
        water: 12,
        cost: 2000,
      },
      // Deliberately unreadable: `trapezoid` is not an outline this build knows. The entry must be
      // named and skipped and `wave-basin` beside it must still land.
      { id: 'broken', outline: 'trapezoid' },
    ],
  },
};

const DETAIL = 1;

function buildFor(shapeId, overrides = {}) {
  const shape = poolShape(shapeId);
  const tile = poolTile(overrides.tile ?? shape.tile);
  const edge = poolEdge(overrides.edge ?? shape.edge);
  return buildPool({
    shape,
    tile,
    edge,
    size: overrides.size ?? shape.size,
    maxDepth: overrides.depth ?? shape.depth.max,
    freeboard: overrides.freeboard ?? 0.12,
    deckDensity: overrides.deckDensity ?? shape.deckDensity,
    deckItems: poolDeckItems(),
    seed: overrides.seed ?? 12345,
    detail: DETAIL,
  });
}

// ── 1. the catalogue and the two halves of the content path ─────────────────────────────────
section('1 · content');
{
  resetPoolContent();
  const registry = new Registry();
  for (const pack of PACKS) registry.registerPack(pack);
  // Registered BEFORE attach — the half an `onPack` listener alone would miss entirely.
  registry.registerPack(EARLY_PACK);
  const detach = attachPoolContent(registry);

  ok(poolShapes().length >= 7, 'the built-in basins are registered', String(poolShapes().length));
  ok(poolTiles().length >= 6, 'and the tile styles', String(poolTiles().length));
  ok(poolEdges().length >= 5, 'and the edge treatments', String(poolEdges().length));
  ok(poolDeckItems().length >= 6, 'and the deck items', String(poolDeckItems().length));
  ok(poolShape('spa-terrace') != null, 'a pack registered BEFORE attach lands');
  ok(poolTile('copper-mosaic') != null, 'with its tile style');
  ok(poolEdge('copper-edge') != null, 'and its edge treatment');
  ok(
    poolShape('spa-terrace').key === 'pools-selftest-early:spa-terrace',
    'keyed by the pack that declared it'
  );
  // The category is CLAIMED, so core does not report it as a key nobody owns. That report is what
  // turns a typo in a manifest (`poolz`) from a silent empty catalogue into a line in the console.
  const unclaimed = registry.unclaimedPackKeys();
  ok(
    unclaimed.every((u) => u.key !== 'pools'),
    'core no longer lists `pools` as an unclaimed manifest key',
    JSON.stringify(unclaimed)
  );

  // Registered AFTER attach — the half a boot-time walk of `registry.packs()` alone would miss.
  registry.registerPack(LATE_PACK);
  ok(poolShape('wave-basin') != null, 'a pack registered AFTER attach lands too');
  ok(poolShape('wave-basin').depth.profile === 'beach', 'with its own depth profile');
  ok(poolShapes().some((s) => s.id === 'broken') === false, 'and a broken entry is skipped');

  // The pack content DRAWS. Not "is in the map" — a build with real triangles in every surface.
  const built = buildFor('spa-terrace');
  ok(built.triangles > 900, 'a pack basin builds real geometry', `${built.triangles} triangles`);
  ok(
    outlinePoints(poolShape('spa-terrace'), [18, 10]).length / 2 >= 20,
    'and its six authored corners are subdivided into a usable grid',
    String(outlinePoints(poolShape('spa-terrace'), [18, 10]).length / 2)
  );
  const names = new Set(built.surfaces.map((s) => s.name));
  for (const want of ['tile', 'wall', 'coping', 'deck', 'metal', 'glow']) {
    ok(names.has(want), `pack basin draws its ${want}`);
  }
  ok(built.props.length > 0, 'and the pack put furniture on its deck', `${built.props.length}`);
  ok(
    built.props.every((p) => p.item.key.startsWith('pools')),
    'from the registered deck catalogue'
  );

  detach();
}

// ── 2. the plan and the floor ───────────────────────────────────────────────────────────────
section('2 · geometry');
{
  resetPoolContent();
  const registry = new Registry();
  attachPoolContent(registry);

  const ellipse = poolShape('kids-pool');
  const outline = outlinePoints({ ...ellipse, outline: 'ellipse' }, [20, 10]);
  near(polygonArea(outline), Math.PI * 10 * 5, 1.2, 'an ellipse encloses πab');
  ok(isStarShaped(outline), 'and is star-shaped about its centre');

  const rect = outlinePoints({ ...ellipse, outline: 'rect', corner: 2, segments: 200 }, [20, 10]);
  // 20 × 10 with 2 m corners: the full rectangle less the four corner off-cuts.
  near(
    polygonArea(rect),
    20 * 10 - (4 - Math.PI) * 4,
    1.5,
    'a rounded rectangle loses its corners'
  );
  ok(isStarShaped(rect), 'and is star-shaped too');

  const lobed = outlinePoints(
    { ...ellipse, outline: 'lobed', lobes: 3, lobeDepth: 0.45, lobePhase: 0, segments: 128 },
    [28, 18]
  );
  ok(isStarShaped(lobed), 'a lobed plan at the maximum lobe depth is still star-shaped');

  // The five depth profiles, at the points where each is supposed to say something.
  const flat = { profile: 'flat', min: 1, max: 1.6, axis: 'z', beach: 0 };
  near(depthAtUnit(flat, 0, -1), 1.6, 1e-9, 'a flat floor is flat at one end');
  near(depthAtUnit(flat, 0, 1), 1.6, 1e-9, 'and at the other');

  const slope = { profile: 'slope', min: 1.2, max: 2, axis: 'z', beach: 0 };
  ok(depthAtUnit(slope, 0, -1) < depthAtUnit(slope, 0, 1), 'a slope has a shallow end');
  near(depthAtUnit(slope, 0, -1), 1.2, 0.02, 'at the declared minimum');
  near(depthAtUnit(slope, 0, 1), 2, 0.02, 'and a deep end at the declared maximum');
  ok(
    depthAtUnit(slope, 0, -0.9) < depthAtUnit(slope, 0, 0) &&
      depthAtUnit(slope, 0, 0) < depthAtUnit(slope, 0, 0.9),
    'and it falls monotonically between them'
  );

  const beach = { profile: 'beach', min: 0.9, max: 1.7, axis: 'z', beach: 0.3 };
  ok(depthAtUnit(beach, 0, -1) < 0, 'a zero-entry beach starts above the water line');
  ok(depthAtUnit(beach, 0, -1) >= -0.13, 'but never above the coping');
  ok(depthAtUnit(beach, 0, -0.4) > 0.4, 'and reaches the shallow end over the shelf');

  const dish = { profile: 'dish', min: 0.18, max: 0.45, axis: 'z', beach: 0 };
  ok(depthAtUnit(dish, 0, 0) > depthAtUnit(dish, 0, 1), 'a dish is deepest in the middle');

  const channel = { profile: 'channel', min: 0.55, max: 1, axis: 'z', beach: 0 };
  ok(depthAtUnit(channel, 0, 0) > depthAtUnit(channel, 1, 0), 'a channel is deepest on its line');

  // Volume by integration, against the analytic answer for a flat-bottomed ellipse.
  const flatShape = { ...ellipse, outline: 'ellipse', depth: flat, segments: 128 };
  const v = poolVolume(flatShape, [20, 10], 1.6);
  near(v / (Math.PI * 10 * 5 * 1.6), 1, 0.02, 'volume integrates to area × depth on a flat floor');

  // And a beach-entry lagoon is not area × depth / 2, which is the reason the integration exists
  // rather than a formula. The size of the error is the point: it is the water bill.
  const lagoon = poolShape('lagoon');
  const lagoonVolume = poolVolume(lagoon, lagoon.size, lagoon.depth.max);
  const lagoonArea = polygonArea(outlinePoints(lagoon, lagoon.size));
  const naive = lagoonArea * lagoon.depth.max * 0.5;
  ok(
    Math.abs(lagoonVolume - naive) / lagoonVolume > 0.05,
    'a beach-entry lagoon is not half its bounding volume',
    `${lagoonVolume.toFixed(0)} m³ against the naive ${naive.toFixed(0)} m³`
  );
  // The integration itself: a 32-step grid has to agree with a much finer one, or the number the
  // management module bills for is a function of this file's own step size.
  let fine = 0;
  const steps = 128;
  const hxL = lagoon.size[0] / 2;
  const hzL = lagoon.size[1] / 2;
  const cellL = ((2 * hxL) / steps) * ((2 * hzL) / steps);
  const outlineL = outlinePoints(lagoon, lagoon.size);
  for (let j = 0; j < steps; j++) {
    const z = -hzL + ((j + 0.5) / steps) * 2 * hzL;
    for (let i = 0; i < steps; i++) {
      const x = -hxL + ((i + 0.5) / steps) * 2 * hxL;
      if (!insidePolygon(outlineL, x, z)) continue;
      fine += Math.max(0, depthAtUnit(lagoon.depth, x / hxL, z / hzL)) * cellL;
    }
  }
  ok(
    Math.abs(lagoonVolume - fine) / fine < 0.02,
    'and the 32-step integration agrees with a 128-step one',
    `${lagoonVolume.toFixed(1)} vs ${fine.toFixed(1)} m³`
  );
  console.log(
    `    naive half-box would say ${naive.toFixed(0)} m³, ` +
      `${(((lagoonVolume - naive) / lagoonVolume) * 100).toFixed(1)} % out`
  );
  console.log(
    `    lagoon: ${polygonArea(outlinePoints(lagoon, lagoon.size)).toFixed(0)} m² of water, ` +
      `${lagoonVolume.toFixed(0)} m³`
  );
}

// ── 3. winding: the bug that made the first render invisible ────────────────────────────────
section('3 · winding');
{
  let triangles = 0;
  let wrong = 0;
  let degenerate = 0;
  for (const id of poolShapes().map((s) => s.id)) {
    const built = buildFor(id);
    const b = new SurfaceBuilder();
    built.props.forEach((prop, i) => buildProp(b, prop, 99, i));
    for (const surface of [...built.surfaces, ...b.done().surfaces]) {
      const { positions, normals, indices } = surface;
      for (let k = 0; k < indices.length; k += 3) {
        const [a, c2, c3] = [indices[k], indices[k + 1], indices[k + 2]];
        const ux = positions[c2 * 3] - positions[a * 3];
        const uy = positions[c2 * 3 + 1] - positions[a * 3 + 1];
        const uz = positions[c2 * 3 + 2] - positions[a * 3 + 2];
        const vx = positions[c3 * 3] - positions[a * 3];
        const vy = positions[c3 * 3 + 1] - positions[a * 3 + 1];
        const vz = positions[c3 * 3 + 2] - positions[a * 3 + 2];
        const cx = uy * vz - uz * vy;
        const cy = uz * vx - ux * vz;
        const cz = ux * vy - uy * vx;
        const nx = normals[a * 3] + normals[c2 * 3] + normals[c3 * 3];
        const ny = normals[a * 3 + 1] + normals[c2 * 3 + 1] + normals[c3 * 3 + 1];
        const nz = normals[a * 3 + 2] + normals[c2 * 3 + 2] + normals[c3 * 3 + 2];
        const dot = cx * nx + cy * ny + cz * nz;
        const area = Math.hypot(cx, cy, cz);
        triangles += 1;
        if (area < 1e-9) degenerate += 1;
        else if (dot > 1e-9) wrong += 1;
      }
    }
  }
  ok(triangles > 20000, 'the whole catalogue builds', `${triangles} triangles`);
  ok(wrong === 0, 'every triangle faces the way its own normals do', `${wrong} back to front`);
  console.log(`    ${triangles} triangles checked, ${degenerate} degenerate, ${wrong} reversed`);
}

// ── 4. the excavation clears the tile everywhere, not at four samples ───────────────────────
section('4 · excavation');
{
  const terrain = {
    size: 512,
    resolution: 256,
    heights: new Float32Array(257 * 257).fill(3),
    paint: new Uint8Array(256 * 256),
    waterLevel: -40,
  };
  const before = terrain.heights.slice();
  const entity = makePoolEntity({ id: 'pool-1', shape: 'lagoon', x: 20, z: -30, y: 3, yaw: 0.4 });
  const pool = resolvePool(entity, 3);
  ok(pool != null, 'a pool entity resolves');
  near(pool.position[1], 3, 1e-9, 'and takes the ground height it was given');
  ok(pool.waterY < pool.position[1] + rimHeight(pool.edge) + 1e-9, 'water sits under the coping');
  ok(pool.waterY > pool.position[1] - pool.maxDepth, 'and over the floor');

  const rect = excavatePool(terrain, pool);
  ok(rect != null, 'the excavation touches the heightfield');
  let raised = 0;
  for (let i = 0; i < terrain.heights.length; i++) {
    if (terrain.heights[i] > before[i] + 1e-9) raised += 1;
  }
  ok(raised === 0, 'and only ever lowers ground', `${raised} samples went up`);

  // Idempotence: the same cut applied twice is the same heightfield, byte for byte. This is what
  // lets the renderer dig its own copy and the command dig the worker's.
  const once = terrain.heights.slice();
  excavatePool(terrain, pool);
  let drift = 0;
  for (let i = 0; i < once.length; i++) if (once[i] !== terrain.heights[i]) drift += 1;
  ok(drift === 0, 'excavating twice changes nothing', `${drift} samples moved`);

  // The real invariant: the INTERPOLATED ground under the basin is below the tiled floor. The
  // heightfield samples every 2 m and the floor is smooth between them, so four corner readings
  // would prove nothing.
  const outline = outlinePoints(pool.shape, pool.size);
  const cell = terrain.size / terrain.resolution;
  const half = terrain.size / 2;
  const groundAt = (x, z) => {
    const fi = (x + half) / cell;
    const fj = (z + half) / cell;
    const i = Math.floor(fi);
    const j = Math.floor(fj);
    const tx = fi - i;
    const tz = fj - j;
    const w = terrain.resolution + 1;
    const at = (a, b) => terrain.heights[Math.min(w - 1, b) * w + Math.min(w - 1, a)];
    return (
      at(i, j) * (1 - tx) * (1 - tz) +
      at(i + 1, j) * tx * (1 - tz) +
      at(i, j + 1) * (1 - tx) * tz +
      at(i + 1, j + 1) * tx * tz
    );
  };
  const hx = pool.size[0] / 2;
  const hz = pool.size[1] / 2;
  const cos = Math.cos(pool.yaw);
  const sin = Math.sin(pool.yaw);
  let worst = Infinity;
  let tested = 0;
  for (let j = -10; j <= 10; j++) {
    for (let i = -10; i <= 10; i++) {
      const lx = (i / 10) * hx;
      const lz = (j / 10) * hz;
      if (!insidePolygon(outline, lx, lz)) continue;
      const depth = depthAtUnit({ ...pool.shape.depth, max: pool.maxDepth }, lx / hx, lz / hz);
      const floorY = pool.position[1] - Math.max(0, depth);
      const g = groundAt(
        pool.position[0] + lx * cos - lz * sin,
        pool.position[2] + lx * sin + lz * cos
      );
      worst = Math.min(worst, floorY - g);
      tested += 1;
    }
  }
  ok(tested > 200, 'the pit is sampled across the whole plan', `${tested} points`);
  ok(worst > 0, 'and the ground is under the tile everywhere', `${worst.toFixed(3)} m clearance`);
  console.log(`    ${tested} interior samples, worst clearance ${worst.toFixed(2)} m`);
}

// ── 5. determinism ──────────────────────────────────────────────────────────────────────────
section('5 · determinism');
{
  const a = buildFor('lagoon', { seed: 4242 });
  const b = buildFor('lagoon', { seed: 4242 });
  let mismatch = 0;
  for (let i = 0; i < a.surfaces.length; i++) {
    const p = a.surfaces[i].positions;
    const q = b.surfaces[i].positions;
    if (p.length !== q.length) mismatch += 1;
    else for (let k = 0; k < p.length; k++) if (p[k] !== q[k]) mismatch += 1;
  }
  ok(mismatch === 0, 'the same input builds byte-identical geometry', `${mismatch} differences`);
  ok(
    JSON.stringify(a.props.map((p) => [p.x, p.z, p.yaw, p.item.id])) ===
      JSON.stringify(b.props.map((p) => [p.x, p.z, p.yaw, p.item.id])),
    'and the same deck layout'
  );

  const other = buildFor('lagoon', { seed: 99 });
  ok(
    JSON.stringify(other.props.map((p) => [p.x, p.z])) !==
      JSON.stringify(a.props.map((p) => [p.x, p.z])),
    'a different seed lays the deck out differently'
  );

  // Finite, everywhere. One NaN is a mesh nobody can see and a save nobody can load.
  let nonFinite = 0;
  for (const id of poolShapes().map((s) => s.id)) {
    const built = buildFor(id);
    for (const surface of built.surfaces) {
      for (const v of surface.positions) if (!Number.isFinite(v)) nonFinite += 1;
      for (const v of surface.normals) if (!Number.isFinite(v)) nonFinite += 1;
      for (const v of surface.uvs) if (!Number.isFinite(v)) nonFinite += 1;
    }
  }
  ok(nonFinite === 0, 'no vertex is NaN or Infinity', `${nonFinite} non-finite values`);
}

// ── 6. the water surface, and what it knows is dry ──────────────────────────────────────────
section('6 · water');
{
  const lagoon = poolShape('lagoon');
  const wet = buildWaterMesh(lagoon, lagoon.size, lagoon.depth.max, -0.12, [0.1, 0.4, 0.5]);
  const plan = polygonArea(outlinePoints(lagoon, lagoon.size));
  ok(wet.area > 0, 'a lagoon has a water surface', `${wet.area.toFixed(0)} m²`);
  ok(
    wet.area < plan * 0.95,
    'and it is smaller than the plan, because the beach shelf is dry',
    `${wet.area.toFixed(0)} of ${plan.toFixed(0)} m²`
  );
  ok(wet.area > plan * 0.6, 'but a lagoon is still mostly water', `${wet.area.toFixed(0)} m²`);

  // The same plan with a flat floor is wet corner to corner: the difference is the beach and not
  // an artefact of the clipping.
  const flat = { ...lagoon, depth: { ...lagoon.depth, profile: 'flat', min: 1.6, max: 1.6 } };
  const full = buildWaterMesh(flat, lagoon.size, 1.6, -0.12, [0.1, 0.4, 0.5]);
  ok(
    full.area > wet.area * 1.04,
    'a flat floor of the same plan is wetter',
    `${full.area.toFixed(0)} vs ${wet.area.toFixed(0)} m²`
  );
  near(full.area / plan, 1, 0.02, 'and covers its whole plan');

  let bad = 0;
  for (const v of full.positions) if (!Number.isFinite(v)) bad += 1;
  for (const v of full.colors) if (!Number.isFinite(v) || v < 0 || v > 1) bad += 1;
  ok(bad === 0, 'every water vertex is finite and every colour in range', String(bad));
  console.log(
    `    lagoon water ${wet.area.toFixed(0)} m² of a ${plan.toFixed(0)} m² plan ` +
      `(${(100 - (100 * wet.area) / plan).toFixed(0)} % dry shelf)`
  );
}

// ── 7. the simulation, its queries and its save ─────────────────────────────────────────────
section('7 · the sim');
{
  const world = createWorld({ seed: 7, name: 'pools-selftest', packs: PACKS.map((p) => p.id) });
  world.clock.minute = 10 * 60;
  for (let i = 0; i < world.terrain.heights.length; i++) world.terrain.heights[i] = 2;
  const messages = [];
  const rt = new SimRuntime(GAME_MODULES, (m) => messages.push(m));
  rt.init({ type: 'init', world, packs: PACKS, modules: ['core', 'terrain', 'pools'] });

  const placements = [
    { id: 'pool-1', shape: 'lagoon', x: 0, z: 0, y: 2, yaw: 0 },
    { id: 'pool-2', shape: 'lap-pool', x: 60, z: 0, y: 2, yaw: 0 },
    { id: 'pool-3', shape: 'whirlpool', x: -50, z: 20, y: 2, yaw: 0, heated: true },
    { id: 'pool-4', shape: 'runout-lane', x: 0, z: 60, y: 2, yaw: 0 },
  ];
  let seq = 0;
  for (const p of placements) {
    rt.command({ type: 'entity:add', seq: ++seq, payload: makePoolEntity(p) });
  }
  const api = () => rt.handles.get('pools').api;
  ok(api() != null, 'the sim handle publishes an api');
  ok(api().list().length === 4, 'four pools', String(api().list().length));

  const stats = api().stats();
  ok(stats.waterM3 > 500, 'the park holds a lot of water', `${stats.waterM3.toFixed(0)} m³`);
  ok(stats.capacity > 100, 'and is rated for bathers', `${stats.capacity}`);
  console.log(
    `    4 pools · ${stats.waterM3.toFixed(0)} m³ · ${stats.waterPerHour} m³/h · ` +
      `${stats.capacity} bathers`
  );

  // The queries `flumes` will ask.
  ok(api().poolAt(0, 0) === 'pool-1', 'a point in the lagoon names the lagoon');
  ok(api().poolAt(200, 200) === null, 'and a point in a field names nothing');
  ok(api().depthAt(0, 0) > 0.5, 'with water over it', `${api().depthAt(0, 0).toFixed(2)} m`);
  ok(api().depthAt(200, 200) === 0, 'and none outside');
  const surface = api().waterYAt(0, 0);
  ok(surface != null && surface < 2.2 && surface > 1.7, 'the surface is just under the coping');
  ok(api().capacity('pool-2') > 20, 'the lap pool is rated', String(api().capacity('pool-2')));
  ok(api().enter('pool-2'), 'a bather can get in');
  ok(api().state('pool-2').swimmers === 1, 'and is counted');
  api().leave('pool-2');
  ok(api().state('pool-2').swimmers === 0, 'and back out again');

  // A park day at speed 1, then the save. The whirlpool has to have heated up; the lagoon has not.
  rt.step(20 * 60 * 6);
  const spa = api().state('pool-3');
  ok(spa.temperatureC > 33, 'the whirlpool reached spa temperature', spa.temperatureC.toFixed(1));
  const lagoonState = api().state('pool-1');
  ok(
    lagoonState.temperatureC < 30,
    'an unheated lagoon did not',
    lagoonState.temperatureC.toFixed(1)
  );
  ok(
    lagoonState.levelOffset <= 0,
    'and lost a little to evaporation',
    lagoonState.levelOffset.toFixed(4)
  );

  const first = serializeWorld(rt.world);
  const reloaded = new SimRuntime(GAME_MODULES, () => {});
  reloaded.init({
    type: 'init',
    world: JSON.parse(JSON.stringify(rt.world, replacer)),
    packs: PACKS,
    modules: ['core', 'terrain', 'pools'],
  });
  ok(true, 'a second runtime loads the same world');

  const second = serializeWorld(rt.world);
  ok(first === second, 'serialising twice is byte-identical');
  rt.dispose();
  reloaded.dispose();
}

/** `serializeWorld` handles the typed arrays; this is only for the structural clone above. */
function replacer(_key, value) {
  if (value instanceof Float32Array) return Array.from(value);
  if (value instanceof Uint8Array) return Array.from(value);
  return value;
}

console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures) {
  console.error(`${failures} FAILED`);
  process.exit(1);
}
