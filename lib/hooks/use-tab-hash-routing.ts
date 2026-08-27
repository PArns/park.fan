'use client';

import { startTransition, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { parkCalendarPath } from '@/lib/parks/calendar-segments';
import { stripNewPrefix } from '@/lib/utils';
import { trackTabChanged, type TabChangedProps } from '@/lib/analytics/umami';
import type { ParkWithAttractions } from '@/lib/api/types';

interface UseTabHashRoutingOptions {
  /** Tab rendered on the server / before hydration (avoids hydration mismatch). */
  defaultValue: string;
  /** Park identity for the tab-changed analytics event. */
  park: Pick<ParkWithAttractions, 'name'>;
  /** Geo segments, so an old `#calendar` deep link can be forwarded to the calendar PAGE. */
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
}

/**
 * URL-hash ↔ tab synchronization for the park page tabs.
 *
 * - Initializes with `defaultValue` to match server rendering, then activates the tab named
 *   in the URL hash on mount and on every `hashchange`, scrolling the tabs into view below the
 *   sticky header.
 * - `#calendar` and `#calendar-YYYY-MM` are the exception: the calendar left the tabs and became
 *   its own page, so those two forward there instead of selecting anything.
 * - `handleTabChange` tracks the analytics event and writes the new hash via
 *   `history.replaceState` (no navigation).
 */
export function useTabHashRouting({
  defaultValue,
  park,
  continent,
  country,
  city,
  parkSlug,
}: UseTabHashRoutingOptions) {
  const pathname = usePathname();
  const locale = useLocale();

  // Initialize with defaultValue to match server rendering (avoids hydration mismatch)
  const [activeTab, setActiveTab] = useState(defaultValue);

  // Avoid hydration mismatch by only rendering after mount.
  //
  // The flip is a TRANSITION: it swaps the server-rendered wait-time overview for the full
  // interactive card grid, which on a big park is 50+ glass cards with sparklines. As an urgent
  // update that landed in the same uninterruptible task as hydration — measured as a single
  // 1017 ms long task on a 4x-throttled Pixel 5, and a tap arriving inside it waits the whole
  // time (the first INP sample taken here showed ~1 s of input delay). At transition priority
  // React can yield to input while building the grid, so an early tap is answered instead of
  // queued behind it.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    startTransition(() => setIsMounted(true));
  }, []);

  const tabsRef = useRef<HTMLDivElement>(null);

  // Sync with URL hash on mount and on hash change
  useEffect(() => {
    if (!isMounted) return;

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);

      // `#calendar` and `#calendar-2026-04` are the old tab's addresses, and the calendar is a
      // page now. They are forwarded rather than ignored: they are in Google's index, in the FAQ
      // answers, in the best-days header link and in whatever anybody bookmarked, and dropping
      // them would land every one of those on the ride list with no explanation. The month part
      // rides along as the new page's hash, which is why that page kept the `calendar-YYYY-MM`
      // spelling.
      //
      // `location.replace`, not `router.replace`: a client navigation does not reliably carry a
      // fragment through to the incoming page's mount, and the calendar grid reads the hash in
      // its own mount effect to pick the month. Measured, `#calendar-2026-11` arrived as
      // `#calendar-2026-08` — the grid found no hash, fell into its else branch and wrote the
      // current month over the requested one. A document navigation puts the fragment in the URL
      // before anything on the new page runs. `replace` either way: the visitor asked for the
      // calendar, and a back button returning them to a URL that immediately forwards again is a
      // trap.
      if (hash === 'calendar' || /^calendar-\d{4}-\d{2}$/.test(hash)) {
        const target = `/${locale}${parkCalendarPath(locale, continent, country, city, parkSlug)}`;
        window.location.replace(hash === 'calendar' ? target : `${target}#${hash}`);
        return;
      }

      // `#shows-<slug>` opens the shows chapter AND scrolls to that show's card — the header
      // panel's "nächste Shows" rows link this way, so a row names a show and then puts you in
      // front of it. Same shape the calendar tab used for its month deep links, kept because the
      // convention is already in the codebase and in whatever anybody bookmarked.
      const deep = /^shows-(.+)$/.exec(hash);
      const tabToActivate = deep ? 'shows' : hash;

      const validTabs = ['attractions', 'shows', 'restaurants', 'map', 'weather'];
      if (validTabs.includes(tabToActivate)) {
        setActiveTab(tabToActivate);

        // Scroll with a manual offset calculation for better reliability. The panel content is
        // mounted through a `useDeferredValue`, so the card for a deep link does not exist yet at
        // this point — hence the delay, and hence falling back to the tab row when the card still
        // is not there (a slug that no longer matches a show must not leave the page put).
        setTimeout(() => {
          const headerOffset = 100; // Account for sticky header
          const target = (deep ? document.getElementById(hash) : null) ?? tabsRef.current;
          if (!target) return;
          const offsetPosition =
            target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }, 500);
      }
    };

    // Check hash on mount/update
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isMounted, locale, continent, country, city, parkSlug]);

  // Update URL hash when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);

    const tab = value as TabChangedProps['tab'];
    if (['attractions', 'map', 'shows', 'restaurants', 'weather'].includes(tab)) {
      // `parkId` was dropped: it identified the same park as `parkName`, and Umami bills every
      // property as another event (see the property budget in `lib/analytics/umami.ts`).
      trackTabChanged({
        tab,
        ...(park.name && { parkName: stripNewPrefix(park.name) }),
      });
    }

    // Update URL hash without triggering navigation
    window.history.replaceState(null, '', `${pathname}#${value}`);
  };

  return { isMounted, activeTab, handleTabChange, tabsRef };
}
