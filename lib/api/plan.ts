import { getServerApiHeaders } from '@/lib/api/client';
import type { PlanDay } from '@/lib/api/types';

// Same shape as `lib/api/stats.ts`: absolute on the server, relative in a
// browser, so the one function works from a Server Component and from the proxy
// route alike.
const getApiBaseUrl = () =>
  typeof window === 'undefined' ? process.env.NEXT_PUBLIC_API_URL || 'https://api.park.fan' : '';

/**
 * One day of a park, ride by ride and hour by hour — the series the trip planner
 * draws.
 *
 * The API composes this rather than looking it up: the model produces hourly
 * predictions 24 hours ahead and day-level ones out to 60 days, so a date in
 * between has no per-ride per-hour number of its own. `tier` on the response
 * says which regime produced the curves and is not decoration — a composed curve
 * and a measured one render identically unless the caller makes them differ.
 *
 * No `revalidate` argument, deliberately. A number typed at a call site becomes
 * the rebuild interval for every page that reaches it (see the caching rule in
 * CLAUDE.md), and this route is client-fetched through the proxy anyway, where
 * the CDN header decides. `no-store` here means the proxy always asks upstream
 * and the answer is cached once, at the edge, rather than twice with two
 * different clocks.
 */
export async function getPlanDay(
  continent: string,
  country: string,
  city: string,
  parkSlug: string,
  date?: string
): Promise<PlanDay | null> {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  const url = `${getApiBaseUrl()}/v1/parks/${continent}/${country}/${city}/${parkSlug}/plan/day${query}`;

  const res = await fetch(url, { headers: getServerApiHeaders(), cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) {
    // The API's own message for a 400 names which date it rejected, which is the
    // difference between "the planner is broken" and "that string is not a date".
    const body = await res.text().catch(() => '');
    throw new Error(
      `plan day ${parkSlug} ${date ?? 'today'}: ${res.status} ${res.statusText}${
        body ? ` — ${body.slice(0, 200)}` : ''
      }`
    );
  }
  return (await res.json()) as PlanDay;
}
