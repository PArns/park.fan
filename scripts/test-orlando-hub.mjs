/**
 * Unit tests for the Orlando hub's pure logic (`lib/trip-regions/*`): the month window and its proxy
 * redirects, the relay's allow-list and the region links' cache window, the shortest-line pick with
 * its early-close clause, the "today or tomorrow" answer, the event lanes, the month summaries and
 * the best-time helpers. Fixtures are recorded answers of the API in `scripts/fixtures/orlando/`.
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
  withGroupNames,
  factDays,
} from '../lib/trip-regions/hub-data.ts';
import {
  isTripRegionMonthInRange,
  parseTripRegionMonth,
  tripRegionBestTimePath,
  tripRegionMonthHref,
  tripRegionMonths,
  tripRegionPath,
  tripRegionRelayUrl,
} from '../lib/trip-regions/paths.ts';
import { tripRegionRedirect } from '../lib/trip-regions/redirects.ts';
import { flatStretch } from '../lib/trip-regions/best-time.ts';
import { breakFacts, isoWeekday, usualHours, weekdayFacts } from '../lib/trip-regions/hub-facts.ts';
import { TRIP_REGION_CACHE_CONTROL, tripRegionRelayTarget } from '../lib/trip-regions/relay.ts';

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
  const months = tripRegionMonths(NOV);
  assert.equal(months.length, 12);
  assert.deepEqual(months[0], NOV);
  assert.deepEqual(months[11], { year: 2027, month: 10 });
  assert.equal(isTripRegionMonthInRange({ year: 2027, month: 11 }, NOV), false);
  assert.equal(isTripRegionMonthInRange({ year: 2026, month: 10 }, NOV), false);
});

test('the current month links as the hub, every other month as itself', () => {
  assert.equal(tripRegionMonthHref('orlando', 'de', NOV, NOV), '/orlando');
  assert.equal(
    tripRegionMonthHref('orlando', 'de', { year: 2026, month: 12 }, NOV),
    '/orlando/2026/12'
  );
  assert.equal(tripRegionPath('orlando', 'de'), '/orlando');
});

test('month segments parse, and a padded or foreign one does not serve', () => {
  assert.deepEqual(parseTripRegionMonth(undefined, NOV), { month: null, padded: false });
  assert.deepEqual(parseTripRegionMonth(['2027', '3'], NOV), {
    month: { year: 2027, month: 3 },
    padded: false,
  });
  assert.equal(parseTripRegionMonth(['2027', '03'], NOV).padded, true);
  assert.equal(parseTripRegionMonth(['2028', '3'], NOV), 'invalid');
  assert.equal(parseTripRegionMonth(['beste-reisezeit', 'disney-world'], NOV), 'invalid');
});

test('the proxy sends a padded month on, and a month out of range to the hub', () => {
  assert.equal(tripRegionRedirect('/de/orlando/2027/03', NOV), '/de/orlando/2027/3');
  assert.equal(tripRegionRedirect('/de/orlando/2028/3', NOV), '/de/orlando');
  assert.equal(tripRegionRedirect('/de/orlando/2027/3', NOV), null);
  assert.equal(tripRegionRedirect('/xx/orlando/2027/03', NOV), null);
});

test('a best-time path under /orlando is never treated as a month', () => {
  assert.equal(tripRegionRedirect('/de/orlando/beste-reisezeit/disney-world', NOV), null);
  assert.equal(tripRegionRedirect('/en/orlando/best-time-to-visit/universal-orlando', NOV), null);
  assert.equal(tripRegionBestTimePath('orlando', 'de'), '/orlando/beste-reisezeit');
  assert.equal(
    tripRegionBestTimePath('orlando', 'en', 'disney-world'),
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
  assert.equal(
    tripRegionRelayTarget(
      ['orlando', 'plan'],
      q(
        'from=2027-02-06&to=2027-02-20&tickets=wdw-date-based.4.h?@2027-02-07&hopper=universal-orlando&blocks=1'
      )
    )?.apiPath,
    '/v1/trip-regions/orlando/plan?from=2027-02-06&to=2027-02-20&tickets=wdw-date-based.4.h%3F%402027-02-07&hopper=universal-orlando&blocks=1'
  );
  assert.equal(
    tripRegionRelayTarget(['orlando', 'when'], q('tickets=wdw-uk-14-day-magic'))?.route,
    'when'
  );
  assert.equal(tripRegionRelayTarget(['orlando', 'plan'], q('foo=1')), null);
  assert.equal(tripRegionRelayTarget(['orlando', 'calendar'], q('parks=epcot')), null);
  assert.equal(
    tripRegionRelayTarget(['orlando', 'when'], q('within=DE-NW&days=10'))?.forecast,
    true
  );
  assert.equal(tripRegionRelayTarget(['orlando'], q(''))?.forecast, false);
  assert.equal(tripRegionRelayTarget(['tokyo', 'plan'], q('')), null);
  // Every region the registry lists passes, live or not: the admin's ticket page reads its parks.
  assert.equal(tripRegionRelayTarget(['paris'], q(''))?.apiPath, '/v1/trip-regions/paris');
  assert.equal(tripRegionRelayTarget(['orlando', 'plan'], q('lock=a%2F..')), null);
  assert.equal(
    tripRegionRelayUrl('orlando', 'calendar', { from: '2026-12-01', to: undefined }),
    '/api/trip-regions/orlando/calendar?from=2026-12-01'
  );
});

test('the browser reads the region links on the window next.config gives their path', () => {
  const route = readFileSync(
    new URL('../app/api/nav/trip-regions/route.ts', import.meta.url),
    'utf8'
  );
  const config = readFileSync(new URL('../next.config.ts', import.meta.url), 'utf8');
  assert.match(route, /cdnCacheHeaders\(TRIP_REGION_CACHE_CONTROL\)/);
  const at = config.indexOf("source: '/api/nav/trip-regions'");
  assert.ok(at > 0);
  const rule = config.slice(at);
  assert.equal(/sharedCache\('([^']+)'\)/.exec(rule)?.[1], TRIP_REGION_CACHE_CONTROL);
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

test("the day trips take the reader's word, a resort keeps its own name", () => {
  const named = withGroupNames(region, 'Tagesausflüge');
  assert.equal(named.groups.find((g) => g.kind === 'day_trip')?.name, 'Tagesausflüge');
  assert.equal(
    named.groups.find((g) => g.key === 'walt-disney-world')?.name,
    'Walt Disney World Resort'
  );
  assert.equal(region.groups.find((g) => g.kind === 'day_trip')?.name, 'Day trips');
});

test('a day trip of one park keeps its own name, so two never share a filter label', () => {
  const lone = {
    ...region,
    groups: [
      ...region.groups,
      { key: 'legoland-only', name: 'LEGOLAND Florida', kind: 'day_trip' },
    ],
    parks: region.parks.map((p) =>
      p.slug === 'legoland-florida' ? { ...p, group: 'legoland-only' } : p
    ),
  };
  const named = withGroupNames(lone, 'Tagesausflüge');
  assert.equal(named.groups.find((g) => g.key === 'legoland-only')?.name, 'LEGOLAND Florida');
  assert.equal(named.groups.find((g) => g.key === 'day-trips')?.name, 'Tagesausflüge');
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

test('the first answer names each group with a headliner park, and no other', () => {
  const keys = glanceLines(calendar.days[0], region).map((l) => l.group.key);
  assert.ok(keys.includes('walt-disney-world') && keys.includes('universal-orlando'));
  assert.ok(!keys.includes('seaworld-orlando'), 'SeaWorld Orlando has no headliner');
  assert.ok(!keys.includes('day-trips'));
});

test('a headliner group of one park is answered by that park', () => {
  const day = structuredClone(calendar.days[0]);
  const lone = {
    ...region,
    groups: [
      ...region.groups,
      { key: 'lone', name: 'Universal Studios Hollywood', kind: 'day_trip' },
    ],
    parks: region.parks.map((p) =>
      p.slug === 'busch-gardens-tampa' ? { ...p, group: 'lone', headliner: true } : p
    ),
  };
  Object.assign(day.parks['busch-gardens-tampa'], { status: 'OPERATING', headlinerWait: 25 });
  const line = glanceLines(day, lone).find((l) => l.group.key === 'lone');
  assert.equal(line?.park.slug, 'busch-gardens-tampa');
  assert.equal(line?.day.headlinerWait, 25);
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

test('a weekday answer needs two days behind each of five weekdays', () => {
  // The fixture's 14 days give every weekday two days.
  const facts = weekdayFacts(calendar, region);
  assert.ok(facts);
  assert.equal(facts.lastYear, false);
  assert.ok(facts.quiet.every((w) => w.minutes === facts.quiet[0].minutes));
  assert.ok(facts.busy[0].minutes >= facts.quiet[0].minutes);
  assert.equal(facts.flat, facts.busy[0].minutes === facts.quiet[0].minutes);
  assert.ok(facts.quiet.every((w) => w.minutes % 5 === 0));
  const week = { ...calendar, days: calendar.days.slice(0, 7) };
  assert.equal(weekdayFacts(week, region), null);
  assert.equal(isoWeekday('2026-11-15'), 7);
  assert.equal(isoWeekday('2026-11-16'), 1);
});

test('a month past the forecast answers from last year, and says so', () => {
  const lastYear = {
    ...calendar,
    days: calendar.days.map((d) => ({
      ...d,
      parks: Object.fromEntries(
        Object.entries(d.parks).map(([slug, p]) => [
          slug,
          { ...p, basis: p.basis === 'none' ? 'none' : 'last_year' },
        ])
      ),
    })),
  };
  assert.equal(factDays(lastYear).lastYear, true);
  assert.equal(factDays(lastYear).days.length, calendar.days.length);
  assert.equal(factDays(calendar).lastYear, false);
  assert.equal(weekdayFacts(lastYear, region)?.lastYear, true);
});

test("each headliner park's usual hours are its most common day guests' hours", () => {
  const hours = usualHours(calendar, region);
  const mk = hours.find((h) => h.park.slug === 'magic-kingdom-park');
  assert.ok(mk);
  assert.ok(mk.days <= mk.of && mk.days > 0);
  assert.ok(hours.every((h) => h.park.headliner));
  const counts = new Map();
  for (const day of calendar.days) {
    const own = day.parks['magic-kingdom-park'];
    if (own?.status !== 'OPERATING' || !own.hoursPublished) continue;
    const key = `${own.opensAt.slice(11, 16)}-${own.closesAt.slice(11, 16)}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  assert.equal(mk.days, Math.max(...counts.values()));
});

test('school breaks run as named stretches, holidays by name, with the waits on them', () => {
  const facts = breakFacts(calendar, region);
  assert.ok(facts);
  assert.ok(facts.breaks.length > 0);
  assert.ok(facts.breaks.every((run) => run.name && run.from <= run.to));
  const none = {
    ...calendar,
    days: calendar.days.map((d) => ({ ...d, isSchoolVacation: false, isHoliday: false })),
  };
  assert.equal(breakFacts(none, region), null);
  const holiday = {
    ...none,
    days: none.days.map((d, i) =>
      i === 3 ? { ...d, isHoliday: true, holidays: ['Thanksgiving Day'] } : d
    ),
  };
  assert.deepEqual(breakFacts(holiday, region)?.holidays, [
    { name: 'Thanksgiving Day', dates: [calendar.days[3].date] },
  ]);
  // On a break day the break comes first and the holiday after it.
  const both = {
    ...none,
    days: none.days.map((d, i) =>
      i >= 2 && i <= 4
        ? {
            ...d,
            isSchoolVacation: true,
            isHoliday: i === 2,
            holidays:
              i === 2 ? ['Winter break (District)', 'New Year’s Day'] : ['Winter break (District)'],
          }
        : d
    ),
  };
  const facts2 = breakFacts(both, region);
  assert.equal(facts2?.breaks[0].name, 'Winter break');
  assert.deepEqual(
    facts2?.holidays.map((h) => h.name),
    ['New Year’s Day']
  );
});

console.log(`\n${passed} passed`);
