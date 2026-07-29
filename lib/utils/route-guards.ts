/**
 * Route guards for the `/[locale]/parks/...` tree.
 *
 * `proxy.ts` deliberately skips every path containing a dot so files in `public/`
 * are served untouched. A MISSING file still falls through to the App Router
 * though, and `/images/parks/<park>/<photo>.jpg` matches
 * `/[locale]/parks/[continent]/[country]` with locale="images". `i18n/request.ts`
 * then silently falls back to `en` instead of rejecting the segment, so the page
 * rendered happily and fired one to two backend requests per miss before 404ing
 * (confirmed on production via `x-matched-path: /[locale]/parks/[continent]/[country]`,
 * and in the API log as `GET /v1/discovery/continents/phantasialand/taron-16x9.jpg`).
 *
 * Checking the segments before any fetch turns that into a free 404.
 */

import { notFound } from 'next/navigation';
import { isValidLocale } from '@/i18n/config';

/**
 * Geo slugs the API serves are strictly lowercase alphanumerics + dashes — verified
 * across the whole `/v1/discovery/geo` tree (210 parks, no exceptions). Anything else
 * (a dot above all) is a URL the backend can never resolve.
 */
const GEO_SLUG_RE = /^[a-z0-9-]+$/;

/**
 * True when a `/[locale]/parks/...` URL can possibly resolve: the locale is one we
 * serve and every geo segment is slug-shaped. Use this in `generateMetadata`, which
 * must return a value rather than throw.
 */
export function isServableParkRoute(locale: string, ...slugs: string[]): boolean {
  return isValidLocale(locale) && slugs.every((slug) => GEO_SLUG_RE.test(slug));
}

/**
 * `isServableParkRoute` as a guard — 404s before a single backend call is made.
 * Belongs at the very top of the page component, right after `await params`.
 */
export function assertServableParkRoute(locale: string, ...slugs: string[]): void {
  if (!isServableParkRoute(locale, ...slugs)) {
    notFound();
  }
}
