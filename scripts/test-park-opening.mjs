/**
 * Unit tests for the next-opening decision in `lib/utils/schedule-utils.ts`: `nextParkOpening`,
 * which the hero's status pills and its park block read, `isTodayAhead`, the block's „can today
 * still be planned", and `formatParkOpening`, which words the answer.
 *
 * What must hold: before today's opening a shut park opens today, at a time, not on tomorrow's
 * date; an opening that has passed is never announced, even where the API's `nextSchedule` is
 * today's; „today" is the park's day, not the browser's; and with nothing ahead there is no label.
 *
 * Run: pnpm test:park-opening
 */
import assert from 'node:assert/strict';
import { formatParkOpening, isTodayAhead, nextParkOpening } from '../lib/utils/schedule-utils.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const operating = (openingTime, closingTime) => ({
  scheduleType: 'OPERATING',
  openingTime,
  closingTime,
});
const at = (iso) => new Date(iso).getTime();

const LA = 'America/Los_Angeles';
const disneylandToday = operating('2026-10-28T08:00:00-07:00', '2026-10-28T23:00:00-07:00');
const disneylandNext = operating('2026-10-29T08:00:00-07:00', '2026-10-29T23:00:00-07:00');

test('before today’s opening: today, at its time — not tomorrow’s date', () => {
  assert.deepEqual(
    nextParkOpening(disneylandToday, disneylandNext, LA, at('2026-10-28T06:30:00-07:00')),
    { at: disneylandToday.openingTime, today: true }
  );
});

test('after today’s close: the next operating day', () => {
  assert.deepEqual(
    nextParkOpening(disneylandToday, disneylandNext, LA, at('2026-10-28T23:30:00-07:00')),
    { at: disneylandNext.openingTime, today: false }
  );
});

test('the minute of the opening itself is open, so nothing is announced', () => {
  assert.equal(
    nextParkOpening(disneylandToday, disneylandNext, LA, at('2026-10-28T08:00:00-07:00')),
    null
  );
});

test('inside today’s hours with a stale CLOSED status: no „opens tomorrow“', () => {
  assert.equal(
    nextParkOpening(disneylandToday, disneylandNext, LA, at('2026-10-28T09:00:00-07:00')),
    null
  );
});

const GOLD_COAST = 'Australia/Brisbane';
const wetnwildToday = operating('2026-10-28T10:00:00+10:00', '2026-10-28T17:00:00+10:00');

test('a nextSchedule that is today’s, already past: no opening, so „Geschlossen“', () => {
  assert.equal(
    nextParkOpening(wetnwildToday, wetnwildToday, GOLD_COAST, at('2026-10-28T21:44:00+10:00')),
    null
  );
});

test('a nextSchedule that is today’s and still ahead: today, at its time', () => {
  assert.deepEqual(
    nextParkOpening(undefined, wetnwildToday, GOLD_COAST, at('2026-10-28T07:00:00+10:00')),
    { at: wetnwildToday.openingTime, today: true }
  );
});

test('„today“ is the park’s day: 23:30 in Berlin is already tomorrow in Tokyo', () => {
  const TOKYO = 'Asia/Tokyo';
  const tokyoNext = operating('2026-10-29T09:00:00+09:00', '2026-10-29T21:00:00+09:00');
  // 2026-10-28 23:30 Berlin = 2026-10-29 07:30 Tokyo.
  assert.deepEqual(nextParkOpening(undefined, tokyoNext, TOKYO, at('2026-10-28T23:30:00+01:00')), {
    at: tokyoNext.openingTime,
    today: true,
  });
});

test('a closed day and no next entry: nothing ahead', () => {
  const closedDay = { scheduleType: 'CLOSED', openingTime: '', closingTime: '' };
  assert.equal(nextParkOpening(closedDay, undefined, LA, at('2026-10-28T06:30:00-07:00')), null);
  assert.equal(nextParkOpening(undefined, undefined, LA, at('2026-10-28T06:30:00-07:00')), null);
});

test('isTodayAhead: open until today’s close, and no entry says nothing against today', () => {
  assert.equal(isTodayAhead(disneylandToday, at('2026-10-28T06:30:00-07:00')), true);
  assert.equal(isTodayAhead(disneylandToday, at('2026-10-28T22:59:00-07:00')), true);
  assert.equal(isTodayAhead(disneylandToday, at('2026-10-28T23:00:00-07:00')), false);
  assert.equal(
    isTodayAhead({ scheduleType: 'CLOSED', openingTime: '', closingTime: '' }, null),
    false
  );
  assert.equal(isTodayAhead(undefined, at('2026-10-28T06:30:00-07:00')), true);
  assert.equal(isTodayAhead(disneylandToday, null), true);
});

test('formatParkOpening: a time today, a date later, both in the park’s zone', () => {
  const strings = { opensOn: 'Öffnet am', opensAt: (time) => `Öffnet um ${time} Uhr` };
  assert.equal(
    formatParkOpening({ at: disneylandToday.openingTime, today: true }, strings, LA, 'de'),
    'Öffnet um 08:00 Uhr'
  );
  assert.equal(
    formatParkOpening({ at: disneylandNext.openingTime, today: false }, strings, LA, 'de'),
    'Öffnet am 29. Oktober'
  );
  assert.equal(
    formatParkOpening(
      { at: disneylandToday.openingTime, today: true },
      { opensOn: 'Opens on', opensAt: (time) => `Opens at ${time}` },
      LA,
      'en'
    ),
    'Opens at 8 AM'
  );
});

console.log(`\n${passed} passed`);
