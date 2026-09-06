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
