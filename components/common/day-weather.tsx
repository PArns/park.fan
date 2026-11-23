import { createElement } from 'react';
import { History } from 'lucide-react';
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
 * A day's weather in one short line. A forecast: its icon and the low–high („9–18°“). The date's
 * average over past years: a history mark, „Ø“ and the range half of such days' highs fell in
 * („Ø 15–19°“), muted and without a weather icon, so it never reads as the day's forecast; a screen
 * reader hears what it is. `compact`, for a phone's narrow day columns: the forecast's icon and
 * high, a normal's „Ø 17°“. `null` without a temperature.
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
        className={cn('text-muted-foreground inline-flex items-center gap-1', className)}
        data-weather-basis="climate_normal"
        title={t('normal')}
      >
        {!compact && <History className="size-3 shrink-0" aria-hidden="true" />}
        <span className="tabular-nums">
          Ø{compact ? '' : ' '}
          {!compact && weather.tempMaxP25 != null && weather.tempMaxP75 != null ? (
            <TempRange low={weather.tempMaxP25} high={weather.tempMaxP75} />
          ) : (
            <Temp celsius={weather.tempMax} />
          )}
        </span>
        <span className="sr-only">{t('normal')}</span>
      </span>
    );
  }
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {weather.icon != null &&
        createElement(getWeatherConfig(weather.icon).icon, {
          className: 'size-3 shrink-0',
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
 * The key under a calendar whose days show averages: „Ø Schnitt 2015–2024 für das Datum, keine
 * Vorhersage“ with the history mark the days carry.
 */
export function ClimateNormalKey({ period, className }: { period?: string; className?: string }) {
  const t = useTranslations('dayWeather');
  return (
    <span
      className={cn(
        'text-muted-foreground inline-flex items-center gap-1.5 text-xs whitespace-nowrap',
        className
      )}
    >
      <History className="size-3 shrink-0" aria-hidden="true" />
      {period ? t('key', { period: period.replace('-', '–') }) : t('keyNoPeriod')}
    </span>
  );
}
