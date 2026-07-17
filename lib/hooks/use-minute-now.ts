'use client';

import { useSyncExternalStore } from 'react';

/**
 * Shared once-per-minute clock.
 *
 * One module-level interval serves every subscriber (the park page mounts one
 * `WaitTimeSparklineCard` per attraction — previously each ran its OWN 60s
 * `setInterval`, so dozens of independent timers fired at staggered offsets and
 * repainted cards one after another every minute). All subscribers now tick in a
 * single batched update, and the interval stops when the last one unmounts.
 *
 * Returns `null` during SSR and the hydration render (so server and client HTML
 * match), then the current epoch ms, updated every minute.
 */

const listeners = new Set<() => void>();
let nowMs: number | null = null;
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (timer == null) {
    // Snapshot is stamped when the first subscriber arrives, then refreshed per tick.
    nowMs = Date.now();
    timer = setInterval(() => {
      nowMs = Date.now();
      listeners.forEach((l) => l());
    }, 60_000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer != null) {
      clearInterval(timer);
      timer = null;
      nowMs = null;
    }
  };
}

const getSnapshot = () => nowMs;
const getServerSnapshot = () => null;

export function useMinuteNow(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
