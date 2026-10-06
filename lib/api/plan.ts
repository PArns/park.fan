import { getApiBaseUrl, getServerApiHeaders } from '@/lib/api/client';
import type { PlanDay } from '@/lib/api/types';

/**
 * One day of a park, ride by ride and hour by hour: the series the trip planner draws. The API
 * composes it (hourly predictions reach 24 hours ahead, day-level ones 60 days), and `tier` says
 * which regime produced the curves, so a composed curve can be drawn differently from a measured
 * one. `no-store` and no `revalidate`: the route is client-fetched through the proxy, and its CDN
 * header is the one cache. See docs/rules/a-revalidate-at-a-call-site-is-somebody-elses-page.md.
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
    // The API's message for a 400 names the date it rejected.
    const body = await res.text().catch(() => '');
    throw new Error(
      `plan day ${parkSlug} ${date ?? 'today'}: ${res.status} ${res.statusText}${
        body ? ` — ${body.slice(0, 200)}` : ''
      }`
    );
  }
  return (await res.json()) as PlanDay;
}
