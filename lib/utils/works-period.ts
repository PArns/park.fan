import type { WorksPeriod } from '@/lib/api/types';
import { formatParkDay, formatParkDayRange } from '@/lib/utils/park-day';

/**
 * Whether a curated rebuild window covers a given day. The twin of the backend's
 * `isCuratedOutOfService()` and must stay one, or the „Umbaupause" badge and the planner gate
 * disagree. Compared as `YYYY-MM-DD` strings, never `Date`s, so no offset enters a question about
 * the park's own calendar. Both bounds are inclusive and either may be null (open-ended); both null
 * answers false, since „nothing claimed" must not read as „in a rebuild".
 *
 * @param onDate The PARK-local day, computed on the server (a client clock here is a hydration
 *   bug). Undefined answers false, so a listing that does not know the park's day says nothing.
 */
export function isWorksPeriodActive(
  period: WorksPeriod | null | undefined,
  onDate: string | undefined
): boolean {
  if (!period || !onDate) return false;

  const { from, to } = period;
  if (!from && !to) return false;
  if (from && onDate < from) return false;
  if (to && onDate > to) return false;
  return true;
}

/** The two works fields a ride can carry, on the park payload and the attraction detail alike. */
export interface WorksPeriodFields {
  worksPeriod?: WorksPeriod | null;
  worksPeriods?: readonly WorksPeriod[] | null;
}

/**
 * Every curated window of a ride, sorted by start as the API sends them. Falls back to the single
 * `worksPeriod` for a payload cached before the list existed, so no reader has to ask which of the
 * two fields it got.
 */
export function worksPeriodsOf(ride: WorksPeriodFields | null | undefined): readonly WorksPeriod[] {
  if (!ride) return [];
  if (ride.worksPeriods && ride.worksPeriods.length > 0) return ride.worksPeriods;
  return ride.worksPeriod ? [ride.worksPeriod] : [];
}

/** The window that covers `onDate`, or null. The API guarantees windows never overlap. */
export function worksPeriodOn(
  periods: readonly WorksPeriod[],
  onDate: string | undefined
): WorksPeriod | null {
  return periods.find((period) => isWorksPeriodActive(period, onDate)) ?? null;
}

/**
 * The next window to start after `today`, or null. Only a window with a start can lie ahead: one
 * without `from` was already running when somebody wrote it down.
 */
export function nextWorksPeriod(
  periods: readonly WorksPeriod[],
  today: string | undefined
): WorksPeriod | null {
  if (!today) return null;
  return periods.find((period) => Boolean(period.from) && period.from! > today) ?? null;
}

/** A ride closed for works on one day, with the window that closes it. */
export interface RideInWorks {
  /** The ride's UUID where the source carries one, to match it against another list's rides. */
  id?: string;
  slug: string;
  name: string;
  period: WorksPeriod;
}

/**
 * The rides a window closes on `onDate`, by name. The calendar asks it per day and the plan-day
 * route per planned day, so both name the same rides in the same order.
 */
export function ridesInWorksOn(
  rides: readonly (WorksPeriodFields & { id?: string; slug: string; name: string })[],
  onDate: string
): RideInWorks[] {
  const out: RideInWorks[] = [];
  for (const ride of rides) {
    const period = worksPeriodOn(worksPeriodsOf(ride), onDate);
    if (period) {
      out.push({ ...(ride.id && { id: ride.id }), slug: ride.slug, name: ride.name, period });
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/** The `parks.worksPeriod` keys the helpers below write with. */
export type WorksPeriodKey =
  | 'label'
  | 'windowUncertain'
  | 'windowFrom'
  | 'windowTo'
  | 'windowToUncertain'
  | 'windowOpenEnd'
  | 'runningUntil'
  | 'runningUntilUncertain'
  | 'upcoming'
  | 'upcomingDay';

/** What `t` is handed: `useTranslations('parks.worksPeriod')` or its server twin. */
type WorksT = (key: WorksPeriodKey, values?: Record<string, string>) => string;

/** Day and short month, for a label that shares a row: „4. Dez.". */
const SHORT_DAY: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };

/**
 * Whether a day's number is spoken with a vowel first (8 „otto", 11 „undici"), as `yes` or `no` for
 * an ICU `select`: Italian writes „dall’8 dicembre", never „dal 8". Every caller passes it beside
 * the date; the other five languages do not read it.
 */
export function dayNumberElides(isoDay: string | null | undefined): 'yes' | 'no' {
  const day = isoDay?.slice(8, 10);
  return day === '08' || day === '11' ? 'yes' : 'no';
}

/**
 * A window as a phrase that claims nothing about today, for a list of one ride's windows: „16.–27.
 * November 2026", „4. Januar – 25. März 2027 (Ende geschätzt)", „ab 16. Januar 2027", „bis 3. März
 * 2027". The range is `formatParkDayRange`, so a one-day window is that day. Null for a window
 * with neither bound, which the API never sends.
 */
export function worksWindowLabel(period: WorksPeriod, locale: string, t: WorksT): string | null {
  if (period.from && period.to) {
    const range = formatParkDayRange(locale, period.from, period.to);
    return period.toUncertain ? t('windowUncertain', { range }) : range;
  }
  if (period.from) {
    return t('windowFrom', {
      from: formatParkDay(locale, period.from),
      fromVowel: dayNumberElides(period.from),
    });
  }
  return period.to ? worksEndLabel(period, locale, t) : null;
}

/**
 * Until when a window keeps a ride shut, seen from one day: „bis 25. März", „voraussichtlich bis
 * 25. März", „Ende offen". On a given day the start is history and the reopening is the question,
 * so the calendar's day and the planner list only this. The year is written where it differs from
 * `onDate`'s, and always without `onDate`.
 */
export function worksEndLabel(
  period: WorksPeriod,
  locale: string,
  t: WorksT,
  onDate?: string
): string {
  if (!period.to) return t('windowOpenEnd');
  const sameYear = onDate !== undefined && onDate.slice(0, 4) === period.to.slice(0, 4);
  const to = formatParkDay(
    locale,
    period.to,
    sameYear
      ? { day: 'numeric', month: 'long' }
      : { day: 'numeric', month: 'long', year: 'numeric' }
  );
  return t(period.toUncertain ? 'windowToUncertain' : 'windowTo', {
    to,
    toVowel: dayNumberElides(period.to),
  });
}

/**
 * A running window in a few words: „Umbaupause bis 4. Dez.", „Umbaupause bis ca. 4. Dez." for an
 * estimated end, plain „Umbaupause" with no end on file. The ride card's badge and the planner's
 * block, where the reopening is the one date worth the room.
 */
export function worksRunningLabel(period: WorksPeriod, locale: string, t: WorksT): string {
  if (!period.to) return t('label');
  return t(period.toUncertain ? 'runningUntilUncertain' : 'runningUntil', {
    to: formatParkDay(locale, period.to, SHORT_DAY),
    toVowel: dayNumberElides(period.to),
  });
}

/**
 * A window that has not started, in a few words: „Umbaupause ab 16. Jan.", or „Umbaupause am 8.
 * Dez." for a single day with a firm end. Only for a window with a start (`nextWorksPeriod`).
 */
export function worksUpcomingLabel(period: WorksPeriod, locale: string, t: WorksT): string {
  const from = period.from ?? '';
  return t(period.from === period.to && !period.toUncertain ? 'upcomingDay' : 'upcoming', {
    from: formatParkDay(locale, from, SHORT_DAY),
    fromVowel: dayNumberElides(from),
  });
}
