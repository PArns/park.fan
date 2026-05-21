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
