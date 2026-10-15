import { getNumberFormat } from '@/lib/utils/intl-format';

/**
 * Compact suffixes the engines disagree on. Node 22 (CLDR 47) prints Italian millions as "Mln",
 * Chromium as "Mio", so the server text and the client text differed and React threw #418 on /it.
 * Pinned to the newer spelling; a locale is added here only after two engines were seen to differ.
 */
const COMPACT_SUFFIX_OVERRIDES: Record<string, Record<string, string>> = {
  it: { Mln: 'Mio', Mld: 'Mrd' },
};

/**
 * A large number in the locale's short form: „4.9M" in English, „4,9 Mio." in German, at most one
 * decimal. Uses the cached formatter, since card grids format one figure per card.
 */
export function formatCompact(value: number, locale: string): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '0';
  const format = getNumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 });
  const overrides = COMPACT_SUFFIX_OVERRIDES[locale];
  if (!overrides) return format.format(value);
  return format
    .formatToParts(value)
    .map((part) => (part.type === 'compact' ? (overrides[part.value] ?? part.value) : part.value))
    .join('');
}
