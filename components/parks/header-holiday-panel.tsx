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
 * Neighbouring-holidays context — the "why is it so busy" behind the crowd forecast. NOT a floating
 * card: just a caption + explanation + region chips using the header board's own typography (the same
 * uppercase caption the stat cells use), so it reads as an integral part of the header. The DIVIDER
 * that ties it to the board is supplied by the caller via `className` — a full-height left rule
 * (`border-l`) when it sits as the header's right-hand column on lg+, or a top rule (`border-t`) when
 * it stacks as a band row on mobile. Returns null when no influencing holidays apply. A one-line
 * explanation of the crowd consequence (day-trippers from those regions → busier than usual) sits
 * above the regions (e.g. Rheinland-Pfalz · Hessen · Frankreich · Schweiz). Reads the SAME
 * client-derived schedule as <ParkHeaderStats> via useTodaySchedule (shared live query → no extra
 * fetch); German states are named locally, every other region collapses to its localised country name
 * via Intl.DisplayNames.
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
    // Not a card: the same uppercase caption the stat cells use, tied to the board by the divider the
    // caller passes in `className` (a full-height left rule on the right column, a top rule on mobile).
    <div className={cn(className)}>
      {/* Amber icon + caption + body: this is a crowd WARNING (neighbouring breaks → busier), so it
          reads in the app's amber warning colour, standing out from the muted grey stat captions. */}
      <span className="flex items-center gap-1 text-[10px] font-semibold tracking-[0.08em] text-amber-600 uppercase dark:text-amber-400">
        <Luggage className="h-3 w-3" aria-hidden="true" />
        {t('influencingHolidays')}
      </span>
      {/* The "why it matters" line: neighbouring school breaks send day-trippers here → busier than
          usual. Spells out the crowd consequence so the regions below read as a reason, not a label. */}
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-amber-700 dark:text-amber-200/90">
        {t('influencingHolidaysBody')}
      </p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {shown.map((r) => (
          <span
            key={r}
            className="rounded-md border border-amber-300/60 bg-amber-50/50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-300"
          >
            {r}
          </span>
        ))}
        {overflow > 0 && (
          <span className="text-muted-foreground self-center text-xs font-medium">+{overflow}</span>
        )}
      </div>
    </div>
  );
}
