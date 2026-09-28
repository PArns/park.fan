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
 * match), then the current epoch ms, updated every minute. A reader mounted after
 * hydration gets the time on its first render.
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
  // The first subscriber re-stamps a reading older than a tick: `getSnapshot` below may have
  // stamped it for a render that never committed, and nothing kept it fresh since. A changed
  // value here is caught by React's post-subscribe check and re-rendered.
  if (listeners.size === 0 && (nowMs == null || Date.now() - nowMs >= 60_000)) {
    nowMs = Date.now();
  }
  listeners.add(listener);
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

// Stamped on first read rather than on subscribe. `subscribe` runs after the commit, so a
// component mounted after hydration as the clock's first reader used to render `null`, paint
// its fallback, and render again once its own subscription stamped the time.
const getSnapshot = () => (nowMs ??= Date.now());
const getNull = () => null;
const subscribeToNothing = () => () => {};

/**
 * `enabled: false` reads `null` and takes no subscription — for a reader that only needs the
 * clock while something is open, since a hook cannot be called conditionally.
 */
export function useMinuteNow(enabled = true): number | null {
  return useSyncExternalStore(
    enabled ? subscribe : subscribeToNothing,
    enabled ? getSnapshot : getNull,
    getNull
  );
}

/**
 * `useMinuteNow` as a `Date` — drop-in replacement for `useBrowserNow(60_000)`
 * call sites, but on the shared (visibility-paused) clock instead of a private
 * per-component interval.
 */
export function useMinuteNowDate(enabled = true): Date | null {
  const ms = useMinuteNow(enabled);
  return useMemo(() => (ms == null ? null : new Date(ms)), [ms]);
}
