import { defaultLocale, isValidLocale, locales, type Locale } from '@/i18n/config';
import { PARK_CALENDAR_SEGMENTS } from '@/lib/parks/calendar-segments';
import { PARK_STATS_SEGMENTS } from '@/lib/parks/stats-segments';

/**
 * Where a path without a locale prefix goes, when the answer does not depend on the visitor.
 *
 * **Where these URLs come from.** Nothing in the HTML links an unprefixed path — every `<a>` the
 * site renders carries `/<locale>/`. But `Link` from `@/i18n/navigation` takes a locale-RELATIVE
 * `href` and prefixes it while rendering, and the prop as written travels in the RSC payload
 * (`self.__next_f.push(…)`) at the end of every document: a French park page carried 32 strings
 * like `/parks/europe/france/plailly/parc-asterix` there and none in its anchors (measured
 * 2026-09-24). Google lifts URLs out of inline scripts, so it requests them. Search Console's crawl
 * stats for 2026-06-26…2026-09-22 count 5.9 % of all Googlebot requests as temporary redirects,
 * and 971 of the 981 example URLs were unprefixed.
 *
 * **What next-intl answered.** A 307 to the locale `Accept-Language` picks. Googlebot sends no
 * `Accept-Language`, so that was `/en/…` every time, under a status that tells Google to keep
 * the old URL and ask again. Worse, a park sub-page segment is itself localized: the payload of a
 * French page holds `/parks/…/calendrier-temps-attente/2026/5`, and `/en/…/calendrier-temps-attente`
 * is not a route — so 305 of those 981 examples were a 307 followed by a 404.
 *
 * **What this answers instead, and only where it can.**
 *
 * - A path whose park sub-page segment belongs to one locale goes to that locale, whoever asks.
 *   The segment names the language, so the answer is a property of the URL and may be permanent.
 * - Any other path, asked without `Accept-Language`, goes to the default locale. That is exactly
 *   what next-intl would have answered, and without the header there is nothing to negotiate, so
 *   it is permanent for that request. The response carries `Vary: Accept-Language` (`proxy.ts`).
 * - Everything else returns `null`: a visitor's browser always sends the header, and next-intl's
 *   307 still picks their language. `/` is left alone too, as the caching docs require.
 *
 * Runs after `next.config.ts` `redirects()`, which already sends the unprefixed glossary,
 * best-time, guide and planner segments to their locale.
 */

/** A park sub-page segment (calendar, wait-time record) → the one locale that uses it. */
const PARK_SUBPAGE_SEGMENT_LOCALE: ReadonlyMap<string, Locale> = new Map(
  locales.flatMap((locale) => [
    [PARK_CALENDAR_SEGMENTS[locale], locale] as const,
    [PARK_STATS_SEGMENTS[locale], locale] as const,
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
