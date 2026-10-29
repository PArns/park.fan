'use client';

import { useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData } from '@tanstack/react-query';
import type { Locale } from '@/i18n/config';
import {
  parseDatacenterScope,
  parseTrafficFilters,
  parseTrafficLocale,
  serializeTrafficFilters,
  toggleTrafficFilter,
  trafficQuery,
  withoutTrafficFilter,
  type DatacenterScope,
  type FilterDimension,
  type TrafficFilter,
} from '@/lib/admin/site-analytics';
import {
  effectiveInterval,
  isInterval,
  parseTrafficRange,
  rangeParams,
  rangeWindow,
  utcDay,
  type RangeWindow,
  type TrafficRange,
} from '@/lib/admin/traffic-range';
import type { SeriesInterval, TrafficOverview } from '@/lib/api/admin-site-analytics';
import { adminKeys, useAdminQuery } from '../../_lib/api';

/** The window, step, language and filters every traffic page shows, as the URL holds them. */
export interface TrafficFilters {
  range: TrafficRange;
  /** The window as the API will echo it, worked out with today's date. */
  window: RangeWindow;
  /** The UTC day the page counts as today. */
  today: string;
  /** The step the address asks for; `null` when it names none or none that suits the window. */
  interval: SeriesInterval | null;
  /** The step the series will have: the asked one, or the API's default for the window. */
  activeInterval: SeriesInterval;
  locale: Locale | null;
  filters: TrafficFilter[];
  /** Which rows count by network; `exclude`, the API's default, unless the address says. */
  datacenter: DatacenterScope;
}

/** What the filter bar and the panels change. */
export interface TrafficFilterActions {
  setRange: (range: TrafficRange) => void;
  /** `null` goes back to the default step of the window. */
  setInterval: (interval: SeriesInterval | null) => void;
  setLocale: (locale: Locale | null) => void;
  setDatacenter: (datacenter: DatacenterScope) => void;
  /** Sets the filter of a dimension, replaces it, or takes it off when it is already that value. */
  toggleFilter: (dim: FilterDimension, value: string) => void;
  removeFilter: (dim: FilterDimension) => void;
  clearFilters: () => void;
}

/**
 * Writes a change to the address with `replace`, keeping every other parameter, so a view is a link
 * and the back button is not a stack of presses. Needs a `Suspense` boundary above it.
 */
export function useAddressWriter(): (change: (next: URLSearchParams) => void) => void {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  return useCallback(
    (change) => {
      const next = new URLSearchParams(params.toString());
      change(next);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router]
  );
}

/**
 * The window, step, language and filters of the page, read from `?days=` or `?from=&to=`,
 * `?interval=`, `?locale=` and the repeated `?filter=<dimension>:<value>`, and written back with
 * `replace`, so a view is a link and the back button is not a stack of filter presses. Other
 * parameters of the address stay. Needs a `Suspense` boundary above it.
 */
export function useTrafficFilters(): TrafficFilters & TrafficFilterActions {
  const params = useSearchParams();
  const write = useAddressWriter();

  // The day is read once per page load: a page open across midnight keeps the day it was opened on.
  const [today] = useState(() => utcDay());
  const range = parseTrafficRange(
    { days: params.get('days'), from: params.get('from'), to: params.get('to') },
    today
  );
  const window = rangeWindow(range, today);
  const askedInterval = params.get('interval');
  const activeInterval = effectiveInterval(askedInterval, window.days);
  const interval =
    isInterval(askedInterval) && askedInterval === activeInterval ? askedInterval : null;
  const locale = parseTrafficLocale(params.get('locale'));
  const datacenter = parseDatacenterScope(params.get('datacenter'));
  const filterParams = params.getAll('filter');
  // The strings, not the array, key the memo: `getAll` is a new array on every render.
  const filterKey = filterParams.join('\u0000');
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `filterKey` is `filterParams` joined
  const filters = useMemo(() => parseTrafficFilters(filterParams), [filterKey]);

  const writeFilters = useCallback(
    (list: readonly TrafficFilter[]) =>
      write((next) => {
        next.delete('filter');
        for (const value of serializeTrafficFilters(list)) next.append('filter', value);
      }),
    [write]
  );

  return {
    range,
    window,
    today,
    interval,
    activeInterval,
    locale,
    filters,
    datacenter,
    setRange: useCallback(
      (value) =>
        write((next) => {
          for (const key of ['days', 'from', 'to']) next.delete(key);
          for (const [key, text] of Object.entries(rangeParams(value))) next.set(key, text);
          // A step that does not suit the new window would be ignored anyway; the address says so.
          const asked = next.get('interval');
          if (asked && effectiveInterval(asked, rangeWindow(value, today).days) !== asked) {
            next.delete('interval');
          }
        }),
      [write, today]
    ),
    setInterval: useCallback(
      (value) =>
        write((next) => {
          if (value === null) next.delete('interval');
          else next.set('interval', value);
        }),
      [write]
    ),
    setLocale: useCallback(
      (value) =>
        write((next) => {
          if (value === null) next.delete('locale');
          else next.set('locale', value);
        }),
      [write]
    ),
    setDatacenter: useCallback(
      (value) =>
        write((next) => {
          if (value === 'exclude') next.delete('datacenter');
          else next.set('datacenter', value);
        }),
      [write]
    ),
    toggleFilter: useCallback(
      (dim, value) => writeFilters(toggleTrafficFilter(filters, dim, value)),
      [filters, writeFilters]
    ),
    removeFilter: useCallback(
      (dim) => writeFilters(withoutTrafficFilter(filters, dim)),
      [filters, writeFilters]
    ),
    clearFilters: useCallback(() => writeFilters([]), [writeFilters]),
  };
}

/** Whether a report answers with a series, which is where the step applies. */
function hasSeries(endpoint: string): boolean {
  return (
    endpoint === 'overview' ||
    endpoint === 'events' ||
    endpoint === 'search' ||
    endpoint === 'planner' ||
    /^events\/[^/]+$/.test(endpoint)
  );
}

/**
 * The address of an analytics endpoint under the admin proxy, with the window, filters and extras.
 * The step goes only to the reports that have a series.
 */
function analyticsPath(
  endpoint: string,
  state: Pick<TrafficFilters, 'range' | 'locale'> & {
    interval?: SeriesInterval | null;
    filters?: readonly TrafficFilter[];
    datacenter?: DatacenterScope;
  },
  extra?: Record<string, string | number>
): string {
  const query = trafficQuery(
    { ...state, interval: hasSeries(endpoint) ? state.interval : null },
    extra
  );
  return `/api/admin/analytics/${endpoint}?${query}`;
}

/**
 * One analytics answer for the filters. The previous answer stays on screen while a switch loads,
 * so the page does not blank on every press; a refresh from the topbar refetches it like any
 * admin query.
 */
export function useTrafficData<T>(
  endpoint: string,
  filters: TrafficFilters,
  extra?: Record<string, string | number>,
  options?: {
    /** Leaves the ask out, for a report the filters rule out (the API would answer 400). */
    enabled?: boolean;
  }
) {
  const path = analyticsPath(endpoint, filters, extra);
  return useAdminQuery<T>(adminKeys.raw(path), path, {
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  });
}

/** Milliseconds between two asks for who is on the site, which the API answers from memory. */
const REALTIME_POLL_MS = 30_000;

/**
 * Today's overview on its own clock, for the realtime tile and the home page: it ignores the
 * window, the language and the filters, asks every 30 seconds while the tab is in front, and shares
 * its answer with the "Heute" view of the overview.
 */
export function useRealtimeOverview() {
  const path = analyticsPath('overview', { range: { kind: 'days', days: 1 }, locale: null });
  return useAdminQuery<TrafficOverview>(adminKeys.raw(path), path, {
    refetchInterval: REALTIME_POLL_MS,
    staleTime: REALTIME_POLL_MS / 2,
  });
}
