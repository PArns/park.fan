/**
 * Unit tests for `lib/utils/works-period.ts`: `isWorksPeriodActive`, the
 * predicate that decides whether the „Umbaupause" badge and the ride page's
 * note say anything at all, and the list helpers the ride card, the calendar
 * and the planner read windows through.
 *
 * It is the TypeScript twin of the backend's `isCuratedOutOfService()`, and the
 * cases below are the ones that make a twin worth having: inclusive bounds,
 * half-open windows, and a day that sits one step outside either end.
 *
 * Run: `pnpm test:works-period`
 */
import assert from 'node:assert/strict';
import {
  dayNumberElides,
  isWorksPeriodActive,
  nextWorksPeriod,
  ridesInWorksOn,
  worksEndLabel,
  worksPeriodOn,
  worksPeriodsOf,
  worksRunningLabel,
  worksUpcomingLabel,
  worksWindowLabel,
} from '../lib/utils/works-period.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const closed = (from, to) => ({ from, to, toUncertain: false });

test('a day inside a closed window is inside it', () => {
  assert.equal(isWorksPeriodActive(closed('2026-01-16', '2026-03-03'), '2026-02-01'), true);
});

test('both bounds are inclusive — the first and the last day still count', () => {
  const period = closed('2026-01-16', '2026-03-03');
  assert.equal(isWorksPeriodActive(period, '2026-01-16'), true);
  assert.equal(isWorksPeriodActive(period, '2026-03-03'), true);
});

test('the day before and the day after are outside', () => {
  const period = closed('2026-01-16', '2026-03-03');
  assert.equal(isWorksPeriodActive(period, '2026-01-15'), false);
  assert.equal(isWorksPeriodActive(period, '2026-03-04'), false);
});

test('a one-day window covers its one day and nothing else', () => {
  const period = closed('2026-03-03', '2026-03-03');
  assert.equal(isWorksPeriodActive(period, '2026-03-03'), true);
  assert.equal(isWorksPeriodActive(period, '2026-03-02'), false);
  assert.equal(isWorksPeriodActive(period, '2026-03-04'), false);
});

test('a window with no end runs on — the usual state while work is happening', () => {
  const period = closed('2026-01-16', null);
  assert.equal(isWorksPeriodActive(period, '2026-01-16'), true);
  assert.equal(isWorksPeriodActive(period, '2027-11-30'), true);
  assert.equal(isWorksPeriodActive(period, '2026-01-15'), false);
});

test('a window with no start was already running when somebody wrote it down', () => {
  const period = closed(null, '2026-03-03');
  assert.equal(isWorksPeriodActive(period, '2020-01-01'), true);
  assert.equal(isWorksPeriodActive(period, '2026-03-03'), true);
  assert.equal(isWorksPeriodActive(period, '2026-03-04'), false);
});

test('a window that ends before it begins covers nothing, rather than everything', () => {
  // The backend refuses to curate this pair, but it serves what is in the
  // columns — a row written before that guard existed still reaches a reader.
  const period = closed('2026-03-01', '2026-01-20');
  assert.equal(isWorksPeriodActive(period, '2026-02-01'), false);
  assert.equal(isWorksPeriodActive(period, '2026-03-01'), false);
  assert.equal(isWorksPeriodActive(period, '2026-01-20'), false);
});

test('a window with neither bound claims nothing', () => {
  assert.equal(isWorksPeriodActive(closed(null, null), '2026-02-01'), false);
});

test('no window at all is not a works period', () => {
  assert.equal(isWorksPeriodActive(null, '2026-02-01'), false);
  assert.equal(isWorksPeriodActive(undefined, '2026-02-01'), false);
});

test('without the park day nothing is claimed, whatever the window says', () => {
  // The cross-park listings — favorites, the blog, the homepage — pass no
  // `todayIso`, and guessing one off the reader's clock is the hydration bug
  // this prop exists to avoid.
  assert.equal(isWorksPeriodActive(closed('2026-01-16', '2026-03-03'), undefined), false);
});

test('year boundaries compare as calendar days, not as strings that happen to sort', () => {
  const period = closed('2026-12-20', '2027-01-10');
  assert.equal(isWorksPeriodActive(period, '2026-12-31'), true);
  assert.equal(isWorksPeriodActive(period, '2027-01-01'), true);
  assert.equal(isWorksPeriodActive(period, '2027-01-11'), false);
  assert.equal(isWorksPeriodActive(period, '2026-12-19'), false);
});

test('the list wins over the single window, which stands in for a list that is not there', () => {
  const one = closed('2026-01-16', '2026-03-03');
  const two = closed('2026-11-02', null);
  assert.deepEqual(worksPeriodsOf({ worksPeriod: one, worksPeriods: [one, two] }), [one, two]);
  assert.deepEqual(worksPeriodsOf({ worksPeriod: one }), [one]);
  assert.deepEqual(worksPeriodsOf({ worksPeriod: one, worksPeriods: [] }), [one]);
  assert.deepEqual(worksPeriodsOf({}), []);
  assert.deepEqual(worksPeriodsOf(null), []);
});

test('the window on a day is the one covering it, or none between two windows', () => {
  const one = closed('2026-01-16', '2026-03-03');
  const two = closed('2026-11-02', null);
  assert.equal(worksPeriodOn([one, two], '2026-02-01'), one);
  assert.equal(worksPeriodOn([one, two], '2026-12-24'), two);
  assert.equal(worksPeriodOn([one, two], '2026-06-01'), null);
  assert.equal(worksPeriodOn([one, two], undefined), null);
});

test('the next window starts after today; a running or a start-less one is not next', () => {
  const one = closed('2026-01-16', '2026-03-03');
  const two = closed('2026-11-02', null);
  assert.equal(nextWorksPeriod([one, two], '2026-01-01'), one);
  assert.equal(nextWorksPeriod([one, two], '2026-02-01'), two);
  assert.equal(nextWorksPeriod([one, two], '2026-11-02'), null);
  assert.equal(nextWorksPeriod([closed(null, '2027-01-01')], '2026-06-01'), null);
  // On the wire a null bound is a stripped key.
  assert.equal(nextWorksPeriod([{ to: '2027-01-01', toUncertain: false }], '2026-06-01'), null);
  assert.equal(nextWorksPeriod([one], undefined), null);
});

test('rides in works on a day come by name and carry the window that closes them', () => {
  const rides = [
    { slug: 'python', name: 'Python', worksPeriods: [closed('2026-01-05', '2026-03-20')] },
    { slug: 'baron', name: 'Baron 1898', worksPeriod: closed('2026-01-10', null) },
    { slug: 'joris', name: 'Joris en de Draak' },
  ];
  assert.deepEqual(ridesInWorksOn(rides, '2026-02-01'), [
    { slug: 'baron', name: 'Baron 1898', period: rides[1].worksPeriod },
    { slug: 'python', name: 'Python', period: rides[0].worksPeriods[0] },
  ]);
  assert.deepEqual(
    ridesInWorksOn(rides, '2026-01-07').map((r) => r.slug),
    ['python']
  );
  assert.deepEqual(ridesInWorksOn(rides, '2025-12-31'), []);
});

/**
 * A stand-in for `t`: the key, then the values it was handed. Intl spaces a range with thin and
 * no-break spaces, which these expectations write as plain ones.
 */
const t = (key, values = {}) =>
  [key, ...['range', 'from', 'to'].filter((k) => values[k]).map((k) => values[k])].join(':');
const plain = (text) => text?.replace(/[\u2009\u202f\u00a0]/g, ' ') ?? null;
const windowLabel = (...args) => plain(worksWindowLabel(...args));
const endLabel = (...args) => plain(worksEndLabel(...args));
const runningLabel = (...args) => plain(worksRunningLabel(...args));
const upcomingLabel = (...args) => plain(worksUpcomingLabel(...args));

test('a window with both ends is one range, written as the language shapes it', () => {
  assert.equal(windowLabel(closed('2026-11-16', '2026-11-27'), 'de', t), '16.–27. November 2026');
  assert.equal(
    windowLabel(closed('2027-01-04', '2027-03-25'), 'de', t),
    '4. Januar – 25. März 2027'
  );
  assert.equal(windowLabel(closed('2026-12-08', '2026-12-08'), 'de', t), '8. Dezember 2026');
  assert.equal(
    windowLabel(closed('2026-12-20', '2027-01-10'), 'de', t),
    '20. Dezember 2026 – 10. Januar 2027'
  );
});

test('an estimated end is hedged, a half-open window says which end it has', () => {
  assert.equal(
    windowLabel({ from: '2027-01-04', to: '2027-03-25', toUncertain: true }, 'de', t),
    'windowUncertain:4. Januar – 25. März 2027'
  );
  assert.equal(windowLabel(closed('2026-01-16', null), 'de', t), 'windowFrom:16. Januar 2026');
  assert.equal(windowLabel(closed(null, '2026-03-03'), 'de', t), 'windowTo:3. März 2026');
  assert.equal(
    windowLabel({ from: null, to: '2026-03-03', toUncertain: true }, 'de', t),
    'windowToUncertain:3. März 2026'
  );
  // On the wire a null bound is a stripped key.
  assert.equal(
    windowLabel({ from: '2026-01-16', toUncertain: false }, 'de', t),
    'windowFrom:16. Januar 2026'
  );
  assert.equal(windowLabel(closed(null, null), 'de', t), null);
});

test('Italian ranges lose the padding CLDR gives their days', () => {
  assert.equal(windowLabel(closed('2027-01-04', '2027-01-09'), 'it', t), '4–9 gennaio 2027');
  assert.equal(
    windowLabel(closed('2027-01-04', '2027-03-25'), 'it', t),
    '4 gennaio – 25 marzo 2027'
  );
});

test('seen from a day, a window says until when, with the year only where it changes', () => {
  const period = closed('2027-01-04', '2027-03-25');
  assert.equal(endLabel(period, 'de', t, '2027-01-08'), 'windowTo:25. März');
  assert.equal(endLabel(period, 'de', t, '2026-12-30'), 'windowTo:25. März 2027');
  assert.equal(endLabel(period, 'de', t), 'windowTo:25. März 2027');
  assert.equal(
    endLabel({ ...period, toUncertain: true }, 'de', t, '2027-01-08'),
    'windowToUncertain:25. März'
  );
  assert.equal(endLabel(closed('2027-01-04', null), 'de', t, '2027-01-08'), 'windowOpenEnd');
});

test('the badge names the reopening of a running window and the start of the next', () => {
  assert.equal(runningLabel(closed('2026-11-09', '2026-12-04'), 'de', t), 'runningUntil:4. Dez.');
  assert.equal(
    runningLabel({ from: '2026-11-09', to: '2026-12-04', toUncertain: true }, 'de', t),
    'runningUntilUncertain:4. Dez.'
  );
  assert.equal(runningLabel(closed('2026-11-09', null), 'de', t), 'label');
  assert.equal(upcomingLabel(closed('2027-01-04', '2027-03-25'), 'de', t), 'upcoming:4. Jan.');
  assert.equal(upcomingLabel(closed('2026-12-08', '2026-12-08'), 'de', t), 'upcomingDay:8. Dez.');
  assert.equal(upcomingLabel(closed('2027-01-04', null), 'de', t), 'upcoming:4. Jan.');
});

test('the 8th and the 11th are flagged for the Italian elision, and only they', () => {
  assert.equal(dayNumberElides('2026-12-08'), 'yes');
  assert.equal(dayNumberElides('2026-12-11'), 'yes');
  assert.equal(dayNumberElides('2026-12-01'), 'no');
  assert.equal(dayNumberElides('2026-12-18'), 'no');
  assert.equal(dayNumberElides(null), 'no');
});

console.log(`\n${passed} assertions passed.`);
