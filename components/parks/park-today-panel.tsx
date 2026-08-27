'use client';

import { useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { addDays, format, parseISO } from 'date-fns';
import { ChevronRight, Clock, Crown, Loader2, Sparkles, Users } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useBrowserNow } from '@/lib/hooks/use-mounted';
import { useCalendarData } from '@/lib/hooks/use-calendar-data';
import { useLoadLast } from '@/lib/hooks/use-load-last';
import { useParkBestDaysCalendar } from '@/lib/hooks/use-park-best-days-calendar';
import { useTodaySchedule } from '@/lib/hooks/use-today-schedule';
import { ParkStatusBadge } from './park-status-badge';
import { ParkCalendarDayDetail } from './park-calendar-day-detail';
import { CrowdLevelBadge } from './crowd-level-badge';
import { ParkHolidayRow } from './park-holiday-row';
import { WeatherWarningBanner } from './weather-warning-banner';
import { WeatherNowcastBanner } from './weather-nowcast-banner';
import { ParkTimeRange } from '@/components/common/park-time';
import { WaitTimeValue } from '@/components/common/wait-time-value';
import { LocalTime } from '@/components/ui/local-time';
import { Progress } from '@/components/ui/progress';
import { useLiveParkData } from '@/lib/hooks/use-live-park-data';
import { useWeatherNowcast } from '@/lib/hooks/use-weather-nowcast';
import { formatDurationShort } from '@/lib/i18n/time';
import { getAttractionDisplayStatus, getStandbyWait } from '@/lib/utils/park-utils';
import { getWeatherConfig } from '@/lib/utils/weather-utils';
import { hasReadableWaitTimes } from '@/lib/utils/live-wait-times';
import { isInSeason } from '@/lib/utils/season';
import { stripNewPrefix, cn } from '@/lib/utils';
import type { ParkWithAttractions } from '@/lib/api/types';

/** Rows the headliner and show columns ever show. The show column runs one short of the
 *  headliner column: its first row is the boxed "next up", which is taller than a plain row, so
 *  four show rows and six headliner rows come out at about the same height. */
const HEADLINER_ROWS = 6;
const SHOW_ROWS = 4;

interface ParkTodayPanelProps {
  initialData: ParkWithAttractions;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  parkPath: string;
}

/** A captioned value inside a column: small uppercase caption + its value stack. */
function Metric({
  caption,
  icon: Icon,
  action,
  children,
}: {
  caption: string;
  icon?: typeof Clock;
  /** Pushed to the caption's right — a count, an average, a link. */
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-semibold tracking-[0.08em] uppercase">
          {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
          {caption}
        </span>
        {action}
      </div>
      {children}
    </div>
  );
}

/** Subtle pill placeholder while a live/forecast value is still loading. */
function Pending() {
  return <span className="bg-muted-foreground/20 h-5 w-20 animate-pulse rounded-full" />;
}

/**
 * "Heute im Park" — one panel answering everything a visitor asks on arrival.
 *
 * It replaces `ParkHeaderStats` and pulls four things that used to be scattered down the page into
 * the same box: the official weather warning (a banner above the fold), the stats board (a band
 * inside the title card), the neighbouring-holiday context (a right-hand column of that card) and
 * the weather summary (a ~360px card between the header and the ride list). Answering "what is it
 * like in there right now" in four places meant a visitor had to assemble it, and the two most
 * actionable readings — what the headliners cost and when the next show starts — were not on the
 * fold at all; they were in the tabs, several screens below.
 *
 * **The layout's rule is that geometry comes from the snapshot and content from the live poll.**
 * Every column reserves its rows once, from data the server render already had: how many shows the
 * park runs, which rides it classes as headliners, whether it has weather at all. The 5-minute
 * poll then moves the values inside those rows and never the rows themselves, so a ride that shuts
 * mid-afternoon leaves a dash behind instead of collapsing the panel and everything under it.
 * `Metric` keeps its two-line reservation for the same reason it always did — the second line of
 * the status and hours cells is client-derived and arrives after the first paint.
 *
 * The dividers are drawn by every cell carrying a right and bottom hairline while the wrapper
 * clips the trailing ones (`-mr-px -mb-px` + `overflow-hidden`). Written as `border-r` on all but
 * the last child it is only correct at four columns and puts a stray rule at the end of the row
 * at two and one.
 */
export function ParkTodayPanel({
  initialData,
  continent,
  country,
  city,
  parkSlug,
  parkPath,
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

  // NOT `sched.livePark`. `useTodaySchedule` runs its live query with no `initialData`, so its
  // merge takes the `!base` branch and hands back the raw `LiveParkSnapshot` — a projection whose
  // attractions carry no `isHeadliner` and which has no `shows` key at all. Reading structure off
  // it made both right-hand columns render from the server park and then empty themselves the
  // moment the first poll landed. `ParkHeaderStats` got away with the same line because it only
  // ever read `analytics`/`currentLoad`, which the projection does carry.
  //
  // Seeded here, the merge lays the snapshot back over the full park, so `park` stays a complete
  // `ParkWithAttractions`. Same query key as <LiveParkData>'s, so this shares that one 5-minute
  // poll and adds no request.
  // The SAME nowcast <WeatherCard> reads, through the same query key — no extra request. Without
  // it the panel showed the daily `now` snapshot, which can be hours old, while the card one tab
  // over showed the 15-minute nowcast: "22 °C · Bedeckt" in the header against "24° · Klarer
  // Himmel" in the chapter, on the same page at the same moment.
  const { data: nowcast } = useWeatherNowcast({ continent, country, city, parkSlug });

  const { data: mergedPark, isFetching } = useLiveParkData({
    continent,
    country,
    city,
    parkSlug,
    initialData,
  });
  const park = mergedPark ?? initialData;
  const waitsReadable = hasReadableWaitTimes(park);
  // Both are wait-derived, so a park with no wait-time source (Hansa-Park publishes only inside
  // its own app) must not read them: over an empty set they aggregate to a wall of zeros — "0 von
  // 82 Attraktionen offen", "Auslastung 0 %" under an empty bar, a vs-typical delta against
  // nothing. The <ParkStatus variant="detailed"> board this panel replaced gated exactly these
  // behind the same flag and returned null; dropping that gate re-opened the bug the curated
  // `liveWaitTimes` flag exists to close.
  const stats = waitsReadable ? park.analytics?.statistics : undefined;
  const occupancy = waitsReadable ? park.analytics?.occupancy : undefined;
  const currentCrowd = stats?.crowdLevel ?? park.currentLoad?.crowdLevel ?? null;
  const isOpenish = sched.badgeStatus === 'OPERATING' || sched.isUnknown;

  const browserNow = useBrowserNow(60_000);
  const { data: calendar } = useParkBestDaysCalendar({ continent, country, city, parkSlug });
  const todayStr = useMemo(
    () => (browserNow ? browserNow.toLocaleDateString('en-CA', { timeZone: timezone }) : null),
    [browserNow, timezone]
  );

  // "Prognose heute" = the ML FORECAST for today (predicted peak), NOT the live level: the
  // calendar's today `crowdLevel` is overridden with real-time occupancy, so we read the separate
  // `predictedCrowdLevel`. Fall back to crowdLevel only on older API builds / unratable days, and
  // never surface a "closed" sentinel as a forecast.
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
  });
  const detailDay = queryDate
    ? (detailCalendar?.days.find((d) => d.date === queryDate) ?? null)
    : null;
  const todayReady = detailDate !== null || !!detailDay;

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

  // Reserved rows — the count comes from the same list the rows are drawn from, so it cannot
  // disagree with it, and it is stable across the poll because the attraction set is.
  const headlinerSlots = headliners.length;
  // Counted in SHOWTIMES, not in shows: the rows are filled from the next start times park-wide,
  // so counting shows reserved one row for a single show running hourly and silently dropped its
  // other two upcoming slots.
  const showSlots = useMemo(
    () =>
      Math.min(
        SHOW_ROWS,
        (park.shows ?? []).filter(isInSeason).reduce((n, s) => n + (s.showtimes?.length ?? 0), 0)
      ),
    [park.shows]
  );

  // The next few showtimes across the whole park, not per show: the question here is what starts
  // next, not when a given show runs. Needs the clock, so it stays empty until `useBrowserNow`
  // lands rather than being answered during render (react-hooks/purity).
  const nextShows = useMemo(() => {
    if (!browserNow) return [];
    const nowMs = browserNow.getTime();
    return (park.shows ?? [])
      .filter((s) => isInSeason(s))
      .flatMap((s) =>
        // `slug` rides along so a row can link at the show's own card in the shows chapter —
        // see the `#shows-<slug>` hash the tab router resolves.
        (s.showtimes ?? []).map((st) => ({
          name: stripNewPrefix(s.name),
          slug: s.slug,
          startTime: st.startTime,
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
      temperature: `${Math.round(temp)} °C`,
      description: [
        tWeather(label),
        Number.isFinite(apparent)
          ? `${tWeather('feelsLike')} ${Math.round(apparent as number)} °C`
          : null,
      ]
        .filter(Boolean)
        .join(' · '),
    };
  }, [park.weather, nowcast, tWeather]);

  const handleDetailNavigate = (direction: -1 | 1) => {
    setDetailDate((prev) => {
      const base = prev ?? todayStr;
      return base ? format(addDays(parseISO(base), direction), 'yyyy-MM-dd') : prev;
    });
  };

  const cell = 'border-border/50 flex flex-col gap-3 border-r border-b px-5 py-4';
  const columnCount = 2 + (headlinerSlots > 0 ? 1 : 0) + (showSlots > 0 ? 1 : 0);

  return (
    // No box of its own. The panel and the entry-tile row used to be two bordered, rounded,
    // glass-filled cards with a gap between them; they are one card now, and `TabsWithHash` owns
    // it — this component contributes the upper bands, the tile row the footer band. A fragment
    // rather than a `<div>` so the bands are direct children of that card and its
    // `overflow-hidden` clips their hairlines the way it always clipped this panel's.
    <>
      {/* Official severe-weather warning — the panel's top strip, above everything else it says.
          `rounded-none` also has to reach the banner's two absolutely-positioned overlay layers,
          which carry their own `rounded-xl`; left round inside a square strip they leave the
          panel background showing through all four corners. */}
      <WeatherWarningBanner
        continent={continent}
        country={country}
        city={city}
        parkSlug={parkSlug}
        initialData={null}
        className="space-y-0 rounded-none border-x-0 border-t-0 shadow-none [&_.rounded-xl]:rounded-none [&>div]:rounded-none"
      />

      <div className="border-border/50 flex items-center justify-between gap-3 border-b px-5 py-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              isOpenish ? 'bg-status-operating animate-pulse' : 'bg-muted-foreground/40'
            )}
            aria-hidden="true"
          />
          <h2 className="text-[13px] font-bold tracking-[0.06em] uppercase">{t('todayInPark')}</h2>
        </div>
        {/* Guarded on `currentTime`, not on the formatted string: before the browser clock
            mounts `currentTimeFormatted` is an em dash, and the first German paint read
            "— Uhr · Ortszeit". The header this replaced carried the same guard. Same guard covers
            the refetch spinner beside it: `isFetching` flips true on the mount refetch, and this
            page is `force-dynamic`, so rendering it before the clock mounts would be a hydration
            mismatch. It costs no height — this row is here either way, which is the whole reason
            the indicator moved out of the 32 px slot it used to hold open above the tab bar. */}
        {sched.currentTime && (
          <span className="text-muted-foreground flex items-center gap-2 text-xs tabular-nums">
            {isFetching && (
              <Loader2 className="h-3 w-3 animate-spin" aria-label={tCommon('updating')} />
            )}
            {sched.currentTimeFormatted}
            {tCommon('timeSuffix')} · {t('localTime')}
          </span>
        )}
      </div>

      {/* -mr-px -mb-px + the wrapper's overflow-hidden clip the trailing hairlines, so the rules
          stay correct at four, two and one column. */}
      <div className="overflow-hidden">
        {/* Two of the four columns are conditional, so the wide track count is counted rather
            than written down. At a fixed `lg:grid-cols-4` a park with no headliners and no
            showtimes left two empty tracks sitting inside the panel's border — which is exactly
            what shipped. */}
        <div
          className={cn(
            '-mr-px -mb-px grid grid-cols-1 sm:grid-cols-2',
            columnCount === 4 && 'lg:grid-cols-4',
            columnCount === 3 && 'lg:grid-cols-3',
            columnCount === 2 && 'lg:grid-cols-2'
          )}
        >
          {/* ── Status ── */}
          <div className={cell}>
            <Metric caption={t('statusLabel')}>
              {sched.showStatusBadge && sched.badgeStatus ? (
                <ParkStatusBadge status={sched.badgeStatus} />
              ) : (
                <Pending />
              )}
            </Metric>
            <div className="flex min-h-[3.25rem] flex-col gap-0.5">
              {sched.isOperatingToday && sched.openingTime && sched.closingTime ? (
                <>
                  <span className="text-xl font-bold tabular-nums">
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
                        'text-sm font-medium',
                        sched.timeUntil.variant === 'opening'
                          ? 'text-primary'
                          : 'text-amber-600 dark:text-amber-400'
                      )}
                    >
                      {sched.timeUntil.message}
                    </span>
                  )}
                </>
              ) : sched.offseason ? (
                <span className="text-sm font-medium">{sched.offseason.message}</span>
              ) : (
                <span className="text-muted-foreground text-sm">{t('status.CLOSED')}</span>
              )}
            </div>
            {stats && (
              <p className="text-muted-foreground mt-auto flex items-center gap-1.5 text-xs">
                <Users className="h-3 w-3" aria-hidden="true" />
                {t.rich('attractionsOpenOf', {
                  open: stats.operatingAttractions,
                  total: stats.totalAttractions,
                  strong: (c) => <strong className="text-foreground font-semibold">{c}</strong>,
                })}
              </p>
            )}
          </div>

          {/* ── Andrang ── */}
          <div className={cell}>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              <Metric caption={t('crowdNow')}>
                {isOpenish && currentCrowd ? (
                  <CrowdLevelBadge level={currentCrowd} />
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </Metric>
              {/* Once today's full CalendarDay is loaded the value becomes a button (chevron =
                  affordance) opening the same day-detail dialog a click on today in the crowd
                  calendar opens; until then it renders static. */}
              <Metric caption={t('forecastToday')} icon={Sparkles}>
                {calendar ? (
                  todayReady ? (
                    <button
                      type="button"
                      onClick={() => setDetailDate(todayStr)}
                      title={t('dayDetail.openToday')}
                      aria-label={t('dayDetail.openToday')}
                      aria-haspopup="dialog"
                      className="group hover:bg-muted/60 focus-visible:ring-primary -m-1 flex cursor-pointer items-center gap-0.5 rounded-lg p-1 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    >
                      {predictedToday ? (
                        <CrowdLevelBadge level={predictedToday} />
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                      <ChevronRight
                        className="text-muted-foreground h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </button>
                  ) : predictedToday ? (
                    <CrowdLevelBadge level={predictedToday} />
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )
                ) : (
                  <Pending />
                )}
              </Metric>
            </div>

            {/* Reserved whether or not occupancy lands — it rides the live poll, and gating the
                block on it moved the whole panel a beat after paint. */}
            <div className="mt-auto flex min-h-[4rem] flex-col gap-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-muted-foreground text-xs">{t('occupancy')}</span>
                <span className="text-lg font-bold tabular-nums">
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
              {/* The last two figures off the "Ø Wartezeit" card that this panel replaced. They
                  belong beside the occupancy bar rather than in the headliner column: both are
                  park-wide readings about today, not about one queue. */}
              {stats && (stats.peakWaitToday > 0 || (stats.peakHour && stats.peakHourSource)) && (
                <p className="text-muted-foreground text-xs">
                  {stats.peakWaitToday > 0 && (
                    <>
                      {t('parkPeak')}{' '}
                      <strong className="text-foreground font-semibold tabular-nums">
                        {stats.peakWaitToday}
                      </strong>{' '}
                      {tCommon('minutes')}
                    </>
                  )}
                  {stats.peakWaitToday > 0 && stats.peakHour && stats.peakHourSource && ' · '}
                  {/* `peakHour` is an ISO timestamp, not an hour — printed raw it read
                      "Stoßzeit 2026-08-26T11:00:00+02:00". Same treatment the card this panel
                      replaced gave it, including the `≈` for a value that is predicted rather
                      than observed, and the same gate on `peakHourSource`: without a source there
                      is nothing to qualify it with. */}
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

          {/* ── Headliner jetzt ── */}
          {headlinerSlots > 0 && (
            <div className={cell}>
              <Metric
                caption={t('headlinersNow')}
                action={
                  stats && stats.avgWaitTime > 0 ? (
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
                <ul className="flex flex-col gap-0.5">
                  {Array.from({ length: headlinerSlots }, (_, i) => {
                    const ride = headliners[i];
                    return (
                      <li key={i} className="text-sm">
                        {ride ? (
                          // The WHOLE row is the link, not just the name. The wait time beside it
                          // is the reason somebody reaches for this row at all, and a target that
                          // stops at the last letter of "F.L.Y." is a target three characters
                          // wide on a phone. `-mx-1 px-1` gives the hover fill a little room
                          // without moving the text off the column's baseline grid.
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
              </Metric>
              {/* A hash link, not a callback: `useTabHashRouting` already listens for
                  `hashchange` and switches + scrolls the tab panel below, so this needs no state
                  lifted across the page and it works before hydration. */}
              <a
                href="#attractions"
                className="text-primary mt-auto text-left text-xs hover:underline"
              >
                {t('allAttractionsLink', { count: park.attractions?.length ?? 0 })}
              </a>
            </div>
          )}

          {/* ── Nächste Shows ── */}
          {showSlots > 0 && (
            <div className={cell}>
              <Metric
                caption={t('nextShows')}
                action={
                  <a
                    href="#shows"
                    className="text-primary text-xs whitespace-nowrap hover:underline"
                  >
                    {t('allShowsLink', { count: park.shows?.length ?? 0 })}
                  </a>
                }
              >
                <ul className="flex flex-col gap-1.5">
                  {Array.from({ length: showSlots }, (_, i) => {
                    const show = nextShows[i];
                    if (!show) {
                      return (
                        <li key={i} className="text-muted-foreground text-sm">
                          {browserNow && i === 0 ? (
                            tCommon('noShowtimesToday')
                          ) : (
                            /* The row is RESERVED, not drawn: it holds its height so the panel
                               does not shrink as the day's showtimes pass, but a column of em
                               dashes trailing the last real show is noise, not information.
                               Before the clock lands every row takes this branch — "nothing more
                               today" is a claim that needs to know the time. */
                            <span className="invisible" aria-hidden="true">
                              &mdash;
                            </span>
                          )}
                        </li>
                      );
                    }
                    const startsIn = browserNow
                      ? new Date(show.startTime).getTime() - browserNow.getTime()
                      : 0;
                    // The imminent one is the only one that gets the box and the countdown: on
                    // all three it reads as a column of durations and stops meaning "this is the
                    // one to walk to".
                    if (i === 0) {
                      return (
                        // Two rows, not two columns. The countdown used to sit UNDER the time
                        // inside a `shrink-0` block beside the name, and "BEGINNT IN 2 STD. 31
                        // MIN." is about 150 px wide — so it set the width of that block and left
                        // the name roughly 110 px of a 270 px column. Every show whose name is
                        // longer than two short words was cut: "Miji African Dancers" rendered as
                        // "Miji African D…" beside 150 px of countdown. On its own line the
                        // countdown costs nothing horizontally, the name gets ~200 px, and the box
                        // is the same two lines tall it always was.
                        <li key={i}>
                          <a
                            href={`#shows-${show.slug}`}
                            className="border-primary/60 bg-primary/10 hover:bg-primary/20 flex flex-col gap-0.5 rounded-lg border px-2.5 py-2 transition-colors"
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
                        </li>
                      );
                    }
                    return (
                      <li key={i} className="text-sm">
                        {/* A plain `<a>` with a hash, not a next-intl `Link`: the tab router
                            listens for `hashchange`, and `pushState` navigation does not fire it.
                            Same reason the FAQ's calendar link used to be one — that link became a
                            real page, this one is still a jump within the park page. */}
                        <a
                          href={`#shows-${show.slug}`}
                          className="hover:bg-muted/50 hover:text-primary -mx-1 flex items-center gap-2.5 rounded px-1 transition-colors"
                        >
                          <span className="text-muted-foreground shrink-0 font-bold tabular-nums">
                            <LocalTime time={show.startTime} timeZone={timezone} />
                          </span>
                          <span className="min-w-0 flex-1 truncate">{show.name}</span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </Metric>
            </div>
          )}
        </div>
      </div>

      {/* Weather summary. The temperature line is NOT conditional on the nowcast: the nowcast
          banner renders nothing at all unless there is rain or a storm to report, so hanging the
          whole row off it meant every dry park showed no weather in this panel whatsoever. The
          full card is one click away in the weather tab. */}
      {park.weather?.current && (
        <div className="border-border/50 bg-muted/30 flex flex-wrap items-center gap-x-4 gap-y-2 border-t px-5 py-2.5">
          {weatherSummary &&
            (() => {
              const WeatherIcon = weatherSummary.icon;
              return (
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <WeatherIcon className={cn('h-4 w-4', weatherSummary.color)} aria-hidden="true" />
                  {weatherSummary.temperature}
                </span>
              );
            })()}
          {weatherSummary?.description && (
            <span className="text-muted-foreground text-sm">{weatherSummary.description}</span>
          )}
          <a href="#weather" className="text-primary ml-auto text-xs whitespace-nowrap">
            {t('weatherAndHourly')} ›
          </a>
        </div>
      )}

      {/* Rain / storm nowcast — its own strip because it is an alert, not a reading, and it
          renders nothing on a dry day. */}
      <WeatherNowcastBanner
        continent={continent}
        country={country}
        city={city}
        parkSlug={parkSlug}
        initialData={null}
        className="border-border/50 space-y-0 border-t px-5 py-2.5 empty:hidden"
      />

      {/* Holiday context — the "why is it so busy" behind the forecast. One band now: this used
          to be a grey chip row for the park's own state followed by a much louder amber panel for
          the neighbouring ones, which put the emphasis on the wrong region. Renders nothing when
          neither half has anything to say. */}
      <ParkHolidayRow
        initialData={initialData}
        continent={continent}
        country={country}
        city={city}
        parkSlug={parkSlug}
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
      />
    </>
  );
}
