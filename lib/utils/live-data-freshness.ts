import type { ParkAttraction } from '@/lib/api/types';

/**
 * How old the park page's live data may get before the "as of" line under the filter panel says
 * so. The poll runs every five minutes, so ten minutes means at least one poll went missing: the
 * tab slept, the phone lost its signal, or the request failed.
 */
export const LIVE_DATA_STALE_AFTER_MS = 10 * 60_000;

/**
 * The newest `lastUpdated` of any queue in the server-rendered seed, or `null` when it has none.
 *
 * This is what the line shows BEFORE the first poll of the tab has answered, i.e. to a crawler,
 * to a reader without JavaScript, and in the first paint for everyone else. The page is cached
 * for up to a day, so the time the query last fetched is not something the seed knows; the queues
 * say when the backend last heard from the park, which is true of exactly the numbers on screen.
 * Once the poll answers, the line switches to the query's own `dataUpdatedAt`.
 */
export function newestQueueUpdate(attractions: ParkAttraction[] | undefined): number | null {
  let newest: number | null = null;
  for (const attraction of attractions ?? []) {
    for (const queue of attraction.queues ?? []) {
      const ms = Date.parse(queue.lastUpdated);
      if (Number.isFinite(ms) && (newest === null || ms > newest)) newest = ms;
    }
  }
  return newest;
}

export type LiveDataHint = 'offline' | 'outdated' | null;

/**
 * Whether the line should carry a warning, and which one.
 *
 * - `now === null` is the pre-mount render: no clock is read there (the static prerender forbids
 *   it, and a server clock would disagree with the browser's on hydration), so no warning.
 * - `offline` is React Query's `fetchStatus: 'paused'`: the browser reports no network, so the
 *   poll is not even attempted. That is the case "Offline" in DevTools produces.
 * - `outdated` covers the rest: the last attempt failed after its retries, or the newest answer is
 *   older than {@link LIVE_DATA_STALE_AFTER_MS}.
 *
 * Age is measured against `dataUpdatedAt` only. Before the first answer it is `0`, and the seed's
 * queue time is no measure of the connection: a park that closed at six reports six o'clock all
 * night, and the line would call every freshly loaded page outdated.
 */
export function liveDataHint({
  now,
  dataUpdatedAt,
  failed,
  paused,
}: {
  now: number | null;
  dataUpdatedAt: number;
  failed: boolean;
  paused: boolean;
}): LiveDataHint {
  if (now === null) return null;
  if (paused) return 'offline';
  if (failed) return 'outdated';
  if (dataUpdatedAt > 0 && now - dataUpdatedAt > LIVE_DATA_STALE_AFTER_MS) return 'outdated';
  return null;
}
