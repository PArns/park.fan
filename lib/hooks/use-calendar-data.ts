import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { IntegratedCalendarResponse } from '@/lib/api/types';
import { LOAD_LAST_META } from '@/lib/hooks/use-load-last';

interface UseCalendarDataParams {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  enabled?: boolean;
  /** ms; defaults to {@link CALENDAR_STALE_TIME_MS}. */
  staleTime?: number;
  /** The caller gates `enabled` on `useLoadLast`; see {@link LOAD_LAST_META}. */
  loadLast?: boolean;
}

/**
 * How long a fetched month stays fresh in the browser: a calendar day is a forecast or a
 * measurement, and neither changes while a tab is open. An hour rather than the response's day,
 * so a tab left open picks up a schedule correction for one CDN hit an hour.
 */
export const CALENDAR_STALE_TIME_MS = 60 * 60_000;

/** A park's integrated calendar for a date range, fresh for {@link CALENDAR_STALE_TIME_MS}. */
export function useCalendarData({
  continent,
  country,
  city,
  parkSlug,
  from,
  to,
  enabled = true,
  staleTime = CALENDAR_STALE_TIME_MS,
  loadLast = false,
}: UseCalendarDataParams) {
  return useQuery<IntegratedCalendarResponse>({
    queryKey: ['calendar', continent, country, city, parkSlug, from, to],
    queryFn: async () => {
      const response = await fetch(
        `/api/parks/${continent}/${country}/${city}/${parkSlug}/calendar?from=${from}&to=${to}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch calendar data: ${response.statusText}`);
      }

      return response.json();
    },
    enabled,
    staleTime,
    meta: loadLast ? LOAD_LAST_META : undefined,
    gcTime: 2 * CALENDAR_STALE_TIME_MS,
    retry: 2,
    // Month navigation changes `from`/`to` (a new query key). Keep showing the previous
    // month while the next one loads instead of flashing the whole grid back to a skeleton;
    // the grid dims via `isPlaceholderData` until the new month lands.
    placeholderData: keepPreviousData,
  });
}
