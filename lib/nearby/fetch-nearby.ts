import { withParkCardImage, withRideCardImage, type CardImageMap } from '@/lib/media/card-images';
import type { NearbyAttractionsData, NearbyParksData, NearbyResponse } from '@/types/nearby';

/** The widest radius the API takes; it answers 400 above it. */
export const NEARBY_API_MAX_RADIUS_M = 10_000;

/**
 * A nearby answer with the card photo on every park in it, the in-park one included, and on every
 * ride in it (the short waits, the in-park rides) its own photo, as `/api/nearby` attaches them.
 */
export function withNearbyCardImages(map: CardImageMap, answer: NearbyResponse): NearbyResponse {
  if (answer.type === 'nearby_parks') {
    const data = answer.data as NearbyParksData;
    if (!data?.parks) return answer;
    return {
      ...answer,
      data: {
        ...data,
        parks: data.parks.map((p) => withParkCardImage(map, p)),
        shortWaits: data.shortWaits?.map((ride) => withRideCardImage(map, ride)),
      },
    };
  }
  if (answer.type === 'in_park') {
    const data = answer.data as NearbyAttractionsData;
    if (!data?.park) return answer;
    const park = { slug: data.park.slug, url: data.park.url };
    return {
      ...answer,
      data: {
        ...data,
        park: withParkCardImage(map, data.park),
        rides: data.rides?.map((ride) => {
          const { backgroundImage, backgroundPosition } = withRideCardImage(map, { ...ride, park });
          return { ...ride, backgroundImage, backgroundPosition };
        }),
      },
    };
  }
  return answer;
}

/** What one nearby request asks for. Without coordinates the API answers from the visitor's IP. */
export interface NearbyQuery {
  lat?: number;
  lng?: number;
  radius: number;
  limit: number;
  /** A `?sim=` preset, which only the relay applies (`lib/nearby-simulation.ts`). */
  sim?: string | null;
}

/** A nearby answer, or the error text to show for a failed one. */
export type NearbyResult = { ok: true; data: NearbyResponse } | { ok: false; message: string };

/**
 * One nearby request from the browser, always through `/api/nearby`: the API wants a key for the
 * park directory, and only the server holds one. The relay attaches the card photos.
 */
export async function fetchNearby(query: NearbyQuery): Promise<NearbyResult> {
  const url = new URL('/api/nearby', window.location.origin);
  if (query.lat !== undefined && query.lng !== undefined) {
    url.searchParams.set('lat', String(query.lat));
    url.searchParams.set('lng', String(query.lng));
  }
  url.searchParams.set('radius', String(Math.min(query.radius, NEARBY_API_MAX_RADIUS_M)));
  url.searchParams.set('limit', String(query.limit));
  if (query.sim) url.searchParams.set('sim', query.sim);

  const response = await fetch(url, { cache: 'no-store' });

  if (!response.ok) {
    // The relay names the problem in `error`, the API in `message`.
    const body = await response.json().catch(() => ({}));
    const message =
      typeof body?.message === 'string'
        ? body.message
        : typeof body?.error === 'string'
          ? body.error
          : `Failed to fetch nearby parks: ${response.statusText}`;
    return { ok: false, message };
  }

  const data = (await response.json()) as NearbyResponse;
  return { ok: true, data };
}
