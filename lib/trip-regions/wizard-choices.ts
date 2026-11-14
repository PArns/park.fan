import { legMinutes } from './hub-data';
import { findLeg } from './plan';
import type { TripBase, TripCalendarDay, TripLeg, TripRegion } from './types';

/**
 * The pure halves of the assistant's option steps (Hotel, Route, Hotels, Tempo, Abende): the day
 * patterns of the Tempo cards, the ways from a hotel area to the trip's parks, the schematic map of
 * a city's hotel areas, and the fact a travel day's card names. `scripts/test-wizard-choices.mjs`
 * pins them. docs/features/trip-planner/wizard.md#the-trip-planners-option-steps.
 */

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

/** A place on a schematic map: a hotel area or a park, by the API's coordinates. */
export interface MapPlace {
  key: string;
  latitude: number;
  longitude: number;
}

/** A place where the map draws it, in the box's own units, north up. */
export interface MapPoint {
  key: string;
  x: number;
  y: number;
}

/** The box a schematic map is drawn in, the room kept at its edge, and the least gap between two places. */
export interface MapBox {
  width: number;
  height: number;
  pad: number;
  gap: number;
}

/** Rounds of nudging before the map gives up on a gap; a city has at most a dozen places. */
const SPREAD_ROUNDS = 60;

/**
 * Places on a schematic map, no tiles: the coordinates projected flat (longitude by the cosine of
 * the middle latitude, north up), fitted into the box with `pad` at the edges and centred, then
 * nudged apart until no two are nearer than `gap`, so a cluster (Maihama and the DisneySea hotels a
 * kilometre apart beside Shinjuku twenty away) stays readable. Once nudged it is not to scale,
 * which is what schematic means here. The same places always land in the same spots.
 */
export function schematicMap(places: readonly MapPlace[], box: MapBox): MapPoint[] {
  if (places.length === 0) return [];
  const lats = places.map((p) => p.latitude);
  const midLat = ((Math.min(...lats) + Math.max(...lats)) / 2) * (Math.PI / 180);
  const flat = places.map((p) => ({
    key: p.key,
    x: p.longitude * Math.cos(midLat),
    y: -p.latitude,
  }));
  const xs = flat.map((p) => p.x);
  const ys = flat.map((p) => p.y);
  const [minX, minY] = [Math.min(...xs), Math.min(...ys)];
  const spanX = Math.max(...xs) - minX;
  const spanY = Math.max(...ys) - minY;
  const innerW = box.width - 2 * box.pad;
  const innerH = box.height - 2 * box.pad;
  const scale = Math.min(
    spanX > 0 ? innerW / spanX : Infinity,
    spanY > 0 ? innerH / spanY : Infinity
  );
  const k = Number.isFinite(scale) ? scale : 0;
  const offX = box.pad + (innerW - spanX * k) / 2;
  const offY = box.pad + (innerH - spanY * k) / 2;
  const points = flat.map((p) => ({
    key: p.key,
    x: offX + (p.x - minX) * k,
    y: offY + (p.y - minY) * k,
  }));
  spread(points, box);
  return points.map((p) => ({ key: p.key, x: round1(p.x), y: round1(p.y) }));
}

/** Push every pair nearer than the gap apart, half each, and keep them inside the padded box. */
function spread(points: MapPoint[], box: MapBox): void {
  const clamp = (v: number, max: number) => Math.min(max - box.pad, Math.max(box.pad, v));
  for (let round = 0; round < SPREAD_ROUNDS; round += 1) {
    let moved = false;
    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        const a = points[i];
        const b = points[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d = Math.hypot(dx, dy);
        if (d >= box.gap) continue;
        if (d < 1e-6) {
          // Two places on one spot part along a fixed angle per pair, so the result is stable.
          const angle = (i * 7 + j * 3) * 0.7;
          [dx, dy, d] = [Math.cos(angle), Math.sin(angle), 1];
        }
        const push = (box.gap - d) / 2 + 0.01;
        const [ux, uy] = [dx / d, dy / d];
        a.x = clamp(a.x - ux * push, box.width);
        a.y = clamp(a.y - uy * push, box.height);
        b.x = clamp(b.x + ux * push, box.width);
        b.y = clamp(b.y + uy * push, box.height);
        moved = true;
      }
    }
    if (!moved) return;
  }
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
