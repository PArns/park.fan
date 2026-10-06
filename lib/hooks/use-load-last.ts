import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { notifyManager, useQueryClient, type Query } from '@tanstack/react-query';

// Query-key prefixes of the deferred trip-planning queries themselves — they
// must not block their own release. Every query that gates itself on
// `useLoadLast` belongs here (or carries `LOAD_LAST_META`, below), or two of
// them starve each other: the second to mount counts the first as an
// outstanding "other" fetch and the grace window never closes.
const DEFERRED_KEY_PREFIXES = [
  'park-best-days-calendar',
  'park-historical-stats',
  'park-hourly-profile',
  'ride-day-curve',
];

/**
 * `meta` for a query that gates itself on `useLoadLast` but shares its key prefix with queries
 * that do not (`['calendar', …]` is also the grid's main content), so it does not count as
 * outstanding traffic in every other gate's window.
 */
export const LOAD_LAST_META = { loadLast: true } as const;

function isOtherTraffic(query: Query): boolean {
  if (query.meta?.loadLast === true) return false;
  return !DEFERRED_KEY_PREFIXES.includes(query.queryKey[0] as string);
}

const subscribeToNothing = () => () => {};

// How long the rest of the page must be network-idle before the deferred
// queries are released. Mount-time fetches dispatch within the same commit,
// so a short window is enough to catch them (and dependent queries they
// enable) before releasing.
const SETTLE_GRACE_MS = 300;

// Hard cap so the trip-planning sections can never be starved — e.g. by a
// poll that never goes idle or a hanging request.
const SAFETY_TIMEOUT_MS = 5000;

/**
 * Load-priority gate for the park page's heavy trip-planning queries (best-days calendar,
 * historical stats): `true` once every other React Query fetch on the page has been idle for a
 * short grace period, or after a safety timeout, and released for good after that. Live status,
 * wait times and weather load first; see docs/rules/park-page-loading-priority.md.
 */
export function useLoadLast(): boolean {
  const [released, setReleased] = useState(false);
  const client = useQueryClient();

  // In-flight queries other than the deferred ones, subscribed only until the gate is released:
  // after that nothing reads the count, and a live subscription re-renders every host on each poll.
  const subscribe = useCallback(
    (onChange: () => void) =>
      released
        ? subscribeToNothing()
        : client.getQueryCache().subscribe(notifyManager.batchCalls(onChange)),
    [client, released]
  );
  const countOthers = () => (released ? 0 : client.isFetching({ predicate: isOtherTraffic }));
  const fetchingOthers = useSyncExternalStore(subscribe, countOthers, countOthers);

  // Release after the page has been network-idle for the grace period. Any
  // fetch starting inside the window re-arms the timer (cleanup clears it).
  useEffect(() => {
    if (released || fetchingOthers > 0) return;
    const timer = setTimeout(() => setReleased(true), SETTLE_GRACE_MS);
    return () => clearTimeout(timer);
  }, [released, fetchingOthers]);

  useEffect(() => {
    if (released) return;
    const timer = setTimeout(() => setReleased(true), SAFETY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [released]);

  return released;
}
