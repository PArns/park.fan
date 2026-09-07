/**
 * Unit tests for everything in this module a screenshot cannot show.
 *
 *   node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/tools/selftest.mjs
 *
 * A `.mjs` next to the code rather than a `scripts/test-game-*.mjs`, for the reason `camera`,
 * `paths`, `track` and `shops` all give: these checks are about this module's internals and a
 * builder may not edit `package.json`. The request to wire it into `pnpm test:game` is in
 * `docs/game/requests/tools.md`.
 *
 * What is worth testing here is what a red or green ghost cannot argue about: whether the rule
 * behind the colour is the right rule, whether undo really is the inverse of what was done, and —
 * the graded one — whether the palette is genuinely derived from the registry, including for a pack
 * registered before this module was attached and for one registered after.
 *
 * Everything imported is pure: no Babylon, no DOM, no React.
 */

import { readFileSync } from 'node:fs';
import { Registry } from '@/lib/game/core/registry.ts';
import {
  pointInRect,
  rectCorners,
  rectsOverlap,
  snapAngle,
  snapPoint,
  snapValue,
  wrapAngle,
} from '@/lib/game/tools/snap.ts';
import {
  DEFAULT_PLACEMENT_RULES,
  evaluatePlacement,
  pickEntityAt,
  samplePoints,
} from '@/lib/game/tools/placement.ts';
import { createHistory } from '@/lib/game/tools/history.ts';
import {
  attachPalette,
  buildPalette,
  findPaletteItem,
  firstPlaceable,
  footprintForItem,
  heightForItem,
  kindForItem,
  placementForItem,
} from '@/lib/game/tools/palette.ts';

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
    `${actual.toFixed(4)} vs ${expected.toFixed(4)} (±${tolerance})`
  );
}
const section = (name) => console.log(name);

const flat = { height: () => 0, waterLevel: () => -2 };
const rect = (x, z, sizeX, sizeZ, yaw = 0) => ({ x, z, yaw, sizeX, sizeZ });

// ── 1. snapping ───────────────────────────────────────────────────────────────────────────────
section('snapping');
{
  near(snapValue(3.13, 0.25), 3.25, 1e-9, '3.13 snaps up to 3.25');
  near(snapValue(-3.13, 0.25), -3.25, 1e-9, 'and symmetrically below zero');
  near(snapValue(7.7, 0), 7.7, 1e-9, 'a step of zero is free placement');
  near(snapValue(7.7, -1), 7.7, 1e-9, 'and so is a negative step');

  // The property the grid exists for: two snapped points a whole number of steps apart stay so.
  const a = snapValue(11.31, 0.25);
  const b = snapValue(12.31, 0.25);
  near(b - a, 1, 1e-9, 'two snapped points keep their whole-metre distance');

  const [sx, sz] = snapPoint(4.6, -9.12, 0.25);
  near(sx, 4.5, 1e-9, 'snapPoint x');
  near(sz, -9, 1e-9, 'snapPoint z rounds to the nearest quarter, not away from zero');

  near(snapAngle(0.2, 15), Math.PI / 12, 1e-9, '11.5° snaps to 15°');
  near(snapAngle(0.05, 15), 0, 1e-9, '2.9° snaps to 0');
  near(snapAngle((359 * Math.PI) / 180, 15), 0, 1e-9, '359° snaps to 0, not to 360');
  near(wrapAngle(-Math.PI / 2), (3 * Math.PI) / 2, 1e-9, 'a negative yaw wraps into [0, 2π)');
  near(wrapAngle(9 * Math.PI), Math.PI, 1e-9, 'and a much-turned one comes back inside');
}

// ── 2. rectangles, and the facing convention ──────────────────────────────────────────────────
section('rectangles');
{
  const corners = rectCorners(rect(0, 0, 2, 4));
  near(corners[0][0], -1, 1e-9, 'unrotated corner x');
  near(corners[0][1], -2, 1e-9, 'unrotated corner z');

  // The game's convention (`shops/showcase.ts`): facing = [sin yaw, cos yaw]. At yaw = π/2 the
  // item's local +Z points at +X, so a 2 × 4 rectangle becomes 4 wide in x.
  const turned = rectCorners(rect(0, 0, 2, 4, Math.PI / 2));
  const xs = turned.map((c) => c[0]);
  const zs = turned.map((c) => c[1]);
  near(Math.max(...xs) - Math.min(...xs), 4, 1e-9, 'a quarter turn swaps the sides');
  near(Math.max(...zs) - Math.min(...zs), 2, 1e-9, 'the other way too');

  ok(pointInRect(0.9, 1.9, rect(0, 0, 2, 4)), 'a point just inside is inside');
  ok(!pointInRect(1.1, 0, rect(0, 0, 2, 4)), 'and one just outside is not');
  ok(pointInRect(1.9, 0.9, rect(0, 0, 2, 4, Math.PI / 2)), 'inside the rotated one');
  ok(!pointInRect(0, 1.9, rect(0, 0, 2, 4, Math.PI / 2)), 'outside the rotated one');

  // The case a bounding circle gets wrong: a long fence beside a square kiosk. Their circles
  // overlap by metres; the rectangles do not touch.
  const fence = rect(0, 0, 12, 0.4);
  const kiosk = rect(0, 4, 4, 4);
  ok(!rectsOverlap(fence, kiosk), 'a 12 m fence and a kiosk 4 m away do not overlap');
  ok(Math.hypot(0, 4) < 6 + 2.83, 'their bounding circles do (which is why this test exists)');
  ok(rectsOverlap(fence, rect(0, 2, 4, 4)), 'moved to 2 m they do overlap');
  ok(rectsOverlap(rect(0, 0, 4, 4), rect(4.05, 0, 4, 4), 0.2), 'the margin closes a 5 cm gap');
  ok(!rectsOverlap(rect(0, 0, 4, 4), rect(4.05, 0, 4, 4), 0), 'and without it the gap is a gap');
  ok(
    rectsOverlap(rect(0, 0, 4, 1), rect(2, 0, 4, 1, Math.PI / 4)),
    'two rectangles at 45° to each other are compared on four axes'
  );
}

// ── 3. placement rules ────────────────────────────────────────────────────────────────────────
section('placement');
{
  const base = { parkHalf: 256, ground: flat, obstacles: [] };
  ok(
    evaluatePlacement({ ...base, rect: rect(0, 0, 4, 4) }).ok,
    'flat ground in the middle is fine'
  );

  const out = evaluatePlacement({ ...base, rect: rect(255, 0, 4, 4) });
  ok(!out.ok && out.reasons.includes('out-of-bounds'), 'a footprint over the edge is refused');
  ok(
    evaluatePlacement({ ...base, rect: rect(253.5, 0, 4, 4) }).ok,
    'and one that just fits inside is not'
  );

  const pond = { height: () => -3, waterLevel: () => -1.2 };
  const wet = evaluatePlacement({ ...base, ground: pond, rect: rect(0, 0, 4, 4) });
  ok(!wet.ok && wet.reasons.includes('under-water'), 'a bench in the lake is refused');

  // A slope of 1 in 3 across a 4 m footprint is a 1.33 m drop; the tolerance is 0.35 + 0.18 × 4.
  const slope = { height: (x) => x / 3, waterLevel: () => -50 };
  const steep = evaluatePlacement({ ...base, ground: slope, rect: rect(0, 0, 4, 4) });
  ok(!steep.ok && steep.reasons.includes('too-steep'), '1 in 3 under a 4 m footprint is too steep');
  near(steep.drop, 4 / 3, 1e-9, 'and the drop it measured is the real one');
  const gentle = { height: (x) => x / 30, waterLevel: () => -50 };
  ok(
    evaluatePlacement({ ...base, ground: gentle, rect: rect(0, 0, 4, 4) }).ok,
    '1 in 30 is buildable'
  );
  ok(
    evaluatePlacement({ ...base, ground: slope, rect: rect(0, 0, 0.4, 0.4) }).ok,
    'the same slope takes a 40 cm bin, because the tolerance follows the size'
  );

  // The height an item stands at is the highest sample, so nothing floats over a hollow.
  const bump = { height: (x, z) => (Math.hypot(x, z) < 1 ? 2 : 0), waterLevel: () => -50 };
  near(
    evaluatePlacement({ ...base, ground: bump, rect: rect(0, 0, 4, 4) }).y,
    2,
    1e-9,
    'the ground taken is the highest sample under the footprint'
  );
  ok(samplePoints(rect(0, 0, 4, 4)).length === 5, 'five samples: four corners and the centre');

  const obstacles = [{ id: 'shop-1', rect: rect(6, 0, 4, 4) }];
  const clash = evaluatePlacement({ ...base, obstacles, rect: rect(4, 0, 4, 4) });
  ok(!clash.ok && clash.reasons.includes('overlap'), 'two footprints in one place are refused');
  ok(clash.blockedBy === 'shop-1', 'and the verdict names what blocked it');
  ok(
    evaluatePlacement({ ...base, obstacles, rect: rect(4, 0, 4, 4), ignore: new Set(['shop-1']) })
      .ok,
    'the thing being moved does not collide with itself'
  );

  const broken = { height: () => Number.NaN, waterLevel: () => 0 };
  const noGround = evaluatePlacement({ ...base, ground: broken, rect: rect(0, 0, 2, 2) });
  ok(!noGround.ok && noGround.reasons[0] === 'no-ground', 'a sampler that cannot answer refuses');

  ok(DEFAULT_PLACEMENT_RULES.margin === 0.1, 'the default margin is 10 cm');
}

// ── 4. picking ────────────────────────────────────────────────────────────────────────────────
section('picking');
{
  const obstacles = [
    { id: 'plaza', rect: rect(0, 0, 40, 40) },
    { id: 'bench', rect: rect(2, 2, 1.6, 0.6) },
    { id: 'far', rect: rect(90, 90, 4, 4) },
  ];
  ok(pickEntityAt(2, 2, obstacles) === 'bench', 'the smallest footprint under the point wins');
  ok(pickEntityAt(10, 10, obstacles) === 'plaza', 'and the big one answers where it is alone');
  ok(pickEntityAt(-100, -100, obstacles) === null, 'empty ground picks nothing');
}

// ── 5. the history ────────────────────────────────────────────────────────────────────────────
section('history');
{
  const log = [];
  const history = createHistory((type, payload) => log.push(`${type}:${JSON.stringify(payload)}`));
  ok(!history.canUndo() && !history.canRedo(), 'a fresh stack can do neither');
  ok(history.undo() === null && history.redo() === null, 'and both are no-ops rather than throws');

  history.push({
    label: 'tools.action.place',
    forward: [
      { type: 'entity:add', payload: { id: 'a' } },
      { type: 'finance:adjust', payload: { cents: -1200 } },
    ],
    backward: [
      { type: 'entity:remove', payload: { id: 'a' } },
      { type: 'finance:adjust', payload: { cents: 1200 } },
    ],
  });
  ok(history.undoDepth() === 1 && history.redoDepth() === 0, 'a push is one undo deep');
  history.undo();
  ok(
    log.join(' | ') === 'entity:remove:{"id":"a"} | finance:adjust:{"cents":1200}',
    'undo dispatches the inverse commands in order',
    log.join(' | ')
  );
  ok(
    history.undoDepth() === 0 && history.redoDepth() === 1,
    'and moves the entry to the redo side'
  );
  log.length = 0;
  history.redo();
  ok(
    log.join(' | ') === 'entity:add:{"id":"a"} | finance:adjust:{"cents":-1200}',
    'redo dispatches exactly what was done originally',
    log.join(' | ')
  );

  // The money is cash-neutral over an undo/redo cycle, which is the property that stops undo
  // being a way of printing money.
  const cents = log
    .filter((l) => l.startsWith('finance'))
    .map((l) => JSON.parse(l.slice('finance:adjust:'.length)).cents);
  ok(cents.length === 1, 'one adjustment per redo');

  history.undo();
  history.push({ label: 'tools.action.delete', forward: [], backward: [] });
  ok(history.redoDepth() === 0, 'a new action after an undo clears the redo branch');

  const limited = createHistory(() => {}, 3);
  for (let i = 0; i < 10; i++) {
    limited.push({ label: `x${i}`, forward: [], backward: [] });
  }
  ok(limited.undoDepth() === 3, 'the stack is bounded');
  ok(limited.last().label === 'x9', 'and it is the newest three that survive');
  limited.clear();
  ok(limited.undoDepth() === 0 && limited.redoDepth() === 0, 'clear empties both sides');
}

// ── 6. the palette is the registry ────────────────────────────────────────────────────────────
section('palette');
{
  const bundled = ['core-classic', 'neon-lagoon'].map((id) =>
    JSON.parse(readFileSync(new URL(`../content/packs/${id}/pack.json`, import.meta.url), 'utf8'))
  );

  // Registered BEFORE anything attaches, which is what `host.boot()` does at step 2 — the trap.
  const registry = new Registry();
  for (const pack of bundled) registry.registerPack(pack);
  registry.registerKind('scenery', 'scenery');
  registry.registerKind('shop', 'shops');
  registry.registerKind('coaster', 'track');

  let palette = [];
  let calls = 0;
  const detach = attachPalette(registry, () => {
    calls += 1;
    palette = buildPalette(registry);
  });
  ok(calls === 1, 'attaching reads what is already registered');
  const flatItems = palette.flatMap((g) => g.items);
  const expected = bundled.reduce(
    (sum, p) =>
      sum +
      p.scenery.length +
      p.foliage.length +
      p.shops.length +
      p.rides.length +
      (p.buildings?.length ?? 0),
    0
  );
  ok(
    flatItems.length === expected,
    'every declared item of both bundled packs is in the palette',
    `${flatItems.length} vs ${expected}`
  );

  const bench = findPaletteItem(palette, 'core-classic:bench-wood');
  ok(bench?.kind === 'scenery', 'a scenery entry becomes a scenery entity');
  ok(bench?.available === true, 'and is placeable, because a module claimed that kind');
  const burger = findPaletteItem(palette, 'core-classic:burger');
  ok(burger?.kind === 'shop' && burger.available, 'a shop entry becomes a placeable shop');
  ok(burger?.cost === 40000, 'the cost comes straight off the manifest (400 EUR in cents)');

  const oak = findPaletteItem(palette, 'core-classic:oak');
  ok(oak?.kind === 'scenery', 'foliage is drawn by the scenery module, so it is a scenery entity');
  ok(oak?.footprint !== null, 'and gets a footprint though it declares none');
  // A trunk plate, not a crown: a bench under a lime tree is a bench. See the docblock.
  near(
    oak.footprint[0],
    oak.height * 0.18,
    1e-9,
    'a tree occupies 18 % of its height on the ground'
  );
  ok(oak.footprint[0] < 3, 'which is under 3 m for a 14 m oak, not the 10 m of its crown');
  const grass = findPaletteItem(palette, 'neon-lagoon:grass-tall');
  ok(grass.footprint[0] >= 0.6, 'and nothing gets a footprint under 60 cm');

  const coaster = findPaletteItem(palette, 'core-classic:wooden-classic');
  ok(coaster?.placement === 'route', 'a coaster has no footprint, so it is not a point placement');
  ok(
    coaster?.available === false && coaster.unavailableReason === 'route',
    'and it is listed and refused rather than hidden'
  );

  const wall = findPaletteItem(palette, 'core-classic:wall-brick');
  ok(wall?.kind === 'building', 'a building entry becomes a building entity');
  ok(
    wall?.available === false && wall.unavailableReason === 'kind',
    'which nothing claims yet, so it is listed as unavailable'
  );
  near(wall.footprint[0], 4, 1e-9, "a building's footprint comes from its size");
  near(wall.height, 4, 1e-9, 'and so does its height');

  const carousel = findPaletteItem(palette, 'core-classic:carousel');
  ok(carousel?.kind === 'ride' && carousel.placement === 'point', 'a flat ride is a point');

  // The extensibility gate, both halves.
  const before = palette
    .find((g) => g.kind === 'building')
    ?.items.filter((i) => i.available).length;
  registry.registerKind('building', 'buildings');
  palette = buildPalette(registry);
  const after = palette.find((g) => g.kind === 'building').items.filter((i) => i.available).length;
  ok(before === 0 && after > 0, 'claiming a kind makes its items placeable, with no code change');

  // A pack registered AFTER the module attached: the `onPack` half.
  registry.registerPack({
    id: 'test-pack',
    version: 1,
    name: { en: 'Test' },
    needs: [{ id: 'shade', name: { en: 'Shade' }, decayPerHour: 10 }],
    scenery: [
      {
        id: 'obelisk',
        name: { en: 'Obelisk', de: 'Obelisk' },
        category: 'landmark',
        footprint: [3, 3],
        height: 9,
        cost: 250000,
      },
    ],
    shops: [
      {
        id: 'shade-hut',
        kind: 'info',
        name: { en: 'Shade hut' },
        need: 'shade',
        cost: 90000,
        footprint: [5, 4],
      },
    ],
  });
  ok(calls === 2, 'a pack registered later fires the listener');
  const obelisk = findPaletteItem(palette, 'test-pack:obelisk');
  ok(obelisk?.kind === 'scenery' && obelisk.available, 'and its scenery is placeable at once');
  ok(obelisk?.cost === 250000 && obelisk.height === 9, 'with the manifest numbers');
  ok(
    findPaletteItem(palette, 'test-pack:shade-hut')?.available === true,
    'and so is its shop, answering a need the same pack declared'
  );
  ok(
    palette.flatMap((g) => g.items).length === expected + 2,
    'the palette grew by exactly the two entries the pack declared'
  );

  ok(firstPlaceable(palette)?.available === true, 'firstPlaceable returns something placeable');
  ok(findPaletteItem(palette, 'nope:nope') === null, 'an unknown key resolves to null');
  ok(findPaletteItem(palette, null) === null, 'and so does no key at all');

  detach();
  registry.registerPack({ id: 'after-detach', version: 1, name: { en: 'x' } });
  ok(calls === 2, 'detaching stops the listener');

  // The derivations, asked directly.
  ok(kindForItem('foliage', { id: 'x', kind: 'palm' }) === 'scenery', 'foliage → scenery');
  ok(kindForItem('rides', { id: 'x', kind: 'flume' }) === 'flume', 'a flume ride → flume');
  ok(placementForItem('rides', { id: 'x', kind: 'coaster' }) === 'route', 'a coaster is a route');
  ok(
    footprintForItem('scenery', { id: 'x', footprint: [2, 3] })[1] === 3,
    'a declared footprint is used as declared'
  );
  ok(
    heightForItem('shops', { id: 'x', footprint: [4, 6] }) === 4,
    'a kiosk box takes its short side'
  );
}

console.log(
  failures === 0
    ? `\n✓ tools selftest: ${checks} checks clean`
    : `\n✗ tools selftest: ${failures} of ${checks} checks failed`
);
process.exit(failures === 0 ? 0 : 1);
