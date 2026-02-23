import type { useTranslations } from 'next-intl';
import type { ScheduleSummary } from '@/lib/api/types';

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
  tCommon: ReturnType<typeof useTranslations<'common'>>
): { message: string; icon: 'opening' | 'closing' | 'offseason' } | null {
  if (isInMaintenance) return null;
  if (!todaySchedule && !nextSchedule) return null;

  const effectiveStatus =
    status || (todaySchedule?.scheduleType === 'OPERATING' ? 'OPERATING' : 'CLOSED');
  const tzOptions = timezone ? { timeZone: timezone } : {};

  try {
    const now = new Date();

    if (effectiveStatus === 'OPERATING' && todaySchedule?.scheduleType === 'OPERATING') {
      const closing = new Date(todaySchedule.closingTime);
      const diff = closing.getTime() - now.getTime();
      if (diff <= 0) return null;

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        return {
          message: `${t('closesIn')} ${hours} ${tCommon('hours')}. ${minutes} Min.`,
          icon: 'closing',
        };
      }
      return { message: `${t('closesIn')} ${minutes} Min.`, icon: 'closing' };
    }

    if (effectiveStatus === 'CLOSED') {
      if (todaySchedule?.scheduleType === 'OPERATING' && todaySchedule.openingTime) {
        const opening = new Date(todaySchedule.openingTime);
        const diff = opening.getTime() - now.getTime();

        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

          if (hours < 24) {
            const openingTimeFormatted = opening.toLocaleTimeString(locale, {
              hour: '2-digit',
              minute: '2-digit',
              ...tzOptions,
            });
            if (hours > 0) {
              return {
                message: `${openingTimeFormatted}${tCommon('timeSuffix')} (in ${hours} ${tCommon('hours')}. ${minutes} Min.)`,
                icon: 'opening',
              };
            }
            return {
              message: `${openingTimeFormatted}${tCommon('timeSuffix')} (in ${minutes} Min.)`,
              icon: 'opening',
            };
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

          const openingTimeFormatted = nextOpening.toLocaleTimeString(locale, {
            hour: '2-digit',
            minute: '2-digit',
            ...tzOptions,
          });

          if (totalHours < 24) {
            const hours = Math.floor(totalHours);
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (hours > 0) {
              return {
                message: `${openingTimeFormatted}${tCommon('timeSuffix')} (in ${hours} ${tCommon('hours')}. ${minutes} Min.)`,
                icon: 'opening',
              };
            }
            return {
              message: `${openingTimeFormatted}${tCommon('timeSuffix')} (in ${minutes} Min.)`,
              icon: 'opening',
            };
          } else if (totalDays < 7) {
            const weekday = nextOpening.toLocaleDateString(locale, {
              weekday: 'long',
              ...tzOptions,
            });
            const days = Math.floor(totalDays);
            const remainingHours = Math.floor(totalHours % 24);

            return {
              message: `${weekday}, ${openingTimeFormatted}${tCommon('timeSuffix')} (in ${days} ${t('day', { count: days })}, ${remainingHours} ${tCommon('hours')}.)`,
              icon: 'opening',
            };
          } else {
            const dateFormatted = nextOpening.toLocaleDateString(locale, {
              day: 'numeric',
              month: 'long',
              ...tzOptions,
            });
            const weeks = Math.ceil(totalWeeks);

            return {
              message: `${t('offseason')} (${t('opensOn')} ${dateFormatted} - ${tCommon('in')} ${weeks} ${t('week', { count: weeks })})`,
              icon: 'offseason',
            };
          }
        }
      }

      if (!nextSchedule || nextSchedule.scheduleType !== 'OPERATING') {
        return { message: t('offseason'), icon: 'offseason' };
      }
    }

    return null;
  } catch (error) {
    console.error('[schedule-utils] Error calculating schedule:', error);
    return null;
  }
}
