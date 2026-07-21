'use client';

import { createElement, useState } from 'react';
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
} from 'lucide-react';
import type { CalendarDay, CrowdLevel } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
import {
  getEventIcon,
  getWeatherIconFromCode,
  getWeatherTranslationKey,
} from '@/lib/utils/calendar-utils';

const DATE_LOCALES = { de, en: enUS, es, fr, it, nl } as const;

/** Bar colour per crowd level for the hourly forecast mini-chart — mirrors the
 *  CrowdLevelBadge colour story (teal→emerald→green, then orange→rose→red). */
const CROWD_BAR_COLOR: Record<string, string> = {
  very_low: 'bg-teal-400',
  low: 'bg-emerald-400',
  moderate: 'bg-green-500',
  high: 'bg-orange-400',
  very_high: 'bg-rose-400',
  extreme: 'bg-red-500',
  unknown: 'bg-slate-400',
};

const CROWD_MEANING_LEVELS: readonly CrowdLevel[] = [
  'very_low',
  'low',
  'moderate',
  'high',
  'very_high',
  'extreme',
];

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
}: ParkCalendarDayDetailProps) {
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

  // On today the calendar overrides crowdLevel with the LIVE occupancy; the ML
  // forecast lives in predictedCrowdLevel. Split them so both are legible.
  const showLiveSplit =
    day.isToday &&
    !!day.predictedCrowdLevel &&
    day.crowdLevel !== 'closed' &&
    day.predictedCrowdLevel !== day.crowdLevel;
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
    const name = day.events?.find((e) => e.type === 'holiday')?.name;
    localChips.push({
      icon: PartyPopper,
      label: name || t('holiday'),
      className:
        'border-orange-400/60 bg-orange-50/60 text-orange-700 dark:border-orange-500/40 dark:bg-orange-950/30 dark:text-orange-300',
    });
  }
  if (day.isSchoolHoliday || day.isSchoolVacation) {
    localChips.push({
      icon: Backpack,
      label: t('schoolVacation'),
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

          {/* Crowd forecast + what it means */}
          {day.crowdLevel && day.crowdLevel !== 'closed' && (
            <section className="flex flex-col gap-2">
              <h3 className="text-muted-foreground text-xs font-semibold tracking-[0.06em] uppercase">
                {t('calendarView.details.crowd.title')}
              </h3>
              {showLiveSplit ? (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">{t('crowdNow')}</span>
                    <CrowdLevelBadge level={day.crowdLevel} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                      {t('dayDetail.forecastLabel')}
                    </span>
                    <CrowdLevelBadge level={day.predictedCrowdLevel} />
                  </div>
                </div>
              ) : (
                <CrowdLevelBadge level={day.crowdLevel} className="self-start" />
              )}
              {showMeaning && (
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t(`crowdMeaning.${meaningLevel}`)}
                </p>
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
                      ~{r.waitTime} min
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground border-border/50 mt-0.5 border-t pt-2 text-xs">
                {t('avgWaitTime')}: Ø {forecast!.avgWait} min
              </p>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
