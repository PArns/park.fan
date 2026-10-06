import { calculateDistance } from '@/lib/utils/distance-utils';
import { RIDE_DURATION_MIN, SNAP_MIN_FINE } from './day-grid';
import type { PlanDay, PlanDayRide } from '@/lib/api/types';
import type { PlannerEntry } from './types';

/**
 * What happens between two rides, and whether the plan survives it. Pure, and every constant that
 * is a judgement rather than a measurement says so.
 *
 * A straight-line distance is a provable lower bound on a walk and nothing more, so `broken`, the
 * only verdict that calls a plan impossible, is decided against the floor. Every softer verdict is
 * decided against an assumed ceiling, so the unmeasured detour factor can change how comfortable a
 * workable plan looks but never call it impossible.
 */

/** Out of the station, through the shop, onto the path. A judgement, not a measurement. */
export const EXIT_MIN = 3;

/** A brisk walker, metres per minute. Used ONLY for the floor: a lower bound divided by a typical pace is not a lower bound. */
export const WALK_FAST_M_PER_MIN = 100;

/** ~4 km/h — park pace, with crowds and pushchairs. Used only for the ceiling. */
export const WALK_PARK_M_PER_MIN = 67;

/**
 * Assumed worst path-to-straight-line ratio. A judgement, and **not measured for
 * any park in the catalogue**: 1.3–1.5 is the general pedestrian-network figure,
 * pushed to 1.6 because Phantasialand stacks Klugheim and Rookburgh vertically,
 * Rookburgh is one-way, and Chiapas makes some bearings unwalkable.
 */
export const DETOUR_MAX = 1.6;

/** Assumed ceiling with no coordinates at all, same land. A judgement. */
export const SAME_LAND_CEIL_MIN = 3;

/** …different land. A judgement. */
export const CROSS_LAND_CEIL_MIN = 8;

/** Under this a gap is never called "großzügig", however small the model's spread. */
export const GENEROUS_MIN_MINUTES = 10;

/** How a leg is graded: `broken` against the floor, the rest against the ceiling. */
export type TransferVerdict = 'broken' | 'tight' | 'good' | 'generous' | 'unknown';

/** One graded transfer between two consecutive entries. */
export interface Leg {
  /** Straight-line metres, or null where either ride has no coordinates. */
  metres: number | null;
  /** True when the two rides are in different lands — a free, independent signal. */
  crossesLand: boolean;
  /** Certifiable lower bound on the transfer, in minutes. */
  floorMinutes: number;
  /** Assumed upper bound. Every soft verdict is decided against this. */
  ceilingMinutes: number;
  /** Minutes actually available between the front of one queue and the start of the next. */
  gapMinutes: number;
  verdict: TransferVerdict;
  /** Why there is no verdict, when there is none. */
  missing: 'none' | 'no-wait' | 'no-spread';
}

/**
 * Where an end of a leg stands: a ride, or a show that has coordinates. Only position and land are
 * read; a show has no land, so it is never a cross-land transfer.
 */
export type LegPlace = Pick<PlanDayRide, 'latitude' | 'longitude' | 'land'>;

/** One side of a leg: when it starts, its expected wait and where it is. */
export interface LegEnd {
  startMinute: number;
  /** Expected wait, or null when the block carries no figure. */
  wait: number | null;
  ride: LegPlace | null | undefined;
  /** Curated ride duration in seconds, where one exists. */
  rideSeconds?: number | null;
  /** A show or a free block, not a ride. See {@link TransferEnds}. */
  block?: boolean;
}

function coordsOf(ride: LegPlace | null | undefined): [number, number] | null {
  const lat = ride?.latitude;
  const lng = ride?.longitude;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  return [lat, lng];
}

/**
 * Where an entry is, for the walk to it and from it: the ride's or the show's coordinates from
 * `/plan/day`, or `null`. A show without both coordinates and a free block have no place, and no
 * placeholder, since a guess may never feed the floor.
 */
export function entryPlace(
  day: PlanDay | null | undefined,
  entry: Pick<PlannerEntry, 'attractionSlug' | 'showSlug'>
): LegPlace | null {
  if (entry.attractionSlug) {
    return day?.rides.find((ride) => ride.attractionSlug === entry.attractionSlug) ?? null;
  }
  if (entry.showSlug) {
    const show = day?.shows?.find((s) => s.showSlug === entry.showSlug);
    const lat = show?.latitude;
    const lng = show?.longitude;
    // A finite pair on the globe. NaN or an out-of-range value would turn the
    // walk into NaN, where every comparison is false and the show is ignored.
    if (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lng) <= 180
    ) {
      return { latitude: lat, longitude: lng, land: null };
    }
  }
  return null;
}

/**
 * Which ends of a transfer are not rides: a show or a free block. Leaving one costs nothing (no
 * station, no ride); arriving at one from a ride still costs `EXIT_MIN` plus the ride. A block with
 * no position has no walk on either side. The optimiser, `clashCount()` and the chip read the same
 * numbers.
 */
export interface TransferEnds {
  fromBlock?: boolean;
  toBlock?: boolean;
}

/** True for an entry that is not a ride: a show, or a free block. */
export function isBlockEntry(entry: Pick<PlannerEntry, 'attractionSlug'>): boolean {
  return !entry.attractionSlug;
}

/** The geometry of a transfer, with no clock in it: distance and both bounds in minutes. */
export interface Transfer {
  /** Straight-line metres, or null where either ride has no coordinates. */
  metres: number | null;
  crossesLand: boolean;
  /** Certifiable lower bound on the transfer, in minutes. */
  floorMinutes: number;
  /** Assumed upper bound. */
  ceilingMinutes: number;
}

/**
 * How long it takes to get from one ride to the next, the geometry alone. Split from
 * {@link legBetween} because the optimiser builds against the ceiling while the chip judges against
 * both bounds, and the two must describe one walk in the same minutes.
 */
export function transferBetween(
  from: LegPlace | null | undefined,
  to: LegPlace | null | undefined,
  rideSeconds?: number | null,
  ends: TransferEnds = {}
): Transfer {
  // Leaving a block with no position: no station to leave, no ride, no walk.
  if (ends.fromBlock && !from) {
    return { metres: null, crossesLand: false, floorMinutes: 0, ceilingMinutes: 0 };
  }

  const a = coordsOf(from);
  const b = coordsOf(to);
  const metres = a && b ? calculateDistance(a[0], a[1], b[0], b[1]) : null;

  const fromLand = from?.land ?? null;
  const toLand = to?.land ?? null;
  const crossesLand = Boolean(fromLand && toLand && fromLand !== toLand);

  const rideMin =
    typeof rideSeconds === 'number' && rideSeconds > 0
      ? Math.ceil(rideSeconds / 60)
      : RIDE_DURATION_MIN;

  // No coordinates → the floor's walk term is ZERO, so a guess can never produce
  // the one verdict that calls a plan impossible.
  const walkFloorMin = metres === null ? 0 : Math.ceil(metres / WALK_FAST_M_PER_MIN);
  const walkCeilMin =
    metres === null
      ? crossesLand
        ? CROSS_LAND_CEIL_MIN
        : SAME_LAND_CEIL_MIN
      : Math.ceil((metres * DETOUR_MAX) / WALK_PARK_M_PER_MIN);

  const leaving = ends.fromBlock ? 0 : EXIT_MIN + rideMin;

  // Walking to a block with no position: the visitor still leaves the ride, but
  // there is no walk to count, so both bounds are what leaving costs.
  if (ends.toBlock && !to) {
    return { metres: null, crossesLand: false, floorMinutes: leaving, ceilingMinutes: leaving };
  }

  return {
    metres,
    crossesLand,
    floorMinutes: leaving + walkFloorMin,
    ceilingMinutes: leaving + walkCeilMin,
  };
}

/**
 * The transfer between two consecutive entries.
 *
 * The previous ride's `uncertaintyMinutes` decides where "knapp" begins, so `knapp` means "this
 * breaks if the forecast is as wrong as it says it might be". On a day the optimiser just packed
 * the ladder mostly reports the packing, and that is not the threshold's fault. See
 * docs/features/trip-planner.md#the-leg-chip-judges-against-what-the-search-builds-against.
 *
 * `observed` means the waits are measurements: a missing spread caps a forecast at "gut", but on a
 * day that already happened the gap is a fact and runs the full ladder.
 */
export function legBetween(
  from: LegEnd,
  to: LegEnd,
  uncertaintyMinutes: number | null,
  observed = false
): Leg {
  const { metres, crossesLand, floorMinutes, ceilingMinutes } = transferBetween(
    from.ride,
    to.ride,
    from.rideSeconds,
    { fromBlock: from.block, toBlock: to.block }
  );

  const base = { metres, crossesLand, floorMinutes, ceilingMinutes };

  // With no wait for the first ride there is no moment it ends, so nothing to judge.
  if (from.wait === null) {
    return {
      ...base,
      gapMinutes: to.startMinute - from.startMinute,
      verdict: 'unknown',
      missing: 'no-wait',
    };
  }

  const gapMinutes = to.startMinute - (from.startMinute + from.wait);
  const slack = gapMinutes - ceilingMinutes;

  if (gapMinutes < floorMinutes) {
    return { ...base, gapMinutes, verdict: 'broken', missing: 'none' };
  }

  // A measured day runs the full ladder against a spread of zero.
  if (observed) {
    return {
      ...base,
      gapMinutes,
      verdict: slack < 0 ? 'tight' : slack < GENEROUS_MIN_MINUTES ? 'good' : 'generous',
      missing: 'none',
    };
  }

  // No spread reported is not a spread of zero. The ladder caps at `good`: "großzügig" is a claim
  // about the room the forecast's own error leaves.
  if (uncertaintyMinutes === null) {
    return {
      ...base,
      gapMinutes,
      verdict: slack < 0 ? 'tight' : 'good',
      missing: 'no-spread',
    };
  }

  if (slack < uncertaintyMinutes) {
    return { ...base, gapMinutes, verdict: 'tight', missing: 'none' };
  }
  if (slack < Math.max(2 * uncertaintyMinutes, GENEROUS_MIN_MINUTES)) {
    return { ...base, gapMinutes, verdict: 'good', missing: 'none' };
  }
  return { ...base, gapMinutes, verdict: 'generous', missing: 'none' };
}

/**
 * The earliest start for the later ride that clears the transfer, snapped up, never down. Offered
 * on a button and never applied on its own, so the visitor sees that the plan did not work.
 */
export function earliestGoodStart(from: LegEnd, leg: Leg): number {
  const end = from.startMinute + (from.wait ?? 0);
  // A ceiling, not `snapTo`, which rounds to the nearest step; "+ step - 1" overshoots by a step
  // once the target is past the midpoint.
  return Math.ceil((end + leg.ceilingMinutes) / SNAP_MIN_FINE) * SNAP_MIN_FINE;
}

/**
 * Minutes of shortfall on a broken leg — what a reader is told is missing.
 *
 * Against the FLOOR, matching the verdict: the deficit a `broken` verdict
 * asserts is the one that is certifiable.
 */
export function legDeficit(leg: Leg): number {
  return Math.max(0, leg.floorMinutes - leg.gapMinutes);
}
