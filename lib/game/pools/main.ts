/**
 * The pools renderer: basins, water, deck furniture, night lighting, and the excavation under all
 * of it.
 *
 * **Every pool in the park is merged into one mesh per material.** A basin is static geometry that
 * changes only when somebody builds or demolishes, so there is nothing to gain from a mesh each and
 * a whole draw call to lose: the surfaces come out of `build.ts` as plain arrays in the pool's own
 * frame, are transformed into the world here, and are concatenated by material key. Six basins in
 * three tile styles cost about a dozen draw calls rather than fifty.
 *
 * **The rebuild is coalesced.** `onEntity` marks the module dirty and the next `onRender` does the
 * work, so dropping a water park's five pools in one batch costs one rebuild instead of five.
 *
 * **The pool digs its own hole** (`excavate.ts`), on this copy of the world immediately and on the
 * worker's through a `pools:excavate` command, because a heightfield is a surface and a basin under
 * one is invisible. It only ever lowers ground, so the two copies converge whatever order they
 * arrive in.
 *
 * **A pool's Y comes from the terrain, not from the entity.** A build tool that has not sampled the
 * ground writes `position[1] = 0`, which is the sea in this park.
 */

import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import type { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import type { Scene } from '@babylonjs/core/scene';
import type {
  Entity,
  EntityChange,
  EnvironmentState,
  MainContext,
  MainHandle,
  QualityPreset,
  TerrainData,
} from '../core/types';
import { nextEntityId } from '../core/world';
import {
  attachPoolContent,
  poolDeckItems,
  poolEdges,
  poolShape,
  poolShapes,
  poolTiles,
  registerPools,
} from './manifest';
import { buildPool } from './build';
import { buildProp } from './furniture';
import { SurfaceBuilder } from './surfaces';
import { createPoolMaterials, type PoolMaterials } from './materials';
import { createRipple } from './textures';
import {
  buildWaterMesh,
  createSplashRings,
  createWaterMaterial,
  type PoolWaterMaterial,
  type SplashRings,
} from './water';
import { excavatePool } from './excavate';
import { poolRadius, resolvePool } from './resolve';
import { depthAtUnit, floorDepth, hashString, outlinePoints, toLocal } from './geom';
import type {
  PoolDepthSpec,
  PoolEdgeSpec,
  PoolEntityData,
  PoolShapeSpec,
  PoolTileSpec,
  ResolvedPool,
} from './types';

interface TerrainLike {
  height(x: number, z: number): number;
}
interface EnvironmentLike {
  addShadowCaster?(mesh: unknown, includeDescendants?: boolean): void;
  removeShadowCaster?(mesh: unknown): void;
}

/**
 * Real point lights, by preset.
 *
 * Small on purpose. `scenery` pools up to six for the park's lamps and `rides` up to six for the
 * machines, and every one of them is a light loop in every fragment of every material near it; a
 * material takes only `maxSimultaneousLights` of the scene's lights and the ones it drops are the
 * ones with the lowest render priority. Underwater lighting does not need many, because the niche
 * geometry is emissive on EVERY pool at every preset and the caustics on the floor are driven by
 * the same colour — the real lights are what puts a pool of glow on the surrounding deck, and two
 * of those is a lit pool.
 *
 * Measured before and after: at one light the whole deck of the showcase lido was black at 23:00
 * and the pool read as a glowing hole cut in a lawn (`pools-r1/2300-ground.png`). The lamps also sat
 * 620 mm under the surface, where they lit the basin and nothing else — they are held just under it
 * now, at `waterY − 0.25`, which is where a real niche throws light up over the coping.
 */
const LIGHT_POOL: Record<QualityPreset, number> = { low: 0, medium: 2, high: 3, ultra: 4 };

/** Floor rings and wall rows scale with the preset; the outline segments do not. */
const DETAIL: Record<QualityPreset, number> = { low: 0.35, medium: 0.7, high: 1, ultra: 1.25 };

export interface PoolMeshStats {
  meshes: number;
  triangles: number;
  vertices: number;
  pools: number;
  props: number;
  lights: number;
  waterArea: number;
  rebuildMs: number;
  textureMs: number;
  textureSize: number;
}

export interface PoolSpec {
  /** Registered shape id or `pack:id`. */
  shape?: string;
  tile?: string;
  edge?: string;
  x: number;
  z: number;
  /** Radians about +Y. */
  yaw?: number;
  size?: [number, number];
  depth?: number;
  deckDensity?: number;
  heated?: boolean;
  /** For a slide run-out: the flume entity this basin belongs to. */
  splashdownFor?: string;
}

export interface PoolsMainApi {
  /** Every registered basin, tile style, edge treatment. A build bar reads these, not a literal. */
  catalogue(): PoolShapeSpec[];
  tiles(): PoolTileSpec[];
  edges(): PoolEdgeSpec[];
  /** Add content at runtime from a manifest fragment — the same parser a pack goes through. */
  registerContent(packId: string, block: unknown): number;

  /** Create a pool. Returns the new entity id. */
  create(spec: PoolSpec): string;
  remove(id: string): void;

  pools(): ResolvedPool[];
  pool(id: string): ResolvedPool | undefined;
  /** Which pool holds this world point, or null. The water, not the deck. */
  poolAt(x: number, z: number): string | null;
  /** Metres of water over a world point; 0 where there is none. */
  depthAt(x: number, z: number): number;
  /** World Y of the water surface at a point, or null where there is no pool. */
  waterYAt(x: number, z: number): number | null;
  /**
   * Where a slide should land: the deepest point of a pool, in world metres, with the depth there.
   * With no id, the deepest `splashdown`-role pool, else the deepest pool of any kind.
   */
  splashdown(id?: string): { id: string; x: number; y: number; z: number; depth: number } | null;
  /** Rings on the surface where something hit it. Returns false when the point is not in a pool. */
  splash(x: number, z: number, strength?: number): boolean;

  meshes(): AbstractMesh[];
  focus(id: string): { position: [number, number, number]; radius: number } | null;
  stats(): PoolMeshStats;
}

export function createPoolsMain(ctx: MainContext): MainHandle {
  const detachContent = attachPoolContent(ctx.registry);
  const scene = ctx.scene as Scene;
  const seed = ctx.rng.int(1, 1 << 28);
  const preset = ctx.quality.preset;
  const materials: PoolMaterials = createPoolMaterials(scene, preset, seed);
  const rippleA = createRipple(scene, preset === 'low' ? 128 : 256, seed + 11);
  const rippleB = createRipple(scene, preset === 'low' ? 128 : 256, seed + 907);
  const terrain = ctx.module<TerrainLike>('terrain');

  const placements = new Map<string, ResolvedPool>();
  const excavated = new Set<string>();
  const meshes = new Map<string, Mesh>();
  const waterMaterials = new Map<string, PoolWaterMaterial>();
  /** Tile style by id, so the per-frame environment pass is a lookup and not a scan of the park. */
  const tileStyles = new Map<string, PoolTileSpec>();
  const lights: PointLight[] = [];
  const lightSites: Array<{
    x: number;
    y: number;
    z: number;
    surfaceY: number;
    tint: [number, number, number];
    power: number;
  }> = [];
  let shadowed: Mesh[] = [];
  let rings: SplashRings | null = null;
  let dirty = true;
  let clock = 0;
  let night = 0;
  let sinceSort = 1;
  const stats: PoolMeshStats = {
    meshes: 0,
    triangles: 0,
    vertices: 0,
    pools: 0,
    props: 0,
    lights: 0,
    waterArea: 0,
    rebuildMs: 0,
    textureMs: 0,
    textureSize: materials.size,
  };

  const groundAt = (x: number, z: number): number => terrain?.height(x, z) ?? 0;

  function place(entity: Entity, digNow = true): boolean {
    if (entity.kind !== 'pool') return false;
    const pool = resolvePool(entity, groundAt(entity.position[0], entity.position[2]));
    if (!pool) return false;
    placements.set(entity.id, pool);
    if (digNow) dig(pool);
    return true;
  }

  /**
   * Cut the basin out of the heightfield, here and on the worker.
   *
   * The local write is what makes the pool visible in the frame the world is announced in — core
   * clones the world for the worker only after every `main()` has run, so a pool that exists at
   * boot digs both copies with one call. A pool built later needs the command, and `excavatePool`
   * only ever lowers ground, so a second application is a no-op rather than a divergence.
   */
  function dig(pool: ResolvedPool): void {
    if (excavated.has(pool.id)) return;
    excavated.add(pool.id);
    const data = ctx.world.terrain as TerrainData;
    if (!data?.heights) return;
    const rect = excavatePool(data, pool);
    if (!rect) return;
    ctx.events.emit('terrain:changed', { rect: null });
    ctx.dispatch('pools:excavate', { id: pool.id });
  }

  // ── the merge ─────────────────────────────────────────────────────────────────────────────
  interface Group {
    positions: number[];
    normals: number[];
    uvs: number[];
    colors: number[];
    indices: number[];
    material: PBRMaterial;
    shadow: boolean;
    alpha: boolean;
  }

  function rebuild(): void {
    const t0 = performance.now();
    const groups = new Map<string, Group>();
    let props = 0;
    let waterArea = 0;

    const group = (key: string, material: PBRMaterial, shadow: boolean, alpha = false): Group => {
      let g = groups.get(key);
      if (!g) {
        g = {
          positions: [],
          normals: [],
          uvs: [],
          colors: [],
          indices: [],
          material,
          shadow,
          alpha,
        };
        groups.set(key, g);
      }
      return g;
    };

    lightSites.length = 0;

    for (const pool of [...placements.values()].sort((a, b) => (a.id < b.id ? -1 : 1))) {
      const cos = Math.cos(pool.yaw);
      const sin = Math.sin(pool.yaw);
      const [px, py, pz] = pool.position;
      const poolSeed = (seed ^ hashString(pool.id)) | 0;

      const b = new SurfaceBuilder();
      const built = buildPool({
        shape: pool.shape,
        tile: pool.tile,
        edge: pool.edge,
        size: pool.size,
        maxDepth: pool.maxDepth,
        freeboard: pool.freeboard,
        deckDensity: pool.deckDensity,
        deckItems: poolDeckItems(),
        seed: poolSeed,
        detail: DETAIL[preset] ?? 1,
      });
      built.props.forEach((prop, i) => buildProp(b, prop, poolSeed, i));
      props += built.props.length;
      const extra = b.done();

      for (const surface of [...built.surfaces, ...extra.surfaces]) {
        const key =
          surface.name === 'tile'
            ? `tile:${pool.tile.id}`
            : surface.name === 'wall'
              ? // The wall shares the floor's material for every pattern but `lanes` (see
                // `materials.tileWall`), and where the material is the same the mesh may as well be
                // too: keying it separately cost five extra draw calls in an eleven-pool showcase
                // for nothing.
                pool.tile.pattern === 'lanes'
                ? `wall:${pool.tile.id}`
                : `tile:${pool.tile.id}`
              : surface.name === 'glow'
                ? `glow:${pool.tile.id}`
                : surface.name === 'coping'
                  ? `coping:${pool.edge.id}`
                  : surface.name === 'deck'
                    ? `deck:${pool.edge.id}`
                    : surface.name;
        const material =
          surface.name === 'tile'
            ? materials.tile(pool.tile)
            : surface.name === 'wall'
              ? materials.tileWall(pool.tile)
              : surface.name === 'glow'
                ? materials.glow(pool.tile)
                : surface.name === 'coping'
                  ? materials.coping(pool.edge)
                  : surface.name === 'deck'
                    ? materials.deck(pool.edge)
                    : materials.finish(surface.name === 'water' ? 'metal' : surface.name);
        // Furniture and metalwork cast; the basin is a hole in the ground and casting from it puts
        // a shadow of the pool floor on the pool floor.
        const casts =
          surface.name === 'metal' || surface.name === 'fabric' || surface.name === 'timber';
        const g = group(key, material, casts);
        appendSurface(g, surface, cos, sin, px, py, pz);
      }

      // The water, as its own mesh per tile style so the alpha sorting has one object to place.
      const water = buildWaterMesh(
        pool.shape,
        pool.size,
        pool.maxDepth,
        pool.waterY - py,
        pool.tile.waterTint
      );
      waterArea += water.area;
      const wm = waterMaterialFor(pool.tile);
      const wg = group(`water:${pool.tile.id}`, wm.material, false, true);
      appendTyped(wg, water, cos, sin, px, py, pz);

      for (const site of built.lights) {
        lightSites.push({
          x: px + site.x * cos - site.z * sin,
          y: py + site.y,
          z: pz + site.x * sin + site.z * cos,
          surfaceY: pool.waterY,
          tint: pool.tile.nightTint,
          power: pool.tile.nightIntensity,
        });
      }
    }

    // Retire the meshes nothing wrote into this time.
    for (const [key, mesh] of meshes) {
      if (groups.has(key)) continue;
      mesh.dispose(false, false);
      meshes.delete(key);
    }

    let triangles = 0;
    let vertices = 0;
    for (const [key, g] of groups) {
      if (!g.indices.length) continue;
      let mesh = meshes.get(key);
      if (!mesh) {
        mesh = new Mesh(`pool-${key}`, scene);
        mesh.isPickable = true;
        meshes.set(key, mesh);
      }
      mesh.material = g.material;
      const data = new VertexData();
      data.positions = new Float32Array(g.positions);
      data.normals = new Float32Array(g.normals);
      data.uvs = new Float32Array(g.uvs);
      data.colors = new Float32Array(g.colors);
      data.indices = new Uint32Array(g.indices);
      data.applyToMesh(mesh, false);
      mesh.receiveShadows = !g.alpha;
      if (g.alpha) {
        mesh.hasVertexAlpha = true;
        // Above the terrain's own lake (alphaIndex 10) so a poolside basin on the shore of it
        // sorts in front rather than behind.
        mesh.alphaIndex = 20;
        mesh.isPickable = false;
      }
      mesh.freezeWorldMatrix();
      triangles += g.indices.length / 3;
      vertices += g.positions.length / 3;
    }

    const env = ctx.module<EnvironmentLike>('environment');
    for (const mesh of shadowed) env?.removeShadowCaster?.(mesh);
    shadowed = [];
    if (env?.addShadowCaster) {
      for (const [key, g] of groups) {
        const mesh = meshes.get(key);
        if (!mesh || !g.shadow) continue;
        env.addShadowCaster(mesh, false);
        shadowed.push(mesh);
      }
    }

    rebuildLights();

    stats.meshes = meshes.size;
    stats.triangles = triangles;
    stats.vertices = vertices;
    stats.pools = placements.size;
    stats.props = props;
    stats.waterArea = waterArea;
    stats.textureMs = materials.textureMs();
    stats.rebuildMs = performance.now() - t0;
  }

  function waterMaterialFor(style: PoolTileSpec): PoolWaterMaterial {
    tileStyles.set(style.id, style);
    let wm = waterMaterials.get(style.id);
    if (!wm) {
      wm = createWaterMaterial(scene, style, rippleA, rippleB);
      waterMaterials.set(style.id, wm);
    }
    return wm;
  }

  function appendSurface(
    g: Group,
    surface: {
      positions: number[];
      normals: number[];
      uvs: number[];
      colors: number[];
      indices: number[];
    },
    cos: number,
    sin: number,
    px: number,
    py: number,
    pz: number
  ): void {
    const base = g.positions.length / 3;
    for (let i = 0; i < surface.positions.length; i += 3) {
      const x = surface.positions[i];
      const y = surface.positions[i + 1];
      const z = surface.positions[i + 2];
      g.positions.push(px + x * cos - z * sin, py + y, pz + x * sin + z * cos);
      const nx = surface.normals[i];
      const ny = surface.normals[i + 1];
      const nz = surface.normals[i + 2];
      g.normals.push(nx * cos - nz * sin, ny, nx * sin + nz * cos);
    }
    for (const v of surface.uvs) g.uvs.push(v);
    for (const v of surface.colors) g.colors.push(v);
    for (const v of surface.indices) g.indices.push(base + v);
  }

  function appendTyped(
    g: Group,
    mesh: {
      positions: Float32Array;
      normals: Float32Array;
      uvs: Float32Array;
      colors: Float32Array;
      indices: Uint32Array;
    },
    cos: number,
    sin: number,
    px: number,
    py: number,
    pz: number
  ): void {
    const base = g.positions.length / 3;
    for (let i = 0; i < mesh.positions.length; i += 3) {
      const x = mesh.positions[i];
      const y = mesh.positions[i + 1];
      const z = mesh.positions[i + 2];
      g.positions.push(px + x * cos - z * sin, py + y, pz + x * sin + z * cos);
      g.normals.push(0, 1, 0);
    }
    for (const v of mesh.uvs) g.uvs.push(v);
    for (const v of mesh.colors) g.colors.push(v);
    for (const v of mesh.indices) g.indices.push(base + v);
  }

  // ── night ─────────────────────────────────────────────────────────────────────────────────
  function rebuildLights(): void {
    const want = LIGHT_POOL[preset] ?? 1;
    while (lights.length > want) lights.pop()?.dispose();
    while (lights.length < want) {
      const light = new PointLight(`pool-night-${lights.length}`, new Vector3(0, 0, 0), scene);
      light.intensity = 0;
      light.range = 13;
      light.diffuse = new Color3(0.5, 0.85, 1);
      light.specular = new Color3(0.2, 0.34, 0.4);
      // Behind the sun and the sky term, exactly as `scenery`'s lamps are: what a material drops
      // when it runs out of slots must be a lamp and never the sun.
      light.renderPriority = -1;
      light.shadowEnabled = false;
      light.setEnabled(false);
      lights.push(light);
    }
    stats.lights = lights.length;
    sinceSort = 1;
  }

  /**
   * Hand the pooled lights to the niches nearest the camera.
   *
   * `intensity` is the manifest's designer number times a scale, the same arrangement `scenery`
   * arrived at and for the same reason: Babylon's `PointLight.intensity` under ACES is roughly
   * candela and a manifest's 6 is invisible on tile four metres away.
   *
   * 2.2 and not the 5 the first pass used. Measured on `pools-r3/2300-ground.png`: at 5, with the
   * lamp a quarter of a metre under the surface, the near end of the lap pool was a blown white
   * hole and the grass in front of it carried a specular streak from a light that is supposed to be
   * under water. The lamp is 1.3 m off the wall now and 0.55 m down, which is where a real niche
   * throws from.
   */
  const LUMEN_SCALE = 2.2;

  function updateLights(dt: number): void {
    if (!lights.length) return;
    sinceSort += dt;
    if (sinceSort > 0.6 && lightSites.length) {
      sinceSort = 0;
      const camera = scene.activeCamera?.position ?? Vector3.Zero();
      const sorted = [...lightSites].sort(
        (a, b) =>
          (a.x - camera.x) ** 2 +
          (a.z - camera.z) ** 2 -
          ((b.x - camera.x) ** 2 + (b.z - camera.z) ** 2)
      );
      // One light per pool before a second goes to the same one: two lamps six metres apart in a
      // lagoon look like one, and the whirlpool beside it goes dark.
      const chosen: typeof sorted = [];
      const used = new Set<number>();
      for (let pass = 0; pass < 3 && chosen.length < lights.length; pass++) {
        for (const site of sorted) {
          if (chosen.length >= lights.length) break;
          const bucket = Math.round(site.x / 12) * 1000 + Math.round(site.z / 12);
          if (pass === 0 && used.has(bucket)) continue;
          if (chosen.includes(site)) continue;
          used.add(bucket);
          chosen.push(site);
        }
      }
      for (let i = 0; i < lights.length; i++) {
        const site = chosen[i];
        if (!site) {
          lights[i].setEnabled(false);
          continue;
        }
        // Just under the surface rather than at the niche's own depth: the light has to reach the
        // coping and the first metre of deck, which is what makes a lit pool light its surroundings
        // instead of glowing in a black field.
        lights[i].position.set(site.x, Math.min(site.y + 0.3, site.surfaceY - 0.55), site.z);
        lights[i].diffuse.set(site.tint[0], site.tint[1], site.tint[2]);
        lights[i].specular.set(site.tint[0] * 0.4, site.tint[1] * 0.4, site.tint[2] * 0.4);
        lights[i].intensity = site.power * LUMEN_SCALE * night;
        lights[i].setEnabled(night > 0.02);
      }
    } else {
      for (const light of lights) {
        light.setEnabled(night > 0.02);
        if (night <= 0.02) light.intensity = 0;
      }
    }
  }

  // ── queries ───────────────────────────────────────────────────────────────────────────────
  /** Metres of water over a world point in one pool, or 0. */
  function depthIn(pool: ResolvedPool, x: number, z: number): number {
    const [lx, lz] = toLocal(x, z, pool.position, pool.yaw);
    const hx = pool.size[0] / 2;
    const hz = pool.size[1] / 2;
    // Cheap reject before the polygon test.
    if (Math.abs(lx) > hx * 1.5 || Math.abs(lz) > hz * 1.5) return 0;
    const depth: PoolDepthSpec = { ...pool.shape.depth, max: pool.maxDepth };
    const floor = pool.position[1] - floorDepth(depthAtUnit(depth, lx / hx, lz / hz));
    const column = pool.waterY - floor;
    if (column <= 0.01) return 0;
    // Inside the plan? `insidePolygon` on the outline, through the same generator the mesh used.
    return insideOutline(pool, lx, lz) ? column : 0;
  }

  const outlineCache = new Map<string, number[]>();
  function insideOutline(pool: ResolvedPool, lx: number, lz: number): boolean {
    let outline = outlineCache.get(pool.id);
    if (!outline) {
      outline = outlinePoints(pool.shape, pool.size);
      outlineCache.set(pool.id, outline);
    }
    let inside = false;
    const n = outline.length / 2;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = outline[i * 2];
      const zi = outline[i * 2 + 1];
      const xj = outline[j * 2];
      const zj = outline[j * 2 + 1];
      if (zi > lz !== zj > lz && lx < ((xj - xi) * (lz - zi)) / (zj - zi) + xi) inside = !inside;
    }
    return inside;
  }

  const api: PoolsMainApi = {
    catalogue: () => poolShapes(),
    tiles: () => poolTiles(),
    edges: () => poolEdges(),
    registerContent(packId, block) {
      const added = registerPools(packId, block);
      if (added) {
        outlineCache.clear();
        dirty = true;
      }
      return added;
    },
    create(spec) {
      const shape = poolShape(spec.shape);
      if (!shape) throw new Error('[game/pools] no pool shape is registered');
      const data: PoolEntityData = {
        shape: shape.id,
        tile: spec.tile ?? shape.tile,
        edge: spec.edge ?? shape.edge,
        size: spec.size,
        depth: spec.depth,
        deckDensity: spec.deckDensity,
        heated: spec.heated,
        splashdownFor: spec.splashdownFor,
      };
      for (const key of Object.keys(data) as Array<keyof PoolEntityData>) {
        if (data[key] === undefined) delete data[key];
      }
      const id = nextEntityId(ctx.world, 'pool');
      const entity: Entity = {
        id,
        kind: 'pool',
        pack: 'pools',
        item: shape.id,
        position: [spec.x, groundAt(spec.x, spec.z), spec.z],
        yaw: spec.yaw ?? 0,
        data: data as unknown as Record<string, unknown>,
      };
      ctx.dispatch('entity:add', entity);
      return id;
    },
    remove(id) {
      ctx.dispatch('entity:remove', { id });
    },
    pools: () => [...placements.values()],
    pool: (id) => placements.get(id),
    poolAt(x, z) {
      for (const pool of placements.values()) if (depthIn(pool, x, z) > 0) return pool.id;
      return null;
    },
    depthAt(x, z) {
      let best = 0;
      for (const pool of placements.values()) {
        const d = depthIn(pool, x, z);
        if (d > best) best = d;
      }
      return best;
    },
    waterYAt(x, z) {
      for (const pool of placements.values()) if (depthIn(pool, x, z) > 0) return pool.waterY;
      return null;
    },
    splashdown(id) {
      const candidates = id
        ? [placements.get(id)].filter(
            Boolean as unknown as (p: ResolvedPool | undefined) => p is ResolvedPool
          )
        : [...placements.values()].filter((p) => p.role === 'splashdown');
      const list = candidates.length ? candidates : [...placements.values()];
      let best: { id: string; x: number; y: number; z: number; depth: number } | null = null;
      for (const pool of list) {
        const point = deepestPoint(pool);
        if (!best || point.depth > best.depth) best = point;
      }
      return best;
    },
    splash(x, z, strength = 1) {
      const y = api.waterYAt(x, z);
      if (y == null || !rings) return false;
      rings.spawn(x, y, z, strength);
      return true;
    },
    meshes: () => [...meshes.values()],
    focus(id) {
      const pool = placements.get(id);
      if (!pool) return null;
      return {
        position: [pool.position[0], pool.waterY, pool.position[2]],
        radius: poolRadius(pool) * 1.7,
      };
    },
    stats: () => ({ ...stats }),
  };

  /** The deepest point of a basin, in world metres — where a slide lands and a diver goes in. */
  function deepestPoint(pool: ResolvedPool): {
    id: string;
    x: number;
    y: number;
    z: number;
    depth: number;
  } {
    const depth: PoolDepthSpec = { ...pool.shape.depth, max: pool.maxDepth };
    const hx = pool.size[0] / 2;
    const hz = pool.size[1] / 2;
    let bx = 0;
    let bz = 0;
    let bd = -1;
    for (let j = -6; j <= 6; j++) {
      for (let i = -6; i <= 6; i++) {
        const lx = (i / 7) * hx;
        const lz = (j / 7) * hz;
        if (!insideOutline(pool, lx, lz)) continue;
        const d = depthAtUnit(depth, lx / hx, lz / hz);
        if (d > bd) {
          bd = d;
          bx = lx;
          bz = lz;
        }
      }
    }
    const cos = Math.cos(pool.yaw);
    const sin = Math.sin(pool.yaw);
    return {
      id: pool.id,
      x: pool.position[0] + bx * cos - bz * sin,
      y: pool.waterY,
      z: pool.position[2] + bx * sin + bz * cos,
      depth: Math.max(0, pool.waterY - (pool.position[1] - floorDepth(bd))),
    };
  }

  /**
   * Boot: resolve EVERY pool against the untouched ground first, and only then dig.
   *
   * The order matters and is a bug that would have been invisible: `dig` lowers the heightfield, so
   * a pool resolved after its neighbour has been excavated reads the neighbour's pit floor as its
   * own grade and sinks by the depth of the pool next door. Two passes cost nothing and cannot do
   * that. The sort is for determinism — the same world must produce the same park however the
   * entity map was iterated.
   */
  const bootIds = Object.keys(ctx.world.entities).sort();
  for (const id of bootIds) place(ctx.world.entities[id], false);
  for (const id of bootIds) {
    const pool = placements.get(id);
    if (pool) dig(pool);
  }

  /**
   * Nothing re-grounds on `terrain:changed`, and that is deliberate.
   *
   * The pool has already dug its own hole, so the ground under its centre IS the pit floor: asking
   * the terrain for it again would sink the basin by its own depth, and again on the next edit. A
   * pool's Y is fixed when it is placed, which is also what a real one does — you do not re-level a
   * concrete tank because somebody moved a hill.
   */

  return {
    api,
    onEntity(change: EntityChange) {
      if (change.type === 'remove') {
        if (!placements.delete(change.entity.id)) return;
        outlineCache.delete(change.entity.id);
        excavated.delete(change.entity.id);
        dirty = true;
        return;
      }
      if (change.entity.kind !== 'pool') return;
      outlineCache.delete(change.entity.id);
      if (place(change.entity)) dirty = true;
    },
    onRender(dt: number) {
      if (dirty) {
        dirty = false;
        try {
          rebuild();
        } catch (error) {
          console.warn('[game/pools] rebuild failed', error);
        }
        if (!rings) rings = createSplashRings(scene, materials.foam());
      }
      clock += dt;
      materials.animate(clock);
      for (const wm of waterMaterials.values()) wm.animate(clock);
      rings?.update(dt);
      updateLights(dt);
    },
    onEnvironment(env: EnvironmentState) {
      night = env.night;
      const sunUp = Math.max(0, Math.min(1, Math.sin(Math.max(0, env.sunElevation)) * 2.4));
      materials.setEnvironment(night, sunUp);
      for (const [id, wm] of waterMaterials) {
        const style = tileStyles.get(id);
        wm.applyEnvironment(env, night, style?.nightTint ?? [0.4, 0.8, 0.95]);
      }
    },
    dispose() {
      detachContent();
      const env = ctx.module<EnvironmentLike>('environment');
      for (const mesh of shadowed) env?.removeShadowCaster?.(mesh);
      shadowed = [];
      for (const light of lights) light.dispose();
      lights.length = 0;
      rings?.dispose();
      rings = null;
      for (const mesh of meshes.values()) mesh.dispose(false, false);
      meshes.clear();
      for (const wm of waterMaterials.values()) wm.dispose();
      waterMaterials.clear();
      tileStyles.clear();
      materials.dispose();
      rippleA.dispose();
      rippleB.dispose();
      placements.clear();
      outlineCache.clear();
      excavated.clear();
    },
  };
}
