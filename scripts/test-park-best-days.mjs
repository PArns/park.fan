/**
 * Unit tests for `deriveParkBestDays` (`lib/parks/park-stats-derive.ts`), the quietest and busiest
 * weekdays and months the park page header prints. The fixtures are the two parks the change was
 * made for, as `/v1/parks/.../stats?years=2` returned them on 2026-10-16: Europa-Park, whose week is
 * six moderate days and a high Saturday, and Fuji-Q Highland, whose quiet end is Tuesday to Friday.
 *
 * Run: pnpm test:park-best-days
 */

import assert from 'node:assert/strict';
import { deriveParkBestDays } from '../lib/parks/park-stats-derive.ts';

const stats = (dow, months, displayable = true) => ({
  byDayOfWeek: dow.map(([dayOfWeek, avgCrowdLevel, sampleDays]) => ({
    dayOfWeek,
    avgCrowdLevel,
    sampleDays,
    avgCrowdScore: 0,
    avgWaitP50: 0,
    avgWaitP90: 0,
  })),
  byMonth: months.map(([month, avgCrowdLevel, sampleDays]) => ({
    month,
    avgCrowdLevel,
    sampleDays,
    avgCrowdScore: 0,
    avgWaitP50: 0,
    avgWaitP90: 0,
  })),
  topAttractions: [],
  meta: { totalSampleDays: 236, windowYears: 2, displayable },
});

const europaPark = stats(
  [
    [0, 'moderate', 34],
    [1, 'moderate', 33],
    [2, 'moderate', 34],
    [3, 'moderate', 34],
    [4, 'moderate', 34],
    [5, 'moderate', 33],
    [6, 'high', 34],
  ],
  [
    [1, 'very_low', 18],
    [3, 'low', 14],
    [4, 'moderate', 30],
    [5, 'moderate', 31],
    [6, 'moderate', 30],
    [7, 'moderate', 31],
    [8, 'high', 31],
    [9, 'moderate', 30],
    [10, 'moderate', 15],
    // Six measured days: too thin to call December the busiest month.
    [12, 'high', 6],
  ]
);

const fujiQ = stats(
  [
    [0, 'high', 25],
    [1, 'high', 25],
    [2, 'moderate', 25],
    [3, 'moderate', 24],
    [4, 'moderate', 20],
    [5, 'moderate', 24],
    [6, 'high', 24],
  ],
  [
    [4, 'low', 5],
    [5, 'high', 30],
    [6, 'low', 26],
    [7, 'moderate', 30],
    [8, 'high', 31],
    [9, 'high', 30],
    [10, 'moderate', 15],
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

test('a quiet end of six days out of seven is the usual, not a finding', () => {
  const r = deriveParkBestDays(europaPark);
  assert.deepEqual(r.quietDays, []);
  assert.deepEqual(r.busyDays, [6]);
});

test('a thin month carries no level and cannot be the busiest', () => {
  const r = deriveParkBestDays(europaPark);
  assert.equal(r.months[11], null);
  assert.deepEqual(r.quietMonths, [1]);
  assert.deepEqual(r.busyMonths, [8]);
});

test('Fuji-Q: Tuesday to Friday quiet, Saturday to Monday busy', () => {
  const r = deriveParkBestDays(fujiQ);
  assert.deepEqual(r.quietDays, [2, 3, 4, 5]);
  assert.deepEqual(r.busyDays, [0, 1, 6]);
  assert.deepEqual(r.quietMonths, [6]);
  assert.deepEqual(r.busyMonths, [5, 8, 9]);
});

test('an aggregate that is not displayable gives nothing', () => {
  assert.equal(deriveParkBestDays({ ...fujiQ, meta: { ...fujiQ.meta, displayable: false } }), null);
  assert.equal(deriveParkBestDays(null), null);
});

test('a flat week and a flat year give nothing', () => {
  const flat = stats(
    [0, 1, 2, 3, 4, 5, 6].map((d) => [d, 'moderate', 30]),
    [5, 6, 7, 8].map((m) => [m, 'moderate', 30])
  );
  assert.equal(deriveParkBestDays(flat), null);
});

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
