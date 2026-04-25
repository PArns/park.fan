/**
 * Time Formatting Utilities
 *
 * Helper functions for formatting time with proper pluralization
 */

/**
 * Format minutes with proper pluralization
 *
 * @example
 * formatMinutes(t, 1, locale) // "1 Minute" (de) / "1 minute" (en)
 * formatMinutes(t, 5, locale) // "5 Minuten" (de) / "5 minutes" (en)
 */
export function formatMinutes(
  t: (key: string, values?: Record<string, unknown>) => string,
  count: number
): string {
  return t('minute', { count });
}

/**
 * Format hours with proper pluralization
 *
 * @example
 * formatHours(t, 1, locale) // "1 Stunde" (de) / "1 hour" (en)
 * formatHours(t, 3, locale) // "3 Stunden" (de) / "3 hours" (en)
 */
export function formatHours(
  t: (key: string, values?: Record<string, unknown>) => string,
  count: number
): string {
  return t('hour', { count });
}

/**
 * Format wait time in minutes
 * Shows the count and pluralized unit
 *
 * @example
 * formatWaitTime(t, 15) // "15 Minuten" (de) / "15 minutes" (en)
 * formatWaitTime(t, 1) // "1 Minute" (de) / "1 minute" (en)
 */
export function formatWaitTime(
  t: (key: string, values?: Record<string, unknown>) => string,
  minutes: number
): string {
  return `${minutes} ${t('minute', { count: minutes })}`;
}

/**
 * Format a duration from milliseconds into a human-readable "Xh Ym" string.
 * Uses the common translation namespace for pluralized hour/minute labels.
 *
 * @example
 * formatDuration(5400000, tCommon) // "1 Stunde 30 Minuten" (de) / "1 hour 30 minutes" (en)
 */
export function formatDuration(
  diffMs: number,
  t: (key: string, values?: Record<string, string | number | Date>) => string
): string {
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0 && minutes > 0) {
    return `${hours} ${t('hour', { count: hours })} ${minutes} ${t('minute', { count: minutes })}`;
  } else if (hours > 0) {
    return `${hours} ${t('hour', { count: hours })}`;
  } else {
    return `${minutes} ${t('minute', { count: minutes })}`;
  }
}
