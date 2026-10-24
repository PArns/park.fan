'use client';

import { useSyncExternalStore } from 'react';

/**
 * Shared once-per-second clock for a readout nobody should pay for unseen: one module-level
 * interval for every subscriber, running only while someone is subscribed. A reader passes
 * `enabled` from `useActiveOnScreen`, which already covers the hidden tab, so there is no
 * visibility handling here. `null` on the server, in the hydration render and while disabled,
 * then epoch ms.
 */

const listeners = new Set<() => void>();
let nowMs: number | null = null;
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void): () => void {
  // A reading older than a tick may have been stamped for a render that never committed.
  if (listeners.size === 0 && (nowMs == null || Date.now() - nowMs >= 1_000)) {
    nowMs = Date.now();
  }
  listeners.add(listener);
  timer ??= setInterval(() => {
    nowMs = Date.now();
    listeners.forEach((l) => l());
  }, 1_000);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer != null) {
      clearInterval(timer);
      timer = null;
      nowMs = null;
    }
  };
}

// Stamped on first read rather than on subscribe, so a reader enabled after hydration paints the
// time on its first render instead of `null` first.
const getSnapshot = () => (nowMs ??= Date.now());
const getNull = () => null;
const subscribeToNothing = () => () => {};

/**
 * The browser clock, advancing every second on one shared timer while `enabled`. Disabled it
 * reads `null` and takes no subscription, so the timer stops with the last enabled reader.
 */
export function useSecondNow(enabled = true): number | null {
  return useSyncExternalStore(
    enabled ? subscribe : subscribeToNothing,
    enabled ? getSnapshot : getNull,
    getNull
  );
}
