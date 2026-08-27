'use client';

import { startTransition, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  currentParkCalendarMonth,
  isParkCalendarMonthInRange,
  parkCalendarPath,
} from '@/lib/parks/calendar-segments';
import { stripNewPrefix } from '@/lib/utils';
import { trackTabChanged, type TabChangedProps } from '@/lib/analytics/umami';
import { scrollWhenSettled } from '@/lib/utils/scroll-when-settled';
import { hasTileRowHandoff } from '@/lib/hooks/use-tile-row-anchor';
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
  /** The park's zone — the window a forwarded month is checked against is measured from today
   *  THERE, exactly as the calendar route measures it. */
  timezone: string;
}

/**
 * URL-hash ↔ tab synchronization for the park page tabs.
 *
 * - Initializes with `defaultValue` to match server rendering, then activates the tab named
 *   in the URL hash on mount and on every `hashchange`, scrolling the tabs into view below the
 *   sticky header.
 * - `#calendar` and `#calendar-YYYY-MM` are the exception: the calendar left the tabs and became
 *   its own page, so those two forward there instead of selecting anything.
 * - `#map-show-<slug>` selects the map tab and reports the slug back as `mapShowSlug`, so the
 *   map can centre on that show and open its popup.
 * - `handleTabChange` tracks the analytics event and writes the new hash via
 *   `history.replaceState` (no navigation).
 * - The scroll on ARRIVAL stands down when the visitor got here from the entry-tile row on a park
 *   sub-page: that click already recorded where the row was, and `useTileRowAnchor` is putting it
 *   back. Two components positioning one element is how the row ended up somewhere neither of them
 *   meant. Later `hashchange`s scroll as before — those are somebody asking to be taken somewhere.
 */
export function useTabHashRouting({
  defaultValue,
  park,
  continent,
  country,
  city,
  parkSlug,
  timezone,
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
  /**
   * Slug from a `#map-show-<slug>` deep link, handed to `ParkMap` so it can centre on that show
   * and open its popup. Kept in state rather than read inside the map: `hashchange` is already
   * listened for here, and two components polling `location.hash` for the same convention is how
   * they end up disagreeing about it.
   */
  const [mapShowSlug, setMapShowSlug] = useState<string | null>(null);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    startTransition(() => setIsMounted(true));
  }, []);

  const tabsRef = useRef<HTMLDivElement>(null);
  /** Stops the in-flight deep-link scroll — a second hash arriving mid-poll must win. */
  const cancelScroll = useRef<(() => void) | null>(null);
  useEffect(() => () => cancelScroll.current?.(), []);

  // Sync with URL hash on mount and on hash change
  useEffect(() => {
    if (!isMounted) return;

    // Only the FIRST run — the one that fires on mount — can have arrived from the entry-tile
    // row. Every later one is a `hashchange`, i.e. somebody asking to be taken somewhere.
    let isArrival = true;

    const handleHashChange = () => {
      const arrival = isArrival;
      isArrival = false;
      const hash = window.location.hash.slice(1);

      // `#calendar` and `#calendar-2026-04` are the old tab's addresses, and the calendar is a
      // page now — the month included, which is why the month part becomes PATH segments here
      // rather than riding along as a hash. They are forwarded rather than ignored: they are in
      // Google's index, in the FAQ answers, in the best-days header link and in whatever anybody
      // bookmarked, and dropping them would land every one of those on the ride list with no
      // explanation.
      //
      // A month outside the window the calendar route serves falls back to the hub instead of
      // forwarding into a 404 — a five-year-old bookmark should still reach the calendar.
      //
      // `location.replace`, not `router.replace`: the target is a different route with its own
      // server render, and this is a one-time migration hop rather than navigation the visitor
      // asked for. `replace` either way — a back button returning them to a URL that immediately
      // forwards again is a trap.
      const month = /^calendar-(\d{4})-(\d{2})$/.exec(hash);
      if (hash === 'calendar' || month) {
        const parsed = month ? { year: Number(month[1]), month: Number(month[2]) } : null;
        const inRange =
          parsed &&
          parsed.month >= 1 &&
          parsed.month <= 12 &&
          isParkCalendarMonthInRange(parsed, currentParkCalendarMonth(timezone));
        window.location.replace(
          `/${locale}${parkCalendarPath(
            locale,
            continent,
            country,
            city,
            parkSlug,
            inRange ? parsed : undefined
          )}`
        );
        return;
      }

      // Two deep-link shapes, and they answer different questions about the same show.
      //
      // `#map-show-<slug>` opens the MAP with that show's marker selected — where is it, and how
      // do I walk there. The header panel's "nächste Shows" rows link this way: a row already
      // tells you the name and the time, so the thing it cannot tell you is the place.
      //
      // `#shows-<slug>` opens the shows chapter and scrolls to that show's card — the full
      // description and every showtime today. Nothing links to it any more, but it is a real
      // anchor with a `:target` ring, and it is in whatever anybody bookmarked.
      const mapShow = /^map-show-(.+)$/.exec(hash);
      const deep = mapShow ? null : /^shows-(.+)$/.exec(hash);
      setMapShowSlug(mapShow ? mapShow[1] : null);
      const tabToActivate = mapShow ? 'map' : deep ? 'shows' : hash;

      const validTabs = ['attractions', 'shows', 'restaurants', 'map', 'weather'];
      if (validTabs.includes(tabToActivate)) {
        setActiveTab(tabToActivate);
        // A chapter cell on a park sub-page links here with a hash, and it has already handed
        // over the position the tile row was at — so scrolling now would undo the one thing that
        // click was supposed to preserve. The tab still switches; only the scroll stands down.
        // A `#shows-<slug>` deep link is exempt: it names a card, not a chapter, and nobody
        // arrives on one from the row.
        if (deep || !arrival || !hasTileRowHandoff(parkSlug)) {
          cancelScroll.current?.();
          cancelScroll.current = scrollWhenSettled(
            () => (deep ? document.getElementById(hash) : null) ?? tabsRef.current
          );
        }
      }
    };

    // Check hash on mount/update
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isMounted, locale, continent, country, city, parkSlug, timezone]);

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

  return { isMounted, activeTab, handleTabChange, tabsRef, mapShowSlug };
}
