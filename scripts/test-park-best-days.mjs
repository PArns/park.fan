/**
 * Unit tests for `deriveParkBestDays` (`lib/parks/park-stats-derive.ts`), the weekday tiers and the
 * quietest and busiest weekdays and months the park page header prints. The fixtures are the two
 * parks the change was made for, as `/v1/parks/.../stats?years=2` returned them on 2026-10-16:
 * Europa-Park, whose API levels put six weekdays on „Normal" and whose January is the first days of
 * its winter season, and Fuji-Q Highland, whose quiet end is Wednesday to Friday. Phantasialand, as
 * it returned on 2026-10-17, is the week whose five quiet weekdays are the majority and whose
 * Sunday sits between them and Saturday; it marked Saturday alone.
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

const phantasialand = stats(
  [
    [0, 3.4, 33],
    [1, 2.7, 33],
    [2, 2.7, 32],
    [3, 2.8, 32],
    [4, 2.7, 32],
    [5, 2.7, 34],
    [6, 3.9, 34],
  ],
  [
    [1, 3, 22],
    [3, 2.8, 4],
    [4, 2.8, 30],
    [5, 2.5, 31],
    [6, 2.6, 29],
    [7, 4.1, 31],
    [8, 4.5, 31],
    [9, 1.9, 30],
    [10, 1.6, 16],
    [12, 4.4, 6],
  ]
);

test('Phantasialand: Monday to Friday quieter, Saturday AND Sunday busier', () => {
  const r = deriveParkBestDays(phantasialand);
  // Mean 2.99: the weekdays sit 0.19 to 0.29 below it, Sunday 0.41 and Saturday 0.91 above.
  assert.deepEqual(r.days, ['busy', 'quiet', 'quiet', 'quiet', 'quiet', 'quiet', 'busy']);
});

test('Phantasialand: the five weekdays tie for quietest, Saturday alone is busiest', () => {
  const r = deriveParkBestDays(phantasialand);
  // Wednesday's 2.8 is one rounding step from the others' 2.7, so it shares the minimum.
  assert.deepEqual(r.quietDays, [1, 2, 3, 4, 5]);
  assert.deepEqual(r.busyDays, [6]);
});

test('Phantasialand: both month ends pass the same sample gate', () => {
  const r = deriveParkBestDays(phantasialand);
  // October reads 1.6, lower than September, on 16 measured days against a median month of 30:
  // it is out of the quiet end exactly as the 6-day December is out of the busy one.
  assert.deepEqual(r.quietMonths, [9]);
  assert.deepEqual(r.busyMonths, [8]);
});

test('Europa-Park: the week is tiered against its own mean, in both directions', () => {
  const r = deriveParkBestDays(europaPark);
  // Mean 2.2: Sunday, Thursday and Friday 0.2 or more below, Tuesday and Saturday above.
  assert.deepEqual(r.days, ['quiet', 'middle', 'busy', 'middle', 'quiet', 'quiet', 'busy']);
  assert.deepEqual(r.quietDays, [0, 4, 5]);
  assert.deepEqual(r.busyDays, [6]);
});

test('Europa-Park: January, the first days of the winter season, is not the quietest month', () => {
  const r = deriveParkBestDays(europaPark);
  // Jan 18, Mar 14, Oct 15 and Dec 6 measured days against a median month of 30: left out.
  assert.ok(!r.quietMonths.includes(1));
  assert.deepEqual(r.quietMonths, [5, 6]);
  assert.deepEqual(r.busyMonths, [8]);
});

test('Fuji-Q: Wednesday to Friday quiet, the weekend busy; Friday and Saturday are the ends', () => {
  const r = deriveParkBestDays(fujiQ);
  assert.deepEqual(r.days, ['busy', 'busy', 'middle', 'quiet', 'quiet', 'quiet', 'busy']);
  assert.deepEqual(r.quietDays, [5]);
  assert.deepEqual(r.busyDays, [6]);
  assert.deepEqual(r.quietMonths, [6]);
  assert.deepEqual(r.busyMonths, [8, 9]);
});

test('a day close to the mean is neither end', () => {
  const r = deriveParkBestDays(
    stats(
      [0, 1, 2, 3, 4, 5, 6].map((d) => [d, d === 6 ? 2.6 : 2, 30]),
      [5, 6, 7, 8].map((m) => [m, 2, 30])
    )
  );
  assert.deepEqual(r.days, ['middle', 'middle', 'middle', 'middle', 'middle', 'middle', 'busy']);
  assert.deepEqual(r.quietDays, []);
  assert.deepEqual(r.busyDays, [6]);
});

test('a week whose range is under 0.3 marks no day at all', () => {
  const r = deriveParkBestDays(
    stats(
      [0, 1, 2, 3, 4, 5, 6].map((d) => [d, d === 6 ? 2.2 : 2, 30]),
      [5, 6, 7, 8].map((m) => [m, m === 8 ? 3 : 2, 30])
    )
  );
  assert.ok(r.days.every((t) => t === 'middle'));
  assert.deepEqual(r.quietDays, []);
  assert.deepEqual(r.busyDays, []);
  assert.deepEqual(r.busyMonths, [8]);
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
