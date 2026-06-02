import { formatTemp, formatWindSpeed, formatPrecip } from '@/lib/utils/temperature';

/**
 * Dual-unit display primitives.
 *
 * Each renders BOTH the metric and imperial rendering of a value; global CSS
 * (`.u-metric` / `.u-imperial`, toggled by `html[data-temp-unit]`) shows exactly
 * one. This lets weather/calendar values be server-rendered in both units so the
 * page can be statically cached and the user's unit applied instantly (no °C→°F
 * hydration flash). `display:none` keeps the hidden unit out of the a11y tree.
 *
 * Pure (no hooks) → usable from both Server and Client Components.
 */

/** Temperature from a Celsius value, e.g. "15°" / "59°". */
export function Temp({ celsius }: { celsius: number }) {
  return (
    <>
      <span className="u-metric">{formatTemp(celsius, 'C')}</span>
      <span className="u-imperial">{formatTemp(celsius, 'F')}</span>
    </>
  );
}

/** Wind speed from a km/h value, e.g. "20 km/h" / "12 mph". */
export function Wind({ kmh }: { kmh: number }) {
  return (
    <>
      <span className="u-metric">{formatWindSpeed(kmh, 'C')}</span>
      <span className="u-imperial">{formatWindSpeed(kmh, 'F')}</span>
    </>
  );
}

/** Precipitation from a mm value, e.g. "0.8 mm" / "0.03 in". */
export function Precip({ mm }: { mm: number }) {
  return (
    <>
      <span className="u-metric">{formatPrecip(mm, 'C')}</span>
      <span className="u-imperial">{formatPrecip(mm, 'F')}</span>
    </>
  );
}

/** Distance/visibility from a metres value, e.g. "5 km" / "3 mi". */
export function Distance({ meters }: { meters: number }) {
  const metric = meters >= 1000 ? `${Math.round(meters / 1000)} km` : `${meters} m`;
  const imperial = `${(meters / 1609).toFixed(meters < 1609 ? 1 : 0)} mi`;
  return (
    <>
      <span className="u-metric">{metric}</span>
      <span className="u-imperial">{imperial}</span>
    </>
  );
}
