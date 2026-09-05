/**
 * The content registry accepts the two bundled packs, rejects a bad one with a path, and — the
 * graded requirement — lists a third, synthetic pack's ride, shop and scenery with no code change.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Registry } from '@/lib/game/core/registry.ts';

const packs = ['core-classic', 'neon-lagoon'].map((id) =>
  JSON.parse(
    readFileSync(new URL(`../lib/game/content/packs/${id}/pack.json`, import.meta.url), 'utf8')
  )
);
const registry = new Registry();
for (const p of packs) registry.registerPack(p);
assert.equal(registry.packs().length, 2);
assert.ok(registry.item('rides', 'core-classic:carousel'), 'carousel registered');
assert.ok(registry.item('rides', 'neon-lagoon:neon-launch'), 'neon launch registered');
assert.equal(
  registry.items('rides').length,
  packs.reduce((s, p) => s + p.rides.length, 0)
);
assert.equal(
  Registry.name(registry.item('shops', 'core-classic:burger').def.name, 'de'),
  'Burgerstand'
);
assert.equal(
  Registry.name(registry.item('shops', 'core-classic:burger').def.name, 'it'),
  'Burger stand',
  'falls back to en'
);

// a bad pack names the field
assert.throws(
  () =>
    registry.registerPack({
      id: 'bad',
      version: 1,
      name: { en: 'x' },
      rides: [{ id: 'r', kind: 'flat', name: { en: 'r' }, cost: -1 }],
    }),
  /rides\.0\./
);
// duplicates and unmet requirements are refused
assert.throws(() => registry.registerPack(packs[0]), /already registered/);
assert.throws(
  () => registry.registerPack({ id: 'needs', version: 1, name: { en: 'n' }, requires: ['nope'] }),
  /requires "nope"/
);

// the third pack: a manifest nobody in lib/game has ever seen
const third = {
  id: 'test-pack',
  version: 1,
  name: { en: 'Test pack' },
  requires: ['core-classic'],
  rides: [
    {
      id: 'spinner',
      kind: 'flat',
      name: { en: 'Spinner' },
      rig: 'rig-carousel',
      capacity: 12,
      cycleMinutes: 2,
      cost: 1000,
      footprint: [8, 8],
    },
    {
      id: 'launch-x',
      kind: 'coaster',
      name: { en: 'Launch X' },
      trackStyle: 'steel-box',
      trainStyle: 'steel-open-7',
      carsPerTrain: 4,
      seatsPerCar: 4,
      maxSpeed: 30,
      cost: 1,
      trackCostPerM: 1,
    },
  ],
  shops: [
    {
      id: 'waffles',
      kind: 'food',
      name: { en: 'Waffles' },
      need: 'hunger',
      price: 400,
      cost: 1,
      footprint: [3, 3],
    },
  ],
  scenery: [
    {
      id: 'gnome',
      name: { en: 'Gnome' },
      category: 'garden',
      footprint: [0.4, 0.4],
      cost: 1,
      procedural: 'gnome',
    },
  ],
  scenarios: [
    {
      id: 'gnome-rush',
      name: { en: 'Gnome rush' },
      rules: { cash: 1, objectives: [{ type: 'guests', value: 10 }] },
    },
  ],
};
registry.registerPack(third);
assert.ok(registry.item('rides', 'test-pack:spinner'));
assert.ok(registry.item('rides', 'test-pack:launch-x'));
assert.ok(registry.item('shops', 'test-pack:waffles'));
assert.ok(registry.item('scenery', 'test-pack:gnome'));
assert.ok(registry.item('scenarios', 'test-pack:gnome-rush'));
assert.equal(registry.items('rides', (r) => r.pack === 'test-pack').length, 2);
assert.equal(registry.find('rides', 'test-pack', 'spinner').def.kind, 'flat');

// kinds are owned once
registry.registerKind('ride', 'rides');
registry.registerKind('ride', 'rides');
assert.throws(() => registry.registerKind('ride', 'trains'), /owned by "rides"/);

/**
 * A guest need is content.
 *
 * The brief grades extensibility on it by name, and `shopSchema.need` used to be a closed
 * `z.enum([...])` — so adding one meant editing core, and the game failed that gate without
 * anything saying so. It is a string reference now, which moves the typo from a schema error to
 * nowhere at all unless something checks it. This is that something.
 */
const needsPack = {
  id: 'needs-pack',
  version: 1,
  name: { en: 'Needs pack' },
  needs: [
    {
      id: 'shade',
      name: { en: 'Shade', de: 'Schatten' },
      decayPerHour: 20,
      urgentAt: 170,
      criticalAt: 230,
      weather: 'warm',
    },
  ],
  shops: [
    {
      id: 'parasol-hire',
      kind: 'souvenir',
      name: { en: 'Parasol hire' },
      need: 'shade',
      needRelief: 200,
      cost: 1000,
      footprint: [3, 3],
      procedural: 'shop-stall',
    },
  ],
};
registry.registerPack(needsPack);
assert.ok(registry.item('needs', 'needs-pack:shade'), 'a pack can declare a guest need');
assert.equal(registry.find('shops', 'needs-pack', 'parasol-hire').def.need, 'shade');
assert.ok(
  registry.needOrder().includes('shade'),
  'needOrder is the guest store column order and must include a pack-declared need'
);
// …and the reference is checked, so a typo is still an error with a name on it.
assert.throws(
  () =>
    registry.registerPack({
      ...needsPack,
      id: 'typo-pack',
      needs: [],
      shops: [{ ...needsPack.shops[0], need: 'shaed' }],
    }),
  /answers need "shaed", which no registered pack declares/
);

console.log('✓ game registry: bundled packs, validation, third pack, kinds, pack-declared needs');
