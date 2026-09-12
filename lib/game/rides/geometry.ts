/**
 * The main-thread renderer: one batch per ride TYPE, one thin-instance set per part, and a matrix
 * written per unit per frame.
 *
 * **A carousel is not one mesh and it is not sixteen.** It is one mesh per (rig part × finish),
 * thin-instanced over `rides × units`: sixteen horses on four carousels are 64 instances in one
 * draw call, and a park that buys a second carousel pays nothing for it. The batching key is the
 * ride's `pack:item`, so two rides of the same type share everything and two of different types
 * share only the materials.
 *
 * **Interpolation.** The worker publishes `spin` (nominal runs, wrapping at 1024) and `drive`
 * (0..1) per ride. Both are interpolated between the last two frames by the host's `alpha`, with a
 * wrap guard on `spin` — a machine that crossed the wrap between two frames would otherwise
 * unwind a thousand revolutions in one frame.
 *
 * **`addLODLevel` is not used, deliberately.** `docs/game/reports/trains.md` §3 records why: it
 * measures from the mesh's own bounding-sphere centre, and a thin-instanced mesh has no transform
 * of its own, so the distance Babylon compares is camera-to-origin. It hid the running gear of
 * every train in the showcase with nothing in the console. The per-unit distance exists only in
 * the loop below, and this module spends it on nothing yet — see the report's weaknesses.
 */

import '@babylonjs/core/Meshes/thinInstanceMesh';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';
import type { SimFrame } from '../core/types';
import { buildShape, type ShapeMesh } from './shapes';
import { poseRig, rigLayout, type RigLayout, type UnitPose } from './rig';
import { MOTION_STRIDE, type Finish, type FlatRideProfile } from './types';
import type { RideMaterials } from './materials';

export interface RidePlacement {
  id: string;
  key: string;
  position: [number, number, number];
  yaw: number;
  scale: number;
}

export interface RideMeshStats {
  batches: number;
  meshes: number;
  drawCalls: number;
  instances: number;
  triangles: number;
  /** Milliseconds the last geometry build cost. */
  buildMs: number;
  interpolated: boolean;
}

interface PartBatch {
  partId: string;
  units: number;
  /** `rides × units × 16`, shared by every finish mesh of this part. */
  matrices: Float32Array;
  meshes: Mesh[];
  trianglesPerUnit: number;
}

interface Batch {
  key: string;
  profile: FlatRideProfile;
  layout: RigLayout;
  rides: RidePlacement[];
  parts: PartBatch[];
  pose: UnitPose[];
}

export interface RideRenderer {
  setPlacements(list: RidePlacement[], profileOf: (key: string) => FlatRideProfile | null): void;
  update(frame: SimFrame | null, previous: SimFrame | null, alpha: number, roster: string[]): void;
  meshes(): Mesh[];
  shadowMeshes(): Mesh[];
  stats(): RideMeshStats;
  dispose(): void;
}

export function createRideRenderer(scene: Scene, materials: RideMaterials): RideRenderer {
  const batches = new Map<string, Batch>();
  let buildMs = 0;
  let interpolated = false;
  /**
   * Frames left in which to re-measure the thin-instance bounds.
   *
   * A thin-instanced mesh's bounding info is its SOURCE geometry's, at the world origin, and the
   * shadow generator uses it to fit its cascades: six rides 40 m out with bounds claiming a 7 m
   * drum at (0,0,0) is a cascade split fitted to the wrong volume. Refreshing costs a pass over
   * the matrices, so it runs for a few frames after a placement changes rather than every frame —
   * and it runs for more than one because the envelope is a MOVING machine's, and at tick 0 the
   * chains hang straight down.
   */
  let refreshFrames = 0;

  const tmpQuat = new Quaternion();
  const tmpPos = new Vector3();
  const one = Vector3.One();
  const rideMatrix = new Matrix();
  const unitMatrix = new Matrix();
  const outMatrix = new Matrix();

  function meshFor(
    key: string,
    partId: string,
    finish: Finish,
    shape: ShapeMesh,
    index: number
  ): Mesh | null {
    const surface = shape.surfaces.find((s) => s.finish === finish);
    if (!surface) return null;
    const mesh = new Mesh(`rides:${key}:${partId}:${finish}`, scene);
    const data = new VertexData();
    data.positions = surface.positions;
    data.normals = surface.normals;
    data.uvs = surface.uvs;
    data.colors = surface.colors;
    data.indices = surface.indices;
    data.applyToMesh(mesh, false);
    mesh.material =
      finish === 'lamp'
        ? materials.lamp(surface.colors[0] ?? 1, surface.colors[1] ?? 1, surface.colors[2] ?? 1)
        : materials.surface(finish);
    mesh.isPickable = false;
    mesh.receiveShadows = finish !== 'lamp';
    // A thin-instanced mesh has no transform of its own, so its bounding box sits at the world
    // origin and a ride 120 m away is culled with the camera pointing straight at it. Refreshing
    // the instance bounds every frame is the other answer and it costs a full pass over the
    // matrices; this costs nothing and a fairground is never off screen when it matters.
    mesh.alwaysSelectAsActiveMesh = true;
    mesh.renderingGroupId = 0;
    mesh.metadata = { rides: { key, partId, finish, index } };
    return mesh;
  }

  function build(key: string, profile: FlatRideProfile, rides: RidePlacement[]): Batch {
    const layout = rigLayout(profile.rig);
    const parts: PartBatch[] = [];
    layout.parts.forEach((entry, index) => {
      const shape = buildShape(entry.spec.shape, entry.spec.params ?? {});
      if (!shape.surfaces.length) return;
      const meshes: Mesh[] = [];
      let tris = 0;
      for (const surface of shape.surfaces) {
        const mesh = meshFor(key, entry.spec.id, surface.finish, shape, index);
        if (mesh) meshes.push(mesh);
        tris += surface.indices.length / 3;
      }
      if (!meshes.length) return;
      parts.push({
        partId: entry.spec.id,
        units: entry.units,
        matrices: new Float32Array(Math.max(1, rides.length) * entry.units * 16),
        meshes,
        trianglesPerUnit: tris,
      });
    });
    const batch: Batch = { key, profile, layout, rides, parts, pose: [] };
    resize(batch);
    return batch;
  }

  function resize(batch: Batch): void {
    for (const part of batch.parts) {
      const want = Math.max(1, batch.rides.length) * part.units * 16;
      if (part.matrices.length !== want) part.matrices = new Float32Array(want);
      for (const mesh of part.meshes) {
        mesh.thinInstanceSetBuffer('matrix', part.matrices, 16, false);
        mesh.thinInstanceCount = batch.rides.length * part.units;
      }
    }
  }

  function disposeBatch(batch: Batch): void {
    for (const part of batch.parts) for (const mesh of part.meshes) mesh.dispose(false, false);
    batch.parts.length = 0;
  }

  function setPlacements(
    list: RidePlacement[],
    profileOf: (key: string) => FlatRideProfile | null
  ): void {
    const t0 = performance.now();
    const byKey = new Map<string, RidePlacement[]>();
    for (const p of list) {
      const arr = byKey.get(p.key);
      if (arr) arr.push(p);
      else byKey.set(p.key, [p]);
    }
    for (const [key, batch] of [...batches]) {
      if (!byKey.has(key)) {
        disposeBatch(batch);
        batches.delete(key);
      }
    }
    for (const [key, rides] of byKey) {
      const existing = batches.get(key);
      if (existing) {
        existing.rides = rides;
        resize(existing);
        continue;
      }
      const profile = profileOf(key);
      if (!profile) continue;
      batches.set(key, build(key, profile, rides));
    }
    buildMs = performance.now() - t0;
    refreshFrames = 6;
  }

  /**
   * `spin` wraps at 1024. Interpolating across the wrap would unwind a thousand nominal runs in one
   * frame; the same guard `trains/blocks.ts` calls `wrapS`.
   */
  function lerpSpin(a: number, b: number, alpha: number): number {
    let d = b - a;
    if (d < -512) d += 1024;
    else if (d > 512) d -= 1024;
    return a + d * alpha;
  }

  function update(
    frame: SimFrame | null,
    previous: SimFrame | null,
    alpha: number,
    roster: string[]
  ): void {
    const now = frame?.buffers['rides.motion'];
    const before = previous?.buffers['rides.motion'];
    const motion = now ? new Float32Array(now) : null;
    const prior = before && before.byteLength === now?.byteLength ? new Float32Array(before) : null;
    interpolated = prior != null;
    const index = new Map<string, number>();
    roster.forEach((id, i) => index.set(id, i));

    for (const batch of batches.values()) {
      batch.rides.forEach((ride, k) => {
        const at = index.get(ride.id);
        let spin = 0;
        let drive = 0;
        if (motion && at != null && at * MOTION_STRIDE + 1 < motion.length) {
          const b = motion[at * MOTION_STRIDE];
          const dNow = motion[at * MOTION_STRIDE + 1];
          if (prior) {
            const a = prior[at * MOTION_STRIDE];
            spin = lerpSpin(a, b, alpha);
            drive = prior[at * MOTION_STRIDE + 1] + (dNow - prior[at * MOTION_STRIDE + 1]) * alpha;
          } else {
            spin = b;
            drive = dNow;
          }
        }
        const runSeconds = Math.max(4, batch.profile.cycleMinutes * batch.profile.split.run * 60);
        const pose = poseRig(
          batch.profile.rig,
          { spin, drive, driveRate: 0, runSeconds },
          batch.pose,
          batch.layout
        );
        Quaternion.FromEulerAnglesToRef(0, ride.yaw, 0, tmpQuat);
        tmpPos.set(ride.position[0], ride.position[1], ride.position[2]);
        const s = ride.scale || 1;
        Matrix.ComposeToRef(new Vector3(s, s, s), tmpQuat, tmpPos, rideMatrix);

        let cursor = 0;
        for (const part of batch.parts) {
          for (let u = 0; u < part.units; u++) {
            const unit = pose[cursor + u];
            if (!unit) continue;
            tmpQuat.set(unit.quat[0], unit.quat[1], unit.quat[2], unit.quat[3]);
            tmpPos.set(unit.position[0], unit.position[1], unit.position[2]);
            Matrix.ComposeToRef(one, tmpQuat, tmpPos, unitMatrix);
            unitMatrix.multiplyToRef(rideMatrix, outMatrix);
            outMatrix.copyToArray(part.matrices, (k * part.units + u) * 16);
          }
          cursor += part.units;
        }
      });
      for (const part of batch.parts) {
        for (const mesh of part.meshes) {
          mesh.thinInstanceCount = batch.rides.length * part.units;
          mesh.thinInstanceBufferUpdated('matrix');
          if (refreshFrames > 0) mesh.thinInstanceRefreshBoundingInfo(true);
        }
      }
    }
    if (refreshFrames > 0) refreshFrames -= 1;
  }

  return {
    setPlacements,
    update,
    meshes() {
      const out: Mesh[] = [];
      for (const batch of batches.values())
        for (const part of batch.parts) out.push(...part.meshes);
      return out;
    },
    shadowMeshes() {
      /**
       * Every part casts EXCEPT the hard standing.
       *
       * A carousel with a shadow under its canopy and none from its horses reads as a photograph
       * with an object missing from it — but the apron is a 0.14 m slab lying on the ground, and a
       * caster that thin at that height shadows itself: in `.game-render/rides-3/1200-close.png`
       * every ride sat on a pure BLACK disc, which is shadow acne and not paving. It receives
       * shadows and casts none, which is what a slab on grade does anyway.
       */
      const out: Mesh[] = [];
      for (const batch of batches.values())
        for (const part of batch.parts) if (part.partId !== 'apron') out.push(...part.meshes);
      return out;
    },
    stats() {
      let meshes = 0;
      let instances = 0;
      let triangles = 0;
      for (const batch of batches.values()) {
        for (const part of batch.parts) {
          meshes += part.meshes.length;
          instances += batch.rides.length * part.units;
          triangles += part.trianglesPerUnit * batch.rides.length * part.units;
        }
      }
      return {
        batches: batches.size,
        meshes,
        drawCalls: meshes,
        instances,
        triangles,
        buildMs,
        interpolated,
      };
    },
    dispose() {
      for (const batch of batches.values()) disposeBatch(batch);
      batches.clear();
    },
  };
}
