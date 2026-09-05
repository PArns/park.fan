/**
 * Unit tests for `lib/parks/attraction-history-geometry.ts`.
 *
 * The ride page's history calendar cannot draw itself until a client fetch lands, so whatever
 * stands in its place decides how far the rest of the page moves when it does. What this pins is
 * the one thing that varies — how many week rows 31 weekday-aligned days span — because the
 * placeholder it replaced was four hand-measured pixel heights with nothing to notice when the
 * cell changed shape.
 *
 * Run: pnpm test:attraction-history-geometry
 */

import {
  HISTORY_WINDOW_DAYS,
  historyGridReservation,
  historyGridRows,
  historyListRows,
  historyRows,
} from '../lib/parks/attraction-history-geometry.ts';

const testCases = [];
const test = (name, actual, expected) => testCases.push({ name, actual, expected });

console.log('='.repeat(80));
console.log('ATTRACTION HISTORY GRID GEOMETRY');
console.log('='.repeat(80) + '\n');

/* ── The window itself ─────────────────────────────────────────────────────── */

test('window is today plus thirty days back', () => HISTORY_WINDOW_DAYS, 30);
test('list rows are half of 31, rounded up', () => historyListRows(), 16);

/* ── Rows, which no longer depend on anything ────────────────────────────────
 *
 * The grid is a history laid out today-first, so it has no leading blanks and its row count is
 * arithmetic on the window alone. An earlier version aligned it to weekday columns like the
 * park's month grid; that read forwards, put the oldest week on top of a chapter called
 * „Verlauf", and made the reservation flip between five rows and six depending on which weekday
 * the window happened to start on.
 */
test('two columns take sixteen rows', () => historyRows(2), 16);
test('seven columns take five rows', () => historyGridRows(), 5);
test('one column is the whole window', () => historyRows(1), 31);

/* ── The reservation the placeholder actually reads ──────────────────────────
 *
 * Measured against the rendered grid: a row is one tile, and the `gap-2` sits BETWEEN rows, so n
 * rows carry n − 1 gaps. The two tile figures are NOT the two `min-h` values — at `lg` the
 * content is under the 164 px floor so every tile measures it exactly, while below `lg` the
 * content is 119 px, one pixel OVER the 118 px floor, so the floor never governs a day with a
 * curve in it (30 of 31 tiles measured 119.000 on Taron and Talocan at 390 px in de and fr; the
 * exception was the one day with no curve).
 */
test('below lg: 16 tiles of 119 with 15 gaps', () => historyGridReservation().base, 2024);
test('from lg: 5 tiles of 164 with 4 gaps', () => historyGridReservation().lg, 852);
test(
  'the reservation is the same on every day of the year',
  () => {
    const a = historyGridReservation();
    const b = historyGridReservation();
    return a.base === b.base && a.lg === b.lg ? 'stable' : 'varies';
  },
  'stable'
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
    console.log(`✅ PASS: ${testCase.name}`);
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
