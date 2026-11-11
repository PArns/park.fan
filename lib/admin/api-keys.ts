/**
 * The data API keys of `/admin/api-keys`: the keys that unlock park.fan's forecasts on
 * api.park.fan for one consumer each. The backend owns them (`/v1/admin/api-keys`, owner only);
 * this module holds what the page and its dialog share.
 */

/** What a key was issued for, as the backend stores it. */
export type DataApiKeyUsage = 'non-commercial' | 'commercial';

/** One key as the list shows it; the key itself is never in it. */
export interface DataApiKey {
  id: string;
  name: string;
  contact: string | null;
  usage: DataApiKeyUsage;
  note: string | null;
  /** The first ten characters, enough to recognise a key someone quotes back. */
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

/** The answer to a create: the key in clear, this once, and the row it became. */
export interface CreatedDataApiKey {
  key: string;
  item: DataApiKey;
}

/** The labels the page uses for a key's usage. */
export const DATA_API_KEY_USAGE_LABELS: Record<DataApiKeyUsage, string> = {
  'non-commercial': 'nicht-kommerziell',
  commercial: 'kommerziell (mit Vereinbarung)',
};

/** The proxy path of the backend's key endpoints. */
export const DATA_API_KEYS_PATH = '/api/admin/api-keys';

/** The React Query key of the list. */
export const DATA_API_KEYS_QUERY_KEY = ['admin', 'api-keys'] as const;

/** The body of a create: empty optional fields are left out rather than sent as empty strings. */
export function createDataApiKeyBody(input: {
  name: string;
  contact: string;
  usage: DataApiKeyUsage;
  note: string;
}): string {
  const contact = input.contact.trim();
  const note = input.note.trim();
  return JSON.stringify({
    name: input.name.trim(),
    usage: input.usage,
    ...(contact && { contact }),
    ...(note && { note }),
  });
}

/** How a client sends the key, for the dialog to show next to it. */
export function dataApiKeyCurlExample(key: string): string {
  return `curl -H "X-API-Key: ${key}" https://api.park.fan/v1/parks/europe/germany/rust/europa-park/best-days`;
}
