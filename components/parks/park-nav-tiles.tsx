'use client';

import { useLocale } from 'next-intl';
import { useLiveParkData } from '@/lib/hooks/use-live-park-data';
import { Link, getPathname } from '@/i18n/navigation';
import { parkCalendarPath } from '@/lib/parks/calendar-segments';
import { parkStatsPath } from '@/lib/parks/stats-segments';
import {
  EntryTileBody,
  ParkTileGrid,
  SelectionBar,
  phoneLastCellSpan,
  activeCell,
  activeChip,
  tileCell,
  useParkTileItems,
  type ParkTileKey,
  type ParkTileSource,
} from '@/components/parks/park-entry-tiles';
import { rememberTileRow } from '@/lib/hooks/use-tile-row-anchor';
import { suppressScrollToTopFor } from '@/lib/navigation/history-navigation';
import { cn } from '@/lib/utils';

/**
 * The same entry-tile row on a park sub-page, where every cell is a link: chapter cells link to the
 * park page with the chapter's hash, which its tab router reads, and the calendar and the wait-time
 * record link to their own pages. No `TabsTrigger`, since there is no `Tabs` here to switch. Same
 * `useParkTileItems` as `ParkTabsList`, so both rows show the same cells, hints and order.
 */
export function ParkNavTiles({
  current,
  ...source
}: ParkTileSource & {
  /** The cell for the page being rendered. It becomes `aria-current="page"` and is not a link.
   *  `null` on a page that has no cell in the row (the park's "with kids" page). */
  current: ParkTileKey | null;
}) {
  const locale = useLocale();
  const { continent, country, city, parkSlug } = source;
  /**
   * The same live park the park page's tab row reads, through the same query key, so a server
   * payload that arrived without `analytics` is refilled here too. Costs no request:
   * `ParkTodayPanel` in the same card already runs this query (`['park-live', …]`).
   */
  const { data: livePark } = useLiveParkData({
    continent,
    country,
    city,
    parkSlug,
    initialData: source.park,
  });
  const { items, tileCount } = useParkTileItems({ ...source, park: livePark ?? source.park });
  const parkPath = `/parks/${continent}/${country}/${city}/${parkSlug}`;

  return (
    <ParkTileGrid tileCount={tileCount} parkSlug={parkSlug}>
      {items.map((item, index) => {
        const span = phoneLastCellSpan(index, tileCount);
        const isCurrent = item.key === current;
        // Two cells are pages of their own; the rest are chapters of the park page, whose tab
        // router activates one from the hash on arrival.
        const href =
          item.key === 'calendar'
            ? parkCalendarPath(locale, continent, country, city, parkSlug)
            : item.key === 'stats'
              ? parkStatsPath(locale, continent, country, city, parkSlug)
              : `${parkPath}#${item.key}`;

        const body = (
          <EntryTileBody
            icon={item.icon}
            label={item.label}
            count={item.count}
            hint={item.hint}
            chipClassName={activeChip}
          />
        );

        // The current cell is a `<span>`: a link to the page it is on gives a pointer a target that
        // does nothing and a screen reader a link it has already followed.
        return isCurrent ? (
          <span
            key={item.key}
            aria-current="page"
            className={cn('group', item.order, tileCell, activeCell, span)}
          >
            <SelectionBar />
            {body}
          </span>
        ) : (
          <Link
            key={item.key}
            href={href}
            className={cn('group', item.order, tileCell, span)}
            // Every cell leaves the page, and the row is on the page it leads to as well, so none
            // may go to the top; the recorded offset puts the row back on the pixel
            // (`useTileRowAnchor`). `getPathname` because `ScrollToTop` compares against
            // `window.location.pathname`, which carries the locale prefix.
            scroll={false}
            onClick={(e) => {
              rememberTileRow(e.currentTarget, parkSlug);
              // Without the hash: `window.location.pathname` never carries one.
              suppressScrollToTopFor(getPathname({ href, locale }).split('#')[0]);
            }}
          >
            {body}
          </Link>
        );
      })}
    </ParkTileGrid>
  );
}
