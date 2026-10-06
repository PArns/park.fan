/**
 * Cache policy for every machine-readable document: cached like a deployment artifact, not like
 * a wait time, since each one changes only with a deploy.
 */
export const AGENT_DOC_CACHE_CONTROL =
  'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800';

/**
 * Response headers for a machine-readable document: the given content type,
 * `AGENT_DOC_CACHE_CONTROL` and open CORS, since these exist to be read from other origins.
 */
export function agentDocumentHeaders(contentType: string): HeadersInit {
  return {
    'Content-Type': contentType,
    'Cache-Control': AGENT_DOC_CACHE_CONTROL,
    'Access-Control-Allow-Origin': '*',
  };
}
