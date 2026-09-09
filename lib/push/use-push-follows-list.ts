'use client';

import { useQuery } from '@tanstack/react-query';
import {
  fetchRideAlertsRemote,
  fetchShowFollowsRemote,
  type RideAlertRemote,
  type ShowFollowRemote,
} from './push-follows';

/**
 * Every ride alert and followed show this browser has, from the server.
 *
 * The local mirror in `push-follows-store` is a cache for bells, not a source of truth for a
 * surface whose job is to show what is really set — the same reasoning `AlertsOverview`
 * documents. What the mirror IS good for is deciding whether to ask at all: a caller gates
 * `enabled` on `hasAnyPushFollowsLocal()`, so a browser that has never set an alert never makes
 * this request.
 */

export interface PushFollowsList {
  rideAlerts: RideAlertRemote[];
  showFollows: ShowFollowRemote[];
  /** One of the two lists could not be read — what came back is incomplete, not complete-and-short. */
  partial: boolean;
}

export const PUSH_FOLLOWS_QUERY_KEY = ['push-follows'] as const;

export function usePushFollowsList({ enabled }: { enabled: boolean }) {
  return useQuery<PushFollowsList>({
    queryKey: PUSH_FOLLOWS_QUERY_KEY,
    queryFn: async () => {
      const [rides, shows] = await Promise.all([fetchRideAlertsRemote(), fetchShowFollowsRemote()]);
      // Both refused: throw, so the caller gets `isError` and can say so. Folding that into an
      // empty list would tell somebody with five alerts that they have none, which is the exact
      // failure `PushListResult` exists to keep distinguishable.
      if (!rides.ok && !shows.ok) throw new Error('Failed to read push follows');
      return {
        rideAlerts: rides.ok ? rides.items : [],
        showFollows: shows.ok ? shows.items : [],
        partial: !rides.ok || !shows.ok,
      };
    },
    enabled,
    // No stale window on purpose, unlike `useFavorites`' five minutes. This is a handful of rows
    // of JSON behind a gate almost nobody passes, and it is a surface somebody DELETES from — a
    // cached copy would offer a row that is already gone, or hide one just set on the page
    // underneath. The 90 ms hover hysteresis in `useMenuTrigger` is what keeps a pointer crossing
    // the bar from asking at all.
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
