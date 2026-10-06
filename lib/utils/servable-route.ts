import { isValidLocale } from '@/i18n/config';

/**
 * Geo slugs the API serves are strictly lowercase alphanumerics and dashes, across every segment
 * it publishes; anything else (a dot above all) is a URL the backend can never resolve.
 */
const GEO_SLUG_RE = /^[a-z0-9-]+$/;

/**
 * True when a `/[locale]/...` URL can possibly resolve: a locale we serve and slug-shaped geo
 * segments (pass only the locale on routes without geo params). For `generateMetadata`, which must
 * return rather than throw. Kept apart from the `notFound()` guard in `./route-guards` so
 * `proxy.ts` can ask without pulling `next/navigation` into the middleware bundle.
 */
export function isServableRoute(locale: string, ...slugs: string[]): boolean {
  return isValidLocale(locale) && slugs.every((slug) => GEO_SLUG_RE.test(slug));
}

/**
 * True when every segment is slug-shaped: the guard for an `/api/*` route that interpolates its
 * catch-all segments into a backend path. Next percent-decodes each segment, so `%2F` and `%2E%2E`
 * arrive inside one segment and `new URL()` would resolve them, reaching any API path with our
 * auth key. See docs/rules/an-api-route-passes-only-slugs-upstream.md.
 */
export function isSlugPath(segments: readonly string[]): boolean {
  return segments.every((segment) => GEO_SLUG_RE.test(segment));
}
