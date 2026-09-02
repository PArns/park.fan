'use client';

import { useTranslations } from 'next-intl';
import { CalendarDays, CloudOff, Clock, Droplets } from 'lucide-react';
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
}

/** Fixed height whatever it holds — this panel is on every page. */
const BAND_CLASS = 'flex min-h-[76px] flex-col justify-center gap-2 px-3 py-2';

/**
 * Below this a day is dry. Open-Meteo reports a few hundredths of a millimetre
 * on days nobody would call wet, and "0,1 mm" next to a rain drop reads as a
 * forecast of rain.
 */
const WET_MM = 0.2;

/**
 * What kind of day this is, above the plan.
 *
 * Everything here is a fact about the date rather than about the plan, and each
 * one is a reason the numbers below look the way they do: a bridge day, a school
 * holiday in the region next door, rain at four.
 *
 * The weather is the interesting case. It reaches about two weeks and then stops,
 * and the API does not substitute a climate normal — so past that this says the
 * forecast does not reach, rather than leaving a gap that reads as "no rain
 * expected". A missing forecast and a dry day look identical otherwise.
 *
 * Temperatures render in BOTH units with the global `.u-metric`/`.u-imperial`
 * pair, like every other temperature on the site. This panel is client-only, so
 * it could read the preference directly — but then it would be the one surface
 * whose unit came from React state instead of from the attribute, and the
 * document's own toggle would stop agreeing with it.
 *
 * Four states, not two. A panel that pulses forever is a panel claiming to be
 * loading, and the difference between "we could not fetch this", "this park and
 * day have no forecast" and "still fetching" is exactly what a visitor needs to
 * know before deciding whether to wait.
 */
export function PlannerContextBand({ day, state }: PlannerContextBandProps) {
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
      <div className={BAND_CLASS}>
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

  const tierLabel =
    tier === 'measured'
      ? t('tier.measured')
      : tier === 'composed'
        ? t('tier.composed')
        : t('tier.longRange');

  const tierHint =
    tier === 'measured'
      ? t('tier.measuredHint')
      : tier === 'composed'
        ? t('tier.composedHint')
        : t('tier.longRangeHint');

  const crowd = context.crowdLevel;
  const hasCrowd = Boolean(crowd) && crowd !== 'closed';

  const weather = context.weather ?? null;
  // The condition label comes from the WMO code, never from the API's own
  // `condition` string: that one is the provider's English, and it shipped as
  // "Overcast" on a German page elsewhere in this app.
  const conditions = weather ? getWeatherConfig(weather.icon) : null;
  const rainMm = weather ? (weather.precipitationMm ?? weather.rainChance) : 0;

  return (
    <div className={BAND_CLASS}>
      <div className="flex flex-wrap items-center gap-1.5">
        {hasCrowd && <CrowdLevelBadge level={crowd} />}

        {hours && (
          <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
            <Clock className="size-3" />
            {hours}
          </span>
        )}

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
        {context.isWeekend && (
          <Badge variant="outline" className="text-[11px]">
            {t('context.weekend')}
          </Badge>
        )}
        {context.neighborHolidays && context.neighborHolidays.length > 0 && (
          <Badge variant="outline" className="text-[11px]">
            {t('context.neighborHolidays')}
          </Badge>
        )}
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
          <span className="max-sm:sr-only">{tierHint}</span>
        </span>
      </div>
    </div>
  );
}
