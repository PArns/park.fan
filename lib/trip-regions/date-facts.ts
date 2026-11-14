import { breakRuns } from './best-time';
import {
  dayGuestClose,
  eventLanes,
  hoursUnpublished,
  regionResorts,
  shortestLines,
} from './hub-data';
import type { StormSignal } from '@/lib/utils/day-signal-styles';
import { partySeason } from './plan-week';
import type {
  TripCalendar,
  TripCalendarDay,
  TripParkDay,
  TripRegion,
  TripRegionPark,
  TripSeason,
  TripWeather,
} from './types';

/**
 * What the planner's date grid says about a date beyond its tint: the park with the shortest lines,
 * overall or in the resort the visitor picked, the party nights that send day guests home early, New
 * Year's Eve, the storm season, and the month's events under the grid. Read off the calendar the API sends; pure, so
 * the grid and the tests agree.
 */

/** A park whose day guests leave early for a separately ticketed evening. */
export interface DateParty {
  park: TripRegionPark;
  day: TripParkDay;
  /** When the day guests leave, park-local ISO. */
  leaveAt: string;
  /** The curated season behind the evening, where the calendar names one. */
  season: TripSeason | null;
}

/** One resort's pick on a date, as the date grid draws it. */
export interface DatePick {
  /** The resort's key and name. */
  group: { key: string; name: string };
  park: TripRegionPark;
  day: TripParkDay;
  /** The pick stands on the forecast alone: the park has not published its hours for the date. */
  hoursUnpublished: boolean;
  /** The park with a shorter wait the pick won against, because its day guests leave early. */
  earlyElsewhere: { park: TripRegionPark; day: TripParkDay } | null;
  /** The resort's party night that date, which the cell marks on the resort's row. */
  party: DateParty | null;
}

/**
 * The parks whose day guests leave early on a date for a separately ticketed evening, in the
 * region's order: a ticketed evening the API also calls an early close. An evening after a normal
 * close (Disney After Hours) leaves the day guest's day as it is and is not one.
 */
export function dateParties(
  day: TripCalendarDay,
  region: TripRegion,
  calendar?: TripCalendar
): DateParty[] {
  const parties: DateParty[] = [];
  for (const park of region.parks) {
    const parkDay = day.parks[park.slug];
    const leaveAt = dayGuestClose(parkDay);
    if (!parkDay || parkDay.evening?.kind !== 'ticketed_event' || !parkDay.closesEarly || !leaveAt)
      continue;
    parties.push({
      park,
      day: parkDay,
      leaveAt,
      season: partySeason(calendar, park.slug, day.date),
    });
  }
  return parties;
}

/**
 * Per resort the API's pick that date (`best`, read through the hub's `shortestLines`), with why it
 * won and the resort's party night. A resort without a pick (a last-year date, no figure) is left
 * out rather than guessed.
 */
export function datePicks(
  day: TripCalendarDay,
  region: TripRegion,
  calendar?: TripCalendar
): DatePick[] {
  const parties = dateParties(day, region, calendar);
  return shortestLines(day, region).map((line) => ({
    group: { key: line.group.key, name: line.group.name },
    park: line.park,
    day: line.day,
    hoursUnpublished: hoursUnpublished(line.day),
    earlyElsewhere: line.earlyElsewhere ?? null,
    party: parties.find((p) => p.park.group === line.group.key) ?? null,
  }));
}

/**
 * What the date grid shows under each date: the best park of all the switch's resorts (`all`), or
 * the best park of one resort, by its group key.
 */
export type CalendarMode = 'all' | (string & {});

/**
 * The resorts the date grid's switch offers, in the region's order: those with a headliner park,
 * the parks a trip is planned around (Orlando's Disney and Universal, not SeaWorld).
 */
export function calendarResorts(region: TripRegion): Array<{ key: string; name: string }> {
  return regionResorts(region)
    .filter((group) => group.parks.some((park) => park.headliner))
    .map((group) => ({ key: group.key, name: group.name }));
}

/**
 * The switch's first answer: the one resort the visitor's parks lie in, else the one their owned
 * tickets lie in, else `all`. `parkSlugs` is `null` until the visitor chooses parks.
 */
export function defaultCalendarMode(
  region: TripRegion,
  parkSlugs: readonly string[] | null,
  ticketResorts: readonly string[]
): CalendarMode {
  const offered = new Set(calendarResorts(region).map((r) => r.key));
  const only = (keys: Iterable<string>) => {
    const inside = [...new Set(keys)].filter((key) => offered.has(key));
    return inside.length === 1 ? inside[0] : null;
  };
  const groupOf = new Map(region.parks.map((park) => [park.slug, park.group]));
  const fromParks = parkSlugs?.length
    ? only(parkSlugs.map((slug) => groupOf.get(slug) ?? ''))
    : null;
  return fromParks ?? only(ticketResorts) ?? 'all';
}

/** Minutes a day guest has on a park day, for the tie between equal waits; unknown counts as none. */
function guestMinutes(day: TripParkDay): number {
  const close = day.dayGuestCloseAt ?? day.closesAt;
  return day.opensAt && close ? (Date.parse(close) - Date.parse(day.opensAt)) / 60_000 : 0;
}

/**
 * The pick a date shows in `mode`: the chosen resort's, or of the picks of `resorts` the one with
 * the shortest peak wait (`headlinerWait`, the figure parks are compared by), ties to the longer
 * day for a day guest, then the region's order. `null` where the date has none.
 */
export function modePick(
  picks: readonly DatePick[],
  mode: CalendarMode,
  resorts: readonly string[]
): DatePick | null {
  if (mode !== 'all') return picks.find((pick) => pick.group.key === mode) ?? null;
  const candidates = picks.filter(
    (pick) => resorts.includes(pick.group.key) && pick.day.headlinerWait != null
  );
  return (
    [...candidates].sort(
      (a, b) =>
        a.day.headlinerWait! - b.day.headlinerWait! || guestMinutes(b.day) - guestMinutes(a.day)
    )[0] ?? null
  );
}

/** New Year's Eve: the date alone says it, wherever the region is. */
export function isNewYearsEve(date: string): boolean {
  return date.slice(5) === '12-31';
}

/** A storm season's day as the API names it on a plan day: the season, or its peak. */
export type StormCode = `${'hurricane' | 'typhoon'}_${'season' | 'peak'}`;

/** Whether `MM-DD` lies in a range of the region's year, both ends in; a range may cross New Year. */
function inMonthDayRange(monthDay: string, from: string, to: string): boolean {
  return from <= to ? monthDay >= from && monthDay <= to : monthDay >= from || monthDay <= to;
}

/**
 * A date's place in the region's storm season (`weather.storm`, `MM-DD` from the API): its peak,
 * the season, or `null` outside it and in a region without one. The API's own rule for a plan day's
 * `hurricane_*` and `typhoon_*` warnings, so the calendars mark what the plan warns of.
 */
export function stormCodeOn(date: string, weather: TripWeather | undefined): StormCode | null {
  const storm = weather?.storm;
  if (!storm) return null;
  const monthDay = date.slice(5);
  if (!inMonthDayRange(monthDay, storm.from, storm.to)) return null;
  return storm.peak && inMonthDayRange(monthDay, storm.peak.from, storm.peak.to)
    ? `${storm.kind}_peak`
    : `${storm.kind}_season`;
}

/** A storm code's segment in a calendar cell's signal bar: solid at the peak, dashed for the season. */
export function stormSignal(code: StormCode): StormSignal {
  return code.endsWith('_peak') ? 'stormPeak' : 'storm';
}

/** The seasons a date lies in that the answers name but do not price (`weather.notes`): Japan's `rainy_season`. */
export function weatherNotesOn(date: string, weather: TripWeather | undefined): string[] {
  const monthDay = date.slice(5);
  return (weather?.notes ?? [])
    .filter((note) => inMonthDayRange(monthDay, note.from, note.to))
    .map((note) => note.kind);
}

/** One row of the events under the date grid. */
export interface MonthEvent {
  /**
   * `party` a separately ticketed evening (counted in nights), `festival` a season inside the
   * day, `break` a run of school-break days, `holiday` a public holiday, `nye` New Year's Eve,
   * however many parks hold an evening for it.
   */
  kind: 'party' | 'festival' | 'break' | 'holiday' | 'nye';
  id: string;
  /** The season's or break's own name; `null` where the API sends none. */
  name: string | null;
  /** The parks it runs at, in the region's order; none for a break, a holiday or New Year's Eve. */
  parkSlugs: string[];
  /** Last year's pattern, not an announcement. */
  expected: boolean;
  /** Its dates in the month, sorted. */
  dates: string[];
  /** It runs from the first date of the month the calendar covers. */
  fromStart: boolean;
  /** It runs to the last date of the month the calendar covers. */
  toEnd: boolean;
  /** It runs on every date of the month the calendar covers. */
  wholeMonth: boolean;
}

/**
 * The month's events for the list under the date grid: the hub's season lanes (`eventLanes`) cut
 * to the month (`YYYY-MM`) and to `parkSlugs`, the parks the visitor may visit, then the school
 * breaks as runs (`breakRuns`, so an unnamed weekend joins its break) and the public holidays. Every
 * season held only on 31 December becomes one New Year's Eve row; its date carries the grid's mark.
 */
export function monthEvents(
  calendar: TripCalendar,
  month: string,
  parkSlugs: readonly string[]
): MonthEvent[] {
  const covered = calendar.days.map((d) => d.date).filter((date) => date.startsWith(month));
  if (covered.length === 0) return [];
  const first = covered[0];
  const last = covered[covered.length - 1];
  const wanted = new Set(parkSlugs);
  const rows: MonthEvent[] = [];
  const nye: MonthEvent = {
    kind: 'nye',
    id: `nye:${month}`,
    name: null,
    parkSlugs: [],
    expected: false,
    dates: [],
    fromStart: false,
    toEnd: false,
    wholeMonth: false,
  };
  const row = (
    kind: MonthEvent['kind'],
    id: string,
    name: string | null,
    parks: string[],
    dates: string[],
    expected = false
  ): MonthEvent => {
    const fromStart = dates[0] === first;
    const toEnd = dates[dates.length - 1] === last;
    return {
      kind,
      id,
      name,
      parkSlugs: parks,
      expected,
      dates,
      fromStart,
      toEnd,
      wholeMonth: fromStart && toEnd && dates.length === covered.length,
    };
  };
  for (const lane of eventLanes(calendar, parkSlugs)) {
    if (lane.kind === 'break') continue;
    const dates = lane.dates.filter((date) => date.startsWith(month));
    if (dates.length === 0) continue;
    const parks = lane.parkSlugs.filter((slug) => wanted.has(slug));
    if (parks.length === 0) continue;
    if (lane.dates.every(isNewYearsEve)) {
      nye.dates = [...new Set([...nye.dates, ...dates])];
      continue;
    }
    rows.push(row(lane.kind, lane.id, lane.name, parks, dates, lane.status === 'expected'));
  }
  const days = calendar.days.filter((day) => day.date.startsWith(month));
  const breaks = days
    .filter((day) => day.isSchoolVacation)
    .map((day) => ({ date: day.date, name: day.holidays?.[0] ?? '' }));
  for (const run of breakRuns(breaks)) {
    const dates = days.map((d) => d.date).filter((date) => date >= run.from && date <= run.to);
    rows.push(row('break', `break:${run.from}`, run.name, [], dates));
  }
  for (const day of days.filter((d) => d.isHoliday)) {
    rows.push(row('holiday', `holiday:${day.date}`, day.holidays?.at(-1) ?? null, [], [day.date]));
  }
  if (nye.dates.length > 0) rows.push(nye);
  return rows;
}
