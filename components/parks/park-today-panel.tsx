'use client';

import { useId, useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { addDays, format, parseISO } from 'date-fns';
import { ChevronRight, Crown, Loader2, Sparkles, Users } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useMinuteNowDate } from '@/lib/hooks/use-minute-now';
import { useCalendarData } from '@/lib/hooks/use-calendar-data';
import { useLoadLast } from '@/lib/hooks/use-load-last';
import { useParkBestDaysCalendar } from '@/lib/hooks/use-park-best-days-calendar';
import { useTodaySchedule } from '@/lib/hooks/use-today-schedule';
import { ParkStatusBadge } from './park-status-badge';
import { ParkCalendarDayDetail } from './park-calendar-day-detail';
import { CrowdLevelBadge } from './crowd-level-badge';
import { ParkHolidayBand } from './park-holiday-row';
import { WeatherWarningBanner } from './weather-warning-banner';
import { NowcastAlertBanner, NowcastAlertToggle, useNowcastAlert } from './weather-nowcast-banner';
import { NowcastCoveredRides, coveredRowsOf } from './nowcast-covered-rides';
import { ParkTimeRange } from '@/components/common/park-time';
import { Temp } from '@/components/common/unit-display';
import { WaitTimeValue } from '@/components/common/wait-time-value';
import { LocalTime } from '@/components/ui/local-time';
import { Progress } from '@/components/ui/progress';
import { useLiveParkData } from '@/lib/hooks/use-live-park-data';
import { useWeatherNowcast } from '@/lib/hooks/use-weather-nowcast';
import { formatDurationShort } from '@/lib/i18n/time';
import { formatTime, getDateTimeFormat } from '@/lib/utils/intl-format';
import { getAttractionDisplayStatus, getStandbyWait } from '@/lib/utils/park-utils';
import { getWeatherConfig } from '@/lib/utils/weather-utils';
import { hasReadableWaitTimes } from '@/lib/utils/live-wait-times';
import { isInSeason } from '@/lib/utils/season';
import { coveredOfferReady, rankCoveredRides } from '@/lib/utils/covered-rides';
import { isParkDayOver } from '@/lib/utils/park-day-over';
import { parkDayOf } from '@/lib/utils/park-day';
import { PANEL_CELL, PanelGrid, PanelMetric } from '@/components/parks/park-panel-cell';
import { RideAlertsEntryButton } from '@/components/push/ride-alerts-entry-button';
import { rideAlertAttractionsFor } from '@/components/push/ride-alert-park-context';
import { ShowFollowBell } from '@/components/push/show-follow-bell';
import { stripNewPrefix, cn } from '@/lib/utils';
import { PHONE_HIT_AREA } from '@/lib/utils/touch-target';
import type { ParkWithAttractions } from '@/lib/api/types';

/** Rows the headliner and show columns ever show. The show column runs one short of the
 *  headliner column: its first row is the boxed "next up", which is taller than a plain row, so
 *  four show rows and six headliner rows come out at about the same height. */
const HEADLINER_ROWS = 6;
const SHOW_ROWS = 4;
/** Below `sm` the headliner column is full width and stacked under everything else, so each row
 *  is a row of the page rather than of a column. Four is where the list stops being "which one
 *  now" and becomes the ride list, which the „Alle N Attraktionen" link under it already is. */
const HEADLINER_ROWS_PHONE = 4;

interface ParkTodayPanelProps {
  initialData: ParkWithAttractions;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  parkPath: string;
  /**
   * The server's clock at render time, in ms. Only a `force-dynamic` page may pass it: on a cached
   * one it is the time the cache was filled. With it the first HTML already knows whether the
   * park's day is over ({@link isParkDayOver}); without it the panel draws its rows at every width.
   */
  renderedAtMs?: number;
}

/**
 * Pill placeholder while a live or forecast value loads. 22 px, not `h-5`: what lands is a
 * `<Badge>` (16 px text, 4 px padding, 2 px border), and the status and crowd cells share a grid
 * row with the shows column, so 2 px grew the whole header card at hydration.
 */
function Pending() {
  return <span className="bg-muted-foreground/20 h-[22px] w-20 animate-pulse rounded-full" />;
}

/**
 * „Heute im Park": one panel answering what a visitor asks on arrival: status, crowd, the headliner
 * waits, the next shows, the weather and today's holidays.
 *
 * Geometry comes from the snapshot, content from the live poll. Every column reserves its rows
 * once, from data the server render had (how many shows, which rides are headliners, whether there
 * is weather), and the 5-minute poll changes the values inside those rows, never the rows. A ride
 * that shuts mid-afternoon leaves a dash instead of collapsing the panel.
 */
export function ParkTodayPanel({
  initialData,
  continent,
  country,
  city,
  parkSlug,
  parkPath,
  renderedAtMs,
}: ParkTodayPanelProps) {
  const t = useTranslations('parks');
  const tCommon = useTranslations('common');
  const tWeather = useTranslations('parks.weather');
  const locale = useLocale();
  const timezone = initialData.timezone ?? 'UTC';

  const sched = useTodaySchedule({
    timezone,
    schedule: initialData.schedule,
    nextSchedule: initialData.nextSchedule,
    status: initialData.status,
    hasOperatingSchedule: initialData.hasOperatingSchedule,
    continent,
    country,
    city,
    parkSlug,
  });

  // The same nowcast <WeatherCard> reads, through the same query key, so the header and the weather
  // chapter cannot show two different readings.
  const { data: nowcast } = useWeatherNowcast({ continent, country, city, parkSlug });

  // Rain, hail, thunderstorm or storm due now, off the same query. It is said in the title row,
  // which every park has at a fixed height, so a late warning changes text and not height; the full
  // banner opens under the row only on a press, which is not a layout shift (`hadRecentInput`).
  const nowcastAlert = useNowcastAlert({ continent, country, city, parkSlug, initialData: null });
  const [alertOpen, setAlertOpen] = useState(false);
  // Closed again once the warning is over, so a warning that comes back later in the visit does
  // not open by itself and push the card down without anyone having pressed anything.
  if (alertOpen && !nowcastAlert) setAlertOpen(false);
  const alertBannerId = useId();

  // Not `sched.livePark`: that is the raw `LiveParkSnapshot` projection, with no `isHeadliner` and
  // no `shows`. Seeded with `initialData`, the merge lays the snapshot over the full park, on the
  // same query key as <LiveParkData>, so it adds no request.
  const { data: mergedPark, isFetching } = useLiveParkData({
    continent,
    country,
    city,
    parkSlug,
    initialData,
  });
  const park = mergedPark ?? initialData;
  const waitsReadable = hasReadableWaitTimes(park);
  // Both are wait-derived, so a park with no wait-time source must not read them: over an empty set
  // they aggregate to a wall of zeros. See docs/rules/parks-we-cannot-read.md.
  const stats = waitsReadable ? park.analytics?.statistics : undefined;
  const occupancy = waitsReadable ? park.analytics?.occupancy : undefined;
  // `null` on a park whose feed has gone silent (see `hasReadableWaitTimes`, which cannot tell).
  const peakWait = stats?.peakWaitToday ?? 0;
  const avgWait = stats?.avgWaitTime ?? 0;
  const currentCrowd = stats?.crowdLevel ?? park.currentLoad?.crowdLevel ?? null;
  const isOpenish = sched.badgeStatus === 'OPERATING' || sched.isUnknown;

  const browserNow = useMinuteNowDate();
  const { data: calendar } = useParkBestDaysCalendar({ continent, country, city, parkSlug });
  const todayStr = useMemo(
    () => (browserNow ? parkDayOf(browserNow, timezone) : null),
    [browserNow, timezone]
  );

  // „Prognose heute" is the ML forecast for today (predicted peak). `predictedCrowdLevel` and
  // `crowdLevel` agree on today, so the fallback carries older API builds and unratable days. Never
  // surface a "closed" sentinel as a forecast.
  const predictedToday = useMemo(() => {
    if (!calendar || !todayStr) return null;
    const today = calendar.days.find((d) => d.date === todayStr);
    const level = today?.predictedCrowdLevel ?? today?.crowdLevel ?? null;
    return level === 'closed' ? null : level;
  }, [calendar, todayStr]);

  // The same day-detail dialog a click on today in the crowd calendar opens. Deferred via
  // `useLoadLast` so it never competes with the live/weather queries (loads-last rule).
  const [detailDate, setDetailDate] = useState<string | null>(null);
  const releasedLast = useLoadLast();
  const queryDate = detailDate ?? todayStr;
  const { data: detailCalendar } = useCalendarData({
    continent,
    country,
    city,
    parkSlug,
    from: queryDate ?? '',
    to: queryDate ?? '',
    enabled: !!queryDate && (releasedLast || detailDate !== null),
    loadLast: true,
  });
  const detailDay = queryDate
    ? (detailCalendar?.days.find((d) => d.date === queryDate) ?? null)
    : null;
  const todayReady = detailDate !== null || !!detailDay;

  // The rain plan: while rain or a thunderstorm is due, the opened banner lists the covered rides
  // that are open. Asked here so the list is never mounted empty, and only while the banner is
  // open, since the live poll re-renders this panel every five minutes.
  const showCoveredRides = useMemo(
    () =>
      alertOpen &&
      !!nowcastAlert?.offersShelter &&
      coveredOfferReady(park.attractions ?? []) &&
      rankCoveredRides(coveredRowsOf(park), 1).length > 0,
    [alertOpen, nowcastAlert?.offersShelter, park]
  );

  // `isHeadliner` is the API's own classification and the exact predicate `useAttractionFilter`
  // uses for the Highlights section, so the two lists can never disagree about what a headliner is.
  //
  // Shortest first: the top row is the recommendation, not the trophy. A headliner with no standby
  // reading sorts last and renders a dash rather than shortening the column.
  const headliners = useMemo(() => {
    if (!waitsReadable) return [];
    return (park.attractions ?? [])
      .filter((a) => a.isHeadliner && isInSeason(a))
      .map((a) => ({
        name: stripNewPrefix(a.name),
        slug: a.slug,
        wait: getAttractionDisplayStatus(a, park.status) === 'OPERATING' ? getStandbyWait(a) : null,
      }))
      .sort((a, b) => {
        if (a.wait === null) return 1;
        if (b.wait === null) return -1;
        return a.wait - b.wait;
      })
      .slice(0, HEADLINER_ROWS);
  }, [park.attractions, park.status, waitsReadable]);

  // The park's day is over (shut today, or past closing) by the server's clock and the schedule;
  // below `sm` the headliner and show columns then fold to one line each. Decided once per visit
  // from the schedule, not from the waits or showtimes, which in the day-old `initialData` snapshot
  // are often yesterday's and change on the first poll.
  const dayOverAtRender = useMemo(
    () =>
      renderedAtMs === undefined
        ? null
        : isParkDayOver(initialData.schedule, timezone, renderedAtMs),
    [initialData.schedule, timezone, renderedAtMs]
  );
  const headlinersFolded = dayOverAtRender === true;

  // What the folded headliner column says: when the park opens next, from the same schedule and
  // instant. Formatted only after mount, since server and browser `Intl` may spell a month
  // differently; one line of „Geschlossen" before it is the same height.
  const nextOpeningLine = useMemo(() => {
    if (!headlinersFolded || !browserNow || renderedAtMs === undefined) return null;
    const next = (initialData.schedule ?? [])
      .filter((s) => s.scheduleType === 'OPERATING' && s.openingTime)
      .map((s) => new Date(s.openingTime as string))
      .filter((d) => d.getTime() > renderedAtMs)
      .sort((a, b) => a.getTime() - b.getTime())[0];
    if (!next) return null;
    const date = getDateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      timeZone: timezone,
    }).format(next);
    const time = formatTime(next, locale, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone,
    });
    return `${t('opensOn')} ${date} · ${time}`;
  }, [headlinersFolded, browserNow, renderedAtMs, initialData.schedule, locale, timezone, t]);

  // Memoised like `headliners`: a fresh `.map()` on every render would hand `RideAlertsEntryButton`
  // a new array for a list that only changes with the poll.
  const rideAlertAttractions = useMemo(
    () => rideAlertAttractionsFor({ attractions: park.attractions, status: park.status }),
    [park.attractions, park.status]
  );

  // Reserved rows — the count comes from the same list the rows are drawn from, so it cannot
  // disagree with it, and it is stable across the poll because the attraction set is.
  const headlinerSlots = headliners.length;
  // Counted in showtimes, not shows: the rows are filled from the next start times park-wide, so a
  // show running hourly fills several rows.
  const showSlots = useMemo(
    () =>
      Math.min(
        SHOW_ROWS,
        (park.shows ?? []).filter(isInSeason).reduce((n, s) => n + (s.showtimes?.length ?? 0), 0)
      ),
    [park.shows]
  );

  // The next few showtimes across the whole park, not per show: the question here is what starts
  // next, not when a given show runs. Needs the clock, so it stays empty until the shared minute
  // clock has a reading rather than being answered during render (react-hooks/purity).
  const nextShows = useMemo(() => {
    if (!browserNow) return [];
    const nowMs = browserNow.getTime();
    return (park.shows ?? [])
      .filter((s) => isInSeason(s))
      .flatMap((s) =>
        // `slug` rides along so a row can link at the show's marker on the park map — see the
        // `#map-show-<slug>` hash the tab router resolves. The row already carries the name and
        // the time, so the thing it cannot say is WHERE, and that is what the map answers.
        (s.showtimes ?? []).map((st) => ({
          id: s.id,
          name: stripNewPrefix(s.name),
          slug: s.slug,
          startTime: st.startTime,
          // The show's whole day rides along, because an open-ended reminder is about whichever
          // performance comes next. The bell reads the row's `startTime` for its own lead check, so
          // this does not change which rows draw a bell.
          showtimes: s.showtimes ?? [],
        }))
      )
      .filter((e) => new Date(e.startTime).getTime() > nowMs)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .slice(0, SHOW_ROWS);
  }, [park.shows, browserNow]);

  // `now` is the live reading; `current` is the DAY record, whose temperatures are strings and a
  // max rather than a nowcast — so it is the fallback here, never the first choice.
  const weatherSummary = useMemo(() => {
    const w = park.weather;
    if (!w?.current) return null;
    // Nowcast › daily `now` snapshot › day record — the precedence <WeatherCard> uses, in that
    // order, so the two surfaces cannot disagree.
    const temp =
      nowcast?.currentTemperatureC ?? w.now?.temperature ?? Number(w.current.temperatureMax);
    if (!Number.isFinite(temp)) return null;
    // NOT `weatherDescription`: that field is the provider's own English string. `getWeatherConfig`
    // maps the WMO code to the key the weather card already translates, and hands over the icon
    // and its colour with it.
    const { icon, label, color } = getWeatherConfig(
      nowcast?.currentWeatherCode ?? w.now?.weatherCode ?? w.current.weatherCode,
      nowcast?.isDay ?? w.now?.isDay ?? true
    );
    const apparent = nowcast?.currentApparentTemperatureC ?? w.now?.apparentTemperature;
    return {
      icon,
      color,
      temperatureC: temp,
      label: tWeather(label),
      feelsLikeC: Number.isFinite(apparent) ? (apparent as number) : null,
    };
  }, [park.weather, nowcast, tWeather]);

  const handleDetailNavigate = (direction: -1 | 1) => {
    setDetailDate((prev) => {
      const base = prev ?? todayStr;
      return base ? format(addDays(parseISO(base), direction), 'yyyy-MM-dd') : prev;
    });
  };

  /**
   * A link to one of the park page's chapters. Absolute, not a bare `#shows`: this panel also
   * renders on the calendar pages, which have no tabs and no such id. A plain `<a>` with the locale
   * written in, because next-intl's `Link` navigates with `pushState`, which does not fire the
   * `hashchange` the park page's tab router listens for.
   */
  const chapterHref = (chapter: string) => `/${locale}${parkPath}#${chapter}`;

  // Below `sm` status and crowd share a row, so each gets half a phone: the padding comes down to
  // what the two halves can spare. The full-width columns under them keep the panel's own.
  const halfCell = cn(PANEL_CELL, 'max-sm:px-4');
  const fullCell = cn(PANEL_CELL, 'col-span-2 sm:col-span-1');
  // Below `sm` the headliner column comes first, ahead of status and crowd, though it stays third
  // in the markup: it holds the first live wait time and the ride-alert bell, and lower down it
  // began below the fold on a phone. A grid `order`, not a second markup, and unconditional, since
  // waiting for `headlinersFolded` would swap the rows after mount.
  const headlinersFirstOnPhone = 'max-sm:order-first';
  // Below `sm` a finished day folds the show column to one line; from `sm` up it sits beside
  // columns of the same height, so the reservation stays. A night show still ahead unfolds it once
  // the clock has mounted.
  const showsFolded = headlinersFolded && nextShows.length === 0;
  const columnCount = 2 + (headlinerSlots > 0 ? 1 : 0) + (showSlots > 0 ? 1 : 0);

  return (
    // No box of its own: the panel and the entry-tile row are one card, owned by `TabsWithHash`. A
    // fragment, so the bands are direct children of that card and its `overflow-hidden` clips their
    // hairlines.
    <>
      {/* The official severe-weather warning, the top strip. `rounded-none` must also reach the
          banner's two absolutely positioned overlay layers, which carry their own `rounded-xl` and
          would show the panel through the corners. */}
      <WeatherWarningBanner
        continent={continent}
        country={country}
        city={city}
        parkSlug={parkSlug}
        initialData={null}
        className="space-y-0 rounded-none border-x-0 border-t-0 shadow-none [&_.rounded-xl]:rounded-none [&>div]:rounded-none"
      />

      {/* Below `sm` the row is one line high and wraps only so a clock that does not fit beside the
          heading drops to a second line that `overflow-hidden` cuts off. A warning takes the row
          over there, and it must not be clipped. */}
      <div
        className={cn(
          'border-border/50 flex items-center gap-3 border-b px-5 py-3',
          !nowcastAlert && 'max-sm:h-[45px] max-sm:flex-wrap max-sm:overflow-hidden'
        )}
      >
        {/* Below `sm` a warning takes the whole row, since beside the heading it was cut off
            before the minutes. The heading stays in the accessibility tree, so the card keeps its
            name. */}
        <div
          className={cn(
            'flex shrink-0 items-center gap-2',
            nowcastAlert && 'sr-only sm:not-sr-only sm:flex'
          )}
        >
          {/* A static dot, on purpose: an `animate-pulse` inside a card with `backdrop-filter`
              re-reads the blur on every frame, which made the card flicker. The dot still says
              „live" through its colour. See docs/rules/work-nobody-can-see-is-still-work.md. */}
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              isOpenish ? 'bg-status-operating' : 'bg-muted-foreground/40'
            )}
            aria-hidden="true"
          />
          <h2 className="text-[13px] font-bold tracking-[0.06em] uppercase">{t('todayInPark')}</h2>
        </div>

        {/* The weather rides in this row, one reading and a word, and the whole group is the link
            to the weather chapter. Below `sm` the reading goes, since heading, clock and
            temperature do not fit one phone row; the chapter link still carries it. */}
        {weatherSummary && (
          <a
            href={chapterHref('weather')}
            /* The group is a reading, not a phrase — „18 °C Bedeckt" tells a screen reader
               nothing about where the link goes, and below `sm` even the word is gone. */
            aria-label={t('weatherAndHourly')}
            className={cn(
              'hover:text-primary flex min-w-0 items-center gap-2 transition-colors max-sm:hidden',
              nowcastAlert && 'shrink-0'
            )}
          >
            {(() => {
              const WeatherIcon = weatherSummary.icon;
              return (
                <WeatherIcon
                  className={cn('h-4 w-4 shrink-0', weatherSummary.color)}
                  aria-hidden="true"
                />
              );
            })()}
            <span className="text-sm font-semibold whitespace-nowrap">
              <Temp celsius={weatherSummary.temperatureC} withUnit />
            </span>
            {!nowcastAlert && (
              <span className="text-muted-foreground hidden truncate text-sm sm:inline">
                {weatherSummary.label}
                {weatherSummary.feelsLikeC !== null && (
                  <>
                    {' · '}
                    {tWeather('feelsLike')} <Temp celsius={weatherSummary.feelsLikeC} withUnit />
                  </>
                )}
              </span>
            )}
          </a>
        )}
        {/* The live region for the warning. It has to be in the markup before the warning is,
            or a screen reader may not announce it, and it carries the heading rather than the
            sentence: the sentence counts down by the minute, and a polite region re-announces
            every change. Positioned out of the row by `sr-only`, so it takes no gap. */}
        <span role="status" className="sr-only">
          {nowcastAlert?.heading}
        </span>
        {nowcastAlert && (
          <NowcastAlertToggle
            alert={nowcastAlert}
            expanded={alertOpen}
            onToggle={() => setAlertOpen((o) => !o)}
            controls={alertBannerId}
          />
        )}
        {/* Guarded on `currentTime`, not on the formatted string, which is an em dash before the
            clock mounts. The same guard covers the refetch spinner: this page is `force-dynamic`,
            and rendering it before mount would be a hydration mismatch. Below `sm` the clock gives
            way to a warning as well. */}
        {sched.currentTime && (
          <span
            className={cn(
              'text-muted-foreground ml-auto flex shrink-0 items-center gap-2 text-xs tabular-nums',
              nowcastAlert && 'hidden sm:flex'
            )}
          >
            {isFetching && (
              <Loader2 className="h-3 w-3 animate-spin" aria-label={tCommon('updating')} />
            )}
            <span>
              {sched.currentTimeFormatted}
              {tCommon('timeSuffix')}
              <span className="max-sm:hidden"> · {t('localTime')}</span>
            </span>
          </span>
        )}
      </div>

      {/* The full warning, opened from the title row: squared off and full-bleed like the warning
          strip above, with the overrides reaching the banner's two overlay layers for the same
          reason. */}
      {nowcastAlert && alertOpen && (
        <NowcastAlertBanner
          id={alertBannerId}
          alert={nowcastAlert}
          className="border-border/50 space-y-0 rounded-none border-x-0 border-t-0 border-b px-5 py-2.5 shadow-none [&_.rounded-xl]:rounded-none [&>div]:rounded-none"
        >
          {showCoveredRides && <NowcastCoveredRides park={park} />}
        </NowcastAlertBanner>
      )}

      {/* -mr-px -mb-px + the wrapper's overflow-hidden clip the trailing hairlines, so the rules
          stay correct at four, two and one column. */}
      <div className="overflow-hidden">
        {/* The wide track count is counted, because two of the four columns are conditional and a
            fixed track set leaves empty tracks inside the border. Two tracks from the smallest
            width: below `sm` status and crowd share the first row and the other columns span both
            tracks. */}
        <PanelGrid columnCount={columnCount} className="grid-cols-2">
          <div className={halfCell}>
            <PanelMetric caption={t('statusLabel')}>
              {sched.showStatusBadge && sched.badgeStatus ? (
                <ParkStatusBadge status={sched.badgeStatus} />
              ) : (
                <Pending />
              )}
            </PanelMetric>
            {/* Below `sm` this is half a phone, so the countdown, which arrives after mount, can
                wrap to a second line. The reservation holds the hours line plus two `text-xs`
                lines, so a wrapped countdown fills reserved space. */}
            <div className="flex min-h-[3.25rem] flex-col gap-0.5 max-sm:min-h-[3.75rem]">
              {sched.isOperatingToday && sched.openingTime && sched.closingTime ? (
                <>
                  <span className="text-base font-bold tabular-nums sm:text-xl">
                    <ParkTimeRange
                      openingTime={sched.openingTime}
                      closingTime={sched.closingTime}
                      parkTimezone={timezone}
                      locale={locale}
                      showSuffix
                    />
                  </span>
                  {sched.timeUntil && (
                    <span
                      className={cn(
                        'text-xs font-medium sm:text-sm',
                        sched.timeUntil.variant === 'opening'
                          ? 'text-primary'
                          : // 700, not 600: amber-600 on white is 3.2:1, and this is the line
                            // that says when the park closes.
                            'text-amber-700 dark:text-amber-400'
                      )}
                    >
                      {sched.timeUntil.message}
                    </span>
                  )}
                </>
              ) : sched.offseason ? (
                <span className="text-xs font-medium sm:text-sm">{sched.offseason.message}</span>
              ) : (
                <span className="text-muted-foreground text-sm">{t('status.CLOSED')}</span>
              )}
            </div>
            {stats && (
              <p className="text-muted-foreground mt-auto flex items-center gap-1.5 text-xs">
                <Users className="h-3 w-3 shrink-0" aria-hidden="true" />
                {/* One flex item: bare, the number and the words around it were separate items,
                    and in a half-width cell the number stood in a column of its own. */}
                <span>
                  {t.rich('attractionsOpenOf', {
                    open: stats.operatingAttractions,
                    total: stats.totalAttractions,
                    strong: (c) => <strong className="text-foreground font-semibold">{c}</strong>,
                  })}
                </span>
              </p>
            )}
          </div>

          <div className={halfCell}>
            {/* Always stacked, at every width: as `flex-wrap`, whether „Prognose heute" sat beside
                „Andrang jetzt" depended on two values that change after the first paint, so the
                pair wrapped late and moved the card. The dashes carry the badge's 22 px line box
                for the same reason. The tighter gaps below keep the stacked cell no taller than the
                headliner column beside it. */}
            <div className="flex flex-col gap-2">
              <PanelMetric caption={t('crowdNow')}>
                {isOpenish && currentCrowd ? (
                  // The park's own "how busy is it right now", and the one badge here that
                  // nothing interactive encloses — so this is where the scale is explained.
                  <CrowdLevelBadge level={currentCrowd} withScale />
                ) : (
                  <span className="text-muted-foreground text-sm leading-[22px]">—</span>
                )}
                {/* One sentence for the same level the badge shows. It reads `currentCrowd`, which the
                    server render already has, so it is in the first HTML rather than added after
                    hydration. `unknown` is no tier and has no sentence. */}
                {isOpenish && currentCrowd && currentCrowd !== 'unknown' && (
                  <p className="text-muted-foreground text-xs">
                    {t(`crowdVerdict.${currentCrowd}`)}
                  </p>
                )}
              </PanelMetric>
              {/* Once today's full CalendarDay is loaded the value becomes a button (chevron =
                  affordance) opening the same day-detail dialog a click on today in the crowd
                  calendar opens; until then it renders static. */}
              <PanelMetric caption={t('forecastToday')} icon={Sparkles}>
                {calendar ? (
                  todayReady ? (
                    <button
                      type="button"
                      onClick={() => setDetailDate(todayStr)}
                      title={t('dayDetail.openToday')}
                      aria-label={t('dayDetail.openToday')}
                      aria-haspopup="dialog"
                      className={cn(
                        'group hover:bg-muted/60 focus-visible:ring-primary -m-1 flex cursor-pointer items-center gap-0.5 rounded-lg p-1 transition-colors focus-visible:ring-2 focus-visible:outline-none',
                        PHONE_HIT_AREA
                      )}
                    >
                      {predictedToday ? (
                        <CrowdLevelBadge level={predictedToday} />
                      ) : (
                        <span className="text-muted-foreground text-sm leading-[22px]">—</span>
                      )}
                      <ChevronRight
                        className="text-muted-foreground h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </button>
                  ) : predictedToday ? (
                    <CrowdLevelBadge level={predictedToday} />
                  ) : (
                    <span className="text-muted-foreground text-sm leading-[22px]">—</span>
                  )
                ) : (
                  <Pending />
                )}
              </PanelMetric>
            </div>

            {/* Reserved whether or not occupancy lands — it rides the live poll, and gating the
                block on it moved the whole panel a beat after paint. */}
            <div className="mt-auto flex min-h-[4rem] flex-col gap-1">
              <div className="flex items-baseline justify-between">
                <span className="text-muted-foreground text-xs">{t('occupancy')}</span>
                <span className="text-lg leading-none font-bold tabular-nums">
                  {occupancy ? `${Math.round(occupancy.current)} %` : '—'}
                </span>
              </div>
              {/* occupancy.current is relative to the 90th-percentile baseline and can exceed 100. */}
              <Progress
                value={occupancy ? Math.min(100, Math.max(0, occupancy.current)) : 0}
                aria-label={t('occupancy')}
              />
              {occupancy && occupancy.comparisonStatus !== 'typical' && (
                <p className="text-xs">
                  <span
                    className={cn(
                      'font-semibold',
                      occupancy.comparisonStatus === 'higher' ||
                        occupancy.comparisonStatus === 'much_higher'
                        ? 'text-status-closed'
                        : 'text-status-operating'
                    )}
                  >
                    {Math.abs(occupancy.comparedToTypical)} %
                  </span>{' '}
                  <span className="text-muted-foreground">
                    {tCommon(occupancy.comparisonStatus)}
                  </span>
                </p>
              )}
              {/* Peak wait and peak hour sit beside the occupancy bar, not in the headliner column:
                  both are park-wide readings about today, not about one queue. */}
              {stats && (peakWait > 0 || (stats.peakHour && stats.peakHourSource)) && (
                <p className="text-muted-foreground text-xs">
                  {peakWait > 0 && (
                    <>
                      {t('parkPeak')}{' '}
                      <strong className="text-foreground font-semibold tabular-nums">
                        {stats.peakWaitToday}
                      </strong>{' '}
                      {tCommon('minutes')}
                    </>
                  )}
                  {peakWait > 0 && stats.peakHour && stats.peakHourSource && ' · '}
                  {/* `peakHour` is an ISO timestamp, not an hour, so it is formatted, with `≈` for
                      a predicted value; without `peakHourSource` there is nothing to qualify it
                      with. */}
                  {stats.peakHour && stats.peakHourSource && (
                    <>
                      {t('peakHour')}{' '}
                      <strong className="text-foreground font-semibold tabular-nums">
                        {stats.peakHourSource !== 'observed_today' && '≈ '}
                        <LocalTime time={stats.peakHour} timeZone={timezone} />
                      </strong>
                    </>
                  )}
                </p>
              )}
            </div>
          </div>

          {headlinerSlots > 0 && (
            <div className={cn(fullCell, headlinersFirstOnPhone)}>
              <PanelMetric
                caption={t('headlinersNow')}
                action={
                  stats && avgWait > 0 ? (
                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                      Ø{' '}
                      <strong className="text-foreground font-bold tabular-nums">
                        {stats.avgWaitTime}
                      </strong>{' '}
                      {tCommon('minutes')}
                    </span>
                  ) : null
                }
              >
                {headlinersFolded && (
                  <p className="text-muted-foreground truncate text-sm sm:hidden">
                    {nextOpeningLine ?? t('status.CLOSED')}
                  </p>
                )}
                {/* 24 px apart below `sm`: a 20 px row is under the 44 px target a button gets
                    here, so it meets WCAG 2.5.8 by spacing instead. */}
                <ul
                  className={cn(
                    'flex flex-col gap-0.5 max-sm:gap-1',
                    headlinersFolded && 'max-sm:hidden'
                  )}
                >
                  {Array.from({ length: headlinerSlots }, (_, i) => {
                    const ride = headliners[i];
                    return (
                      <li
                        key={i}
                        className={cn('text-sm', i >= HEADLINER_ROWS_PHONE && 'max-sm:hidden')}
                      >
                        {ride ? (
                          // The whole row is the link, not just the name: the wait time is why
                          // somebody reaches for it, and a target that ends at the name is a few
                          // characters wide on a phone. `-mx-1 px-1` gives the hover fill room
                          // without moving the text off the column's grid.
                          <Link
                            href={
                              `${parkPath}/${ride.slug}` as '/parks/europe/germany/rust/europa-park'
                            }
                            prefetch={false}
                            className="hover:bg-muted/50 hover:text-primary -mx-1 flex items-center gap-2 rounded px-1 transition-colors"
                          >
                            <Crown className="h-3 w-3 shrink-0 text-amber-500" aria-hidden="true" />
                            <span className="min-w-0 flex-1 truncate">{ride.name}</span>
                            {ride.wait !== null ? (
                              <span className="font-bold tabular-nums">
                                <WaitTimeValue minutes={ride.wait} />
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </PanelMetric>
              {/* A hash link, not a callback: `useTabHashRouting` already listens for
                  `hashchange` and switches + scrolls the tab panel below, so this needs no state
                  lifted across the page and it works before hydration. */}
              <div className="mt-auto flex items-center justify-between gap-2">
                <a
                  href={chapterHref('attractions')}
                  className={cn('text-primary text-left text-xs hover:underline', PHONE_HIT_AREA)}
                >
                  {t('allAttractionsLink', { count: park.attractions?.length ?? 0 })}
                </a>
                {rideAlertAttractions.length > 0 && (
                  <RideAlertsEntryButton
                    parkName={park.name}
                    attractions={rideAlertAttractions}
                    reopenAvailable={waitsReadable}
                  />
                )}
              </div>
            </div>
          )}

          {showSlots > 0 && (
            <div className={fullCell}>
              <PanelMetric
                caption={t('nextShows')}
                action={
                  <a
                    href={chapterHref('shows')}
                    className={cn(
                      'text-primary text-xs whitespace-nowrap hover:underline',
                      PHONE_HIT_AREA
                    )}
                  >
                    {t('allShowsLink', { count: park.shows?.length ?? 0 })}
                  </a>
                }
              >
                {showsFolded && (
                  <p className="text-muted-foreground text-sm sm:hidden">
                    {tCommon('noShowtimesToday')}
                  </p>
                )}
                {/* `max-sm:mt-3` puts the 44 px targets of "All N" above and the first row's bell
                    below 44 px apart; with the 6 px gap alone the bell overlapped the link. */}
                <div className={cn('relative max-sm:mt-3', showsFolded && 'max-sm:hidden')}>
                  {/* Nothing left today, for a park that does have shows. The sentence is centred
                      over the rows the column already reserved, which keep their height, so the
                      panel is the same size at 22:00 as at 11:00. */}
                  {browserNow && nextShows.length === 0 && (
                    <div className="text-muted-foreground absolute inset-0 flex items-center justify-center text-center text-sm">
                      {tCommon('noShowtimesToday')}
                    </div>
                  )}
                  <ul className="flex flex-col gap-1.5">
                    {Array.from({ length: showSlots }, (_, i) => {
                      const show = nextShows[i];
                      if (!show) {
                        // The first row is the boxed "next up", taller than a plain row, so an
                        // empty slot 0 cannot be reserved with the same dash as slots 1..3.
                        // `nextShows` is empty until the clock mounts, so the placeholder is the
                        // box itself with its two lines `invisible`, identical by construction. The
                        // border stays, transparent, because it is 2 px of the height.
                        if (i === 0) {
                          return (
                            <li key={`slot-${i}`} aria-hidden="true">
                              <span className="flex flex-col gap-0.5 rounded-lg border border-transparent px-2.5 py-2">
                                <span className="invisible flex items-baseline gap-2">
                                  <span className="shrink-0 text-base leading-none font-extrabold tabular-nums">
                                    &mdash;
                                  </span>
                                </span>
                                <span className="invisible text-[10px] font-bold tracking-[0.03em] uppercase">
                                  &mdash;
                                </span>
                              </span>
                            </li>
                          );
                        }
                        return (
                          <li key={`slot-${i}`} className="text-muted-foreground text-sm">
                            {/* The row is RESERVED, not drawn: it holds its height so the panel
                              does not shrink as the day's showtimes pass, but a column of em
                              dashes trailing the last real show is noise, not information. */}
                            <span className="invisible" aria-hidden="true">
                              &mdash;
                            </span>
                          </li>
                        );
                      }
                      // Keyed by the performance, never by the slot: the list shifts up by one as
                      // each performance starts, and a positional key would hand an open bell
                      // dialog a different show.
                      const rowKey = `${show.id}-${show.startTime}`;
                      const startsIn = browserNow
                        ? new Date(show.startTime).getTime() - browserNow.getTime()
                        : 0;
                      // The imminent one is the only one that gets the box and the countdown: on
                      // all three it reads as a column of durations and stops meaning "this is the
                      // one to walk to".
                      if (i === 0) {
                        return (
                          // Two rows, not two columns: beside the name, the countdown set the width
                          // of its block and cut every longer show name; on its own line it costs
                          // nothing horizontally.
                          // `relative` on the row, the bell a sibling of the `<a>` laid on top
                          // rather than a child: a button inside an anchor is the
                          // nested-interactive trap `components/ui/dialog.tsx` works around, and a
                          // sibling avoids it.
                          <li key={rowKey} className="relative">
                            <a
                              href={chapterHref(`map-show-${show.slug}`)}
                              className="border-primary/60 bg-primary/10 hover:bg-primary/20 flex flex-col gap-0.5 rounded-lg border py-2 pr-9 pl-2.5 transition-colors"
                            >
                              <span className="flex items-baseline gap-2">
                                <span className="shrink-0 text-base leading-none font-extrabold tabular-nums">
                                  <LocalTime time={show.startTime} timeZone={timezone} />
                                </span>
                                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                                  {show.name}
                                </span>
                              </span>
                              {startsIn > 0 && (
                                <span className="text-primary text-[10px] font-bold tracking-[0.03em] uppercase">
                                  {t('startsIn')} {formatDurationShort(startsIn, tCommon)}
                                </span>
                              )}
                            </a>
                            {/* `top-[9px]` matches the `<a>`'s offset to the time and title line (1
                                px border + `py-2`) and `h-5` that line's height, so the bell
                                centres on the line, with or without the countdown row below. */}
                            <ShowFollowBell
                              showId={show.id}
                              showName={show.name}
                              source="panel"
                              // One row is one performance, and that performance is what the
                              // reminder is for. Left off, the follow is open-ended and the API
                              // notifies before every performance of the show.
                              startTime={show.startTime}
                              showtimes={show.showtimes}
                              timezone={timezone}
                              className="absolute top-[9px] right-2 h-5"
                            />
                          </li>
                        );
                      }
                      return (
                        <li key={rowKey} className="relative text-sm">
                          {/* A plain `<a>` with a hash, not a next-intl `Link`: the tab router
                              listens for `hashchange`, which `pushState` navigation does not
                              fire. */}
                          <a
                            href={chapterHref(`map-show-${show.slug}`)}
                            className="hover:bg-muted/50 hover:text-primary -mx-1 flex items-center gap-2.5 rounded py-0.5 pr-7 pl-1 transition-colors"
                          >
                            <span className="text-muted-foreground shrink-0 font-bold tabular-nums">
                              <LocalTime time={show.startTime} timeZone={timezone} />
                            </span>
                            <span className="min-w-0 flex-1 truncate">{show.name}</span>
                          </a>
                          <ShowFollowBell
                            showId={show.id}
                            showName={show.name}
                            source="panel"
                            startTime={show.startTime}
                            showtimes={show.showtimes}
                            timezone={timezone}
                            className="absolute top-1/2 right-0 -translate-y-1/2"
                          />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </PanelMetric>
            </div>
          )}
        </PanelGrid>
      </div>

      {/* Holiday context, the "why is it so busy" behind the forecast; renders nothing when neither
          half has anything to say. No reservation, because this row cannot shift: it reads
          `initialData.schedule`, which `leanParkForShell` keeps whole, and `schedule[0]` is already
          today in the park's zone, so the pre-mount and post-mount entries are the same row. */}
      <ParkHolidayBand
        holiday={sched.holiday}
        initialData={initialData}
        country={country}
        className="border-border/50 border-t px-5 py-3 empty:hidden"
      />

      <ParkCalendarDayDetail
        day={detailDay}
        parkTimezone={timezone}
        open={detailDate !== null}
        onOpenChange={(o) => {
          if (!o) setDetailDate(null);
        }}
        onNavigate={handleDetailNavigate}
        planner={{ parkSlug, parkName: park.name, geo: { continent, country, city } }}
      />
    </>
  );
}
