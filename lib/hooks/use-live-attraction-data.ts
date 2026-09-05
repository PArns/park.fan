import { useAttractionDetail } from './use-attraction-detail';
import type { ParkAttraction, ParkWithAttractions } from '@/lib/api/types';

interface UseLiveAttractionDataParams {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  attractionSlug: string;
  initialPark: ParkWithAttractions;
}

/**
 * Live data for the ONE ride a ride page is about.
 *
 * This used to poll the whole park (`useLiveParkData` → `/api/parks/<geo>/<park>`) — a ~90 KB
 * payload carrying every ride in the park, every 5 minutes — and read four things out of it:
 * `park.status`, `park.timezone`, and the one attraction's live queues/stats. Measured on
 * `/de/…/phantasialand/taron` that was 2 requests and 143 KB per view, on the site's
 * highest-traffic route (~25k views/day).
 *
 * All of it now comes from the attraction detail the page already fetches for its chart and
 * history grid: `park.timezone` was always on that response and `park.status` was added for this
 * (v4.api.park.fan#148), so the second request is simply gone. Same React Query key as
 * `<AttractionHistorySections>`, so the two still share a single fetch.
 *
 * The `initialPark` shell snapshot stays the base: it holds the structural fields (timezone, name,
 * schedule) that don't change within a session, and it is what renders server-side before any
 * client fetch lands. The detail is overlaid on top of it once available.
 */
export function useLiveAttractionData({
  continent,
  country,
  city,
  parkSlug,
  attractionSlug,
  initialPark,
}: UseLiveAttractionDataParams) {
  const {
    data: detail,
    isFetching,
    isError,
    error,
  } = useAttractionDetail({
    continent,
    country,
    city,
    parkSlug,
    attractionSlug,
    // This hook backs the live panel, so it needs the 5-minute cadence the park poll had.
    poll: true,
  });

  const shellAttraction = initialPark.attractions?.find((a) => a.slug === attractionSlug) ?? null;

  // Park-level: only `status` is live. Everything else on the snapshot (timezone, name, schedule)
  // is structural. `detail.park.status` is optional on the type — an API predating #148 leaves the
  // shell's value in place rather than forcing a closed park's rides to look open.
  const park: ParkWithAttractions = detail?.park?.status
    ? { ...initialPark, status: detail.park.status }
    : initialPark;

  // Ride-level: overlay exactly the fields the live panel reads. Spreading `detail` wholesale would
  // drag `schedule` and `history` (47 KB of the response) into an object the panel re-renders from,
  // and would clobber shell fields the detail endpoint shapes differently.
  const attraction: ParkAttraction | null =
    shellAttraction && detail
      ? {
          ...shellAttraction,
          status: detail.status ?? shellAttraction.status,
          // The field `getLiveAttractionStatus` prefers over everything else, and the one this
          // overlay used to leave behind: without it the ride page read `effectiveStatus` off the
          // shell, which comes from a fetch cached for a day. A ride that opened at 10:00, or went
          // DOWN at 13:00 and recovered at 13:40, kept whatever the shell was written with for the
          // rest of the day — so the fold said „Geschlossen" with no number while the chart under
          // it drew today's live curve. Cast because `effectiveStatus` is not on `ParkAttraction`
          // (it is read through an `in` guard in `park-utils`), but both payloads carry it.
          ...((detail as { effectiveStatus?: ParkAttraction['status'] }).effectiveStatus
            ? {
                effectiveStatus: (detail as { effectiveStatus?: ParkAttraction['status'] })
                  .effectiveStatus,
              }
            : {}),
          queues: detail.queues ?? shellAttraction.queues,
          statistics: detail.statistics ?? shellAttraction.statistics,
          trend: detail.trend ?? shellAttraction.trend,
          bestVisitTimes: detail.bestVisitTimes ?? shellAttraction.bestVisitTimes,
          predictionAccuracy: detail.predictionAccuracy ?? shellAttraction.predictionAccuracy,
        }
      : shellAttraction;

  return { park, attraction, isFetching, isError, error };
}
