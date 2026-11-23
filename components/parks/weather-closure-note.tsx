'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Snowflake, ThermometerSnowflake } from 'lucide-react';
import type { WeatherClosure } from '@/lib/api/types';
import { useTemperatureUnit } from '@/lib/contexts/temperature-unit-context';
import { weatherClosureLine, weatherClosureTemps } from '@/lib/parks/weather-closure';
import { formatShowClock } from '@/lib/push/show-clock';
import { RideStatusBlock } from './ride-status-block';

/**
 * „Vermutlich wegen Kälte geschlossen (1 °C)" — and whether the forecast gets warm enough today; or
 * „Vermutlich wegen Schnee geschlossen (−1 °C)", the title with its temperature and no second line,
 * since snow promises no clock.
 *
 * It explains the outage or not-run-today line beside it rather than replacing it, so it sits in the
 * same block family in the neutral tone: it states a likely cause, not a fault. The time is the
 * park's clock, as on every other line of the family; temperatures follow the reader's °C/°F choice.
 */
export function WeatherClosureNote({
  weatherClosure,
  timezone,
  variant = 'compact',
  className,
}: {
  weatherClosure: WeatherClosure | null | undefined;
  /** The park's IANA timezone, for the expected opening time. */
  timezone: string | undefined;
  variant?: 'compact' | 'full';
  className?: string;
}) {
  const t = useTranslations('parks.weatherClosure');
  const locale = useLocale();
  const { unit } = useTemperatureUnit();

  const line = weatherClosureLine(weatherClosure);
  if (!line || !weatherClosure) return null;
  const { temp, threshold } = weatherClosureTemps(
    weatherClosure.temperatureC,
    weatherClosure.thresholdC,
    unit,
    locale
  );
  const time = line.expectedOpenAt
    ? formatShowClock(line.expectedOpenAt, timezone ?? null, locale)
    : null;
  const detail =
    line.detail === null || threshold === null
      ? null
      : line.detail === 'opensAt' && time !== null
        ? t('opensAt', { threshold, time })
        : t(line.detail === 'closedToday' ? 'closedToday' : 'threshold', { threshold });

  return (
    <RideStatusBlock
      icon={line.title === 'snow' ? Snowflake : ThermometerSnowflake}
      tone="idle"
      title={t(line.title, { temp })}
      detail={detail}
      variant={variant}
      className={className}
    />
  );
}
