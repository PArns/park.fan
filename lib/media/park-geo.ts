import 'server-only';

import { getApiBaseUrl, getServerApiHeaders } from '@/lib/api/client';
import type { GeoPark } from './geo';

/** A park with coordinates, and the API path its rides are read from. */
export type GeoParkRecord = GeoPark & { url?: string };

/**
 * An hour: the admin compares a photo's position against a park's, and a park's coordinate changes
 * only with a correction.
 */
export const PARK_GEO_REVALIDATE_SECONDS = 3600;

interface ApiParkRow {
  slug: string;
  name: string;
  latitude?: string;
  longitude?: string;
  url?: string;
}

/**
 * Every park that has coordinates, for the media admin's GPS checks. One loader for the browser and
 * the upload analysis, so both measure against the same list. A failure is an empty list: the check
 * is advice, and the editor works without it.
 */
export async function loadParkGeoCatalog(): Promise<GeoParkRecord[]> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/v1/parks?limit=1000`, {
      headers: getServerApiHeaders(),
      signal: AbortSignal.timeout(15_000),
      next: { revalidate: PARK_GEO_REVALIDATE_SECONDS },
    });
    if (!response.ok) return [];
    const parks: ApiParkRow[] = (await response.json()).data ?? [];
    return parks
      .filter((park) => park.latitude && park.longitude)
      .map((park) => ({
        slug: park.slug,
        name: park.name,
        latitude: Number(park.latitude),
        longitude: Number(park.longitude),
        url: park.url,
      }));
  } catch {
    return [];
  }
}
