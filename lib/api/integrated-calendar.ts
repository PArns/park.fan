import { getApiBaseUrl, getServerApiHeaders } from './client';
import { parkCacheTag } from './park-live-projection';
import { withSeedTimeout } from './seed-timeout';
import type { IntegratedCalendarResponse } from '@/lib/api/types';

/**
 * Which days of a calendar range carry an hourly crowd curve (`CalendarDay.hourly`). The backend
 * only ever has a curve for today and tomorrow, so `all` returns the same as `today+tomorrow`;
 * ask for `today+tomorrow`.
 */
export type CalendarHourlyMode = 'today+tomorrow' | 'today' | 'all' | 'none';

/**
 * Fetch a park's integrated calendar (hours, weather, holidays per day) in one uncached call.
 * `from` defaults to today and `to` to 30 days later on the API side.
 */
export async function getIntegratedCalendar(
  continent: string,
  country: string,
  city: string,
  parkSlug: string,
  options: {
    from?: string;
    to?: string;
    includeHourly?: CalendarHourlyMode;
  } = {}
): Promise<IntegratedCalendarResponse> {
  const API_BASE_URL = getApiBaseUrl();

  const params = new URLSearchParams();
  if (options.from) params.append('from', options.from);
  if (options.to) params.append('to', options.to);
  if (options.includeHourly) params.append('includeHourly', options.includeHourly);

  const queryString = params.toString();
  const url = `${API_BASE_URL}/v1/parks/${continent}/${country}/${city}/${parkSlug}/calendar${queryString ? `?${queryString}` : ''}`;

  // Uncached: this feeds the calendar grid's per-month client polls through the /api/calendar
  // proxy. Best-days data comes from the precomputed `/best-days` endpoint below instead.
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...getServerApiHeaders(),
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

/**
 * Data-cache window for the SSR best-days snapshot. Only the fallback cadence: the backend fires
 * `revalidateTag('best-days:<slug>')` after every forecast warmup, and `analyzeBestDays` re-filters
 * against a fresh „today" on every render.
 */
export const BEST_DAYS_REVALIDATE = 72 * 60 * 60; // 3d

/** Optional weekday aggregate the `/best-days` endpoint may include (absent when the backend's
 *  `/stats` cache was cold); a structural subset of `DayOfWeekStat`. */
export interface BestDaysByDayOfWeek {
  /** 0 = Sunday … 6 = Saturday. */
  dayOfWeek: number;
  avgCrowdScore: number;
  sampleDays: number;
}

/** The precomputed best-days snapshot: the calendar projection (`meta` + `days`) plus the optional
 *  weekday aggregate, as `GET /v1/parks/.../best-days` returns it. */
export interface BestDaysSnapshot extends IntegratedCalendarResponse {
  byDayOfWeek?: BestDaysByDayOfWeek[];
}

const bestDaysUrl = (continent: string, country: string, city: string, parkSlug: string) =>
  `${getApiBaseUrl()}/v1/parks/${continent}/${country}/${city}/${parkSlug}/best-days`;

/**
 * Fetch the precomputed best-days snapshot (today to +90 days, park timezone): a small projection
 * the backend serves from Redis, small enough for Next's fetch data cache.
 *
 * @param fresh `true` → `no-store` (the client-poll proxy); `false` → data-cached for
 *   {@link BEST_DAYS_REVALIDATE} and tagged `best-days:<slug>` for the backend's webhook.
 */
async function fetchBestDays(
  continent: string,
  country: string,
  city: string,
  parkSlug: string,
  fresh: boolean
): Promise<BestDaysSnapshot> {
  const response = await fetch(bestDaysUrl(continent, country, city, parkSlug), {
    ...(fresh
      ? { cache: 'no-store' as const }
      : { next: { revalidate: BEST_DAYS_REVALIDATE, tags: [`best-days:${parkSlug}`] } }),
    headers: {
      'Content-Type': 'application/json',
      ...getServerApiHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(`Best-days ${response.status}: ${response.statusText}`);
  }

  return (await response.json()) as BestDaysSnapshot;
}

/**
 * Best-days snapshot for the SSR seed, data-cached and tagged so repeat renders never touch the
 * backend. Feeds the best-days section and the crowd FAQ and its FAQPage JSON-LD.
 */
export function getBestDaysCalendar(
  continent: string,
  country: string,
  city: string,
  parkSlug: string
): Promise<BestDaysSnapshot> {
  return fetchBestDays(continent, country, city, parkSlug, false);
}

/**
 * Live (no-store) best-days snapshot for the `/api/parks/.../best-days` client-poll proxy, so it
 * reflects the backend's latest snapshot. Mirrors `getParkByGeoPathFresh`.
 */
export function getBestDaysSnapshotFresh(
  continent: string,
  country: string,
  city: string,
  parkSlug: string
): Promise<BestDaysSnapshot> {
  return fetchBestDays(continent, country, city, parkSlug, true);
}

/**
 * How long a streamed best-days consumer may wait for the snapshot. Off the TTFB path (awaited only
 * inside `<Suspense>`), so it only bounds how long the stream stays open; generous so crawlers
 * usually get the seed.
 */
const BEST_DAYS_SEED_TIMEOUT_MS = 3000;

/**
 * Timeout-bounded {@link getBestDaysCalendar} for the park page's streamed SEO seed. On timeout it
 * resolves `null` (the section falls back to its skeleton and client fetch) while `after()` lets
 * the fetch finish and fill the cache for the next request. `null` means „no seed", never an
 * empty calendar.
 */
export async function getBestDaysCalendarSeed(
  continent: string,
  country: string,
  city: string,
  parkSlug: string
): Promise<BestDaysSnapshot | null> {
  return withSeedTimeout(
    getBestDaysCalendar(continent, country, city, parkSlug).catch(() => null),
    BEST_DAYS_SEED_TIMEOUT_MS
  );
}

/**
 * How long a month page's server-rendered summary may be reused: a day, since what it says (open
 * days, quietest and busiest days, usual hours) does not change within one. The entry also carries
 * the park's own tag, so the forecast warmup and schedule sync clear it at once when they rewrite
 * a month. See docs/architecture/api-budget.md.
 */
export const CALENDAR_MONTH_REVALIDATE = 24 * 60 * 60;

/** How long the streamed month summary may wait before the page gives up on it. */
const CALENDAR_MONTH_SEED_TIMEOUT_MS = 3000;

/**
 * One month of `/calendar`, data-cached, for a month page's written summary. A plain
 * `next: { revalidate, tags }` rather than `unstable_cache`: in this Next version the fetch cache
 * works under `force-dynamic` too, survives a redeploy and is reachable from `revalidateTag`.
 * `includeHourly: 'none'`, because the summary is about days and the curves are most of the
 * payload.
 */
async function fetchCalendarMonth(
  continent: string,
  country: string,
  city: string,
  parkSlug: string,
  from: string,
  to: string
): Promise<IntegratedCalendarResponse> {
  const url =
    `${getApiBaseUrl()}/v1/parks/${continent}/${country}/${city}/${parkSlug}/calendar` +
    `?from=${from}&to=${to}&includeHourly=none`;

  const response = await fetch(url, {
    next: {
      revalidate: CALENDAR_MONTH_REVALIDATE,
      tags: ['parks', parkCacheTag(continent, country, city, parkSlug)],
    },
    headers: {
      'Content-Type': 'application/json',
      ...getServerApiHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(`Calendar month ${response.status}: ${response.statusText}`);
  }

  return (await response.json()) as IntegratedCalendarResponse;
}

/**
 * Timeout-bounded month fetch for the calendar page's streamed summary, like
 * {@link getBestDaysCalendarSeed}: a timeout drops only the summary card. `year`/`month` are
 * 1-based; the range is built with `Date.UTC` so a midnight DST jump cannot drop a day.
 */
export async function getCalendarMonthSeed(
  continent: string,
  country: string,
  city: string,
  parkSlug: string,
  { year, month }: { year: number; month: number }
): Promise<IntegratedCalendarResponse | null> {
  const pad = (n: number) => String(n).padStart(2, '0');
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const from = `${year}-${pad(month)}-01`;
  const to = `${year}-${pad(month)}-${pad(lastDay)}`;

  return withSeedTimeout(
    fetchCalendarMonth(continent, country, city, parkSlug, from, to).catch(() => null),
    CALENDAR_MONTH_SEED_TIMEOUT_MS
  );
}
