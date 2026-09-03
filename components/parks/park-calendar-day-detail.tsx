'use client';

import { createElement, useState } from 'react';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import { useLocale, useTranslations } from 'next-intl';
import { format, parseISO } from 'date-fns';
import { de, enUS, es, fr, it, nl } from 'date-fns/locale';
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
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { ParkTimeRange } from '@/components/common/park-time';
import { Temp } from '@/components/common/unit-display';
import { getRegionLabel, getCountryName, countryFlagEmoji } from '@/lib/utils/region-names';
import { translateHolidayName } from '@/lib/utils/holiday-names';
import {
  getEventIcon,
  getWeatherIconFromCode,
  getWeatherTranslationKey,
} from '@/lib/utils/calendar-utils';

const DATE_LOCALES = { de, en: enUS, es, fr, it, nl } as const;

/**
 * Bar colour per crowd level for the hourly forecast mini-chart.
 *
 * These were six hand-picked Tailwind shades (`bg-teal-400`, `bg-rose-400`, …) chosen to
 * „mirror" the palette, and they missed it: the chart drew `very_high` in rose while every badge,
 * tile and legend on the page drew it in `--crowd-very-high`, an orange. One tier, two colours,
 * one dialog. It reads the palette now, so retuning a shade moves the chart with everything else.
 */
const CROWD_BAR_COLOR: Record<string, string> = {
  ...CROWD_DOT_CLASS,
  unknown: 'bg-muted-foreground/50',
};

const CROWD_MEANING_LEVELS: readonly CrowdLevel[] = CROWD_LEVEL_ORDER;

export interface ParkCalendarDayDetailProps {
  /** The selected day, or null when the dialog is closed (or the target day is still loading). */
  day: CalendarDay | null;
  /** Park IANA timezone — opening hours render in park time (browser-time tooltip on hover). */
  parkTimezone: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Prev/next-day navigation. When provided, chevron buttons flank the title (and ←/→ keys
   * work) so days can be flipped through without leaving the dialog. The parent owns the day
   * switch; while the target day is loading it passes `day={null}` and the dialog keeps
   * showing the previous day dimmed (see `lastDay` below) instead of closing.
   */
  onNavigate?: (direction: -1 | 1) => void;
  /**
   * The park this calendar belongs to. Supplied by the callers that know it, and
   * the only thing gating the "plan this day" control — the dialog itself is
   * given a `CalendarDay`, which names no park.
   */
  planner?: { parkSlug: string; parkName: string; geo: PlannerGeo };
}

/**
 * Click-to-open detail panel for a single crowd-calendar day. Works on touch and
 * pointer devices alike (a Radix Dialog, unlike the calendar's hover tooltips),
 * so mobile users get the full context too. Shows — in priority order — status &
 * hours, the crowd forecast + what it means, the expected headliner waits, an
 * hour-by-hour prediction chart (when available), weather, and the holiday
 * context (local + neighbouring regions) that drives the crowds.
 */
export function ParkCalendarDayDetail({
  day: dayProp,
  parkTimezone,
  open,
  onOpenChange,
  onNavigate,
  planner,
}: ParkCalendarDayDetailProps) {
  // "Today" in the PARK's timezone, not the reader's: the calendar shows a whole
  // month and a visit cannot be planned for a day that has already happened
  // where the park is. `en-CA` because it formats as YYYY-MM-DD, which is what
  // `CalendarDay.date` is and what compares correctly as a string.
  const todayInPark = new Date().toLocaleDateString('en-CA', { timeZone: parkTimezone });
  const t = useTranslations('parks');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const dateLocale = DATE_LOCALES[locale as keyof typeof DATE_LOCALES] ?? enUS;

  // Retain the last non-null day so a nav step (parent fetches the target day → `day` is
  // briefly null) dims the open dialog instead of unmounting it. Render-phase derived-state
  // update (the React-sanctioned pattern) — no effect, no extra frame with stale content.
  const [lastDay, setLastDay] = useState<CalendarDay | null>(dayProp);
  if (dayProp && dayProp !== lastDay) setLastDay(dayProp);
  const day = dayProp ?? (open ? lastDay : null);
  // Target day is in flight: previous content stays visible but dimmed.
  const navigating = open && !dayProp && !!day;

  if (!day) return null;

  const dayDate = parseISO(day.date);
  const title = format(dayDate, 'EEEE, d. MMMM yyyy', { locale: dateLocale });

  const isClosed = day.status === 'CLOSED';
  const statusLabel = isClosed
    ? t('calendarView.details.schedule.closed')
    : day.status === 'UNKNOWN'
      ? t('calendarView.details.schedule.scheduleNotYetAvailable')
      : t('calendarView.details.schedule.open');

  /**
   * On today the dialog can show two numbers, and they answer different questions: what the day
   * was forecast to be, and how it has actually gone so far.
   *
   * The pair used to be `crowdLevel` (a live spot reading the backend wrote over today's cell)
   * against `predictedCrowdLevel`. The override is gone — today's `crowdLevel` IS the forecast
   * now — so the measured half comes from `todayCrowdLevel`, which is what it always was: the
   * day-so-far P50, captured by the backend as its own field precisely so the two could be put
   * side by side and mean something. It is absent on a closed day, on a park too thin to rate,
   * and before the first measurement of the morning, so the row stays conditional.
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

  const hourly = (day.hourly ?? []).filter((h) => h.predictedWaitTime > 0);
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

  // Local holiday chips (public / school / bridge).
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
   * The same three-pixel bar the day's tile in the grid wears, on the dialog's top edge.
   *
   * It is what makes the dialog read as that cell opened up rather than as a separate window:
   * the reader clicked a tile with a yellow-and-amber edge and the panel that comes up carries
   * it. Order matches the legend, so two dialogs never split the bar the other way round.
   */
  const signalBars = [
    day.isSchoolHoliday || day.isSchoolVacation ? 'bg-yellow-500 dark:bg-yellow-400' : null,
    showNeighbor ? 'bg-amber-600 dark:bg-amber-500' : null,
    day.isHoliday || day.isPublicHoliday ? 'bg-red-500 dark:bg-red-400' : null,
    day.isBridgeDay ? 'bg-blue-500 dark:bg-blue-400' : null,
  ].filter((c): c is string => c !== null);

  // The level the panel is TINTED by — the forecast on today (where `crowdLevel` carries the live
  // occupancy and the two are shown side by side), the day's own level otherwise.
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
      <DialogContent
        className="max-h-[85vh] gap-0 overflow-y-auto p-0"
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

        <DialogHeader className="border-border/60 border-b p-5 pb-4">
          <div className="flex items-center gap-3 pr-6">
            {onNavigate && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => onNavigate(-1)}
                aria-label={t('dayDetail.prevDay')}
                title={t('dayDetail.prevDay')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base capitalize sm:text-lg">{title}</DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                {isClosed ? (
                  <Ban className="h-3.5 w-3.5 text-red-500" />
                ) : day.status === 'UNKNOWN' ? (
                  <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
                ) : (
                  <Clock className="h-3.5 w-3.5 text-emerald-500" />
                )}
                <span>{statusLabel}</span>
                {day.isToday && (
                  <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                    {tCommon('today')}
                  </span>
                )}
              </DialogDescription>
            </div>
            {onNavigate && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => onNavigate(1)}
                aria-label={t('dayDetail.nextDay')}
                title={t('dayDetail.nextDay')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div
          className={cn('flex flex-col gap-5 p-5 transition-opacity', navigating && 'opacity-50')}
          aria-busy={navigating}
        >
          {/* Opening hours — park-local time; hover shows the viewer's local time (ParkTime). */}
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

          {/* The ticket price. It used to sit in the grid cell, where it was the one row that
            could appear or not and therefore the one thing stopping the cell from having a fixed
            height — which the reservation in `calendar-grid-geometry` pays for in layout shift.
            It is a detail about one day, and this is the panel for details about one day. */}
          {day.ticket?.price && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Ticket className="h-4 w-4" />
              <span className="text-foreground font-medium tabular-nums">
                {day.ticket.price.amount} {day.ticket.price.currency}
              </span>
            </div>
          )}

          {/* Crowd forecast + what it means — the panel the grid's tile leads into, carrying the
            same tint and the same wait time the cell showed. The level used to be a badge on a
            plain background, which put the dialog's most important line at the same weight as
            the section headings under it. */}
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
                `crowdLevel` the forecast it was given. The panel above is tinted by the
                forecast, so the measured half gets its own badge rather than being folded
                into one word. */}
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
                {forecast!.rides.map((r) => (
                  <li key={r.attractionId} className="flex items-center justify-between gap-4">
                    <span className="truncate text-sm">{r.name}</span>
                    <span className="text-foreground shrink-0 text-sm font-semibold tabular-nums">
                      ~{r.waitTime} {tCommon('min')}
                    </span>
                  </li>
                ))}
              </ul>
              {!heroShowsAvgWait && (
                <p className="text-muted-foreground border-border/50 mt-0.5 border-t pt-2 text-xs">
                  {t('avgWaitTime')}: Ø {roundWaitTo5(forecast!.avgWait)} {tCommon('min')}
                </p>
              )}
            </section>
          )}

          {/* Hour-by-hour prediction */}
          {hourly.length > 0 && (
            <section className="flex flex-col gap-2">
              <h3 className="text-muted-foreground text-xs font-semibold tracking-[0.06em] uppercase">
                {t('dayDetail.hourlyTitle')}
              </h3>
              <div className="flex items-end gap-1" style={{ height: 72 }}>
                {hourly.map((h) => {
                  const pct = maxHourlyWait > 0 ? (h.predictedWaitTime / maxHourlyWait) * 100 : 0;
                  return (
                    <div key={h.hour} className="flex flex-1 flex-col items-center gap-1">
                      <div className="flex h-12 w-full items-end justify-center">
                        <div
                          className={`w-full rounded-t ${CROWD_BAR_COLOR[h.crowdLevel] ?? 'bg-slate-400'}`}
                          style={{ height: `${Math.max(pct, 6)}%` }}
                          title={`${h.hour}:00 · ~${h.predictedWaitTime} min`}
                        />
                      </div>
                      <span className="text-muted-foreground text-[9px] tabular-nums">
                        {h.hour}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Weather */}
          {day.weather && (
            <section className="flex flex-col gap-2">
              <h3 className="text-muted-foreground text-xs font-semibold tracking-[0.06em] uppercase">
                {t('calendarView.details.weather.title')}
              </h3>
              <div className="flex items-center gap-3">
                {createElement(getEventIcon(getWeatherIconFromCode(day.weather.icon)), {
                  className: 'h-7 w-7 text-sky-500',
                })}
                <div className="text-sm">
                  <p className="font-medium">
                    {t(`weather.${getWeatherTranslationKey(day.weather.icon)}`)}
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
              {/* Extra daily metrics — only render the ones the source provides. */}
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

          {/* Holiday context (local + neighbouring regions) */}
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
                  {/* Split by country: a flag + country header, then its regions. */}
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
          {/* Into the planner from here, and LAST in the column on purpose: the
              decision this control acts on is made by reading the crowd
              forecast, the headliner waits and the weather above it. Placed
              under the opening hours it asked for a commitment before the
              dialog had said anything.

              The calendar is where a visitor decides WHICH day, and until now
              that decision had nowhere to go — the planner's own day picker is
              inside a panel they had no reason to have opened yet. Only on a day
              the park is actually open: planning a closed day is planning
              nothing. */}
          {planner && day.status === 'OPERATING' && day.date >= todayInPark && (
            <div>
              <PlanDayButtonLazy
                parkSlug={planner.parkSlug}
                parkName={planner.parkName}
                geo={planner.geo}
                date={day.date}
                timezone={parkTimezone}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
