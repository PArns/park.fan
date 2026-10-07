/**
 * Unit tests for the park page's late ride openings and early entry (`lib/parks/ride-openings.ts`).
 *
 * Three refusals keep the line „öffnet ca. HH:mm" honest, and each has a case:
 *
 * * a ride without `opensAt` is absent from the map, never „opens with the park",
 * * a ride that starts with the park (its `opensAt` equals the gates) is not a late starter,
 * * without the park's opening, nothing is guessed from `context.openHour`.
 *
 * Run: pnpm test:ride-openings
 */

import {
  isOpeningAhead,
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
