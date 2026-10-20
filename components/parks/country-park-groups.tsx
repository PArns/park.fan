'use client';

import { useDeferredValue, useState, type ReactNode } from 'react';
import { DoorOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { FilterToggle } from '@/components/parks/filter-toggle';
import { LiveParkGrid, type StaticPark } from '@/components/parks/live-park-grid';
import { useRegionParks } from '@/lib/hooks/use-live-parks-by-region';

/** Fewest parks a country needs before the "open only" switch is worth its row. */
export const OPEN_ONLY_MIN_PARKS = 6;

interface CountryParkGroup {
  key: string;
  /** Server-rendered city heading. */
  heading: ReactNode;
  parks: StaticPark[];
}

interface CountryParkGroupsProps {
  continent: string;
  country: string;
  groups: CountryParkGroup[];
  gridClassName?: string;
  className?: string;
}

/**
 * A country page's city groups, with an "open only" switch above them once the country has
 * {@link OPEN_ONLY_MIN_PARKS} parks or more.
 *
 * The switch reads the status already layered on by {@link LiveParkGrid}'s request, so the ISR
 * shell fetches nothing extra. Until that status has arrived every card stays visible. The grids
 * read a deferred copy of the switch, so the pill lights up before the cards are rebuilt.
 */
export function CountryParkGroups({
  continent,
  country,
  groups,
  gridClassName,
  className,
}: CountryParkGroupsProps) {
  const t = useTranslations('geo');
  const { liveByParkId } = useRegionParks(continent, country);
  const [openOnly, setOpenOnly] = useState(false);
  const deferredOpenOnly = useDeferredValue(openOnly);

  const totalParks = groups.reduce((sum, group) => sum + group.parks.length, 0);
  const filtering = deferredOpenOnly && liveByParkId !== undefined;
  const visibleGroups = filtering
    ? groups
        .map((group) => ({
          ...group,
          parks: group.parks.filter((park) => liveByParkId[park.id]?.status === 'OPERATING'),
        }))
        .filter((group) => group.parks.length > 0)
    : groups;

  return (
    <div className={className}>
      {totalParks >= OPEN_ONLY_MIN_PARKS && (
        <FilterToggle
          size="md"
          icon={DoorOpen}
          label={t('openOnly')}
          pressed={openOnly}
          onToggle={() => setOpenOnly((current) => !current)}
        />
      )}
      {visibleGroups.length === 0 && (
        <div className="border-border/60 flex flex-col items-start gap-3 rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">{t('noOpenParks')}</p>
          <Button variant="outline" size="sm" onClick={() => setOpenOnly(false)}>
            {t('clearOpenOnly')}
          </Button>
        </div>
      )}
      {visibleGroups.map((group) => (
        <div key={group.key}>
          {group.heading}
          <LiveParkGrid
            continent={continent}
            country={country}
            parks={group.parks}
            className={gridClassName}
          />
        </div>
      ))}
    </div>
  );
}
