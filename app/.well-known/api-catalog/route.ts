import {
  API_CATALOG_CONTENT_TYPE,
  API_CATALOG_LINK_HEADER,
  apiCatalog,
} from '@/lib/agents/api-catalog';

/**
 * The API catalog (RFC 9727): the path an agent guesses, so it finds the OpenAPI description of
 * api.park.fan without a human handing over the URL. Next answers HEAD from this GET with the
 * headers intact, and RFC 9727 §2 requires a HEAD to carry the `api-catalog` Link relation. The
 * proxy matcher skips any segment containing a dot, so the path never gets a locale prefix.
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
