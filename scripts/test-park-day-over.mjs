/**
 * Unit tests for `isParkDayOver` (`lib/utils/park-day-over.ts`), the question `ParkTodayPanel`
 * asks with the server's clock before it folds the headliner and show columns into one line each
 * on a phone.
 *
 * The cases that matter are the edges of "today": the date is the PARK's, not UTC's (Tokyo at
 * 23:00 local is still 14:00 UTC), a day with two operating windows ends at the later one, and a
 * schedule that does not cover today answers `null`, so the panel keeps its rows.
 *
 * Run: pnpm test:park-day-over
 */

import { isParkDayOver } from '../lib/utils/park-day-over.ts';

const testCases = [];
const test = (name, actual, expected) => testCases.push({ name, actual, expected });

const day = (date, scheduleType, openingTime = null, closingTime = null) => ({
  date,
  scheduleType,
  openingTime,
  closingTime,
  description: null,
  purchases: null,
  holidayName: null,
});

const BERLIN = 'Europe/Berlin';
const phl = [
  day('2026-09-23', 'OPERATING', '2026-09-23T09:00:00+02:00', '2026-09-23T18:00:00+02:00'),
  day('2026-09-24', 'OPERATING', '2026-09-24T09:00:00+02:00', '2026-09-24T18:00:00+02:00'),
];
const at = (iso) => new Date(iso).getTime();

test(
  'before opening: not over',
  isParkDayOver(phl, BERLIN, at('2026-09-23T08:30:00+02:00')),
  false
);
test('open: not over', isParkDayOver(phl, BERLIN, at('2026-09-23T15:00:00+02:00')), false);
test('at closing time: over', isParkDayOver(phl, BERLIN, at('2026-09-23T18:00:00+02:00')), true);
test('evening: over', isParkDayOver(phl, BERLIN, at('2026-09-23T22:00:00+02:00')), true);
test(
  'just after local midnight is the next day, and that one has not started',
  isParkDayOver(phl, BERLIN, at('2026-09-24T00:30:00+02:00')),
  false
);

const closedToday = [day('2026-09-23', 'CLOSED'), phl[1]];
test(
  'closed today: over',
  isParkDayOver(closedToday, BERLIN, at('2026-09-23T12:00:00+02:00')),
  true
);

const split = [
  day('2026-09-23', 'OPERATING', '2026-09-23T09:00:00+02:00', '2026-09-23T18:00:00+02:00'),
  day('2026-09-23', 'EXTRA_HOURS', '2026-09-23T18:00:00+02:00', '2026-09-23T22:00:00+02:00'),
  day('2026-09-23', 'OPERATING', '2026-09-23T19:00:00+02:00', '2026-09-23T23:00:00+02:00'),
];
test(
  'two operating windows: not over between them',
  isParkDayOver(split, BERLIN, at('2026-09-23T18:30:00+02:00')),
  false
);
test(
  'two operating windows: over after the later one',
  isParkDayOver(split, BERLIN, at('2026-09-23T23:00:00+02:00')),
  true
);

// Tokyo, 22:23 local on 2026-09-23 is 13:23 UTC, which is still the 23rd in UTC too — so the
// timezone case is the one where the two dates differ: 08:00 local on the 24th is 23:00 UTC on
// the 23rd.
const tdl = [
  day('2026-09-23', 'OPERATING', '2026-09-23T09:00:00+09:00', '2026-09-23T21:00:00+09:00'),
  day('2026-09-24', 'OPERATING', '2026-09-24T09:00:00+09:00', '2026-09-24T21:00:00+09:00'),
];
test(
  'park timezone decides today: Tokyo 08:00 on the 24th (UTC still the 23rd) is before opening',
  isParkDayOver(tdl, 'Asia/Tokyo', at('2026-09-24T08:00:00+09:00')),
  false
);
test('Tokyo 22:23: over', isParkDayOver(tdl, 'Asia/Tokyo', at('2026-09-23T22:23:00+09:00')), true);

test('no schedule: unknown', isParkDayOver([], BERLIN, at('2026-09-23T12:00:00+02:00')), null);
test('undefined schedule: unknown', isParkDayOver(undefined, BERLIN, 0), null);
test(
  'schedule without today (snapshot too old): unknown',
  isParkDayOver([phl[1]], BERLIN, at('2026-09-23T12:00:00+02:00')),
  null
);
test(
  'operating without a closing time: unknown',
  isParkDayOver(
    [day('2026-09-23', 'OPERATING', '2026-09-23T09:00:00+02:00', null)],
    BERLIN,
    at('2026-09-23T20:00:00+02:00')
  ),
  null
);

let passed = 0;
let failed = 0;
for (const testCase of testCases) {
  if (testCase.actual === testCase.expected) {
    passed++;
  } else {
    console.log(`❌ FAIL: ${testCase.name}`);
    console.log(`   Expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`   Got:      ${JSON.stringify(testCase.actual)}`);
    failed++;
  }
}

console.log(`\n📊 Results: ${passed}/${testCases.length} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
