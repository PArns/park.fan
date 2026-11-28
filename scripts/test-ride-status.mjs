/**
 * Unit tests for the status a ride is shown with (`getLiveAttractionStatus` and
 * `getAttractionDisplayStatus` in `lib/utils/park-utils.ts`).
 *
 * The case this exists for is the ride that carries no status at all: nothing said it is closed,
 * so it reads UNKNOWN on both helpers, and it is not open for the „n von m offen" count either.
 * The rest pins the order the two helpers read their sources in, so a fix to the fallback cannot
 * move a ride that does have a status.
 *
 * Run: pnpm test:ride-status
 */

import {
  getAttractionDisplayStatus,
  getLiveAttractionStatus,
  isAttractionOpenNow,
} from '../lib/utils/park-utils.ts';

const ride = (over = {}) => ({
  id: 'r',
  name: 'Ride',
  slug: 'ride',
  latitude: null,
  longitude: null,
  land: null,
  ...over,
});

const standby = (status) => ({
  queueType: 'STANDBY',
  status,
  waitTime: 20,
  lastUpdated: '2026-11-28T10:00:00.000Z',
});

const testCases = [];
const test = (name, actual, expected) => testCases.push({ name, actual, expected });

// --- no status anywhere ---------------------------------------------------------------------------

test('live: no status and no queue is unknown', () => getLiveAttractionStatus(ride()), 'UNKNOWN');
test(
  'live: no status in an open park is unknown',
  () => getLiveAttractionStatus(ride(), 'OPERATING'),
  'UNKNOWN'
);
test(
  'live: a standby row without a status falls to the ride, then to unknown',
  () => getLiveAttractionStatus(ride({ queues: [{ ...standby(undefined) }] })),
  'UNKNOWN'
);
test(
  'display: no status and no queue is unknown',
  () => getAttractionDisplayStatus(ride()),
  'UNKNOWN'
);
test(
  'display: no status in an open park is unknown',
  () => getAttractionDisplayStatus(ride(), 'OPERATING'),
  'UNKNOWN'
);
test('a ride without a status is not open', () => isAttractionOpenNow(ride(), 'OPERATING'), false);

// --- the park decides first ---------------------------------------------------------------------

test(
  'live: a closed park closes every ride',
  () => getLiveAttractionStatus(ride({ status: 'OPERATING' }), 'CLOSED'),
  'CLOSED'
);
test(
  'live: an unknown park makes every ride unknown',
  () => getLiveAttractionStatus(ride({ status: 'OPERATING' }), 'UNKNOWN'),
  'UNKNOWN'
);
test(
  'display: a closed park closes a ride without a status too',
  () => getAttractionDisplayStatus(ride(), 'CLOSED'),
  'CLOSED'
);

// --- then the ride's own sources ----------------------------------------------------------------

test(
  'live: effectiveStatus beats the queue',
  () =>
    getLiveAttractionStatus(
      ride({ effectiveStatus: 'CLOSED', status: 'OPERATING', queues: [standby('OPERATING')] }),
      'OPERATING'
    ),
  'CLOSED'
);
test(
  'live: the standby row beats the ride',
  () => getLiveAttractionStatus(ride({ status: 'OPERATING', queues: [standby('DOWN')] })),
  'DOWN'
);
test(
  'live: the ride stands where there is no row',
  () => getLiveAttractionStatus(ride({ status: 'REFURBISHMENT' })),
  'REFURBISHMENT'
);
test(
  'display: the standby row beats the ride',
  () => getAttractionDisplayStatus(ride({ status: 'OPERATING', queues: [standby('DOWN')] })),
  'DOWN'
);
test(
  'display: a reported closure stays closed',
  () => getAttractionDisplayStatus(ride({ status: 'CLOSED' }), 'OPERATING'),
  'CLOSED'
);

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  let result;
  try {
    result = testCase.actual();
  } catch (error) {
    result = `THREW: ${error.message}`;
  }
  if (result === testCase.expected) {
    passed++;
  } else {
    console.log(`❌ FAIL: ${testCase.name}`);
    console.log(`   Expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`   Got:      ${JSON.stringify(result)}`);
    failed++;
  }
}

console.log('\n' + '='.repeat(80));
console.log(`\n📊 Results: ${passed}/${testCases.length} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed.');
  process.exit(1);
}
