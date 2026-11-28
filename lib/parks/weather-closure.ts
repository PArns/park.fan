import type { WeatherClosure } from '@/lib/api/types';
import { getNumberFormat } from '@/lib/utils/intl-format';
import { convertTemp, type TemperatureUnit } from '@/lib/utils/temperature';

/** The parts of the weather-closure line, each a message of `parks.weatherClosure`. */
export interface WeatherClosureLine {
  title: 'cold' | 'snow';
  /** The second line, or null when there is nothing to say about today (snow). */
  detail: 'opensAt' | 'closedToday' | 'threshold' | null;
  /** Set only with `detail: 'opensAt'`. */
  expectedOpenAt: string | null;
}

/**
 * The parts of the weather-closure line, or `null` when the field says nothing this page can state.
 *
 * Only `cold` and `snow` are read; another cause, or a temperature that is not a number, is treated
 * as absent rather than guessed at. Snow promises no clock, so it gets no second line. For cold, an
 * outlook this page does not know, or `opens_when_warmer` without a time, still names the threshold
 * and nothing about today.
 */
export function weatherClosureLine(
  closure: WeatherClosure | null | undefined
): WeatherClosureLine | null {
  if (!closure || !Number.isFinite(closure.temperatureC)) return null;
  if (closure.cause === 'snow') return { title: 'snow', detail: null, expectedOpenAt: null };
  if (closure.cause !== 'cold' || !Number.isFinite(closure.thresholdC)) return null;
  if (closure.outlook === 'opens_when_warmer' && closure.expectedOpenAt) {
    return { title: 'cold', detail: 'opensAt', expectedOpenAt: closure.expectedOpenAt };
  }
  if (closure.outlook === 'likely_closed_today') {
    return { title: 'cold', detail: 'closedToday', expectedOpenAt: null };
  }
  return { title: 'cold', detail: 'threshold', expectedOpenAt: null };
}

/**
 * The current temperature and the threshold as the line prints them, in the reader's unit.
 *
 * Whole degrees could print „(4 °C) · öffnet meist ab 4 °C" for 3.6 against 4.0, a reason that
 * reads as no reason. So the threshold rounds up, and where the rounded current temperature would
 * not sit below it, the current one keeps a decimal, rounded down.
 */
export function weatherClosureTemps(
  temperatureC: number,
  thresholdC: number | null,
  unit: TemperatureUnit,
  locale: string
): { temp: string; threshold: string | null } {
  const now = convertTemp(temperatureC, unit);
  if (thresholdC === null || !Number.isFinite(thresholdC)) {
    return { temp: `${Math.round(now)} °${unit}`, threshold: null };
  }
  const threshold = Math.ceil(convertTemp(thresholdC, unit));
  const temp =
    Math.round(now) < threshold
      ? String(Math.round(now))
      : getNumberFormat(locale, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(Math.floor(now * 10) / 10);
  return { temp: `${temp} °${unit}`, threshold: `${threshold} °${unit}` };
}
