import type { LiveWaitTimes, NoLiveWaitTimesReason } from '@/lib/api/types';

/**
 * Why this park's wait times cannot be read, or `null` when they can. The one reader for the app.
 * An absent flag reads as available (older and cached responses predate it), and it is not a
 * freshness check: `false` means no number will ever arrive. Never derive this from the payload
 * instead; at 3 a.m. every park looks the same. See docs/rules/parks-we-cannot-read.md.
 */
export function noLiveWaitTimesReason(
  source: { liveWaitTimes?: LiveWaitTimes } | null | undefined
): NoLiveWaitTimesReason | null {
  const live = source?.liveWaitTimes;
  if (!live || live.available) return null;
  return live.reason ?? 'not_published';
}

/** Shorthand for the common `noLiveWaitTimesReason(park) !== null`. */
export function hasReadableWaitTimes(
  source: { liveWaitTimes?: LiveWaitTimes } | null | undefined
): boolean {
  return noLiveWaitTimesReason(source) === null;
}

/**
 * Drop a listing park's wait-derived stats when there is no source behind them, so a card does not
 * read „Ø 0 min · 0/82 open" for a park we simply have no numbers for. Cards already lay out around
 * the fields being absent. `totalAttractions` stays: the ride catalog is real.
 */
export function stripUnreadableWaitStats<T extends object>(park: T): T {
  // `T extends object` rather than an all-optional shape: TypeScript treats that as a weak type
  // and would reject the untyped `response.json()` this runs on in the favourites proxy.
  if (hasReadableWaitTimes(park as { liveWaitTimes?: LiveWaitTimes })) return park;
  const lean = { ...park } as T & { analytics?: unknown; operatingAttractions?: number };
  delete lean.analytics;
  delete lean.operatingAttractions;
  return lean;
}
