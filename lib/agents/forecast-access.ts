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
 * Asks the API whether a key is active, and with `park` whether it covers that park
 * (`continent/country/city/park`). Sent with the caller's key alone, never with the server's own
 * `x-auth-key` or `API_DATA_KEY`: either would make the API confirm any key at all.
 */
async function isActiveApiKey(key: string, park?: string): Promise<boolean> {
  const cacheKey = park ? `${key}|${park}` : key;
  const until = verified.get(cacheKey);
  if (until && until > Date.now()) return true;
  try {
    const query = park ? `?park=${encodeURIComponent(park)}` : '';
    const response = await fetch(`${getApiBaseUrl()}/v1/api-keys/verify${query}`, {
      headers: { 'x-api-key': key, 'User-Agent': 'park.fan-mcp' },
      cache: 'no-store',
    });
    if (!response.ok) return false;
    verified.set(cacheKey, Date.now() + VERIFIED_FOR_MS);
    return true;
  } catch {
    return false;
  }
}

/** What a request may read: any park, or each park the API confirms for its key. */
export interface ForecastGrant {
  readsPark(segments: readonly string[]): Promise<boolean>;
}

/**
 * Whether an MCP request may call a forecast tool, and for which parks: a park.fan page's own
 * WebMCP call reads every park, a client with an active data key reads the parks its key covers.
 * Null when neither. The tool then reads through the server's key like a page does.
 */
export async function forecastGrant(request: Request): Promise<ForecastGrant | null> {
  if (isSameOriginRequest(request)) return { readsPark: async () => true };
  const key = presentedApiKey(request);
  if (!key || !(await isActiveApiKey(key))) return null;
  return { readsPark: (segments) => isActiveApiKey(key, segments.join('/')) };
}
