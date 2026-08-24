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
 * Per-weekday level for Taron, the shape the "is 70 minutes a lot?" question
 * needs. `typical` is the median of the day's peak waits, `busy` the 90th
 * percentile of the same series — so `busy` is roughly "the busiest one day in
 * ten", not "the worst it has ever been". That record lives in `peak`.
 */
export const TARON_TYPICAL_WAITS: TypicalWaits = {
  weekday: { typical: 45, busy: 75, sampleDays: 96 },
  weekend: { typical: 65, busy: 100, sampleDays: 68 },
  byDayOfWeek: [
    { dayOfWeek: 1, isWeekend: false, typical: 40, busy: 68, sampleDays: 18 },
    { dayOfWeek: 2, isWeekend: false, typical: 42, busy: 70, sampleDays: 19 },
    { dayOfWeek: 3, isWeekend: false, typical: 44, busy: 72, sampleDays: 19 },
    { dayOfWeek: 4, isWeekend: false, typical: 46, busy: 76, sampleDays: 20 },
    { dayOfWeek: 5, isWeekend: false, typical: 52, busy: 84, sampleDays: 20 },
    { dayOfWeek: 6, isWeekend: true, typical: 70, busy: 105, sampleDays: 34 },
    { dayOfWeek: 0, isWeekend: true, typical: 62, busy: 95, sampleDays: 34 },
  ],
  peak: { value: 120, date: '2026-08-08' },
  windowDays: 365,
  dataFrom: '2025-12-24',
  dataTo: '2026-08-17',
  displayable: true,
  generatedAt: '2026-08-18T03:00:00.000Z',
};

/** The three readings the scroll figure walks through, in order. */
export interface WaitVerdict {
  /** Stable key, also the anchor id of the step. */
  id: 'tuesday' | 'saturday' | 'record';
  /** Weekday or occasion, as the step heading says it. */
  label: string;
  typical: number;
  busy: number;
  sampleDays: number;
}

export const TARON_VERDICTS: WaitVerdict[] = [
  { id: 'tuesday', label: 'Dienstag', typical: 42, busy: 70, sampleDays: 19 },
  { id: 'saturday', label: 'Samstag', typical: 70, busy: 105, sampleDays: 34 },
  { id: 'record', label: 'Rekordtag', typical: 70, busy: 120, sampleDays: 34 },
];

/** Upper end of the scale the figure draws. Above Taron's record, so nothing clips. */
export const WAIT_SCALE_MAX = 130;

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
   * `worth` is true here because the daily peak clears 60 minutes and rope
   * dropping saves at least 45 of them — the two thresholds the backend applies
   * before it recommends anything at all.
   */
  const ropeDrop: RopeDropInfo = {
    worth: true,
    strength: 'high',
    confidence: 'high',
    busyPeak: 95,
    openWait: 15,
    savings: 80,
    rideByMinutesAfterOpen: 45,
    bestSlotMinutesAfterOpen: 585,
    bestSlotWait: 25,
    endOfDayWorth: true,
    endOfDaySavings: 70,
    rideByUtc: parkLocalInstant(nowMs, 9, 45),
    bestSlotUtc: parkLocalInstant(nowMs, 18, 45),
    byDaytype: {
      weekend: { openWait: 20, busyPeak: 105, savings: 85 },
      weekday: { openWait: 15, busyPeak: 85, savings: 70 },
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
    crowdLevel: 'high',
    trend: 'up',
    isHeadliner: true,
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
      avgWaitToday: 48,
      minWaitToday: 10,
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
    crowdLevel: 'low',
    trend: 'down',
    isHeadliner: true,
    queues: [
      {
        queueType: 'STANDBY',
        status: 'OPERATING',
        waitTime: 10,
        lastUpdated: at(-4),
        trend: { direction: 'down', changeRate: -3, recentAverage: 12, previousAverage: 20 },
      },
    ],
    statistics: {
      avgWaitToday: 18,
      minWaitToday: 5,
      maxWaitToday: 30,
      peakWaitToday: 30,
      peakWaitTimestamp: at(-90),
      history: [
        { timestamp: at(-150), waitTime: 5 },
        { timestamp: at(-120), waitTime: 15 },
        { timestamp: at(-90), waitTime: 30 },
        { timestamp: at(-60), waitTime: 25 },
        { timestamp: at(-30), waitTime: 15 },
        { timestamp: at(-4), waitTime: 10 },
      ],
    },
  };

  return { taron, mamba, ropeDrop, bestSlot, closeUtc: parkLocalInstant(nowMs, 20, 0) };
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
 * Taron's day in 90th-percentile minutes per hour — the series behind the "come
 * back at 18:45" advice. An hour only earns a column once it has been measured
 * on enough days; the early and late ends of a park's day are the ones that
 * usually have not.
 */
export const TARON_HOURLY_P90 = [
  { hour: '09:00', value: 20 },
  { hour: '10:00', value: 45 },
  { hour: '11:00', value: 65 },
  { hour: '12:00', value: 80 },
  { hour: '13:00', value: 90 },
  { hour: '14:00', value: 95 },
  { hour: '15:00', value: 90 },
  { hour: '16:00', value: 75 },
  { hour: '17:00', value: 60 },
  { hour: '18:00', value: 40 },
  { hour: '19:00', value: 25 },
];
