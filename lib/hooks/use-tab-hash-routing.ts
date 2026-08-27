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

    const handleHashChange = () => {
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
        cancelScroll.current?.();
        cancelScroll.current = scrollWhenSettled(
          () => (deep ? document.getElementById(hash) : null) ?? tabsRef.current
        );
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

/** How far below the viewport's top edge a scrolled-to element comes to rest — the sticky bar
 *  plus a little air. */
const HEADER_OFFSET = 100;
/** Give up looking for a deep-link target and scroll to the tab row instead. */
const TARGET_DEADLINE_MS = 4000;
/** Stop correcting once the target has held still this long — ~15 frames. */
const STABLE_FRAMES = 15;
/** Hard stop for the correction phase, however busy the page stays. */
const SETTLE_DEADLINE_MS = 6000;

/**
 * Scroll to an element and keep correcting until the page stops moving underneath it.
 *
 * The single `setTimeout(…, 500)` this replaces measured a document that was still rearranging,
 * and the deep link paid for it. A cold load of `#shows-<slug>` arrives on the server-rendered
 * pre-mount overview, which lists every attraction the park has; the card the hash names is inside
 * the tab panel and does not exist yet, so the fallback fired against that tall document and
 * scrolled 3974 px down — and then the overview collapsed into the short shows panel, the document
 * went 6817 → 5374 px, and the card the visitor had asked for ended up 2907 px ABOVE the viewport.
 * Nothing re-checked, so that is where they stayed: on the footer of a page they came to for one
 * show.
 *
 * Waiting longer does not fix it and neither does waiting for a quiet frame. Measured on this
 * page, the document goes 6817 → 13330 → 5194 → 5374 px, and the 13330 is the moment both the
 * overview and the panel are in the tree at once. A "has it settled" test lands inside that peak
 * as readily as anywhere else, and one measurement taken there is as wrong as one taken at 500 ms.
 *
 * So the position is not measured once but MAINTAINED. The reading it watches is the target's
 * DOCUMENT offset (`rect.top + scrollY`), which is invariant under scrolling — so a change in it
 * means the layout above the target moved, never that a smooth scroll is in flight, and the two
 * cannot be confused. Every change re-issues the scroll; `STABLE_FRAMES` frames without one end
 * it. The first correction is smooth, because in-page clicks (the panel's show rows, already
 * hydrated) converge on frame one and should look like a scroll; the rest are instant, since
 * animating a correction only means arriving late at a place that has moved again.
 *
 * Two deadlines, both load-bearing. A slug that no longer matches a show would poll for a target
 * forever, so after `TARGET_DEADLINE_MS` it takes whatever the getter offers — the tab row — and
 * scrolls there, which is where the open tab is anyway. And a page that never stops moving (a poll
 * landing, a photo decoding) would hold the visitor's scroll hostage, so `SETTLE_DEADLINE_MS` ends
 * the correction phase regardless. Returns its own canceller: a visitor clicking a second show
 * mid-flight must not be dragged back to the first.
 */
function scrollWhenSettled(getTarget: () => HTMLElement | null) {
  let raf = 0;
  let cancelled = false;
  const startedAt = performance.now();
  let lastOffset: number | null = null;
  let stable = 0;

  const tick = () => {
    if (cancelled) return;
    const elapsed = performance.now() - startedAt;
    const target = getTarget();

    if (!target) {
      // The panel mounts its cards through a `useDeferredValue` and no event says when, so this
      // is polled per frame. Past the deadline a getter still answering `null` has nothing left
      // to offer and there is nothing to scroll to.
      if (elapsed < TARGET_DEADLINE_MS) raf = requestAnimationFrame(tick);
      return;
    }

    const offset = target.getBoundingClientRect().top + window.scrollY;
    if (offset === lastOffset) {
      // Held still for another frame. Enough of them in a row and the layout is done.
      if (++stable >= STABLE_FRAMES) return;
    } else {
      const first = lastOffset === null;
      lastOffset = offset;
      stable = 0;
      window.scrollTo({
        top: Math.max(0, offset - HEADER_OFFSET),
        behavior: first ? 'smooth' : 'auto',
      });
    }

    if (elapsed < SETTLE_DEADLINE_MS) raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);
  return () => {
    cancelled = true;
    cancelAnimationFrame(raf);
  };
}
