'use client';

import type { ReactNode } from 'react';
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
  /**
   * Rendered at the end of the band's second row.
   *
   * The party chip used to have a line of its own under this band — 30 px of
   * panel for one 22 px pill. It belongs on the badge row: it is the same kind
   * of statement about the day and the same shape of control, and the panel's
   * subject is the axis below, which was getting 324 px of 950.
   */
  trailing?: ReactNode;
}

/**
 * One reserved box for every state — this panel is on every page, and the three
 * it can render (loading, empty, ready) must not move the grid under a pointer
 * when one flips to another. 60 px is the skeleton: 12 px of padding, a 22.5 px
 * badge row, a 4 px gap and a 16.5 px second row.
 *
 * It is a MINIMUM and the ready state exceeds it, which is worth knowing before
 * anybody adds a word here. Measured with the payload held at the route until
 * the skeleton had settled, Phantasialand today and Heide Park on 2026-11-30 (a
 * date past its published season, so no weather and derived hours):
 *
 *                       390 px phone        448 px panel
 *   today               60 → 60             60 → 75.5
 *   derived hours       60 → 103.5          60 → 92
 *
 * The phone hides the tier's hint (`max-sm:sr-only`), which is why the common
 * case costs nothing there and 15.5 px in the panel. The rest is the chip row
 * wrapping, exactly as it does on a day carrying four badges. Two things were
 * kept out of this box because of those numbers: the day's typical error is
 * folded into the tier's own sentence rather than standing beside it (a
 * separate span measured 60 → 75.5 on the phone), and "the hours are derived"
 * is a two-word suffix inside the hours chip rather than a badge of its own (a
 * badge measured 92 → 120 in the panel).
 */
const BAND_CLASS = 'flex min-h-[60px] flex-col justify-center gap-1 px-3 py-1.5';

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
   * Whether anybody has ever checked how wrong the forecast is this far out.
   *
   * `observed` is excluded, and that is the whole trap in this field: a day that
   * has already happened also answers `basis: 'unmeasured'` — nothing predicted
   * it, so nothing verified a prediction — while its figures are MEASUREMENTS.
   * Reading the basis there would put "nobody has checked these numbers" under a
   * day whose numbers are the only ones on this panel that are facts.
   *
   * Everywhere else it is the honest bottom of the ladder, and it is what the
   * `long_range` tier turned into: measured across six lead times at
   * Phantasialand on 2026-09-04, days 0 to 41 answer `measured`, day 87 answers
   * `unmeasured`, and `long_range` never came back at all.
   */
  const unmeasured = tier !== 'observed' && day.accuracy?.basis === 'unmeasured';

  /**
   * The day's own typical error, rounded to the minute it is displayed in.
   *
   * A TYPICAL error and not a bound — half the days fall further out — so it is
   * worded as "typically N minutes off" and never as a `±` interval that
   * contains the answer, the same rule the per-ride figure in the selection bar
   * follows.
   *
   * It goes INTO the tier's hint rather than beside it, and that is a height
   * decision rather than a wording one: this band reserves one box for all four
   * of its states, and a separate span for the figure measured 60 → 75.5 px on a
   * 390 px phone and 75.5 → 92 px in the 448 px panel, i.e. the grid below
   * stepping down by that much the moment the payload landed. Folded into the
   * sentence it replaces the tier's generic explanation with a specific one at
   * roughly the same length, and the box does not move.
   *
   * Only where the basis is measured: there is nothing to round otherwise, and
   * deriving a figure from the tier would be the panel measuring its own
   * accuracy.
   */
  const typicalError =
    !unmeasured && typeof day.accuracy?.typicalError === 'number'
      ? Math.round(day.accuracy.typicalError)
      : null;

  /**
   * The opening hours were DERIVED from measurements rather than published.
   *
   * It happens past a park's publication horizon — Heide Park answers
   * `observed` with 10:00–16:00 and `status: UNKNOWN` for 2026-11-30 — and the
   * window is narrower than the truth by construction, because it can only span
   * hours somebody recorded. So the chip beside the hours says where they came
   * from; without it the panel states a closing time the park never published.
   */
  const observedHours = context.hoursSource === 'observed';

  // `observed` first, because it is the one that is not a forecast: on a day
  // that already happened the figures are what the queues actually did, and
  // calling that "Stundenprognose" would be the panel predicting the past.
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
  // The condition label comes from the WMO code, never from the API's own
  // `condition` string: that one is the provider's English, and it shipped as
  // "Overcast" on a German page elsewhere in this app.
  const conditions = weather ? getWeatherConfig(weather.icon) : null;
  const rainMm = weather ? (weather.precipitationMm ?? weather.rainChance) : 0;

  return (
    <div data-planner-context-band="" className={BAND_CLASS}>
      <div className="flex flex-wrap items-center gap-1.5">
        {hasCrowd && <CrowdLevelBadge level={crowd} />}

        {/* A day with no published hours is not the same as a day nobody asked
            about: every figure below depends on when the park opens, so the
            absence is stated rather than left as a missing line. */}
        {/* Inside the hours chip and not a badge beside it: it is a statement
            ABOUT these hours, and among the holiday badges it would read as
            another fact about the date. It also costs the band a line as a
            badge — measured 75.5 → 103.5 px at 390 px — where a suffix in the
            same span usually fits on the row that is already there. */}
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

        {/* Last on the CHIP row, not on the prose row below it: the second row
            already carries the weather and the tier and wraps at 448 px, and a
            third line there costs the axis 22 px. A chip among chips. */}
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
          <span className="max-sm:sr-only">{tierHint}</span>
        </span>
      </div>
    </div>
  );
}
