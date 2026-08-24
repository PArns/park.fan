import type {
  BestVisitSlot,
  CalendarDay,
  ParkAttraction,
  RopeDropInfo,
  TypicalWaits,
} from '@/lib/api/types';

/**
 * Fixtures for the guide's example UI.
 *
 * Every block on this page renders the **real** production component, fed from
 * here rather than from the network. That is the point of the page: a visitor
 * should recognise the card they are being taught to read when they meet it on
 * a park page an hour later, so a redrawn lookalike would defeat the exercise
 * (and drift away from the real one the first time it is restyled).
 *
 * Two rules these numbers follow:
 *
 * - **Nothing here is a live claim.** The figures are a plausible Taron in
 *   summer, shaped so the teaching example works, not a reading taken on a
 *   particular day. The page says so where it matters, and every block links to
 *   the ride's own page for the real ones.
 * - **The ones that are instants are anchored to today.** A card's sparkline
 *   stretches its axis to the reader's clock and the "best time" row counts
 *   down to it, so a hard-coded date does not stay a demo: it decays into a
 *   flat line with a week-long tail and a permanent "right now". Those few
 *   values are built by {@link buildDemoFixtures} from a `nowMs` the caller
 *   passes in — `getServerNowMs()`, which on this prerendered route resolves at
 *   build time and is refreshed by the route's daily revalidate.
 */

const PARK_TZ = 'Europe/Berlin';
export const DEMO_TIMEZONE = PARK_TZ;

/**
 * The UTC instant of `hour:minute` **park time on the day `nowMs` falls in**.
 *
 * Formatting `nowMs` in the park's zone and re-reading those fields as if they
 * were UTC gives the zone's offset for that very instant, which is the only way
 * to get this right across a DST boundary without a date library.
 */
function parkLocalInstant(nowMs: number, hour: number, minute: number): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PARK_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date(nowMs));
  const field = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const wallAsUtc = Date.UTC(
    field('year'),
    field('month') - 1,
    field('day'),
    field('hour'),
    field('minute'),
    field('second')
  );
  const offsetMs = wallAsUtc - Math.floor(nowMs / 1000) * 1000;
  return new Date(
    Date.UTC(field('year'), field('month') - 1, field('day'), hour, minute) - offsetMs
  ).toISOString();
}

// ── The number the whole page starts from ────────────────────────────────────

/** What the sign at the entrance says. Everything else on this page is context for it. */
export const TARON_WAIT_NOW = 70;

/**
 * Taron's per-weekday level — **the values the API actually returned** on
 * 2026-08-24 (`GET /v1/parks/europe/germany/bruehl/phantasialand/attractions/taron`,
 * field `typicalWaits`), not a shape invented to make the lesson land.
 *
 * `typical` is the median of the day's peak waits, `busy` the 90th percentile of
 * the same series — so `busy` is roughly "the busiest one day in ten", not "the
 * worst it has ever been". That record lives in `peak`.
 *
 * They are frozen here rather than fetched because a lesson that changes shape
 * overnight is not a lesson: the three steps in chapter 02 are written around
 * 70 minutes landing above Monday's busy line and exactly on Saturday's median.
 * Re-check them against the ride's own page when this page is next edited; the
 * page links there from the same block so a reader can do it too.
 */
export const TARON_TYPICAL_WAITS: TypicalWaits = {
  weekday: { typical: 60, busy: 80, sampleDays: 97 },
  weekend: { typical: 70, busy: 80, sampleDays: 38 },
  byDayOfWeek: [
    { dayOfWeek: 0, isWeekend: true, typical: 60, busy: 75, sampleDays: 18 },
    { dayOfWeek: 1, isWeekend: false, typical: 55, busy: 65, sampleDays: 19 },
    { dayOfWeek: 2, isWeekend: false, typical: 55, busy: 80, sampleDays: 19 },
    { dayOfWeek: 3, isWeekend: false, typical: 60, busy: 80, sampleDays: 20 },
    { dayOfWeek: 4, isWeekend: false, typical: 60, busy: 80, sampleDays: 18 },
    { dayOfWeek: 5, isWeekend: false, typical: 60, busy: 80, sampleDays: 21 },
    { dayOfWeek: 6, isWeekend: true, typical: 70, busy: 85, sampleDays: 20 },
  ],
  peak: { value: 135, date: '2026-07-16' },
  windowDays: 365,
  dataFrom: '2025-08-24',
  dataTo: '2026-08-23',
  displayable: true,
  generatedAt: '2026-08-24T09:37:01.091Z',
};

/**
 * The median Taron's live crowd level is measured against (`baseline` on the
 * attraction payload, 45 minutes on 2026-08-24). 70 ÷ 45 is about 156 %, and the
 * tier boundaries are 60 / 89 / 110 / 150 / 200 — which is why the demo card
 * reads "sehr hoch" and not "hoch".
 */
export const TARON_BASELINE = 45;

/** Taron's highest measured wait in the window, and the day it happened. */
export const TARON_RECORD = 135;
export const TARON_RECORD_DATE = '2026-07-16';

/** Days behind the two summary buckets on the ride's card. */
export const TARON_WEEKDAY_DAYS = 97;
export const TARON_WEEKEND_DAYS = 38;

/** Upper end of the scale the figure draws. Above Taron's record, so nothing clips. */
export const WAIT_SCALE_MAX = 140;

// ── Attraction cards, rope drop, best slot ───────────────────────────────────

const PARK_PATH = '/parks/europe/germany/bruehl/phantasialand';

export interface DemoFixtures {
  /** Taron as the park page renders it: 70 minutes, queue still growing. */
  taron: ParkAttraction;
  /** The neighbour nobody is queueing for, same minute, same park. */
  mamba: ParkAttraction;
  ropeDrop: RopeDropInfo;
  bestSlot: BestVisitSlot;
  /** Today's closing time in park terms, so the rope-drop card can sanity-check its trough. */
  closeUtc: string;
}

/**
 * Builds the instants-bearing half of the fixtures around `nowMs`.
 *
 * Two different anchors on purpose:
 *
 * - The **queue history** and the **best-visit slot** hang off `nowMs` as plain
 *   offsets, because that is how a reader experiences them: a sparkline of the
 *   last two and a half hours, and a slot a couple of hours out.
 * - The **rope-drop instants** are wall-clock times on today's date in the
 *   park's zone, because the card renders them as "until about 09:45" and an
 *   offset from now would drift into nonsense by the afternoon.
 */
export function buildDemoFixtures(nowMs: number): DemoFixtures {
  const at = (offsetMinutes: number) => new Date(nowMs + offsetMinutes * 60_000).toISOString();

  const bestSlot: BestVisitSlot = {
    time: at(130),
    predictedWaitTime: 35,
    rating: 'optimal',
  };

  /**
   * Taron's real recommendation on 2026-08-24. `worth` is true because the daily
   * peak clears 60 minutes and rope-dropping saves at least 45 of them — the two
   * thresholds the backend applies before it recommends anything. `strength` is
   * `moderate` rather than `high` because the peak is 70, under the 90 that
   * upgrades it. Same park, same morning: Colorado Adventure saves 40 minutes off
   * a 50-minute peak and therefore gets no recommendation at all.
   *
   * The trough sits at the same +60 minutes as the advantage window, which is
   * what this ride's day actually looks like — the quietest moment is right
   * after opening, not in the evening.
   */
  const ropeDrop: RopeDropInfo = {
    worth: true,
    strength: 'moderate',
    confidence: 'high',
    busyPeak: 70,
    openWait: 10,
    savings: 60,
    rideByMinutesAfterOpen: 60,
    bestSlotMinutesAfterOpen: 60,
    bestSlotWait: 10,
    endOfDayWorth: true,
    endOfDaySavings: 60,
    rideByUtc: parkLocalInstant(nowMs, 10, 0),
    bestSlotUtc: parkLocalInstant(nowMs, 10, 0),
    byDaytype: {
      weekend: { openWait: 10, busyPeak: 70, savings: 60 },
      weekday: { openWait: 10, busyPeak: 70, savings: 60 },
    },
  };

  const taron: ParkAttraction = {
    id: 'demo-taron',
    name: 'Taron',
    slug: 'taron',
    url: `${PARK_PATH}/taron`,
    latitude: null,
    longitude: null,
    land: 'Klugheim',
    status: 'OPERATING',
    // 70 ÷ the ride's 45-minute baseline is ~156 %, and the tier boundary to
    // "very high" is 150. The card's badge is therefore not a styling choice.
    crowdLevel: 'very_high',
    trend: 'up',
    isHeadliner: true,
    minimumHeight: 140,
    queues: [
      {
        queueType: 'STANDBY',
        status: 'OPERATING',
        waitTime: TARON_WAIT_NOW,
        lastUpdated: at(-3),
        trend: { direction: 'up', changeRate: 5, recentAverage: 68, previousAverage: 55 },
      },
      {
        queueType: 'SINGLE_RIDER',
        status: 'OPERATING',
        waitTime: 20,
        lastUpdated: at(-3),
      },
    ],
    statistics: {
      avgWaitToday: 50,
      minWaitToday: 30,
      maxWaitToday: TARON_WAIT_NOW,
      peakWaitToday: TARON_WAIT_NOW,
      peakWaitTimestamp: at(-3),
      history: [
        { timestamp: at(-150), waitTime: 15 },
        { timestamp: at(-120), waitTime: 25 },
        { timestamp: at(-90), waitTime: 40 },
        { timestamp: at(-60), waitTime: 50 },
        { timestamp: at(-30), waitTime: 60 },
        { timestamp: at(-3), waitTime: TARON_WAIT_NOW },
      ],
    },
    bestVisitTimes: [bestSlot],
    ropeDrop,
    typicalWaits: TARON_TYPICAL_WAITS,
  };

  const mamba: ParkAttraction = {
    id: 'demo-black-mamba',
    name: 'Black Mamba',
    slug: 'black-mamba',
    url: `${PARK_PATH}/black-mamba`,
    latitude: null,
    longitude: null,
    land: 'Deep in Africa',
    status: 'OPERATING',
    // Live on 2026-08-24: 15 minutes against a 30-minute baseline, so "very low".
    crowdLevel: 'very_low',
    trend: 'down',
    isHeadliner: true,
    minimumHeight: 140,
    queues: [
      {
        queueType: 'STANDBY',
        status: 'OPERATING',
        waitTime: 15,
        lastUpdated: at(-4),
        trend: { direction: 'down', changeRate: -3, recentAverage: 17, previousAverage: 25 },
      },
    ],
    statistics: {
      avgWaitToday: 20,
      minWaitToday: 10,
      maxWaitToday: 35,
      peakWaitToday: 35,
      peakWaitTimestamp: at(-90),
      history: [
        { timestamp: at(-150), waitTime: 10 },
        { timestamp: at(-120), waitTime: 20 },
        { timestamp: at(-90), waitTime: 35 },
        { timestamp: at(-60), waitTime: 30 },
        { timestamp: at(-30), waitTime: 20 },
        { timestamp: at(-4), waitTime: 15 },
      ],
    },
  };

  return { taron, mamba, ropeDrop, bestSlot, closeUtc: parkLocalInstant(nowMs, 19, 0) };
}

/**
 * A ride that is shut for a reason no live feed states: it runs from November
 * to January, and in August nobody reports anything about it at all. The
 * seasonal fields are what keeps that silence from being read as "open".
 */
export const OFF_SEASON_CARD: ParkAttraction = {
  id: 'demo-eisbahn',
  name: 'Schlittschuhverleih',
  slug: 'schlittschuhverleih',
  url: `${PARK_PATH}/schlittschuhverleih`,
  latitude: null,
  longitude: null,
  land: 'Berlin',
  status: 'CLOSED',
  isSeasonal: true,
  seasonMonths: [11, 12, 1],
  isCurrentlyInSeason: false,
  queues: [],
};

// ── Calendar ────────────────────────────────────────────────────────────────

/**
 * Four days out of an autumn-break week, the case the calendar exists for: the
 * dates are consecutive, the crowd levels are not, and what separates them is
 * whose schools are off rather than anything visible in a brochure.
 */
export const DEMO_CALENDAR_DAYS: CalendarDay[] = [
  {
    date: '2026-10-12',
    status: 'OPERATING',
    isToday: false,
    isTomorrow: false,
    crowdLevel: 'moderate',
    avgWaitTime: 24,
    isHoliday: false,
    isBridgeDay: false,
    isSchoolVacation: false,
    hours: {
      openingTime: '2026-10-12T07:00:00.000Z',
      closingTime: '2026-10-12T16:00:00.000Z',
      type: 'OPERATING',
      isInferred: false,
    },
    weather: { condition: 'Bewölkt', icon: 3, tempMin: 9, tempMax: 16, rainChance: 0.4 },
  },
  {
    date: '2026-10-14',
    status: 'OPERATING',
    isToday: false,
    isTomorrow: false,
    crowdLevel: 'very_high',
    avgWaitTime: 52,
    isHoliday: false,
    isBridgeDay: false,
    isSchoolVacation: true,
    isSchoolHoliday: true,
    hours: {
      openingTime: '2026-10-14T07:00:00.000Z',
      closingTime: '2026-10-14T18:00:00.000Z',
      type: 'OPERATING',
      isInferred: false,
    },
    weather: { condition: 'Sonnig', icon: 0, tempMin: 11, tempMax: 20, rainChance: 0 },
  },
  {
    date: '2026-10-15',
    status: 'OPERATING',
    isToday: false,
    isTomorrow: false,
    crowdLevel: 'low',
    avgWaitTime: 16,
    isHoliday: false,
    isBridgeDay: false,
    isSchoolVacation: true,
    isSchoolHoliday: true,
    hours: {
      openingTime: '2026-10-15T07:00:00.000Z',
      closingTime: '2026-10-15T18:00:00.000Z',
      type: 'OPERATING',
      isInferred: false,
    },
    weather: { condition: 'Regen', icon: 61, tempMin: 8, tempMax: 13, rainChance: 7.2 },
  },
  {
    date: '2026-10-19',
    status: 'CLOSED',
    isToday: false,
    isTomorrow: false,
    crowdLevel: 'unknown',
    isHoliday: false,
    isBridgeDay: false,
    isSchoolVacation: true,
    weather: { condition: 'Bewölkt', icon: 3, tempMin: 7, tempMax: 14, rainChance: 1.1 },
  },
];

// ── Hourly shape ─────────────────────────────────────────────────────────────

/**
 * Two rides out of the same park, same table, same year — and two completely
 * different days. Real figures from
 * `GET /v1/parks/europe/germany/bruehl/phantasialand/stats/hourly?years=1`
 * on 2026-08-24 (152 measured days, `schemaVersion` 3), 90th percentile per hour.
 *
 * The pair is the point of chapter 03. Taron's queue barely moves between 10:00
 * and 17:00, so for that ride the hour is nearly irrelevant and the weekday
 * decides everything. Chiapas climbs by more than half across the same day. A
 * single "arrive early" rule would be wrong for one of them, which is why the
 * recommendation is computed per ride.
 *
 * Only five hours are columns at all. An hour needs at least 10 measured days on
 * that ride, at least 40 % of the best-measured hour's day count, and at least
 * half the rides in the table have to report it — which is what removes a park
 * day's edges, where one hotel-guest early-entry queue would otherwise speak for
 * the whole morning.
 */
export interface HourlyShape {
  name: string;
  points: Array<{ hour: string; value: number }>;
  /** Difference between the ride's own quietest and busiest column. */
  spread: number;
}

function shape(name: string, hours: number[], p90: number[]): HourlyShape {
  return {
    name,
    points: hours.map((h, i) => ({ hour: `${String(h).padStart(2, '0')}:00`, value: p90[i] })),
    spread: Math.max(...p90) - Math.min(...p90),
  };
}

export const HOURLY_SHAPES: HourlyShape[] = [
  shape('Taron', [10, 11, 12, 13, 17], [60, 60, 54, 53, 59]),
  shape('Chiapas', [10, 11, 12, 13, 17], [38, 50, 58, 60, 54]),
];

/** Measured days behind the table above. */
export const HOURLY_SAMPLE_DAYS = 152;
