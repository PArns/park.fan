import type { PlanDay, PlanDayRide } from '@/lib/api/types';
import type { PlannerEntry } from '@/lib/planner/types';
import { enrichAttractionsWithImages } from '@/lib/utils/park-assets';

/**
 * One real day at Phantasialand, frozen.
 *
 * Every number below is what `/v1/parks/europe/germany/bruehl/phantasialand/
 * plan/day?date=2026-09-12` answered on 4 September 2026, eight days ahead of
 * the day it describes — an ordinary Saturday in September, `crowdLevel: low`,
 * open 09:00 to 18:00, drizzle. Nothing is rounded, invented or prettied up,
 * which is the whole point of the exhibit: the blocks on this page are drawn by
 * the planner's own components off the payload the planner itself reads, so the
 * reader is looking at the product rather than at a picture of it.
 *
 * It is a FORECAST and stays one. The date has since passed, and the caption
 * beside the demo says so — a fixture that renewed itself would either have to
 * invent numbers for a day nobody has measured or re-fetch on every render, and
 * both are worse than a dated example. The date being in the past is also what
 * keeps the exhibit inert: `PlannerDayGrid` gates its weather query on the
 * forecast horizon, so a demo of a day in September 2026 fires no request.
 *
 * Two things in here are worth reading twice, because the prose beside the demo
 * points at them:
 *
 *   - `expectedError` is 15.4 minutes on the eight headliners and 10.9 on the
 *     rest. It is a TYPICAL error, not a bound.
 *   - `opensAt` is 10:00 on most rides while the park opens at 09:00, and
 *     absent on Black Mamba and Maus au Chocolat, which run from the gates.
 *     `hours` starts where the ride does, so the first hour of the day has two
 *     rides in it and not sixteen.
 */
const READ_AT = '2026-09-04';

/** When these numbers were read, for the caption. */
export const DEMO_READ_AT = READ_AT;

/** The day the numbers are about. */
export const DEMO_DATE = '2026-09-12';

const RIDES: PlanDayRide[] = [
  {
    attractionSlug: 'black-mamba',
    attractionName: 'Black Mamba',
    land: 'Deep in Africa',
    hours: [
      { hour: 9, wait: 25 },
      { hour: 10, wait: 25 },
      { hour: 11, wait: 35 },
      { hour: 12, wait: 35 },
      { hour: 13, wait: 30 },
      { hour: 14, wait: 30 },
      { hour: 15, wait: 25 },
      { hour: 16, wait: 25 },
      { hour: 17, wait: 20 },
      { hour: 18, wait: 20 },
    ],
    dayPeak: 35,
    sampleDays: 161,
    expectedError: 15.4,
    isHeadliner: true,
    latitude: 50.7987204,
    longitude: 6.8807868,
  },
  {
    attractionSlug: 'taron',
    attractionName: 'Taron',
    land: 'Mystery',
    opensAt: '10:00',
    hours: [
      { hour: 10, wait: 45 },
      { hour: 11, wait: 50 },
      { hour: 12, wait: 45 },
      { hour: 13, wait: 40 },
      { hour: 14, wait: 45 },
      { hour: 15, wait: 45 },
      { hour: 16, wait: 50 },
      { hour: 17, wait: 50 },
      { hour: 18, wait: 50 },
    ],
    dayPeak: 50,
    sampleDays: 142,
    expectedError: 15.4,
    isHeadliner: true,
    latitude: 50.7996591,
    longitude: 6.8829768,
  },
  {
    attractionSlug: 'fly',
    attractionName: 'F.L.Y.',
    land: 'Rookburgh',
    opensAt: '10:00',
    hours: [
      { hour: 10, wait: 35 },
      { hour: 11, wait: 45 },
      { hour: 12, wait: 40 },
      { hour: 13, wait: 35 },
      { hour: 14, wait: 35 },
      { hour: 15, wait: 35 },
      { hour: 16, wait: 35 },
      { hour: 17, wait: 30 },
      { hour: 18, wait: 30 },
    ],
    dayPeak: 46,
    sampleDays: 152,
    expectedError: 15.4,
    isHeadliner: true,
    latitude: 50.8000094,
    longitude: 6.87927,
  },
  {
    attractionSlug: 'chiapas-die-wasserbahn',
    attractionName: 'Chiapas - DIE Wasserbahn',
    land: 'Mexico',
    opensAt: '10:15',
    hours: [
      { hour: 10, wait: 20 },
      { hour: 11, wait: 30 },
      { hour: 12, wait: 30 },
      { hour: 13, wait: 35 },
      { hour: 14, wait: 35 },
      { hour: 15, wait: 35 },
      { hour: 16, wait: 30 },
      { hour: 17, wait: 30 },
      { hour: 18, wait: 30 },
    ],
    dayPeak: 35,
    sampleDays: 125,
    expectedError: 15.4,
    isHeadliner: true,
    latitude: 50.799319,
    longitude: 6.8816347,
  },
  {
    attractionSlug: 'winjas-force',
    attractionName: 'Winja‘s Force',
    land: 'Fantasy',
    opensAt: '10:00',
    hours: [
      { hour: 10, wait: 25 },
      { hour: 11, wait: 35 },
      { hour: 12, wait: 40 },
      { hour: 13, wait: 35 },
      { hour: 14, wait: 35 },
      { hour: 15, wait: 35 },
      { hour: 16, wait: 30 },
      { hour: 17, wait: 30 },
      { hour: 18, wait: 30 },
    ],
    dayPeak: 41,
    sampleDays: 156,
    expectedError: 15.4,
    isHeadliner: true,
    latitude: 50.8001647,
    longitude: 6.8774334,
  },
  {
    attractionSlug: 'raik',
    attractionName: 'Raik',
    land: 'Mystery',
    opensAt: '10:00',
    hours: [
      { hour: 10, wait: 30 },
      { hour: 11, wait: 35 },
      { hour: 12, wait: 30 },
      { hour: 13, wait: 25 },
      { hour: 14, wait: 25 },
      { hour: 15, wait: 25 },
      { hour: 16, wait: 20 },
      { hour: 17, wait: 20 },
      { hour: 18, wait: 20 },
    ],
    dayPeak: 35,
    sampleDays: 141,
    expectedError: 15.4,
    isHeadliner: true,
    latitude: 50.7996994,
    longitude: 6.8833607,
  },
  {
    attractionSlug: 'maus-au-chocolat',
    attractionName: 'Maus au Chocolat',
    land: 'Berlin',
    hours: [
      { hour: 9, wait: 15 },
      { hour: 10, wait: 15 },
      { hour: 11, wait: 20 },
      { hour: 12, wait: 20 },
      { hour: 13, wait: 25 },
      { hour: 14, wait: 25 },
      { hour: 15, wait: 20 },
      { hour: 16, wait: 20 },
      { hour: 17, wait: 20 },
      { hour: 18, wait: 20 },
    ],
    dayPeak: 24,
    sampleDays: 140,
    expectedError: 10.9,
    latitude: 50.8000721,
    longitude: 6.8803771,
  },
  {
    attractionSlug: 'colorado-adventure',
    attractionName: 'Colorado Adventure',
    land: 'Mexico',
    opensAt: '10:00',
    hours: [
      { hour: 10, wait: 30 },
      { hour: 11, wait: 30 },
      { hour: 12, wait: 30 },
      { hour: 13, wait: 25 },
      { hour: 14, wait: 25 },
      { hour: 15, wait: 25 },
      { hour: 16, wait: 25 },
      { hour: 17, wait: 25 },
      { hour: 18, wait: 25 },
    ],
    dayPeak: 28,
    sampleDays: 138,
    expectedError: 10.9,
    isHeadliner: true,
    latitude: 50.7985636,
    longitude: 6.8820704,
  },
];

/**
 * The demo day, with the ride photos the proxy route would have put on it.
 *
 * `enrichAttractionsWithImages` is the same call `app/api/parks/[...path]` makes
 * on a real `/plan/day`, so a focal point curated in the admin decides the crop
 * inside these blocks exactly as it does in the panel. It runs HERE, on the
 * server, because `@/lib/media` is the 107 KB catalogue and the demo below it is
 * a Client Component.
 */
export function demoPlanDay(): PlanDay {
  const withImages = enrichAttractionsWithImages(
    RIDES.map((ride) => ({ ...ride, slug: ride.attractionSlug, park: { slug: 'phantasialand' } }))
  );

  return {
    parkSlug: 'phantasialand',
    timezone: 'Europe/Berlin',
    context: {
      date: DEMO_DATE,
      status: 'OPERATING',
      openHour: 9,
      closeHour: 18,
      hoursSource: 'schedule',
      crowdLevel: 'low',
      weather: {
        condition: 'Drizzle, moderate intensity',
        tempMin: 10.6,
        tempMax: 16.4,
        rainChance: 2.1,
        precipitationMm: 2.1,
        snowMm: 0,
        windMax: 6.6,
        icon: 53,
      },
      isHoliday: false,
      isBridgeDay: false,
      isSchoolVacation: false,
      isWeekend: true,
    },
    tier: 'composed',
    leadDays: 8,
    accuracy: { basis: 'measured' },
    rides: withImages.map(({ slug: _slug, park: _park, ...ride }) => ride) as PlanDayRide[],
    // Verbatim, including the two times past closing: `showLinesFor` drops a
    // PROJECTED time outside the park's hours, which is why Kroka's Lodge at
    // 19:00 and Dragon Wang at 19:15 are in the payload and not on the axis.
    shows: [
      {
        showSlug: 'miji-african-dancers',
        showName: 'Miji African Dancers',
        times: ['11:30', '13:30', '15:00', '16:30', '17:30'],
        source: 'projected',
        observedOn: '2026-08-29',
        sampleDays: 8,
      },
      {
        showSlug: 'dragon-drago',
        showName: 'Dragon Drago',
        times: ['12:00', '13:15', '14:30', '16:15', '17:30'],
        source: 'projected',
        observedOn: '2026-08-15',
        sampleDays: 6,
      },
      {
        showSlug: 'krokas-lodge',
        showName: "Kroka's Lodge",
        times: ['12:15', '13:30', '14:45', '16:00', '17:45', '19:00'],
        source: 'projected',
        observedOn: '2026-08-15',
        sampleDays: 6,
      },
      {
        showSlug: 'dragon-wang',
        showName: 'Dragon Wang',
        times: ['12:30', '13:45', '15:00', '16:45', '18:00', '19:15'],
        source: 'projected',
        observedOn: '2026-08-15',
        sampleDays: 6,
      },
    ],
  };
}

/**
 * A day somebody might actually have planned out of that payload.
 *
 * Chosen to put the machinery on screen rather than to be optimal: Black Mamba
 * in the first hour because it is one of two rides that run before 10:00, Taron
 * straight after because its curve barely moves all day (45/50/45/40/45/45/50/
 * 50/50 — there is no cheap hour to wait for), a break in the middle, and
 * Winja's Force late because Rookburgh and Fantasy are at opposite ends of the
 * park and the leg between them is the point.
 *
 * The free block's label is passed in, because "Essen" is a word and this page
 * exists in six languages.
 */
export function demoEntries(lunchLabel: string): PlannerEntry[] {
  return [
    {
      id: 'demo-mamba',
      attractionSlug: 'black-mamba',
      attractionName: 'Black Mamba',
      startMinute: 545,
    },
    { id: 'demo-taron', attractionSlug: 'taron', attractionName: 'Taron', startMinute: 600 },
    { id: 'demo-fly', attractionSlug: 'fly', attractionName: 'F.L.Y.', startMinute: 675 },
    {
      id: 'demo-lunch',
      custom: { label: lunchLabel, icon: 'food', durationMinutes: 45 },
      startMinute: 750,
    },
    {
      id: 'demo-chiapas',
      attractionSlug: 'chiapas-die-wasserbahn',
      attractionName: 'Chiapas - DIE Wasserbahn',
      startMinute: 810,
    },
    {
      id: 'demo-winjas',
      attractionSlug: 'winjas-force',
      attractionName: 'Winja‘s Force',
      startMinute: 885,
    },
    { id: 'demo-raik', attractionSlug: 'raik', attractionName: 'Raik', startMinute: 960 },
  ];
}
