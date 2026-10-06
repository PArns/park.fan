import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { LayoutGrid } from 'lucide-react';
import { AttractionCard } from './attraction-card';
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
      <div className="bg-background/70 mb-4 flex w-fit items-center gap-3 rounded-lg px-3 py-1.5 backdrop-blur-md">
        <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          <LayoutGrid className="text-primary h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">{landName}</h2>
          <p className="text-muted-foreground text-sm">
            {noneKnown
              ? t('attractionCount', { count: attractions.length })
              : t('operatingCount', { count: operatingCount, total: attractions.length })}
          </p>
        </div>
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
