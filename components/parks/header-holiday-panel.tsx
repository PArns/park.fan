'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useTodaySchedule } from '@/lib/hooks/use-today-schedule';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import { DE_STATES, COUNTRY_CODE_TO_SLUG } from '@/lib/utils/region-names';
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
 * crowds — the concrete "why is it so busy" behind the crowd forecast (e.g. "Rheinland-Pfalz ·
 * Niedersachsen · Hessen · Niederlande"). Returns null when no influencing holidays apply, so the
 * weather panel alone fills the slot off-season. Reads the SAME client-derived schedule as
 * <ParkHeaderStats> via useTodaySchedule (shared live query → no extra fetch); German states are
 * named locally, foreign countries via the existing geo translations.
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
  const tGeo = useTranslations('geo');
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
    const labels: string[] = [];
    const seen = new Set<string>();
    for (const h of sched.holiday?.influencing ?? []) {
      const { countryCode, regionCode } = h.source;
      let label: string;
      if (countryCode === 'DE' && regionCode && DE_STATES[regionCode]) {
        label = DE_STATES[regionCode];
      } else {
        const slug = COUNTRY_CODE_TO_SLUG[countryCode];
        label = slug
          ? translateGeoSlug(tGeo, 'countries', slug, regionCode || countryCode)
          : regionCode || countryCode;
      }
      if (!seen.has(label)) {
        seen.add(label);
        labels.push(label);
      }
    }
    return labels;
  }, [sched.holiday, tGeo]);

  if (regions.length === 0) return null;

  // Cap the list so a peak-summer day (many states on break at once) can't grow the panel
  // unbounded; the overflow count still signals "lots of neighbouring regions".
  const MAX = 6;
  const shown = regions.slice(0, MAX);
  const overflow = regions.length - shown.length;
  const regionText = shown.join(' · ') + (overflow > 0 ? ` +${overflow}` : '');

  return (
    <div
      className={cn(
        'border-border/50 bg-background/40 rounded-xl border px-4 py-3 backdrop-blur-sm',
        className
      )}
    >
      <div className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
        <span aria-hidden="true">🧳</span>
        {t('influencingHolidays')}
      </div>
      <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">{regionText}</p>
    </div>
  );
}
