'use client';

import { useTranslations } from 'next-intl';
import { CalendarDays, CloudSun, Map, Sparkles, UtensilsCrossed, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EntryTileBody, entryTileBox } from '@/components/common/entry-tile';
import { useTileReveal } from '@/lib/hooks/use-tile-reveal';
import { cn } from '@/lib/utils';
import type { ParkWithAttractions } from '@/lib/api/types';

interface ParkTabsListProps {
  park: ParkWithAttractions;
  showsAvailable: boolean | undefined;
  restaurantsAvailable: boolean | undefined;
  /** The park has weather data, so the weather chapter is a tab rather than nothing. */
  weatherAvailable: boolean | undefined;
}

/**
 * One entry tile. A tab, not a link — it stays a real `TabsTrigger`, so Radix keeps the roving
 * tabindex, the arrow keys and the `aria-selected`/`aria-controls` pairing that a hand-rolled
 * button would have to re-implement. Only the skin changed.
 */
function Tile({
  value,
  icon,
  label,
  count,
}: {
  value: string;
  icon: LucideIcon;
  label: string;
  count?: number;
}) {
  return (
    <TabsTrigger
      value={value}
      className={cn(
        'group',
        entryTileBox,
        'data-[state=active]:border-primary data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-primary/15'
      )}
    >
      <EntryTileBody
        icon={icon}
        label={label}
        count={count}
        chipClassName="group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-foreground"
      />
    </TabsTrigger>
  );
}

/**
 * The park page tab bar (attractions / calendar / map / shows / restaurants).
 *
 * Single source for markup that TabsWithHash renders twice — once pre-mount (SSR + first
 * client render) and once post-mount. The two renders were byte-identical; the only real
 * difference lives on the surrounding <Tabs> element (uncontrolled `defaultValue` vs.
 * controlled `activeTab` + onValueChange), which stays in TabsWithHash.
 *
 * Entry tiles, not a segmented band. What this replaces was `bg-background/60` behind a
 * `border-border/50` hairline in a 36px strip — over a park photo that is a slightly lighter
 * band of the background, and it sat below the weather card, the status cards and the best-days
 * section, so the way to the calendar, the map and the shows was both invisible and past the
 * fold. The tile carries an icon chip, which makes the row scannable by shape before it is read,
 * and the active tile takes the primary border with a filled chip instead of a 3px shadow.
 *
 * A grid, not a flex row: five items wrapping in a flex band leave an orphan on its own line at
 * most widths. `grid-cols-2` on a phone is deliberate — a single column would push the ride list
 * four tile-heights further down, which is the same fold this change is trying to win back.
 * `auto-rows-fr` keeps the wrapped row the same height as the first, so a two-word label in
 * French does not make its own tile taller than its neighbours.
 */
export function ParkTabsList({
  park,
  showsAvailable,
  restaurantsAvailable,
  weatherAvailable,
}: ParkTabsListProps) {
  const t = useTranslations('parks');
  // The row settling in on mount. The ref goes on the LIST, and only its tiles' contents are
  // animated — see `useTileReveal` for why the glass may not be touched.
  const rowRef = useTileReveal<HTMLDivElement>();

  // Three of the six tiles are optional, so the wide track count has to be counted rather than
  // written down: at a fixed `lg:grid-cols-5` a park with weather leaves its sixth tile alone on
  // a second row, and a park without shows or restaurants leaves two empty tracks.
  const tileCount =
    3 + (showsAvailable ? 1 : 0) + (restaurantsAvailable ? 1 : 0) + (weatherAvailable ? 1 : 0);

  // `items-stretch` is load-bearing: TabsList's own base class sets `items-center`, which in a
  // grid centres every tile in its row and quietly cancels `auto-rows-fr` — the tiles in a
  // wrapped row then sit at their own content height instead of matching the tallest.
  return (
    <TabsList
      ref={rowRef}
      className={cn(
        'mb-6 grid h-auto w-full auto-rows-fr grid-cols-2 items-stretch gap-3 rounded-none bg-transparent p-0 sm:grid-cols-3',
        tileCount === 6 && 'lg:grid-cols-6',
        tileCount === 5 && 'lg:grid-cols-5',
        tileCount === 4 && 'lg:grid-cols-4',
        tileCount === 3 && 'lg:grid-cols-3'
      )}
    >
      <Tile
        value="attractions"
        icon={Zap}
        label={t('attractions')}
        count={park.attractions?.length || 0}
      />
      <Tile value="calendar" icon={CalendarDays} label={t('calendar')} />
      <Tile value="map" icon={Map} label={t('map')} />
      {showsAvailable && (
        <Tile value="shows" icon={Sparkles} label={t('shows')} count={park.shows?.length || 0} />
      )}
      {restaurantsAvailable && (
        <Tile
          value="restaurants"
          icon={UtensilsCrossed}
          label={t('restaurants')}
          count={park.restaurants?.length || 0}
        />
      )}
      {weatherAvailable && <Tile value="weather" icon={CloudSun} label={t('weatherLabel')} />}
    </TabsList>
  );
}
