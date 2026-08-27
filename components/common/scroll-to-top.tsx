'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from '@/i18n/navigation';
import { consumeScrollSuppression, onHistoryNavigation } from '@/lib/navigation/history-navigation';

/**
 * Scrolls to the top on client-side route changes.
 *
 * Next.js is supposed to do this itself, but its handler bails out whenever the new page's top
 * element is already inside the viewport — which our streamed Suspense shells hit on essentially
 * every navigation. In practice this component is the *only* thing that scrolls the page up, so
 * every guard below is load-bearing: a wrong skip leaves the visitor at the old scroll offset on
 * the new page.
 *
 * It must NOT scroll in the two cases where scrolling to the top is wrong:
 *
 * 1. **Back / forward navigation.** The App Router restores the previous scroll position on a
 *    history pop; forcing `scrollTo(0, 0)` afterwards throws that away and dumps the visitor at
 *    the top of a page they had scrolled halfway down.
 * 2. **Hash deep links.** `/parks/…/europa-park#calendar` (the park tab links, the blog TOC and
 *    every glossary anchor) must land on the target, not the top. The effect must also stay off
 *    the very first mount, or an incoming hash link visibly jumps to the top before the target
 *    scroll — on the park page `useTabHashRouting` then scrolled back down 500 ms later.
 * 3. **A link that asked not to.** Because this component exists, `<Link scroll={false}>` does
 *    nothing on its own: the prop stops the ROUTER's scroll, and the router is not what scrolls
 *    this app. `suppressScrollToTopFor(pathname)` in the link's `onClick` is the other half, and
 *    the calendar's month stepper is what needs it — stepping a month is the same page one month
 *    over, so throwing the reader back to the park's title card makes an arrow behave like a
 *    link to somewhere else.
 *
 * Detecting the pop is the subtle part. `popstate` cannot classify it: React 19 / the App Router
 * commit the new route from the `navigate` handling *before* `popstate` is dispatched, so a flag
 * set in a `popstate` listener arrives one navigation too late — it misses the pop it belongs to
 * and then suppresses the *next* forward navigation (clicking a blog link after a single Back was
 * enough to keep the previous page's scroll offset).
 *
 * So the classification runs off `history.pushState` instead: a forward navigation always pushes
 * before React commits, a pop never pushes. We scroll only when the committed pathname is the one
 * a `pushState` just announced.
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
