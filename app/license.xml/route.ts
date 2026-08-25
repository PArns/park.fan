import { RSL_CONTENT_TYPE, RSL_DOCUMENT } from '@/lib/agents/licensing';
import { AGENT_DOC_CACHE_CONTROL } from '@/lib/agents/http';

/**
 * The RSL licence document (RSL 1.0) — what robots.txt's `License:` directive and every page's
 * `Link: …; rel="license"` header point at.
 *
 * It says in a format licensing tooling reads what `Content-Signal` says in robots.txt: read it
 * to answer a question, do not train on it, credit the page. Both come from `lib/agents/
 * licensing.ts`, because a licence that contradicts itself in two places is worse than either
 * half alone.
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
