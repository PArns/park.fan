/**
 * The track renderer: layouts in, meshes out.
 *
 * **Four meshes per coaster, not four thousand.** Rails, spine, ties, structure and footings are
 * five vertex buffers per run — the ties and the footings are their own because they are the two
 * things a distant camera can lose without noticing, and everything else is welded. A wooden
 * coaster has 1,990 sleepers on it and every one of them lives in the same buffer as the rest.
 *
 * **The tie mesh is an LOD level, and that is the whole LOD story.** `addLODLevel(d, null)` is
 * Babylon's own mechanism and costs nothing per frame; a hand-rolled distance check in `onRender`
 * would be another thing to get wrong. Everything else stays: the silhouette of a coaster is its
 * rails and its supports, and dropping either at distance is what makes a park look empty.
 *
 * **World matrices are frozen.** A coaster does not move. Freezing them takes the per-frame
 * transform work for five meshes to zero and, more usefully, lets Babylon skip the bounding-box
 * recomputation that a 40,000-vertex mesh otherwise does on every camera change.
 *
 * The build itself is pure (`build.ts`) and so is the geometry (`profile.ts`, `supports.ts`); this
 * file is the part that cannot be unit-tested, which is exactly why it is kept this thin.
 */

import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import type { Material } from '@babylonjs/core/Materials/material';
import type { Scene } from '@babylonjs/core/scene';
import type { Entity, MainContext, MainHandle } from '../core/types';
import { buildTrack, type BuiltTrack } from './build';
import { attachTrackElements, trackElements, type TrackElementDef } from './elements';
import { createTrackMaterials, type TrackMaterials } from './materials';
import { simulateTrack, type TrackPhysics } from './physics';
import { buildTrackGeometry, type Geo, type TrackGroup } from './profile';
import { buildOptionsFor, resolveColor, resolveStyle, trackStyles } from './resolve';
import { buildSupports } from './supports';
import type { TrackSpline, TrackFrame } from './spline';
import type { DriveSection, TrackData } from './types';
import type { TrackStyleDef } from '../core/pack-schema';

const TEXTURE_SIZE = { low: 256, medium: 512, high: 512, ultra: 768 } as const;
/** Beyond this the crossties stop being individually visible; the rails and supports never do. */
const TIE_LOD_DISTANCE = { low: 90, medium: 150, high: 220, ultra: 300 } as const;

export interface TrackStats {
  tracks: number;
  meshes: number;
  triangles: number;
  vertices: number;
  columns: number;
  braces: number;
  buildMs: number;
  textureMs: number;
  textureSize: number;
  /** Total drawn track length, metres. */
  lengthM: number;
}

/**
 * What the rest of the game may call. `trains` consumes `spline`, `frameAt`, `drives` and
 * `physics`; a build tool consumes `styles`, `elements`, `validate` and `create`.
 */
export interface TrackMainApi {
  /** Every registered track style, from the content packs. */
  styles(): Array<{ key: string; def: TrackStyleDef }>;
  /** Every registered element, from the element table. */
  elements(): TrackElementDef[];
  /** Build a layout, draw it, and return its id. */
  create(data: TrackData, id?: string): string;
  remove(id: string): void;
  get(id: string): BuiltTrack | undefined;
  ids(): string[];
  /** The arclength spline of a drawn layout. */
  spline(id: string): TrackSpline | undefined;
  /** Position, tangent, up and right at an arc length. */
  frameAt(id: string, s: number): TrackFrame | undefined;
  /** Lifts, launches, brakes and the station block, with their arc-length ranges. */
  drives(id: string): readonly DriveSection[];
  /** The last physics run for a drawn layout. */
  physics(id: string): TrackPhysics | undefined;
  /** Run the physics on a layout without drawing it. */
  validate(data: TrackData): TrackPhysics;
  meshes(): AbstractMesh[];
  stats(): TrackStats;
}

interface DrawnTrack {
  id: string;
  built: BuiltTrack;
  meshes: Mesh[];
  columns: number;
  braces: number;
}

export function createTrackMain(ctx: MainContext): MainHandle {
  // Same claim as the sim half makes, because a showcase may load `main` without `sim`; the
  // second registration of an element is a map write over the same key.
  const detachElements = attachTrackElements(ctx.registry);
  const scene = ctx.scene as Scene;
  const materials: TrackMaterials = createTrackMaterials(
    scene,
    ctx.rng.int(1, 1 << 28),
    TEXTURE_SIZE[ctx.quality.preset]
  );
  const tieDistance = TIE_LOD_DISTANCE[ctx.quality.preset];
  const tracks = new Map<string, DrawnTrack>();
  let buildMs = 0;
  let counter = 0;

  interface TerrainLike {
    height(x: number, z: number): number;
  }
  interface EnvironmentLike {
    addShadowCaster?(mesh: unknown, includeDescendants?: boolean): void;
    removeShadowCaster?(mesh: unknown): void;
  }
  const terrain = ctx.module<TerrainLike>('terrain');
  const ground = (x: number, z: number) => terrain?.height(x, z) ?? 0;

  function meshFrom(name: string, geo: Geo, material: Material): Mesh | null {
    if (geo.indices.length === 0) return null;
    const mesh = new Mesh(name, scene);
    const data = new VertexData();
    data.positions = geo.positions;
    data.normals = geo.normals;
    data.uvs = geo.uvs;
    data.indices = geo.indices;
    data.applyToMesh(mesh, false);
    mesh.material = material;
    mesh.receiveShadows = true;
    mesh.isPickable = true;
    mesh.alwaysSelectAsActiveMesh = false;
    mesh.freezeWorldMatrix();
    return mesh;
  }

  function draw(id: string, data: TrackData): DrawnTrack {
    const t0 = performance.now();
    const built = buildTrack(data, buildOptionsFor(ctx.registry, data));
    const style = resolveStyle(ctx.registry, data.style);
    const geometry = buildTrackGeometry(built.spline, style);
    const paint = materials.paint(resolveColor(ctx.registry, data));
    const structure = style.supports === 'timber' ? materials.timber() : paint;
    // The underside of the structure: rails, then the spine if there is one, then a little slack
    // so a column's head plate does not z-fight the tie above it.
    const depth = style.rail.radius * 2 + (style.spine ? style.spine.size + 0.12 : 0.3) + 0.05;
    const supports = buildSupports(built.spline, geometry.frames, {
      kind: style.supports,
      ground,
      load: (s) => {
        const stations = built.physics.stations;
        if (stations.length === 0) return 1;
        const run = built.physics.runLength;
        let local = s - built.physics.startS;
        local = ((local % run) + run) % run;
        const index = Math.min(
          stations.length - 1,
          Math.max(0, Math.round((local / run) * (stations.length - 1)))
        );
        return stations[index].gVert;
      },
      structureDepth: depth,
    });

    const meshes: Mesh[] = [];
    const groups: Array<[TrackGroup, Material]> = [
      ['rail', materials.rail()],
      ['spine', paint],
      ['tie', style.supports === 'timber' ? materials.timber() : paint],
    ];
    for (const [group, material] of groups) {
      const mesh = meshFrom(`track-${id}-${group}`, geometry.groups[group], material);
      if (!mesh) continue;
      // The ties are the one thing a distant camera can lose; `addLODLevel(d, null)` hides the
      // mesh past `d` and is Babylon's own mechanism, so nothing runs per frame to maintain it.
      if (group === 'tie') mesh.addLODLevel(tieDistance, null);
      meshes.push(mesh);
    }
    const memberMesh = meshFrom(`track-${id}-support`, supports.member, structure);
    if (memberMesh) meshes.push(memberMesh);
    const footingMesh = meshFrom(`track-${id}-footing`, supports.footing, materials.concrete());
    if (footingMesh) {
      footingMesh.addLODLevel(tieDistance * 1.6, null);
      meshes.push(footingMesh);
    }

    const env = ctx.module<EnvironmentLike>('environment');
    for (const mesh of meshes) env?.addShadowCaster?.(mesh, false);

    buildMs += performance.now() - t0;
    if (built.warnings.length) {
      for (const warning of built.warnings) console.warn(`[game/track] ${id}: ${warning}`);
    }
    return { id, built, meshes, columns: supports.columns, braces: supports.braces };
  }

  function dispose(track: DrawnTrack): void {
    const env = ctx.module<EnvironmentLike>('environment');
    for (const mesh of track.meshes) {
      env?.removeShadowCaster?.(mesh);
      mesh.dispose(false, false);
    }
  }

  function create(data: TrackData, id?: string): string {
    const key = id ?? `track-${++counter}`;
    const existing = tracks.get(key);
    if (existing) dispose(existing);
    tracks.set(key, draw(key, data));
    ctx.events.emit('track:changed', { rideId: key });
    return key;
  }

  function remove(id: string): void {
    const track = tracks.get(id);
    if (!track) return;
    dispose(track);
    tracks.delete(id);
    ctx.events.emit('track:changed', { rideId: id });
  }

  const api: TrackMainApi = {
    styles: () => trackStyles(ctx.registry),
    elements: () => trackElements(),
    create,
    remove,
    get: (id) => tracks.get(id)?.built,
    ids: () => [...tracks.keys()],
    spline: (id) => tracks.get(id)?.built.spline,
    frameAt: (id, s) => tracks.get(id)?.built.spline.frameAt(s),
    drives: (id) => tracks.get(id)?.built.drives ?? [],
    physics: (id) => tracks.get(id)?.built.physics,
    validate(data) {
      const options = buildOptionsFor(ctx.registry, data);
      const built = buildTrack(data, { ...options, quick: true });
      return simulateTrack({
        spline: built.spline,
        drives: built.drives,
        train: options.train,
        limits: options.limits,
        dispatchSpeed: options.dispatchSpeed,
        ratedSpeed: options.ratedSpeed,
      });
    },
    meshes: () => [...tracks.values()].flatMap((t) => t.meshes),
    stats() {
      let triangles = 0;
      let vertices = 0;
      let meshes = 0;
      let columns = 0;
      let braces = 0;
      let lengthM = 0;
      for (const track of tracks.values()) {
        lengthM += track.built.spline.length();
        columns += track.columns;
        braces += track.braces;
        for (const mesh of track.meshes) {
          meshes += 1;
          triangles += mesh.getTotalIndices() / 3;
          vertices += mesh.getTotalVertices();
        }
      }
      return {
        tracks: tracks.size,
        meshes,
        triangles,
        vertices,
        columns,
        braces,
        buildMs: Math.round(buildMs),
        textureMs: Math.round(materials.textureMs),
        textureSize: materials.textureSize,
        lengthM: Math.round(lengthM),
      };
    },
  };

  function entityData(entity: Entity): TrackData | null {
    const data = entity.data as unknown as TrackData | undefined;
    if (!data || !Array.isArray(data.pieces)) return null;
    return { ...data, origin: entity.position, yaw: entity.yaw };
  }

  return {
    api,
    onEntity(change) {
      if (change.type === 'remove') {
        if (change.entity.kind === 'coaster') remove(change.entity.id);
        return;
      }
      if (change.entity.kind !== 'coaster') return;
      const data = entityData(change.entity);
      if (data) create(data, change.entity.id);
    },
    dispose() {
      detachElements();
      for (const track of tracks.values()) dispose(track);
      tracks.clear();
      materials.dispose();
    },
  };
}
