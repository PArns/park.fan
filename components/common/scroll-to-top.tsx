'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from '@/i18n/navigation';
import { consumeScrollSuppression, onHistoryNavigation } from '@/lib/navigation/history-navigation';

/**
 * Scrolls to the top on client-side route changes. Next's own handler bails out whenever the new
 * page's top element is already in the viewport, which streamed Suspense shells hit on nearly every
 * navigation, so this is the only thing that scrolls the page up. It does not scroll:
 *
 * 1. On back/forward, where the App Router restores the previous position.
 * 2. On a hash deep link, which must land on its target, or on the first mount.
 * 3. For a link that asked not to: `<Link scroll={false}>` only stops the router's scroll, so such
 *    a link also calls `suppressScrollToTopFor(pathname)` (the calendar's month stepper).
 *
 * A pop is detected through `history.pushState`, not `popstate`: the App Router commits a pop
 * before `popstate` fires, so a flag set there lands one navigation late. A forward navigation
 * always pushes before the commit, so it scrolls only when the committed pathname is the one a
 * `pushState` just announced.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);
  /** Pathname of the most recent `pushState`, i.e. the pending forward navigation. */
  const pushedPathname = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = onHistoryNavigation((destination, type) => {
      if (type === 'push') pushedPathname.current = destination.pathname;
    });
    // Fires after the commit, so it can only clear a value the effect below is done with — it
    // drops pushes that never produced a route change (a hash-only push, a locale swap) instead
    // of letting them sit around and match a later navigation by coincidence.
    const onPopState = () => {
      pushedPathname.current = null;
    };
    window.addEventListener('popstate', onPopState);
    return () => {
      unsubscribe();
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  useEffect(() => {
    const pushed = pushedPathname.current;
    pushedPathname.current = null;

    // The browser owns the initial position, including hash targets and reload restoration.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Read it either way, so a flag set by a click that never navigated cannot outlive this run.
    const suppressed = consumeScrollSuppression(window.location.pathname);

    // No `pushState` announced this route, so it's a back/forward — leave the restored offset be.
    if (pushed === null || pushed !== window.location.pathname) return;
    if (window.location.hash) return;
    if (suppressed) return;
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
