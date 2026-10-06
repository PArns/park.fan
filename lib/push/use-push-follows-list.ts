'use client';

import { useQuery } from '@tanstack/react-query';
import {
  fetchRideAlertsRemote,
  fetchShowFollowsRemote,
  type RideAlertRemote,
  type ShowFollowRemote,
} from './push-follows';

/**
 * Every ride alert and followed show this browser has, from the server: the local mirror in
 * `push-follows-store` is a cache for bells, not the truth for a surface that lists what is set.
 */

export interface PushFollowsList {
  rideAlerts: RideAlertRemote[];
  showFollows: ShowFollowRemote[];
  /** One of the two lists could not be read — what came back is incomplete, not complete-and-short. */
  partial: boolean;
}

export const PUSH_FOLLOWS_QUERY_KEY = ['push-follows'] as const;

/**
 * The server's list of this browser's alerts and follows. Gate `enabled` on
 * `hasAnyPushFollowsLocal()`, so a browser that never set one never asks.
 */
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
    // No stale window: on a surface somebody deletes from, a cached copy would offer a row that is
    // already gone or hide one just set. The hover hysteresis in `useMenuTrigger` keeps a pointer
    // crossing the bar from asking at all.
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
