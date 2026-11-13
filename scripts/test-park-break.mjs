/**
 * Unit tests for `lib/utils/park-break.ts`, which decides whether the park and ride pages show the
 * yellow break panel, which label it carries and which picture. The cases are closures the
 * schedule actually shows: Hansa-Park shut until spring, Movie Park shut for two
 * weeks between its Halloween and its Christmas season, a park open only at weekends, and
 * parks with no winter at all.
 *
 * Run: `pnpm test:park-break`
 */
import assert from 'node:assert/strict';
import { WINTER_BREAK_MIN_DAYS, parkBreakOf } from '../lib/utils/park-break.ts';
import { OFFSEASON_MIN_DAYS } from '../lib/utils/schedule-utils.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

/** A northern park shut on `today`, with its next opening at 10:00 park time on `reopensOn`. */
function park(reopensOn, today = '2026-11-13', overrides = {}) {
  return {
    timezone: 'Europe/Berlin',
    latitude: 54.07,
    hasOperatingSchedule: true,
    schedule: [{ date: today, scheduleType: 'CLOSED', openingTime: '', closingTime: '' }],
    nextSchedule: reopensOn
      ? {
          openingTime: `${reopensOn}T09:00:00.000Z`,
          closingTime: `${reopensOn}T17:00:00.000Z`,
          scheduleType: 'OPERATING',
        }
      : null,
    ...overrides,
  };
}

// The winter break

test('a park shut from November until spring is in its winter break, drawn in snow', () => {
  assert.deepEqual(parkBreakOf(park('2027-03-25'), '2026-11-13'), {
    reopensOn: '2027-03-25',
    daysUntil: 132,
    winter: true,
    scene: 'winter',
  });
});

test('its last weeks, in March, are still the winter break, drawn in spring', () => {
  const at = '2027-03-10';
  assert.deepEqual(parkBreakOf(park('2027-03-25', at), at), {
    reopensOn: '2027-03-25',
    daysUntil: 15,
    winter: true,
    scene: 'spring',
  });
});

test(`it takes ${WINTER_BREAK_MIN_DAYS} days after New Year to be the winter break`, () => {
  assert.equal(parkBreakOf(park('2027-01-07'), '2026-11-13')?.winter, false);
  assert.equal(parkBreakOf(park('2027-01-08'), '2026-11-13')?.winter, true);
});

test('the break after a Christmas season, from January, is the winter break', () => {
  const at = '2027-01-10';
  assert.equal(parkBreakOf(park('2027-03-27', at), at)?.winter, true);
});

test('a southern park closes for the winter in July, and is drawn in snow in June', () => {
  const south = { latitude: -37.8, timezone: 'Australia/Melbourne' };
  const at = '2027-06-01';
  const june = parkBreakOf(park('2027-09-10', at, south), at);
  assert.equal(june?.winter, true);
  assert.equal(june?.scene, 'winter');
});

// A break between seasons

test('Movie Park, shut until 27 November with two weeks to go, gets a season break in autumn', () => {
  assert.deepEqual(parkBreakOf(park('2026-11-27'), '2026-11-13'), {
    reopensOn: '2026-11-27',
    daysUntil: 14,
    winter: false,
    scene: 'autumn',
  });
});

test('a week before it opens it is still a season break, however long it has run', () => {
  const at = '2026-11-20';
  assert.equal(parkBreakOf(park('2026-11-27', at), at)?.scene, 'autumn');
});

test('shut until a Christmas season on 19 December is a season break, not the winter break', () => {
  const parcAsterix = parkBreakOf(park('2026-12-19'), '2026-11-13');
  assert.equal(parcAsterix?.winter, false);
  assert.equal(parcAsterix?.scene, 'autumn');
});

test('a break in December that is no winter break is still drawn in snow', () => {
  const at = '2026-12-02';
  assert.equal(parkBreakOf(park('2026-12-19', at), at)?.scene, 'winter');
});

test('a break in May is drawn in spring, and one in summer too', () => {
  assert.equal(parkBreakOf(park('2027-05-20', '2027-05-01'), '2027-05-01')?.scene, 'spring');
  assert.equal(parkBreakOf(park('2027-07-30', '2027-07-01'), '2027-07-01')?.scene, 'spring');
});

test('a park in the tropics has no winter break, but a long break is still one', () => {
  const singapore = { latitude: 1.25, timezone: 'Asia/Singapore' };
  const tropical = parkBreakOf(park('2027-03-25', '2026-11-13', singapore), '2026-11-13');
  assert.equal(tropical?.winter, false);
  assert.equal(tropical?.scene, 'spring');
});

// What keeps the panel away

test('a park open only at weekends never gets the panel, not even in February', () => {
  const at = '2027-02-08';
  assert.equal(parkBreakOf(park('2027-02-13', at), at), null);
});

test(`the park cards' offseason line holds: ${OFFSEASON_MIN_DAYS - 1} days to go is no break`, () => {
  const at = '2027-02-01';
  assert.equal(parkBreakOf(park('2027-02-07', at), at), null);
  assert.ok(parkBreakOf(park('2027-02-08', at), at));
});

test('a park that operates today is in no break', () => {
  const schedule = [
    {
      date: '2026-11-13',
      scheduleType: 'OPERATING',
      openingTime: '2026-11-13T09:00:00.000Z',
      closingTime: '2026-11-13T17:00:00.000Z',
    },
  ];
  assert.equal(parkBreakOf(park('2027-03-25', '2026-11-13', { schedule }), '2026-11-13'), null);
});

test('without a known reopening, or without an operating schedule, there is nothing to show', () => {
  assert.equal(parkBreakOf(park(null), '2026-11-13'), null);
  const none = { hasOperatingSchedule: false };
  assert.equal(parkBreakOf(park('2027-03-25', '2026-11-13', none), '2026-11-13'), null);
});

test('a park without a latitude can have a long break, never a winter break', () => {
  const unknown = parkBreakOf(park('2027-03-25', '2026-11-13', { latitude: null }), '2026-11-13');
  assert.equal(unknown?.winter, false);
});

test('no park or no day answers null', () => {
  assert.equal(parkBreakOf(null, '2026-11-13'), null);
  assert.equal(parkBreakOf(park('2027-03-25'), undefined), null);
});

// The reopening day

test('the reopening day is the park’s own: a 23:30 UTC opening in Tokyo is the next day', () => {
  const tokyo = {
    latitude: 35.63,
    timezone: 'Asia/Tokyo',
    nextSchedule: {
      openingTime: '2027-03-19T23:30:00.000Z',
      closingTime: '2027-03-20T12:00:00.000Z',
      scheduleType: 'OPERATING',
    },
  };
  assert.equal(parkBreakOf(park(null, '2026-11-13', tokyo), '2026-11-13')?.reopensOn, '2027-03-20');
});

test('a `date` on the next schedule wins over the opening instant', () => {
  const nextSchedule = {
    date: '2027-03-26',
    openingTime: '2027-03-25T23:00:00.000Z',
    closingTime: '2027-03-26T17:00:00.000Z',
    scheduleType: 'OPERATING',
  };
  assert.equal(
    parkBreakOf(park(null, '2026-11-13', { nextSchedule }), '2026-11-13')?.reopensOn,
    '2027-03-26'
  );
});

console.log(`\n${passed} passed`);
