import { getApiBaseUrl } from '@/lib/api/client';

/** The API's refusal of a caller's own key (401, 403 or 429), with the message it gave. */
export interface ApiKeyRefusal {
  refused: true;
  status: number;
  message: string;
}

/** Statuses with which the API refuses a key: missing, unknown or lacking a permission, wrong park, allowance spent. */
const KEY_REFUSALS = new Set([401, 403, 429]);

/**
 * A read of `path` with a caller's own data key and nothing of the server's, so the API applies that
 * key's permissions, parks and hourly allowance to it. Uncached: a cached copy would answer a revoked
 * key and never count against its allowance.
 */
export async function readWithApiKey<T>(path: string, apiKey: string): Promise<T | ApiKeyRefusal> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
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
  if (!response.ok) throw new Error(`${path} ${response.status}: ${response.statusText}`);
  return (await response.json()) as T;
}

/** The answer is the API's refusal of the key. */
export function isApiKeyRefusal(value: unknown): value is ApiKeyRefusal {
  return typeof value === 'object' && value !== null && 'refused' in value;
}
