import type { ParkAttraction } from '@/lib/api/types';

/**
 * How old the park page's live data may get before the „as of" line says so. The poll runs every
 * five minutes, so ten means at least one poll went missing.
 */
export const LIVE_DATA_STALE_AFTER_MS = 10 * 60_000;

/**
 * The newest `lastUpdated` of any queue in the server-rendered seed, or `null`. Shown before the
 * tab's first poll answers (to crawlers, without JavaScript, and in the first paint): the page is
 * cached, so only the queues know when the backend last heard from the park. After the first poll
 * the line uses the query's `dataUpdatedAt`.
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

/** The warning the „as of" line carries, if any. */
export type LiveDataHint = 'offline' | 'outdated' | null;

/**
 * Whether the line should carry a warning, and which one. `now === null` is the pre-mount render,
 * where no clock is read, so no warning. `offline` is React Query's paused fetch (no network);
 * `outdated` is a failed poll or an answer older than {@link LIVE_DATA_STALE_AFTER_MS}. Age is
 * measured only against `dataUpdatedAt`: a closed park's seed queues report closing time all night.
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
