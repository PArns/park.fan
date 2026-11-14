import type { ColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';
import { getListFormat } from '@/lib/utils/intl-format';
import { addDays, daysBetween } from '@/lib/utils/park-day';
import { formatWindow } from './hub-data';
import { DEFAULT_FIND_DAYS, MAX_DAYS_AHEAD, type PlanSearchRange } from './plan-query';
import { weekTiers } from './plan-when';
import { bestTimePageOf, tripRegionConfig, type TripRegionConfig } from './registry';
import type {
  TripMonth,
  TripRegion,
  TripSchoolBreakRegion,
  TripSeason,
  TripWhen,
  TripWhenMonth,
  TripWhenWeek,
  TripWhenWithMonths,
} from './types';

/**
 * What a region's best-time pages (`/<region segment>/<best-time segment>[/<resort>]`) derive from
 * `/when` and `/school-breaks`, kept free of React so the pages and `pnpm test:orlando-best-time`
 * read the same rules. Which pages a region has and which parks each plans is its registry entry
 * (`bestTime`). Dates are the region's (`tripRegionToday`), never the server's.
 */

/** The id of a region's own best-time page; a resort's page is its segment. */
export const REGION_BEST_TIME_PAGE = 'region';

/** A best-time page by its id: the region's own (`region`), or a resort's segment. */
export type BestTimePageId = string;

/** The trip length every page ranks, the planner's own default. */
export const BEST_TIME_TRIP_DAYS = DEFAULT_FIND_DAYS;

/** The windows the first answer names. */
export const BEST_TIME_WINDOWS = 3;

/**
 * A European break counts in a month only when it runs at least this many days, weekends
 * included: a bridge day (Maundy Thursday, Ascension) is not a family's trip.
 */
export const EUROPEAN_BREAK_MIN_DAYS = 5;

/**
 * The page a `[[...resort]]` segment list asks for in a region, or `null` for a 404: the region's
 * own page where it has one, or a resort's by its segment.
 */
export function parseBestTimePage(
  region: TripRegionConfig,
  segments: string[] | undefined
): BestTimePageId | null {
  if (!segments || segments.length === 0) {
    return bestTimePageOf(region, REGION_BEST_TIME_PAGE) ? REGION_BEST_TIME_PAGE : null;
  }
  if (segments.length !== 1) return null;
  const page = region.bestTime.find((p) => p.segment !== undefined && p.segment === segments[0]);
  return page ? page.id : null;
}

/**
 * The year in the title: the coming year from September on, else the current one, so the page
 * answers the trip people are booking.
 */
export function bestTimeYear(todayIso: string): number {
  const year = Number(todayIso.slice(0, 4));
  return Number(todayIso.slice(5, 7)) >= 9 ? year + 1 : year;
}

/**
 * The range `/when` and `/school-breaks` are asked for: the title's year, from today at the
 * earliest and never past the year ahead both routes accept.
 */
export function bestTimeRange(todayIso: string): PlanSearchRange {
  const year = bestTimeYear(todayIso);
  const first = `${year}-01-01`;
  const last = addDays(todayIso, MAX_DAYS_AHEAD);
  return {
    from: first < todayIso ? todayIso : first,
    to: `${year}-12-31` < last ? `${year}-12-31` : last,
  };
}

/** The headliner parks a page plans, in the region's order. */
export function bestTimeParks(region: TripRegion, page: BestTimePageId): string[] {
  const config = tripRegionConfig(region.slug);
  const groups = (config && bestTimePageOf(config, page)?.groups) ?? [];
  return region.parks.filter((p) => p.headliner && groups.includes(p.group)).map((p) => p.slug);
}

/**
 * The one `/when` query a best-time page and the hub's teaser send for the same parks, so both
 * read one cached answer and never print two figures for one window. The gap is the trip's
 * length: the windows named side by side never overlap.
 */
export function bestTimeWhenQuery(
  region: TripRegion,
  page: BestTimePageId,
  range: PlanSearchRange
): { from: string; to: string; days: number; limit: number; gap: number; parks: string } {
  return {
    from: range.from,
    to: range.to,
    days: BEST_TIME_TRIP_DAYS,
    limit: BEST_TIME_WINDOWS,
    gap: BEST_TIME_TRIP_DAYS,
    parks: bestTimeParks(region, page).join(','),
  };
}

/** `YYYY-MM` of a month. */
export function monthKey({ year, month }: TripMonth): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** The first and last day of a `YYYY-MM`. */
function monthBounds(key: string): { from: string; to: string } {
  const [year, month] = key.split('-').map(Number);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from: `${key}-01`, to: `${key}-${String(last).padStart(2, '0')}` };
}

/** Whether two inclusive date ranges share a day. */
function overlaps(a: { from: string; to: string }, b: { from: string; to: string }): boolean {
  return a.from <= b.to && a.to >= b.from;
}

/** The opening hours of a month against the year's: long, short, or the usual. */
export type MonthHours = 'long' | 'short' | 'usual';

/** One row of the month table. */
export interface BestTimeMonthRow {
  month: TripMonth;
  key: string;
  /** `/when`'s month; absent past the range the API reaches. */
  data?: TripWhenMonth;
  /** Where the month falls among the year's months, quietest to busiest. */
  tier: ColoredCrowdLevel | null;
  hours: MonthHours | null;
}

/** Hours this far from the year's mean (in hours) make a month long or short. */
const HOURS_SPREAD = 0.75;

/**
 * The month table: every month of the title's year from the current one on, each with `/when`'s
 * figures where its range reaches, a tier among the months that have a figure, and its day guests'
 * hours against the year's mean.
 */
export function monthRows(
  when: Pick<TripWhenWithMonths, 'months'>,
  todayIso: string
): BestTimeMonthRow[] {
  const year = bestTimeYear(todayIso);
  const first = Number(todayIso.slice(0, 4)) === year ? Number(todayIso.slice(5, 7)) : 1;
  const months = Array.from({ length: 13 - first }, (_, i) => ({ year, month: first + i }));
  const data = months.map((m) => when.months.find((x) => x.month === monthKey(m)));
  const tiers = weekTiers(data.map((d) => ({ headlinerWait: d?.headlinerWait })));
  const hours = data.map((d) => d?.dayGuestHours).filter((h): h is number => h != null);
  const meanHours = hours.length ? hours.reduce((a, b) => a + b, 0) / hours.length : null;
  return months.map((month, i) => {
    const h = data[i]?.dayGuestHours;
    return {
      month,
      key: monthKey(month),
      data: data[i],
      tier: tiers[i],
      hours:
        h == null || meanHours == null
          ? null
          : h >= meanHours + HOURS_SPREAD
            ? 'long'
            : h <= meanHours - HOURS_SPREAD
              ? 'short'
              : 'usual',
    };
  });
}

/**
 * A school break's name without the district and the day's other holidays: "Spring break (Orange
 * County Public Schools)" → "Spring break", "Winter break (…), New Year's Day" → "Winter break".
 */
export function cleanBreakName(name: string): string {
  return name.split(/\s*\(|,\s/)[0].trim();
}

/** A run of consecutive break days under one name. */
export interface BreakRun {
  from: string;
  to: string;
  /** The run's first named day, cleaned; empty when every day is an unnamed weekend. */
  name: string;
}

/**
 * Consecutive break days as runs: the weekends `/when` lists without a name join the break they
 * border, so "13–15 Feb" reads as Presidents' Day, not as two blanks and a holiday.
 */
export function breakRuns(days: ReadonlyArray<{ date: string; name: string }>): BreakRun[] {
  const runs: BreakRun[] = [];
  for (const day of [...days].sort((a, b) => a.date.localeCompare(b.date))) {
    const last = runs[runs.length - 1];
    const name = cleanBreakName(day.name);
    if (last && addDays(last.to, 1) === day.date) {
      last.to = day.date;
      if (!last.name) last.name = name;
    } else {
      runs.push({ from: day.date, to: day.date, name });
    }
  }
  return runs.filter((run) => run.name);
}

/** One country's regions on a break in a month. */
export interface CountryBreaks {
  country: string;
  /** The regions the data knows for the country. */
  total: number;
  /** The regions with a break of {@link EUROPEAN_BREAK_MIN_DAYS} or more in the month. */
  regions: Array<{ code: string; name: string; periods: TripSchoolBreakRegion['periods'] }>;
  /** Every region's data ends before the month: a break then is unknown, not absent. */
  unknown: boolean;
}

/** Each country's regions with a real break in a month, in `countries`' order. */
export function europeanBreaks(
  regions: readonly TripSchoolBreakRegion[],
  key: string,
  countries: readonly string[]
): CountryBreaks[] {
  const month = monthBounds(key);
  return countries.flatMap((country) => {
    const own = regions.filter((r) => r.country === country);
    if (own.length === 0) return [];
    const onBreak = own.flatMap((region) => {
      const periods = region.periods.filter(
        (p) => overlaps(p, month) && daysBetween(p.from, p.to) + 1 >= EUROPEAN_BREAK_MIN_DAYS
      );
      return periods.length ? [{ code: region.code, name: region.name, periods }] : [];
    });
    return [
      {
        country,
        total: own.length,
        regions: onBreak,
        unknown: own.every((r) => r.through < month.from),
      },
    ];
  });
}

/**
 * A region's breaks long enough for a trip of `days`, cut to `range`: what chapter 04 links the
 * planner's When mode to.
 */
export function tripLongBreaks(
  region: TripSchoolBreakRegion,
  days: number,
  range: PlanSearchRange
): Array<{ from: string; to: string; name: string }> {
  return region.periods.flatMap((p) => {
    const from = p.from < range.from ? range.from : p.from;
    const to = p.to > range.to ? range.to : p.to;
    return daysBetween(from, to) + 1 >= days ? [{ from, to, name: p.name }] : [];
  });
}

/** Whether a week lies wholly inside a range, so its figure is a whole week's. */
export function isWholeWeek(week: Pick<TripWhenWeek, 'start'>, range: PlanSearchRange): boolean {
  return week.start >= range.from && addDays(week.start, 6) <= range.to;
}

/** The quietest and busiest whole weeks, `count` each, quietest and busiest first. */
export function bestAndWorstWeeks(
  weeks: readonly TripWhenWeek[],
  range: PlanSearchRange,
  count = 3
): { best: TripWhenWeek[]; worst: TripWhenWeek[] } {
  const whole = weeks.filter((w) => w.headlinerWait != null && isWholeWeek(w, range));
  const byWait = (a: TripWhenWeek, b: TripWhenWeek) =>
    a.headlinerWait! - b.headlinerWait! || a.start.localeCompare(b.start);
  const best = [...whole].sort(byWait).slice(0, count);
  const worst = [...whole]
    .sort((a, b) => byWait(b, a))
    .filter((w) => !best.includes(w))
    .slice(0, count);
  return { best, worst };
}

/** What a week of the strip or chapter 03 has going on, for its one-line reason. */
export interface WeekFacts {
  breaks: BreakRun[];
  seasons: TripSeason[];
}

/** The seasons that run on a day range, one per name, cancelled and closures left out. */
export function seasonsOn(
  seasons: readonly TripSeason[],
  range: { from: string; to: string }
): TripSeason[] {
  const seen = new Set<string>();
  return seasons.filter((s) => {
    if (s.status === 'cancelled' || s.kind === 'closure' || s.kind === 'maintenance') return false;
    const runs = s.dates
      ? s.dates.some((d) => d >= range.from && d <= range.to)
      : overlaps({ from: s.startDate, to: s.endDate }, range);
    const key = s.name ?? s.kind;
    if (!runs || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** A week's school breaks (from the months' break days) and the seasons running in it. */
export function weekFacts(
  week: Pick<TripWhenWeek, 'start'>,
  months: readonly TripWhenMonth[],
  seasons: readonly TripSeason[]
): WeekFacts {
  const range = { from: week.start, to: addDays(week.start, 6) };
  const days = months.flatMap((m) => m.usSchoolBreakDays);
  return {
    breaks: breakRuns(days).filter((run) => overlaps(run, range)),
    seasons: seasonsOn(seasons, range),
  };
}

/** The first day `/when` reads last year's crowds: its `forecastUntil` + 1, else the strip's turn. */
export function lastYearFrom(when: Pick<TripWhen, 'meta' | 'weeks'>): string | null {
  if (when.meta.forecastUntil) return addDays(when.meta.forecastUntil, 1);
  const turn = when.weeks.find((w) => w.basis === 'last_year' || w.basis === 'mixed');
  return turn ? turn.start : null;
}

/**
 * The week the page answers "Is Christmas busy?" with: Christmas week where the range holds it,
 * else New Year's, else none.
 */
export function holidayWeek(
  weeks: readonly TripWhenWeek[]
): { week: TripWhenWeek; holiday: 'christmas' | 'new_year' } | null {
  const holding = (mmdd: string) =>
    weeks.find((w) => {
      if (w.headlinerWait == null) return false;
      const end = addDays(w.start, 6);
      const day = `${w.start.slice(0, 4)}-${mmdd}`;
      const nextYearDay = `${end.slice(0, 4)}-${mmdd}`;
      return (day >= w.start && day <= end) || (nextYearDay >= w.start && nextYearDay <= end);
    });
  const christmas = holding('12-25');
  if (christmas) return { week: christmas, holiday: 'christmas' };
  const newYear = holding('01-01');
  return newYear ? { week: newYear, holiday: 'new_year' } : null;
}

/** The mean of the weeks' figures: the year's average a week is compared with. */
export function meanWeekWait(weeks: readonly Pick<TripWhenWeek, 'headlinerWait'>[]): number | null {
  const figures = weeks.map((w) => w.headlinerWait).filter((v): v is number => v != null);
  return figures.length ? Math.round(figures.reduce((a, b) => a + b, 0) / figures.length) : null;
}

/** The party nights a page's parks hold: separately ticketed Halloween and Christmas evenings. */
export function partySeasons(
  seasons: readonly TripSeason[],
  parks: readonly string[]
): TripSeason[] {
  return seasons.filter(
    (s) =>
      parks.includes(s.parkSlug) &&
      s.separateTicket === true &&
      (s.kind === 'halloween' || s.kind === 'christmas') &&
      s.status !== 'cancelled'
  );
}

/** The wettest months by their climate normal, wettest first. */
export function wettestMonths(months: readonly TripWhenMonth[], count = 2): TripWhenMonth[] {
  return months
    .filter((m) => m.climate)
    .sort((a, b) => b.climate!.precipitationMm - a.climate!.precipitationMm)
    .slice(0, count);
}

/**
 * The order a window's plan visits the page's parks in: each park's first day, earliest first.
 * The honest answer to "Disney or Universal first?": the plan puts each park on its quietest day.
 */
export function planOrder(window: {
  plan?: { days: Array<{ date: string; parks: string[] }> };
}): Array<{ slug: string; date: string }> {
  const seen = new Set<string>();
  const order: Array<{ slug: string; date: string }> = [];
  for (const day of window.plan?.days ?? []) {
    for (const slug of day.parks) {
      if (seen.has(slug)) continue;
      seen.add(slug);
      order.push({ slug, date: day.date });
    }
  }
  return order;
}

/**
 * Windows as one phrase in the reader's language, "16–25 Feb, 1–10 Mar and 6–15 Apr", for the first
 * answer's sentence and the meta description.
 */
export function windowList(
  windows: ReadonlyArray<{ from: string; to: string }>,
  locale: string
): string {
  return getListFormat(locale, { type: 'conjunction' }).format(
    windows.map((w) => formatWindow(w, locale))
  );
}

/**
 * A flat stretch around the first window: the run of weeks whose figure stays within a couple of
 * minutes of the quietest week, when it is long enough that naming one window would rank a tie.
 * `null` when the year has a real low.
 */
export function flatStretch(
  weeks: ReadonlyArray<{ start: string; headlinerWait?: number }>,
  firstWindowFrom: string,
  minWeeks = 6
): { from: string; to: string; minutes: number } | null {
  const figures = weeks.filter((w) => typeof w.headlinerWait === 'number');
  if (figures.length === 0) return null;
  const low = Math.min(...figures.map((w) => w.headlinerWait!));
  const near = (w: { headlinerWait?: number }) =>
    typeof w.headlinerWait === 'number' && w.headlinerWait <= low + 2;
  const at = weeks.findIndex((w, i) => {
    const next = weeks[i + 1]?.start;
    return w.start <= firstWindowFrom && (!next || next > firstWindowFrom);
  });
  if (at === -1 || !near(weeks[at])) return null;
  let a = at;
  let b = at;
  while (a > 0 && near(weeks[a - 1])) a -= 1;
  while (b < weeks.length - 1 && near(weeks[b + 1])) b += 1;
  if (b - a + 1 < minWeeks) return null;
  return { from: weeks[a].start, to: addDays(weeks[b].start, 6), minutes: low };
}
