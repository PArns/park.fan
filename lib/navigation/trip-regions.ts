import type { ComponentType } from 'react';
import type { Locale } from '@/i18n/config';
import { ORLANDO_PLANNER_ID, orlandoPath } from '@/lib/orlando/paths';

/**
 * The regions with a trip planner of their own, in the order the header's planner band shows
 * them. A new region joins with one entry here; the band, the phone sheet and
 * `pnpm check:header-links` read this list. Client-safe and free of server imports, because the
 * header resolves each region's illustration from it in the browser; the photo is resolved on the
 * server (`lib/navigation/planner-menu.ts`).
 */

/**
 * What a region's illustration receives. The scene is decoration: its root `<svg>` carries
 * `aria-hidden` and `focusable="false"`, it is still (the band is glass, and nothing may move
 * under a `backdrop-filter`, reduced motion or not), it takes its colours from Tailwind classes
 * with `dark:` twins so it follows the theme, and its gradient ids are its own, since the band
 * stays in the document beside every other drawing on the page.
 */
export interface TripRegionSceneProps {
  className?: string;
}

/** A region's illustration as a lazily loaded module, so its markup is in no page's HTML. */
export type TripRegionSceneLoader = () => Promise<{ default: ComponentType<TripRegionSceneProps> }>;

/** One region: where its trip planner is, what it is called, and what its tile shows. */
export interface TripRegion {
  /** Stable key: React's, the scene cache's, the tile's. */
  id: string;
  /** The region's name: one string where every language writes it the same, else one per locale. */
  name: string | Record<Locale, string>;
  /** The trip planner on the region's hub, locale-relative; the i18n `Link` adds the locale. */
  href: string;
  /** The hub's own photo, a source in the media catalog, shown where the region has no scene. */
  photo: string;
  /** A Parky scene for the tile in place of the photo, loaded when the band first opens. */
  scene?: TripRegionSceneLoader;
}

/** Every region with a trip planner, one entry each. */
export const TRIP_REGIONS: readonly TripRegion[] = [
  {
    id: 'orlando',
    name: 'Orlando',
    href: `${orlandoPath()}#${ORLANDO_PLANNER_ID}`,
    photo: '/media/disney-animal-kingdom/kunst-des-wartens-cover.jpg',
  },
];

/** A region's name in a locale, English where a per-locale name lacks one. */
export function tripRegionName(region: TripRegion, locale: Locale | string): string {
  return typeof region.name === 'string'
    ? region.name
    : (region.name[locale as Locale] ?? region.name.en);
}

/** A region by its id. */
export function tripRegion(id: string): TripRegion | undefined {
  return TRIP_REGIONS.find((region) => region.id === id);
}
