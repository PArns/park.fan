import { addDays } from '@/lib/utils/park-day';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { parkCalendarPath } from '@/lib/parks/calendar-segments';
import { isSeasonEvent } from '@/lib/parks/park-season-days';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import { shownWait, shownWaitOn } from './plan-week';
import { PARK_NAME_SUFFIXES, requireTripRegion } from './registry';
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
 * What a region's hub derives from the trip-region answers, kept free of React so the hub, its
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

/**
 * The region with its day-trip group named in the reader's language: the API names it in English,
 * while a resort's name is the operator's own and stays as it is. A day trip that is one park keeps
 * its own name, so a region with several (Fuji-Q Highland and LEGOLAND Japan) never shows two
 * filters with the same word.
 */
export function withGroupNames(region: TripRegion, dayTrips: string): TripRegion {
  const parksIn = (key: string) => region.parks.filter((p) => p.group === key).length;
  return {
    ...region,
    groups: region.groups.map((group) =>
      group.kind === 'day_trip' && parksIn(group.key) > 1 ? { ...group, name: dayTrips } : group
    ),
  };
}

/** The resorts alone: the groups a day's shortest line is named for. */
export function regionResorts(region: TripRegion): RegionGroup[] {
  return regionGroups(region).filter((group) => group.kind === 'resort');
}

/**
 * The groups with a headliner park: the ones the first answer names, a resort of one park
 * (Universal Studios Hollywood, Universal Studios Japan) included, since its park is one a trip is
 * planned around.
 */
export function headlinerGroups(region: TripRegion): RegionGroup[] {
  return regionGroups(region).filter((group) => group.parks.some((p) => p.headliner));
}

/** The groups a window is summed up for: every resort, and every group with a headliner park. */
export function summaryGroups(region: TripRegion): RegionGroup[] {
  return regionGroups(region).filter(
    (group) => group.kind === 'resort' || group.parks.some((p) => p.headliner)
  );
}

/** The place words a park's name may end in, longest first, from every region's registry entry. */
const PLACE_SUFFIX = PARK_NAME_SUFFIXES.length
  ? new RegExp(
      `\\s+(${[...PARK_NAME_SUFFIXES]
        .sort((a, b) => b.length - a.length)
        .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('|')})$`,
      'i'
    )
  : null;

/**
 * The words a park's name carries that every visitor drops: the operator's prefix, "Park", "Theme
 * Park", the place (a region's `parkNameSuffixes`). "Disney's Animal Kingdom Theme Park" reads
 * "Animal Kingdom", "Universal Islands of Adventure" "Islands of Adventure", "Busch Gardens Tampa
 * Bay" "Busch Gardens". The full name stays in the page's headings and links.
 */
export function shortParkName(name: string): string {
  const unbranded = name
    .replace(/^Disney's\s+/i, '')
    .replace(/^Universal\s+(?!Studios)/i, '')
    .replace(/\s+(Theme Park|Water Park|Park)$/i, '');
  const short = (PLACE_SUFFIX ? unbranded.replace(PLACE_SUFFIX, '') : unbranded).trim();
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

/**
 * Whether a park can be ranked on a day: not closed, with a figure. A day whose hours are not
 * published yet is `UNKNOWN` but still carries the forecast or last year's figure, and that figure
 * counts; only a closed day or one without a figure drops out.
 */
export function isRankable(day: TripParkDay | undefined): day is TripParkDay & {
  headlinerWait: number;
} {
  return !!day && day.status !== 'CLOSED' && typeof day.headlinerWait === 'number';
}

/** Whether a day has a figure but no published hours yet: drawn with its mark, said in words. */
export function hoursUnpublished(day: TripParkDay | undefined): boolean {
  return !!day && day.status === 'UNKNOWN' && !day.hoursPublished;
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

/**
 * Whether a resort has a pick worth naming on a day: more than one of its parks has a figure. A
 * resort with one (SeaWorld beside two parks nobody queues at) has nothing to choose between.
 */
export function resortHasChoice(day: TripCalendarDay, group: RegionGroup): boolean {
  return group.parks.filter((p) => isRankable(day.parks[p.slug])).length > 1;
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
    const earlyElsewhere = earlyCloseBehind(day, group, park.slug);
    lines.push({ group, park, day: parkDay, ...(earlyElsewhere && { earlyElsewhere }) });
  }
  return lines;
}

/**
 * The park with the same or a shorter wait that a resort's pick beat because it closes early for
 * day guests, when the API says that is why (`bestWhy: closes_early_elsewhere`). The phone list
 * and the first answer name it with its closing time.
 */
export function earlyCloseBehind(
  day: TripCalendarDay,
  group: RegionGroup,
  pick: string
): { park: TripRegionPark; day: TripParkDay } | undefined {
  if (day.bestWhy?.[group.key] !== 'closes_early_elsewhere') return undefined;
  const picked = day.parks[pick];
  if (!isRankable(picked)) return undefined;
  const other = group.parks
    .map((p) => ({ park: p, day: day.parks[p.slug] }))
    .filter(
      (o): o is { park: TripRegionPark; day: TripParkDay & { headlinerWait: number } } =>
        o.park.slug !== pick &&
        isRankable(o.day) &&
        closesEarly(o.day) &&
        o.day.headlinerWait <= picked.headlinerWait
    )
    .sort((a, b) => a.day.headlinerWait - b.day.headlinerWait)[0];
  return other;
}

/**
 * The day the first answer is about: today in the region, or tomorrow once every resort's pick has
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

/** `true` when a date is a weekend (Saturday or Sunday); the date is already the region's. */
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

/** The days a fact is read from, and whether they are last year's measured days. */
export interface FactDays {
  days: TripCalendarDay[];
  lastYear: boolean;
}

/**
 * The forecast's days of a calendar; a month past day 60 reads last year's measured days instead,
 * and says so. Never both at once: a mean over both would set an unscaled forecast beside a
 * measured day.
 */
export function factDays(calendar: TripCalendar): FactDays {
  const forecast = calendar.days.filter((d) => {
    const basis = dayBasis(d);
    return basis === 'forecast' || basis === 'long_range';
  });
  if (forecast.length > 0) return { days: forecast, lastYear: false };
  return { days: calendar.days.filter((d) => dayBasis(d) === 'last_year'), lastYear: true };
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

/**
 * The lanes under the matrix: each curated season that runs on a day of the window (party nights,
 * festivals, Universal's holidays as `expected`), one lane per name even where several parks run
 * it, then the school breaks as runs of days. A cancelled season stays out.
 */
export function eventLanes(calendar: TripCalendar, parkOrder: readonly string[] = []): EventLane[] {
  const lanes = new Map<string, EventLane>();
  for (const season of calendar.seasons) {
    if (!isSeasonEvent(season)) continue;
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
  for (const day of factDays(calendar).days) {
    const park = day.parks[slug];
    if (!isRankable(park)) continue;
    (isWeekend(day.date) ? weekend : weekday).push(shownWait(park)!);
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
  for (const day of factDays(calendar).days) {
    const park = day.parks[slug];
    if (!isRankable(park)) continue;
    if (closesEarly(park)) {
      on.push(shownWait(park)!);
      closesAt ??= dayGuestClose(park) ?? null;
    } else {
      off.push(shownWait(park)!);
    }
  }
  return { count: on.length, closesAt, waitOnThem: meanWait(on), waitOtherwise: meanWait(off) };
}

/** A resort's month in a few facts: its quietest dates, its busiest, and what runs. */
export interface ResortMonthSummary {
  group: RegionGroup;
  /** The resort's best dates, each with the park that has the shortest lines that day. */
  quiet: Array<{ date: string; park: TripRegionPark; wait: number | null; basis: TripBasis }>;
  /** The resort's busiest days: the highest mean over its parks with a figure that day. */
  busy: Array<{ date: string; wait: number; basis: TripBasis }>;
}

/**
 * Each resort's month: the best dates from `/best-days` (the API ranks them on the unrounded
 * figures), and from the calendar the two days with the highest mean over the resort's parks that
 * have a figure, so a day most of its parks call quiet is never one of its busiest. A day trip with
 * a headliner park counts as a resort here; a group with no figure in the window is left out.
 */
export function resortMonthSummaries(
  region: TripRegion,
  calendar: TripCalendar,
  bestDays: TripBestDays | null
): ResortMonthSummary[] {
  const basisOf = (date: string, slug: string): TripBasis =>
    calendar.days.find((d) => d.date === date)?.parks[slug]?.basis ?? 'none';
  // The minutes a date prints are the calendar's, so the answer and the cell say one number.
  const shownOn = (date: string, slug: string, ranked: number | undefined) =>
    shownWaitOn(calendar, slug, date, ranked) ?? null;
  return summaryGroups(region)
    .map((group) => {
      const quiet = (bestDays?.groups.find((g) => g.key === group.key)?.quiet ?? [])
        .map((entry) => {
          const park = group.parks.find((p) => p.slug === entry.slug);
          return park
            ? {
                date: entry.date,
                park,
                wait: shownOn(entry.date, entry.slug, entry.headlinerWait),
                basis: basisOf(entry.date, entry.slug),
              }
            : null;
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
      // Where `/best-days` names no resort pick, each headliner park's own quietest day stands in.
      const recorded =
        quiet.length > 0 || !bestDays
          ? quiet
          : group.parks
              .filter((p) => p.headliner)
              .flatMap((park) =>
                (bestDays.parks.find((b) => b.slug === park.slug)?.quiet ?? [])
                  .slice(0, 1)
                  .map((q) => ({
                    date: q.date,
                    park,
                    wait: shownOn(q.date, park.slug, q.headlinerWait),
                    basis: q.basis,
                  }))
              )
              .sort(
                (a, b) =>
                  (a.wait ?? Infinity) - (b.wait ?? Infinity) || a.date.localeCompare(b.date)
              )
              .slice(0, 3);
      const means = calendar.days
        .map((day) => {
          const ranked = group.parks.map((p) => day.parks[p.slug]).filter(isRankable);
          const wait = meanWait(ranked.map((d) => shownWait(d)!));
          return wait === null
            ? null
            : {
                date: day.date,
                wait,
                basis: ranked.some((d) => d.basis === 'last_year') ? 'last_year' : ranked[0].basis,
              };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
      const busy = [...means]
        .sort((a, b) => b.wait - a.wait || a.date.localeCompare(b.date))
        .slice(0, 2)
        .sort((a, b) => a.date.localeCompare(b.date));
      return { group, quiet: recorded, busy };
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

/** A region's today, in its own zone, never the server's or the browser's. */
export function tripRegionToday(region: string, nowMs: number): string {
  return getDateTimeFormat('en-CA', { timeZone: requireTripRegion(region).timezone }).format(nowMs);
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
 * The best park per group the first answer names: every group with a headliner park, by the API's
 * pick, or by its one park with a figure where it has nothing to choose between (Universal Studios
 * Hollywood). A group without a headliner (SeaWorld Orlando, the day trips) stays out.
 */
export function glanceLines(day: TripCalendarDay, region: TripRegion): ShortestLine[] {
  const picks = new Map(shortestLines(day, region).map((line) => [line.group.key, line]));
  return headlinerGroups(region).flatMap((group): ShortestLine[] => {
    const pick = picks.get(group.key);
    if (pick) return [pick];
    const open = group.parks.filter((p) => isRankable(day.parks[p.slug]));
    const only = open.length === 1 ? open[0] : undefined;
    const onlyDay = only ? day.parks[only.slug] : undefined;
    return only && isRankable(onlyDay) ? [{ group, park: only, day: onlyDay }] : [];
  });
}

/** A park's crowd calendar, with "Crowd Calendar" in the anchor: the query that page ranks for. */
export function parkCalendarHref(park: TripRegionPark, locale: string): string {
  const geo = parkGeo(park);
  return geo
    ? parkCalendarPath(locale, geo.continent, geo.country, geo.city, park.slug)
    : park.path;
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
  const text = from === to ? format.format(a) : format.formatRange(a, new Date(`${to}T12:00:00Z`));
  // Node's ICU puts thin spaces around the dash and a browser's plain ones; the server-rendered
  // text has to be the one the browser renders, or hydration fails.
  return text.replace(/[\u2009\u202f]/g, ' ');
}

/** A trip window's dates as one short range ({@link formatDateRange}). */
export function formatWindow(window: { from: string; to: string }, locale: string): string {
  return formatDateRange(window.from, window.to, locale);
}
