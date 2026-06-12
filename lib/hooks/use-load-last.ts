import { useEffect, useState } from 'react';
import { useIsFetching } from '@tanstack/react-query';

// Query-key prefixes of the deferred trip-planning queries themselves — they
// must not block their own release.
const DEFERRED_KEY_PREFIXES = ['park-best-days-calendar', 'park-historical-stats'];

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

  // In-flight queries other than the deferred ones themselves (reactive).
  const fetchingOthers = useIsFetching({
    predicate: (query) => !DEFERRED_KEY_PREFIXES.includes(query.queryKey[0] as string),
  });

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
