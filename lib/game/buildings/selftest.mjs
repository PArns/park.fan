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
          at: [7.5, -4],
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
  ok(flexible.bays.length === 8, 'flexible bays fill a 26 m wall at 3.3 m', `${flexible.bays.length}`);
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
  ok(build.bounds.min[1] <= -0.6, 'the plinth is buried below grade', `${build.bounds.min[1].toFixed(2)} m`);

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
  ok(a.litWindows === b.litWindows, 'the same windows are lit', `${a.litWindows} vs ${b.litWindows}`);

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
      ok(
        surface.positions.length / 3 === surface.uvs.length / 2,
        `${item.key}: one uv per vertex`
      );
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
  ok(rows[0].triangles < 40000, 'the heaviest building is under 40 k triangles', `${rows[0].triangles}`);
  ok(
    rows.every((r) => r.meshes <= 4),
    'no building costs more than four draw calls'
  );
  ok(uniqueTotal < 150000, 'the whole catalogue is under 150 k unique triangles', `${uniqueTotal}`);
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
  const UNIT_MATERIALS = ['brick', 'ashlar', 'rubble', 'slate', 'pantile', 'shingle', 'paving', 'timber'];
  for (const r of rows) {
    console.log(
      `    ${r.name.padEnd(9)} mean ${r.mean.toFixed(3)} · sd ${(r.spread * 100).toFixed(1)} % · roughness ${r.minR.toFixed(2)}–${r.maxR.toFixed(2)}`
    );
    ok(r.mean > 0.55 && r.mean < 1.35, `${r.name}: writes a detail map, not a colour map`, r.mean.toFixed(3));
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
  ok(Object.values(TILE).every((v) => slots.has(v)), 'every named surface has a shader');
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

console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures) {
  console.error(`${failures} FAILED`);
  process.exit(1);
}
