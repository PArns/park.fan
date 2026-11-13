/**
 * Unit tests for `lib/utils/winter-break.ts`: `winterBreakOf`, which decides whether the park and
 * ride pages show the yellow winter-break panel. The cases are the closures a schedule actually
 * shows in November: a park shut until spring, one shut for two weeks between its Halloween and
 * its Christmas season, one shut on weekdays, and the parks with no winter at all.
 *
 * Run: `pnpm test:winter-break`
 */
import assert from 'node:assert/strict';
import { WINTER_BREAK_MIN_DAYS, winterBreakOf } from '../lib/utils/winter-break.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

/** A northern park shut today, with its next opening at 10:00 park time on `reopensOn`. */
function park(reopensOn, overrides = {}) {
  return {
    timezone: 'Europe/Berlin',
    latitude: 54.07,
    hasOperatingSchedule: true,
    schedule: [{ date: '2026-11-13', scheduleType: 'CLOSED', openingTime: '', closingTime: '' }],
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

test('a park shut from November until spring is in its winter break', () => {
  assert.deepEqual(winterBreakOf(park('2027-03-25'), '2026-11-13'), {
    reopensOn: '2027-03-25',
    daysUntil: 132,
  });
});

test('the last weeks of the break, in March, still count', () => {
  assert.deepEqual(winterBreakOf(park('2027-03-25'), '2027-03-10'), {
    reopensOn: '2027-03-25',
    daysUntil: 15,
  });
});

test('two weeks shut in November before a Christmas season is no winter break', () => {
  assert.equal(winterBreakOf(park('2026-11-27'), '2026-11-13'), null);
});

test('shut until a Christmas season in December is no winter break either', () => {
  assert.equal(winterBreakOf(park('2026-12-19'), '2026-11-13'), null);
});

test(`it takes ${WINTER_BREAK_MIN_DAYS} days after New Year: a reopening on 8 January counts`, () => {
  assert.equal(winterBreakOf(park('2027-01-07'), '2026-11-13'), null);
  assert.ok(winterBreakOf(park('2027-01-08'), '2026-11-13'));
});

test('the break after a Christmas season, from January, counts', () => {
  const schedule = [
    { date: '2027-01-10', scheduleType: 'CLOSED', openingTime: '', closingTime: '' },
  ];
  assert.ok(winterBreakOf(park('2027-03-27', { schedule }), '2027-01-10'));
});

test('a few weekdays shut inside the winter season are no break', () => {
  const schedule = [
    { date: '2027-01-11', scheduleType: 'CLOSED', openingTime: '', closingTime: '' },
  ];
  assert.equal(winterBreakOf(park('2027-01-15', { schedule }), '2027-01-11'), null);
});

test('a park that operates today is not in its winter break', () => {
  const schedule = [
    {
      date: '2026-11-13',
      scheduleType: 'OPERATING',
      openingTime: '2026-11-13T09:00:00.000Z',
      closingTime: '2026-11-13T17:00:00.000Z',
    },
  ];
  assert.equal(winterBreakOf(park('2027-03-25', { schedule }), '2026-11-13'), null);
});

test('without a known reopening there is nothing to show', () => {
  assert.equal(winterBreakOf(park(null), '2026-11-13'), null);
});

test('a park without an operating schedule is never in a winter break', () => {
  assert.equal(
    winterBreakOf(park('2027-03-25', { hasOperatingSchedule: false }), '2026-11-13'),
    null
  );
});

test('a southern park closes for the winter in July, not in January', () => {
  const south = { latitude: -37.8, timezone: 'Australia/Melbourne' };
  assert.ok(winterBreakOf(park('2027-09-10', south), '2027-06-01'));
  assert.equal(winterBreakOf(park('2027-03-20', south), '2026-12-01'), null);
});

test('a park in the tropics has no winter to close for', () => {
  assert.equal(
    winterBreakOf(park('2027-03-25', { latitude: 1.25, timezone: 'Asia/Singapore' }), '2026-11-13'),
    null
  );
});

test('a park without a latitude says nothing', () => {
  assert.equal(winterBreakOf(park('2027-03-25', { latitude: null }), '2026-11-13'), null);
});

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
  assert.equal(winterBreakOf(park(null, tokyo), '2026-11-13')?.reopensOn, '2027-03-20');
});

test('a `date` on the next schedule wins over the opening instant', () => {
  const next = {
    date: '2027-03-26',
    openingTime: '2027-03-25T23:00:00.000Z',
    closingTime: '2027-03-26T17:00:00.000Z',
    scheduleType: 'OPERATING',
  };
  assert.equal(
    winterBreakOf(park(null, { nextSchedule: next }), '2026-11-13')?.reopensOn,
    '2027-03-26'
  );
});

test('no park or no day answers null', () => {
  assert.equal(winterBreakOf(null, '2026-11-13'), null);
  assert.equal(winterBreakOf(park('2027-03-25'), undefined), null);
});

console.log(`\n${passed} passed`);
