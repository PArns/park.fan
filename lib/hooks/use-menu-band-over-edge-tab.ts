'use client';

import { useSyncExternalStore } from 'react';

/**
 * Whether a header menu band (`MenuBand`) is open whose content column runs under the planner's
 * edge tab, which sits `fixed` above the band at the header's right edge. Whether the capped,
 * centred column reaches it depends on the header's width, so a band registers only when it does,
 * and the tab steps aside meanwhile. A count rather than a boolean: one band's close and the next
 * one's open land in either order when the pointer crosses between triggers.
 */
let edgeBands = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/**
 * True when the band's content (the column minus its right padding) ends closer to the band's
 * right edge than the tab is wide. The band spans the header, and the tab sits on the header's
 * right edge whether the planner is shut (`right: 0`, header = window) or open (`right:
 * panelWidth`, header inset by the same width), so the two are compared in the band's own box.
 * Offsets rather than `getBoundingClientRect`, because the band's reveal animates a transform.
 */
export function columnReachesEdgeTab(column: HTMLElement): boolean {
  const tab = document.querySelector<HTMLElement>('[data-planner-edge-tab]');
  const band = column.offsetParent as HTMLElement | null;
  if (!tab || !band || tab.offsetWidth === 0) return false;
  const contentRight =
    column.offsetLeft + column.offsetWidth - parseFloat(getComputedStyle(column).paddingRight);
  return band.clientWidth - contentRight < tab.offsetWidth;
}

/** Called by a band that opened over the tab's strip; the returned function is its close. */
export function registerEdgeMenuBand(): () => void {
  edgeBands += 1;
  if (edgeBands === 1) emit();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    edgeBands -= 1;
    if (edgeBands === 0) emit();
  };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => edgeBands > 0;
const getServerSnapshot = () => false;

/**
 * Returns true while an open header menu band reaches the planner's edge tab, so `PlannerEdgeTab`
 * steps aside; false on the server.
 */
export function useMenuBandOverEdgeTab(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
