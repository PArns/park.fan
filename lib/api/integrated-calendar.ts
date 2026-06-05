import { cacheLife, cacheTag } from 'next/cache';
import { getServerAuthHeaders } from './client';
import type { CalendarDay, IntegratedCalendarResponse } from '@/lib/api/types';

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

  // Uncached low-level fetch. Callers that want caching wrap this in a `'use cache'`
  // boundary (see getBestDaysCalendar); the /api/calendar proxy and client polls want it live.
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...getServerAuthHeaders(),
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
 * Project the full calendar response down to the handful of day fields the
 * best-days/FAQ consumers actually touch. Shrinks the per-park snapshot from
 * ~1.7 MB to ~13 KB.
 *
 * Kept fields:
 * - `analyzeBestDays` reads date, status, crowdLevel, isSchoolVacation, isHoliday.
 * - ParkBestDaysSection renders `upcomingQuietDays` reading only date + crowdLevel.
 * - isToday/isBridgeDay are carried only to satisfy required CalendarDay fields.
 *
 * Dropped — most importantly `influencingHolidays`, which is ~98% of the raw
 * payload (a per-day, heavily-duplicated list of every regional holiday) and is
 * read by NO frontend consumer.
 *
 * This is what lets the result be cached at all: Next's fetch data-cache rejects
 * bodies over 2 MB (the raw response sits right at that boundary and fluctuates
 * with the holiday/forecast recompute), so the raw fetch was silently uncached.
 * It also keeps the bulky raw payload out of the React render tree entirely.
 */
function projectBestDaysCalendar(data: IntegratedCalendarResponse): IntegratedCalendarResponse {
  const days: CalendarDay[] = data.days.map((d) => ({
    date: d.date,
    status: d.status,
    crowdLevel: d.crowdLevel,
    isToday: d.isToday,
    isHoliday: d.isHoliday,
    isBridgeDay: d.isBridgeDay,
    isSchoolVacation: d.isSchoolVacation,
  }));
  return { meta: data.meta, days };
}

/**
 * Calendar fetch dedicated to the "best travel time" derivation (best/quiet
 * weekdays, upcoming quiet days) and the crowd FAQ.
 *
 * Cached for 24h, fully decoupled from the 15-min grid calendar:
 * - The data it feeds (day-of-week aggregates + a multi-week quiet-day forecast)
 *   only changes with the daily crowd forecast (~13h), so a day-old snapshot is
 *   fine for trip planning.
 * - The raw upstream response (~1.7 MB, dominated by an unused `influencingHolidays`
 *   list) is too big for Next's fetch data-cache (2 MB cap), so the inner fetch runs
 *   UNCACHED (`revalidate: 0`) and we instead cache the projected ~35 KB result via
 *   `unstable_cache`. That both makes caching work and keeps the bulky payload out of
 *   the renderer — consumers only ever receive the projected days.
 * - `unstable_cache` is stale-while-revalidate: once the 24h window lapses, the next
 *   request is served the STALE snapshot immediately while a background refresh runs,
 *   so the visitor never waits on a cold rebuild. The `best-days:<slug>` tag still
 *   supports on-demand `revalidateTag`.
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
  'use cache';
  cacheLife({
    stale: BEST_DAYS_REVALIDATE,
    revalidate: BEST_DAYS_REVALIDATE,
    expire: BEST_DAYS_REVALIDATE * 2,
  });
  cacheTag(`best-days:${parkSlug}`);

  // The inner fetch is uncached (getIntegratedCalendar uses no-store); this `'use cache'`
  // boundary caches only the projected ~13 KB result, keeping the raw ~1.7 MB body — which
  // exceeds Next's fetch data-cache cap — out of the cache and the render tree entirely.
  const raw = await getIntegratedCalendar(continent, country, city, parkSlug, {
    from: options.from,
    to: options.to,
    includeHourly: 'none',
  });
  return projectBestDaysCalendar(raw);
}
