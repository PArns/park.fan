'use client';

import { useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  BarChart3,
  CalendarDays,
  CloudSun,
  Map,
  Sparkles,
  UtensilsCrossed,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { EntryTileBody } from '@/components/common/entry-tile';
import { useTileReveal } from '@/lib/hooks/use-tile-reveal';
import { TILE_ROW_ATTR, useTileRowAnchor } from '@/lib/hooks/use-tile-row-anchor';
import { useMinuteNowDate } from '@/lib/hooks/use-minute-now';
import { isInSeason } from '@/lib/utils/season';
import { getAttractionDisplayStatus, getStandbyWait } from '@/lib/utils/park-utils';
import { formatDurationShort } from '@/lib/i18n/time';
import { getWeatherConfig } from '@/lib/utils/weather-utils';
import { analyzeBestDays } from '@/lib/utils/crowd-analysis';
import { useParkBestDaysCalendar } from '@/lib/hooks/use-park-best-days-calendar';
import { useWeatherNowcast } from '@/lib/hooks/use-weather-nowcast';
import { getDateTimeFormat, formatTime } from '@/lib/utils/intl-format';
import { cn } from '@/lib/utils';
import type { ParkWithAttractions } from '@/lib/api/types';

/**
 * The entry-tile row of the park header card: everything its two renderings share. On the park page
 * the chapter cells are `TabsTrigger`s (`ParkTabsList`); on a park sub-page every cell is a link
 * (`ParkNavTiles`). The row must be the same on both, so the hints are derived here from queries
 * shared by key with the panel and the sections, and no cell fetches anything of its own.
 */

export type ParkTileKey =
  'attractions' | 'calendar' | 'stats' | 'weather' | 'map' | 'shows' | 'restaurants';

/** One cell of the entry-tile row. */
export interface ParkTileItem {
  key: ParkTileKey;
  icon: LucideIcon;
  label: string;
  count?: number;
  hint: React.ReactNode;
  /**
   * CSS order class. The visual order is not the DOM order: the two link cells (calendar, wait-time
   * record) come after every `TabsTrigger` so Radix's arrow keys run over an uninterrupted set, but
   * the row is ranked by how often a visitor needs the answer, so the calendar still shows second.
   */
  order: string;
}

/** What the row's cells and hints are derived from. */
export interface ParkTileSource {
  park: ParkWithAttractions;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  showsAvailable: boolean | undefined;
  restaurantsAvailable: boolean | undefined;
  /** The park has weather data, so the weather chapter exists at all. */
  weatherAvailable: boolean | undefined;
  /**
   * The park has a wait-time record page: `meta.displayable` on its two-year aggregate, read on the
   * server through `hasParkStatsPage()`. Absent means do not offer it, since the route 404s for a
   * park whose aggregate is too thin. A prop rather than a query, resolved on all three pages of a
   * park, so the row is the same on each and `rememberTileRow` can hand off between them.
   */
  statsAvailable?: boolean;
}

/** The classes every cell of the row shares, tab trigger or link. */
export const tileCell = cn(
  'group relative border-border/50 flex h-auto w-full flex-col items-start justify-start gap-2',
  'border-r border-b px-4 py-3.5 text-left whitespace-normal transition-colors',
  'bg-muted/20 hover:bg-muted/40',
  // `TabsTrigger`'s base is built for a segmented control and has to be undone here, or the
  // selected cell draws a rounded, shadowed box inside a grid of borderless cells. On the link tile
  // these overrides are no-ops.
  'rounded-none',
  // …including its text colour: the base mutes an inactive trigger in dark mode, which a link is
  // not subject to, so the calendar cell read as selected too. The selected cell is marked by the
  // bar, the chip and the tint; below `sm` there is no chip.
  'text-foreground dark:text-foreground',
  'data-[state=active]:border-border/50 dark:data-[state=active]:border-border/50',
  // Phone: a third of the row, the label alone (`EntryTileBody` hides chip and hint). `min-h-11`
  // holds the 44 px touch target where the label has no reserved second line, as in the ride row.
  'max-sm:flex-row max-sm:items-center max-sm:gap-1.5 max-sm:px-2 max-sm:py-2 max-sm:min-h-11'
);

/**
 * The row on a phone: three columns instead of two, and no second line in the cells. Two columns
 * put seven cells in four rows, most of the first screen; three columns make three rows. Both rows
 * use it, `ParkTileGrid` and `RideNavTiles`.
 */
export const tileRowPhone = 'max-sm:grid-cols-3';

/**
 * The span of the LAST cell on a phone, so the three-column row never ends on an empty cell: one
 * cell left over takes the whole row, two share it. The last item of both rows' item lists is
 * also the visually last cell — the park row's `order` classes reproduce the list order.
 */
export function phoneLastCellSpan(index: number, count: number): string | undefined {
  if (index !== count - 1) return undefined;
  const rest = count % 3;
  return rest === 1 ? 'max-sm:col-span-3' : rest === 2 ? 'max-sm:col-span-2' : undefined;
}

/**
 * The selected cell's bar along its top edge. An element, not a border or a shadow:
 * `border-t-primary` loses to the shorthand border colour the cell needs to beat `TabsTrigger`'s
 * base, and an inset shadow loses to the base's `shadow-sm`. A positioned child also reserves no
 * space.
 *
 * Two selectors, because a cell is selected two ways: `data-state=active` on the park page's tab
 * triggers, `aria-current=page` on a sub-page's own cell.
 */
export function SelectionBar() {
  return (
    <span
      aria-hidden="true"
      className="bg-primary absolute inset-x-0 top-0 h-[3px] opacity-0 transition-opacity group-aria-[current=page]:opacity-100 group-data-[state=active]:opacity-100"
    />
  );
}

/** The cells with their live hints, plus how many there are (four of the seven are optional). */
export function useParkTileItems({
  park,
  continent,
  country,
  city,
  parkSlug,
  showsAvailable,
  restaurantsAvailable,
  weatherAvailable,
  statsAvailable,
}: ParkTileSource): { items: ParkTileItem[]; tileCount: number } {
  const t = useTranslations('parks');
  const locale = useLocale();
  /**
   * The `<b>` every tile hint wraps its figures in: the numbers take the foreground colour, the
   * words around them stay muted, as in the panel's own cells.
   */
  const bold = (chunks: React.ReactNode) => (
    <strong className="text-foreground font-semibold">{chunks}</strong>
  );
  const tWeather = useTranslations('parks.weather');
  const tCommon = useTranslations('common');
  // The show tile names the next start time, which is a question about the clock. Reading it in
  // render would be impure and would disagree between the server and the first client render.
  const browserNow = useMinuteNowDate();

  // The nowcast uses the same query key as the weather card and the panel, so the tile cannot
  // contradict them. The best-days calendar uses the key <ParkBestDaysSection> and <ParkTodayPanel>
  // use; it is `useLoadLast`-gated and arrives late, which costs nothing because the hint box is
  // reserved at two lines.
  const { data: nowcast } = useWeatherNowcast({ continent, country, city, parkSlug });
  const { data: bestDaysCalendar } = useParkBestDaysCalendar({
    continent,
    country,
    city,
    parkSlug,
  });
  const quietDayHint = useMemo(() => {
    if (!bestDaysCalendar || !browserNow) return null;
    // Same derivation the best-days section renders its "Kommende ruhige Tage" chips from, so the
    // tile can never name a day that section does not list. [0] is the nearest one.
    const next = analyzeBestDays(
      bestDaysCalendar.days,
      browserNow.getTime(),
      park.timezone ?? undefined
    ).upcomingQuietDays[0];
    if (!next) return null;
    const [y, m, d] = next.date.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    const label = getDateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' })
      .format(target)
      .replace(/\.$/, '');
    // Counted in calendar days, not 24-hour spans: a quiet Tuesday is "in 3 days" from any hour of
    // Saturday. Both ends are floored to local midnight; `target` already is.
    const startOfToday = new Date(
      browserNow.getFullYear(),
      browserNow.getMonth(),
      browserNow.getDate()
    );
    const days = Math.round((target.getTime() - startOfToday.getTime()) / 86_400_000);
    return t.rich('tileCalendarQuietDay', { day: label, days: Math.max(0, days), b: bold });
  }, [bestDaysCalendar, browserNow, park.timezone, locale, t]);

  const stats = park.analytics?.statistics;
  const lands = useMemo(
    () => new Set((park.attractions ?? []).map((a) => a.land).filter(Boolean)).size,
    [park.attractions]
  );
  const openRestaurants = useMemo(
    () => (park.restaurants ?? []).filter((r) => r.status === 'OPERATING').length,
    [park.restaurants]
  );
  // The shortest headliner queue, not the park's: that one is always a walk-on carousel at 0.
  // Closed rides are excluded via the display status, or a stale 0 would win.
  const shortestHeadlinerWait = useMemo(() => {
    const waits = (park.attractions ?? [])
      .filter(
        (a) =>
          a.isHeadliner &&
          isInSeason(a) &&
          getAttractionDisplayStatus(a, park.status) === 'OPERATING'
      )
      .map(getStandbyWait)
      .filter((w): w is number => w !== null);
    return waits.length > 0 ? Math.min(...waits) : null;
  }, [park.attractions, park.status]);
  // `now` is the live reading; `current` is the DAY record, whose temperatures are strings and a
  // max rather than a nowcast — so it is the fallback here, never the first choice.
  const weatherHint = useMemo(() => {
    const w = park.weather;
    if (!w?.current) return null;
    const temp =
      nowcast?.currentTemperatureC ?? w.now?.temperature ?? Number(w.current.temperatureMax);
    if (!Number.isFinite(temp)) return null;
    // Not `weatherDescription`, which is the provider's English string: `getWeatherConfig` maps the
    // WMO code to a key the weather card already translates.
    const { icon, label } = getWeatherConfig(
      nowcast?.currentWeatherCode ?? w.now?.weatherCode ?? w.current.weatherCode,
      nowcast?.isDay ?? w.now?.isDay ?? true
    );
    const summary = `${Math.round(temp)} °C · ${tWeather(label)}`;
    // An official warning outranks the conditions on a tile this small: it is the reason to open
    // the weather chapter at all.
    return {
      // The icon shows the conditions, from the same config as the label, so icon and text cannot
      // contradict each other.
      icon,
      text: (w.warnings?.length ?? 0) > 0 ? `${summary} · ${t('severeWeatherWarning')}` : summary,
    };
  }, [park.weather, nowcast, tWeather, t]);

  const nextShowtime = useMemo(() => {
    if (!browserNow) return null;
    const nowMs = browserNow.getTime();
    const iso =
      (park.shows ?? [])
        .filter((s) => isInSeason(s))
        .flatMap((s) => s.showtimes ?? [])
        .map((st) => st.startTime)
        .filter((t) => new Date(t).getTime() > nowMs)
        .sort((a, b) => a.localeCompare(b))[0] ?? null;
    // Formatted here rather than handed to <LocalTime>, because the hint is a translated sentence
    // with the time inside it, and `t.rich` only calls a function for a <tag>, not for a `{time}`
    // placeholder.
    if (!iso) return null;
    return {
      // `hour`/`minute` are load-bearing: without them Intl falls back to its date defaults.
      time: formatTime(new Date(iso), locale, {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: park.timezone || 'UTC',
      }),
      duration: formatDurationShort(new Date(iso).getTime() - nowMs, tCommon),
    };
  }, [park.shows, browserNow, locale, park.timezone, tCommon]);

  const items: ParkTileItem[] = [
    {
      key: 'attractions',
      icon: Zap,
      label: t('attractions'),
      count: park.attractions?.length || 0,
      // Two lines, not one sentence with three clauses: under the hint's two-line clamp the third
      // clause broke mid-phrase. The headliner reading is a separate statement, so it gets the
      // second line to itself.
      hint:
        stats && stats.avgWaitTime !== null && shortestHeadlinerWait !== null ? (
          <>
            <span className="block">
              {t.rich('tileAttractions', {
                open: stats.operatingAttractions,
                avg: stats.avgWaitTime,
                b: bold,
              })}
            </span>
            <span className="block">
              {t.rich('tileAttractionsHeadliner', { min: shortestHeadlinerWait, b: bold })}
            </span>
          </>
        ) : null,
      order: 'order-1',
    },
    {
      key: 'calendar',
      icon: CalendarDays,
      label: t('tileCalendarLabel'),
      hint: quietDayHint ?? t('tileCalendar'),
      order: 'order-2',
    },
    // Weather sits third, not last. See ParkTileItem.order for why the row is ranked this way.
    ...(weatherAvailable
      ? [
          {
            key: 'weather' as const,
            icon: weatherHint?.icon ?? CloudSun,
            label: t('weatherLabel'),
            hint: weatherHint?.text ?? null,
            order: 'order-3',
          },
        ]
      : []),
    {
      key: 'map',
      icon: Map,
      label: t('map'),
      // A park whose rides carry no `land` still has a map worth opening, just nothing to count; "·
      // 0 Themenbereiche" read as a defect.
      hint: lands > 0 ? t.rich('tileMap', { lands, b: bold }) : t('tileMapPlain'),
      order: 'order-3',
    },
    ...(showsAvailable
      ? [
          {
            key: 'shows' as const,
            icon: Sparkles,
            label: t('shows'),
            count: park.shows?.length || 0,
            hint: nextShowtime
              ? t.rich('tileShowsNext', {
                  time: nextShowtime.time,
                  duration: nextShowtime.duration,
                  b: bold,
                })
              : null,
            order: 'order-3',
          },
        ]
      : []),
    ...(restaurantsAvailable
      ? [
          {
            key: 'restaurants' as const,
            icon: UtensilsCrossed,
            label: t('restaurants'),
            count: park.restaurants?.length || 0,
            hint: t.rich('tileRestaurants', {
              open: openRestaurants,
              total: park.restaurants?.length || 0,
              b: bold,
            }),
            order: 'order-3',
          },
        ]
      : []),
    // Last in the row, and the only cell whose order is not "how often a visitor needs the
    // answer" — it is how often they need it FIRST. The record answers "how is this park
    // normally", which is the question you ask before a trip, not the one you ask in the queue.
    ...(statsAvailable
      ? [
          {
            key: 'stats' as const,
            icon: BarChart3,
            label: t('tileStatsLabel'),
            hint: t('tileStats'),
            order: 'order-4',
          },
        ]
      : []),
  ];

  // Counted, never written down: three of the six cells are optional, and at a fixed six-column
  // track set a park without shows or restaurants leaves two empty tracks in the row.
  return { items, tileCount: items.length };
}

/**
 * The row's grid. Both renderings mount it, and the park page's tablist sits inside it at
 * `display: contents` so its triggers become grid items directly — a link inside `role="tablist"`
 * is not a tab, and the calendar cell is a link.
 *
 * `items-stretch` is load-bearing: `TabsList`'s own base sets `items-center`, which in a grid
 * centres every cell in its row and quietly cancels `auto-rows-fr`, so cells in a wrapped row sit
 * at their own content height instead of matching the tallest.
 */
export function ParkTileGrid({
  tileCount,
  parkSlug,
  children,
}: {
  tileCount: number;
  /** Which park's row this is — the handoff that keeps it in place across a navigation is only
   *  ever redeemed on the park it was recorded on. */
  parkSlug: string;
  children: React.ReactNode;
}) {
  // The row settling in on mount. The ref goes on the grid, and only the cells' CONTENTS are
  // animated — see `useTileReveal` for why the glass may not be touched.
  const rowRef = useTileReveal<HTMLDivElement>();
  // Two of the six cells lead to another PAGE of the same park, and the row is on that page too.
  // This is the half that puts it back where the visitor left it — see `useTileRowAnchor`.
  useTileRowAnchor(rowRef, parkSlug);
  return (
    <div
      ref={rowRef}
      {...{ [TILE_ROW_ATTR]: '' }}
      className={cn(
        // `-mr-px -mb-px` + the card's `overflow-hidden` clip the trailing hairlines, exactly as
        // the panel's own column band does one row up. No `gap`: the cells touch and the rules
        // between them are the separation.
        '-mr-px -mb-px grid w-full auto-rows-fr grid-cols-2 items-stretch sm:grid-cols-3',
        tileRowPhone,
        // Every label holds two lines, wrapped or not: „Wartezeiten-Kalender" is one line in the
        // fallback font and two in Geist, so the row grew when the web font arrived, and with
        // `auto-rows-fr` every cell grew with it. On the grid rather than in `EntryTileBody`, so
        // the ride page's row, which reuses the body, does not get it.
        '[&_[data-tile-label]]:min-h-[2lh]',
        // Seven cells need more room than six: at 1024 px they are too narrow and „Restaurants"
        // wraps. From 1180 px each of seven cells gets the width six cells get at their own
        // breakpoint; below it the row wraps to three columns.
        tileCount === 7 && '@min-[1180px]/page:grid-cols-7',
        tileCount === 6 && '@min-[1024px]/page:grid-cols-6',
        tileCount === 5 && '@min-[1024px]/page:grid-cols-5',
        tileCount === 4 && '@min-[1024px]/page:grid-cols-4',
        tileCount === 3 && '@min-[1024px]/page:grid-cols-3'
      )}
    >
      {children}
    </div>
  );
}

/** The chip's active treatment, shared so a tab's selected state and a link's current state
 *  cannot drift apart. */
export const activeChip =
  'group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-foreground group-aria-[current=page]:bg-primary group-aria-[current=page]:text-primary-foreground';

/** The cell's active fill, likewise shared between the tab and the link rendering. */
export const activeCell =
  'data-[state=active]:bg-primary/12 dark:data-[state=active]:bg-primary/18 aria-[current=page]:bg-primary/12 dark:aria-[current=page]:bg-primary/18';

export { EntryTileBody };
