/**
 * The paths renderer: one mesh per material, rebuilt when a path entity changes.
 *
 * **The rebuild is coalesced, not immediate.** `onEntity` marks the module dirty and the next
 * `onRender` does the work, so dropping a plaza and three paths in one command batch costs one
 * rebuild rather than four. `stats().rebuildMs` is what that costs; it is measured, not assumed.
 *
 * **The main thread has its own copy of the world**, exactly as the terrain module's docblock
 * describes: `cloneWorld` runs before the worker starts, so an `entity:add` dispatched from a tool
 * is mirrored here by core and the same command reaches the sim. Both sides then build the same
 * layouts from the same spline code — the renderer at 1 m stations for quads, the worker at 3 m
 * for graph nodes.
 *
 * **This side keeps a graph too.** A build tool needs `nearestNode` and "is this reachable" while
 * the pointer moves, and a round trip to the worker per pointer event is not a thing you can do.
 * It costs one extra `buildGraph` per rebuild — sub-millisecond at park scale, reported as
 * `stats().graphMs` — and it is the same pure code, so the two cannot drift.
 */

import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import '@babylonjs/core/Meshes/thinInstanceMesh';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import type { Scene } from '@babylonjs/core/scene';
import type { Entity, MainContext, MainHandle } from '../core/types';
import { nextEntityId } from '../core/world';
import { buildLayout, findJunctions, MESH_SPACING, GRAPH_SPACING, type PathLayout } from './layout';
import { buildPathGeometry, type Geo, type SurfaceSampler } from './mesh';
import { createPathMaterials, type PathMaterials } from './materials';
import { buildGraph, createRouter, EMPTY_GRAPH, type PathGraph, type Router } from './graph';
import {
  pathMaterial,
  pathStyle,
  pathStyles,
  registerPathStyle,
  resolveWidth,
  STANCHION_POST_MATERIAL,
  type PathStyleDef,
  attachPathStyles,
} from './manifest';
import type { GraphStats, PathEntityData, Waypoint } from './types';

const TEXTURE_SIZE = { low: 256, medium: 512, high: 768, ultra: 768 } as const;
/** How far the kerb's outer face drops below the ground. */
const KERB_SKIRT = 0.35;

export interface PathSpec {
  form?: 'path' | 'plaza' | 'queue';
  style?: string;
  /** Flat `[x, z, …]`. */
  points: number[];
  width?: number;
  closed?: boolean;
  rideId?: string;
  entrance?: boolean;
}

export interface PathsMeshStats {
  meshes: number;
  triangles: number;
  vertices: number;
  posts: number;
  junctions: number;
  layouts: number;
  rebuildMs: number;
  graphMs: number;
  textureMs: number;
  textureSize: number;
  /** Texels per metre of the surface textures, the art bible's number. */
  texelDensity: number;
}

export interface PathsMainApi {
  /** Every registered style; a build bar reads this rather than a hard-coded list. */
  styles(): PathStyleDef[];
  /** Add a style from a manifest entry at runtime. Throws with the offending field. */
  registerStyle(entry: unknown): PathStyleDef;
  /** Create a path entity. Returns the new id. */
  create(spec: PathSpec): string;
  remove(id: string): void;
  /** Main-thread routing, for tools and ghosts. Mirrors the sim api. */
  next(fromX: number, fromZ: number, toX: number, toZ: number, node?: number): Waypoint | null;
  reachable(fromX: number, fromZ: number, toX: number, toZ: number): boolean;
  entrance(): { x: number; z: number };
  nearestNode(x: number, z: number, maxDistance?: number): number;
  /** The drawn meshes, for shadow receivers and overlays. */
  meshes(): AbstractMesh[];
  graphStats(): GraphStats;
  stats(): PathsMeshStats;
}

export function createPathsMain(ctx: MainContext): MainHandle {
  // Claim `pathStyles`/`pathMaterials` and read them off every pack, at boot and afterwards. Both
  // halves of the module do it: a showcase may load one without the other, and re-registering a
  // style is a map write over the same id.
  const detachStyles = attachPathStyles(ctx.registry);
  const scene = ctx.scene as Scene;
  interface TerrainLike {
    height(x: number, z: number): number;
    normal(x: number, z: number): [number, number, number];
  }
  const terrain = ctx.module<TerrainLike>('terrain');
  const sampler: SurfaceSampler = {
    height: (x, z) => terrain?.height(x, z) ?? 0,
    normal: (x, z) => terrain?.normal(x, z) ?? [0, 1, 0],
  };

  const materials: PathMaterials = createPathMaterials(scene, TEXTURE_SIZE[ctx.quality.preset]);
  const meshes = new Map<string, Mesh>();
  let postMesh: Mesh | null = null;
  let graph: PathGraph = EMPTY_GRAPH;
  let router: Router = createRouter(graph, defaultGate());
  const stats: PathsMeshStats = {
    meshes: 0,
    triangles: 0,
    vertices: 0,
    posts: 0,
    junctions: 0,
    layouts: 0,
    rebuildMs: 0,
    graphMs: 0,
    textureMs: 0,
    textureSize: materials.size,
    texelDensity: 0,
  };
  let dirty = true;

  function defaultGate(): { x: number; z: number } {
    return { x: 0, z: (ctx.world.terrain?.size ?? 512) * 0.33 };
  }

  function pathEntities(): Entity[] {
    const out: Entity[] = [];
    for (const id of Object.keys(ctx.world.entities).sort()) {
      const entity = ctx.world.entities[id];
      if (entity.kind === 'path') out.push(entity);
    }
    return out;
  }

  function meshFor(material: string): Mesh {
    let mesh = meshes.get(material);
    if (!mesh) {
      mesh = new Mesh(`paths-${material}`, scene);
      mesh.material = materials.get(material);
      mesh.receiveShadows = true;
      mesh.isPickable = true;
      // A path is drawn before anything standing on it; the alpha index keeps it out of the way of
      // transparent props and stops Babylon sorting it as if it were one.
      mesh.alphaIndex = 0;
      mesh.useVertexColors = true;
      mesh.hasVertexAlpha = false;
      meshes.set(material, mesh);
    }
    return mesh;
  }

  function apply(geo: Geo, mesh: Mesh): void {
    const data = new VertexData();
    data.positions = new Float32Array(geo.positions);
    data.normals = new Float32Array(geo.normals);
    data.uvs = new Float32Array(geo.uvs);
    data.colors = new Float32Array(geo.colors);
    data.indices = new Uint32Array(geo.indices);
    data.applyToMesh(mesh, false);
    mesh.freezeWorldMatrix();
  }

  function rebuild(): void {
    const t0 = performance.now();
    const entities = pathEntities();
    const layouts: PathLayout[] = [];
    for (const entity of entities) {
      const layout = buildLayout(entity, MESH_SPACING);
      if (layout) layouts.push(layout);
    }
    const junctions = findJunctions(layouts);
    const build = buildPathGeometry(layouts, junctions, { sampler, skirt: KERB_SKIRT });

    let vertices = 0;
    for (const [material, geo] of build.groups) {
      const mesh = meshFor(material);
      apply(geo, mesh);
      mesh.setEnabled(geo.indices.length > 0);
      vertices += geo.positions.length / 3;
    }
    // A material that used to have geometry and no longer does keeps its mesh but empties it: the
    // alternative is disposing and recreating a mesh every time a path is deleted and redrawn,
    // which throws away the material binding for nothing.
    for (const [material, mesh] of meshes) {
      if (!build.groups.has(material)) {
        mesh.setEnabled(false);
        const empty: Geo = { positions: [], normals: [], uvs: [], colors: [], indices: [] };
        apply(empty, mesh);
      }
    }

    applyPosts(build.posts);

    const t1 = performance.now();
    // Same layouts, coarser sampling: the graph does not want a node per metre.
    const graphLayouts: PathLayout[] = [];
    for (const entity of entities) {
      const layout = buildLayout(entity, GRAPH_SPACING);
      if (layout) graphLayouts.push(layout);
    }
    graph = buildGraph(graphLayouts, (x, z) => sampler.height(x, z));
    const t2 = performance.now();
    // `buildGraph` does not time itself: it is sim-reachable and a wall clock is banned there
    // (ARCHITECTURE §1 rule 2). The renderer is allowed one, so it fills the field in.
    graph.buildMs = t2 - t1;
    router = createRouter(graph, defaultGate());

    stats.meshes = [...meshes.values()].filter((m) => m.isEnabled()).length + (postMesh ? 1 : 0);
    stats.triangles = build.triangles;
    stats.vertices = vertices;
    stats.posts = build.posts.length / 16;
    stats.junctions = junctions.length;
    stats.layouts = layouts.length;
    stats.rebuildMs = Number((t1 - t0).toFixed(2));
    stats.graphMs = Number((t2 - t1).toFixed(2));
    stats.textureMs = Number(materials.textureMs().toFixed(1));
    stats.textureSize = materials.size;
    // The art bible asks for 512 px/m on a surface a camera can touch. Report what the WORST
    // WALKING surface in the park actually gets rather than the best — kerbs are deliberately half
    // resolution and would flatter nothing by being averaged in — and let the report argue with it.
    let worst = Infinity;
    for (const layout of layouts) {
      const recipe = pathMaterial(layout.style.surface);
      const px = Math.max(128, Math.round(materials.size * (recipe.detail ?? 1)));
      worst = Math.min(worst, px / recipe.tileMetres);
    }
    stats.texelDensity = Number.isFinite(worst) ? Math.round(worst) : 0;
    ctx.events.emit('paths:rebuilt', { ...stats });
    // The same numbers on the meshes themselves. Deep imports mean an outside probe can reach the
    // scene (`__parkfan_game.scene()`) but not a module's api, so without this the only way to
    // answer "how long did the textures take" from a screenshot harness is to guess.
    for (const mesh of meshes.values()) mesh.metadata = { pathsStats: { ...stats } };
  }

  function applyPosts(matrices: Float32Array): void {
    if (matrices.length === 0) {
      postMesh?.setEnabled(false);
      return;
    }
    if (!postMesh) {
      // A tapered post with a wide foot: the taper is what makes it read as a stanchion rather
      // than as a pipe, and the foot is the contact the art bible asks every prop to make.
      postMesh = CreateCylinder(
        'paths-stanchion',
        { height: 0.98, diameterTop: 0.055, diameterBottom: 0.115, tessellation: 10 },
        scene
      );
      postMesh.material = materials.get(STANCHION_POST_MATERIAL);
      postMesh.receiveShadows = true;
      postMesh.isPickable = false;
      postMesh.alwaysSelectAsActiveMesh = true;
    }
    postMesh.setEnabled(true);
    postMesh.thinInstanceSetBuffer('matrix', matrices, 16, true);
  }

  const offAdd = ctx.events.on('entity:add', (entity: Entity) => {
    if (entity.kind === 'path') dirty = true;
  });
  const offUpdate = ctx.events.on('entity:update', (change: { entity: Entity }) => {
    if (change.entity.kind === 'path') dirty = true;
  });
  const offRemove = ctx.events.on('entity:remove', (entity: Entity) => {
    if (entity.kind === 'path') dirty = true;
  });
  const offTerrain = ctx.events.on('terrain:changed', () => {
    // Paths conform to the ground; a sculpt under one moves it.
    dirty = true;
  });

  const api: PathsMainApi = {
    styles: () => pathStyles(),
    registerStyle: (entry) => {
      const def = registerPathStyle(entry);
      dirty = true;
      return def;
    },
    create(spec) {
      const form = spec.form ?? 'path';
      const style = pathStyle(spec.style ?? 'promenade');
      const data: PathEntityData = {
        form,
        style: style.id,
        points: spec.points.slice(),
        width: form === 'plaza' ? undefined : resolveWidth(style, spec.width),
        closed: spec.closed === true,
        rideId: spec.rideId,
        entrance: spec.entrance === true,
      };
      let cx = 0;
      let cz = 0;
      const n = Math.max(1, spec.points.length / 2);
      for (let i = 0; i + 1 < spec.points.length; i += 2) {
        cx += spec.points[i];
        cz += spec.points[i + 1];
      }
      cx /= n;
      cz /= n;
      const id = nextEntityId(ctx.world, 'path');
      const entity: Entity = {
        id,
        kind: 'path',
        pack: 'core-classic',
        item: style.id,
        position: [cx, sampler.height(cx, cz), cz],
        yaw: 0,
        data: data as unknown as Record<string, unknown>,
      };
      ctx.dispatch('entity:add', entity);
      return id;
    },
    remove(id) {
      ctx.dispatch('entity:remove', { id });
    },
    next: (fromX, fromZ, toX, toZ, node) => router.next(fromX, fromZ, toX, toZ, node),
    reachable: (fromX, fromZ, toX, toZ) => router.reachable(fromX, fromZ, toX, toZ),
    entrance: () => router.entrance(),
    nearestNode: (x, z, maxDistance) => router.nearest(x, z, maxDistance),
    meshes: () => [...meshes.values()].filter((m) => m.isEnabled()),
    graphStats: () => router.stats(),
    stats: () => ({ ...stats }),
  };

  return {
    api,
    onRender() {
      if (!dirty) return;
      dirty = false;
      router.beginTick();
      try {
        rebuild();
      } catch (error) {
        console.warn('[game/paths] rebuild failed', error);
      }
    },
    dispose() {
      detachStyles();
      offAdd();
      offUpdate();
      offRemove();
      offTerrain();
      for (const mesh of meshes.values()) mesh.dispose(false, false);
      meshes.clear();
      postMesh?.dispose(false, false);
      postMesh = null;
      materials.dispose();
    },
  };
}
