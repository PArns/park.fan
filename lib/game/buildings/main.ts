/**
 * Buildings on the main thread: the atlas, the batches, the thin instances and the night rig.
 *
 * **A building type is a batch, not a mesh per building.** Every `building` entity of one
 * `pack:item` (in one style) is a matrix in the same two-to-four meshes — kit, glass, lit windows,
 * sign — so a street of eight terrace houses costs exactly what one costs. The real figure is
 * therefore **two to four draw calls per building TYPE, independent of how many are built**, and it
 * is in `stats()` and in the report.
 *
 * **The content comes from packs, through one generator.** `build.ts` reads a resolved blueprint;
 * nothing here or there switches on a building id or a pack id. A pack that ships a
 * `buildingBlueprints` entry gets a building with no TypeScript, and `selftest.mjs` registers a
 * synthetic pack to prove it rather than asserting it in prose.
 *
 * **This module registers its own content pack** (`pack.ts`) from here, at step 5 of the boot, which
 * is *before* the worker is started at step 7 — so `init` carries it and both threads resolve the
 * same ids. The bundled packs declare ten building entries and all ten are kit pieces; without this
 * the Buildings tab would offer a wall and a column and no building.
 *
 * **Night is lit windows plus a very small pool of real lights.** Two, at `high` and above. The
 * scenery module already pools up to six and shops up to four, and `PBRMaterial` takes the first N
 * lights in scene order rather than the nearest — so this module takes the smallest share that still
 * puts a pool of light on a doorstep, and its lights carry `renderPriority = -1` so that what gets
 * dropped when a material runs out of slots is a doorway lamp and never the sun.
 */

import '@babylonjs/core/Meshes/thinInstanceMesh';
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import type { Material } from '@babylonjs/core/Materials/material';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import type { Scene } from '@babylonjs/core/scene';
import type {
  Entity,
  EntityChange,
  EnvironmentState,
  MainContext,
  MainHandle,
} from '../core/types';
import {
  buildBuilding,
  buildKitPiece,
  resetBuildWarnings,
  seedForBuilding,
  type BuildingBuild,
} from './build';
import { setAtlasResolution, type Surface } from './geometry';
import {
  attachBuildingContent,
  buildingBlueprints,
  buildingItems,
  buildingStyles,
  resetBuildingContent,
  resolveBuilding,
} from './manifest';
import { createBuildingMaterials, type BuildingMaterials } from './materials';
import { ARCHITECTURE_PACK } from './pack';
import { createBuildingAtlas, type BuildingAtlas } from './textures';
import type { BlueprintDef, BuildingEntityData, BuildingStyleDef, ResolvedBuilding } from './types';

/**
 * Atlas tile resolution per preset.
 *
 * The generator is a per-pixel loop in JavaScript and it is the most expensive thing this module
 * does at boot: sixteen tiles at 192² is 590 k samples across three maps. 256 would be 1.8× that for
 * a texel density no camera in this game resolves — the `close` preset sits 40 m out, where a 0.9 m
 * brick tile at 192 px is already 213 px/m.
 */
const TILE_SIZE: Record<string, number> = { low: 96, medium: 144, high: 192, ultra: 224 };
/**
 * Real point lights in the night pool, by preset.
 *
 * Two at `medium`, not one. The round-2 critic put it plainly: twenty-four light sites in the
 * showcase and one lamp between them, so a street of lit windows had a single pool of light on the
 * paving and everything else was the additive spill decal. `kit` and `glass` carry
 * `maxSimultaneousLights = 6` and the sun is one of them, so four is the ceiling this can reach
 * without a shader permutation nobody has measured.
 */
const LIGHT_POOL: Record<string, number> = { low: 0, medium: 2, high: 3, ultra: 4 };
/** Metres past which a doorway is not worth one of the pool's lights. */
const LIGHT_RANGE = 90;
/** Seconds between re-sorts of the pool. */
const POOL_INTERVAL = 0.45;
/**
 * Metres of camera movement that re-sort the pool at once, without waiting for the clock.
 *
 * The clock alone is what made every night frame in the gauntlet a frame of the wrong thing. The
 * harness shoots 1.2 s after the camera is set; under SwiftShader that is one or two frames, the
 * pool had picked for wherever the camera was standing before, and the critic measured the near-wall
 * band of the standard 23:00 street frame at mean luma 39.3 against 54.4 once it had settled —
 * **28 % darker than what a player sees**, on every night shot of this module for three rounds. A
 * camera that has jumped 40 m has not "moved a bit"; it is somewhere else, and the lamp it wants is
 * a different lamp.
 */
const POOL_JUMP = 4;

export interface BuildingBatchStats {
  key: string;
  blueprint: string;
  instances: number;
  meshes: number;
  triangles: number;
  windows: number;
  litWindows: number;
}

export interface BuildingsMeshStats {
  buildings: number;
  batches: number;
  /** Meshes with at least one instance — this module's share of the draw-call budget. */
  drawnMeshes: number;
  /** Triangles actually on screen: per-instance geometry × instance count. */
  triangles: number;
  /** Triangles in the unique geometry, i.e. what the GPU holds. */
  uniqueTriangles: number;
  windows: number;
  litWindows: number;
  lightSites: number;
  activeLights: number;
  atlasMs: number;
  buildMs: number;
  /** Mean and standard deviation of each atlas tile's albedo luminance. */
  atlasSpread: BuildingAtlas['spread'];
  batchList: BuildingBatchStats[];
}

export interface BuildingsMainApi {
  /** Every registered style; a build bar reads this rather than a hard-coded list. */
  styles(): BuildingStyleDef[];
  /** Every registered blueprint. */
  blueprints(): BlueprintDef[];
  /** Every placeable building item any registered pack declares, resolved. */
  catalogue(): ResolvedBuilding[];
  /** Every mesh this module draws, for a critic or a debugger counting them. */
  meshes(): Mesh[];
  stats(): BuildingsMeshStats;
  /** Where a guest walks in, world space. */
  entrance(id: string): [number, number] | null;
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
  build: BuildingBuild;
  meshes: Mesh[];
  ids: string[];
  matrices: Float32Array;
  capacity: number;
  triangles: number;
  blueprint: string;
}

interface Site {
  id: string;
  x: number;
  y: number;
  z: number;
  colour: string;
  intensity: number;
  range: number;
}

export function createBuildingsMain(ctx: MainContext): MainHandle {
  // Claim the pack categories and read them, at boot and afterwards. Both halves: `onPack` fires on
  // registration and the bundled packs are registered before any module is built.
  const detachContent = attachBuildingContent(ctx.registry);
  try {
    ctx.registry.registerPack(ARCHITECTURE_PACK);
  } catch (error) {
    // A duplicate id means something else already registered it — a second boot on one registry, or
    // a pack file of the same name shipped by the integrator, which is the point of the name.
    console.warn('[game/buildings] architecture pack not registered', error);
  }

  const scene = ctx.scene as Scene;
  const preset = ctx.quality.preset;
  const tileSize = TILE_SIZE[preset] ?? 144;
  // Drawn here and not where it is used: the module's rng stream must advance the same way whether
  // or not the park happens to contain a building.
  const atlasSeed = ctx.rng.int(1, 1 << 28);
  const terrain = ctx.module<TerrainLike>('terrain');
  const env = ctx.module<EnvironmentApi>('environment');

  /**
   * The atlas is built on the first building and not at boot.
   *
   * Sixteen procedural tiles is **801 ms** of per-pixel JavaScript at the `medium` preset and about
   * 5.3 MB of texture with its mip chain, and a park with no buildings in it was paying both:
   * measured on the demo park, which reserves two plots for this module and has nothing standing on
   * them yet, so the whole cost bought nothing. A sandbox starts empty too. The first `entity:add`
   * of a `building` pays it, once, and every building after that is free.
   */
  let atlas: BuildingAtlas | null = null;
  let materials: BuildingMaterials | null = null;
  function ensureMaterials(): BuildingMaterials {
    if (!materials) {
      setAtlasResolution(tileSize);
      atlas = createBuildingAtlas(scene, atlasSeed, tileSize);
      materials = createBuildingMaterials(scene, atlas);
      materials.setNight(night);
    }
    return materials;
  }

  const batches = new Map<string, Batch>();
  const placed = new Map<string, { key: string; entrance: [number, number] }>();
  const sites = new Map<string, Site>();
  let buildMs = 0;
  let night = 0;
  let poolClock = POOL_INTERVAL;
  let activeLights = 0;
  /** Where the camera stood when the pool was last sorted; see `POOL_JUMP`. */
  const poolAt = new Vector3(Infinity, Infinity, Infinity);

  /**
   * A sky term on this module's own fabric after dark, and on nothing else's.
   *
   * The largest surface in every overview frame is roof; it faces the sky, and at 23:00 nothing in
   * this scene lights it — so the mansards, the barrel vault and the pyramids sat at the same luma
   * as the grass (27.7 against 18.3 in the round-2 overview) and the street's silhouette dissolved
   * exactly where the composition needs it. Round 2 fixed this for daylight only, with an albedo
   * (`#454b54 → #6f7783`), which does nothing at midnight.
   *
   * It has to be DIRECTIONAL or it is not a fix: one `kit` material draws walls and roof alike, so
   * the first attempt was a small emissive on it — and that lifted the roof band 27.7 → 66.6 and the
   * wall band 26.1 → 65.0, i.e. it repainted the whole street milky and took the facade's own
   * range with it (p5 9.3 → 42.8). A hemispheric light is the shape of the thing being modelled: sky
   * above, nothing below, so an up-facing slate takes it and a vertical brick wall barely does.
   *
   * `includedOnlyMeshes` because this is a claim about buildings and the terrain, the paths and the
   * rides have their own modules and their own opinion about the night.
   */
  const sky = new HemisphericLight('buildings-sky', new Vector3(0, 1, 0), scene);
  sky.diffuse = new Color3(0.62, 0.72, 1);
  sky.groundColor = new Color3(0, 0, 0);
  sky.specular = new Color3(0, 0, 0);
  sky.intensity = 0;
  sky.setEnabled(false);

  const pool: PointLight[] = [];
  for (let i = 0; i < (LIGHT_POOL[preset] ?? 1); i++) {
    const light = new PointLight(`buildings-spill-${i}`, new Vector3(0, 0, 0), scene);
    light.intensity = 0;
    light.range = 12;
    light.diffuse = new Color3(1, 0.87, 0.68);
    light.specular = new Color3(0.3, 0.26, 0.2);
    light.renderPriority = -1;
    light.shadowEnabled = false;
    light.setEnabled(false);
    pool.push(light);
  }

  const scratch = new Matrix();
  const scratchQuat = new Quaternion();
  const scratchScale = new Vector3(1, 1, 1);
  const scratchPos = new Vector3();

  function batchFor(resolved: ResolvedBuilding, data: BuildingEntityData): Batch | null {
    // The key is everything that changes the GEOMETRY. Two buildings that differ only in position
    // share it; two that differ in style, blueprint or variant do not.
    const key = [
      resolved.key,
      data.style ?? resolved.style.id,
      data.blueprint ?? resolved.blueprint?.id ?? resolved.piece ?? '-',
      data.variant ?? 0,
    ].join('|');
    const found = batches.get(key);
    if (found) return found;
    const t0 = performance.now();
    // A seed off the batch KEY rather than the entity: two buildings sharing a mesh share their
    // variation whatever we do, so it has to come from the key or the second would silently take
    // the first one's. Per-building variation is a batch split and is not free.
    const seed = seedForBuilding(key);
    let build: BuildingBuild;
    try {
      build = resolved.blueprint
        ? buildBuilding({ blueprint: resolved.blueprint, style: resolved.style, seed })
        : buildKitPiece({
            piece: resolved.piece ?? 'wall',
            size: resolved.size,
            style: resolved.style,
            seed,
          });
    } catch (error) {
      console.warn(`[game/buildings] "${resolved.key}" failed to build`, error);
      return null;
    }
    buildMs += performance.now() - t0;

    const kitMaterials = ensureMaterials();
    const meshes: Mesh[] = [];
    const add = (surface: Surface, name: string, material: Material): void => {
      if (surface.indices.length === 0) return;
      const mesh = toMesh(scene, `buildings:${key}:${name}`, surface, material);
      // A spill quad is light, not a surface: it receives nothing. Everything else takes the sun's
      // shadow.
      //
      // It stays in rendering group 0 with everybody else. It was in group 1 for one round, to get
      // it drawn after the wall it lies on — but Babylon clears the depth buffer before each group
      // above 0 by default (`_autoClearDepthStencil[1].depth === true`), so the ring was drawn over
      // whatever stood in front of it: a row of window-shaped outlines lying on the clock tower's
      // slate, and the teal of a pavilion two buildings further back showing through the roof.
      // Alpha-blended meshes already render after the opaque ones inside a group, which is the
      // ordering this actually wanted, and `disableDepthWrite` keeps it from occluding anything.
      mesh.receiveShadows = name !== 'halo';
      mesh.freezeWorldMatrix();
      meshes.push(mesh);
    };
    add(build.kit, 'kit', kitMaterials.kit);
    add(build.glass, 'glass', kitMaterials.glass);
    add(build.lit, 'lit', kitMaterials.emissive(build.litColour, 'window'));
    add(build.sign, 'sign', kitMaterials.emissive(build.signColour, 'sign'));
    add(build.halo, 'halo', kitMaterials.halo(build.litColour));
    if (!meshes.length) return null;
    const batch: Batch = {
      key,
      build,
      meshes,
      ids: [],
      matrices: new Float32Array(16 * 4),
      capacity: 4,
      triangles: build.triangles,
      blueprint: resolved.blueprint?.id ?? resolved.piece ?? '-',
    };
    if (env?.addShadowCaster) {
      // Glass and emissive panes are inside their own building's opening; casting from them puts a
      // dark rectangle on the wall behind. Only the kit casts.
      env.addShadowCaster(meshes[0], false);
    }
    batches.set(key, batch);
    // A new batch is new meshes, and the sky light is scoped by mesh list.
    retargetSky();
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
       * buffer, so a hall 160 m up the park has a mesh whose bounds sit on (0, 0, 0). Frustum
       * culling then answers about a box nobody can see: the building vanishes when the camera looks
       * away from the origin and reappears when it looks back, with no error anywhere.
       */
      if (batch.ids.length > 0) mesh.thinInstanceRefreshBoundingInfo(false);
    }
  }

  function addEntity(entity: Entity): void {
    if (entity.kind !== 'building' || placed.has(entity.id)) return;
    const data = (entity.data ?? {}) as BuildingEntityData;
    const resolved = resolveBuilding(ctx.registry, entity.pack, entity.item, data);
    if (!resolved) return;
    const batch = batchFor(resolved, data);
    if (!batch) return;

    const x = entity.position[0];
    const z = entity.position[2];
    // `entity.position[1]` is authoritative when it is not zero — a build tool that has already
    // sampled the terrain should not be second-guessed — and the terrain is asked otherwise, which
    // is the path a park built from a plan takes.
    const y = entity.position[1] !== 0 ? entity.position[1] : (terrain?.height(x, z) ?? 0);
    const yaw = entity.yaw ?? 0;
    const scale = entity.scale ?? 1;

    if (batch.ids.length >= batch.capacity) {
      const next = new Float32Array(batch.capacity * 2 * 16);
      next.set(batch.matrices);
      batch.matrices = next;
      batch.capacity *= 2;
    }
    Quaternion.RotationYawPitchRollToRef(yaw, 0, 0, scratchQuat);
    scratchPos.set(x, y, z);
    scratchScale.set(scale, scale, scale);
    Matrix.ComposeToRef(scratchScale, scratchQuat, scratchPos, scratch);
    scratch.copyToArray(batch.matrices, batch.ids.length * 16);
    batch.ids.push(entity.id);
    writeMatrices(batch);

    const sin = Math.sin(yaw);
    const cos = Math.cos(yaw);
    const world = (lx: number, lz: number): [number, number] => [
      x + lx * scale * cos + lz * scale * sin,
      z - lx * scale * sin + lz * scale * cos,
    ];
    const [ex, ez] = world(batch.build.entrance[0], batch.build.entrance[1]);
    placed.set(entity.id, { key: batch.key, entrance: [ex, ez] });
    batch.build.lights.forEach((site, i) => {
      const [wx, wz] = world(site.x, site.z);
      sites.set(`${entity.id}#${i}`, {
        id: entity.id,
        x: wx,
        y: y + site.y * scale,
        z: wz,
        colour: site.color,
        intensity: site.intensity,
        range: site.range,
      });
    });
    poolClock = POOL_INTERVAL;
  }

  function removeEntity(id: string): void {
    const at = placed.get(id);
    if (!at) return;
    placed.delete(id);
    for (const key of [...sites.keys()]) {
      if (key.startsWith(`${id}#`)) sites.delete(key);
    }
    const batch = batches.get(at.key);
    if (!batch) return;
    const index = batch.ids.indexOf(id);
    if (index < 0) return;
    // Swap the last instance into the hole rather than shifting: order is not meaningful here and a
    // shift is O(n) matrix copies for a removal a player does one at a time.
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

  // A pack landing later brings styles and blueprints with it, and a building already drawn with the
  // fallback form should pick up the real one. Rebuilding is cheap at this scale: a park has tens of
  // buildings, not thousands.
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

  /** Every mesh this module owns, for `sky.includedOnlyMeshes`. */
  function retargetSky(): void {
    const meshes = [...batches.values()].flatMap((b) => b.meshes);
    sky.includedOnlyMeshes = meshes;
    sky.setEnabled(meshes.length > 0 && sky.intensity > 0);
  }

  function updatePool(dtSeconds: number): void {
    // 0.10 at full dark, and the number is a measurement rather than a taste. On the 23:00
    // overview the roof band goes 27.7 → 53.5 against grass that does not move at all (18.3 → 18.3,
    // it is not this module's), while the wall band goes 26.1 → 40.8 and keeps its own range
    // (sd 26.5 → 27.9). At 0.22 the roof reached 78.6, which is a moonlit slate roof reading
    // brighter than the lit windows on the floor below it.
    const want = 0.1 * Math.max(0, Math.min(1, (night - 0.15) / 0.45));
    if (want !== sky.intensity) {
      sky.intensity = want;
      retargetSky();
    }
    if (!pool.length) return;
    poolClock += dtSeconds;
    if (night <= 0.02) {
      if (activeLights !== 0) {
        for (const light of pool) light.setEnabled(false);
        activeLights = 0;
      }
      return;
    }
    const camera = scene.activeCamera;
    const cx = camera?.globalPosition.x ?? 0;
    const cy = camera?.globalPosition.y ?? 0;
    const cz = camera?.globalPosition.z ?? 0;
    const jumped =
      (cx - poolAt.x) ** 2 + (cy - poolAt.y) ** 2 + (cz - poolAt.z) ** 2 > POOL_JUMP * POOL_JUMP;
    if (poolClock < POOL_INTERVAL && !jumped) return;
    poolClock = 0;
    poolAt.set(cx, cy, cz);
    const near = [...sites.entries()]
      .map(([key, site]) => ({
        key,
        site,
        d: (site.x - cx) ** 2 + (site.y - cy) ** 2 + (site.z - cz) ** 2,
      }))
      .filter((e) => e.d < LIGHT_RANGE * LIGHT_RANGE)
      // A stable tiebreak on the key, so two doorways at the same distance do not swap every sort.
      .sort((a, b) => a.d - b.d || (a.key < b.key ? -1 : 1))
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
      light.range = entry.site.range;
      light.diffuse = Color3.FromHexString(entry.site.colour);
      light.intensity = entry.site.intensity * night;
      light.setEnabled(true);
    }
  }

  const handle: MainHandle = {
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
      materials?.setNight(night);
    },
    onRender(dtSeconds: number) {
      updatePool(dtSeconds);
    },
    api: {
      styles: () => buildingStyles(),
      blueprints: () => buildingBlueprints(),
      catalogue: () => buildingItems(ctx.registry),
      meshes: () => [...batches.values()].flatMap((b) => b.meshes),
      entrance: (id: string) => placed.get(id)?.entrance ?? null,
      stats(): BuildingsMeshStats {
        let drawnMeshes = 0;
        let triangles = 0;
        let uniqueTriangles = 0;
        let windows = 0;
        let litWindows = 0;
        const batchList: BuildingBatchStats[] = [];
        for (const batch of batches.values()) {
          const drawn = batch.ids.length > 0 ? batch.meshes.length : 0;
          drawnMeshes += drawn;
          triangles += batch.triangles * batch.ids.length;
          uniqueTriangles += batch.triangles;
          windows += batch.build.windows * batch.ids.length;
          litWindows += batch.build.litWindows * batch.ids.length;
          batchList.push({
            key: batch.key,
            blueprint: batch.blueprint,
            instances: batch.ids.length,
            meshes: batch.meshes.length,
            triangles: batch.triangles,
            windows: batch.build.windows,
            litWindows: batch.build.litWindows,
          });
        }
        batchList.sort((a, b) => b.triangles * b.instances - a.triangles * a.instances);
        return {
          buildings: placed.size,
          batches: batches.size,
          drawnMeshes,
          triangles,
          uniqueTriangles,
          windows,
          litWindows,
          lightSites: sites.size,
          activeLights,
          atlasMs: atlas?.generateMs ?? 0,
          buildMs,
          atlasSpread: atlas?.spread ?? [],
          batchList,
        };
      },
    } satisfies BuildingsMainApi,
    dispose() {
      detachRefresh();
      detachContent();
      /**
       * The content registry is module scope, so it has to be emptied here or it outlives the game.
       *
       * Across a dispose and a reboot — a route change, or React's strict-mode double mount — a
       * blueprint from a pack that is no longer registered stayed resolvable by bare id through the
       * `blueprints.get(wanted)` fallback, and a malformed pack warned once per PROCESS rather than
       * once per boot. The second is the one that bites: reloading to see whether you fixed your
       * manifest is exactly when you need the warning to come back.
       */
      resetBuildingContent();
      resetBuildWarnings();
      disposeBatches();
      placed.clear();
      sites.clear();
      for (const light of pool) light.dispose();
      pool.length = 0;
      sky.dispose();
      materials?.dispose();
      atlas?.dispose();
      materials = null;
      atlas = null;
    },
  };
  return handle;
}

/**
 * One `Surface` to one mesh.
 *
 * Here rather than in `geometry.ts` so that file stays Babylon-free and the whole builder can be
 * exercised under node. `useVertexColors` is the load-bearing line: the atlas is a detail map and
 * every colour in a building comes out of the vertex stream.
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
