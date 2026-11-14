import type { TripRegionConfig } from '../registry';
import type { TicketEntry } from '../plan-tickets';

/**
 * Orlando: Walt Disney World, Universal Orlando, SeaWorld and the day trips, the first region with a
 * trip planner. Everything here is Orlando's own rule; the sentences are under
 * `tripRegions.orlando` in the messages. See docs/features/orlando-hub.md.
 */

/** Disney's UK 14-day ticket. */
const DISNEY_FORTNIGHT = 'wdw-uk-14-day-magic';

/** Universal's UK 14-day tickets, Three Park Adventure first: the one sold while Volcano Bay is shut. */
const UNIVERSAL_FORTNIGHT = ['uor-uk-three-park-adventure', 'uor-uk-all-parks'] as const;

const ENTRIES: readonly TicketEntry[] = [
  {
    key: 'wdw-dated',
    resort: 'walt-disney-world',
    products: ['wdw-date-based', 'wdw-date-based-plus'],
    dated: true,
    addon: 'waterParks',
  },
  { key: 'wdw-uk-14', resort: 'walt-disney-world', products: [DISNEY_FORTNIGHT] },
  { key: 'wdw-uk-7', resort: 'walt-disney-world', products: ['wdw-uk-7-day-magic'] },
  { key: 'wdw-4-park', resort: 'walt-disney-world', products: ['wdw-4-park-magic'] },
  { key: 'wdw-pass', resort: 'walt-disney-world', products: ['wdw-annual-pass'] },
  {
    key: 'wdw-unsure',
    resort: 'walt-disney-world',
    products: ['wdw-date-based', DISNEY_FORTNIGHT],
    unsure: true,
  },
  {
    key: 'uor-dated',
    resort: 'universal-orlando',
    products: ['uor-date-based', 'uor-date-based-volcano-bay'],
    dated: true,
    addon: 'volcanoBay',
  },
  { key: 'uor-uk-14', resort: 'universal-orlando', products: UNIVERSAL_FORTNIGHT, uk14: true },
  {
    key: 'uor-epic',
    resort: 'universal-orlando',
    products: ['uor-1-day-plus-epic', 'uor-2-day-p2p-plus-epic'],
  },
  {
    key: 'uor-1-day',
    resort: 'universal-orlando',
    products: ['uor-epic-1-day', 'uor-volcano-bay-1-day'],
  },
  {
    key: 'uor-pass',
    resort: 'universal-orlando',
    products: ['uor-annual-pass', 'uor-annual-pass-3-park'],
    addon: 'volcanoBay',
  },
  {
    key: 'uor-unsure',
    resort: 'universal-orlando',
    products: ['uor-date-based', ...UNIVERSAL_FORTNIGHT],
    unsure: true,
  },
  {
    key: 'sw-1-day',
    resort: 'seaworld-orlando',
    products: ['seaworld-1-day', 'busch-gardens-1-day'],
  },
  { key: 'sw-two-park', resort: 'seaworld-orlando', products: ['seaworld-two-park'] },
  { key: 'sw-three-park', resort: 'seaworld-orlando', products: ['seaworld-three-park-3-day'] },
  { key: 'sw-four-parks', resort: 'seaworld-orlando', products: ['seaworld-four-parks-14-day'] },
  { key: 'sw-uk-3-visit', resort: 'seaworld-orlando', products: ['seaworld-uk-3-visit'] },
  { key: 'sw-uk-ultimate', resort: 'seaworld-orlando', products: ['seaworld-uk-ultimate'] },
  {
    key: 'sw-discovery-cove',
    resort: 'seaworld-orlando',
    products: ['discovery-cove', 'discovery-cove-plus-2', 'discovery-cove-plus-3'],
  },
  {
    key: 'sw-fun-card',
    resort: 'seaworld-orlando',
    products: ['seaworld-fun-card', 'seaworld-fun-card-aquatica', 'busch-gardens-fun-card'],
  },
  {
    key: 'sw-pass',
    resort: 'seaworld-orlando',
    products: ['seaworld-annual-pass', 'seaworld-annual-pass-florida'],
  },
  { key: 'lego-day', resort: 'day-trips', products: ['legoland-1-day', 'legoland-2-day'] },
  { key: 'lego-7', resort: 'day-trips', products: ['legoland-merlin-7-attractions'] },
  { key: 'lego-pass', resort: 'day-trips', products: ['legoland-annual-pass'] },
];

/** Orlando's entry in `TRIP_REGIONS`. */
export const ORLANDO: TripRegionConfig = {
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
  timezone: 'America/New_York',
  // Between the two resorts.
  centre: { latitude: 28.42, longitude: -81.51 },
  photo: '/media/disney-animal-kingdom/kunst-des-wartens-cover.jpg',
  scene: () =>
    import('../../../components/assistant/parky/orlando-scene').then((m) => ({
      default: m.ParkyOrlandoScene,
    })),
  hub: {
    // The Tree of Life at Animal Kingdom, then VelociCoaster at Islands of Adventure.
    heroPhotos: [
      '/media/disney-animal-kingdom/kunst-des-wartens-cover.jpg',
      '/media/universal-islands-of-adventure/welcome-cover.jpg',
    ],
    // Epic Universe's crowd calendar is where we rank.
    nextStepPark: 'universal-epic-universe',
    // The middle of Walt Disney World.
    defaultArea: 'disney',
    faq: {
      partyPark: 'magic-kingdom-park',
      weekendPark: 'universal-epic-universe',
      distance: { from: 'universal-studios-florida', near: 'epcot', far: 'magic-kingdom-park' },
      earlySlots: ['early_entry', 'early_park_admission'],
    },
  },
  bestTime: [
    {
      id: 'region',
      groups: ['walt-disney-world', 'universal-orlando'],
      photo: 'disney-hollywood-studios/fantasmic-crowd',
    },
    {
      id: 'disney-world',
      segment: 'disney-world',
      groups: ['walt-disney-world'],
      photo: 'disney-animal-kingdom/kunst-des-wartens-cover',
      calendarPark: 'magic-kingdom-park',
    },
    {
      id: 'universal-orlando',
      segment: 'universal-orlando',
      groups: ['universal-orlando'],
      photo: 'universal-islands-of-adventure/welcome-cover',
      calendarPark: 'universal-epic-universe',
    },
  ],
  parkNameSuffixes: ['Orlando', 'Tampa Bay', 'Florida'],
  resortWords: { 'walt-disney-world': 'Disney', 'universal-orlando': 'Universal' },
  hotels: [
    { key: 'disney', area: 'disney' },
    { key: 'disney_deluxe', area: 'disney' },
    { key: 'universal', area: 'universal' },
    { key: 'universal_premier', area: 'universal' },
    { key: 'offsite' },
  ],
  stormSeason: 'hurricane',
  blockResorts: ['walt-disney-world', 'universal-orlando'],
  // Magic Kingdom's fireworks against its party nights.
  fireworks: true,
  tickets: {
    resorts: ['walt-disney-world', 'universal-orlando', 'seaworld-orlando', 'day-trips'],
    entries: ENTRIES,
    fortnight: { resort: 'walt-disney-world', product: DISNEY_FORTNIGHT },
    rollingFortnight: {
      resort: 'universal-orlando',
      products: UNIVERSAL_FORTNIGHT,
      withAddon: 'uor-uk-all-parks',
    },
    combo: [
      { resort: 'walt-disney-world', entry: 'wdw-uk-14' },
      { resort: 'universal-orlando', entry: 'uor-uk-14' },
    ],
    // The Hogwarts Express runs between Universal Studios and Islands of Adventure.
    connectedParks: {
      resort: 'universal-orlando',
      parks: ['universal-studios-florida', 'universal-islands-of-adventure'],
    },
    hopperNames: { 'walt-disney-world': 'disney', 'universal-orlando': 'universal' },
    homeMarket: 'us',
  },
};
