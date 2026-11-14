import { isPlannedDay, type PlannerState } from '@/lib/planner/types';
import { daysBetween, todayInZone } from '@/lib/planner/park-time';
import { getDateTimeFormat } from '@/lib/utils/intl-format';

/**
 * What Parky knows about the visitor from this browser alone, the way a friend who was there when
 * they planned would: the planned days, the rides ticked off, an alert, the park the last chat was
 * about. Read here, said by the bubble, the greeting and the window's subtitle, and nothing extra
 * goes to the API for it. Pure, so the order can be tested.
 */

/** One thing Parky can bring up about the visitor's own plans, as {@link yoursMoments} finds it. */
export type YoursMoment =
  | { kind: 'today'; park: string; date: string }
  | { kind: 'yesterday'; park: string; date: string }
  | { kind: 'tomorrow'; park: string; date: string }
  | { kind: 'soon'; park: string; date: string; days: number }
  | { kind: 'trip'; count: number; date: string }
  | { kind: 'ridden'; count: number }
  | { kind: 'back'; park: string }
  | { kind: 'alert'; ride: string };

/** The kinds of {@link YoursMoment}. */
export type YoursKind = YoursMoment['kind'];

/** What {@link yoursMoments} reads, all of it from this browser. */
export interface YoursInput {
  planner: PlannerState;
  /** How many rides are marked as ridden. */
  ridden: number;
  /** The names of the rides with an alert set. */
  alerts: readonly string[];
  /** The park the last chat was about, when this is a later visit (`last-park.ts`). */
  lastPark: { name: string } | null;
  now: number;
}

/** A planned day this far off or nearer is close enough to count down to. */
export const YOURS_SOON_DAYS = 14;
/** This many planned days within {@link YOURS_TRIP_WINDOW_DAYS} make a trip. */
export const YOURS_TRIP_DAYS = 3;
export const YOURS_TRIP_WINDOW_DAYS = 30;
/** The ridden counts Parky congratulates on, on the day the count stands there. */
export const RIDDEN_MILESTONES: readonly number[] = [10, 25, 50, 100];

/** The order Parky picks in, best first: the nearest day beats the trip, the trip the rest. */
export const YOURS_ORDER: readonly YoursKind[] = [
  'today',
  'yesterday',
  'tomorrow',
  'soon',
  'trip',
  'ridden',
  'back',
  'alert',
];

interface Dated {
  park: string;
  date: string;
  /** Nights from the park's own today; negative for a day gone by. */
  offset: number;
}

/** Every planned day, each against its park's own today, nearest first then by name. */
function datedDays(planner: PlannerState, now: number): Dated[] {
  return Object.values(planner.parks)
    .flatMap((park) => {
      const today = todayInZone(park.timezone, now);
      return Object.values(park.days)
        .filter(isPlannedDay)
        .map((day) => ({ park: park.name, date: day.date, offset: daysBetween(today, day.date) }));
    })
    .sort(
      (a, b) => a.offset - b.offset || a.date.localeCompare(b.date) || a.park.localeCompare(b.park)
    );
}

/** Every moment that holds now, in {@link YOURS_ORDER}. */
export function yoursMoments(input: YoursInput): YoursMoment[] {
  const days = datedDays(input.planner, input.now);
  const on = (offset: number) => days.find((day) => day.offset === offset);
  const ahead = days.filter((day) => day.offset >= 0);
  const moments: YoursMoment[] = [];
  const today = on(0);
  if (today) moments.push({ kind: 'today', park: today.park, date: today.date });
  const yesterday = on(-1);
  if (yesterday) moments.push({ kind: 'yesterday', park: yesterday.park, date: yesterday.date });
  const tomorrow = on(1);
  if (tomorrow) moments.push({ kind: 'tomorrow', park: tomorrow.park, date: tomorrow.date });
  const soon = ahead.find((day) => day.offset >= 2 && day.offset <= YOURS_SOON_DAYS);
  if (soon) moments.push({ kind: 'soon', park: soon.park, date: soon.date, days: soon.offset });
  // Two parks on one date are one park day.
  const tripDates = [
    ...new Set(ahead.filter((day) => day.offset <= YOURS_TRIP_WINDOW_DAYS).map((day) => day.date)),
  ];
  if (tripDates.length >= YOURS_TRIP_DAYS) {
    moments.push({ kind: 'trip', count: tripDates.length, date: tripDates[0] });
  }
  if (RIDDEN_MILESTONES.includes(input.ridden))
    moments.push({ kind: 'ridden', count: input.ridden });
  if (input.lastPark) moments.push({ kind: 'back', park: input.lastPark.name });
  if (input.alerts[0]) moments.push({ kind: 'alert', ride: input.alerts[0] });
  return moments;
}

/** The nearest planned day from today on, for the window's subtitle; null without one. */
export function nextUp(planner: PlannerState, now: number): { park: string; date: string } | null {
  const next = datedDays(planner, now).find((day) => day.offset >= 0);
  return next ? { park: next.park, date: next.date } : null;
}

/** The greeting each moment opens a chat with; the others leave the greeting to chance. */
export const YOURS_GREETINGS = {
  today: 'greetingToday',
  yesterday: 'greetingAfter',
  tomorrow: 'greetingSoon',
  soon: 'greetingSoon',
  trip: 'greetingTrip',
  back: 'greetingBack',
} as const satisfies Partial<Record<YoursKind, string>>;

/** The kinds a chat can open with. */
export type YoursGreetingKind = keyof typeof YOURS_GREETINGS;

/**
 * The chips a personal greeting puts first, whole questions about the visitor's own plans, so they
 * read right to the model whatever the greeting said.
 */
export const YOURS_CHIPS = {
  today: ['suggestMyNext', 'suggestMyDay'],
  yesterday: ['suggestMyMissing'],
  tomorrow: ['suggestMyDay', 'suggestMyWeather'],
  soon: ['suggestMyDay', 'suggestMyWeather'],
  trip: ['suggestMyTrip'],
  back: ['suggestMyBack'],
} as const satisfies Record<YoursGreetingKind, readonly string[]>;

/** The bubble line of each moment, as keys of the `assistant` namespace. */
export const YOURS_LINES = {
  today: 'yoursToday',
  yesterday: 'yoursAfter',
  tomorrow: 'yoursTomorrow',
  soon: 'yoursSoon',
  trip: 'yoursTrip',
  ridden: 'yoursRidden',
  back: 'yoursBack',
  alert: 'yoursAlert',
} as const satisfies Record<YoursKind, string>;

/** Whether a moment can open a chat. */
export function opensChat(
  moment: YoursMoment
): moment is Extract<YoursMoment, { kind: YoursGreetingKind }> {
  return moment.kind in YOURS_GREETINGS;
}

/** A planned date, from noon UTC so no zone moves it to another day. */
function formatDate(date: string, locale: string, options: Intl.DateTimeFormatOptions): string {
  return getDateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(
    new Date(`${date}T12:00:00Z`)
  );
}

/** `3. März`, `March 3`: a day of the month, for "from" and "on". */
export function dayOfMonth(date: string, locale: string): string {
  return formatDate(date, locale, { day: 'numeric', month: 'long' });
}

/** `Do., 19. Nov.`: the subtitle's short date. */
export function shortDay(date: string, locale: string): string {
  return formatDate(date, locale, { weekday: 'short', day: 'numeric', month: 'short' });
}

/** `Donnerstag`: the weekday of a planned date. */
export function weekdayOf(date: string, locale: string): string {
  return formatDate(date, locale, { weekday: 'long' });
}

/** Within a week a weekday says when; further out, the date does. */
export const WEEKDAY_WITHIN_DAYS = 6;

/** How a greeting names when a planned day is: tomorrow, a weekday, or a date. */
export function whenOf(
  moment: Extract<YoursMoment, { kind: 'tomorrow' | 'soon' }>,
  locale: string
):
  | { key: 'whenTomorrow' }
  | { key: 'whenWeekday'; weekday: string }
  | { key: 'whenDate'; date: string } {
  if (moment.kind === 'tomorrow') return { key: 'whenTomorrow' };
  return moment.days <= WEEKDAY_WITHIN_DAYS
    ? { key: 'whenWeekday', weekday: weekdayOf(moment.date, locale) }
    : { key: 'whenDate', date: dayOfMonth(moment.date, locale) };
}

/** A translation function of the `assistant` namespace, as far as these lines need one. */
type Translate = (key: string, values?: Record<string, string | number>) => string;

/** The values a moment's line or greeting fills in, dates in the reader's language. */
export function yoursValues(
  moment: YoursMoment,
  locale: string,
  t: Translate
): Record<string, string | number> {
  switch (moment.kind) {
    case 'today':
    case 'yesterday':
      return { park: moment.park };
    case 'tomorrow':
    case 'soon': {
      const when = whenOf(moment, locale);
      const { key, ...values } = when;
      return {
        park: moment.park,
        when: t(key, values),
        ...(moment.kind === 'soon' && { days: moment.days }),
      };
    }
    case 'trip':
      return { count: moment.count, date: dayOfMonth(moment.date, locale) };
    case 'ridden':
      return { count: moment.count };
    case 'back':
      return { park: moment.park };
    case 'alert':
      return { ride: moment.ride };
  }
}
