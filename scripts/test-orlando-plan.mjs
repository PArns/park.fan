/**
 * Unit tests for the Orlando trip planner's pure modules (`lib/orlando/plan*.ts`): the URL form a
 * link from Parky, "Copy link" and the best-time pages share, the edits (steppers, pins, swaps),
 * which codes become which sentence, the savings line, the `.ics` file, the Week and Month views'
 * geometry, and the When mode's ranges and request.
 *
 * Run: pnpm test:orlando-plan
 */

import {
  DEFAULT_PLAN_STATE,
  normalizePlanState,
  orlandoPlannerHref,
  readPlanQuery,
  writePlanQuery,
} from '../lib/orlando/plan-query.ts';
import {
  findLeg,
  parkDaysAvailable,
  planProblem,
  planRequestQuery,
  planWindow,
  reserveTripDays,
  setFindMode,
  setParkVisits,
  stepVisits,
  swapLocks,
  toggleLock,
  chooseHotel,
  effectiveHotel,
} from '../lib/orlando/plan.ts';
import {
  dayMarker,
  dayWarnings,
  editCost,
  lastYearReach,
  planSavings,
  primaryReason,
  runnerUp,
  unplacedParks,
} from '../lib/orlando/plan-copy.ts';
import { buildTripIcs, icsEscape, icsFold, icsLocalDateTime } from '../lib/orlando/plan-ics.ts';
import {
  hoursLessThanUsual,
  parkInitials,
  parkMinuteOf,
  swapPreview,
  tripCanvas,
  tripColumnGrid,
  tripDaySpans,
  tripMonthWeeks,
  weekPages,
} from '../lib/orlando/plan-week.ts';
import {
  holidayRegionsFor,
  percentBelowAverage,
  weekTiers,
  whenPeriodOf,
  whenPeriods,
  whenRequestQuery,
  windowReasons,
} from '../lib/orlando/plan-when.ts';
import { PlanRequestError, fetchTripPlan, retryPlanRequest } from '../lib/orlando/plan-fetch.ts';

const cases = [];
const test = (name, actual, expected) => cases.push({ name, actual, expected });
const q = (s) => new URLSearchParams(s);
const HEAD = ['magic-kingdom-park', 'epcot', 'universal-epic-universe'];
const ORDER = [...HEAD, 'disneys-typhoon-lagoon-water-park'];
const keys = { parks: new Set(ORDER), areas: new Set(['disney', 'universal']) };

// ── 1. The URL form ─────────────────────────────────────────────────────────
{
  const s = readPlanQuery(
    q(
      'from=2026-11-28&to=2026-12-06&parks=magic-kingdom-park:2,epcot&hotel=disney&area=disney&blocks=0&fireworks=want&rest=max:3&hop=1&split=fixed&lock=epcot@2026-12-01,rest@2026-12-02'
    ),
    keys
  );
  test(
    'every /plan name is read',
    [
      s.from,
      s.to,
      s.parks,
      s.hotel,
      s.area,
      s.blocks,
      s.fireworks,
      s.rest,
      s.hop,
      s.split,
      s.locks.length,
    ],
    [
      '2026-11-28',
      '2026-12-06',
      [
        { slug: 'magic-kingdom-park', visits: 2 },
        { slug: 'epcot', visits: null },
      ],
      'disney',
      'disney',
      false,
      'want',
      'max:3',
      true,
      'fixed',
      2,
    ]
  );
  test(
    'and written back in the API order, readable',
    writePlanQuery(s),
    'from=2026-11-28&to=2026-12-06&parks=magic-kingdom-park:2,epcot&hotel=disney&area=disney&blocks=0&fireworks=want&rest=max:3&hop=1&split=fixed&lock=epcot@2026-12-01,rest@2026-12-02'
  );
  test('the untouched state writes nothing', writePlanQuery(DEFAULT_PLAN_STATE), '');
  test(
    'defaults are left out',
    writePlanQuery({ ...DEFAULT_PLAN_STATE, from: '2026-11-28', to: '2026-11-30' }),
    'from=2026-11-28&to=2026-11-30'
  );
  test(
    'Parky’s parties=avoid reads as fireworks=any and is never written',
    [
      readPlanQuery(q('from=2026-11-28&to=2026-11-30&parties=avoid')).fireworks,
      writePlanQuery(readPlanQuery(q('from=2026-11-28&to=2026-11-30&parties=avoid'))),
    ],
    ['any', 'from=2026-11-28&to=2026-11-30']
  );
  const bad = readPlanQuery(
    q(
      'from=2026-02-31&to=2026-03-02&parks=nope,epcot:9,epcot:2&hotel=castle&rest=max:0&lock=epcot@2026-13-01'
    ),
    keys
  );
  test(
    'a bad value costs only itself',
    [bad.from, bad.parks, bad.hotel, bad.rest, bad.locks],
    [null, [{ slug: 'epcot', visits: 3 }], null, 'auto', []]
  );
  test(
    'a pin outside the trip or on a park not chosen goes',
    normalizePlanState({
      ...DEFAULT_PLAN_STATE,
      from: '2026-11-28',
      to: '2026-11-30',
      parks: [{ slug: 'epcot', visits: null }],
      locks: [
        { target: 'epcot', date: '2026-12-05' },
        { target: 'magic-kingdom-park', date: '2026-11-29' },
        { target: 'rest', date: '2026-11-30' },
      ],
    }).locks,
    [{ target: 'rest', date: '2026-11-30' }]
  );
  const when = readPlanQuery(
    q('when=2027-01-01_2027-11-12&days=12&within=DE-NW&parks=epcot'),
    keys
  );
  test(
    'the When mode is read',
    [when.when, when.days, when.within, when.from],
    [{ from: '2027-01-01', to: '2027-11-12' }, 12, 'DE-NW', null]
  );
  test(
    'and written as when=<from>_<to>&days&within',
    writePlanQuery(when),
    'when=2027-01-01_2027-11-12&days=12&within=DE-NW&parks=epcot'
  );
  test(
    'a trip length is clamped to 3–21',
    [
      readPlanQuery(q('when=2027-01-01_2027-02-01&days=40')).days,
      readPlanQuery(q('when=2027-01-01_2027-02-01&days=1')).days,
    ],
    [21, 3]
  );
  test(
    'given dates win over a search',
    readPlanQuery(q('from=2026-11-28&to=2026-11-30&when=2027-01-01_2027-02-01')).when,
    null
  );
  test(
    'orlandoPlannerHref, plan mode',
    orlandoPlannerHref({
      from: '2026-12-01',
      to: '2026-12-07',
      parks: ['epcot', { slug: 'magic-kingdom-park', visits: 2 }],
      hotel: 'disney',
    }),
    '/orlando?from=2026-12-01&to=2026-12-07&parks=epcot,magic-kingdom-park:2&hotel=disney#planner'
  );
  test(
    'orlandoPlannerHref, When mode on a month page',
    orlandoPlannerHref(
      { when: { from: '2027-03-01', to: '2027-05-31' }, days: 10, within: 'NL-north' },
      '/orlando/2027/3'
    ),
    '/orlando/2027/3?when=2027-03-01_2027-05-31&days=10&within=NL-north#planner'
  );
}

// ── 2. Edits and trip arithmetic ────────────────────────────────────────────
{
  test(
    'auto sits between one and two',
    [
      stepVisits(null, 1, 'auto'),
      stepVisits(null, -1, 'auto'),
      stepVisits(1, -1, 'auto'),
      stepVisits(3, 1, 'auto'),
      stepVisits(null, 1, 'fixed'),
    ],
    [2, 1, 0, 3, 2]
  );
  const first = setParkVisits(
    DEFAULT_PLAN_STATE,
    'disneys-typhoon-lagoon-water-park',
    null,
    ORDER,
    HEAD
  );
  test(
    'the first edit makes the headliners explicit, in region order',
    first.parks.map((p) => p.slug),
    ORDER
  );
  test(
    '0 removes a park',
    setParkVisits(first, 'epcot', 0, ORDER, HEAD)
      .parks.map((p) => p.slug)
      .includes('epcot'),
    false
  );
  const trip = { ...DEFAULT_PLAN_STATE, from: '2026-11-28', to: '2026-12-01' };
  test('free travel days are not park days', parkDaysAvailable(trip), 2);
  test(
    'a park pinned to the arrival day makes it one',
    parkDaysAvailable({ ...trip, locks: [{ target: 'epcot', date: '2026-11-28' }] }),
    3
  );
  test('too many visits is caught before the API', planProblem(trip, HEAD), 'too_many_visits');
  test('park hopping makes room', planProblem({ ...trip, hop: true }, HEAD), null);
  test('no request without dates', planRequestQuery(DEFAULT_PLAN_STATE, HEAD), null);
  test(
    'a Disney hotel brings its area',
    chooseHotel(DEFAULT_PLAN_STATE, 'disney', keys.areas).area,
    'disney'
  );
  test('the area means its hotel', effectiveHotel({ hotel: null, area: 'universal' }), 'universal');
  const a = {
    date: '2026-11-29',
    kind: 'park',
    parks: [{ slug: 'epcot', part: 'full' }],
    reasons: [],
    warnings: [],
  };
  const b = { date: '2026-11-30', kind: 'rest', parks: [], reasons: [], warnings: [] };
  test('a swap pins both days the other way round', swapLocks(trip, a, b), [
    { target: 'rest', date: '2026-11-29' },
    { target: 'epcot', date: '2026-11-30' },
  ]);
  test('a lock toggles', toggleLock(toggleLock(trip, a), a).locks, []);
  test(
    'a leg is found either way',
    findLeg([{ from: 'epcot', to: 'hotel:disney', minutes: 9 }], 'hotel:disney', 'epcot')?.minutes,
    9
  );
  const finding = setFindMode({ ...trip, locks: [{ target: 'rest', date: '2026-11-30' }] }, true, {
    from: '2026-11-12',
    to: '2027-11-12',
  });
  test(
    'finding keeps the length, drops dates and pins',
    [finding.from, finding.days, finding.locks],
    [null, 4, []]
  );
  test(
    'planning a window leaves the search',
    [
      planWindow(finding, { from: '2027-01-12', to: '2027-01-21' }).when,
      planWindow(finding, { from: '2027-01-12', to: '2027-01-21' }).from,
    ],
    [null, '2027-01-12']
  );
  const region = [
    {
      slug: 'epcot',
      name: 'EPCOT',
      path: '/parks/north-america/united-states/orlando/epcot',
      timezone: 'America/New_York',
    },
  ];
  test('reserve: each park day with its geography', reserveTripDays({ days: [a, b] }, region), [
    {
      park: {
        slug: 'epcot',
        name: 'EPCOT',
        geo: { continent: 'north-america', country: 'united-states', city: 'orlando' },
        timezone: 'America/New_York',
      },
      date: '2026-11-29',
    },
  ]);
}

// ── 3. Codes and sentences ──────────────────────────────────────────────────
{
  const day = (over) => ({
    date: '2026-11-29',
    kind: 'park',
    parks: [{ slug: 'magic-kingdom-park', part: 'full' }],
    reasons: [],
    warnings: [],
    ...over,
  });
  test(
    'the one-line reason is the most telling known code',
    primaryReason(day({ reasons: ['weekday', 'brand_new_code', 'quietest_in_window'] })),
    'quietest_in_window'
  );
  test('an unknown code is never said', primaryReason(day({ reasons: ['brand_new_code'] })), null);
  test(
    'both spellings of a back-to-back repeat read as one',
    dayWarnings(day({ warnings: ['adjacent_repeat', 'repeat_back_to_back'] })),
    ['repeat_back_to_back']
  );
  test(
    'an early close is the day’s marker',
    dayMarker(day({ closesEarly: true, perks: ['early_entry'] })),
    'closes'
  );
  test(
    'a party code is an early close too',
    dayMarker(day({ warnings: ['party_night_short_hours'] })),
    'closes'
  );
  test('otherwise the hotel’s early slot', dayMarker(day({ perks: ['early_entry'] })), 'early');
  test(
    'saving in minutes per ride',
    planSavings({
      headlinerWait: 41,
      averageDayWait: 47,
      savedMinutesPerRide: 6,
      expectedError: 8,
      orderMatters: true,
      parkDays: 7,
      restDays: 1,
      visits: 7,
    }),
    { kind: 'saving', planned: 41, average: 47, saved: 6, expectedError: 8 }
  );
  test(
    'orderMatters false says the order barely matters',
    planSavings({
      headlinerWait: 45,
      averageDayWait: 46,
      savedMinutesPerRide: 1,
      orderMatters: false,
      parkDays: 7,
      restDays: 1,
      visits: 7,
    }).kind,
    'flat'
  );
  test('no saving without figures', planSavings({ parkDays: 0, restDays: 0, visits: 0 }), null);
  test(
    'the forecast reaches a last-year day as far ahead as its horizon',
    lastYearReach([day({ date: '2027-06-10', basis: 'last_year' })], '2027-05-12', '2026-11-12'),
    { first: '2027-06-10', reach: '2026-12-11' }
  );
  test(
    'runner-up and its cost',
    runnerUp(
      { alternatives: [{ date: '2026-12-02' }, { date: '2026-12-03', headlinerWait: 50 }] },
      45
    ),
    { date: '2026-12-03', wait: 50, delta: 5 }
  );
  test('the pins’ cost per ride', editCost({ headlinerWait: 41.4 }, { headlinerWait: 43.2 }), {
    best: 41,
    current: 43,
    delta: 2,
  });
  test(
    'an unknown unplaced reason is dropped',
    unplacedParks({
      unplaced: [
        { slug: 'x', reason: 'odd' },
        { slug: 'y', reason: 'no_day_left' },
      ],
    }),
    [{ slug: 'y', reason: 'no_day_left' }]
  );
}

// ── 4. The calendar file ────────────────────────────────────────────────────
{
  test('text is escaped', icsEscape('a,b;c\\d\ne'), 'a\\,b\\;c\\\\d\\ne');
  const long = `SUMMARY:${'é'.repeat(60)}`;
  test(
    'lines fold at 75 octets',
    icsFold(long)
      .split('\r\n')
      .every((l) => new TextEncoder().encode(l).length <= 75),
    true
  );
  test(
    'a park-local instant on Orlando’s clock',
    icsLocalDateTime('2026-11-29T09:00:00-05:00'),
    '20261129T090000'
  );
  test('across the DST change', icsLocalDateTime('2027-03-15T09:00:00-04:00'), '20270315T090000');
  const file = buildTripIcs(
    [
      {
        date: '2026-11-29',
        uid: 'a@park.fan',
        summary: 'EPCOT',
        description: ['x'],
        start: '2026-11-29T09:00:00-05:00',
        end: '2026-11-29T21:00:00-05:00',
      },
      { date: '2026-11-30', uid: 'b@park.fan', summary: 'Typhoon Lagoon', description: [] },
    ],
    { now: Date.parse('2026-11-12T12:00:00Z'), calendarName: 'Orlando' }
  );
  test(
    'timed in America/New_York with its zone',
    [
      file.includes('DTSTART;TZID=America/New_York:20261129T090000'),
      file.includes('BEGIN:VTIMEZONE'),
    ],
    [true, true]
  );
  test(
    'all-day without hours, ending the next day',
    [file.includes('DTSTART;VALUE=DATE:20261130'), file.includes('DTEND;VALUE=DATE:20261201')],
    [true, true]
  );
  test('CRLF line ends', file.split('\r\n').length > 10 && !/[^\r]\n/.test(file), true);
}

// ── 5. Week and Month geometry ──────────────────────────────────────────────
{
  const TZ = 'America/New_York';
  test(
    'minutes since the day’s midnight, past midnight running on',
    [
      parkMinuteOf('2026-11-29T09:30:00-05:00', '2026-11-29', TZ),
      parkMinuteOf('2026-11-30T01:00:00-05:00', '2026-11-29', TZ),
    ],
    [570, 1500]
  );
  const cell = (open, close, extra = {}) => ({
    status: 'OPERATING',
    hoursPublished: true,
    opensAt: `2026-11-29T${open}:00-05:00`,
    closesAt: `2026-11-29T${close}:00-05:00`,
    crowdLevel: 'low',
    basis: 'forecast',
    ...extra,
  });
  const calendar = {
    meta: {},
    parks: [],
    seasons: [],
    days: [
      {
        date: '2026-11-29',
        parks: {
          'magic-kingdom-park': cell('09:00', '18:00', {
            early: {
              kind: 'early_entry',
              opensAt: '2026-11-29T08:30:00-05:00',
              closesAt: '2026-11-29T09:00:00-05:00',
            },
            evening: {
              kind: 'ticketed_event',
              opensAt: '2026-11-29T19:00:00-05:00',
              closesAt: '2026-11-30T00:00:00-05:00',
            },
            headlinerWait: 35,
          }),
          epcot: cell('09:00', '21:00', { headlinerWait: 60 }),
        },
      },
      {
        date: '2026-11-30',
        parks: {
          'magic-kingdom-park': {
            ...cell('09:00', '22:00', { headlinerWait: 45 }),
            opensAt: '2026-11-30T09:00:00-05:00',
            closesAt: '2026-11-30T22:00:00-05:00',
          },
          epcot: {
            ...cell('09:00', '21:00', { headlinerWait: 50 }),
            opensAt: '2026-11-30T09:00:00-05:00',
            closesAt: '2026-11-30T21:00:00-05:00',
          },
        },
      },
      {
        date: '2026-12-01',
        parks: {
          'magic-kingdom-park': {
            ...cell('09:00', '22:00', { headlinerWait: 45 }),
            opensAt: '2026-12-01T09:00:00-05:00',
            closesAt: '2026-12-01T22:00:00-05:00',
          },
        },
      },
    ],
  };
  const mk = {
    date: '2026-11-29',
    kind: 'park',
    parks: [{ slug: 'magic-kingdom-park', part: 'full' }],
    perks: [],
    reasons: [],
    warnings: [],
  };
  const [span] = tripDaySpans([mk], calendar, TZ);
  test(
    'a block ends at the day guests’ close, the party hatched after it',
    [span.blocks, span.evening],
    [
      [{ slug: 'magic-kingdom-park', startMin: 540, endMin: 1080 }],
      { kind: 'ticketed_event', startMin: 1140, endMin: 1440 },
    ]
  );
  test('no early stripe unless the hotel gets it', span.early, null);
  test(
    'with the perk, the early stripe',
    tripDaySpans([{ ...mk, perks: ['early_entry'] }], calendar, TZ)[0].early,
    { startMin: 510, endMin: 540 }
  );
  const canvas = tripCanvas([span]);
  test('one canvas, on whole hours with the planner’s pads', canvas, {
    startMin: 480,
    endMin: 1500,
  });
  const grid = tripColumnGrid(span, canvas, 0.6);
  test(
    'the column is a DayGrid of that day on the shared canvas',
    [grid.openMin, grid.closeMin, grid.closeSlackMin, grid.heightPx],
    [540, 1080, 0, 612]
  );
  test(
    'pages of a week',
    weekPages([1, 2, 3, 4, 5, 6, 7, 8, 9], 7).map((p) => p.length),
    [7, 2]
  );
  const weeks = tripMonthWeeks('2026-11-28', '2026-12-06');
  test(
    'the Month view runs Monday to Sunday around the trip',
    [weeks.length, weeks[0][0].date, weeks.at(-1)[6].date, weeks[0][5].inTrip],
    [2, '2026-11-23', '2026-12-06', true]
  );
  test(
    'a party night is hours short of the usual day',
    hoursLessThanUsual(calendar, 'magic-kingdom-park', '2026-11-29', TZ),
    4
  );
  const ep = {
    date: '2026-11-30',
    kind: 'park',
    parks: [{ slug: 'epcot', part: 'full' }],
    reasons: [],
    warnings: [],
  };
  test(
    'a trade off the party night: the minutes, no short day',
    swapPreview(calendar, mk, ep, TZ),
    { kind: 'minutes', delta: 20, short: null }
  );
  const mk30 = { ...mk, date: '2026-11-30' };
  test(
    'a park moved onto its party night carries the hours it loses',
    swapPreview(calendar, mk30, { ...ep, date: '2026-11-29' }, TZ).short,
    { slug: 'magic-kingdom-park', hours: 4 }
  );
  test(
    'closed blocks a swap',
    swapPreview(calendar, ep, { ...mk, date: '2026-12-01' }, TZ).kind,
    'no_figure'
  );
  const names = {
    'Magic Kingdom Park': 'MK',
    EPCOT: 'EP',
    "Disney's Hollywood Studios": 'HS',
    "Disney's Animal Kingdom Theme Park": 'AK',
    "Disney's Typhoon Lagoon Water Park": 'TL',
    'Universal Studios Florida': 'US',
    'Universal Islands of Adventure': 'IA',
    'Universal Epic Universe': 'EU',
    'Universal Volcano Bay': 'VB',
    'SeaWorld Orlando': 'SW',
    'LEGOLAND Florida': 'LE',
    'Busch Gardens Tampa Bay': 'BG',
    'Discovery Cove Orlando': 'DC',
  };
  test('two letters per park', Object.keys(names).map(parkInitials), Object.values(names));
}

// ── 6. The When mode ────────────────────────────────────────────────────────
{
  const periods = whenPeriods('2026-11-12', 10);
  test(
    'the chips: next 12 months, next year and its seasons, clipped to the horizon',
    periods.map((p) => [p.key, p.range.from, p.range.to]),
    [
      ['next12', '2026-11-12', '2027-11-12'],
      ['year', '2027-01-01', '2027-11-12'],
      ['spring', '2027-03-01', '2027-05-31'],
      ['summer', '2027-06-01', '2027-08-31'],
      ['autumn', '2027-09-01', '2027-11-12'],
    ]
  );
  test(
    'a range is its chip, or custom',
    [
      whenPeriodOf({ from: '2027-03-01', to: '2027-05-31' }, periods),
      whenPeriodOf({ from: '2027-03-02', to: '2027-05-31' }, periods),
    ],
    ['spring', 'custom']
  );
  const state = {
    ...DEFAULT_PLAN_STATE,
    when: { from: '2027-01-01', to: '2027-11-12' },
    days: 10,
    within: 'DE-NW',
    parks: [{ slug: 'epcot', visits: 2 }],
    hotel: 'disney',
    locks: [{ target: 'epcot', date: '2027-01-02' }],
  };
  test(
    'the /when request: range, length, region, three windows, the trip options, no pins',
    whenRequestQuery(state),
    {
      from: '2027-01-01',
      to: '2027-11-12',
      days: '10',
      within: 'DE-NW',
      limit: '3',
      parks: 'epcot:2',
      hotel: 'disney',
    }
  );
  test(
    'below average in whole percent, never above',
    [
      percentBelowAverage({ headlinerWait: 38, rangeAverageWait: 52 }),
      percentBelowAverage({ headlinerWait: 55, rangeAverageWait: 52 }),
    ],
    [27, null]
  );
  test(
    'week tiers by share of the period, ties share one',
    weekTiers([
      { headlinerWait: 30 },
      { headlinerWait: 30 },
      { headlinerWait: 50 },
      {},
      { headlinerWait: 70 },
    ]),
    ['very_low', 'very_low', 'high', null, 'very_high']
  );
  test(
    'the reader’s country first',
    [
      holidayRegionsFor('de')[0].country,
      holidayRegionsFor('nl')[0].country,
      holidayRegionsFor('en')[0].country,
    ],
    ['DE', 'NL', 'GB']
  );
  test(
    'an unknown window reason is not said',
    windowReasons({ reasons: ['comet', 'festival', 'no_school_break'] }),
    ['no_school_break', 'festival']
  );
}

// ── 7. Asking the relay ─────────────────────────────────────────────────────
{
  test(
    'a 400 is not retried, a failure twice',
    [
      retryPlanRequest(0, new PlanRequestError('invalid', 400, 'x')),
      retryPlanRequest(1, new PlanRequestError('failed', 502, 'x')),
      retryPlanRequest(2, new Error('x')),
    ],
    [false, true, false]
  );
  const original = globalThis.fetch;
  let asked = '';
  globalThis.fetch = async (url) => {
    asked = String(url);
    return new Response(JSON.stringify({ message: ['to must be a YYYY-MM-DD date'] }), {
      status: 400,
    });
  };
  try {
    await fetchTripPlan({ from: '2026-11-28', to: 'x' });
    test('a 400 throws', false, true);
  } catch (error) {
    test(
      'a 400 is an invalid request with the API’s message',
      [error.kind, error.message],
      ['invalid', 'to must be a YYYY-MM-DD date']
    );
  }
  test(
    'through the same-origin relay',
    asked,
    '/api/trip-regions/orlando/plan?from=2026-11-28&to=x'
  );
  globalThis.fetch = original;
}

// ── Report ───────────────────────────────────────────────────────────────────
let failed = 0;
for (const { name, actual, expected } of cases) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failed++;
  console.log(
    `${ok ? '✅' : '❌'} ${name}${ok ? '' : ` — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`}`
  );
}
console.log(`\n${cases.length - failed}/${cases.length} passed`);
process.exit(failed === 0 ? 0 : 1);
