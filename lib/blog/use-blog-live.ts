'use client';

import { useAttractionDetail } from '@/lib/hooks/use-attraction-detail';
import { useParkWaitTimes } from '@/lib/hooks/use-park-wait-times';
import { useRegionParks } from '@/lib/hooks/use-live-parks-by-region';
import { overlayAttraction, overlayPark, parkGeoParts } from '@/lib/blog/live-overlay';
import type { ResolvedAttraction, ResolvedPark } from '@/lib/blog/park-resolver';

/**
 * Blog posts are statically generated, so every park/ride reference in them is a snapshot of
 * whenever the post was last built — which is how a guide to an open park ended up showing all
 * twelve of its coasters as "closed". These hooks re-fetch the live values in the browser and
 * lay them over that snapshot.
 *
 * Both are batch calls shared through React Query, so the cost is per *park* in the post, not per
 * reference: one `/api/parks/live?regions=<continent>/<country>` for park status, one lean
 * `/api/parks/.../wait-times` for every ride in that park.
 */

/** Live park status/crowd/schedule over the build-time snapshot. `null` stays `null`. */
export function useLiveBlogPark(park: ResolvedPark | null): ResolvedPark | null {
  const { liveByParkId } = useRegionParks(
    park?.continentSlug ?? '',
    park?.countrySlug ?? '',
    !!park
  );
  if (!park) return null;
  return overlayPark(park, liveByParkId?.[park.id]);
}

interface UseLiveBlogRideOptions {
  /**
   * Also fetch the full attraction detail (today's average/peak and the sparkline series, which
   * the lean batch doesn't carry). Card surfaces turn this on once they're on screen or hovered;
   * the inline badges never need it.
   */
  withDetail?: boolean;
}

/**
 * Live park + ride over the build-time snapshot. Returns the overlaid pair so callers render one
 * consistent state — the park rule ("closed park ⇒ closed rides") needs both.
 */
export function useLiveBlogRide(
  park: ResolvedPark | null,
  attraction: ResolvedAttraction | null,
  { withDetail = false }: UseLiveBlogRideOptions = {}
): { park: ResolvedPark | null; attraction: ResolvedAttraction | null } {
  const livePark = useLiveBlogPark(park);
  const { continent, country, city, parkSlug } = parkGeoParts(park);
  const { live } = useParkWaitTimes(continent, country, city, parkSlug, !!attraction);
  const { data: detail } = useAttractionDetail({
    continent,
    country,
    city,
    parkSlug,
    attractionSlug: attraction?.attractionSlug ?? '',
    enabled: withDetail && !!attraction,
  });

  if (!livePark || !attraction) return { park: livePark, attraction };

  // The wait-times snapshot carries the park's own status too. It comes from the same read as the
  // queues, so it's the one that agrees with them — prefer it over the region batch here.
  const parkWithLiveStatus: ResolvedPark = live?.parkStatus
    ? { ...livePark, status: live.parkStatus }
    : livePark;

  return {
    park: parkWithLiveStatus,
    attraction: overlayAttraction(
      attraction,
      parkWithLiveStatus,
      live?.ridesBySlug[attraction.attractionSlug],
      detail
    ),
  };
}
