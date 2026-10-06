import type { PlanDay } from '@/lib/api/types';
import { noLiveWaitTimesReason } from '@/lib/utils/live-wait-times';

/** The sentence an empty plan day shows: a `planner.unavailable.*` key and its ICU values. */
export interface UnavailableNote {
  key: string;
  values?: { days: number };
}

/**
 * What to tell the visitor when the API sent no ride curves for this day, or `null` when it sent
 * some. `no_wait_time_source` takes its wording from the park's own `noLiveWaitTimesReason`, so
 * the planner and the park page never disagree about why.
 */
export function unavailableNote(day: PlanDay | null | undefined): UnavailableNote | null {
  const unavailable = day?.ridesUnavailable;
  if (!day || !unavailable || day.rides.length > 0) return null;
  switch (unavailable.reason) {
    case 'no_wait_time_source':
      return {
        key: `no_wait_time_source.${noLiveWaitTimesReason(day.context) ?? 'unknown'}`,
      };
    case 'feed_stale':
      return typeof unavailable.staleDays === 'number' && unavailable.staleDays >= 1
        ? { key: 'feed_stale', values: { days: unavailable.staleDays } }
        : { key: 'feed_stale_unknown' };
    default:
      return { key: unavailable.reason };
  }
}
