/**
 * Shops on the main thread: the atlas, the buildings, the thin-instance batches and the night rig.
 *
 * Three things happen here and nowhere else.
 *
 * **A shop type is a batch, not a mesh per building.** Every `shop` entity of one `pack:item` is a
 * matrix in the same three meshes (opaque kit, glazing, signage), so a park with eight burger
 * stands costs exactly what a park with one costs. Two of those three are usually empty — most
 * shops have no glass and every shop with a fascia has signage — so the real figure is **one to
 * three draw calls per shop TYPE, independent of how many are built**. The numbers are in
 * `stats()` and in the report.
 *
 * **The building comes from the manifest, through one generator.** `build.ts` reads a resolved
 * style record; nothing here or there switches on a shop id or a pack id. A pack that ships a
 * `shopStyles` entry gets a different building with no TypeScript, and `pnpm test:game-shops`
 * registers a synthetic pack to prove it rather than asserting it in prose.
 *
 * **Night is signage plus a small pool of real lights.** Forty lit kiosks is forty light loops in
 * every fragment near them; the emissive fascia carries the look on every shop and a pool of two
 * to four point lights, moved to the nearest counters as the camera flies, carries the effect. The
 * negative `renderPriority` is load-bearing for the same reason `scenery/night-lights.ts` gives:
 * a PBR material takes the first N lights in scene order, not the nearest, so without it a kiosk
 * lamp can push the sun out of a material's light list and darken the park at noon.
 */

import '@babylonjs/core/Meshes/thinInstanceMesh';
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import type { Material } from '@babylonjs/core/Materials/material';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import type { Scene } from '@babylonjs/core/scene';
import type {
  Entity,
  EntityChange,
  EnvironmentState,
  MainContext,
  MainHandle,
} from '../core/types';
import { buildShop, seedForShop, type ShopBuild } from './build';
import { setAtlasResolution, type Surface } from './geometry';
import {
  attachShopContent,
  resolveShop,
  shopStyles,
  type ResolvedShop,
  type ShopItemLike,
} from './manifest';
import { createShopMaterials, type ShopMaterials } from './materials';
import { createShopAtlas, type ShopAtlas } from './textures';
import type { ShopEntityData, ShopStyleDef } from './types';

/**
 * Atlas tile resolution per preset.
 *
 * The generator is a per-pixel loop in JavaScript and it is the most expensive thing this module
 * does at boot: eight tiles at 256² is 524 k samples across three maps, which measured under a
 * second in headless Chromium. 512² would be four times that for a texel density no camera in this
 * game resolves — the closest a preset gets is the `close` camera at 12 m, where a 1.2 m render
 * tile at 256 px is already 213 px/m.
 */
const TILE_SIZE: Record<string, number> = { low: 96, medium: 160, high: 256, ultra: 256 };
/** Point lights in the night pool, by preset. */
const LIGHT_POOL: Record<string, number> = { low: 0, medium: 2, high: 3, ultra: 4 };
/** Metres past which a counter is not worth one of the pool's lights. */
const LIGHT_RANGE = 120;
/** Seconds between re-sorts of the pool. Three a second is under the eye's threshold for a pop. */
const POOL_INTERVAL = 0.4;

export interface ShopBatchStats {
  key: string;
  style: string;
  instances: number;
  meshes: number;
  triangles: number;
}

/** The sim half's per-frame scalars, forwarded so a HUD does not have to talk to the worker. */
export interface ShopsFrameStats {
  count: number;
  open: number;
  queue: number;
  takingsToday: number;
}

export interface ShopsMeshStats {
  shops: number;
  batches: number;
  /** Meshes with at least one instance — this module's share of the draw-call budget. */
  drawnMeshes: number;
  /** Triangles actually on screen: per-instance geometry × instance count. */
  triangles: number;
  /** Triangles in the unique geometry, i.e. what the GPU holds. */
  uniqueTriangles: number;
  lightSites: number;
  activeLights: number;
  atlasMs: number;
  buildMs: number;
  batchList: ShopBatchStats[];
  /**
   * What the tills said in the last frame.
   *
   * `SimFrame.stats` is the only channel the worker has for a scalar, and core forwards exactly two
   * of them into its own metrics (`guests.count`, `finance.cash`). Everything else in there reaches
   * the main thread through the module that wrote it, which is this — so a HUD, and a critic's
   * probe, can read the queue and the day's takings without opening the worker.
   */
  sim: ShopsFrameStats;
}

export interface ShopsMainApi {
  /** Every registered style; a build bar reads this rather than a hard-coded list. */
  styles(): ShopStyleDef[];
  /** Every mesh this module draws, for a critic or a debugger counting them. */
  meshes(): Mesh[];
  stats(): ShopsMeshStats;
  /** Where a guest stands to be served, in world space. Mirrors the sim api. */
  frontage(id: string): [number, number] | null;
}

interface TerrainLike {
  height(x: number, z: number): number;
}

interface EnvironmentApi {
  addShadowCaster?(mesh: unknown, includeDescendants?: boolean): void;
  removeShadowCaster?(mesh: unknown): void;
}

interface Batch {
  key: string;
  build: ShopBuild;
  meshes: Mesh[];
  /** Entity ids in insertion order; the matrix buffer follows it. */
  ids: string[];
  matrices: Float32Array;
  capacity: number;
  /** Triangles in one instance of this batch. */
  triangles: number;
}

interface Site {
  id: string;
  x: number;
  y: number;
  z: number;
  colour: string;
}

export function createShopsMain(ctx: MainContext): MainHandle {
  // Claim the pack categories and read them, at boot and afterwards. Both halves: `onPack` fires on
  // registration and the bundled packs are registered before any module is built.
  const detachContent = attachShopContent(ctx.registry);

  const scene = ctx.scene as Scene;
  const preset = ctx.quality.preset;
  const tileSize = TILE_SIZE[preset] ?? 160;
  setAtlasResolution(tileSize);
  const atlas: ShopAtlas = createShopAtlas(scene, ctx.rng.int(1, 1 << 28), tileSize);
  const materials: ShopMaterials = createShopMaterials(scene, atlas);
  const terrain = ctx.module<TerrainLike>('terrain');
  const env = ctx.module<EnvironmentApi>('environment');

  const batches = new Map<string, Batch>();
  /** Entity id → the batch it lives in, so a removal is O(1) to find. */
  const placed = new Map<string, { key: string; frontage: [number, number] }>();
  const sites = new Map<string, Site>();
  let buildMs = 0;
  let night = 0;
  const frameStats: ShopsFrameStats = { count: 0, open: 0, queue: 0, takingsToday: 0 };
  let poolClock = POOL_INTERVAL;
  let activeLights = 0;

  // ── The night pool ────────────────────────────────────────────────────────────────────────
  const pool: PointLight[] = [];
  for (let i = 0; i < (LIGHT_POOL[preset] ?? 2); i++) {
    const light = new PointLight(`shops-counter-${i}`, new Vector3(0, 0, 0), scene);
    light.intensity = 0;
    light.range = 12;
    light.diffuse = new Color3(1, 0.88, 0.7);
    light.specular = new Color3(0.35, 0.3, 0.24);
    // Behind the sun and the sky term; what gets dropped when a material runs out of slots is a
    // kiosk lamp, which is the right answer.
    light.renderPriority = -1;
    light.shadowEnabled = false;
    light.setEnabled(false);
    pool.push(light);
  }

  // ── Batching ──────────────────────────────────────────────────────────────────────────────

  const scratch = new Matrix();
  const scratchQuat = new Quaternion();
  const scratchScale = new Vector3(1, 1, 1);
  const scratchPos = new Vector3();

  function batchFor(resolved: ResolvedShop, entity: Entity): Batch | null {
    const data = (entity.data ?? {}) as ShopEntityData;
    const footprint = resolved.def.footprint ?? [4, 4];
    const signage = resolved.def.night?.signage;
    const counters = data.counters;
    // The key is everything that changes the GEOMETRY. Two shops that differ only in position
    // share it; two that differ in style, footprint, signage colour or counter count do not.
    const key = [
      resolved.key,
      data.style ?? resolved.style.id,
      `${footprint[0]}x${footprint[1]}`,
      signage ?? '-',
      counters ?? '-',
    ].join('|');
    const found = batches.get(key);
    if (found) return found;
    const t0 = performance.now();
    const build = buildShop({
      shop: resolved,
      footprint: [footprint[0], footprint[1]],
      // A seed off the batch key rather than the entity: two shops sharing a batch share one mesh,
      // so their variation has to come from the key or the second one would silently get the
      // first one's dressing anyway. Per-building variation is a batch split and is not free.
      seed: seedForShop(key),
      signage,
      counters,
    });
    buildMs += performance.now() - t0;
    const meshes: Mesh[] = [];
    const add = (surface: Surface, name: string, material: Material): void => {
      if (surface.indices.length === 0) return;
      const mesh = toMesh(scene, `shops:${key}:${name}`, surface, material);
      mesh.receiveShadows = true;
      // Nothing here moves after it is built.
      mesh.freezeWorldMatrix();
      meshes.push(mesh);
    };
    add(build.kit, 'kit', materials.kit);
    add(build.glass, 'glass', materials.glass);
    add(build.sign, 'sign', materials.emissive(build.signColour));
    if (!meshes.length) return null;
    const batch: Batch = {
      key,
      build,
      meshes,
      ids: [],
      matrices: new Float32Array(16 * 8),
      capacity: 8,
      triangles: build.triangles,
    };
    if (env?.addShadowCaster) {
      for (const mesh of meshes) env.addShadowCaster(mesh, false);
    }
    batches.set(key, batch);
    return batch;
  }

  function writeMatrices(batch: Batch): void {
    for (const mesh of batch.meshes) {
      // `staticBuffer = false`: a `true` here creates a non-updatable vertex buffer and a later
      // write is silently ignored — no error, no change, a frame identical to the one before.
      mesh.thinInstanceSetBuffer(
        'matrix',
        batch.matrices.subarray(0, batch.ids.length * 16),
        16,
        false
      );
      mesh.thinInstanceCount = batch.ids.length;
      mesh.setEnabled(batch.ids.length > 0);
      /**
       * The bounding info is the mesh's OWN geometry, at the origin, until this is called.
       *
       * A thin-instance mesh is built in local space and every copy of it lives in the instance
       * buffer, so a park whose shops are 130 m up the main street has twelve meshes whose bounds
       * all sit on (0, 0, 0). Frustum culling then answers about a box nobody can see: the shops
       * vanish when the camera looks away from the park's centre and reappear when it looks back,
       * with no error anywhere. `scenery/batches.ts` calls this for the same reason.
       */
      if (batch.ids.length > 0) mesh.thinInstanceRefreshBoundingInfo(false);
    }
  }

  function addEntity(entity: Entity): void {
    if (entity.kind !== 'shop' || placed.has(entity.id)) return;
    const found = ctx.registry.find('shops', entity.pack, entity.item);
    if (!found) return;
    const data = (entity.data ?? {}) as ShopEntityData;
    const resolved = resolveShop(
      entity.pack,
      entity.item,
      found.def as unknown as ShopItemLike,
      data.style
    );
    const batch = batchFor(resolved, entity);
    if (!batch) return;

    const x = entity.position[0];
    const z = entity.position[2];
    // The ground the shop stands on. `entity.position[1]` is authoritative when it is not zero —
    // a build tool that has already sampled the terrain should not be second-guessed — and the
    // terrain is asked otherwise, which is what a park built from a plan needs.
    const y = entity.position[1] !== 0 ? entity.position[1] : (terrain?.height(x, z) ?? 0);
    const yaw = entity.yaw ?? 0;

    if (batch.ids.length >= batch.capacity) {
      const next = new Float32Array(batch.capacity * 2 * 16);
      next.set(batch.matrices);
      batch.matrices = next;
      batch.capacity *= 2;
    }
    Quaternion.RotationYawPitchRollToRef(yaw, 0, 0, scratchQuat);
    scratchPos.set(x, y, z);
    scratchScale.set(1, 1, 1);
    Matrix.ComposeToRef(scratchScale, scratchQuat, scratchPos, scratch);
    scratch.copyToArray(batch.matrices, batch.ids.length * 16);
    batch.ids.push(entity.id);
    writeMatrices(batch);
    placed.set(entity.id, { key: batch.key, frontage: [x, z] });

    // The counter light, in world space.
    const l = batch.build.lightAt;
    const sin = Math.sin(yaw);
    const cos = Math.cos(yaw);
    sites.set(entity.id, {
      id: entity.id,
      x: x + l[0] * cos + l[2] * sin,
      y: y + l[1],
      z: z - l[0] * sin + l[2] * cos,
      colour: batch.build.signColour,
    });
    poolClock = POOL_INTERVAL;
  }

  function removeEntity(id: string): void {
    const at = placed.get(id);
    if (!at) return;
    placed.delete(id);
    sites.delete(id);
    const batch = batches.get(at.key);
    if (!batch) return;
    const index = batch.ids.indexOf(id);
    if (index < 0) return;
    // Swap the last instance into the hole rather than shifting: order is not meaningful here and
    // a shift is O(n) matrix copies for a removal a player does one at a time.
    const last = batch.ids.length - 1;
    if (index !== last) {
      batch.matrices.copyWithin(index * 16, last * 16, last * 16 + 16);
      batch.ids[index] = batch.ids[last];
    }
    batch.ids.pop();
    writeMatrices(batch);
    poolClock = POOL_INTERVAL;
  }

  for (const id in ctx.world.entities) addEntity(ctx.world.entities[id]);

  // A pack landing later brings new styles with it, and a shop already drawn with the fallback
  // form should pick up the real one. Rebuilding is cheap at this scale: a park has tens of shops.
  const detachRefresh = ctx.registry.onPack(() => {
    const entities = [...placed.keys()].map((id) => ctx.world.entities[id]).filter(Boolean);
    for (const entity of entities) removeEntity(entity.id);
    disposeBatches();
    for (const entity of entities) addEntity(entity);
  });

  function disposeBatches(): void {
    for (const batch of batches.values()) {
      for (const mesh of batch.meshes) {
        if (env?.removeShadowCaster) env.removeShadowCaster(mesh);
        mesh.dispose();
      }
    }
    batches.clear();
  }

  // ── The night pool ────────────────────────────────────────────────────────────────────────

  function updatePool(dtSeconds: number): void {
    if (!pool.length) return;
    poolClock += dtSeconds;
    if (night <= 0.02) {
      if (activeLights !== 0) {
        for (const light of pool) light.setEnabled(false);
        activeLights = 0;
      }
      return;
    }
    if (poolClock < POOL_INTERVAL) return;
    poolClock = 0;
    const camera = scene.activeCamera;
    const cx = camera?.globalPosition.x ?? 0;
    const cy = camera?.globalPosition.y ?? 0;
    const cz = camera?.globalPosition.z ?? 0;
    const near = [...sites.values()]
      .map((site) => ({
        site,
        d: (site.x - cx) ** 2 + (site.y - cy) ** 2 + (site.z - cz) ** 2,
      }))
      .filter((e) => e.d < LIGHT_RANGE * LIGHT_RANGE)
      .sort((a, b) => a.d - b.d || (a.site.id < b.site.id ? -1 : 1))
      .slice(0, pool.length);
    activeLights = near.length;
    for (let i = 0; i < pool.length; i++) {
      const light = pool[i];
      const entry = near[i];
      if (!entry) {
        light.setEnabled(false);
        continue;
      }
      light.position.set(entry.site.x, entry.site.y, entry.site.z);
      // A serving hatch under an awning is a warm pool, not a floodlight. 45 rather than 22: at 22
      // the 22:00 frames had a lit sign over an unlit apron, which is the exact criticism the
      // scenery critique made of that module's lamps ("~20 glowing heads over a uniformly dark
      // plaza"). At 45 with a 12 m range the paving under the awning is lit and the walk on the
      // other side of the street is not.
      light.intensity = 45 * night;
      light.setEnabled(true);
    }
  }

  // ── The handle ────────────────────────────────────────────────────────────────────────────

  const handle: MainHandle = {
    onFrame(frame) {
      frameStats.count = frame.stats['shops.count'] ?? 0;
      frameStats.open = frame.stats['shops.open'] ?? 0;
      frameStats.queue = frame.stats['shops.queue'] ?? 0;
      frameStats.takingsToday = frame.stats['shops.takingsToday'] ?? 0;
    },
    onEntity(change: EntityChange) {
      if (change.type === 'add') addEntity(change.entity);
      else if (change.type === 'remove') removeEntity(change.entity.id);
      else if (change.type === 'update') {
        removeEntity(change.entity.id);
        addEntity(change.entity);
      }
    },
    onEnvironment(state: EnvironmentState) {
      night = state.night;
      materials.setNight(night);
    },
    onRender(dtSeconds: number) {
      updatePool(dtSeconds);
    },
    api: {
      styles: () => shopStyles(),
      meshes: () => [...batches.values()].flatMap((b) => b.meshes),
      frontage: (id: string) => placed.get(id)?.frontage ?? null,
      stats(): ShopsMeshStats {
        let drawnMeshes = 0;
        let triangles = 0;
        let uniqueTriangles = 0;
        const batchList: ShopBatchStats[] = [];
        for (const batch of batches.values()) {
          const drawn = batch.ids.length > 0 ? batch.meshes.length : 0;
          drawnMeshes += drawn;
          triangles += batch.triangles * batch.ids.length;
          uniqueTriangles += batch.triangles;
          batchList.push({
            key: batch.key,
            style: batch.key.split('|')[1] ?? '',
            instances: batch.ids.length,
            meshes: batch.meshes.length,
            triangles: batch.triangles,
          });
        }
        batchList.sort((a, b) => b.triangles * b.instances - a.triangles * a.instances);
        return {
          shops: placed.size,
          batches: batches.size,
          drawnMeshes,
          triangles,
          uniqueTriangles,
          lightSites: sites.size,
          activeLights,
          atlasMs: atlas.generateMs,
          buildMs,
          batchList,
          sim: { ...frameStats },
        };
      },
    } satisfies ShopsMainApi,
    dispose() {
      detachRefresh();
      detachContent();
      disposeBatches();
      placed.clear();
      sites.clear();
      for (const light of pool) light.dispose();
      pool.length = 0;
      materials.dispose();
      atlas.dispose();
    },
  };
  return handle;
}

/**
 * One `Surface` to one mesh.
 *
 * Here rather than in `geometry.ts` so that file stays Babylon-free and the whole builder can be
 * exercised under node by the selftest. `useVertexColors` is the load-bearing line: the atlas is a
 * detail map and every colour in a shop comes out of the vertex stream.
 */
function toMesh(scene: Scene, name: string, s: Surface, material: Material): Mesh {
  const mesh = new Mesh(name, scene);
  const data = new VertexData();
  data.positions = s.positions;
  data.normals = s.normals;
  data.uvs = s.uvs;
  data.colors = s.colors;
  data.indices = s.indices;
  data.applyToMesh(mesh, false);
  mesh.material = material;
  mesh.useVertexColors = true;
  mesh.isPickable = false;
  return mesh;
}
