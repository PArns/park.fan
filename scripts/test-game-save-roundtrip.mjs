/**
 * Save → load → save must be byte-identical, NaN must be refused, and the sim runtime must run
 * deterministically for the same seed (two runtimes, 200 ticks, identical serialisation).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createWorld, serializeWorld, deserializeWorld } from '@/lib/game/core/world.ts';
import { SimRuntime } from '@/lib/game/core/sim-runtime.ts';
import { GAME_MODULES } from '@/lib/game/modules.ts';
import { Rng } from '@/lib/game/core/rng.ts';

const packs = ['core-classic', 'neon-lagoon'].map((id) =>
  JSON.parse(
    readFileSync(new URL(`../lib/game/content/packs/${id}/pack.json`, import.meta.url), 'utf8')
  )
);

// 1. round trip on a shaped world
const w = createWorld({
  seed: 42,
  name: 'roundtrip',
  resolution: 32,
  packs: packs.map((p) => p.id),
});
const rng = new Rng(42);
for (let i = 0; i < w.terrain.heights.length; i++) w.terrain.heights[i] = rng.range(-3, 9);
for (let i = 0; i < w.terrain.paint.length; i++) w.terrain.paint[i] = rng.int(0, 4);
w.entities['scenery-1'] = {
  id: 'scenery-1',
  kind: 'scenery',
  pack: 'core-classic',
  item: 'bench-wood',
  position: [1, 0, 2],
  yaw: 0.5,
};
w.entities['ride-7'] = {
  id: 'ride-7',
  kind: 'ride',
  pack: 'core-classic',
  item: 'carousel',
  position: [10, 0, -4],
  yaw: 0,
  data: { z: 1, a: [1, 2] },
};
w.modules.custom = { b: 2, a: { y: 1, x: [3, 2] } };
const json1 = serializeWorld(w);
const back = deserializeWorld(json1);
const json2 = serializeWorld(back);
assert.equal(json1, json2, 'serialize(load(serialize(w))) must equal serialize(w)');
assert.equal(back.terrain.heights[5], w.terrain.heights[5]);
assert.equal(Object.keys(back.entities).length, 2);

// 2. NaN is refused
w.terrain.heights[3] = NaN;
assert.throws(() => serializeWorld(w), /finite/);
w.terrain.heights[3] = 0;
w.modules.bad = { v: Infinity };
assert.throws(() => serializeWorld(w), /NaN|Infinity/);
delete w.modules.bad;

// 3. determinism: two runtimes, same seed, same commands, same result
function run(seed) {
  const messages = [];
  const rt = new SimRuntime(GAME_MODULES, (m) => messages.push(m));
  const world = createWorld({ seed, resolution: 16, packs: packs.map((p) => p.id) });
  world.clock.speed = 5;
  rt.init({ type: 'init', world, packs, modules: GAME_MODULES.map((m) => m.id) });
  rt.command({
    type: 'terrain:brush',
    seq: 1,
    payload: { shape: 'raise', x: 10, z: 10, radius: 30, strength: 2 },
  });
  rt.command({
    type: 'entity:add',
    seq: 2,
    payload: {
      id: 'scenery-1',
      kind: 'scenery',
      pack: 'core-classic',
      item: 'bench-wood',
      position: [0, 0, 0],
      yaw: 0,
    },
  });
  for (let i = 0; i < 200; i++) rt.scheduler.step();
  const ready = messages.find((m) => m.type === 'ready');
  assert.ok(ready, 'runtime must report ready');
  assert.deepEqual(ready.failed, [], `no sim module may fail: ${ready.failed}`);
  const errors = messages.filter((m) => m.type === 'error');
  assert.deepEqual(errors, [], `no sim errors: ${JSON.stringify(errors)}`);
  const out = rt.serialize();
  rt.dispose();
  return out;
}
const a = run(7);
const b = run(7);
assert.equal(a, b, 'same seed + same commands must serialise identically');
const c = run(8);
assert.notEqual(a, c, 'a different seed must produce a different world');

// 4. loading a save and continuing equals never having saved
{
  const rtA = new SimRuntime(GAME_MODULES, () => {});
  const worldA = createWorld({ seed: 11, resolution: 16, packs: packs.map((p) => p.id) });
  worldA.clock.speed = 5;
  rtA.init({ type: 'init', world: worldA, packs, modules: GAME_MODULES.map((m) => m.id) });
  for (let i = 0; i < 100; i++) rtA.scheduler.step();
  const mid = rtA.serialize();
  for (let i = 0; i < 100; i++) rtA.scheduler.step();
  const end1 = rtA.serialize();

  const rtB = new SimRuntime(GAME_MODULES, () => {});
  rtB.init({
    type: 'init',
    world: SimRuntime.parse(mid),
    packs,
    modules: GAME_MODULES.map((m) => m.id),
  });
  for (let i = 0; i < 100; i++) rtB.scheduler.step();
  const end2 = rtB.serialize();
  // The command log and the clock are part of the save, so both paths must agree exactly.
  assert.equal(end1, end2, 'resuming from a save must reproduce the uninterrupted run');
}

console.log('✓ game save round-trip, NaN guard, determinism, resume');
