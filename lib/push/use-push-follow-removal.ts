'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { trackRideAlertRemoved, trackShowFollowRemove } from '@/lib/analytics/umami';
import { removeRideAlert, unfollowShow, type PushWriteError } from './push-follows';
import { PUSH_FOLLOWS_QUERY_KEY, type PushFollowsList } from './use-push-follows-list';

/**
 * Dropping one row from the two surfaces that list every alert this browser has, `/alerts` and
 * the favorites band's alerts group. The shared query cache is edited only once the server has
 * confirmed the removal, and the analytics event fires only then, so Umami counts removals
 * rather than clicks.
 */

/** `ride:<attractionId>` or `show:<showId>` — unique across both lists in one keyspace. */
export type PushFollowRowKey = string;

/** The row key of a ride alert. */
export function rideRowKey(attractionId: string): PushFollowRowKey {
  return `ride:${attractionId}`;
}

/** The row key of a show follow. */
export function showRowKey(showId: string): PushFollowRowKey {
  return `show:${showId}`;
}

export interface PushFollowRemoval {
  /** Whether this row's DELETE is still in flight. */
  isRemoving: (key: PushFollowRowKey) => boolean;
  /** Why this row's last removal failed, or `null` — cleared when it is tried again. */
  errorFor: (key: PushFollowRowKey) => PushWriteError | null;
  removeRide: (attractionId: string) => Promise<void>;
  removeShow: (showId: string) => Promise<void>;
}

/** Removes ride alerts and show follows from the shared list, with per-row busy and error state. */
export function usePushFollowRemoval(): PushFollowRemoval {
  const queryClient = useQueryClient();
  /**
   * The rows currently being deleted, a set rather than one key, so removing a second row neither
   * re-enables the first row's button nor clears its spinner.
   */
  const [removing, setRemoving] = useState<readonly PushFollowRowKey[]>([]);
  const [errors, setErrors] = useState<Readonly<Record<PushFollowRowKey, PushWriteError>>>({});
  /**
   * One pending expiry per row, for the one message that stops being true on its own.
   *
   * "Please try again in 42 seconds" is a claim with a shelf life, and `/alerts` is a page
   * somebody leaves open: without this it would still name that window ten minutes later. Every
   * other class ("that didn't work, try again") stays true until it is tried again, so only the
   * rate limit gets a timer.
   */
  const expiries = useRef(new Map<PushFollowRowKey, ReturnType<typeof setTimeout>>());
  /**
   * A removal outlives this hook: the band's alerts group unmounts the moment the menu closes,
   * and the DELETE it started keeps going. Draining the map on cleanup is therefore not enough —
   * a 429 landing after that would arm an hour-long timer nothing is left to clear.
   */
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const pending = expiries.current;
    return () => {
      mounted.current = false;
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  const forgetError = (key: PushFollowRowKey) => {
    const pending = expiries.current.get(key);
    if (pending !== undefined) {
      clearTimeout(pending);
      expiries.current.delete(key);
    }
    setErrors((current) => {
      if (!(key in current)) return current;
      const { [key]: _gone, ...rest } = current;
      return rest;
    });
  };

  const run = async (
    key: PushFollowRowKey,
    remove: () => Promise<{ ok: true } | { ok: false; error: PushWriteError }>,
    drop: (list: PushFollowsList) => PushFollowsList,
    track: () => void
  ) => {
    setRemoving((current) => (current.includes(key) ? current : [...current, key]));
    forgetError(key);
    const result = await remove();
    if (result.ok) {
      // A read that was already on its way was sent before this row was deleted, so letting it
      // land would put the row back — the band mounting while a removal from `/alerts` is in
      // flight is exactly that shape. Cancelling first is TanStack's own answer to it, and the
      // next `enabled` read (this query has no stale window) asks again anyway.
      await queryClient.cancelQueries({ queryKey: PUSH_FOLLOWS_QUERY_KEY });
      // The cache is the list, and it is edited only after the server has answered — anything
      // keyed on the local mirror would otherwise re-ask for a row while it was being deleted.
      queryClient.setQueryData<PushFollowsList>(PUSH_FOLLOWS_QUERY_KEY, (previous) =>
        previous ? drop(previous) : previous
      );
      track();
    } else {
      setErrors((current) => ({ ...current, [key]: result.error }));
      if (result.error.reason === 'rate-limited' && mounted.current) {
        // The very number the surfaces print. `classifyWriteFailure` has already bounded it, which is
        // what keeps the countdown and its expiry from disagreeing — and what keeps the delay
        // clear of the 32-bit overflow that would fire this timer at once instead of never.
        const seconds = result.error.retryAfterSeconds;
        expiries.current.set(
          key,
          setTimeout(() => {
            expiries.current.delete(key);
            setErrors((current) => {
              if (!(key in current)) return current;
              const { [key]: _expired, ...rest } = current;
              return rest;
            });
          }, seconds * 1000)
        );
      }
    }
    setRemoving((current) => current.filter((k) => k !== key));
  };

  return {
    isRemoving: (key) => removing.includes(key),
    errorFor: (key) => errors[key] ?? null,
    removeRide: (attractionId) =>
      run(
        rideRowKey(attractionId),
        () => removeRideAlert(attractionId),
        (list) => ({
          ...list,
          rideAlerts: list.rideAlerts.filter((a) => a.attractionId !== attractionId),
        }),
        trackRideAlertRemoved
      ),
    removeShow: (showId) =>
      run(
        showRowKey(showId),
        () => unfollowShow(showId),
        (list) => ({
          ...list,
          showFollows: list.showFollows.filter((s) => s.showId !== showId),
        }),
        trackShowFollowRemove
      ),
  };
}
