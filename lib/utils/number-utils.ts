import { getNumberFormat } from '@/lib/utils/intl-format';

/**
 * A large number in the locale's short form: "4.9M" in English, "4,9 Mio." in German, "4,9 M" in
 * French. At most one decimal.
 *
 * It replaced a hand-rolled "k/M/B/T" suffix that printed English in all six locales. The
 * formatter is the cached one from `intl-format.ts`, so a card grid formatting a figure per card
 * builds it once.
 */
export function formatCompact(value: number, locale: string): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '0';
  return getNumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}
