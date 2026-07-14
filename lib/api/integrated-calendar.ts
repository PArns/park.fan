import { after } from 'next/server';
import { getServerAuthHeaders } from './client';
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
      ...getServerAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(`Best-days ${response.status}: ${response.statusText}`);
  }

  return (await response.json()) as BestDaysSnapshot;
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
 * How long the park page's SSR render may wait for the best-days snapshot before giving up.
 * Now a formality: `/best-days` is a precomputed Redis read (p99 < 300 ms) behind the Next data
 * cache, so this only ever guards a genuinely cold data-cache miss meeting a slow network — and
 * a miss just drops the SSR seed for that one request (the client queries fill the section as
 * before; `after()` completes the cache fill for the next request).
 */
const BEST_DAYS_SEED_TIMEOUT_MS = 800;

/**
 * TTFB-safe wrapper around {@link getBestDaysCalendar} for the park page's SERVER render.
 *
 * Waits at most {@link BEST_DAYS_SEED_TIMEOUT_MS}; on timeout it renders WITHOUT the seed (the
 * client queries fill the section, exactly the pre-seed behavior) while `after()` keeps the fetch
 * alive past the response so it still fills the Next data cache and the NEXT request gets the seed
 * instantly. Returns `null` on timeout or any error — callers treat `null` as "no seed", never as
 * an empty calendar.
 */
export async function getBestDaysCalendarSeed(
  continent: string,
  country: string,
  city: string,
  parkSlug: string
): Promise<BestDaysSnapshot | null> {
  const snapshotPromise = getBestDaysCalendar(continent, country, city, parkSlug).catch(() => null);

  const result = await Promise.race([
    snapshotPromise,
    new Promise<'timeout'>((resolve) => {
      setTimeout(() => resolve('timeout'), BEST_DAYS_SEED_TIMEOUT_MS);
    }),
  ]);

  if (result === 'timeout') {
    after(() => snapshotPromise);
    return null;
  }

  return result;
}
