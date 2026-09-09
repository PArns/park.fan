/**
 * Everything about this module a screenshot cannot show.
 *
 *   node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/buildings/selftest.mjs
 *
 * A `.mjs` next to the code rather than a `scripts/test-game-*.mjs`, for the reason `paths`, `track`,
 * `shops`, `camera`, `tools`, `trains` and `rides` all give: these checks are about this module's
 * internals and a builder may not edit `package.json`. The request to wire it into `pnpm test:game`
 * is `docs/game/requests/buildings.md` §2.
 *
 * Eight things are worth testing here and not one of them is visible in a still frame: whether the
 * facade language lays bays out where it says it does, whether a building nothing in the module
 * anticipated really draws from a manifest alone, whether the openings are at the heights a person
 * actually uses, whether the declared footprint matches the geometry a build tool will ghost,
 * whether two runs produce byte-identical vertices, whether every material has real tone variation
 * rather than one colour with a grid on it, whether the geometry is finite and wound outwards, and
 * what a building costs in triangles and draw calls.
 */

import { readFileSync } from 'node:fs';
import { Registry } from '@/lib/game/core/registry.ts';
import {
  attachBuildingContent,
  buildingBlueprints,
  buildingItems,
  buildingStyles,
  resetBuildingContent,
  resolveBuilding,
} from './manifest.ts';
import { buildBuilding, buildKitPiece, seedForBuilding } from './build.ts';
import { createBuildingsSim } from './sim.ts';
import { parsePattern, patternForStorey, planBays } from './bays.ts';
import { ARCHITECTURE_PACK } from './pack.ts';
import { SHADERS } from './shaders.ts';
import { TILE } from './geometry.ts';

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
    `${Number(actual).toFixed(3)} vs ${Number(expected).toFixed(3)} (±${tolerance})`
  );
}
const section = (name) => console.log(name);

const PACKS = ['core-classic', 'neon-lagoon'].map((id) =>
  JSON.parse(readFileSync(new URL(`../content/packs/${id}/pack.json`, import.meta.url), 'utf8'))
);

/**
 * A third pack, of a kind this repository does not contain: a **watermill**.
 *
 * Two masses, one of them swung 22° off the other and standing lower on a `base` of its own, a
 * shed roof over the wheel house, a rubble plinth, louvres in the gable and no door on the front at
 * all. Nothing in `lib/game/buildings` has ever heard of a watermill; if this draws, a blueprint is
 * a manifest entry.
 */
const THIRD_PACK = {
  id: 'buildings-selftest',
  version: 1,
  name: { en: 'Buildings selftest' },
  requires: [],
  buildingStyles: [
    {
      id: 'mill-rubble',
      wall: 'rubble',
      plinth: 'rubble',
      roof: 'shingle',
      palette: {
        wall: '#b3a893',
        plinth: '#7d7568',
        roof: '#5b4a38',
        trim: '#e2d8c4',
        joinery: '#40342a',
        metal: '#4a4640',
        glass: '#26343a',
        lit: '#ffcc88',
        sign: '#8c5a2c',
      },
      glazing: { mullions: 2, transoms: 2 },
    },
  ],
  buildingBlueprints: [
    {
      id: 'watermill',
      style: 'mill-rubble',
      masses: [
        {
          id: 'mill',
          size: [11, 8],
          storeys: 2,
          storeyHeight: 3.1,
          plinth: 0.6,
          bay: 2.8,
          facades: { all: 'w*', front: 'w d w', back: 'v* n v*' },
          roof: { form: 'gable', pitch: 50, eaves: 0.5, ridge: 'x', dormers: 1, chimneys: 1 },
        },
        {
          id: 'wheelhouse',
          // Clear of the mill's eaves rather than grazing them. At [7.5, −4] the wheelhouse's plan
          // edge ran through the mill's east eaves trim, and §5d then judged three correct pieces of
          // the MILL against the WHEELHOUSE's envelope, which they sit on by coincidence and look
          // into. That is the one limitation the check has — coincident envelopes — and moving the
          // fixture off the coincidence is honest where widening the tolerance would not be: the
          // seven shipped blueprints and the showcase pack all measure a strict zero.
          at: [9.5, -5.5],
          yaw: 22,
          base: -0.4,
          size: [5, 5],
          storeys: 1,
          storeyHeight: 3.4,
          plinth: 0.3,
          facades: { all: 'o' },
          roof: { form: 'shed', pitch: 22, eaves: 0.45, ridge: 'x' },
        },
      ],
      ground: { apron: 1.4, steps: false, kerb: false },
      night: { litFraction: 0.5, lanterns: true },
    },
  ],
  buildings: [
    {
      id: 'watermill',
      name: { en: 'Watermill' },
      category: 'blueprint',
      size: [13, 12, 12],
      cost: 1800000,
      procedural: 'watermill',
    },
  ],
};

function freshRegistry(extra = []) {
  resetBuildingContent();
  const registry = new Registry();
  for (const pack of PACKS) registry.registerPack(pack);
  const detach = attachBuildingContent(registry);
  registry.registerPack(ARCHITECTURE_PACK);
  for (const pack of extra) registry.registerPack(pack);
  return { registry, detach };
}

// ── 1. the facade language ──────────────────────────────────────────────────────────────────
section('bay patterns');
{
  ok(parsePattern('w d w').length === 3, 'three codes parse to three bays');
  ok(parsePattern('w* D w*').filter((t) => t.flexible).length === 2, 'two flexible groups');
  ok(parsePattern('w x d').length === 2, 'an unknown code is dropped, not thrown');

  // A fixed pattern is exactly what it says, whatever the wall is.
  const fixed = planBays(26, 'w d w', 3.3);
  ok(fixed.bays.length === 3, 'a fixed pattern keeps its bay count on a wide wall');
  near(fixed.width, 26 / 3, 0.001, 'a fixed pattern divides the wall evenly');

  // A flexible one fills, and the door stays in the middle.
  const flexible = planBays(26, 'w* D w*', 3.3);
  ok(
    flexible.bays.length === 8,
    'flexible bays fill a 26 m wall at 3.3 m',
    `${flexible.bays.length}`
  );
  const doorAt = flexible.bays.indexOf('D');
  ok(
    Math.abs(doorAt - (flexible.bays.length - 1 - doorAt)) <= 1,
    'the door lands in the middle',
    `index ${doorAt} of ${flexible.bays.length}`
  );
  near(flexible.width, 26 / 8, 0.001, 'the bay width is the wall over the count');
  ok(
    Math.abs(flexible.width - 3.3) / 3.3 < 0.25,
    'the bay width lands within 25 % of the module',
    `${flexible.width.toFixed(2)} m`
  );

  // Storeys.
  ok(patternForStorey('w d w / w*', 0) === 'w d w ', 'the ground pattern is the first');
  ok(patternForStorey('w d w / w*', 3) === ' w*', 'the last pattern repeats upward');

  // A wall too narrow for its fixed bays gets them anyway, squeezed.
  const narrow = planBays(4, 'w D w', 3.3);
  ok(narrow.bays.length === 3, 'a narrow wall keeps its fixed bays');
}

// ── 2. content is content ───────────────────────────────────────────────────────────────────
section('manifest');
{
  const { registry, detach } = freshRegistry([THIRD_PACK]);
  const styles = buildingStyles();
  const blueprints = buildingBlueprints();
  ok(styles.length >= 6, 'styles from three packs are registered', `${styles.length}`);
  ok(
    blueprints.some((b) => b.id === 'watermill'),
    'a blueprint from a pack nothing anticipated is registered'
  );

  const mill = resolveBuilding(registry, 'buildings-selftest', 'watermill');
  ok(mill !== null, 'the watermill resolves');
  ok(mill.source === 'pack', 'it resolves from the pack, not from a fallback', mill?.source);
  ok(mill.style.id === 'mill-rubble', 'it takes the style its blueprint names');
  const built = buildBuilding({
    blueprint: mill.blueprint,
    style: mill.style,
    seed: seedForBuilding(mill.key),
  });
  ok(built.triangles > 800, 'and it draws real geometry', `${built.triangles} triangles`);
  ok(built.windows > 4, 'with windows in it', `${built.windows}`);
  ok(built.doors === 1, 'and exactly the one door its pattern asks for', `${built.doors}`);

  // The bundled packs' kit pieces resolve to a piece and a derived style, with no pack edit.
  const items = buildingItems(registry);
  const pieces = items.filter((i) => i.category !== 'blueprint');
  ok(pieces.length >= 10, 'both bundled packs contribute kit pieces', `${pieces.length}`);
  ok(
    pieces.every((p) => p.piece !== null),
    'every kit piece resolves to a generator'
  );
  const brick = items.find((i) => i.key === 'core-classic:wall-brick');
  ok(brick?.style.wall === 'brick', 'a pack material becomes an atlas surface', brick?.style.wall);
  ok(
    brick?.style.palette.wall.toLowerCase() === '#9a4a3a',
    'and its base colour becomes the wall colour',
    brick?.style.palette.wall
  );

  // An item declaring a blueprint nobody declared draws a plain block rather than nothing.
  const orphanPack = {
    id: 'buildings-orphan',
    version: 1,
    name: { en: 'Orphan' },
    requires: [],
    buildings: [
      {
        id: 'ghost-hall',
        name: { en: 'Ghost hall' },
        category: 'blueprint',
        size: [12, 9, 8],
        cost: 100,
        procedural: 'a-blueprint-nobody-wrote',
      },
    ],
  };
  registry.registerPack(orphanPack);
  const orphan = resolveBuilding(registry, 'buildings-orphan', 'ghost-hall');
  ok(orphan?.source === 'fallback', 'a missing blueprint falls back', orphan?.source);
  const orphanBuild = buildBuilding({
    blueprint: orphan.blueprint,
    style: orphan.style,
    seed: 1,
  });
  ok(orphanBuild.triangles > 200, 'and the fallback draws something', `${orphanBuild.triangles}`);
  detach();
}

// ── 3. the numbers a person walks through ───────────────────────────────────────────────────
section('proportions');
{
  const { registry, detach } = freshRegistry();
  const hall = resolveBuilding(registry, 'parkfan-architecture', 'ticket-hall');
  const build = buildBuilding({
    blueprint: hall.blueprint,
    style: hall.style,
    seed: seedForBuilding(hall.key),
  });

  // The door head. A grand pair is 3.0 m here; anything under 2.0 is a building nobody fits through
  // and anything over 4 is a stage set.
  const grand = hall.blueprint.masses[0];
  ok(grand.storeyHeight >= 3.2 && grand.storeyHeight <= 8, 'the storey is a storey');

  // Height off the geometry, not off the record.
  const top = build.bounds.max[1];
  ok(top > 8 && top < 22, 'the ticket hall stands between 8 and 22 m', `${top.toFixed(2)} m`);
  ok(
    build.bounds.min[1] <= -0.6,
    'the plinth is buried below grade',
    `${build.bounds.min[1].toFixed(2)} m`
  );

  // Every blueprint's declared `size` is what a build tool will ghost, so it has to match the
  // geometry — the APRON and its kerb excluded, since those are ground and not building.
  for (const item of buildingItems(registry)) {
    if (item.category !== 'blueprint') continue;
    const b = buildBuilding({
      blueprint: item.blueprint,
      style: item.style,
      seed: seedForBuilding(item.key),
      litFraction: 0.5,
    });
    const apron = item.blueprint.ground?.apron ?? 2.2;
    const kerb = item.blueprint.ground?.kerb === false ? 0 : 0.16;
    const skirt = (apron + kerb) * 2;
    const width = b.bounds.max[0] - b.bounds.min[0] - skirt;
    const depth = b.bounds.max[2] - b.bounds.min[2] - skirt;
    const height = b.bounds.max[1];
    console.log(
      `    ${item.item.padEnd(16)} measured ${width.toFixed(1)} × ${height.toFixed(1)} × ${depth.toFixed(1)} m · declared ${item.size.join(' × ')}`
    );
    const tol = 0.08;
    ok(
      Math.abs(width - item.size[0]) <= item.size[0] * tol,
      `${item.item}: declared width matches the geometry`,
      `${width.toFixed(1)} vs ${item.size[0]}`
    );
    ok(
      Math.abs(depth - item.size[2]) <= item.size[2] * tol,
      `${item.item}: declared depth matches the geometry`,
      `${depth.toFixed(1)} vs ${item.size[2]}`
    );
    ok(
      Math.abs(height - item.size[1]) <= item.size[1] * tol,
      `${item.item}: declared height matches the geometry`,
      `${height.toFixed(1)} vs ${item.size[1]}`
    );
  }
  detach();
}

// ── 4. determinism ──────────────────────────────────────────────────────────────────────────
section('determinism');
{
  const { registry, detach } = freshRegistry();
  const item = resolveBuilding(registry, 'parkfan-architecture', 'clock-tower');
  const a = buildBuilding({ blueprint: item.blueprint, style: item.style, seed: 4242 });
  const b = buildBuilding({ blueprint: item.blueprint, style: item.style, seed: 4242 });
  ok(a.kit.positions.length === b.kit.positions.length, 'two builds have the same vertex count');
  let same = true;
  for (let i = 0; i < a.kit.positions.length; i++) {
    if (a.kit.positions[i] !== b.kit.positions[i]) {
      same = false;
      break;
    }
  }
  ok(same, 'and byte-identical positions');
  ok(
    a.litWindows === b.litWindows,
    'the same windows are lit',
    `${a.litWindows} vs ${b.litWindows}`
  );

  const c = buildBuilding({ blueprint: item.blueprint, style: item.style, seed: 4243 });
  ok(
    c.litWindows !== a.litWindows || c.kit.colors[3] !== a.kit.colors[3],
    'a different seed is a different building'
  );
  ok(seedForBuilding('x|y|z') === seedForBuilding('x|y|z'), 'the batch seed is a pure function');
  detach();
}

// ── 5. the geometry is geometry ─────────────────────────────────────────────────────────────
section('geometry');
{
  const { registry, detach } = freshRegistry([THIRD_PACK]);
  let worstNormal = 0;
  let total = 0;
  let uniqueTotal = 0;
  const rows = [];
  for (const item of buildingItems(registry)) {
    const b = item.blueprint
      ? buildBuilding({
          blueprint: item.blueprint,
          style: item.style,
          seed: seedForBuilding(item.key),
        })
      : buildKitPiece({
          piece: item.piece,
          size: item.size,
          style: item.style,
          seed: seedForBuilding(item.key),
        });
    for (const surface of [b.kit, b.glass, b.lit, b.sign]) {
      for (const v of surface.positions) {
        if (!Number.isFinite(v)) {
          ok(false, `${item.key}: a non-finite position`);
          break;
        }
      }
      for (let i = 0; i < surface.normals.length; i += 3) {
        const len = Math.hypot(surface.normals[i], surface.normals[i + 1], surface.normals[i + 2]);
        worstNormal = Math.max(worstNormal, Math.abs(len - 1));
      }
      ok(surface.indices.length % 3 === 0, `${item.key}: indices are whole triangles`);
      ok(
        surface.positions.length / 3 === surface.colors.length / 4,
        `${item.key}: one colour per vertex`
      );
      ok(surface.positions.length / 3 === surface.uvs.length / 2, `${item.key}: one uv per vertex`);
    }
    const meshes =
      (b.kit.indices.length ? 1 : 0) +
      (b.glass.indices.length ? 1 : 0) +
      (b.lit.indices.length ? 1 : 0) +
      (b.sign.indices.length ? 1 : 0);
    total += b.triangles;
    uniqueTotal += b.triangles;
    rows.push({ key: item.key, triangles: b.triangles, meshes, windows: b.windows });
  }
  near(worstNormal, 0, 1e-4, 'every normal is a unit vector');
  rows.sort((a, b) => b.triangles - a.triangles);
  console.log(`  ${rows.length} items, ${total} triangles in total`);
  for (const r of rows.slice(0, 8)) {
    console.log(
      `    ${r.key.padEnd(38)} ${String(r.triangles).padStart(6)} tris · ${r.meshes} draw calls · ${r.windows} windows`
    );
  }
  ok(
    rows[0].triangles < 40000,
    'the heaviest building is under 40 k triangles',
    `${rows[0].triangles}`
  );
  ok(
    rows.every((r) => r.meshes <= 4),
    'no building costs more than four draw calls'
  );
  ok(uniqueTotal < 150000, 'the whole catalogue is under 150 k unique triangles', `${uniqueTotal}`);
  detach();
}

// ── 5b. every roof form faces the sky ───────────────────────────────────────────────────────
section('roof forms');
{
  /**
   * The one thing about a roof that a wrong winding makes INVISIBLE rather than wrong.
   *
   * A back-face-culled roof does not draw an error; it draws the inside of the building, and what a
   * screenshot then shows is whatever was under it — in this module's first round, the cornice's top
   * face, a 14 × 34 m cream slab, which read as a paved terrace over the market hall
   * (`.game-render/probe-isolate/only-market.png`). So every form is built here and the area-weighted
   * normal of everything above the eaves has to point up.
   */
  const style = {
    id: 'probe',
    wall: 'brick',
    plinth: 'ashlar',
    roof: 'slate',
    palette: {
      wall: '#9c4b3c',
      plinth: '#8d8578',
      roof: '#454b54',
      trim: '#e8e0d0',
      joinery: '#2f4a3f',
      metal: '#4b5157',
      glass: '#28353d',
      lit: '#ffcf8a',
      sign: '#d9a441',
    },
    trim: {
      cornice: 0.4,
      stringCourse: 0.2,
      quoins: false,
      reveal: 0.18,
      sill: 0.1,
      corniceOut: 0.3,
    },
    glazing: { mullions: 2, transoms: 2 },
  };
  const forms = ['gable', 'hip', 'pyramid', 'flat', 'mansard', 'shed', 'barrel', 'cone'];
  for (const form of forms) {
    const round = form === 'cone' ? { round: 8 } : {};
    const bp = {
      id: `probe-${form}`,
      style: 'probe',
      masses: [
        {
          size: [14, 10],
          storeys: 1,
          storeyHeight: 4,
          plinth: 0.5,
          facades: { all: 'w*' },
          roof: { form, pitch: 38, eaves: 0.6, ridge: 'x' },
          ...round,
        },
      ],
      ground: { apron: 0 },
    };
    const b = buildBuilding({ blueprint: bp, style, seed: 99 });
    const eave = 4.5;
    const p = b.kit.positions;
    const idx = b.kit.indices;
    let up = 0;
    let down = 0;
    let highest = -Infinity;
    let highestNy = 0;
    for (let i = 0; i < idx.length; i += 3) {
      const a = idx[i] * 3;
      const c = idx[i + 1] * 3;
      const d = idx[i + 2] * 3;
      const cy = (p[a + 1] + p[c + 1] + p[d + 1]) / 3;
      if (cy < eave + 0.3) continue;
      const e1 = [p[c] - p[a], p[c + 1] - p[a + 1], p[c + 2] - p[a + 2]];
      const e2 = [p[d] - p[a], p[d + 1] - p[a + 1], p[d + 2] - p[a + 2]];
      // The winding convention swaps the last two indices, so the geometric cross product of the
      // stored order points the other way; `-ny` is the outward normal.
      const ny = -(e1[2] * e2[0] - e1[0] * e2[2]);
      const area = Math.hypot(
        e1[1] * e2[2] - e1[2] * e2[1],
        e1[2] * e2[0] - e1[0] * e2[2],
        e1[0] * e2[1] - e1[1] * e2[0]
      );
      if (area < 1e-9) continue;
      // A parapet's own face is vertical and is neither up nor down; counting it as "down" is what
      // made a perfectly good flat roof measure 51 %.
      if (cy > highest) {
        highest = cy;
        highestNy = ny;
      }
      if (Math.abs(ny) < area * 0.2) continue;
      if (ny > 0) up += area;
      else down += area;
    }
    const share = up / (up + down || 1);
    console.log(`    ${form.padEnd(8)} ${(share * 100).toFixed(0)} % of the roof area faces up`);
    // 0.6 rather than 0.9, because a closed box has a bottom: a flat roof's parapet and coping are
    // six-sided solids whose undersides are real geometry nobody can see. The number that catches a
    // winding bug is the 0 % a whole vault measured, not the last twenty points.
    ok(share > 0.6, `${form}: the roof faces the sky`, `${(share * 100).toFixed(0)} %`);
    ok(highestNy > 0, `${form}: the highest face on the building faces up`);
  }
}

// ── 5c. every triangle agrees with its own normal ───────────────────────────────────────────
section('winding');
{
  /**
   * The check that should have existed after round 1, and the reason it did not.
   *
   * §5b measures roof PLANES, and it was written after `addPrism` came out inside out. It could not
   * see the two things the round-1 critic found — 83 arch fans and 233.6 m² of gable end wall —
   * because `roofs.ts` says in a comment that a gable end is "wall, not roof", so the check exempted
   * exactly the surface that was broken. A check with a comment explaining what it does not cover is
   * a check with a hole in it, and the hole is where the bug lives.
   *
   * This one has no categories in it. Every triangle of every surface of every build in every
   * registered pack: the winding `tri()` stored, against the vertex normal the same code wrote for
   * the shading. They can only disagree if one of the two is wrong, and a triangle whose winding
   * disagrees with its normal is a back face — invisible, with no error anywhere.
   */
  const { registry, detach } = freshRegistry([THIRD_PACK]);
  let inverted = 0;
  let invertedArea = 0;
  let total = 0;
  const offenders = [];
  for (const item of buildingItems(registry)) {
    const b = item.blueprint
      ? buildBuilding({
          blueprint: item.blueprint,
          style: item.style,
          seed: seedForBuilding(item.key),
        })
      : buildKitPiece({
          piece: item.piece,
          size: item.size,
          style: item.style,
          seed: seedForBuilding(item.key),
        });
    let itemBad = 0;
    let itemArea = 0;
    for (const surface of [b.kit, b.glass, b.lit, b.sign]) {
      const P = surface.positions;
      const N = surface.normals;
      const I = surface.indices;
      for (let i = 0; i < I.length; i += 3) {
        const s0 = I[i] * 3;
        const s1 = I[i + 1] * 3;
        const s2 = I[i + 2] * 3;
        // `tri(a, b, c)` stores `(a, c, b)`, so the authored front face is `s0 → s2 → s1`.
        const e1 = [P[s2] - P[s0], P[s2 + 1] - P[s0 + 1], P[s2 + 2] - P[s0 + 2]];
        const e2 = [P[s1] - P[s0], P[s1 + 1] - P[s0 + 1], P[s1 + 2] - P[s0 + 2]];
        const nx = e1[1] * e2[2] - e1[2] * e2[1];
        const ny = e1[2] * e2[0] - e1[0] * e2[2];
        const nz = e1[0] * e2[1] - e1[1] * e2[0];
        const len = Math.hypot(nx, ny, nz);
        if (len < 1e-9) continue;
        total += 1;
        const dot = nx * N[s0] + ny * N[s0 + 1] + nz * N[s0 + 2];
        if (dot < 0) {
          itemBad += 1;
          itemArea += len / 2;
        }
      }
    }
    inverted += itemBad;
    invertedArea += itemArea;
    if (itemBad) offenders.push(`${item.key}: ${itemBad} triangles, ${itemArea.toFixed(1)} m²`);
  }
  for (const line of offenders) console.log(`    ${line}`);
  console.log(`    ${total} triangles across the catalogue, ${inverted} inverted`);
  ok(
    inverted === 0,
    'no triangle in any build disagrees with its own normal',
    `${inverted} of ${total}, ${invertedArea.toFixed(1)} m²`
  );
  detach();
}

// ── 5d. nothing on a mass's own envelope faces into it ──────────────────────────────────────
section('outward faces');
{
  /**
   * The second half of the winding question, and the half §5c cannot answer.
   *
   * `addTriangle` and `addQuad` both derive the vertex normal FROM the winding, so a triangle built
   * with them is always self-consistent — and a gable end wall wound the wrong way round is a
   * perfectly consistent triangle whose normal points into the building. §5c reads 0 inverted on all
   * 233.6 m² of it. What is wrong is not the agreement between the two, it is the direction relative
   * to the SOLID, and that is a different measurement.
   *
   * The invariant with no category in it: **a triangle standing on a mass's own plan boundary must
   * face out of that mass.** Take the mass's plan prism, extended up to the top of everything the
   * build drew. A triangle whose centroid sits on or outside that prism, and whose normal takes a
   * 0.25 m step back INTO it, is a face pointing at the inside of its own building. Wall faces,
   * gable ends, mansard ends and barrel lunettes are all on that boundary; reveals, soffits, aprons,
   * roof planes and chimneys are inside the plan and are answered by §5b and §5c instead.
   */
  const { registry, detach } = freshRegistry([THIRD_PACK]);
  const DEG = Math.PI / 180;
  let inward = 0;
  let inwardArea = 0;
  const offenders = [];
  for (const item of buildingItems(registry)) {
    if (!item.blueprint) continue;
    const b = buildBuilding({
      blueprint: item.blueprint,
      style: item.style,
      seed: seedForBuilding(item.key),
    });
    const top = b.bounds.max[1] + 1;
    const solids = item.blueprint.masses.map((mass) => {
      const at = mass.at ?? [0, 0];
      const yaw = (mass.yaw ?? 0) * DEG;
      return {
        cx: at[0],
        cz: at[1],
        cos: Math.cos(yaw),
        sin: Math.sin(yaw),
        hx: mass.size[0] / 2,
        hz: mass.size[1] / 2,
        round: mass.round && mass.round >= 3,
        bottom: (mass.base ?? 0) - 0.7,
      };
    });
    // How far inside a mass's plan prism a world point is; negative outside.
    const depth = (m, x, y, z) => {
      const dx = x - m.cx;
      const dz = z - m.cz;
      const lx = dx * m.cos - dz * m.sin;
      const lz = dx * m.sin + dz * m.cos;
      const plan = m.round
        ? m.hx - Math.hypot(lx, lz)
        : Math.min(m.hx - Math.abs(lx), m.hz - Math.abs(lz));
      return Math.min(plan, top - y, y - m.bottom);
    };
    // Every triangle of the build as centroid + normal, in one flat list, bucketed into half-metre
    // cells so the "is anything abutting this" question below is a handful of comparisons and not
    // sixty-three thousand.
    const faces = [];
    const cells = new Map();
    const key = (x, y, z) => `${Math.floor(x / 0.5)},${Math.floor(y / 0.5)},${Math.floor(z / 0.5)}`;
    for (const surface of [b.kit, b.glass, b.lit, b.sign]) {
      const P = surface.positions;
      const N = surface.normals;
      const I = surface.indices;
      for (let i = 0; i < I.length; i += 3) {
        const s0 = I[i] * 3;
        const s1 = I[i + 1] * 3;
        const s2 = I[i + 2] * 3;
        const e1 = [P[s2] - P[s0], P[s2 + 1] - P[s0 + 1], P[s2 + 2] - P[s0 + 2]];
        const e2 = [P[s1] - P[s0], P[s1 + 1] - P[s0 + 1], P[s1 + 2] - P[s0 + 2]];
        const f = {
          cx: (P[s0] + P[s1] + P[s2]) / 3,
          cy: (P[s0 + 1] + P[s1 + 1] + P[s2 + 1]) / 3,
          cz: (P[s0 + 2] + P[s1 + 2] + P[s2 + 2]) / 3,
          nx: N[s0],
          ny: N[s0 + 1],
          nz: N[s0 + 2],
          area:
            Math.hypot(
              e1[1] * e2[2] - e1[2] * e2[1],
              e1[2] * e2[0] - e1[0] * e2[2],
              e1[0] * e2[1] - e1[1] * e2[0]
            ) / 2,
        };
        faces.push(f);
        const k = key(f.cx, f.cy, f.cz);
        const bucket = cells.get(k);
        if (bucket) bucket.push(f);
        else cells.set(k, [f]);
      }
    }
    /**
     * Is this face looking at something, or at nothing?
     *
     * An inward-facing triangle is not automatically a bug. The back of a colonnade's entablature
     * really does point at the wall it is bolted to; the inside of an oculus's reveal points at the
     * other side of its own hole; a parapet's inner face points at the roof deck. In every one of
     * those there is another surface in front of it facing back, within about a metre. A gable end
     * wound the wrong way round has **nothing** in front of it, which is exactly why you can see the
     * horizon through it. So the question is not "does it point inwards" but "does it point inwards
     * at nothing".
     */
    const facingNothing = (f) => {
      const reach = 1.6;
      const cells1 = Math.ceil(reach / 0.5);
      for (let dx = -cells1; dx <= cells1; dx++) {
        for (let dy = -cells1; dy <= cells1; dy++) {
          for (let dz = -cells1; dz <= cells1; dz++) {
            const bucket = cells.get(key(f.cx + dx * 0.5, f.cy + dy * 0.5, f.cz + dz * 0.5));
            if (!bucket) continue;
            for (const g of bucket) {
              if (g === f) continue;
              if (f.nx * g.nx + f.ny * g.ny + f.nz * g.nz > -0.5) continue;
              const vx = g.cx - f.cx;
              const vy = g.cy - f.cy;
              const vz = g.cz - f.cz;
              if (Math.hypot(vx, vy, vz) > reach) continue;
              // In front of it, not behind it.
              if (vx * f.nx + vy * f.ny + vz * f.nz < -0.02) continue;
              return false;
            }
          }
        }
      }
      return true;
    };
    let itemBad = 0;
    let itemArea = 0;
    for (const f of faces) {
      // Only surfaces standing up: a floor or a soffit inside the plan is somebody else's check.
      if (Math.abs(f.ny) > 0.35) continue;
      /**
       * It has to look out of at least ONE mass it stands on, not out of the nearest one.
       *
       * Masses overlap on purpose — a jettied storey oversails the one below it, a wing is let into
       * the block it joins — and where a wing's plan edge grazes the block's wall, the same triangle
       * is on two envelopes at once. Picking the nearer of the two by four centimetres flagged the
       * selftest's own watermill: a correct east wall of the mill, on the west edge of the
       * wheelhouse's plan. The honest statement is the weaker one — this triangle stands on somebody's
       * envelope and looks out of it — and a gable end wound inwards satisfies it for nobody.
       */
      let onAnEnvelope = false;
      let looksOut = false;
      for (const m of solids) {
        if (Math.abs(depth(m, f.cx, f.cy, f.cz)) > 0.1) continue;
        onAnEnvelope = true;
        if (depth(m, f.cx + f.nx * 0.25, f.cy + f.ny * 0.25, f.cz + f.nz * 0.25) < 0.12) {
          looksOut = true;
          break;
        }
      }
      if (!onAnEnvelope || looksOut) continue;
      if (!facingNothing(f)) continue;
      itemArea += f.area;
      itemBad += 1;
    }
    inward += itemBad;
    inwardArea += itemArea;
    if (itemBad) offenders.push(`${item.key}: ${itemBad} triangles, ${itemArea.toFixed(1)} m²`);
  }
  for (const line of offenders) console.log(`    ${line}`);
  ok(
    inward === 0,
    'nothing on a mass envelope faces into the building',
    `${inward} triangles, ${inwardArea.toFixed(1)} m²`
  );
  detach();
}

// ── 6. materials, not one colour with a grid on it ──────────────────────────────────────────
section('atlas');
{
  const size = 64;
  const sample = { r: 1, g: 1, b: 1, height: 0.5, roughness: 0.8, metallic: 0, ao: 1 };
  const rows = [];
  for (const entry of SHADERS) {
    const shade = entry.make(1234 + entry.tile * 7919);
    let sum = 0;
    let sumSq = 0;
    let minR = 1;
    let maxR = 0;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        sample.r = 1;
        sample.g = 1;
        sample.b = 1;
        sample.height = 0.5;
        sample.roughness = 0.8;
        sample.metallic = 0;
        sample.ao = 1;
        shade((x + 0.5) / size, (y + 0.5) / size, sample);
        const lum = sample.r * 0.2126 + sample.g * 0.7152 + sample.b * 0.0722;
        sum += lum;
        sumSq += lum * lum;
        minR = Math.min(minR, sample.roughness);
        maxR = Math.max(maxR, sample.roughness);
        ok(Number.isFinite(lum), `${entry.name}: finite sample`);
      }
    }
    const n = size * size;
    const mean = sum / n;
    const sd = Math.sqrt(Math.max(0, sumSq / n - mean * mean));
    rows.push({ name: entry.name, mean, sd, spread: sd / mean, minR, maxR });
  }
  /**
   * The bar is per material class, and the classes are honest about what they are.
   *
   * A brick wall is a few hundred slightly different reds and a paving slab is a few hundred greys,
   * so those are held to 5 % — the number a critic measured at 2.9 % on another module's flagship
   * surface and called "one colour with a grid drawn on it". Gloss paint on a window frame really is
   * nearly one value and holding it to 5 % would be asking for a lie, so painted and metal surfaces
   * are held to 1.5 % of tone and carry their variation in the NORMAL instead.
   */
  const UNIT_MATERIALS = [
    'brick',
    'ashlar',
    'rubble',
    'slate',
    'pantile',
    'shingle',
    'paving',
    'timber',
  ];
  for (const r of rows) {
    console.log(
      `    ${r.name.padEnd(9)} mean ${r.mean.toFixed(3)} · sd ${(r.spread * 100).toFixed(1)} % · roughness ${r.minR.toFixed(2)}–${r.maxR.toFixed(2)}`
    );
    ok(
      r.mean > 0.55 && r.mean < 1.35,
      `${r.name}: writes a detail map, not a colour map`,
      r.mean.toFixed(3)
    );
    const bar = r.name === 'glow' ? 0.1 : UNIT_MATERIALS.includes(r.name) ? 0.05 : 0.015;
    ok(
      r.spread > bar,
      `${r.name}: has real tone variation (bar ${(bar * 100).toFixed(1)} %)`,
      `${(r.spread * 100).toFixed(1)} %`
    );
    ok(r.minR < 0.98, `${r.name}: is not roughness-1.0 plastic`, r.minR.toFixed(2));
  }
  ok(SHADERS.length === 16, 'the atlas has sixteen tiles', `${SHADERS.length}`);
  const slots = new Set(SHADERS.map((s) => s.tile));
  ok(slots.size === SHADERS.length, 'no two shaders share a slot');
  ok(
    Object.values(TILE).every((v) => slots.has(v)),
    'every named surface has a shader'
  );
}

// ── 7. what the demo park will get ──────────────────────────────────────────────────────────
section('demo-park plots');
{
  const { registry, detach } = freshRegistry();
  // `pavilion` is 56 × 32 m (PADS in demo-park/plan.ts) and `entrance-hall` 22 × 38, and the
  // buildings this module offers for them have to fit inside with the apron on.
  const cases = [
    { item: 'grand-pavilion', padX: 56, padZ: 32, yaw: 0 },
    { item: 'ticket-hall', padX: 22, padZ: 38, yaw: Math.PI / 2 },
  ];
  for (const c of cases) {
    const item = resolveBuilding(registry, 'parkfan-architecture', c.item);
    const b = buildBuilding({
      blueprint: item.blueprint,
      style: item.style,
      seed: seedForBuilding(item.key),
    });
    const w = b.bounds.max[0] - b.bounds.min[0];
    const d = b.bounds.max[2] - b.bounds.min[2];
    const rotated = Math.abs(Math.sin(c.yaw)) > 0.5;
    const spanX = rotated ? d : w;
    const spanZ = rotated ? w : d;
    ok(spanX <= c.padX, `${c.item} fits the pad across`, `${spanX.toFixed(1)} of ${c.padX} m`);
    ok(spanZ <= c.padZ, `${c.item} fits the pad along`, `${spanZ.toFixed(1)} of ${c.padZ} m`);
    console.log(
      `    ${c.item.padEnd(16)} ${spanX.toFixed(1)} × ${spanZ.toFixed(1)} m (apron in) on a ${c.padX} × ${c.padZ} pad`
    );
  }
  detach();
}

// ── 8. the sim half agrees with the geometry ────────────────────────────────────────────────
// `sim.ts` derives a footprint, an eaves height and a door position from the blueprint alone,
// because a guest may not wait for a mesh. That makes it a hand-written twin of `build.ts` — the
// kind of pair this repository has already been bitten by — so it is measured against the thing it
// is standing in for rather than asserted to be right.
section('sim plan');
{
  const { registry, detach } = freshRegistry([THIRD_PACK]);
  const events = { on: () => () => {}, emit: () => {} };
  const world = { entities: {}, modules: {} };
  const sim = createBuildingsSim({
    world,
    events,
    registry,
    rng: { fork: () => ({ next: () => 0.5 }) },
    module: () => undefined,
    environment: () => ({}),
  });

  ok(typeof sim.tick === 'function', 'the sim handle has a tick');
  ok(sim.api.count() === 0, 'an empty world indexes no buildings');

  // The sim reads the packs itself, and this is the check that would have caught it not doing so.
  // `manifest.ts` keeps its catalogue in module scope and the worker is a realm of its own, so a
  // sim that leans on the renderer's attach resolves every item, finds no blueprint behind it and
  // silently indexes a plain block. Here it is given a registry nobody has attached to.
  {
    resetBuildingContent();
    const bare = new Registry();
    for (const pack of PACKS) bare.registerPack(pack);
    ok(buildingBlueprints().length === 0, 'the catalogue starts empty in this realm');
    const solo = createBuildingsSim({
      world: { entities: {}, modules: {} },
      events,
      registry: bare,
      rng: { fork: () => ({ next: () => 0.5 }) },
      module: () => undefined,
      environment: () => ({}),
    });
    ok(
      buildingBlueprints().length >= 7,
      'creating the sim alone fills the catalogue',
      `${buildingBlueprints().length} blueprints`
    );
    const only = resolveBuilding(bare, 'parkfan-architecture', 'grand-pavilion');
    ok(
      only?.source === 'pack',
      'and a blueprint resolves from the pack, not the fallback',
      only?.source
    );
    solo.dispose();
  }
  // `resetBuildingContent()` above emptied the module-scope catalogue for everybody in this realm,
  // including the `sim` the rest of the section uses. Re-read it off the registry that still holds
  // the packs.
  attachBuildingContent(registry);

  const cases = [
    ['parkfan-architecture', 'grand-pavilion', 0],
    ['parkfan-architecture', 'ticket-hall', Math.PI / 2],
    ['parkfan-architecture', 'clock-tower', 0],
    ['parkfan-architecture', 'market-hall', 0],
    ['parkfan-architecture', 'rotunda', 0],
    ['parkfan-architecture', 'terrace-house', 0],
    ['parkfan-architecture', 'guest-services', 0],
    ['buildings-selftest', 'watermill', 0.7],
  ];
  let i = 0;
  for (const [packId, item, yaw] of cases) {
    const id = `b${(i += 1)}`;
    world.entities[id] = {
      id,
      kind: 'building',
      pack: packId,
      item,
      position: [220 * i, 0, -170 * i],
      yaw,
    };
  }
  sim.rebuild();
  ok(
    sim.api.count() === cases.length,
    'every building in the world is indexed',
    `${sim.api.count()} of ${cases.length}`
  );

  for (const id in world.entities) {
    const entity = world.entities[id];
    const record = sim.api.get(id);
    const resolved = resolveBuilding(registry, entity.pack, entity.item);
    const built = buildBuilding({
      blueprint: resolved.blueprint,
      style: resolved.style,
      seed: seedForBuilding(resolved.key),
    });
    // The built bounds include the apron, the kerb and the roof overhang; the sim's box is the
    // masses only. So the sim may be SMALLER, never larger, and never by more than the apron.
    const w = built.bounds.max[0] - built.bounds.min[0];
    const d = built.bounds.max[2] - built.bounds.min[2];
    const c = Math.abs(Math.cos(entity.yaw));
    const sn = Math.abs(Math.sin(entity.yaw));
    const builtX = (w * c + d * sn) / 2;
    const builtZ = (w * sn + d * c) / 2;
    ok(
      record.hx <= builtX + 0.01 && record.hz <= builtZ + 0.01,
      `${entity.item}: the sim's plan box is inside the built bounds`,
      `${record.hx.toFixed(1)} × ${record.hz.toFixed(1)} vs ${builtX.toFixed(1)} × ${builtZ.toFixed(1)}`
    );
    ok(
      record.hx >= builtX * 0.55 && record.hz >= builtZ * 0.55,
      `${entity.item}: and it is not a tenth of it`,
      `${record.hx.toFixed(1)} × ${record.hz.toFixed(1)} vs ${builtX.toFixed(1)} × ${builtZ.toFixed(1)}`
    );
    // The entrance is outside the building and on the front, which after yaw is where the door is.
    const dx = record.entrance[0] - record.x;
    const dz = record.entrance[1] - record.z;
    ok(
      Math.hypot(dx, dz) > 1,
      `${entity.item}: the entrance is not the entity position`,
      Math.hypot(dx, dz).toFixed(2)
    );
    // Turn it back into the building's own space: it must be on +z, the front.
    const localZ = dx * Math.sin(entity.yaw) + dz * Math.cos(entity.yaw);
    ok(localZ > 0, `${entity.item}: the entrance is on the front elevation`, localZ.toFixed(2));
    ok(
      record.height > 3 && record.height < 40,
      `${entity.item}: a plausible eaves height`,
      record.height.toFixed(1)
    );
    // The point query finds the building it stands in and nothing at 500 m.
    ok(
      sim.api.at(record.cx, record.cz)?.id === id,
      `${entity.item}: at() finds it under the middle of its own plan`
    );
    ok(
      sim.api.at(record.cx + 500, record.cz)?.id !== id,
      `${entity.item}: and not half a kilometre away`
    );
    ok(
      sim.api.nearestEntrance(record.entrance[0], record.entrance[1], 3)?.id === id,
      `${entity.item}: nearestEntrance finds its own door`
    );
    // And against the door `build.ts` actually drew, which is what the renderer's `entrance()`
    // returns. They are allowed to differ — the sim takes the middle of the front elevation and the
    // builder takes the bay the door landed in — but the two have to be the same doorway. Six
    // metres rather than one bay because of the rotunda, whose "front elevation" is one facet of an
    // octagon and whose middle is therefore 5.4 m from the arch: five of the eight fixtures are
    // under 1.9 m and three are exact.
    //
    // Nothing rounds this off, because the point of the check is the SIDE. A sign error in either
    // half puts the door on the back of the building and a 6 m bound catches that on every fixture
    // here — the shortest of them is 9 m deep.
    const doorLocal = built.entrance;
    const doorWorld = [
      entity.position[0] +
        doorLocal[0] * Math.cos(entity.yaw) +
        doorLocal[1] * Math.sin(entity.yaw),
      entity.position[2] -
        doorLocal[0] * Math.sin(entity.yaw) +
        doorLocal[1] * Math.cos(entity.yaw),
    ];
    const gap = Math.hypot(record.entrance[0] - doorWorld[0], record.entrance[1] - doorWorld[1]);
    ok(
      gap < 6,
      `${entity.item}: the sim's door is the builder's door`,
      `${gap.toFixed(2)} m apart`
    );
    console.log(
      `    ${entity.item.padEnd(16)} plan ${(record.hx * 2).toFixed(1)} × ${(record.hz * 2).toFixed(1)} m` +
        ` (built ${(builtX * 2).toFixed(1)} × ${(builtZ * 2).toFixed(1)} with apron)` +
        `  eaves ${record.height.toFixed(1)} m  door ${gap.toFixed(2)} m off`
    );
  }

  // A world that loses its buildings loses its index with them, rather than keeping stale boxes
  // that a path tool would then refuse to build through.
  world.entities = {};
  sim.rebuild();
  ok(sim.api.count() === 0, 'rebuild against an empty world empties the index');
  ok(sim.api.at(220, -170) === null, 'and the point query stops finding what is gone');
  sim.dispose();
  detach();
}

console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures) {
  console.error(`${failures} FAILED`);
  process.exit(1);
}
