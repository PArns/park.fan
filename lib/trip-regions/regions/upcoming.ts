import type { TripRegionConfig } from '../registry';

/**
 * The regions the owner decided on next, not live yet: their URL segments, zones and middles, so
 * the routes, redirects and the planner band can be built and tested for more than one region.
 * Until a region goes live its pages are 404s, it is in no sitemap, menu or search, and the relay
 * serves it to the admin's ticket page alone. Going live takes its messages under
 * `tripRegions.<slug>` in six languages, its best-time pages, its hotels and ticket step where it
 * has them, and `live: true`; its Parky scene is drawn. See docs/features/trip-regions.md#adding-a-region.
 */

/**
 * Southern California: Disneyland Resort, Universal Studios Hollywood, Knott's, Six Flags Magic
 * Mountain, SeaWorld San Diego, LEGOLAND California, Sesame Place San Diego.
 */
export const SOUTHERN_CALIFORNIA: TripRegionConfig = {
  slug: 'southern-california',
  live: false,
  segments: {
    en: 'california',
    de: 'kalifornien',
    nl: 'californie',
    fr: 'californie',
    es: 'california',
    it: 'california',
  },
  timezone: 'America/Los_Angeles',
  // Anaheim, where the most parks of the region are; San Diego and Valencia are a drive away.
  centre: { latitude: 33.81, longitude: -117.92 },
  photo: '/media/universal-studios-hollywood/fast-and-furious-hollywood-drift-2-806327.jpg',
  scene: () =>
    import('../../../components/assistant/parky/southern-california-scene').then((m) => ({
      default: m.ParkySouthernCaliforniaScene,
    })),
  hub: { heroPhotos: [], faq: {} },
  bestTime: [],
  parkNameSuffixes: [],
  resortWords: {},
  hotels: [{ key: 'offsite' }],
};

/** Paris: Disneyland Park, Disney Adventure World, Parc Astérix. */
export const PARIS: TripRegionConfig = {
  slug: 'paris',
  live: false,
  segments: { en: 'paris', de: 'paris', nl: 'paris', fr: 'paris', es: 'paris', it: 'paris' },
  timezone: 'Europe/Paris',
  // Between Disneyland Paris and Parc Astérix.
  centre: { latitude: 49.0, longitude: 2.68 },
  photo: '/media/disneyland-park/background.jpg',
  scene: () =>
    import('../../../components/assistant/parky/paris-scene').then((m) => ({
      default: m.ParkyParisScene,
    })),
  hub: { heroPhotos: [], faq: {} },
  bestTime: [],
  parkNameSuffixes: [],
  resortWords: {},
  hotels: [{ key: 'offsite' }],
};
