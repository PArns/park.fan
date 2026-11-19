'use client';

import { Fragment, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { PlaneLanding, PlaneTakeoff, ThermometerSun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatParkDay, formatParkDayRange } from '@/lib/utils/park-day';
import { HEAT_CHIP_CLASS, STORM_SIGNAL_CLASS } from '@/lib/utils/day-signal-styles';
import { sentenceCase } from '@/lib/utils/sentence-case';
import { Temp } from '@/components/common/unit-display';
import type { TripPlan } from '@/lib/trip-regions/plan';
import { isHotDay, tripCounts, tripHeat, tripStorm } from '@/lib/trip-regions/plan-copy';
import { stormCodeOn, stormSignal } from '@/lib/trip-regions/date-facts';
import { planStays } from '@/lib/trip-regions/plan-stays';
import { RIBBON_GRID } from '../wizard/plan-ribbon';
import { usePlanContext } from './plan-context';
import { ClimateChips } from './plan-day-bits';
import { useBaseName } from './plan-place-words';
import { MoveIcon, StayMarker } from './plan-stay-band';

/**
 * The trip's head: its dates as the heading, its figures in one line („17 Tage · 6 Parktage ·
 * 8 Tage frei · 2 Städte“; a rest day the visitor's rule set is counted apart from the free ones),
 * and on a trip across cities the route strip: the arrival, each stay with its number, city and
 * nights, the mode of each move between them, the departure. The strip is a picture of the line
 * read out before it. Under the figures, the weather band where heat or a storm season touches the
 * trip (`PlanWeatherBand`). `actions` stand beside the dates, `tickets` right under the figures.
 */
export function PlanResultHead({
  plan,
  actions,
  tickets,
}: {
  plan: TripPlan;
  actions?: ReactNode;
  tickets?: ReactNode;
}) {
  const t = useTranslations('tripPlanner');
  const { locale } = usePlanContext();
  const baseName = useBaseName();
  const counts = tripCounts(plan);
  const stays = planStays(plan);
  const figures = [
    t('result.head.days', { count: counts.days }),
    t('result.head.parkDays', { count: counts.parkDays }),
    counts.freeDays > 0 ? t('result.head.freeDays', { count: counts.freeDays }) : null,
    counts.restDays > 0 ? t('result.head.restDays', { count: counts.restDays }) : null,
    stays.length > 1 ? t('result.head.cities', { count: stays.length }) : null,
  ].filter(Boolean);
  const modeTo = (from: string, to: string) =>
    plan.days.find((d) => d.move?.from === from && d.move.to === to)?.move?.mode ?? 'rail';

  return (
    <div className="flex flex-col gap-2" data-plan-head="">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 flex-col gap-2">
          <h3 className="text-xl font-semibold tracking-tight lg:text-2xl">
            {formatParkDayRange(locale, plan.meta.from, plan.meta.to, {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })}
          </h3>
          <p className="text-muted-foreground text-sm">{figures.join(' · ')}</p>
        </div>
        {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
      </div>
      {tickets}
      <PlanWeatherBand plan={plan} />
      {stays.length > 1 && (
        <div className="border-border/60 bg-card flex items-center gap-2 rounded-full border px-3 py-2">
          <span className="sr-only">
            {t('result.head.routeLabel', {
              stays: stays
                .map((s) => t('route.stayShort', { city: baseName(s.base), count: s.nights }))
                .join(', '),
            })}
          </span>
          <PlaneLanding className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
          {stays.map((stay, i) => (
            <Fragment key={stay.base}>
              {i > 0 && (
                <span aria-hidden="true" className="flex min-w-4 flex-1 items-center gap-1">
                  <span className="bg-primary/40 h-px flex-1" />
                  <MoveIcon
                    mode={modeTo(stays[i - 1].base, stay.base)}
                    className="text-primary-ink size-4 shrink-0"
                  />
                  <span className="bg-primary/40 h-px flex-1" />
                </span>
              )}
              <span aria-hidden="true" className="flex min-w-0 shrink items-center gap-1.5">
                <StayMarker number={stay.number} />
                <span className="truncate text-sm font-medium">{baseName(stay.base)}</span>
                <span className="text-muted-foreground text-xs tabular-nums">{stay.nights}</span>
              </span>
            </Fragment>
          ))}
          <PlaneTakeoff className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

/**
 * The trip's weather in one band: the hot park days as chips, by the basis of their figure („1
 * heißer Parktag, typisch 32 °C“), and the storm season as one chip, its strongest code with the
 * date it starts or ends inside the trip. Under them a ruler of the trip's days, the ribbon's
 * geometry, the hot park days marked and the season running beneath as one band: a picture of the
 * chips, so hidden from a screen reader. A note says what a normal and a season are. Drawn only
 * where heat or a storm season touches the trip; without the API's figures the chip keeps the
 * count alone.
 */
function PlanWeatherBand({ plan }: { plan: TripPlan }) {
  const t = useTranslations('tripPlanner');
  const tClimate = useTranslations('tripPlanner.climate');
  const { region, locale } = usePlanContext();
  const dates = plan.days.map((d) => d.date);
  const heat = tripHeat(plan);
  const storm = tripStorm(dates, region.weather);
  if (heat.length === 0 && !storm) return null;
  const forecastFrom = plan.meta.heat?.forecastFromC;
  const shortDate = (date: string) =>
    formatParkDay(locale, date, { day: 'numeric', month: 'short' });
  const season = storm ? sentenceCase(tClimate(storm.code)) : null;
  const notes = [
    storm && t('weather.stormNote'),
    heat.some((g) => g.basis === 'climate_normal') && t('weather.normalNote'),
  ].filter(Boolean);

  return (
    <div
      className="border-border/60 bg-card flex flex-col gap-2.5 rounded-xl border px-3 py-2.5"
      data-plan-weather=""
    >
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {heat.map((group) => (
          <ClimateChips
            key={group.basis ?? 'none'}
            size="md"
            codes={['extreme_heat']}
            texts={{
              extreme_heat: (
                <span>
                  {t('weather.heatDays', { count: group.count })}
                  {group.basis === 'forecast' && forecastFrom !== undefined && (
                    <>
                      {', '}
                      {t.rich('weather.heatForecast', {
                        temp: () => <Temp celsius={forecastFrom} withUnit />,
                      })}
                    </>
                  )}
                  {group.basis === 'climate_normal' && group.maxC !== null && (
                    <>
                      {', '}
                      {t.rich('weather.heatNormal', {
                        count: group.count,
                        temp: () => <Temp celsius={group.maxC as number} withUnit />,
                      })}
                    </>
                  )}
                </span>
              ),
            }}
          />
        ))}
        {storm && season && (
          <ClimateChips
            size="md"
            codes={[storm.code]}
            texts={{
              [storm.code]: storm.from
                ? t('weather.stormFrom', { season, date: shortDate(storm.from) })
                : storm.until
                  ? t('weather.stormUntil', { season, date: shortDate(storm.until) })
                  : season,
            }}
          />
        )}
      </p>
      <div aria-hidden="true" className="flex flex-col gap-1">
        <div className={RIBBON_GRID.className} style={RIBBON_GRID.style(plan.days.length)}>
          {plan.days.map((day) => {
            const parkDay = day.kind === 'park' || day.kind === 'hop';
            const hot = parkDay && isHotDay(day);
            return (
              <span
                key={day.date}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 rounded-md text-[10px] leading-none tabular-nums sm:gap-1',
                  hot
                    ? cn(HEAT_CHIP_CLASS, 'font-semibold')
                    : parkDay
                      ? 'bg-muted/60'
                      : 'text-muted-foreground'
                )}
              >
                {hot && <ThermometerSun className="size-3" />}
                {Number(day.date.slice(8, 10))}
              </span>
            );
          })}
        </div>
        {storm && (
          <div className="flex">
            {dates.map((date) => {
              const code = stormCodeOn(date, region.weather);
              return (
                <span
                  key={date}
                  className={cn('h-1 flex-1', code && STORM_SIGNAL_CLASS[stormSignal(code)])}
                />
              );
            })}
          </div>
        )}
      </div>
      {notes.length > 0 && <p className="text-muted-foreground text-xs">{notes.join(' ')}</p>}
    </div>
  );
}
