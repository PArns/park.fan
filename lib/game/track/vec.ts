/**
 * Vector arithmetic for the track core. Pure, allocation-light, Babylon-free.
 *
 * A `V3` is `[x, y, z]` in metres, +Y up, right-handed — the same tuple `core/types.ts` calls
 * `Vec3`. It is a plain array rather than a class because every one of these values ends up either
 * in a `Float32Array` for the GPU or in a JSON save, and both of those want tuples.
 *
 * The one convention worth stating: a track frame is `{ dir, up, right }` with
 * `right = cross(dir, up)`. Every file in this module builds it that way, so a sign error in one
 * place is a sign error everywhere and shows up immediately as a track drawn inside out.
 */

export type V3 = [number, number, number];

export const UP: V3 = [0, 1, 0];
/** Standard gravity, m/s². The whole physics model is written in these units. */
export const G = 9.80665;

export function v3(x: number, y: number, z: number): V3 {
  return [x, y, z];
}

export function add(a: V3, b: V3): V3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function sub(a: V3, b: V3): V3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function scale(a: V3, k: number): V3 {
  return [a[0] * k, a[1] * k, a[2] * k];
}

/** `a + b * k`, the shape most of the geometry actually wants. */
export function addScaled(a: V3, b: V3, k: number): V3 {
  return [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
}

export function dot(a: V3, b: V3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function cross(a: V3, b: V3): V3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

export function length(a: V3): number {
  return Math.hypot(a[0], a[1], a[2]);
}

export function distance(a: V3, b: V3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

export function normalize(a: V3, fallback: V3 = [0, 0, 1]): V3 {
  const len = Math.hypot(a[0], a[1], a[2]);
  if (len < 1e-12) return [...fallback] as V3;
  return [a[0] / len, a[1] / len, a[2] / len];
}

export function lerp3(a: V3, b: V3, t: number): V3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** The part of `a` perpendicular to the unit vector `axis`. */
export function perpendicular(a: V3, axis: V3): V3 {
  const k = dot(a, axis);
  return [a[0] - axis[0] * k, a[1] - axis[1] * k, a[2] - axis[2] * k];
}

/** Rodrigues' rotation of `v` about the UNIT vector `axis` by `angle` radians. */
export function rotateAbout(v: V3, axis: V3, angle: number): V3 {
  if (Math.abs(angle) < 1e-12) return [...v] as V3;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const d = dot(v, axis) * (1 - c);
  const cr = cross(axis, v);
  return [
    v[0] * c + cr[0] * s + axis[0] * d,
    v[1] * c + cr[1] * s + axis[1] * d,
    v[2] * c + cr[2] * s + axis[2] * d,
  ];
}

/**
 * The signed angle from `a` to `b` measured about the unit `axis`, in (−π, π].
 *
 * Used to read a roll angle back out of two up-vectors, which is the only way this module ever
 * converts geometry into a bank number: the generators emit frames, never angles.
 */
export function signedAngle(a: V3, b: V3, axis: V3): number {
  const pa = normalize(perpendicular(a, axis), [1, 0, 0]);
  const pb = normalize(perpendicular(b, axis), [1, 0, 0]);
  return Math.atan2(dot(cross(pa, pb), axis), dot(pa, pb));
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x < edge0 ? 0 : 1;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * A C² step: 6t⁵ − 15t⁴ + 10t³.
 *
 * `smoothstep` is only C¹ — its second derivative jumps at both ends — and this module uses these
 * curves to blend a track's geometry. A C¹ blend puts a step in the curvature, which is exactly
 * the thing every transition in here exists to avoid, so a blend written with `smoothstep` would
 * quietly undo the clothoids either side of it.
 */
export function smootherstep(t: number): number {
  const x = clamp01(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

export function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
