import { API_CATALOG_CONTENT_TYPE, API_CATALOG_LINK_HEADER, apiCatalog } from '@/lib/api-catalog';

/**
 * The API catalog (RFC 9727) — the path an agent guesses instead of reading our docs, so it
 * can find the OpenAPI description of api.park.fan without a human handing over the URL.
 *
 * Static: the document is a handful of constants, so it is prerendered at build time and
 * served from the CDN rather than waking a function for every probe. Next serves HEAD from
 * this GET with the headers intact, which is what §2 asks for — a HEAD here must answer with
 * the `api-catalog` Link relation.
 *
 * `.well-known` is a real route folder in the App Router (Next lists it alongside rss.xml and
 * llms.txt), so nothing rewrites the leading dot away. It also stays clear of the i18n proxy:
 * the matcher skips any path segment containing a dot, so the catalog never gets a locale
 * prefix bolted onto it.
 */
export const dynamic = 'force-static';

export function GET(): Response {
  return new Response(`${JSON.stringify(apiCatalog, null, 2)}\n`, {
    headers: {
      'Content-Type': API_CATALOG_CONTENT_TYPE,
      Link: API_CATALOG_LINK_HEADER,
      // Changes only when a deployment ships a different set of APIs.
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
