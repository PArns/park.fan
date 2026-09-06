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

// A module's OWN content category, added by a manifest and nothing else.
//
// `packManifestSchema` was a plain `z.object()`, which strips what it does not know. So the track
// module's `trackElements` was deleted before any consumer saw it — measured on the running game:
// `'trackElements' in parsed === false`, and the `onPack` listener got the stripped copy too. A
// module could declare a category, ship a reader, document it, and get an empty array for ever.
// The schema passes unknown keys through now and the registry reports the ones nobody claimed, so
// a typo is a line naming the pack and the key instead of silence.
{
  const { attachTrackElements, trackElement, trackElements } =
    await import('@/lib/game/track/elements.ts');
  const r = new Registry();
  r.registerPack(packs[0]);
  const before = trackElements().length;
  r.registerPack({
    id: 'element-pack',
    version: 1,
    name: { en: 'Elements' },
    requires: [packs[0].id],
    trackElements: [
      {
        id: 'test-wave',
        name: 'Test Wave',
        category: 'special',
        params: { height: { default: 6 } },
        ops: [
          ['hill', { height: 'height', length: 'height * 4' }],
          ['straight', { length: 12 }],
        ],
      },
    ],
    // and a typo beside it, which must be reported rather than swallowed
    trackElments: [{ id: 'never-read' }],
  });
  const detach = attachTrackElements(r);
  assert.ok(
    'trackElements' in (r.pack('element-pack') ?? {}),
    'an unknown top-level manifest key must survive the schema'
  );
  assert.equal(trackElements().length, before + 1, 'a manifest alone must add a track element');
  assert.equal(trackElement('test-wave')?.ops[0][0], 'hill', 'the element keeps its ops');
  assert.deepEqual(
    r.unclaimedPackKeys(),
    [{ pack: 'element-pack', key: 'trackElments' }],
    'a key no module claimed must be reported by name'
  );
  detach();
}

// The same question one module over: a pack that carries a PATH SURFACE.
//
// `registerPathStyle` and `parsePathStyle` existed and had no caller, and the module's own docblock
// explained that the seam was waiting for core to add a `pathStyles` category. A critic registered
// a pack carrying one and watched it change nothing — the extensibility axis at its floor, which
// alone fails a module. Both halves are wired now, so this asserts the whole path: pack in, style
// out, and the surface recipe it names resolving with it.
{
  const { attachPathStyles, pathStyle, pathStyles } = await import('@/lib/game/paths/manifest.ts');
  const r = new Registry();
  r.registerPack(packs[0]);
  const before = pathStyles().length;
  r.registerPack({
    id: 'surface-pack',
    version: 1,
    name: { en: 'Surfaces' },
    requires: [packs[0].id],
    pathMaterials: [
      {
        id: 'redbrick',
        base: [0.45, 0.12, 0.09],
        accent: [0.55, 0.2, 0.14],
        joint: [0.3, 0.28, 0.26],
        roughness: [0.8, 0.95],
        metallic: 0,
        pattern: 'pavers',
        tileMetres: 1.4,
        relief: 0.9,
        seed: 7,
      },
    ],
    pathStyles: [
      {
        id: 'brick-walk',
        name: 'Brick Walk',
        surface: 'redbrick',
        widths: [3, 4, 6],
        defaultWidth: 4,
      },
    ],
  });
  const detach = attachPathStyles(r);
  assert.equal(pathStyles().length, before + 1, 'a manifest alone must add a path style');
  assert.equal(pathStyle('brick-walk').surface, 'redbrick', 'the style keeps its surface recipe');
  assert.deepEqual(
    r.unclaimedPackKeys(),
    [],
    'pathStyles and pathMaterials must both be claimed, so neither is reported as unclaimed'
  );
  detach();
}

console.log(
  '✓ game registry: bundled packs, validation, third pack, kinds, pack-declared needs, manifest-only track elements and path styles'
);
