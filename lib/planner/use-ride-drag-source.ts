'use client';

import { useEffect } from 'react';
import { PLANNER_RIDE_MIME, buildRideDragPayload, serializeRideDrag } from './ride-drag';

/**
 * Teach every ride card on the page what it is, for the length of a drag.
 *
 * ONE listener on the document rather than a handler per card, and that is the
 * whole reason this works. `AttractionCard` is a Server Component rendered in
 * eight places; `onDragStart` is a client prop, so putting the source on the
 * card would mean either a client boundary around every ride grid in the app or
 * a wrapper element between the card and its parent grid — and the card lays out
 * with `row-span-3` + `grid-template-rows: subgrid`, so a wrapper breaks the
 * subgrid chain and slices the title and the wait time off (the trap
 * `design-system.md` records for the blog spotlight cards).
 *
 * A `dragstart` bubbles to the document, and the DataTransfer is still writable
 * while it does, so the panel can add its own payload to a drag the browser
 * started for a link it knows nothing about. Capture phase, so nothing further
 * down can stop the event before the payload is attached.
 *
 * Two things are written:
 *
 * - {@link PLANNER_RIDE_MIME}, carrying the park, the slug and the NAME. The
 *   name is the point: without it the drop had to find the ride in the
 *   `/plan/day` payload, which answers 404 until the backend ships, so every
 *   drop was a silent no.
 * - `text/uri-list` and `text/plain`, overwritten with the ride's own URL. The
 *   browser fills these in itself, but from whatever was grabbed — drag a card
 *   by its photo and it is the image file, which is why grabbing the picture
 *   (the obvious place to grab a card) never worked.
 *
 * Enabled only while the panel is open, because that is the only time there is
 * anywhere to drop.
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
        // `anchor.href` rather than the attribute: absolute, so a drop outside
        // this app gets a URL that resolves.
        dt.setData('text/uri-list', anchor.href);
        dt.setData('text/plain', anchor.href);
        dt.effectAllowed = 'copyLink';
      } catch {
        // A store in protected mode — the drag was not started by this gesture.
        // Nothing to add, and nothing is broken: the fallback path reads the
        // URL the browser put there.
      }
    };

    document.addEventListener('dragstart', onDragStart, true);
    return () => document.removeEventListener('dragstart', onDragStart, true);
  }, [enabled]);
}
