import type { TripRegionConfig } from '../registry';

/**
 * The regions the owner decided on next, not live yet: their URL segments, zones and middles, so
 * the routes, redirects and the planner band can be built and tested for more than one region.
 * Until a region goes live its pages are 404s, it is in no sitemap, menu or search, and the relay
 * serves it to the admin's ticket page alone. Going live takes its messages under
 * `tripRegions.<slug>` in six languages, its best-time pages, its hotels and ticket step where it
 * has them, and `live: true`; its Parky scene is drawn. See docs/features/trip-regions.md#adding-a-region.
 */

/** Japan: Tokyo Disneyland, Tokyo DisneySea, Fuji-Q Highland, LEGOLAND Japan, Universal Studios Japan. */
export const JAPAN: TripRegionConfig = {
  slug: 'japan',
  live: false,
  segments: { en: 'japan', de: 'japan', nl: 'japan', fr: 'japon', es: 'japon', it: 'giappone' },
  timezone: 'Asia/Tokyo',
  // Tokyo Disney Resort. The region spans several cities, and its trips several bases.
  centre: { latitude: 35.63, longitude: 139.88 },
  scene: () =>
    import('../../../components/assistant/parky/japan-scene').then((m) => ({
      default: m.ParkyJapanScene,
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
