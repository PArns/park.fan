import type { LiveWaitTimes, NoLiveWaitTimesReason } from '@/lib/api/types';

/**
 * Why this park's wait times cannot be read — `null` when they can.
 *
 * One reader for the whole app so no surface invents its own rule. Two things it
 * deliberately does:
 *
 * - **An absent field reads as available.** The flag ships in v4.api.park.fan and
 *   this app deploys independently, so every response predating it — and every
 *   cached one — must keep behaving exactly as before rather than warning about
 *   parks that are fine.
 * - **It is not a freshness check.** A park whose feed went quiet an hour ago is
 *   still `available: true`; the API's staleness and movement rules own that case.
 *   `false` means no number will ever arrive.
 *
 * Never derive this from the payload instead (all rides closed, zero average, an
 * empty `queues`): at 3 a.m. every park in the catalog looks exactly like this.
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
 * Drop a listing park's wait-derived stats when there is no source behind them.
 *
 * For these parks `analytics` is an aggregate over an empty set and
 * `operatingAttractions` counts rides nobody can see — on a card that renders as
 * "Ø 0 min · 0/82 open", which reads as a park in trouble rather than one we have
 * no numbers for. Cards already lay out around these fields being absent (it is
 * what they show while a poll is in flight), so removing them needs no new branch
 * card-side and no explanatory copy on a surface with no room for it.
 *
 * Applied where a listing response is unpacked, so nothing downstream has to
 * remember the rule. `totalAttractions` stays: the ride catalog is real.
 */
export function stripUnreadableWaitStats<T extends object>(park: T): T {
  // `T extends object`, not a shape with the three fields on it: every optional-only
  // constraint is a weak type, and TypeScript rejects an argument sharing none of its
  // properties — which is exactly the untyped `await response.json()` this runs on in
  // the favourites proxy. The fields are read through a cast instead, and a park
  // missing all three simply comes back unchanged.
  if (hasReadableWaitTimes(park as { liveWaitTimes?: LiveWaitTimes })) return park;
  const lean = { ...park } as T & { analytics?: unknown; operatingAttractions?: number };
  delete lean.analytics;
  delete lean.operatingAttractions;
  return lean;
}
