import { getNumberFormat } from '@/lib/utils/intl-format';

/**
 * A large number in the locale's short form: „4.9M" in English, „4,9 Mio." in German, at most one
 * decimal. Uses the cached formatter, since card grids format one figure per card.
 */
export function formatCompact(value: number, locale: string): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '0';
  return getNumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}
