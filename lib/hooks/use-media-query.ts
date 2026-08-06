'use client';

import { useSyncExternalStore } from 'react';

/**
 * `true` while the viewport matches the given media query. Server/first client render is
 * always `false` (no hydration mismatch); updates only when the breakpoint is actually
 * crossed — unlike a resize listener, which re-runs a layout read on every resize frame.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}
