/**
 * Unit tests for the Orlando hub's pure logic (`lib/orlando/*`): the month window and its proxy
 * redirects, the relay's allow-list, the shortest-line pick with its early-close clause, the "today
 * or tomorrow" answer, the event lanes, the month summaries and the best-time helpers. Fixtures are
 * recorded answers of the API in `scripts/fixtures/orlando/`.
 *
 * Run: `pnpm test:orlando-hub`
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  closesEarly,
  eventLanes,
  formatWindow,
  hoursUnpublished,
  isRankable,
  glanceDay,
  glanceLines,
  rankGroupParks,
  regionResorts,
  resortMonthSummaries,
  shortGroupName,
  shortParkName,
  slimRegion,
} from '../lib/orlando/hub-data.ts';
import {
  isOrlandoMonthInRange,
  orlandoBestTimePath,
  orlandoMonthHref,
  orlandoMonths,
  orlandoPath,
  orlandoRelayUrl,
  parseOrlandoMonth,
} from '../lib/orlando/paths.ts';
import { orlandoRedirect } from '../lib/orlando/redirects.ts';
import { flatStretch } from '../lib/orlando/best-time.ts';
import { tripRegionRelayTarget } from '../lib/orlando/relay.ts';

const fixture = (name) =>
  JSON.parse(readFileSync(new URL(`./fixtures/orlando/${name}.json`, import.meta.url), 'utf8'));
const region = fixture('region');
const calendar = fixture('calendar');
const bestDays = fixture('best-days');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const NOV = { year: 2026, month: 11 };

test('the hub serves twelve months from the current one', () => {
  const months = orlandoMonths(NOV);
  assert.equal(months.length, 12);
  assert.deepEqual(months[0], NOV);
  assert.deepEqual(months[11], { year: 2027, month: 10 });
  assert.equal(isOrlandoMonthInRange({ year: 2027, month: 11 }, NOV), false);
  assert.equal(isOrlandoMonthInRange({ year: 2026, month: 10 }, NOV), false);
});

test('the current month links as the hub, every other month as itself', () => {
  assert.equal(orlandoMonthHref(NOV, NOV), '/orlando');
  assert.equal(orlandoMonthHref({ year: 2026, month: 12 }, NOV), '/orlando/2026/12');
  assert.equal(orlandoPath(), '/orlando');
});

test('month segments parse, and a padded or foreign one does not serve', () => {
  assert.deepEqual(parseOrlandoMonth(undefined, NOV), { month: null, padded: false });
  assert.deepEqual(parseOrlandoMonth(['2027', '3'], NOV), {
    month: { year: 2027, month: 3 },
    padded: false,
  });
  assert.equal(parseOrlandoMonth(['2027', '03'], NOV).padded, true);
  assert.equal(parseOrlandoMonth(['2028', '3'], NOV), 'invalid');
  assert.equal(parseOrlandoMonth(['beste-reisezeit', 'disney-world'], NOV), 'invalid');
});

test('the proxy sends a padded month on, and a month out of range to the hub', () => {
  assert.equal(orlandoRedirect('/de/orlando/2027/03', NOV), '/de/orlando/2027/3');
  assert.equal(orlandoRedirect('/de/orlando/2028/3', NOV), '/de/orlando');
  assert.equal(orlandoRedirect('/de/orlando/2027/3', NOV), null);
  assert.equal(orlandoRedirect('/xx/orlando/2027/03', NOV), null);
});

test('a best-time path under /orlando is never treated as a month', () => {
  assert.equal(orlandoRedirect('/de/orlando/beste-reisezeit/disney-world', NOV), null);
  assert.equal(orlandoRedirect('/en/orlando/best-time-to-visit/universal-orlando', NOV), null);
  assert.equal(orlandoBestTimePath('de'), '/orlando/beste-reisezeit');
  assert.equal(
    orlandoBestTimePath('en', 'disney-world'),
    '/orlando/best-time-to-visit/disney-world'
  );
});

test('the relay forwards each route its own query names and refuses anything else', () => {
  const q = (s) => new URLSearchParams(s);
  assert.equal(
    tripRegionRelayTarget(['orlando', 'plan'], q('from=2026-12-01&to=2026-12-08&parks=epcot:2'))
      ?.apiPath,
    '/v1/trip-regions/orlando/plan?from=2026-12-01&to=2026-12-08&parks=epcot%3A2'
  );
  assert.equal(tripRegionRelayTarget(['orlando', 'plan'], q('foo=1')), null);
  assert.equal(tripRegionRelayTarget(['orlando', 'calendar'], q('parks=epcot')), null);
  assert.equal(
    tripRegionRelayTarget(['orlando', 'when'], q('within=DE-NW&days=10'))?.forecast,
    true
  );
  assert.equal(tripRegionRelayTarget(['orlando'], q(''))?.forecast, false);
  assert.equal(tripRegionRelayTarget(['tokyo', 'plan'], q('')), null);
  assert.equal(tripRegionRelayTarget(['orlando', 'plan'], q('lock=a%2F..')), null);
  assert.equal(
    orlandoRelayUrl('calendar', { from: '2026-12-01', to: undefined }),
    '/api/trip-regions/orlando/calendar?from=2026-12-01'
  );
});

test('park and resort names drop what every visitor drops', () => {
  assert.equal(shortParkName("Disney's Animal Kingdom Theme Park"), 'Animal Kingdom');
  assert.equal(shortParkName('Magic Kingdom Park'), 'Magic Kingdom');
  assert.equal(shortParkName('Universal Islands of Adventure'), 'Islands of Adventure');
  assert.equal(shortParkName('Universal Studios Florida'), 'Universal Studios');
  assert.equal(shortParkName('Busch Gardens Tampa Bay'), 'Busch Gardens');
  assert.equal(shortParkName('EPCOT'), 'EPCOT');
  assert.equal(shortGroupName('Walt Disney World Resort'), 'Walt Disney World');
});

test("the API's pick leads its resort, then the shortest waits", () => {
  const day = calendar.days[0];
  const disney = regionResorts(region).find((g) => g.key === 'walt-disney-world');
  const ranked = rankGroupParks(day, disney.parks, disney.key);
  assert.equal(ranked[0].park.slug, day.best['walt-disney-world']);
  const forced = { ...day, best: { 'walt-disney-world': 'epcot' } };
  assert.equal(rankGroupParks(forced, disney.parks, disney.key)[0].park.slug, 'epcot');
});

test('the first answer names a shorter wait that lost to an early close', () => {
  const day = structuredClone(calendar.days[0]);
  const mk = day.parks['magic-kingdom-park'];
  Object.assign(mk, { status: 'OPERATING', headlinerWait: 20, closesEarly: true });
  day.best['walt-disney-world'] = 'disneys-animal-kingdom-theme-park';
  day.bestWhy = { 'walt-disney-world': 'closes_early_elsewhere' };
  const line = glanceLines(day, region).find((l) => l.group.key === 'walt-disney-world');
  assert.equal(line.park.slug, 'disneys-animal-kingdom-theme-park');
  assert.equal(line.earlyElsewhere?.park.slug, 'magic-kingdom-park');
  assert.equal(closesEarly(mk), true);
});

test('a resort with one park that has a figure stays out of the first answer', () => {
  const keys = glanceLines(calendar.days[0], region).map((l) => l.group.key);
  assert.ok(!keys.includes('seaworld-orlando'));
});

test('after every pick has closed, the answer is about tomorrow', () => {
  const today = calendar.days[0].date;
  const morning = Date.parse(`${today}T08:00:00-05:00`);
  const night = Date.parse(`${today}T23:30:00-05:00`);
  assert.equal(glanceDay(calendar, region, today, morning)?.date, today);
  assert.equal(glanceDay(calendar, region, today, night)?.date, calendar.days[1].date);
});

test('a season several parks run is one lane, and a closure is none', () => {
  const lanes = eventLanes(
    calendar,
    region.parks.map((p) => p.slug)
  );
  const names = lanes.map((l) => l.name);
  assert.equal(new Set(names).size, names.length);
  assert.ok(lanes.every((l) => !/refurbishment/i.test(l.name ?? '')));
  const party = lanes.find((l) => l.kind === 'party' && l.parkSlugs.includes('magic-kingdom-park'));
  assert.ok(party && party.dates.length > 0);
});

test('each resort gets its quiet dates from /best-days and its busiest from the calendar', () => {
  const summaries = resortMonthSummaries(region, calendar, bestDays);
  const disney = summaries.find((s) => s.group.key === 'walt-disney-world');
  assert.equal(disney.quiet.length, 3);
  assert.equal(disney.busy.length, 2);
  assert.ok(disney.busy[0].wait >= disney.quiet[0].wait);
});

test('the client gets only the legs from a hotel', () => {
  const slim = slimRegion(region);
  assert.ok(slim.travel.legs.length > 0);
  assert.ok(
    slim.travel.legs.every((l) => l.from.startsWith('hotel:') || l.to.startsWith('hotel:'))
  );
});

test('a trip window prints as one short range', () => {
  // `Intl` puts thin spaces around the dash; compare the words.
  const plain = (s) => s.replace(/\s+/gu, ' ');
  assert.equal(plain(formatWindow({ from: '2027-01-12', to: '2027-01-21' }, 'en')), 'Jan 12 – 21');
  assert.equal(
    plain(formatWindow({ from: '2027-04-27', to: '2027-05-06' }, 'en')),
    'Apr 27 – May 6'
  );
  assert.match(
    formatWindow({ from: '2027-01-12', to: '2027-01-21' }, 'de'),
    /^12\.\s?[–-]\s?21\. Jan/
  );
});

test('a day without published hours keeps its figure and its mark; a closed day has none', () => {
  const unknown = {
    status: 'UNKNOWN',
    hoursPublished: false,
    crowdLevel: 'low',
    basis: 'long_range',
    headlinerWait: 40,
  };
  assert.equal(isRankable(unknown), true);
  assert.equal(hoursUnpublished(unknown), true);
  assert.equal(isRankable({ ...unknown, status: 'CLOSED' }), false);
  assert.equal(isRankable({ ...unknown, headlinerWait: undefined }), false);
});

test('a flat year is said, a real low is not', () => {
  const week = (start, w) => ({ start, headlinerWait: w, basis: 'forecast' });
  const flat = [
    '2027-01-04',
    '2027-01-11',
    '2027-01-18',
    '2027-01-25',
    '2027-02-01',
    '2027-02-08',
    '2027-02-15',
  ].map((d) => week(d, 32));
  assert.deepEqual(flatStretch([...flat, week('2027-02-22', 45)], '2027-01-11'), {
    from: '2027-01-04',
    to: '2027-02-21',
    minutes: 32,
  });
  assert.equal(
    flatStretch(
      [week('2027-01-04', 45), week('2027-01-11', 32), week('2027-01-18', 45)],
      '2027-01-11'
    ),
    null
  );
});

console.log(`\n${passed} passed`);
