import { unstable_cache } from 'next/cache';
import { after } from 'next/server';
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

  // Uncached low-level fetch. The raw ~2.25 MB body exceeds Next's fetch data-cache cap (2 MB),
  // so it can never be a cache unit; callers that want caching wrap the PROJECTED result in
  // `unstable_cache` (see getBestDaysCalendar). The /api/calendar proxy and client polls want
  // it live anyway.
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
    predictedCrowdLevel: d.predictedCrowdLevel,
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
 * Cached for 24h via `unstable_cache`, fully decoupled from the 15-min grid calendar:
 * - The data it feeds (day-of-week aggregates + a multi-week quiet-day forecast)
 *   only changes with the daily crowd forecast (~13h), so a day-old snapshot is
 *   fine for trip planning.
 * - The raw upstream response (~2.25 MB, dominated by an unused `influencingHolidays`
 *   list) is too big for Next's fetch data-cache (2 MB cap). This rules out a `'use cache'`
 *   boundary entirely: a `'use cache'` fn whose inner fetch can't be cached (whether via
 *   `no-store` or a `force-cache` that silently fails the 2 MB limit) becomes UNCACHED, and
 *   under Cache Components that surfaces as "uncached data accessed outside <Suspense>".
 *   `unstable_cache` sidesteps this — it caches the function's small PROJECTED return value
 *   (~13 KB) directly, independent of the fetch data-cache, so the 2 MB body never needs to
 *   be a cache unit. Consumers only ever receive the projected days.
 * - `unstable_cache` is stale-while-revalidate: once the 24h window lapses, the next
 *   request is served the STALE snapshot immediately while a background refresh runs,
 *   so the visitor never waits on a cold rebuild. The `best-days:<slug>` tag still
 *   supports on-demand `revalidateTag`.
 * - The date-sensitive "upcoming quiet days" stay correct because analyzeBestDays
 *   re-filters against a freshly computed (park-timezone) "today" on every render.
 *
 * Cache Components note: callers invoke this INSIDE a dynamic Suspense hole (after
 * `connection()` — see the Streamed* components on the park page), never in the static
 * shell, so the 2.25 MB fetch streams below the fold and never blocks the prerendered shell.
 */
export async function getBestDaysCalendar(
  continent: string,
  country: string,
  city: string,
  parkSlug: string,
  options: { from?: string; to?: string } = {}
): Promise<IntegratedCalendarResponse> {
  const fetchAndProject = unstable_cache(
    async (c: string, co: string, ci: string, p: string, from?: string, to?: string) => {
      const raw = await getIntegratedCalendar(c, co, ci, p, {
        from,
        to,
        includeHourly: 'none',
      });
      return projectBestDaysCalendar(raw);
    },
    ['best-days-calendar'],
    {
      revalidate: BEST_DAYS_REVALIDATE,
      tags: [`best-days:${parkSlug}`],
    }
  );

  return fetchAndProject(continent, country, city, parkSlug, options.from, options.to);
}

/**
 * How long the park page's SSR render may wait for the best-days snapshot before giving up.
 * Deliberately tight: a miss only costs the SSR seed for that ONE request (the client queries
 * fill the section as before, and `after()` completes the cache fill for the next request).
 * Once the backend ships the lean precomputed best-days endpoint (p99 well under this budget),
 * misses should become practically impossible.
 */
const BEST_DAYS_SEED_TIMEOUT_MS = 1200;

/**
 * TTFB-safe wrapper around {@link getBestDaysCalendar} for the park page's SERVER render (the
 * SEO seed for the best-days section + crowd FAQ).
 *
 * The underlying `unstable_cache` entry is stale-while-revalidate, so the ONLY slow path is a
 * cold MISS (first request per park × calendar-month window, or after `revalidateTag`): the raw
 * upstream calendar can take 10–20 s on a cold backend compute, which must never block the
 * force-dynamic park page's TTFB. So the render waits at most {@link BEST_DAYS_SEED_TIMEOUT_MS}
 * and then renders WITHOUT the seed (the client queries fill the section in, exactly the
 * pre-seed behavior) — while `after()` keeps the abandoned fetch alive past the response so it
 * still fills the cache and the NEXT request gets the seed instantly.
 *
 * Returns `null` on timeout or any error; callers must treat `null` as "no seed" (never as an
 * empty calendar).
 */
export async function getBestDaysCalendarSeed(
  continent: string,
  country: string,
  city: string,
  parkSlug: string,
  options: { from?: string; to?: string } = {}
): Promise<IntegratedCalendarResponse | null> {
  const calendarPromise = getBestDaysCalendar(continent, country, city, parkSlug, options).catch(
    () => null
  );

  const result = await Promise.race([
    calendarPromise,
    new Promise<'timeout'>((resolve) => {
      setTimeout(() => resolve('timeout'), BEST_DAYS_SEED_TIMEOUT_MS);
    }),
  ]);

  if (result === 'timeout') {
    // Cold cache fill in progress — keep it running past the response so it lands in the
    // cache for the next request instead of being frozen with the lambda.
    after(() => calendarPromise);
    return null;
  }

  return result;
}
