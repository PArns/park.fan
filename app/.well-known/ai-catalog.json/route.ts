import { aiCatalog } from '@/lib/agents/catalog';
import { agentDocumentHeaders } from '@/lib/agents/http';

/**
 * The ARD capability manifest. Also advertised as an `Agentmap` directive in robots.txt, which
 * is the mechanism for an agent that reads robots.txt before it guesses at well-known URIs.
 */
export const dynamic = 'force-static';

export function GET(): Response {
  return new Response(`${JSON.stringify(aiCatalog(), null, 2)}\n`, {
    headers: agentDocumentHeaders('application/json; charset=utf-8'),
  });
}
