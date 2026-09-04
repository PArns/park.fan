import { calculateDistance } from '@/lib/utils/distance-utils';
import { SNAP_MIN_FINE } from './day-grid';
import type { PlanDayRide } from '@/lib/api/types';

/**
 * What happens between two rides, and whether the plan survives it.
 *
 * This is the thing a wait-time feed cannot say: not "the queue is 45 minutes"
 * but "you will not make it from here to there". Everything in this module is
 * pure and every constant that is a judgement rather than a measurement says so
 * in its own docstring, because that word has to reach the reader too.
 *
 * The whole design rests on one asymmetry. A straight-line distance is a
 * provable LOWER BOUND on a walk and nothing more — park paths bend around
 * water, queues, one-way routing and, at Phantasialand, vertical stacking. So
 * `broken` — the only verdict that calls a plan impossible — is decided against
 * the floor, where the claim is certifiable. Every softer verdict is decided
 * against an assumed ceiling, so the unmeasured detour factor can only ever make
 * a workable plan look more or less comfortable. It can never call a workable
 * plan impossible.
 */

/** Out of the station, through the shop, onto the path. A judgement, not a measurement. */
export const EXIT_MIN = 3;

/**
 * Boarding plus the ride where no duration is known — which is 95 % of the
 * catalogue. A judgement, not a measurement; it is an allowance named as one in
 * the chip's title and it is never drawn as a height.
 */
export const RIDE_FALLBACK_MIN = 3;

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

export type TransferVerdict = 'broken' | 'tight' | 'good' | 'generous' | 'unknown';

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

export interface LegEnd {
  startMinute: number;
  /** Expected wait, or null when the block carries no figure. */
  wait: number | null;
  ride: PlanDayRide | null | undefined;
  /** Curated ride duration in seconds, where one exists. */
  rideSeconds?: number | null;
}

function coordsOf(ride: PlanDayRide | null | undefined): [number, number] | null {
  const lat = ride?.latitude;
  const lng = ride?.longitude;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  return [lat, lng];
}

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
 * How long it takes to get from one ride to the next — the geometry alone,
 * with no clock in it.
 *
 * Split out of {@link legBetween} because the optimiser BUILDS against the
 * ceiling while the leg chip JUDGES against both bounds, and two copies of this
 * arithmetic would be two answers to one question — the plan and the chip
 * describing the same walk in different minutes. `legBetween` is unchanged: it
 * calls this and then does the part that needs a start time.
 */
export function transferBetween(
  from: PlanDayRide | null | undefined,
  to: PlanDayRide | null | undefined,
  rideSeconds?: number | null
): Transfer {
  const a = coordsOf(from);
  const b = coordsOf(to);
  const metres = a && b ? calculateDistance(a[0], a[1], b[0], b[1]) : null;

  const fromLand = from?.land ?? null;
  const toLand = to?.land ?? null;
  const crossesLand = Boolean(fromLand && toLand && fromLand !== toLand);

  const rideMin =
    typeof rideSeconds === 'number' && rideSeconds > 0
      ? Math.ceil(rideSeconds / 60)
      : RIDE_FALLBACK_MIN;

  // No coordinates → the floor's walk term is ZERO, so a guess can never produce
  // the one verdict that calls a plan impossible.
  const walkFloorMin = metres === null ? 0 : Math.ceil(metres / WALK_FAST_M_PER_MIN);
  const walkCeilMin =
    metres === null
      ? crossesLand
        ? CROSS_LAND_CEIL_MIN
        : SAME_LAND_CEIL_MIN
      : Math.ceil((metres * DETOUR_MAX) / WALK_PARK_M_PER_MIN);

  return {
    metres,
    crossesLand,
    floorMinutes: EXIT_MIN + rideMin + walkFloorMin,
    ceilingMinutes: EXIT_MIN + rideMin + walkCeilMin,
  };
}

/**
 * The transfer between two consecutive entries.
 *
 * `uncertaintyMinutes` is the previous ride's own spread, and it is what decides
 * where "knapp" begins: the boundary is the model's own top-quantile-minus-median
 * rather than a number somebody picked, so `knapp` means precisely "this breaks
 * if the forecast is as wrong as it says it might be".
 *
 * `observed` says the waits are MEASUREMENTS rather than predictions, and it
 * changes what a missing spread means. On a forecast, no spread is a gap in what
 * the model reported and the ladder caps at "gut" — "großzügig" is a claim about
 * how much room the forecast's own error leaves, and without an error there is
 * nothing to be generous about. On a day that already happened there is no
 * forecast error to leave room for: the gap is a fact. Capping it would
 * understate every leg of every past day, and the `°` the chip carries would
 * flag an absence that is the nature of the thing rather than a shortcoming.
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
    from.rideSeconds
  );

  const base = { metres, crossesLand, floorMinutes, ceilingMinutes };

  // Nothing to be tight against: with no wait for the first ride there is no
  // moment it ends, so there is no transfer to judge.
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

  // A measured day runs the full ladder against a spread of zero: there is no
  // forecast error, so every minute of slack is real slack.
  if (observed) {
    return {
      ...base,
      gapMinutes,
      verdict: slack < 0 ? 'tight' : slack < GENEROUS_MIN_MINUTES ? 'good' : 'generous',
      missing: 'none',
    };
  }

  // No spread reported is not a spread of zero. The ladder caps at `good`:
  // "großzügig" is a claim about how much room the forecast's own error leaves,
  // and without an error there is nothing to be generous about.
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
 * The earliest start for the later ride that clears the transfer.
 *
 * Snapped UP, never down: rounding a repair toward the problem it repairs would
 * leave it broken. Offered on a button and never applied on its own — a plan
 * that quietly fixes itself never shows the visitor that it did not work, and
 * that sentence is the product.
 */
export function earliestGoodStart(from: LegEnd, leg: Leg): number {
  const end = from.startMinute + (from.wait ?? 0);
  // A CEILING, not `snapTo`. `snapTo` rounds to the nearest step, and the
  // "+ step - 1" trick that turns a round into a ceiling for integers overshoots
  // by a whole step whenever the target already sits past the midpoint — 654
  // came out as 675 instead of 660, a quarter of an hour of a visitor's day
  // given away by an off-by-one in a repair button.
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
