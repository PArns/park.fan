'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackSitePageview } from '@/lib/analytics/site-analytics';

/**
 * Counts a view of every page of the site in our own statistic, once per path: the first load and
 * each client navigation after it. A change of hash or query is not a new page, so the park tabs,
 * the calendar's month stepper and the search page's `?q=` count nothing. Mounted once in the
 * locale layout, which `/admin` is not under. Renders nothing. See docs/development/analytics.md.
 */
export function SitePageviewBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    // The pathname only triggers the effect: the facade reads the address bar itself, which the
    // router has updated by the time an effect runs.
    trackSitePageview();
  }, [pathname]);

  return null;
}
