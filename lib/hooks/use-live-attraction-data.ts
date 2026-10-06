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
 * Live data for the one ride a ride page is about, from the attraction detail the page already
 * fetches for its chart (same query key as `<AttractionHistorySections>`, one request) rather than
 * a poll of the whole park. It is overlaid on the `initialPark` shell, which holds the structural
 * fields and is what renders server-side.
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
    // Backs the live panel, so it polls.
    poll: true,
  });

  const shellAttraction = initialPark.attractions?.find((a) => a.slug === attractionSlug) ?? null;

  // Park-level: only `status` is live; the rest of the snapshot is structural. Without
  // `detail.park.status` the shell's value stays.
  const park: ParkWithAttractions = detail?.park?.status
    ? { ...initialPark, status: detail.park.status }
    : initialPark;

  // Ride-level: exactly the fields the live panel reads. Spreading `detail` would drag `schedule`
  // and `history` into an object the panel re-renders from, and clobber shell fields the detail
  // endpoint shapes differently.
  const attraction: ParkAttraction | null =
    shellAttraction && detail
      ? {
          ...shellAttraction,
          status: detail.status ?? shellAttraction.status,
          // `getLiveAttractionStatus` prefers this over everything else, and the shell's copy
          // comes from a fetch cached for a day. Cast because `effectiveStatus` is not on
          // `ParkAttraction` (it is read through an `in` guard in `park-utils`).
          ...((detail as { effectiveStatus?: ParkAttraction['status'] }).effectiveStatus
            ? {
                effectiveStatus: (detail as { effectiveStatus?: ParkAttraction['status'] })
                  .effectiveStatus,
              }
            : {}),
          // Always the key, never a `??` onto the day-cached shell (the rule `leanParkForLivePoll`
          // follows): a recovered ride would otherwise keep its outage until the shell is rebuilt.
          outage: detail.outage,
          // Same rule as `outage`, one line up: always the key, never a `??`
          // onto the day-cached shell.
          notRunToday: detail.notRunToday ?? null,
          queues: detail.queues ?? shellAttraction.queues,
          statistics: detail.statistics ?? shellAttraction.statistics,
          trend: detail.trend ?? shellAttraction.trend,
          bestVisitTimes: detail.bestVisitTimes ?? shellAttraction.bestVisitTimes,
          predictionAccuracy: detail.predictionAccuracy ?? shellAttraction.predictionAccuracy,
        }
      : shellAttraction;

  return { park, attraction, isFetching, isError, error };
}
