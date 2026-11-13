'use client';

import type { MouseEvent } from 'react';
import { plannerPagePark } from '@/lib/planner/page-park';
import { parkGeoFromUrl } from '@/lib/planner/park-url';
import { plannerUi, type PlannerOpenedSource } from '@/lib/planner/ui-store';
import { isPlainPrimaryClick } from '@/lib/utils/plain-click';
import type { FeaturedParkCard } from '@/lib/navigation/featured-parks-menu';
import type { PlannerGeo } from '@/lib/planner/types';

/**
 * Starting the day planner on a park named by a link that is not on that park's page: the header's
 * planner band and its phone sheet offer the locale's popular parks this way. The link's `href` is
 * the park's own page, which its anchor names and a modified click or a crawler follows. A plain
 * click follows it too and, on the way, names the park to the planner and asks for the wizard,
 * the hand-off the Orlando hub's "Plan this day" uses. The park page's beacon then publishes the
 * same park and takes it back when the visitor leaves, so the header never keeps claiming one.
 */

/** A park the planner can be started on: what the link shows and what the planner files it by. */
export interface PlannerQuickStart {
  slug: string;
  name: string;
  /** The park's page, locale-relative. */
  href: string;
  geo: PlannerGeo;
  /** The park's photo where it has one, for the panel's wash until the day's own arrives. */
  image?: string;
  imagePosition?: string;
}

/** How many parks the band offers, at most. */
export const QUICK_START_LIMIT = 6;

/**
 * The quick starts for a locale: the parks menu's rail (the parks this locale's readers opened
 * most, topped up from the curated list), in its order. A card whose link carries no geography is
 * dropped, since the planner files a day under it.
 */
export function plannerQuickStarts(
  parks: readonly FeaturedParkCard[],
  limit: number = QUICK_START_LIMIT
): PlannerQuickStart[] {
  const starts: PlannerQuickStart[] = [];
  for (const park of parks) {
    if (starts.length === limit) break;
    const geo = parkGeoFromUrl(park.href);
    if (!geo) continue;
    starts.push({
      slug: park.slug,
      name: park.name,
      href: park.href,
      geo,
      ...(park.image && { image: park.image, imagePosition: park.imagePosition }),
    });
  }
  return starts;
}

/** Names the park to the planner and asks for its wizard on it. */
export function startPlannerAt(park: PlannerQuickStart, source: PlannerOpenedSource): void {
  plannerPagePark.set({
    slug: park.slug,
    name: park.name,
    geo: park.geo,
    backgroundImage: park.image,
    backgroundPosition: park.imagePosition,
  });
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
