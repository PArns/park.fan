import { formatDurationShort } from '@/lib/i18n/time';
import type { useTranslations } from 'next-intl';
import type { ScheduleSummary } from '@/lib/api/types';
import { formatTime, getDateTimeFormat } from '@/lib/utils/intl-format';

export type { ScheduleSummary };

/**
 * Computes a human-readable schedule message for a park card.
 * Shared between ParkCard and ParkCardNearby.
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
  // Cached formatters (`lib/utils/intl-format.ts`). This runs twice per ParkCard (the phone row and
  // the card) and hub pages re-render 40–70 cards on every live refresh; `toLocale*String` with
  // options built a new formatter on each call, up to three per call here.
  const parkDay = (at: Date) => getDateTimeFormat('en-CA', tzOptions).format(at);
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

              // Check if it's "tomorrow" in the park's timezone
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
              // No timezone available — show only relative time to avoid displaying wrong UTC time
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

              // Check if it's "tomorrow" in the park's timezone
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
              // No timezone available — show only relative time to avoid displaying wrong UTC time
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
            const weeks = Math.ceil(totalWeeks);

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
