import { useSyncExternalStore, type MouseEvent } from 'react';
import { trackSiteEvent } from '@/lib/analytics/site-analytics';

/**
 * Whether the in-park compass is on the homepage right now, for the hero's link that scrolls to
 * it. The compass decides for itself whether it renders (the `?sim=compass` demo included), so the
 * hero cannot work it out from its own nearby answer; the compass slot reports it here while
 * mounted. The id is the anchor the link scrolls to.
 */
export const PARK_COMPASS_ID = 'park-compass';

let present = false;
const listeners = new Set<() => void>();

/**
 * Records whether the in-park compass is mounted on the homepage and notifies `useCompassPresent`
 * readers when it changes.
 */
export function setCompassPresent(value: boolean): void {
  if (present === value) return;
  present = value;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Returns true while the in-park compass is mounted on the homepage, so the hero can show its link;
 * false on the server.
 */
export function useCompassPresent(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => present,
    () => false
  );
}

/**
 * The click of a link to `#park-compass`: scrolls to the compass and hands it the focus, so a
 * keyboard or screen reader lands where the eye does. Without JavaScript the link is a plain
 * fragment link; the smooth scroll is dropped under reduced motion.
 */
export function jumpToCompass(event: MouseEvent<HTMLAnchorElement>): void {
  trackSiteEvent('compass_pill_clicked', {});
  const target = document.getElementById(PARK_COMPASS_ID);
  if (!target) return;
  event.preventDefault();
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
  target.focus({ preventScroll: true });
}
