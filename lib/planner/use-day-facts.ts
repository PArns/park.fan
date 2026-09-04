'use client';

import { useMemo } from 'react';
import { useParkBestDaysCalendar } from '@/lib/hooks/use-park-best-days-calendar';
import type { CalendarDay } from '@/lib/api/types';
import type { PlannerGeo } from './types';

export interface PlannerDayFacts {
  /** What the park's own forecast says about each day it reaches. */
  byDate: ReadonlyMap<string, CalendarDay>;
  /** The last day the snapshot covers, or `null` while it has not arrived. */
  lastDate: string | null;
  /**
   * The park's IANA zone, straight out of the snapshot's `meta`.
   *
   * The reason this hook returns it at all: a park added from the planner's own
   * search arrives with no zone (the search payload has none), and until now the
   * only other source was `/plan/day` — which answers 404 until the backend
   * ships. So the planner reckoned that park's dates in the READER's zone, which
   * is the wrong day for a Florida park planned from Germany after 18:00.
   */
  timezone: string | null;
  /**
   * False where the park publishes no opening hours at all. A statement about
   * the PARK, so it is worth saying out loud before somebody plans a day at it.
   */
  hasOperatingSchedule: boolean | null;
  loading: boolean;
}

const EMPTY: ReadonlyMap<string, CalendarDay> = new Map();

/**
 * What we already know about this park's next three months.
 *
 * The park's **best-days snapshot**, which is the cheap one: ~15 KB of status,
 * crowd level, hours and holiday flags per day, materialized by the backend and
 * CDN-cached — as against `/calendar`, which computes percentiles per day and
 * takes seconds cold. Ninety days, which is what sets the calendar's own
 * horizon: past the snapshot every cell would be a bare number.
 *
 * The query key is the park page's own, so on a park page this is a cache hit
 * rather than a second request — and it keeps that page's loading-priority
 * requirement, because the shared hook is gated on `useLoadLast` (see
 * `docs/architecture/system-overview.md` → park page loading priority).
 */
export function usePlannerDayFacts(
  park: { slug: string; geo: PlannerGeo } | null,
  enabled: boolean
): PlannerDayFacts {
  const { data, isFetching } = useParkBestDaysCalendar({
    continent: park?.geo.continent ?? '',
    country: park?.geo.country ?? '',
    city: park?.geo.city ?? '',
    parkSlug: park?.slug ?? '',
    enabled: enabled && Boolean(park),
  });

  return useMemo(() => {
    const meta = data?.meta;
    const timezone = typeof meta?.timezone === 'string' ? meta.timezone : null;
    const hasOperatingSchedule =
      typeof meta?.hasOperatingSchedule === 'boolean' ? meta.hasOperatingSchedule : null;

    if (!data?.days?.length) {
      return {
        byDate: EMPTY,
        lastDate: null,
        timezone,
        hasOperatingSchedule,
        loading: isFetching,
      };
    }
    const byDate = new Map<string, CalendarDay>();
    for (const day of data.days) byDate.set(day.date, day);
    // The snapshot is ordered, but a `max` costs nothing and does not rely on
    // that — and this value decides how far the calendar lets somebody step.
    const lastDate = data.days.reduce((last, day) => (day.date > last ? day.date : last), '');
    return {
      byDate,
      lastDate: lastDate || null,
      timezone,
      hasOperatingSchedule,
      loading: isFetching,
    };
  }, [data, isFetching]);
}
