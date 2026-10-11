'use client';

import { useEffect, type Dispatch, type SetStateAction } from 'react';

/** The in-park compass, as the type of the component `useLoadParkCompass` hands over. */
export type ParkCompassComponent = typeof import('./park-compass').ParkCompass;

/**
 * Fetches the in-park compass's own module by hand once `wanted` is true and never before, so a
 * reader who is not standing in a park downloads none of it, then hands its component to `set`.
 * A setter and not a return value: the caller holds the component in its own `useState`, which is
 * what lets it render the component as one stable type. A chunk that does not arrive (a park's
 * mobile network) calls `onError`, so a caller waiting for the compass can stop waiting.
 */
export function useLoadParkCompass(
  wanted: boolean,
  set: Dispatch<SetStateAction<ParkCompassComponent | null>>,
  onError?: () => void
): void {
  useEffect(() => {
    if (!wanted) return;
    let live = true;
    import('./park-compass').then(
      (m) => {
        if (live) set(() => m.ParkCompass);
      },
      () => {
        if (live) onError?.();
      }
    );
    return () => {
      live = false;
    };
  }, [wanted, set, onError]);
}
