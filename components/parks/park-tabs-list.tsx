'use client';

import { useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { CalendarDays, CloudSun, Map, Sparkles, UtensilsCrossed, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from '@/i18n/navigation';
import { parkCalendarPath } from '@/lib/parks/calendar-segments';
import { EntryTileBody, entryTileBox } from '@/components/common/entry-tile';
import { useTileReveal } from '@/lib/hooks/use-tile-reveal';
import { useBrowserNow } from '@/lib/hooks/use-mounted';
import { isInSeason } from '@/lib/utils/season';
import { getAttractionDisplayStatus, getStandbyWait } from '@/lib/utils/park-utils';
import { formatDurationShort } from '@/lib/i18n/time';
import { getWeatherConfig } from '@/lib/utils/weather-utils';
import { analyzeBestDays } from '@/lib/utils/crowd-analysis';
import { useParkBestDaysCalendar } from '@/lib/hooks/use-park-best-days-calendar';
import { useWeatherNowcast } from '@/lib/hooks/use-weather-nowcast';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { formatTime } from '@/lib/utils/intl-format';
import { cn } from '@/lib/utils';
import type { ParkWithAttractions } from '@/lib/api/types';

interface ParkTabsListProps {
  park: ParkWithAttractions;
  /** Geo params for the shared best-days query behind the calendar tile's hint. */
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  showsAvailable: boolean | undefined;
  restaurantsAvailable: boolean | undefined;
  /** The park has weather data, so the weather chapter is a tab rather than nothing. */
  weatherAvailable: boolean | undefined;
}

/** Hover, shared by both tile kinds so a tab and the calendar link answer the pointer alike. */
const tileHover = 'hover:border-primary/60';

/**
 * One entry tile that switches a tab. It stays a real `TabsTrigger`, so Radix keeps the roving
 * tabindex, the arrow keys and the `aria-selected`/`aria-controls` pairing that a hand-rolled
 * button would have to re-implement. Only the skin changed.
 *
 * The calendar tile is NOT one of these — it is a `<Link>` to `/…/<park>/kalender`, rendered
 * below. A row of six boxes that look identical and behave in two ways is a fair objection to
 * that, and the alternative was worse: the calendar's own page cannot be a tab panel, and a tab
 * that navigates away would leave Radix holding a selection for a page nobody is on.
 */
function Tile({
  value,
  icon,
  label,
  count,
  hint,
  order = 'order-3',
}: {
  value: string;
  icon: LucideIcon;
  label: string;
  count?: number;
  hint: React.ReactNode;
  /** CSS order class — see the row below for why the visual order is not the DOM order. */
  order?: string;
}) {
  return (
    <TabsTrigger
      value={value}
      className={cn(
        'group',
        order,
        entryTileBox,
        tileHover,
        // The active fill is written out in full rather than as `bg-primary/10`, because
        // tailwind-merge REPLACES the base fill with it — the selected tile then sat at 10 %
        // opacity over the park photo and was the least readable of the six, which is the exact
        // opposite of what selecting it should do. These two carry the tint AND the base's
        // opacity, so the active tile is the most solid one in the row.
        // Three signals, because one was not enough over an arbitrary photo: a primary border, a
        // ring that thickens it without moving the box (a 2px border would shift the label by a
        // pixel on select), and the tint below. The chip fills as well, in EntryTileBody.
        'data-[state=active]:border-primary data-[state=active]:ring-primary/60',
        'data-[state=active]:ring-2 data-[state=active]:ring-inset',
        'data-[state=active]:bg-[color-mix(in_oklch,var(--primary)_12%,var(--background))]/92',
        'dark:data-[state=active]:bg-[oklch(0.19_0.055_241_/_0.92)]'
      )}
    >
      <EntryTileBody
        icon={icon}
        label={label}
        count={count}
        hint={hint}
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
  continent,
  country,
  city,
  parkSlug,
  showsAvailable,
  restaurantsAvailable,
  weatherAvailable,
}: ParkTabsListProps) {
  const t = useTranslations('parks');
  const locale = useLocale();
  const tWeather = useTranslations('parks.weather');
  const tCommon = useTranslations('common');
  // The row settling in on mount. The ref goes on the LIST, and only its tiles' contents are
  // animated — see `useTileReveal` for why the glass may not be touched.
  const rowRef = useTileReveal<HTMLDivElement>();
  // The show tile names the next start time, which is a question about the clock. Reading it in
  // render would be impure and would disagree between the server and the first client render.
  const browserNow = useBrowserNow(60_000);

  // Three of the six tiles are optional, so the wide track count has to be counted rather than
  // written down: at a fixed `lg:grid-cols-5` a park with weather leaves its sixth tile alone on
  // a second row, and a park without shows or restaurants leaves two empty tracks.
  const tileCount =
    3 + (showsAvailable ? 1 : 0) + (restaurantsAvailable ? 1 : 0) + (weatherAvailable ? 1 : 0);

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
    return t('tileCalendarQuietDay', { day: label, days: Math.max(0, days) });
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

  // The GRID is the wrapper, not the tablist. One of these tiles is a link to another page, and a
  // link inside `role="tablist"` is not a tab — so the tablist takes `display: contents` and its
  // triggers become grid items of the wrapper directly. Radix still owns the five real tabs
  // (roving tabindex, arrow keys, `aria-controls`), the link is reached with Tab like any link,
  // and the row looks like one row. `EntryTileReveal` uses the same trick for the same reason.
  //
  // `items-stretch` is load-bearing: TabsList's own base class sets `items-center`, which in a
  // grid centres every tile in its row and quietly cancels `auto-rows-fr` — the tiles in a
  // wrapped row then sit at their own content height instead of matching the tallest. It stays
  // on the wrapper now that the list itself lays nothing out.
  return (
    <div
      ref={rowRef}
      className={cn(
        'mb-4 grid w-full auto-rows-fr grid-cols-2 items-stretch gap-3 sm:grid-cols-3',
        tileCount === 6 && 'lg:grid-cols-6',
        tileCount === 5 && 'lg:grid-cols-5',
        tileCount === 4 && 'lg:grid-cols-4',
        tileCount === 3 && 'lg:grid-cols-3'
      )}
    >
      <TabsList className="contents h-auto rounded-none bg-transparent p-0">
        <Tile
          order="order-1"
          value="attractions"
          icon={Zap}
          label={t('attractions')}
          count={park.attractions?.length || 0}
          hint={
            stats && shortestHeadlinerWait !== null
              ? t('tileAttractions', {
                  open: stats.operatingAttractions,
                  avg: stats.avgWaitTime,
                  min: shortestHeadlinerWait,
                })
              : null
          }
        />
        {/* Weather sits third, not last. The order is how often a visitor needs the answer, not
          how the tabs happened to be declared: what is open, when to come, what it will be like —
          then the ways around the park. Radix takes the arrow-key order from the DOM, so moving
          the tile moves the keyboard order with it. */}
        {weatherAvailable && (
          <Tile
            value="weather"
            icon={weatherHint?.icon ?? CloudSun}
            label={t('weatherLabel')}
            hint={weatherHint?.text ?? null}
          />
        )}
        <Tile value="map" icon={Map} label={t('map')} hint={t('tileMap', { lands })} />
        {showsAvailable && (
          <Tile
            value="shows"
            icon={Sparkles}
            label={t('shows')}
            count={park.shows?.length || 0}
            hint={
              nextShowtime
                ? t('tileShowsNext', {
                    time: nextShowtime.time,
                    duration: nextShowtime.duration,
                  })
                : null
            }
          />
        )}
        {restaurantsAvailable && (
          <Tile
            value="restaurants"
            icon={UtensilsCrossed}
            label={t('restaurants')}
            count={park.restaurants?.length || 0}
            hint={t('tileRestaurants', {
              open: openRestaurants,
              total: park.restaurants?.length || 0,
            })}
          />
        )}
      </TabsList>

      {/* The calendar is a page of its own, so its tile is a link and leaves the tablist. It
          keeps its PLACE in the row though — second, after the attractions — because the order is
          how often a visitor needs the answer (what is open, when to come, what it will be like,
          then the ways around the park), and re-sorting the row by how a tile happens to navigate
          would be sorting it by implementation.
          
          So the visual order is set with CSS and the DOM order is not it: the link has to come
          after every trigger, or Radix's arrow keys would run over an interrupted set. With the
          tablist at `display: contents` all seven boxes are siblings of one grid, so `order`
          alone decides — attractions 1, the calendar 2, the rest 3 in DOM order. */}
      <Link
        href={parkCalendarPath(locale, continent, country, city, parkSlug)}
        className={cn('group order-2', entryTileBox, tileHover)}
      >
        <EntryTileBody
          icon={CalendarDays}
          label={t('tileCalendarLabel')}
          hint={quietDayHint ?? t('tileCalendar')}
        />
      </Link>
    </div>
  );
}
