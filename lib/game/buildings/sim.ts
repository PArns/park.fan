/**
 * Buildings in the simulation: where they stand and where you go in.
 *
 * This module went a whole round without a sim, on the argument that a building is a fact rather
 * than a process — no state that moves with the clock, nothing to schedule, nothing to serialise
 * beyond the entity core already owns. That argument is still true of the tick, and the tick below
 * still does nothing. What it missed is that **the sim runtime is where a kind gets an owner**:
 * `SimRuntime.createModules` skips a module with no `sim` before it reaches the `registerKind`
 * loop, so `building` was an unowned kind in the runtime's registry — invisible until the demo park
 * had buildings in it, at which point `pnpm test:game`'s orphan check went red on `{"building":2}`.
 * The check's own comment predicted exactly that. `requests/buildings.md` §8 asks for the one-line
 * fix in core; this file is here whether or not it lands.
 *
 * Given that it exists, it answers the questions the other side of the thread cannot. The renderer
 * knows a building's entrance because it drew the door, and a guest may not wait for a mesh: the
 * plan and the entrance point are both derivable from the blueprint alone, so they are derived here
 * — from `resolveBuilding` and the declared masses, with no geometry built and no atlas touched.
 *
 * DOM-free and Babylon-free; it runs in node under the soak harness. Nothing here reads a clock or a
 * random number: the whole index is a pure function of the entity stream.
 */

import type { Command, Entity, SimContext, SimHandle } from '../core/types';
import { attachBuildingContent, resolveBuilding } from './manifest';
import { ARCHITECTURE_PACK } from './pack';
import type { BuildingEntityData, BlueprintDef } from './types';

/** Metres per index cell. A point query looks at one of these and its eight neighbours. */
const CELL = 32;

export interface BuildingRecord {
  id: string;
  /** `pack:item`. */
  key: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  /**
   * Centre of the plan box in world space, which is **not** the entity position.
   *
   * A blueprint whose masses sit off its origin — a wing on one flank, a wheelhouse on one corner —
   * has a plan whose middle is somewhere else, and a box centred on the entity would have to be
   * twice the size to contain it. The watermill fixture in the self-test is 15.4 m across a box
   * centred on the entity and 13.8 m across one centred on itself; the second is the building.
   */
  cx: number;
  cz: number;
  /**
   * Half-extents of an **axis-aligned** box in world space around `cx, cz` that contains the plan.
   *
   * A yawed building's plan is not axis-aligned, so this is the enclosing rectangle: generous at
   * the corners and exact on the faces. The callers are "may I put a path here" and "which building
   * am I standing in front of", and both would rather hear about a building a metre early.
   */
  hx: number;
  hz: number;
  /** Eaves height above the entity's own y, metres — see `ridgeHeight`. */
  height: number;
  /** Where a guest walks to, in world space. Not the entity position — that is inside. */
  entrance: [number, number];
}

export interface BuildingsSimApi {
  count(): number;
  get(id: string): BuildingRecord | null;
  all(): BuildingRecord[];
  /** The building whose plan box contains this point, or null. */
  at(x: number, z: number): BuildingRecord | null;
  /** Where a guest walks to for this building, world space. */
  entrance(id: string): [number, number] | null;
  /** The nearest building entrance within `radius` metres, or null. */
  nearestEntrance(x: number, z: number, radius: number): BuildingRecord | null;
}

/** `[minX, minZ, maxX, maxZ]`. */
type Rect = [number, number, number, number];

/**
 * The plan of a blueprint, in its own space, before the entity's yaw.
 *
 * `MassDef.size` is **two** numbers, x by z — the height comes from `storeys × storeyHeight`, which
 * is why `eavesHeight` below exists rather than reading a third component. Each mass is a rectangle
 * at `at`, optionally turned by its own `yaw` in degrees; a turned rectangle is enclosed by its own
 * axis-aligned box, which is what the `|cos|`/`|sin|` pair gives.
 *
 * An **arcade** counts. It is a colonnade standing `depth` metres out from one elevation, and it is
 * something a guest walks into: leaving it out made the ticket hall's plan 10 m deep against a
 * building that is 19 m deep, which is the sort of gap a path tool would route a queue through.
 */
function planRect(bp: BlueprintDef): Rect {
  let minX = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxZ = -Infinity;
  for (const mass of bp.masses) {
    const [ax, az] = mass.at ?? [0, 0];
    const rot = ((mass.yaw ?? 0) * Math.PI) / 180;
    const c = Math.abs(Math.cos(rot));
    const s = Math.abs(Math.sin(rot));
    let ex = (mass.size[0] * c + mass.size[1] * s) / 2;
    let ez = (mass.size[0] * s + mass.size[1] * c) / 2;
    const depth = mass.arcade?.depth ?? 0;
    if (depth > 0) {
      // Which axis it grows on is which side it is on, and the mass's own yaw turns that too.
      // Adding it to both half-extents is a metre or two of slack on the three sides it is not on,
      // which is the same slack the apron already contributes.
      ex += depth * (c + s);
      ez += depth * (c + s);
    }
    if (ax - ex < minX) minX = ax - ex;
    if (az - ez < minZ) minZ = az - ez;
    if (ax + ex > maxX) maxX = ax + ex;
    if (az + ez > maxZ) maxZ = az + ez;
  }
  if (!Number.isFinite(minX)) return [0, 0, 0, 0];
  return [minX, minZ, maxX, maxZ];
}

/**
 * Where the door is, in the blueprint's own space.
 *
 * The same rule `build.ts` falls back to when no bay pattern puts a door on the front: the middle
 * of the first mass's front elevation, 2.4 m out. `build.ts` prefers the real door's centre when it
 * has drawn one, so the two can differ by half a bay on a building whose entrance is off-centre;
 * that is a metre or two on a fifty-metre pavilion and it is not worth building the geometry twice
 * to close. What must not differ is the SIDE it is on, and both read `masses[0]`.
 */
function planEntrance(bp: BlueprintDef): [number, number] {
  const first = bp.masses[0];
  if (!first) return [0, 0];
  const at = first.at ?? [0, 0];
  return [at[0], at[1] + first.size[1] / 2 + 2.4];
}

/**
 * Eaves height, not ridge height, and it is the same arithmetic `build.ts` calls `wallTop`.
 *
 * The roof above it is a form with a pitch and this side has no geometry to measure, so what is
 * reported is the top of the wall. The two default constants (a 0.55 m plinth, 4 m storeys) are
 * duplicated from `build.ts` — a hand-written twin, so a change to either belongs in both.
 */
function eavesHeight(bp: BlueprintDef): number {
  let top = 0;
  for (const mass of bp.masses) {
    const storeys = Math.max(1, Math.round(mass.storeys ?? 1));
    const h = (mass.base ?? 0) + (mass.plinth ?? 0.55) + storeys * (mass.storeyHeight ?? 4.0);
    top = Math.max(top, h);
  }
  return top;
}

export function createBuildingsSim(ctx: SimContext): SimHandle {
  /**
   * The content has to be read on **this** side too, and the first version of this file forgot.
   *
   * `manifest.ts` keeps its styles and blueprints in module scope, and the worker and the main
   * thread are different realms with a copy each, so the renderer having read the packs says
   * nothing about what is in this one. Without it `resolveBuilding` found every item, found no
   * blueprint behind it, and fell back to a plain block — eight
   * `"…" is a blueprint but no pack declares one by that id` warnings in a run that had had two, a
   * footprint per building that was the wrong shape, and not one wrong pixel anywhere, because the
   * renderer reads its own copy. Re-claiming a pack category by the same owner is a no-op and
   * `readPack` is keyed by `pack:id`, so doing it twice in one realm costs nothing.
   */
  const detachContent = attachBuildingContent(ctx.registry);
  try {
    ctx.registry.registerPack(ARCHITECTURE_PACK);
  } catch {
    // Already registered — the renderer got here first, or this is a second boot on one registry.
  }

  const records = new Map<string, BuildingRecord>();
  /** Cell key → ids. Rebuilt from the records, never serialised. */
  const grid = new Map<string, string[]>();

  const cellKey = (x: number, z: number): string =>
    `${Math.floor(x / CELL)}:${Math.floor(z / CELL)}`;

  function index(record: BuildingRecord): void {
    const x0 = Math.floor((record.cx - record.hx) / CELL);
    const x1 = Math.floor((record.cx + record.hx) / CELL);
    const z0 = Math.floor((record.cz - record.hz) / CELL);
    const z1 = Math.floor((record.cz + record.hz) / CELL);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cz = z0; cz <= z1; cz++) {
        const key = `${cx}:${cz}`;
        const bucket = grid.get(key);
        if (bucket) bucket.push(record.id);
        else grid.set(key, [record.id]);
      }
    }
  }

  function unindex(record: BuildingRecord): void {
    const x0 = Math.floor((record.cx - record.hx) / CELL);
    const x1 = Math.floor((record.cx + record.hx) / CELL);
    const z0 = Math.floor((record.cz - record.hz) / CELL);
    const z1 = Math.floor((record.cz + record.hz) / CELL);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cz = z0; cz <= z1; cz++) {
        const key = `${cx}:${cz}`;
        const bucket = grid.get(key);
        if (!bucket) continue;
        const at = bucket.indexOf(record.id);
        if (at >= 0) bucket.splice(at, 1);
        if (bucket.length === 0) grid.delete(key);
      }
    }
  }

  function add(entity: Entity): void {
    if (entity.kind !== 'building') return;
    const resolved = resolveBuilding(
      ctx.registry,
      entity.pack,
      entity.item,
      entity.data as BuildingEntityData | undefined
    );
    if (!resolved) return;
    const bp = resolved.blueprint;
    // A kit piece has no blueprint; its declared size is the whole of its plan.
    const rect: Rect = bp
      ? planRect(bp)
      : [-resolved.size[0] / 2, -resolved.size[2] / 2, resolved.size[0] / 2, resolved.size[2] / 2];
    const [ex, ez] = bp ? planEntrance(bp) : [0, resolved.size[2] / 2 + 2.4];
    const cos = Math.cos(entity.yaw);
    const sin = Math.sin(entity.yaw);
    // The same convention `main.ts` places an instance with: +z is the front, and yaw turns it.
    const toWorld = (px: number, pz: number): [number, number] => [
      entity.position[0] + px * cos + pz * sin,
      entity.position[2] - px * sin + pz * cos,
    ];
    let minX = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxZ = -Infinity;
    const corners: [number, number][] = [
      [rect[0], rect[1]],
      [rect[2], rect[1]],
      [rect[2], rect[3]],
      [rect[0], rect[3]],
    ];
    for (const [px, pz] of corners) {
      const [wx, wz] = toWorld(px, pz);
      if (wx < minX) minX = wx;
      if (wz < minZ) minZ = wz;
      if (wx > maxX) maxX = wx;
      if (wz > maxZ) maxZ = wz;
    }
    const record: BuildingRecord = {
      id: entity.id,
      key: resolved.key,
      x: entity.position[0],
      y: entity.position[1],
      z: entity.position[2],
      yaw: entity.yaw,
      cx: (minX + maxX) / 2,
      cz: (minZ + maxZ) / 2,
      hx: (maxX - minX) / 2,
      hz: (maxZ - minZ) / 2,
      height: bp ? eavesHeight(bp) : resolved.size[1],
      entrance: toWorld(ex, ez),
    };
    const existing = records.get(entity.id);
    if (existing) unindex(existing);
    records.set(entity.id, record);
    index(record);
  }

  function remove(entity: Entity): void {
    const record = records.get(entity.id);
    if (!record) return;
    unindex(record);
    records.delete(entity.id);
  }

  const offAdd = ctx.events.on('entity:add', (e: unknown) => add(e as Entity));
  const offUpdate = ctx.events.on('entity:update', (p: unknown) =>
    add((p as { entity: Entity }).entity)
  );
  const offRemove = ctx.events.on('entity:remove', (e: unknown) => remove(e as Entity));

  const api: BuildingsSimApi = {
    count: () => records.size,
    get: (id) => records.get(id) ?? null,
    all: () => [...records.values()],
    at(x, z) {
      const bucket = grid.get(cellKey(x, z));
      if (!bucket) return null;
      for (const id of bucket) {
        const r = records.get(id);
        if (!r) continue;
        if (Math.abs(x - r.cx) <= r.hx && Math.abs(z - r.cz) <= r.hz) return r;
      }
      return null;
    },
    entrance: (id) => records.get(id)?.entrance ?? null,
    nearestEntrance(x, z, radius) {
      let best: BuildingRecord | null = null;
      let bestD = radius * radius;
      // Over every record rather than the grid: the grid is indexed by plan box and an entrance
      // sits outside it. A park has tens of buildings, so the loop is cheaper than a second index.
      for (const r of records.values()) {
        const dx = r.entrance[0] - x;
        const dz = r.entrance[1] - z;
        const d = dx * dx + dz * dz;
        if (d < bestD) {
          bestD = d;
          best = r;
        }
      }
      return best;
    },
  };

  return {
    api,
    tick() {
      // A building does not move, does not open, does not wear out and does not queue. The index is
      // maintained from the entity stream, so a tick that does nothing is the right amount of work.
      // When a building grows an interior a guest can shelter in, that is what goes here.
    },
    command(_cmd: Command): boolean {
      return false;
    },
    /**
     * No `serialize`: everything here is derived from `world.entities`, which core already saves.
     * Writing a copy into `world.modules.buildings` would be a second source of truth for the same
     * facts and a way for a save to disagree with itself.
     */
    rebuild() {
      records.clear();
      grid.clear();
      for (const id in ctx.world.entities) add(ctx.world.entities[id]);
    },
    dispose() {
      offAdd();
      offUpdate();
      offRemove();
      detachContent();
      // No `resetBuildingContent()` here. `main.ts` calls it on ITS dispose, and in the browser the
      // two are separate realms with a map each; under the node soak harness there is no main, and
      // clearing the catalogue on the way out would only take it away from a runtime that is about
      // to be rebuilt on the same registry.
    },
  };
}
