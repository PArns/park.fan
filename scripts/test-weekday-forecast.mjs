/**
 * Unit tests for the park header's weekday panel (`lib/parks/weekday-forecast.ts`).
 *
 * Run: `pnpm test:weekday-forecast`
 *
 * The days are the `/best-days` snapshot's shape as Phantasialand answered on 2026-10-23: `status`,
 * `crowdLevel`, `predictedCrowdLevel` and the three holiday flags, nothing else.
 */
import assert from 'node:assert/strict';
import { upcomingWeekdayForecast } from '../lib/parks/weekday-forecast.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const day = (date, overrides = {}) => ({
  date,
  status: 'OPERATING',
  crowdLevel: 'low',
  predictedCrowdLevel: 'low',
  isHoliday: false,
  isSchoolVacation: false,
  isBridgeDay: false,
  ...overrides,
});

// 2026-10-22 is a Thursday; the Saturdays are the 24th, the 31st and 7 November.
const snapshot = [
  day('2026-10-22'),
  day('2026-10-24', { isSchoolVacation: true }),
  day('2026-10-25'),
  day('2026-10-31', { predictedCrowdLevel: 'high', crowdLevel: 'high' }),
  day('2026-11-07', { status: 'CLOSED', crowdLevel: 'closed', predictedCrowdLevel: undefined }),
];

console.log('upcomingWeekdayForecast');

test('lists the coming dates of one weekday, in order', () => {
  const saturdays = upcomingWeekdayForecast([...snapshot].reverse(), 6, '2026-10-23');
  assert.deepEqual(
    saturdays.map((d) => d.date),
    ['2026-10-24', '2026-10-31', '2026-11-07']
  );
});

test('starts at the park’s today, not at the first entry of a day-old snapshot', () => {
  assert.deepEqual(
    upcomingWeekdayForecast(snapshot, 4, '2026-10-23').map((d) => d.date),
    [],
    'the Thursday in the snapshot is yesterday'
  );
});

test('stops at the limit', () => {
  assert.equal(upcomingWeekdayForecast(snapshot, 6, '2026-10-23', 2).length, 2);
});

test('draws a day the way the outlook does', () => {
  const [school, busy, closed] = upcomingWeekdayForecast(snapshot, 6, '2026-10-23');
  assert.deepEqual(school, {
    date: '2026-10-24',
    day: { level: 'low' },
    holiday: { isSchoolVacation: true },
  });
  assert.deepEqual(busy.day, { level: 'high' });
  assert.equal(busy.holiday, null);
  assert.deepEqual(closed.day, { level: 'closed' }, 'a CLOSED status wins over any level');
});

test('a day without a ratable level says so instead of borrowing one', () => {
  const [unknown] = upcomingWeekdayForecast(
    [
      day('2026-10-24', {
        status: 'UNKNOWN',
        crowdLevel: 'unknown',
        predictedCrowdLevel: undefined,
      }),
    ],
    6,
    '2026-10-23'
  );
  assert.deepEqual(unknown.day, { level: 'unknown' });
});

console.log(`\n${passed} tests passed`);
