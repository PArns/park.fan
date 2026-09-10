/**
 * Unit tests for the ride's quietest weekday (`lib/utils/typical-waits.ts`).
 *
 * The function exists because a ride page's „Beste Besuchszeit planen" chapter has to answer
 * its own heading even where the rope-drop recommendation is a no, and the weekday is the only
 * reading in that data that says something: measured over the 183 rides the panel is drawn for,
 * 71 name one quiet day, 51 name two, and 61 have a flat week.
 *
 * Three refusals and one drop are what separate a finding from noise, and each of them fires on
 * a real ride, so each has a case here:
 *
 * * a thin weekday drops out rather than ending the vote,
 * * a tie is TWO quiet days, not none,
 * * three or more days at the minimum is a flat week,
 * * a minimum level with the median names nothing.
 *
 * The rounding case is the one that would go unnoticed: the panel prints minutes that the bars
 * next to it print too, so the vote has to run on the rounded values or the two disagree.
 *
 * Run: pnpm test:typical-waits
 */

import { quietestWeekdays } from '../lib/utils/typical-waits.ts';
import { roundWaitTo5 } from '../lib/utils/wait-time.ts';

const testCases = [];
const test = (name, actual, expected) => testCases.push({ name, actual, expected });

/** `byDayOfWeek` from a `{ dayOfWeek: [typical, sampleDays] }` sketch. Sun=0 … Sat=6. */
const days = (spec) =>
  Object.entries(spec).map(([dow, [typical, sampleDays = 20]]) => ({
    dayOfWeek: Number(dow),
    isWeekend: Number(dow) === 0 || Number(dow) === 6,
    typical,
    busy: typical == null ? null : typical + 20,
    sampleDays,
  }));

const show = (result) => (result === null ? 'null' : `${result.days.join(',')}@${result.typical}`);

// --- the plain answer ------------------------------------------------------------------------

test(
  'one clearly quietest day is named',
  () =>
    show(quietestWeekdays(days({ 1: [30], 2: [40], 3: [45], 4: [45], 5: [50], 6: [60], 0: [60] }))),
  '1@30'
);

test(
  'a tie at the minimum names BOTH days rather than refusing',
  () =>
    show(quietestWeekdays(days({ 1: [30], 2: [30], 3: [45], 4: [50], 5: [50], 6: [60], 0: [60] }))),
  '1,2@30'
);

// --- the refusals ----------------------------------------------------------------------------

test(
  'three days at the minimum is a flat week, not a quiet day',
  () =>
    show(quietestWeekdays(days({ 1: [30], 2: [30], 3: [30], 4: [50], 5: [50], 6: [60], 0: [60] }))),
  'null'
);

test(
  'a minimum that is not below the median names nothing',
  () =>
    show(quietestWeekdays(days({ 1: [40], 2: [40], 3: [40], 4: [40], 5: [40], 6: [40], 0: [40] }))),
  'null'
);

test(
  'fewer than four measured days: no verdict',
  () => show(quietestWeekdays(days({ 1: [30], 5: [50], 6: [60] }))),
  'null'
);

test(
  'an unmeasured day (typical null) does not count towards the four',
  () => show(quietestWeekdays(days({ 1: [30], 2: [null], 3: [null], 5: [50], 6: [60] }))),
  'null'
);

test('no data at all', () => show(quietestWeekdays(undefined)), 'null');
test('empty week', () => show(quietestWeekdays([])), 'null');

// --- the thin day ----------------------------------------------------------------------------

test(
  'a thin day drops out and the remaining five still answer',
  () =>
    show(
      // Monday is the lowest but is measured 6 times against a median of 22 — it drops, and
      // Tuesday wins on the days that are comparable.
      quietestWeekdays(
        days({
          1: [20, 6],
          2: [35, 22],
          3: [45, 22],
          4: [45, 21],
          5: [50, 23],
          6: [60, 22],
          0: [60, 20],
        })
      )
    ),
  '2@35'
);

test(
  'a thin day is dropped, not trusted: it never wins',
  () =>
    show(
      quietestWeekdays(
        days({
          1: [10, 4],
          2: [30, 20],
          3: [30, 20],
          4: [45, 20],
          5: [50, 20],
          6: [60, 20],
          0: [60, 20],
        })
      )
    ),
  '2,3@30'
);

test(
  'dropping thin days below four comparable ones ends the vote',
  () =>
    // Five measured days, two of them thin against a median of 20 — three comparable ones left.
    show(quietestWeekdays(days({ 1: [20, 2], 2: [30, 3], 3: [45, 20], 4: [50, 22], 5: [55, 20] }))),
  'null'
);

test(
  'exactly at the half-median share the day still counts',
  () =>
    show(
      quietestWeekdays(
        days({
          1: [20, 10],
          2: [35, 20],
          3: [45, 20],
          4: [45, 20],
          5: [50, 20],
          6: [60, 20],
          0: [60, 20],
        })
      )
    ),
  '1@20'
);

// --- rounding --------------------------------------------------------------------------------

test(
  'the vote runs on the rounded values, so the named minutes are the drawn minutes',
  () =>
    show(
      quietestWeekdays(
        days({ 1: [26], 2: [27], 3: [45], 4: [46], 5: [50], 6: [60], 0: [60] }),
        roundWaitTo5
      )
    ),
  // 26 and 27 both round to 25 — one bar height, one label, and therefore two quiet days.
  '1,2@25'
);

test(
  'without rounding the same week names one day at a wait no bar shows',
  () =>
    show(quietestWeekdays(days({ 1: [26], 2: [27], 3: [45], 4: [46], 5: [50], 6: [60], 0: [60] }))),
  '1@26'
);

// ----------------------------------------------------------------------------------------------

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
