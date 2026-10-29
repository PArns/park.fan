'use client';

import { useEffect } from 'react';
import { plannerPagePark } from '@/lib/planner/page-park';
import { rememberParkId } from '@/lib/planner/entity-ids';
import type { PlannerGeo } from '@/lib/planner/types';

/**
 * Tells the planner which park the current route is about. Renders nothing; mounted by every
 * park-scoped page, since the layout's panel cannot otherwise tell one park's page from another's.
 * The cleanup clears by slug: two park routes swap by mounting the new page first, and a blind
 * clear would erase the park that just arrived.
 */
export function PlannerPageParkBeacon({
  slug,
  id,
  name,
  geo,
  timezone,
  backgroundImage,
  backgroundPosition,
}: {
  slug: string;
  /** The park's UUID, which the planner's events name it by (`lib/planner/entity-ids.ts`). */
  id?: string;
  name: string;
  geo: PlannerGeo;
  timezone?: string;
  /** Resolved by the route; see `PlannerPagePark` for why. */
  backgroundImage?: string | null;
  backgroundPosition?: string;
}) {
  useEffect(() => {
    rememberParkId(slug, id);
    plannerPagePark.set({ slug, name, geo, timezone, backgroundImage, backgroundPosition });
    return () => plannerPagePark.clear(slug);
  }, [slug, id, name, geo, timezone, backgroundImage, backgroundPosition]);

  return null;
}
