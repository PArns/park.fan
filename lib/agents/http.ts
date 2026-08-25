/**
 * The response shape every machine-readable document on this site shares.
 *
 * Two decisions live here rather than in six route handlers. **CORS is open**: these documents
 * exist to be read by something that is not park.fan — a scanner, a registry, a page-side agent
 * — and a well-known URI that only same-origin code can fetch is a well-known URI nobody can
 * use. ARD requires it outright; the rest are the same kind of document.
 *
 * **They are cached like a deployment artifact**, not like a wait time: an hour in the browser,
 * a day at the edge, a week of serving the old copy while a new one is fetched. Every one of
 * them changes when a deploy changes it and never in between.
 */
export const AGENT_DOC_CACHE_CONTROL =
  'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800';

export function agentDocumentHeaders(contentType: string): HeadersInit {
  return {
    'Content-Type': contentType,
    'Cache-Control': AGENT_DOC_CACHE_CONTROL,
    'Access-Control-Allow-Origin': '*',
  };
}
