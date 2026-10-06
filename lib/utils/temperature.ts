/**
 * The site's unit system, shown as a „C / F" toggle: C is metric (km/h, mm, m, cm), F imperial
 * (mph, in, ft), including ride speed, length and rider height. One toggle, one system.
 */
export type TemperatureUnit = 'C' | 'F';

/**
 * ISO 3166-1 alpha-2 regions that use Fahrenheit for everyday weather. Anything else, including a
 * locale with no region („en", „de"), gets Celsius.
 */
const FAHRENHEIT_REGIONS = new Set(['US', 'MM', 'LR', 'BS', 'KY', 'PW']);

/**
 * The default unit from the region of the browser's *primary* language (`en-US` → `US`). The rest
 * of `navigator.languages` is ignored, since it produces false positives. `'C'` on the server.
 */
export function detectDefaultUnit(): TemperatureUnit {
  if (typeof navigator === 'undefined') return 'C';
  const primary = navigator.language;
  if (!primary) return 'C';

  let region: string | undefined;
  try {
    region = new Intl.Locale(primary).region;
  } catch {
    // Malformed locale tag: fall back to a quick split on the first '-'.
    const parts = primary.split('-');
    if (parts.length > 1) region = parts[1];
  }

  return region && FAHRENHEIT_REGIONS.has(region.toUpperCase()) ? 'F' : 'C';
}

/** Convert a Celsius value into the user's chosen unit. */
function convertTemp(celsius: number, unit: TemperatureUnit): number {
  return unit === 'F' ? (celsius * 9) / 5 + 32 : celsius;
}

/** Format a Celsius value as a rounded "15°" / "59°" string in the chosen unit. */
export function formatTemp(celsius: number, unit: TemperatureUnit): string {
  return `${Math.round(convertTemp(celsius, unit))}°`;
}

/** Convert km/h into the unit-system pairing (km/h for metric, mph for imperial). */
export function convertWindSpeed(kmh: number, unit: TemperatureUnit): number {
  return unit === 'F' ? kmh * 0.621371 : kmh;
}

/** Format a km/h value as "20 km/h" or "12 mph" depending on the chosen unit. */
export function formatWindSpeed(kmh: number, unit: TemperatureUnit): string {
  const value = Math.round(convertWindSpeed(kmh, unit));
  return unit === 'F' ? `${value} mph` : `${value} km/h`;
}

/** Convert mm into mm (metric) or inches (imperial). */
function convertPrecip(mm: number, unit: TemperatureUnit): number {
  return unit === 'F' ? mm * 0.0393701 : mm;
}

/** Format a mm value as „0.8 mm" or „0.03 in"; two decimals, since most values are sub-inch. */
export function formatPrecip(mm: number, unit: TemperatureUnit): string {
  if (unit === 'F') {
    return `${convertPrecip(mm, unit).toFixed(2)} in`;
  }
  return `${mm} mm`;
}

const M_TO_FT = 3.28084;
const CM_TO_IN = 0.393701;

/**
 * Top speed from a km/h value: „80 km/h" or „50 mph". Separate from {@link formatWindSpeed} so a
 * precision change to one does not silently change the other.
 */
export function formatSpeed(kmh: number, unit: TemperatureUnit): string {
  const value = Math.round(unit === 'F' ? kmh * 0.621371 : kmh);
  return unit === 'F' ? `${value} mph` : `${value} km/h`;
}

/**
 * Track length or height from metres: „768 m" or „2520 ft". Not the km/mi switch `Distance` uses
 * for how far away a park is: a coaster is measured in metres and feet however long it is.
 */
export function formatTrackLength(meters: number, unit: TemperatureUnit): string {
  const value = unit === 'F' ? meters * M_TO_FT : meters;
  // One decimal only below 100: „26.2 m" is a figure, „2519.7 ft" false precision.
  const rounded = value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;
  return unit === 'F' ? `${rounded} ft` : `${rounded} m`;
}

/** Rider height from a centimetres value: "140 cm" / "55 in". */
export function formatRiderHeight(cm: number, unit: TemperatureUnit): string {
  return unit === 'F' ? `${Math.round(cm * CM_TO_IN)} in` : `${cm} cm`;
}

/** Ride duration from seconds: „2:20", the same in every unit system. */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}
