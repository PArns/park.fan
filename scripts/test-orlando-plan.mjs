/**
 * Unit tests for the trip planner's pure modules (`lib/trip-regions/plan*.ts`): the URL form a
 * link from Parky, "Copy link" and the best-time pages share, the edits (steppers, pins, swaps),
 * which codes become which sentence, the savings line, the `.ics` file, the Week and Month views'
 * geometry, the When mode's ranges and request, and tickets: `tickets=` read and written, the
 * catalog's windows, the step's drafts, and what the answer's ticket fields say; and the links
 * other pages build into the planner, with the search's match on a region's name.
 *
 * Run: pnpm test:orlando-plan
 */

import {
  DEFAULT_PLAN_STATE,
  normalizePlanState,
  plannerHrefOn,
  planRegionKeys,
  readPlanQuery,
  writePlanQuery,
} from '../lib/trip-regions/plan-query.ts';
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
  setBaseArea,
  setBaseNights,
  setMoveBuffer,
  fixedNights,
  swapLocks,
  toggleLock,
  chooseHotel,
  effectiveHotel,
  tripHotelKinds,
} from '../lib/trip-regions/plan.ts';
import {
  autoSplit,
  climateChips,
  eveningReasons,
  dayMarker,
  dayWarnings,
  editCost,
  lastYearStart,
  planDayLastYear,
  planSavings,
  primaryReason,
  runnerUp,
  unplacedParks,
  parksLeftOut,
} from '../lib/trip-regions/plan-copy.ts';
import {
  buildTripIcs,
  icsEscape,
  icsFold,
  icsLocalDateTime,
} from '../lib/trip-regions/plan-ics.ts';
import {
  dateLevel,
  dayBandPieces,
  hoursLessThanUsual,
  parkCode,
  parkCodeKey,
  parkInitials,
  parkLabel,
  parkMinuteOf,
  shownDayWait,
  shownTotals,
  shownWait,
  shownWaitOn,
  swapPreview,
  tripCanvas,
  tripColumnGrid,
  tripDaySpans,
  tripMonthWeeks,
  weekPages,
} from '../lib/trip-regions/plan-week.ts';
import {
  calendarResorts,
  dateParties,
  datePicks,
  defaultCalendarMode,
  isNewYearsEve,
  modePick,
  monthEvents,
  stormCodeOn,
  stormSignal,
  weatherNotesOn,
} from '../lib/trip-regions/date-facts.ts';
import { formatGridHours } from '../lib/planner/park-time.ts';
import {
  holidayRegionsFor,
  percentBelowAverage,
  rankedLower,
  weekTiers,
  monthSearchRange,
  whenPeriodOf,
  whenPeriods,
  whenRequestQuery,
  windowReasons,
} from '../lib/trip-regions/plan-when.ts';
import {
  findTripRegion,
  findTripRegions,
  matchTripRegion,
  plannerLinkRel,
  regionParksOf,
  tripPlannerHref,
  tripRegionLinks,
} from '../lib/trip-regions/trip-links.ts';
import { existsSync } from 'node:fs';
import {
  gatewayChoices,
  monthStayCells,
  stayBandRuns,
  stayHalves,
  staySections,
} from '../lib/trip-regions/plan-stays.ts';
import { requireTripRegion, TRIP_REGIONS } from '../lib/trip-regions/registry.ts';
import { tripRegionGuidePath } from '../lib/trip-regions/paths.ts';
import {
  PlanRequestError,
  fetchTripPlan,
  retryPlanRequest,
} from '../lib/trip-regions/plan-fetch.ts';
import {
  adoptSuggestions,
  draftTicket,
  entryMarket,
  linkMarket,
  marketLabel,
  ticketHomeMarket,
  hopperGains,
  hopperResorts,
  isEveryDayTicket,
  longStayTickets,
  needsConnectedHop,
  orderTicketLinks,
  ownedUse,
  ticketLinkAttributes,
  ticketStoreName,
  visitorCountry,
  visitorMarket,
  setTickets,
  ticketCatalog,
  ticketDayOf,
  ticketDraft,
  ticketEntries,
  ticketProblem,
  ticketWindow,
  toggleHopper,
  tripFromTickets,
  rollingFortnightAt,
} from '../lib/trip-regions/plan-tickets.ts';
import { readTickets, writeTicketItem } from '../lib/trip-regions/plan-query.ts';
import { suggestionGroups } from '../lib/trip-regions/plan-tickets.ts';
import {
  hostProp,
  sellerProp,
  ticketLinkClickProps,
  ticketModeOf,
  trackTripEvent,
  tripDaysBucket,
  tripPlanFailedProps,
  tripPlanRequestProps,
  tripPlanShownProps,
  tripOptionChanges,
  leftOutBucket,
  tripWhenShownProps,
} from '../lib/trip-regions/plan-analytics.ts';
import { onSiteEvent } from '../lib/analytics/site-analytics.ts';

const ORLANDO = requireTripRegion('orlando');
const STEP = ORLANDO.tickets;

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
    'plannerHrefOn, plan mode',
    plannerHrefOn('/orlando', {
      from: '2026-12-01',
      to: '2026-12-07',
      parks: ['epcot', { slug: 'magic-kingdom-park', visits: 2 }],
      hotel: 'disney',
    }),
    '/orlando?from=2026-12-01&to=2026-12-07&parks=epcot,magic-kingdom-park:2&hotel=disney#planner'
  );
  test(
    'plannerHrefOn, When mode on a month page',
    plannerHrefOn('/orlando/2027/3', {
      when: { from: '2027-03-01', to: '2027-05-31' },
      days: 10,
      within: 'NL-north',
    }),
    '/orlando/2027/3?when=2027-03-01_2027-05-31&days=10&within=NL-north#planner'
  );
}

// ── 2. Edits and trip arithmetic ────────────────────────────────────────────
{
  test(
    '“1–2 days” sits between one and two, and the stepper never removes a park',
    [
      stepVisits(null, 1, 'auto'),
      stepVisits(null, -1, 'auto'),
      stepVisits(1, -1, 'auto'),
      stepVisits(1, 1, 'auto'),
      stepVisits(2, -1, 'auto'),
      stepVisits(3, 1, 'auto'),
      stepVisits(null, 1, 'fixed'),
      stepVisits(2, -1, 'fixed'),
    ],
    [2, 1, 1, null, null, 3, 2, 1]
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
  test(
    'more parks than days is planned: the API leaves out what does not fit',
    planProblem(trip, HEAD),
    null
  );
  const pinned = {
    ...trip,
    parks: [
      { slug: 'magic-kingdom-park', visits: 2 },
      { slug: 'epcot', visits: 2 },
    ],
  };
  test(
    'pinned repeat visits over the days are caught before the API',
    planProblem(pinned, HEAD),
    'too_many_visits'
  );
  test('park hopping makes room', planProblem({ ...pinned, hop: true }, HEAD), null);
  test('no request without dates', planRequestQuery(DEFAULT_PLAN_STATE, HEAD), null);
  test(
    'a Disney hotel brings its area',
    chooseHotel(DEFAULT_PLAN_STATE, 'disney', keys.areas, ORLANDO.hotels).area,
    'disney'
  );
  test(
    'the area means its hotel',
    effectiveHotel({ hotel: null, area: 'universal' }, ORLANDO.hotels),
    'universal'
  );
  test(
    'the Disney Springs Resort Area plans with its own hotels, not off-site',
    effectiveHotel({ hotel: null, area: 'disney_springs' }, ORLANDO.hotels),
    'disney_springs'
  );
  test(
    'the API’s hotel kinds keep the registry’s areas, and a new one has none',
    tripHotelKinds(
      {
        hotels: [
          { key: 'disney', perks: ['early_entry'] },
          { key: 'partner', perks: [] },
        ],
      },
      ORLANDO.hotels
    ),
    [{ key: 'disney', area: 'disney' }, { key: 'partner' }]
  );
  test(
    'without the API’s kinds the registry’s stand',
    tripHotelKinds({}, ORLANDO.hotels),
    ORLANDO.hotels
  );
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
  test(
    'reserve: a park is filed by the name the plan calls it',
    reserveTripDays({ days: [{ ...a, parks: [{ slug: 'ioa', part: 'full' }] }] }, [
      {
        ...region[0],
        slug: 'ioa',
        name: 'Universal Islands of Adventure',
        path: '/parks/north-america/united-states/orlando/universal-islands-of-adventure',
      },
    ]).map((d) => d.park.name),
    ['Islands of Adventure']
  );
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
    'the saving is the difference of the two printed figures',
    planSavings({
      headlinerWait: 44.4,
      averageDayWait: 48.6,
      savedMinutesPerRide: 4.2,
      parkDays: 7,
      restDays: 1,
      visits: 7,
    }),
    { kind: 'saving', planned: 44, average: 49, saved: 5, expectedError: null }
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
    'a plan says once from which day it reads last year',
    lastYearStart(
      [
        day({ date: '2027-01-11', basis: 'forecast' }),
        day({ date: '2027-01-12', basis: 'last_year' }),
        day({ date: '2027-01-13', basis: 'last_year' }),
      ],
      planDayLastYear
    ),
    { from: '2027-01-12', all: false }
  );
  test(
    'a plan wholly after the forecast’s days is all last year',
    lastYearStart([day({ date: '2027-06-10', basis: 'last_year' })], planDayLastYear),
    { from: '2027-06-10', all: true }
  );
  test(
    'a forecast plan says nothing about last year',
    lastYearStart([day({ date: '2026-12-01', basis: 'forecast' })], planDayLastYear),
    null
  );
  test('a last-year day is no overview marker', dayMarker(day({ basis: 'last_year' })), null);
  {
    const cell = { basis: 'forecast', headlinerWait: 55, forecastWait: 45, lastYearWait: 60 };
    test('a forecast day shows the forecast the park page shows', shownWait(cell), 45);
    test(
      'a last-year day shows the measured day it is ranked by',
      shownWait({ basis: 'last_year', headlinerWait: 60, forecastWait: 40 }),
      60
    );
    test(
      'without the unscaled forecast the ranked figure stands',
      shownWait({ basis: 'forecast', headlinerWait: 55 }),
      55
    );
    const calendar = {
      days: [{ date: '2026-12-02', parks: { epcot: { status: 'OPERATING', ...cell } } }],
    };
    test(
      'a plan day reads its figure off the trip’s calendar',
      shownDayWait(
        { date: '2026-12-02', kind: 'park', parks: [{ slug: 'epcot' }], headlinerWait: 55 },
        calendar
      ),
      45
    );
    test(
      'a day the calendar does not hold keeps the plan’s figure',
      shownWaitOn(calendar, 'epcot', '2026-12-03', 50),
      50
    );
    const cellOf = (forecastWait) => ({
      status: 'OPERATING',
      basis: 'forecast',
      headlinerWait: forecastWait + 5,
      forecastWait,
    });
    const trip = {
      days: [
        { date: '2026-12-01', parks: { epcot: cellOf(50) } },
        { date: '2026-12-02', parks: { epcot: cellOf(40) } },
        { date: '2026-12-03', parks: { epcot: { status: 'CLOSED', basis: 'none' } } },
      ],
    };
    const planned = {
      days: [
        { date: '2026-12-01', kind: 'arrival', parks: [] },
        { date: '2026-12-02', kind: 'park', parks: [{ slug: 'epcot' }], headlinerWait: 45 },
        { date: '2026-12-03', kind: 'departure', parks: [] },
      ],
    };
    test('the line under the plan adds up with the days it shows', shownTotals(planned, trip), {
      headlinerWait: 40,
      averageDayWait: 45,
      savedMinutesPerRide: 5,
    });
    test(
      'a calendar of other dates gives no shown totals',
      shownTotals({ days: [{ ...planned.days[1], date: '2027-01-02' }] }, trip),
      null
    );
    test(
      'the shown saving rounds to nothing, the line says the order barely matters',
      planSavings({
        headlinerWait: 40.2,
        averageDayWait: 40.6,
        savedMinutesPerRide: 0.4,
        orderMatters: true,
        parkDays: 1,
        restDays: 0,
        visits: 1,
      }).kind,
      'flat'
    );
  }
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
  const dayOf = (slug) => ({ date: '2027-01-24', kind: 'park', parks: [{ slug, part: 'full' }] });
  test(
    'an unknown unplaced reason is dropped, a lost repeat visit is its own sentence',
    unplacedParks({
      unplaced: [
        { slug: 'x', reason: 'odd' },
        { slug: 'y', reason: 'no_day_left' },
      ],
      days: [dayOf('y')],
    }),
    [{ slug: 'y', reason: 'no_second_day' }]
  );
  test(
    'a park with no day at all is left out, not unplaced',
    [
      parksLeftOut({ unplaced: [{ slug: 'epcot', reason: 'no_day_left' }], days: [dayOf('y')] }),
      unplacedParks({ unplaced: [{ slug: 'epcot', reason: 'no_day_left' }], days: [dayOf('y')] }),
    ],
    [['epcot'], []]
  );
  test(
    'the API’s own list wins',
    parksLeftOut({
      parksLeftOut: [
        { park: 'epcot', reason: 'no_day_left' },
        { park: 'x', reason: 'no_open_day' },
      ],
      unplaced: [],
      days: [],
    }),
    ['epcot']
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
    icsLocalDateTime('2026-11-29T09:00:00-05:00', 'America/New_York'),
    '20261129T090000'
  );
  test(
    'across the DST change',
    icsLocalDateTime('2027-03-15T09:00:00-04:00', 'America/New_York'),
    '20270315T090000'
  );
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
    { now: Date.parse('2026-11-12T12:00:00Z'), calendarName: 'Orlando', timeZone: ORLANDO.timezone }
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
  const d19 = {
    date: '2026-11-19',
    parks: {
      'magic-kingdom-park': {
        status: 'OPERATING',
        headlinerWait: 35,
        closesEarly: true,
        crowdLevel: 'low',
        basis: 'forecast',
      },
      'disneys-animal-kingdom-theme-park': {
        status: 'OPERATING',
        headlinerWait: 45,
        crowdLevel: 'low',
        basis: 'forecast',
      },
      'universal-islands-of-adventure': {
        status: 'OPERATING',
        headlinerWait: 40,
        crowdLevel: 'low',
        basis: 'forecast',
      },
    },
  };
  {
    const cell = (crowdLevel, status = 'OPERATING') => ({
      status,
      headlinerWait: 40,
      crowdLevel,
      basis: 'forecast',
    });
    const day = {
      ...d19,
      parks: {
        a: cell('low'),
        b: cell('high'),
        c: cell('moderate'),
        d: cell('very_high', 'CLOSED'),
        e: cell('unknown'),
      },
    };
    test(
      'a date is tinted by the median level of its open headliners',
      dateLevel(day, ['a', 'b', 'c', 'd', 'e']),
      'moderate'
    );
    test('an even count takes the lower middle', dateLevel(day, ['a', 'b']), 'low');
  }
  test('a date without a level has no tint', dateLevel(undefined, []), null);
  test('two letters per park', Object.keys(names).map(parkInitials), Object.values(names));
}

// ── 5b. The date grid's facts and the Month view's band ──────────────────────
{
  const park = (slug, name, group) => ({ slug, name, group, type: 'theme_park', headliner: true });
  const region = {
    slug: 'orlando',
    groups: [
      { key: 'wdw', name: 'Walt Disney World Resort', kind: 'resort' },
      { key: 'uo', name: 'Universal Orlando Resort', kind: 'resort' },
      { key: 'sw', name: 'SeaWorld Orlando', kind: 'resort' },
    ],
    parks: [
      park('magic-kingdom-park', 'Magic Kingdom Park', 'wdw'),
      park('disneys-animal-kingdom-theme-park', "Disney's Animal Kingdom Theme Park", 'wdw'),
      park('universal-studios-florida', 'Universal Studios Florida', 'uo'),
      park('universal-islands-of-adventure', 'Universal Islands of Adventure', 'uo'),
      park('seaworld-orlando', 'SeaWorld Orlando', 'sw'),
    ],
  };
  const open = (wait, level, extra = {}) => ({
    status: 'OPERATING',
    hoursPublished: true,
    crowdLevel: level,
    headlinerWait: wait,
    basis: 'forecast',
    opensAt: '2026-12-01T09:00:00-05:00',
    closesAt: '2026-12-01T21:00:00-05:00',
    ...extra,
  });
  const partyNight = {
    closesAt: '2026-12-01T18:00:00-05:00',
    closesEarly: true,
    dayGuestCloseAt: '2026-12-01T18:00:00-05:00',
    evening: {
      kind: 'ticketed_event',
      opensAt: '2026-12-01T19:00:00-05:00',
      closesAt: '2026-12-02T00:00:00-05:00',
    },
    seasons: ['mvmcp'],
  };
  const day = {
    date: '2026-12-01',
    isHoliday: false,
    isSchoolVacation: false,
    best: {
      wdw: 'disneys-animal-kingdom-theme-park',
      uo: 'universal-studios-florida',
      sw: 'seaworld-orlando',
    },
    bestWhy: { wdw: 'closes_early_elsewhere', uo: 'shortest_wait', sw: 'shortest_wait' },
    parks: {
      'magic-kingdom-park': open(40, 'low', partyNight),
      'disneys-animal-kingdom-theme-park': open(45, 'low'),
      'universal-studios-florida': open(30, 'low', {
        status: 'UNKNOWN',
        hoursPublished: false,
        opensAt: undefined,
        closesAt: undefined,
      }),
      'universal-islands-of-adventure': open(40, 'moderate'),
      'seaworld-orlando': open(35, 'low'),
    },
  };
  const calendar = {
    days: [day],
    seasons: [
      {
        id: 'mvmcp',
        parkSlug: 'magic-kingdom-park',
        kind: 'christmas',
        name: "Mickey's Very Merry Christmas Party",
        startDate: '2026-11-08',
        endDate: '2026-12-22',
        dates: ['2026-12-01'],
        status: 'confirmed',
        separateTicket: true,
      },
    ],
  };
  const picks = datePicks(day, region, calendar);
  test(
    'a pick per resort, SeaWorld included',
    picks.map((p) => [p.group.key, p.park.slug]),
    [
      ['wdw', 'disneys-animal-kingdom-theme-park'],
      ['uo', 'universal-studios-florida'],
      ['sw', 'seaworld-orlando'],
    ]
  );
  test(
    'the switch offers the resorts with a headliner',
    calendarResorts({
      ...region,
      parks: region.parks.map((p) => ({ ...p, headliner: p.group !== 'sw' })),
    }).map((r) => r.key),
    ['wdw', 'uo']
  );
  test(
    'overall: the shortest peak wait of the switch’s resorts; a resort: its own pick',
    [
      modePick(picks, 'all', ['wdw', 'uo'])?.park.slug,
      modePick(picks, 'wdw', ['wdw', 'uo'])?.park.slug,
      modePick(picks, 'all', ['wdw'])?.park.slug,
      modePick([], 'all', ['wdw', 'uo']),
    ],
    [
      'universal-studios-florida',
      'disneys-animal-kingdom-theme-park',
      'disneys-animal-kingdom-theme-park',
      null,
    ]
  );
  {
    const headlined = {
      ...region,
      parks: region.parks.map((p) => ({ ...p, headliner: p.group !== 'sw' })),
    };
    test(
      'the switch starts on the one resort the parks, else the tickets, lie in',
      [
        defaultCalendarMode(headlined, null, []),
        defaultCalendarMode(
          headlined,
          ['magic-kingdom-park', 'disneys-animal-kingdom-theme-park'],
          ['uo']
        ),
        defaultCalendarMode(headlined, ['magic-kingdom-park', 'universal-studios-florida'], ['uo']),
        defaultCalendarMode(headlined, null, ['uo', 'uo']),
        defaultCalendarMode(headlined, null, ['wdw', 'uo']),
        defaultCalendarMode(headlined, ['seaworld-orlando'], []),
      ],
      ['all', 'wdw', 'uo', 'uo', 'all', 'all']
    );
  }
  test(
    'the pick names the quieter park that closes early, and its resort’s party',
    [picks[0].earlyElsewhere?.park.slug, picks[0].party?.season?.name, picks[0].party?.leaveAt],
    ['magic-kingdom-park', "Mickey's Very Merry Christmas Party", '2026-12-01T18:00:00-05:00']
  );
  test(
    'a pick without published hours says so',
    picks.map((p) => p.hoursUnpublished),
    [false, true, false]
  );
  test(
    'an evening after a normal close is no party night',
    dateParties(
      {
        ...day,
        parks: {
          'magic-kingdom-park': open(40, 'low', {
            evening: { kind: 'ticketed_event', opensAt: 'x', closesAt: 'y' },
          }),
        },
      },
      region
    ),
    []
  );
  test(
    'New Year’s Eve is the date',
    [isNewYearsEve('2026-12-31'), isNewYearsEve('2027-01-01')],
    [true, false]
  );
  {
    // The API's `weather` as the region sends it (docs/frontend/trip-regions.md).
    const orlando = {
      storm: {
        kind: 'hurricane',
        from: '06-01',
        to: '11-30',
        peak: { from: '08-15', to: '10-15' },
      },
    };
    const japan = {
      storm: { kind: 'typhoon', from: '06-01', to: '11-30', peak: { from: '09-01', to: '10-15' } },
      notes: [{ kind: 'rainy_season', from: '06-06', to: '07-19' }],
    };
    const on = (weather, dates) => dates.map((date) => stormCodeOn(date, weather));
    test(
      'the storm season by the API’s dates, both ends in, the peak inside it',
      on(orlando, [
        '2027-05-31',
        '2027-06-01',
        '2027-08-14',
        '2027-08-15',
        '2027-09-10',
        '2027-10-15',
        '2027-10-16',
        '2027-11-30',
        '2027-12-01',
      ]),
      [
        null,
        'hurricane_season',
        'hurricane_season',
        'hurricane_peak',
        'hurricane_peak',
        'hurricane_peak',
        'hurricane_season',
        'hurricane_season',
        null,
      ]
    );
    test(
      'Japan’s typhoons by their own peak; Paris and California have no storm season',
      [
        ...on(japan, ['2027-08-31', '2027-09-01']),
        stormCodeOn('2027-09-10', { climatePark: 'disneyland-park' }),
        stormCodeOn('2027-09-10', undefined),
      ],
      ['typhoon_season', 'typhoon_peak', null, null]
    );
    test(
      'a season across New Year counts from its start to its end',
      on({ storm: { kind: 'typhoon', from: '12-01', to: '02-28' } }, [
        '2026-11-30',
        '2026-12-24',
        '2027-01-15',
        '2027-03-01',
      ]),
      [null, 'typhoon_season', 'typhoon_season', null]
    );
    test(
      'the peak is the solid segment, the rest of the season the dashed one',
      ['hurricane_peak', 'hurricane_season', 'typhoon_peak', 'typhoon_season'].map(stormSignal),
      ['stormPeak', 'storm', 'stormPeak', 'storm']
    );
    test(
      'Japan’s rainy season is a note on its dates, Orlando has none',
      [
        weatherNotesOn('2027-06-05', japan),
        weatherNotesOn('2027-06-06', japan),
        weatherNotesOn('2027-07-19', japan),
        weatherNotesOn('2027-07-20', japan),
        weatherNotesOn('2027-06-20', orlando),
      ],
      [[], ['rainy_season'], ['rainy_season'], [], []]
    );
  }

  const month = {
    days: ['2026-12-30', '2026-12-31', '2027-01-01'].map((date) => ({
      date,
      isHoliday: false,
      isSchoolVacation: date !== '2027-01-01',
      holidays: date !== '2027-01-01' ? ['Winter break (Orange County Public Schools)'] : [],
      parks: {
        'magic-kingdom-park': {
          ...open(40, 'low'),
          seasons: date === '2026-12-31' ? ['nye-mk', 'hol'] : ['hol'],
        },
        'universal-studios-florida': {
          ...open(40, 'low'),
          seasons: date === '2026-12-31' ? ['nye-us'] : [],
        },
      },
    })),
    seasons: [
      {
        id: 'hol',
        parkSlug: 'magic-kingdom-park',
        kind: 'christmas',
        name: 'Holidays',
        startDate: '2026-11-13',
        endDate: '2027-01-06',
        status: 'confirmed',
        separateTicket: false,
      },
      {
        id: 'nye-mk',
        parkSlug: 'magic-kingdom-park',
        kind: 'special_event',
        name: "New Year's Eve at Magic Kingdom",
        startDate: '2026-12-31',
        endDate: '2026-12-31',
        status: 'confirmed',
        separateTicket: false,
      },
      {
        id: 'nye-us',
        parkSlug: 'universal-studios-florida',
        kind: 'special_event',
        name: "New Year's Eve at Universal Orlando",
        startDate: '2026-12-31',
        endDate: '2026-12-31',
        status: 'announced',
        separateTicket: false,
      },
    ],
  };
  test(
    'the month’s events: seasons cut to the month, the break as one run, every New Year’s Eve evening one row',
    monthEvents(month, '2026-12', ['magic-kingdom-park', 'universal-studios-florida']).map((e) => [
      e.kind,
      e.name,
      e.dates,
      e.wholeMonth,
    ]),
    [
      ['festival', 'Holidays', ['2026-12-30', '2026-12-31'], true],
      ['break', 'Winter break', ['2026-12-30', '2026-12-31'], true],
      ['nye', null, ['2026-12-31'], false],
    ]
  );
  test(
    'an unnamed weekend joins the break after it; a public holiday is its own row',
    monthEvents(
      {
        days: [
          ['2026-12-19', true, false, []],
          ['2026-12-20', true, false, []],
          ['2026-12-21', true, false, ['Winter break (Orange County Public Schools)']],
          [
            '2026-12-25',
            true,
            true,
            ['Winter break (Orange County Public Schools)', 'Christmas Day'],
          ],
        ].map(([date, isSchoolVacation, isHoliday, holidays]) => ({
          date,
          isSchoolVacation,
          isHoliday,
          holidays,
          parks: {},
        })),
        seasons: [],
      },
      '2026-12',
      []
    ).map((e) => [e.kind, e.name, e.dates[0], e.dates.at(-1)]),
    [
      ['break', 'Winter break', '2026-12-19', '2026-12-21'],
      ['break', 'Winter break', '2026-12-25', '2026-12-25'],
      ['holiday', 'Christmas Day', '2026-12-25', '2026-12-25'],
    ]
  );
  test(
    'a season at a park the visitor does not consider stays out',
    monthEvents(month, '2026-12', ['universal-studios-florida']).map((e) => e.kind),
    ['break', 'nye']
  );

  test(
    'a curated code wins over the initials',
    [parkCode({ name: 'Tokyo Disneyland', code: 'DL' }), parkCode({ name: 'Magic Kingdom Park' })],
    ['DL', 'MK']
  );
  {
    const short = { 'universal-studios-florida': 'Studios', 'universal-epic-universe': 'Epic' };
    const label = (slug, name, room) => parkLabel({ slug, name }, short, room);
    test(
      'a short name where it fits: four letters in a phone cell, any in a wide one',
      [
        label('universal-epic-universe', 'Universal Epic Universe', 'tight'),
        label('universal-studios-florida', 'Universal Studios Florida', 'tight'),
        label('universal-studios-florida', 'Universal Studios Florida', 'wide'),
        label('magic-kingdom-park', 'Magic Kingdom Park', 'wide'),
      ],
      ['Epic', 'US', 'Studios', 'MK']
    );
  }
  {
    const socal = [
      ['disneyland-park', 'Disneyland Park'],
      ['disney-california-adventure-park', 'Disney California Adventure Park'],
      ['universal-studios-hollywood', 'Universal Studios Hollywood'],
      ['knotts-berry-farm', "Knott's Berry Farm"],
      ['six-flags-magic-mountain', 'Six Flags Magic Mountain'],
      ['seaworld-san-diego', 'SeaWorld San Diego'],
      ['legoland-california', 'LEGOLAND California'],
      ['sesame-place-san-diego', 'Sesame Place San Diego'],
    ].map(([slug, name]) =>
      parkLabel({ slug, name }, requireTripRegion('southern-california').parkShortNames, 'tight')
    );
    test(
      'Southern California’s parks read as visitors shorten them, each code its own',
      [socal, new Set(socal).size],
      [['DL', 'DCA', 'USH', 'KBF', 'SFMM', 'SW', 'LE', 'SP'], 8]
    );
  }
  test(
    'the code key: the shown parks once, in the region’s order',
    parkCodeKey(
      region.parks,
      ['universal-studios-florida', 'magic-kingdom-park', 'magic-kingdom-park'],
      (p) => p.name
    ),
    [
      { slug: 'magic-kingdom-park', code: 'MK', name: 'Magic Kingdom Park' },
      { slug: 'universal-studios-florida', code: 'US', name: 'Universal Studios Florida' },
    ]
  );

  const canvas = { startMin: 420, endMin: 1440 };
  test(
    'the band: early slot, park, the plan’s evening, in percent of the canvas',
    dayBandPieces(
      {
        date: '2026-12-13',
        kind: 'park',
        blocks: [{ slug: 'ak', startMin: 480, endMin: 1080 }],
        early: { startMin: 450, endMin: 480 },
        evening: null,
        hopAt: null,
        night: { kind: 'hop', target: 'hs', startMin: 1097, endMin: 1260, travelMinutes: 17 },
      },
      canvas
    ),
    [
      { kind: 'early', slug: null, left: 2.9, width: 2.9 },
      { kind: 'park', slug: 'ak', left: 5.9, width: 58.8 },
      { kind: 'hop', slug: 'hs', left: 66.4, width: 16 },
    ]
  );
  test(
    'a party evening is drawn where the plan has no evening of its own',
    dayBandPieces(
      {
        date: '2026-12-01',
        kind: 'park',
        blocks: [{ slug: 'mk', startMin: 540, endMin: 1080 }],
        early: null,
        evening: { kind: 'ticketed_event', startMin: 1140, endMin: 1440 },
        hopAt: null,
        night: null,
      },
      canvas
    ).map((p) => p.kind),
    ['park', 'party']
  );
  test(
    'hours for a phone cell, midnight as 24',
    [formatGridHours(540, 1260), formatGridHours(510, 1440), formatGridHours(540, 1500)],
    ['09–21', '08:30–24', '09–01']
  );
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
    'a length other than the API’s default is sent',
    whenRequestQuery({
      ...DEFAULT_PLAN_STATE,
      when: { from: '2027-01-01', to: '2027-02-01' },
      days: 12,
    }).days,
    '12'
  );
  test(
    'the /when request: range, region, three windows, the trip options, no pins, the default length left out',
    whenRequestQuery(state),
    {
      from: '2027-01-01',
      to: '2027-11-12',
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
  const breaks = {
    regions: [
      {
        code: 'DE-NW',
        name: 'Nordrhein-Westfalen',
        country: 'DE',
        through: '2028-11-04',
        periods: [],
      },
      { code: 'NL-GR', name: 'Regio Noord', country: 'NL', through: '2028-10-29', periods: [] },
      { code: 'GB-ENG', name: 'England', country: 'GB', through: '2029-08-31', periods: [] },
    ],
  };
  test(
    'the holiday picker offers what the data has, the reader’s country first',
    [
      holidayRegionsFor(breaks, 'de')[0].country,
      holidayRegionsFor(breaks, 'nl')[0].regions,
      holidayRegionsFor(breaks, 'en')[0].country,
      holidayRegionsFor(undefined, 'de'),
    ],
    ['DE', [{ code: 'NL-GR', name: 'Regio Noord', through: '2028-10-29' }], 'GB', []]
  );
  test(
    'meta.split: only auto parks with more than one day',
    autoSplit({
      split: [
        { slug: 'magic-kingdom-park', visits: 2, auto: true },
        { slug: 'epcot', visits: 1, auto: true },
        { slug: 'x', visits: 3 },
      ],
    }),
    [{ slug: 'magic-kingdom-park', visits: 2 }]
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
    await fetchTripPlan('orlando', { from: '2026-11-28', to: 'x' });
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

// ── 8. Seasons and evenings ─────────────────────────────────────────────────
{
  test(
    'season chips: heat, and the hurricane season folded into its peak',
    [
      climateChips(['extreme_heat', 'hurricane_season', 'hurricane_peak']),
      climateChips(['hurricane_season']),
    ],
    [['extreme_heat', 'hurricane_peak'], ['hurricane_season']]
  );
  test(
    'an evening says its most telling reason first',
    eveningReasons({ reasons: ['short_transfer', 'nope', 'park_closes_early'] }),
    ['park_closes_early', 'short_transfer']
  );
  test(
    'ranked lower names the season’s terms the ranking added',
    [
      rankedLower({ warnings: ['hurricane_peak'], penalties: { hurricane: 6.4, heat: 1.2 } }),
      rankedLower({ warnings: [] }),
    ],
    [['hurricane_peak', 'extreme_heat'], []]
  );
}

// ── Tickets ──────────────────────────────────────────────────────────────────
{
  const CATALOG = ticketCatalog([
    {
      id: 'wdw-date-based',
      name: 'Walt Disney World date-based theme park ticket',
      resort: 'walt-disney-world',
      markets: ['us', 'uk', 'intl'],
      parks: ['magic-kingdom-park', 'epcot'],
      days: { min: 1, max: 10 },
      windowTable: [
        { days: 1, window: 1 },
        { days: 4, window: 7 },
        { days: 10, window: 14 },
      ],
      anchor: 'start',
      hopping: 'optional',
    },
    {
      id: 'wdw-date-based-plus',
      name: 'Plus',
      resort: 'walt-disney-world',
      markets: ['us'],
      parks: ['magic-kingdom-park'],
      days: { min: 2, max: 10 },
      windowTable: [{ days: 4, window: 7 }],
      anchor: 'start',
      hopping: 'optional',
    },
    {
      id: 'wdw-uk-14-day-magic',
      name: 'Disney 14-Day Magic Ticket',
      resort: 'walt-disney-world',
      markets: ['uk'],
      parks: ['magic-kingdom-park'],
      days: { min: 14, max: 14 },
      windowTable: [{ days: 14, window: 18 }],
      anchor: 'start',
      hopping: 'included',
      onSale: [{ to: '2027-12-31' }],
    },
    {
      id: 'wdw-annual-pass',
      name: 'Walt Disney World Annual Pass',
      resort: 'walt-disney-world',
      markets: ['us'],
      parks: ['magic-kingdom-park'],
      days: 'unlimited',
      anchor: 'first_use',
      hopping: 'included',
      pass: true,
    },
    {
      id: 'uor-date-based',
      name: 'Universal Orlando date-based ticket',
      resort: 'universal-orlando',
      markets: ['us', 'intl'],
      parks: ['universal-studios-florida'],
      days: { min: 1, max: 5 },
      windowTable: [
        { days: 3, window: 5 },
        { days: 5, window: 7 },
      ],
      anchor: 'start',
      hopping: 'optional',
    },
    {
      id: 'uor-uk-all-parks',
      name: 'Universal Orlando All Parks Ticket',
      resort: 'universal-orlando',
      markets: ['uk', 'intl'],
      parks: ['universal-studios-florida'],
      days: { min: 14, max: 14 },
      windowTable: [{ days: 14, window: 14 }],
      anchor: 'start',
      hopping: 'included',
      onSale: [{ to: '2026-10-19' }, { from: '2027-03-25', to: '2027-12-31' }],
    },
    {
      id: 'uor-uk-three-park-adventure',
      name: 'Universal Orlando Three Park Adventure Ticket',
      resort: 'universal-orlando',
      markets: ['uk', 'intl'],
      parks: ['universal-studios-florida'],
      days: { min: 14, max: 14 },
      windowTable: [{ days: 14, window: 14 }],
      anchor: 'start',
      hopping: 'included',
      onSale: [{ from: '2026-10-20', to: '2027-03-31' }],
    },
    {
      id: 'seaworld-four-parks-14-day',
      name: 'Four Parks',
      resort: 'seaworld-orlando',
      markets: ['us', 'intl'],
      parks: ['seaworld-orlando'],
      days: 'unlimited',
      windowDays: 14,
      anchor: 'first_use',
      hopping: 'none',
    },
  ]);

  // The URL form: the owner's case, a not-sure hopper, and lenient reading.
  const owner = readPlanQuery(
    q(
      'from=2027-02-06&to=2027-02-20&tickets=wdw-uk-14-day-magic@2027-02-07,uor-uk-three-park-adventure@2027-02-07&hopper=walt-disney-world&blocks=1'
    ),
    { ...keys, tickets: CATALOG, resorts: new Set(['walt-disney-world', 'universal-orlando']) }
  );
  test(
    'tickets=, hopper= and blocks=1 are read',
    [owner.tickets, owner.hopper, owner.blocks],
    [
      [
        { product: 'wdw-uk-14-day-magic', days: null, hopper: 'no', start: '2027-02-07' },
        { product: 'uor-uk-three-park-adventure', days: null, hopper: 'no', start: '2027-02-07' },
      ],
      ['walt-disney-world'],
      true,
    ]
  );
  test(
    'and written back as they came',
    writePlanQuery(owner),
    'from=2027-02-06&to=2027-02-20&blocks=1&hopper=walt-disney-world&tickets=wdw-uk-14-day-magic@2027-02-07,uor-uk-three-park-adventure@2027-02-07'
  );
  test(
    'a not-sure hopper keeps its ? readable and round-trips',
    writePlanQuery(
      readPlanQuery(q('from=2027-02-06&to=2027-02-10&tickets=wdw-date-based.4.h?@2027-02-07'), {
        ...keys,
        tickets: CATALOG,
      })
    ),
    'from=2027-02-06&to=2027-02-10&tickets=wdw-date-based.4.h?@2027-02-07'
  );
  test(
    'an unknown product, a length not sold and a bad date each drop only their item',
    readTickets(
      'nope.3,wdw-date-based.12,wdw-date-based.3.h,uor-date-based@2027-02-31,wdw-annual-pass.4@2027-01-01',
      CATALOG
    ),
    {
      tickets: [
        { product: 'wdw-date-based', days: 3, hopper: 'yes', start: null },
        { product: 'wdw-annual-pass', days: null, hopper: 'no', start: null },
      ],
      dropped: 3,
    }
  );
  {
    // Cloudflare can serve the region from before the catalog for up to a day after a deploy. The
    // step hides, plan first stays, and a shared link's tickets still reach the plan route.
    const stale = planRegionKeys({
      parks: ORDER.map((slug) => ({ slug })),
      hotelAreas: [{ key: 'disney' }, { key: 'universal' }],
      groups: [{ key: 'walt-disney-world', kind: 'resort' }],
    });
    const shared = readPlanQuery(
      q(
        'from=2027-02-06&to=2027-02-20&tickets=wdw-uk-14-day-magic@2027-02-07,nope.x,uor-date-based.3.h?@2027-02-09&hopper=walt-disney-world'
      ),
      stale
    );
    const none = ticketCatalog(undefined);
    test(
      'without a catalog a link’s tickets and hopper are kept by their syntax, for the plan route to check',
      [shared.tickets, shared.hopper, stale.tickets],
      [
        [
          { product: 'wdw-uk-14-day-magic', days: null, hopper: 'no', start: '2027-02-07' },
          { product: 'uor-date-based', days: 3, hopper: 'unsure', start: '2027-02-09' },
        ],
        ['walt-disney-world'],
        undefined,
      ]
    );
    test(
      'and the plan is asked with them, since no ticket problem can be told without the catalog',
      [
        none.size,
        ticketProblem(shared, none),
        planRequestQuery(shared, HEAD, ticketProblem(shared, none) !== null)?.tickets,
        planRequestQuery({ ...DEFAULT_PLAN_STATE, from: '2027-02-06', to: '2027-02-10' }, HEAD)
          ?.tickets,
      ],
      [0, null, 'wdw-uk-14-day-magic@2027-02-07,uor-date-based.3.h?@2027-02-09', undefined]
    );
  }
  test(
    'plannerHrefOn carries tickets for Parky and the other pages',
    plannerHrefOn('/orlando', {
      from: '2027-02-06',
      to: '2027-02-20',
      tickets: [{ product: 'uor-date-based', days: 3, hopper: 'unsure', start: '2027-02-09' }],
    }),
    '/orlando?from=2027-02-06&to=2027-02-20&tickets=uor-date-based.3.h?@2027-02-09#planner'
  );
  test(
    'one item is written in the contract’s order',
    writeTicketItem({ product: 'wdw-date-based', days: 4, hopper: 'yes', start: '2027-02-12' }),
    'wdw-date-based.4.h@2027-02-12'
  );

  // Windows, every-day tickets and the UK Universal ticket by its start.
  test(
    'windows come from the window table, a window-only product and a pass',
    [
      ticketWindow(CATALOG.get('wdw-uk-14-day-magic'), { days: null, start: '2027-02-07' }),
      ticketWindow(CATALOG.get('wdw-date-based'), { days: 4, start: '2027-02-12' }),
      ticketWindow(CATALOG.get('seaworld-four-parks-14-day'), { days: null, start: '2027-02-07' }),
      ticketWindow(CATALOG.get('wdw-annual-pass'), { days: null, start: '2027-02-07' }),
    ],
    [
      { from: '2027-02-07', to: '2027-02-24' },
      { from: '2027-02-12', to: '2027-02-18' },
      { from: '2027-02-07', to: '2027-02-20' },
      null,
    ]
  );
  test(
    'every-day tickets: Universal’s UK 14 and SeaWorld’s Four Parks, not Disney’s Magic',
    [
      isEveryDayTicket(CATALOG.get('uor-uk-three-park-adventure'), null),
      isEveryDayTicket(CATALOG.get('seaworld-four-parks-14-day'), null),
      isEveryDayTicket(CATALOG.get('wdw-uk-14-day-magic'), null),
      isEveryDayTicket(CATALOG.get('wdw-annual-pass'), null),
    ],
    [true, true, false, false]
  );
  test(
    'the UK Universal ticket is the one on sale at its start, both in the overlap week',
    [
      rollingFortnightAt(STEP, CATALOG, '2027-02-07'),
      rollingFortnightAt(STEP, CATALOG, '2027-03-27'),
      rollingFortnightAt(STEP, CATALOG, '2027-05-01'),
    ],
    [
      ['uor-uk-three-park-adventure'],
      ['uor-uk-three-park-adventure', 'uor-uk-all-parks'],
      ['uor-uk-all-parks'],
    ]
  );
  test(
    'the step’s tag says where a ticket is sold: a UK shop, or none for the operators’ own',
    [
      entryMarket(ticketEntries(STEP, 'walt-disney-world', CATALOG)[1], CATALOG, 'us'),
      entryMarket(ticketEntries(STEP, 'universal-orlando', CATALOG)[1], CATALOG, 'us'),
      entryMarket(ticketEntries(STEP, 'walt-disney-world', CATALOG)[0], CATALOG, 'us'),
      marketLabel(['intl'], 'us'),
      marketLabel(['us', 'uk'], 'us'),
      marketLabel(undefined, 'us'),
    ],
    ['uk', 'uk', null, 'intl', null, null]
  );
  test(
    'a purchase link is tagged by its own market, the official one by its product’s',
    [
      linkMarket({ markets: ['uk'] }, ['us', 'intl'], 'us'),
      linkMarket({ official: true }, ['uk'], 'us'),
      linkMarket({ official: true }, ['us', 'uk'], 'us'),
      linkMarket({}, ['uk'], 'us'),
      linkMarket({ markets: ['uk'], store: { country: 'IE', currency: 'EUR' } }, ['uk'], 'us'),
    ],
    ['uk', 'uk', null, null, null]
  );
  test(
    'the home market is the region’s, else the registry’s',
    [
      ticketHomeMarket({ ticketMarkets: { home: 'jp', codes: ['jp', 'intl'] } }, STEP),
      ticketHomeMarket({}, STEP),
    ],
    ['jp', 'us']
  );
  test(
    'the lists keep only what the catalog has',
    ticketEntries(STEP, 'walt-disney-world', CATALOG).map((e) => e.key),
    ['wdw-dated', 'wdw-uk-14', 'wdw-pass', 'wdw-unsure']
  );

  // Drafts.
  const draft = (patch) => ({
    id: 1,
    resort: 'universal-orlando',
    entry: 'uor-uk-14',
    product: null,
    days: null,
    hopper: null,
    addon: false,
    start: '2027-02-07',
    ...patch,
  });
  test(
    'the UK Universal draft resolves by its start; Volcano Bay picks All Parks in the overlap',
    [
      draftTicket(STEP, draft({}), CATALOG, null).ticket?.product,
      draftTicket(STEP, draft({ start: '2027-03-27', addon: true }), CATALOG, null).ticket?.product,
      draftTicket(STEP, draft({ start: '2028-01-05' }), CATALOG, null).issue?.kind,
    ],
    ['uor-uk-three-park-adventure', 'uor-uk-all-parks', 'not_on_sale']
  );
  test(
    'a dated draft needs its days; an unanswered hopper plans as not sure',
    [
      draftTicket(STEP, draft({ resort: 'walt-disney-world', entry: 'wdw-dated' }), CATALOG, null)
        .ticket,
      draftTicket(
        STEP,
        draft({ resort: 'walt-disney-world', entry: 'wdw-dated', days: 4 }),
        CATALOG,
        null
      ).ticket,
      draftTicket(
        STEP,
        draft({ resort: 'walt-disney-world', entry: 'wdw-dated', days: 4, addon: true }),
        CATALOG,
        null
      ).ticket?.product,
    ],
    [
      null,
      { product: 'wdw-date-based', days: 4, hopper: 'unsure', start: '2027-02-07' },
      'wdw-date-based-plus',
    ]
  );
  test(
    '“Not sure which” plans the strictest product of its length',
    [
      draftTicket(
        STEP,
        draft({ resort: 'walt-disney-world', entry: 'wdw-unsure', days: 5, hopper: 'no' }),
        CATALOG,
        null
      ).ticket,
      draftTicket(
        STEP,
        draft({ resort: 'walt-disney-world', entry: 'wdw-unsure', days: 14 }),
        CATALOG,
        null
      ).ticket?.product,
      draftTicket(STEP, draft({ entry: 'uor-unsure', days: 14 }), CATALOG, null).ticket?.product,
    ],
    [
      { product: 'wdw-date-based', days: 5, hopper: 'no', start: '2027-02-07' },
      'wdw-uk-14-day-magic',
      'uor-uk-three-park-adventure',
    ]
  );
  test(
    'a written ticket opens as its entry in the step',
    ticketDraft(
      STEP,
      { product: 'wdw-date-based-plus', days: 4, hopper: 'yes', start: null },
      7,
      CATALOG
    ),
    {
      id: 7,
      resort: 'walt-disney-world',
      entry: 'wdw-dated',
      product: 'wdw-date-based-plus',
      days: 4,
      hopper: 'yes',
      addon: true,
      start: null,
    }
  );

  // The trip and the tickets.
  const uk = [
    { product: 'wdw-uk-14-day-magic', days: null, hopper: 'no', start: '2027-02-07' },
    { product: 'uor-uk-three-park-adventure', days: null, hopper: 'no', start: '2027-02-07' },
  ];
  test(
    'the tickets give the trip its dates: earliest first day to the latest window’s end',
    [
      tripFromTickets(uk, CATALOG),
      tripFromTickets(
        [{ product: 'wdw-date-based', days: 10, hopper: 'no', start: '2027-02-01' }, uk[0]],
        CATALOG
      ),
    ],
    [
      { from: '2027-02-07', to: '2027-02-24' },
      { from: '2027-02-01', to: '2027-02-21' },
    ]
  );
  test(
    'setTickets fills empty dates and leaves chosen ones',
    [
      [setTickets(DEFAULT_PLAN_STATE, uk, CATALOG, '2026-11-13')].map((s) => [s.from, s.to])[0],
      [
        setTickets(
          { ...DEFAULT_PLAN_STATE, from: '2027-02-06', to: '2027-02-20' },
          uk,
          CATALOG,
          '2026-11-13'
        ),
      ].map((s) => [s.from, s.to])[0],
    ],
    [
      ['2027-02-07', '2027-02-24'],
      ['2027-02-06', '2027-02-20'],
    ]
  );
  test(
    'a ticket the trip misses is caught before the request',
    [
      ticketProblem({ from: '2027-02-06', to: '2027-02-20', tickets: uk }, CATALOG),
      ticketProblem({ from: '2027-01-10', to: '2027-01-20', tickets: [uk[0]] }, CATALOG),
      ticketProblem(
        {
          from: '2027-03-10',
          to: '2027-03-20',
          tickets: [{ ...uk[1], start: '2027-02-01' }],
        },
        CATALOG
      ),
    ],
    [
      null,
      { kind: 'after_trip', index: 0, product: 'wdw-uk-14-day-magic' },
      { kind: 'before_trip', index: 0, product: 'uor-uk-three-park-adventure' },
    ]
  );

  // Plan first.
  const state = { ...DEFAULT_PLAN_STATE, from: '2027-02-08', to: '2027-02-17' };
  test(
    '“Show the plan with Park Hopper” switches one resort, also from an old ticket=hopper',
    [
      toggleHopper(state, 'walt-disney-world', ['walt-disney-world', 'universal-orlando']).hopper,
      toggleHopper({ ...state, ticket: 'hopper' }, 'walt-disney-world', [
        'walt-disney-world',
        'universal-orlando',
      ]),
    ].map((s) => (Array.isArray(s) ? s : [s.ticket, s.hopper])),
    [['walt-disney-world'], ['base', ['universal-orlando']]]
  );
  const suggestions = [
    {
      id: 'suggested:walt-disney-world',
      resort: 'walt-disney-world',
      product: 'wdw-date-based',
      days: 4,
      start: '2027-02-12',
      end: '2027-02-18',
      parks: ['magic-kingdom-park'],
      alternatives: [{ product: 'wdw-uk-14-day-magic', reason: 'long_stay' }],
    },
    {
      id: 'suggested:universal-orlando',
      resort: 'universal-orlando',
      product: 'uor-date-based',
      days: 3,
      start: '2027-02-09',
      end: '2027-02-13',
      parks: ['universal-studios-florida', 'universal-islands-of-adventure'],
      alternatives: [{ product: 'uor-uk-three-park-adventure', reason: 'long_stay' }],
    },
  ];
  const adopted = adoptSuggestions(
    { ...state, hopper: ['walt-disney-world'] },
    suggestions,
    CATALOG
  );
  test(
    '“Use these as your tickets” writes them by first day, the hopper where it was on, in blocks',
    [writePlanQuery(adopted)],
    [
      'from=2027-02-08&to=2027-02-17&blocks=1&tickets=uor-date-based.3@2027-02-09,wdw-date-based.4.h@2027-02-12',
    ]
  );
  test(
    'the long stay’s 14-day tickets come without a first day',
    longStayTickets(STEP, suggestions, CATALOG, '2027-02-08'),
    [
      { product: 'wdw-uk-14-day-magic', days: null, hopper: 'no', start: null },
      { product: 'uor-uk-three-park-adventure', days: null, hopper: 'no', start: null },
    ]
  );
  test(
    'the verdict says what the hopper adds, by date, and per ride from 1 minute',
    [
      hopperGains({
        recommended: true,
        eveningHopList: [
          { date: '2026-11-25', parks: ['disneys-animal-kingdom-theme-park', 'epcot'] },
        ],
        hopDayList: [{ date: '2026-11-27', parks: ['epcot', 'disneys-hollywood-studios'] }],
        fitsOnlyWithHopper: ['epcot', 'epcot'],
        savedMinutesPerRide: 0.4,
        why: ['evening_hops'],
      }),
      hopperGains({ recommended: false, why: ['no_gain'] }),
    ],
    [
      [
        { kind: 'evening', date: '2026-11-25', park: 'epcot' },
        { kind: 'fits', parks: ['epcot'] },
        { kind: 'hopDay', date: '2026-11-27', parks: ['epcot', 'disneys-hollywood-studios'] },
      ],
      [],
    ]
  );
  test(
    'the Hogwarts Express needs both Universal parks planned',
    [
      needsConnectedHop(STEP, ['universal-studios-florida', 'universal-islands-of-adventure']),
      needsConnectedHop(STEP, ['universal-studios-florida']),
    ],
    [true, false]
  );

  // The answer's ticket days and uses.
  const meta = {
    tickets: [
      {
        id: 't1',
        product: 'wdw-uk-14-day-magic',
        days: 14,
        hopper: true,
        start: '2027-02-07',
        end: '2027-02-24',
        usedDays: 7,
        unusedDays: 7,
        unusedReason: 'rest_days_kept',
      },
      {
        id: 't2',
        product: 'uor-uk-three-park-adventure',
        days: 14,
        hopper: true,
        start: '2027-02-07',
        end: '2027-02-20',
        usedDays: 3,
        windowDays: 14,
      },
    ],
    ticketSuggestion: suggestions,
  };
  test(
    'a day reads “Disney day 2 of 14”, an every-day ticket’s day by its window, a suggestion’s plainly',
    [
      ticketDayOf({ ticket: 't1', ticketDay: 2 }, meta, CATALOG),
      ticketDayOf({ ticket: 't2', ticketDay: 10 }, meta, CATALOG),
      ticketDayOf({ ticket: 'suggested:walt-disney-world', ticketDay: 2 }, meta, CATALOG),
      ticketDayOf({ ticket: 't1', ticketAllowance: true }, meta, CATALOG),
    ].map((d) => d && [d.kind, d.resort, d.day, d.of, d.everyDay]),
    [
      ['owned', 'walt-disney-world', 2, 14, false],
      ['owned', 'universal-orlando', 10, 14, true],
      ['suggested', 'walt-disney-world', 2, 4, false],
      null,
    ]
  );
  test(
    'an owned ticket’s use: counted with its unused days, or every day of a window',
    [ownedUse(meta.tickets[0], CATALOG), ownedUse(meta.tickets[1], CATALOG)],
    [
      { kind: 'counted', used: 7, days: 14, unused: 7, reason: 'rest_days_kept' },
      { kind: 'everyDay', used: 3, window: 14 },
    ]
  );
}

// ── Where to buy ─────────────────────────────────────────────────────────────
{
  // The seed's order: the cheapest authorized seller, Attraction Tickets, the official shop.
  const links = [
    { seller: 'Cheap Seller', url: 'https://cheap.example/', sponsored: false },
    {
      seller: 'Attraction Tickets',
      url: 'https://www.attractiontickets.com/',
      sponsored: true,
      markets: ['uk'],
      locales: ['en'],
    },
    { seller: 'Fan Shop DE', url: 'https://de.example/', sponsored: false, locales: ['de'] },
    {
      seller: 'Walt Disney World',
      url: 'https://disneyworld.disney.go.com/',
      official: true,
      sponsored: false,
    },
  ];
  const order = (locale, market) =>
    orderTicketLinks({ links }, { locale, market }, 'Disney').map((l) => l.seller);
  test(
    'links keep the admin’s order unless one is for the visitor’s locale or market',
    [order('fr', 'intl'), order('de', 'intl'), order('en', 'uk'), order('nl', 'uk')],
    [
      ['Cheap Seller', 'Attraction Tickets', 'Fan Shop DE', 'Walt Disney World'],
      ['Fan Shop DE', 'Cheap Seller', 'Attraction Tickets', 'Walt Disney World'],
      ['Attraction Tickets', 'Cheap Seller', 'Fan Shop DE', 'Walt Disney World'],
      ['Attraction Tickets', 'Cheap Seller', 'Fan Shop DE', 'Walt Disney World'],
    ]
  );
  test(
    'the official link is never moved to the front, and an older answer’s shopUrl stands alone',
    [
      order('it', null).indexOf('Walt Disney World'),
      orderTicketLinks(
        { shopUrl: 'https://shop.example/' },
        { locale: 'en', market: null },
        'Disney'
      ),
      orderTicketLinks({}, { locale: 'en', market: null }, 'Disney'),
    ],
    [3, [{ seller: 'Disney', url: 'https://shop.example/', official: true, sponsored: false }], []]
  );
  test(
    'the visitor’s market comes from the browser’s first language',
    [
      visitorMarket(['en-GB', 'en']),
      visitorMarket(['en-IE']),
      visitorMarket(['en-US']),
      visitorMarket(['de-DE']),
      visitorMarket(['de']),
      visitorMarket([]),
    ],
    ['uk', 'uk', 'us', 'intl', null, null]
  );
  const at = (country, currency, locale) => ({
    seller: `AT ${country}`,
    url: `https://www.attractiontickets.com/${country}`,
    sponsored: false,
    locales: [locale],
    store: { country, currency },
  });
  const stores = [
    at('GB', 'GBP', 'en'),
    at('IE', 'EUR', 'en'),
    at('NL', 'EUR', 'nl'),
    at('DE', 'EUR', 'de'),
    { seller: 'Walt Disney World', url: 'https://wdw.example/', official: true, sponsored: false },
  ];
  const storeOrder = (locale, languages) =>
    orderTicketLinks(
      { links: stores },
      { locale, market: visitorMarket(languages), country: visitorCountry(languages) },
      'Disney'
    ).map((l) => l.seller);
  test(
    'every store is listed, the visitor’s own country first, then their language’s',
    [
      storeOrder('en', ['en-IE']),
      storeOrder('en', ['en']),
      storeOrder('de', ['de-AT']),
      storeOrder('de', ['en-IE']),
    ],
    [
      ['AT IE', 'AT GB', 'AT NL', 'AT DE', 'Walt Disney World'],
      ['AT GB', 'AT IE', 'AT NL', 'AT DE', 'Walt Disney World'],
      ['AT DE', 'AT GB', 'AT IE', 'AT NL', 'Walt Disney World'],
      ['AT IE', 'AT DE', 'AT GB', 'AT NL', 'Walt Disney World'],
    ]
  );
  test(
    'a store is named by its country and currency in the visitor’s language',
    [
      ticketStoreName({ country: 'GB', currency: 'GBP' }, 'de'),
      ticketStoreName({ country: 'IE', currency: 'EUR' }, 'de'),
      ticketStoreName({ country: 'US', currency: 'USD' }, 'de'),
      visitorCountry(['zh-Hant-TW']),
    ],
    [
      { country: 'UK', currency: '£' },
      { country: 'Irland', currency: '€' },
      { country: 'USA', currency: '$' },
      'TW',
    ]
  );
  test(
    'a ticket link tells the seller it came from park.fan, and a sponsored one says it is',
    [ticketLinkAttributes({ sponsored: false }), ticketLinkAttributes({ sponsored: true })],
    [
      { target: '_blank', rel: 'noopener', referrerPolicy: 'origin' },
      { target: '_blank', rel: 'sponsored nofollow noopener', referrerPolicy: 'origin' },
    ]
  );
}

// ── Analytics: the properties each event carries ────────────────────────────
{
  const sponsored = {
    seller: 'Attraction Tickets',
    url: 'https://www.attractiontickets.com/en/orlando',
    sponsored: true,
    markets: ['uk'],
  };
  test(
    'ticket_link_clicked names the product, seller, host, kind and place, with no entity',
    [
      ticketLinkClickProps({
        product: 'wdw-uk-14-day-magic',
        link: sponsored,
        index: 0,
        visitor: { locale: 'en', market: 'uk' },
        surface: 'suggestion',
        ticketMode: 'plan_first',
      }),
      ticketLinkClickProps({
        product: 'wdw-date-based',
        link: {
          seller: 'Walt Disney World',
          url: 'https://disneyworld.disney.go.com/x',
          official: true,
          sponsored: false,
        },
        index: 2,
        visitor: { locale: 'de', market: 'intl' },
        surface: 'long_stay',
        ticketMode: 'mixed',
      }),
    ],
    [
      {
        product: 'wdw-uk-14-day-magic',
        seller: 'Attraction Tickets',
        host: 'attractiontickets.com',
        kind: 'sponsored',
        position: 1,
        locale_match: true,
        surface: 'suggestion',
        ticket_mode: 'plan_first',
      },
      {
        product: 'wdw-date-based',
        seller: 'Walt Disney World',
        host: 'disneyworld.disney.go.com',
        kind: 'official',
        position: 3,
        locale_match: false,
        surface: 'long_stay',
        ticket_mode: 'mixed',
      },
    ]
  );
  test(
    'a seller’s name keeps only what the statistic stores; a url that is none has no host',
    [sellerProp("Disney's “Magic” Shop!"), sellerProp('***'), hostProp('not a url')],
    ['Disneys Magic Shop', 'unknown', 'unknown']
  );
  test(
    'the ticket mode follows the plan’s own tickets',
    [ticketModeOf(0, 2), ticketModeOf(2, 0), ticketModeOf(1, 1)],
    ['plan_first', 'owned', 'mixed']
  );
}

// ── The planner's events ─────────────────────────────────────────────────────
{
  // Orlando's resorts that sell a hopper as an option.
  const HOPPER_RESORTS = ['walt-disney-world', 'universal-orlando'];
  test(
    'a trip’s length lands in its bucket, arrival and departure included',
    [1, 4, 5, 7, 8, 10, 11, 14, 15, 21].map(tripDaysBucket),
    ['1-4', '1-4', '5-7', '5-7', '8-10', '8-10', '11-14', '11-14', '15-21', '15-21']
  );
  test(
    'a plan request counts the decisions, never the dates or the parks themselves',
    tripPlanRequestProps(
      {
        from: '2026-11-28',
        to: '2026-12-06',
        parks: 'magic-kingdom-park:2,epcot,universal-epic-universe',
        tickets: 'wdw-date-based.4@2026-11-29',
        hopper: 'universal-orlando',
        blocks: '0',
        rest: 'max:3',
        lock: 'epcot@2026-12-01',
      },
      'dates',
      HOPPER_RESORTS
    ),
    {
      mode: 'dates',
      days: '8-10',
      parks: 3,
      tickets: 'owned',
      hopper: 'some',
      blocks: 'off',
      rest: 'max',
    }
  );
  test(
    'without parks the request plans the headliners; ticket=hopper is the hopper at every resort',
    tripPlanRequestProps(
      { from: '2026-11-28', to: '2026-12-01', ticket: 'hopper', blocks: '1', rest: 'none' },
      'dates',
      HOPPER_RESORTS
    ),
    {
      mode: 'dates',
      days: '1-4',
      parks: 0,
      tickets: 'none',
      hopper: 'all',
      blocks: 'on',
      rest: 'none',
    }
  );
  test(
    'a search counts its length, or the default length when it names none',
    [
      tripPlanRequestProps({ from: '2026-11-01', to: '2027-02-28', days: '14' }, 'when', []).days,
      tripPlanRequestProps({ from: '2026-11-01', to: '2027-02-28' }, 'when', []).days,
      tripPlanRequestProps({}, 'when', []).blocks,
    ],
    ['11-14', '8-10', 'default']
  );
  test(
    'the hopper counts the region’s hopper resorts planned with one: none, some or all, by no name',
    [
      tripPlanRequestProps({}, 'dates', HOPPER_RESORTS).hopper,
      tripPlanRequestProps({ hopper: 'walt-disney-world' }, 'when', HOPPER_RESORTS).hopper,
      tripPlanRequestProps(
        { hopper: 'universal-orlando,walt-disney-world' },
        'dates',
        HOPPER_RESORTS
      ).hopper,
      tripPlanRequestProps({ hopper: 'walt-disney-world' }, 'dates', []).hopper,
      hopperResorts(
        ticketCatalog([
          { id: 'a', resort: 'walt-disney-world', hopping: 'optional' },
          { id: 'b', resort: 'walt-disney-world', hopping: 'optional' },
          { id: 'c', resort: 'universal-orlando', hopping: 'optional' },
          { id: 'd', resort: 'seaworld-orlando', hopping: 'none' },
          { id: 'e', resort: 'universal-orlando', hopping: 'included' },
        ])
      ),
    ],
    ['none', 'some', 'all', 'some', ['walt-disney-world', 'universal-orlando']]
  );
  test(
    'a plan on screen names the rule it loosened that weighs most, and what it left out',
    [
      tripPlanShownProps({ meta: {}, unplaced: [], days: [] }),
      tripPlanShownProps({
        meta: { relaxed: ['streak_relaxed', 'ticket_window_relaxed', 'blocks_relaxed'] },
        unplaced: [{ slug: 'epcot', reason: 'no_day_left' }],
        days: [],
      }),
      tripPlanShownProps({
        meta: { relaxed: ['streak_relaxed'], stays: [{}, {}] },
        unplaced: [],
        parksLeftOut: [],
        days: [],
      }),
    ],
    [
      { mode: 'dates', outcome: 'ok', unplaced: 0, left_out: 0 },
      { mode: 'dates', outcome: 'relaxed', relaxed: 'ticket_window', unplaced: 1, left_out: 1 },
      { mode: 'dates', outcome: 'relaxed', relaxed: 'streak', unplaced: 0, left_out: 0, stays: 2 },
    ]
  );
  {
    const base = { ...DEFAULT_PLAN_STATE, from: '2026-12-05', to: '2026-12-12' };
    const HEADS = ['magic-kingdom-park', 'epcot'];
    test(
      'one option event per option changed, values from small sets only',
      [
        tripOptionChanges(base, { ...base, moveBuffer: 90, arrival: 'park', rest: 'max:3' }, HEADS),
        tripOptionChanges(
          base,
          { ...base, parks: [{ slug: 'magic-kingdom-park', visits: null }] },
          HEADS
        ),
        tripOptionChanges(
          base,
          {
            ...base,
            parks: [
              { slug: 'magic-kingdom-park', visits: 2 },
              { slug: 'epcot', visits: null },
            ],
          },
          HEADS
        ),
        tripOptionChanges(
          base,
          { ...base, bases: [{ key: 'tokyo', nights: 4, area: null }], startBase: 'tokyo' },
          HEADS
        ),
        tripOptionChanges(base, { ...base, from: '2027-01-01', locks: [], tickets: [] }, HEADS),
      ],
      [
        [
          { option: 'arrival', value: 'on' },
          { option: 'rest', value: 'max' },
          { option: 'move_buffer', value: '90' },
        ],
        [{ option: 'parks', value: 'removed' }],
        [{ option: 'visits' }],
        [{ option: 'cities' }, { option: 'start_base', value: 'set' }],
        [],
      ]
    );
    test('left-out parks in three buckets', [1, 2, 3, 7].map(leftOutBucket), [
      '1',
      '2',
      '3+',
      '3+',
    ]);
  }
  {
    const heard = [];
    const stop = onSiteEvent((name, props) => heard.push({ name, props }));
    const requested = tripPlanRequestProps(
      {
        from: '2026-11-28',
        to: '2026-12-06',
        parks: 'epcot',
        tickets: 'wdw-date-based.4@2026-11-29',
        hopper: 'universal-orlando',
        blocks: '1',
        rest: 'max:2',
      },
      'dates',
      HOPPER_RESORTS
    );
    trackTripEvent('orlando', 'trip_plan_requested', requested);
    trackTripEvent('orlando', 'trip_day_swapped');
    stop();
    test(
      'every trip event names its region; the request then holds eight, the statistic’s limit',
      heard.map((e) => [e.name, e.props.region, Object.keys(e.props).length]),
      [
        ['trip_plan_requested', 'orlando', 8],
        ['trip_day_swapped', 'orlando', 1],
      ]
    );
  }
  test(
    'a search on screen counts its windows; a failure keeps its status, 0 without an answer',
    [
      tripWhenShownProps({ windows: [{}, {}, {}] }),
      tripPlanFailedProps(400, 'dates'),
      tripPlanFailedProps(undefined, 'when'),
    ],
    [
      { mode: 'when', outcome: 'ok', windows: 3 },
      { mode: 'dates', outcome: 'error', status: 400 },
      { mode: 'when', outcome: 'error', status: 0 },
    ]
  );
}

// ── Links into the planner from other pages ─────────────────────────────────
{
  const REGION = {
    slug: 'orlando',
    name: 'Orlando',
    groups: [
      { key: 'walt-disney-world', name: 'Walt Disney World Resort', kind: 'resort' },
      { key: 'universal-orlando', name: 'Universal Orlando Resort', kind: 'resort' },
      { key: 'seaworld-orlando', name: 'SeaWorld Parks and Resorts Orlando', kind: 'resort' },
      { key: 'day-trips', name: 'Day trips', kind: 'day_trip' },
    ],
    parks: [
      {
        id: 'id-mk',
        slug: 'magic-kingdom-park',
        name: 'Magic Kingdom Park',
        path: '/parks/north-america/united-states/orlando/magic-kingdom-park',
        group: 'walt-disney-world',
        type: 'theme_park',
        headliner: true,
      },
      {
        id: 'id-epcot',
        slug: 'epcot',
        name: 'EPCOT',
        path: '/parks/north-america/united-states/orlando/epcot',
        group: 'walt-disney-world',
        type: 'theme_park',
        headliner: true,
      },
      {
        id: 'id-bg',
        slug: 'busch-gardens-tampa',
        name: 'Busch Gardens Tampa Bay',
        path: '/parks/north-america/united-states/tampa/busch-gardens-tampa',
        group: 'day-trips',
        type: 'theme_park',
        headliner: false,
      },
    ],
  };
  const links = tripRegionLinks(REGION);
  test('a region reduced to its links: the hub, its names, its parks', links, {
    slug: 'orlando',
    name: 'Orlando',
    names: [
      'Orlando',
      'Walt Disney World',
      'Universal Orlando',
      'SeaWorld Parks and Resorts Orlando',
    ],
    parks: [
      {
        id: 'id-mk',
        slug: 'magic-kingdom-park',
        name: 'Magic Kingdom Park',
        path: '/parks/north-america/united-states/orlando/magic-kingdom-park',
      },
      {
        id: 'id-epcot',
        slug: 'epcot',
        name: 'EPCOT',
        path: '/parks/north-america/united-states/orlando/epcot',
      },
      {
        id: 'id-bg',
        slug: 'busch-gardens-tampa',
        name: 'Busch Gardens Tampa Bay',
        path: '/parks/north-america/united-states/tampa/busch-gardens-tampa',
      },
    ],
  });
  test(
    'a region without a live hub has no links',
    [tripRegionLinks({ ...REGION, slug: 'tokyo' }), tripRegionLinks({ ...REGION, slug: 'x' })],
    [null, null]
  );
  test(
    'a page names its parks by id or by path; the region keeps its order',
    regionParksOf(links, [
      '/parks/north-america/united-states/orlando/epcot',
      'id-mk',
      '/parks/europe/germany/rust/europa-park',
    ]).map((p) => p.slug),
    ['magic-kingdom-park', 'epcot']
  );
  test(
    'a page with no park of a region finds none',
    [
      findTripRegion([links], ['/parks/europe/germany/rust/europa-park']),
      findTripRegion([links], ['id-bg'])?.parks.map((p) => p.slug),
    ],
    [null, ['busch-gardens-tampa']]
  );
  const california = {
    slug: 'southern-california',
    name: 'Southern California',
    names: ['Southern California'],
    parks: [
      {
        id: 'id-kbf',
        slug: 'knotts-berry-farm',
        name: "Knott's Berry Farm",
        path: '/parks/north-america/united-states/buena-park/knotts-berry-farm',
      },
    ],
  };
  test(
    'a country with parks of two regions finds both, in the regions order',
    findTripRegions([links, california], ['id-kbf', 'id-epcot', 'id-mk']).map(
      ({ region, parks }) => [region.slug, parks.map((p) => p.slug)]
    ),
    [
      ['orlando', ['magic-kingdom-park', 'epcot']],
      ['southern-california', ['knotts-berry-farm']],
    ]
  );
  test(
    'one region per park page: the first that holds it',
    findTripRegion([links, california], ['id-kbf'])?.region.slug,
    'southern-california'
  );
  test(
    'a planner link with a plan is nofollow, the bare chapter is not',
    [
      plannerLinkRel(tripPlannerHref(links.slug, 'de', { parks: ['epcot'] })),
      plannerLinkRel(tripPlannerHref(links.slug, 'de')),
    ],
    ['nofollow', undefined]
  );
  test(
    'the planner on a park, on a month of a park calendar, and bare',
    [
      tripPlannerHref(links.slug, 'de', { parks: ['magic-kingdom-park'] }),
      tripPlannerHref(links.slug, 'de', {
        parks: ['epcot'],
        when: monthSearchRange({ year: 2027, month: 3 }, '2026-11-13'),
      }),
      tripPlannerHref(links.slug, 'de'),
    ],
    [
      '/orlando?parks=magic-kingdom-park#planner',
      '/orlando?when=2027-03-01_2027-03-31&days=10&parks=epcot#planner',
      '/orlando#planner',
    ]
  );
  test(
    'a month starts today, stops a year ahead, and needs room for the trip',
    [
      monthSearchRange({ year: 2026, month: 11 }, '2026-11-13'),
      monthSearchRange({ year: 2027, month: 11 }, '2026-11-13'),
      monthSearchRange({ year: 2026, month: 11 }, '2026-11-25'),
      monthSearchRange({ year: 2026, month: 10 }, '2026-11-13'),
    ],
    [{ from: '2026-11-13', to: '2026-11-30' }, { from: '2027-11-01', to: '2027-11-13' }, null, null]
  );
  const match = (q) => matchTripRegion(q, [links])?.slug ?? null;
  test(
    'a query naming the region or a resort finds it',
    [
      'orlando',
      'Orl',
      'Walt Disney World',
      'disney world',
      'Universal Orlando',
      'universal orl',
      'SeaWorld Orlando',
      'Disney World Orlando',
      'walt-disney-world',
    ].map(match),
    Array(9).fill('orlando')
  );
  test(
    'one word of a resort, a short query or another park finds nothing',
    ['universal', 'disney', 'walt', 'or', 'epcot', 'world', 'europa-park', ''].map(match),
    Array(8).fill(null)
  );
}

// ── A trip across cities (bases) ────────────────────────────────────────────
{
  const BASES = new Map([
    ['tokyo', new Set(['maihama', 'shinjuku'])],
    ['fujikawaguchiko', new Set(['kawaguchiko'])],
    ['nagoya', new Set(['nagoya_station'])],
    ['osaka', new Set(['universal_city'])],
  ]);
  const jp = {
    parks: new Set(['tokyo-disneyland']),
    areas: new Set(['maihama']),
    bases: BASES,
    moveBuffers: new Set([30, 60, 90, 120]),
  };
  const read = (q, keys = jp) => readPlanQuery(new URLSearchParams(q), keys);
  test(
    'bases: nights, an area, a stay the plan sizes; kept in the region’s base order',
    read('bases=osaka,tokyo:4@maihama,fujikawaguchiko:0').bases,
    [
      { key: 'tokyo', nights: 4, area: 'maihama' },
      { key: 'fujikawaguchiko', nights: 0, area: null },
      { key: 'osaka', nights: null, area: null },
    ]
  );
  test(
    'an unknown base goes, an area of another base or on a :0 base is dropped',
    read('bases=kyoto:2,tokyo:4@universal_city,nagoya:0@nagoya_station').bases,
    [
      { key: 'tokyo', nights: 4, area: null },
      { key: 'nagoya', nights: 0, area: null },
    ]
  );
  test(
    'in a region with bases hotel and area are not the region’s; the ends and the buffer are',
    (({ hotel, area, startBase, endBase, moveBuffer }) => ({
      hotel,
      area,
      startBase,
      endBase,
      moveBuffer,
    }))(read('hotel=disney&area=maihama&startBase=tokyo&endBase=osaka&moveBuffer=90')),
    { hotel: null, area: null, startBase: 'tokyo', endBase: 'osaka', moveBuffer: 90 }
  );
  test(
    'a buffer the region does not offer, and an unknown end, are dropped',
    (({ endBase, moveBuffer }) => ({ endBase, moveBuffer }))(read('endBase=kyoto&moveBuffer=45')),
    { endBase: null, moveBuffer: null }
  );
  test(
    'a region without bases drops them',
    read('bases=tokyo:4&startBase=tokyo&moveBuffer=60', keys).bases.length +
      (read('startBase=tokyo', keys).startBase === null ? 0 : 1),
    0
  );
  const written = writePlanQuery({
    ...DEFAULT_PLAN_STATE,
    from: '2027-04-10',
    to: '2027-04-19',
    bases: [
      { key: 'tokyo', nights: 4, area: 'maihama' },
      { key: 'fujikawaguchiko', nights: 0, area: null },
    ],
    startBase: 'tokyo',
    endBase: 'osaka',
    moveBuffer: 60,
  });
  test(
    'the URL writes the bases as the contract spells them',
    written,
    'from=2027-04-10&to=2027-04-19&bases=tokyo:4@maihama,fujikawaguchiko:0&startBase=tokyo&endBase=osaka&moveBuffer=60'
  );
  test('and reads back the same', writePlanQuery(read(written)), written);

  const ORDER_JP = ['tokyo', 'fujikawaguchiko', 'nagoya', 'osaka'];
  const trip = { ...DEFAULT_PLAN_STATE, from: '2027-04-10', to: '2027-04-19' };
  const fixed = setBaseNights(setBaseNights(trip, 'osaka', 5, ORDER_JP), 'tokyo', 5, ORDER_JP);
  test(
    'fixed nights add up, in base order',
    [fixed.bases.map((b) => b.key), fixedNights(fixed)],
    [['tokyo', 'osaka'], 10]
  );
  test(
    'more nights than the trip has are caught before the API',
    planProblem(fixed, ['tokyo-disneyland']),
    'too_many_nights'
  );
  test(
    'leaving a base to the plan drops it, an area keeps it',
    [
      setBaseNights(fixed, 'tokyo', null, ORDER_JP).bases.map((b) => b.key),
      setBaseNights(setBaseArea(fixed, 'tokyo', 'maihama', ORDER_JP), 'tokyo', null, ORDER_JP)
        .bases[0],
    ],
    [['osaka'], { key: 'tokyo', nights: null, area: 'maihama' }]
  );
  test(
    'a :0 base takes no area',
    setBaseArea(setBaseNights(trip, 'nagoya', 0, ORDER_JP), 'nagoya', 'nagoya_station', ORDER_JP)
      .bases,
    [{ key: 'nagoya', nights: 0, area: null }]
  );
  test(
    'the region’s own buffer is written as nothing',
    [setMoveBuffer(trip, 30, 30).moveBuffer, setMoveBuffer(trip, 60, 30).moveBuffer],
    [null, 60]
  );

  const gw = (code) => ({ code, name: code, kind: 'airport' });
  test(
    'a gateway pins a base only when one base lists it; a shared one pins nothing',
    gatewayChoices([
      {
        key: 'disneyland-paris',
        name: '',
        hotelAreas: [],
        parks: [],
        gateways: [gw('XED'), gw('CDG')],
      },
      { key: 'parc-asterix', name: '', hotelAreas: [], parks: [], gateways: [gw('CDG')] },
      { key: 'paris', name: '', hotelAreas: [], parks: [], gateways: [gw('CDG'), gw('ORY')] },
    ]).map((c) => [c.base, c.gateways.map((g) => g.code)]),
    [
      ['disneyland-paris', ['XED']],
      ['paris', ['ORY']],
      [null, ['CDG']],
    ]
  );

  const move = (from, to, when) => ({
    from,
    to,
    when,
    minutes: 150,
    mode: 'shinkansen',
    departAt: '',
    arriveAt: '',
  });
  const d = (date, kind, base, extra = {}) => ({
    date,
    kind,
    base,
    parks: [],
    reasons: [],
    warnings: [],
    ...extra,
  });
  const plan = {
    meta: {
      stays: [
        { base: 'tokyo', from: '2027-04-10', to: '2027-04-12', nights: 2 },
        { base: 'nagoya', from: '2027-04-12', to: '2027-04-13', nights: 1 },
        { base: 'osaka', from: '2027-04-13', to: '2027-04-14', nights: 1 },
      ],
    },
    days: [
      d('2027-04-10', 'arrival', 'tokyo'),
      d('2027-04-11', 'park', 'tokyo'),
      d('2027-04-12', 'park', 'nagoya', { move: move('tokyo', 'nagoya', 'morning') }),
      d('2027-04-13', 'park', 'osaka', { move: move('nagoya', 'osaka', 'evening') }),
      d('2027-04-14', 'departure', 'osaka'),
    ],
  };
  test(
    'a day is listed where it is spent: a morning move in the city reached, an evening move in the city left',
    staySections(plan).map((s) => [
      s.stay?.base,
      s.arrival?.date ?? null,
      s.days.map((x) => x.date.slice(8)),
    ]),
    [
      ['tokyo', null, ['10', '11']],
      ['nagoya', '2027-04-12', ['12', '13']],
      ['osaka', '2027-04-13', ['14']],
    ]
  );
  test(
    'one stay is one section without a stay',
    staySections({ meta: { stays: [plan.meta.stays[0]] }, days: plan.days.slice(0, 2) }).map(
      (s) => s.stay
    ),
    [null]
  );
  test(
    'the band: a stay runs from the second half of its first day to the first half of its last',
    stayBandRuns(stayHalves(plan.days)),
    [
      { base: 'tokyo', start: 1, end: 5 },
      { base: 'nagoya', start: 5, end: 7 },
      { base: 'osaka', start: 7, end: 9 },
    ]
  );
  test(
    'the Month view’s band: the night’s stay, the one the day starts in, and where a stay begins',
    [...monthStayCells(plan)].map(([date, c]) => [
      date.slice(8),
      c.stay.base,
      c.left?.base ?? null,
      c.first,
    ]),
    [
      ['10', 'tokyo', null, true],
      ['11', 'tokyo', null, false],
      ['12', 'nagoya', 'tokyo', true],
      ['13', 'osaka', 'nagoya', true],
      ['14', 'osaka', null, false],
    ]
  );
}

// ── Day tickets grouped per resort ──────────────────────────────────────────
{
  const s = (id, resort, start, product = 'one-day', extra = {}) => ({
    id,
    resort,
    product,
    days: 1,
    start,
    end: start,
    parks: [],
    ...extra,
  });
  test(
    'six day tickets are one group per resort and product, each where its first day starts',
    suggestionGroups([
      s('a', 'tdr', '2026-12-11'),
      s('b', 'usj', '2026-12-15'),
      s('c', 'tdr', '2026-12-12'),
      s('d', 'fujiq', '2026-12-13'),
      s('e', 'usj', '2026-12-17'),
      s('f', 'usj', '2026-12-16', 'two-day'),
    ]).map((g) => [g.resort, g.product, g.items.map((i) => i.start.slice(8))]),
    [
      ['tdr', 'one-day', ['11', '12']],
      ['fujiq', 'one-day', ['13']],
      ['usj', 'one-day', ['15', '17']],
      ['usj', 'two-day', ['16']],
    ]
  );
}

// ── The regions' planner guides ─────────────────────────────────────────────
{
  const missing = TRIP_REGIONS.flatMap((region) =>
    Object.entries(region.guide ?? {})
      .filter(([locale, slug]) => !existsSync(`content/blog/${locale}/${slug}.md`))
      .map(([locale, slug]) => `${region.slug}:${locale}/${slug}`)
  );
  test('every planner guide a region names is a post in its locale', missing, []);
  test(
    'the guide is a blog path in the locale, the English one where a locale lacks its own',
    [tripRegionGuidePath(ORLANDO, 'de'), tripRegionGuidePath({ guide: undefined }, 'de')],
    ['/blog/reiseplaner-orlando', null]
  );
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
