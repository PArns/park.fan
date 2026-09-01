// Regression tests for the DAY-SCOPED block of the park poll: shows and restaurant statuses.
//
// Neither is live and neither is stable. The API answers with a show's showtimes FOR TODAY and
// forces every show to CLOSED for as long as the park is closed, so the structure fetch — cached
// for PARK_REVALIDATE and in practice written overnight — stands for the whole day saying
// "yesterday's times, nothing running". On 2026-09-01 that is what every park on the site
// served: Phantasialand's four shows dated 2026-08-31 and 0 of 46 restaurants open at 13:38,
// while the API answered OPERATING for all of them.
//
// The projection carries the block on request (`?full=1`) and the merge has to treat an absent
// block as "unchanged" rather than "empty" — most polls do not carry it.
import { leanParkForLivePoll, mergeLiveParkSnapshot } from '../lib/api/park-live-projection.ts';

/** The server render: written before the park opened. */
const SEED = {
  status: 'CLOSED',
  timezone: 'Europe/Berlin',
  hasOperatingSchedule: true,
  attractions: [{ id: 'a1', name: 'Taron', slug: 'taron', land: 'Klugheim', status: 'CLOSED' }],
  shows: [
    {
      id: 's1',
      name: 'Rock on Ice',
      slug: 'rock-on-ice',
      latitude: 1,
      longitude: 2,
      status: 'CLOSED',
      showtimes: [{ startTime: '2026-08-31T13:00:00+02:00' }],
    },
    {
      id: 's2',
      name: 'Nobis Vol. 2',
      slug: 'nobis',
      latitude: 1,
      longitude: 2,
      status: 'CLOSED',
      showtimes: [{ startTime: '2026-08-31T12:00:00+02:00' }],
    },
  ],
  restaurants: [
    {
      id: 'r1',
      name: 'Eggnog',
      slug: 'eggnog',
      latitude: 1,
      longitude: 2,
      cuisineType: null,
      requiresReservation: false,
      status: 'CLOSED',
    },
    {
      id: 'r2',
      name: 'Bar Fritz',
      slug: 'bar-fritz',
      latitude: 1,
      longitude: 2,
      cuisineType: null,
      requiresReservation: false,
      status: 'CLOSED',
    },
  ],
};

/** The same park at 13:38, as the API answers it — Nobis has no performance today at all. */
const OPEN_PARK = {
  ...SEED,
  status: 'OPERATING',
  shows: [
    {
      id: 's1',
      name: 'Rock on Ice',
      slug: 'rock-on-ice',
      latitude: 1,
      longitude: 2,
      status: 'OPERATING',
      showtimes: [{ startTime: '2026-09-01T13:00:00+02:00' }],
    },
  ],
  restaurants: [
    {
      id: 'r1',
      name: 'Eggnog',
      slug: 'eggnog',
      latitude: 1,
      longitude: 2,
      cuisineType: null,
      requiresReservation: false,
      status: 'OPERATING',
    },
    {
      id: 'r2',
      name: 'Bar Fritz',
      slug: 'bar-fritz',
      latitude: 1,
      longitude: 2,
      cuisineType: null,
      requiresReservation: false,
      status: 'OPERATING',
    },
  ],
};

const lean = leanParkForLivePoll(OPEN_PARK);
const full = leanParkForLivePoll(OPEN_PARK, { daily: true });

const testCases = [
  // ---- the projection ----
  {
    name: 'a normal poll carries no shows (absent, not empty)',
    actual: () => 'shows' in lean,
    expected: false,
  },
  {
    name: 'a normal poll carries no restaurants',
    actual: () => 'restaurants' in lean,
    expected: false,
  },
  {
    name: 'a full poll carries the shows whole — the card has nothing else to render a name from',
    actual: () => full.shows.map((s) => `${s.name}@${s.showtimes[0].startTime}`).join(),
    expected: 'Rock on Ice@2026-09-01T13:00:00+02:00',
  },
  {
    name: 'a full poll projects restaurants down to what can move',
    actual: () => Object.keys(full.restaurants[0]).join(),
    expected: 'id,status,waitTime,partySize,operatingHours',
  },

  // ---- the merge ----
  {
    name: 'a poll without the block keeps the seed shows',
    actual: () =>
      mergeLiveParkSnapshot(SEED, lean)
        .shows.map((s) => s.id)
        .join(),
    expected: 's1,s2',
  },
  {
    name: 'a poll without the block keeps the seed restaurant statuses',
    actual: () =>
      mergeLiveParkSnapshot(SEED, lean)
        .restaurants.map((r) => r.status)
        .join(),
    expected: 'CLOSED,CLOSED',
  },
  {
    name: 'a full poll replaces the shows wholesale — one with no performance today is gone',
    actual: () =>
      mergeLiveParkSnapshot(SEED, full)
        .shows.map((s) => s.id)
        .join(),
    expected: 's1',
  },
  {
    name: "a full poll carries today's showtimes onto the page",
    actual: () => mergeLiveParkSnapshot(SEED, full).shows[0].showtimes[0].startTime,
    expected: '2026-09-01T13:00:00+02:00',
  },
  {
    name: 'a full poll updates restaurant status',
    actual: () =>
      mergeLiveParkSnapshot(SEED, full)
        .restaurants.map((r) => r.status)
        .join(),
    expected: 'OPERATING,OPERATING',
  },
  {
    name: 'and keeps the name the projection left out',
    actual: () =>
      mergeLiveParkSnapshot(SEED, full)
        .restaurants.map((r) => r.name)
        .join(),
    expected: 'Eggnog,Bar Fritz',
  },
  {
    name: 'restaurant membership stays with the seed, not the snapshot',
    actual: () =>
      mergeLiveParkSnapshot(SEED, { ...full, restaurants: [{ id: 'r1', status: 'DOWN' }] })
        .restaurants.map((r) => `${r.id}:${r.status}`)
        .join(),
    expected: 'r1:DOWN,r2:CLOSED',
  },
  {
    name: 'a subscriber with no seed still reads the snapshot unchanged',
    actual: () => mergeLiveParkSnapshot(undefined, full).shows.length,
    expected: 1,
  },
  {
    name: 'the seed merged over itself is untouched (the pre-fetch render)',
    actual: () => mergeLiveParkSnapshot(SEED, SEED) === SEED,
    expected: true,
  },
];

console.log('🧪 Testing the park poll’s day-scoped block (shows + restaurants)\n');
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
