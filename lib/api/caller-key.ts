import 'server-only';
import { getApiBaseUrl } from './client';

/**
 * Reads on behalf of someone else's data key: the MCP tools, when an agent presents its own key.
 * Such a read carries that key and nothing of the server's, so the API applies the key's
 * permissions, parks, revocation and hourly allowance itself. Never cached, for the same reason: a
 * cached copy would answer a revoked key and never count against its allowance.
 */

/** The API's refusal of a caller's own key (401, 403 or 429), with the message it gave. */
export interface ApiKeyRefusal {
  refused: true;
  status: number;
  message: string;
}

/** Statuses with which the API refuses a key: missing or unknown, lacking a permission or the park, allowance spent. */
const KEY_REFUSALS = new Set([401, 403, 429]);

/** The value is the API's refusal of a caller's key rather than an answer. */
export function isApiKeyRefusal(value: unknown): value is ApiKeyRefusal {
  return typeof value === 'object' && value !== null && 'refused' in value;
}

/**
 * GETs an API path with `apiKey` as the only credential. A refusal comes back as `ApiKeyRefusal`,
 * a 404 as null, any other failure throws.
 */
export async function readWithCallerKey<T>(
  path: string,
  apiKey: string,
  params: Record<string, string> = {}
): Promise<T | ApiKeyRefusal | null> {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${getApiBaseUrl()}${path}${query ? `?${query}` : ''}`, {
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
  });
  if (KEY_REFUSALS.has(response.status)) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    return {
      refused: true,
      status: response.status,
      message: body?.message ?? `The API refused this key (${response.status}).`,
    };
  }
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`${path} ${response.status}: ${response.statusText}`);
  return (await response.json()) as T;
}
