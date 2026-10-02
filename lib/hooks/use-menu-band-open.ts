'use client';

import { useSyncExternalStore } from 'react';

/**
 * Whether any of the header's menu bands (`MenuBand`) is open right now.
 *
 * Each band registers itself while it is open; the planner's edge tab reads the
 * answer and steps aside (PAR-70). The tab is `fixed` at the window's right edge
 * on `z-[60]`, above the band, and the band's content column reaches that edge
 * whenever the header is no wider than the column's tier — 1024 and 1280 px with
 * the planner shut, any width with it open. At 1280 px with eight alerts in the
 * favourites band the tab covered 14 of the 32 px of three remove buttons.
 *
 * A count rather than a boolean: one band's close and the next one's open land
 * in either order when the pointer crosses from one trigger to its neighbour.
 */
let openBands = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/** Called by a band when it opens; the returned function is its close. */
export function registerOpenMenuBand(): () => void {
  openBands += 1;
  if (openBands === 1) emit();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    openBands -= 1;
    if (openBands === 0) emit();
  };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => openBands > 0;
const getServerSnapshot = () => false;

export function useMenuBandOpen(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
