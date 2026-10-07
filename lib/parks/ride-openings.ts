import { opensAtMinute } from '@/lib/planner/day-grid';
import { formatGridTime, parkMinuteNow } from '@/lib/planner/park-time';
import type { PlanDay, ScheduleItem } from '@/lib/api/types';

/** What the park page says about one ride that starts after its park. */
export interface RideOpening {
  /** Park-local `HH:mm`, as `formatGridTime` prints it. */
  time: string;
  /** Park-local minutes since midnight. */
  minute: number;
  /** `high` is printed as a fact, everything else as „ca.". */
  firm: boolean;
}

/** The park's early-entry window: minutes only where the API has a value. */
export interface ParkEarlyEntry {
  minutes: number | null;
}

/** Today's plan, cut down to what the park page prints. */
export interface ParkOpenings {
  /** Park-local minute the gates open today, from the schedule. `null` where it is not known. */
  parkOpenMin: number | null;
  earlyEntry: ParkEarlyEntry | null;
  rides: ReadonlyMap<string, RideOpening>;
}

/**
 * Park-local minute the gates open on `todayIso`, from the park's own schedule. Not
 * `context.openHour`, which is the hour the opening falls in: against it a park opening at 10:30
 * would call every ride with `opensAt` 10:30 a late starter. `null` without an operating entry.
 */
export function parkOpenMinute(
  schedule: readonly ScheduleItem[] | null | undefined,
  todayIso: string,
  timezone: string
): number | null {
  const today = schedule?.find((s) => s.date === todayIso && s.scheduleType === 'OPERATING');
  if (!today?.openingTime) return null;
  const ms = Date.parse(today.openingTime);
  return Number.isNaN(ms) ? null : parkMinuteNow(timezone, ms);
}

/**
 * The rides of a plan that start after the park, by slug, and the park's early entry. A ride
 * without `opensAt` is absent from the map: the API sends it only where it knows, so a missing
 * value is „unknown", never „opens with the park". Needs the park's opening, so without it the map
 * is empty rather than guessed.
 */
export function parkOpeningsFromPlan(
  plan: PlanDay | null | undefined,
  parkOpenMin: number | null
): ParkOpenings {
  const rides = new Map<string, RideOpening>();
  if (plan && parkOpenMin !== null) {
    for (const ride of plan.rides) {
      const minute = opensAtMinute(ride.opensAt);
      if (minute === null || minute <= parkOpenMin) continue;
      rides.set(ride.attractionSlug, {
        time: formatGridTime(minute),
        minute,
        firm: ride.opensAtConfidence === 'high',
      });
    }
  }
  const ctx = plan?.context;
  return {
    parkOpenMin,
    earlyEntry:
      ctx?.hasEarlyEntry === true
        ? {
            minutes:
              typeof ctx.earlyEntryMinutesPeak === 'number' && ctx.earlyEntryMinutesPeak > 0
                ? ctx.earlyEntryMinutesPeak
                : null,
          }
        : null,
    rides,
  };
}

/**
 * Whether the line „öffnet ca. HH:mm" still tells the truth: only before that minute. After it, a
 * ride that still reads CLOSED is shut for some other reason, and the line would promise an
 * opening that has already passed.
 */
export function isOpeningAhead(opening: RideOpening, nowMinute: number): boolean {
  return nowMinute < opening.minute;
}
