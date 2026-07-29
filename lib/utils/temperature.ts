/**
 * Unit-system switch for the whole site. We surface this as a "C / F" toggle
 * to the user, but the choice also drives every secondary unit:
 *   - C → metric (km/h, mm, m, cm)
 *   - F → imperial (mph, in, ft)
 * so a user that picks Fahrenheit also gets the rest of the US-style units
 * they'd expect alongside it — including a coaster's speed and length and the
 * height you must be to ride it. One toggle, one system; a page that mixed
 * "59°" with "140 cm" would be nobody's convention.
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

// ---- Ride measurements ----------------------------------------------------

const M_TO_FT = 3.28084;
const CM_TO_IN = 0.393701;

/**
 * Top speed from a km/h value: "80 km/h" / "50 mph".
 *
 * Same conversion as {@link formatWindSpeed} but its own function on purpose —
 * a ride's top speed and a gust are not the same quantity, and one of them
 * changing precision later should not silently change the other.
 */
export function formatSpeed(kmh: number, unit: TemperatureUnit): string {
  const value = Math.round(unit === 'F' ? kmh * 0.621371 : kmh);
  return unit === 'F' ? `${value} mph` : `${value} km/h`;
}

/**
 * Track length or height from a metres value: "768 m" / "2520 ft".
 *
 * Deliberately NOT the km/mi switch `Distance` uses: that one is for how far
 * away a park is, where kilometres are the readable unit. A coaster is
 * measured in metres and feet however long it is.
 */
export function formatTrackLength(meters: number, unit: TemperatureUnit): string {
  const value = unit === 'F' ? meters * M_TO_FT : meters;
  // One decimal only when the number is small enough for it to mean anything:
  // "26.2 m" is a real figure, "2519.7 ft" is false precision.
  const rounded = value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;
  return unit === 'F' ? `${rounded} ft` : `${rounded} m`;
}

/** Rider height from a centimetres value: "140 cm" / "55 in". */
export function formatRiderHeight(cm: number, unit: TemperatureUnit): string {
  return unit === 'F' ? `${Math.round(cm * CM_TO_IN)} in` : `${cm} cm`;
}

/**
 * Ride duration from seconds: "2:20". Unit-independent — no country rides a
 * coaster in anything but minutes and seconds.
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}
