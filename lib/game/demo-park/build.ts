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
