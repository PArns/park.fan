'use client';

import { useMemo, useSyncExternalStore } from 'react';

/**
 * Shared once-per-minute clock.
 *
 * One module-level interval serves every subscriber (the park page mounts one
 * `WaitTimeSparklineCard` per attraction — previously each ran its OWN 60s
 * `setInterval`, so dozens of independent timers fired at staggered offsets and
 * repainted cards one after another every minute). All subscribers now tick in a
 * single batched update, and the interval stops when the last one unmounts.
 *
 * The clock also pauses while the tab is hidden (no wasted re-renders in
 * background tabs) and re-stamps immediately on return, so a long-hidden tab
 * never shows a stale minute.
 *
 * Returns `null` during SSR and the hydration render (so server and client HTML
 * match), then the current epoch ms, updated every minute.
 */

const listeners = new Set<() => void>();
let nowMs: number | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let visibilityListener: (() => void) | null = null;

function broadcast(): void {
  nowMs = Date.now();
  listeners.forEach((l) => l());
}

function startTimer(): void {
  if (timer == null) timer = setInterval(broadcast, 60_000);
}

function stopTimer(): void {
  if (timer != null) {
    clearInterval(timer);
    timer = null;
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (nowMs == null) nowMs = Date.now();
  if (!document.hidden) startTimer();
  if (visibilityListener == null) {
    visibilityListener = () => {
      if (document.hidden) {
        stopTimer();
      } else if (listeners.size > 0) {
        broadcast();
        startTimer();
      }
    };
    document.addEventListener('visibilitychange', visibilityListener);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      stopTimer();
      nowMs = null;
      if (visibilityListener != null) {
        document.removeEventListener('visibilitychange', visibilityListener);
        visibilityListener = null;
      }
    }
  };
}

const getSnapshot = () => nowMs;
const getServerSnapshot = () => null;

export function useMinuteNow(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * `useMinuteNow` as a `Date` — drop-in replacement for `useBrowserNow(60_000)`
 * call sites, but on the shared (visibility-paused) clock instead of a private
 * per-component interval.
 */
export function useMinuteNowDate(): Date | null {
  const ms = useMinuteNow();
  return useMemo(() => (ms == null ? null : new Date(ms)), [ms]);
}
