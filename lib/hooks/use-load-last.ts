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
  // The ride day curve gates itself on this hook too, so leaving it out made it
  // exactly the starvation case described above: on a ride page it and
  // `park-historical-stats` each counted the other as outstanding traffic and
  // kept re-arming the grace window.
  'ride-day-curve',
];

/**
 * `meta` for a query that gates itself on `useLoadLast` but whose key it shares with queries that
 * do not — `['calendar', …]` is the calendar grid's key too, where it is the page's main content
 * and must keep counting as traffic. The today panel's day detail is a deferred `calendar`
 * query; without the mark it counted as outstanding traffic in every other gate's window, the
 * starvation described above, and held the best-days calendar and the stats back by a round trip.
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
 * Load-priority gate for the park page's heavy trip-planning queries
 * (best-days calendar + historical stats).
 *
 * REQUIREMENT (docs/architecture/system-overview.md → "Park page loading
 * priority"): the best-travel-time data must ALWAYS load LAST. Live status,
 * wait times and every weather query (nowcast, hourly day view) load first —
 * the calendar/stats responses are the largest and slowest park requests
 * (cold backend compute can take 10–20 s) and must never compete with the
 * fast, user-visible live data for bandwidth or backend capacity.
 *
 * Returns `true` once every OTHER React Query fetch on the page has been idle
 * for a short grace period, or after a safety timeout. Once released it stays
 * released (later polls don't re-suspend the sections).
 */
export function useLoadLast(): boolean {
  const [released, setReleased] = useState(false);
  const client = useQueryClient();

  // In-flight queries other than the deferred ones themselves (reactive) — until the gate is
  // released, and not after. This was `useIsFetching`, which stays subscribed to the query cache
  // for the life of the page: every host of this hook (five on a park page, the ~1,000-line today
  // panel among them) re-rendered twice on every live poll and every nowcast refetch, for a count
  // nothing reads any more once `released` is true.
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
