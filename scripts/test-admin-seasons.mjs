/**
 * Unit tests for the season editor's pure half (`app/admin/_lib/seasons.ts`): an edit sends what
 * changed and null for what was emptied, the form runs the API's checks first, and the day helpers
 * read pasted lists and whole weekdays.
 *
 * Run: pnpm test:admin-seasons
 */
import assert from 'node:assert/strict';
import {
  parseSeasonDates,
  seasonBody,
  seasonDraft,
  seasonFilterQuery,
  seasonFiltersFrom,
  seasonPatch,
  seasonProblems,
  weekdayDates,
} from '../app/admin/_lib/seasons.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const stored = {
  id: 's1',
  parkId: 'p1',
  kind: 'halloween',
  name: 'Fright Nights',
  startDate: '2026-10-02',
  endDate: '2026-11-01',
  dates: ['2026-10-03', '2026-10-04'],
  status: 'confirmed',
  separateTicket: true,
  priceFrom: '53.00',
  priceCurrency: 'EUR',
  opensAt: '19:00',
  closesAt: '00:00',
  attractionIds: null,
  url: null,
  sourceUrl: 'https://example.com/fright',
  confirmedAt: '2026-08-20T09:00:00.000Z',
  note: 'Nur am Wochenende',
  updatedBy: null,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

test('an untouched season patches nothing, though the price is typed another way', () => {
  const draft = { ...seasonDraft(stored, '2026-11-14'), priceFrom: '53' };
  assert.deepEqual(seasonPatch(stored, draft), {});
});

test('an emptied field is sent as null, and the price takes its currency along', () => {
  const draft = { ...seasonDraft(stored, '2026-11-14'), note: ' ', priceFrom: '', dates: [] };
  assert.deepEqual(seasonPatch(stored, draft), {
    dates: null,
    priceFrom: null,
    priceCurrency: null,
    note: null,
  });
});

test('a new season is created whole, with a German price as a number', () => {
  const body = seasonBody({ ...seasonDraft(null, '2026-11-14'), priceFrom: '53,50' });
  assert.equal(body.startDate, '2026-11-14');
  assert.equal(body.priceFrom, 53.5);
  assert.equal(body.priceCurrency, 'EUR');
  assert.equal(body.status, 'announced');
  assert.equal(body.dates, null);
});

test('the API checks run in the form, each at its field', () => {
  const problems = seasonProblems({
    ...seasonDraft(stored, '2026-11-14'),
    endDate: '2026-09-30',
    opensAt: '25:00',
    priceCurrency: 'E',
    sourceUrl: 'ftp://example.com',
    name: 'x'.repeat(201),
  });
  assert.deepEqual(Object.keys(problems).sort(), [
    'dates',
    'endDate',
    'name',
    'opensAt',
    'priceCurrency',
    'sourceUrl',
  ]);
  assert.deepEqual(seasonProblems(seasonDraft(stored, '2026-11-14')), {});
});

test('a pasted list reads both notations and names what it cannot read', () => {
  assert.deepEqual(parseSeasonDates('3.10.2026, 2026-10-04;\n2026-02-30 morgen 3.10.2026'), {
    dates: ['2026-10-03', '2026-10-04'],
    unreadable: ['2026-02-30', 'morgen'],
  });
});

test('a whole weekday is every one of its days in the range', () => {
  assert.deepEqual(weekdayDates('2026-10-02', '2026-10-18', 6), [
    '2026-10-03',
    '2026-10-10',
    '2026-10-17',
  ]);
});

test('the filters survive the address, the current year left out of it', () => {
  const filters = seasonFiltersFrom(new URLSearchParams('kind=halloween&current=true'), 2026);
  assert.equal(filters.year, '2026');
  assert.equal(seasonFilterQuery(filters, 2026), 'kind=halloween&current=true');
  assert.equal(seasonFiltersFrom(new URLSearchParams('year=all'), 2026).year, null);
});

console.log(`\n${passed} cases passed.`);
