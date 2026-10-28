'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData } from '@tanstack/react-query';
import type { Locale } from '@/i18n/config';
import {
  parseTrafficDays,
  parseTrafficFilters,
  parseTrafficLocale,
  serializeTrafficFilters,
  toggleTrafficFilter,
  trafficQuery,
  withoutTrafficFilter,
  type FilterDimension,
  type TrafficDays,
  type TrafficFilter,
} from '@/lib/admin/site-analytics';
import type { TrafficOverview } from '@/lib/api/admin-site-analytics';
import { adminKeys, useAdminQuery } from '../../_lib/api';

/** The window, language and filters every traffic page shows, as the URL holds them. */
export interface TrafficFilters {
  days: TrafficDays;
  locale: Locale | null;
  filters: TrafficFilter[];
}

/** What the filter bar and the panels change. */
export interface TrafficFilterActions {
  setDays: (days: TrafficDays) => void;
  setLocale: (locale: Locale | null) => void;
  /** Sets the filter of a dimension, replaces it, or takes it off when it is already that value. */
  toggleFilter: (dim: FilterDimension, value: string) => void;
  removeFilter: (dim: FilterDimension) => void;
  clearFilters: () => void;
}

/**
 * The window, language and filters of the page, read from `?days=`, `?locale=` and the repeated
 * `?filter=<dimension>:<value>` and written back with `replace`, so a view is a link and the back
 * button is not a stack of filter presses. Other parameters of the address stay. Needs a
 * `Suspense` boundary above it.
 */
export function useTrafficFilters(): TrafficFilters & TrafficFilterActions {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const days = parseTrafficDays(params.get('days'));
  const locale = parseTrafficLocale(params.get('locale'));
  const filterParams = params.getAll('filter');
  // The strings, not the array, key the memo: `getAll` is a new array on every render.
  const filterKey = filterParams.join('\u0000');
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `filterKey` is `filterParams` joined
  const filters = useMemo(() => parseTrafficFilters(filterParams), [filterKey]);

  const write = useCallback(
    (change: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      change(next);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router]
  );

  const writeFilters = useCallback(
    (list: readonly TrafficFilter[]) =>
      write((next) => {
        next.delete('filter');
        for (const value of serializeTrafficFilters(list)) next.append('filter', value);
      }),
    [write]
  );

  return {
    days,
    locale,
    filters,
    setDays: useCallback((value) => write((next) => next.set('days', String(value))), [write]),
    setLocale: useCallback(
      (value) =>
        write((next) => {
          if (value === null) next.delete('locale');
          else next.set('locale', value);
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

/** The address of an analytics endpoint under the admin proxy, with the window, filters and extras. */
export function analyticsPath(
  endpoint: string,
  state: Pick<TrafficFilters, 'days' | 'locale'> & { filters?: readonly TrafficFilter[] },
  extra?: Record<string, string | number>
): string {
  return `/api/admin/analytics/${endpoint}?${trafficQuery(state, extra)}`;
}

/**
 * One analytics answer for the filters. The previous answer stays on screen while a switch loads,
 * so the page does not blank on every press; a refresh from the topbar refetches it like any
 * admin query.
 */
export function useTrafficData<T>(
  endpoint: string,
  filters: TrafficFilters,
  extra?: Record<string, string | number>
) {
  const path = analyticsPath(endpoint, filters, extra);
  return useAdminQuery<T>(adminKeys.raw(path), path, {
    placeholderData: keepPreviousData,
    staleTime: 30_000,
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
  const path = analyticsPath('overview', { days: 1, locale: null });
  return useAdminQuery<TrafficOverview>(adminKeys.raw(path), path, {
    refetchInterval: REALTIME_POLL_MS,
    staleTime: REALTIME_POLL_MS / 2,
  });
}
