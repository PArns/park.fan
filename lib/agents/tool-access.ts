import { isSameOriginRequest } from '@/lib/api/keyed-relay';
import { KEYED_TOOL_NAMES } from './tool-descriptors';

/** See `KEYED_TOOL_NAMES`. */
export const KEYED_TOOLS: ReadonlySet<string> = new Set(KEYED_TOOL_NAMES);

/** The data key an MCP request presents, from `X-API-Key` or `Authorization: Bearer pfk_…`. */
export function presentedApiKey(request: Request): string | null {
  const header = request.headers.get('x-api-key')?.trim();
  if (header) return header;
  const bearer = /^Bearer\s+(pfk_\S+)$/i.exec(request.headers.get('authorization')?.trim() ?? '');
  return bearer?.[1] ?? null;
}

/**
 * How a tool reads for this caller: like a park.fan page, through the server's own key, or with
 * the caller's data key and nothing of the server's.
 */
export type ToolGrant = { via: 'page' } | { via: 'key'; apiKey: string };

/**
 * How an MCP request may read, or null for a caller with neither: such a caller gets the wait
 * times and nothing that needs a key.
 *
 * A park.fan page's own WebMCP call reads what the page around it shows, and is recognised by the
 * relays' check (`isSameOriginRequest`). A script can forge that header here exactly as it can on
 * a relay, and gets nothing the relay would not give it. Any other caller reads with its own key,
 * and the API checks permissions, revocation, parks and the hourly allowance on that read itself,
 * so nothing here caches a verdict that could outlive a revocation.
 */
export function toolGrant(request: Request): ToolGrant | null {
  if (isSameOriginRequest(request)) return { via: 'page' };
  const apiKey = presentedApiKey(request);
  return apiKey ? { via: 'key', apiKey } : null;
}
