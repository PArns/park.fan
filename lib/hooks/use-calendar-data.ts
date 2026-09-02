import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { IntegratedCalendarResponse } from '@/lib/api/types';

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
}

/**
 * How long a fetched month stays fresh in the browser.
 *
 * An hour, not the five minutes it was. Five was the cadence of one field — today's cell, which
 * the backend rewrote with a live occupancy reading every five minutes. That override is gone;
 * a calendar day is a forecast or a measurement now, and neither changes while a tab is open.
 *
 * Not a day, though the response behind it is cached for one: a stale time is also how long a
 * reader who leaves a tab open keeps a grid that a schedule correction has since made wrong, and
 * an hour costs at most one extra request per open tab per hour against a CDN that answers it
 * without touching the origin.
 */
export const CALENDAR_STALE_TIME_MS = 60 * 60_000;

/**
 * Hook to fetch calendar data with React Query
 * - Fresh for {@link CALENDAR_STALE_TIME_MS}
 * - Instant navigation when month data is cached
 * - Automatically fetches when parameters change
 */
export function useCalendarData({
  continent,
  country,
  city,
  parkSlug,
  from,
  to,
  enabled = true,
  staleTime = CALENDAR_STALE_TIME_MS,
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
    gcTime: 2 * CALENDAR_STALE_TIME_MS,
    retry: 2,
    // Month navigation changes `from`/`to` (a new query key). Keep showing the previous
    // month while the next one loads instead of flashing the whole grid back to a skeleton;
    // the grid dims via `isPlaceholderData` until the new month lands.
    placeholderData: keepPreviousData,
  });
}
