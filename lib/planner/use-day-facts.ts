'use client';

import { useMemo } from 'react';
import { useParkBestDaysCalendar } from '@/lib/hooks/use-park-best-days-calendar';
import type { CalendarDay } from '@/lib/api/types';
import type { PlannerGeo } from './types';

/**
 * What the park's best-days snapshot says about the coming days, as {@link usePlannerDayFacts}
 * answers.
 */
export interface PlannerDayFacts {
  /** What the park's own forecast says about each day it reaches. */
  byDate: ReadonlyMap<string, CalendarDay>;
  /** The last day the snapshot covers, or `null` while it has not arrived. */
  lastDate: string | null;
  /**
   * The park's IANA zone from the snapshot's `meta`: a park added from the search arrives with
   * none, and without it the plan would reckon that park's dates in the reader's zone.
   */
  timezone: string | null;
  /**
   * False where the park publishes no opening hours at all, worth saying before a day is planned.
   */
  hasOperatingSchedule: boolean | null;
  loading: boolean;
  /**
   * True only while the first answer is outstanding. Not `loading` (`isFetching`), which is also
   * true for a background refetch and false before the query has been asked at all.
   */
  pending: boolean;
}

const EMPTY: ReadonlyMap<string, CalendarDay> = new Map();

/**
 * What we already know about this park's next three months, from its best-days snapshot: the cheap,
 * CDN-cached one, ninety days long, which sets the calendar's horizon. The query key is the park
 * page's own, so on a park page this is a cache hit, gated on `useLoadLast` like the page's (see
 * docs/rules/park-page-loading-priority.md).
 */
export function usePlannerDayFacts(
  park: { slug: string; geo: PlannerGeo } | null,
  enabled: boolean
): PlannerDayFacts {
  const { data, isFetching, isError } = useParkBestDaysCalendar({
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
        // `!data && !isError`: an empty snapshot and a failed request are both answers, and a
        // caller waiting on `pending` must not wait for ever on either.
        pending: !data && !isError,
      };
    }
    const byDate = new Map<string, CalendarDay>();
    for (const day of data.days) byDate.set(day.date, day);
    // A `max` rather than trusting the order, since this decides how far the calendar can step.
    const lastDate = data.days.reduce((last, day) => (day.date > last ? day.date : last), '');
    return {
      byDate,
      lastDate: lastDate || null,
      timezone,
      hasOperatingSchedule,
      loading: isFetching,
      pending: false,
    };
  }, [data, isFetching, isError]);
}
