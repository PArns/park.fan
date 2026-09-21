import { isValidLocale } from '@/i18n/config';

/**
 * Geo slugs the API serves are strictly lowercase alphanumerics + dashes — verified
 * across every continent/country/city/park/attraction segment the API publishes
 * (7012 attractions, no exceptions). Anything else (a dot above all) is a URL the
 * backend can never resolve.
 */
const GEO_SLUG_RE = /^[a-z0-9-]+$/;

/**
 * True when a `/[locale]/...` URL can possibly resolve: the locale is one we serve
 * and every geo segment passed is slug-shaped. Call with just the locale on routes
 * that take no geo params. Use this in `generateMetadata`, which must return a
 * value rather than throw.
 *
 * It sits in its own module, apart from the `notFound()` guard built on it in
 * `./route-guards`, because `proxy.ts` asks the same question and must not pull
 * `next/navigation` into the middleware bundle to do it.
 */
export function isServableRoute(locale: string, ...slugs: string[]): boolean {
  return isValidLocale(locale) && slugs.every((slug) => GEO_SLUG_RE.test(slug));
}
