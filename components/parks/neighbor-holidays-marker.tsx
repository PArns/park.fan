'use client';

import { Luggage } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { getRegionLabel, countryFlagEmoji } from '@/lib/utils/region-names';
import { cn } from '@/lib/utils';

/**
 * Every shape the API uses for "a holiday in a neighbouring region" — `NeighborHoliday` on a
 * calendar day, `InfluencingHoliday` on a schedule day. They disagree about everything except
 * the one field a label is derived from, so that is all this asks for.
 */
interface HolidaySource {
  source: { countryCode: string; regionCode?: string | null };
}

interface NeighborHolidaysMarkerProps {
  holidays: HolidaySource[] | undefined;
  /** Icon size utilities — the calendar cell runs `h-4 w-4`, the tighter history tile `h-3 w-3`. */
  className?: string;
}

/**
 * The amber suitcase: neighbouring regions are on school break, so day-trippers arrive and the
 * queues run longer than the weekday suggests.
 *
 * Amber on purpose — the local holiday markers own orange (public holiday), yellow (school
 * vacation) and blue (bridge day), and this one has to stay distinguishable from all three.
 *
 * Shared by the park calendar and the ride page's wait-time history so the same signal never
 * drifts apart between them: the calendar used to carry a bare `title` attribute with no regions
 * in it, which named the marker without answering the question it raises ("which regions?").
 * Both now hover into the same list.
 *
 * Labels come from `getRegionLabel`, so German states keep their proper name and anything
 * unmapped collapses to its localized country name rather than leaking a raw code like "BL".
 * Deduplicated by label, because one region on break across two named holidays arrives twice.
 */
export function NeighborHolidaysMarker({ holidays, className }: NeighborHolidaysMarkerProps) {
  const t = useTranslations('parks');
  const locale = useLocale();

  const regions: { label: string; flag: string }[] = [];
  const seen = new Set<string>();
  for (const h of holidays ?? []) {
    const label = getRegionLabel(h.source.countryCode, h.source.regionCode, locale);
    if (seen.has(label)) continue;
    seen.add(label);
    regions.push({ label, flag: countryFlagEmoji(h.source.countryCode) });
  }

  if (regions.length === 0) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Luggage
          className={cn('cursor-help text-amber-500 dark:text-amber-400', className ?? 'h-4 w-4')}
          aria-label={t('influencingHolidays')}
        />
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        <p className="font-semibold">{t('influencingHolidays')}</p>
        {/* The "so what" line, same wording the header panel and the day dialog use. */}
        <p className="mt-1 leading-snug opacity-90">{t('influencingHolidaysBody')}</p>
        <p className="mt-1.5 leading-snug font-medium">
          {regions.map((r) => `${r.flag} ${r.label}`.trim()).join(' · ')}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
