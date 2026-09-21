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
import { isServableRoute } from './servable-route';

// The predicate lives in `./servable-route` and is re-exported here so every caller keeps one
// import. It was split off when `proxy.ts` started asking the same question: this module imports
// `next/navigation`, and the middleware bundle has no business carrying it.
export { isServableRoute } from './servable-route';

/**
 * `isServableRoute` as a guard — 404s before a single backend call is made.
 * Belongs at the very top of the page component, right after `await params`.
 */
export function assertServableRoute(locale: string, ...slugs: string[]): void {
  if (!isServableRoute(locale, ...slugs)) {
    notFound();
  }
}
