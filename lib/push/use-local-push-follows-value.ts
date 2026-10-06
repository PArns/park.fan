'use client';

import {
  useEffect,
  useState,
  type DependencyList,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { PUSH_FOLLOWS_CHANGED_EVENT } from './push-follows-store';

/**
 * The shape every bell shares: a server-safe `initialValue` first, then the real value from
 * `push-follows-store` once mounted and whenever any bell on the page changes it. `compute` runs
 * only in the effect, never in the first render, or hydration would not match the server. It is
 * left out of the effect's deps on purpose: `deps` says when to re-derive it.
 *
 * Returns a `useState` pair because the bells also set it optimistically from a click handler,
 * ahead of the store write that fires the same event.
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
