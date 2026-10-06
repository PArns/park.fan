'use client';

import { useSyncExternalStore } from 'react';

/**
 * Whether a header menu band (`MenuBand`) is open whose content column runs under the
 * planner's edge tab.
 *
 * The tab is `fixed` at the header's right edge on `z-[60]`, above the band. The band's column
 * is capped per container tier and centred, so whether it reaches the tab depends on how wide
 * the header is: at 1024 and 1280 px with the planner shut the column ends 16 px before the
 * edge, at 1440 px 96 px before it. With eight alerts in the favourites band at 1280 px the tab
 * covered 14 of the 32 px of three remove buttons (PAR-70). A band registers here only when its
 * column reaches the tab's strip, and the tab steps aside while one does; at 1440 and 1920 px
 * nothing registers and the tab stays.
 *
 * A count rather than a boolean: one band's close and the next one's open land in either order
 * when the pointer crosses from one trigger to its neighbour.
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
