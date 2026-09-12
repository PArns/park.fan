/**
 * Thin-instance batching with LOD. This is the file the draw-call budget lives or dies in.
 *
 * One batch per catalogue key. Inside it, one mesh per (LOD level × variant × material part), and
 * every copy of that prop in the park is a 4×4 matrix in that mesh's instance buffer. A stand of
 * ninety oaks is two draw calls, not ninety, and the same two whether it is nine or nine hundred.
 *
 * **Variants exist only where they can be seen.** Two builds of a species at LOD 0, one at LOD 1
 * and 2 — an instance picks its variant from a hash of its own id, so a copse is not one tree
 * stamped nine times, and the far levels do not pay for a difference nobody can resolve at 120 m.
 *
 * **The instance buffers are created updatable.** `thinInstanceSetBuffer(kind, data, stride,
 * staticBuffer)` with `staticBuffer = true` creates a non-updatable vertex buffer, and a later
 * write to it is silently ignored — no error, no change, a frame identical to the one before. The
 * LOD rebucket rewrites these every few hundred milliseconds, so they are created with `false`.
 *
 * **Rebucketing is throttled and camera-gated.** Distances are recomputed every
 * `REBUCKET_INTERVAL` seconds, and only when the camera has actually moved: a park nobody is
 * flying over costs one vector subtraction per frame.
 */

import '@babylonjs/core/Meshes/thinInstanceMesh';
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';
import type { PropSpec } from './catalog';
import { toMesh, type Surface } from './geometry';
import type { MaterialLibrary } from './materials';
import type { BuildContext, PropBuild } from './gen-foliage';
import { generatorFor } from './generators';

/** Seconds between LOD passes. Three a second is under the eye's threshold for a pop at 40 m. */
const REBUCKET_INTERVAL = 0.33;
/** Metres the camera must move before a pass is worth doing at all. */
const REBUCKET_DISTANCE = 6;
/** A jump this far is a cut, not a pan: rebucket on the spot rather than waiting out the throttle. */
const REBUCKET_TELEPORT = 25;

export interface Instance {
  /** Entity id, or `~<n>` for a piece of ambient dressing. */
  id: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  scale: number;
  /** Small lean, radians; foliage only. */
  tiltX: number;
  tiltZ: number;
  variantSeed: number;
}

interface Level {
  lod: 0 | 1 | 2;
  variants: VariantMeshes[];
  /** Instances at or beyond this distance belong to the next level. */
  maxDistance: number;
}

interface VariantMeshes {
  meshes: Mesh[];
  matrices: Float32Array;
  count: number;
  capacity: number;
  triangles: number;
}

export interface BatchStats {
  key: string;
  instances: number;
  meshes: number;
  drawn: number;
  triangles: number;
}

export interface Batch {
  spec: PropSpec;
  instances: Instance[];
  add(instance: Instance): void;
  remove(id: string): boolean;
  clear(): void;
  /** Rewrite the instance buffers for a camera position. */
  refresh(camera: Vector3): void;
  meshes(): Mesh[];
  stats(): BatchStats;
  dispose(): void;
}

const scratchMatrix = new Matrix();
const scratchQuat = new Quaternion();
const scratchScale = new Vector3(1, 1, 1);
const scratchPos = new Vector3();

export interface BatchOptions {
  scene: Scene;
  materials: MaterialLibrary;
  spec: PropSpec;
  /** Seed for the variant builds; two batches of one species in one park look the same. */
  seed: number;
  /** `low` builds one variant and skips LOD 0 detail. */
  variantCount: number;
  /** Scales every LOD distance; the quality preset's foliage setting. */
  lodScale: number;
  /** Called once when the spec's generator was a fallback, so `main` can warn exactly once. */
  onFallback?: (spec: PropSpec) => void;
}

function surfaceFor(
  build: PropBuild,
  materials: MaterialLibrary
): Array<{ surface: Surface; material: Parameters<typeof toMesh>[3]; name: string }> {
  const out: Array<{ surface: Surface; material: Parameters<typeof toMesh>[3]; name: string }> = [];
  for (const p of build.parts) {
    if (p.surface.indices.length === 0) continue;
    const material =
      p.material === 'emissive'
        ? materials.emissive(p.emissiveColor ?? '#ffd9a0')
        : materials[p.material];
    out.push({ surface: p.surface, material, name: p.material });
  }
  return out;
}

/** What `createBatch` actually returns: the batch plus the per-prop answers `main.ts` needs. */
export interface BatchHandle extends Batch {
  /** Radius of the prop's contact decal, from its LOD 0 build. 0 draws none. */
  contactRadius(): number;
  /** Where the prop's night light hangs, local metres. */
  lightOffset(): [number, number, number];
  /** True when a rebucket is worth running for this camera. */
  needsRefresh(camera: Vector3, dt: number): boolean;
  markRefreshed(camera: Vector3): void;
}

/**
 * Where a level ends.
 *
 * The pack's `lod: [40, 120, 300]` are switch distances, and the last one is NOT a cull distance —
 * reading it as one culled every tree in the park from the `overview` preset, which sits 340 m out,
 * and the shot came back as an empty green field with a path drawn on it. A thing disappears when
 * its screen size drops below a pixel or two, so the last level runs to whichever is further: the
 * manifest's number, or 55 × the prop's own height. That only ever extends the range for something
 * tall — a 0.8 m grass tuft's 44 m loses to its declared 110 m and the ground cover still stops
 * where it should.
 */
function distanceFor(spec: PropSpec, lod: 0 | 1 | 2, isFoliage: boolean): number {
  if (isFoliage && lod < 2) return spec.lod[lod];
  return Math.max(spec.lod[2], spec.height * 55);
}

export function createBatch(options: BatchOptions): BatchHandle {
  const { scene, materials, spec } = options;
  const generator = generatorFor(spec.generator);
  if (spec.fallback) options.onFallback?.(spec);

  const isFoliage = spec.cls === 'foliage';
  const levels: Level[] = [];
  const lods: Array<0 | 1 | 2> = isFoliage ? [0, 1, 2] : [0];
  let contactRadius = 0;
  let lightOffset: [number, number, number] = [0, spec.height, 0];

  for (const lod of lods) {
    // Variants only where a viewer could tell: two builds of a species up close, one at the far
    // levels — and one for anything manufactured, because two benches off the same drawing are
    // meant to be identical and a second variant would be two draw calls for nothing.
    const variantCount = lod === 0 && isFoliage ? Math.max(1, options.variantCount) : 1;
    const variants: VariantMeshes[] = [];
    for (let v = 0; v < variantCount; v++) {
      const ctx: BuildContext = {
        spec,
        lod,
        seed: (options.seed + v * 7919 + lod * 104729) >>> 0,
        night: spec.night,
      };
      let build: PropBuild;
      try {
        build = generator(ctx);
      } catch (error) {
        console.warn(`[game/scenery] generator "${spec.generator}" failed for ${spec.key}`, error);
        build = { parts: [], contactRadius: 0, lightOffset: [0, spec.height, 0] };
      }
      if (lod === 0 && v === 0) {
        contactRadius = build.contactRadius;
        lightOffset = build.lightOffset;
      }
      const meshes: Mesh[] = [];
      let triangles = 0;
      for (const piece of surfaceFor(build, materials)) {
        const mesh = toMesh(
          scene,
          `scenery:${spec.key}:l${lod}v${v}:${piece.name}`,
          piece.surface,
          piece.material
        );
        triangles += piece.surface.indices.length / 3;
        mesh.isVisible = false;
        mesh.thinInstanceCount = 0;
        // The mesh itself never moves; only its instance buffer does.
        mesh.freezeWorldMatrix();
        mesh.doNotSyncBoundingInfo = false;
        meshes.push(mesh);
      }
      variants.push({ meshes, matrices: new Float32Array(0), count: 0, capacity: 0, triangles });
    }
    levels.push({
      lod,
      variants,
      maxDistance: distanceFor(spec, lod, isFoliage) * options.lodScale,
    });
  }

  const instances: Instance[] = [];
  const byId = new Map<string, number>();
  let lastCamera: Vector3 | null = null;
  let sinceRefresh = REBUCKET_INTERVAL;
  let dirty = true;

  function ensureCapacity(variant: VariantMeshes, needed: number): void {
    if (variant.capacity >= needed) return;
    const capacity = Math.max(16, needed * 2);
    variant.matrices = new Float32Array(capacity * 16);
    variant.capacity = capacity;
    for (const mesh of variant.meshes) {
      // Updatable (`staticBuffer = false`): the next rebucket writes straight into this array.
      mesh.thinInstanceSetBuffer('matrix', variant.matrices, 16, false);
    }
  }

  function write(variant: VariantMeshes, instance: Instance): void {
    const offset = variant.count * 16;
    Quaternion.RotationYawPitchRollToRef(instance.yaw, instance.tiltX, instance.tiltZ, scratchQuat);
    scratchScale.set(instance.scale, instance.scale, instance.scale);
    scratchPos.set(instance.x, instance.y, instance.z);
    Matrix.ComposeToRef(scratchScale, scratchQuat, scratchPos, scratchMatrix);
    scratchMatrix.copyToArray(variant.matrices, offset);
    variant.count += 1;
  }

  const batch: Batch = {
    spec,
    instances,
    add(instance) {
      const existing = byId.get(instance.id);
      if (existing != null) instances[existing] = instance;
      else {
        byId.set(instance.id, instances.length);
        instances.push(instance);
      }
      dirty = true;
    },
    remove(id) {
      const at = byId.get(id);
      if (at == null) return false;
      const last = instances.length - 1;
      if (at !== last) {
        instances[at] = instances[last];
        byId.set(instances[at].id, at);
      }
      instances.pop();
      byId.delete(id);
      dirty = true;
      return true;
    },
    clear() {
      instances.length = 0;
      byId.clear();
      dirty = true;
    },
    refresh(camera) {
      for (const level of levels) {
        for (const variant of level.variants) variant.count = 0;
      }
      // Capacity first, in one pass, so a buffer is never grown mid-write.
      const counts = new Map<VariantMeshes, number>();
      const chosen: Array<VariantMeshes | null> = new Array(instances.length);
      for (let i = 0; i < instances.length; i++) {
        const instance = instances[i];
        const dx = instance.x - camera.x;
        const dy = instance.y - camera.y;
        const dz = instance.z - camera.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        let target: Level | null = null;
        for (const level of levels) {
          if (distance <= level.maxDistance) {
            target = level;
            break;
          }
        }
        if (!target) {
          chosen[i] = null;
          continue;
        }
        const variant =
          target.variants[
            target.variants.length === 1 ? 0 : instance.variantSeed % target.variants.length
          ];
        chosen[i] = variant;
        counts.set(variant, (counts.get(variant) ?? 0) + 1);
      }
      for (const [variant, needed] of counts) ensureCapacity(variant, needed);
      for (let i = 0; i < instances.length; i++) {
        const variant = chosen[i];
        if (variant) write(variant, instances[i]);
      }
      for (const level of levels) {
        for (const variant of level.variants) {
          for (const mesh of variant.meshes) {
            mesh.thinInstanceCount = variant.count;
            mesh.isVisible = variant.count > 0;
            if (variant.count > 0) {
              mesh.thinInstanceBufferUpdated('matrix');
              mesh.thinInstanceRefreshBoundingInfo(false);
            }
          }
        }
      }
      dirty = false;
    },
    meshes() {
      const out: Mesh[] = [];
      for (const level of levels) {
        for (const variant of level.variants) out.push(...variant.meshes);
      }
      return out;
    },
    stats() {
      let meshes = 0;
      let drawn = 0;
      let triangles = 0;
      for (const level of levels) {
        for (const variant of level.variants) {
          meshes += variant.meshes.length;
          if (variant.count > 0) {
            drawn += variant.meshes.length;
            triangles += variant.triangles * variant.count;
          }
        }
      }
      return { key: spec.key, instances: instances.length, meshes, drawn, triangles };
    },
    dispose() {
      for (const level of levels) {
        for (const variant of level.variants) {
          for (const mesh of variant.meshes) mesh.dispose(false, false);
          variant.meshes.length = 0;
        }
      }
      instances.length = 0;
      byId.clear();
    },
  };

  /** The generator's answers about the prop as a whole, for the contact decal and the night rig. */
  const extra = {
    contactRadius: () => contactRadius,
    lightOffset: () => lightOffset,
    /** True when a refresh is worth running for this camera. */
    needsRefresh(camera: Vector3, dt: number): boolean {
      sinceRefresh += dt;
      if (dirty || !lastCamera) return true;
      const moved = Vector3.Distance(lastCamera, camera);
      // A camera CUT skips the throttle. The time gate is there so a slow pan does not rebucket
      // every frame, and it quietly became a correctness bug in the screenshot harness: under
      // SwiftShader the render loop runs at about 1 fps with `dt` clamped to 0.1 s, so a third of
      // a second of accumulated time takes four seconds of wall clock — every preset after the
      // first was photographed with the previous preset's LOD buckets still in the buffers, and
      // the `close` shot came back with 299 instances where the same frame should hold 3 000.
      if (moved > REBUCKET_TELEPORT) return true;
      if (sinceRefresh < REBUCKET_INTERVAL) return false;
      return moved > REBUCKET_DISTANCE;
    },
    markRefreshed(camera: Vector3): void {
      sinceRefresh = 0;
      lastCamera = camera.clone();
    },
  };
  return Object.assign(batch, extra);
}
