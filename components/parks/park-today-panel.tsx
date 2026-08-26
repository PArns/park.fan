'use client';

import { useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { addDays, format, parseISO } from 'date-fns';
import { CalendarDays, ChevronRight, Clock, Crown, Sparkles, Users } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useBrowserNow } from '@/lib/hooks/use-mounted';
import { useCalendarData } from '@/lib/hooks/use-calendar-data';
import { useLoadLast } from '@/lib/hooks/use-load-last';
import { useParkBestDaysCalendar } from '@/lib/hooks/use-park-best-days-calendar';
import { useTodaySchedule } from '@/lib/hooks/use-today-schedule';
import { ParkStatusBadge } from './park-status-badge';
import { ParkCalendarDayDetail } from './park-calendar-day-detail';
import { CrowdLevelBadge } from './crowd-level-badge';
import { HeaderHolidayPanel } from './header-holiday-panel';
import { WeatherWarningBanner } from './weather-warning-banner';
import { WeatherNowcastBanner } from './weather-nowcast-banner';
import { ParkTimeRange } from '@/components/common/park-time';
import { WaitTimeValue } from '@/components/common/wait-time-value';
import { LocalTime } from '@/components/ui/local-time';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useLiveParkData } from '@/lib/hooks/use-live-park-data';
import { formatDurationShort } from '@/lib/i18n/time';
import { getAttractionDisplayStatus, getStandbyWait } from '@/lib/utils/park-utils';
import { getWeatherConfig } from '@/lib/utils/weather-utils';
import { hasReadableWaitTimes } from '@/lib/utils/live-wait-times';
import { isInSeason } from '@/lib/utils/season';
import { stripNewPrefix, cn } from '@/lib/utils';
import type { ParkWithAttractions } from '@/lib/api/types';

/** Rows the headliner and show columns ever show. */
const HEADLINER_ROWS = 6;
const SHOW_ROWS = 3;

interface ParkTodayPanelProps {
  initialData: ParkWithAttractions;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  parkPath: string;
  /** The park's address, site and ticket shop, handed in from the page as a slot.
   *  <ParkInfoCard> is a Server Component and this panel is a Client one, so it arrives as
   *  rendered children rather than as data — same shape `LiveParkData` uses for best-days. */
  infoSlot?: React.ReactNode;
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
  infoSlot,
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
  const { data: mergedPark } = useLiveParkData({
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
        (s.showtimes ?? []).map((st) => ({ name: stripNewPrefix(s.name), startTime: st.startTime }))
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
    const temp = w.now?.temperature ?? Number(w.current.temperatureMax);
    if (!Number.isFinite(temp)) return null;
    // NOT `weatherDescription`: that field is the provider's own English string. `getWeatherConfig`
    // maps the WMO code to the key the weather card already translates, and hands over the icon
    // and its colour with it.
    const { icon, label, color } = getWeatherConfig(
      w.now?.weatherCode ?? w.current.weatherCode,
      w.now?.isDay ?? true
    );
    const apparent = w.now?.apparentTemperature;
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
  }, [park.weather, tWeather]);

  // Local holiday context — the chips that used to sit under the stats board. Neighbouring-region
  // breaks are NOT here: <HeaderHolidayPanel> owns that story in the row below, and a duplicate
  // chip for the same fact in two rows of one panel is worse than either alone.
  const holidayBadges = sched.holiday
    ? [
        sched.holiday.publicHolidayName && (
          <Badge
            key="public"
            variant="outline"
            className="border-orange-300 bg-orange-50 text-xs dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-300"
          >
            🎉 {sched.holiday.publicHolidayName}
          </Badge>
        ),
        sched.holiday.isBridgeDay && (
          <Badge
            key="bridge"
            variant="outline"
            className="border-blue-300 bg-blue-50 text-xs dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
          >
            🌉 {t('bridgeDay')}
          </Badge>
        ),
        sched.holiday.isSchoolVacation && (
          <Badge
            key="vacation"
            variant="outline"
            className="border-yellow-300 bg-yellow-50 text-xs dark:border-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300"
          >
            🎒 {t('schoolVacation')}
          </Badge>
        ),
      ].filter(Boolean)
    : [];

  const handleDetailNavigate = (direction: -1 | 1) => {
    setDetailDate((prev) => {
      const base = prev ?? todayStr;
      return base ? format(addDays(parseISO(base), direction), 'yyyy-MM-dd') : prev;
    });
  };

  const cell = 'border-border/50 flex flex-col gap-3 border-r border-b px-5 py-4';
  const columnCount = 2 + (headlinerSlots > 0 ? 1 : 0) + (showSlots > 0 ? 1 : 0);

  return (
    <section className="bg-background/60 border-border/50 mb-6 overflow-hidden rounded-xl border shadow-sm backdrop-blur-md dark:bg-[oklch(0.12_0.025_241_/_0.55)]">
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
            "— Uhr · Ortszeit". The header this replaced carried the same guard. */}
        {sched.currentTime && (
          <span className="text-muted-foreground text-xs tabular-nums">
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
              {stats && (stats.peakWaitToday > 0 || stats.peakHour) && (
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
                  {stats.peakWaitToday > 0 && stats.peakHour && ' · '}
                  {stats.peakHour && (
                    <>
                      {t('peakHour')}{' '}
                      <strong className="text-foreground font-semibold tabular-nums">
                        {stats.peakHour}
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
                      <li key={i} className="flex items-center gap-2 text-sm">
                        {ride ? (
                          <>
                            <Crown className="h-3 w-3 shrink-0 text-amber-500" aria-hidden="true" />
                            <Link
                              href={
                                `${parkPath}/${ride.slug}` as '/parks/europe/germany/rust/europa-park'
                              }
                              prefetch={false}
                              className="hover:text-primary min-w-0 flex-1 truncate transition-colors"
                            >
                              {ride.name}
                            </Link>
                            {ride.wait !== null ? (
                              <span className="font-bold tabular-nums">
                                <WaitTimeValue minutes={ride.wait} />
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </>
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
                          {/* Before the clock lands every row is a dash: the rows are already
                              the right height, and "nothing more today" is a claim that needs
                              to know the time. */}
                          {browserNow && i === 0 ? tCommon('noShowtimesToday') : '—'}
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
                        <li
                          key={i}
                          className="border-primary/60 bg-primary/10 flex items-start gap-3 rounded-lg border px-2.5 py-2"
                        >
                          <span className="flex shrink-0 flex-col items-start gap-0.5">
                            <span className="text-base leading-none font-extrabold tabular-nums">
                              <LocalTime time={show.startTime} timeZone={timezone} />
                            </span>
                            {startsIn > 0 && (
                              <span className="text-primary text-[10px] font-bold tracking-[0.03em] uppercase">
                                {t('startsIn')} {formatDurationShort(startsIn, tCommon)}
                              </span>
                            )}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                            {show.name}
                          </span>
                        </li>
                      );
                    }
                    return (
                      <li key={i} className="flex items-center gap-2.5 px-2.5 text-sm">
                        <span className="text-muted-foreground shrink-0 font-bold tabular-nums">
                          <LocalTime time={show.startTime} timeZone={timezone} />
                        </span>
                        <span className="min-w-0 flex-1 truncate">{show.name}</span>
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

      {/* Holiday context — the "why is it so busy" behind the forecast. The local chips (public
          holiday, bridge day, school break) sit beside the neighbouring-region panel rather than
          in a band of their own: they answer the same question and the template puts them on one
          line. Both halves collapse to nothing out of season, so the row can be empty and is
          hidden when it is. */}
      {holidayBadges.length > 0 && (
        <div className="border-border/50 flex flex-wrap items-center gap-x-3 gap-y-2 border-t px-5 py-2.5">
          <span className="text-muted-foreground flex shrink-0 items-center gap-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase">
            <CalendarDays className="h-3 w-3" aria-hidden="true" />
            {t('holidaysLabel')}
          </span>
          {holidayBadges}
        </div>
      )}

      {/* The neighbouring-region panel keeps its own row: it carries a caption and a sentence of
          its own, so folding it into the chip row above would print two captions side by side.
          Renders nothing when no influencing holidays apply. */}
      <HeaderHolidayPanel
        initialData={initialData}
        continent={continent}
        country={country}
        city={city}
        parkSlug={parkSlug}
        className="border-border/50 border-t px-5 py-2.5"
      />

      {/* Address, website, ticket shop — the last row rather than a card of its own further down
          the page. It is the one block here that never changes during a visit, so it closes the
          panel instead of opening it. Renders nothing for a park nobody has curated. */}
      {infoSlot}

      <ParkCalendarDayDetail
        day={detailDay}
        parkTimezone={timezone}
        open={detailDate !== null}
        onOpenChange={(o) => {
          if (!o) setDetailDate(null);
        }}
        onNavigate={handleDetailNavigate}
      />
    </section>
  );
}
