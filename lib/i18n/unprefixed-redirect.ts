import { defaultLocale, isValidLocale, locales, type Locale } from '@/i18n/config';
import { PARK_CALENDAR_SEGMENTS } from '@/lib/parks/calendar-segments';
import { PARK_STATS_SEGMENTS } from '@/lib/parks/stats-segments';
import { PARK_KIDS_SEGMENTS } from '@/lib/parks/kids-segments';

/**
 * Where a path without a locale prefix goes, when the answer does not depend on the visitor.
 * Google finds such paths in the RSC payload, where `Link` hrefs travel unprefixed, and
 * next-intl answers them with a 307 to `/en/…` for Googlebot (no `Accept-Language`), which is a
 * 404 when the park sub-page segment belongs to another locale.
 *
 * - A path whose park sub-page segment belongs to one locale goes to that locale, permanently.
 * - Any other path asked without `Accept-Language` goes to the default locale, as next-intl would,
 *   and permanently for that request (`Vary: Accept-Language` in `proxy.ts`).
 * - Everything else, and `/`, returns `null` for next-intl to negotiate.
 *
 * Runs after `next.config.ts` `redirects()`, which already handles the unprefixed glossary,
 * best-time, guide and planner segments.
 */

/** A park sub-page segment (calendar, wait-time record, "with kids") → the one locale that uses it. */
const PARK_SUBPAGE_SEGMENT_LOCALE: ReadonlyMap<string, Locale> = new Map(
  locales.flatMap((locale) => [
    [PARK_CALENDAR_SEGMENTS[locale], locale] as const,
    [PARK_STATS_SEGMENTS[locale], locale] as const,
    [PARK_KIDS_SEGMENTS[locale], locale] as const,
  ])
);

/**
 * The locale-prefixed path to send `pathname` to with a 308, or `null` to let next-intl negotiate.
 *
 * @param hasAcceptLanguage whether the request carried an `Accept-Language` header at all
 */
export function unprefixedPathRedirect(
  pathname: string,
  hasAcceptLanguage: boolean
): string | null {
  if (pathname === '/') return null;

  const parts = pathname.split('/');
  if (isValidLocale(parts[1])) return null;

  // '', 'parks', continent, country, city, park, sub-page segment, …
  const segmentLocale =
    parts[1] === 'parks' && parts.length >= 7
      ? PARK_SUBPAGE_SEGMENT_LOCALE.get(parts[6])
      : undefined;
  const locale = segmentLocale ?? (hasAcceptLanguage ? null : defaultLocale);

  return locale ? `/${locale}${pathname}` : null;
}
