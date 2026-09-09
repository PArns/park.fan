/**
 * Locale-aware short labels for "minutes" / "hours". Kept as a static map
 * because we only support six locales and the labels are tiny — pulling
 * from `Intl.NumberFormat({ style: 'unit' })` adds unnecessary surface
 * and gives inconsistent outputs across runtimes for narrow displays.
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
 * Format a duration in whole minutes as a compact, locale-aware string:
 *   - < 60 min → "42 min" / "42 Min." / etc.
 *   - ≥ 60 min → "1:35 h"  (universal h:mm with locale-specific hour label)
 *
 * Used for short-term weather warnings where rendering "336 Min." is
 * harder to parse at a glance than "5:36 h".
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

/** A day. Past it, `h:mm` stops reading as a duration. */
const CLOCK_LIKE_LIMIT_MIN = 24 * 60;

/**
 * Same as {@link formatShortDuration}, for spans that can run past a day.
 *
 * `h:mm` is compact and unambiguous while the hour count stays under 24, and stops being either
 * above it: „44:10 Std." reads as a time of day at a glance, and ten minutes of precision on a
 * span of forty-four hours is noise anyway. Whole hours past the limit — „44 Std." — which is the
 * shape a person would say out loud.
 *
 * The caller with a span that long is the outage clause on a ride card: an outage measured in
 * operating minutes reached 2648 of them on Universal Studios Singapore's Revenge of the Mummy on
 * 2026-09-09, five days into a breakdown.
 */
export function formatSpanDuration(minutes: number, locale: string): string {
  if (minutes < CLOCK_LIKE_LIMIT_MIN) return formatShortDuration(minutes, locale);
  const labels = SHORT_LABELS[locale] ?? SHORT_LABELS.en;
  return `${Math.round(minutes / 60)} ${labels.hr}`;
}
