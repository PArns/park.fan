import { breakRuns } from './best-time';
import {
  dayGuestClose,
  eventLanes,
  hoursUnpublished,
  regionResorts,
  resortHasChoice,
  shortestLines,
} from './hub-data';
import { partySeason } from './plan-week';
import type {
  TripCalendar,
  TripCalendarDay,
  TripParkDay,
  TripRegion,
  TripRegionPark,
  TripSeason,
} from './types';

/**
 * What the planner's date grid says about a date beyond its tint: per resort the park with the
 * shortest lines, the party nights that send day guests home early, New Year's Eve, and the month's
 * events under the grid. Read off the calendar the API sends; pure, so the grid and the tests agree.
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
 * Per resort with a choice that date ({@link resortHasChoice}) the API's pick (`best`, read through
 * the hub's `shortestLines`), with why it won and the resort's party night. A resort without a pick
 * (a last-year date, no figure) is left out rather than guessed.
 */
export function datePicks(
  day: TripCalendarDay,
  region: TripRegion,
  calendar?: TripCalendar
): DatePick[] {
  const parties = dateParties(day, region, calendar);
  const resorts = new Map(regionResorts(region).map((group) => [group.key, group]));
  return shortestLines(day, region)
    .filter((line) => {
      const group = resorts.get(line.group.key);
      return group !== undefined && resortHasChoice(day, group);
    })
    .map((line) => ({
      group: { key: line.group.key, name: line.group.name },
      park: line.park,
      day: line.day,
      hoursUnpublished: hoursUnpublished(line.day),
      earlyElsewhere: line.earlyElsewhere ?? null,
      party: parties.find((p) => p.park.group === line.group.key) ?? null,
    }));
}

/** New Year's Eve: the date alone says it, wherever the region is. */
export function isNewYearsEve(date: string): boolean {
  return date.slice(5) === '12-31';
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
