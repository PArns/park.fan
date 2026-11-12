import { addDays } from '@/lib/utils/park-day';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import { ORLANDO_TIMEZONE } from './types';
import type {
  TripBasis,
  TripBestDays,
  TripCalendar,
  TripCalendarDay,
  TripCrowdLevel,
  TripLeg,
  TripParkDay,
  TripRegion,
  TripRegionGroup,
  TripRegionPark,
} from './types';

/**
 * What the Orlando hub derives from the trip-region answers, kept free of React so the hub, its
 * month pages, the park bands and the tests read the same rules. Every comparison between parks is
 * by `headlinerWait`; a park's `crowdLevel` only ever says how a day compares with that park's own
 * typical day (the API's trip-regions contract).
 */

/** How many days the first answer covers: the server-rendered week. */
export const HUB_FIRST_DAYS = 7;

/** How far the hub's calendar reaches past today: the API's default window. */
export const HUB_WINDOW_DAYS = 30;

/** A group of the region with its parks, in the region's order. */
export interface RegionGroup extends TripRegionGroup {
  parks: TripRegionPark[];
}

/** The region's groups with their parks: the three resorts, then the day trips. */
export function regionGroups(region: TripRegion): RegionGroup[] {
  return region.groups
    .map((group) => ({ ...group, parks: region.parks.filter((p) => p.group === group.key) }))
    .filter((group) => group.parks.length > 0);
}

/** The resorts alone: the groups a day's shortest line is named for. */
export function regionResorts(region: TripRegion): RegionGroup[] {
  return regionGroups(region).filter((group) => group.kind === 'resort');
}

/**
 * The words a park's name carries that every visitor drops: the operator's prefix, "Park", "Theme
 * Park", the city. "Disney's Animal Kingdom Theme Park" reads "Animal Kingdom", "Universal Islands
 * of Adventure" "Islands of Adventure", "Busch Gardens Tampa Bay" "Busch Gardens". The full name
 * stays in the page's headings and links.
 */
export function shortParkName(name: string): string {
  const short = name
    .replace(/^Disney's\s+/i, '')
    .replace(/^Universal\s+(?!Studios)/i, '')
    .replace(/\s+(Theme Park|Water Park|Park)$/i, '')
    .replace(/\s+(Orlando|Tampa Bay|Florida)$/i, '')
    .trim();
  return short || name;
}

/**
 * Whether a day closes early for the day guest: the API says so (`closesEarly`), or a separately
 * ticketed evening follows, which sends the day guests out before it starts.
 */
export function closesEarly(day: TripParkDay | undefined): boolean {
  return day?.closesEarly === true || day?.evening?.kind === 'ticketed_event';
}

/** When the day guests leave: the API's `dayGuestCloseAt`, else the day's own close. */
export function dayGuestClose(day: TripParkDay | undefined): string | undefined {
  return day?.dayGuestCloseAt ?? day?.closesAt;
}

/** Whether a park can be ranked on a day: open, with a figure. */
export function isRankable(day: TripParkDay | undefined): day is TripParkDay & {
  headlinerWait: number;
} {
  return day?.status === 'OPERATING' && typeof day.headlinerWait === 'number';
}

/** The day guest's hours in minutes, for the tie on equal waits. Unknown hours count as none. */
function dayGuestMinutes(day: TripParkDay): number {
  if (!day.opensAt || !day.closesAt) return 0;
  return (Date.parse(day.closesAt) - Date.parse(day.opensAt)) / 60_000;
}

/** One park on one day, as a list row. */
export interface RankedPark {
  park: TripRegionPark;
  day: TripParkDay | undefined;
}

/**
 * A group's parks on a day: the API's pick first where the group has one (its cost weighs the day
 * guest's hours, so it can be a full day over a slightly shorter wait that closes early), then the
 * open parks with a figure by `headlinerWait`, ties to the longer day for the day guest; then open
 * parks without one, then the unknown days, then the closed ones.
 */
export function rankGroupParks(
  day: TripCalendarDay,
  parks: readonly TripRegionPark[],
  groupKey?: string
): RankedPark[] {
  const pick = groupKey ? day.best?.[groupKey] : undefined;
  const tier = (d: TripParkDay | undefined) =>
    isRankable(d) ? 0 : d?.status === 'OPERATING' ? 1 : d?.status === 'UNKNOWN' || !d ? 2 : 3;
  return parks
    .map((park, index) => ({ park, day: day.parks[park.slug], index }))
    .sort((a, b) => {
      if (pick && (a.park.slug === pick) !== (b.park.slug === pick)) {
        return a.park.slug === pick ? -1 : 1;
      }
      const ta = tier(a.day);
      const tb = tier(b.day);
      if (ta !== tb) return ta - tb;
      if (ta === 0 && a.day && b.day) {
        const byWait = a.day.headlinerWait! - b.day.headlinerWait!;
        if (byWait !== 0) return byWait;
        const byHours = dayGuestMinutes(b.day) - dayGuestMinutes(a.day);
        if (byHours !== 0) return byHours;
      }
      return a.index - b.index;
    })
    .map(({ park, day: d }) => ({ park, day: d }));
}

/** A resort's pick on a day, as the hub names it. */
export interface ShortestLine {
  group: RegionGroup;
  park: TripRegionPark;
  day: TripParkDay & { headlinerWait: number };
  /**
   * The park with a shorter wait that lost because it closes early for day guests, when the API
   * says that is why (`bestWhy: closes_early_elsewhere`).
   */
  earlyElsewhere?: { park: TripRegionPark; day: TripParkDay };
}

/**
 * Each resort's shortest line on a day, from the API's `best` map. A resort without an entry (a
 * last-year day, no figure) is left out rather than guessed, and so is a pick the region does not
 * know.
 */
export function shortestLines(day: TripCalendarDay, region: TripRegion): ShortestLine[] {
  const lines: ShortestLine[] = [];
  for (const group of regionResorts(region)) {
    const slug = day.best?.[group.key];
    const park = slug ? group.parks.find((p) => p.slug === slug) : undefined;
    const parkDay = slug ? day.parks[slug] : undefined;
    if (!park || !isRankable(parkDay)) continue;
    const line: ShortestLine = { group, park, day: parkDay };
    if (day.bestWhy?.[group.key] === 'closes_early_elsewhere') {
      const other = group.parks
        .map((p) => ({ park: p, day: day.parks[p.slug] }))
        .filter(
          (o) =>
            o.park.slug !== park.slug &&
            isRankable(o.day) &&
            closesEarly(o.day) &&
            o.day.headlinerWait! <= parkDay.headlinerWait
        )
        .sort((a, b) => a.day!.headlinerWait! - b.day!.headlinerWait!)[0];
      if (other?.day) line.earlyElsewhere = { park: other.park, day: other.day };
    }
    lines.push(line);
  }
  return lines;
}

/**
 * The day the first answer is about: today in Orlando, or tomorrow once every resort's pick has
 * closed to day guests, since nobody plans the rest of a day that is over. A day without picks
 * counts as open.
 */
export function glanceDay(
  calendar: TripCalendar,
  region: TripRegion,
  todayIso: string,
  nowMs: number
): TripCalendarDay | null {
  const today = calendar.days.find((d) => d.date === todayIso);
  const tomorrow = calendar.days.find((d) => d.date === addDays(todayIso, 1));
  if (!today) return tomorrow ?? calendar.days[0] ?? null;
  const lines = shortestLines(today, region);
  const over =
    lines.length > 0 &&
    lines.every((line) => line.day.closesAt && Date.parse(line.day.closesAt) <= nowMs);
  return over && tomorrow ? tomorrow : today;
}

/** The first `count` days of the calendar from `fromIso` on. */
export function firstDays(
  calendar: TripCalendar,
  fromIso: string,
  count = HUB_FIRST_DAYS
): TripCalendarDay[] {
  return calendar.days.filter((d) => d.date >= fromIso).slice(0, count);
}

/** `true` when a date is a weekend in Orlando (Saturday or Sunday). */
export function isWeekend(date: string): boolean {
  const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
  return dow === 0 || dow === 6;
}

/**
 * A plain date as the hub prints it, anchored at noon UTC so no zone moves it: `short` "Thu 12
 * Nov", `long` "Thursday, 12 November", `day` "12", `weekday` "Thu".
 */
export function formatHubDate(
  date: string,
  locale: string,
  style: 'short' | 'long' | 'day' | 'weekday' | 'dayMonth' = 'short'
): string {
  const options: Intl.DateTimeFormatOptions =
    style === 'long'
      ? { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }
      : style === 'day'
        ? { day: 'numeric', timeZone: 'UTC' }
        : style === 'weekday'
          ? { weekday: 'short', timeZone: 'UTC' }
          : style === 'dayMonth'
            ? { day: 'numeric', month: 'short', timeZone: 'UTC' }
            : { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' };
  return getDateTimeFormat(locale, options).format(new Date(`${date}T12:00:00Z`));
}

/** A month's name with its year, "December 2026", in the reader's language. */
export function formatHubMonth(year: number, month: number, locale: string): string {
  return getDateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1, 1))
  );
}

/** The one band a calendar day falls in, for its label: the forecast, the outlook or last year. */
export type HubBasis = 'forecast' | 'long_range' | 'last_year' | 'none';

/** The basis most of a day's parks share, so a column can say "last year" once. */
export function dayBasis(day: TripCalendarDay): HubBasis {
  const counts = new Map<TripBasis, number>();
  for (const park of Object.values(day.parks)) {
    if (park.basis === 'none') continue;
    counts.set(park.basis, (counts.get(park.basis) ?? 0) + 1);
  }
  let best: HubBasis = 'none';
  let most = 0;
  for (const [basis, n] of counts) {
    if (n > most) {
      best = basis;
      most = n;
    }
  }
  return best;
}

/** One lane under the matrix: a season or a run of school-break days. */
export interface EventLane {
  id: string;
  /** `party` for a separately ticketed evening, `festival` for a season inside the day, `break`. */
  kind: 'party' | 'festival' | 'break';
  /** The season's own name, or the break's; `null` when the API sends none. */
  name: string | null;
  /** The parks it runs at, in the region's order; none for a school break. */
  parkSlugs: string[];
  /** `expected` is last year's pattern: drawn dashed, never counted as a date. */
  status: 'confirmed' | 'announced' | 'expected' | 'none';
  /** The window's days it runs on, sorted. */
  dates: string[];
}

/** Season kinds that are no event: a closure closes the day, an opening is the park's season. */
const NOT_AN_EVENT = new Set(['closure', 'maintenance', 'opening']);

/**
 * The lanes under the matrix: each curated season that runs on a day of the window (party nights,
 * festivals, Universal's holidays as `expected`), one lane per name even where several parks run
 * it, then the school breaks as runs of days. A cancelled season stays out.
 */
export function eventLanes(calendar: TripCalendar, parkOrder: readonly string[] = []): EventLane[] {
  const lanes = new Map<string, EventLane>();
  for (const season of calendar.seasons) {
    if (NOT_AN_EVENT.has(season.kind) || season.status === 'cancelled') continue;
    const listed = calendar.days
      .filter((d) => d.parks[season.parkSlug]?.seasons?.includes(season.id))
      .map((d) => d.date);
    // A range season the days do not list (its park is closed, unknown) still runs on its range.
    const dates = listed.length
      ? listed
      : season.dates && season.dates.length > 0
        ? []
        : calendar.days
            .filter((d) => d.date >= season.startDate && d.date <= season.endDate)
            .map((d) => d.date);
    if (dates.length === 0) continue;
    const kind = season.separateTicket ? 'party' : 'festival';
    const key = `${kind}:${season.name ?? season.id}`;
    const lane = lanes.get(key);
    if (lane) {
      lane.dates = [...new Set([...lane.dates, ...dates])].sort();
      if (!lane.parkSlugs.includes(season.parkSlug)) lane.parkSlugs.push(season.parkSlug);
      if (lane.status === 'expected' && season.status !== 'expected') lane.status = season.status;
    } else {
      lanes.set(key, {
        id: season.id,
        kind,
        name: season.name ?? null,
        parkSlugs: [season.parkSlug],
        status: season.status,
        dates,
      });
    }
  }
  const rank = (slug: string) => {
    const i = parkOrder.indexOf(slug);
    return i === -1 ? parkOrder.length : i;
  };
  const seasons = [...lanes.values()]
    .map((lane) => ({ ...lane, parkSlugs: [...lane.parkSlugs].sort((a, b) => rank(a) - rank(b)) }))
    .sort((a, b) => rank(a.parkSlugs[0]) - rank(b.parkSlugs[0]) || (a.kind === 'party' ? -1 : 1));
  const breaks = new Map<string, string[]>();
  for (const day of calendar.days) {
    if (!day.isSchoolVacation) continue;
    const name = day.holidays?.[day.holidays.length - 1] ?? '';
    breaks.set(name, [...(breaks.get(name) ?? []), day.date]);
  }
  const breakLanes: EventLane[] = [...breaks].map(([name, dates]) => ({
    id: `break:${name}`,
    kind: 'break',
    name: name || null,
    parkSlugs: [],
    status: 'none',
    dates,
  }));
  return [...seasons, ...breakLanes];
}

/** The legs between two places, in either direction (`hotel:<key>` or a park slug). */
export function findLeg(region: TripRegion, a: string, b: string): TripLeg | undefined {
  return region.travel.legs.find(
    (leg) => (leg.from === a && leg.to === b) || (leg.from === b && leg.to === a)
  );
}

/** The door-to-door minutes of a drive: to the car park, then the curated rest of the way. */
export function legMinutes(leg: TripLeg): number {
  return leg.minutes + (leg.transferMinutes ?? 0);
}

/** The mean of some waits, rounded to five like every wait the site prints; `null` for none. */
export function meanWait(waits: readonly number[]): number | null {
  if (waits.length === 0) return null;
  return roundWaitTo5(waits.reduce((sum, w) => sum + w, 0) / waits.length);
}

/** A park's figures on weekends against weekdays across the window, last-year days left out. */
export function weekendAgainstWeekday(
  calendar: TripCalendar,
  slug: string
): { weekend: number; weekday: number } | null {
  const weekend: number[] = [];
  const weekday: number[] = [];
  for (const day of calendar.days) {
    const park = day.parks[slug];
    if (!isRankable(park) || park.basis === 'last_year') continue;
    (isWeekend(day.date) ? weekend : weekday).push(park.headlinerWait);
  }
  const a = meanWait(weekend);
  const b = meanWait(weekday);
  return a === null || b === null ? null : { weekend: a, weekday: b };
}

/** A park's ticketed evenings in the window: how many, when the day guests leave, how busy. */
export function ticketedEvenings(
  calendar: TripCalendar,
  slug: string
): {
  count: number;
  closesAt: string | null;
  waitOnThem: number | null;
  waitOtherwise: number | null;
} {
  const on: number[] = [];
  const off: number[] = [];
  let closesAt: string | null = null;
  for (const day of calendar.days) {
    const park = day.parks[slug];
    if (!isRankable(park) || park.basis === 'last_year') continue;
    if (closesEarly(park)) {
      on.push(park.headlinerWait);
      closesAt ??= dayGuestClose(park) ?? null;
    } else {
      off.push(park.headlinerWait);
    }
  }
  return { count: on.length, closesAt, waitOnThem: meanWait(on), waitOtherwise: meanWait(off) };
}

/** A resort's month in a few facts: its quietest dates, its busiest, and what runs. */
export interface ResortMonthSummary {
  group: RegionGroup;
  /** The resort's best dates, each with the park that has the shortest lines that day. */
  quiet: Array<{ date: string; park: TripRegionPark; wait: number | null; basis: TripBasis }>;
  /** The days on which even the resort's shortest line is longest. */
  busy: Array<{ date: string; park: TripRegionPark; wait: number; basis: TripBasis }>;
}

/**
 * Each resort's month: the best dates from `/best-days` (the API ranks them on the unrounded
 * figures), the two days whose shortest line is the longest from the calendar. A resort with no
 * figure in the window is left out.
 */
export function resortMonthSummaries(
  region: TripRegion,
  calendar: TripCalendar,
  bestDays: TripBestDays | null
): ResortMonthSummary[] {
  const basisOf = (date: string, slug: string): TripBasis =>
    calendar.days.find((d) => d.date === date)?.parks[slug]?.basis ?? 'none';
  return regionResorts(region)
    .map((group) => {
      const quiet = (bestDays?.groups.find((g) => g.key === group.key)?.quiet ?? [])
        .map((entry) => {
          const park = group.parks.find((p) => p.slug === entry.slug);
          return park
            ? {
                date: entry.date,
                park,
                wait: entry.headlinerWait ?? null,
                basis: basisOf(entry.date, entry.slug),
              }
            : null;
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
      const picks = calendar.days
        .map((day) => {
          const line = rankGroupParks(day, group.parks, group.key)[0];
          return line && isRankable(line.day)
            ? {
                date: day.date,
                park: line.park,
                wait: line.day.headlinerWait,
                basis: line.day.basis,
              }
            : null;
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
      const busy = [...picks]
        .sort((a, b) => b.wait - a.wait || a.date.localeCompare(b.date))
        .slice(0, 2)
        .sort((a, b) => a.date.localeCompare(b.date));
      return { group, quiet, busy };
    })
    .filter((summary) => summary.quiet.length > 0 || summary.busy.length > 0);
}

/** The crowd levels a cell may be tinted by: the six of the scale, never closed or unknown. */
export function tintLevel(level: TripCrowdLevel | undefined) {
  return level && level !== 'closed' && level !== 'unknown' ? level : null;
}

/** The hub's window for a page: the 30 days from today on the hub, the month on a month page. */
export function hubWindow(todayIso: string, range?: { from: string; to: string }) {
  if (!range) return { from: todayIso, to: addDays(todayIso, HUB_WINDOW_DAYS) };
  return { from: range.from < todayIso ? todayIso : range.from, to: range.to };
}

/** Orlando's today, never the server's or the browser's. */
export function orlandoToday(nowMs: number): string {
  return getDateTimeFormat('en-CA', { timeZone: ORLANDO_TIMEZONE }).format(nowMs);
}

/** A resort's name without "Resort": "Walt Disney World", "Universal Orlando". */
export function shortGroupName(name: string): string {
  return name.replace(/\s+Resort$/i, '').trim() || name;
}

/** The geo segments of a region park's path (`/parks/<continent>/<country>/<city>/<slug>`). */
export function parkGeo(
  park: Pick<TripRegionPark, 'path'>
): { continent: string; country: string; city: string } | null {
  const [, parks, continent, country, city] = park.path.split('/');
  return parks === 'parks' && continent && country && city ? { continent, country, city } : null;
}

/**
 * The shortest lines the first answer names: each resort where the pick beat another park that
 * day. A resort with one park that has a figure (SeaWorld, beside two parks nobody queues at) has
 * nothing to choose between and stays out of the sentence.
 */
export function glanceLines(day: TripCalendarDay, region: TripRegion): ShortestLine[] {
  return shortestLines(day, region).filter(
    (line) => line.group.parks.filter((p) => isRankable(day.parks[p.slug])).length > 1
  );
}

/** The calendar trimmed to a window of its days, with the seasons that run in it. */
export function sliceCalendar(calendar: TripCalendar, days: TripCalendarDay[]): TripCalendar {
  const from = days[0]?.date ?? calendar.meta.from;
  const to = days[days.length - 1]?.date ?? calendar.meta.to;
  return {
    ...calendar,
    meta: { ...calendar.meta, from, to },
    days,
    seasons: calendar.seasons.filter((s) => s.endDate >= from && s.startDate <= to),
  };
}

/**
 * The region as the hub's client part needs it: the parks, groups and hotel areas, and only the
 * legs from a hotel area to a park, which the day sheet's travel line reads. The park-to-park legs
 * are the planner's, and most of the matrix's weight.
 */
export function slimRegion(region: TripRegion): TripRegion {
  return {
    ...region,
    travel: {
      ...region.travel,
      legs: region.travel.legs.filter(
        (l) => l.from.startsWith('hotel:') || l.to.startsWith('hotel:')
      ),
    },
  };
}

/**
 * Two dates as one short range in the reader's language ("Jan 12 – 21", "12.–21. Jan.", "27 Apr –
 * 6 May"): `Intl`'s own range format, which knows each locale's order and what to leave out.
 */
export function formatDateRange(from: string, to: string, locale: string): string {
  const format = getDateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const a = new Date(`${from}T12:00:00Z`);
  return from === to ? format.format(a) : format.formatRange(a, new Date(`${to}T12:00:00Z`));
}

/** A trip window's dates as one short range ({@link formatDateRange}). */
export function formatWindow(window: { from: string; to: string }, locale: string): string {
  return formatDateRange(window.from, window.to, locale);
}

/** The year most of a range lies in, for "best time to visit Orlando in 2027". */
export function majorityYear(from: string, to: string): number {
  const a = new Date(`${from}T12:00:00Z`);
  const b = new Date(`${to}T12:00:00Z`);
  const end = new Date(Date.UTC(a.getUTCFullYear(), 11, 31, 12));
  return end.getTime() - a.getTime() >= b.getTime() - end.getTime()
    ? a.getUTCFullYear()
    : b.getUTCFullYear();
}
