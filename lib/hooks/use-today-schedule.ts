'use client';

import { useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useBrowserNow } from '@/lib/hooks/use-mounted';
import { formatDurationShort } from '@/lib/i18n/time';
import { useLiveParkData } from '@/lib/hooks/use-live-park-data';
import type {
  ParkStatus,
  ScheduleItem,
  NextScheduleItem,
  InfluencingHoliday,
  ParkWithAttractions,
} from '@/lib/api/types';

export interface UseTodayScheduleParams {
  timezone: string;
  /** Full day-stable park schedule; today's entry is picked CLIENT-side from the park clock. */
  schedule?: ScheduleItem[] | null;
  nextSchedule?: NextScheduleItem | null;
  status?: ParkStatus | null;
  hasOperatingSchedule?: boolean;
  /** Geo params → subscribe to the live park query (shared key with LiveParkData, no extra fetch)
   *  so status/schedule reflect the live state instead of the up-to-1-day-stale server snapshot. */
  continent?: string;
  country?: string;
  city?: string;
  parkSlug?: string;
}

export interface TodayScheduleResult {
  /** The live park (undefined until the poll lands — callers fall back to their initialData). */
  livePark: ParkWithAttractions | undefined;
  status: ParkStatus | null | undefined;
  todaySchedule: ScheduleItem | null;
  isOperatingToday: boolean;
  isUnknown: boolean;
  /** Best-known status for the badge (live poll › clock-derived › snapshot). */
  badgeStatus: ParkStatus | null | undefined;
  /** Hydration-safe visibility flag (false on the server/first render for normal parks). */
  showStatusBadge: boolean;
  openingTime: string | null;
  closingTime: string | null;
  isInferredHours: boolean;
  /** "öffnet in …" / "schließt in …" (null outside operating hours or before the clock mounts). */
  timeUntil: { message: string; variant: 'opening' | 'closing' | null } | null;
  currentTime: Date | null;
  /** Localized HH:mm in the park timezone, or "—" before the clock mounts. */
  currentTimeFormatted: string;
  /** Not operating today but reopening later. `weeks` is null when it opens within a week. */
  offseason: { dateFormatted: string; weeks: number | null; message: string } | null;
  holiday: {
    publicHolidayName: string | null;
    isBridgeDay: boolean;
    isSchoolVacation: boolean;
    influencing: InfluencingHoliday[];
  } | null;
}

/**
 * Derives today's schedule facts (opening hours, open/closed status, "closes in X" countdown,
 * current park-local time, offseason reopening, holiday context) from the day-stable park
 * schedule + the browser clock in the park's timezone.
 *
 * Single source of truth shared by <ParkTimeInfo> and the park header board (<ParkHeaderStats>).
 * Subscribes to the same live park query LiveParkData polls (shared React Query key → no extra
 * fetch) and prefers its fresh values, falling back to the passed props until the poll lands so
 * SSR and the first client render agree (hydration-safe).
 */
export function useTodaySchedule({
  timezone,
  schedule: scheduleProp,
  nextSchedule: nextScheduleProp,
  status: statusProp,
  hasOperatingSchedule: hasOperatingScheduleProp = true,
  continent,
  country,
  city,
  parkSlug,
}: UseTodayScheduleParams): TodayScheduleResult {
  const t = useTranslations('parks');
  const tCommon = useTranslations('common');
  const tNearby = useTranslations('nearby');
  const locale = useLocale();
  const currentTime = useBrowserNow(60_000);

  const hasParams = !!(continent && country && city && parkSlug);
  const { data: livePark, dataUpdatedAt } = useLiveParkData({
    continent: continent ?? '',
    country: country ?? '',
    city: city ?? '',
    parkSlug: parkSlug ?? '',
    enabled: hasParams,
  });
  const status = (hasParams ? livePark?.status : null) ?? statusProp;
  const schedule = (hasParams ? livePark?.schedule : null) ?? scheduleProp;
  const nextSchedule = (hasParams ? livePark?.nextSchedule : null) ?? nextScheduleProp;
  const hasOperatingSchedule =
    (hasParams ? livePark?.hasOperatingSchedule : undefined) ?? hasOperatingScheduleProp;

  // Pick today's entry CLIENT-side (browser clock in the park tz) so the static shell never reads
  // the server clock. Before mount we seed with the first entry; real "today" fills in after mount.
  const todaySchedule: ScheduleItem | null = (() => {
    if (!schedule || schedule.length === 0) return null;
    if (!currentTime) return schedule[0];
    const todayInParkTz = currentTime.toLocaleDateString('en-CA', { timeZone: timezone });
    return schedule.find((s) => s.date === todayInParkTz) ?? schedule[0];
  })();

  const currentTimeFormatted = (() => {
    if (!currentTime) return '—';
    try {
      return currentTime.toLocaleTimeString(locale, {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  })();

  const timeUntil = ((): TodayScheduleResult['timeUntil'] => {
    if (!todaySchedule || todaySchedule.scheduleType !== 'OPERATING') return null;
    const { openingTime, closingTime } = todaySchedule;
    if (!openingTime || !closingTime) return null;
    if (!currentTime) return null;
    const now = currentTime;
    const opening = new Date(openingTime);
    const closing = new Date(closingTime);
    // Guard: opening must be today in the park tz (not tomorrow's entry).
    const openingDateInParkTz = opening.toLocaleDateString('en-CA', { timeZone: timezone });
    const todayInParkTz = now.toLocaleDateString('en-CA', { timeZone: timezone });
    if (openingDateInParkTz !== todayInParkTz) return null;
    if (now < opening) {
      return {
        message: `${t('opensIn')} ${formatDurationShort(opening.getTime() - now.getTime(), tCommon)}`,
        variant: 'opening',
      };
    }
    if (now >= opening && now < closing) {
      return {
        message: `${t('closesIn')} ${formatDurationShort(closing.getTime() - now.getTime(), tCommon)}`,
        variant: 'closing',
      };
    }
    return null;
  })();

  const isOperatingToday = !!(todaySchedule && todaySchedule.scheduleType === 'OPERATING');
  const isUnknown = status === 'UNKNOWN' || (!isOperatingToday && !hasOperatingSchedule);

  // Derive the open/closed badge from today's hours + the clock (the same inputs the countdown
  // uses) so it appears together with the opening hours, with no extra request and no stale flash.
  // The resolved live status still wins (it can surface an unscheduled DOWN/closure).
  const liveStatus = hasParams && dataUpdatedAt > 0 ? (livePark?.status ?? null) : null;
  const scheduledStatus: ParkStatus | null = (() => {
    if (!isOperatingToday || !currentTime) return null;
    const { openingTime, closingTime } = todaySchedule!;
    if (!openingTime || !closingTime) return null;
    const opening = new Date(openingTime);
    const closing = new Date(closingTime);
    const todayInParkTz = currentTime.toLocaleDateString('en-CA', { timeZone: timezone });
    if (opening.toLocaleDateString('en-CA', { timeZone: timezone }) !== todayInParkTz) return null;
    return currentTime >= opening && currentTime < closing ? 'OPERATING' : 'CLOSED';
  })();
  const badgeStatus = liveStatus ?? scheduledStatus ?? status;
  const showStatusBadge =
    !hasParams || liveStatus !== null || scheduledStatus !== null || isUnknown;

  // Offseason: not operating today, but a future opening date is known.
  const offseason = ((): TodayScheduleResult['offseason'] => {
    if (isOperatingToday || isUnknown) return null;
    const nextOpeningRaw = nextSchedule?.date ?? nextSchedule?.openingTime;
    if (!nextOpeningRaw || !hasOperatingSchedule) return null;
    const nextOpening = new Date(nextOpeningRaw);
    if (Number.isNaN(nextOpening.getTime())) return null;
    if (!currentTime) return null;
    const now = currentTime;
    const dayDiff = Math.ceil((nextOpening.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const totalWeeks = dayDiff / 7;
    const dateFormatted = nextOpening.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      timeZone: timezone,
    });
    if (totalWeeks >= 1) {
      const weeks = Math.ceil(totalWeeks);
      return {
        dateFormatted,
        weeks,
        message: `${t('opensOn')} ${dateFormatted} · ${tCommon('in')} ${weeks} ${tNearby('week', { count: weeks })}`,
      };
    }
    return { dateFormatted, weeks: null, message: `${t('opensOn')} ${dateFormatted}` };
  })();

  // Memoized on todaySchedule (whose identity is stable across renders thanks to React
  // Query's structural sharing): the minute clock re-runs this hook constantly, and
  // rebuilding this object + filtered array each time defeated consumers' memos
  // (e.g. HeaderHolidayPanel keys a useMemo on `holiday`).
  const holiday = useMemo((): TodayScheduleResult['holiday'] => {
    if (!todaySchedule) return null;
    const has =
      todaySchedule.isHoliday ||
      todaySchedule.isBridgeDay ||
      todaySchedule.isSchoolVacation ||
      todaySchedule.influencingHolidays;
    if (!has) return null;
    const shownNames = new Set<string>();
    const publicHolidayName = todaySchedule.isHoliday ? todaySchedule.holidayName : null;
    if (publicHolidayName) shownNames.add(publicHolidayName.toLowerCase());
    // Keep influencing holidays DISTINCT BY REGION (name+country+region), not just by name: the same
    // holiday (e.g. "Summer Holidays") across several neighbouring states each contributes a region
    // to <HeaderHolidayPanel>. Still drop any that merely echo the local public holiday.
    const seenRegions = new Set<string>();
    const influencing = (todaySchedule.influencingHolidays ?? []).filter(
      (h: InfluencingHoliday) => {
        if (shownNames.has(h.name.toLowerCase())) return false;
        const key = `${h.name.toLowerCase()}|${h.source.countryCode}|${h.source.regionCode ?? ''}`;
        if (seenRegions.has(key)) return false;
        seenRegions.add(key);
        return true;
      }
    );
    return {
      publicHolidayName,
      isBridgeDay: !!todaySchedule.isBridgeDay,
      isSchoolVacation: !!todaySchedule.isSchoolVacation,
      influencing,
    };
  }, [todaySchedule]);

  return {
    livePark,
    status,
    todaySchedule,
    isOperatingToday,
    isUnknown,
    badgeStatus,
    showStatusBadge,
    openingTime: todaySchedule?.openingTime ?? null,
    closingTime: todaySchedule?.closingTime ?? null,
    isInferredHours: !!todaySchedule?.isInferred,
    timeUntil,
    currentTime,
    currentTimeFormatted,
    offseason,
    holiday,
  };
}
