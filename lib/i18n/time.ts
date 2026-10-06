/**
 * Time Formatting Utilities
 *
 * Helper functions for formatting time with proper pluralization
 */

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

/**
 * Compact duration ("7 Std. 9 Min." / "7 h 9 min") for tight spots like the header countdown,
 * where the verbose {@link formatDuration} ("7 Stunden 9 Minuten") wraps awkwardly. Uses the
 * abbreviated, count-independent common.hourShort / common.minuteShort labels.
 */
export function formatDurationShort(
  diffMs: number,
  t: (key: string, values?: Record<string, string | number | Date>) => string
): string {
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0 && minutes > 0) return `${hours} ${t('hourShort')} ${minutes} ${t('minuteShort')}`;
  if (hours > 0) return `${hours} ${t('hourShort')}`;
  return `${minutes} ${t('minuteShort')}`;
}
