import { LINK_ENTITY_ATTRIBUTE } from '@/lib/analytics/internal-link';
import type { SiteEventMap, TripTileLink } from '@/lib/analytics/site-analytics';

/**
 * How the planner tile on a park's pages says which of its links was followed. The tile is a
 * Server Component, so its root names the region and each link names itself in data attributes,
 * and `MarkupEventTracker` turns a click into `trip_tile_clicked`. `internal_link_clicked` counts
 * the same click under the block `trip_tile`, but its place is the page, and both links open the
 * hub: only this event tells the plan from the calendar.
 */

/**
 * A region's slug as the registry writes them. Checked by shape, not against the registry, which
 * this module would otherwise carry into the layout's bundle with `MarkupEventTracker`.
 */
const REGION_SLUG = /^[a-z][a-z-]{1,31}$/;

/** The attribute on the tile's root that names its region by slug. */
export const TRIP_TILE_ATTRIBUTE = 'data-trip-tile';

/** The attribute on each of the tile's links that says which one it is. */
export const TRIP_TILE_LINK_ATTRIBUTE = 'data-trip-tile-link';

/** The attributes to spread onto the tile's root. */
export function tripTileAttributes(region: string): Record<string, string> {
  return { [TRIP_TILE_ATTRIBUTE]: region };
}

/** The attribute to spread onto one of the tile's links. */
export function tripTileLinkAttributes(link: TripTileLink): Record<string, string> {
  return { [TRIP_TILE_LINK_ATTRIBUTE]: link };
}

/** What a counted click sends: the region and the link, and the tile's park as entity. */
export interface TripTileClick {
  props: SiteEventMap['trip_tile_clicked'];
  entity?: string;
}

/**
 * The `trip_tile_clicked` a click on `target` makes, or `null`: a click on one of a tile's links.
 * The tile's whole card is the plan link's cover, so a click anywhere on it but the calendar link
 * counts as `plan`.
 */
export function tripTileClickOf(target: EventTarget | null): TripTileClick | null {
  if (!(target instanceof Element)) return null;
  const anchor = target.closest(`[${TRIP_TILE_LINK_ATTRIBUTE}]`);
  const tile = anchor?.closest(`[${TRIP_TILE_ATTRIBUTE}]`);
  if (!anchor || !tile) return null;
  const link = anchor.getAttribute(TRIP_TILE_LINK_ATTRIBUTE);
  const region = tile.getAttribute(TRIP_TILE_ATTRIBUTE);
  if ((link !== 'plan' && link !== 'calendar') || !region || !REGION_SLUG.test(region)) return null;
  const entity = tile.getAttribute(LINK_ENTITY_ATTRIBUTE);
  return { props: { region, link }, ...(entity ? { entity } : {}) };
}
