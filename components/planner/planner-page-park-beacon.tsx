'use client';

import { useEffect } from 'react';
import { plannerPagePark } from '@/lib/planner/page-park';
import type { PlannerGeo } from '@/lib/planner/types';

/**
 * Tells the planner which park the current route is about.
 *
 * Renders nothing. Mounted by every park-scoped page, because the panel lives
 * in the layout and otherwise cannot tell Toverland's calendar from
 * Phantasialand's — which is how the header came to read "Phantasialand" while
 * the reader was looking at Toverland.
 *
 * The cleanup clears by SLUG rather than unconditionally: two park routes swap
 * by mounting the new page before unmounting the old one, and a blind clear on
 * unmount would erase the park that just arrived.
 */
export function PlannerPageParkBeacon({
  slug,
  name,
  geo,
  timezone,
}: {
  slug: string;
  name: string;
  geo: PlannerGeo;
  timezone?: string;
}) {
  useEffect(() => {
    plannerPagePark.set({ slug, name, geo, timezone });
    return () => plannerPagePark.clear(slug);
  }, [slug, name, geo, timezone]);

  return null;
}
