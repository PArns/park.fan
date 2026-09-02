// What the SERVER RENDER is allowed to serialize, and what it must not.
//
// Both halves of the park payload are projections now: the five-minute poll
// (`leanParkForLivePoll`) and the copy React writes into `self.__next_f.push(…)` so the
// client can hydrate. The second one had never been audited, and it is the bigger of the
// two — it is paid by every request including the crawler's, on the two highest-cardinality
// routes in the site.
//
// These tests pin the part that a green build cannot see. A field dropped here that a
// component still reads does not throw: the headliner row renders a dash, the restaurants
// tile reads zero, and nothing anywhere says so. So the calendar projection is checked
// through the REAL readers (`getStandbyWait`, `getAttractionDisplayStatus`, `isInSeason`,
// and the two counts `useParkTileItems` derives) rather than against a list of key names.
import {
  leanParkForCalendarShell,
  leanParkForLivePoll,
  mergeLiveParkSnapshot,
} from '../lib/api/park-live-projection.ts';
import { getStandbyWait, getAttractionDisplayStatus } from '../lib/utils/park-utils.ts';
import { isInSeason } from '../lib/utils/season.ts';

/** A park shaped like the API's answer, down to the fields nothing renders. */
const PARK = {
  id: 'p1',
  slug: 'phantasialand',
  name: 'Phantasialand',
  status: 'OPERATING',
  timezone: 'Europe/Berlin',
  hasOperatingSchedule: true,
  liveWaitTimes: { available: true, reason: null },
  weather: { current: { temperatureMax: '24' } },
  shows: [
    { id: 's1', name: 'Show', showtimes: [{ type: 'Performance Time', startTime: '14:00' }] },
  ],
  schedule: [{ date: '2026-09-01', type: 'OPERATING' }],
  analytics: { statistics: { crowdLevel: 'moderate' } },
  restaurants: [
    { id: 'r1', name: 'Uhrwerk', slug: 'uhrwerk', status: 'OPERATING', cuisineType: 'German' },
    { id: 'r2', name: 'Bamboo', slug: 'bamboo', status: 'CLOSED', cuisineType: 'Asian' },
    { id: 'r3', name: 'Wirtshaus', slug: 'wirtshaus', status: 'OPERATING', cuisineType: 'German' },
  ],
  attractions: [
    {
      id: 'a1',
      name: 'Taron',
      slug: 'taron',
      land: 'Klugheim',
      latitude: 50.8,
      longitude: 6.87,
      status: 'OPERATING',
      effectiveStatus: 'OPERATING',
      isHeadliner: true,
      isSeasonal: false,
      isCurrentlyInSeason: null,
      queues: [{ queueType: 'STANDBY', status: 'OPERATING', waitTime: 45 }],
      // Everything below is what the calendar route must stop shipping.
      bestVisitTimes: [{ start: '2026-09-01T09:00:00Z', rating: 'optimal' }],
      statistics: { avgWaitToday: 40, peakWaitToday: 70 },
      ropeDrop: { endOfDaySavings: 20 },
      typicalWaits: { p50: 35, p90: 65 },
      rideProfile: { elements: ['launch'] },
      comparison: 'higher',
      baseline: 32,
      trend: 'rising',
      crowdLevel: 'high',
    },
    {
      id: 'a2',
      name: 'Schlittschuhverleih',
      slug: 'schlittschuhverleih',
      land: 'Berlin',
      latitude: 50.8,
      longitude: 6.87,
      status: 'CLOSED',
      effectiveStatus: 'CLOSED',
      isHeadliner: true,
      isSeasonal: true,
      isCurrentlyInSeason: false,
      queues: [],
      comparison: 'typical',
      baseline: 10,
    },
  ],
};

const cal = leanParkForCalendarShell(PARK);
const calTaron = cal.attractions[0];
const calRink = cal.attractions[1];

const testCases = [
  // ---- the calendar projection keeps what its consumers actually read ----
  {
    name: 'ParkTodayPanel still reads a headliner standby wait',
    actual: () => getStandbyWait(calTaron),
    expected: 45,
  },
  {
    name: 'the display status still resolves through the queue',
    actual: () => getAttractionDisplayStatus(calTaron, cal.status),
    expected: 'OPERATING',
  },
  {
    name: 'a null isCurrentlyInSeason still means "nothing known", not "hide it"',
    actual: () => isInSeason(calTaron),
    expected: true,
  },
  {
    name: 'an out-of-season ride is still filtered out by isInSeason',
    actual: () => isInSeason(calRink),
    expected: false,
  },
  {
    name: 'the headliner flag survives (the rows filter on it)',
    actual: () => calTaron.isHeadliner === true && calRink.isHeadliner === true,
    expected: true,
  },
  {
    name: 'effectiveStatus survives — a ride out of season is reported by it, not by status',
    actual: () => calRink.effectiveStatus,
    expected: 'CLOSED',
  },
  {
    name: 'useParkTileItems still counts distinct lands',
    actual: () => new Set(cal.attractions.map((a) => a.land).filter(Boolean)).size,
    expected: 2,
  },
  {
    name: 'the ride tile still counts every attraction',
    actual: () => cal.attractions.length,
    expected: 2,
  },
  {
    name: 'name and slug survive (the rows link and label with them)',
    actual: () => calTaron.name === 'Taron' && calTaron.slug === 'taron',
    expected: true,
  },

  // ---- and drops what that route renders nowhere ----
  {
    name: 'bestVisitTimes is gone — no attraction card on this route to read it',
    actual: () => 'bestVisitTimes' in calTaron,
    expected: false,
  },
  {
    name: 'statistics is gone',
    actual: () => 'statistics' in calTaron,
    expected: false,
  },
  {
    name: 'ropeDrop is gone (RopeDropHeadliners is mounted by the park page, not this one)',
    actual: () => 'ropeDrop' in calTaron,
    expected: false,
  },
  {
    name: 'comparison and baseline are gone — nothing has ever rendered them',
    actual: () => 'comparison' in calTaron || 'baseline' in calTaron,
    expected: false,
  },
  {
    name: 'typicalWaits and rideProfile are gone (ride-page fields)',
    actual: () => 'typicalWaits' in calTaron || 'rideProfile' in calTaron,
    expected: false,
  },
  {
    name: 'an unknown field the API adds later stays out by default (allow-list, not deny-list)',
    actual: () => 'crowdLevel' in calTaron,
    expected: false,
  },

  // ---- restaurants ride along whole, on purpose ----
  // `useParkTileItems` reads them for a `.length` and an `OPERATING` count, which is 6.6 KB of
  // records for two numbers. Projecting them means moving those numbers onto `ParkTileSource`;
  // faking a `ParkRestaurant` with an empty `name` to satisfy the type would be a lie one render
  // away from a reader. Until then the tile has to keep working.
  {
    name: 'the restaurants tile still gets its count',
    actual: () => cal.restaurants.length,
    expected: 3,
  },
  {
    name: 'and still counts how many are open',
    actual: () => cal.restaurants.filter((r) => r.status === 'OPERATING').length,
    expected: 2,
  },
  {
    name: 'with real names, not placeholders',
    actual: () => cal.restaurants[0].name,
    expected: 'Uhrwerk',
  },

  // ---- park-level fields the panel reads are untouched ----
  {
    name: 'the today panel keeps schedule, weather, shows and analytics',
    actual: () =>
      Boolean(cal.schedule && cal.weather && cal.shows && cal.analytics && cal.timezone),
    expected: true,
  },
  {
    name: 'liveWaitTimes survives — the curated flag is the only signal for an unreadable park',
    actual: () => cal.liveWaitTimes.available,
    expected: true,
  },

  // ---- nothing is lost: the poll refills it over the lean seed ----
  {
    name: 'the live poll lays statistics back over the trimmed seed',
    actual: () => {
      const merged = mergeLiveParkSnapshot(cal, leanParkForLivePoll(PARK));
      return merged.attractions[0].statistics?.avgWaitToday;
    },
    expected: 40,
  },
  {
    name: 'and bestVisitTimes with it',
    actual: () => {
      const merged = mergeLiveParkSnapshot(cal, leanParkForLivePoll(PARK));
      return merged.attractions[0].bestVisitTimes?.[0]?.rating;
    },
    expected: 'optimal',
  },
  {
    name: 'the merge keeps the static fields the seed carried',
    actual: () => {
      const merged = mergeLiveParkSnapshot(cal, leanParkForLivePoll(PARK));
      return merged.attractions[0].slug;
    },
    expected: 'taron',
  },
  {
    name: 'the poll does not smuggle comparison/baseline back in either',
    actual: () => {
      const merged = mergeLiveParkSnapshot(cal, leanParkForLivePoll(PARK));
      return 'comparison' in merged.attractions[0] || 'baseline' in merged.attractions[0];
    },
    expected: false,
  },

  // ---- the source park is never mutated ----
  {
    name: 'the projection does not mutate the park it was given',
    actual: () => PARK.attractions[0].bestVisitTimes.length === 1 && PARK.restaurants.length === 3,
    expected: true,
  },
];

console.log('🧪 Testing what the server render serializes\n');
console.log('='.repeat(80) + '\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase) => {
  const result = testCase.actual();
  if (result === testCase.expected) {
    console.log(`✅ PASS: ${testCase.name}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${testCase.name}`);
    console.log(`   Expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`   Got:      ${JSON.stringify(result)}`);
    failed++;
  }
});

console.log('\n' + '='.repeat(80));
console.log(`\n📊 Results: ${passed}/${testCases.length} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed.');
  process.exit(1);
}
