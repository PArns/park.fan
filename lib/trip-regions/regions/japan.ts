import type { TripRegionConfig } from '../registry';
import type { TicketEntry } from '../plan-tickets';

/**
 * Japan: Tokyo Disneyland and Tokyo DisneySea, Fuji-Q Highland, LEGOLAND Japan and Universal
 * Studios Japan, five parks in four cities. A trip there sleeps in several of them, and the API
 * plans the cities and their nights (its `bases`). Everything here is Japan's own rule; the
 * sentences are under `tripRegions.japan` in the messages. See docs/features/trip-regions.md.
 */

// Every ticket of the region is for one park, and none adds a second park on the same day, so the
// step asks for no hopper and no "not sure which".
const ENTRIES: readonly TicketEntry[] = [
  { key: 'tdr-1-day', resort: 'tokyo-disney-resort', products: ['tdr-1-day-passport'] },
  { key: 'tdr-after-3', resort: 'tokyo-disney-resort', products: ['tdr-after-3-passport'] },
  { key: 'tdr-after-5', resort: 'tokyo-disney-resort', products: ['tdr-after-5-passport'] },
  { key: 'usj-1-day', resort: 'universal-studios-japan', products: ['usj-1-day-studio-pass'] },
  { key: 'usj-2-day', resort: 'universal-studios-japan', products: ['usj-2-day-studio-pass'] },
  {
    key: 'usj-1-5-day',
    resort: 'universal-studios-japan',
    products: ['usj-1-5-day-studio-pass'],
  },
  { key: 'usj-twilight', resort: 'universal-studios-japan', products: ['usj-twilight-pass'] },
  {
    key: 'fujiq-1-day',
    resort: 'fuji-q-highland',
    products: [
      'fujiq-one-day-pass',
      'fujiq-one-day-pass-priority-admission',
      'fujiq-one-day-pass-virtual-queue',
    ],
  },
  { key: 'fujiq-premium', resort: 'fuji-q-highland', products: ['fujiq-premium-pass'] },
  {
    key: 'fujiq-later',
    resort: 'fuji-q-highland',
    products: ['fujiq-afternoon-pass', 'fujiq-sunset-night-pass'],
  },
  { key: 'fujiq-thomas', resort: 'fuji-q-highland', products: ['fujiq-thomas-land-pass'] },
  { key: 'fujiq-pass', resort: 'fuji-q-highland', products: ['fujiq-annual-pass'] },
  {
    key: 'lego-1-day',
    resort: 'legoland-japan',
    products: ['legoland-japan-1-day', 'legoland-japan-combo-1-day'],
  },
  {
    key: 'lego-hotel-2-day',
    resort: 'legoland-japan',
    products: ['legoland-japan-hotel-combo-2-day'],
  },
  { key: 'lego-pass', resort: 'legoland-japan', products: ['legoland-japan-annual-pass'] },
];

/** Japan's entry in `TRIP_REGIONS`. */
export const JAPAN: TripRegionConfig = {
  slug: 'japan',
  live: true,
  segments: { en: 'japan', de: 'japan', nl: 'japan', fr: 'japon', es: 'japon', it: 'giappone' },
  timezone: 'Asia/Tokyo',
  // Tokyo Disney Resort. The region spans several cities, and its trips several bases.
  centre: { latitude: 35.63, longitude: 139.88 },
  photo: '/media/tokyo-disneysea/mermaid-lagoon.jpg',
  scene: () =>
    import('../../../components/assistant/parky/japan-scene').then((m) => ({
      default: m.ParkyJapanScene,
    })),
  hub: {
    // Mermaid Lagoon at Tokyo DisneySea, then Cinderella Castle seen from World Bazaar.
    heroPhotos: [
      '/media/tokyo-disneysea/mermaid-lagoon.jpg',
      '/media/tokyo-disneyland/cinderella-castle-world-bazaar.jpg',
    ],
    // Between the two Disney parks, where most trips start.
    defaultArea: 'maihama',
    // Three questions a trip across cities raises, answered in the region's words.
    faq: { weekendPark: 'tokyo-disneysea', questions: ['cities', 'luggage', 'happyEntry'] },
  },
  bestTime: [
    {
      id: 'region',
      groups: ['tokyo-disney-resort', 'universal-studios-japan'],
      photo: 'tokyo-disneysea/mediterranean-harbor',
    },
    {
      id: 'tokyo-disney',
      segment: 'tokyo-disney',
      groups: ['tokyo-disney-resort'],
      photo: 'tokyo-disneyland/cinderella-castle-world-bazaar',
      calendarPark: 'tokyo-disneysea',
    },
    {
      id: 'universal-studios-japan',
      segment: 'universal-studios-japan',
      groups: ['universal-studios-japan'],
      photo: 'universal-studios-japan/entrance-gate',
      calendarPark: 'universal-studios-japan',
    },
  ],
  // "LEGOLAND Japan" reads "LEGOLAND" and "Universal Studios Japan" "Universal Studios" where the
  // row is tight; the full names stay in headings and links.
  parkNameSuffixes: ['Japan'],
  resortWords: { 'tokyo-disney-resort': 'Tokyo Disney', 'universal-studios-japan': 'USJ' },
  // The API's kinds. A Highland Resort or LEGOLAND Japan Hotel stay is in two different cities, so
  // the park hotel has no one area.
  hotels: [
    { key: 'disney', area: 'maihama' },
    { key: 'disney_deluxe', area: 'disneysea_hotels' },
    { key: 'universal', area: 'universal_city' },
    { key: 'park_hotel' },
    { key: 'offsite' },
  ],
  stormSeason: 'typhoon',
  regionGuide: 'japan-freizeitparks-reise',
  tickets: {
    resorts: [
      'tokyo-disney-resort',
      'universal-studios-japan',
      'fuji-q-highland',
      'legoland-japan',
    ],
    entries: ENTRIES,
    hopperNames: {},
    homeMarket: 'jp',
  },
};
