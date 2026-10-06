'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarDays, CloudOff, Clock, Droplets, TreePalm } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { Precip, Temp } from '@/components/common/unit-display';
import { getWeatherConfig } from '@/lib/utils/weather-utils';
import type { PlanDay } from '@/lib/api/types';

/** What the panel knows about the day, which is not the same as what it holds. */
export type PlannerDayState = 'loading' | 'error' | 'empty' | 'ready';

interface PlannerContextBandProps {
  day: PlanDay | null;
  state: PlannerDayState;
  /**
   * Rendered at the end of the band's chip row: the party chip, which is the same kind of statement
   * about the day and would otherwise cost the axis a line of its own.
   */
  trailing?: ReactNode;
}

/**
 * One reserved box for every state, so loading, empty and ready do not move the grid under a
 * pointer. 60 px is the skeleton: 12 px of padding, a 22.5 px badge row, a 4 px gap and a 16.5 px
 * second row. A minimum the ready state can exceed, so the typical error goes into the tier's
 * sentence and "derived" into the hours chip rather than into rows of their own. One constant so
 * the skeleton and the settled state cannot drift.
 */
const BAND_CLASS = 'flex min-h-[60px] flex-col justify-center gap-1 px-3 py-1.5 planner-phone:py-1';

/**
 * Below this a day is dry: Open-Meteo reports hundredths of a millimetre on dry days, and "0,1 mm"
 * beside a drop reads as rain.
 */
const WET_MM = 0.2;

/**
 * What kind of day this is, above the plan: facts about the date that explain the numbers below,
 * such as a bridge day, a holiday next door, or rain at four.
 *
 * Past the forecast's reach it says so, since a missing forecast and a dry day otherwise look the
 * same. Temperatures render in both units with `.u-metric`/`.u-imperial`, like everywhere else on
 * the site. Four states, so "could not fetch", "no forecast" and "still fetching" are told apart.
 */
export function PlannerContextBand({ day, state, trailing }: PlannerContextBandProps) {
  const t = useTranslations('planner');
  const tWeather = useTranslations('parks.weather');

  if (state === 'loading') {
    return (
      <div className={cn(BAND_CLASS, 'animate-pulse')} aria-hidden="true">
        <div className="bg-muted/50 h-4 w-40 rounded" />
        <div className="bg-muted/40 h-4 w-56 rounded" />
      </div>
    );
  }

  if (state !== 'ready' || !day) {
    return (
      <div data-planner-context-band="" className={BAND_CLASS}>
        <p className="text-muted-foreground text-xs">
          {state === 'error' ? t('error') : t('noPlan')}
        </p>
      </div>
    );
  }

  const { context, tier } = day;
  const hours =
    context.openHour !== null && context.closeHour !== null
      ? t('context.hours', {
          open: String(context.openHour).padStart(2, '0'),
          close: String(context.closeHour).padStart(2, '0'),
        })
      : null;

  /**
   * Whether anybody has ever checked how wrong the forecast is this far out. Not on an `observed`
   * day: it also answers `basis: 'unmeasured'`, but its figures are measurements.
   */
  const unmeasured = tier !== 'observed' && day.accuracy?.basis === 'unmeasured';

  /**
   * The day's own typical error, rounded to the minute. A typical error, not a bound, so it is
   * worded "typically N minutes off" and never as a `±` interval. Folded into the tier's hint so
   * the band keeps its height, and only where the basis is measured.
   */
  const typicalError =
    !unmeasured && typeof day.accuracy?.typicalError === 'number'
      ? Math.round(day.accuracy.typicalError)
      : null;

  /**
   * The opening hours were derived from measurements rather than published, which happens past a
   * park's publication horizon and is narrower than the truth by construction, so the chip says so.
   */
  const observedHours = context.hoursSource === 'observed';

  // `observed` first: on a day that already happened the figures are not a forecast.
  const tierLabel =
    tier === 'observed'
      ? t('tier.observed')
      : unmeasured
        ? t('tier.unmeasured')
        : tier === 'measured'
          ? t('tier.measured')
          : tier === 'composed'
            ? t('tier.composed')
            : t('tier.longRange');

  const tierHint =
    tier === 'observed'
      ? t('tier.observedHint')
      : unmeasured
        ? t('tier.unmeasuredHint')
        : tier === 'measured'
          ? typicalError !== null
            ? t('tier.measuredHintError', { minutes: typicalError })
            : t('tier.measuredHint')
          : tier === 'composed'
            ? typicalError !== null
              ? t('tier.composedHintError', { minutes: typicalError })
              : t('tier.composedHint')
            : t('tier.longRangeHint');

  const crowd = context.crowdLevel;
  const hasCrowd = Boolean(crowd) && crowd !== 'closed';

  const weather = context.weather ?? null;
  // The condition label comes from the WMO code, never from the API's `condition` string, which is
  // the provider's English.
  const conditions = weather ? getWeatherConfig(weather.icon) : null;
  const rainMm = weather ? (weather.precipitationMm ?? weather.rainChance) : 0;

  return (
    <div data-planner-context-band="" className={BAND_CLASS}>
      <div className="flex flex-wrap items-center gap-1.5">
        {hasCrowd && <CrowdLevelBadge level={crowd} />}

        {/* A day with no published hours says so, since every figure depends on the opening. The
            "derived" note sits inside the hours chip, because it is about these hours and as a
            badge it would cost the band a line. */}
        <span
          className="text-muted-foreground inline-flex items-center gap-1 text-xs"
          title={observedHours && hours ? t('context.hoursObservedHint') : undefined}
        >
          <Clock className="size-3" />
          {hours ?? t('day.noHours')}
          {observedHours && hours && (
            <span className="text-muted-foreground/70">{t('context.hoursObserved')}</span>
          )}
        </span>

        {context.isHoliday && (
          <Badge variant="outline" className="text-[11px]">
            {t('context.holiday')}
          </Badge>
        )}
        {context.isBridgeDay && (
          <Badge variant="outline" className="text-[11px]">
            {t('context.bridgeDay')}
          </Badge>
        )}
        {context.isSchoolVacation && (
          <Badge variant="outline" className="text-[11px]">
            {t('context.schoolVacation')}
          </Badge>
        )}
        {/* Not on a phone: the column head already prints the weekday, and this chip pushed the
            wrapping row onto a second line. `planner-phone:`, not `max-sm:`, so a landscape phone
            counts as narrow too. */}
        {context.isWeekend && (
          <Badge variant="outline" className="planner-phone:hidden text-[11px]">
            {t('context.weekend')}
          </Badge>
        )}
        {/* A palm on a phone, the words everywhere else, so the chip row stays on one line at
            360 px. The words stay for screen readers (`sr-only`) and in the `title`. */}
        {context.neighborHolidays && context.neighborHolidays.length > 0 && (
          <Badge
            variant="outline"
            className="planner-phone:px-1.5 text-[11px]"
            title={t('context.neighborHolidays')}
            data-planner-neighbor-holidays=""
          >
            <TreePalm className="planner-wide:hidden size-3" aria-hidden="true" />
            <span className="planner-phone:sr-only">{t('context.neighborHolidays')}</span>
          </Badge>
        )}

        {/* Last on the chip row, not the prose row below, which already wraps at 448 px. */}
        {trailing}
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
        {weather && conditions ? (
          <span className="text-muted-foreground inline-flex items-center gap-1">
            <conditions.icon className={cn('size-3.5', conditions.color)} />
            <span className="text-foreground/80">{tWeather(conditions.label)}</span>
            <span className="font-mono tabular-nums">
              <Temp celsius={weather.tempMin} />
              {' – '}
              <Temp celsius={weather.tempMax} />
            </span>
            {rainMm >= WET_MM && (
              <span className="inline-flex items-center gap-0.5">
                <Droplets className="size-3 text-sky-400" />
                <span className="font-mono tabular-nums">
                  <Precip mm={rainMm} />
                </span>
              </span>
            )}
          </span>
        ) : (
          <span className="text-muted-foreground inline-flex items-center gap-1">
            <CloudOff className="size-3" />
            {t('context.weatherUnknown')}
          </span>
        )}

        <span className="text-muted-foreground inline-flex items-center gap-1">
          <CalendarDays className="size-3" />
          <span className="text-foreground/80 font-medium">{tierLabel}</span>
          {/* `planner-phone:`, not `max-sm:`, for the reason the weekend chip gives. */}
          <span className="planner-phone:sr-only">{tierHint}</span>
        </span>
      </div>
    </div>
  );
}
