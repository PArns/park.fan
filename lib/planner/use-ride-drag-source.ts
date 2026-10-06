'use client';

import { useEffect } from 'react';
import {
  PLANNER_RIDE_MIME,
  buildRideDragPayload,
  rememberRideDrag,
  serializeRideDrag,
  setRideDragImage,
} from './ride-drag';

/**
 * Teach every ride card on the page what it is, for the length of a drag.
 *
 * One capture-phase listener on the document rather than a handler per card: `AttractionCard` is a
 * Server Component, and a client wrapper around it would break its `subgrid` layout. `dragstart`
 * bubbles while the DataTransfer is still writable, so this adds {@link PLANNER_RIDE_MIME} (park,
 * slug and name) and overwrites `text/uri-list` and `text/plain` with the ride's URL, which the
 * browser would otherwise take from whatever was grabbed, such as the photo. Only while the panel
 * is open, the only time there is anywhere to drop.
 */
export function useRideDragSource(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;

    const onDragStart = (event: DragEvent) => {
      const dt = event.dataTransfer;
      if (!dt) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>('a[data-planner-ride]');
      if (!anchor) return;

      const payload = buildRideDragPayload({
        slug: anchor.dataset.plannerRide,
        name: anchor.dataset.plannerRideName,
        href: anchor.getAttribute('href'),
      });
      if (!payload) return;

      try {
        dt.setData(PLANNER_RIDE_MIME, serializeRideDrag(payload));
        // `anchor.href`, absolute, so a drop outside this app gets a URL that resolves.
        dt.setData('text/uri-list', anchor.href);
        dt.setData('text/plain', anchor.href);
        // `copy`, as `startRideDrag` and every drop target here answer; `copyLink` let the browser
        // show a link cursor, so one gesture looked like two.
        dt.effectAllowed = 'copy';
      } catch {
        // A store in protected mode: nothing to add, and the fallback reads the browser's URL.
      }

      // What the panel's `dragover` reads, since the payload is unreadable until the drop. Outside
      // the `try`, as in `startRideDrag`.
      rememberRideDrag(payload);

      // The same chip the panel's own list hands over, rather than a snapshot of the whole card.
      setRideDragImage(dt, payload.attractionName, { element: anchor });
    };

    document.addEventListener('dragstart', onDragStart, true);
    return () => document.removeEventListener('dragstart', onDragStart, true);
  }, [enabled]);
}
