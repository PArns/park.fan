/**
 * Unit-system switch for the weather UI. We surface this as a "C / F" toggle
 * to the user, but the choice also drives the secondary units:
 *   - C → metric (km/h, mm)
 *   - F → imperial (mph, in)
 * so a user that picks Fahrenheit also gets the rest of the US-style units
 * they'd expect alongside it.
 */
export type TemperatureUnit = 'C' | 'F';

/**
 * ISO 3166-1 alpha-2 region codes whose country uses Fahrenheit for
 * everyday weather. Anything else (incl. locales with no region tag
 * like plain "en" or "de") falls back to Celsius.
 */
const FAHRENHEIT_REGIONS = new Set(['US', 'MM', 'LR', 'BS', 'KY', 'PW']);

/**
 * Pick a sensible default temperature unit based on the region tag of the
 * user's *primary* browser language. We parse the region from the locale
 * (`en-US` → `US`) and only flip to Fahrenheit when that region is in the
 * known-Fahrenheit list. A locale without a region (`en`, `de`) and the
 * rest of `navigator.languages` are ignored on purpose — using the full
 * preference list produces too many false positives.
 *
 * SSR-safe: returns 'C' when navigator is unavailable.
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

// ---- Temperature ----------------------------------------------------------

/** Convert a Celsius value into the user's chosen unit. */
export function convertTemp(celsius: number, unit: TemperatureUnit): number {
  return unit === 'F' ? (celsius * 9) / 5 + 32 : celsius;
}

/** Format a Celsius value as a rounded "15°" / "59°" string in the chosen unit. */
export function formatTemp(celsius: number, unit: TemperatureUnit): string {
  return `${Math.round(convertTemp(celsius, unit))}°`;
}

// ---- Wind speed -----------------------------------------------------------

/** Convert km/h into the unit-system pairing (km/h for metric, mph for imperial). */
export function convertWindSpeed(kmh: number, unit: TemperatureUnit): number {
  return unit === 'F' ? kmh * 0.621371 : kmh;
}

/** Format a km/h value as "20 km/h" or "12 mph" depending on the chosen unit. */
export function formatWindSpeed(kmh: number, unit: TemperatureUnit): string {
  const value = Math.round(convertWindSpeed(kmh, unit));
  return unit === 'F' ? `${value} mph` : `${value} km/h`;
}

// ---- Precipitation --------------------------------------------------------

/** Convert mm into mm (metric) or inches (imperial). */
export function convertPrecip(mm: number, unit: TemperatureUnit): number {
  return unit === 'F' ? mm * 0.0393701 : mm;
}

/**
 * Format a mm value as "0.8mm" (metric) or "0.03in" (imperial).
 * Imperial uses 2 decimals since most live weather values are sub-inch.
 */
export function formatPrecip(mm: number, unit: TemperatureUnit): string {
  if (unit === 'F') {
    return `${convertPrecip(mm, unit).toFixed(2)} in`;
  }
  return `${mm} mm`;
}
