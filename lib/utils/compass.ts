/**
 * The arithmetic behind the in-park compass (`ParkCompass`): which way a ride lies, which way the
 * phone points, and where on the ring a marker may sit without covering its neighbour.
 *
 * Pure functions, no DOM, so `scripts/test-compass.mjs` can hold them to the numbers.
 */

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** Any angle folded into [0, 360). */
export function normalizeDegrees(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * The initial bearing from the first point to the second, in degrees clockwise from true north
 * (0 north, 90 east), in [0, 360).
 *
 * The great-circle formula. Over the few hundred metres inside a park it is indistinguishable from
 * a straight line on the map, and it stays right at the edges a flat-earth `atan2(dLng, dLat)`
 * gets wrong: a degree of longitude is 71 km at Phantasialand and 111 km on the equator.
 */
export function bearingBetween(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lng2 - lng1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return normalizeDegrees(toDeg(Math.atan2(y, x)));
}

/** How far to turn from `from` to face `to`, in (-180, 180]: negative is left, positive right. */
export function angleDelta(from: number, to: number): number {
  const d = normalizeDegrees(to - from);
  return d > 180 ? d - 360 : d;
}

/**
 * The fields of a `DeviceOrientationEvent` this reads. Typed here rather than taken from the DOM
 * lib, because Safari's `webkitCompassHeading` is in no standard type.
 */
export interface OrientationReading {
  alpha: number | null;
  absolute?: boolean;
  webkitCompassHeading?: number;
}

/**
 * Which way the top of the phone points, in degrees clockwise from north, or `null` where the
 * event cannot say.
 *
 * Two sources, because the two engines never agreed:
 *
 * - **Safari** sends `webkitCompassHeading`, already clockwise from magnetic north. Its `alpha` is
 *   relative to wherever the phone was pointing when the page loaded, and useless for this.
 * - **Chrome and Firefox** send `alpha` on `deviceorientationabsolute`, counter-clockwise from
 *   north, so the heading is `360 - alpha`. A plain `deviceorientation` counts only when it says
 *   `absolute`; otherwise its zero is arbitrary and a ring drawn from it would point anywhere.
 *
 * `screenAngle` is the screen's rotation (`screen.orientation.angle`): turned to landscape, the
 * top of the SCREEN is 90° away from the top of the phone, and the reader holds the screen.
 */
export function headingFromOrientation(event: OrientationReading, screenAngle = 0): number | null {
  if (
    typeof event.webkitCompassHeading === 'number' &&
    Number.isFinite(event.webkitCompassHeading)
  ) {
    return normalizeDegrees(event.webkitCompassHeading + screenAngle);
  }
  if (event.absolute && typeof event.alpha === 'number' && Number.isFinite(event.alpha)) {
    return normalizeDegrees(360 - event.alpha + screenAngle);
  }
  return null;
}

/**
 * One step of an exponential filter over a heading, taking the short way round.
 *
 * A magnetometer jitters by a few degrees at rest, and a ring that follows every sample shivers.
 * Averaging the raw numbers breaks at north: 359 and 1 average to 180, the ring spins half a turn.
 * So the step is taken along `angleDelta`, and 359 → 1 is two degrees, not 358.
 */
export function smoothHeading(previous: number | null, next: number, factor = 0.25): number {
  if (previous === null) return normalizeDegrees(next);
  return normalizeDegrees(previous + angleDelta(previous, next) * factor);
}

/** The steps a radar's outer ring snaps to, in metres. */
const RANGE_STEPS = [50, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 5000];

/**
 * The radar's outer ring for a set of distances: the next round number at or above the farthest,
 * so the ring can carry a label a reader takes in at a glance („500 m"), never „402 m".
 */
export function niceRange(maxDistance: number): number {
  for (const step of RANGE_STEPS) if (maxDistance <= step) return step;
  return Math.ceil(maxDistance / 1000) * 1000;
}

/** A marker's centre, relative to the dial's centre, in the dial's own units (x right, y down). */
export interface RadarPoint {
  x: number;
  y: number;
}

/**
 * Where each marker sits inside the bezel: at its true bearing, at a radius that grows with its
 * distance, then nudged apart where two would overlap.
 *
 * Distance is the radius so that two rides in the same direction do not collide at all — which is
 * most rides in a park, standing at its edge. The first version put every marker on the ring
 * itself and spread neighbours round it; on Phantasialand, seven headliners lie east of the
 * simulation point within 35°, and spreading them moved Taron's marker 45° off its arrow.
 *
 * `inner` is where a ride at 0 m would sit (the reader's own dot is inside it), `outer` is the
 * ring `range` metres away. A ride farther than `range` stays on the outer ring. What is left to
 * separate is the rare true pile — Winja's Fear and Winja's Force, 3 m apart — and pairs closer
 * than `minGap` are pushed apart along the line between them, both halves of the way, a few
 * passes over the set. Coincident points are parted along the tangent, so the push has a
 * direction. Displayed positions move by as little as that needs; every arrow and every figure
 * still reads the true bearing and distance.
 */
export function placeMarkers(
  items: readonly { bearing: number; distance: number }[],
  { range, inner, outer, minGap }: { range: number; inner: number; outer: number; minGap: number }
): RadarPoint[] {
  const points = items.map(({ bearing, distance }) => {
    const r = inner + (outer - inner) * Math.min(1, Math.max(0, distance) / range);
    const a = toRad(bearing);
    return { x: r * Math.sin(a), y: -r * Math.cos(a), tangent: a + Math.PI / 2 };
  });
  for (let pass = 0; pass < 60; pass++) {
    let moved = false;
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const a = points[i];
        const b = points[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d = Math.hypot(dx, dy);
        if (d >= minGap) continue;
        if (d < 1e-6) {
          dx = Math.sin(a.tangent);
          dy = -Math.cos(a.tangent);
          d = 1;
        }
        const push = (minGap - Math.min(d, minGap)) / 2;
        const ux = dx / d;
        const uy = dy / d;
        a.x -= ux * push;
        a.y -= uy * push;
        b.x += ux * push;
        b.y += uy * push;
        moved = true;
      }
    }
    if (!moved) break;
  }
  return points.map(({ x, y }) => ({ x, y }));
}
