'use client';

import { useLocale } from 'next-intl';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link, getPathname } from '@/i18n/navigation';
import { parkCalendarPath } from '@/lib/parks/calendar-segments';
import { parkStatsPath } from '@/lib/parks/stats-segments';
import {
  EntryTileBody,
  ParkTileGrid,
  SelectionBar,
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
 * that are pages rather than panels — the crowd calendar, and the wait-time record where the park
 * has one — which are therefore links.
 *
 * Single source for markup `TabsWithHash` renders twice — once pre-mount (SSR + first client
 * render) and once post-mount. The two renders are byte-identical; the only real difference lives
 * on the surrounding `<Tabs>` element (uncontrolled `defaultValue` vs. controlled `activeTab` +
 * `onValueChange`), which stays in `TabsWithHash`.
 *
 * The five stay real `TabsTrigger`s so Radix keeps the roving tabindex, the arrow keys and the
 * `aria-selected`/`aria-controls` pairing a hand-rolled button would have to re-implement. A row
 * of cells that look identical and behave in two ways is a fair objection to the link cells, and
 * the alternative was worse: neither page can be a tab panel, and a tab that navigates away would
 * leave Radix holding a selection for a page nobody is on.
 *
 * Everything the cells SAY — labels, counts, live hints — comes from `useParkTileItems`, which
 * `ParkNavTiles` reads too. That is what keeps this row and the one on the calendar page the
 * same row rather than two rows that happen to look alike.
 */
export function ParkTabsList(props: ParkTileSource) {
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
          <TabTile key={item.key} item={item} />
        ))}
      </TabsList>

      {links.map((item) => {
        const href = linkHrefs[item.key] as string;
        return (
          <Link
            key={item.key}
            href={href}
            className={cn(item.order, tileCell)}
            // The cells in this row that leave the page, and all three of these are one decision:
            // hand the row's current position to the copy of itself on the page being opened, and
            // stop both scroll-to-top mechanisms from throwing it away first. `getPathname`
            // because `ScrollToTop` compares against `window.location.pathname`, which carries the
            // locale prefix this href does not. See `useTileRowAnchor`.
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
}

function TabTile({ item }: { item: ParkTileItem }) {
  return (
    <TabsTrigger value={item.key} className={cn(item.order, tileCell, activeCell)}>
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
