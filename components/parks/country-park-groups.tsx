'use client';

import { useDeferredValue, useState, type ReactNode } from 'react';
import { ArrowDownUp, DoorOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { FilterToggle } from '@/components/parks/filter-toggle';
import { LiveParkGrid, type StaticPark } from '@/components/parks/live-park-grid';
import { useViewerPosition } from '@/lib/hooks/use-distance-to';
import { useLiveParksByRegion } from '@/lib/hooks/use-live-parks-by-region';
import { orderCountryParks, type CountryParkSort } from '@/lib/utils/country-park-order';

/** Fewest parks a country needs before the "open only" switch is worth its row. */
export const OPEN_ONLY_MIN_PARKS = 6;

interface CountryParkGroup {
  key: string;
  /** Server-rendered group heading: a city on a country page, a country on a brand page. */
  heading: ReactNode;
  parks: StaticPark[];
}

interface CountryParkGroupsProps {
  /** The `"<continent>/<country>"` pairs the parks lie in, for the one live request. */
  regions: string[];
  groups: CountryParkGroup[];
  gridClassName?: string;
  className?: string;
}

/**
 * A country page's city groups (or a brand page's country groups), with an "open only" switch
 * above them once they hold {@link OPEN_ONLY_MIN_PARKS} parks or more.
 *
 * The switch reads the status already layered on by {@link LiveParkGrid}'s request, so the ISR
 * shell fetches nothing extra. Until that status has arrived every card stays visible. The grids
 * read a deferred copy of the switch, so the pill lights up before the cards are rebuilt.
 *
 * Beside it a pill cycles the order: city groups, quietest first, nearest first. The ranked orders
 * are one flat list whose ids are fixed at the press, so a live poll never moves a card. Nearest
 * is offered only for a granted (precise) {@link useViewerPosition}; this page never asks.
 */
export function CountryParkGroups({
  regions,
  groups,
  gridClassName,
  className,
}: CountryParkGroupsProps) {
  const t = useTranslations('geo');
  const { liveByParkId } = useLiveParksByRegion(regions);
  const [openOnly, setOpenOnly] = useState(false);
  const deferredOpenOnly = useDeferredValue(openOnly);
  const position = useViewerPosition();
  // Only a granted position counts: the GeoIP fallback is a city, too coarse to rank parks by.
  const viewer = position?.precise ? position : null;
  const [sort, setSort] = useState<{ mode: CountryParkSort; order: string[] | null }>({
    mode: 'standard',
    order: null,
  });
  // A revoked position takes "nearest" with it rather than leaving a stale ranking on screen.
  const activeSort =
    sort.mode === 'nearest' && !viewer ? { mode: 'standard' as const, order: null } : sort;
  const deferredSort = useDeferredValue(activeSort);

  const totalParks = groups.reduce((sum, group) => sum + group.parks.length, 0);
  const filtering = deferredOpenOnly && liveByParkId !== undefined;
  const allParks = groups.flatMap((group) => group.parks);
  const canSort = totalParks >= OPEN_ONLY_MIN_PARKS && liveByParkId !== undefined;
  const sortModes: CountryParkSort[] = viewer
    ? ['standard', 'quietest', 'nearest']
    : ['standard', 'quietest'];
  const sortLabels = {
    standard: t('sortStandard'),
    quietest: t('sortQuietest'),
    nearest: t('sortNearest'),
  };

  const cycleSort = () => {
    const next =
      sortModes[(sortModes.indexOf(activeSort.mode) + 1) % sortModes.length] ?? 'standard';
    setSort({
      mode: next,
      order: next === 'standard' ? null : orderCountryParks(allParks, next, liveByParkId, viewer),
    });
  };

  const ranked = deferredSort.order !== null;
  const parksById = new Map(allParks.map((park) => [park.id, park]));
  const orderedParks = ranked
    ? deferredSort.order!.flatMap((id) => {
        const park = parksById.get(id);
        return park ? [park] : [];
      })
    : [];
  const visibleOrdered = filtering
    ? orderedParks.filter((park) => liveByParkId[park.id]?.status === 'OPERATING')
    : orderedParks;
  const visibleGroups = ranked
    ? visibleOrdered.length > 0
      ? [{ key: 'ranked', heading: null, parks: visibleOrdered }]
      : []
    : filtering
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
        <div className="flex flex-wrap gap-2">
          <FilterToggle
            size="md"
            icon={DoorOpen}
            label={t('openOnly')}
            pressed={openOnly}
            onToggle={() => setOpenOnly((current) => !current)}
          />
          {canSort && (
            <FilterToggle
              size="md"
              icon={ArrowDownUp}
              label={sortLabels[activeSort.mode]}
              labels={sortModes.map((mode) => sortLabels[mode])}
              pressed={activeSort.mode !== 'standard'}
              onToggle={cycleSort}
            />
          )}
        </div>
      )}
      {filtering && visibleGroups.length === 0 && (
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
          <LiveParkGrid regions={regions} parks={group.parks} className={gridClassName} />
        </div>
      ))}
    </div>
  );
}
