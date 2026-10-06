'use client';

import { memo } from 'react';
import { useLocale } from 'next-intl';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  type ParkTileItem,
  type ParkTileKey,
  type ParkTileSource,
} from '@/components/parks/park-entry-tiles';
import { rememberTileRow } from '@/lib/hooks/use-tile-row-anchor';
import { suppressScrollToTopFor } from '@/lib/navigation/history-navigation';
import { cn } from '@/lib/utils';

/**
 * The park page's entry-tile row: five chapter cells that switch a tab in place, plus the cells
 * that are pages rather than panels (the crowd calendar, the wait-time record), which are links.
 * The five stay real `TabsTrigger`s so Radix keeps the roving tabindex, the arrow keys and
 * `aria-selected`/`aria-controls`; a tab that navigated away would leave Radix holding a selection
 * for a page nobody is on. What the cells say comes from `useParkTileItems`, shared with
 * `ParkNavTiles`, so the two rows stay one row.
 *
 * Memoised: `TabsWithHash` builds it inline, and every search keystroke or tab tap would re-render
 * it in the commit the interaction waits on.
 */
export const ParkTabsList = memo(function ParkTabsList(props: ParkTileSource) {
  const locale = useLocale();
  const { continent, country, city, parkSlug } = props;
  const { items, tileCount } = useParkTileItems(props);

  // The cells that navigate, in row order, each with the path it leads to. Derived from `items`
  // rather than written out, so a cell the hook did not produce — the record page for a park too
  // thin to have one — is simply absent here too.
  const linkHrefs: Partial<Record<ParkTileKey, string>> = {
    calendar: parkCalendarPath(locale, continent, country, city, parkSlug),
    stats: parkStatsPath(locale, continent, country, city, parkSlug),
  };
  const links = items.filter((i) => linkHrefs[i.key]);
  const tabs = items.filter((i) => !linkHrefs[i.key]);

  return (
    <ParkTileGrid tileCount={tileCount} parkSlug={parkSlug}>
      {/* The tablist lays nothing out — `display: contents` makes its triggers grid items of the
          wrapper directly, so the calendar link can be their sibling in the same row without
          sitting inside `role="tablist"`. */}
      <TabsList className="contents h-auto rounded-none bg-transparent p-0">
        {tabs.map((item) => (
          <TabTile
            key={item.key}
            item={item}
            span={phoneLastCellSpan(items.indexOf(item), tileCount)}
          />
        ))}
      </TabsList>

      {links.map((item) => {
        const href = linkHrefs[item.key] as string;
        return (
          <Link
            key={item.key}
            href={href}
            className={cn(item.order, tileCell, phoneLastCellSpan(items.indexOf(item), tileCount))}
            // The cells that leave the page hand the row's position to its copy on the next page
            // and stop both scroll-to-top mechanisms from throwing it away (`useTileRowAnchor`).
            // `getPathname` because `ScrollToTop` compares against `window.location.pathname`,
            // which carries the locale prefix.
            scroll={false}
            onClick={(e) => {
              rememberTileRow(e.currentTarget, parkSlug);
              suppressScrollToTopFor(getPathname({ href, locale }));
            }}
          >
            <EntryTileBody
              icon={item.icon}
              label={item.label}
              count={item.count}
              hint={item.hint}
            />
          </Link>
        );
      })}
    </ParkTileGrid>
  );
});

function TabTile({ item, span }: { item: ParkTileItem; span?: string }) {
  return (
    <TabsTrigger value={item.key} className={cn(item.order, tileCell, activeCell, span)}>
      <SelectionBar />
      <EntryTileBody
        icon={item.icon}
        label={item.label}
        count={item.count}
        hint={item.hint}
        chipClassName={activeChip}
      />
    </TabsTrigger>
  );
}
