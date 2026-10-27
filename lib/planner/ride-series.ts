import type { PlanDayRide, PlanDayTier } from '@/lib/api/types';

/**
 * One ride's day on the minute axis: `/plan/day`'s quarter-hour `slots` where it sends them, its
 * `hours` where it does not. Every planner reader asks this module rather than `hours` directly,
 * so the slot-first rule and its hourly fallback live in one place. The contract is "The 15-minute
 * contract" in the API's docs/frontend/plan-day/slots-and-h5.md.
 */

/** The width of one `/plan/day` slot, in minutes. */
export const SLOT_MIN = 15;

/** One point of a ride's day: when it starts and what it is expected to cost. */
export interface RidePoint {
  /**
   * Park-local minute the point starts at, unfolded like `hours[].hour` (1440 is the midnight that
   * ends a late day). An hourly point starts on the hour and stands for all of it.
   */
  minute: number;
  /** Raw minutes: whole minutes from a slot, already on the five-minute grid from an hour. */
  wait: number;
  /** As `hours[].source`: set only where the point departs from the day's tier. */
  source?: PlanDayTier | null;
  /** How many minutes the point stands for: {@link SLOT_MIN} for a slot, 60 for an hour. */
  span: number;
}

interface SlotIndex {
  byMinute: Map<number, RidePoint>;
  /** Hours with at least one slot. Their missing quarter-hours have no value at all. */
  slottedHours: Set<number>;
  series: RidePoint[];
}

// Keyed on the ride object, so a new payload builds a new index and nothing can go stale.
const indexCache = new WeakMap<PlanDayRide, SlotIndex>();

function indexOf(ride: PlanDayRide): SlotIndex {
  const cached = indexCache.get(ride);
  if (cached) return cached;
  const byMinute = new Map<number, RidePoint>();
  const slottedHours = new Set<number>();
  for (const slot of ride.slots ?? []) {
    if (!Number.isFinite(slot.minute) || !Number.isFinite(slot.wait)) continue;
    byMinute.set(slot.minute, {
      minute: slot.minute,
      wait: slot.wait,
      source: slot.source,
      span: SLOT_MIN,
    });
    slottedHours.add(Math.floor(slot.minute / 60));
  }
  // An hour with no slot at all is read from `hours`; one with some slots is partly outside the
  // ride's window, and its hourly figure would invent the quarters that are missing.
  const series: RidePoint[] = [...byMinute.values()];
  for (const h of ride.hours) {
    if (slottedHours.has(h.hour)) continue;
    series.push({ minute: h.hour * 60, wait: h.wait, source: h.source, span: 60 });
  }
  series.sort((a, b) => a.minute - b.minute);
  const index = { byMinute, slottedHours, series };
  indexCache.set(ride, index);
  return index;
}

/** Whether `/plan/day` sent this ride a quarter-hour series. */
export function hasSlots(ride: PlanDayRide | null | undefined): boolean {
  return !!ride?.slots && ride.slots.length > 0;
}

/**
 * The ride's figure for the quarter hour `minute` falls in: the slot that starts there, or the
 * hour's figure where that hour has no slot at all. `null` where neither answers. Never
 * interpolated: the slots are already quarter-hours, and hours are already on the five grid.
 */
export function rideWaitAt(ride: PlanDayRide, minute: number): RidePoint | null {
  const hour = Math.floor(minute / 60);
  if (hasSlots(ride)) {
    const { byMinute, slottedHours } = indexOf(ride);
    const slot = byMinute.get(Math.floor(minute / SLOT_MIN) * SLOT_MIN);
    if (slot) return slot;
    if (slottedHours.has(hour)) return null;
  }
  const point = ride.hours.find((h) => h.hour === hour);
  return point ? { minute: hour * 60, wait: point.wait, source: point.source, span: 60 } : null;
}

/**
 * Whether `minute` falls in an hour the ride has quarter-hour slots for, but not in one of them —
 * e.g. the 17:30 and 17:45 quarters of a ride whose slots stop at 17:15 because it closes then.
 * That quarter is not a gap to fill with an assumption: the ride does not run there.
 */
export function isQuarterGap(ride: PlanDayRide, minute: number): boolean {
  if (!hasSlots(ride)) return false;
  const { byMinute, slottedHours } = indexOf(ride);
  return (
    !byMinute.has(Math.floor(minute / SLOT_MIN) * SLOT_MIN) &&
    slottedHours.has(Math.floor(minute / 60))
  );
}

/** Every point of the ride's day in minute order, slots where present and hours in their gaps. */
export function rideSeries(ride: PlanDayRide): readonly RidePoint[] {
  return indexOf(ride).series;
}

/** The first minute the ride has a figure for, or `undefined` for a ride with none. */
export function rideFirstMinute(ride: PlanDayRide | null | undefined): number | undefined {
  if (!ride) return undefined;
  return rideSeries(ride)[0]?.minute;
}
