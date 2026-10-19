/**
 * Unit tests for the park page's late ride openings and early entry (`lib/parks/ride-openings.ts`).
 *
 * Three refusals keep the line „öffnet ca. HH:mm" honest, and each has a case:
 *
 * * a ride without `opensAt` is absent from the map, never „opens with the park",
 * * a ride that starts with the park (its `opensAt` equals the gates) is not a late starter,
 * * without the park's opening, nothing is guessed from `context.openHour`.
 *
 * A ride off its weekday pattern („Heute nicht im Programm") is its own map, and only where the
 * API sent a pattern: an older answer, an empty one or a park shut today changes nothing.
 *
 * Run: pnpm test:ride-openings
 */

import {
  formatRunWeekdays,
  isOffWeekday,
  isOpeningAhead,
  isoWeekdayOf,
  offTodayWeekdays,
  parkOpeningsFromPlan,
  parkOpenMinute,
} from '../lib/parks/ride-openings.ts';

const testCases = [];
const test = (name, actual, expected) => testCases.push({ name, actual, expected });

const ride = (attractionSlug, opensAt, opensAtConfidence) => ({
  attractionSlug,
  attractionName: attractionSlug,
  hours: [],
  dayPeak: 0,
  sampleDays: 0,
  ...(opensAt ? { opensAt, opensAtConfidence } : {}),
});
const plan = (rides, context = {}) => ({
  parkSlug: 'phantasialand',
  timezone: 'Europe/Berlin',
  context: { openHour: 9, closeHour: 18, ...context },
  tier: 'measured',
  leadDays: 0,
  rides,
});
const OPEN_0900 = 9 * 60;
const show = (value) => JSON.stringify(value);
const ridesOf = (p, open) => show([...parkOpeningsFromPlan(p, open).rides]);

test(
  'a ride after the gates is a late starter, firm on `high`',
  () => ridesOf(plan([ride('taron', '10:00', 'high')]), OPEN_0900),
  show([['taron', { time: '10:00', minute: 600, firm: true }]])
);
test(
  'medium and low are printed as approximate',
  () => ridesOf(plan([ride('a', '10:15', 'medium'), ride('b', '10:15', 'low')]), OPEN_0900),
  show([
    ['a', { time: '10:15', minute: 615, firm: false }],
    ['b', { time: '10:15', minute: 615, firm: false }],
  ])
);
test(
  'a ride without `opensAt` is absent, not „with the park"',
  () => ridesOf(plan([ride('fly')]), OPEN_0900),
  '[]'
);
test(
  'a ride that starts with the park is not a late starter',
  () => ridesOf(plan([ride('fly', '09:00', 'high')]), OPEN_0900),
  '[]'
);
test(
  'an unreadable `opensAt` is absent',
  () => ridesOf(plan([ride('fly', '9 Uhr', 'high')]), OPEN_0900),
  '[]'
);
test(
  'without the park opening nothing is guessed from `openHour`',
  () => ridesOf(plan([ride('taron', '10:00', 'high')]), null),
  '[]'
);
test(
  'early entry with a value carries the minutes',
  () =>
    show(
      parkOpeningsFromPlan(plan([], { hasEarlyEntry: true, earlyEntryMinutesPeak: 30 }), null)
        .earlyEntry
    ),
  show({ minutes: 30 })
);
test(
  'early entry without a value says nothing about how early',
  () => show(parkOpeningsFromPlan(plan([], { hasEarlyEntry: true }), null).earlyEntry),
  show({ minutes: null })
);
test(
  'no `hasEarlyEntry` is no early entry, whatever the minutes',
  () => show(parkOpeningsFromPlan(plan([], { earlyEntryMinutesPeak: 30 }), null).earlyEntry),
  'null'
);
test(
  'no plan is an empty answer',
  () => show(parkOpeningsFromPlan(null, OPEN_0900).earlyEntry),
  'null'
);

// 2026-10-19 is a Monday, 2026-10-23 a Friday.
const maze = (slug, runsOnWeekdays, opensAt) => ({
  ...ride(slug, opensAt, opensAt ? 'low' : undefined),
  ...(runsOnWeekdays ? { runsOnWeekdays } : {}),
});
const OPEN_1000 = 10 * 60;
const offOf = (p, open, today) => show([...parkOpeningsFromPlan(p, open, today).offToday]);
test(
  'a Fri–Sun maze is off on a Monday, and its later opening is dropped',
  () => {
    const result = parkOpeningsFromPlan(
      plan([maze('jason', [5, 6, 7], '17:00')]),
      OPEN_1000,
      '2026-10-19'
    );
    return show([[...result.offToday], [...result.rides]]);
  },
  show([[['jason', [5, 6, 7]]], []])
);
test(
  'the same maze on a Friday keeps its later opening',
  () => {
    const result = parkOpeningsFromPlan(
      plan([maze('jason', [5, 6, 7], '17:00')]),
      OPEN_1000,
      '2026-10-23'
    );
    return show([[...result.offToday], [...result.rides].map(([slug]) => slug)]);
  },
  show([[], ['jason']])
);
test(
  'without `runsOnWeekdays` (an older answer) nothing is off',
  () => offOf(plan([maze('taron', undefined, '17:00')]), OPEN_1000, '2026-10-19'),
  '[]'
);
test(
  'an empty pattern claims nothing',
  () => offOf(plan([maze('taron', [], undefined)]), OPEN_1000, '2026-10-19'),
  '[]'
);
test(
  'in a park closed today no ride is „not on the programme"',
  () => offOf(plan([maze('jason', [5, 6, 7])]), null, '2026-10-19'),
  '[]'
);
test(
  'without today nothing is off',
  () => offOf(plan([maze('jason', [5, 6, 7])]), OPEN_1000),
  '[]'
);

test('Monday is ISO 1', () => isoWeekdayOf('2026-10-19'), 1);
test('Sunday is ISO 7', () => isoWeekdayOf('2026-10-25'), 7);
test('an unreadable date has no weekday', () => isoWeekdayOf('heute'), null);

test('three in a row are a span', () => formatRunWeekdays([5, 6, 7], 'de'), 'Fr–So');
test('two in a row stay apart', () => formatRunWeekdays([6, 7], 'de'), 'Sa, So');
test(
  'a single day and a span, in week order',
  () => formatRunWeekdays([7, 3, 5, 6], 'de'),
  'Mi, Fr–So'
);
test('a run over the weekend is kept whole', () => formatRunWeekdays([6, 7, 1], 'de'), 'Sa–Mo');
test('English', () => formatRunWeekdays([5, 6, 7], 'en'), 'Fri–Sun');
test('the French full stop is dropped', () => formatRunWeekdays([5, 6, 7], 'fr'), 'ven–dim');
test('all seven days say nothing', () => formatRunWeekdays([1, 2, 3, 4, 5, 6, 7], 'de'), null);
test('no day says nothing', () => formatRunWeekdays([], 'de'), null);
test('out-of-range values are ignored', () => formatRunWeekdays([0, 6, 7, 8], 'de'), 'Sa, So');

const offMonday = parkOpeningsFromPlan(
  plan([maze('star-trek', [4, 5, 6, 7]), maze('jason', [5, 6, 7])]),
  OPEN_1000,
  '2026-10-19'
).offToday;
const lastRun = { lastRunAt: '2026-10-18T19:00:00Z' };
test(
  'a ride that already ran today never gets the line, whatever its pattern',
  () => offTodayWeekdays(offMonday, 'star-trek', null),
  null
);
test(
  'a maze that has not run today gets its weekdays',
  () => show(offTodayWeekdays(offMonday, 'jason', lastRun)),
  show([5, 6, 7])
);
test(
  'a ride on its own weekday is not off, run or not',
  () => offTodayWeekdays(offMonday, 'taron', lastRun),
  null
);

test('a weekday outside the pattern is off', () => isOffWeekday([5, 6, 7], 1), true);
test('a weekday inside the pattern is not', () => isOffWeekday([5, 6, 7], 6), false);
test('no pattern is never off', () => isOffWeekday(undefined, 1), false);

const opening = { time: '10:00', minute: 600, firm: true };
test('the line holds before the opening minute', () => isOpeningAhead(opening, 599), true);
test('the line is gone at the opening minute', () => isOpeningAhead(opening, 600), false);

const schedule = [
  { date: '2026-10-07', scheduleType: 'OPERATING', openingTime: '2026-10-07T07:00:00.000Z' },
  { date: '2026-10-08', scheduleType: 'CLOSED', openingTime: null },
];
test(
  'the park opens at 09:00 Berlin for 07:00Z in October',
  () => parkOpenMinute(schedule, '2026-10-07', 'Europe/Berlin'),
  540
);
test(
  'a closed day has no opening',
  () => parkOpenMinute(schedule, '2026-10-08', 'Europe/Berlin'),
  null
);
test(
  'no entry for the day has no opening',
  () => parkOpenMinute(schedule, '2026-10-09', 'Europe/Berlin'),
  null
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
    passed++;
  } else {
    console.log(`❌ FAIL: ${testCase.name}`);
    console.log(`   Expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`   Got:      ${JSON.stringify(result)}`);
    failed++;
  }
}

console.log(`\n📊 Results: ${passed}/${testCases.length} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
