/**
 * Route guards for the `/[locale]/...` tree.
 *
 * `proxy.ts` deliberately skips every path containing a dot so files in `public/`
 * are served untouched. A MISSING file still falls through to the App Router
 * though, and the `[locale]` segment happily swallows the filename:
 *
 *   /media/<park>/<photo>.jpg → /[locale]/parks/[continent]/[country]
 *   /ads.txt                         → /[locale]  (the homepage)
 *
 * `i18n/request.ts` then silently falls back to `en` instead of rejecting the
 * segment, so the page rendered happily and fired its backend fetches before
 * 404ing — two calls for the country page, six for the homepage. Confirmed on
 * production via `x-matched-path: /[locale]/parks/[continent]/[country]`, and in
 * the API log as `GET /v1/discovery/continents/phantasialand/taron-16x9.jpg`.
 *
 * Checking the segments before any fetch turns that into a free 404.
 */

import { notFound } from 'next/navigation';
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
 */
export function isServableRoute(locale: string, ...slugs: string[]): boolean {
  return isValidLocale(locale) && slugs.every((slug) => GEO_SLUG_RE.test(slug));
}

/**
 * `isServableRoute` as a guard — 404s before a single backend call is made.
 * Belongs at the very top of the page component, right after `await params`.
 */
export function assertServableRoute(locale: string, ...slugs: string[]): void {
  if (!isServableRoute(locale, ...slugs)) {
    notFound();
  }
}
