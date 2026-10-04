/**
 * Unit tests for `quietestOpenDay` (`lib/utils/quietest-day.ts`), the pick behind the line under
 * each favorite park on /favorites: the open day with the lowest forecast crowd level in the next
 * 14 days. The cases are the four ways that pick can go wrong: a closed day counted as quiet, a
 * day outside the window winning, a tie resolved to the later day, an unrated day beating a rated
 * one.
 *
 * Run: pnpm test:quietest-day
 */

import { quietestOpenDay, QUIETEST_DAY_WINDOW_DAYS } from '../lib/utils/quietest-day.ts';

const testCases = [];
const test = (name, actual, expected) => testCases.push({ name, actual, expected });

const day = (date, level, status = 'OPERATING') => ({ date, status, predictedCrowdLevel: level });
const show = (r) => (r ? `${r.date}@${r.level}` : 'none');

test(
  'the lowest level wins',
  () =>
    show(
      quietestOpenDay(
        [day('2026-10-04', 'high'), day('2026-10-05', 'low'), day('2026-10-06', 'moderate')],
        '2026-10-04'
      )
    ),
  '2026-10-05@low'
);

test(
  'a tie goes to the earlier day, whatever the order of the input',
  () =>
    show(
      quietestOpenDay(
        [day('2026-10-09', 'low'), day('2026-10-06', 'low'), day('2026-10-07', 'high')],
        '2026-10-04'
      )
    ),
  '2026-10-06@low'
);

test(
  'a closed day is not quiet, even with a very_low prediction',
  () =>
    show(
      quietestOpenDay(
        [day('2026-10-05', 'very_low', 'CLOSED'), day('2026-10-06', 'high')],
        '2026-10-04'
      )
    ),
  '2026-10-06@high'
);

test(
  'an unknown status is not an open day',
  () => show(quietestOpenDay([day('2026-10-05', 'very_low', 'UNKNOWN')], '2026-10-04')),
  'none'
);

test(
  'unknown and missing predictions are skipped, not ranked',
  () =>
    show(
      quietestOpenDay(
        [day('2026-10-05', 'unknown'), day('2026-10-06', undefined), day('2026-10-07', 'extreme')],
        '2026-10-04'
      )
    ),
  '2026-10-07@extreme'
);

test(
  'today counts',
  () => show(quietestOpenDay([day('2026-10-04', 'low'), day('2026-10-05', 'high')], '2026-10-04')),
  '2026-10-04@low'
);

test(
  'a past day does not count',
  () =>
    show(quietestOpenDay([day('2026-10-03', 'very_low'), day('2026-10-05', 'high')], '2026-10-04')),
  '2026-10-05@high'
);

test('the window is 14 days', () => QUIETEST_DAY_WINDOW_DAYS, 14);

test(
  'day 14 (today + 13) is in, day 15 is out',
  () =>
    [
      show(
        quietestOpenDay([day('2026-10-17', 'low'), day('2026-10-18', 'very_low')], '2026-10-04')
      ),
      show(quietestOpenDay([day('2026-10-18', 'very_low')], '2026-10-04')),
    ].join(' | '),
  '2026-10-17@low | none'
);

test(
  'the window crosses a month and a year end',
  () =>
    show(quietestOpenDay([day('2027-01-06', 'low'), day('2027-01-07', 'very_low')], '2026-12-24')),
  '2027-01-06@low'
);

test('an empty list names nothing', () => show(quietestOpenDay([], '2026-10-04')), 'none');

let failed = 0;
for (const { name, actual, expected } of testCases) {
  const got = actual();
  if (got === expected) {
    console.log(`ok   ${name}`);
  } else {
    failed++;
    console.log(
      `FAIL ${name}\n     expected ${JSON.stringify(expected)}\n     got      ${JSON.stringify(got)}`
    );
  }
}
console.log(`${testCases.length - failed}/${testCases.length} passed`);
if (failed > 0) process.exit(1);
