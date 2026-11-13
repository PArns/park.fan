'use client';

import type { MouseEvent } from 'react';
import { plannerPagePark } from '@/lib/planner/page-park';
import { parkGeoFromUrl } from '@/lib/planner/park-url';
import { plannerUi, type PlannerOpenedSource } from '@/lib/planner/ui-store';
import { isPlainPrimaryClick } from '@/lib/utils/plain-click';
import type { PlannerMenuPark } from '@/lib/navigation/planner-menu';
import type { PlannerGeo } from '@/lib/planner/types';

/**
 * Starting the day planner on a park named by a link that is not on that park's page: the header's
 * planner band and its phone sheet offer the locale's popular parks this way. The link's `href` is
 * the park's own page, which its anchor names and a modified click or a crawler follows. A plain
 * click follows it too and, on the way, names the park to the planner and asks for its wizard,
 * the hand-off the Orlando hub's "Plan this day" uses. The park page's beacon then publishes the
 * same park and takes it back when the visitor leaves, so the header never keeps claiming one.
 */

/** A park the planner can be started on: what the link shows and what the planner files it by. */
export interface PlannerQuickStart extends PlannerMenuPark {
  geo: PlannerGeo;
}

/**
 * The quick starts, in the band's order. A park whose link carries no geography is dropped, since
 * the planner files a day under it.
 */
export function plannerQuickStarts(parks: readonly PlannerMenuPark[]): PlannerQuickStart[] {
  return parks.flatMap((park) => {
    const geo = parkGeoFromUrl(park.href);
    return geo ? [{ ...park, geo }] : [];
  });
}

/** Names the park to the planner and asks for its wizard on it. */
export function startPlannerAt(park: PlannerQuickStart, source: PlannerOpenedSource): void {
  plannerPagePark.set({ slug: park.slug, name: park.name, geo: park.geo });
  plannerUi.requestOpen(source, 'page-park-wizard');
}

/**
 * The `onClick` of a quick-start link: a plain primary click starts the planner on the park and
 * lets the navigation to the park's page go on; any other click is the browser's.
 */
export function quickStartClick(park: PlannerQuickStart, source: PlannerOpenedSource) {
  return (event: MouseEvent<HTMLAnchorElement>) => {
    if (isPlainPrimaryClick(event)) startPlannerAt(park, source);
  };
}
