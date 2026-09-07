'use client';

/**
 * The subscription plumbing. Everything the HUD reads goes through one of these, and the reason
 * is the frame budget: the interface is React over a canvas that wants 60 fps, so a component
 * that re-renders because *something* changed is a component paying for every other component's
 * data.
 *
 * ## Why not just read the snapshot
 *
 * `useSyncExternalStore(subscribe, () => runtime.telemetry())` works and is wrong: the snapshot is
 * a new object on every publish, so all of it re-renders four times a second whether or not the
 * numbers it draws moved. {@link useTelemetry} takes a selector and caches its result, so a
 * component that selects `totals.guests` re-renders when the guest count changes and at no other
 * time. The cache has to live inside `getSnapshot` rather than beside it, because React calls
 * `getSnapshot` several times per check and compares the results with `Object.is` — returning a
 * fresh object from it is the classic infinite render loop.
 *
 * The same applies to core's own store, which is written far more often than it looks: the host
 * writes `metrics`/`clock`/`cash` twice a second and `environment` on every quarter park minute,
 * which at speed 3 is twelve times a real second. {@link useGame} is the selector version of
 * `useGameStore` for exactly that traffic.
 */

import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import type { GameStore, GameState } from '../core/store';
import type { UiRuntime } from './runtime';
import type { ParkTelemetry } from './telemetry';

export type Equal<T> = (a: T, b: T) => boolean;

/** Shallow array/object comparison, for a selector that has to return a list. */
export function shallowEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (!Object.is((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]))
      return false;
  }
  return true;
}

function useCachedSnapshot<S, T>(
  read: () => S,
  selector: (state: S) => T,
  equal: Equal<T>
): () => T {
  const cache = useRef<{ has: boolean; value: T }>({ has: false, value: undefined as T });
  return useCallback(() => {
    const next = selector(read());
    if (cache.current.has && equal(cache.current.value, next)) return cache.current.value;
    cache.current = { has: true, value: next };
    return next;
  }, [read, selector, equal]);
}

/**
 * Read a slice of the park telemetry.
 *
 * `selector` must be stable — a module-level function, or one wrapped in `useCallback`. An inline
 * arrow re-subscribes on every render and defeats the cache.
 */
export function useTelemetry<T>(
  runtime: UiRuntime,
  selector: (t: ParkTelemetry) => T,
  equal: Equal<T> = Object.is
): T {
  const read = useCallback(() => runtime.telemetry(), [runtime]);
  const get = useCachedSnapshot(read, selector, equal);
  return useSyncExternalStore(runtime.subscribe, get, get);
}

/** The whole snapshot, for a panel that draws most of it anyway. Re-renders at the publish rate. */
export function useTelemetrySnapshot(runtime: UiRuntime): ParkTelemetry {
  const read = useCallback(() => runtime.telemetry(), [runtime]);
  return useSyncExternalStore(runtime.subscribe, read, read);
}

/** Re-render when a panel opens, closes or registers. Returns the chrome revision. */
export function useChrome<T>(
  runtime: UiRuntime,
  selector: () => T,
  equal: Equal<T> = Object.is
): T {
  const read = useCallback(() => runtime, [runtime]);
  const sel = useCallback(() => selector(), [selector]);
  const get = useCachedSnapshot(read, sel, equal);
  return useSyncExternalStore(runtime.subscribeChrome, get, get);
}

/** A slice of core's store. Same contract as {@link useTelemetry}: keep the selector stable. */
export function useGame<T>(
  store: GameStore,
  selector: (s: GameState) => T,
  equal: Equal<T> = Object.is
): T {
  const read = useCallback(() => store.get(), [store]);
  const get = useCachedSnapshot(read, selector, equal);
  return useSyncExternalStore(store.subscribe, get, get);
}

/**
 * `true` while the viewport is narrower than the given width.
 *
 * A media query rather than a resize listener: the browser evaluates it once and tells us when it
 * flips, where a resize handler runs on every pixel of a window drag. `/game` mounts behind
 * `next/dynamic(..., { ssr: false })`, so there is no server render to disagree with — but the
 * server snapshot is still supplied, because a hook that throws in a server render is a hook
 * somebody will move one day.
 */
export function useNarrow(maxWidth = 640): boolean {
  const query = `(max-width: ${maxWidth - 0.02}px)`;
  const subscribe = useCallback(
    (fn: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener('change', fn);
      return () => mql.removeEventListener('change', fn);
    },
    [query]
  );
  const get = useCallback(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  }, [query]);
  return useSyncExternalStore(subscribe, get, () => false);
}

/** A stable selector built from one value, for the common `t.totals[key]` case. */
export function useTotal(runtime: UiRuntime, key: keyof ParkTelemetry['totals']): number {
  const selector = useMemo(() => (t: ParkTelemetry) => t.totals[key], [key]);
  return useTelemetry(runtime, selector);
}
