import 'server-only';

import { getApiBaseUrl, getServerApiHeaders } from '@/lib/api/client';
import { CACHE_TTL } from '@/lib/api/cache-config';
import {
  ORLANDO_REGION,
  type TripBestDays,
  type TripCalendar,
  type TripRegion,
  type TripWhen,
} from './types';

/**
 * The Orlando hub's server reads of the trip-region routes. SERVER ONLY: the keyed routes leave
 * the API only with the site's data key (docs/rules/a-forecast-leaves-only-with-a-key.md), and a
 * browser asks them through the relay instead (`orlandoRelayUrl`, `lib/orlando/paths.ts`).
 *
 * Every read goes through Next's Data Cache with the region's tag, so the many URLs of the hub
 * and its months cost one upstream call per window an hour, and `revalidateTag` can drop them all.
 * A failed read throws; the page decides what an absent answer means.
 */

/** The Data Cache tag on every trip-region read, for the API's revalidation webhook. */
export const TRIP_REGION_CACHE_TAG = `trip-region:${ORLANDO_REGION}`;

/** The query of a keyed read: a window, region-local. */
export interface TripWindow {
  from?: string;
  to?: string;
}

async function readTripRegion<T>(
  path: string,
  revalidate: number,
  query: Record<string, string | undefined> = {}
): Promise<T> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  const url = `${getApiBaseUrl()}/v1/trip-regions/${ORLANDO_REGION}${path}${qs ? `?${qs}` : ''}`;
  const response = await fetch(url, {
    next: { revalidate, tags: [TRIP_REGION_CACHE_TAG] },
    headers: { 'Content-Type': 'application/json', ...getServerApiHeaders() },
  });
  if (!response.ok) {
    throw new Error(`Trip region ${path || '/'} ${response.status}: ${response.statusText}`);
  }
  return (await response.json()) as T;
}

/** The region: its parks, groups, hotel areas and travel legs. Open, curated in code. */
export function getOrlandoRegion(): Promise<TripRegion> {
  return readTripRegion<TripRegion>('', CACHE_TTL.tripRegion);
}

/** Every park's days side by side, with the seasons that run on them; at most 92 days. */
export function getOrlandoCalendar(window: TripWindow = {}): Promise<TripCalendar> {
  return readTripRegion<TripCalendar>('/calendar', CACHE_TTL.tripRegionData, { ...window });
}

/** Each park's quiet and busy days in a window, as sets, and each resort's best dates. */
export function getOrlandoBestDays(
  window: TripWindow & { limit?: number } = {}
): Promise<TripBestDays> {
  const { limit, ...range } = window;
  return readTripRegion<TripBestDays>('/best-days', CACHE_TTL.tripRegionData, {
    ...range,
    limit: limit === undefined ? undefined : String(limit),
  });
}

/**
 * The best trip windows of a length in a range, planned for the headliner parks unless `parks`
 * says otherwise (`/when`). The API keeps an answer six hours by its query; the hub asks one per
 * range, so the Data Cache holds it the API's hour like the other keyed reads.
 */
export function getOrlandoWhen(
  query: TripWindow & { days?: number; limit?: number; parks?: string } = {}
): Promise<TripWhen> {
  const { days, limit, ...rest } = query;
  return readTripRegion<TripWhen>('/when', CACHE_TTL.tripRegionData, {
    ...rest,
    days: days === undefined ? undefined : String(days),
    limit: limit === undefined ? undefined : String(limit),
  });
}
