/**
 * Unit tests for `deriveParkBestDays` (`lib/parks/park-stats-derive.ts`), the weekday tiers and the
 * quietest and busiest weekdays and months the park page header prints. The fixtures are the two
 * parks the change was made for, as `/v1/parks/.../stats?years=2` returned them on 2026-10-16:
 * Europa-Park, whose API levels put six weekdays on „Normal" and whose January is the first days of
 * its winter season, and Fuji-Q Highland, whose quiet end is Wednesday to Friday.
 *
 * Run: pnpm test:park-best-days
 */

import assert from 'node:assert/strict';
import { deriveParkBestDays } from '../lib/parks/park-stats-derive.ts';

const bucket = ([key, avgCrowdScore, sampleDays]) => ({
  avgCrowdScore,
  sampleDays,
  avgCrowdLevel: 'moderate',
  avgWaitP50: 0,
  avgWaitP90: 0,
  key,
});
const stats = (dow, months, displayable = true) => ({
  byDayOfWeek: dow.map((d) => {
    const { key, ...rest } = bucket(d);
    return { dayOfWeek: key, ...rest };
  }),
  byMonth: months.map((m) => {
    const { key, ...rest } = bucket(m);
    return { month: key, ...rest };
  }),
  topAttractions: [],
  meta: { totalSampleDays: 236, windowYears: 2, displayable },
});

const europaPark = stats(
  [
    [0, 2, 34],
    [1, 2.2, 33],
    [2, 2.4, 34],
    [3, 2.1, 34],
    [4, 2, 34],
    [5, 1.9, 33],
    [6, 2.8, 34],
  ],
  [
    [1, 1, 18],
    [3, 2.1, 14],
    [4, 2.4, 30],
    [5, 2.1, 31],
    [6, 2, 30],
    [7, 2.4, 31],
    [8, 2.5, 31],
    [9, 2.3, 30],
    [10, 2.3, 15],
    [12, 3.2, 6],
  ]
);

const fujiQ = stats(
  [
    [0, 4.5, 25],
    [1, 4.1, 25],
    [2, 4, 25],
    [3, 3.5, 24],
    [4, 3.4, 20],
    [5, 3.2, 24],
    [6, 4.8, 24],
  ],
  [
    [4, 3.3, 5],
    [5, 4.3, 30],
    [6, 2.7, 26],
    [7, 3.5, 30],
    [8, 4.5, 31],
    [9, 4.6, 30],
    [10, 3.9, 15],
  ]
);

let failed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    failed++;
    console.error(`✗ ${name}\n  ${err.message}`);
  }
}

test('Europa-Park: the week is tiered against itself, not all „Normal"', () => {
  const r = deriveParkBestDays(europaPark);
  // Sun 2.0, Wed 2.1, Thu 2.0 and Fri 1.9 lie within a tenth of the mean score of each other.
  assert.deepEqual(r.quietDays, [0, 3, 4, 5]);
  assert.deepEqual(r.busyDays, [6]);
  assert.deepEqual(r.days, ['quiet', 'middle', 'middle', 'quiet', 'quiet', 'quiet', 'busy']);
});

test('Europa-Park: January, the first days of the winter season, is not the quietest month', () => {
  const r = deriveParkBestDays(europaPark);
  // Jan 18, Mar 14, Oct 15 and Dec 6 measured days against a median month of 30: left out.
  assert.ok(!r.quietMonths.includes(1));
  assert.deepEqual(r.quietMonths, [5, 6]);
  // Apr, Jul, Aug and Sep sit within the delta of August: four of six is the usual, not an end.
  assert.deepEqual(r.busyMonths, []);
});

test('Fuji-Q: Wednesday to Friday quiet, Saturday and Sunday busy', () => {
  const r = deriveParkBestDays(fujiQ);
  assert.deepEqual(r.quietDays, [3, 4, 5]);
  assert.deepEqual(r.busyDays, [0, 6]);
  assert.deepEqual(r.quietMonths, [6]);
  assert.deepEqual(r.busyMonths, [5, 8, 9]);
});

test('two days closer than the minimum delta share a tier', () => {
  const r = deriveParkBestDays(
    stats(
      [0, 1, 2, 3, 4, 5, 6].map((d) => [d, d === 6 ? 3 : 2 + d * 0.01, 30]),
      [5, 6, 7, 8].map((m) => [m, 2, 30])
    )
  );
  assert.deepEqual(r.quietDays, []);
  assert.deepEqual(r.busyDays, [6]);
});

test('an aggregate that is not displayable gives nothing', () => {
  assert.equal(deriveParkBestDays({ ...fujiQ, meta: { ...fujiQ.meta, displayable: false } }), null);
  assert.equal(deriveParkBestDays(null), null);
});

test('a flat week and a flat year give nothing', () => {
  const flat = stats(
    [0, 1, 2, 3, 4, 5, 6].map((d) => [d, 2, 30]),
    [5, 6, 7, 8].map((m) => [m, 2.05, 30])
  );
  assert.equal(deriveParkBestDays(flat), null);
});

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
