// Regression tests for the running-outage field on the five-minute park poll.
//
// The field is small and its presence rule is the whole point: `outage` exists on roughly 0.7 %
// of rides at any instant, and `mergeLiveParkSnapshot` spreads the snapshot OVER the
// server-rendered ride. So a projection that omits the key when there is no outage leaves the
// server render's copy in place forever — the line "Störung gemeldet seit Sonntag, 14:20 Uhr"
// would stand under an OPERATING badge until the page is rebuilt, and a tab left open all day
// would never heal. Sending the key with `undefined` is what clears it.
//
// This is the same trap `isCurrentlyInSeason` documents one field above it in the projection, and
// it bites harder here: a stale season flag hides a ride, a stale outage accuses an operator of a
// breakdown that ended hours ago.
import { leanParkForLivePoll, mergeLiveParkSnapshot } from '../lib/api/park-live-projection.ts';

const OUTAGE = { startedAt: '2026-09-06T12:20:00.000Z', startObserved: true };

/** The server render: Taron down, Black Mamba running. */
const SEED = {
  status: 'OPERATING',
  timezone: 'Europe/Berlin',
  hasOperatingSchedule: true,
  attractions: [
    {
      id: 'a1',
      name: 'Taron',
      slug: 'taron',
      land: 'Klugheim',
      status: 'DOWN',
      effectiveStatus: 'DOWN',
      minimumHeight: 140,
      outage: OUTAGE,
    },
    {
      id: 'a2',
      name: 'Black Mamba',
      slug: 'black-mamba',
      land: 'Deep in Africa',
      status: 'OPERATING',
      effectiveStatus: 'OPERATING',
      minimumHeight: 140,
    },
  ],
};

/** A later poll in which Taron is running again. */
const RECOVERED = {
  ...SEED,
  attractions: [
    { ...SEED.attractions[0], status: 'OPERATING', effectiveStatus: 'OPERATING', outage: undefined },
    SEED.attractions[1],
  ],
};

/** A later poll in which Black Mamba has broken down. */
const BROKE = {
  ...SEED,
  attractions: [
    { ...SEED.attractions[0], status: 'OPERATING', effectiveStatus: 'OPERATING', outage: undefined },
    { ...SEED.attractions[1], status: 'DOWN', effectiveStatus: 'DOWN', outage: OUTAGE },
  ],
};

const merged = (base, poll) => mergeLiveParkSnapshot(base, leanParkForLivePoll(poll));
const ride = (park, id) => park.attractions.find((a) => a.id === id);

const testCases = [
  {
    name: 'the projection carries the outage of a ride that is down',
    actual: () => leanParkForLivePoll(SEED).attractions[0].outage?.startedAt ?? null,
    expected: OUTAGE.startedAt,
  },
  {
    name: 'the projection sends the key even for a ride with no outage',
    // `in`, not a truthiness check: the key has to be PRESENT and undefined for
    // the spread in mergeLiveParkSnapshot to overwrite a stale value.
    actual: () => 'outage' in leanParkForLivePoll(SEED).attractions[1],
    expected: true,
  },
  {
    name: 'a recovered ride loses its line on the next poll',
    actual: () => merged(SEED, RECOVERED).attractions[0].outage ?? null,
    expected: null,
  },
  {
    name: 'a ride that breaks between polls gains one',
    actual: () => ride(merged(SEED, BROKE), 'a2').outage?.startedAt ?? null,
    expected: OUTAGE.startedAt,
  },
  {
    name: 'the merge keeps the static fields the projection does not carry',
    // The projection is a projection: name, land and height come from the
    // server render, and the outage must not cost them.
    actual: () => ride(merged(SEED, RECOVERED), 'a1').minimumHeight ?? null,
    expected: 140,
  },
  {
    name: 'a still-running outage survives a poll unchanged',
    actual: () => ride(merged(SEED, SEED), 'a1').outage?.startedAt ?? null,
    expected: OUTAGE.startedAt,
  },
  {
    name: 'startObserved travels with it',
    // False is what makes the UI name no clock time at all, so a projection
    // that dropped it would turn "start unknown" into a confident timestamp.
    actual: () =>
      leanParkForLivePoll({
        ...SEED,
        attractions: [{ ...SEED.attractions[0], outage: { ...OUTAGE, startObserved: false } }],
      }).attractions[0].outage.startObserved,
    expected: false,
  },
];

console.log('\n🔧 Live poll: the running-outage field\n' + '='.repeat(80) + '\n');

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
