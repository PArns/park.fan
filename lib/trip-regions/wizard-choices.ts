import { findLeg, legMinutes } from './hub-data';
import { earlyPerk } from './plan-copy';
import type { TripBase, TripCalendarDay, TripHotel, TripLeg, TripRegion } from './types';

/**
 * The pure halves of the assistant's option steps (Hotel, Route, Hotels, Tempo, Abende): what the
 * Hotel step says of getting in early, the day patterns of the Tempo cards, the ways from a hotel area to the trip's parks, the box and the markers of the map of
 * a city's hotel areas, and the fact a travel day's card names. `scripts/test-wizard-choices.mjs`
 * pins them. docs/features/trip-planner/wizard.md#the-trip-planners-option-steps.
 */

/** What the Hotel step says of getting in early, from the region's perk data. */
export interface HotelEarlyAccess {
  /** The lead over the cards: a hotel that gets you in early (`early`), or none here (`none`). */
  lead: 'early' | 'none';
  /** The hotel kinds whose guests get an early slot; every other card says it has none. */
  early: ReadonlySet<string>;
}

/**
 * What the Hotel step says of getting in early, from the region's `hotels[].perks`: the lead
 * promises an earlier start only where some hotel has an early slot, and a card without one says so
 * itself, so the two read the same data and cannot disagree (Disneyland's hotels have none). `null`
 * without the data, and the step then claims nothing either way.
 */
export function hotelEarlyAccess(
  hotels: readonly Pick<TripHotel, 'key' | 'perks'>[] | undefined
): HotelEarlyAccess | null {
  if (!hotels?.length) return null;
  const early = new Set(hotels.filter((h) => earlyPerk(h.perks) !== null).map((h) => h.key));
  return { lead: early.size > 0 ? 'early' : 'none', early };
}

/**
 * The park days in a row the API's automatic rest rule allows, the number
 * `tripPlanner.options.restAutoHint` says in words.
 */
export const AUTO_REST_STREAK = 4;

/** The streak the own limit starts on when the visitor picks it. */
export const DEFAULT_REST_STREAK = 3;

/** The days a Tempo card's pattern draws: one week of the trip. */
export const PACE_PATTERN_DAYS = 7;

/**
 * A Tempo card's picture of a week: `true` a park day, `false` a rest day. `streak` park days in a
 * row and then one rest day, over and over; `null` has no rest day at all.
 */
export function pacePattern(streak: number | null, days = PACE_PATTERN_DAYS): boolean[] {
  return Array.from({ length: days }, (_, i) => streak === null || (i + 1) % (streak + 1) !== 0);
}

/** The streak a `rest=` value holds: `max:3` is 3, `auto` and `none` are `null`. */
export function restStreak(rest: string): number | null {
  if (!rest.startsWith('max:')) return null;
  const n = Number(rest.slice(4));
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * A city with at most this many hotel areas offers them as chips; with more, each is a card with its
 * ways and the city gets the schematic map (Tokyo's six, Orlando's five, Osaka's four as chips).
 */
export const AREA_CHIPS_MAX = 4;

/** An area card lists one way per park up to this many; past it, one per resort. */
export const MAX_AREA_WAYS = 4;

/** A park joins a city's map when one of its hotel areas reaches it in at most this many minutes. */
export const MAP_PARK_MINUTES = 60;

/** One line of an area card: how far a park, or the parks of one resort, are from the area. */
export interface AreaWay {
  /** The park's slug, or with `group` the resort group's key. */
  to: string;
  group: boolean;
  /** Door to door (`legMinutes`); for a resort its nearest park. */
  minutes: number;
  /** A resort's farthest park; equal to `minutes` for one park. */
  maxMinutes: number;
  /** The leg's mode; `null` for a resort whose parks are reached in different ways. */
  mode: TripLeg['mode'] | null;
}

/**
 * The ways from a hotel area to the trip's parks, from the region's `travel.legs`
 * (`hotel:<area>`), nearest first. A park without a leg from the area is left out. With more than
 * {@link MAX_AREA_WAYS} parks, the parks of a resort are one line with the nearest and the farthest
 * minutes, so Orlando's seven headliners read as Walt Disney World and Universal Orlando.
 */
export function areaWays(
  region: Pick<TripRegion, 'travel' | 'parks'>,
  area: string,
  parks: readonly string[]
): AreaWay[] {
  const ways: AreaWay[] = [];
  for (const slug of parks) {
    const leg = findLeg(region.travel.legs, `hotel:${area}`, slug);
    if (!leg) continue;
    const minutes = legMinutes(leg);
    ways.push({ to: slug, group: false, minutes, maxMinutes: minutes, mode: leg.mode });
  }
  const nearest = (a: AreaWay, b: AreaWay) => a.minutes - b.minutes;
  if (ways.length <= MAX_AREA_WAYS) return ways.sort(nearest);
  const groupOf = new Map(region.parks.map((p) => [p.slug, p.group]));
  const byGroup = new Map<string, AreaWay>();
  for (const way of ways) {
    const key = groupOf.get(way.to) ?? way.to;
    const seen = byGroup.get(key);
    if (!seen) {
      byGroup.set(key, { ...way, to: key, group: true });
      continue;
    }
    seen.minutes = Math.min(seen.minutes, way.minutes);
    seen.maxMinutes = Math.max(seen.maxMinutes, way.maxMinutes);
    if (seen.mode !== way.mode) seen.mode = null;
  }
  return [...byGroup.values()].sort(nearest);
}

/**
 * The parks a city's map shows: those of `parks` that one of its `areas` reaches within
 * {@link MAP_PARK_MINUTES}. A day trip (Fuji-Q from Tokyo) stays off, so the map keeps the city's
 * scale; its card still names the way.
 */
export function mapParks(
  region: Pick<TripRegion, 'travel'>,
  areas: readonly string[],
  parks: readonly string[]
): string[] {
  return parks.filter((slug) =>
    areas.some((area) => {
      const leg = findLeg(region.travel.legs, `hotel:${area}`, slug);
      return leg !== null && legMinutes(leg) <= MAP_PARK_MINUTES;
    })
  );
}

/**
 * The cities a trip will most likely sleep in before its plan has answered: for each of `parks` the
 * base that reaches it soonest (`bases[].parks`), in the region's order. The Hotels step asks about
 * these while the plan loads or when it failed, instead of showing nothing.
 */
export function homeBases(bases: readonly TripBase[], parks: readonly string[]): string[] {
  const homes = new Set<string>();
  for (const slug of parks) {
    let best: { key: string; minutes: number } | null = null;
    for (const base of bases) {
      const minutes = base.parks.find((p) => p.slug === slug)?.minutes;
      if (minutes !== undefined && (best === null || minutes < best.minutes)) {
        best = { key: base.key, minutes };
      }
    }
    if (best) homes.add(best.key);
  }
  return bases.filter((b) => homes.has(b.key)).map((b) => b.key);
}

/** A place on the area map, by the API's coordinates: a hotel area or a park. */
export interface MapPlace {
  key: string;
  latitude: number;
  longitude: number;
}

/**
 * A marker on the area map, in pixels from the map's top left corner as the map projected it,
 * with half its size (the room nobody else may take) and, for a place that carries one, the size
 * of its label.
 */
export interface MapMarker {
  key: string;
  x: number;
  y: number;
  radius: number;
  label?: { width: number; height: number };
}

/** A marker where the map draws it once nudged clear of its neighbours. */
export interface MapPoint {
  key: string;
  x: number;
  y: number;
  radius: number;
}

/**
 * A label where the map draws it: the centre of its box, and whether it stands away from its marker
 * and needs a line back to it.
 */
export interface MapLabel {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  leader: boolean;
}

/** The room the area map may take: the width it has, the heights it keeps to, the margin inside. */
export interface MapFrame {
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  /** Kept free at every edge, so a marker and its label stay inside. */
  pad: number;
}

/** The least room between two markers, beyond their radii. */
const MARKER_GAP = 4;

/** The room between a marker and its label. */
const LABEL_GAP = 3;

/** How far a label may stand off before its candidates run out; it then gets a leader line. */
const LEADER_STEP = 16;

/** Rounds of nudging before the map gives up on a gap; a city has at most a dozen places. */
const SPREAD_ROUNDS = 80;

/** A map is never narrower than this, so a city laid out north to south still has room for labels. */
const MIN_MAP_WIDTH = 180;

/**
 * The box the area map is reserved and drawn in, from the places it shows: as tall as their
 * bounding box asks at the full width (longitude by the cosine of the middle latitude, north up,
 * `pad` at the edges), within `minHeight` and `maxHeight`, and only as wide as the places need at
 * that height. A city that runs north to south (Orlando) gets a narrow map that stands beside the
 * cards at a desk; one that runs west to east (Tokyo) takes the full width. The tiles then fit the
 * same bounds inside it.
 */
export function mapBoxSize(
  places: readonly MapPlace[],
  frame: MapFrame
): { width: number; height: number } {
  if (places.length === 0) return { width: 0, height: 0 };
  const lats = places.map((p) => p.latitude);
  const midLat = ((Math.min(...lats) + Math.max(...lats)) / 2) * (Math.PI / 180);
  const xs = places.map((p) => p.longitude * Math.cos(midLat));
  const spanX = Math.max(...xs) - Math.min(...xs);
  const spanY = Math.max(...lats) - Math.min(...lats);
  const pad = frame.pad;
  const fullInner = frame.maxWidth - 2 * pad;
  const wanted =
    spanX > 0
      ? fullInner * (spanY / spanX) + 2 * pad
      : spanY > 0
        ? frame.maxHeight
        : frame.minHeight;
  const height = Math.min(frame.maxHeight, Math.max(frame.minHeight, wanted));
  const scale = Math.min(
    spanX > 0 ? fullInner / spanX : Infinity,
    spanY > 0 ? (height - 2 * pad) / spanY : Infinity
  );
  const k = Number.isFinite(scale) ? scale : 0;
  const width = Math.min(
    frame.maxWidth,
    Math.max(Math.min(frame.maxWidth, MIN_MAP_WIDTH), spanX * k + 2 * pad)
  );
  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * The markers of the area map kept apart and their labels placed, in the pixels the map projected
 * them to. Markers nearer than their radii are nudged apart, half each, inside the map (the
 * Disney hotels sit a kilometre from EPCOT, a few pixels at the zoom that shows all of Orlando).
 * Each label then takes the first of eight spots around its marker (below, above, right, left, the
 * corners) that stays inside the map and clear of every marker and every label placed before it,
 * else the same a step further out with a leader line, else the spot that covers least. Markers
 * never move for a label. The same markers always give the same result.
 */
export function declutterMap(
  markers: readonly MapMarker[],
  width: number,
  height: number
): { points: MapPoint[]; labels: MapLabel[] } {
  const points: MapPoint[] = markers.map(({ key, x, y, radius }) => ({ key, x, y, radius }));
  spread(points, width, height);
  const rounded = points.map((p) => ({ ...p, x: round1(p.x), y: round1(p.y) }));
  return { points: rounded, labels: placeLabels(markers, rounded, width, height) };
}

/** Push every pair of markers nearer than their radii apart, half each, inside the map. */
function spread(points: MapPoint[], width: number, height: number): void {
  const clamp = (v: number, r: number, max: number) => Math.min(max - r - 1, Math.max(r + 1, v));
  for (let round = 0; round < SPREAD_ROUNDS; round += 1) {
    let moved = false;
    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        const a = points[i];
        const b = points[j];
        const gap = a.radius + b.radius + MARKER_GAP;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d = Math.hypot(dx, dy);
        if (d >= gap) continue;
        if (d < 1e-6) {
          // Two places on one spot part along a fixed angle per pair, so the result is stable.
          const angle = (i * 7 + j * 3) * 0.7;
          [dx, dy, d] = [Math.cos(angle), Math.sin(angle), 1];
        }
        const push = (gap - d) / 2 + 0.01;
        const [ux, uy] = [dx / d, dy / d];
        a.x = clamp(a.x - ux * push, a.radius, width);
        a.y = clamp(a.y - uy * push, a.radius, height);
        b.x = clamp(b.x + ux * push, b.radius, width);
        b.y = clamp(b.y + uy * push, b.radius, height);
        moved = true;
      }
    }
    if (!moved) return;
  }
}

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const overlap = (a: Box, b: Box): number =>
  Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
  Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

const boxAt = (x: number, y: number, w: number, h: number): Box => ({
  left: x - w / 2,
  top: y - h / 2,
  right: x + w / 2,
  bottom: y + h / 2,
});

/** Where a label may stand around its marker, nearest first: below, above, right, left, corners. */
function labelSpots(point: MapPoint, w: number, h: number, ring: number) {
  const r = point.radius + LABEL_GAP + ring * LEADER_STEP;
  const [dx, dy] = [r + w / 2, r + h / 2];
  return [
    [0, dy],
    [0, -dy],
    [dx, 0],
    [-dx, 0],
    [dx, dy],
    [-dx, dy],
    [dx, -dy],
    [-dx, -dy],
  ].map(([x, y]) => ({ x: point.x + x, y: point.y + y }));
}

/** Each label in the first clear spot of the nearer ring, then of the outer one, else the least bad. */
function placeLabels(
  markers: readonly MapMarker[],
  points: readonly MapPoint[],
  width: number,
  height: number
): MapLabel[] {
  const obstacles: Box[] = points.map((p) => boxAt(p.x, p.y, 2 * p.radius, 2 * p.radius));
  const labels: MapLabel[] = [];
  markers.forEach((marker, i) => {
    if (!marker.label) return;
    const { width: w, height: h } = marker.label;
    let best: { x: number; y: number; ring: number; cost: number } | null = null;
    for (const ring of [0, 1]) {
      for (const spot of labelSpots(points[i], w, h, ring)) {
        const box = boxAt(spot.x, spot.y, w, h);
        const outside =
          Math.max(0, -box.left) +
          Math.max(0, box.right - width) +
          Math.max(0, -box.top) +
          Math.max(0, box.bottom - height);
        const cost =
          outside * 1000 + obstacles.reduce((sum, other) => sum + overlap(box, other), 0);
        if (best === null || cost < best.cost) best = { ...spot, ring, cost };
        if (cost === 0) break;
      }
      if (best && best.cost === 0) break;
    }
    if (!best) return;
    obstacles.push(boxAt(best.x, best.y, w, h));
    labels.push({
      key: marker.key,
      x: round1(best.x),
      y: round1(best.y),
      width: w,
      height: h,
      leader: best.ring > 0,
    });
  });
  return labels;
}

const round1 = (v: number) => Math.round(v * 10) / 10;

/** What a travel day's card can say of the parks that day: one park and its time. */
export interface TravelDayFact {
  slug: string;
  /** The close (arrival) or the opening (departure), park-local ISO as the calendar sends it. */
  at: string;
}

/**
 * The fact the Tempo step puts on the card of a park on a travel day, from the calendar's day: on
 * the arrival the park among `parks` open that day that closes last (a late landing still has an
 * evening there), on the departure the one that opens first. `null` where no park has published
 * hours that day, and the card keeps its plain sentence.
 */
export function travelDayFact(
  day: Pick<TripCalendarDay, 'parks'> | undefined,
  parks: readonly string[],
  end: 'arrival' | 'departure'
): TravelDayFact | null {
  if (!day) return null;
  let best: TravelDayFact | null = null;
  for (const slug of parks) {
    const park = day.parks[slug];
    if (park?.status !== 'OPERATING' || !park.hoursPublished) continue;
    const at = end === 'arrival' ? park.closesAt : park.opensAt;
    const ms = Date.parse(at ?? '');
    if (!at || !Number.isFinite(ms)) continue;
    const bestMs = best ? Date.parse(best.at) : null;
    if (bestMs === null || (end === 'arrival' ? ms > bestMs : ms < bestMs)) best = { slug, at };
  }
  return best;
}
