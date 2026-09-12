/**
 * Snapping and rectangle geometry. Pure, and covered by `selftest.mjs`.
 *
 * The two numbers come from ARCHITECTURE.md §2 ("snapping optional at 0.25 m / 15°"). They are
 * defaults on {@link DEFAULT_SNAP}, not constants anything reads directly, because the player can
 * change them and a showcase does.
 *
 * `snapValue` rounds to the nearest multiple **of the step from the origin**, not from wherever the
 * pointer entered the world: two shops snapped a metre apart are then exactly a metre apart, which
 * is the only property a grid is worth having for.
 */

/** An axis-aligned-before-rotation rectangle standing on the ground. */
export interface Rect {
  x: number;
  z: number;
  /** Radians about +Y. */
  yaw: number;
  /** Metres along the item's local X before rotation. */
  sizeX: number;
  sizeZ: number;
}

export function snapValue(value: number, step: number): number {
  if (!(step > 0)) return value;
  return Math.round(value / step) * step;
}

export function snapPoint(x: number, z: number, step: number): [number, number] {
  return [snapValue(x, step), snapValue(z, step)];
}

/** Radians in, radians out; the step is in degrees because that is how a person says it. */
export function snapAngle(yaw: number, stepDeg: number): number {
  if (!(stepDeg > 0)) return wrapAngle(yaw);
  const step = (stepDeg * Math.PI) / 180;
  return wrapAngle(Math.round(yaw / step) * step);
}

/** [0, 2π). Keeps a yaw that has been nudged three hundred times from drifting off into 10^4. */
export function wrapAngle(yaw: number): number {
  const twoPi = Math.PI * 2;
  const wrapped = yaw % twoPi;
  return wrapped < 0 ? wrapped + twoPi : wrapped;
}

/** The four ground corners, counter-clockwise from the item's local (−x, −z). */
export function rectCorners(rect: Rect): Array<[number, number]> {
  const cos = Math.cos(rect.yaw);
  const sin = Math.sin(rect.yaw);
  const hx = rect.sizeX / 2;
  const hz = rect.sizeZ / 2;
  const out: Array<[number, number]> = [];
  for (const [lx, lz] of [
    [-hx, -hz],
    [hx, -hz],
    [hx, hz],
    [-hx, hz],
  ] as Array<[number, number]>) {
    // Yaw is counter-clockwise seen from above in a right-handed, +Y-up scene, which is what the
    // rest of the game composes its matrices with (`Quaternion.RotationYawPitchRoll(yaw, 0, 0)`).
    out.push([rect.x + lx * cos + lz * sin, rect.z - lx * sin + lz * cos]);
  }
  return out;
}

/** Is the point inside the rotated rectangle? Used for picking, so it is inclusive on the edge. */
export function pointInRect(x: number, z: number, rect: Rect): boolean {
  const cos = Math.cos(rect.yaw);
  const sin = Math.sin(rect.yaw);
  const dx = x - rect.x;
  const dz = z - rect.z;
  // Inverse of the rotation above.
  const lx = dx * cos - dz * sin;
  const lz = dx * sin + dz * cos;
  return Math.abs(lx) <= rect.sizeX / 2 && Math.abs(lz) <= rect.sizeZ / 2;
}

/**
 * Separating-axis test between two rotated rectangles, with a margin that grows both.
 *
 * Two rectangles is four axes, and only four, because a rectangle's two edge normals are
 * perpendicular: the pair {yaw, yaw + 90°} of each. A circle test would be simpler and wrong for
 * exactly the case that matters — a 12 × 2 m fence beside a 4 × 4 m kiosk, whose bounding circles
 * overlap by metres while the objects do not touch at all.
 */
export function rectsOverlap(a: Rect, b: Rect, margin = 0): boolean {
  const ca = rectCorners(grow(a, margin));
  const cb = rectCorners(grow(b, margin));
  for (const yaw of [a.yaw, b.yaw]) {
    for (const axis of [
      [Math.cos(yaw), -Math.sin(yaw)],
      [Math.sin(yaw), Math.cos(yaw)],
    ] as Array<[number, number]>) {
      const pa = project(ca, axis);
      const pb = project(cb, axis);
      if (pa.max < pb.min || pb.max < pa.min) return false;
    }
  }
  return true;
}

function grow(rect: Rect, margin: number): Rect {
  if (margin === 0) return rect;
  return {
    ...rect,
    sizeX: Math.max(0, rect.sizeX + margin),
    sizeZ: Math.max(0, rect.sizeZ + margin),
  };
}

function project(
  corners: Array<[number, number]>,
  axis: [number, number]
): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const [x, z] of corners) {
    const v = x * axis[0] + z * axis[1];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { min, max };
}

/** Area, for choosing the smallest rectangle under the cursor when several contain it. */
export function rectArea(rect: Rect): number {
  return rect.sizeX * rect.sizeZ;
}
