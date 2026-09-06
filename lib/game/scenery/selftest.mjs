/**
 * Scenery self-test. Run it with
 *
 *   node --experimental-strip-types --import ./scripts/register-path-alias.mjs \
 *        lib/game/scenery/selftest.mjs
 *
 * It covers the three things a green build cannot show: the extensibility gate (a new manifest
 * entry becomes a working prop with no code change), determinism (the same seed puts the same
 * bench in the same square millimetre), and the scatter field's order independence (the renderer
 * and the simulation evaluate it from different directions and have to agree).
 *
 * Only the Babylon-free half of the module is exercised, which is the half the worker loads.
 * `pnpm test:game` does not know about this file — adding it to `package.json` is a core change,
 * and the request for that is in `docs/game/requests/scenery.md`.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Registry } from '@/lib/game/core/registry.ts';
import { buildCatalog, GENERATORS, resolveGenerator } from '@/lib/game/scenery/catalog.ts';
import { placeLine, placeSingle, scatterBrush } from '@/lib/game/scenery/placement.ts';
import { defaultSpecies, evaluateScatter } from '@/lib/game/scenery/scatter.ts';

const implemented = new Set(GENERATORS);
let checks = 0;
const ok = (label) => {
  checks += 1;
  process.stdout.write(`  ✓ ${label}\n`);
};

// ── 1. Generator resolution, one assertion per step of the chain ───────────────────────────
assert.deepEqual(resolveGenerator({ procedural: 'bench' }), {
  generator: 'bench',
  fallback: false,
});
ok('an exact generator name resolves to itself');

assert.deepEqual(resolveGenerator({ procedural: 'lamp-art-deco' }), {
  generator: 'lamp-victorian',
  fallback: true,
});
ok('an unknown name falls back to its family (lamp-art-deco → lamp)');

assert.deepEqual(resolveGenerator({ procedural: 'wossname', furniture: 'bin' }), {
  generator: 'bin',
  fallback: true,
});
ok('`furniture` resolves a name nothing else matched');

assert.deepEqual(resolveGenerator({ foliageKind: 'conifer' }), {
  generator: 'tree-conifer',
  fallback: true,
});
ok('a foliage kind resolves without any `procedural` at all');

assert.deepEqual(resolveGenerator({ category: 'fence' }), {
  generator: 'fence-iron',
  fallback: true,
});
ok('a scenery category resolves as the last named step');

assert.deepEqual(resolveGenerator({ procedural: 'quux' }), {
  generator: 'marker',
  fallback: true,
});
ok('nothing matching lands on the marker, flagged as a fallback');

// ── 2. Every shipped pack entry resolves to an implemented generator ───────────────────────
const registry = new Registry();
for (const id of ['core-classic', 'neon-lagoon']) {
  registry.registerPack(
    JSON.parse(readFileSync(new URL(`../content/packs/${id}/pack.json`, import.meta.url), 'utf8'))
  );
}
const catalog = buildCatalog(registry);
const packEntries = [...catalog.values()].filter((s) => s.source !== 'ambient');
assert.ok(packEntries.length >= 16, `expected the two packs' props, got ${packEntries.length}`);
for (const spec of packEntries) {
  assert.ok(implemented.has(spec.generator), `${spec.key} → ${spec.generator} is not implemented`);
  assert.equal(spec.fallback, false, `${spec.key} should not need the fallback chain`);
}
ok(`all ${packEntries.length} shipped scenery and foliage entries resolve without a fallback`);

// ── 3. The extensibility gate: a new manifest entry, no code change ────────────────────────
registry.registerPack({
  id: 'test-extra',
  version: 1,
  name: { en: 'Extra' },
  requires: [],
  scenery: [
    {
      // Names a generator that exists: the intended path for new content.
      id: 'bench-long',
      name: { en: 'Long bench' },
      category: 'path-furniture',
      footprint: [3.6, 0.7],
      height: 1.1,
      cost: 5000,
      procedural: 'bench',
      furniture: 'bench',
    },
    {
      // Names one that does not: the fallback chain has to carry it.
      id: 'lamp-deco',
      name: { en: 'Deco lamp' },
      category: 'path-furniture',
      footprint: [0.5, 0.5],
      height: 4.4,
      cost: 14000,
      procedural: 'lamp-art-deco',
      furniture: 'lamp',
      night: { light: { color: '#ffe0b0', intensity: 11, height: 4.1, range: 16 } },
    },
  ],
  foliage: [
    {
      id: 'birch',
      name: { en: 'Birch' },
      kind: 'broadleaf',
      procedural: 'tree-broadleaf',
      lod: [45, 130, 320],
      height: 9,
      cost: 3000,
    },
  ],
});
const extended = buildCatalog(registry);

const longBench = extended.get('test-extra:bench-long');
assert.ok(longBench, 'the new bench is in the catalogue');
assert.equal(longBench.generator, 'bench');
assert.equal(longBench.fallback, false);
// The generator is driven by the entry's own numbers, or a second manifest entry would just be a
// copy of the first — which is what would make the gate meaningless.
assert.deepEqual(longBench.footprint, [3.6, 0.7]);
assert.equal(longBench.height, 1.1);
assert.equal(longBench.furniture, 'bench');
ok('a new scenery entry naming an existing generator needs no code');

const decoLamp = extended.get('test-extra:lamp-deco');
assert.ok(decoLamp);
assert.equal(decoLamp.generator, 'lamp-victorian');
assert.equal(decoLamp.fallback, true, 'and it says so, so main() can warn once');
assert.equal(decoLamp.night?.intensity, 11);
assert.equal(decoLamp.night?.height, 4.1);
ok('a new scenery entry naming an unknown generator still draws, flagged as a fallback');

const birch = extended.get('test-extra:birch');
assert.ok(birch);
assert.equal(birch.cls, 'foliage');
assert.deepEqual(birch.lod, [45, 130, 320]);
assert.ok(birch.clearance > 1.5, 'a 9 m broadleaf keeps more than a 9 m footprint clear');
ok('a new foliage entry brings its own LOD distances and crown clearance');

// ── 4. Determinism ─────────────────────────────────────────────────────────────────────────
const oak = catalog.get('core-classic:oak');
assert.ok(oak);

/** The same little generator the module's `Rng` stands in for here. */
const stream = (seed) => {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

const runA = scatterBrush(oak, 12, -30, 18, stream(4242), { density: 8 });
const runB = scatterBrush(oak, 12, -30, 18, stream(4242), { density: 8 });
assert.ok(runA.length > 3, `expected a stand of trees, got ${runA.length}`);
assert.deepEqual(runA, runB);
ok(`scatterBrush is deterministic (${runA.length} trees, identical to the metre)`);

const runC = scatterBrush(oak, 12, -30, 18, stream(4243), { density: 8 });
assert.notDeepEqual(runA, runC);
ok('and a different seed gives a different stand');

// Poisson spacing actually holds.
for (let i = 0; i < runA.length; i++) {
  for (let j = i + 1; j < runA.length; j++) {
    const d = Math.hypot(runA[i].x - runA[j].x, runA[i].z - runA[j].z);
    assert.ok(d >= oak.clearance - 1e-6, `two oaks ${d.toFixed(2)} m apart`);
  }
}
ok('no two scattered props are closer than the species clearance');

const bench = catalog.get('core-classic:bench-wood');
const line = placeLine(bench, [0, 0], [0, 20], stream(7), { spacing: 4, facing: 'across' });
assert.equal(line.length, 6);
assert.equal(line[line.length - 1].z, 20, 'the run ends where it was asked to end');
ok('placeLine spans its endpoints exactly');

const single = placeSingle(bench, 3, 4, stream(9));
assert.equal(single.yaw, 0, 'a manufactured prop keeps the yaw the tool gave it');
const boulder = catalog.get('ambient:rock-boulder');
assert.ok(placeSingle(boulder, 3, 4, stream(9)).yaw !== 0, 'a boulder is turned at random');
ok('yaw follows the class: furniture is placed, nature is turned');

// ── 5. The scatter field is addressed, not sequenced ───────────────────────────────────────
const flat = {
  bounds: [-40, -40, 40, 40],
  seed: 90210,
  species: defaultSpecies(catalog),
  densityScale: 1,
  height: () => 0,
  paint: () => 0,
  slope: () => 0,
  waterLevel: -2,
};
assert.ok(flat.species.length >= 4, 'the default mix has its species');
const whole = evaluateScatter(flat);
assert.ok(whole.length > 100, `expected a dressed field, got ${whole.length}`);

const left = evaluateScatter({ ...flat, bounds: [-40, -40, 0, 40] });
const right = evaluateScatter({ ...flat, bounds: [0, -40, 40, 40] });
const key = (i) => `${i.key}|${i.x.toFixed(4)}|${i.z.toFixed(4)}`;
const halves = new Set([...left, ...right].map(key));
const full = new Set(whole.map(key));
for (const k of full) assert.ok(halves.has(k), `${k} vanished when the field was split`);
ok(
  `evaluateScatter is order independent (${whole.length} instances, ` +
    `${halves.size} across two halves)`
);

const again = evaluateScatter(flat);
assert.deepEqual(whole, again);
ok('and repeatable for one seed');

const other = evaluateScatter({ ...flat, seed: 90211 });
assert.notDeepEqual(whole.map(key), other.map(key));
ok('a different seed dresses the same ground differently');

// Nothing grows on the concrete.
const paved = evaluateScatter({ ...flat, paint: () => 5 });
assert.equal(paved.length, 0);
ok('nothing is scattered on a paved surface');

// Nothing grows under water.
const flooded = evaluateScatter({ ...flat, height: () => -5 });
assert.equal(flooded.length, 0);
ok('nothing is scattered below the water table');

console.log(`\n✓ scenery self-test: ${checks} checks passed`);
