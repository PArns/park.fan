'use client';

import { useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Luggage } from 'lucide-react';
import { useTodaySchedule } from '@/lib/hooks/use-today-schedule';
import { DE_STATES } from '@/lib/utils/region-names';
import { cn } from '@/lib/utils';
import type { ParkWithAttractions } from '@/lib/api/types';

interface HeaderHolidayPanelProps {
  initialData: ParkWithAttractions;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  className?: string;
}

/**
 * Right-column context panel that spells out the NEIGHBOURING-region school holidays driving today's
 * crowds — the concrete "why is it so busy" behind the crowd forecast, shown as a warm amber card
 * with the regions as chips (e.g. Rheinland-Pfalz · Hessen · Frankreich · Schweiz). Returns null when
 * no influencing holidays apply. Reads the SAME client-derived schedule as <ParkHeaderStats> via
 * useTodaySchedule (shared live query → no extra fetch); German states are named locally, every other
 * region collapses to its localised country name via Intl.DisplayNames.
 */
export function HeaderHolidayPanel({
  initialData,
  continent,
  country,
  city,
  parkSlug,
  className,
}: HeaderHolidayPanelProps) {
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

  const regions = useMemo(() => {
    // Localised country names for ANY ISO code (CH → Schweiz / Switzerland / Suisse …), so
    // neighbouring cantons/départements never leak through as raw codes like "BL"/"BS".
    let countryNames: Intl.DisplayNames | null = null;
    try {
      countryNames = new Intl.DisplayNames([locale], { type: 'region' });
    } catch {
      countryNames = null;
    }
    const labels: string[] = [];
    const seen = new Set<string>();
    for (const h of sched.holiday?.influencing ?? []) {
      const { countryCode, regionCode } = h.source;
      // German states keep their proper name; every other region collapses to its COUNTRY name
      // (so e.g. the Basel cantons BL/BS show as one "Schweiz", not two raw codes).
      let label: string;
      if (countryCode === 'DE' && regionCode && DE_STATES[regionCode]) {
        label = DE_STATES[regionCode];
      } else {
        label = countryNames?.of(countryCode) ?? regionCode ?? countryCode;
      }
      if (!seen.has(label)) {
        seen.add(label);
        labels.push(label);
      }
    }
    return labels;
  }, [sched.holiday, locale]);

  if (regions.length === 0) return null;

  // Cap the list so a peak-summer day (many states on break at once) can't grow the panel
  // unbounded; the overflow count still signals "lots of neighbouring regions".
  const MAX = 6;
  const shown = regions.slice(0, MAX);
  const overflow = regions.length - shown.length;

  return (
    <div
      className={cn(
        'rounded-xl border border-amber-200/70 bg-amber-50/60 px-4 py-3 shadow-sm backdrop-blur-sm dark:border-amber-800/40 dark:bg-amber-950/30',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
          <Luggage className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="text-foreground text-xs leading-tight font-semibold">
          {t('influencingHolidays')}
        </span>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {shown.map((r) => (
          <span
            key={r}
            className="rounded-md bg-amber-100/70 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
          >
            {r}
          </span>
        ))}
        {overflow > 0 && (
          <span className="self-center text-[11px] font-medium text-amber-700/70 dark:text-amber-300/70">
            +{overflow}
          </span>
        )}
      </div>
    </div>
  );
}
