'use client';

import { useSyncExternalStore } from 'react';
import { parkyBoredom, type ParkyBoredom } from './parky-boredom';

const noSubscription = () => () => {};
const noBoredom = (): ParkyBoredom | null => null;

/**
 * How bored Parky is, from the page-wide {@link parkyBoredom}; `null` while `enabled` is false,
 * on the server and under reduced motion, so a disabled reader takes no subscription.
 */
export function useParkyBoredom(enabled: boolean): ParkyBoredom | null {
  return useSyncExternalStore(
    enabled ? parkyBoredom.subscribe : noSubscription,
    enabled ? parkyBoredom.getSnapshot : noBoredom,
    parkyBoredom.getServerSnapshot
  );
}
