'use client';

import { useTranslations } from 'next-intl';
import { CalendarDays } from 'lucide-react';
import { CommandGroup, CommandItem } from '@/components/ui/command';
import { HERO_GROUP_HEADING_HIDDEN_CLASS } from '@/components/search/hero-search-classes';
import { cn } from '@/lib/utils';
import { useTripRegionLinks } from '@/lib/hooks/use-trip-region-links';
import type { TripRegionLinks } from '@/lib/trip-regions/trip-links';

/**
 * „Reise planen: Orlando · Südkalifornien · Japan · Paris", one row of the hero's list before
 * anything is typed, each region a chip into its trip planner. One row the height of a park's, so
 * it takes the place of a fifth park rather than growing the list. The regions are the ones the
 * search matches a query against (`useTripRegionLinks`), asked for when the list first opens.
 */
export function SearchTripRow({
  onSelect,
  className,
}: {
  onSelect: (region: TripRegionLinks, index: number) => void;
  /** The hero's fixed row height; the palette's row takes its own padding. */
  className?: string;
}) {
  const t = useTranslations('navigation');
  const { data: regions } = useTripRegionLinks(true);
  if (!regions?.length) return null;
  return (
    <CommandGroup heading={t('planTrip')} className={HERO_GROUP_HEADING_HIDDEN_CLASS}>
      <div className={cn('flex items-center gap-2.5 px-2 sm:gap-4', className ?? 'py-2')}>
        <div className="bg-primary/15 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-11 sm:w-11 sm:rounded-xl">
          <CalendarDays className="text-primary h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span aria-hidden="true" className="text-sm leading-none font-semibold sm:text-[15px]">
            {t('planTrip')}
          </span>
          <div className="flex min-w-0 flex-wrap gap-1.5">
            {regions.map((region, index) => (
              <CommandItem
                key={region.slug}
                value={`trip region ${region.slug}`}
                onSelect={() => onSelect(region, index)}
                className="border-border/60 data-[selected=true]:border-primary hover:border-primary cursor-pointer rounded-full border px-2.5 py-0.5 text-xs font-medium"
              >
                {region.words?.name ?? region.name}
              </CommandItem>
            ))}
          </div>
        </div>
      </div>
    </CommandGroup>
  );
}
