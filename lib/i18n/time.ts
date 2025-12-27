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
