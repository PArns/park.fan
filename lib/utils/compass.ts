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
    const beta = event.beta ?? 0;
    const gamma = event.gamma ?? 0;
    // Held up towards upright, the top edge points at the sky and its heading stops meaning
    // anything; what the reader faces is where the back of the phone points (the W3C spec's
    // compass-heading formula). Below the threshold the two agree for a phone held level
    // side to side, so the hand-over does not jump. Portrait only: turned to landscape, the axes
    // the tilt is measured on are not the ones this reads.
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
 * Whether the magnetometer says itself that it is off. Safari reports its error in degrees and a
 * negative number when it is uncalibrated; next to the steel of a coaster that is common, and the
 * reader should be told to wave the phone in a figure eight rather than trust the arrow. Chrome
 * reports nothing, so `false` there.
 */
export function compassUnreliable(event: OrientationReading): boolean {
  const accuracy = event.webkitCompassAccuracy;
  return typeof accuracy === 'number' && (accuracy < 0 || accuracy > 25);
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

/**
 * The outer ring for a reader on the move: it grows at once when a ride falls outside it, and
 * shrinks only when the farthest ride is well inside the step below (three quarters of it).
 * Walking with the farthest ride near a step flipped the ring between 300 and 400 m every few
 * fixes, and every flip moved every marker.
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

/** Metres per degree of latitude (and of longitude on the equator), for {@link relocate}. */
const METRES_PER_DEGREE = 111_320;

/**
 * A point moved along with its park: where `point` would be if the park's `from` stood at `to`.
 *
 * The compass demo uses it to lay a real park out around the reader. The offset is carried in
 * METRES, east and north, not in degrees: a degree of longitude is 70 km at Phantasialand and
 * 111 km at the equator, so shifting the raw numbers from Brühl to Lisbon would stretch the park
 * east to west by a quarter. Over a park's few hundred metres the flat approximation is exact to
 * well under a metre.
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
 * A ride's name short enough to stand next to its marker on the dial: „Chiapas" for „Chiapas -
 * DIE Wasserbahn", „Autopia" for „Autopia, presented by Avis", „Big Thunder…" for „Big Thunder
 * Mountain". The list under the dial carries the full name.
 *
 * What comes after a dash, a colon or a comma is a subtitle or a sponsor and goes first; a name
 * still longer than `max` is cut at a word and gets an ellipsis, and a filler word left at the
 * end is dropped with it.
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
 * `radius` per marker, where markers differ in size (a closed ride's is a small ring); the shared
 * `markerRadius` otherwise.
 *
 * The way a map labels its pins: every label tries the eight places around its marker, the one
 * facing away from the centre first (rides spread outwards, so outwards is where the room is), and
 * takes the first that covers no marker, no label already placed and not the reader in the middle,
 * and stays inside the face. Where all eight are taken it tries them again `reach` further out;
 * the dial draws a hairline from every marker to its label, so a label a step away is still
 * plainly its marker's. `order` is who chooses first — the ride in focus, then the nearest —
 * and a label that finds no place is left out rather than laid over another: the bar under the
 * dial names any marker that is tapped.
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
    // The eight places right beside the marker first, then the same eight one step further out,
    // which the hairline to the label makes as readable as the near ones.
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
 * degrees either side; `null` when none is, or none has a bearing.
 *
 * `reach` is the view cone the dial draws (±26°) with a little give. Without it the bar said
 * „vor dir" about whichever ride was least far off, 116° off at Phantasialand facing south-west,
 * with its own arrow pointing backwards.
 *
 * `current` is the ride chosen the last time, and it keeps its place until another is nearer by
 * more than `hold` degrees, or it leaves the cone. Without that, two rides a few degrees apart
 * would trade the bar back and forth on the magnetometer's jitter alone, with the phone held
 * still; the caller also waits a moment before taking a change (see `ParkCompass`).
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
export type CompassPoint = (typeof COMPASS_POINTS)[number];

/** The point of the compass a bearing falls in, 45° each, north from 337.5° to 22.5°. */
export function compassPoint(bearing: number): CompassPoint {
  return COMPASS_POINTS[Math.round(normalizeDegrees(bearing) / 45) % 8];
}

/**
 * The rides nearest first, but a row only overtakes the one above it when it is nearer by more
 * than `tolerance` metres. A reader walking with GPS jitter of a few metres otherwise saw the
 * list reorder a quarter of the fixes, rows jumping under the thumb, and a row is a link.
 *
 * Starts from the order the reader last saw (`previous`; rides new to the list come after, by
 * distance) and lets rows bubble up past neighbours they are clearly nearer than.
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
