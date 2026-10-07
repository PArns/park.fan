import { memo, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Crown, LayoutGrid } from 'lucide-react';
import { AttractionCard } from './attraction-card';
import { HAIRLINE_FILL, TILE_GLASS } from '@/components/common/glass-card';
import { cn } from '@/lib/utils';
import { getAttractionDisplayStatus } from '@/lib/utils/park-utils';
import type { ParkAttraction, ParkStatus } from '@/lib/api/types';

// Per-card memo boundary: once the live poll touches one ride the land's `attractions` array is
// rebuilt, but React Query's structural sharing keeps unchanged attraction objects identical, so
// only the changed cards re-render. Applied here rather than on `AttractionCard`, which Server
// Components render too, where `memo` isn't available.
const MemoAttractionCard = memo(AttractionCard);

interface LandSectionProps {
  landName: string;
  attractions: ParkAttraction[];
  parkPath: string;
  /** Unused, kept for callers' data shape: the photo arrives on the attraction itself. */
  parkSlug?: string;
  parkStatus?: ParkStatus;
  timezone?: string;
  /** Today in the PARK's timezone, `YYYY-MM-DD`, from the server render — see `LiveParkData`. */
  todayIso?: string;
  /**
   * The park's own name: these attractions carry no nested `park`, so `AttractionCard`'s
   * ride-alert bell needs it as a prop.
   */
  parkName: string;
  /** The headliners' section: the crown the cards carry, in their amber, for the grid icon. */
  headliner?: boolean;
  /**
   * A control at the end of the heading, behind a hairline. It has to fit the heading's line,
   * 32 px high on both sides of `sm`, so the heading keeps its height whether it is there or not.
   * Memoise it at the call site, or every render of the parent re-renders the whole land.
   */
  action?: ReactNode;
}

/**
 * One land of the park page's ride list: its heading with the open count, then a card per ride.
 *
 * Memoised: the parent `TabsWithHash` re-renders on every search keystroke and focus change, and
 * all props here are shallow-stable across those (`attractions` is `useDeferredValue`-stable), so
 * the whole land bails out. It still re-renders when the live poll changes the data.
 */
export const LandSection = memo(function LandSection({
  landName,
  attractions,
  parkPath,
  parkSlug: _parkSlug,
  parkStatus,
  timezone,
  todayIso,
  parkName,
  headliner = false,
  action,
}: LandSectionProps) {
  const t = useTranslations('parks');
  const operatingCount = attractions.filter(
    (a) => getAttractionDisplayStatus(a, parkStatus) === 'OPERATING'
  ).length;
  // "0/82 operating" is true but unreadable when no ride's status is knowable — it says the
  // land is shut. Every ride reads UNKNOWN in that case, so count them instead of rating them.
  const noneKnown =
    attractions.length > 0 &&
    attractions.every((a) => getAttractionDisplayStatus(a, parkStatus) === 'UNKNOWN');

  return (
    <section>
      {/* The glass, border and corners of the filter panel above it. Below `sm` it spans the
          column like that panel and the rows under it, on one 50 px line with the count at the
          end; the lands' `LazyMount` in `tabs-with-hash.tsx` reserves that as
          `phoneHeaderHeight`. */}
      <div
        className={cn(
          'border-border/50 mb-4 flex w-fit items-center gap-3 rounded-xl border px-3 py-1.5 shadow-sm max-sm:mb-2 max-sm:w-full max-sm:gap-2.5 max-sm:p-2',
          TILE_GLASS
        )}
      >
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg max-sm:h-8 max-sm:w-8',
            headliner ? 'bg-amber-400/15' : 'bg-primary/10'
          )}
        >
          {headliner ? (
            <Crown className="h-5 w-5 text-amber-500 max-sm:h-4 max-sm:w-4 dark:text-amber-400" />
          ) : (
            <LayoutGrid className="text-primary h-5 w-5 max-sm:h-4 max-sm:w-4" />
          )}
        </div>
        <div className="max-sm:flex max-sm:min-w-0 max-sm:flex-1 max-sm:items-baseline max-sm:justify-between max-sm:gap-2">
          <h2 className="text-xl font-semibold max-sm:truncate max-sm:text-base">{landName}</h2>
          <p className="text-muted-foreground text-sm max-sm:shrink-0 max-sm:text-xs">
            {noneKnown
              ? t('attractionCount', { count: attractions.length })
              : t('operatingCount', { count: operatingCount, total: attractions.length })}
          </p>
        </div>
        {action && (
          <>
            <div aria-hidden="true" className={cn(HAIRLINE_FILL, 'h-8 w-px shrink-0 max-sm:h-6')} />
            {action}
          </>
        )}
      </div>

      {/* Below `sm` every card is a compact row (`phoneRow`), so the list tightens and each <li>
          drops the subgrid. `grid-cols-1` is `minmax(0, 1fr)`: an `auto` column grows to the
          badge strip's max-content and pushes the wait time off a phone screen.
          `max-sm:auto-rows-auto` because in an auto-height grid every `1fr` track takes the
          tallest row's size. */}
      <ul className="grid [grid-auto-rows:auto_1fr_auto] grid-cols-1 gap-2 max-sm:auto-rows-auto sm:grid-cols-2 sm:gap-4 @min-[1024px]/page:grid-cols-3">
        {attractions.map((attraction) => {
          // The photo and its focal point ride along on the attraction
          // (`enrichAttractionsWithImages`): a lookup here would put the media manifest into a
          // Client Component's bundle.
          return (
            <li
              key={attraction.id}
              className="row-span-3 grid [grid-template-rows:subgrid] max-sm:block"
            >
              <MemoAttractionCard
                attraction={attraction}
                parkPath={parkPath}
                parkStatus={parkStatus}
                timezone={timezone}
                todayIso={todayIso}
                parkName={parkName}
                phoneRow
                rideLog
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
});
