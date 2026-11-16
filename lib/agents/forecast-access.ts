import { isSameOriginRequest } from '@/lib/api/forecast-relay';
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
 * How a tool reads beyond the wait times: like a park.fan page, through the server's own key, or
 * with the caller's data key. Search and best days send that key to the API, so its permissions,
 * parks and allowance apply; the wait-time tool only checks that one was presented.
 */
export type KeyGrant = { via: 'page' } | { via: 'key'; apiKey: string };

/**
 * Whether an MCP request may read beyond the wait times, and how; null when it may not.
 *
 * A park.fan page's own WebMCP call reads what the page around it shows, and is recognised by the
 * relays' check (`isSameOriginRequest`). A script can forge that header here exactly as
 * it can on the relay, and gets nothing the relay would not give it. Any other caller reads with
 * its own key, and the API checks revocation, parks and the hourly allowance on that read itself,
 * so nothing here caches a verdict that could outlive a revocation.
 */
export function keyGrant(request: Request): KeyGrant | null {
  if (isSameOriginRequest(request)) return { via: 'page' };
  const apiKey = presentedApiKey(request);
  return apiKey ? { via: 'key', apiKey } : null;
}
