/**
 * Unit tests for the Orlando hub's pure logic (`lib/trip-regions/*`): the month window and its proxy
 * redirects, the relay's allow-list and the region links' cache window, the shortest-line pick with
 * its early-close clause, the "today or tomorrow" answer, the event lanes, the month summaries, the
 * calendar's weeks with their fragment, each park's quietest day and the spread around a picked
 * day, and the best-time helpers. Fixtures are recorded answers of the API in `scripts/fixtures/orlando/`.
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
  HUB_WEEK_DAYS,
  HUB_WINDOW_DAYS,
  hubWeekFragment,
  hubWeekFromFragment,
  hubWeeks,
  parkWeekEvents,
  yearLine,
  isRankable,
  dayPick,
  glanceDay,
  glanceLines,
  quietestDay,
  rankGroupParks,
  regionResorts,
  sheetLeg,
  sheetShowsDrive,
  resortMonthSummaries,
  shortGroupName,
  shortParkName,
  slimRegion,
  sliceCalendar,
  weatherParks,
  weekMarks,
  withGroupNames,
  factDays,
} from '../lib/trip-regions/hub-data.ts';
import { parseHubPicks, pickHubDay, picksPlanQuery } from '../lib/trip-regions/hub-picks.ts';
import { weatherRuns } from '../lib/utils/day-weather.ts';
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
import { hubTripOf, restorableTrip } from '../lib/trip-regions/hub-trip.ts';
import { pastTrip, planFromToday } from '../lib/trip-regions/trip-dates.ts';
import { DEFAULT_PLAN_STATE, planRequestQuery } from '../lib/trip-regions/plan.ts';
import { TRIP_REGION_CACHE_CONTROL, tripRegionRelayTarget } from '../lib/trip-regions/relay.ts';
import {
  HUB_WEEK_CELL,
  HUB_WEEK_ITEM,
  HUB_WEEK_LAYER,
} from '../components/trip-regions/hub/hub-cell-styles.ts';
import { addDays } from '../lib/utils/park-day.ts';
import { parseVisited, visitedOn } from '../lib/trip-regions/visited-parks.ts';
import { reportPassed, test } from './lib/run-cases.mjs';

const fixture = (name) =>
  JSON.parse(readFileSync(new URL(`./fixtures/orlando/${name}.json`, import.meta.url), 'utf8'));
const region = fixture('region');
const calendar = fixture('calendar');
const bestDays = fixture('best-days');

const NOV = { year: 2026, month: 11 };

test('the year line places months and trips by their share of the range', () => {
  const line = yearLine({ from: '2027-01-01', to: '2027-04-10' }, [
    { from: '2027-01-11', to: '2027-01-20' },
    { from: '2027-04-06', to: '2027-04-15' },
  ]);
  assert.deepEqual(
    line.months.map((m) => m.month),
    ['2027-01', '2027-02', '2027-03', '2027-04']
  );
  assert.equal(line.months[0].left, 0);
  assert.equal(line.months[0].width, 31);
  assert.equal(line.months[3].width, 10);
  assert.deepEqual(line.windows[0], { left: 10, width: 10 });
  // A trip that runs past the range ends with it.
  assert.deepEqual(line.windows[1], { left: 95, width: 5 });
});

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

test('the day pick is never a park that is always quiet', () => {
  const day = structuredClone(calendar.days[0]);
  // SeaWorld, LEGOLAND and Busch Gardens have the shortest lines and the lowest level on the day.
  for (const slug of ['seaworld-orlando', 'legoland-florida', 'busch-gardens-tampa']) {
    assert.equal(day.parks[slug].crowdLevel, 'very_low');
  }
  const pick = dayPick(day, region);
  assert.ok(pick, 'a day with resort picks has a day pick');
  assert.ok(pick.park.headliner, `${pick.park.slug} is a headliner`);
  assert.ok(['walt-disney-world', 'universal-orlando'].includes(pick.group.key));
});

test('the day pick weighs each park against its own normal day before its minutes', () => {
  const day = structuredClone(calendar.days[0]);
  day.best = {
    'walt-disney-world': 'magic-kingdom-park',
    'universal-orlando': 'universal-studios-florida',
  };
  Object.assign(day.parks['magic-kingdom-park'], { headlinerWait: 50, crowdLevel: 'very_low' });
  delete day.parks['magic-kingdom-park'].evening;
  Object.assign(day.parks['universal-studios-florida'], {
    headlinerWait: 35,
    crowdLevel: 'moderate',
  });
  assert.equal(dayPick(day, region)?.park.slug, 'magic-kingdom-park');
  // On the same level the shorter wait wins, and an early close loses to a full day.
  day.parks['universal-studios-florida'].crowdLevel = 'very_low';
  assert.equal(dayPick(day, region)?.park.slug, 'universal-studios-florida');
  day.parks['universal-studios-florida'].closesEarly = true;
  assert.equal(dayPick(day, region)?.park.slug, 'magic-kingdom-park');
});

test('the day pick offers no last-year day and no pick at all without one', () => {
  const day = structuredClone(calendar.days[0]);
  for (const park of Object.values(day.parks)) park.basis = 'last_year';
  assert.equal(dayPick(day, region), null);
  assert.equal(dayPick({ ...calendar.days[0], best: {}, parks: {} }, region), null);
});

test('a park ticked off as visited gives way to one not seen yet', () => {
  const day = structuredClone(calendar.days[0]);
  const first = dayPick(day, region);
  assert.ok(first);
  const next = dayPick(day, region, new Set([first.park.slug]));
  assert.ok(next && next.park.slug !== first.park.slug, 'the tip moves on');
  assert.ok(next.park.headliner, 'and stays a headliner');
  // In the resort row, the group's next headliner takes the ticked park's place.
  const disney = glanceLines(day, region, new Set([day.best['walt-disney-world']])).find(
    (l) => l.group.key === 'walt-disney-world'
  );
  assert.ok(disney && disney.park.slug !== day.best['walt-disney-world']);
  assert.ok(disney.park.headliner);
  // Every headliner ticked off: no tip left, and no resort row.
  const all = new Set(region.parks.filter((p) => p.headliner).map((p) => p.slug));
  assert.equal(dayPick(day, region, all), null);
  assert.deepEqual(glanceLines(day, region, all), []);
});

test('a tick lasts as long as a trip, and a broken one costs only itself', () => {
  const record = parseVisited(
    JSON.stringify({ epcot: '2026-11-18', 'magic-kingdom-park': '2026-10-01', 'bad slug!': 'x' })
  );
  assert.deepEqual(Object.keys(record), ['epcot', 'magic-kingdom-park']);
  assert.deepEqual([...visitedOn(record, '2026-11-20')], ['epcot']);
  assert.deepEqual(parseVisited('not json'), {});
  assert.deepEqual(parseVisited('["epcot"]'), {});
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

test("a park's week draws a party night as a bar on its own columns", () => {
  const lanes = eventLanes(calendar);
  const [first] = hubWeeks(calendar.days);
  const { tracks } = parkWeekEvents(lanes, calendar.days, first, 'magic-kingdom-park');
  const party = tracks[0];
  assert.equal(party.lane.kind, 'party', 'a party comes first');
  assert.deepEqual(party.dates, ['2026-11-12', '2026-11-13', '2026-11-15', '2026-11-17']);
  assert.deepEqual(party.cells.slice(0, 3), [
    { start: true, end: false },
    { start: false, end: true },
    null,
  ]);
  assert.equal(party.startsOn, null, 'a party names its nights, not a first day');
  const holidays = tracks.find((t) => t.lane.name === 'Holidays at Walt Disney World Resort');
  assert.equal(holidays?.startsOn, '2026-11-13');
  assert.equal(holidays.cells[0], null);
});

test('a festival on every open day of the week is one line, and its last week a bar to its end', () => {
  const lanes = eventLanes(calendar);
  const [first, second] = hubWeeks(calendar.days);
  const foodAndWine = 'EPCOT International Food & Wine Festival';
  const week1 = parkWeekEvents(lanes, calendar.days, first, 'epcot');
  assert.deepEqual(
    week1.allWeek.map((l) => l.name),
    [foodAndWine]
  );
  assert.equal(week1.tracks.length, 0);
  const week2 = parkWeekEvents(lanes, calendar.days, second, 'epcot');
  const track = week2.tracks.find((t) => t.lane.name === foodAndWine);
  assert.equal(track?.endsOn, '2026-11-21');
  // It ran the day before the week began, so its bar enters flat.
  assert.deepEqual(track.cells[0], { start: false, end: false });
  assert.deepEqual(track.cells[2], { start: false, end: true });
  assert.equal(track.cells[3], null);
  // A school break belongs to no park.
  assert.ok(
    lanes.filter((l) => l.kind === 'break').every((l) => Object.keys(l.byPark).length === 0)
  );
});

test('a school break is one run of days under its name, and a nameless weekend is none', () => {
  const day = (date, holidays) => ({ date, isSchoolVacation: true, parks: {}, holidays });
  const thanksgiving = ['Thanksgiving break (Orange County Public Schools)', 'Thanksgiving Day'];
  const lanes = eventLanes({
    seasons: [],
    days: [
      day('2026-11-21'),
      day('2026-11-22'),
      day('2026-11-23', thanksgiving.slice(0, 1)),
      day('2026-11-26', thanksgiving),
      { date: '2026-12-01', isSchoolVacation: false, parks: {} },
      day('2026-12-19'),
      day('2026-12-20'),
    ],
  });
  assert.deepEqual(
    lanes.map((l) => [l.kind, l.name, l.dates[0], l.dates.at(-1)]),
    [
      ['break', 'Thanksgiving break', '2026-11-21', '2026-11-23'],
      ['break', 'Thanksgiving break', '2026-11-26', '2026-11-26'],
    ]
  );
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

test('the day sheet credits the drive times only on a day it prints one', () => {
  const day = calendar.days.find((d) => d.parks['universal-volcano-bay']?.status === 'CLOSED');
  assert.equal(
    sheetLeg(region, 'disney', 'universal-volcano-bay', day.parks['universal-volcano-bay']),
    null
  );
  assert.equal(sheetLeg(region, 'disney', 'epcot', { status: 'OPERATING' })?.mode, 'drive');
  assert.equal(sheetShowsDrive(day, region, 'disney'), true);
  const allClosed = {
    ...day,
    parks: Object.fromEntries(Object.keys(day.parks).map((slug) => [slug, { status: 'CLOSED' }])),
  };
  assert.equal(sheetShowsDrive(allClosed, region, 'disney'), false);
  const walksOnly = {
    ...region,
    travel: { ...region.travel, legs: region.travel.legs.map((l) => ({ ...l, mode: 'walk' })) },
  };
  assert.equal(sheetShowsDrive(day, walksOnly, 'disney'), false);
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

test('the hub shows a plan only for a query with both dates in order', () => {
  assert.deepEqual(hubTripOf('from=2026-12-06&to=2026-12-13&hotel=disney'), {
    from: '2026-12-06',
    to: '2026-12-13',
  });
  assert.equal(hubTripOf('when=10&parks=epcot'), null);
  assert.equal(hubTripOf('from=2026-12-06'), null);
  assert.equal(hubTripOf('from=2026-12-13&to=2026-12-06'), null);
  assert.equal(hubTripOf('from=6.12.2026&to=13.12.2026'), null);
});

test('a remembered trip comes back on a bare visit, before it has ended', () => {
  const kept = 'from=2026-12-06&to=2026-12-13';
  assert.equal(restorableTrip('', kept, '2026-11-14'), kept);
  assert.equal(restorableTrip('', kept, '2026-12-13'), kept);
  assert.equal(restorableTrip('', kept, '2026-12-14'), null);
  assert.equal(restorableTrip('parks=epcot', kept, '2026-11-14'), null);
  assert.equal(restorableTrip('', 'when=10', '2026-11-14'), null);
  assert.equal(restorableTrip('', null, '2026-11-14'), null);
});

test('a trip under way comes back, and the planner says so instead of planning it', () => {
  const kept = 'from=2026-12-06&to=2026-12-13';
  const today = '2026-12-07';
  assert.equal(restorableTrip('', kept, today), kept);
  const trip = hubTripOf(kept);
  assert.equal(pastTrip(trip, today), 'started');
  const state = { ...DEFAULT_PLAN_STATE, ...trip };
  const allHeadliners = ['magic-kingdom-park'];
  assert.equal(planRequestQuery(state, allHeadliners, false, { today, allHeadliners }), null);
  assert.equal(planFromToday(state, today).from, today);
});

/** `n` dates from `from`, as the calendar's days carry them. */
const dates = (from, n) => Array.from({ length: n }, (_, i) => ({ date: addDays(from, i) }));

test('the calendar pages the window in weeks from its first day, the last one shorter', () => {
  const weeks = hubWeeks(dates('2026-11-14', HUB_WINDOW_DAYS + 1));
  assert.deepEqual(
    weeks.map((w) => [w.from, w.to, w.start, w.length]),
    [
      ['2026-11-14', '2026-11-20', 0, 7],
      ['2026-11-21', '2026-11-27', 7, 7],
      ['2026-11-28', '2026-12-04', 14, 7],
      ['2026-12-05', '2026-12-11', 21, 7],
      ['2026-12-12', '2026-12-14', 28, 3],
    ]
  );
  assert.deepEqual(hubWeeks([]), []);
  assert.equal(hubWeeks(calendar.days).length, 2);
  // Every page has its show class: the hub's 31 days and a month's 31.
  for (const n of [HUB_WINDOW_DAYS + 1, 31]) {
    const pages = Math.ceil(n / HUB_WEEK_DAYS);
    assert.ok(
      pages <= HUB_WEEK_CELL.length &&
        pages <= HUB_WEEK_ITEM.length &&
        pages <= HUB_WEEK_LAYER.length,
      `${n} days`
    );
  }
  HUB_WEEK_CELL.forEach((cls, i) => assert.ok(cls.includes(`[week=${i}]`)));
  HUB_WEEK_ITEM.forEach((cls, i) => assert.ok(cls.includes(`[week=${i}]`)));
  HUB_WEEK_LAYER.forEach((cls, i) => assert.ok(cls.includes(`[week=${i}]`)));
});

test('a week fragment names its first date and finds the week that holds a date', () => {
  const weeks = hubWeeks(dates('2026-11-14', 31));
  assert.equal(hubWeekFragment(weeks[2]), 'calendar-2026-11-28');
  assert.equal(hubWeekFromFragment('#calendar-2026-11-28', weeks), 2);
  assert.equal(hubWeekFromFragment('calendar-2026-11-28', weeks), 2);
  // Shared a day later, when the pages start a day later: the date still shows.
  assert.equal(hubWeekFromFragment('#calendar-2026-11-27', weeks), 1);
  assert.equal(hubWeekFromFragment('#calendar-2026-12-14', weeks), 4);
  for (const other of [
    '',
    '#calendar',
    '#planner',
    '#calendar-2026-12-15',
    '#calendar-2026-11-13',
  ]) {
    assert.equal(hubWeekFromFragment(other, weeks), null, other);
  }
  assert.equal(hubWeekFromFragment('#calendar-28.11.2026', weeks), null);
});

/** A park's day for the star's rules: open, a figure, hours from 09:00 to `close`. */
const parkDay = (
  date,
  wait,
  { close = '21:00', basis = 'forecast', shown, status = 'OPERATING' } = {}
) => ({
  date,
  parks: {
    p: {
      status,
      hoursPublished: true,
      crowdLevel: 'low',
      basis,
      headlinerWait: wait,
      ...(shown !== undefined && { forecastWait: shown }),
      opensAt: `${date}T09:00:00-05:00`,
      closesAt: `${date}T${close}:00-05:00`,
    },
  },
});

test("a park's star is its quietest day of the week, one for every park with an open day", () => {
  const a = '2026-11-14';
  const b = '2026-11-15';
  const c = '2026-11-16';
  assert.equal(quietestDay([parkDay(a, 40), parkDay(b, 30), parkDay(c, 45)], 'p'), b);
  // One rounded headliner wait: the lower printed figure.
  assert.equal(quietestDay([parkDay(a, 30, { shown: 28 }), parkDay(b, 30, { shown: 26 })], 'p'), b);
  // The same figure, a longer day: that one; the same day too: the earlier date.
  assert.equal(quietestDay([parkDay(a, 30, { close: '18:00' }), parkDay(b, 30)], 'p'), b);
  assert.equal(quietestDay([parkDay(a, 30), parkDay(b, 30), parkDay(c, 45)], 'p'), a);
  // Never on a higher printed figure than another day's.
  assert.equal(quietestDay([parkDay(a, 30, { shown: 40 }), parkDay(b, 35, { shown: 35 })], 'p'), b);
  // Never a last-year or a closed day; a lone open day is the week's quietest.
  assert.equal(quietestDay([parkDay(a, 20, { basis: 'last_year' }), parkDay(b, 30)], 'p'), b);
  assert.equal(quietestDay([parkDay(a, 20, { status: 'CLOSED' }), parkDay(b, 30)], 'p'), b);
  assert.equal(quietestDay([parkDay(a, 20, { basis: 'last_year' })], 'p'), null);
  assert.equal(quietestDay([parkDay(a, 20)], 'p'), a);
  assert.equal(quietestDay([parkDay(a, 20)], 'unknown-park'), null);
  // The fixture's Magic Kingdom: 40 on six days, the 16th the longest of them (09:00–23:00).
  assert.equal(quietestDay(calendar.days.slice(0, 7), 'magic-kingdom-park'), '2026-11-16');
  assert.equal(quietestDay(calendar.days.slice(7), 'magic-kingdom-park'), '2026-11-19');
});

/** A day of several parks for the spread: each slug's figure, every park open 09:00–21:00. */
const parksDay = (date, waits) => ({
  date,
  parks: Object.fromEntries(
    Object.entries(waits).map(([slug, wait]) => [slug, parkDay(date, wait).parks.p])
  ),
});

test('a press switches a day for a park: several days a park, a second press takes one back', () => {
  const week = ['2026-11-23', '2026-11-24', '2026-11-25'];
  const today = '2026-11-23';
  let picks = pickHubDay({}, 'dl', week[0], today);
  assert.deepEqual(picks, { [week[0]]: 'dl' });
  // Another day of the same park adds it: two days at Disneyland.
  picks = pickHubDay(picks, 'dl', week[1], today);
  assert.deepEqual(picks, { [week[0]]: 'dl', [week[1]]: 'dl' });
  // Another park takes a date over, the park keeps its other day.
  picks = pickHubDay(picks, 'dca', week[1], today);
  assert.deepEqual(picks, { [week[0]]: 'dl', [week[1]]: 'dca' });
  // A picked day pressed again goes; a past date goes with the write.
  picks = pickHubDay(
    { '2026-11-20': 'dl', [week[0]]: 'dl', [week[2]]: 'dl' },
    'dl',
    week[2],
    today
  );
  assert.deepEqual(picks, { [week[0]]: 'dl' });
  assert.deepEqual(pickHubDay({ [week[2]]: 'dl' }, 'dl', week[2], today), {});
  // A broken stored value costs only itself.
  assert.deepEqual(parseHubPicks('{"2026-11-23":"dl","x":"dl","2026-11-24":"Bad Slug"}'), {
    '2026-11-23': 'dl',
  });
  assert.deepEqual(parseHubPicks('nope'), {});
});

test('a picked day spreads the other parks over the free days, a planned park keeps its star', () => {
  const dates = ['2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26'];
  // Every park is quietest on the 24th.
  const days = [
    parksDay(dates[0], { a: 30, b: 40, c: 35 }),
    parksDay(dates[1], { a: 20, b: 20, c: 20 }),
    parksDay(dates[2], { a: 25, b: 40, c: 25 }),
    parksDay(dates[3], { a: 40, b: 25, c: 45 }),
  ];
  const weeks = hubWeeks(days);
  const marks = (picks, skip) =>
    Object.fromEntries(
      [...weekMarks(days, weeks, ['a', 'b', 'c'], picks, skip)].map(([slug, [m]]) => [slug, m])
    );
  const mark = (picked, star) => ({ picked, star });
  // Without a pick every star is the park's own quietest day, shared or not.
  assert.deepEqual(marks({}), {
    a: mark([], dates[1]),
    b: mark([], dates[1]),
    c: mark([], dates[1]),
  });
  // `a` on the 23rd: `b` and `c` each get a day of their own, the least above their best; `a`
  // keeps its star on its best free day, where a second visit would be quietest.
  assert.deepEqual(marks({ [dates[0]]: 'a' }), {
    a: mark([dates[0]], dates[1]),
    b: mark([], dates[1]),
    c: mark([], dates[2]),
  });
  // The pick on the shared quietest day: each moves to its own quietest free day.
  assert.deepEqual(marks({ [dates[1]]: 'a' }), {
    a: mark([dates[1]], dates[2]),
    b: mark([], dates[3]),
    c: mark([], dates[2]),
  });
  // A park ticked off as visited claims no day and keeps its quietest free one.
  assert.deepEqual(marks({ [dates[0]]: 'a' }, new Set(['c'])), {
    a: mark([dates[0]], dates[1]),
    b: mark([], dates[1]),
    c: mark([], dates[1]),
  });
  // `a` planned twice: both its days are taken, the others spread over what is left.
  assert.deepEqual(marks({ [dates[0]]: 'a', [dates[1]]: 'a' }), {
    a: mark([dates[0], dates[1]], dates[2]),
    b: mark([], dates[3]),
    c: mark([], dates[2]),
  });
  // More parks than free days: the one left over keeps its quietest free day.
  const two = days.slice(0, 2);
  const left = weekMarks(two, hubWeeks(two), ['a', 'b', 'c'], { [dates[0]]: 'a' });
  assert.deepEqual(
    ['b', 'c'].map((slug) => left.get(slug)[0]),
    [mark([], dates[1]), mark([], dates[1])]
  );
});

test('the picks go to the trip planner as a plan: dates, visits and locked days', () => {
  const parks = new Set(['magic-kingdom-park', 'epcot', 'hollywood-studios']);
  const query = picksPlanQuery(
    {
      '2026-11-20': 'epcot', // before today
      '2026-11-24': 'magic-kingdom-park',
      '2026-11-26': 'epcot',
      '2026-11-27': 'magic-kingdom-park',
      '2026-11-28': 'universal-studios-florida', // not a park of the region
    },
    parks,
    '2026-11-23'
  );
  const q = new URLSearchParams(query);
  assert.equal(q.get('from'), '2026-11-24');
  assert.equal(q.get('to'), '2026-11-27');
  assert.equal(
    q.get('lock'),
    'magic-kingdom-park@2026-11-24,epcot@2026-11-26,magic-kingdom-park@2026-11-27'
  );
  assert.match(q.get('parks'), /magic-kingdom-park/);
  assert.match(q.get('parks'), /epcot/);
  assert.doesNotMatch(q.get('parks'), /hollywood/);
  assert.equal(picksPlanQuery({}, parks, '2026-11-23'), null);
  // A trip runs at most three weeks: a pick past that stays out.
  const long = new URLSearchParams(
    picksPlanQuery({ '2026-11-24': 'epcot', '2026-12-20': 'epcot' }, parks, '2026-11-23')
  );
  assert.equal(long.get('to'), '2026-11-24');
});

test("a resort's weather is its first park's, a day trip's each park's own", () => {
  const parks = weatherParks(region);
  assert.ok(parks.has('magic-kingdom-park'));
  assert.ok(!parks.has('epcot'));
  for (const slug of ['legoland-florida', 'busch-gardens-tampa', 'adventure-island-tampa']) {
    assert.ok(parks.has(slug), slug);
  }
});

test('the slice keeps the weather of those parks only, and of it the drawn fields', () => {
  const weather = {
    tempMax: 24.2,
    tempMin: 13.1,
    icon: 3,
    basis: 'climate_normal',
    tempMaxP25: 22.4,
    tempMaxP75: 26.1,
    wetDayPercent: 20,
    precipitationMm: 2,
  };
  const day = {
    ...calendar.days[0],
    parks: Object.fromEntries(
      Object.entries(calendar.days[0].parks).map(([slug, p]) => [slug, { ...p, weather }])
    ),
  };
  const sliced = sliceCalendar(calendar, [day], weatherParks(region)).days[0].parks;
  // An average keeps what its cell draws: no icon, no low.
  assert.deepEqual(sliced['magic-kingdom-park'].weather, {
    basis: 'climate_normal',
    tempMax: 24.2,
    tempMaxP25: 22.4,
    tempMaxP75: 26.1,
  });
  assert.equal(sliced.epcot.weather, undefined);
  assert.ok(sliced['busch-gardens-tampa'].weather);
  assert.equal(
    sliceCalendar(calendar, [day]).days[0].parks['magic-kingdom-park'].weather,
    undefined
  );
});

test("a week's averages share one cell with their envelope; a forecast and a week break never join", () => {
  const normal = (p25, p75) => ({
    basis: 'climate_normal',
    tempMax: (p25 + p75) / 2,
    tempMaxP25: p25,
    tempMaxP75: p75,
  });
  const forecast = { basis: 'forecast', tempMax: 20, tempMin: 10, icon: 1 };
  const runs = weatherRuns([
    forecast,
    forecast,
    normal(8.2, 12.1),
    normal(7.9, 11.8),
    normal(7.4, 11.6),
    undefined,
    normal(7.4, 11.6),
  ]);
  assert.deepEqual(
    runs.map((r) => [r.start, r.length]),
    [
      [0, 1],
      [1, 1],
      [2, 3],
      [5, 1],
      [6, 1],
    ]
  );
  // The joined cell says the envelope: the lowest lower quartile to the highest upper one.
  assert.equal(runs[2].weather.tempMaxP25, 7.4);
  assert.equal(runs[2].weather.tempMaxP75, 12.1);
  assert.equal(runs[0].weather, forecast);
  // Seven averages split where the row pages to the next week.
  const week = Array.from({ length: 7 }, () => normal(8, 12));
  assert.deepEqual(
    weatherRuns(week, (i) => i === 4).map((r) => r.length),
    [4, 3]
  );
  // Without a range the envelope runs from the lowest to the highest mean high.
  const [plain] = weatherRuns([
    { basis: 'climate_normal', tempMax: 17.2 },
    { basis: 'climate_normal', tempMax: 15.9 },
  ]);
  assert.equal(plain.length, 2);
  assert.equal(plain.weather.tempMaxP25, 15.9);
  assert.equal(plain.weather.tempMaxP75, 17.2);
});

reportPassed();
