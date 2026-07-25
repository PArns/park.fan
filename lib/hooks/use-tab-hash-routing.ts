'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { stripNewPrefix } from '@/lib/utils';
import { trackTabChanged, type TabChangedProps } from '@/lib/analytics/umami';
import type { ParkWithAttractions } from '@/lib/api/types';

interface UseTabHashRoutingOptions {
  /** Tab rendered on the server / before hydration (avoids hydration mismatch). */
  defaultValue: string;
  /** Park identity for the tab-changed analytics event. */
  park: Pick<ParkWithAttractions, 'id' | 'name'>;
}

/**
 * URL-hash ↔ tab synchronization for the park page tabs.
 *
 * - Initializes with `defaultValue` to match server rendering, then activates the tab named
 *   in the URL hash (including `calendar-YYYY-MM` month deep links) on mount and on every
 *   `hashchange`, scrolling the tabs into view below the sticky header.
 * - `handleTabChange` tracks the analytics event and writes the new hash via
 *   `history.replaceState` (no navigation), preserving a calendar month hash when present.
 */
export function useTabHashRouting({ defaultValue, park }: UseTabHashRoutingOptions) {
  const pathname = usePathname();

  // Initialize with defaultValue to match server rendering (avoids hydration mismatch)
  const [activeTab, setActiveTab] = useState(defaultValue);

  // Avoid hydration mismatch by only rendering after mount
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  const tabsRef = useRef<HTMLDivElement>(null);

  // Sync with URL hash on mount and on hash change
  useEffect(() => {
    if (!isMounted) return;

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);

      // Check if hash starts with 'calendar' (e.g., 'calendar' or 'calendar-2026-04')
      let tabToActivate = hash;
      if (hash.startsWith('calendar-')) {
        tabToActivate = 'calendar';
      }

      const validTabs = ['attractions', 'shows', 'restaurants', 'calendar', 'map'];
      if (validTabs.includes(tabToActivate)) {
        setActiveTab(tabToActivate);

        // Scroll with a manual offset calculation for better reliability
        setTimeout(() => {
          const tabsContainer = tabsRef.current;

          if (tabsContainer) {
            // Prefer scrolling to the tabs container to show the navigation
            const headerOffset = 100; // Account for sticky header
            const elementPosition = tabsContainer.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth',
            });
          }
        }, 500);
      }
    };

    // Check hash on mount/update
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isMounted]);

  // Update URL hash when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);

    const tab = value as TabChangedProps['tab'];
    if (['attractions', 'calendar', 'map', 'shows', 'restaurants'].includes(tab)) {
      trackTabChanged({
        tab,
        ...(park.id && { parkId: String(park.id) }),
        ...(park.name && { parkName: stripNewPrefix(park.name) }),
      });
    }

    // Preserve calendar month hash if switching to calendar tab
    let newHash = value;
    if (value === 'calendar') {
      const currentHash = window.location.hash.slice(1);
      // If current hash is calendar-YYYY-MM, keep it
      if (currentHash.match(/^calendar-\d{4}-\d{2}$/)) {
        newHash = currentHash;
      }
    }

    // Update URL hash without triggering navigation
    window.history.replaceState(null, '', `${pathname}#${newHash}`);
  };

  return { isMounted, activeTab, handleTabChange, tabsRef };
}
