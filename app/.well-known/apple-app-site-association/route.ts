import { appleAppSiteAssociation } from '@/lib/apple-app-site-association';

/**
 * Apple's association file for universal links. Apple's CDN fetches it over HTTPS without
 * following a redirect and wants `application/json` without an extension; the proxy matcher skips
 * any segment containing a dot, so the path never gets a locale prefix.
 */
export const dynamic = 'force-static';

export function GET(): Response {
  return new Response(`${JSON.stringify(appleAppSiteAssociation(), null, 2)}\n`, {
    headers: {
      'Content-Type': 'application/json',
      // Apple's CDN re-reads it on its own schedule; a day at the edge is plenty.
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
