'use client';

import { useEffect } from 'react';
import { markPageNotFound } from '@/lib/analytics/site-analytics';

/**
 * Tells the site statistic that the page it sits on is a 404, so its pageview is counted as
 * `not_found` and the dead ends can be listed with the pages that sent people to them. The 404
 * renders inside the locale layout, where the pageview beacon cannot tell it from any other page.
 * Renders nothing.
 */
export function NotFoundMarker() {
  useEffect(() => {
    markPageNotFound();
  }, []);
  return null;
}
