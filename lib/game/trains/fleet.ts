/**
 * The fleet on screen: four thin-instanced meshes per train style, however many trains there are.
 *
 * **Interpolation is the whole reason this file exists.** The sim runs at 20 Hz and a train does
 * 30 m/s, so a car snapped to tick positions jumps 1.5 m at a time — at 60 fps that is three
 * rendered frames of a car standing still followed by one where it teleports, and it reads as a
 * strobe rather than as a fast train. The worker sends a position and a quaternion per car; this
 * lerps the position and **slerps** the quaternion between the last two frames by
 * `alpha = (now − frame.t) / TICK_MS`, which core computes and hands to `onFrame`. Slerp and not a
 * component lerp: a car through a loop turns 20° in a tick, and a normalised component lerp across
 * that shortens the arc enough to read as a stutter at the crown — the one place a rider is looking
 * at the horizon.
 *
 * **Four meshes per style, not four per car.** A seven-car train is 7 shell instances, 7 running
 * gear, 7 interiors, 7 trims and 1 nose — 5 draw calls, the same 5 a one-car train costs. The
 * matrices are composed by hand into the instance buffer rather than through `Matrix.Compose`,
 * because a quaternion-to-basis is fifteen multiplies written out and this runs once per car per
 * rendered frame.
 *
 * **Only the shell, the trim and the nose survive distance.** `running` (twelve wheels a car) and
 * `interior` (the seats and the restraints) carry an `addLODLevel(d, null)`, which is Babylon's own
 * mechanism and costs nothing per frame — the same call `track/main.ts` puts on its crossties. At
 * 90 m an 8.5 cm guide wheel is a fifth of a pixel; the silhouette of a train is its shell.
 */

import '@babylonjs/core/Meshes/thinInstanceMesh';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';
import type { QualitySettings, SimFrame } from '../core/types';
import {
  buildInterior,
  buildNose,
  buildRunningGear,
  buildShell,
  buildTrim,
  surfaceTriangles,
  toMesh,
  type CarMetrics,
} from './geometry';
import type { TrainMaterials } from './materials';
import type { RosterCar, TrainProfile } from './types';

/** Where the running gear and the interior stop being individually visible, per preset. */
const DETAIL_LOD = { low: 45, medium: 80, high: 130, ultra: 190 } as const;
/** Nothing is culled inside this, whatever a preset's LOD numbers say. */
const SHELL_LOD = { low: 400, medium: 700, high: 1000, ultra: 1400 } as const;

export interface FleetStats {
  /** Cars the worker last sent. */
  cars: number;
  trains: number;
  styles: number;
  meshes: number;
  /** Meshes with at least one instance — the draw calls this module costs. */
  drawCalls: number;
  triangles: number;
  /** Triangles one car costs at full detail. */
  perCar: number;
  shadowCasters: number;
  buildMs: number;
  textureMs: number;
  /** True when the last frame was drawn between two sim frames rather than snapped to one. */
  interpolated: boolean;
}

export interface FleetRenderer {
  meshes(): Mesh[];
  shadowMeshes(): Mesh[];
  /** Hand over the car list the worker publishes. Rebuilds the mesh sets when the styles change. */
  setRoster(cars: RosterCar[], profiles: TrainProfile[], metrics: (key: string) => CarMetrics): void;
  update(frame: SimFrame, previous: SimFrame | null, alpha: number): void;
  /** World position and heading of one train's leading car, interpolated. Null when unknown. */
  leadPose(rideId: string, train: number): { position: [number, number, number]; heading: number } | null;
  stats(): FleetStats;
  dispose(): void;
}

interface Part {
  mesh: Mesh;
  triangles: number;
  matrices: Float32Array;
  capacity: number;
  count: number;
}

interface StyleSet {
  key: string;
  parts: Part[];
  /** Everything drawn once per car. */
  perCar: Part[];
  /** The nose, drawn once per train. */
  nose: Part | null;
  perCarTriangles: number;
}

export interface FleetOptions {
  scene: Scene;
  materials: TrainMaterials;
  quality: QualitySettings;
}

export function createFleetRenderer(options: FleetOptions): FleetRenderer {
  const { scene, materials, quality } = options;
  const detailLod = DETAIL_LOD[quality.preset] ?? 80;
  const shellLod = SHELL_LOD[quality.preset] ?? 700;
  const styles = new Map<string, StyleSet>();
  let roster: RosterCar[] = [];
  /** Index of the first car of each train in the roster, keyed `rideId#train`. */
  const leadIndex = new Map<string, number>();
  const pose = { p: new Float32Array(3), q: new Float32Array(4) };
  let buildMs = 0;
  const stats: FleetStats = {
    cars: 0,
    trains: 0,
    styles: 0,
    meshes: 0,
    drawCalls: 0,
    triangles: 0,
    perCar: 0,
    shadowCasters: 0,
    buildMs: 0,
    textureMs: materials.textureMs,
    interpolated: false,
  };
  /** Last written world matrix of each train's leading car, for the camera follow source. */
  const leadMatrix = new Map<string, Float32Array>();

  function part(name: string, mesh: Mesh, triangles: number, capacity: number): Part {
    const matrices = new Float32Array(Math.max(1, capacity) * 16);
    // Updatable (`staticBuffer = false`): a static buffer silently ignores every later write, and
    // these are rewritten every frame.
    mesh.thinInstanceSetBuffer('matrix', matrices, 16, false);
    mesh.thinInstanceCount = 0;
    return { mesh, triangles, matrices, capacity: Math.max(1, capacity), count: 0 };
  }

  function disposeStyle(set: StyleSet): void {
    for (const p of set.parts) p.mesh.dispose(false, false);
  }

  function buildStyle(profile: TrainProfile, m: CarMetrics, cars: number, trains: number): StyleSet {
    const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
    const shellSurface = buildShell(m);
    const trimSurface = buildTrim(m);
    const runningSurface = buildRunningGear(m);
    const interiorSurface = buildInterior(m, profile);
    const noseSurface = buildNose(m, profile);

    const shell = part(
      'shell',
      toMesh(scene, `trains:${profile.key}:shell`, shellSurface, materials.paint(profile.livery.body)),
      surfaceTriangles(shellSurface),
      cars
    );
    const trim = part(
      'trim',
      toMesh(scene, `trains:${profile.key}:trim`, trimSurface, materials.metal(profile.livery.trim)),
      surfaceTriangles(trimSurface),
      cars
    );
    const running = part(
      'running',
      toMesh(
        scene,
        `trains:${profile.key}:running`,
        runningSurface,
        materials.metal(profile.livery.chassis)
      ),
      surfaceTriangles(runningSurface),
      cars
    );
    const interior = part(
      'interior',
      toMesh(
        scene,
        `trains:${profile.key}:interior`,
        interiorSurface,
        materials.cloth(profile.livery.seat)
      ),
      surfaceTriangles(interiorSurface),
      cars
    );
    const nose = part(
      'nose',
      toMesh(scene, `trains:${profile.key}:nose`, noseSurface, materials.paint(profile.livery.body)),
      surfaceTriangles(noseSurface),
      trains
    );
    running.mesh.addLODLevel(detailLod, null);
    interior.mesh.addLODLevel(detailLod, null);
    shell.mesh.addLODLevel(shellLod, null);
    trim.mesh.addLODLevel(detailLod * 2.2, null);
    nose.mesh.addLODLevel(shellLod, null);
    buildMs += (typeof performance !== 'undefined' ? performance.now() : 0) - t0;
    return {
      key: profile.key,
      parts: [shell, trim, running, interior, nose],
      perCar: [shell, trim, running, interior],
      nose,
      perCarTriangles:
        shell.triangles + trim.triangles + running.triangles + interior.triangles,
    };
  }

  function setRoster(
    cars: RosterCar[],
    profiles: TrainProfile[],
    metrics: (key: string) => CarMetrics
  ): void {
    roster = cars;
    leadIndex.clear();
    leadMatrix.clear();
    const carsPerStyle = new Map<string, number>();
    const trainsPerStyle = new Map<string, number>();
    const trains = new Set<string>();
    for (let i = 0; i < cars.length; i++) {
      const c = cars[i];
      carsPerStyle.set(c.profile, (carsPerStyle.get(c.profile) ?? 0) + 1);
      const trainKey = `${c.rideId}#${c.train}`;
      if (!trains.has(trainKey)) {
        trains.add(trainKey);
        trainsPerStyle.set(c.profile, (trainsPerStyle.get(c.profile) ?? 0) + 1);
      }
      if (c.car === 0) leadIndex.set(trainKey, i);
    }

    const byKey = new Map(profiles.map((p) => [p.key, p]));
    // Drop the styles nobody uses any more, then build or resize the ones that are needed. A
    // resize is a rebuild: a thin-instance buffer's length is fixed once it is set.
    for (const [key, set] of [...styles]) {
      const wanted = carsPerStyle.get(key) ?? 0;
      const capacity = set.perCar[0]?.capacity ?? 0;
      if (wanted === 0 || wanted > capacity) {
        disposeStyle(set);
        styles.delete(key);
      }
    }
    for (const [key, count] of carsPerStyle) {
      if (styles.has(key)) continue;
      const profile = byKey.get(key);
      if (!profile) continue;
      styles.set(key, buildStyle(profile, metrics(key), count, trainsPerStyle.get(key) ?? 1));
    }

    stats.cars = cars.length;
    stats.trains = trains.size;
    stats.styles = styles.size;
    stats.meshes = [...styles.values()].reduce((n, s) => n + s.parts.length, 0);
    stats.perCar = [...styles.values()].reduce((n, s) => Math.max(n, s.perCarTriangles), 0);
    stats.buildMs = Math.round(buildMs);
  }

  function hideAll(): void {
    for (const set of styles.values()) {
      for (const p of set.parts) {
        p.count = 0;
        p.mesh.thinInstanceCount = 0;
        p.mesh.isVisible = false;
      }
    }
    stats.drawCalls = 0;
    stats.triangles = 0;
  }

  /**
   * A world matrix from a position and a quaternion, written straight into the instance buffer in
   * Babylon's column-major order (translation at 12, 13, 14 — the same layout `guests/crowd.ts`
   * writes by hand, and the reason neither module allocates a `Matrix`).
   */
  function writeMatrix(out: Float32Array, at: number, p: Float32Array, q: Float32Array): void {
    const x = q[0];
    const y = q[1];
    const z = q[2];
    const w = q[3];
    const x2 = x + x;
    const y2 = y + y;
    const z2 = z + z;
    const xx = x * x2;
    const xy = x * y2;
    const xz = x * z2;
    const yy = y * y2;
    const yz = y * z2;
    const zz = z * z2;
    const wx = w * x2;
    const wy = w * y2;
    const wz = w * z2;
    out[at] = 1 - (yy + zz);
    out[at + 1] = xy + wz;
    out[at + 2] = xz - wy;
    out[at + 3] = 0;
    out[at + 4] = xy - wz;
    out[at + 5] = 1 - (xx + zz);
    out[at + 6] = yz + wx;
    out[at + 7] = 0;
    out[at + 8] = xz + wy;
    out[at + 9] = yz - wx;
    out[at + 10] = 1 - (xx + yy);
    out[at + 11] = 0;
    out[at + 12] = p[0];
    out[at + 13] = p[1];
    out[at + 14] = p[2];
    out[at + 15] = 1;
  }

  function slerp(
    out: Float32Array,
    a: Float32Array,
    ai: number,
    b: Float32Array,
    bi: number,
    t: number
  ): void {
    let ax = a[ai];
    let ay = a[ai + 1];
    let az = a[ai + 2];
    let aw = a[ai + 3];
    const bx = b[bi];
    const by = b[bi + 1];
    const bz = b[bi + 2];
    const bw = b[bi + 3];
    let dot = ax * bx + ay * by + az * bz + aw * bw;
    // Two quaternions a rotation apart may be on opposite hemispheres of the same rotation; taking
    // the short way round is what stops a car spinning the long way through a roll.
    if (dot < 0) {
      ax = -ax;
      ay = -ay;
      az = -az;
      aw = -aw;
      dot = -dot;
    }
    let s0 = 1 - t;
    let s1 = t;
    if (dot < 0.9995) {
      const theta = Math.acos(Math.min(1, dot));
      const sin = Math.sin(theta);
      if (sin > 1e-6) {
        s0 = Math.sin((1 - t) * theta) / sin;
        s1 = Math.sin(t * theta) / sin;
      }
    }
    const nx = ax * s0 + bx * s1;
    const ny = ay * s0 + by * s1;
    const nz = az * s0 + bz * s1;
    const nw = aw * s0 + bw * s1;
    const len = Math.hypot(nx, ny, nz, nw) || 1;
    out[0] = nx / len;
    out[1] = ny / len;
    out[2] = nz / len;
    out[3] = nw / len;
  }

  function update(frame: SimFrame, previous: SimFrame | null, alpha: number): void {
    const buffer = frame.buffers['trains.transform'];
    if (!buffer || roster.length === 0) {
      hideAll();
      return;
    }
    const cur = new Float32Array(buffer);
    const prevBuffer = previous?.buffers['trains.transform'];
    // Interpolate only when the previous frame describes the same roster — a length comparison,
    // because the car order is stable (`sim.ts` walks the rides in sorted id order).
    const canLerp =
      !!prevBuffer && prevBuffer.byteLength === buffer.byteLength && alpha > 0 && alpha < 1;
    const prev = canLerp ? new Float32Array(prevBuffer as ArrayBuffer) : null;
    stats.interpolated = canLerp;

    for (const set of styles.values()) {
      for (const p of set.parts) p.count = 0;
    }

    const n = Math.min(roster.length, Math.floor(cur.length / 7));
    let triangles = 0;
    for (let i = 0; i < n; i++) {
      const car = roster[i];
      const set = styles.get(car.profile);
      if (!set) continue;
      const at = i * 7;
      if (prev) {
        const inv = 1 - alpha;
        pose.p[0] = prev[at] * inv + cur[at] * alpha;
        pose.p[1] = prev[at + 1] * inv + cur[at + 1] * alpha;
        pose.p[2] = prev[at + 2] * inv + cur[at + 2] * alpha;
        slerp(pose.q, prev, at + 3, cur, at + 3, alpha);
      } else {
        pose.p[0] = cur[at];
        pose.p[1] = cur[at + 1];
        pose.p[2] = cur[at + 2];
        pose.q[0] = cur[at + 3];
        pose.q[1] = cur[at + 4];
        pose.q[2] = cur[at + 5];
        pose.q[3] = cur[at + 6];
      }
      for (const p of set.perCar) {
        if (p.count >= p.capacity) continue;
        writeMatrix(p.matrices, p.count * 16, pose.p, pose.q);
        p.count += 1;
      }
      if (car.car === 0 && set.nose && set.nose.count < set.nose.capacity) {
        writeMatrix(set.nose.matrices, set.nose.count * 16, pose.p, pose.q);
        set.nose.count += 1;
      }
      if (car.car === 0) {
        const key = `${car.rideId}#${car.train}`;
        let slot = leadMatrix.get(key);
        if (!slot) {
          slot = new Float32Array(16);
          leadMatrix.set(key, slot);
        }
        writeMatrix(slot, 0, pose.p, pose.q);
      }
      triangles += set.perCarTriangles + (car.car === 0 ? (set.nose?.triangles ?? 0) : 0);
    }

    let calls = 0;
    for (const set of styles.values()) {
      for (const p of set.parts) {
        p.mesh.thinInstanceCount = p.count;
        p.mesh.isVisible = p.count > 0;
        if (p.count === 0) continue;
        // Partial: `thinInstanceBufferUpdated` re-sends the WHOLE buffer whether four instances are
        // in use or four hundred.
        p.mesh.thinInstancePartialBufferUpdate('matrix', p.count, 0);
        calls += 1;
      }
    }
    stats.drawCalls = calls;
    stats.triangles = triangles;
    stats.cars = n;
  }

  return {
    meshes: () => [...styles.values()].flatMap((s) => s.parts.map((p) => p.mesh)),
    shadowMeshes() {
      // The shell, the trim and the nose. The running gear and the interior are inside the shell's
      // own silhouette from any angle a shadow map cares about, and a cascade is a full re-render
      // of everything in it.
      const out: Mesh[] = [];
      for (const set of styles.values()) {
        out.push(set.parts[0].mesh, set.parts[1].mesh);
        if (set.nose) out.push(set.nose.mesh);
      }
      return out;
    },
    setRoster,
    update,
    leadPose(rideId, train) {
      const m = leadMatrix.get(`${rideId}#${train}`);
      if (!m) return null;
      // The third column is the car's forward axis. `heading` follows the convention the camera's
      // own follow sources use — `atan2(forward.z, forward.x)` — because `FollowOptions.behind`
      // adds π to it and a different convention would put the camera in front of the train.
      return {
        position: [m[12], m[13], m[14]],
        heading: Math.atan2(m[10], m[8]),
      };
    },
    stats: () => ({ ...stats }),
    dispose() {
      for (const set of styles.values()) disposeStyle(set);
      styles.clear();
      roster = [];
      leadIndex.clear();
      leadMatrix.clear();
    },
  };
}
