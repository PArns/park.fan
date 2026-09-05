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
  historyListRows,
  historyWeekRows,
} from '../lib/parks/attraction-history-geometry.ts';

const testCases = [];
const test = (name, actual, expected) => testCases.push({ name, actual, expected });

console.log('='.repeat(80));
console.log('ATTRACTION HISTORY GRID GEOMETRY');
console.log('='.repeat(80) + '\n');

/* ── The window itself ─────────────────────────────────────────────────────── */

test('window is today plus thirty days back', () => HISTORY_WINDOW_DAYS, 30);
test('list rows are half of 31, rounded up', () => historyListRows(), 16);

/* ── Week rows across a full week of "today"s ──────────────────────────────────
 *
 * 31 days plus up to six leading blanks is five rows or six, and which one it is depends only on
 * the weekday the window STARTS on. 30 ≡ 2 (mod 7), so the start is two weekdays behind today:
 * a Monday today starts on a Saturday (lead 5 → six rows), a Tuesday on a Sunday (lead 6 → six
 * rows), and the other five weekdays give five. Two in seven, which is why reserving a flat six
 * would over-reserve 172 px on five days out of seven. 2026-09-07 is a Monday.
 */
test('Monday today → six week rows', () => historyWeekRows('2026-09-07'), 6);
test('Tuesday today → six week rows', () => historyWeekRows('2026-09-08'), 6);
test('Wednesday today → five week rows', () => historyWeekRows('2026-09-09'), 5);
test('Thursday today → five week rows', () => historyWeekRows('2026-09-10'), 5);
test('Friday today → five week rows', () => historyWeekRows('2026-09-11'), 5);
test('Saturday today → five week rows', () => historyWeekRows('2026-09-12'), 5);
test('Sunday today → five week rows', () => historyWeekRows('2026-09-13'), 5);

/* ── Arithmetic that a local `new Date` would get wrong ────────────────────────
 *
 * The window crosses a month, a year and a leap day without any of the three meaning anything to
 * it — it is 31 days back from a date, not a calendar unit. These exist because the park calendar's
 * twin had a real bug in exactly this shape: a local `new Date(y, m, 1)` in a zone whose DST jump
 * lands at midnight resolves to the previous day and silently drops a row.
 */
test('window crossing new year keeps the weekday rule', () => historyWeekRows('2027-01-04'), 6);
test('window crossing a leap day keeps the weekday rule', () => historyWeekRows('2028-03-01'), 5);
test('DST spring-forward Sunday is still a Sunday', () => historyWeekRows('2026-03-29'), 5);

/* ── The reservation the placeholder actually reads ────────────────────────── */

test('list height is constant — the window never changes length', () => {
  const monday = historyGridReservation('2026-09-07').base;
  const friday = historyGridReservation('2026-09-11').base;
  return monday === friday ? monday : `${monday} !== ${friday}`;
}, 2024);
test('six-row month reserves one row more than a five-row one', () => {
  return historyGridReservation('2026-09-07').lg - historyGridReservation('2026-09-09').lg;
}, 172);
/**
 * The two heights below are what the rendered grid measures, not what the class list declares.
 * A row is a tile and the gaps sit BETWEEN rows: 16 × 119 + 15 × 8 below `lg`, and five 164 px
 * week rows plus four gaps under the 28 px weekday header from `lg` up — 880 px against the grid
 * that measures 880. The numbers they replaced (2016 / 888) counted one gap per row, i.e. one gap
 * that is never drawn, and took the mobile tile for its 118 px `min-h` floor when a day with a
 * curve in it renders 119.
 */
test('five week rows over the weekday header', () => historyGridReservation('2026-09-09').lg, 880);
test('six week rows over the weekday header', () => historyGridReservation('2026-09-07').lg, 1052);

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
