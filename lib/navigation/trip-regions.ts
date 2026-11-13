import type { ComponentType } from 'react';
import type { Locale } from '@/i18n/config';
import { ORLANDO_PLANNER_ID, orlandoPath } from '@/lib/orlando/paths';
import { MAX_TRIP_DAYS } from '@/lib/orlando/plan-query';

/**
 * The regions with a trip planner of their own, in the order the header's planner band shows
 * them. A region joins with one entry here, its scene included; the band, the phone sheet and
 * `pnpm check:header-links` read this list. A region is listed once its planner exists, never as a
 * teaser. Client-safe and free of server imports, because the header resolves each region's scene
 * from it in the browser; the photo is resolved on the server (`lib/navigation/planner-menu.ts`).
 */

/**
 * What a region's illustration receives. The scene is decoration: its root `<svg>` carries
 * `aria-hidden` and `focusable="false"`, any motion it has plays once and only under
 * `prefers-reduced-motion: no-preference` (the band is glass, and nothing may run on under a
 * `backdrop-filter`), it takes its colours from Tailwind classes with `dark:` twins so it follows
 * the theme, and its gradient ids are its own, since the band stays in the document beside every
 * other drawing on the page.
 */
export interface TripRegionSceneProps {
  className?: string;
}

/** A region's illustration as a lazily loaded module, so its markup is in no page's HTML. */
export type TripRegionSceneLoader = () => Promise<{ default: ComponentType<TripRegionSceneProps> }>;

/** A name or a place: one string where every language writes it the same, else one per locale. */
export type TripRegionText = string | Record<Locale, string>;

/** One region: where its trip planner is, what it is called, and what its tile shows. */
export interface TripRegion {
  /** Stable key: React's, the scene cache's, the tile's. */
  id: string;
  name: TripRegionText;
  /** Where it is, the tile's kicker: the state or the country. */
  area: TripRegionText;
  /** The trip planner on the region's hub, locale-relative; the i18n `Link` adds the locale. */
  href: string;
  /** The hub's crowd calendar, the tile's second link. */
  calendarHref: string;
  /** The hub's own photo, a source in the media catalog: the tile's picture until the scene loads. */
  photo: string;
  /** How many parks the trip planner places, the figure the hub's own opening gives. */
  parkCount: number;
  /** The longest trip it plans, in days. */
  maxDays: number;
  /** A Parky scene for the tile, loaded when the band first opens. */
  scene?: TripRegionSceneLoader;
}

/** Every region with a trip planner, one entry each. */
export const TRIP_REGIONS: readonly TripRegion[] = [
  {
    id: 'orlando',
    name: 'Orlando',
    area: {
      en: 'Florida',
      de: 'Florida',
      nl: 'Florida',
      fr: 'Floride',
      es: 'Florida',
      it: 'Florida',
    },
    href: `${orlandoPath()}#${ORLANDO_PLANNER_ID}`,
    calendarHref: orlandoPath(),
    photo: '/media/disney-animal-kingdom/kunst-des-wartens-cover.jpg',
    parkCount: 16,
    maxDays: MAX_TRIP_DAYS,
    scene: () =>
      import('@/components/assistant/parky/orlando-scene').then((m) => ({
        default: m.ParkyOrlandoScene,
      })),
  },
];

/** A region's name or place in a locale, English where a per-locale text lacks one. */
export function tripRegionText(text: TripRegionText, locale: Locale | string): string {
  return typeof text === 'string' ? text : (text[locale as Locale] ?? text.en);
}

/** A region by its id. */
export function tripRegion(id: string): TripRegion | undefined {
  return TRIP_REGIONS.find((region) => region.id === id);
}
