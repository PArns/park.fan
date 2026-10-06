'use client';

import { useSyncExternalStore } from 'react';

/*
 * One gate for the whole page, not one per caller: the first subscriber arms the listener, the
 * flip notifies every subscriber in one batch, and anything mounted afterwards reads `true` on its
 * first render.
 */

let ready = false;
let armed = false;
const listeners = new Set<() => void>();

function flip(): void {
  ready = true;
  listeners.forEach((listener) => listener());
}

function arm(): void {
  if (armed) return;
  armed = true;
  const schedule = () => {
    const ric = window.requestIdleCallback;
    if (ric) ric(flip, { timeout: 2000 });
    else window.setTimeout(flip, 300);
  };
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  arm();
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => ready;
const getServerSnapshot = () => false;

/**
 * Returns `true` once the page has finished loading (`load` event) and the main thread next
 * goes idle. Use it to defer non-critical client work — decorative widgets, GeoIP/nearby
 * lookups, anything that isn't needed for first paint — out of the initial load window so it
 * can't compete with the LCP resource for bandwidth or main-thread time.
 *
 * SSR and the hydration render return `false` (so hydration matches); it flips to `true`
 * shortly after the page is interactive. A `requestIdleCallback` timeout (and a setTimeout
 * fallback for browsers without it) guarantees it always resolves.
 */
export function useAfterLoad(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
