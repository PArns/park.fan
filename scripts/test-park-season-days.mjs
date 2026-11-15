/**
 * Unit tests for `lib/parks/park-season-days.ts`: which days of a park's calendar month a season
 * marks, when the mark is quiet, and what the legend keys. The grid, the legend and the day dialog
 * read the one computation, so these cases are theirs.
 *
 * Run: `pnpm test:park-season-days`
 */
import assert from 'node:assert/strict';
import {
  eventSeasonsNearToday,
  seasonDaysOfMonth,
  seasonKindsIn,
  seasonMarks,
  seasonsInMonth,
  seasonsNeedDayStatus,
} from '../lib/parks/park-season-days.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const season = (id, fields) => ({
  id,
  name: null,
  dates: null,
  status: 'confirmed',
  separateTicket: false,
  priceFrom: null,
  priceCurrency: null,
  opensAt: null,
  closesAt: null,
  attractionIds: null,
  url: null,
  sourceUrl: null,
  confirmedAt: null,
  ...fields,
});
const OCTOBER = { year: 2026, month: 10 };

test('a season with single dates marks those dates and no other day of its range', () => {
  const days = seasonDaysOfMonth(
    [
      season('fright', {
        kind: 'halloween',
        name: 'Fright Nights',
        startDate: '2026-10-03',
        endDate: '2026-11-01',
        dates: ['2026-10-03', '2026-10-04', '2026-10-31'],
      }),
    ],
    OCTOBER
  );
  assert.deepEqual(Object.keys(days).sort(), ['2026-10-03', '2026-10-04', '2026-10-31']);
  assert.equal(days['2026-10-03'][0].name, 'Fright Nights');
  assert.equal(days['2026-10-03'][0].quiet, false);
});

test('a range season marks every day of the month it overlaps, and only those', () => {
  const days = seasonDaysOfMonth(
    [season('nights', { kind: 'summer_nights', startDate: '2026-09-20', endDate: '2026-10-02' })],
    OCTOBER
  );
  assert.deepEqual(Object.keys(days).sort(), ['2026-10-01', '2026-10-02']);
});

test('a season without dates skips the days the calendar shows closed; listed dates stand', () => {
  const calendar = [
    { date: '2026-10-05', status: 'CLOSED' },
    { date: '2026-10-06', status: 'UNKNOWN' },
    { date: '2026-10-07', status: 'OPERATING' },
  ];
  const range = season('scary', {
    kind: 'halloween',
    status: 'expected',
    startDate: '2026-10-05',
    endDate: '2026-10-07',
  });
  const listed = season('nocturne', {
    kind: 'special_event',
    startDate: '2026-10-05',
    endDate: '2026-10-07',
    dates: ['2026-10-05'],
  });
  const days = seasonDaysOfMonth([range, listed], OCTOBER, calendar);
  assert.deepEqual(
    Object.entries(days)
      .sort()
      .map(([date, list]) => [date, list.map((s) => s.id)]),
    [
      ['2026-10-05', ['nocturne']],
      ['2026-10-06', ['scary']],
      ['2026-10-07', ['scary']],
    ]
  );
  assert.equal(seasonsNeedDayStatus([listed], OCTOBER), false);
  assert.equal(seasonsNeedDayStatus([range, listed], OCTOBER), true);
  assert.equal(seasonsNeedDayStatus([range], { year: 2026, month: 11 }), false);
});

test('a cancelled season and the kinds the grid already shows mark nothing', () => {
  const range = { startDate: '2026-10-01', endDate: '2026-10-31' };
  const days = seasonDaysOfMonth(
    [
      season('off', { kind: 'halloween', status: 'cancelled', ...range }),
      season('open', { kind: 'opening', ...range }),
      season('shut', { kind: 'closure', ...range }),
      season('works', { kind: 'maintenance', ...range }),
    ],
    OCTOBER
  );
  assert.deepEqual(days, {});
  assert.deepEqual(seasonKindsIn(days), []);
});

test('a season over most of the month, or one only expected, is drawn quiet', () => {
  const days = seasonDaysOfMonth(
    [
      season('winter', { kind: 'winter', startDate: '2026-10-10', endDate: '2027-01-24' }),
      season('guess', {
        kind: 'special_event',
        status: 'expected',
        startDate: '2026-10-17',
        endDate: '2026-10-17',
      }),
      season('week', { kind: 'christmas', startDate: '2026-10-20', endDate: '2026-10-26' }),
    ],
    OCTOBER
  );
  const quiet = (date, kind) => days[date].find((s) => s.kind === kind).quiet;
  assert.equal(quiet('2026-10-10', 'winter'), true);
  assert.equal(quiet('2026-10-17', 'special_event'), true);
  assert.equal(quiet('2026-10-20', 'christmas'), false);
});

test('the legend keys the kinds the month shows, in one order', () => {
  const days = seasonDaysOfMonth(
    [
      season('a', { kind: 'special_event', startDate: '2026-10-05', endDate: '2026-10-05' }),
      season('b', { kind: 'halloween', startDate: '2026-11-01', endDate: '2026-11-30' }),
      season('c', { kind: 'winter', startDate: '2026-10-30', endDate: '2026-12-31' }),
    ],
    OCTOBER
  );
  assert.deepEqual(seasonKindsIn(days), ['winter', 'special_event']);
});

test('a month chip lists each of its seasons once, whatever days they run on', () => {
  const days = seasonDaysOfMonth(
    [
      season('hhf', {
        kind: 'halloween',
        name: 'Halloween Horror Festival',
        startDate: '2027-09-24',
        endDate: '2027-11-01',
        status: 'expected',
        dates: ['2027-10-01', '2027-10-02', '2027-10-31'],
      }),
      season('gone', {
        kind: 'christmas',
        status: 'cancelled',
        startDate: '2027-10-01',
        endDate: '2027-10-31',
      }),
    ],
    { year: 2027, month: 10 }
  );
  const listed = seasonsInMonth(days);
  assert.deepEqual(
    listed.map((s) => [s.id, s.quiet]),
    [['hhf', true]]
  );
  assert.deepEqual(seasonsInMonth({}), []);
});

test('a tile marks each kind once, quiet only when every season of that kind is', () => {
  const day = (kind, quiet, id) => ({ id, kind, quiet });
  assert.deepEqual(
    seasonMarks([
      day('special_event', true, 'x'),
      day('halloween', true, 'y'),
      day('halloween', false, 'z'),
    ]).map(({ kind, quiet, seasons }) => [kind, quiet, seasons.length]),
    [
      ['halloween', false, 2],
      ['special_event', true, 1],
    ]
  );
});

test('„Heute im Park" gets the seasons on today or tomorrow, with only those dates', () => {
  const near = eventSeasonsNearToday(
    [
      season('wintertraum', {
        kind: 'winter',
        name: 'Wintertraum',
        startDate: '2026-11-14',
        endDate: '2027-01-24',
        dates: ['2026-11-14', '2026-11-15', '2026-11-16'],
      }),
      // Starts tomorrow: kept, so a tab left open past midnight still names it.
      season('advent', { kind: 'christmas', startDate: '2026-11-14', endDate: '2026-12-24' }),
      season('done', { kind: 'halloween', startDate: '2026-10-01', endDate: '2026-11-01' }),
      season('off', { kind: 'closure', startDate: '2026-11-01', endDate: '2026-11-30' }),
      season('called-off', {
        kind: 'special_event',
        status: 'cancelled',
        startDate: '2026-11-13',
        endDate: '2026-11-14',
      }),
    ],
    '2026-11-13'
  );
  assert.equal(near.today, '2026-11-13');
  assert.deepEqual(
    near.seasons.map((s) => [s.id, s.dates]),
    [
      ['wintertraum', ['2026-11-14']],
      ['advent', null],
    ]
  );
  assert.equal('priceFrom' in near.seasons[0], false);
});

console.log(`\n${passed} passed`);
