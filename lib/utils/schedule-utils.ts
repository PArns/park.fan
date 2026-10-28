import { formatDurationShort } from '@/lib/i18n/time';
import type { useTranslations } from 'next-intl';
import type { ScheduleSummary } from '@/lib/api/types';
import { formatClockTime, formatTime, getDateTimeFormat } from '@/lib/utils/intl-format';
import { parkDayOf } from '@/lib/utils/park-day';

export type { ScheduleSummary };

/**
 * „Öffnet am 15. März": a park's next opening, the day in the park's own zone, as the hero's park
 * block and the search lists print it. `opensOn` is the `parks.opensOn` string.
 */
export function formatOpensOn(
  opensOn: string,
  openingTime: string,
  timeZone: string,
  locale: string
): string {
  const day = getDateTimeFormat(locale, { day: 'numeric', month: 'long', timeZone });
  return `${opensOn} ${day.format(new Date(openingTime))}`;
}

/** A schedule entry's opening and closing, where it is an operating day that gives both. */
export function operatingHours(
  schedule: ScheduleSummary | null | undefined
): { open: string; close: string } | null {
  return schedule?.scheduleType === 'OPERATING' && schedule.openingTime && schedule.closingTime
    ? { open: schedule.openingTime, close: schedule.closingTime }
    : null;
}

/**
 * Whether today can still be visited at `nowMs`: today's hours have not closed yet. No entry at all
 * says nothing about today, so it counts as an open day, the reading `isParkDayOver` gives a park
 * without published hours; a `null` clock (before mount) cannot rule today out either.
 */
export function isTodayAhead(
  todaySchedule: ScheduleSummary | null | undefined,
  nowMs: number | null
): boolean {
  if (!todaySchedule) return true;
  const hours = operatingHours(todaySchedule);
  return hours !== null && (nowMs === null || nowMs < new Date(hours.close).getTime());
}

/** A park's next opening: when, and whether that is on the park's today. */
export interface ParkOpening {
  /** The opening as the API gives it, an ISO instant. */
  at: string;
  today: boolean;
}

/**
 * The next opening a shut park has ahead of `nowMs`: today's, while it is still to come, else the
 * next operating day's. An entry whose opening has passed is skipped, since the API's
 * `nextSchedule` can be today's for a park far east of the request's other parks. `null` where
 * neither lies ahead: the pill then says „Geschlossen" rather than a date that is not coming.
 */
export function nextParkOpening(
  todaySchedule: ScheduleSummary | null | undefined,
  nextSchedule: ScheduleSummary | null | undefined,
  timeZone: string,
  nowMs: number
): ParkOpening | null {
  const now = operatingHours(todaySchedule);
  // Open by the clock: only the status snapshot is stale, so there is nothing to announce.
  if (now && new Date(now.open).getTime() <= nowMs && nowMs < new Date(now.close).getTime()) {
    return null;
  }
  for (const entry of [todaySchedule, nextSchedule]) {
    const hours = operatingHours(entry);
    if (!hours || new Date(hours.open).getTime() <= nowMs) continue;
    return {
      at: hours.open,
      today: parkDayOf(new Date(hours.open), timeZone) === parkDayOf(nowMs, timeZone),
    };
  }
  return null;
}

/**
 * {@link nextParkOpening} in words: „Öffnet um 09:00 Uhr" today, „Öffnet am 15. März" on a later
 * day. `opensAt` is `parks.opensAt` with the clock time filled in, `opensOn` the `parks.opensOn`
 * string.
 */
export function formatParkOpening(
  opening: ParkOpening,
  strings: { opensOn: string; opensAt: (time: string) => string },
  timeZone: string,
  locale: string
): string {
  return opening.today
    ? strings.opensAt(formatClockTime(opening.at, locale, timeZone))
    : formatOpensOn(strings.opensOn, opening.at, timeZone, locale);
}

/**
 * The schedule line for a park card (opening soon, closing at, off season), drawn by
 * `ParkCardScheduleFooter`.
 */
export function getScheduleMessage(
  todaySchedule: ScheduleSummary | undefined,
  nextSchedule: ScheduleSummary | undefined,
  timezone: string | undefined,
  status: string | undefined,
  isInMaintenance: boolean,
  locale: string,
  t: ReturnType<typeof useTranslations<'nearby'>>,
  tCommon: ReturnType<typeof useTranslations<'common'>>,
  hasOperatingSchedule: boolean = true
): {
  message: string;
  icon: 'opening' | 'closing' | 'offseason';
  offseasonDetails?: string;
  /** Present when icon === 'opening' and timezone is known: raw ISO for ParkTime rendering. */
  openingTimeISO?: string;
  /** Present when icon === 'opening': day/weekday prefix already translated, e.g. "Morgen, ". */
  dayPrefix?: string;
  /** Present when icon === 'opening': formatted remaining text, e.g. "in 8 Std. 30 Min." */
  remainingText?: string;
} | null {
  if (isInMaintenance) return null;
  if (!todaySchedule && !nextSchedule) return null;

  const effectiveStatus =
    status || (todaySchedule?.scheduleType === 'OPERATING' ? 'OPERATING' : 'CLOSED');
  const tzOptions = timezone ? { timeZone: timezone } : {};
  // Cached formatters: this runs twice per ParkCard, and hub pages re-render dozens of cards on
  // every live refresh.
  const parkDay = (at: Date) => parkDayOf(at, timezone);
  const clockTime = (at: Date) =>
    formatTime(at, locale, { hour: '2-digit', minute: '2-digit', ...tzOptions });

  try {
    const now = new Date();

    if (effectiveStatus === 'OPERATING' && todaySchedule?.scheduleType === 'OPERATING') {
      const closing = new Date(todaySchedule.closingTime);
      const diff = closing.getTime() - now.getTime();
      if (diff <= 0) return null;

      return { message: `${t('closesIn')} ${formatDurationShort(diff, tCommon)}`, icon: 'closing' };
    }

    if (effectiveStatus === 'CLOSED' || effectiveStatus === 'UNKNOWN') {
      if (todaySchedule?.scheduleType === 'OPERATING' && todaySchedule.openingTime) {
        const opening = new Date(todaySchedule.openingTime);
        const diff = opening.getTime() - now.getTime();

        if (diff > 0) {
          const hours = diff / (1000 * 60 * 60);
          const remaining = `${tCommon('in')} ${formatDurationShort(diff, tCommon)}`;

          if (hours < 24) {
            if (timezone) {
              const openingTimeFormatted = clockTime(opening);

              // „Tomorrow" in the park's timezone.
              const todayInParkTz = parkDay(now);
              const openingInParkTz = parkDay(opening);
              const dayPrefix = todayInParkTz !== openingInParkTz ? `${tCommon('tomorrow')}, ` : '';

              return {
                message: `${dayPrefix}${openingTimeFormatted}${tCommon('timeSuffix')} (${remaining})`,
                icon: 'opening',
                openingTimeISO: opening.toISOString(),
                dayPrefix,
                remainingText: remaining,
              };
            } else {
              // No timezone: relative time only, rather than a wrong UTC clock time.
              return { message: remaining, icon: 'opening' };
            }
          }
        }
      }

      if (nextSchedule?.scheduleType === 'OPERATING' && nextSchedule.openingTime) {
        const nextOpening = new Date(nextSchedule.openingTime);
        const diff = nextOpening.getTime() - now.getTime();

        if (diff > 0) {
          const totalHours = diff / (1000 * 60 * 60);
          const totalDays = diff / (1000 * 60 * 60 * 24);
          const totalWeeks = totalDays / 7;

          if (totalHours < 24) {
            const remaining = `${tCommon('in')} ${formatDurationShort(diff, tCommon)}`;

            if (timezone) {
              const openingTimeFormatted = clockTime(nextOpening);

              // „Tomorrow" in the park's timezone.
              const todayInParkTz = parkDay(now);
              const openingInParkTz = parkDay(nextOpening);
              const dayPrefix = todayInParkTz !== openingInParkTz ? `${tCommon('tomorrow')}, ` : '';

              return {
                message: `${dayPrefix}${openingTimeFormatted}${tCommon('timeSuffix')} (${remaining})`,
                icon: 'opening',
                openingTimeISO: nextOpening.toISOString(),
                dayPrefix,
                remainingText: remaining,
              };
            } else {
              // No timezone: relative time only, rather than a wrong UTC clock time.
              return { message: remaining, icon: 'opening' };
            }
          } else if (totalDays < 7) {
            const weekday = getDateTimeFormat(locale, {
              weekday: 'long',
              ...tzOptions,
            }).format(nextOpening);
            const days = Math.floor(totalDays);
            const remainingHours = Math.floor(totalHours % 24);
            const remaining = `${tCommon('in')} ${days} ${t('day', { count: days })}, ${remainingHours} ${tCommon('hourShort')}`;

            if (timezone) {
              const openingTimeFormatted = clockTime(nextOpening);
              return {
                message: `${weekday}, ${openingTimeFormatted}${tCommon('timeSuffix')} (${remaining})`,
                icon: 'opening',
                openingTimeISO: nextOpening.toISOString(),
                dayPrefix: `${weekday}, `,
                remainingText: remaining,
              };
            }
            return {
              message: `${weekday} (${remaining})`,
              icon: 'opening',
            };
          } else if (hasOperatingSchedule) {
            const dateFormatted = getDateTimeFormat(locale, {
              day: 'numeric',
              month: 'long',
              ...tzOptions,
            }).format(nextOpening);
            // Rounded, not ceiled: 7 days and an hour is one week, not two.
            const weeks = Math.max(1, Math.round(totalWeeks));

            return {
              message: t('offseason'),
              icon: 'offseason',
              offseasonDetails: ` (${t('opensOn')} ${dateFormatted} - ${tCommon('in')} ${weeks} ${t('week', { count: weeks })})`,
            };
          }
        }
      }

      if (hasOperatingSchedule && (!nextSchedule || nextSchedule.scheduleType !== 'OPERATING')) {
        return { message: t('offseason'), icon: 'offseason' };
      }
    }

    return null;
  } catch (error) {
    console.error('[schedule-utils] Error calculating schedule:', error);
    return null;
  }
}
