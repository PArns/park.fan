'use client';

import { useEffect, useState } from 'react';

/**
 * Returns `true` once the page has finished loading (`load` event) and the main thread next
 * goes idle. Use it to defer non-critical client work — decorative widgets, GeoIP/nearby
 * lookups, anything that isn't needed for first paint — out of the initial load window so it
 * can't compete with the LCP resource for bandwidth or main-thread time.
 *
 * SSR and the first client render return `false` (so hydration matches); it flips to `true`
 * shortly after the page is interactive. A `requestIdleCallback` timeout (and a setTimeout
 * fallback for browsers without it) guarantees it always resolves.
 */
export function useAfterLoad(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let idle: number | undefined;

    const schedule = () => {
      const ric = window.requestIdleCallback;
      idle = ric
        ? ric(() => !cancelled && setReady(true), { timeout: 2000 })
        : window.setTimeout(() => !cancelled && setReady(true), 300);
    };

    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener('load', schedule);
      if (idle != null) (window.cancelIdleCallback ?? window.clearTimeout)(idle);
    };
  }, []);

  return ready;
}
