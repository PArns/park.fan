/**
 * The arithmetic behind the in-park compass (`ParkCompass`): which way a ride lies, which way the
 * phone points, and where on the ring a marker may sit. Pure and DOM-free so
 * `scripts/test-compass.mjs` can hold them to the numbers. See docs/features/park-compass.md.
 */

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** Any angle folded into [0, 360). */
export function normalizeDegrees(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * The initial great-circle bearing from the first point to the second, in degrees clockwise from
 * true north, in [0, 360). A flat `atan2(dLng, dLat)` is wrong away from the equator, where a
 * degree of longitude is much shorter than a degree of latitude.
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
  beta?: number | null;
  gamma?: number | null;
  absolute?: boolean;
  webkitCompassHeading?: number;
  /** Safari's own error estimate in degrees; negative when it has none (uncalibrated). */
  webkitCompassAccuracy?: number;
}

/** Tilted further than this towards upright, the phone is looked through, not down at. */
const STEEP_BETA = 65;

/**
 * Which way the top of the phone points, in degrees clockwise from north, or `null` where the
 * event cannot say.
 *
 * Safari sends `webkitCompassHeading` (clockwise from magnetic north); its `alpha` is relative to
 * the load-time pose and useless here. Chrome and Firefox send `alpha` counter-clockwise from
 * north, so the heading is `360 - alpha`, and only an `absolute` event has a meaningful zero.
 * `screenAngle` corrects for landscape, where the top of the screen is 90° from the phone's top.
 */
export function headingFromOrientation(event: OrientationReading, screenAngle = 0): number | null {
  if (
    typeof event.webkitCompassHeading === 'number' &&
    Number.isFinite(event.webkitCompassHeading)
  ) {
    return normalizeDegrees(event.webkitCompassHeading + screenAngle);
  }
  if (event.absolute && typeof event.alpha === 'number' && Number.isFinite(event.alpha)) {
    const beta = event.beta ?? 0;
    const gamma = event.gamma ?? 0;
    // Held near upright, the top edge points at the sky; what the reader faces is where the back of
    // the phone points (the W3C compass-heading formula). The two agree below the threshold, so
    // the hand-over does not jump. Portrait only, since landscape swaps the tilt axes.
    if (screenAngle === 0 && Math.abs(beta) > STEEP_BETA) {
      const a = toRad(event.alpha);
      const b = toRad(beta);
      const g = toRad(gamma);
      const x = -Math.cos(a) * Math.sin(g) - Math.sin(a) * Math.sin(b) * Math.cos(g);
      const y = -Math.sin(a) * Math.sin(g) + Math.cos(a) * Math.sin(b) * Math.cos(g);
      return normalizeDegrees(toDeg(Math.atan2(x, y)));
    }
    return normalizeDegrees(360 - event.alpha + screenAngle);
  }
  return null;
}

/**
 * Whether the magnetometer reports itself as off: Safari gives a negative or large error near the
 * steel of a coaster, and the reader should recalibrate rather than trust the arrow. Chrome
 * reports nothing, so `false` there.
 */
export function compassUnreliable(event: OrientationReading): boolean {
  const accuracy = event.webkitCompassAccuracy;
  return typeof accuracy === 'number' && (accuracy < 0 || accuracy > 25);
}

/**
 * One step of an exponential filter over a heading, taking the short way round: averaging raw
 * numbers turns 359 and 1 into 180 and spins the ring half a turn.
 */
export function smoothHeading(previous: number | null, next: number, factor = 0.25): number {
  if (previous === null) return normalizeDegrees(next);
  return normalizeDegrees(previous + angleDelta(previous, next) * factor);
}

/** The steps a radar's outer ring snaps to, in metres. */
const RANGE_STEPS = [50, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 5000];

/**
 * The radar's outer ring for a set of distances: the next round step at or above the farthest, so
 * the label reads „500 m", never „402 m".
 */
export function niceRange(maxDistance: number): number {
  for (const step of RANGE_STEPS) if (maxDistance <= step) return step;
  return Math.ceil(maxDistance / 1000) * 1000;
}

/**
 * The outer ring for a reader on the move: it grows at once, and shrinks only when the farthest
 * ride is well inside the step below, so walking near a step does not flip the ring (and every
 * marker) back and forth.
 */
export function stableRange(previous: number | null, maxDistance: number): number {
  const fresh = niceRange(maxDistance);
  if (previous === null || fresh >= previous) return fresh;
  const below =
    previous > RANGE_STEPS[RANGE_STEPS.length - 1]
      ? previous - 1000
      : ([...RANGE_STEPS].reverse().find((step) => step < previous) ?? RANGE_STEPS[0]);
  return maxDistance < below * 0.75 ? fresh : previous;
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
 * Distance as radius keeps rides in the same direction (most of a park, seen from its edge) from
 * colliding at all; spreading them around one ring moved markers far off their arrows. `inner` is
 * where 0 m sits, `outer` is `range` metres. Pairs closer than `minGap` are pushed apart along the
 * line between them (coincident ones along the tangent); arrows and figures still read the true
 * bearing and distance.
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

/** Metres per degree of latitude (and of longitude on the equator), for {@link relocate}. */
const METRES_PER_DEGREE = 111_320;

/**
 * A point moved along with its park: where `point` would be if the park's `from` stood at `to`.
 * Used by the compass demo. The offset is carried in metres, not degrees, because a degree of
 * longitude shrinks with latitude and shifting raw degrees would stretch the park east to west.
 */
export function relocate(
  point: { lat: number; lng: number },
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): { lat: number; lng: number } {
  const north = (point.lat - from.lat) * METRES_PER_DEGREE;
  const east = (point.lng - from.lng) * METRES_PER_DEGREE * Math.cos(toRad(from.lat));
  return {
    lat: to.lat + north / METRES_PER_DEGREE,
    lng: to.lng + east / (METRES_PER_DEGREE * Math.cos(toRad(to.lat))),
  };
}

/** Words a shortened ride name does not end on: „Pirates of the…" says less than „Pirates…". */
const TRAILING_FILLERS = new Set(['the', 'of', 'and', 'a', 'der', 'die', 'das', 'de', 'la', 'le']);

/**
 * A ride's name short enough to stand next to its marker: „Chiapas" for „Chiapas - DIE
 * Wasserbahn", „Big Thunder…" for „Big Thunder Mountain". A subtitle or sponsor after a dash, colon
 * or comma goes first; a name still over `max` is cut at a word, dropping a trailing filler word.
 */
export function dialLabel(name: string, max = 14): string {
  let label = name.replace(/[™®©]/g, '').trim();
  label = label.split(/\s[-–—]\s|:\s|,\s/)[0].trim();
  if (label.length <= max) return label;
  const words = label.split(/\s+/);
  const kept: string[] = [];
  for (const word of words) {
    if ([...kept, word].join(' ').length > max) break;
    kept.push(word);
  }
  while (kept.length > 1 && TRAILING_FILLERS.has(kept[kept.length - 1].toLowerCase())) kept.pop();
  if (kept.length === 0) return `${label.slice(0, max - 1)}…`;
  return `${kept.join(' ')}…`;
}

/** A label's box on the dial, in the same units as the markers (x right, y down, from the centre). */
export interface LabelBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Where each marker's name goes, or `null` where there is no room.
 *
 * Map-pin labelling: each label tries the eight places around its marker, outward-facing first
 * (that is where the room is), and takes the first that covers no marker, no placed label and not
 * the centre, inside the face; then the same eight `reach` further out, joined by a hairline.
 * `order` decides who chooses first. A label with no place is left out rather than overlapped; the
 * bar under the dial names a tapped marker. `radius` per marker overrides `markerRadius`.
 */
export function placeLabels(
  markers: readonly { x: number; y: number; width: number; radius?: number }[],
  order: readonly number[],
  {
    markerRadius,
    height,
    gap,
    reach,
    face,
    centre,
  }: {
    markerRadius: number;
    height: number;
    gap: number;
    /** How much further out the second round of places sits. */
    reach: number;
    face: number;
    centre: number;
  }
): (LabelBox | null)[] {
  const placed: (LabelBox | null)[] = markers.map(() => null);
  const boxes: LabelBox[] = [];
  const overlaps = (a: LabelBox, b: LabelBox) =>
    a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
  const hitsCircle = (box: LabelBox, cx: number, cy: number, r: number) => {
    const nx = Math.max(box.x, Math.min(cx, box.x + box.width));
    const ny = Math.max(box.y, Math.min(cy, box.y + box.height));
    return Math.hypot(nx - cx, ny - cy) < r;
  };
  const insideFace = (box: LabelBox) =>
    [
      [box.x, box.y],
      [box.x + box.width, box.y],
      [box.x, box.y + box.height],
      [box.x + box.width, box.y + box.height],
    ].every(([px, py]) => Math.hypot(px, py) <= face);

  for (const i of order) {
    const m = markers[i];
    const own = m.radius ?? markerRadius;
    const w = m.width;
    const h = height;
    // The eight places beside the marker first, then the same eight one step further out.
    const candidates = [gap, gap + reach].flatMap((g) => {
      const off = own + g;
      const diag = own * 0.72 + g;
      return [
        { dx: 1, dy: 0, far: g, x: m.x + off, y: m.y - h / 2 },
        { dx: -1, dy: 0, far: g, x: m.x - off - w, y: m.y - h / 2 },
        { dx: 0, dy: 1, far: g, x: m.x - w / 2, y: m.y + off },
        { dx: 0, dy: -1, far: g, x: m.x - w / 2, y: m.y - off - h },
        { dx: 0.7, dy: 0.7, far: g, x: m.x + diag, y: m.y + diag },
        { dx: -0.7, dy: 0.7, far: g, x: m.x - diag - w, y: m.y + diag },
        { dx: 0.7, dy: -0.7, far: g, x: m.x + diag, y: m.y - diag - h },
        { dx: -0.7, dy: -0.7, far: g, x: m.x - diag - w, y: m.y - diag - h },
      ].map((c) => ({ ...c, width: w, height: h }));
    });
    const out = Math.hypot(m.x, m.y) || 1;
    candidates.sort(
      (a, b) => a.far - b.far || (b.dx * m.x + b.dy * m.y) / out - (a.dx * m.x + a.dy * m.y) / out
    );
    const fit = candidates.find(
      (box) =>
        insideFace(box) &&
        !hitsCircle(box, 0, 0, centre) &&
        !markers.some((o) => hitsCircle(box, o.x, o.y, o.radius ?? markerRadius)) &&
        !boxes.some((b) => overlaps(box, b))
    );
    if (fit) {
      const box = { x: fit.x, y: fit.y, width: w, height: h };
      placed[i] = box;
      boxes.push(box);
    }
  }
  return placed;
}

/**
 * The ride the reader is facing: the one whose bearing lies nearest the heading, within `reach`
 * degrees either side (the dial's view cone with a little give), or `null`.
 * `current` keeps its place until another is nearer by more than `hold` degrees or it leaves the
 * cone, so magnetometer jitter alone cannot trade the bar between two close rides.
 */
export function rideAhead(
  items: readonly { id: string; bearing: number | null }[],
  heading: number,
  current: string | null,
  { hold = 4, reach = 30 }: { hold?: number; reach?: number } = {}
): string | null {
  let best: { id: string; off: number } | null = null;
  let held: number | null = null;
  for (const { id, bearing } of items) {
    if (bearing === null) continue;
    const off = Math.abs(angleDelta(heading, bearing));
    if (id === current) held = off;
    if (!best || off < best.off) best = { id, off };
  }
  if (held !== null && held <= reach && best && held <= best.off + hold) return current;
  return best && best.off <= reach ? best.id : null;
}

/** The eight points of the compass, clockwise from north, as message keys. */
export const COMPASS_POINTS = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] as const;
/** One of the eight compass points. */
export type CompassPoint = (typeof COMPASS_POINTS)[number];

/** The point of the compass a bearing falls in, 45° each, north from 337.5° to 22.5°. */
export function compassPoint(bearing: number): CompassPoint {
  return COMPASS_POINTS[Math.round(normalizeDegrees(bearing) / 45) % 8];
}

/**
 * The rides nearest first, but a row only overtakes the one above it when it is nearer by more
 * than `tolerance` metres, so GPS jitter does not reorder rows (links) under the thumb. Starts from
 * the order last shown (`previous`); rides new to the list follow by distance.
 */
export function stableOrder<T extends { id: string; distance: number }>(
  items: readonly T[],
  previous: readonly string[],
  tolerance: number
): T[] {
  const rank = new Map(previous.map((id, i) => [id, i]));
  const list = [...items].sort((a, b) => {
    const ra = rank.get(a.id);
    const rb = rank.get(b.id);
    if (ra !== undefined && rb !== undefined) return ra - rb;
    if (ra !== undefined) return -1;
    if (rb !== undefined) return 1;
    return a.distance - b.distance;
  });
  for (let swapped = true; swapped;) {
    swapped = false;
    for (let i = 0; i < list.length - 1; i++) {
      if (list[i].distance - list[i + 1].distance > tolerance) {
        [list[i], list[i + 1]] = [list[i + 1], list[i]];
        swapped = true;
      }
    }
  }
  return list;
}
