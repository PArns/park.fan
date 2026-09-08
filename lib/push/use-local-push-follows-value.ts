'use client';

import { useEffect, useState, type DependencyList, type Dispatch, type SetStateAction } from 'react';
import { PUSH_FOLLOWS_CHANGED_EVENT } from './push-follows-store';

/**
 * The shape every bell shares: render a server-safe default, then read the
 * real value from `push-follows-store` (localStorage) once mounted, and
 * again whenever any bell on the page changes it. `initialValue` must be
 * the value a server render would produce — `compute` runs only on the
 * client, in the effect, never during the initial render, or the client's
 * first pass would disagree with the server's and React would log a
 * hydration mismatch (the same reasoning `FavoriteStar` documents).
 *
 * `compute` is read fresh on every run rather than added to the effect's own
 * dependency list — it closes over whatever the caller's last render built
 * it with, and re-deriving it is the point of `deps` changing.
 *
 * Returns a `useState` pair rather than a bare value: `RideAlertBell` and
 * `ShowFollowBell` also set this optimistically from a click handler ahead
 * of the store write that will fire the very same event, and a bare value
 * would give them nothing to call.
 */
export function useLocalPushFollowsValue<T>(
  initialValue: T,
  compute: () => T,
  deps: DependencyList
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(compute());
    const handleChanged = () => setValue(compute());
    window.addEventListener(PUSH_FOLLOWS_CHANGED_EVENT, handleChanged);
    return () => window.removeEventListener(PUSH_FOLLOWS_CHANGED_EVENT, handleChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return [value, setValue];
}
