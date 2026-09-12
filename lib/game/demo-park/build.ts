/**
 * `buildWorld(seed, registry)` — the world factory behind `/game` (and behind `?park=demo`, which
 * is the default).
 *
 * Everything the park is made of is created here, as world state, and not staged later on the main
 * thread. That is the whole reason the demo park survives a save: the terrain travels in
 * `world.terrain`, the paths and the props travel as entities, and a load rebuilds the identical
 * park from the file rather than re-rolling it from the seed. The one thing that is NOT state is
 * the ambient landscape dressing — several thousand grass tufts and boulders nobody bought and
 * nobody can move — which `scenery.dress()` re-derives from the seed on every boot. The settings
 * for it are written into this module's own world slot so a loaded park dresses the same way.
 *
 * Determinism: one `Rng` seeded from the world seed, forked into two named streams (`landform`
 * and `props`) so that adding a roll to one cannot shift the other, drawn in a fixed order. No `Math.random`, no wall clock — `scripts/test-game-lint.mjs` greps for both, and
 * `scripts/game-soak.mjs` imports this file directly under node.
 *
 * **Entity ids are allocated here rather than by `core/world.ts`'s `nextEntityId`, and that is a
 * determinism fix, not a preference.** That helper carries a module-level counter which survives
 * between calls, so building the same seed twice in one process produced `path-1…path-20` the
 * first time and `path-721…` the second — two different worlds from one seed, which a
 * `serializeWorld` comparison catches and nothing else would. A factory whose output depends on
 * how many worlds the process has already built is not a factory. The high-water mark is written
 * back into `world.modules.__ids`, which is where `nextEntityId` reads it from, so everything
 * placed at runtime carries on from where this left off.
 */

import type { Entity, Vec3, World } from '../core/types';
import type { Registry } from '../core/registry';
import { Rng } from '../core/rng';
import { createWorld } from '../core/world';
import { pathStyle, resolveWidth, DEFAULT_WIDTH } from '../paths';
import type { PathEntityData } from '../paths';
import { buildCatalog } from '../scenery';
import { sampleHeight } from '../terrain';
import { attachPoolContent, makePoolEntity } from '../pools';
import { attachFlumeContent, flumeLayouts, makeFlumeEntity } from '../flumes';
import { TRACK_LAYOUTS, layoutData } from '../track';
import { paintDemoTerrain, sculptDemoTerrain } from './landform';
import { missingRoles, placeDemoProps, resolveRoles } from './props';
import { PADS, PATHS, PARK_SIZE } from './plan';

/** What the demo park writes into `world.modules['demo-park']`. Survives a save. */
export interface DemoParkState {
  version: 1;
  /** `scenery.dress()` arguments, so a loaded park dresses exactly as a new one does. */
  dress: {
    bounds: [number, number, number, number];
    density: number;
    /** Catalogue keys, resolved from the registry at build time — never a literal. */
    woodland: string[];
  };
  /** Reserved plots, for the modules that will build on them. */
  plots: Array<{ id: string; owner: string; x: number; z: number; sizeX: number; sizeZ: number }>;
  /** Roles no registered pack could answer. Empty is the expected case. */
  missingRoles: string[];
  counts: { paths: number; props: number };
}

/**
 * How thickly the ambient scatter is laid down.
 *
 * 1.3 rather than 1.0 because `AMBIENT_CAP` is spent coarsest-species-first and the ground cover is
 * last in that queue: at 1.0 the park is under-planted, and much past 1.4 the flowers eat the cap
 * and the grass tufts stop arriving at all. The treeline and the copses are placed as entities
 * instead of being asked of this number, for the same reason.
 */
const DRESS_DENSITY = 1.3;
/** Metres of the boundary the dressing leaves alone; outside it the apron takes over. */
const DRESS_MARGIN = 6;

export function buildWorld(seed: number, registry: Registry): World {
  const packs = registry.packs().map((p) => p.id);
  const world = createWorld({
    seed,
    name: 'park.fan Resort',
    packs,
    // A demo park is a finished park, so the money is not the point; it is the sandbox figure.
    cash: 250_000_000,
    size: PARK_SIZE,
  });

  const rng = new Rng(world.meta.seed).fork('demo-park');
  let ids = 0;
  const allocId = (kind: string) => `${kind}-${++ids}`;

  // 1. the ground
  const land = rng.fork('landform');
  sculptDemoTerrain(world.terrain, world.meta.seed, () => land.next());

  // 2. the network
  const paths = buildPathEntities(world, packs[0] ?? 'core-classic', allocId);
  for (const entity of paths) world.entities[entity.id] = entity;

  // 3. the paint layer, which needs the paths to already exist
  paintDemoTerrain(world.terrain, world.meta.seed, paths);

  // 4. the props
  const catalog = buildCatalog(registry);
  const roles = resolveRoles(catalog, packs);
  const props = placeDemoProps({
    terrain: world.terrain,
    rng: rng.fork('props'),
    roles,
    allocId,
  });
  for (const entity of props) world.entities[entity.id] = entity;

  // 4b. Shops on the four plots this park reserved for them.
  //
  // Chosen by ROLE against the registry, never by pack id, the same way `props.ts` picks its
  // benches: a pack that ships a different burger stand is still a food shop, and this park should
  // open on it. The x of ±11 is not a taste call either — the main street's lamps run at ±6.2 and
  // its limes at ±8, and the path graph's service radius is 14 m, so ±11 is the only band clear of
  // both rows of trees and still reachable from the street's own nodes. The whole 26 m street
  // corridor is already flat, so nothing here touches the landform.
  //
  // `entity.position` is where a GUEST STANDS, not the centre of the building: the shops module
  // lays the structure out backwards from that point, so a shop at (−11, 128) with yaw π/2 has its
  // counter on the street and its back to the plot.
  for (const shop of placeDemoShops(registry, allocId)) world.entities[shop.id] = shop;

  // 4c. The fairground, on the plot this park reserved for it at (96, -46), 48 x 42 m.
  //
  // Unlike the coaster plot — which is 58 x 48 and cannot hold any layout `track` ships, see
  // STATUS.json — this one fits, and the positions and yaws come from `docs/game/requests/rides.md`
  // §6, written by the module that knows how big its own machines are.
  for (const ride of placeDemoRides(registry, allocId)) world.entities[ride.id] = ride;

  // 4d. The water park, on the plot reserved at (112, 50), 44 x 32 m. The `camera` module's `pool`
  // preset targets (110, 0, 60) and has framed empty ground since the day it was written.
  //
  // The three placements come from `docs/game/requests/pools.md` §4 with one change, and the change
  // is the reason that request is worth reading: the module measured its own footprints against
  // this pad and reported that the kids' pool as it proposed it hangs SEVEN METRES past the east
  // edge — 19.4 m of basin and deck starting where the lagoon's own deck stops. So the layout here
  // is not the requested one: the lagoon is shorter front-to-back and moved onto the pad's long
  // axis, the kids' pool takes the north-east corner, and the whirlpool the north-west. Two edges
  // are overhung by about two metres, which lands in the pad's own 20 m blend and is flat ground.
  attachPoolContent(registry);
  for (const pool of placeDemoPools(world, allocId)) world.entities[pool.id] = pool;

  // 4e. The two plots this park has reserved for `buildings` since the day the pads were written:
  // the pavilion at the north end, above its own forecourt plaza, and the ticket hall on the west
  // flank of the entrance forecourt facing the roundel.
  //
  // These went in late and the reason is worth recording, because it was an integrator's mistake
  // and not a builder's. The module verified its placement the strongest way anyone has in this
  // project — it dispatched both entities into a RUNNING park and read the built meshes' world
  // bounding boxes back out of the scene, 0.00 m overhang on all eight edges — and I wrote that up
  // as though the placement had landed. It had not: verifying a call in a session is not the same
  // as making it in the world factory, and `buildWorld` answered `{path:21, scenery:1516, shop:6,
  // ride:4, pool:3}` for days. Its own critic found it, by counting.
  for (const b of placeDemoBuildings(allocId)) world.entities[b.id] = b;

  // 4f. The coaster on the `coaster` shelf and the water slide on the `flumes` pad — the two plots
  // that had been reserved since the pads were written and were still empty on the day a guest
  // first managed to ride a coaster.
  //
  // **Not the coordinates `docs/game/requests/rides.md` §5 proposed**, and the difference is the
  // reason `scripts/game-fit-check.mjs` now exists. That request measured the STATION's distance
  // to a footpath, which is whether a queue can form and is a fair thing to measure — but it is
  // not whether the machine fits. Placed as written and measured against the terrain: 293 of 1201
  // samples of the coaster were INSIDE the ridge west of the shelf (-2.68 m at (-184, -27)) and it
  // crossed the `coaster-loop` path at 0.6 m and the `garden-walk` at 2.5 m, i.e. a train through
  // a footpath at head height; the slide buried 95 of 601 samples and overhung its pad by 30 m to
  // the north. The build was green, the soak passed, and both machines took riders all day.
  //
  // Two rules came out of that and both are in the numbers below.
  //
  // 1. **The Y of a machine is set by its whole footprint, not by the ground under its station.**
  //    `kleiner-kreisel` dips 2.18 m below its own origin before the terrain is even consulted, so
  //    an origin at ground level is a trench. Both origins here are the lowest Y at which no part
  //    of the machine is underground, plus 30 cm — measured, not chosen: the coaster's station
  //    ends up 3.80 m above the shelf and the slide's tower 1.42 m above its ground.
  // 2. **A footpath needs headroom.** Yaw and position were picked by scanning the shelf on a 5 m
  //    grid over 24 headings and keeping the placements that clear every path by 3 m. The coaster
  //    clears its worst crossing by 3.84 m and the slide, at this heading, crosses none at all.
  //
  // The coaster is `kleiner-wirbel`, the fourth bundled layout and the one drawn for a plot this
  // size: 345 m in a 56 x 112 m box against `kleiner-kreisel`'s 610 m in 52.6 x 212.6. It stays
  // INSIDE the shelf's west edge by 5.4 m where its predecessor reached 95.7 m past it, and the
  // depth still overhangs onto open ground the fit check clears. The slide's 59.5 x 42.4 m run
  // past a 36 x 30 m pad is unchanged and is reported the same way.
  //
  // And the cost of having them out here at all, measured over a park day with
  // `pnpm game:day-budget` against the same day with `game-ride-boarding.mjs --flat-only`:
  // arrivals rise 2261 -> 2695 (+19 %) because the park is worth more, total rides FALL
  // 5418 -> 4955 (-9 %) and interactions per visitor 7.01 -> 5.74. That is the walk and not the
  // ride: a guest covers 1-1.5 m per park minute (D-006) and the coaster shelf is 200 m west of
  // the fairground, so both machines settle at 19 % utilisation with an empty line.
  //
  // The short layout is worth 12 % of that gap on its own. `kleiner-kreisel` gave 4277 rides and
  // 5.14 interactions per visitor from the same placement; `kleiner-wirbel` gives 4955 and 5.74
  // with ONE train instead of two, because a 66 s cycle round 345 m beats a 93 s cycle round 610
  // by more than the second train was adding.
  attachFlumeContent(registry);
  for (const e of placeDemoCoaster(registry, allocId)) world.entities[e.id] = e;
  for (const e of placeDemoFlume(world, registry, allocId)) world.entities[e.id] = e;

  // 5. what the main handle needs to finish the job
  const half = PARK_SIZE / 2 - DRESS_MARGIN;
  const woodland = [roles.canopyTree, roles.streetTree, roles.conifer]
    .filter((s): s is NonNullable<typeof s> => s != null)
    .map((s) => s.key);
  const state: DemoParkState = {
    version: 1,
    dress: {
      bounds: [-half, -half, half, half],
      density: DRESS_DENSITY,
      woodland: [...new Set(woodland)].sort(),
    },
    plots: PADS.filter((p) => p.owner !== 'park').map((p) => ({
      id: p.id,
      owner: p.owner,
      x: p.x,
      z: p.z,
      sizeX: p.halfX * 2,
      sizeZ: p.halfZ * 2,
    })),
    missingRoles: missingRoles(roles),
    counts: { paths: paths.length, props: props.length },
  };
  world.modules['demo-park'] = state as unknown as Record<string, unknown>;
  world.modules.__ids = ids;

  return world;
}

/**
 * Turn `PATHS` into `path` entities.
 *
 * The shape of `Entity.data` is the paths module's `PathEntityData`, and the width goes through
 * that module's own `resolveWidth` so a style that does not allow eight metres gets six rather
 * than a silently wrong ribbon.
 */
function buildPathEntities(
  world: World,
  pack: string,
  allocId: (kind: string) => string
): Entity[] {
  const out: Entity[] = [];
  for (const plan of PATHS) {
    const style = pathStyle(plan.style);
    const data: PathEntityData = {
      form: plan.form,
      style: style.id,
      points: [...plan.points],
      width: plan.form === 'plaza' ? undefined : resolveWidth(style, plan.width ?? DEFAULT_WIDTH),
      closed: plan.closed === true,
      entrance: plan.entrance === true,
    };
    let cx = 0;
    let cz = 0;
    const n = Math.max(1, plan.points.length / 2);
    for (let i = 0; i + 1 < plan.points.length; i += 2) {
      cx += plan.points[i];
      cz += plan.points[i + 1];
    }
    cx /= n;
    cz /= n;
    const position: Vec3 = [cx, sampleHeight(world.terrain, cx, cz), cz];
    out.push({
      id: allocId('path'),
      kind: 'path',
      pack,
      item: style.id,
      position,
      yaw: 0,
      data: data as unknown as Record<string, unknown>,
    });
  }
  return out;
}

/**
 * The fairground: four flat rides on the `fairground` plot.
 *
 * Chosen by FOOTPRINT rather than by id, the same rule `placeDemoShops` follows with needs. Each
 * slot below says how much room it has and which way its gate faces; the largest slot takes the
 * largest unused flat ride that fits inside it, so a pack shipping a different wheel still opens
 * this fairground and one shipping none leaves the plot empty rather than inventing a machine.
 *
 * Four and not the five `docs/game/requests/rides.md` §6 proposes, and the positions are not its
 * positions, because that layout does not fit and the arithmetic says so twice. The wheel's real
 * extent is 27.2 m in x against the 12 its manifest declares — the module reports that
 * disagreement as its own §3 — so at the proposed coordinates the wheel and the top spin overlap
 * by ten metres; and three of the five stood 16 to 22 m from the nearest path against a graph
 * service radius of 14, which the soak fails as an unreachable queue. Four machines, laid out in
 * two rows either side of a new `fairground-midway` path, measure clear on both counts: no pair
 * overlaps, and every machine is within 13 m of a path.
 *
 * `rides:demo` is deliberately NOT dispatched: these machines fill from `guests` or they run empty,
 * and a demo flag that puts riders on them would make every throughput figure in the park a
 * fiction.
 */
function placeDemoRides(registry: Registry, allocId: (kind: string) => string): Entity[] {
  /** Slots in fill order — largest first, so the wheel cannot be crowded out by a carousel. */
  const plan: Array<{ x: number; z: number; yaw: number; maxX: number; maxZ: number }> = [
    { x: 106, z: -58, yaw: 0, maxX: 30, maxZ: 14 },
    { x: 108, z: -33, yaw: Math.PI / 2, maxX: 20, maxZ: 20 },
    { x: 83, z: -58, yaw: Math.PI, maxX: 18, maxZ: 12 },
    { x: 83, z: -33, yaw: Math.PI / 2, maxX: 16, maxZ: 16 },
  ];
  const items = registry.items('rides');
  const used = new Set<string>();
  const area = (f: readonly number[] | undefined): number =>
    Array.isArray(f) && f.length >= 2 ? f[0] * f[1] : 0;
  const out: Entity[] = [];
  for (const spot of plan) {
    let best: { pack: string; item: string; key: string; size: number } | null = null;
    for (const entry of items) {
      const def = entry.def as { id?: string; kind?: string; footprint?: number[] };
      if (def.kind !== 'flat' || typeof def.id !== 'string') continue;
      const key = `${entry.pack}:${def.id}`;
      if (used.has(key)) continue;
      const f = def.footprint;
      if (!Array.isArray(f) || f.length < 2) continue;
      // A footprint may be laid either way round on a square-ish slot, and the wheel is 12 x 30.
      const fits =
        (f[0] <= spot.maxX && f[1] <= spot.maxZ) || (f[1] <= spot.maxX && f[0] <= spot.maxZ);
      if (!fits) continue;
      const size = area(f);
      if (!best || size > best.size) best = { pack: entry.pack, item: def.id, key, size };
    }
    // A pack set with nothing that fits leaves the slot empty rather than putting a machine
    // through its neighbour.
    if (!best) continue;
    used.add(best.key);
    out.push({
      id: allocId('ride'),
      kind: 'ride',
      pack: best.pack,
      item: best.item,
      position: [spot.x, 0, spot.z],
      yaw: spot.yaw,
    });
  }
  return out;
}

/**
 * The eight shops the demo park opens with, one pair per reserved plot.
 *
 * Needs come from the packs, so the set is expressed as the NEEDS a visitor arrives with rather
 * than as a shopping list: two places to eat, two to drink, a toilet, two souvenir counters and an
 * information point. `pick` takes the first shop in registration order that answers a need and has
 * not been used yet, which keeps the two food stands different from each other without naming
 * either of them.
 */
/**
 * The lido, the children's pool and the whirlpool, on the `water-park` pad.
 *
 * Three shapes out of the pools module's own catalogue, placed by their FOOTPRINT against the pad
 * rather than by eye, which is the rule `placeDemoRides` follows and the one the fairground was
 * laid out with after a first attempt overlapped two machines by ten metres.
 *
 * `attachPoolContent` is idempotent and both halves of that module call it too; it is called here
 * because this factory runs before either of them and `makePoolEntity` refuses to invent a shape it
 * does not know.
 *
 * The Y is sampled rather than assumed. `makePoolEntity` writes it straight into the entity and the
 * module reads the entity's Y in preference to the terrain's — the ground under a placed pool IS
 * the pit it dug, so a pool that took its height from the terrain after excavation would sink by
 * its own depth every time the world was rebuilt.
 */
/**
 * The pavilion and the ticket hall, from `docs/game/requests/buildings.md` §1.
 *
 * Taken as written, which is unusual here and is earned: the module measured its own footprints
 * against these pads in the running scene rather than proposing coordinates and hoping — 54.42 x
 * 24.99 m in a 56 x 32 pad, 19.12 x 31.52 m in a 22 x 38 pad, clearances 0.79 to 3.69 m — and the
 * pad-fit check is in its own selftest, so a blueprint edit that outgrows a pad fails there rather
 * than here.
 *
 * `y = 0` on purpose: the renderer samples the terrain, which is what these pads are flattened for.
 */
function placeDemoBuildings(allocId: (kind: string) => string): Entity[] {
  return [
    {
      id: allocId('building'),
      kind: 'building',
      pack: 'parkfan-architecture',
      item: 'grand-pavilion',
      // The front is +z, and +z from this pad is the forecourt plaza at z = -130.
      position: [-8, 0, -162],
      yaw: 0,
    },
    {
      id: allocId('building'),
      kind: 'building',
      pack: 'parkfan-architecture',
      item: 'ticket-hall',
      // A quarter turn puts the +z front on +x, towards the planted roundel the street runs round.
      position: [-33, 0, 178],
      yaw: Math.PI / 2,
      data: { style: 'old-town-brick' },
    },
  ];
}

function placeDemoPools(world: World, allocId: (kind: string) => string): Entity[] {
  const y = (x: number, z: number) => sampleHeight(world.terrain, x, z);
  return [
    makePoolEntity({
      id: allocId('pool'),
      shape: 'lagoon',
      x: 110,
      z: 42,
      y: y(110, 42),
      yaw: 0.18,
      size: [30, 14],
    }),
    makePoolEntity({
      id: allocId('pool'),
      shape: 'kids-pool',
      x: 122,
      z: 60,
      y: y(122, 60),
      yaw: -0.3,
    }),
    makePoolEntity({
      id: allocId('pool'),
      shape: 'whirlpool',
      x: 96,
      z: 60,
      y: y(96, 60),
      yaw: 0.6,
      heated: true,
    }),
  ];
}

function placeDemoShops(registry: Registry, allocId: (kind: string) => string): Entity[] {
  const items = registry.items('shops');
  const used = new Set<string>();
  const pick = (need: string): { pack: string; item: string } | null => {
    for (const entry of items) {
      const def = entry.def as { id?: string; need?: string };
      const key = `${entry.pack}:${def.id}`;
      if (def.need !== need || used.has(key) || typeof def.id !== 'string') continue;
      used.add(key);
      return { pack: entry.pack, item: def.id };
    }
    return null;
  };
  const plan: Array<{ need: string; x: number; z: number; yaw: number }> = [
    { need: 'hunger', x: -11, z: 128, yaw: Math.PI / 2 },
    { need: 'thirst', x: -11, z: 108, yaw: Math.PI / 2 },
    { need: 'hunger', x: 11, z: 128, yaw: -Math.PI / 2 },
    { need: 'toilet', x: 11, z: 108, yaw: -Math.PI / 2 },
    { need: 'thirst', x: 11, z: 52, yaw: -Math.PI / 2 },
    { need: 'happiness', x: 11, z: 36, yaw: -Math.PI / 2 },
    { need: 'happiness', x: 26, z: 186, yaw: -Math.PI / 2 },
    { need: 'none', x: 26, z: 170, yaw: -Math.PI / 2 },
  ];
  const out: Entity[] = [];
  for (const spot of plan) {
    const found = pick(spot.need);
    // A pack set without a shop for this need leaves the plot empty rather than inventing one.
    if (!found) continue;
    const id = allocId('shop');
    out.push({
      id,
      kind: 'shop',
      pack: found.pack,
      item: found.item,
      position: [spot.x, 0, spot.z],
      yaw: spot.yaw,
    });
  }
  return out;
}

/**
 * Where the two measured placements come from, and why they are ids rather than a fit search.
 *
 * `placeDemoRides` and `placeDemoPools` above choose their machines by FOOTPRINT against the pad,
 * which is the rule this file prefers because it survives a pack that ships different content. A
 * coaster layout and a slide layout cannot be chosen that way yet: neither `LayoutPreset` nor
 * `FlumeLayoutSpec` declares an extent, and the only way to learn one is to build the spline —
 * which is the `track` and `flumes` modules' work and not the world factory's. So these two are
 * named, the fallbacks below keep a pack set without them from crashing the factory, and the fix
 * that would let this file measure instead of naming is a `footprint` on both layout types.
 */
const MEASURED_COASTER_LAYOUT = 'kleiner-wirbel';
const MEASURED_FLUME_LAYOUT = 'spiral-tower';

/**
 * Where each machine stands, and how high.
 *
 * `y` is an ABSOLUTE world height, not an offset, and it is the output of a measurement rather
 * than a taste call: the lowest origin at which no sample of the built machine sits below the
 * terrain, plus 30 cm. The ground it stands on is 8.00 m for the coaster and 2.27 m for the slide,
 * so the platform is 4.53 m up and the tower 1.42 m up. `scripts/game-fit-check.mjs` rebuilds both
 * splines against the terrain and fails if either number stops being true — which is what makes
 * this a constant one may trust rather than a constant somebody typed.
 */
const COASTER_AT = { x: -70, y: 12.53, z: -45, yaw: -Math.PI / 4 };
const FLUME_AT = { x: 148, y: 3.69, z: 6, yaw: Math.PI / 2 };
/**
 * The pool the slide's run-out lands in, 9 m beyond the trough's last metre and square to it.
 *
 * A slide has to end in water, and the first placement here did not: the trough stopped 30 cm
 * above open grass with a support column under it and nothing else, which is the sort of thing a
 * fit check reports as clean because it is clean — nothing was underground, everything cleared its
 * paths, and the machine simply ended. It took a screenshot to see it.
 *
 * `pools` ships a `runout-lane` shape (8 x 18 m, `role: 'splashdown'`, a channel 0.55-1.00 m deep)
 * for exactly this and `flumes` resolves a splashdown by proximity when the entity does not name
 * one — but the nearest pool was the lagoon 34 m away, so nothing resolved. Both ends are named
 * here instead: the slide's `data.splashdown` is the pool's id and the pool's `splashdownFor` is
 * the slide's, so neither depends on a radius.
 *
 * The site was measured with the placement: over an 8 x 18 m box the ground varies 0.23 m, which
 * is the flattest exit any feasible heading on this pad reaches, and it is 11 m from the
 * `lake-link` path.
 */
const FLUME_RUNOUT_AT = { x: 167.1, z: 60, yaw: 0 };

/**
 * The coaster on the `coaster` shelf.
 *
 * `kleiner-wirbel` rather than `kleiner-kreisel`, and the swap is the point of the layout: 345 m
 * in a 56 x 112 m box against 610 m in 52.6 x 212.6. The width now fits the 58 m shelf outright
 * and the depth overhangs it onto open ground the fit check clears — where the layout it replaces
 * reached 95.7 m past the plot to the west.
 *
 * The 12 m platform lies diagonally across the shelf, its dock 6.8 m from the `coaster-loop`
 * path — which is the whole of whether a queue can form, `paths` serving a 14 m radius.
 *
 * A pack set with no coaster ride for the layout leaves the shelf empty rather than dispatching an
 * entity whose `pack:item` nothing can resolve — `track` would answer `null` and the park would
 * carry an invisible machine with a queue in front of it.
 */
function placeDemoCoaster(registry: Registry, allocId: (kind: string) => string): Entity[] {
  const preset =
    TRACK_LAYOUTS.find((p) => p.id === MEASURED_COASTER_LAYOUT) ?? TRACK_LAYOUTS[0] ?? null;
  if (!preset) return [];
  const [pack, item] = preset.ride.split(':');
  const def = registry.item('rides', preset.ride)?.def as { kind?: string } | undefined;
  if (!pack || !item || def?.kind !== 'coaster') return [];
  const origin: Vec3 = [COASTER_AT.x, COASTER_AT.y, COASTER_AT.z];
  const yaw = COASTER_AT.yaw;
  return [
    {
      id: allocId('coaster'),
      kind: 'coaster',
      pack,
      item,
      position: origin,
      yaw,
      // The layout travels in `data` and its `origin`/`yaw` are overwritten with the placement's,
      // because a preset's own origin is where the showcase stands it.
      data: { ...layoutData(preset), origin, yaw } as unknown as Record<string, unknown>,
    },
  ];
}

/**
 * The water slide on the `flumes` pad.
 *
 * Yaw `π` runs the slide south-west off its tower, which is 3.5 m from the `lake-link` path and
 * inside the service radius, and puts the run-out on the flat lakeside rather than up the rise to
 * the east — the reason the machine clears the terrain everywhere at this heading and at no other
 * one within a metre of it.
 *
 * The ride item is chosen by the LAYOUT's style rather than by id: `resolveFlume` says in as many
 * words that the layout decides the style and not the ride's four-way enum, so a tube layout wants
 * the tube slide and a pack shipping a differently named one still opens this plot.
 */
function placeDemoFlume(
  world: World,
  registry: Registry,
  allocId: (kind: string) => string
): Entity[] {
  const layouts = flumeLayouts();
  const layout = layouts.find((l) => l.id === MEASURED_FLUME_LAYOUT) ?? layouts[0] ?? null;
  if (!layout) return [];
  const flumes = registry
    .items('rides')
    .map((entry) => ({
      pack: entry.pack,
      def: entry.def as { id?: string; kind?: string; flumeStyle?: string },
    }))
    .filter((e) => e.def.kind === 'flume' && typeof e.def.id === 'string');
  const found = flumes.find((e) => e.def.flumeStyle === layout.style) ?? flumes[0] ?? null;
  if (!found) return [];
  // Both ids are allocated before either entity is built, because the two name each other.
  const slideId = allocId('flume');
  const poolId = allocId('pool');
  return [
    makeFlumeEntity({
      id: slideId,
      pack: found.pack,
      item: found.def.id as string,
      x: FLUME_AT.x,
      z: FLUME_AT.z,
      y: FLUME_AT.y,
      yaw: FLUME_AT.yaw,
      layout: layout.id,
      splashdown: poolId,
    }),
    makePoolEntity({
      id: poolId,
      shape: 'runout-lane',
      x: FLUME_RUNOUT_AT.x,
      z: FLUME_RUNOUT_AT.z,
      y: sampleHeight(world.terrain, FLUME_RUNOUT_AT.x, FLUME_RUNOUT_AT.z),
      yaw: FLUME_RUNOUT_AT.yaw,
      splashdownFor: slideId,
    }),
  ];
}
