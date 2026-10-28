'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData } from '@tanstack/react-query';
import type { Locale } from '@/i18n/config';
import {
  parseTrafficDays,
  parseTrafficLocale,
  trafficQuery,
  type TrafficDays,
} from '@/lib/admin/site-analytics';
import type { TrafficOverview } from '@/lib/api/admin-site-analytics';
import { adminKeys, useAdminQuery } from '../../_lib/api';

/** The window and language every traffic page shows, as the URL holds them. */
export interface TrafficFilters {
  days: TrafficDays;
  locale: Locale | null;
}

/**
 * The window and language of the page, read from `?days=` and `?locale=` and written back with
 * `replace`, so a view is a link and the back button is not a stack of filter presses. Other
 * parameters of the address stay. Needs a `<Suspense>` above it.
 */
export function useTrafficFilters(): TrafficFilters & {
  setDays: (days: TrafficDays) => void;
  setLocale: (locale: Locale | null) => void;
} {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const days = parseTrafficDays(params.get('days'));
  const locale = parseTrafficLocale(params.get('locale'));

  const write = useCallback(
    (key: 'days' | 'locale', value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null) next.delete(key);
      else next.set(key, value);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router]
  );

  return {
    days,
    locale,
    setDays: useCallback((value) => write('days', String(value)), [write]),
    setLocale: useCallback((value) => write('locale', value), [write]),
  };
}

/** The address of an analytics endpoint under the admin proxy, with the window and extras. */
export function analyticsPath(
  endpoint: string,
  filters: TrafficFilters,
  extra?: Record<string, string | number>
): string {
  return `/api/admin/analytics/${endpoint}?${trafficQuery(filters, extra)}`;
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
 * window and the language, asks every 30 seconds while the tab is in front, and shares its answer
 * with the "Heute" view of the overview.
 */
export function useRealtimeOverview() {
  const path = analyticsPath('overview', { days: 1, locale: null });
  return useAdminQuery<TrafficOverview>(adminKeys.raw(path), path, {
    refetchInterval: REALTIME_POLL_MS,
    staleTime: REALTIME_POLL_MS / 2,
  });
}
