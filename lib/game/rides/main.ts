/**
 * The main-thread half: materials, the instanced rigs, the night light rig, and the wiring.
 *
 * Thin on purpose — how a machine LOOKS is `shapes.ts`, how it MOVES is `rig.ts`, how it is BATCHED
 * is `geometry.ts` and what it DOES is `sim.ts` on the worker.
 *
 * **The roster arrives as an event, not in the frame.** A ride's id, its pack, its item and the
 * length of its run are strings and constants that change when somebody builds or demolishes
 * something; putting them in a 20 Hz frame would be re-sending a constant twenty times a second.
 * `sim.ts` emits `ride:roster`, core forwards it (the `ride:` prefix is already in
 * `FORWARDED_PREFIXES`), and the frame carries `rides.motion` and `rides.state` and nothing else.
 *
 * **A ride's Y comes from the terrain, not from the entity.** A build tool that has not sampled the
 * ground writes `position[1] = 0`, which is the sea in this park; every placement is re-grounded
 * here and again whenever the terrain changes under it.
 */

import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';
import type {
  Entity,
  EntityChange,
  EnvironmentState,
  MainContext,
  MainHandle,
  SimFrame,
} from '../core/types';
import { attachRideContent, resolveFlatRide } from './manifest';
import { createRideMaterials, type RideMaterials } from './materials';
import { buildQueue } from './queue-mesh';
import { queueSlots } from './queue';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { createRideRenderer, type RideMeshStats, type RidePlacement } from './geometry';
import { hexToLinear } from './shapes';
import type { FlatRideProfile } from './types';

interface TerrainLike {
  height(x: number, z: number): number;
}
interface EnvironmentLike {
  addShadowCaster?(mesh: unknown, includeDescendants?: boolean): void;
  removeShadowCaster?(mesh: unknown): void;
}

interface RosterEntry {
  id: string;
  key: string;
  pack: string;
  item: string;
  runSeconds: number;
  /** The queue anchor, absent on a roster published before `queueAnchor` existed. */
  queueX?: number;
  queueZ?: number;
  queueDirX?: number;
  queueDirZ?: number;
  capacity?: number;
}

/** Night lights per preset. Same shape and the same reason as `shops`: they are not free. */
const LIGHT_POOL: Record<string, number> = { low: 0, medium: 3, high: 4, ultra: 6 };

export interface RidesMainApi {
  /** Every flat ride any registered pack declares — a build bar reads this, not a hard-coded list. */
  catalogue(): FlatRideProfile[];
  profile(id: string): FlatRideProfile | undefined;
  meshes(): AbstractMesh[];
  stats(): RideMeshStats & { rides: number; lights: number };
  /** Ride ids in the frame-buffer order the worker publishes. */
  roster(): string[];
  /** World point the camera should look at to see one ride, and how far back to stand. */
  focus(id: string): { position: [number, number, number]; radius: number } | null;
}

export function createRidesMain(ctx: MainContext): MainHandle {
  const detachContent = attachRideContent(ctx.registry);
  const scene = ctx.scene as Scene;
  const materials: RideMaterials = createRideMaterials(scene, ctx.rng.int(1, 1 << 28));
  const renderer = createRideRenderer(scene, materials);
  const terrain = ctx.module<TerrainLike>('terrain');

  const profiles = new Map<string, FlatRideProfile>();
  const placements = new Map<string, RidePlacement>();
  let roster: RosterEntry[] = [];
  let shadowed: Mesh[] = [];
  const lights: PointLight[] = [];
  const lightOf = new Map<string, PointLight>();
  let night = 0;
  let clock = 0;

  function profileFor(key: string): FlatRideProfile | null {
    const cached = profiles.get(key);
    if (cached) return cached;
    const colon = key.indexOf(':');
    if (colon < 0) return null;
    const resolved = resolveFlatRide(ctx.registry, key.slice(0, colon), key.slice(colon + 1));
    if (resolved) profiles.set(key, resolved);
    return resolved;
  }

  function place(entity: Entity): void {
    if (entity.kind !== 'ride') return;
    const key = `${entity.pack}:${entity.item}`;
    if (!profileFor(key)) return;
    const y = entity.position[1] || terrain?.height(entity.position[0], entity.position[2]) || 0;
    placements.set(entity.id, {
      id: entity.id,
      key,
      position: [entity.position[0], y, entity.position[2]],
      yaw: entity.yaw,
      scale: entity.scale ?? 1,
    });
  }

  function rebuild(): void {
    renderer.setPlacements([...placements.values()], profileFor);
    const env = ctx.module<EnvironmentLike>('environment');
    for (const mesh of shadowed) env?.removeShadowCaster?.(mesh);
    shadowed = [];
    if (env?.addShadowCaster) {
      for (const mesh of renderer.shadowMeshes()) {
        env.addShadowCaster(mesh, false);
        shadowed.push(mesh);
      }
    }
    rebuildLights();
  }

  /**
   * The night rig, from the manifest's `night.light` and nothing else.
   *
   * A pool, not a light per ride: `shops` and `scenery` both recorded what happens without one —
   * two lit objects and ten with a glow and no pool of light under them — and the answer is the
   * same here, so the pool goes to the rides that carry a `night.light` block, in roster order,
   * biggest `range` first. `mode` drives the colour: `chase` and `cycle` walk the declared colour
   * list, `strobe` blinks, `steady` sits still.
   */
  function rebuildLights(): void {
    for (const light of lights) light.dispose();
    lights.length = 0;
    lightOf.clear();
    const budget = LIGHT_POOL[ctx.quality.preset] ?? 2;
    if (budget <= 0) return;
    const wanted = [...placements.values()]
      .map((p) => ({ p, profile: profileFor(p.key) }))
      .filter((e) => e.profile?.night)
      .sort((a, b) => (b.profile!.night!.range ?? 0) - (a.profile!.night!.range ?? 0))
      .slice(0, budget);
    for (const { p, profile } of wanted) {
      const rig = profile!.night!;
      const light = new PointLight(
        `rides-night:${p.id}`,
        new Vector3(p.position[0], p.position[1] + rig.height, p.position[2]),
        scene
      );
      const [r, g, b] = hexToLinear(rig.color);
      light.diffuse = new Color3(r, g, b);
      light.specular = new Color3(r * 0.4, g * 0.4, b * 0.4);
      light.range = rig.range;
      light.intensity = 0;
      light.shadowEnabled = false;
      lights.push(light);
      lightOf.set(p.id, light);
    }
  }

  function animateLights(dt: number): void {
    if (!lights.length) return;
    clock += dt;
    for (const [id, light] of lightOf) {
      const profile = profileFor(placements.get(id)?.key ?? '');
      const rig = profile?.night;
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
  }

  /**
   * The switchbacks, one merged mesh per machine that has a line.
   *
   * Rebuilt from the ROSTER and not per frame: an anchor moves when a machine is built, moved or
   * demolished, and that is exactly what the roster announces. A 160-place queue is 2,912
   * triangles in two surfaces, so the whole park's lines are a handful of draw calls.
   *
   * Both keys of the roster feed it. `rides` is what this module DRAWS and `docked` is what it
   * runs a line for without drawing — a coaster's queue is this module's to build for the same
   * reason its tickets are, and the alternative is every machine module growing its own copy of
   * `queue.ts`.
   */
  const queueMeshes: Mesh[] = [];
  let lastRoster: RosterEntry[] = [];
  function rebuildQueues(entries: readonly RosterEntry[]): void {
    for (const mesh of queueMeshes) mesh.dispose();
    queueMeshes.length = 0;
    for (const entry of entries) {
      if (entry.queueX == null || entry.queueZ == null) continue;
      const dirX = entry.queueDirX ?? 0;
      const dirZ = entry.queueDirZ ?? 1;
      const len = Math.hypot(dirX, dirZ) || 1;
      const build = buildQueue(
        [entry.queueX, entry.queueZ],
        [dirX / len, dirZ / len],
        queueSlots(entry.capacity ?? 8),
        (x, z) => terrain?.height(x, z) ?? 0
      );
      for (const surface of build.surfaces) {
        if (surface.indices.length === 0) continue;
        const mesh = new Mesh(`ride-queue-${entry.id}-${surface.finish}`, scene);
        const data = new VertexData();
        data.positions = surface.positions;
        data.normals = surface.normals;
        data.uvs = surface.uvs;
        data.colors = surface.colors;
        data.indices = surface.indices;
        data.applyToMesh(mesh, false);
        mesh.material = materials.surface(surface.finish === 'lamp' ? 'matte' : surface.finish);
        mesh.useVertexColors = true;
        mesh.receiveShadows = true;
        mesh.isPickable = false;
        mesh.freezeWorldMatrix();
        queueMeshes.push(mesh);
      }
    }
  }

  const offRoster = ctx.events.on(
    'ride:roster',
    (payload: { rides: RosterEntry[]; docked?: RosterEntry[] }) => {
      roster = payload.rides ?? [];
      lastRoster = [...(payload.rides ?? []), ...(payload.docked ?? [])];
      rebuildQueues(lastRoster);
    }
  );
  const offTerrain = ctx.events.on('terrain:changed', () => {
    for (const id of placements.keys()) {
      const entity = ctx.world.entities[id];
      if (entity) place(entity);
    }
    renderer.setPlacements([...placements.values()], profileFor);
    // The rails follow the ground the same way the machines do, and for the same reason: a
    // handrail left at the old height is a handrail through a hillside.
    rebuildQueues(lastRoster);
  });

  for (const id of Object.keys(ctx.world.entities).sort()) place(ctx.world.entities[id]);
  rebuild();

  const api: RidesMainApi = {
    catalogue() {
      const out: FlatRideProfile[] = [];
      for (const item of ctx.registry.items('rides')) {
        const def = item.def as { kind?: string; id: string };
        if (def.kind !== 'flat') continue;
        const profile = profileFor(`${item.pack}:${def.id}`);
        if (profile) out.push(profile);
      }
      return out;
    },
    profile: (id) => {
      const key = placements.get(id)?.key;
      return key ? (profileFor(key) ?? undefined) : undefined;
    },
    meshes: () => renderer.meshes(),
    stats: () => ({ ...renderer.stats(), rides: placements.size, lights: lights.length }),
    roster: () => roster.map((r) => r.id),
    focus(id) {
      const p = placements.get(id);
      const profile = p ? profileFor(p.key) : null;
      if (!p || !profile) return null;
      const span = Math.max(profile.footprint[0], profile.footprint[1]);
      return {
        position: [p.position[0], p.position[1] + span * 0.28, p.position[2]],
        radius: span * 1.9,
      };
    },
  };

  return {
    api,
    onEntity(change: EntityChange) {
      if (change.type === 'remove') {
        if (!placements.delete(change.entity.id)) return;
        rebuild();
        return;
      }
      if (change.entity.kind !== 'ride') return;
      const before = placements.size;
      place(change.entity);
      if (placements.size !== before || change.type === 'update') rebuild();
    },
    onFrame(frame: SimFrame, previous: SimFrame | null, alpha: number) {
      renderer.update(
        frame,
        previous,
        alpha,
        roster.length ? roster.map((r) => r.id) : [...placements.keys()].sort()
      );
    },
    onRender(dt: number) {
      animateLights(dt);
    },
    onEnvironment(env: EnvironmentState) {
      night = env.night;
      materials.setNight(night);
    },
    dispose() {
      offRoster();
      offTerrain();
      detachContent();
      const environment = ctx.module<EnvironmentLike>('environment');
      for (const mesh of shadowed) environment?.removeShadowCaster?.(mesh);
      shadowed = [];
      for (const light of lights) light.dispose();
      lights.length = 0;
      lightOf.clear();
      renderer.dispose();
      materials.dispose();
      placements.clear();
      profiles.clear();
    },
  };
}
