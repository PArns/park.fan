'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from '@/i18n/navigation';

/**
 * Scrolls to the top on client-side route changes.
 *
 * Next.js already scrolls to the top itself for forward navigations, so this only exists as a
 * safety net for the cases where its heuristic bails out (it skips the scroll when the new page
 * doesn't render a focusable top element, which our streamed Suspense shells can hit).
 *
 * It must NOT fight the two cases where scrolling to the top is wrong:
 *
 * 1. **Back / forward navigation.** The App Router restores the previous scroll position on a
 *    history pop; forcing `scrollTo(0, 0)` afterwards threw that away and dumped the visitor at
 *    the top of a page they had scrolled halfway down.
 * 2. **Hash deep links.** `/parks/…/europa-park#calendar` (the park tab links, the blog TOC and
 *    every glossary anchor) must land on the target, not the top. The effect also ran on the very
 *    first mount, so an incoming hash link visibly jumped to the top before the target scroll —
 *    on the park page `useTabHashRouting` then scrolled back down 500 ms later.
 *
 * So: skip the first mount entirely (the browser owns the initial position, including hash and
 * reload restoration) and skip pops and hash targets afterwards.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);
  const isPopNavigation = useRef(false);

  // `popstate` fires before the router commits the new pathname, so this flag is set by the
  // time the pathname effect below runs for a back/forward navigation.
  useEffect(() => {
    const onPopState = () => {
      isPopNavigation.current = true;
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isPopNavigation.current) {
      isPopNavigation.current = false;
      return;
    }
    if (window.location.hash) return;
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
