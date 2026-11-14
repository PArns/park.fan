import type { TripRegionConfig, TripRegionSceneLoader } from '../registry';

/**
 * The regions the owner decided on next, not live yet: their URL segments, zones and middles, so
 * the routes, redirects and the planner band can be built and tested for more than one region.
 * Until a region goes live its pages are 404s, it is in no sitemap, menu or search, and the relay
 * serves it to the admin's ticket page alone. Going live takes its messages under
 * `tripRegions.<slug>` in six languages, its best-time pages, its hotels and ticket step where it
 * has them, its own scene and `live: true`. See docs/features/trip-regions.md#adding-a-region.
 */

/**
 * The stand-in scene of a region whose own is not drawn yet. Each region's drawing goes in
 * `components/layout/region-art/<slug>.tsx` and replaces this loader in its entry.
 */
const placeholderScene: TripRegionSceneLoader = () =>
  import('../../../components/layout/region-art/placeholder').then((m) => ({
    default: m.RegionArtPlaceholder,
  }));

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
  scene: placeholderScene,
  hub: { heroPhotos: [], faq: {} },
  bestTime: [],
  parkNameSuffixes: [],
  resortWords: {},
  hotels: [{ key: 'offsite' }],
};

/** Japan: Tokyo Disneyland, Tokyo DisneySea, Fuji-Q Highland, LEGOLAND Japan, Universal Studios Japan. */
export const JAPAN: TripRegionConfig = {
  slug: 'japan',
  live: false,
  segments: { en: 'japan', de: 'japan', nl: 'japan', fr: 'japon', es: 'japon', it: 'giappone' },
  timezone: 'Asia/Tokyo',
  // Tokyo Disney Resort. The region spans several cities, and its trips several bases.
  centre: { latitude: 35.63, longitude: 139.88 },
  scene: placeholderScene,
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
  scene: placeholderScene,
  hub: { heroPhotos: [], faq: {} },
  bestTime: [],
  parkNameSuffixes: [],
  resortWords: {},
  hotels: [{ key: 'offsite' }],
};
