import type { TripRegionConfig } from '../registry';
import type { TicketEntry } from '../plan-tickets';

/**
 * Southern California: the Disneyland Resort in Anaheim, Universal Studios Hollywood, and as day
 * trips Knott's Berry Farm, Six Flags Magic Mountain, SeaWorld San Diego, LEGOLAND California and
 * Sesame Place San Diego. No hotel here lets its guests in early, so the planner asks for a hotel
 * only for the drive times. The sentences are under `tripRegions.southern-california`.
 */

/** The Southern California CityPASS with a Disneyland part, alone and with Universal. */
const DISNEYLAND_CITYPASS = [
  'citypass-socal-disneyland',
  'citypass-socal-disneyland-universal',
] as const;

const ENTRIES: readonly TicketEntry[] = [
  { key: 'dlr-multi-day', resort: 'disneyland-resort', products: ['dlr-multi-day'], dated: true },
  { key: 'dlr-1-day', resort: 'disneyland-resort', products: ['dlr-1-day'] },
  { key: 'dlr-citypass', resort: 'disneyland-resort', products: DISNEYLAND_CITYPASS },
  {
    key: 'ush-1-day',
    resort: 'universal-studios-hollywood',
    products: ['ush-1-day', 'ush-express', 'ush-vip-experience'],
  },
  { key: 'ush-2-day', resort: 'universal-studios-hollywood', products: ['ush-2-day'] },
  {
    key: 'ush-citypass',
    resort: 'universal-studios-hollywood',
    products: ['citypass-socal-universal'],
  },
  { key: 'knotts', resort: 'day-trips', products: ['knotts-1-day'] },
  { key: 'magic-mountain', resort: 'day-trips', products: ['sfmm-1-day', 'sfmm-any-day'] },
  {
    key: 'seaworld-1-day',
    resort: 'day-trips',
    products: ['seaworld-sd-1-day', 'seaworld-sd-any-day'],
  },
  { key: 'seaworld-2-day', resort: 'day-trips', products: ['seaworld-sd-2-day'] },
  { key: 'seaworld-2-day-intl', resort: 'day-trips', products: ['seaworld-sd-2-day-intl'] },
  { key: 'seaworld-sesame', resort: 'day-trips', products: ['seaworld-sesame-two-park'] },
  { key: 'seaworld-fun-card', resort: 'day-trips', products: ['seaworld-sd-fun-card-2027'] },
  { key: 'sesame', resort: 'day-trips', products: ['sesame-sd-1-day', 'sesame-sd-any-day'] },
  {
    key: 'legoland',
    resort: 'day-trips',
    products: ['legoland-ca-1-day', 'legoland-ca-multi-day'],
  },
  { key: 'citypass-san-diego', resort: 'day-trips', products: ['citypass-san-diego'] },
  {
    key: 'gocity',
    resort: 'day-trips',
    products: ['gocity-la-all-inclusive', 'gocity-la-all-inclusive-plus'],
  },
];

/** Southern California's entry in `TRIP_REGIONS`. */
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
  photo: '/media/disneyland-anaheim/sleeping-beauty-castle.jpg',
  scene: () =>
    import('../../../components/assistant/parky/southern-california-scene').then((m) => ({
      default: m.ParkySouthernCaliforniaScene,
    })),
  hub: {
    // Sleeping Beauty Castle in Anaheim, then Pixar Pier at Disney California Adventure, then
    // Universal.
    heroPhotos: [
      '/media/disneyland-anaheim/sleeping-beauty-castle.jpg',
      '/media/disney-california-adventure-park/pixar-pier.jpg',
      '/media/universal-studios-hollywood/fast-and-furious-hollywood-drift-2-806327.jpg',
    ],
    // No default area: the day sheet's line says "by car" for every leg, and the legs from the
    // Disneyland hotels and Harbor Boulevard to the two parks are walks.
    faq: {
      // Oogie Boogie Bash sends California Adventure's day guests out early on its nights.
      partyPark: 'disney-california-adventure-park',
      weekendPark: 'disneyland-park',
      // Magic Mountain without a transfer, Disneyland with the tram from Mickey & Friends.
      distance: {
        from: 'universal-studios-hollywood',
        near: 'six-flags-magic-mountain',
        far: 'disneyland-park',
      },
    },
  },
  // One page: a Disneyland page of its own needs its words under
  // `tripRegions.southern-california.bestTime` in all six languages first.
  bestTime: [
    {
      id: 'region',
      groups: ['disneyland-resort', 'universal-studios-hollywood'],
      photo: 'universal-studios-hollywood/fast-and-furious-hollywood-drift-2-806327',
      calendarPark: 'disneyland-park',
    },
  ],
  parkNameSuffixes: ['San Diego', 'California'],
  // The codes visitors use where the derived letters say little or mislead: Universal would read
  // "SH", the two Disney parks "DI" and "DA", Magic Mountain "SF", Knott's "KB", and SeaWorld "SD"
  // beside Sesame Place San Diego.
  parkShortNames: {
    'disneyland-park': 'DL',
    'disney-california-adventure-park': 'DCA',
    'universal-studios-hollywood': 'USH',
    'knotts-berry-farm': 'KBF',
    'six-flags-magic-mountain': 'SFMM',
    'seaworld-san-diego': 'SW',
  },
  resortWords: { 'disneyland-resort': 'Disneyland', 'universal-studios-hollywood': 'Universal' },
  hotels: [{ key: 'disney', area: 'disneyland_resort' }, { key: 'offsite' }],
  // Separately ticketed nights (Oogie Boogie Bash, After Dark, Halloween Horror Nights) send the
  // day guests out before the evening shows.
  fireworks: true,
  tickets: {
    resorts: ['disneyland-resort', 'universal-studios-hollywood', 'day-trips'],
    entries: ENTRIES,
    hopperNames: { 'disneyland-resort': 'disney' },
    homeMarket: 'us',
  },
};
