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
import { hasTileRowHandoff, TILE_ROW_ATTR } from '@/lib/hooks/use-tile-row-anchor';
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
 * - The scroll on arrival stands down when the visitor came from the entry-tile row on a park
 *   sub-page, because `useTileRowAnchor` is putting the row back. Later `hashchange`s scroll as
 *   usual: those are somebody asking to be taken somewhere.
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

  /**
   * Slug from a `#map-show-<slug>` deep link, handed to `ParkMap` so it can centre on that show
   * and open its popup. Kept in state rather than read inside the map: `hashchange` is already
   * listened for here, and two components polling `location.hash` for the same convention is how
   * they end up disagreeing about it.
   */
  const [mapShowSlug, setMapShowSlug] = useState<string | null>(null);

  // The mount flip is a transition: it switches on the other panels, the tab bar's handlers and
  // the hash sync, none of which is worth blocking a tap that arrives during hydration.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    startTransition(() => setIsMounted(true));
  }, []);

  const tabsRef = useRef<HTMLDivElement>(null);
  /** Stops the in-flight deep-link scroll — a second hash arriving mid-poll must win. */
  const cancelScroll = useRef<(() => void) | null>(null);
  useEffect(() => () => cancelScroll.current?.(), []);

  useEffect(() => {
    if (!isMounted) return;

    // Only the FIRST run — the one that fires on mount — can have arrived from the entry-tile
    // row. Every later one is a `hashchange`, i.e. somebody asking to be taken somewhere.
    let isArrival = true;

    const handleHashChange = () => {
      const arrival = isArrival;
      isArrival = false;
      const hash = window.location.hash.slice(1);

      // `#calendar` and `#calendar-YYYY-MM` are the old calendar tab's addresses, still in
      // Google's index and in bookmarks, so they forward to the calendar page; a month outside the
      // route's window goes to the hub instead of a 404. `location.replace`, because the target is
      // a route with its own server render and a back button must not land on a forwarding URL.
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

      // `#map-show-<slug>` opens the map with that show's marker selected, which is how the
      // header panel's next-shows rows link. `#shows-<slug>` opens the shows chapter at that
      // show's card, a real anchor kept for bookmarks.
      const mapShow = /^map-show-(.+)$/.exec(hash);
      const deep = mapShow ? null : /^shows-(.+)$/.exec(hash);
      setMapShowSlug(mapShow ? mapShow[1] : null);
      const tabToActivate = mapShow ? 'map' : deep ? 'shows' : hash;

      const validTabs = ['attractions', 'shows', 'restaurants', 'map', 'weather'];
      if (validTabs.includes(tabToActivate)) {
        setActiveTab(tabToActivate);
        // A chapter cell on a park sub-page has already handed over the tile row's position, so
        // on that arrival only the tab switches. A `#shows-<slug>` link names a card and is exempt.
        if (deep || !arrival || !hasTileRowHandoff(parkSlug)) {
          cancelScroll.current?.();
          cancelScroll.current = scrollWhenSettled(
            () =>
              (deep ? document.getElementById(hash) : null) ??
              // The tile row, not `tabsRef.current`: that ref spans the whole header card, and
              // landing on its top would leave the newly active tab a full panel below the fold.
              tabsRef.current?.querySelector<HTMLElement>(`[${TILE_ROW_ATTR}]`) ??
              tabsRef.current
          );
        }
      }
    };

    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isMounted, locale, continent, country, city, parkSlug, timezone]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);

    const tab = value as TabChangedProps['tab'];
    if (['attractions', 'map', 'shows', 'restaurants', 'weather'].includes(tab)) {
      // No `parkId`: it names the same park as `parkName`, and every property is billed.
      trackTabChanged({
        tab,
        ...(park.name && { parkName: stripNewPrefix(park.name) }),
      });
    }

    window.history.replaceState(null, '', `${pathname}#${value}`);
  };

  return { isMounted, activeTab, handleTabChange, tabsRef, mapShowSlug };
}
