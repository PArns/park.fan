'use client';

import { useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { CalendarDays, CloudSun, Map, Sparkles, UtensilsCrossed, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { EntryTileBody } from '@/components/common/entry-tile';
import { useTileReveal } from '@/lib/hooks/use-tile-reveal';
import { TILE_ROW_ATTR, useTileRowAnchor } from '@/lib/hooks/use-tile-row-anchor';
import { useBrowserNow } from '@/lib/hooks/use-mounted';
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
 * The entry-tile row of the park header card — everything both of its renderings share.
 *
 * There are two, and they differ only in what a cell IS. On the park page the five chapter cells
 * are `TabsTrigger`s that switch a panel in place (`ParkTabsList`); on every park SUB-page — the
 * crowd calendar today — there is no `Tabs` to switch, so all six are links back into the park
 * page (`ParkNavTiles`). What must not differ is the row itself: the same six cells in the same
 * order, with the same live hints, so that walking from the park to the calendar and back does
 * not feel like walking between two sites.
 *
 * So the hints live here. Each is derived once, from queries this row shares by key with the
 * panel above it and the sections below — no cell in either rendering fetches anything of its own.
 */

export type ParkTileKey = 'attractions' | 'calendar' | 'weather' | 'map' | 'shows' | 'restaurants';

export interface ParkTileItem {
  key: ParkTileKey;
  icon: LucideIcon;
  label: string;
  count?: number;
  hint: React.ReactNode;
  /**
   * CSS order class. The visual order is not the DOM order, because the calendar cell is a link
   * and must sit after every `TabsTrigger` — Radix's arrow keys have to run over an uninterrupted
   * set. It still belongs SECOND in the row, because the order is how often a visitor needs the
   * answer (what is open, when to come, what it will be like, then the ways around the park), and
   * re-sorting the row by how a cell happens to navigate would be sorting it by implementation.
   */
  order: string;
}

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
}

export const tileCell = cn(
  'group relative border-border/50 flex h-auto w-full flex-col items-start justify-start gap-2',
  'border-r border-b px-4 py-3.5 text-left whitespace-normal transition-colors',
  'bg-muted/20 hover:bg-muted/40',
  // `TabsTrigger`'s own base is built for a segmented control and has to be undone here, or the
  // selected cell draws a rounded, shadowed, `border-input`-coloured box inside a grid whose whole
  // point is that there are no boxes: `rounded-md`, `data-[state=active]:shadow-sm`,
  // `dark:data-[state=active]:border-input` and `h-[calc(100%-1px)]`. The link tile carries the
  // same overrides for free — it is not a trigger, so they are simply no-ops on it.
  'rounded-none',
  // …including its TEXT colour. The base mutes an inactive trigger in dark mode
  // (`dark:text-muted-foreground`), which a link is not subject to — so five cells rendered grey
  // and the calendar cell rendered white, and the row read as if the calendar were selected too.
  // All six labels carry the same weight now: they are six equally valid destinations, and the
  // selected one is marked by the bar, the filled chip and the tint rather than by being the only
  // legible one.
  'text-foreground dark:text-foreground',
  'data-[state=active]:border-border/50 dark:data-[state=active]:border-border/50'
);

/**
 * The selected cell's bar, along its top edge.
 *
 * An element rather than a border or a shadow, and both of those were tried against the DOM
 * first. `border-t-primary` loses because the cell already needs a SHORTHAND `border-…` colour
 * under `data-[state=active]:` — to beat the `dark:data-[state=active]:border-input` that
 * `TabsTrigger`'s own base sets — and a shorthand border colour beats a side-specific one in the
 * cascade whatever order the classes are written in; measured, the selected cell's
 * `border-top-color` came back as the plain hairline colour. An inset `shadow-[…]` loses to the
 * base's `data-[state=active]:shadow-sm` in the same way; measured, `box-shadow` computed to
 * `0px 0px 0px 0`.
 *
 * A positioned child answers to nothing but itself. It costs no reserved space either, where a
 * `border-t-2` had to be carried by every cell in the row to keep the labels on one baseline.
 *
 * Two selectors, because a cell is selected in two different ways: `data-state=active` is Radix's
 * on the park page's tab triggers, `aria-current=page` is the one a sub-page's own cell carries.
 */
export function SelectionBar() {
  return (
    <span
      aria-hidden="true"
      className="bg-primary absolute inset-x-0 top-0 h-[3px] opacity-0 transition-opacity group-aria-[current=page]:opacity-100 group-data-[state=active]:opacity-100"
    />
  );
}

/** The six cells with their live hints, plus how many there are (three are optional). */
export function useParkTileItems({
  park,
  continent,
  country,
  city,
  parkSlug,
  showsAvailable,
  restaurantsAvailable,
  weatherAvailable,
}: ParkTileSource): { items: ParkTileItem[]; tileCount: number } {
  const t = useTranslations('parks');
  const locale = useLocale();
  /**
   * The `<b>` every tile hint wraps its figures in. The words in a hint are context and the
   * numbers are the reading, so the numbers take the foreground colour while the sentence around
   * them stays `text-muted-foreground` — the same split the panel's own cells use for a value
   * inside a caption.
   */
  const bold = (chunks: React.ReactNode) => (
    <strong className="text-foreground font-semibold">{chunks}</strong>
  );
  const tWeather = useTranslations('parks.weather');
  const tCommon = useTranslations('common');
  // The show tile names the next start time, which is a question about the clock. Reading it in
  // render would be impure and would disagree between the server and the first client render.
  const browserNow = useBrowserNow(60_000);

  // Every hint below is read off the snapshot the tile row already has, except the calendar's,
  // which reads the best-days calendar through the SAME query key <ParkBestDaysSection> and
  // <ParkTodayPanel> already use — one cached request between the three. It is `useLoadLast`-gated
  // and therefore arrives late, which costs nothing here because the hint box is reserved at two
  // lines whether or not it has text yet.
  // Same nowcast the weather card and the panel read — one query key across all three, so the
  // tile cannot name a temperature the chapter behind it contradicts.
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
    // How far off the date is, counted in CALENDAR days rather than in 24-hour spans: a quiet
    // Tuesday is "in 3 days" from any hour of Saturday, and a difference in milliseconds would
    // call it 2 or 3 depending on what time somebody opened the page. Both ends are floored to
    // local midnight first — `target` already is, being built from Y/M/D.
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
  // The shortest HEADLINER queue, not the shortest queue in the park. Across the whole catalogue
  // that second one is always a walk-on carousel reading 0, so the tile said "kürzeste 0 min" on
  // every park at every hour — true, and worth nothing to somebody deciding what to walk to.
  // Closed rides are excluded via the display status, or a ride that shut with a stale 0 on its
  // queue would win it outright.
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
    // NOT `weatherDescription`: that field is the provider's own English string, and it shipped
    // as "22 °C · Overcast" on a German page. `getWeatherConfig` maps the WMO code to the key
    // the weather card already translates.
    const { icon, label } = getWeatherConfig(
      nowcast?.currentWeatherCode ?? w.now?.weatherCode ?? w.current.weatherCode,
      nowcast?.isDay ?? w.now?.isDay ?? true
    );
    const summary = `${Math.round(temp)} °C · ${tWeather(label)}`;
    // An official warning outranks the conditions on a tile this small: it is the reason to open
    // the weather chapter at all.
    return {
      // The tile's icon is the CONDITIONS, not a generic weather glyph: a hard-wired CloudSun sat
      // above "Klarer Himmel" at 24 °C. Same config that supplies the label, so icon and text
      // cannot contradict each other.
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
    // Formatted here rather than handed to <LocalTime>, because the hint is a translated
    // sentence with the time inside it. `t.rich` cannot do it either: `{time}` is a placeholder
    // and next-intl only calls a function value for a <tag>, so passing one rendered the label
    // with an empty slot after it — "Nächste:" and nothing else, which is what shipped.
    if (!iso) return null;
    return {
      // `hour`/`minute` are load-bearing: without them Intl falls back to its DATE defaults and
      // the tile read "Nächste: 26.8.2026 · in 45 Min". Every other formatTime call site in the
      // repo passes them for the same reason.
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
      // Two lines, not one sentence with three clauses. At tile width the third clause broke
      // mid-phrase — "Headliner" on the first line and "ab 35 min" on the second — because all
      // three shared the hint's two-line clamp. The headliner reading is a different statement
      // from how many rides are open, so it gets the second line to itself.
      hint:
        stats && shortestHeadlinerWait !== null ? (
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
      // A park whose rides carry no `land` still has a map worth opening — it just has nothing
      // to count. "· 0 Themenbereiche" was a true sentence about an empty set and read as a
      // defect; 22 of the 40 parks sampled are in that position for one field or another.
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
