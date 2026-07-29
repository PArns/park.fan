import {
  formatTemp,
  formatWindSpeed,
  formatPrecip,
  formatSpeed,
  formatTrackLength,
  formatRiderHeight,
} from '@/lib/utils/temperature';

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

/** Ride top speed from a km/h value, e.g. "80 km/h" / "50 mph". */
export function Speed({ kmh }: { kmh: number }) {
  return (
    <>
      <span className="u-metric">{formatSpeed(kmh, 'C')}</span>
      <span className="u-imperial">{formatSpeed(kmh, 'F')}</span>
    </>
  );
}

/** Track length, height or drop from a metres value, e.g. "768 m" / "2520 ft". */
export function TrackLength({ meters }: { meters: number }) {
  return (
    <>
      <span className="u-metric">{formatTrackLength(meters, 'C')}</span>
      <span className="u-imperial">{formatTrackLength(meters, 'F')}</span>
    </>
  );
}

/**
 * Rider height from a centimetres value, e.g. "140 cm" / "55 in".
 *
 * The one measurement on the page a visitor may need to act on — whether their
 * child may ride — so it follows the same C/F choice as everything else rather
 * than making an American parent convert centimetres in the queue.
 */
export function RiderHeight({ cm }: { cm: number }) {
  return (
    <>
      <span className="u-metric">{formatRiderHeight(cm, 'C')}</span>
      <span className="u-imperial">{formatRiderHeight(cm, 'F')}</span>
    </>
  );
}
