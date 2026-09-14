/**
 * The drive loop: intents in, a pose out, every frame.
 *
 * Babylon-free and DOM-free on purpose. Everything that decides how the camera *feels* — the
 * grab-the-world pan, the pivot the orbit turns about, how momentum settles, where the leash
 * binds — lives here where `selftest.mjs` can run it under node without a browser, and `main.ts`
 * is left with nothing but "read the pointer, write four numbers onto an `ArcRotateCamera`".
 *
 * The shape is a **goal pose plus a displayed pose**. Input moves the goal; the displayed pose
 * chases it with `damp()`, which is frame-rate independent and cannot overshoot. That split is
 * what gives momentum somewhere to live (a fling is a velocity applied to the goal, decaying to
 * nothing) and it is also why every limit is applied twice: to the goal when it moves, so the
 * camera does not spend the next second easing towards somewhere it may not go, and to the
 * displayed pose after damping, because the ground under the eye changes as it travels.
 */

import type { Vec3 } from '../core/types';
import type { CameraBounds, CameraPose } from './types';
import {
  DEFAULT_BOUNDS,
  clamp,
  clampPose,
  damp,
  dampAngle,
  eyeOf,
  planForwardOf,
  planeHit,
  rightOf,
  rotateRigAbout,
  scaleRigAbout,
  screenRay,
  translateRig,
  wrapPi,
  type Ndc,
} from './pose';

export type DragKind = 'pan' | 'orbit' | 'tilt';

export interface ControllerDeps {
  ground(x: number, z: number): number;
  /** Terrain raycast; null when the ray misses the ground (pointing at the sky). */
  raycast(origin: Vec3, direction: Vec3, maxDistance?: number): Vec3 | null;
  /** Vertical field of view, radians. */
  fov(): number;
  /** Viewport width / height. */
  aspect(): number;
}

/** How quickly each channel chases its goal, and how quickly a fling dies. Per second. */
const RATE = { pan: 22, orbit: 16, zoom: 11, fling: 2.6, velocity: 14, terrain: 6 };
/** A full-width drag turns 180 degrees; a full-height drag tilts 90. */
const YAW_PER_NDC = Math.PI / 2;
const PITCH_PER_NDC = Math.PI / 4;
/** One wheel notch is 18 % of the radius. */
const ZOOM_PER_NOTCH = 0.18;
const FLING_STOP = { pan: 0.4, orbit: 0.02 };

export interface CameraController {
  /** The pose the renderer should show. */
  pose(): CameraPose;
  /** Where the pose is heading. Input writes here; rays are cast from here. */
  goal(): CameraPose;
  setGoal(pose: CameraPose, instant: boolean): void;
  /** Adopt a pose somebody else wrote onto the camera (a showcase, a debugger). */
  adopt(pose: CameraPose): void;
  beginDrag(kind: DragKind, ndc: Ndc): void;
  dragTo(ndc: Ndc): void;
  endDrag(): void;
  dragging(): DragKind | null;
  zoomAt(ndc: Ndc, notches: number): void;
  /**
   * Held keys / edge scroll, in camera-relative units. 1 is a full press; a boost modifier passes
   * more than 1 (capped at 3) rather than the controller keeping a second notion of "fast".
   */
  setPanAxis(right: number, forward: number): void;
  setSpinAxis(yaw: number, pitch: number): void;
  setZoomAxis(v: number): void;
  update(dt: number): void;
  bounds(): CameraBounds;
  setBounds(patch: Partial<CameraBounds>): void;
  /** Which limits bound on the last update, for `stats()`. */
  clamped(): string[];
  /** Where a screen point meets the ground, from the goal pose. */
  pickGround(ndc: Ndc): Vec3 | null;
  /** True while the camera is still settling. */
  moving(): boolean;
}

export function createCameraController(
  deps: ControllerDeps,
  start: CameraPose,
  initialBounds?: Partial<CameraBounds>
): CameraController {
  let bounds: CameraBounds = { ...DEFAULT_BOUNDS, ...initialBounds };
  const ground = (x: number, z: number) => deps.ground(x, z);

  let goalPose: CameraPose = clampPose(start, bounds, ground).pose;
  let shown: CameraPose = { ...goalPose, target: [...goalPose.target] as Vec3 };
  let lastClamped: string[] = [];

  let drag: DragKind | null = null;
  let grab: Vec3 | null = null;
  let grabNdc: Ndc = { x: 0, y: 0 };
  let panAxis = { right: 0, forward: 0 };
  let spinAxis = { yaw: 0, pitch: 0 };
  let zoomAxis = 0;

  // Momentum. Measured off the goal's own motion rather than off pointer timestamps, so nothing
  // in this module reads a clock: `Date.now()` and `performance.now()` are both banned in a sim
  // path, and a camera that behaves differently under the screenshot harness than in a browser is
  // worse than one with no momentum at all.
  const velocity = { x: 0, z: 0, alpha: 0, beta: 0 };
  let prev: CameraPose = { ...goalPose, target: [...goalPose.target] as Vec3 };

  /**
   * How high above the ground the target wants to sit, in metres.
   *
   * It is a stored intention rather than a value re-derived per frame, and that is the fix for a
   * bug the selftest caught: rewriting `target.y` to `ground + lift` INSIDE a pan moved the eye
   * in the same tick that the pan solved for it, so the grabbed point slipped by 10.84 m over a
   * 20 m hill — grab-the-world that lets go as soon as the ground is not flat. A pan now
   * translates x and z only, and the height chases the terrain on its own damped channel in
   * `update()`, so the invariant holds per move and the camera still rides over a hill instead of
   * ploughing through it.
   */
  let desiredLift = goalPose.target[1] - ground(goalPose.target[0], goalPose.target[2]);

  /** Apply an operation to the goal. `keepLift` is for the ones that only translate. */
  const applyGoal = (next: CameraPose, keepLift = false) => {
    const result = clampPose(next, bounds, ground);
    goalPose = result.pose;
    // Reported here as well as after the ease, so `stats()` is honest immediately after a preset
    // snaps rather than only after the next frame has run.
    lastClamped = result.clamped;
    if (!keepLift) {
      desiredLift = clamp(
        goalPose.target[1] - ground(goalPose.target[0], goalPose.target[2]),
        0,
        bounds.maxTargetLift
      );
    }
  };

  function pickGround(ndc: Ndc): Vec3 | null {
    const ray = screenRay(goalPose, ndc, deps.fov(), deps.aspect());
    const hit = deps.raycast(ray.origin, ray.direction, 3000);
    if (hit) return hit;
    // The pointer is on the sky, or past the heightfield. Fall back to the plane the target sits
    // on: it is the plane the user is manipulating anyway, and it keeps panning finite when the
    // camera is nearly horizontal.
    return planeHit(ray, goalPose.target[1], 3000);
  }

  return {
    pose: () => shown,
    goal: () => goalPose,
    bounds: () => bounds,
    clamped: () => lastClamped,
    dragging: () => drag,
    pickGround,
    moving() {
      const dt =
        Math.abs(shown.target[0] - goalPose.target[0]) +
        Math.abs(shown.target[2] - goalPose.target[2]);
      return (
        dt > 0.05 ||
        Math.abs(shown.radius - goalPose.radius) > 0.05 ||
        Math.abs(wrapPi(shown.alpha - goalPose.alpha)) > 0.002 ||
        Math.abs(shown.beta - goalPose.beta) > 0.002 ||
        Math.abs(velocity.x) + Math.abs(velocity.z) > FLING_STOP.pan
      );
    },
    setBounds(patch) {
      bounds = { ...bounds, ...patch };
      applyGoal(goalPose);
    },
    setGoal(pose, instant) {
      applyGoal(pose);
      velocity.x = velocity.z = velocity.alpha = velocity.beta = 0;
      if (instant) {
        shown = { ...goalPose, target: [...goalPose.target] as Vec3 };
        prev = { ...goalPose, target: [...goalPose.target] as Vec3 };
      }
    },
    adopt(pose) {
      goalPose = { ...pose, target: [...pose.target] as Vec3 };
      desiredLift = clamp(
        pose.target[1] - ground(pose.target[0], pose.target[2]),
        0,
        bounds.maxTargetLift
      );
      shown = { ...pose, target: [...pose.target] as Vec3 };
      prev = { ...pose, target: [...pose.target] as Vec3 };
      velocity.x = velocity.z = velocity.alpha = velocity.beta = 0;
    },
    beginDrag(kind, ndc) {
      drag = kind;
      grabNdc = { ...ndc };
      grab = pickGround(ndc);
      velocity.x = velocity.z = velocity.alpha = velocity.beta = 0;
    },
    dragTo(ndc) {
      if (!drag) return;
      if (drag === 'pan') {
        if (!grab) {
          grab = pickGround(ndc);
          return;
        }
        // Grab-the-world: intersect the CURRENT pointer with the plane the grabbed point sits on
        // and move the rig by the difference, so the point under the cursor stays under it. The
        // ray comes from the goal, not from the displayed pose, or the lag feeds back on itself.
        const ray = screenRay(goalPose, ndc, deps.fov(), deps.aspect());
        const now = planeHit(ray, grab[1], 6000);
        if (!now) return;
        applyGoal(translateRig(goalPose, grab[0] - now[0], grab[2] - now[2]), true);
        return;
      }
      const dx = ndc.x - grabNdc.x;
      const dy = ndc.y - grabNdc.y;
      grabNdc = { ...ndc };
      const pivot = grab ?? goalPose.target;
      const dYaw = drag === 'tilt' ? 0 : -dx * YAW_PER_NDC;
      const dPitch = dy * PITCH_PER_NDC;
      applyGoal(rotateRigAbout(goalPose, pivot, dYaw, dPitch, bounds.betaMin, Math.PI / 2 - 0.01));
    },
    endDrag() {
      drag = null;
      grab = null;
    },
    zoomAt(ndc, notches) {
      const pivot = pickGround(ndc) ?? goalPose.target;
      const wanted = goalPose.radius * Math.exp(-notches * ZOOM_PER_NOTCH);
      const capped = clamp(wanted, bounds.minRadius, bounds.maxRadius);
      // Scale by the factor that actually survives the clamp, so the pivot stays on its pixel
      // instead of sliding while the radius sits pinned at a limit.
      const k = capped / goalPose.radius;
      if (Math.abs(k - 1) < 1e-4) return;
      applyGoal(scaleRigAbout(goalPose, pivot, k));
    },
    setPanAxis(right, forward) {
      panAxis = { right: clamp(right, -3, 3), forward: clamp(forward, -3, 3) };
    },
    setSpinAxis(yaw, pitch) {
      spinAxis = { yaw: clamp(yaw, -1, 1), pitch: clamp(pitch, -1, 1) };
    },
    setZoomAxis(v) {
      zoomAxis = clamp(v, -1, 1);
    },
    update(dt) {
      const step = clamp(dt, 0, 0.25);

      // Keys and edge scroll. The speed follows the radius so the park travels past at the same
      // apparent rate whether the camera is 12 m up or 400.
      if (panAxis.right !== 0 || panAxis.forward !== 0) {
        const speed = clamp(goalPose.radius * 0.85, 14, 240);
        const r = rightOf(goalPose.alpha);
        const f = planForwardOf(goalPose.alpha);
        const dx = (r[0] * panAxis.right + f[0] * panAxis.forward) * speed * step;
        const dz = (r[2] * panAxis.right + f[2] * panAxis.forward) * speed * step;
        applyGoal(translateRig(goalPose, dx, dz), true);
      }
      if (spinAxis.yaw !== 0 || spinAxis.pitch !== 0) {
        applyGoal(
          rotateRigAbout(
            goalPose,
            goalPose.target,
            spinAxis.yaw * 1.5 * step,
            spinAxis.pitch * 0.9 * step,
            bounds.betaMin,
            Math.PI / 2 - 0.01
          )
        );
      }
      if (zoomAxis !== 0) {
        const k = Math.exp(-zoomAxis * 1.4 * step);
        applyGoal({ ...goalPose, radius: goalPose.radius * k });
      }

      // Momentum: measure how fast the goal is being dragged, then keep it going when the drag
      // ends. Measured over the frame's own dt, so it is the same on a 144 Hz screen and in the
      // 1.3 fps headless harness.
      if (drag && step > 1e-4) {
        const inst = {
          x: (goalPose.target[0] - prev.target[0]) / step,
          z: (goalPose.target[2] - prev.target[2]) / step,
          alpha: wrapPi(goalPose.alpha - prev.alpha) / step,
          beta: (goalPose.beta - prev.beta) / step,
        };
        const t = 1 - Math.exp(-RATE.velocity * step);
        velocity.x += (inst.x - velocity.x) * t;
        velocity.z += (inst.z - velocity.z) * t;
        velocity.alpha += (inst.alpha - velocity.alpha) * t;
        velocity.beta += (inst.beta - velocity.beta) * t;
      } else {
        const speed = Math.hypot(velocity.x, velocity.z);
        if (speed > FLING_STOP.pan) {
          applyGoal(translateRig(goalPose, velocity.x * step, velocity.z * step), true);
        } else {
          velocity.x = velocity.z = 0;
        }
        const spin = Math.abs(velocity.alpha) + Math.abs(velocity.beta);
        if (spin > FLING_STOP.orbit) {
          applyGoal(
            rotateRigAbout(
              goalPose,
              goalPose.target,
              velocity.alpha * step,
              velocity.beta * step,
              bounds.betaMin,
              Math.PI / 2 - 0.01
            )
          );
        } else {
          velocity.alpha = velocity.beta = 0;
        }
        const decay = Math.exp(-RATE.fling * step);
        velocity.x *= decay;
        velocity.z *= decay;
        velocity.alpha *= decay;
        velocity.beta *= decay;
      }
      // The target rides the terrain on its own damped channel — slow enough that a pan solved
      // this frame is still solved on the next one, fast enough that the camera climbs a hill
      // rather than walking into it. Doing this inside the pan instead is the 10.84 m bug the
      // `desiredLift` docblock above records.
      const wanted = ground(goalPose.target[0], goalPose.target[2]) + desiredLift;
      if (Math.abs(goalPose.target[1] - wanted) > 1e-4) {
        goalPose = clampPose(
          {
            ...goalPose,
            target: [
              goalPose.target[0],
              damp(goalPose.target[1], wanted, RATE.terrain, step),
              goalPose.target[2],
            ],
          },
          bounds,
          ground
        ).pose;
      }

      prev = { ...goalPose, target: [...goalPose.target] as Vec3 };

      // Chase. Panning is the tightest because a lagging grab-the-world drag reads as a slippery
      // mouse; zoom is the loosest because a wheel notch is a step function and the ease is what
      // turns it into a movement.
      const eased: CameraPose = {
        target: [
          damp(shown.target[0], goalPose.target[0], RATE.pan, step),
          damp(shown.target[1], goalPose.target[1], RATE.pan, step),
          damp(shown.target[2], goalPose.target[2], RATE.pan, step),
        ],
        alpha: dampAngle(shown.alpha, goalPose.alpha, RATE.orbit, step),
        beta: damp(shown.beta, goalPose.beta, RATE.orbit, step),
        radius: damp(shown.radius, goalPose.radius, RATE.zoom, step),
      };
      const result = clampPose(eased, bounds, ground);
      shown = result.pose;
      lastClamped = result.clamped;
    },
  };
}

/** Metres of air between the eye and the ground under it. */
export function eyeAboveGround(pose: CameraPose, ground: (x: number, z: number) => number): number {
  const eye = eyeOf(pose);
  return eye[1] - ground(eye[0], eye[2]);
}
