/**
 * The camera module's vocabulary. Pure: no Babylon, no DOM, importable on the worker and in node
 * so `selftest.mjs` can exercise the maths without a browser.
 *
 * Two conventions are chosen here rather than inherited, and both exist because of a bug this
 * project already paid for. `core/host.ts`'s preset docblock records two rounds of getting the
 * `overview` framing wrong, and the reason was that Babylon's `beta` is measured **from +Y**: a
 * camera at `beta = PI/3.4` looks 37.1 degrees down, and with `fov = 0.9` rad the vertical
 * half-angle is 25.8 degrees, so the top edge of that frame sits 11.3 degrees BELOW the horizon
 * and no sky can appear in it at any time of day. Nobody writing `PI/3.4` intends that.
 *
 * So a preset is authored in the two numbers a person actually means:
 *
 * - `pitch` — degrees **below the horizon**. `beta = 90 - pitch`. The horizon is in frame while
 *   `pitch < degrees(fov / 2)`; at `fov = 0.9` that is 25.78 degrees, and it lands on the screen
 *   row `H/2 * (1 - tan(pitch) / tan(fov/2))`. The `overview` preset's 15.52 degrees puts it at
 *   row 153 of 720, which is the number the host docblock quotes, reproduced by
 *   `horizonRow()` below.
 * - `bearing` — the compass direction the camera **looks along**, degrees clockwise from north,
 *   where north is −Z (the demo park's pavilion end) and east is +X. `alpha` is derived.
 */

import type { Vec3 } from '../core/types';

/** Where the camera is, in the four numbers an `ArcRotateCamera` is built from. */
export interface CameraPose {
  /** The point the camera orbits and looks at, in metres. */
  target: Vec3;
  /** Babylon's azimuth. Radians. Use `bearingToAlpha` to author one. */
  alpha: number;
  /** Babylon's polar angle FROM +Y. Radians. Use `pitchToBeta` to author one. */
  beta: number;
  /** Distance from `target` to the eye, in metres. */
  radius: number;
}

/** What an anchor reference resolves to: a place, and how big the thing there is. */
export interface AnchorSample {
  x: number;
  z: number;
  /** World height of the thing's base. Resolvers fill this from the terrain. */
  y: number;
  /** Horizontal radius of what is there, in metres. Drives `frameRadius` framing. */
  radius: number;
  /** Which resolver in the chain answered, for `stats()` and for the report. */
  from: string;
}

export type AnchorResolver = (arg: string) => AnchorSample | null;

/**
 * A camera preset — content, not code.
 *
 * Every field is a number or a string, so a content pack adds one under `cameraPresets` and the
 * module never learns its name. `anchor` is a `|`-separated fallback chain evaluated left to
 * right, which is how `pool` can mean "the pools if there are any, otherwise the biggest body of
 * water, otherwise the middle of the park" without a branch anywhere in this module.
 */
export interface CameraPresetDef {
  id: string;
  /**
   * Where to look, as a chain: `kinds:shop,ride | plot:coaster | park:centre`.
   * Grammar in `manifest.ts`. Ignored when `target` is given.
   */
  anchor?: string;
  /** Explicit world target, metres. Overrides `anchor`. */
  target?: [number, number, number];
  /** Metres above the ground at the anchor. Default 2. */
  height?: number;
  /**
   * Metres to slide the target along the bearing, away from the camera.
   *
   * An anchor says where a thing IS; a good frame is often a little past it. The gate is the only
   * point `paths.entrance()` can name, but the shot everybody wants is the arch in the near third
   * with the plaza behind it — that is the gate plus 55 m of north. Without this the preset would
   * have to hard-code a coordinate again and stop following the park.
   */
  offset?: number;
  /** Degrees clockwise from north (−Z), the direction the camera looks along. */
  bearing: number;
  /** Degrees below the horizon. Ignored when `eyeHeight` is set. */
  pitch?: number;
  /**
   * Metres above the ground the EYE should sit at; `pitch` is solved from it.
   * This is how an eye-level preset is written without doing trigonometry by hand.
   */
  eyeHeight?: number;
  /** Distance from the target, metres. Ignored when `frameRadius` is set. */
  distance?: number;
  /**
   * Frame a circle of this radius instead of naming a distance: the distance follows from the
   * vertical FOV. `auto` takes the radius the anchor reported.
   */
  frameRadius?: number | 'auto';
  /** Fraction of the frame's half-height the framed circle fills. Default 0.8. */
  fill?: number;
}

export interface CameraBounds {
  /** The target may not leave this disc about the origin, metres. */
  targetRadius: number;
  minRadius: number;
  maxRadius: number;
  /**
   * The eye's horizontal distance from the origin. The leash that keeps the world's edge out of
   * frame; see `DEFAULT_BOUNDS` for the arithmetic.
   */
  maxEyeRadius: number;
  /** Radians from +Y. `betaMin` is the most top-down; `betaMax` the most horizontal. */
  betaMin: number;
  /** Most horizontal angle allowed when zoomed all the way in. */
  betaMaxNear: number;
  /** Most horizontal angle allowed at `maxRadius` — a flatter far camera stares at the apron. */
  betaMaxFar: number;
  /** Metres of air the eye keeps above the ground. */
  eyeClearance: number;
  /** Metres the target may float above the ground. */
  maxTargetLift: number;
}

export interface FollowSample {
  position: Vec3;
  /** Radians, the direction the thing is travelling. Optional; drives `behind`. */
  heading?: number;
}

export type FollowSource = (id: string) => FollowSample | null;

export type CameraMode = 'free' | 'follow';

export interface FocusOptions {
  /** Horizontal radius of what is being framed, metres. */
  radius?: number;
  /** Keep the current bearing (default) or take this one, degrees from north. */
  bearing?: number;
  pitch?: number;
  /** Snap instead of easing. Presets snap; `focus` eases. */
  instant?: boolean;
}

export interface FollowOptions {
  /** Swing the camera behind the thing's heading. */
  behind?: boolean;
  distance?: number;
  pitch?: number;
  /** Metres above the sample the camera aims at. */
  height?: number;
  /**
   * Metres per second, for a source that needs the camera to say how fast it is going.
   * Only the built-in `track:` ride-along stand-in reads it; a real train knows its own speed.
   */
  speed?: number;
}

export interface CameraStats {
  mode: CameraMode;
  pose: CameraPose;
  /** Metres above the ground the eye is. */
  eyeAboveGround: number;
  /** Degrees below the horizon, and the screen row the horizon lands on at 720p. */
  pitchDeg: number;
  horizonRow: number;
  bearingDeg: number;
  presets: number;
  anchors: number;
  /** Babylon objects this module created. It creates none; the census proves it. */
  meshes: number;
  materials: number;
  /** Whether the leash is currently binding, and which half of it. */
  clamped: string[];
  following: string | null;
}
