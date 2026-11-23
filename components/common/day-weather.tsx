import { createElement } from 'react';
import { Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { getWeatherConfig } from '@/lib/utils/weather-utils';
import { Temp } from '@/components/common/unit-display';
import {
  isClimateNormal,
  type ClimateSpreadData,
  type DayWeatherData,
} from '@/lib/utils/day-weather';

/**
 * Two temperatures as one range, „15–19°“, or one figure where both round alike in the reader's
 * unit; `null` when either is missing.
 */
export function TempRange({ low, high }: { low?: number; high?: number }) {
  if (low == null || high == null) return null;
  return Math.round(low) === Math.round(high) ? (
    <Temp celsius={(low + high) / 2} />
  ) : (
    <>
      <Temp celsius={low} />–<Temp celsius={high} />
    </>
  );
}

/**
 * A day's weather in one short line, the same token in every calendar. A forecast: its condition
 * icon and the low–high („9–18°“) in the foreground ink. The date's average over past years: „Ø“
 * and the range half of such days' highs fell in („Ø 15–19°“), muted and without an icon, so the two
 * tell apart at a glance and an average never reads as the day's forecast; a screen reader hears
 * what it is. `compact`, for a phone's narrow day columns: the forecast's icon and high, an
 * average's „Ø 17°“. The token sets its own ink, so a muted tile floor cannot flatten the
 * difference. `null` without a temperature.
 */
export function DayWeather({
  weather,
  compact = false,
  className,
}: {
  weather: DayWeatherData | null | undefined;
  compact?: boolean;
  className?: string;
}) {
  const t = useTranslations('dayWeather');
  if (!weather || weather.tempMax == null) return null;
  if (isClimateNormal(weather)) {
    return (
      <span
        className={cn(
          'text-muted-foreground inline-block whitespace-nowrap tabular-nums',
          className
        )}
        data-weather-basis="climate_normal"
        title={t('normal')}
      >
        Ø{compact ? '' : ' '}
        {!compact && weather.tempMaxP25 != null && weather.tempMaxP75 != null ? (
          <TempRange low={weather.tempMaxP25} high={weather.tempMaxP75} />
        ) : (
          <Temp celsius={weather.tempMax} />
        )}
        <span className="sr-only">{t('normal')}</span>
      </span>
    );
  }
  return (
    <span
      className={cn('text-foreground/80 inline-flex items-center gap-1', className)}
      data-weather-basis="forecast"
    >
      {weather.icon != null &&
        createElement(getWeatherConfig(weather.icon).icon, {
          className: 'size-3.5 shrink-0',
          'aria-hidden': true,
        })}
      <span className="tabular-nums">
        {!compact && weather.tempMin != null ? (
          <>
            <Temp celsius={weather.tempMin} />–<Temp celsius={weather.tempMax} />
          </>
        ) : (
          <Temp celsius={weather.tempMax} />
        )}
      </span>
    </span>
  );
}

/**
 * Several days' average over past years as one label across them, drawn as a dimension line: a
 * tick, a rule, „Ø 8–12°“, a rule, a tick (`weatherRuns` gives the envelope of the days' ranges).
 * One day is the plain {@link DayWeather}. A screen reader hears how many days it covers.
 */
export function WeatherSpan({
  weather,
  days,
  className,
}: {
  weather: DayWeatherData | null | undefined;
  days: number;
  className?: string;
}) {
  const t = useTranslations('dayWeather');
  if (days <= 1 || !isClimateNormal(weather)) {
    return <DayWeather weather={weather} className={className} />;
  }
  const line = 'bg-muted-foreground/40';
  return (
    <span className={cn('flex w-full items-center', className)}>
      <span aria-hidden className={cn('h-2 w-px shrink-0', line)} />
      <span aria-hidden className={cn('h-px flex-1', line)} />
      <span
        className="text-muted-foreground px-1.5 tabular-nums"
        title={t('normalSpan', { count: days })}
      >
        Ø{' '}
        {weather?.tempMaxP25 != null && weather.tempMaxP75 != null ? (
          <TempRange low={weather.tempMaxP25} high={weather.tempMaxP75} />
        ) : weather?.tempMax != null ? (
          <Temp celsius={weather.tempMax} />
        ) : null}
        <span className="sr-only">{t('normalSpan', { count: days })}</span>
      </span>
      <span aria-hidden className={cn('h-px flex-1', line)} />
      <span aria-hidden className={cn('h-2 w-px shrink-0', line)} />
    </span>
  );
}

/**
 * A climate normal spelled out for a day's detail: „Tagsüber meist 15–19°, nachts meist 7–11°“, how
 * often such a day brings rain, and what the figures are (`period`, the years averaged). The means
 * stand in for a range the API does not send yet.
 */
export function ClimateNormalDetail({
  weather,
  period,
  className,
}: {
  weather: ClimateSpreadData;
  period?: string;
  className?: string;
}) {
  const t = useTranslations('dayWeather');
  const rangeOf = (low?: number, high?: number, mean?: number) =>
    low != null && high != null ? (
      <TempRange low={low} high={high} />
    ) : mean != null ? (
      <Temp celsius={mean} />
    ) : null;
  const highs = rangeOf(weather.tempMaxP25, weather.tempMaxP75, weather.tempMax);
  const lows = rangeOf(weather.tempMinP25, weather.tempMinP75, weather.tempMin);
  return (
    <div className={cn('flex flex-col gap-1 text-sm', className)}>
      <p className="font-medium tabular-nums">
        {t.rich('typicalHigh', { range: () => highs })}
        {lows && (
          <>
            {', '}
            {t.rich('typicalLow', { range: () => lows })}
          </>
        )}
      </p>
      {weather.wetDayPercent != null && (
        <p className="text-muted-foreground">
          {t('wetDays', { count: Math.round(weather.wetDayPercent / 10) })}
        </p>
      )}
      <p className="text-muted-foreground text-xs">
        {period ? t('detailNote', { period: period.replace('-', '–') }) : t('normal')}
      </p>
    </div>
  );
}

/**
 * The weather key of a calendar, the two tokens as the cells draw them: a forecast's icon with
 * „Vorhersage“, and „Ø“ with „Durchschnitt vergangener Jahre, keine Vorhersage“.
 */
export function WeatherKey({ className }: { className?: string }) {
  const t = useTranslations('dayWeather');
  return (
    <span
      className={cn('inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]', className)}
    >
      <span className="text-foreground/80 inline-flex items-center gap-1 whitespace-nowrap">
        <Sun className="size-3.5 shrink-0" aria-hidden="true" />
        {t('keyForecast')}
      </span>
      <span className="text-muted-foreground whitespace-nowrap">{t('keyNoPeriod')}</span>
    </span>
  );
}
