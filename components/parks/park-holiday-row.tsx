'use client';

import { useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { CalendarDays, Luggage } from 'lucide-react';
import { useTodaySchedule, type TodayScheduleResult } from '@/lib/hooks/use-today-schedule';
import { countryCodeForSlug, countryFlagEmoji, getRegionLabel } from '@/lib/utils/region-names';
import { translateHolidayName, genericSchoolHolidayName } from '@/lib/utils/holiday-names';
import { cn } from '@/lib/utils';
import type { ParkWithAttractions } from '@/lib/api/types';

interface ParkHolidayRowProps {
  initialData: ParkWithAttractions;
  /**
   * Geo params enable the live park poll behind `useTodaySchedule`. Omit all four and the row
   * renders from `initialData` alone and fetches nothing, as the guide page's static example wants.
   */
  continent?: string;
  country?: string;
  city?: string;
  parkSlug?: string;
  className?: string;
}

/**
 * Today's holidays in one band, the park's own region first. That region is the subject: named,
 * flagged, its chips in the per-type colours of the calendar's day detail. Neighbouring regions on
 * a school break are the second line, in neutral chips, under one sentence saying what they mean
 * for the queue.
 *
 * A school break is not a public holiday: `isHoliday` is true for both, so `holidayType` tells them
 * apart, with `isSchoolHoliday`/`isPublicHoliday` as the fallback for feeds that send only the
 * booleans. Names go through `translateHolidayName`, since the API answers in English only.
 */
export function ParkHolidayRow({
  initialData,
  continent = '',
  country = '',
  city = '',
  parkSlug = '',
  className,
}: ParkHolidayRowProps) {
  const sched = useTodaySchedule({
    timezone: initialData.timezone ?? 'UTC',
    schedule: initialData.schedule,
    nextSchedule: initialData.nextSchedule,
    status: initialData.status,
    hasOperatingSchedule: initialData.hasOperatingSchedule,
    continent,
    country,
    city,
    parkSlug,
  });

  return (
    <ParkHolidayBand
      holiday={sched.holiday}
      initialData={initialData}
      country={country}
      className={className}
    />
  );
}

/**
 * The band itself, for a caller that already holds today's schedule. `ParkTodayPanel` runs
 * `useTodaySchedule` with the same inputs and hands its `sched.holiday` in, so the hook does not
 * run twice.
 */
export function ParkHolidayBand({
  holiday,
  initialData,
  country = '',
  className,
}: {
  holiday: TodayScheduleResult['holiday'];
  initialData: ParkWithAttractions;
  country?: string;
  className?: string;
}) {
  const t = useTranslations('parks');
  const locale = useLocale();

  /** What the park's own state/country has today, in the order a visitor asks about it. */
  const localChips = useMemo(
    () => localHolidayChips(holiday, locale, t('bridgeDay')),
    [holiday, locale, t]
  );

  /** Neighbouring regions on a school break, deduplicated by the name they render under. */
  const neighbours = useMemo(() => neighbourRegions(holiday, locale), [holiday, locale]);

  if (localChips.length === 0 && neighbours.length === 0) return null;

  // The park's own region, named. `region` is the state ("Nordrhein-Westfalen"); parks outside a
  // state-level feed carry only a country, and the flag comes off the URL slug because the park
  // payload has a country NAME and no code.
  const countryCode = countryCodeForSlug(country) ?? '';
  const homeLabel =
    initialData.region ??
    (countryCode ? getRegionLabel(countryCode, null, locale) : (initialData.country ?? ''));
  const homeFlag = countryFlagEmoji(countryCode);

  // Capped so a peak-summer day (a dozen regions on break at once) cannot grow the band; the
  // overflow count still says "and more".
  const MAX_NEIGHBOURS = 6;
  const shownNeighbours = neighbours.slice(0, MAX_NEIGHBOURS);
  const overflow = neighbours.length - shownNeighbours.length;

  return (
    <div className={cn(className)}>
      <span className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase">
        <CalendarDays className="h-3 w-3" aria-hidden="true" />
        {t('holidaysLabel')}
      </span>

      {/* Two ranks, one grid: the `auto` label column starts both rows' chips on the same x.
          Stacked below `sm`, where a label column would leave the chips no room. */}
      <div className="mt-2 grid gap-x-3 gap-y-2.5 sm:grid-cols-[auto_1fr] sm:items-baseline">
        {localChips.length > 0 && (
          <>
            <span className="flex items-center gap-1.5 text-xs font-semibold">
              {homeFlag && <span aria-hidden="true">{homeFlag}</span>}
              {homeLabel}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {localChips.map((chip) => (
                <HolidayChip key={chip.key} icon={chip.icon} tone={chip.tone}>
                  {chip.label}
                </HolidayChip>
              ))}
            </div>
          </>
        )}

        {neighbours.length > 0 && (
          <>
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
              <Luggage
                className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400"
                aria-hidden="true"
              />
              {t('influencingHolidaysShort')}
            </span>
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
              {shownNeighbours.map((r) => (
                <HolidayChip key={r.label} icon={r.flag} tone={NEIGHBOUR_CHIP_TONE}>
                  {r.label}
                </HolidayChip>
              ))}
              {overflow > 0 && (
                <span className="text-muted-foreground text-xs font-medium">+{overflow}</span>
              )}
              {/* The consequence, on the same line as the chips when it fits. It is why the row is
                  here at all: those regions send day-trippers, so the queues run longer. */}
              <span className="text-xs text-amber-700 dark:text-amber-300/90">
                {t('influencingHolidaysEffect')}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * One chip of the band. Exported with the two builders below for `ParkTimeInfo`, which reads the
 * same `useTodaySchedule().holiday`, so both draw a holiday the same way.
 */
export function HolidayChip({
  icon,
  tone,
  children,
}: {
  icon?: string;
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
        tone
      )}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}

/** Neighbouring regions are the second rank: neutral chips, no colour of their own. */
export const NEIGHBOUR_CHIP_TONE = 'border-border/60 text-muted-foreground';

/** What the park's own state/country has today, in the order a visitor asks about it. */
export function localHolidayChips(
  holiday: TodayScheduleResult['holiday'],
  locale: string,
  bridgeDayLabel: string
): { key: string; icon: string; label: string; tone: string }[] {
  if (!holiday) return [];
  const chips: { key: string; icon: string; label: string; tone: string }[] = [];
  if (holiday.publicHolidayName) {
    chips.push({
      key: 'public',
      icon: '🎉',
      label: translateHolidayName(holiday.publicHolidayName, locale),
      tone: 'border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-300',
    });
  }
  if (holiday.isBridgeDay) {
    chips.push({
      key: 'bridge',
      icon: '🌉',
      label: bridgeDayLabel,
      tone: 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
    });
  }
  if (holiday.isSchoolVacation) {
    chips.push({
      key: 'school',
      // The break's own name when the feed gives one ("Sommerferien"), the generic word when it
      // only sets the flag — which is most parks outside Germany.
      icon: '🎒',
      label: holiday.schoolHolidayName
        ? translateHolidayName(holiday.schoolHolidayName, locale)
        : genericSchoolHolidayName(locale),
      tone: 'border-yellow-300 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300',
    });
  }
  return chips;
}

/** Neighbouring regions on a school break, deduplicated by the name they render under. */
export function neighbourRegions(
  holiday: TodayScheduleResult['holiday'],
  locale: string
): { label: string; flag: string }[] {
  const labels: { label: string; flag: string }[] = [];
  const seen = new Set<string>();
  for (const h of holiday?.influencing ?? []) {
    const { countryCode, regionCode } = h.source;
    const label = getRegionLabel(countryCode, regionCode, locale);
    if (seen.has(label)) continue;
    seen.add(label);
    labels.push({ label, flag: countryFlagEmoji(countryCode) });
  }
  return labels;
}
