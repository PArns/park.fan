import type { ComponentType } from 'react';
import type { Locale } from '../../../i18n/config';

/**
 * What every page needs of a trip region: its key, whether it is live, its hub's URL segment per
 * locale and its Parky scene. The header, the statistic's path reader and the language switcher
 * are in every page's script and read nothing else, so this module is all of a region they load;
 * a region's own file (`regions/<slug>.ts`: tickets, hub, best-time pages) spreads its identity
 * from here and stays with the pages that plan with it.
 *
 * Imports nothing at run time, as `registry.ts` explains: `next.config.ts` loads it before the
 * `@/` aliases exist, and a scene is a lazy `import()` nobody calls there.
 */

/**
 * What a region's illustration receives. The scene is decoration: its root `<svg>` carries
 * `aria-hidden` and `focusable="false"`, its motion plays only under
 * `prefers-reduced-motion: no-preference` and comes to rest on the finished picture, it takes its
 * colours from Tailwind classes with `dark:` twins so it follows the theme, and its gradient ids
 * are its own, since the band stays in the document beside every other drawing on the page.
 */
export interface TripRegionSceneProps {
  className?: string;
  /**
   * Keep moving after the entrance, for as long as the scene is shown: the header's planner band
   * while it is open (it is `display: none` when closed, which stops every animation in it), the
   * trip planner's assistant while its dialog is open, and a tile on a page while it shows below
   * the header (`RegionSceneInView`). Without it the scene plays its entrance and stands still.
   */
  loop?: boolean;
}

/** A region's illustration as a lazily loaded module, so its markup is in no page's HTML. */
export type TripRegionSceneLoader = () => Promise<{ default: ComponentType<TripRegionSceneProps> }>;

/** The part of a region every page loads; `TripRegionConfig` is this and the region's own file. */
export interface TripRegionIdentity {
  /** The API's key (`/v1/trip-regions/<slug>`), the messages' (`tripRegions.<slug>`), analytics'. */
  slug: string;
  /**
   * Whether the region's pages answer and its links show. A region is added here with `false` and
   * goes live once its hub, its messages in six languages and its scene are in.
   */
  live: boolean;
  /** The hub's URL segment per locale: `/de/kalifornien`. One word, ASCII, as every slug here. */
  segments: Readonly<Record<Locale, string>>;
  /** The Parky scene of the planner band's tile, loaded when the band first opens. */
  scene?: TripRegionSceneLoader;
}

/** Orlando's identity; the rest of the region is `regions/orlando.ts`. */
export const ORLANDO_IDENTITY: TripRegionIdentity = {
  slug: 'orlando',
  live: true,
  // The city's name and the word people search with in every language.
  segments: {
    en: 'orlando',
    de: 'orlando',
    nl: 'orlando',
    fr: 'orlando',
    es: 'orlando',
    it: 'orlando',
  },
  scene: () =>
    import('../../../components/assistant/parky/orlando-scene').then((m) => ({
      default: m.ParkyOrlandoScene,
    })),
};

/** Southern California's identity; the rest of the region is `regions/southern-california.ts`. */
export const SOUTHERN_CALIFORNIA_IDENTITY: TripRegionIdentity = {
  slug: 'southern-california',
  live: true,
  segments: {
    en: 'california',
    de: 'kalifornien',
    nl: 'californie',
    fr: 'californie',
    es: 'california',
    it: 'california',
  },
  scene: () =>
    import('../../../components/assistant/parky/southern-california-scene').then((m) => ({
      default: m.ParkySouthernCaliforniaScene,
    })),
};

/** Japan's identity; the rest of the region is `regions/japan.ts`. */
export const JAPAN_IDENTITY: TripRegionIdentity = {
  slug: 'japan',
  live: true,
  segments: { en: 'japan', de: 'japan', nl: 'japan', fr: 'japon', es: 'japon', it: 'giappone' },
  scene: () =>
    import('../../../components/assistant/parky/japan-scene').then((m) => ({
      default: m.ParkyJapanScene,
    })),
};

/** Paris' identity; the rest of the region is `regions/paris.ts`. */
export const PARIS_IDENTITY: TripRegionIdentity = {
  slug: 'paris',
  live: true,
  segments: { en: 'paris', de: 'paris', nl: 'paris', fr: 'paris', es: 'paris', it: 'paris' },
  scene: () =>
    import('../../../components/assistant/parky/paris-scene').then((m) => ({
      default: m.ParkyParisScene,
    })),
};

/**
 * Every trip region, live or coming, in the order the planner band and the admin list them.
 * `TRIP_REGIONS` takes its order from this list, so there is one.
 */
export const TRIP_REGION_IDENTITIES: readonly TripRegionIdentity[] = [
  ORLANDO_IDENTITY,
  SOUTHERN_CALIFORNIA_IDENTITY,
  JAPAN_IDENTITY,
  PARIS_IDENTITY,
];

/** The regions whose pages answer and whose links show, as every page may read them. */
export const LIVE_TRIP_REGION_IDENTITIES: readonly TripRegionIdentity[] =
  TRIP_REGION_IDENTITIES.filter((region) => region.live);

/** A region's URL segment in a locale, the English one where a locale lacks its own. */
export function tripRegionSegment(
  region: Pick<TripRegionIdentity, 'segments'>,
  locale: string
): string {
  return region.segments[locale as Locale] ?? region.segments.en;
}
