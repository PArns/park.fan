'use client';

import { createElement, useState } from 'react';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import { useLocale, useTranslations } from 'next-intl';
import { addDays, format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Clock,
  HelpCircle,
  Luggage,
  PartyPopper,
  Backpack,
  CalendarDays,
  Wind,
  Droplets,
  Snowflake,
  Ticket,
} from 'lucide-react';
import type { CalendarDay, CrowdLevel } from '@/lib/api/types';
import { PlanDayButtonLazy } from '@/components/planner/plan-day-button-lazy';
import type { PlannerGeo } from '@/lib/planner/types';
import {
  CROWD_DOT_CLASS,
  CROWD_LEVEL_ORDER,
  CROWD_TEXT_CLASS,
  CROWD_TILE_CLASS,
} from '@/lib/utils/crowd-level-styles';
import type { ColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';
import { DAY_SIGNAL_CLASS } from '@/lib/utils/day-signal-styles';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DialogHero } from '@/components/common/dialog-hero';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { ParkTimeRange } from '@/components/common/park-time';
import { Temp } from '@/components/common/unit-display';
import { getRegionLabel, getCountryName, countryFlagEmoji } from '@/lib/utils/region-names';
import { translateHolidayName } from '@/lib/utils/holiday-names';
import { parkDayOf } from '@/lib/utils/park-day';
import { getWeatherConfig } from '@/lib/utils/weather-utils';
import { upcomingHourlyPredictions } from '@/lib/utils/calendar-utils';
import { useCalendarDayHourly } from '@/lib/hooks/use-calendar-day-hourly';
import { useMinuteNowDate } from '@/lib/hooks/use-minute-now';

// Intl, not a date-fns pattern: a pattern fixes one language's word order for all six.
const TITLE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
};

/**
 * Bar colour per crowd level for the hourly mini-chart. It reads the crowd palette, so a retuned
 * shade moves the chart with every badge and tile on the page.
 */
const CROWD_BAR_COLOR: Record<string, string> = {
  ...CROWD_DOT_CLASS,
  unknown: 'bg-muted-foreground/50',
};

const CROWD_MEANING_LEVELS: readonly CrowdLevel[] = CROWD_LEVEL_ORDER;

/** Props of the calendar day dialog. */
export interface ParkCalendarDayDetailProps {
  /** The selected day, or null when the dialog is closed (or the target day is still loading). */
  day: CalendarDay | null;
  /** Park IANA timezone — opening hours render in park time (browser-time tooltip on hover). */
  parkTimezone: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Prev/next-day navigation: chevrons in the header and the ←/→ keys. The parent owns the day
   * switch; while the target day loads it passes `day={null}`, and the dialog keeps showing the
   * previous day dimmed instead of closing.
   */
  onNavigate?: (direction: -1 | 1) => void;
  /**
   * The park this calendar belongs to, and the only gate on the "plan this day" control: a
   * `CalendarDay` names no park.
   */
  planner?: { parkSlug: string; parkName: string; geo: PlannerGeo };
}

/**
 * Click-to-open detail panel for one crowd-calendar day. A Radix Dialog, unlike the calendar's
 * hover tooltips, so it works on touch too.
 */
export function ParkCalendarDayDetail({
  day: dayProp,
  parkTimezone,
  open,
  onOpenChange,
  onNavigate,
  planner,
}: ParkCalendarDayDetailProps) {
  // "Today" in the park's timezone, not the reader's: a visit cannot be planned for a day that is
  // already over where the park is.
  const todayInPark = parkDayOf(new Date(), parkTimezone);
  const t = useTranslations('parks');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  // Keep the last non-null day so a nav step (the target day is briefly null) dims the open dialog
  // instead of unmounting it; a render-phase derived-state update, no effect.
  //
  // Not kept across the close: that would restore the exit fade, but the content then re-renders on
  // every commit after the close (planner mount, route change), which took seconds on a throttled
  // phone.
  const [lastDay, setLastDay] = useState<CalendarDay | null>(dayProp);
  if (dayProp && dayProp !== lastDay) setLastDay(dayProp);
  const day = dayProp ?? (open ? lastDay : null);
  // Target day is in flight: previous content stays visible but dimmed.
  const navigating = open && !dayProp && !!day;

  // The hour-by-hour curve is not in the month payload: it is scoped to the hour it was fetched in,
  // and that payload is cached for a day. So it is fetched here for the opened day, and only today
  // and tomorrow in park time can have one. Tomorrow is derived because the API never sends
  // `day.isTomorrow`.
  //
  // Only while the dialog is open: this component stays mounted behind every calendar page, and a
  // clock subscription would re-render it every minute for a chart almost nobody opens.
  const browserNow = useMinuteNowDate(open);
  const tomorrowInPark = format(addDays(parseISO(todayInPark), 1), 'yyyy-MM-dd');
  const canHaveHourly =
    !!day && (day.isToday || day.date === todayInPark || day.date === tomorrowInPark);
  const hourlyQuery = useCalendarDayHourly({
    continent: planner?.geo.continent ?? '',
    country: planner?.geo.country ?? '',
    city: planner?.geo.city ?? '',
    parkSlug: planner?.parkSlug ?? '',
    date: day?.date ?? null,
    enabled: !!planner && open && canHaveHourly,
  });

  if (!day) return null;

  const [year, month, dayOfMonth] = day.date.split('-').map(Number);
  const title = getDateTimeFormat(locale, TITLE_FORMAT).format(
    Date.UTC(year, month - 1, dayOfMonth)
  );

  const isClosed = day.status === 'CLOSED';
  const statusLabel = isClosed
    ? t('calendarView.details.schedule.closed')
    : day.status === 'UNKNOWN'
      ? t('calendarView.details.schedule.scheduleNotYetAvailable')
      : t('calendarView.details.schedule.open');

  /**
   * On today the dialog can show two numbers: the day's forecast (`crowdLevel`) and how it has gone
   * so far (`todayCrowdLevel`, the backend's day-so-far P50). The latter is absent on a closed day,
   * on a park too thin to rate and before the first measurement, so the row stays conditional.
   */
  const showLiveSplit =
    day.isToday &&
    !!day.todayCrowdLevel &&
    day.crowdLevel !== 'closed' &&
    day.todayCrowdLevel !== day.crowdLevel;
  const meaningLevel =
    day.isToday && day.predictedCrowdLevel ? day.predictedCrowdLevel : day.crowdLevel;
  const showMeaning =
    meaningLevel !== 'closed' && CROWD_MEANING_LEVELS.includes(meaningLevel as CrowdLevel);

  const forecast = day.headlinerForecast;
  const hasForecast = !!forecast && forecast.rides.length > 0;

  // `day.hourly` first: a caller that already holds a curve keeps it, and the fetch fills the gap
  // the grid's `includeHourly=none` leaves. `upcomingHourlyPredictions` turns the UTC `hour` into
  // an instant for park-time labels and drops hours already over; the backend caches the curve
  // until park-local midnight, so a morning copy would draw the morning all evening.
  const hourlySource = day.hourly ?? hourlyQuery.data ?? [];
  const hourly = upcomingHourlyPredictions(
    day.date,
    hourlySource.filter((h) => h.predictedWaitTime > 0),
    // `browserNow`, not `Date.now()`: a clock read in render is impure, and the minute tick retires
    // a bar while the dialog is open. The fallback reads the same wall clock without scheduling
    // anything.
    (browserNow ?? new Date()).getTime(),
    parkTimezone
  );
  const maxHourlyWait = hourly.reduce((m, h) => Math.max(m, h.predictedWaitTime), 0);

  // Neighbour holidays grouped BY COUNTRY (API already priority-sorted), each
  // country listing its regions — so a border park splits cleanly into e.g.
  // Deutschland (RP · HE · NI) / Niederlande (Limburg · Gelderland) / Belgien.
  const neighborGroups: {
    countryCode: string;
    countryName: string;
    flag: string;
    regions: string[];
  }[] = [];
  {
    const byCountry = new Map<
      string,
      { countryCode: string; regions: string[]; seen: Set<string> }
    >();
    for (const n of day.neighborHolidays ?? []) {
      const cc = n.source.countryCode;
      let g = byCountry.get(cc);
      if (!g) {
        g = { countryCode: cc, regions: [], seen: new Set() };
        byCountry.set(cc, g);
      }
      const label = getRegionLabel(cc, n.source.regionCode, locale);
      const countryName = getCountryName(cc, locale);
      // Drop a region label that is just the country name (e.g. nationwide BE) —
      // the country header already carries it.
      if (label !== countryName && !g.seen.has(label)) {
        g.seen.add(label);
        g.regions.push(label);
      }
    }
    for (const g of byCountry.values()) {
      neighborGroups.push({
        countryCode: g.countryCode,
        countryName: getCountryName(g.countryCode, locale),
        flag: countryFlagEmoji(g.countryCode),
        regions: g.regions,
      });
    }
  }
  const showNeighbor = neighborGroups.length > 0 && !isClosed;

  const localChips: { icon: typeof PartyPopper; label: string; className: string }[] = [];
  if (day.isHoliday || day.isPublicHoliday) {
    // The API names holidays in English only, so the name goes through the locale table before it
    // reaches a chip on a German page — same rule as the header row.
    const name = day.events?.find((e) => e.type === 'holiday')?.name;
    localChips.push({
      icon: PartyPopper,
      label: translateHolidayName(name, locale) || t('holiday'),
      className:
        'border-orange-400/60 bg-orange-50/60 text-orange-700 dark:border-orange-500/40 dark:bg-orange-950/30 dark:text-orange-300',
    });
  }
  if (day.isSchoolHoliday || day.isSchoolVacation) {
    // The break's own name when the day's events carry one ("Sommerferien"), the generic word
    // otherwise. `school-holiday` is the event type the calendar sends for it.
    const schoolName = day.events?.find((e) => e.type === 'school-holiday')?.name;
    localChips.push({
      icon: Backpack,
      label: translateHolidayName(schoolName, locale) || t('schoolVacation'),
      className:
        'border-yellow-400/60 bg-yellow-50/60 text-yellow-700 dark:border-yellow-500/40 dark:bg-yellow-950/30 dark:text-yellow-300',
    });
  }
  if (day.isBridgeDay) {
    localChips.push({
      icon: CalendarDays,
      label: t('bridgeDay'),
      className:
        'border-blue-400/60 bg-blue-50/60 text-blue-700 dark:border-blue-500/40 dark:bg-blue-950/30 dark:text-blue-300',
    });
  }

  const hasHolidayContext = localChips.length > 0 || showNeighbor;

  /**
   * The same three-pixel bar the day's tile wears, on the dialog's top edge, so the dialog reads as
   * that cell opened up. Order matches the legend.
   */
  const signalBars = [
    day.isSchoolHoliday || day.isSchoolVacation ? DAY_SIGNAL_CLASS.school : null,
    showNeighbor ? DAY_SIGNAL_CLASS.neighbor : null,
    day.isHoliday || day.isPublicHoliday ? DAY_SIGNAL_CLASS.holiday : null,
    day.isBridgeDay ? DAY_SIGNAL_CLASS.bridge : null,
  ].filter((c): c is string => c !== null);

  // The level the panel is tinted by: the forecast on today, the day's own level otherwise.
  const panelLevel: ColoredCrowdLevel | null =
    meaningLevel && meaningLevel !== 'closed' && meaningLevel !== 'unknown'
      ? (meaningLevel as ColoredCrowdLevel)
      : null;

  // The same number the grid's cell shows, from the same field: `/calendar` sends the day's
  // headliner average and no `avgWaitTime`, so reading the latter renders nothing.
  const rawAvgWait = forecast?.avgWait ?? day.avgWaitTime;
  const avgWait = rawAvgWait && rawAvgWait > 0 ? roundWaitTo5(rawAvgWait) : null;
  // Whether the panel above the ride list already states it — if it does, the list must not
  // repeat it underneath.
  const heroShowsAvgWait = !!day.crowdLevel && day.crowdLevel !== 'closed' && avgWait !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Three rows, of which only the body scrolls, so the date and the plan button hold still
          while the reader walks a long day. `svh` keeps the last row above a mobile browser's
          toolbar. */}
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[92svh] flex-col gap-0 overflow-hidden p-0"
        // Flip through days with ←/→ (desktop convenience; the dialog holds focus, and it
        // contains no text inputs the arrows could conflict with).
        onKeyDown={
          onNavigate
            ? (e) => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                  e.preventDefault();
                  onNavigate(e.key === 'ArrowLeft' ? -1 : 1);
                }
              }
            : undefined
        }
      >
        {signalBars.length > 0 && (
          <div className="flex h-[3px] shrink-0" aria-hidden="true">
            {signalBars.map((c) => (
              <span key={c} className={cn('h-full flex-1', c)} />
            ))}
          </div>
        )}

        {/* The same band the planner wizard and the day comparison open with, since this dialog is
            one press from both. The day stepper sits in it, away from the close button's corner.
            */}
        <DialogHero
          icon={CalendarDays}
          title={title}
          titleLines={2}
          titleClassName="capitalize"
          describesDialog
          descriptionClassName="flex items-center gap-2"
          description={
            <>
              {isClosed ? (
                <Ban className="h-3.5 w-3.5 shrink-0 text-red-500" />
              ) : day.status === 'UNKNOWN' ? (
                <HelpCircle className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              ) : (
                <Clock className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              )}
              <span>{statusLabel}</span>
              {day.isToday && (
                <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                  {tCommon('today')}
                </span>
              )}
            </>
          }
          actions={
            onNavigate ? (
              <>
                {/* `secondary`, not the row's usual `outline`: an outline button is translucent in
                    dark mode, and the band's watermark showed through the arrows. */}
                <Button
                  variant="secondary"
                  size="icon"
                  className="shrink-0"
                  onClick={() => onNavigate(-1)}
                  aria-label={t('dayDetail.prevDay')}
                  title={t('dayDetail.prevDay')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="shrink-0"
                  onClick={() => onNavigate(1)}
                  aria-label={t('dayDetail.nextDay')}
                  title={t('dayDetail.nextDay')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            ) : undefined
          }
        />

        <div
          className={cn(
            'flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5 transition-opacity',
            navigating && 'opacity-50'
          )}
          aria-busy={navigating}
        >
          {day.status === 'OPERATING' && day.hours && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span className="text-foreground font-medium">
                <ParkTimeRange
                  openingTime={day.hours.openingTime}
                  closingTime={day.hours.closingTime}
                  parkTimezone={parkTimezone}
                  locale={locale}
                  showSuffix
                />
              </span>
              {(day.isEstimated || day.hours.isInferred) && (
                <span className="text-[11px]">
                  ({t('calendarView.details.schedule.estimatedHours')})
                </span>
              )}
            </div>
          )}

          {/* The ticket price lives here, not in the grid cell: as the one optional row there, it
              kept the cell from having a fixed height. */}
          {day.ticket?.price && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Ticket className="h-4 w-4" />
              <span className="text-foreground font-medium tabular-nums">
                {day.ticket.price.amount} {day.ticket.price.currency}
              </span>
            </div>
          )}

          {/* The panel the grid's tile leads into, with the same tint and wait time the cell
              showed. */}
          {day.crowdLevel && day.crowdLevel !== 'closed' && (
            <section
              className={cn(
                'flex flex-col gap-3 rounded-xl border p-4',
                panelLevel ? CROWD_TILE_CLASS[panelLevel] : 'bg-muted/30 border-border/60'
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3">
                <div className="min-w-0">
                  <h3 className="text-muted-foreground text-xs font-semibold tracking-[0.06em] uppercase">
                    {t('calendarView.details.crowd.title')}
                  </h3>
                  <p
                    className={cn(
                      'mt-1.5 text-xl leading-none font-bold',
                      panelLevel ? CROWD_TEXT_CLASS[panelLevel] : 'text-muted-foreground'
                    )}
                  >
                    {t(`crowdLevels.${meaningLevel}`)}
                  </p>
                </div>
                {avgWait !== null && (
                  <div className="min-w-0 text-right">
                    <h3 className="text-muted-foreground text-xs font-semibold tracking-[0.06em] uppercase">
                      {t('avgWaitTime')}
                    </h3>
                    <p
                      className={cn(
                        'mt-1.5 text-xl leading-none font-bold tabular-nums',
                        panelLevel ? CROWD_TEXT_CLASS[panelLevel] : 'text-muted-foreground'
                      )}
                    >
                      {avgWait} {tCommon('min')}
                    </p>
                  </div>
                )}
              </div>
              {/* Today splits in two: `todayCrowdLevel` is what the day has measured so far,
                  `crowdLevel` its forecast. The panel is tinted by the forecast, so the measured
                  half gets its own badge. */}
              {showLiveSplit && (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">{t('crowdNow')}</span>
                    <CrowdLevelBadge level={day.todayCrowdLevel} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                      {t('dayDetail.forecastLabel')}
                    </span>
                    <CrowdLevelBadge level={day.crowdLevel} />
                  </div>
                </div>
              )}
              {showMeaning && (
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t(`crowdMeaning.${meaningLevel}`)}
                </p>
              )}
              {showLiveSplit && (
                <Link
                  href="/fancast"
                  className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-xs font-medium transition-colors"
                >
                  {t('dayDetail.fancastLink')}
                  <ChevronRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              )}
            </section>
          )}

          {/* Headliner waits — actual averages on past days, forecast on today/future */}
          {hasForecast && (
            <section className="flex flex-col gap-2">
              <h3 className="text-muted-foreground text-xs font-semibold tracking-[0.06em] uppercase">
                {forecast!.actual ? t('dayDetail.actualWaitsTitle') : t('headlinerForecastTitle')}
              </h3>
              <ul className="flex flex-col gap-1.5">
                {forecast!.rides.map((r) => {
                  const band = r.uncertaintyMinutes ?? null;
                  const hasBand = band !== null && Number.isFinite(band);
                  return (
                    <li key={r.attractionId} className="flex items-center justify-between gap-4">
                      <span className="truncate text-sm">{r.name}</span>
                      {/* `items-baseline` keeps the row at the number's height, so days with and
                          without a band are the same height while stepping with ←/→. */}
                      <span className="flex shrink-0 items-baseline gap-1.5">
                        <span className="text-foreground text-sm font-semibold tabular-nums">
                          ~{r.waitTime} {tCommon('min')}
                        </span>
                        {/* The spread belongs to a prediction, so an `actual` day gets no slot at
                            all, as the planner does for a ticked-off stop. */}
                        {!forecast!.actual && (
                          <span className="text-muted-foreground text-xs tabular-nums">
                            {hasBand
                              ? t('dayDetail.waitBand', { minutes: band })
                              : t('dayDetail.waitBandUnknown')}
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {!heroShowsAvgWait && (
                <p className="text-muted-foreground border-border/50 mt-0.5 border-t pt-2 text-xs">
                  {t('avgWaitTime')}: Ø {roundWaitTo5(forecast!.avgWait)} {tCommon('min')}
                </p>
              )}
            </section>
          )}

          {hourly.length > 0 && (
            <section className="flex flex-col gap-2">
              <h3 className="text-muted-foreground text-xs font-semibold tracking-[0.06em] uppercase">
                {t('dayDetail.hourlyTitle')}
              </h3>
              <div className="flex items-end gap-1" style={{ height: 72 }}>
                {hourly.map((h) => {
                  const pct = maxHourlyWait > 0 ? (h.predictedWaitTime / maxHourlyWait) * 100 : 0;
                  const label = formatInTimeZone(h.instant, parkTimezone, 'HH');
                  return (
                    <div key={h.hour} className="flex flex-1 flex-col items-center gap-1">
                      <div className="flex h-12 w-full items-end justify-center">
                        <div
                          className={`w-full rounded-t ${CROWD_BAR_COLOR[h.crowdLevel] ?? 'bg-slate-400'}`}
                          style={{ height: `${Math.max(pct, 6)}%` }}
                          title={`${label}:00 · ~${roundWaitTo5(h.predictedWaitTime)} ${tCommon('min')}`}
                        />
                      </div>
                      <span className="text-muted-foreground text-[9px] tabular-nums">{label}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {day.weather && (
            <section className="flex flex-col gap-2">
              <h3 className="text-muted-foreground text-xs font-semibold tracking-[0.06em] uppercase">
                {t('calendarView.details.weather.title')}
              </h3>
              <div className="flex items-center gap-3">
                {createElement(getWeatherConfig(day.weather.icon).icon, {
                  className: 'h-7 w-7 text-sky-500',
                })}
                <div className="text-sm">
                  <p className="font-medium">
                    {t(`weather.${getWeatherConfig(day.weather.icon).label}`)}
                  </p>
                  <p className="text-muted-foreground">
                    <Temp celsius={day.weather.tempMin} /> – <Temp celsius={day.weather.tempMax} />
                    {day.weather.apparentTemp != null && (
                      <>
                        {' · '}
                        {t('weather.feelsLike')} <Temp celsius={day.weather.apparentTemp} />
                      </>
                    )}
                  </p>
                </div>
              </div>
              {(() => {
                const w = day.weather!;
                const metrics: { icon: typeof Wind; label: string; value: string }[] = [];
                const precip = w.precipitationMm ?? w.rainChance;
                if (precip != null && precip > 0) {
                  metrics.push({
                    icon: Droplets,
                    label: t('weather.precipLabel'),
                    value: `${precip} mm`,
                  });
                }
                if (w.snowMm != null && w.snowMm > 0) {
                  metrics.push({
                    icon: Snowflake,
                    label: t('weather.snowLabel'),
                    value: `${w.snowMm} cm`,
                  });
                }
                if (w.windMax != null && w.windMax > 0) {
                  metrics.push({
                    icon: Wind,
                    label: t('weather.windLabel'),
                    value: `${Math.round(w.windMax)} km/h`,
                  });
                }
                if (w.humidity != null) {
                  metrics.push({
                    icon: Droplets,
                    label: t('weather.humidityLabel'),
                    value: `${w.humidity}%`,
                  });
                }
                if (metrics.length === 0) return null;
                return (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
                    {metrics.map((m) => (
                      <div
                        key={m.label}
                        className="text-muted-foreground flex items-center gap-1.5 text-xs"
                      >
                        <m.icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-foreground font-medium tabular-nums">{m.value}</span>
                        <span className="truncate">{m.label}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </section>
          )}

          {hasHolidayContext && (
            <section className="flex flex-col gap-2">
              <h3 className="text-muted-foreground text-xs font-semibold tracking-[0.06em] uppercase">
                {t('dayDetail.holidaysTitle')}
              </h3>
              {localChips.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {localChips.map((c) => (
                    <span
                      key={c.label}
                      className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${c.className}`}
                    >
                      <c.icon className="h-3 w-3" />
                      {c.label}
                    </span>
                  ))}
                </div>
              )}
              {showNeighbor && (
                <div className="border-border/50 mt-1 border-t pt-2">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    <Luggage className="h-3.5 w-3.5" />
                    {t('influencingHolidays')}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    {t('influencingHolidaysBody')}
                  </p>
                  <div className="mt-2.5 flex flex-col gap-2">
                    {neighborGroups.map((g) => (
                      <div key={g.countryCode} className="flex flex-col gap-1">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                          {g.flag && <span aria-hidden="true">{g.flag}</span>}
                          {g.countryName}
                        </p>
                        {g.regions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pl-5">
                            {g.regions.map((r) => (
                              <span
                                key={r}
                                className="rounded-md border border-amber-300/60 bg-amber-50/50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-300"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Last on purpose: the decision this acts on is made by reading the forecast, the waits
            and the weather above it. Only on a day the park is open, since planning a closed day is
            planning nothing. */}
        {planner && day.status === 'OPERATING' && day.date >= todayInPark && (
          <div className="border-border/60 shrink-0 border-t p-5">
            <PlanDayButtonLazy
              parkSlug={planner.parkSlug}
              parkName={planner.parkName}
              geo={planner.geo}
              date={day.date}
              timezone={parkTimezone}
              // Close the dialog on the way out. It is modal, so the planner opened behind it was
              // unreachable, and the reader was left on the one park page with no ride cards to
              // drag from.
              onPlanned={() => onOpenChange(false)}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
