/**
 * Unit tests for the ride's quietest weekday (`lib/utils/typical-waits.ts`).
 *
 * The function exists because a ride page's „Beste Besuchszeit planen" chapter has to answer
 * its own heading even where the rope-drop recommendation is a no, and the weekday is the only
 * reading in that data that says something: measured over the 183 rides the panel is drawn for,
 * 70 name one quiet day, 49 name two, 61 have a flat week and 3 stay silent.
 *
 * Three refusals and one drop are what separate a finding from noise, and each of them fires on
 * a real ride, so each has a case here:
 *
 * * a thin weekday drops out rather than ending the vote (but never names a day the bars would
 *   contradict),
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

/**
 * A `TypicalWaits` block from a `{ dayOfWeek: [typical, sampleDays] }` sketch. Sun=0 … Sat=6.
 * `displayable` defaults to true — the API's own gate has its own cases below.
 */
const days = (spec, displayable = true) => ({
  displayable,
  byDayOfWeek: Object.entries(spec).map(([dow, [typical, sampleDays = 20]]) => ({
    dayOfWeek: Number(dow),
    isWeekend: Number(dow) === 0 || Number(dow) === 6,
    typical,
    busy: typical == null ? null : typical + 20,
    sampleDays,
  })),
});

const show = (r) => (r.verdict === 'days' ? `${r.days.join(',')}@${r.typical}` : r.verdict);

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
  'flat'
);

test(
  'a minimum that is not below the median names nothing',
  () =>
    show(quietestWeekdays(days({ 1: [40], 2: [40], 3: [40], 4: [40], 5: [40], 6: [40], 0: [40] }))),
  'flat'
);

test(
  'fewer than four measured days: no verdict',
  () => show(quietestWeekdays(days({ 1: [30], 5: [50], 6: [60] }))),
  'unknown'
);

test(
  'an unmeasured day (typical null) does not count towards the four',
  () => show(quietestWeekdays(days({ 1: [30], 2: [null], 3: [null], 5: [50], 6: [60] }))),
  'unknown'
);

test('no data at all', () => show(quietestWeekdays(undefined)), 'unknown');
test('empty week', () => show(quietestWeekdays(days({}))), 'unknown');

test(
  'a block the API declared not displayable names nothing, however clean the week looks',
  () =>
    show(
      quietestWeekdays(
        days({ 1: [30], 2: [40], 3: [45], 4: [45], 5: [50], 6: [60], 0: [60] }, false)
      )
    ),
  'unknown'
);

// --- the thin day ----------------------------------------------------------------------------

test(
  'a thin day drops out and the remaining six still answer',
  () =>
    show(
      // Monday is measured 6 times against a median of 22, so it drops — and with it the third
      // day sitting on the minimum, which would have made this a flat week. It ties AT the
      // minimum rather than sitting below it, so nothing the chart draws contradicts the answer.
      quietestWeekdays(
        days({
          1: [30, 6],
          2: [30, 22],
          3: [30, 22],
          4: [45, 21],
          5: [50, 23],
          6: [60, 22],
          0: [60, 20],
        })
      )
    ),
  '2,3@30'
);

test(
  'a thin day is dropped from the vote, never trusted to win it',
  () =>
    // Monday reads 10 on four operating days. It does not get to name the quietest day…
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
  // …and the card stays silent rather than pointing at Tuesday while Monday draws the shortest
  // bar right beside the sentence. 3 of the catalogue's 122 candidate rides land here.
  'unknown'
);

test(
  'a thin day sitting ABOVE the field does not silence anything',
  () =>
    // The mirror of the case above: Sunday is thin but high, so dropping it cannot make the
    // sentence point away from the shortest bar.
    show(
      quietestWeekdays(
        days({
          1: [30, 20],
          2: [40, 20],
          3: [45, 20],
          4: [45, 20],
          5: [50, 20],
          6: [60, 20],
          0: [90, 3],
        })
      )
    ),
  '1@30'
);

test(
  'dropping thin days below four comparable ones ends the vote',
  () =>
    // Five measured days, two of them thin against a median of 20 — three comparable ones left.
    show(quietestWeekdays(days({ 1: [20, 2], 2: [30, 3], 3: [45, 20], 4: [50, 22], 5: [55, 20] }))),
  'unknown'
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
