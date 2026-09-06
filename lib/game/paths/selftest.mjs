/**
 * The paths module's own checks, for things a green build and a screenshot both miss.
 *
 *   node --experimental-strip-types --import ./scripts/register-path-alias.mjs \
 *     lib/game/paths/selftest.mjs
 *
 * It runs in node against the real `SimRuntime`, because the two questions that matter here —
 * "is the park connected" and "can a guest actually walk from the gate to the queue" — are
 * invisible in a still frame and vacuous in the demo park, which has no path entities yet.
 *
 * Four of these were failing when they were first written and each one was a real bug:
 *   - the Dijkstra's stale-entry guard used a `Float32Array` for distances, so at park distances
 *     the rounding exceeded the epsilon and `next()` answered null on a route `reachable()` had
 *     just called walkable;
 *   - nodes were welded at a flat radius, which disconnected every plaza from every path that
 *     stopped at its kerb;
 *   - `nearestNode` allocated a candidate array per call, which is 16,000 allocations a tick;
 *   - and the route trees were kept in insertion order with a delete-and-reinsert per hit, which
 *     put 20,000 queries at 9.9 ms — over the whole-sim budget by itself.
 */
import { SimRuntime } from '@/lib/game/core/sim-runtime.ts';
import { GAME_MODULES } from '@/lib/game/modules.ts';
import { Registry } from '@/lib/game/core/registry.ts';
import { createWorld, serializeWorld, deserializeWorld } from '@/lib/game/core/world.ts';
import {
  buildLayout,
  findJunctions,
  GRAPH_SPACING,
  MESH_SPACING,
} from '@/lib/game/paths/layout.ts';
import { pathMaterial, pathStyles, registerPathStyle } from '@/lib/game/paths/manifest.ts';
import { readFileSync } from 'node:fs';

const packs = ['core-classic', 'neon-lagoon'].map((id) =>
  JSON.parse(readFileSync(new URL(`../content/packs/${id}/pack.json`, import.meta.url), 'utf8'))
);

let failures = 0;
const check = (name, ok, detail = '') => {
  if (!ok) failures++;
  console.log(`  ${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
};

// ── the park this runs against ───────────────────────────────────────────────────────────────
const octagon = (cx, cz, r) => {
  const out = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    out.push(cx + Math.cos(a) * r, cz + Math.sin(a) * r);
  }
  return out;
};

function makeWorld(seed) {
  const registry = new Registry();
  for (const p of packs) registry.registerPack(p);
  const world = createWorld({
    seed,
    name: 'paths-selftest',
    packs: registry.packs().map((p) => p.id),
  });
  const t = world.terrain;
  const n = t.resolution;
  const w = n + 1;
  for (let j = 0; j < w; j++) {
    for (let i = 0; i < w; i++) {
      const x = -t.size / 2 + (i / n) * t.size;
      const z = -t.size / 2 + (j / n) * t.size;
      t.heights[j * w + i] = Math.sin(x / 90) * 2.5 + Math.cos(z / 120) * 1.8;
    }
  }
  const add = (id, data) => {
    world.entities[id] = {
      id,
      kind: 'path',
      pack: 'core-classic',
      item: data.style,
      position: [data.points[0], 0, data.points[1]],
      yaw: 0,
      data,
    };
  };
  add('path-plaza', { form: 'plaza', style: 'pavers', points: octagon(0, 0, 27) });
  add('path-avenue', {
    form: 'path',
    style: 'promenade',
    width: 8,
    entrance: true,
    points: [0, 178, 2, 160, -3, 140, 0, 118, 0, 92, 0, 60, 0, 20],
  });
  add('path-boulevard', {
    form: 'path',
    style: 'promenade',
    width: 6,
    points: [-96, 104, -58, 112, -22, 117, 0, 118, 26, 119, 62, 126, 94, 138],
  });
  add('path-queue', {
    form: 'queue',
    style: 'queue-line',
    width: 2,
    rideId: 'selftest-ride',
    points: [-18, 12, -32, 16, -48, 14, -56, 8, -46, 3, -32, 1, -34, -7, -48, -10, -84, -24],
  });
  // Deliberately not connected to anything: `reachable()` has to be able to say no.
  add('path-island', {
    form: 'path',
    style: 'cobble',
    width: 4,
    points: [180, -180, 200, -160, 215, -130],
  });
  return world;
}

function boot(seed = 7) {
  const posted = [];
  const rt = new SimRuntime(GAME_MODULES, (m) => posted.push(m));
  rt.init({
    type: 'init',
    world: makeWorld(seed),
    packs,
    modules: GAME_MODULES.map((m) => m.id),
    seed,
  });
  return { rt, posted, api: rt.handles.get('paths').api };
}

console.log('paths selftest');

// ── 1. the manifest is the extensibility seam ────────────────────────────────────────────────
// Every shipped style must resolve to a real recipe, and a NEW style added at runtime must become
// a buildable path with no code change. That is the gate the brief grades: "a new path style must
// come from a manifest entry, not from code".
for (const style of pathStyles()) {
  const surface = pathMaterial(style.surface);
  if (surface.id !== style.surface) {
    check(`style "${style.id}" resolves its surface`, false, `fell back to "${surface.id}"`);
  }
  if (style.kerb && pathMaterial(style.kerb.material).id !== style.kerb.material) {
    check(`style "${style.id}" resolves its kerb`, false, style.kerb.material);
  }
}
check('every shipped style resolves its materials', failures === 0);

registerPathStyle({
  id: 'selftest-lane',
  name: 'Selftest lane',
  surface: 'granite-sett',
  kerb: { material: 'kerb-timber', width: 0.22, height: 0.11 },
  widths: [2, 4],
  defaultWidth: 2,
  crossGrain: true,
  wear: 0.9,
});
const added = buildLayout(
  {
    id: 'x',
    kind: 'path',
    pack: 'p',
    item: 'i',
    position: [0, 0, 0],
    yaw: 0,
    data: { form: 'path', style: 'selftest-lane', points: [0, 0, 10, 0, 20, 6], width: 4 },
  },
  MESH_SPACING
);
check(
  'a style added at runtime builds a layout',
  !!added && added.style.id === 'selftest-lane' && added.width === 4 && added.style.crossGrain,
  added ? `${added.stations.length} stations, ${added.lengthM.toFixed(1)} m` : 'null'
);
check(
  'an unknown style falls back rather than throwing',
  buildLayout(
    {
      id: 'y',
      kind: 'path',
      pack: 'p',
      item: 'i',
      position: [0, 0, 0],
      yaw: 0,
      data: { form: 'path', style: 'does-not-exist', points: [0, 0, 10, 0] },
    },
    MESH_SPACING
  ) !== null
);
let rejected = false;
try {
  registerPathStyle({ id: 'bad', surface: 'no-such-material', widths: [4], defaultWidth: 4 });
} catch (error) {
  rejected = /no-such-material/.test(String(error));
}
check('a style naming an unknown material is rejected with the field', rejected);

// ── 2. the graph ─────────────────────────────────────────────────────────────────────────────
const { rt, posted, api } = boot();
const stats = api.stats();
const gate = api.entrance();
console.log(`  · ${stats.nodes} nodes, ${stats.edges} edges, ${stats.components} components`);

check(
  'entrance sits on the flagged path',
  Math.abs(gate.x) < 4 && gate.z > 170,
  JSON.stringify(gate)
);
check('the island is its own component', stats.components === 2, String(stats.components));
check('the queue is listed with its ride', api.queues()[0]?.rideId === 'selftest-ride');
check('gate reaches the plaza', api.reachable(gate.x, gate.z, 0, 0));
check('gate reaches the queue head', api.reachable(gate.x, gate.z, -84, -24));
check('gate does not reach the island', !api.reachable(gate.x, gate.z, 200, -160));
check('gate does not reach open grass', !api.reachable(gate.x, gate.z, -200, -200));

// ── 3. a guest can actually walk it ──────────────────────────────────────────────────────────
// The component labels saying "connected" is not the same claim as `next()` producing a chain of
// waypoints that arrives, and the two disagreed for one very specific reason once (see the header).
let x = gate.x;
let z = gate.z;
let node = -1;
let steps = 0;
let walked = 0;
for (; steps < 500; steps++) {
  const hop = api.next(x, z, -84, -24, node);
  if (!hop) break;
  walked += Math.hypot(hop.x - x, hop.z - z);
  x = hop.x;
  z = hop.z;
  node = hop.node;
  if (steps % 5 === 0) rt.tick();
}
const straight = Math.hypot(-84 - gate.x, -24 - gate.z);
check(
  'next() walks the gate to the queue head',
  Math.hypot(x + 84, z + 24) < 4,
  `${steps} steps, ${walked.toFixed(0)} m walked vs ${straight.toFixed(0)} m straight`
);
check('the route is not a detour', walked < straight * 2.2, `${(walked / straight).toFixed(2)}×`);

// ── 4. determinism ───────────────────────────────────────────────────────────────────────────
const b = boot().api;
check(
  'the graph is identical on a second boot with the same seed',
  b.stats().nodes === stats.nodes && b.stats().edges === stats.edges,
  `${b.stats().nodes}/${b.stats().edges} vs ${stats.nodes}/${stats.edges}`
);
check('the entrance is identical', JSON.stringify(b.entrance()) === JSON.stringify(gate));

// ── 5. the budget ────────────────────────────────────────────────────────────────────────────
// The guests module will call `next()` thousands of times a tick and the whole sim gets 6 ms.
const dests = [
  [0, 0],
  [-84, -24],
  [-96, 104],
  [94, 138],
  [0, 178],
];
for (let i = 0; i < 40; i++) {
  rt.tick();
  for (const d of dests) api.next(0, 150, d[0], d[1]);
}
const QUERIES = 20000;
const t0 = performance.now();
let answered = 0;
let n2 = -1;
for (let i = 0; i < QUERIES; i++) {
  const d = dests[i % dests.length];
  const hop = api.next(x, z, d[0], d[1], n2 >= 0 ? n2 : undefined);
  if (hop) {
    answered++;
    n2 = hop.node;
    x = hop.x;
    z = hop.z;
  } else {
    n2 = -1;
    x = 0;
    z = 150;
  }
}
const ms = performance.now() - t0;
console.log(
  `  · ${QUERIES} next() in ${ms.toFixed(2)} ms (${((ms / QUERIES) * 1000).toFixed(3)} µs each), ${answered} answered`
);
// Generous against the 6 ms whole-sim budget on purpose: this is a regression guard for the
// caching, not a benchmark. A machine under load measures 2× what an idle one does, and the bug
// this catches was 20× — the moment a `Map` walk gets back into the hot path it fails here.
check('20k queries stay inside one tick budget', ms < 6, `${ms.toFixed(2)} ms`);

// ── 6. edits ─────────────────────────────────────────────────────────────────────────────────
const json = rt.serialize();
check('the save round-trips with paths in it', json === serializeWorld(deserializeWorld(json)));
rt.command({ type: 'entity:remove', seq: 1, payload: { id: 'path-avenue' } });
rt.tick();
check(
  'removing the only link cuts the gate off',
  api.stats().components > stats.components,
  `${stats.components} → ${api.stats().components}`
);
check('no runtime errors were posted', posted.filter((m) => m.type === 'error').length === 0);

// ── 7. junction geometry ─────────────────────────────────────────────────────────────────────
// Pure, so it runs here rather than in a browser: two crossing ribbons must produce one junction
// with a four-corner cap and a clip for each side. A cap with fewer than three corners is a hole.
const cross = [
  { id: 'a', form: 'path', style: 'promenade', width: 8, points: [0, -40, 0, 0, 0, 40] },
  { id: 'b', form: 'path', style: 'pavers', width: 4, points: [-40, 6, 0, 0, 40, -6] },
].map((d) =>
  buildLayout(
    { id: d.id, kind: 'path', pack: 'p', item: 'i', position: [0, 0, 0], yaw: 0, data: d },
    MESH_SPACING
  )
);
const junctions = findJunctions(cross);
check(
  'two crossing paths make exactly one junction',
  junctions.length === 1,
  String(junctions.length)
);
check(
  'the cap is a quadrilateral and both sides are clipped',
  junctions[0]?.cap.length === 4 &&
    junctions[0].clipForA.planes.length === 2 &&
    junctions[0].clipForB.planes.length === 2
);
check(
  'the cap is owned by the wider path',
  junctions[0]?.capMaterial === 'concrete-slab',
  junctions[0]?.capMaterial
);
// Near-parallel paths are a drafting mistake, not a junction: cutting there would remove tens of
// metres of both surfaces.
const parallel = [
  { id: 'c', form: 'path', style: 'promenade', width: 4, points: [0, 0, 100, 2] },
  { id: 'd', form: 'path', style: 'promenade', width: 4, points: [0, 2, 100, 0] },
].map((d) =>
  buildLayout(
    { id: d.id, kind: 'path', pack: 'p', item: 'i', position: [0, 0, 0], yaw: 0, data: d },
    MESH_SPACING
  )
);
check('a near-parallel overlap is not treated as a junction', findJunctions(parallel).length === 0);
check('GRAPH_SPACING is coarser than MESH_SPACING', GRAPH_SPACING > MESH_SPACING);

console.log(failures === 0 ? '✓ paths selftest' : `✗ paths selftest: ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
