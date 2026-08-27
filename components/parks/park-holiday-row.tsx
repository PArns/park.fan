'use client';

import { useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { CalendarDays, Luggage } from 'lucide-react';
import { useTodaySchedule } from '@/lib/hooks/use-today-schedule';
import { countryCodeForSlug, countryFlagEmoji, getRegionLabel } from '@/lib/utils/region-names';
import { translateHolidayName, genericSchoolHolidayName } from '@/lib/utils/holiday-names';
import { cn } from '@/lib/utils';
import type { ParkWithAttractions } from '@/lib/api/types';

interface ParkHolidayRowProps {
  initialData: ParkWithAttractions;
  /**
   * Geo params enable the live park poll behind `useTodaySchedule`. Omit all four and the row
   * renders from `initialData` alone and fetches nothing — which is what the guide page's static
   * example wants (a full park payload for one chip row is not a trade worth making).
   */
  continent?: string;
  country?: string;
  city?: string;
  parkSlug?: string;
  className?: string;
}

/**
 * Today's holidays, in one band, with the park's own region first.
 *
 * This replaces two rows that told one story in two voices. The first was a muted grey caption
 * ("Ferien & Feiertage") followed by up to three chips for the park's OWN country and state. The
 * second was `HeaderHolidayPanel`: an amber caption, two sentences of amber body text and a row
 * of amber chips, for school breaks in the NEIGHBOURING regions. Measured against each other on a
 * day that had both, the neighbours occupied about four times the height of the local half and
 * were the only thing in colour — so the loudest thing in the panel was a break in the
 * Netherlands, and the fact that it was a public holiday in this park's own state was three small
 * chips above it.
 *
 * The ranking now matches what the two things are. The park's own region is the subject: it is
 * named ("Nordrhein-Westfalen"), it carries its flag, and its chips keep the per-type colours the
 * calendar's day detail already uses — a public holiday is orange, a bridge day blue, a school
 * break yellow. The neighbours are the second line, in neutral chips, under one sentence saying
 * what they mean for the queue. That sentence keeps a single amber accent because it is still a
 * crowd warning; what it loses is the second sentence and the four coloured chips.
 *
 * **A school break is not a public holiday.** `isHoliday` is true for both, so the old row read
 * `publicHolidayName` straight out of it and printed the school break "Summer Holidays" behind
 * the party-popper reserved for public holidays — on Phantasialand, all summer, in English.
 * `holidayType` (school | public | bank | observance) is what tells them apart; it has always been
 * on the wire and was simply missing from `ScheduleItem`. `isSchoolHoliday`/`isPublicHoliday` back
 * it up for feeds that send the booleans and no type.
 *
 * Holiday names go through `translateHolidayName` — the API answers in English only.
 */
export function ParkHolidayRow({
  initialData,
  continent = '',
  country = '',
  city = '',
  parkSlug = '',
  className,
}: ParkHolidayRowProps) {
  const t = useTranslations('parks');
  const locale = useLocale();
  const timezone = initialData.timezone ?? 'UTC';

  const sched = useTodaySchedule({
    timezone,
    schedule: initialData.schedule,
    nextSchedule: initialData.nextSchedule,
    status: initialData.status,
    hasOperatingSchedule: initialData.hasOperatingSchedule,
    continent,
    country,
    city,
    parkSlug,
  });

  const holiday = sched.holiday;

  /** What the park's own state/country has today, in the order a visitor asks about it. */
  const localChips = useMemo(() => {
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
        label: t('bridgeDay'),
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
  }, [holiday, locale, t]);

  /** Neighbouring regions on a school break, deduplicated by the name they render under. */
  const neighbours = useMemo(() => {
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
  }, [holiday, locale]);

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

      {/* Two ranks, one grid. The label column is `auto` so both rows' chips start on the same
          x — the region name and "Nachbarregionen" are different lengths and a per-row flex would
          leave the two chip rows ragged against each other. It collapses to stacked rows below
          `sm`, where a 160px label column would leave the chips about 90px to wrap in. */}
      <div className="mt-2 grid gap-x-3 gap-y-2.5 sm:grid-cols-[auto_1fr] sm:items-baseline">
        {localChips.length > 0 && (
          <>
            <span className="flex items-center gap-1.5 text-xs font-semibold">
              {homeFlag && <span aria-hidden="true">{homeFlag}</span>}
              {homeLabel}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {localChips.map((chip) => (
                <span
                  key={chip.key}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
                    chip.tone
                  )}
                >
                  <span aria-hidden="true">{chip.icon}</span>
                  {chip.label}
                </span>
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
                <span
                  key={r.label}
                  className="border-border/60 text-muted-foreground inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium"
                >
                  {r.flag && <span aria-hidden="true">{r.flag}</span>}
                  {r.label}
                </span>
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
