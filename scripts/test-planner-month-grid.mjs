/**
 * Unit tests for the planner's month grid (`lib/planner/month-grid.ts`).
 *
 * Date maths, so the interesting cases are the ones a hand-check never reaches:
 * a month that starts on a Sunday (the longest lead in a Monday-first grid), a
 * leap February, the 31st plus one month, and a year boundary in both
 * directions.
 *
 * The zone tests are the reason this file exists at all. A plan's dates are
 * park-local STRINGS and the reader's offset must never touch them — a grid
 * built on `new Date('2026-09-01')` is a grid built on midnight UTC, which is
 * the 31st of August in every zone west of Greenwich.
 *
 * Run: pnpm test:planner-month-grid
 */

import {
  daysInMonth,
  firstOfMonth,
  monthLabel,
  monthMatrix,
  monthOf,
  shiftMonth,
  weekdayLabels,
} from '../lib/planner/month-grid.ts';

const cases = [];
const test = (name, actual, expected) => cases.push({ name, actual, expected });

/** Runs `fn` with the process pretending to be somewhere else. */
function inZone(tz, fn) {
  const saved = process.env.TZ;
  process.env.TZ = tz;
  try {
    return fn();
  } finally {
    if (saved === undefined) delete process.env.TZ;
    else process.env.TZ = saved;
  }
}

// ── 1. Shape ────────────────────────────────────────────────────────────────
// September 2026 starts on a Tuesday, so one leading day and thirty in the
// month: 31 cells rounded up to five whole weeks.
{
  const cells = monthMatrix('2026-09');
  test('whole weeks', cells.length % 7, 0);
  test('five weeks for September 2026', cells.length, 35);
  test('the first cell is the Monday before', cells[0].date, '2026-08-31');
  test('and it is not in the month', cells[0].inMonth, false);
  test('the second cell is the 1st', cells[1].date, '2026-09-01');
  test('which is in the month', cells[1].inMonth, true);
  test('the last cell is a real date', cells.at(-1).date, '2026-10-04');
  test('the padding carries its day number', cells.at(-1).day, 4);
  test('thirty days are in the month', cells.filter((c) => c.inMonth).length, 30);
}

// A month starting on a Sunday is the worst case for a Monday-first grid: six
// days of lead, and February 2026 (28 days) still fits in five rows.
{
  const cells = monthMatrix('2026-02');
  test('February 2026 leads with six days', cells.findIndex((c) => c.inMonth), 6);
  test('and still fits five weeks', cells.length, 35);
}
// March 2026 starts on a Sunday and has 31 days — six rows.
test('a 31-day month starting Sunday takes six rows', monthMatrix('2026-03').length, 42);

// ── 2. Month lengths ────────────────────────────────────────────────────────
test('February 2026', daysInMonth('2026-02'), 28);
test('February 2028 is a leap February', daysInMonth('2028-02'), 29);
test('February 2100 is not', daysInMonth('2100-02'), 28);
test('February 2000 is', daysInMonth('2000-02'), 29);
test('December', daysInMonth('2026-12'), 31);

// ── 3. Stepping months ──────────────────────────────────────────────────────
// Through integer arithmetic, never `setUTCMonth`: adding a month to the 31st
// there lands in March, which is how a "next month" button skips one.
test('one on', shiftMonth('2026-09', 1), '2026-10');
test('across the year', shiftMonth('2026-12', 1), '2027-01');
test('back across the year', shiftMonth('2026-01', -1), '2025-12');
test('a whole year', shiftMonth('2026-09', 12), '2027-09');
test('January onwards from the 31st', shiftMonth(monthOf('2026-01-31'), 1), '2026-02');
test('a nonsense month is returned untouched', shiftMonth('nope', 1), 'nope');

test('the month of a date', monthOf('2026-09-17'), '2026-09');
test('the first of a month', firstOfMonth('2026-09'), '2026-09-01');

// ── 4. The reader's zone changes nothing ────────────────────────────────────
// Noon UTC throughout. Both ends of the range, because the two failure modes
// point in opposite directions.
{
  const inSamoa = inZone('Pacific/Kiritimati', () => monthMatrix('2026-09')[1].date);
  const inHawaii = inZone('Pacific/Honolulu', () => monthMatrix('2026-09')[1].date);
  test('UTC+14 reads the 1st as the 1st', inSamoa, '2026-09-01');
  test('UTC-10 reads the 1st as the 1st', inHawaii, '2026-09-01');
}
{
  const west = inZone('Pacific/Honolulu', () => monthMatrix('2026-03').length);
  test('and the grid keeps its shape', west, 42);
}

// ── 5. Labels ───────────────────────────────────────────────────────────────
// Anchored on a real Monday, so the order cannot depend on the day the page is
// rendered — which is exactly the kind of bug that only shows up on a Sunday.
{
  const de = weekdayLabels('de-DE');
  test('seven headers', de.length, 7);
  test('the first column is Monday', de[0].startsWith('Mo'), true);
  test('the last is Sunday', de[6].startsWith('So'), true);
  test('English reads the same order', weekdayLabels('en-GB')[0], 'Mon');
}
test('a German month label', monthLabel('2026-09', 'de-DE'), 'September 2026');
test('an English one', monthLabel('2026-09', 'en-GB'), 'September 2026');
test('and one where the month name differs', monthLabel('2026-10', 'nl-NL'), 'oktober 2026');

// ── Report ───────────────────────────────────────────────────────────────────
let failed = 0;
for (const { name, actual, expected } of cases) {
  const ok = Object.is(actual, expected);
  if (!ok) failed++;
  console.log(
    `${ok ? '✅' : '❌'} ${name}${ok ? '' : ` — erwartet ${expected}, bekommen ${actual}`}`
  );
}
console.log(`\n${cases.length - failed}/${cases.length} bestanden`);
process.exit(failed === 0 ? 0 : 1);
