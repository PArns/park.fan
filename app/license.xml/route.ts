import { RSL_CONTENT_TYPE, RSL_DOCUMENT } from '@/lib/agents/licensing';
import { AGENT_DOC_CACHE_CONTROL } from '@/lib/agents/http';

/**
 * The RSL licence document (RSL 1.0), what robots.txt's `License:` directive and every page's
 * `Link: …; rel="license"` header point at. It says what `Content-Signal` says in robots.txt, and
 * both come from `lib/agents/licensing.ts` so the two cannot contradict each other.
 */
export const dynamic = 'force-static';

export function GET(): Response {
  return new Response(RSL_DOCUMENT, {
    headers: {
      'Content-Type': RSL_CONTENT_TYPE,
      'Cache-Control': AGENT_DOC_CACHE_CONTROL,
      'Access-Control-Allow-Origin': '*',
    },
  });
}
