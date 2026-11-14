/**
 * Unit tests for Orlando's best-time pages (`lib/trip-regions/best-time.ts`): the title's year and the
 * range both routes accept, the month rows, the school-break runs and the European cells, chapter
 * 03's weeks, the holiday week the FAQ reads and the window phrase of the first answer. The fixtures
 * are in `/when`'s and `/school-breaks`' shapes as the API serves them.
 *
 * Run: pnpm test:orlando-best-time
 */

import assert from 'node:assert/strict';
import {
  bestAndWorstWeeks,
  bestTimeParks,
  bestTimeRange,
  bestTimeYear,
  breakRuns,
  cleanBreakName,
  europeanBreaks,
  holidayWeek,
  monthRows,
  parseBestTimePage,
  partySeasons,
  planOrder,
  seasonsOn,
  tripLongBreaks,
  windowList,
} from '@/lib/trip-regions/best-time.ts';
import { requireTripRegion } from '@/lib/trip-regions/registry.ts';
import { localizedPath } from '@/lib/i18n/localized-path.ts';

const ORLANDO = requireTripRegion('orlando');

let passed = 0;
const test = (name, fn) => {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
};

test('the title names the coming year from September on', () => {
  assert.equal(bestTimeYear('2026-08-31'), 2026);
  assert.equal(bestTimeYear('2026-09-01'), 2027);
  assert.equal(bestTimeYear('2026-11-12'), 2027);
  assert.equal(bestTimeYear('2027-01-01'), 2027);
});

test('the range is the title year, from today and at most a year ahead', () => {
  assert.deepEqual(bestTimeRange('2026-11-12'), { from: '2027-01-01', to: '2027-11-12' });
  assert.deepEqual(bestTimeRange('2027-05-12'), { from: '2027-05-12', to: '2027-12-31' });
  assert.deepEqual(bestTimeRange('2026-12-31'), { from: '2027-01-01', to: '2027-12-31' });
});

test('the segments name the Orlando page, a resort, or nothing', () => {
  assert.equal(parseBestTimePage(ORLANDO, undefined), 'region');
  assert.equal(parseBestTimePage(ORLANDO, []), 'region');
  assert.equal(parseBestTimePage(ORLANDO, ['disney-world']), 'disney-world');
  assert.equal(parseBestTimePage(ORLANDO, ['universal-orlando']), 'universal-orlando');
  assert.equal(parseBestTimePage(ORLANDO, ['seaworld-orlando']), null);
  assert.equal(parseBestTimePage(ORLANDO, ['disney-world', 'x']), null);
});

test('a region without best-time pages has none, not even its own', () => {
  assert.equal(parseBestTimePage(requireTripRegion('paris'), undefined), null);
});

test("a page plans its resorts' headliner parks only", () => {
  const park = (slug, group, headliner = true) => ({ slug, group, headliner });
  const region = {
    slug: 'orlando',
    parks: [
      park('magic-kingdom-park', 'walt-disney-world'),
      park('disneys-typhoon-lagoon-water-park', 'walt-disney-world', false),
      park('universal-epic-universe', 'universal-orlando'),
      park('seaworld-orlando', 'seaworld-orlando'),
    ],
  };
  assert.deepEqual(bestTimeParks(region, 'region'), [
    'magic-kingdom-park',
    'universal-epic-universe',
  ]);
  assert.deepEqual(bestTimeParks(region, 'universal-orlando'), ['universal-epic-universe']);
});

const month = (key, wait, extra = {}) => ({
  month: key,
  headlinerWait: wait,
  basis: 'forecast',
  usSchoolBreakDays: [],
  seasons: [],
  partyNights: 0,
  hurricaneSeason: false,
  ...extra,
});

test('the month rows run January to December, past the range without data', () => {
  const when = {
    months: [
      month('2027-01', 37, { dayGuestHours: 11.5 }),
      month('2027-02', 34, { dayGuestHours: 13 }),
      month('2027-03', 34, { dayGuestHours: 10 }),
      month('2027-06', 49, { dayGuestHours: 11.5 }),
      month('2027-11', 42),
    ],
  };
  const rows = monthRows(when, '2026-11-12');
  assert.equal(rows.length, 12);
  assert.equal(rows[0].key, '2027-01');
  assert.equal(rows[11].key, '2027-12');
  assert.equal(rows[11].data, undefined);
  assert.equal(rows[11].tier, null);
  assert.equal(rows[1].tier, 'very_low', 'the quietest months share the first tier');
  assert.equal(rows[5].tier, 'very_high');
  assert.equal(rows[1].hours, 'long');
  assert.equal(rows[2].hours, 'short');
  assert.equal(rows[0].hours, 'usual');
  assert.equal(rows[10].hours, null, 'no published hours, no verdict');
});

test('in the title year itself the rows start at the current month', () => {
  const rows = monthRows({ months: [] }, '2027-05-12');
  assert.deepEqual(
    rows.map((r) => r.month.month),
    [5, 6, 7, 8, 9, 10, 11, 12]
  );
});

test('a break name loses its district and the other holidays of the day', () => {
  assert.equal(cleanBreakName('Spring break (Orange County Public Schools)'), 'Spring break');
  assert.equal(
    cleanBreakName("Winter break (Orange County Public Schools), New Year's Day"),
    'Winter break'
  );
  assert.equal(cleanBreakName('Veterans Day'), 'Veterans Day');
});

test('unnamed weekend days join the break they border', () => {
  const runs = breakRuns([
    { date: '2027-02-15', name: "Presidents' Day (Orange County Public Schools)" },
    { date: '2027-02-13', name: '' },
    { date: '2027-02-14', name: '' },
    { date: '2027-04-24', name: '' },
    { date: '2027-04-25', name: '' },
  ]);
  assert.deepEqual(runs, [{ from: '2027-02-13', to: '2027-02-15', name: "Presidents' Day" }]);
});

const region = (code, country, periods, through = '2028-11-03') => ({
  code,
  name: code,
  country,
  through,
  periods: periods.map(([from, to]) => ({ from, to, name: 'Break' })),
});

test('a European month cell counts real breaks, not bridge days', () => {
  const regions = [
    region('DE-BY', 'DE', [['2027-03-20', '2027-04-04']]),
    region('DE-NW', 'DE', [['2027-03-25', '2027-03-25']]),
    region('NL-GR', 'NL', [['2027-02-20', '2027-02-28']]),
    region('GB-ENG', 'GB', [['2027-03-26', '2027-04-11']], '2026-12-31'),
  ];
  const [de, nl, gb] = europeanBreaks(regions, '2027-03', ['DE', 'NL', 'GB']);
  assert.equal(de.total, 2);
  assert.deepEqual(
    de.regions.map((r) => r.code),
    ['DE-BY']
  );
  assert.equal(nl.regions.length, 0);
  assert.equal(gb.unknown, true, 'past the data, a break is unknown');
});

test('chapter 04 links only breaks a ten-day trip fits into, cut to the range', () => {
  const r = region('DE-BW', 'DE', [
    ['2026-12-23', '2027-01-10'],
    ['2027-03-25', '2027-03-25'],
    ['2027-07-29', '2027-09-12'],
  ]);
  assert.deepEqual(
    tripLongBreaks(r, 10, { from: '2027-01-01', to: '2027-08-31' }).map((p) => [p.from, p.to]),
    [
      ['2027-01-01', '2027-01-10'],
      ['2027-07-29', '2027-08-31'],
    ]
  );
});

test('best and worst weeks are whole weeks inside the range', () => {
  const weeks = [
    { start: '2026-12-28', headlinerWait: 20, basis: 'forecast' },
    { start: '2027-01-04', headlinerWait: 37, basis: 'forecast' },
    { start: '2027-01-11', headlinerWait: 35, basis: 'forecast' },
    { start: '2027-07-05', headlinerWait: 55, basis: 'last_year' },
    { start: '2027-11-08', headlinerWait: 60, basis: 'last_year' },
  ];
  const { best, worst } = bestAndWorstWeeks(weeks, { from: '2027-01-01', to: '2027-11-12' }, 2);
  assert.deepEqual(
    best.map((w) => w.start),
    ['2027-01-11', '2027-01-04']
  );
  assert.deepEqual(
    worst.map((w) => w.start),
    ['2027-07-05']
  );
});

test("Christmas week is the holiday week, else New Year's", () => {
  const weeks = [
    { start: '2026-12-28', headlinerWait: 54, basis: 'forecast' },
    { start: '2027-01-04', headlinerWait: 37, basis: 'forecast' },
  ];
  assert.equal(holidayWeek(weeks)?.holiday, 'new_year');
  assert.equal(
    holidayWeek([{ start: '2027-12-20', headlinerWait: 60, basis: 'last_year' }, ...weeks])
      ?.holiday,
    'christmas'
  );
  assert.equal(holidayWeek([weeks[1]]), null);
});

const season = (id, extra) => ({
  id,
  parkSlug: 'magic-kingdom-park',
  kind: 'christmas',
  startDate: '2027-11-07',
  endDate: '2027-12-21',
  status: 'expected',
  ...extra,
});

test('seasons on a range: one per name, closures and cancelled ones left out', () => {
  const seasons = [
    season('a', { name: 'Holidays', startDate: '2026-11-13', endDate: '2027-01-06' }),
    season('b', {
      name: 'Holidays',
      parkSlug: 'epcot',
      startDate: '2026-11-13',
      endDate: '2027-01-06',
    }),
    season('c', { kind: 'closure', startDate: '2027-01-01', endDate: '2027-01-26' }),
    season('d', {
      name: 'Gone',
      status: 'cancelled',
      startDate: '2027-01-01',
      endDate: '2027-01-02',
    }),
    season('e', {
      name: 'Select days',
      startDate: '2027-01-01',
      endDate: '2027-01-31',
      dates: ['2027-01-20'],
    }),
  ];
  assert.deepEqual(
    seasonsOn(seasons, { from: '2027-01-01', to: '2027-01-07' }).map((s) => s.id),
    ['a']
  );
});

test('party nights are ticketed Halloween and Christmas evenings at the page’s parks', () => {
  const seasons = [
    season('mvmcp', { separateTicket: true }),
    season('hols', { separateTicket: false }),
    season('dah', { kind: 'special_event', separateTicket: true }),
    season('hhn', {
      kind: 'halloween',
      separateTicket: true,
      parkSlug: 'universal-studios-florida',
    }),
  ];
  assert.deepEqual(
    partySeasons(seasons, ['magic-kingdom-park']).map((s) => s.id),
    ['mvmcp']
  );
});

test("the plan's order is each park's first day", () => {
  const plan = {
    days: [
      { date: '2027-02-16', kind: 'arrival', parks: [] },
      { date: '2027-02-17', kind: 'park', parks: ['epcot'] },
      { date: '2027-02-18', kind: 'hop', parks: ['universal-studios-florida', 'epcot'] },
    ],
  };
  assert.deepEqual(planOrder({ plan }), [
    { slug: 'epcot', date: '2027-02-17' },
    { slug: 'universal-studios-florida', date: '2027-02-18' },
  ]);
  assert.deepEqual(planOrder({}), []);
});

test('the window phrase is one list in the reader’s language', () => {
  const windows = [
    { from: '2027-02-16', to: '2027-02-25' },
    { from: '2027-03-01', to: '2027-03-10' },
    { from: '2027-04-06', to: '2027-04-15' },
  ];
  assert.equal(windowList(windows, 'en'), 'Feb 16 – 25, Mar 1 – 10, and Apr 6 – 15');
  assert.equal(windowList(windows, 'de'), '16.–25. Feb., 1.–10. März und 6.–15. Apr.');
});

test('a written best-time path gets the reader’s segment', () => {
  assert.equal(
    localizedPath('/orlando/best-time-to-visit/disney-world', 'de'),
    '/de/orlando/beste-reisezeit/disney-world'
  );
  assert.equal(localizedPath('/orlando/2027/3', 'nl'), '/nl/orlando/2027/3');
});

console.log(`\n${passed} passed`);
