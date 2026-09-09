/**
 * The main-thread half: the trough, the sheet of water, the tower, the columns, the vehicles, the
 * night rig — and the splash at the bottom.
 *
 * Thin on purpose. What a slide's SHAPE is lives in `geom.ts`, what its NUMBERS are in
 * `resolve.ts`, what it DOES in `sim.ts` on the worker, and what it is MADE OF in `materials.ts`.
 * This file owns meshes, instances and the wiring between them.
 *
 * ## The splash is drawn here and not in the worker
 *
 * `sim.ts` publishes an arc length per rider and nothing else. When a rider crosses the end of the
 * run between two frames, this file calls `pools.splash(x, z, strength)` — the contract the pools
 * module already published for exactly this — with the strength scaled by the speed the rider
 * arrived at, so a 12 m/s body slide throws a bigger ring than a raft coasting in at five.
 *
 * It is on this side because `flume:` is not in core's `FORWARDED_PREFIXES` (`sim-runtime.ts:30`),
 * so an event emitted from the worker would never arrive; and because a splash is a visual effect
 * whose right moment is the interpolated frame rather than the tick. The request to forward the
 * prefix is in `docs/game/requests/flumes.md`, and it is a nice-to-have rather than a fix: the
 * detection is exact either way, since the rider's slot goes empty on precisely the tick it lands.
 *
 * ## A flume's Y comes from the terrain, not from the entity
 *
 * A build tool that has not sampled the ground writes `position[1] = 0`, which is the sea in this
 * park. Every placement is re-grounded here and again whenever the terrain changes under it — the
 * same rule `rides/main.ts` states and for the same reason.
 */

import '@babylonjs/core/Meshes/thinInstanceMesh';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import type { Material } from '@babylonjs/core/Materials/material';
import type { Scene } from '@babylonjs/core/scene';
import type {
  Entity,
  EntityChange,
  EnvironmentState,
  MainContext,
  MainHandle,
  SimFrame,
} from '../core/types';
import { nextEntityId } from '../core/world';
import { buildSupports, HEARTLINE_HEIGHT } from '../track';
import { attachFlumeContent, flumeLayouts, flumeStyles, registerFlumes } from './manifest';
import { makeFlumeEntity } from './entity';
import { buildFlume, CRADLE_DEPTH, resolveFlume, ridersPerHour, type FlumeBuild } from './resolve';
import { createFlumeMaterials, type FlumeMaterials } from './materials';
import {
  buildRig,
  buildShell,
  buildTower,
  buildWaterSheet,
  hexToLinear,
  triangleCount,
  type FlowGeo,
  type Geo,
  type RigBuild,
} from './geom';
import {
  MAX_RIDERS,
  RIDER_STRIDE,
  type FlumeLayoutSpec,
  type FlumeStyleSpec,
  type FlumeView,
  type ResolvedFlume,
} from './types';

interface TerrainLike {
  height(x: number, z: number): number;
}
interface EnvironmentLike {
  addShadowCaster?(mesh: unknown, includeDescendants?: boolean): void;
  removeShadowCaster?(mesh: unknown): void;
}
interface PoolsLike {
  splash(x: number, z: number, strength?: number): boolean;
  splashdown(id?: string): { id: string; x: number; y: number; z: number; depth: number } | null;
  waterYAt(x: number, z: number): number | null;
}

/** Night lights per preset. The same shape and the same reason as `rides`: they are not free. */
const LIGHT_POOL: Record<string, number> = { low: 0, medium: 2, high: 4, ultra: 6 };

export interface FlumeMeshStats {
  flumes: number;
  meshes: number;
  triangles: number;
  /** Metres of trough drawn. */
  trough: number;
  riders: number;
  lights: number;
  buildMs: number;
  textureMs: number;
  interpolated: boolean;
  splashes: number;
}

export interface FlumeSpec {
  /** Pack and ride id, e.g. `neon-lagoon` / `body-slide`. */
  pack: string;
  item: string;
  x: number;
  z: number;
  yaw?: number;
  layout?: string;
  towerHeight?: number;
  color?: string;
  splashdown?: string;
}

export interface FlumesMainApi {
  /** Every flume any registered pack declares. A build bar reads this, not a hard-coded list. */
  catalogue(): FlumeLayoutSpec[];
  styles(): FlumeStyleSpec[];
  /** Add content at runtime from a manifest fragment — the same parser a pack goes through. */
  registerContent(packId: string, block: unknown): number;
  /** Place a slide. Returns the new entity id. */
  create(spec: FlumeSpec): string;
  remove(id: string): void;
  /** The slides that are actually built, resolved. */
  flumes(): ResolvedFlume[];
  view(id: string): FlumeView | undefined;
  /** Where the run-out ends, world metres, and which way it is pointing. */
  exit(id: string): { position: [number, number, number]; yaw: number } | null;
  meshes(): AbstractMesh[];
  stats(): FlumeMeshStats;
  /** World point the camera should look at to see one slide, and how far back to stand. */
  focus(id: string): { position: [number, number, number]; radius: number } | null;
}

interface Drawn {
  build: FlumeBuild;
  meshes: Mesh[];
  triangles: number;
  /** Where a rider ends up, for the splash. */
  exit: [number, number, number];
}

interface RigBatch {
  hull: Mesh | null;
  rider: Mesh | null;
  seats: Array<[number, number]>;
  hullMatrices: Float32Array;
  riderMatrices: Float32Array;
  hullCount: number;
  riderCount: number;
}

export function createFlumesMain(ctx: MainContext): MainHandle {
  const detachContent = attachFlumeContent(ctx.registry);
  const scene = ctx.scene as Scene;
  const seed = ctx.rng.int(1, 1 << 28);
  const materials: FlumeMaterials = createFlumeMaterials(scene, ctx.quality.preset, seed);
  const terrain = ctx.module<TerrainLike>('terrain');

  const placements = new Map<string, Entity>();
  const drawn = new Map<string, Drawn>();
  const rigs = new Map<string, RigBatch>();
  const lights: PointLight[] = [];
  const lightOf = new Map<string, PointLight>();
  let shadowed: Mesh[] = [];
  let order: string[] = [];
  /**
   * Per rider slot, the flume it was on and how fast it was going, as of the last frame.
   *
   * A landing is a CROSSING and not a poll: the slot going from "on flume n" to empty between two
   * frames is the exact tick a rider reached the run-out, so the splash is drawn once and at the
   * right moment. Polling `s >= length` would draw one every frame for as long as nothing else
   * claimed the slot.
   */
  const lastSpeed = new Float32Array(MAX_RIDERS);
  const lastFlume = new Int32Array(MAX_RIDERS);
  /** Riders in the air per flume, in `order`'s index — what `view()` reports. */
  let ridersOf: number[] = [];
  let clock = 0;
  let night = 0;
  const stats: FlumeMeshStats = {
    flumes: 0,
    meshes: 0,
    triangles: 0,
    trough: 0,
    riders: 0,
    lights: 0,
    buildMs: 0,
    textureMs: materials.textureMs,
    interpolated: false,
    splashes: 0,
  };

  const groundAt = (x: number, z: number): number => terrain?.height(x, z) ?? 0;

  function meshFrom(name: string, geo: Geo, material: Material, colors?: number[]): Mesh | null {
    if (geo.indices.length === 0) return null;
    const mesh = new Mesh(name, scene);
    const data = new VertexData();
    data.positions = geo.positions;
    data.normals = geo.normals;
    data.uvs = geo.uvs;
    data.indices = geo.indices;
    if (colors && colors.length) data.colors = colors;
    data.applyToMesh(mesh, false);
    mesh.material = material;
    mesh.receiveShadows = true;
    mesh.isPickable = true;
    mesh.alwaysSelectAsActiveMesh = false;
    mesh.freezeWorldMatrix();
    return mesh;
  }

  function rigFor(style: FlumeStyleSpec): RigBatch {
    const cached = rigs.get(style.id);
    if (cached) return cached;
    const built: RigBuild = buildRig(style.rig);
    const hullColor = style.rig.colors[0];
    const wearColor = style.rig.wear[0];
    const batch: RigBatch = {
      hull:
        style.rig.hull === 'none'
          ? null
          : meshFrom(`flume-hull:${style.id}`, built.hull, materials.hull(hullColor)),
      rider: meshFrom(`flume-rider:${style.id}`, built.rider, materials.hull(wearColor)),
      seats: built.seats,
      hullMatrices: new Float32Array(MAX_RIDERS * 16),
      riderMatrices: new Float32Array(MAX_RIDERS * built.seats.length * 16),
      hullCount: 0,
      riderCount: 0,
    };
    for (const mesh of [batch.hull, batch.rider]) {
      if (!mesh) continue;
      mesh.unfreezeWorldMatrix();
      mesh.isPickable = false;
      mesh.receiveShadows = false;
      mesh.alwaysSelectAsActiveMesh = true;
      mesh.thinInstanceSetBuffer(
        'matrix',
        mesh === batch.hull ? batch.hullMatrices : batch.riderMatrices,
        16,
        false
      );
      mesh.thinInstanceCount = 0;
    }
    rigs.set(style.id, batch);
    return batch;
  }

  function draw(entity: Entity): void {
    const t0 = performance.now();
    const flume = resolveFlume(
      ctx.registry,
      entity,
      groundAt(entity.position[0], entity.position[2])
    );
    if (!flume) return;
    let build: FlumeBuild;
    try {
      build = buildFlume(flume);
    } catch (error) {
      console.error(`[game/flumes] could not build ${entity.id}`, error);
      return;
    }
    for (const w of build.warnings) console.warn(`[game/flumes] ${entity.id}: ${w}`);

    const meshes: Mesh[] = [];
    const push = (m: Mesh | null) => {
      if (m) meshes.push(m);
    };

    const shell = buildShell(build.stations, flume.style, flume.radius);
    push(meshFrom(`flume-shell:${entity.id}`, shell, materials.shell(flume.color)));

    const sheet: FlowGeo = buildWaterSheet(build.stations, flume.style, flume.radius);
    const water = meshFrom(`flume-water:${entity.id}`, sheet, materials.water(), sheet.colors);
    if (water) {
      water.isPickable = false;
      water.receiveShadows = false;
    }
    push(water);

    // Columns, from `track`'s own support builder. `structureDepth` is measured from the
    // HEARTLINE on a coaster and this module's spline is the trough floor, so the heartline is
    // taken back off — see `CRADLE_DEPTH`.
    const support = buildSupports(
      build.spline,
      build.stations.map((s) => s.frame),
      {
        kind: 'steel',
        ground: groundAt,
        load: (s) => {
          const st = build.physics.stations;
          if (!st.length) return 1;
          const i = Math.min(st.length - 1, Math.max(0, Math.round((s / build.length) * (st.length - 1)))); // prettier-ignore
          return Math.max(0.6, st[i].gVert);
        },
        structureDepth: CRADLE_DEPTH - HEARTLINE_HEIGHT,
        clearance: flume.radius * 1.6 + 0.6,
        minHeight: 0.9,
      }
    );
    push(meshFrom(`flume-legs:${entity.id}`, support.member, materials.surface('steel', flume.tower.steel))); // prettier-ignore
    push(meshFrom(`flume-pads:${entity.id}`, support.footing, materials.surface('deck', '#a8a196'))); // prettier-ignore

    const deckY = flume.position[1] + flume.towerHeight;
    const tower = buildTower({
      spec: flume.tower,
      // The deck sits BEHIND the start of the chute, so the flume leaves it rather than starting
      // in mid-air off its edge: back off along the layout's heading by half the footprint.
      centre: [
        flume.position[0] - Math.sin(flume.yaw) * (flume.tower.footprint[1] / 2 - 0.4),
        deckY,
        flume.position[2] - Math.cos(flume.yaw) * (flume.tower.footprint[1] / 2 - 0.4),
      ],
      yaw: flume.yaw,
      ground: groundAt(flume.position[0], flume.position[2]),
      deckY,
      chuteWidth: flume.radius * 2 + flume.style.thickness * 2,
    });
    push(meshFrom(`flume-tower:${entity.id}`, tower.steel, materials.surface('steel', flume.tower.steel))); // prettier-ignore
    push(meshFrom(`flume-deck:${entity.id}`, tower.deck, materials.surface('deck', flume.tower.deck))); // prettier-ignore
    push(meshFrom(`flume-canopy:${entity.id}`, tower.canopy, materials.surface('shade', flume.tower.canopyColor))); // prettier-ignore

    rigFor(flume.style);
    drawn.set(entity.id, {
      build,
      meshes,
      triangles: triangleCount(shell) + triangleCount(sheet) + support.triangles + tower.triangles,
      exit: [build.exit[0], build.exit[1], build.exit[2]],
    });
    stats.buildMs += performance.now() - t0;
  }

  function clear(id: string): void {
    const d = drawn.get(id);
    if (!d) return;
    const env = ctx.module<EnvironmentLike>('environment');
    for (const mesh of d.meshes) {
      env?.removeShadowCaster?.(mesh);
      mesh.dispose();
    }
    drawn.delete(id);
  }

  function rebuild(): void {
    stats.buildMs = 0;
    for (const id of [...drawn.keys()]) clear(id);
    order = [...placements.keys()].sort();
    for (const id of order) {
      const entity = placements.get(id);
      if (entity) draw(entity);
    }
    refresh();
  }

  /**
   * Shadow casters, the counters and the light pool, without rebuilding the geometry.
   *
   * Adding a slide used to run the whole park's build again — five placements staged one at a time
   * is fifteen builds of the same four splines — so an add draws itself and this brings the rest of
   * the module up to date.
   */
  function refresh(): void {
    const env = ctx.module<EnvironmentLike>('environment');
    for (const mesh of shadowed) env?.removeShadowCaster?.(mesh);
    shadowed = [];
    let meshCount = 0;
    let triangles = 0;
    let trough = 0;
    for (const d of drawn.values()) {
      meshCount += d.meshes.length;
      triangles += d.triangles;
      trough += d.build.length;
      if (env?.addShadowCaster) {
        // The tower and the trough cast; the sheet of water does not — a shadow map entry for a
        // transparent surface buys a dark band down the flume and nothing else.
        for (const mesh of d.meshes) {
          if (mesh.name.startsWith('flume-water')) continue;
          env.addShadowCaster(mesh, false);
          shadowed.push(mesh);
        }
      }
    }
    stats.flumes = drawn.size;
    stats.meshes = meshCount;
    stats.triangles = triangles;
    stats.trough = trough;
    rebuildLights();
  }

  /**
   * The night rig, from the pack's `night.light` block and nothing else.
   *
   * A pool of lights rather than one per slide, for the reason `rides`, `shops` and `scenery` all
   * recorded: they are not free, and four in a park is the budget. They are hung at the TOP of the
   * slide rather than at its centre — a tower is the tallest thing this module draws and a light
   * on it reads from the `overview` camera, while one halfway down a trough lights the underside
   * of the trough.
   */
  function rebuildLights(): void {
    for (const light of lights) light.dispose();
    lights.length = 0;
    lightOf.clear();
    const budget = LIGHT_POOL[ctx.quality.preset] ?? 2;
    if (budget <= 0) return;
    const wanted = [...drawn.entries()]
      .filter(([, d]) => d.build.flume.night)
      .sort((a, b) => (b[1].build.flume.night?.range ?? 0) - (a[1].build.flume.night?.range ?? 0))
      .slice(0, budget);
    for (const [id, d] of wanted) {
      const rig = d.build.flume.night!;
      const f = d.build.flume;
      const light = new PointLight(
        `flumes-night:${id}`,
        new Vector3(f.position[0], f.position[1] + f.towerHeight + rig.height, f.position[2]),
        scene
      );
      const [r, g, b] = hexToLinear(rig.color);
      light.diffuse = new Color3(r, g, b);
      light.specular = new Color3(r * 0.4, g * 0.4, b * 0.4);
      light.range = Math.max(rig.range, f.towerHeight * 1.4);
      light.intensity = 0;
      light.shadowEnabled = false;
      lights.push(light);
      lightOf.set(id, light);
    }
    stats.lights = lights.length;
  }

  function animateLights(dt: number): void {
    if (!lights.length) return;
    for (const [id, light] of lightOf) {
      const rig = drawn.get(id)?.build.flume.night;
      if (!rig) continue;
      let scale = 1;
      if (rig.mode === 'strobe') scale = clock % 1.4 < 0.16 ? 1 : 0.08;
      else if (rig.mode === 'chase') scale = 0.55 + 0.45 * Math.sin(clock * 3.1);
      const colors = rig.colors.length ? rig.colors : [rig.color];
      const step = Math.floor(clock * (rig.mode === 'cycle' ? 0.5 : 1.6)) % colors.length;
      const [r, g, b] = hexToLinear(colors[step]);
      light.diffuse.set(r, g, b);
      light.intensity = rig.intensity * night * scale;
    }
    void dt;
  }

  // ── riders ────────────────────────────────────────────────────────────────────────────────
  const scratchMatrix = Matrix.Identity();
  const scratchPos = new Vector3();
  const scratchQuat = new Quaternion();
  const scratchScale = new Vector3(1, 1, 1);
  const prevQuat = new Quaternion();

  function updateRiders(frame: SimFrame, previous: SimFrame | null, alpha: number): void {
    const buffer = frame.buffers['flumes.riders'];
    for (const batch of rigs.values()) {
      batch.hullCount = 0;
      batch.riderCount = 0;
    }
    if (!buffer) {
      commitRiders();
      return;
    }
    const now = new Float32Array(buffer);
    const before = previous?.buffers['flumes.riders'];
    const canLerp = !!before && before.byteLength === buffer.byteLength && alpha > 0 && alpha < 1;
    const prior = canLerp ? new Float32Array(before as ArrayBuffer) : null;
    stats.interpolated = canLerp;

    const pools = ctx.module<PoolsLike>('pools');
    ridersOf = new Array(order.length).fill(0);
    let live = 0;
    for (let slot = 0; slot < MAX_RIDERS; slot++) {
      const o = slot * RIDER_STRIDE;
      const which = now[o];
      if (which <= 0) {
        // The slot went empty between two frames: the rider reached the run-out and landed.
        if (lastFlume[slot] > 0) {
          splashFor(lastFlume[slot] - 1, lastSpeed[slot], pools);
          lastFlume[slot] = 0;
        }
        continue;
      }
      live += 1;
      const index = Math.round(which) - 1;
      const id = order[index];
      const d = id ? drawn.get(id) : undefined;
      lastFlume[slot] = index + 1;
      lastSpeed[slot] = now[o + 9];
      if (index >= 0 && index < ridersOf.length) ridersOf[index] += 1;
      if (!d) continue;
      const style = d.build.flume.style;
      const batch = rigs.get(style.id);
      if (!batch) continue;

      // Interpolate only when the previous frame describes the same rider in the same slot; a slot
      // that has just been re-let holds a different person and lerping between the two would fly
      // them up the slide.
      const same = prior != null && Math.round(prior[o]) === Math.round(which) && prior[o + 1] <= now[o + 1] + 1e-6; // prettier-ignore
      if (same && prior) {
        scratchPos.set(
          prior[o + 2] + (now[o + 2] - prior[o + 2]) * alpha,
          prior[o + 3] + (now[o + 3] - prior[o + 3]) * alpha,
          prior[o + 4] + (now[o + 4] - prior[o + 4]) * alpha
        );
        prevQuat.set(prior[o + 5], prior[o + 6], prior[o + 7], prior[o + 8]);
        scratchQuat.set(now[o + 5], now[o + 6], now[o + 7], now[o + 8]);
        Quaternion.SlerpToRef(prevQuat, scratchQuat, alpha, scratchQuat);
      } else {
        scratchPos.set(now[o + 2], now[o + 3], now[o + 4]);
        scratchQuat.set(now[o + 5], now[o + 6], now[o + 7], now[o + 8]);
      }
      Matrix.ComposeToRef(scratchScale, scratchQuat, scratchPos, scratchMatrix);
      if (batch.hull) {
        scratchMatrix.copyToArray(batch.hullMatrices, batch.hullCount * 16);
        batch.hullCount += 1;
      }
      for (const [sx, sz] of batch.seats) {
        const seat = Matrix.Translation(sx, 0, sz).multiply(scratchMatrix);
        seat.copyToArray(batch.riderMatrices, batch.riderCount * 16);
        batch.riderCount += 1;
      }
    }
    stats.riders = live;
    commitRiders();
  }

  function commitRiders(): void {
    for (const batch of rigs.values()) {
      if (batch.hull) {
        batch.hull.thinInstanceCount = batch.hullCount;
        if (batch.hullCount > 0) batch.hull.thinInstanceBufferUpdated('matrix');
      }
      if (batch.rider) {
        batch.rider.thinInstanceCount = batch.riderCount;
        if (batch.riderCount > 0) batch.rider.thinInstanceBufferUpdated('matrix');
      }
    }
  }

  /**
   * Rings on the run-out pool, from `pools`' own contract.
   *
   * The strength is the speed the rider ARRIVED at rather than the slide's headline top speed: a
   * body slide hitting the water at eleven metres a second throws a bigger ring than a raft
   * coasting in at five, and the difference is visible.
   */
  function splashFor(index: number, arrival: number, pools: PoolsLike | undefined): void {
    const id = order[index];
    const d = id ? drawn.get(id) : undefined;
    if (!d || !pools) return;
    const [x, , z] = d.exit;
    const strength = Math.min(1.8, 0.35 + Math.max(0, arrival) / 8);
    if (pools.splash(x, z, strength)) stats.splashes += 1;
  }

  const offTerrain = ctx.events.on('terrain:changed', () => rebuild());

  for (const id of Object.keys(ctx.world.entities).sort()) {
    const entity = ctx.world.entities[id];
    if (entity.kind === 'flume') placements.set(id, entity);
  }
  rebuild();

  const api: FlumesMainApi = {
    catalogue: () => flumeLayouts(),
    styles: () => flumeStyles(),
    registerContent(packId, block) {
      const added = registerFlumes(packId, block);
      if (added) rebuild();
      return added;
    },
    create(spec) {
      const id = nextEntityId(ctx.world, 'flume');
      const entity = makeFlumeEntity({
        id,
        pack: spec.pack,
        item: spec.item,
        x: spec.x,
        z: spec.z,
        y: groundAt(spec.x, spec.z),
        yaw: spec.yaw,
        layout: spec.layout,
        towerHeight: spec.towerHeight,
        color: spec.color,
        splashdown: spec.splashdown,
      });
      ctx.dispatch('entity:add', entity);
      return id;
    },
    remove(id) {
      ctx.dispatch('entity:remove', { id });
    },
    flumes: () => [...drawn.values()].map((d) => d.build.flume),
    view(id) {
      const d = drawn.get(id);
      if (!d) return undefined;
      return {
        id,
        name: d.build.flume.name,
        style: d.build.flume.style.id,
        length: d.build.length,
        drop: d.build.drop,
        topSpeed: d.build.topSpeed,
        rideSeconds: d.build.rideSeconds,
        ridersPerHour: ridersPerHour(d.build.flume.style),
        riders: ridersOf[order.indexOf(id)] ?? 0,
        running: d.build.flume.running,
        // The descent counter is the WORKER's — it is what a save carries. This side sees the
        // frame and nothing else, so it says zero rather than inventing a number; read
        // `FlumesSimApi.view()` for it.
        descents: 0,
      };
    },
    exit(id) {
      const d = drawn.get(id);
      if (!d) return null;
      const end = d.build.spline.frameAt(d.build.length);
      return {
        position: [d.exit[0], d.exit[1], d.exit[2]],
        yaw: Math.atan2(end.tangent[0], end.tangent[2]),
      };
    },
    meshes() {
      const out: AbstractMesh[] = [];
      for (const d of drawn.values()) out.push(...d.meshes);
      for (const b of rigs.values()) {
        if (b.hull) out.push(b.hull);
        if (b.rider) out.push(b.rider);
      }
      return out;
    },
    stats: () => ({ ...stats }),
    focus(id) {
      const d = drawn.get(id);
      if (!d) return null;
      let minX = Infinity;
      let maxX = -Infinity;
      let minZ = Infinity;
      let maxZ = -Infinity;
      for (const st of d.build.stations) {
        minX = Math.min(minX, st.frame.p[0]);
        maxX = Math.max(maxX, st.frame.p[0]);
        minZ = Math.min(minZ, st.frame.p[2]);
        maxZ = Math.max(maxZ, st.frame.p[2]);
      }
      const f = d.build.flume;
      return {
        position: [(minX + maxX) / 2, f.position[1] + f.towerHeight * 0.55, (minZ + maxZ) / 2],
        radius: Math.max(12, Math.hypot(maxX - minX, maxZ - minZ) * 0.6),
      };
    },
  };

  return {
    api,
    onEntity(change: EntityChange) {
      if (change.type === 'remove') {
        if (!placements.delete(change.entity.id)) return;
        clear(change.entity.id);
        order = [...placements.keys()].sort();
        refresh();
        return;
      }
      if (change.entity.kind !== 'flume') return;
      placements.set(change.entity.id, change.entity);
      order = [...placements.keys()].sort();
      clear(change.entity.id);
      draw(change.entity);
      refresh();
    },
    onFrame(frame: SimFrame, previous: SimFrame | null, alpha: number) {
      updateRiders(frame, previous, alpha);
    },
    onRender(dt: number) {
      clock += dt;
      materials.animate(clock);
      animateLights(dt);
    },
    onEnvironment(env: EnvironmentState) {
      night = env.night;
      materials.setEnvironment(night);
    },
    dispose() {
      offTerrain();
      detachContent();
      const env = ctx.module<EnvironmentLike>('environment');
      for (const mesh of shadowed) env?.removeShadowCaster?.(mesh);
      shadowed = [];
      for (const light of lights) light.dispose();
      lights.length = 0;
      lightOf.clear();
      for (const id of [...drawn.keys()]) clear(id);
      for (const batch of rigs.values()) {
        batch.hull?.dispose();
        batch.rider?.dispose();
      }
      rigs.clear();
      placements.clear();
      materials.dispose();
    },
  };
}
