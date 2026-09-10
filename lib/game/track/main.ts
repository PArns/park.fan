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
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
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
import { buildStation, type StationBuild } from './station';
import type { TrackSpline, TrackFrame } from './spline';
import type { DriveSection, TrackData } from './types';
import type { TrackStyleDef } from '../core/pack-schema';

const TEXTURE_SIZE = { low: 256, medium: 512, high: 512, ultra: 768 } as const;
/** Beyond this the crossties stop being individually visible; the rails and supports never do. */
const TIE_LOD_DISTANCE = { low: 90, medium: 150, high: 220, ultra: 300 } as const;
/**
 * Where a timber structure swaps to its coarse silhouette.
 *
 * Further out than the ties, because a tie is a detail and the bracing is the shape: losing it too
 * early would take the lattice off a coaster somebody is still standing in front of. 180 m at
 * `medium` is about where a 0.26 m member stops covering a pixel at this field of view.
 */
const SUPPORT_FAR_DISTANCE = { low: 110, medium: 180, high: 260, ultra: 340 } as const;

/**
 * How many station lights this module may hang, per quality tier.
 *
 * A pool rather than one per coaster, which is the rule `flumes`, `rides`, `shops` and `scenery`
 * all arrived at independently: a real-time light is not free, and this park already carries
 * sixteen. The tiers are lower than `flumes`' because a park has more slides than coasters and a
 * coaster is a bigger object — one lit station reads from `overview`, four do not read four times
 * as well.
 *
 * The reason there is a light here at all is a single night frame: photographed at 21:30 the
 * station this module had just gained was a flat silhouette, and a boarding platform is the one
 * structure in a park that is always lit, because nobody gets into a train in the dark.
 */
const STATION_LIGHT_POOL = { low: 0, medium: 1, high: 2, ultra: 3 } as const;
/** Warm white, the colour a station's own strip lighting actually is. */
const STATION_LIGHT_COLOR: [number, number, number] = [1, 0.86, 0.68];
/**
 * 5.0, and the number came from a before/after rather than from taste.
 *
 * At 2.4 spread over a 16 m range the platform measured luma 29.2 against 26.9 for the grass
 * beside it — a light that is present and not a station that is lit. `flumes` runs its tower rig
 * at 5 over a 6 m range for the same reason: a night light in this scene has to be concentrated
 * to read at all, so this one is brighter and its range is tied to the platform rather than to
 * the ride.
 */
const STATION_LIGHT_INTENSITY = 5;

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
  station: StationBuild;
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
  const supportFarDistance = SUPPORT_FAR_DISTANCE[ctx.quality.preset];
  const tracks = new Map<string, DrawnTrack>();
  const lights: PointLight[] = [];
  let buildMs = 0;
  let counter = 0;
  /** 0 by day, 1 at night. Written by `onEnvironment`, read by the lights and nothing else. */
  let night = 0;

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
    // The timber silhouette LOD. Past `supportFarDistance` the lattice is finer than a pixel and
    // aliases into a brown smear, so the master mesh swaps to one tier of bracing instead of up to
    // four. Babylon owns the swap (`addLODLevel` sets `_masterMesh`, which makes the coarse mesh
    // `isBlocked()` and therefore invisible to the normal render), so nothing runs per frame, and
    // the coarse mesh is deliberately NOT a shadow caster: the master already is one, and a shadow
    // map at this distance has no idea which of the two it is looking at.
    const farMesh = supports.memberFar
      ? meshFrom(`track-${id}-support-far`, supports.memberFar, structure)
      : null;
    const footingMesh = meshFrom(`track-${id}-footing`, supports.footing, materials.concrete());
    if (footingMesh) {
      footingMesh.addLODLevel(tieDistance * 1.6, null);
      meshes.push(footingMesh);
    }

    // The boarding station. Three groups so each takes its own material: the deck is concrete, the
    // posts and the canopy are painted with the track so a station reads as part of the ride, and
    // the railing is the rail steel. A layout with no `station` drive section (the showcase's open
    // test pieces) builds nothing and this is three no-ops.
    const station = buildStation(built.spline, built.drives, { ground });
    for (const [group, geo, material] of [
      ['station-deck', station.deck, materials.concrete()],
      ['station-structure', station.structure, paint],
      ['station-rail', station.rail, materials.rail()],
    ] as const) {
      const mesh = meshFrom(`track-${id}-${group}`, geo, material);
      if (mesh) meshes.push(mesh);
    }

    const env = ctx.module<EnvironmentLike>('environment');
    for (const mesh of meshes) env?.addShadowCaster?.(mesh, false);
    if (farMesh && memberMesh) {
      memberMesh.addLODLevel(supportFarDistance, farMesh);
      // Pushed after the shadow loop on purpose, so it is disposed with the track and casts nothing.
      meshes.push(farMesh);
    } else if (farMesh) {
      farMesh.dispose(false, false);
    }

    buildMs += performance.now() - t0;
    if (built.warnings.length) {
      for (const warning of built.warnings) console.warn(`[game/track] ${id}: ${warning}`);
    }
    return { id, built, meshes, columns: supports.columns, braces: supports.braces, station };
  }

  function dispose(track: DrawnTrack): void {
    const env = ctx.module<EnvironmentLike>('environment');
    for (const mesh of track.meshes) {
      env?.removeShadowCaster?.(mesh);
      mesh.dispose(false, false);
    }
  }

  /**
   * Hang the station lights, longest platform first.
   *
   * Rebuilt wholesale on any change rather than patched, for the reason the rest of this module
   * rebuilds a track wholesale: a coaster is not edited a hundred times a second, and a pool that
   * is repaired incrementally is a pool that drifts out of step with what is drawn.
   *
   * "Longest platform" is the tie-break because it is the only measure of a station this module
   * has that is not the layout's own length: a 24 m platform is a two-train ride and the busiest
   * thing in that corner of the park.
   */
  function rebuildLights(): void {
    for (const light of lights) light.dispose();
    lights.length = 0;
    const budget = STATION_LIGHT_POOL[ctx.quality.preset] ?? 1;
    if (budget <= 0) return;
    const wanted = [...tracks.values()]
      .filter((t) => t.station.lightAt != null)
      .sort((a, b) => b.station.length - a.station.length)
      .slice(0, budget);
    for (const track of wanted) {
      const at = track.station.lightAt!;
      const light = new PointLight(
        `track-station:${track.id}`,
        new Vector3(at[0], at[1], at[2]),
        scene
      );
      const [r, g, b] = STATION_LIGHT_COLOR;
      light.diffuse = new Color3(r, g, b);
      light.specular = new Color3(r * 0.3, g * 0.3, b * 0.3);
      // The platform plus a few metres of apron either side; a light that reaches the whole
      // circuit would wash the track out and cost every mesh in range a lighting pass.
      light.range = Math.max(12, track.station.length * 0.75);
      light.intensity = STATION_LIGHT_INTENSITY * night;
      light.shadowEnabled = false;
      lights.push(light);
    }
  }

  function create(data: TrackData, id?: string): string {
    const key = id ?? `track-${++counter}`;
    const existing = tracks.get(key);
    if (existing) dispose(existing);
    tracks.set(key, draw(key, data));
    rebuildLights();
    ctx.events.emit('track:changed', { rideId: key });
    return key;
  }

  function remove(id: string): void {
    const track = tracks.get(id);
    if (!track) return;
    dispose(track);
    tracks.delete(id);
    rebuildLights();
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
    onEnvironment(env) {
      night = env.night;
      for (const light of lights) light.intensity = STATION_LIGHT_INTENSITY * night;
    },
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
      for (const light of lights) light.dispose();
      lights.length = 0;
      for (const track of tracks.values()) dispose(track);
      tracks.clear();
      materials.dispose();
    },
  };
}
