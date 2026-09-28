import { useSyncExternalStore } from 'react';

/**
 * Whether the in-park compass is on the homepage right now, for the hero's pill that scrolls to it.
 *
 * The compass decides for itself whether it renders (in a park with headliners in season, or the
 * `?sim=compass` demo, where the hero stays on the device's real position and knows nothing of
 * the park), so the hero cannot work it out from its own nearby answer. The compass slot says so
 * here while it is mounted, and the hero reads it. The id is the anchor the pill scrolls to.
 */
export const PARK_COMPASS_ID = 'park-compass';

let present = false;
const listeners = new Set<() => void>();

export function setCompassPresent(value: boolean): void {
  if (present === value) return;
  present = value;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useCompassPresent(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => present,
    () => false
  );
}
