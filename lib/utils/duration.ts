/**
 * Short „minutes" and „hours" labels per locale. A static map, because `Intl.NumberFormat` with
 * `style: 'unit'` is inconsistent across runtimes for narrow displays.
 */
const SHORT_LABELS: Record<string, { min: string; hr: string }> = {
  en: { min: 'min', hr: 'h' },
  de: { min: 'Min.', hr: 'Std.' },
  fr: { min: 'min', hr: 'h' },
  it: { min: 'min', hr: 'h' },
  nl: { min: 'min', hr: 'u' },
  es: { min: 'min', hr: 'h' },
};

/**
 * A duration in whole minutes as a compact string: „42 Min." under an hour, „1:35 h" from there,
 * which reads faster than „336 Min.".
 */
export function formatShortDuration(minutes: number, locale: string): string {
  const labels = SHORT_LABELS[locale] ?? SHORT_LABELS.en;
  if (minutes < 60) {
    return `${minutes} ${labels.min}`;
  }
  const h = Math.floor(minutes / 60);
  const m = String(minutes % 60).padStart(2, '0');
  return `${h}:${m} ${labels.hr}`;
}

/**
 * Whole hours with the locale's short hour label („2 Std.", „2 h", „2 u"), for an axis tick. Not
 * for a measured span, which keeps the h:mm form even on a round hour.
 */
export function formatWholeHours(hours: number, locale: string): string {
  const labels = SHORT_LABELS[locale] ?? SHORT_LABELS.en;
  return `${hours} ${labels.hr}`;
}

/** A day. Past it, `h:mm` stops reading as a duration. */
const CLOCK_LIKE_LIMIT_MIN = 24 * 60;

/**
 * Same as {@link formatShortDuration}, for spans that can run past a day (an outage counted in
 * operating minutes can). From 24 hours on, „44:10 Std." reads like a time of day, so it becomes
 * whole hours („44 Std.").
 */
export function formatSpanDuration(minutes: number, locale: string): string {
  if (minutes < CLOCK_LIKE_LIMIT_MIN) return formatShortDuration(minutes, locale);
  const labels = SHORT_LABELS[locale] ?? SHORT_LABELS.en;
  return `${Math.round(minutes / 60)} ${labels.hr}`;
}
