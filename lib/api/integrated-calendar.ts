import { after } from 'next/server';
import { getServerApiHeaders } from './client';
import { parkCacheTag } from './park-live-projection';
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
 * @param options.from - Start date (YYYY-MM-DD), defaults to today
 * @param options.to - End date (YYYY-MM-DD), defaults to from + 30 days
 * @param options.includeHourly - Which days include hourly data (default: "today+tomorrow")
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

  // Uncached low-level fetch for the calendar GRID (hours + weather per day). The best-days /
  // FAQ / forecast derivation no longer goes through here — it reads the dedicated precomputed
  // `/best-days` endpoint (see getBestDaysCalendar below). The /api/calendar proxy and the grid's
  // per-month client polls want this live anyway. (Since the backend's payload diet the body is
  // ~50 KB, not the old ~2.25 MB — the per-day influencingHolidays are opt-in now.)
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
 * Next data-cache window for the SSR best-days snapshot. The backend `/best-days` endpoint is
 * itself precomputed + CDN-cached, and it fires an on-demand `revalidateTag('best-days:<slug>')`
 * after every forecast warmup — so this TTL is only the BACKGROUND fallback cadence (in case a
 * webhook is missed), never a blocking wait, and never stale for long. The derivation it feeds
 * is week-stable and `analyzeBestDays` re-filters against a fresh "today" on every render.
 */
export const BEST_DAYS_REVALIDATE = 72 * 60 * 60; // 3d

/** Optional stats-quality weekday aggregate the `/best-days` endpoint may include (best-effort;
 *  absent when the backend's `/stats` cache was cold at precompute time). Structurally a subset
 *  of {@link import('@/lib/api/types').DayOfWeekStat}, so a full stats aggregate is assignable. */
export interface BestDaysByDayOfWeek {
  /** 0 = Sunday … 6 = Saturday. */
  dayOfWeek: number;
  avgCrowdScore: number;
  sampleDays: number;
}

/** The lean, precomputed best-days snapshot: the calendar projection (`meta` + `days`) plus the
 *  optional weekday aggregate. Shape returned by `GET /v1/parks/.../best-days`. */
export interface BestDaysSnapshot extends IntegratedCalendarResponse {
  byDayOfWeek?: BestDaysByDayOfWeek[];
}

const bestDaysUrl = (continent: string, country: string, city: string, parkSlug: string) =>
  `${getApiBaseUrl()}/v1/parks/${continent}/${country}/${city}/${parkSlug}/best-days`;

/**
 * Fetch the precomputed best-days snapshot (rolling today → +90d, park timezone).
 *
 * Replaces the old derive-from-`/calendar` path: the backend now materializes this lean
 * projection (~15 KB — status, crowd level, holiday flags per day + an optional weekday
 * aggregate) into Redis from the daily forecast batch and serves it with a single GET
 * (p99 < 300 ms, never a lazy ML compute). Because it's small it fits Next's fetch data cache
 * directly — no `unstable_cache` projection dance, no 2.25 MB body in the render tree.
 *
 * @param fresh `true` → `no-store` (the client-poll proxy path, respecting the backend's own
 *   CDN headers); `false` → Next data-cached for {@link BEST_DAYS_REVALIDATE} and tagged
 *   `best-days:<slug>` so the backend's post-warmup `revalidateTag` webhook drops it on change.
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
 * Wait for a seed, but not for long, and never leave a timer behind.
 *
 * Two callers had a character-for-character copy of this race, which is two places to fix when
 * the contract changes and one of them to forget. Both also leaked their `setTimeout` for the
 * full window even when the promise resolved in 40 ms — on a route that fires two seeds per
 * request across tens of thousands of URLs.
 *
 * On timeout the caller gets `null` and `after()` keeps the fetch alive past the response, so the
 * work still lands in the data cache and the NEXT request finds it warm. Consumed inside a
 * <Suspense> boundary, never on the critical path.
 */
async function withSeedTimeout<T>(promise: Promise<T | null>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      promise,
      new Promise<'timeout'>((resolve) => {
        timer = setTimeout(() => resolve('timeout'), ms);
      }),
    ]);
    if (result === 'timeout') {
      after(() => promise);
      return null;
    }
    return result;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Best-days snapshot for the SSR seed — Next data-cached ({@link BEST_DAYS_REVALIDATE}) + tagged,
 * so repeat renders never touch the backend and the on-demand `best-days:<slug>` webhook keeps it
 * fresh. Feeds the best-days section + the crowd FAQ / FAQPage JSON-LD.
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
 * Live (no-store) best-days snapshot for the `/api/parks/.../best-days` client-poll proxy —
 * skips our own cache so the response reflects the backend's latest snapshot (its Redis + CDN
 * still collapse concurrent calls). Mirrors `getParkByGeoPathFresh`.
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
 * How long a streamed best-days consumer may wait for the snapshot before giving up.
 *
 * This is NO LONGER on the page's TTFB critical path — the seed is awaited only inside <Suspense>
 * boundaries (the best-days slot + FAQ JSON-LD), so it streams in without gating first-byte. The
 * timeout therefore only bounds how long the streamed chunk / lambda may stay open on a cold-and-
 * slow `/best-days` fetch. It's generous (the endpoint is a precomputed Redis read, usually
 * <300 ms) so the seed lands in the streamed HTML for crawlers whenever reasonably possible; a
 * timeout drops the seed for that one request while `after()` still warms the data cache.
 */
const BEST_DAYS_SEED_TIMEOUT_MS = 3000;

/**
 * Timeout-bounded wrapper around {@link getBestDaysCalendar} for the park page's streamed SEO seed.
 *
 * Waits at most {@link BEST_DAYS_SEED_TIMEOUT_MS}; on timeout it resolves `null` (the streamed
 * section falls back to its skeleton + client fetch) while `after()` keeps the fetch alive past the
 * response so it still fills the Next data cache and the NEXT request's stream gets the seed. Callers
 * treat `null` as "no seed", never as an empty calendar. Consumed off the critical path (Suspense).
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
 * How long a month page's server-rendered summary may be reused.
 *
 * A day, and the number is about what the summary SAYS rather than what the payload holds: how
 * many days the park opens that month, its quietest and busiest days, the usual hours, the
 * headliner average. None of that differs between two visitors on the same morning, and since
 * today's cell stopped carrying a live occupancy reading, none of it differs between two
 * visitors on the same day either.
 *
 * Six hours before that, which was four upstream calls a day per park per month for a sentence
 * that changes once. Uncached it would be one upstream call per view across 212 parks × 15
 * months × 6 locales, which is the kind of addition docs/architecture/api-budget.md exists to
 * catch.
 *
 * The window is not the only thing that clears it, and that is what makes a day defensible: the
 * entry carries the park's OWN tag as well as `parks`, so the two jobs that can rewrite a month
 * — the forecast warmup and the daily schedule sync — drop it the moment they run, and a reader
 * gets a corrected opening time without waiting out the window. `parks` alone is all 213 parks
 * or nothing, which is why nothing ever pushed it for one park's correction.
 */
export const CALENDAR_MONTH_REVALIDATE = 24 * 60 * 60;

/** How long the streamed month summary may wait before the page gives up on it. */
const CALENDAR_MONTH_SEED_TIMEOUT_MS = 3000;

/**
 * One month of `/calendar`, data-cached, for a month page's written summary.
 *
 * A plain `next: { revalidate, tags }` and NOT `unstable_cache`, which this briefly used on a
 * wrong premise. The route sets `export const dynamic = 'force-dynamic'`, and Next's own
 * pre-Cache-Components guide still describes that as equivalent to `fetchCache = 'force-no-store'`
 * — but 16.3.2 does not behave that way. Verified against a production build: after rendering the
 * park page, `.next/cache/fetch-cache` holds the park, seasons and best-days responses with their
 * intended windows and tags intact. Caching on the fetch is what the rest of this file does, it
 * survives a redeploy, and it is reachable from `revalidateTag`; `unstable_cache` is the thing
 * Next 16 recommends against and would have bought nothing.
 *
 * `includeHourly: 'none'` because the summary is a statement about days, and the hourly curves
 * are the largest part of this payload. Asking for what nothing renders is the habit the API
 * budget doc exists to break.
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
 * Timeout-bounded month fetch for the calendar page's streamed summary.
 *
 * Same posture as {@link getBestDaysCalendarSeed}: consumed inside a `<Suspense>` boundary so it
 * never gates first byte, and a timeout resolves `null` — the page then renders without the
 * summary block, which is a page missing one card rather than a page missing its content — while
 * `after()` keeps the fetch alive so the next request finds the cache warm.
 *
 * `year`/`month` are 1-based calendar values. The range is built with `Date.UTC` so a park in a
 * zone with a midnight DST jump cannot lose the first or last day of its own month.
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
