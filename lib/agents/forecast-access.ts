import { getApiBaseUrl } from '@/lib/api/client';
import { isSameOriginRequest } from '@/lib/api/forecast-relay';
import { FORECAST_TOOL_NAMES } from './tool-descriptors';

/** See `FORECAST_TOOL_NAMES`. */
export const FORECAST_TOOLS: ReadonlySet<string> = new Set(FORECAST_TOOL_NAMES);

/** How long a key the API confirmed is believed without asking again. */
const VERIFIED_FOR_MS = 5 * 60_000;
const verified = new Map<string, number>();

/** The data key an MCP request presents, from `X-API-Key` or `Authorization: Bearer pfk_…`. */
export function presentedApiKey(request: Request): string | null {
  const header = request.headers.get('x-api-key')?.trim();
  if (header) return header;
  const bearer = /^Bearer\s+(pfk_\S+)$/i.exec(request.headers.get('authorization')?.trim() ?? '');
  return bearer?.[1] ?? null;
}

/**
 * Asks the API whether a key is active. Sent without the server's own `x-auth-key`: the API
 * admits that one everywhere, so a request carrying it would confirm any key at all.
 */
async function isActiveApiKey(key: string): Promise<boolean> {
  const until = verified.get(key);
  if (until && until > Date.now()) return true;
  try {
    const response = await fetch(`${getApiBaseUrl()}/v1/api-keys/verify`, {
      headers: { 'x-api-key': key, 'User-Agent': 'park.fan-mcp' },
      cache: 'no-store',
    });
    if (!response.ok) return false;
    verified.set(key, Date.now() + VERIFIED_FOR_MS);
    return true;
  } catch {
    return false;
  }
}

/**
 * Whether an MCP request may call a forecast tool: a park.fan page's own WebMCP call, or a client
 * that sends an active data key. The tool then reads through the server's key like a page does.
 */
export async function mayReadForecasts(request: Request): Promise<boolean> {
  if (isSameOriginRequest(request)) return true;
  const key = presentedApiKey(request);
  return key ? isActiveApiKey(key) : false;
}
