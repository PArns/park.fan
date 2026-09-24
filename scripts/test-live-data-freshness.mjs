// Tests for the "as of" line under the park page's filter panel (PAR-420).
//
// Two rules are easy to get wrong here:
//
// 1. The pre-mount render reads no clock, so it never warns — whatever the seed says.
// 2. Age is measured from the query's last answer, never from the seed's queue timestamps:
//    Phantasialand at 02:09 UTC reported 01:10 as its newest queue update, because the park
//    was shut, and a fresh page load would otherwise open with "not up to date".
import {
  LIVE_DATA_STALE_AFTER_MS,
  liveDataHint,
  newestQueueUpdate,
} from '../lib/utils/live-data-freshness.ts';

const NOW = Date.parse('2026-09-23T12:00:00Z');
const MIN = 60_000;

const queue = (lastUpdated) => ({ queueType: 'STANDBY', status: 'OPERATING', lastUpdated });

const testCases = [
  // ---- newestQueueUpdate ----
  {
    name: 'newestQueueUpdate: no attractions → null',
    actual: () => newestQueueUpdate(undefined),
    expected: null,
  },
  {
    name: 'newestQueueUpdate: attractions without queues → null',
    actual: () => newestQueueUpdate([{ id: 'a' }, { id: 'b', queues: [] }]),
    expected: null,
  },
  {
    name: 'newestQueueUpdate: picks the newest queue across all attractions',
    actual: () =>
      newestQueueUpdate([
        { id: 'a', queues: [queue('2026-04-16T14:47:45.381Z')] },
        { id: 'b', queues: [queue('2026-09-23T01:10:01.067Z'), queue('2026-09-22T20:00:00Z')] },
      ]),
    expected: Date.parse('2026-09-23T01:10:01.067Z'),
  },
  {
    name: 'newestQueueUpdate: an unparseable timestamp is skipped, not NaN',
    actual: () =>
      newestQueueUpdate([{ id: 'a', queues: [queue('garbage'), queue('2026-09-23T10:00:00Z')] }]),
    expected: Date.parse('2026-09-23T10:00:00Z'),
  },

  // ---- liveDataHint ----
  {
    name: 'liveDataHint: pre-mount (no clock) never warns, even when failed and paused',
    actual: () => liveDataHint({ now: null, dataUpdatedAt: 0, failed: true, paused: true }),
    expected: null,
  },
  {
    name: 'liveDataHint: mounted, first poll still in flight → no warning',
    actual: () => liveDataHint({ now: NOW, dataUpdatedAt: 0, failed: false, paused: false }),
    expected: null,
  },
  {
    name: 'liveDataHint: answer 4 min old → no warning',
    actual: () =>
      liveDataHint({ now: NOW, dataUpdatedAt: NOW - 4 * MIN, failed: false, paused: false }),
    expected: null,
  },
  {
    name: 'liveDataHint: answer exactly at the limit → no warning',
    actual: () =>
      liveDataHint({
        now: NOW,
        dataUpdatedAt: NOW - LIVE_DATA_STALE_AFTER_MS,
        failed: false,
        paused: false,
      }),
    expected: null,
  },
  {
    name: 'liveDataHint: answer 11 min old → outdated',
    actual: () =>
      liveDataHint({ now: NOW, dataUpdatedAt: NOW - 11 * MIN, failed: false, paused: false }),
    expected: 'outdated',
  },
  {
    name: 'liveDataHint: last attempt failed, data 1 min old → outdated',
    actual: () =>
      liveDataHint({ now: NOW, dataUpdatedAt: NOW - 1 * MIN, failed: true, paused: false }),
    expected: 'outdated',
  },
  {
    name: 'liveDataHint: first poll failed (never answered) → outdated',
    actual: () => liveDataHint({ now: NOW, dataUpdatedAt: 0, failed: true, paused: false }),
    expected: 'outdated',
  },
  {
    name: 'liveDataHint: browser offline → offline, even with fresh data',
    actual: () =>
      liveDataHint({ now: NOW, dataUpdatedAt: NOW - 1 * MIN, failed: false, paused: true }),
    expected: 'offline',
  },
  {
    name: 'liveDataHint: offline wins over failed',
    actual: () =>
      liveDataHint({ now: NOW, dataUpdatedAt: NOW - 30 * MIN, failed: true, paused: true }),
    expected: 'offline',
  },
];

console.log('🧪 Testing live data freshness\n');
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
