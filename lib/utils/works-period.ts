import type { WorksPeriod } from '@/lib/api/types';
import { formatParkDay } from '@/lib/utils/park-day';

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
  slug: string;
  name: string;
  period: WorksPeriod;
}

/**
 * The rides a window closes on `onDate`, in the order given. The calendar asks it per day and the
 * plan-day route per planned day, so both name the same rides.
 */
export function ridesInWorksOn(
  rides: readonly (WorksPeriodFields & { slug: string; name: string })[],
  onDate: string
): RideInWorks[] {
  const out: RideInWorks[] = [];
  for (const ride of rides) {
    const period = worksPeriodOn(worksPeriodsOf(ride), onDate);
    if (period) out.push({ slug: ride.slug, name: ride.name, period });
  }
  return out;
}

/** The `parks.worksPeriod` keys a window's dates are written with. */
export type WorksWindowKey =
  'window' | 'windowUncertain' | 'windowDay' | 'windowFrom' | 'windowTo' | 'windowToUncertain';

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
 * A window as a short phrase that claims nothing about today: „vom 16. Januar 2027 bis 3. März
 * 2027", „am 8. Dezember 2026", „ab 16. Januar 2027", „voraussichtlich bis 3. März 2027". The
 * tooltips, the calendar's day detail and the planner list windows that may lie ahead, so the ride
 * page's „seit" sentences do not fit. A one-day window with a firm end is written as that day. Null
 * for a window with neither bound, which the API never sends.
 *
 * @param t `useTranslations('parks.worksPeriod')` or its server twin.
 * @param options How a day is written; long month and year by default (see `formatParkDay`).
 */
export function worksWindowLabel(
  period: WorksPeriod,
  locale: string,
  t: (key: WorksWindowKey, values: Record<string, string>) => string,
  options?: Intl.DateTimeFormatOptions
): string | null {
  const from = period.from ? formatParkDay(locale, period.from, options) : null;
  const to = period.to ? formatParkDay(locale, period.to, options) : null;
  const values = {
    from: from ?? '',
    to: to ?? '',
    fromVowel: dayNumberElides(period.from),
    toVowel: dayNumberElides(period.to),
  };
  if (from && to) {
    if (period.from === period.to && !period.toUncertain) return t('windowDay', values);
    return t(period.toUncertain ? 'windowUncertain' : 'window', values);
  }
  if (from) return t('windowFrom', values);
  if (to) return t(period.toUncertain ? 'windowToUncertain' : 'windowTo', values);
  return null;
}
