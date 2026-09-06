/**
 * Scenery on the main thread: the props, the foliage, the landscape dressing and the night rig.
 *
 * Three things happen here and nowhere else.
 *
 * **Placement is an entity command.** `place`, `placeLine` and `scatterBrush` build entities and
 * dispatch `entity:add`; core mirrors the command locally and the worker applies it, so the
 * picture and the simulation are fed by one path. Nothing draws a prop by calling into this
 * module directly, which is what lets a save, the demo-park factory and a player's click all
 * arrive the same way.
 *
 * **The landscape dressing is not entities.** `dress()` evaluates the deterministic scatter field
 * (`scatter.ts`) and puts the result straight into the batches. It is re-derived from the seed, so
 * it costs nothing in the save, and `sim.ts` can evaluate the identical field for a collision
 * query without any of it crossing the thread boundary.
 *
 * **Everything repeated is a thin instance.** A batch per catalogue key, meshes per LOD × variant
 * × material, matrices rewritten on a throttle (`batches.ts`). The one exception is the contact
 * decal, which is a single disc mesh shared by every prop in the park — one draw call for all the
 * grounding shadows there are.
 */

import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Matrix, Quaternion } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Scene } from '@babylonjs/core/scene';
import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine';
import { nextEntityId } from '../core/world';
import type {
  Entity,
  EntityChange,
  EnvironmentState,
  MainContext,
  MainHandle,
  Vec3,
} from '../core/types';
import { buildCatalog, type PropSpec } from './catalog';
import { createSceneryTextures, type SceneryTextures } from './textures';
import { createMaterials, type MaterialLibrary } from './materials';
import { createWindState, updateWind, type WindState } from './wind';
import { createBatch, type BatchHandle, type Instance } from './batches';
import { createNightRig, type NightRig } from './night-lights';
import { generatorFor } from './generators';
import { toMesh, newSurface, addDisc, srgb } from './geometry';
import {
  placeLine as planLine,
  placeSingle,
  scatterBrush as planScatter,
  variant01,
  variantSeed,
  type LineOptions,
  type PlacedProp,
  type ScatterOptions,
} from './placement';
import {
  defaultSpecies,
  evaluateScatter,
  woodlandSpecies,
  type ScatterInstance,
  type ScatterSpecies,
} from './scatter';

const TEXTURE_RESOLUTION: Record<string, number> = {
  low: 128,
  medium: 256,
  high: 256,
  ultra: 512,
};
const VARIANTS: Record<string, number> = { low: 1, medium: 2, high: 2, ultra: 3 };
const LOD_SCALE: Record<string, number> = { low: 0.6, medium: 0.85, high: 1, ultra: 1.25 };
/** Hard cap on ambient instances, so a `dress()` over a whole park cannot allocate without end. */
const AMBIENT_CAP = 14000;
/** Below this height a prop is not worth a shadow-map draw call per cascade. */
const SHADOW_MIN_HEIGHT = 0.9;
/** Contact decals are drawn for the nearest props only; past this they are under a pixel anyway. */
const CONTACT_RANGE = 90;
const CONTACT_CAP = 900;

export interface SceneryStats {
  props: number;
  ambient: number;
  batches: number;
  /** Meshes with at least one instance — this module's share of the draw-call budget. */
  drawnMeshes: number;
  triangles: number;
  lightSites: number;
  activeLights: number;
  textureMs: number;
  buildMs: number;
}

export interface SceneryMainApi {
  /** Every placeable prop, including this module's ambient species. */
  catalog(): ReadonlyMap<string, PropSpec>;
  spec(key: string): PropSpec | undefined;
  /** Place one prop; returns the entity id. `y` is taken from the terrain unless given. */
  place(
    key: string,
    x: number,
    z: number,
    opts?: { yaw?: number; scale?: number; y?: number }
  ): string | null;
  /** A run of props between two points — a fence, an avenue of lamps. */
  placeLine(key: string, a: [number, number], b: [number, number], opts?: LineOptions): string[];
  /** The scatter brush: a disc of props with Poisson-ish spacing. */
  scatterBrush(key: string, x: number, z: number, radius: number, opts?: ScatterOptions): string[];
  remove(id: string): void;
  /**
   * Dress the landscape: the ambient undergrowth, boulders and woodland. Not entities — a pure
   * function of the seed and the terrain, re-derived on load.
   */
  dress(opts?: {
    bounds?: [number, number, number, number];
    density?: number;
    woodland?: string[];
  }): number;
  clearDressing(): void;
  /** A standalone copy of a prop for a build ghost. The caller disposes it. */
  preview(key: string): TransformNode | null;
  stats(): SceneryStats;
}

interface EnvironmentApi {
  addShadowCaster?(mesh: unknown, includeDescendants?: boolean): void;
  removeShadowCaster?(mesh: unknown): void;
}

interface TerrainApi {
  height(x: number, z: number): number;
  paint(x: number, z: number): number;
  slope(x: number, z: number): number;
  waterLevel(): number;
}

export function createSceneryMain(ctx: MainContext): MainHandle {
  const scene = ctx.scene as Scene;
  const engine = ctx.engine as AbstractEngine;
  const t0 = performance.now();
  const webgl = (engine as { isWebGPU?: boolean }).isWebGPU !== true;
  const preset = ctx.quality.preset;

  const catalog = buildCatalog(ctx.registry);
  const textures: SceneryTextures = createSceneryTextures(
    scene,
    ctx.rng.int(1, 1 << 28),
    TEXTURE_RESOLUTION[preset] ?? 256
  );
  const wind: WindState = createWindState();
  const materials: MaterialLibrary = createMaterials(scene, textures, wind, { webgl });
  const nightRig: NightRig = createNightRig(scene, preset);

  // Registering with core's own seam means another module (or a tool) can ask whether a
  // `procedural` name is drawable without importing anything from this folder.
  for (const spec of catalog.values()) {
    ctx.registry.registerProcedural(spec.generator, () => generatorFor(spec.generator));
  }

  const batches = new Map<string, BatchHandle>();
  const entityOf = new Map<string, string>();
  const warned = new Set<string>();
  const ambientIds: string[] = [];
  let ambientCount = 0;
  let seconds = 0;
  let night = 0;
  let windMs = 3;
  let stats: SceneryStats = {
    props: 0,
    ambient: 0,
    batches: 0,
    drawnMeshes: 0,
    triangles: 0,
    lightSites: 0,
    activeLights: 0,
    textureMs: Math.round(textures.generateMs),
    buildMs: 0,
  };

  const terrain = () => ctx.module<TerrainApi>('terrain');
  const heightAt = (x: number, z: number) => terrain()?.height(x, z) ?? 0;

  // ── The contact decal: one mesh, one draw call, every prop in the park ────────────────────
  const contactSurface = newSurface();
  addDisc(contactSurface, 0, 0, 0, 1, 14, srgb(0xffffff), 0);
  const contactMesh = toMesh(scene, 'scenery:contact', contactSurface, materials.contact);
  contactMesh.isVisible = false;
  contactMesh.receiveShadows = false;
  contactMesh.thinInstanceCount = 0;
  contactMesh.freezeWorldMatrix();
  // Drawn after the opaque pass and never written to depth, so it multiplies whatever is under it.
  contactMesh.alphaIndex = 5;
  let contactMatrices = new Float32Array(0);
  let contactCapacity = 0;
  const contactScratch = new Matrix();
  const contactQuat = Quaternion.Identity();
  const contactScale = new Vector3(1, 1, 1);
  const contactPos = new Vector3();

  function batchFor(key: string): BatchHandle | null {
    const existing = batches.get(key);
    if (existing) return existing;
    const spec = catalog.get(key);
    if (!spec) return null;
    const batch = createBatch({
      scene,
      materials,
      spec,
      seed: ctx.rng.int(1, 1 << 28),
      variantCount: VARIANTS[preset] ?? 2,
      lodScale: LOD_SCALE[preset] ?? 1,
      onFallback: (s) => {
        if (warned.has(s.key)) return;
        warned.add(s.key);
        console.warn(
          `[game/scenery] "${s.key}" asks for procedural "${s.requested}", which no generator ` +
            `implements — falling back to "${s.generator}". Add the generator or fix the manifest.`
        );
      },
    });
    batches.set(key, batch);
    const env = ctx.module<EnvironmentApi>('environment');
    if (env?.addShadowCaster && spec.height >= SHADOW_MIN_HEIGHT) {
      // Two filters, and both are about the cascaded shadow map costing a draw call PER CASCADE
      // per caster. LOD 2 is an imposter card whose shadow would be a rectangle on the grass; and
      // anything under waist height casts a shadow nobody can pick out of the grass texture — the
      // ground cover alone was ~110 of the 308 draw calls the first measurement showed, entirely
      // in shadow passes. The batch names its meshes `…:l<lod>v<variant>:<material>`.
      for (const mesh of batch.meshes()) {
        if (!mesh.name.includes(':l2v')) env.addShadowCaster(mesh, false);
      }
    }
    return batch;
  }

  function instanceFrom(entity: Entity, spec: PropSpec): Instance {
    const seed = variantSeed(entity.id, ctx.world.meta.seed);
    const lean = spec.cls === 'foliage' ? 0.055 : 0;
    return {
      id: entity.id,
      x: entity.position[0],
      y: entity.position[1],
      z: entity.position[2],
      yaw: entity.yaw,
      scale: entity.scale ?? 1,
      tiltX: (variant01(seed, 3) - 0.5) * 2 * lean,
      tiltZ: (variant01(seed, 4) - 0.5) * 2 * lean,
      variantSeed: seed,
    };
  }

  function addEntity(entity: Entity): void {
    if (entity.kind !== 'scenery') return;
    const key = `${entity.pack}:${entity.item}`;
    const spec = catalog.get(key);
    if (!spec) return;
    const batch = batchFor(key);
    if (!batch) return;
    batch.add(instanceFrom(entity, spec));
    entityOf.set(entity.id, key);
    if (spec.night) {
      const offset = batch.lightOffset();
      nightRig.add({
        id: entity.id,
        x: entity.position[0] + offset[0],
        y: entity.position[1],
        z: entity.position[2] + offset[2],
        def: spec.night,
        phase: variant01(variantSeed(entity.id, 17), 1),
      });
    }
  }

  function removeEntity(id: string): void {
    const key = entityOf.get(id);
    if (!key) return;
    batches.get(key)?.remove(id);
    entityOf.delete(id);
    nightRig.remove(id);
  }

  // ── Placement ────────────────────────────────────────────────────────────────────────────

  function commit(spec: PropSpec, placed: PlacedProp, y?: number): string {
    const id = nextEntityId(ctx.world, 'scenery');
    const position: Vec3 = [placed.x, y ?? heightAt(placed.x, placed.z), placed.z];
    const entity: Entity = {
      id,
      kind: 'scenery',
      pack: spec.pack,
      item: spec.item,
      position,
      yaw: placed.yaw,
      scale: placed.scale,
    };
    ctx.dispatch('entity:add', entity);
    return id;
  }

  const api: SceneryMainApi = {
    catalog: () => catalog,
    spec: (key) => catalog.get(key),
    place(key, x, z, opts) {
      const spec = catalog.get(key);
      if (!spec) return null;
      const placed = placeSingle(spec, x, z, () => ctx.rng.next(), {
        yaw: opts?.yaw ?? null,
        scale: opts?.scale,
      });
      return commit(spec, placed, opts?.y);
    },
    placeLine(key, a, b, opts) {
      const spec = catalog.get(key);
      if (!spec) return [];
      return planLine(spec, a, b, () => ctx.rng.next(), opts).map((p) => commit(spec, p));
    },
    scatterBrush(key, x, z, radius, opts) {
      const spec = catalog.get(key);
      if (!spec) return [];
      const mix = opts?.mix;
      const planned = planScatter(spec, x, z, radius, () => ctx.rng.next(), {
        ...opts,
        mix,
      });
      const out: string[] = [];
      for (const p of planned) {
        const target = catalog.get(p.key) ?? spec;
        out.push(commit(target, p));
      }
      return out;
    },
    remove(id) {
      if (!ctx.world.entities[id]) return;
      ctx.dispatch('entity:remove', { id });
    },
    dress(opts) {
      const t = terrain();
      if (!t) return 0;
      const size = ctx.world.terrain.size;
      const half = size / 2;
      const bounds =
        opts?.bounds ?? ([-half, -half, half, half] as [number, number, number, number]);
      const density = opts?.density ?? 1;
      const woodland = opts?.woodland ?? [];
      api.clearDressing();
      const species: ScatterSpecies[] = [
        ...defaultSpecies(catalog),
        ...woodlandSpecies(catalog, woodland),
      ];
      if (!species.length) return 0;
      const instances: ScatterInstance[] = evaluateScatter({
        bounds,
        seed: ctx.world.meta.seed >>> 0,
        species,
        densityScale: density * (ctx.quality.foliageDensity ?? 1),
        height: (x, z) => t.height(x, z),
        paint: (x, z) => t.paint(x, z),
        slope: (x, z) => t.slope(x, z),
        waterLevel: t.waterLevel(),
        excluded: (x, z, radius) => nearPlacedProp(x, z, radius),
      });
      let added = 0;
      for (const inst of instances) {
        if (added >= AMBIENT_CAP) break;
        const spec = catalog.get(inst.key);
        if (!spec) continue;
        const batch = batchFor(inst.key);
        if (!batch) continue;
        const id = `~${added}`;
        const seed = variantSeed(`${inst.key}:${added}`, ctx.world.meta.seed);
        const lean = spec.cls === 'foliage' ? 0.07 : 0.2;
        batch.add({
          id,
          x: inst.x,
          y: inst.y,
          z: inst.z,
          yaw: inst.yaw,
          scale: inst.scale,
          tiltX: (variant01(seed, 5) - 0.5) * 2 * lean,
          tiltZ: (variant01(seed, 6) - 0.5) * 2 * lean,
          variantSeed: seed,
        });
        ambientIds.push(`${inst.key}|${id}`);
        added += 1;
      }
      ambientCount = added;
      ctx.dispatch('scenery:dress', { dressed: true, density, woodland });
      return added;
    },
    clearDressing() {
      for (const entry of ambientIds) {
        const at = entry.indexOf('|');
        batches.get(entry.slice(0, at))?.remove(entry.slice(at + 1));
      }
      ambientIds.length = 0;
      ambientCount = 0;
    },
    preview(key) {
      const spec = catalog.get(key);
      if (!spec) return null;
      const root = new TransformNode(`scenery-preview:${spec.key}`, scene);
      const build = generatorFor(spec.generator)({ spec, lod: 0, seed: 1234, night: spec.night });
      for (const p of build.parts) {
        if (!p.surface.indices.length) continue;
        const material =
          p.material === 'emissive'
            ? materials.emissive(p.emissiveColor ?? '#ffd9a0')
            : materials[p.material];
        const mesh = toMesh(scene, `${root.name}:${p.material}`, p.surface, material);
        mesh.parent = root;
        mesh.isPickable = false;
      }
      return root;
    },
    stats: () => stats,
  };

  /** Placed props keep the dressing off their footprint; the grid keeps that query cheap. */
  const propGrid = new Map<number, Array<{ x: number; z: number; r: number }>>();
  const GRID = 12;
  function rebuildPropGrid(): void {
    propGrid.clear();
    for (const [id, key] of entityOf) {
      const spec = catalog.get(key);
      const entity = ctx.world.entities[id];
      if (!spec || !entity) continue;
      const x = entity.position[0];
      const z = entity.position[2];
      const r = spec.clearance * (entity.scale ?? 1);
      const cell = (Math.floor(x / GRID) + 4096) * 8192 + (Math.floor(z / GRID) + 4096);
      const bucket = propGrid.get(cell);
      if (bucket) bucket.push({ x, z, r });
      else propGrid.set(cell, [{ x, z, r }]);
    }
  }
  function nearPlacedProp(x: number, z: number, radius: number): boolean {
    const cx = Math.floor(x / GRID);
    const cz = Math.floor(z / GRID);
    for (let ox = -1; ox <= 1; ox++) {
      for (let oz = -1; oz <= 1; oz++) {
        const bucket = propGrid.get((cx + ox + 4096) * 8192 + (cz + oz + 4096));
        if (!bucket) continue;
        for (const p of bucket) {
          const need = radius + p.r;
          if ((p.x - x) ** 2 + (p.z - z) ** 2 < need * need) return true;
        }
      }
    }
    return false;
  }

  // ── Contact decals ───────────────────────────────────────────────────────────────────────

  function refreshContact(camera: Vector3): void {
    const wanted: Array<{ x: number; y: number; z: number; r: number }> = [];
    for (const batch of batches.values()) {
      const radius = batch.contactRadius();
      if (radius <= 0.05) continue;
      for (const instance of batch.instances) {
        if (wanted.length >= CONTACT_CAP) break;
        const dx = instance.x - camera.x;
        const dz = instance.z - camera.z;
        if (dx * dx + dz * dz > CONTACT_RANGE * CONTACT_RANGE) continue;
        wanted.push({
          x: instance.x,
          y: instance.y,
          z: instance.z,
          r: radius * instance.scale,
        });
      }
    }
    if (wanted.length > contactCapacity) {
      contactCapacity = Math.max(64, wanted.length * 2);
      contactMatrices = new Float32Array(contactCapacity * 16);
      contactMesh.thinInstanceSetBuffer('matrix', contactMatrices, 16, false);
    }
    for (let i = 0; i < wanted.length; i++) {
      const w = wanted[i];
      contactScale.set(w.r, 1, w.r);
      // 4 cm above the ground: below that it z-fights with the terrain on a shallow slope, above
      // it the shadow visibly floats when the camera drops to eye level.
      contactPos.set(w.x, w.y + 0.04, w.z);
      Matrix.ComposeToRef(contactScale, contactQuat, contactPos, contactScratch);
      contactScratch.copyToArray(contactMatrices, i * 16);
    }
    contactMesh.thinInstanceCount = wanted.length;
    contactMesh.isVisible = wanted.length > 0;
    if (wanted.length > 0) {
      contactMesh.thinInstanceBufferUpdated('matrix');
      contactMesh.thinInstanceRefreshBoundingInfo(false);
    }
  }

  // ── Frame ────────────────────────────────────────────────────────────────────────────────

  let gridDirty = true;
  let sinceContact = 1;
  const buildMs = performance.now() - t0;
  stats = { ...stats, buildMs: Math.round(buildMs) };

  function recomputeStats(): void {
    let drawn = 0;
    let triangles = 0;
    let props = 0;
    for (const batch of batches.values()) {
      const s = batch.stats();
      drawn += s.drawn;
      triangles += s.triangles;
      props += s.instances;
    }
    if (contactMesh.thinInstanceCount > 0) drawn += 1;
    stats = {
      props: props - ambientCount,
      ambient: ambientCount,
      batches: batches.size,
      drawnMeshes: drawn,
      triangles: Math.round(triangles),
      lightSites: nightRig.count(),
      activeLights: nightRig.active(),
      textureMs: Math.round(textures.generateMs),
      buildMs: Math.round(buildMs),
    };
  }

  return {
    api,
    onEntity(change: EntityChange) {
      if (change.type === 'add') addEntity(change.entity);
      else if (change.type === 'update') {
        removeEntity(change.entity.id);
        addEntity(change.entity);
      } else removeEntity(change.entity.id);
      gridDirty = true;
    },
    onEnvironment(env: EnvironmentState) {
      night = env.night;
      windMs = env.windMs;
      materials.setNight(night);
      // The environment has a wind speed and no direction; a slow drift keyed to the day means
      // every park does not have its flags pointing the same way forever.
      const angle = env.day * 0.7 + env.minute * 0.0006;
      wind.dirX = Math.cos(angle);
      wind.dirZ = Math.sin(angle);
    },
    onRender(dt: number) {
      seconds += dt;
      updateWind(wind, dt, windMs);
      const camera = scene.activeCamera;
      const eye = camera ? camera.globalPosition : Vector3.Zero();
      if (gridDirty) {
        gridDirty = false;
        rebuildPropGrid();
      }
      let refreshed = false;
      for (const batch of batches.values()) {
        if (batch.needsRefresh(eye, dt)) {
          batch.refresh(eye);
          batch.markRefreshed(eye);
          refreshed = true;
        }
      }
      sinceContact += dt;
      if (refreshed || sinceContact > 0.5) {
        sinceContact = 0;
        refreshContact(eye);
        recomputeStats();
      }
      nightRig.update(eye, night, dt);
    },
    dispose() {
      nightRig.dispose();
      const env = ctx.module<EnvironmentApi>('environment');
      for (const batch of batches.values()) {
        if (env?.removeShadowCaster) {
          for (const mesh of batch.meshes()) env.removeShadowCaster(mesh);
        }
        batch.dispose();
      }
      batches.clear();
      entityOf.clear();
      ambientIds.length = 0;
      contactMesh.dispose(false, false);
      materials.dispose();
      textures.dispose();
      void seconds;
    },
  };
}

/** Re-exported so the showcase can name the mesh type without importing Babylon itself. */
export type { Mesh };
