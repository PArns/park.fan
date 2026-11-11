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
  /** Requests allowed per clock hour; null means only the API's general limit. */
  requestsPerHour: number | null;
  /** Requests counted in the current clock hour. */
  requestsThisHour?: number;
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

/** What a new key is allowed per hour unless the dialog says otherwise; the backend's default too. */
export const DEFAULT_REQUESTS_PER_HOUR = 1000;

/**
 * The hourly allowance typed into a field: a whole number from 1, or empty for no per-key limit.
 * `undefined` for anything else, so the dialog can refuse it before the API does.
 */
export function parseRequestsPerHour(text: string): number | null | undefined {
  const trimmed = text.trim().replace(/[.\s]/g, '');
  if (trimmed === '') return null;
  if (!/^\d+$/.test(trimmed)) return undefined;
  const value = Number(trimmed);
  return value >= 1 && value <= 1_000_000 ? value : undefined;
}

/** „12 von 1.000 in dieser Stunde“, or „ohne eigenes Limit“. */
export function formatHourlyUsage(
  key: Pick<DataApiKey, 'requestsPerHour' | 'requestsThisHour'>
): string {
  const used = (key.requestsThisHour ?? 0).toLocaleString('de-DE');
  return key.requestsPerHour === null
    ? `${used} in dieser Stunde, ohne eigenes Limit`
    : `${used} von ${key.requestsPerHour.toLocaleString('de-DE')} in dieser Stunde`;
}

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
  requestsPerHour: number | null;
}): string {
  const contact = input.contact.trim();
  const note = input.note.trim();
  return JSON.stringify({
    name: input.name.trim(),
    usage: input.usage,
    requestsPerHour: input.requestsPerHour,
    ...(contact && { contact }),
    ...(note && { note }),
  });
}

/** How a client sends the key, for the dialog to show next to it. */
export function dataApiKeyCurlExample(key: string): string {
  return `curl -H "X-API-Key: ${key}" https://api.park.fan/v1/parks/europe/germany/rust/europa-park/best-days`;
}
