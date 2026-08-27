'use client';

import { useLocale } from 'next-intl';
import { Link, getPathname } from '@/i18n/navigation';
import { parkCalendarPath } from '@/lib/parks/calendar-segments';
import {
  EntryTileBody,
  ParkTileGrid,
  SelectionBar,
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
 * The same entry-tile row, on a park SUB-page — where every cell is a link.
 *
 * The crowd calendar left the park page's tabs and became its own URL, and it arrived there
 * without the row: a visitor who followed the calendar cell landed on a page with a heading, a
 * grid and one "back" link, and every other chapter of the park — the ride list, the map, the
 * shows — was two clicks away again. The row is the park's navigation, so it belongs on every
 * page of the park, not only on the one that happens to own the tab panels.
 *
 * The five chapter cells link to the park page with the chapter's hash, which its tab router
 * already reads on arrival and on `hashchange`; the cell for the page you are on carries
 * `aria-current="page"` and the same treatment a selected tab gets. Nothing here is a
 * `TabsTrigger`, because there is no `Tabs` on this page to switch — a trigger without a panel
 * would be a button that does nothing.
 *
 * Same `useParkTileItems` as `ParkTabsList`, so both rows show the same six cells with the same
 * live hints and the same order. Walking park → calendar → park has to feel like one site.
 */
export function ParkNavTiles({
  current,
  ...source
}: ParkTileSource & {
  /** The cell for the page being rendered. It becomes `aria-current="page"` and is not a link. */
  current: ParkTileKey;
}) {
  const locale = useLocale();
  const { continent, country, city, parkSlug } = source;
  const { items, tileCount } = useParkTileItems(source);
  const parkPath = `/parks/${continent}/${country}/${city}/${parkSlug}`;

  return (
    <ParkTileGrid tileCount={tileCount} parkSlug={parkSlug}>
      {items.map((item) => {
        const isCurrent = item.key === current;
        const href =
          item.key === 'calendar'
            ? parkCalendarPath(locale, continent, country, city, parkSlug)
            : // The park page's tab router activates a chapter from the hash on arrival, so the
              // link lands on the right tab without any extra plumbing.
              `${parkPath}#${item.key}`;

        const body = (
          <EntryTileBody
            icon={item.icon}
            label={item.label}
            count={item.count}
            hint={item.hint}
            chipClassName={activeChip}
          />
        );

        // The current cell is a `<span>`, not a link to itself. `aria-current` on an anchor that
        // points at the page it is on is the one case where the link is noise for everybody: a
        // pointer gets a target that does nothing and a screen reader gets a link it has already
        // followed.
        return isCurrent ? (
          <span
            key={item.key}
            aria-current="page"
            className={cn('group', item.order, tileCell, activeCell)}
          >
            <SelectionBar />
            {body}
          </span>
        ) : (
          <Link
            key={item.key}
            href={href}
            className={cn('group', item.order, tileCell)}
            // Every cell here leaves the page, and the row is on the page it leads to as well —
            // so none of them may go to the top. The recorded offset then puts the row back on
            // the pixel. `getPathname` because `ScrollToTop` compares against
            // `window.location.pathname`, which carries the locale prefix. See
            // `useTileRowAnchor`.
            scroll={false}
            onClick={(e) => {
              rememberTileRow(e.currentTarget, parkSlug);
              // Without the hash: the flag is matched against `window.location.pathname`, which
              // never carries one. (A hash link is already exempt from `ScrollToTop` — this is
              // for the calendar cell, which has none.)
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
