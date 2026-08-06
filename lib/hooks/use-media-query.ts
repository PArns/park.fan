'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * `true` while the viewport matches the given media query. Server/first client render is
 * always `false` (no hydration mismatch); updates only when the breakpoint is actually
 * crossed — unlike a resize listener, which re-runs a layout read on every resize frame.
 *
 * `subscribe` and `getSnapshot` are memoized on the query string: passing fresh closures makes
 * React tear down and re-attach the `matchMedia` listener on every render of every consumer.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    [query]
  );
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
