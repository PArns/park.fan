/**
 * Route guards for the `/[locale]/...` tree. `proxy.ts` skips paths with a dot so `public/` files
 * are served untouched, but a MISSING file falls through and `[locale]` swallows the filename
 * (`/ads.txt` → the homepage), firing backend fetches before a 404. Checking the segments first
 * makes that a free 404.
 */

import { notFound } from 'next/navigation';
import { isServableRoute } from './servable-route';

// Re-exported so callers keep one import; the predicate lives apart so `proxy.ts` can use it
// without `next/navigation`.
export { isServableRoute } from './servable-route';

/**
 * `isServableRoute` as a guard that 404s before any backend call; put it at the top of the page
 * component, right after `await params`.
 */
export function assertServableRoute(locale: string, ...slugs: string[]): void {
  if (!isServableRoute(locale, ...slugs)) {
    notFound();
  }
}
