import { CACHE_TTL } from './cache-config';
import type { IntegratedCalendarResponse } from '@/lib/api/types';

// Use proxy for client-side, direct live URL for server-side
const getApiBaseUrl = () => {
  // Server-side: use live API directly
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'https://api.park.fan';
  }
  // Client-side: use relative path to trigger Next.js proxy
  return '';
};

/**
 * Fetch integrated calendar data for a park
 *
 * This replaces the old approach of fetching schedule, weather, holidays, etc. separately.
 * The new endpoint provides everything in one optimized call.
 *
 * @param continent - Continent slug (e.g., "europe")
 * @param country - Country slug (e.g., "germany")
 * @param city - City slug (e.g., "bruehl")
 * @param parkSlug - Park slug (e.g., "phantasialand")
 * @param from - Start date (YYYY-MM-DD), defaults to today
 * @param to - End date (YYYY-MM-DD), defaults to from + 30 days
 * @param includeHourly - Which days include hourly data (default: "today+tomorrow")
 */
export async function getIntegratedCalendar(
  continent: string,
  country: string,
  city: string,
  parkSlug: string,
  options: {
    from?: string;
    to?: string;
    includeHourly?: 'today+tomorrow' | 'today' | 'all' | 'none';
    /** Override the data-cache revalidate window (seconds). Defaults to CACHE_TTL.calendar. */
    revalidate?: number;
    /** Cache tags for on-demand revalidation (revalidateTag). */
    tags?: string[];
  } = {}
): Promise<IntegratedCalendarResponse> {
  const API_BASE_URL = getApiBaseUrl();

  // Build query parameters
  const params = new URLSearchParams();
  if (options.from) params.append('from', options.from);
  if (options.to) params.append('to', options.to);
  if (options.includeHourly) params.append('includeHourly', options.includeHourly);

  const queryString = params.toString();
  const url = `${API_BASE_URL}/v1/parks/${continent}/${country}/${city}/${parkSlug}/calendar${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    next: {
      revalidate: options.revalidate ?? CACHE_TTL.calendar,
      ...(options.tags ? { tags: options.tags } : {}),
    },
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    let message = response.statusText;
    try {
      const json = JSON.parse(body) as { message?: string; error?: string };
      message = json.message ?? json.error ?? message;
    } catch {
      if (body) message = body.slice(0, 200);
    }
    throw new Error(`Calendar ${response.status}: ${message}`);
  }

  const data: IntegratedCalendarResponse = await response.json();
  return data;
}

/** Dedicated 24h cache window for the "best travel time" / quiet-days derivation. */
export const BEST_DAYS_REVALIDATE = 24 * 60 * 60; // 24h

/**
 * Calendar fetch dedicated to the "best travel time" derivation (best/quiet
 * weekdays, upcoming quiet days) and the crowd FAQ.
 *
 * Cached for 24h, fully decoupled from the 15-min grid calendar:
 * - The data it feeds (day-of-week aggregates + a multi-week quiet-day forecast)
 *   only changes with the daily crowd forecast (~13h), so a day-old snapshot is
 *   fine for trip planning.
 * - `includeHourly: 'none'` keeps the payload light AND gives this fetch a cache
 *   key distinct from the grid's, so the two never evict each other.
 * - Next's classic data-cache revalidate is stale-while-revalidate: once the 24h
 *   window lapses, the next request is served the STALE snapshot immediately and a
 *   background refresh runs, so the following request gets fresher data — the
 *   visitor never waits on a cold rebuild.
 * - The date-sensitive "upcoming quiet days" stay correct because analyzeBestDays
 *   re-filters against a freshly computed (park-timezone) "today" on every render.
 */
export async function getBestDaysCalendar(
  continent: string,
  country: string,
  city: string,
  parkSlug: string,
  options: { from?: string; to?: string } = {}
): Promise<IntegratedCalendarResponse> {
  return getIntegratedCalendar(continent, country, city, parkSlug, {
    from: options.from,
    to: options.to,
    includeHourly: 'none',
    revalidate: BEST_DAYS_REVALIDATE,
    tags: [`best-days:${parkSlug}`],
  });
}
