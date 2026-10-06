'use client';

import { useMemo, useSyncExternalStore } from 'react';

/**
 * Shared once-per-minute clock: one module-level interval for every subscriber, so a page of cards
 * repaints in one batched update rather than on staggered private timers. It pauses while the tab
 * is hidden and re-stamps on return. `null` on the server and in the hydration render, then epoch
 * ms; a reader mounted after hydration gets the time on its first render.
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

/**
 * The clock's raw subscription, for a store that keeps its own snapshot but should tick with this
 * one: the planner's minute counter (`lib/planner/minute-tick.ts`). Same timer, same hidden-tab
 * pause, so two clocks on one page repaint in one batch instead of twice a minute.
 */
export const subscribeToMinuteClock = subscribe;

// Stamped on first read rather than on subscribe: `subscribe` runs after the commit, so a first
// reader mounted after hydration would otherwise paint `null` and render again.
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

/** `useMinuteNow` as a `Date`, on the shared visibility-paused clock. */
export function useMinuteNowDate(enabled = true): Date | null {
  const ms = useMinuteNow(enabled);
  return useMemo(() => (ms == null ? null : new Date(ms)), [ms]);
}
