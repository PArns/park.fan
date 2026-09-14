/**
 * Camera maths. Pure functions over plain numbers — no Babylon, no DOM — so `selftest.mjs` can
 * check the parts that are easy to get silently wrong: the sign of a pan, the stability of a
 * pivot, and the angle arithmetic the `overview` preset was wrong about twice.
 *
 * The one convention everything rests on is Babylon's own, read out of
 * `node_modules/@babylonjs/core/Cameras/arcRotateCamera.pure.js` rather than remembered:
 *
 *   eye = target + radius * (cos a * sin b, cos b, sin a * sin b)
 *
 * From it: the eye is `radius * cos(beta)` above the target, the camera looks along
 * `-(cos a, 0, sin a)` in plan, and — the useful one — the screen-right direction is
 * `(sin a, 0, -cos a)`. That last one is `-cross(up, forward)`, which is what
 * `Matrix.LookAtRHToRef` builds its x axis from; getting its sign wrong inverts every drag in the
 * module and looks exactly like a working camera until somebody tries to use it.
 */

import type { Vec3 } from '../core/types';
import type { CameraBounds, CameraPose } from './types';

export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;

/**
 * The leash, and where each number comes from.
 *
 * The park is 512 m across (`world.terrain.size`), the drawn apron reaches ±1756 m (measured in
 * `docs/game/critiques/terrain-round1.md` §, `edge.surroundBB`), and the sky dome is a 900 m
 * sphere drawn AT the camera — `makeCelestial()` sets `infiniteDistance = true`, so it travels
 * with the eye and occludes everything past 900 m in every direction.
 *
 * That last fact decides the leash. From an eye `d` metres from the origin, the nearest apron rim
 * is `1756 - d` metres away along an axis (further along a diagonal, so the axis is the worst
 * case). The rim stays hidden behind the dome while `1756 - d >= 900`, i.e. `d <= 856`. So the
 * invariant is on the EYE, not on the target: `maxEyeRadius = 856`, and `radius` is clamped to
 * `856 - |target|` when the target is far out. `targetRadius = 400` is chosen so the park's own
 * corner (256, 256) — 362 m from the origin — is reachable with 38 m to spare, and
 * `400 + 480 = 880` is why the eye clamp has to exist as well as the target clamp rather than
 * instead of it.
 *
 * `betaMaxFar` is the other half of the same idea. Height above the ground is
 * `radius * cos(beta)`, so a far camera at a near-horizontal beta is a camera lying on the
 * ground looking across 500 m of park at the horizon — which is the one framing where the
 * terrain/sky seam the terrain critique measured (a 0.4257 → 0.2377 step over 6 px) fills the
 * middle of the frame. 74 degrees at 480 m keeps the eye 132 m up.
 */
export const DEFAULT_BOUNDS: CameraBounds = {
  targetRadius: 400,
  minRadius: 8,
  maxRadius: 480,
  maxEyeRadius: 856,
  betaMin: 6 * DEG,
  betaMaxNear: 88 * DEG,
  betaMaxFar: 74 * DEG,
  eyeClearance: 1.5,
  maxTargetLift: 60,
};

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Wrap to [−PI, PI). */
export function wrapPi(a: number): number {
  let x = (a + Math.PI) % TAU;
  if (x < 0) x += TAU;
  return x - Math.PI;
}

/**
 * Compass bearing (degrees clockwise from north = −Z) → Babylon's `alpha`.
 *
 * Derivation, so the next person does not have to redo it: the camera looks along
 * `-(cos a, 0, sin a)` and a bearing `B` looks along `(sin B, 0, -cos B)`, so `sin a = cos B` and
 * `cos a = -sin B`. The fallback `overview` at `alpha = -PI/3` is bearing 210 — the camera sits
 * north-north-east of the park and looks south-south-west down its axis, past the fountain
 * square to the gate.
 */
export function bearingToAlpha(bearingDeg: number): number {
  const b = bearingDeg * DEG;
  return Math.atan2(Math.cos(b), -Math.sin(b));
}

export function alphaToBearing(alpha: number): number {
  const deg = Math.atan2(-Math.cos(alpha), Math.sin(alpha)) / DEG;
  return ((deg % 360) + 360) % 360;
}

/** Degrees below the horizon → Babylon's `beta` (radians from +Y). */
export function pitchToBeta(pitchDeg: number): number {
  return (90 - pitchDeg) * DEG;
}

export function betaToPitch(beta: number): number {
  return 90 - beta / DEG;
}

/**
 * The screen row the horizon lands on, for a frame `height` px tall.
 *
 * This is the arithmetic that would have caught the `overview` bug in one line: a value at or
 * below 0 means no horizon and therefore no sky, and a frame with no horizon in it cannot be
 * evidence about a sky. It is reported in `stats()` for exactly that reason.
 */
export function horizonRow(pitchDeg: number, fov: number, height = 720): number {
  const half = Math.tan(fov / 2);
  if (half <= 0) return height / 2;
  return (height / 2) * (1 - Math.tan(pitchDeg * DEG) / half);
}

export function eyeOf(pose: CameraPose): Vec3 {
  const sb = Math.sin(pose.beta);
  return [
    pose.target[0] + pose.radius * Math.cos(pose.alpha) * sb,
    pose.target[1] + pose.radius * Math.cos(pose.beta),
    pose.target[2] + pose.radius * Math.sin(pose.alpha) * sb,
  ];
}

/** Unit vector from the eye towards the target. */
export function forwardOf(pose: CameraPose): Vec3 {
  const sb = Math.sin(pose.beta);
  return [-Math.cos(pose.alpha) * sb, -Math.cos(pose.beta), -Math.sin(pose.alpha) * sb];
}

/** Screen-right in world space, horizontal. */
export function rightOf(alpha: number): Vec3 {
  return [Math.sin(alpha), 0, -Math.cos(alpha)];
}

/** Screen-up projected onto the ground: the direction "away from the camera" in plan. */
export function planForwardOf(alpha: number): Vec3 {
  return [-Math.cos(alpha), 0, -Math.sin(alpha)];
}

/** Rebuild `alpha`/`beta`/`radius` from an eye and a target. */
export function poseFromEye(eye: Vec3, target: Vec3): CameraPose {
  const ox = eye[0] - target[0];
  const oy = eye[1] - target[1];
  const oz = eye[2] - target[2];
  const radius = Math.hypot(ox, oy, oz) || 1e-4;
  return {
    target: [target[0], target[1], target[2]],
    alpha: Math.atan2(oz, ox),
    beta: Math.acos(clamp(oy / radius, -1, 1)),
    radius,
  };
}

/** A pointer position in normalised device coordinates: x ∈ [−1, 1] right, y ∈ [−1, 1] up. */
export interface Ndc {
  x: number;
  y: number;
}

export interface Ray {
  origin: Vec3;
  direction: Vec3;
}

/**
 * The ray through a screen point, built from the camera basis rather than from Babylon.
 *
 * `camera.getForwardRay()` and `scene.createPickingRay()` are both banned by
 * `scripts/test-game-lint.mjs` unless `@babylonjs/core/Culling/ray` is imported — a real trap
 * (`environment/lighting.ts` shipped thirteen console errors a second on it) and one this module
 * has no reason to walk into: the basis is three lines of trigonometry it already needs for
 * panning, `fov` is vertical (Babylon's `FOVMODE_VERTICAL_FIXED` default), and doing it here
 * keeps the whole picking path pure and testable.
 */
export function screenRay(pose: CameraPose, ndc: Ndc, fov: number, aspect: number): Ray {
  const eye = eyeOf(pose);
  const f = forwardOf(pose);
  const r = rightOf(pose.alpha);
  // Camera up = cross(back, right) with back = −f.
  const u: Vec3 = [
    -f[1] * r[2] + f[2] * r[1],
    -f[2] * r[0] + f[0] * r[2],
    -f[0] * r[1] + f[1] * r[0],
  ];
  const ty = Math.tan(fov / 2);
  const tx = ty * aspect;
  const dx = ndc.x * tx;
  const dy = ndc.y * ty;
  const d: Vec3 = [
    f[0] + r[0] * dx + u[0] * dy,
    f[1] + r[1] * dx + u[1] * dy,
    f[2] + r[2] * dx + u[2] * dy,
  ];
  const len = Math.hypot(d[0], d[1], d[2]) || 1;
  return { origin: eye, direction: [d[0] / len, d[1] / len, d[2] / len] };
}

/** Where a ray meets the horizontal plane `y = planeY`, or null when it never does. */
export function planeHit(ray: Ray, planeY: number, maxDistance = 4000): Vec3 | null {
  const dy = ray.direction[1];
  if (Math.abs(dy) < 1e-6) return null;
  const t = (planeY - ray.origin[1]) / dy;
  if (t <= 0 || t > maxDistance) return null;
  return [
    ray.origin[0] + ray.direction[0] * t,
    ray.origin[1] + ray.direction[1] * t,
    ray.origin[2] + ray.direction[2] * t,
  ];
}

/**
 * Rotate the whole rig rigidly about a pivot: eye and target both.
 *
 * A rigid rotation about a world point keeps that point on the same pixel, which is the whole
 * difference between "orbit about the cursor" and "orbit about the screen centre and hope". The
 * pitch limit is applied to the DELTA before rotating rather than to the result afterwards,
 * because clamping the result would move the pivot off the cursor on every frame the limit binds.
 */
export function rotateRigAbout(
  pose: CameraPose,
  pivot: Vec3,
  dYaw: number,
  dPitch: number,
  betaMin: number,
  betaMax: number
): CameraPose {
  const targetBeta = clamp(pose.beta + dPitch, betaMin, betaMax);
  const pitch = targetBeta - pose.beta;
  const eye = eyeOf(pose);
  const rot = (p: Vec3): Vec3 => {
    // Yaw about +Y through the pivot.
    const x = p[0] - pivot[0];
    const z = p[2] - pivot[2];
    const c = Math.cos(dYaw);
    const s = Math.sin(dYaw);
    let px = pivot[0] + x * c - z * s;
    let pz = pivot[2] + x * s + z * c;
    let py = p[1];
    if (pitch !== 0) {
      // Pitch about the (already yawed) screen-right axis through the pivot.
      const axis = rightOf(pose.alpha + dYaw);
      const vx = px - pivot[0];
      const vy = py - pivot[1];
      const vz = pz - pivot[2];
      const ca = Math.cos(pitch);
      const sa = Math.sin(pitch);
      const dot = axis[0] * vx + axis[1] * vy + axis[2] * vz;
      const cx = axis[1] * vz - axis[2] * vy;
      const cy = axis[2] * vx - axis[0] * vz;
      const cz = axis[0] * vy - axis[1] * vx;
      px = pivot[0] + vx * ca + cx * sa + axis[0] * dot * (1 - ca);
      py = pivot[1] + vy * ca + cy * sa + axis[1] * dot * (1 - ca);
      pz = pivot[2] + vz * ca + cz * sa + axis[2] * dot * (1 - ca);
    }
    return [px, py, pz];
  };
  return poseFromEye(rot(eye), rot(pose.target));
}

/**
 * Scale the rig about a pivot — the exact form of "zoom towards the cursor".
 *
 * Scaling eye and target about the same world point by the same factor leaves the view direction
 * untouched, multiplies `radius` by exactly `k`, and leaves the pivot on precisely the pixel it
 * was on. The approximation everyone writes instead — lerp the target towards the cursor point
 * and scale the radius separately — drifts, and the drift is worst at the shallow angles this
 * camera spends most of its time at.
 */
export function scaleRigAbout(pose: CameraPose, pivot: Vec3, k: number): CameraPose {
  const t: Vec3 = [
    pivot[0] + (pose.target[0] - pivot[0]) * k,
    pivot[1] + (pose.target[1] - pivot[1]) * k,
    pivot[2] + (pose.target[2] - pivot[2]) * k,
  ];
  return { target: t, alpha: pose.alpha, beta: pose.beta, radius: pose.radius * k };
}

/** Translate the whole rig horizontally. */
export function translateRig(pose: CameraPose, dx: number, dz: number): CameraPose {
  return {
    target: [pose.target[0] + dx, pose.target[1], pose.target[2] + dz],
    alpha: pose.alpha,
    beta: pose.beta,
    radius: pose.radius,
  };
}

/**
 * Frame-rate independent exponential approach.
 *
 * `1 - exp(-rate * dt)` can never exceed 1, so this cannot overshoot however long the frame was —
 * which matters here more than it looks: the host caps `dt` at 0.1 s and this container's
 * SwiftShader renders at about 1.3 fps, so a naive `lerp(current, goal, rate * dt)` would be
 * asked for a factor of 3 and would ring.
 */
export function damp(current: number, goal: number, rate: number, dt: number): number {
  if (rate <= 0) return goal;
  const t = 1 - Math.exp(-rate * dt);
  return current + (goal - current) * t;
}

/** Same, the short way round a circle. */
export function dampAngle(current: number, goal: number, rate: number, dt: number): number {
  return current + wrapPi(goal - current) * (1 - Math.exp(-rate * dt));
}

export function dampPose(
  current: CameraPose,
  goal: CameraPose,
  rate: number,
  dt: number
): CameraPose {
  return {
    target: [
      damp(current.target[0], goal.target[0], rate, dt),
      damp(current.target[1], goal.target[1], rate, dt),
      damp(current.target[2], goal.target[2], rate, dt),
    ],
    alpha: dampAngle(current.alpha, goal.alpha, rate, dt),
    beta: damp(current.beta, goal.beta, rate, dt),
    radius: damp(current.radius, goal.radius, rate, dt),
  };
}

/** How far from a circle of `radius` the eye must be for it to fill `fill` of the half-height. */
export function distanceForRadius(radius: number, fov: number, fill = 0.8): number {
  const half = Math.tan(fov / 2) * Math.max(0.05, Math.min(1, fill));
  return radius / Math.max(1e-3, half);
}

/** The most horizontal beta allowed at this radius; see `DEFAULT_BOUNDS`. */
export function betaMaxFor(radius: number, b: CameraBounds): number {
  const t = clamp((radius - 40) / Math.max(1, b.maxRadius - 40), 0, 1);
  return b.betaMaxNear + (b.betaMaxFar - b.betaMaxNear) * t;
}

export interface ClampResult {
  pose: CameraPose;
  /** Which limits bound, for `stats()`. */
  clamped: string[];
}

/**
 * Apply every limit, in the one order that terminates.
 *
 * Radius before beta (the beta ceiling depends on the radius), beta before the ground check (the
 * ground check spends beta), and the eye leash last because it can only shorten the radius, which
 * loosens the beta ceiling rather than tightening it.
 */
export function clampPose(
  pose: CameraPose,
  bounds: CameraBounds,
  ground: (x: number, z: number) => number
): ClampResult {
  const clamped: string[] = [];
  let [tx, ty, tz] = pose.target;

  const tr = Math.hypot(tx, tz);
  if (tr > bounds.targetRadius) {
    const k = bounds.targetRadius / tr;
    tx *= k;
    tz *= k;
    clamped.push('target');
  }

  const gh = ground(tx, tz);
  const lift = clamp(ty - gh, 0, bounds.maxTargetLift);
  if (ty - gh !== lift) clamped.push('lift');
  ty = gh + lift;

  let radius = clamp(pose.radius, bounds.minRadius, bounds.maxRadius);
  if (radius !== pose.radius) clamped.push('radius');

  // The eye leash: keep the world's edge behind the sky dome. See DEFAULT_BOUNDS.
  const targetR = Math.hypot(tx, tz);
  const eyeAllowance = Math.max(bounds.minRadius, bounds.maxEyeRadius - targetR);
  if (radius > eyeAllowance) {
    radius = eyeAllowance;
    clamped.push('eye-leash');
  }

  let beta = clamp(pose.beta, bounds.betaMin, betaMaxFor(radius, bounds));
  if (beta !== pose.beta) clamped.push('beta');

  // Ground clearance. Height above the target is `radius * cos(beta)`, so raising the camera out
  // of a hill is a smaller beta — and only if the radius affords it; when it does not, the whole
  // rig lifts, which is what happens at a 12 m radius on a 30 % slope.
  const eyeX = tx + radius * Math.cos(pose.alpha) * Math.sin(beta);
  const eyeZ = tz + radius * Math.sin(pose.alpha) * Math.sin(beta);
  const floor = ground(eyeX, eyeZ) + bounds.eyeClearance;
  const eyeY = ty + radius * Math.cos(beta);
  if (eyeY < floor) {
    const need = (floor - ty) / radius;
    if (need <= 1) {
      const b = Math.acos(clamp(need, -1, 1));
      if (b < beta) {
        beta = Math.max(bounds.betaMin, b);
        clamped.push('ground');
      }
    } else {
      ty += floor - eyeY;
      clamped.push('ground-lift');
    }
  }

  return { pose: { target: [tx, ty, tz], alpha: pose.alpha, beta, radius }, clamped };
}
