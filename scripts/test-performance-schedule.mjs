/**
 * Performance schedules (PAR-1355): which schedule holds on a park day
 * (`lib/utils/performance-schedule.ts`), when a ride shows its next start in place of the wait,
 * the next start against the park's clock, and the admin editor's checks that mirror the API's
 * 400s (`app/admin/_lib/performance-schedules.ts`).
 *
 * Run: `pnpm test:performance-schedule`
 */
import assert from 'node:assert/strict';
import {
  formatPerformanceTime,
  nextPerformance,
  performanceTimesOn,
  performanceTimesShown,
} from '@/lib/utils/performance-schedule.ts';
import {
  performanceSchedulesError,
  performanceSchedulesForSave,
} from '../app/admin/_lib/performance-schedules.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const HOURLY = ['13:00', '14:00', '15:00', '16:00', '17:00'];
const winter = { from: '2026-11-14', to: '2027-01-24', times: HOURLY };
const summer = { from: '2026-04-01', to: '2026-10-31', times: ['11:00'] };

test('the schedule whose days hold the park day gives its times', () => {
  assert.deepEqual(performanceTimesOn([summer, winter], '2026-11-14'), HOURLY);
  assert.deepEqual(performanceTimesOn([summer, winter], '2027-01-24'), HOURLY);
  assert.deepEqual(performanceTimesOn([summer, winter], '2026-07-01'), ['11:00']);
});

test('a day no schedule holds, and an unknown day, give null', () => {
  assert.equal(performanceTimesOn([summer, winter], '2026-11-05'), null);
  assert.equal(performanceTimesOn([summer, winter], '2027-01-25'), null);
  assert.equal(performanceTimesOn([winter], undefined), null);
  assert.equal(performanceTimesOn(undefined, '2026-11-15'), null);
});

test('a schedule without dates holds every day', () => {
  assert.deepEqual(performanceTimesOn([{ from: null, to: null, times: ['10:00'] }], '2030-02-28'), [
    '10:00',
  ]);
});

const gate = (overrides) => ({
  schedules: [winter],
  worksPeriods: [],
  status: 'CLOSED',
  parkStatus: 'OPERATING',
  day: '2026-11-15',
  ...overrides,
});

test('a CLOSED from the feed in an open park shows the times', () => {
  assert.deepEqual(performanceTimesShown(gate({})), HOURLY);
  assert.deepEqual(performanceTimesShown(gate({ status: 'OPERATING' })), HOURLY);
  assert.deepEqual(performanceTimesShown(gate({ status: 'UNKNOWN' })), HOURLY);
});

test('a closed park, a breakdown, works and a retired ride keep their own rendering', () => {
  assert.equal(performanceTimesShown(gate({ parkStatus: 'CLOSED' })), null);
  assert.equal(performanceTimesShown(gate({ parkStatus: undefined })), null);
  assert.equal(performanceTimesShown(gate({ status: 'DOWN' })), null);
  assert.equal(performanceTimesShown(gate({ status: 'REFURBISHMENT' })), null);
  assert.equal(performanceTimesShown(gate({ status: 'RETIRED' })), null);
  assert.equal(
    performanceTimesShown(
      gate({ worksPeriods: [{ from: '2026-11-10', to: '2026-11-20', toUncertain: false }] })
    ),
    null
  );
});

test('the next start is the first at or after the park minute', () => {
  assert.deepEqual(nextPerformance(HOURLY, '11:05'), { time: '13:00', minutesUntil: 115 });
  assert.deepEqual(nextPerformance(HOURLY, '13:37'), { time: '14:00', minutesUntil: 23 });
  assert.deepEqual(nextPerformance(HOURLY, '14:00'), { time: '14:00', minutesUntil: 0 });
});

test('once the last one has begun, none is left', () => {
  assert.equal(nextPerformance(HOURLY, '17:01'), null);
  assert.equal(nextPerformance(HOURLY, '19:30'), null);
});

test('a start time is written as the locale writes clock times', () => {
  assert.equal(formatPerformanceTime('13:00', 'de'), '13:00');
  assert.equal(formatPerformanceTime('13:00', 'en'), '1 PM');
  assert.equal(formatPerformanceTime('09:30', 'en'), '9:30 AM');
});

test('the editor accepts what the API accepts', () => {
  assert.equal(performanceSchedulesError([]), null);
  assert.equal(performanceSchedulesError([winter, summer]), null);
  // A trailing comma in the input leaves a blank entry, which is no time.
  assert.equal(
    performanceSchedulesError([{ from: null, to: null, times: ['13:00', ' 14:00', ' '] }]),
    null
  );
});

test('the editor refuses what the API refuses', () => {
  const row = (times, from = null, to = null) => ({ from, to, times });
  assert.match(performanceSchedulesError([row([])]), /mindestens eine Startzeit/);
  assert.match(performanceSchedulesError([row(['13 Uhr'])]), /„13 Uhr" ist keine Uhrzeit/);
  assert.match(performanceSchedulesError([row(['24:00'])]), /„24:00" ist keine Uhrzeit/);
  assert.match(
    performanceSchedulesError([row(['13:00'], '2027-01-24', '2026-11-14')]),
    /„ab" liegt nach „bis"/
  );
  assert.match(performanceSchedulesError([winter, row(['10:00'])]), /überschneiden sich/);
  assert.match(performanceSchedulesError([winter], { maxTimes: 4 }), /höchstens 4 Startzeiten/);
  assert.match(performanceSchedulesError([winter, summer], { max: 1 }), /Höchstens 1 Zeiträume/);
});

test('a save sends the schedules in the stored order with clean times', () => {
  assert.deepEqual(
    performanceSchedulesForSave([{ ...winter, times: ['14:00', ' 13:00', '', '14:00'] }, summer]),
    [summer, { ...winter, times: ['13:00', '14:00'] }]
  );
});

console.log(`\n${passed} passed`);
