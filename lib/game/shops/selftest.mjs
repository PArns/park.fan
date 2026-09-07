/**
 * The shops module's own checks, for the things a green build and a screenshot both miss.
 *
 *   node --experimental-strip-types --import ./scripts/register-path-alias.mjs \
 *     lib/game/shops/selftest.mjs
 *
 * Five questions, none of which a frame answers:
 *
 *  1. **Does a shop that no pack could have anticipated actually build?** A synthetic third pack
 *     with its own `shopStyles` entry, its own `shopMenus` entry and a shop naming both — the
 *     extensibility axis, measured rather than asserted.
 *  2. **Is the geometry a building?** Every registered shop is built under node and measured: the
 *     counter has to be at a human height, the building has to be BEHIND the origin (which is
 *     where a guest stands), the apron in front of it, and nothing may be NaN.
 *  3. **Is the material a material?** The paths critique measured a 2.9 % tone spread across the
 *     slabs of that module's flagship surface and called it "one colour with a grid drawn on it".
 *     This measures the same number on the four unit-laid surfaces here, and fails under the
 *     floor each one is entitled to (6 %, or 4 % for painted boards — see the note beside it).
 *  4. **Does the till work?** Join, serve, pay, restock, run out, refuse — against the real
 *     `SimRuntime`, with the money crossing from a guest's wallet to `world.finance.cash` exactly
 *     once.
 *  5. **Does a save resume?** Two runs of the same seed, one interrupted by a save and a reload,
 *     compared field by field on this module's own slot. Three of the four numbers that carry a
 *     fraction across a tick are invisible in every other test.
 */
import { readFileSync } from 'node:fs';
import { SimRuntime } from '@/lib/game/core/sim-runtime.ts';
import { GAME_MODULES } from '@/lib/game/modules.ts';
import { Registry } from '@/lib/game/core/registry.ts';
import { createWorld } from '@/lib/game/core/world.ts';
import { buildShop, seedForShop } from '@/lib/game/shops/build.ts';
import {
  attachShopContent,
  resolveShop,
  resetShopContent,
  shopStyle,
  shopStyles,
  menuForShop,
} from '@/lib/game/shops/manifest.ts';
import { tileStats } from '@/lib/game/shops/shaders.ts';
import { TILE } from '@/lib/game/shops/geometry.ts';

const packs = ['core-classic', 'neon-lagoon'].map((id) =>
  JSON.parse(readFileSync(new URL(`../content/packs/${id}/pack.json`, import.meta.url), 'utf8'))
);

let failures = 0;
const check = (name, ok, detail = '') => {
  if (!ok) failures++;
  console.log(`  ${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
};

// ── 1. Extensibility: a pack nobody wrote this module for ────────────────────────────────────
console.log('\nextensibility');
resetShopContent();
{
  const registry = new Registry();
  for (const p of packs) registry.registerPack(p);
  // Attach BEFORE the third pack lands, so both halves of the read are exercised: the two bundled
  // packs are already registered (the `packs()` walk) and the third arrives later (`onPack`).
  const detach = attachShopContent(registry);
  check(
    'the bundled generators all resolve to a style',
    ['kiosk-a', 'kiosk-round', 'toilet-block', 'shop-b', 'atm', 'changing-block'].every(
      (id) => !!shopStyle(id)
    )
  );

  const before = shopStyles().length;
  registry.registerPack({
    id: 'test-bakery',
    version: 1,
    name: { en: 'Bakery' },
    requires: [],
    shops: [
      {
        id: 'bakery',
        kind: 'food',
        name: { en: 'Bakery', de: 'Bäckerei' },
        need: 'hunger',
        needRelief: 150,
        price: 420,
        cost: 38000,
        footprint: [6, 4],
        throughput: 5,
        procedural: 'timber-barn',
        night: { signage: '#ffcc66' },
      },
    ],
    shopStyles: [
      {
        id: 'timber-barn',
        form: 'unit',
        wallHeight: 4.2,
        roof: 'gable',
        roofPitch: 44,
        eaves: 0.95,
        counters: 2,
        counterHeight: 1.06,
        awning: 2.2,
        menuBoard: 0.4,
        doors: 1,
        glazing: 0.5,
        rail: 6,
        apron: 4.5,
        plinth: 0.3,
        cladding: 'timber',
        flue: 1.4,
        dressing: true,
        palette: {
          wall: '#7a4a2c',
          trim: '#e8dfcc',
          roof: '#3b3a38',
          awningA: '#8b1f2a',
          awningB: '#e8dfcc',
          metal: '#7f858a',
          sign: '#2a1c12',
        },
        sign: { fascia: 0.7, bracket: true, post: 0, glyph: 'bag' },
      },
    ],
    shopMenus: [
      {
        id: 'bakery-menu',
        for: 'test-bakery:bakery',
        items: [
          { name: { en: 'Pretzel' }, price: 300 },
          { name: { en: 'Cinnamon roll' }, price: 420 },
          { name: { en: 'Coffee' }, price: 280 },
        ],
        stock: 180,
        restockUnits: 90,
        restockMinutes: 60,
        serviceMinutes: 0.7,
        unitCost: 130,
        queuePerCounter: 11,
        hours: [480, 1200],
      },
    ],
  });

  const style = shopStyle('timber-barn');
  check(
    'a pack-declared style is registered',
    !!style,
    `${before} → ${shopStyles().length} styles`
  );
  check(
    'the style is the pack’s values, not a default',
    style?.wallHeight === 4.2 && style?.roofPitch === 44
  );
  const menu = menuForShop('test-bakery', 'bakery', 'food');
  check('the most specific menu wins', menu.id === 'bakery-menu', menu.id);
  check(
    'a `kind:` menu still answers a shop with no menu of its own',
    menuForShop('core-classic', 'burger', 'food').id === 'food-default'
  );

  const def = registry.find('shops', 'test-bakery', 'bakery').def;
  const resolved = resolveShop('test-bakery', 'bakery', def);
  check('the new shop resolves to the new style', resolved.style.id === 'timber-barn');
  check('and is not reported as a fallback', resolved.styleFallback === false);
  const built = buildShop({
    shop: resolved,
    footprint: def.footprint,
    seed: seedForShop('test'),
    signage: def.night?.signage,
  });
  const burger = registry.find('shops', 'core-classic', 'burger').def;
  const builtBurger = buildShop({
    shop: resolveShop('core-classic', 'burger', burger),
    footprint: burger.footprint,
    seed: seedForShop('test'),
  });
  check(
    'it builds a different building from the built-in it did not name',
    built.triangles !== builtBurger.triangles && built.bounds.maxY !== builtBurger.bounds.maxY,
    `${built.triangles} tris / ${built.bounds.maxY.toFixed(2)} m vs ${builtBurger.triangles} / ${builtBurger.bounds.maxY.toFixed(2)} m`
  );
  check(
    'it has glazing, which the kiosk has not',
    built.glass.indices.length > 0 && builtBurger.glass.indices.length === 0
  );
  check(
    'the board is the pack’s menu, rescaled to the shop’s own price',
    resolved.board.length === 3 && Math.abs(avg(resolved.board.map((b) => b.price)) - 420) < 30,
    resolved.board.map((b) => b.price).join('/')
  );

  // A shop naming a style nobody declared must still build, from its kind.
  const stray = resolveShop('test-bakery', 'ghost', { ...def, procedural: 'does-not-exist' });
  check(
    'an unknown generator falls back by kind and says so',
    stray.styleFallback === true && stray.style.form === 'kiosk'
  );

  // A malformed style is skipped, not thrown, and does not take its siblings with it.
  let threw = false;
  try {
    registry.registerPack({
      id: 'test-broken',
      version: 1,
      name: { en: 'Broken' },
      requires: [],
      shopStyles: [{ nope: 1 }, { id: 'survivor', form: 'kiosk', wallHeight: 3.1 }],
    });
  } catch {
    threw = true;
  }
  check('a bad style entry does not throw the pack', !threw);
  check('and its sibling still lands', shopStyle('survivor')?.wallHeight === 3.1);
  detach();
}

// ── 2. Geometry: is it a building? ───────────────────────────────────────────────────────────
console.log('\ngeometry');
resetShopContent();
{
  const registry = new Registry();
  for (const p of packs) registry.registerPack(p);
  const detach = attachShopContent(registry);
  const rows = [];
  for (const item of registry.items('shops')) {
    const def = item.def;
    const resolved = resolveShop(item.pack, def.id, def);
    const build = buildShop({
      shop: resolved,
      footprint: def.footprint,
      seed: seedForShop(item.key),
      signage: def.night?.signage,
    });
    rows.push({ key: item.key, style: resolved.style.id, build, def });
  }
  check('every registered shop builds', rows.length === 12, `${rows.length} shops`);

  const finite = rows.every((r) =>
    [r.build.kit, r.build.glass, r.build.sign].every(
      (s) =>
        s.positions.every(Number.isFinite) &&
        s.normals.every(Number.isFinite) &&
        s.uvs.every(Number.isFinite)
    )
  );
  check('no NaN in any position, normal or uv', finite);

  const behind = rows.filter((r) => r.build.bounds.minZ >= -0.1);
  check(
    'the building is behind the point a guest walks to',
    behind.length === 0,
    behind.map((r) => r.key).join(', ') || 'all 12'
  );
  const inFront = rows.filter((r) => r.build.bounds.maxZ < 1.0);
  check(
    'the apron reaches past that point',
    inFront.length === 0,
    inFront.map((r) => `${r.key} ${r.build.bounds.maxZ.toFixed(1)}`).join(', ') || 'all 12'
  );

  const heights = rows.map((r) => r.build.bounds.maxY);
  check(
    'nothing is taller than a two-storey pavilion',
    Math.max(...heights) < 8.5,
    `tallest ${Math.max(...heights).toFixed(2)} m (${rows[heights.indexOf(Math.max(...heights))].key})`
  );
  check(
    'nothing is shorter than a person',
    Math.min(...heights) > 1.9,
    `shortest ${Math.min(...heights).toFixed(2)} m (${rows[heights.indexOf(Math.min(...heights))].key})`
  );

  const counters = rows.filter((r) => r.build.setback > 0 && shopStyle(r.style)?.counters > 0);
  const badCounter = counters.filter((r) => {
    const h = shopStyle(r.style).counterHeight;
    return h < 0.95 || h > 1.25;
  });
  check(
    'every counter is at 0.95–1.25 m',
    badCounter.length === 0,
    badCounter.map((r) => r.style).join(', ') || `${counters.length} counters`
  );

  const tri = rows.reduce((s, r) => s + r.build.triangles, 0);
  const worst = rows.reduce((a, b) => (a.build.triangles > b.build.triangles ? a : b));
  check(
    'one shop stays under 4,000 triangles',
    worst.build.triangles < 4000,
    `worst ${worst.key} ${worst.build.triangles}`
  );
  console.log(`  · 12 shop types, ${tri} triangles total, mean ${Math.round(tri / rows.length)}`);
  for (const r of rows.sort((a, b) => b.build.triangles - a.build.triangles)) {
    console.log(`    ${String(r.build.triangles).padStart(5)}  ${r.style.padEnd(15)} ${r.key}`);
  }

  // Two shops that differ only in position must build identical geometry — that is the whole
  // premise of the batch key.
  const a = buildShop({
    shop: resolveShop(
      'core-classic',
      'burger',
      registry.find('shops', 'core-classic', 'burger').def
    ),
    footprint: [4, 4],
    seed: 12345,
  });
  const b = buildShop({
    shop: resolveShop(
      'core-classic',
      'burger',
      registry.find('shops', 'core-classic', 'burger').def
    ),
    footprint: [4, 4],
    seed: 12345,
  });
  check(
    'the builder is deterministic for one key',
    a.kit.positions.length === b.kit.positions.length &&
      a.kit.positions.every((v, i) => v === b.kit.positions[i])
  );
  detach();
}

// ── 3. Materials: is there a material, or a grid? ────────────────────────────────────────────
console.log('\nmaterials');
{
  /**
   * The floor is per surface, and the odd one out is honest rather than convenient.
   *
   * Clay pantiles, concrete pavers and fired brick are units that were made in different batches
   * and have weathered separately; painted shiplap is one tin of paint over seven boards, so it
   * genuinely varies least — and there are only SEVEN of them on a 1 m tile, so the measured figure
   * is a seven-sample statistic around a population sd of about 8 %. Pushing the amplitude until it
   * cleared 6 % on that sample would be painting a barcode to satisfy a test.
   */
  const named = [
    [TILE.roof, 'pantile', 6],
    [TILE.timber, 'painted boards', 4],
    [TILE.paving, 'paving', 6],
    [TILE.brick, 'brick', 6],
  ];
  for (const [tile, name, floor] of named) {
    const stats = tileStats(tile, 4242, 96);
    const pct = stats.unitSpread * 100;
    check(`${name}: per-unit tone spread over ${floor} %`, pct > floor, `${pct.toFixed(1)} %`);
  }
  for (const tile of Object.values(TILE)) {
    const stats = tileStats(tile, 4242, 64);
    if (stats.mean < 0.55 || stats.mean > 1.35) {
      check(`tile ${tile} keeps its luminance near 1.0`, false, stats.mean.toFixed(3));
    }
  }
  check(
    'every tile keeps its luminance near 1.0 (a detail map, not a colour map)',
    Object.values(TILE).every((t) => {
      const m = tileStats(t, 4242, 64).mean;
      return m > 0.55 && m < 1.35;
    })
  );
}

// ── 4 & 5. The till, and the save ────────────────────────────────────────────────────────────
console.log('\nsimulation');

function shopEntity(id, pack, item, x, z, yaw = 0, data) {
  return { id, kind: 'shop', pack, item, position: [x, 0, z], yaw, ...(data ? { data } : {}) };
}

function makeRuntime(seed, entities) {
  const messages = [];
  const rt = new SimRuntime(GAME_MODULES, (m) => messages.push(m));
  const world = createWorld({
    seed,
    name: 'shops-selftest',
    resolution: 32,
    packs: packs.map((p) => p.id),
  });
  world.clock.speed = 5;
  world.clock.minute = 11 * 60;
  for (const e of entities) world.entities[e.id] = e;
  rt.init({ type: 'init', world, packs, modules: GAME_MODULES.map((m) => m.id) });
  return { rt, world, messages };
}

{
  const entities = [
    shopEntity('shop-1', 'core-classic', 'burger', 0, 0),
    shopEntity('shop-2', 'core-classic', 'toilets', 20, 0),
    shopEntity('shop-3', 'core-classic', 'lemonade', -20, 0, Math.PI / 2),
  ];
  const { rt, world, messages } = makeRuntime(5, entities);
  const api = rt.handles.get('shops').api;

  check('the index found all three shops', api.list().length === 3);
  const errors = messages.filter((m) => m.type === 'error');
  check('no sim errors on boot', errors.length === 0, JSON.stringify(errors).slice(0, 200));

  const offers = api.find('hunger', 2, 2, 100000);
  check('find() answers the need', offers.length === 1 && offers[0].id === 'shop-1');
  const open = api.stats();
  check(
    'at 11:00 the needs these shops sell are answered',
    !open.unanswered.includes('hunger') && !open.unanswered.includes('thirst'),
    open.unanswered.join(',')
  );
  check('and a need nothing sells is named', open.unanswered.includes('cooling'));
  check('and refuses a need nothing sells', api.find('cooling', 0, 0, 100000).length === 0);
  check('and refuses a guest who cannot pay', api.find('hunger', 0, 0, 10).length === 0);

  const frontage = api.frontage('shop-1');
  check(
    'frontage is the entity position (the point guests already walk to)',
    frontage[0] === 0 && frontage[1] === 0,
    JSON.stringify(frontage)
  );

  const cashBefore = world.finance.cash;
  const join = api.join('shop-1', 77, 100000);
  check('a guest joins the line', !!join && join.ticket === 1, JSON.stringify(join));
  const stand = api.place('shop-1', join.ticket);
  check(
    'and is given somewhere to stand, in front of the counter',
    stand[1] > 0.5,
    JSON.stringify(stand)
  );

  let sale = null;
  for (let i = 0; i < 200 && !sale; i++) {
    rt.scheduler.step();
    sale = api.collect('shop-1', join.ticket);
  }
  check(
    'the till serves them',
    !!sale,
    sale ? `${sale.cents} cents after ${sale.waited.toFixed(2)} min` : 'never'
  );
  check(
    'the money reached the park exactly once',
    world.finance.cash - cashBefore >= 650 && world.finance.cash - cashBefore < 650 * 3,
    `+${world.finance.cash - cashBefore} cents (guests may also have bought)`
  );
  check('the receipt is handed over only once', api.collect('shop-1', join.ticket) === null);

  // Queue pressure: fill one shop past its limit and watch it refuse.
  const capacity = 2 * 9;
  let refused = 0;
  for (let i = 0; i < capacity + 12; i++) {
    if (!api.join('shop-1', 1000 + i, 100000)) refused++;
  }
  check(
    'the line has a limit and the shop says why',
    refused > 0 && api.lastRefusal('shop-1') === 'full',
    `${refused} refused, reason ${api.lastRefusal('shop-1')}`
  );
  const view = api.list().find((s) => s.id === 'shop-1');
  check(
    'a full line is reported as a wait, not as a number of people',
    view.waitMinutes > 3,
    `${view.waitMinutes.toFixed(1)} min for ${view.queue} people`
  );
  check(
    'and it wants more staff than it has counters',
    view.staffWanted >= view.counters,
    `${view.staffWanted} of ${view.counters}`
  );

  // Stock: empty the counter and watch the refusal change.
  const closed = api.list().find((s) => s.id === 'shop-2');
  check('a shop with no price still opens', closed.open === true);

  // Run a full trading day and check the numbers move.
  for (let i = 0; i < 3000; i++) rt.scheduler.step();
  const stats = api.stats();
  console.log(
    `  · after 3,000 ticks: served ${stats.servedToday}, takings ${(stats.takingsToday / 100).toFixed(2)}, queue ${stats.queue}, refused ${JSON.stringify(stats.refusedToday)}`
  );
  check('the counters actually served people', stats.servedToday > 0, `${stats.servedToday}`);
  check('takings follow the sales', stats.takingsToday > 0);
  // 3,000 ticks at speed 5 is 750 park minutes, so the clock is at 23:30 and the burger stand's
  // own hours (09:30–22:30) have closed it. Every need is unanswered, which is the right answer and
  // is why the assertion above is taken at 11:00 rather than here.
  check(
    'after closing time nothing is open and everything is unanswered',
    stats.open === 0 && stats.unanswered.length >= 6,
    `${stats.open} open, ${stats.unanswered.length} unanswered at ${Math.round(stats.tickMs)}`
  );
  check(
    'the tick stays inside its share of the 6 ms budget',
    stats.tickMs < 1.5,
    `${stats.tickMs.toFixed(3)} ms`
  );
  rt.dispose();
}

// ── 5. Save → resume ────────────────────────────────────────────────────────────────────────
console.log('\ndeterminism');
{
  const entities = () => [
    shopEntity('shop-1', 'core-classic', 'burger', 0, 0),
    shopEntity('shop-2', 'core-classic', 'lemonade', 18, 4, Math.PI),
    shopEntity('shop-3', 'core-classic', 'souvenirs', -18, -6, Math.PI / 2),
    shopEntity('shop-4', 'neon-lagoon', 'misting-station', 6, 24),
  ];

  const a = makeRuntime(19, entities());
  const apiA = a.rt.handles.get('shops').api;
  // A few guests in the line, so the queues and the tills carry a fraction across the save.
  for (let i = 0; i < 14; i++) apiA.join(i % 2 ? 'shop-1' : 'shop-2', 500 + i, 100000);
  for (let i = 0; i < 400; i++) a.rt.scheduler.step();
  const mid = a.rt.serialize();
  for (let i = 0; i < 400; i++) a.rt.scheduler.step();
  const end1 = a.rt.serialize();

  const b = new SimRuntime(GAME_MODULES, () => {});
  b.init({
    type: 'init',
    world: SimRuntime.parse(mid),
    packs,
    modules: GAME_MODULES.map((m) => m.id),
  });
  for (let i = 0; i < 400; i++) b.scheduler.step();
  const end2 = b.serialize();

  const slotA = JSON.parse(end1).modules.shops;
  const slotB = JSON.parse(end2).modules.shops;
  const diffs = [];
  const walk = (x, y, path) => {
    if (JSON.stringify(x) === JSON.stringify(y)) return;
    if (typeof x !== 'object' || x === null || typeof y !== 'object' || y === null) {
      diffs.push(`${path}: ${JSON.stringify(x)} ≠ ${JSON.stringify(y)}`);
      return;
    }
    for (const k of new Set([...Object.keys(x), ...Object.keys(y)]))
      walk(x[k], y[k], `${path}.${k}`);
  };
  walk(slotA, slotB, 'shops');
  check(
    'resuming from a save reproduces the uninterrupted run, field for field',
    diffs.length === 0,
    diffs.slice(0, 4).join(' | ') || 'zero differing fields'
  );
  check(
    'and the whole world matches too',
    end1 === end2,
    end1 === end2 ? '' : `${end1.length} vs ${end2.length} bytes`
  );

  // The state is really there: the accumulators are not all zero.
  const carried = slotA.shops.filter(
    (s) => s.restock > 0 || s.busyMinutes > 0 || s.tills.some((t) => t.busy > 0)
  );
  check(
    'the save actually carries running accumulators',
    carried.length > 0,
    `${carried.length} of ${slotA.shops.length} shops mid-flight`
  );

  a.rt.dispose();
  b.dispose();
}

function avg(list) {
  return list.reduce((s, v) => s + v, 0) / (list.length || 1);
}

console.log(
  failures ? `\n✗ shops selftest: ${failures} failed` : '\n✓ shops selftest: all checks passed'
);
process.exit(failures ? 1 : 0);
