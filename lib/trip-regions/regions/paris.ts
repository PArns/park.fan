import type { TripRegionConfig } from '../registry';
import type { TicketEntry } from '../plan-tickets';

/**
 * Paris: Disneyland Paris (Disneyland Park and Disney Adventure World) and Parc Astérix, two
 * resorts with their own hotels about an hour apart by car, so a trip sleeps in one or both, or in
 * central Paris (the API's `bases`). Everything here is Paris' own rule; the sentences are under
 * `tripRegions.paris` in the messages.
 */

const ENTRIES: readonly TicketEntry[] = [
  { key: 'dlp-1-day', resort: 'disneyland-paris', products: ['dlp-1-day'], dated: true },
  { key: 'dlp-multi-day', resort: 'disneyland-paris', products: ['dlp-multi-day'], dated: true },
  { key: 'dlp-liberte', resort: 'disneyland-paris', products: ['dlp-1-day-liberte'] },
  // Bronze One lets a pass holder into one park a day, the other three tiers into both.
  { key: 'dlp-pass', resort: 'disneyland-paris', products: ['dlp-pass-bronze-one', 'dlp-pass'] },
  { key: 'asterix-1-day', resort: 'parc-asterix', products: ['asterix-1-day'], dated: true },
  { key: 'asterix-2-day', resort: 'parc-asterix', products: ['asterix-2-day'], dated: true },
  { key: 'asterix-noel', resort: 'parc-asterix', products: ['asterix-noel'] },
  { key: 'asterix-pass', resort: 'parc-asterix', products: ['asterix-pass-saison'] },
];

/** Paris' entry in `TRIP_REGIONS`. */
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
  hub: {
    // Sleeping Beauty's castle at Disneyland Park.
    heroPhotos: ['/media/disneyland-park/background.jpg'],
    // The API's default area of the Disneyland Paris base.
    defaultArea: 'disney_lake',
    faq: {
      weekendPark: 'disneyland-park',
      // The walk between the Disney gates against the drive to Parc Astérix.
      distance: { from: 'disneyland-park', near: 'disney-adventure-world', far: 'parc-asterix' },
    },
  },
  bestTime: [
    {
      id: 'region',
      groups: ['disneyland-paris', 'parc-asterix'],
      photo: 'disneyland-park/background',
    },
    {
      id: 'disneyland-paris',
      segment: 'disneyland-paris',
      groups: ['disneyland-paris'],
      photo: 'disneyland-park/background',
      calendarPark: 'disneyland-park',
    },
  ],
  parkNameSuffixes: [],
  resortWords: {},
  hotels: [
    { key: 'disney', area: 'disney_lake' },
    { key: 'parc_asterix', area: 'parc_asterix' },
    { key: 'offsite' },
  ],
  tickets: {
    resorts: ['disneyland-paris', 'parc-asterix'],
    entries: ENTRIES,
    hopperNames: { 'disneyland-paris': 'disney' },
    homeMarket: 'eu',
  },
};
