'use client';

import { useLocale } from 'next-intl';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  type ParkTileItem,
  type ParkTileSource,
} from '@/components/parks/park-entry-tiles';
import { rememberTileRow } from '@/lib/hooks/use-tile-row-anchor';
import { suppressScrollToTopFor } from '@/lib/navigation/history-navigation';
import { cn } from '@/lib/utils';

/**
 * The park page's entry-tile row: five chapter cells that switch a tab in place, plus the crowd
 * calendar, which is a page and therefore a link.
 *
 * Single source for markup `TabsWithHash` renders twice — once pre-mount (SSR + first client
 * render) and once post-mount. The two renders are byte-identical; the only real difference lives
 * on the surrounding `<Tabs>` element (uncontrolled `defaultValue` vs. controlled `activeTab` +
 * `onValueChange`), which stays in `TabsWithHash`.
 *
 * The five stay real `TabsTrigger`s so Radix keeps the roving tabindex, the arrow keys and the
 * `aria-selected`/`aria-controls` pairing a hand-rolled button would have to re-implement. A row
 * of cells that look identical and behave in two ways is a fair objection to the sixth being a
 * link, and the alternative was worse: the calendar's own page cannot be a tab panel, and a tab
 * that navigates away would leave Radix holding a selection for a page nobody is on.
 *
 * Everything the cells SAY — labels, counts, live hints — comes from `useParkTileItems`, which
 * `ParkNavTiles` reads too. That is what keeps this row and the one on the calendar page the
 * same row rather than two rows that happen to look alike.
 */
export function ParkTabsList(props: ParkTileSource) {
  const locale = useLocale();
  const { continent, country, city, parkSlug } = props;
  const { items, tileCount } = useParkTileItems(props);

  const calendarHref = parkCalendarPath(locale, continent, country, city, parkSlug);
  const calendar = items.find((i) => i.key === 'calendar');
  const tabs = items.filter((i) => i.key !== 'calendar');

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

      {calendar && (
        <Link
          href={calendarHref}
          className={cn(calendar.order, tileCell)}
          // The one cell in this row that leaves the page, and all three of these are one
          // decision: hand the row's current position to the copy of itself on the calendar page,
          // and stop both scroll-to-top mechanisms from throwing it away first. `getPathname`
          // because `ScrollToTop` compares against `window.location.pathname`, which carries the
          // locale prefix this href does not. See `useTileRowAnchor`.
          scroll={false}
          onClick={(e) => {
            rememberTileRow(e.currentTarget, parkSlug);
            suppressScrollToTopFor(getPathname({ href: calendarHref, locale }));
          }}
        >
          <EntryTileBody
            icon={calendar.icon}
            label={calendar.label}
            count={calendar.count}
            hint={calendar.hint}
          />
        </Link>
      )}
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
